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
    // Aqui rodaria a lógica de GossipSub simplificada
  }
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

// Local simulated backend database in memory / Service Worker context
let localPeers = [
  { id: "peer_b8a3", name: "Alpha-Enclave", distance: "45m", type: "BLE", active: true },
  { id: "peer_f901", name: "Substrato-XDP", distance: "120m", type: "UWB", active: true },
  { id: "peer_11c4", name: "HCN-Carrier-09", distance: "1.2km", type: "HCN", active: true },
];

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
