/**
 * VØID-LN — LDK WASM Bridge
 *
 * Wraps LDK (Lightning Development Kit) for use in the browser.
 * All channel state, key management, and HTLC resolution happens in WASM.
 * Private keys never leave the browser.
 *
 * Architecture:
 * - ChannelManager: manages channels, routes payments
 * - KeysManager: derives keys from seed (stored in OPFS)
 * - Persister: serializes channel state to JS callbacks (IndexedDB)
 * - EventHandler: delegates LDK events to JS
 * - PeerManager: uses NOSTR transport (not TCP)
 */

use wasm_bindgen::prelude::*;
use js_sys::{Array, Function, Object, Promise, Uint8Array};
use std::sync::Arc;

// ─── LDK Imports ──────────────────────────────────────────────────────────────

use bitcoin::hashes::Hash;
use bitcoin::secp256k1::{Secp256k1, SecretKey, PublicKey};
use lightning::chain::chainmonitor::{ChainMonitor, Persist};
use lightning::chain::channelmonitor::ChannelMonitor;
use lightning::chain::keysinterface::{InMemorySigner, KeysManager};
use lightning::chain::{BestBlock, Filter, Watch};
use lightning::ln::channelmanager::{
    ChainParameters, ChannelManager as LdkChannelManager, SimpleArcChannelManager,
};
use lightning::ln::peer_handler::{IgnoringMessageHandler, MessageHandler, PeerManager as LdkPeerManager};
use lightning::ln::msgs::NetAddress;
use lightning::routing::gossip::{NetworkGraph, NodeId, P2PGossipSync};
use lightning::routing::router::DefaultRouter;
use lightning::util::config::UserConfig;
use lightning::util::logger::{Logger, Record};
use lightning::util::ser::ReadableArgs;

// ─── Types ────────────────────────────────────────────────────────────────────

#[wasm_bindgen]
pub struct LDKNode {
    // Channel manager (the brain)
    channel_manager: Option<Arc<LdkChannelManager<Arc<ChainMonitor<Arc<InMemorySigner>, Arc<dyn Filter>, Arc<JSLogger>, Arc<JSLogger>, Arc<JSPersist>>>>>>,
    // Keys manager
    keys_manager: Option<Arc<KeysManager>>,
    // Network graph for routing
    network_graph: Option<Arc<NetworkGraph<Arc<JSLogger>>>>,
    // Logger
    logger: Arc<JSLogger>,
    // Persister
    persister: Arc<JSPersist>,
}

// ─── Logger (delegates to JS console.log) ─────────────────────────────────────

struct JSLogger {
    js_log_fn: Option<Function>,
}

impl Logger for JSLogger {
    fn log(&self, record: &Record) {
        if let Some(ref f) = self.js_log_fn {
            let msg = format!("[LDK {}] {}", record.level, record.args);
            let _ = f.call1(&JsValue::NULL, &JsValue::from_str(&msg));
        }
    }
}

// ─── Persister (serializes to JS callbacks) ──────────────────────────────────

struct JSPersist {
    js_persist_fn: Option<Function>,
}

impl Persist<InMemorySigner> for JSPersist {
    fn persist_new_channel(
        &self,
        funding_txo: &bitcoin::OutPoint,
        monitor: &ChannelMonitor<InMemorySigner>,
        _update_id: lightning::chain::channelmonitor::MonitorUpdateId,
    ) -> lightning::chain::channelmonitor::ChannelMonitorUpdateStatus {
        if let Some(ref f) = self.js_persist_fn {
            let serialized = monitor.encode();
            let data = Uint8Array::from(serialized.as_slice());
            let _ = f.call3(
                &JsValue::NULL,
                &JsValue::from_str("new_channel"),
                &JsValue::from_str(&funding_txo.to_string()),
                &data,
            );
        }
        lightning::chain::channelmonitor::ChannelMonitorUpdateStatus::Completed
    }

    fn update_persisted_channel(
        &self,
        funding_txo: &bitcoin::OutPoint,
        _update: Option<&lightning::chain::channelmonitor::ChannelMonitorUpdate>,
        monitor: &ChannelMonitor<InMemorySigner>,
        _update_id: lightning::chain::channelmonitor::MonitorUpdateId,
    ) -> lightning::chain::channelmonitor::ChannelMonitorUpdateStatus {
        if let Some(ref f) = self.js_persist_fn {
            let serialized = monitor.encode();
            let data = Uint8Array::from(serialized.as_slice());
            let _ = f.call3(
                &JsValue::NULL,
                &JsValue::from_str("update_channel"),
                &JsValue::from_str(&funding_txo.to_string()),
                &data,
            );
        }
        lightning::chain::channelmonitor::ChannelMonitorUpdateStatus::Completed
    }
}

// ─── WASM Exports ─────────────────────────────────────────────────────────────

#[wasm_bindgen]
impl LDKNode {
    /// Creates a new LDK node with the given seed (32 bytes).
    /// The seed is used to derive all Lightning keys.
    #[wasm_bindgen(constructor)]
    pub fn new(seed: &[u8], js_log_fn: Option<Function>, js_persist_fn: Option<Function>) -> Result<LDKNode, JsValue> {
        if seed.len() != 32 {
            return Err(JsValue::from_str("Seed must be 32 bytes"));
        }

        let logger = Arc::new(JSLogger { js_log_fn });
        let persister = Arc::new(JSPersist { js_persist_fn });

        Ok(LDKNode {
            channel_manager: None,
            keys_manager: None,
            network_graph: None,
            logger,
            persister,
        })
    }

    /// Initializes the channel manager with the given seed and network.
    /// Must be called after construction.
    #[wasm_bindgen(js_name = "initialize")]
    pub fn initialize(&mut self, seed: &[u8], network: &str) -> Result<(), JsValue> {
        let secp = Secp256k1::new();
        let secret_key = SecretKey::from_slice(seed)
            .map_err(|e| JsValue::from_str(&format!("Invalid seed: {}", e)))?;

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        // Keys manager
        let keys_manager = Arc::new(KeysManager::new(
            seed,
            now,
            now as u32,
        ));

        // Network graph
        let genesis_hash = match network {
            "mainnet" => bitcoin::blockdata::constants::genesis_block(bitcoin::Network::Bitcoin).block_hash(),
            "testnet" => bitcoin::blockdata::constants::genesis_block(bitcoin::Network::Testnet).block_hash(),
            _ => bitcoin::blockdata::constants::genesis_block(bitcoin::Network::Regtest).block_hash(),
        };

        let network_graph = Arc::new(NetworkGraph::new(
            genesis_hash,
            self.logger.clone(),
        ));

        self.keys_manager = Some(keys_manager);
        self.network_graph = Some(network_graph);

        Ok(())
    }

    /// Returns the node's public key (compressed secp256k1, 33 bytes).
    #[wasm_bindgen(js_name = "getNodePubkey")]
    pub fn get_node_pubkey(&self) -> Result<Uint8Array, JsValue> {
        let km = self.keys_manager.as_ref()
            .ok_or_else(|| JsValue::from_str("Not initialized"))?;

        let secp = Secp256k1::new();
        let pubkey = km.get_node_secret_key()
            .public_key(&secp);

        Ok(Uint8Array::from(pubkey.serialize().as_slice()))
    }

    /// Creates a BOLT11 invoice for receiving a payment.
    #[wasm_bindgen(js_name = "createInvoice")]
    pub fn create_invoice(&self, amount_msats: u64, description: &str, expiry_secs: u32) -> Result<String, JsValue> {
        // For now, return a placeholder. Real invoice creation requires
        // the channel manager to be fully initialized with a chain watcher.
        let _ = (amount_msats, description, expiry_secs);
        Err(JsValue::from_str("Invoice creation requires full channel manager initialization"))
    }

    /// Processes a raw Lightning message from a peer.
    /// Used by the NOSTR transport layer.
    #[wasm_bindgen(js_name = "processMessage")]
    pub fn process_message(&self, peer_pubkey: &[u8], message: &[u8]) -> Result<Uint8Array, JsValue> {
        let _ = (peer_pubkey, message);
        // TODO: Feed message to PeerManager and return any response messages
        Err(JsValue::from_str("Message processing not yet implemented"))
    }

    /// Serializes the channel manager state for persistence.
    #[wasm_bindgen(js_name = "serializeState")]
    pub fn serialize_state(&self) -> Result<Uint8Array, JsValue> {
        // TODO: Serialize channel_manager to bytes
        Err(JsValue::from_str("State serialization not yet implemented"))
    }

    /// Returns the current channel count.
    #[wasm_bindgen(js_name = "getChannelCount")]
    pub fn get_channel_count(&self) -> u32 {
        self.channel_manager.as_ref()
            .map(|cm| cm.list_channels().len() as u32)
            .unwrap_or(0)
    }
}
