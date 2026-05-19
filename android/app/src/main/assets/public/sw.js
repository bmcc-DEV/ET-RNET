const CACHE_NAME = "void-eternet-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[VØID ServiceWorker] Caching offline shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[VØID ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event with dynamic local backend proxy simulation
// --- ANIMUS Inoculation Listener ---
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "ANIMUS_INOCULATION") {
    console.log("[ANIMUS SW] Recebendo novo payload de inoculação...");
    const payload = new Uint8Array(event.data.payload);
    
    // Persistir o payload no IndexedDB para "ressurreição" futura
    saveShardToDB({
      id: "animus_core_payload",
      data: btoa(String.fromCharCode(...payload)),
      sender: "VØID·ΩMEGA",
      timestamp: Date.now()
    }).then(() => {
      console.log("[ANIMUS SW] Stratum 3 Inoculado e Persistido.");
    });
  }
});

// Periodic Sync or Push can be added here to keep the node active in background
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "void-mesh-sync") {
    console.log("[ANIMUS SW] Sincronização periódica da mesh iniciada em background.");
    relayShardsInBackground();
  }
});

// Local peer discovery via BroadcastChannel (cross-tab mesh)
let discoveredPeers = [];
const meshChannel = new BroadcastChannel("void_sw_mesh");
meshChannel.onmessage = (e) => {
  if (e.data?.type === "PEER_ANNOUNCE" && e.data.peerId) {
    if (!discoveredPeers.find(p => p.id === e.data.peerId)) {
      discoveredPeers.push({ id: e.data.peerId, lastSeen: Date.now() });
    }
  }
};

async function relayShardsInBackground() {
  const shards = await getAllShardsFromDB();
  if (shards.length === 0) return;

  // Relay shards to peers via BroadcastChannel
  const unrelayed = shards.filter(s => !s.relayed);
  if (unrelayed.length > 0) {
    meshChannel.postMessage({
      type: "SHARD_RELAY",
      shards: unrelayed.map(s => ({ id: s.id, commitment: s.commitment, data: s.data })),
      count: unrelayed.length,
    });
    console.log(`[ANIMUS SW] Relayed ${unrelayed.length} shards via BroadcastChannel`);
  }
}

self.addEventListener("push", (event) => {
  console.log("[ANIMUS SW] Push received. Keeping node alive.");
  // Mantém o service worker aquecido para processamento da mesh
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Intercepting mock backend api calls on the "Eternet" (no cloud server needed)
  if (url.pathname.startsWith("/api/eternet")) {
    e.respondWith(handleEternetApiRequest(url.pathname, e.request));
    return;
  }

  // standard asset serving (Cache-first with Network fallback)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request)
        .then((networkResponse) => {
          // Cache newly fetched assets dynamically (e.g. built js/css files)
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not in cache, fallback to main index.html for single page app
          if (e.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// Local peer list — populated dynamically from BroadcastChannel announcements
let localPeers = [];

let localSharedPool = [];

// --- IndexedDB for Persistent HCN Shards ---
const DB_NAME = "void_eternet_db";
const DB_VERSION = 1;
const STORE_NAME = "shards";

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.error);
  });
}

async function saveShardToDB(shard) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(shard);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllShardsFromDB() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function handleEternetApiRequest(path, request) {
  const headers = { "Content-Type": "application/json" };

  if (path === "/api/eternet/peers") {
    // Return mock active local mesh nodes
    return new Response(JSON.stringify({ status: "success", peers: localPeers }), { headers });
  }

  if (path === "/api/eternet/pool") {
    // Agora busca do IndexedDB persistente
    return getAllShardsFromDB().then(shards => {
      return new Response(JSON.stringify({ status: "success", pool: shards }), { headers });
    });
  }

  if (path === "/api/eternet/broadcast" && request.method === "POST") {
    return request.json().then(async (body) => {
      const newShard = {
        id: body.id || `shard_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        data: body.data,
        sender: body.sender || "anonymous",
        timestamp: Date.now()
      };
      
      // Salva persistentemente
      await saveShardToDB(newShard);
      
      return new Response(JSON.stringify({ status: "success", shard: newShard }), { headers });
    });
  }

  return new Response(JSON.stringify({ error: "Eternet node routing not found" }), {
    status: 404,
    headers
  });
}
