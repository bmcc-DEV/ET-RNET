import { useState, useEffect, useCallback } from "react";
import { phantomHarvester } from "../harvesters/phantomHarvester";
import {
  contactDirectory,
  PLATFORM_LABELS,
  PLATFORM_ICONS,
  type HarvestReport,
  type HarvestStats,
  type HarvestedContact,
  type SocialPlatform,
} from "../storage/contactDirectory";
import type { ExchangeTicker } from "../harvesters/exchangeScraper";

type View = "dashboard" | "exchanges" | "contacts" | "search";

export default function PhantomHarvesterPanel() {
  const [view, setView] = useState<View>("dashboard");
  const [stats, setStats] = useState<HarvestStats | null>(null);
  const [reports, setReports] = useState<HarvestReport[]>([]);
  const [contacts, setContacts] = useState<HarvestedContact[]>([]);
  const [tickers, setTickers] = useState<ExchangeTicker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HarvestedContact[]>([]);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [progress, setProgress] = useState({ platform: "", status: "" });

  // Load stats on mount
  useEffect(() => {
    phantomHarvester.getStats().then(setStats);
    contactDirectory.getAll(100).then(setContacts);
  }, []);

  // Load exchange tickers
  useEffect(() => {
    if (view !== "exchanges") return;
    phantomHarvester.getAllTickers("BTCUSDT").then(setTickers);
  }, [view]);

  // Harvest all platforms
  const handleHarvestAll = useCallback(async () => {
    setIsHarvesting(true);
    setReports([]);

    const unsub = phantomHarvester.onProgress((platform, status) => {
      setProgress({ platform, status });
    });

    try {
      const results = await phantomHarvester.harvestAll();
      setReports(results);
      const newStats = await phantomHarvester.getStats();
      setStats(newStats);
      const newContacts = await contactDirectory.getAll(100);
      setContacts(newContacts);
    } catch (err) {
      console.error("[Harvester] Error:", err);
    } finally {
      unsub();
      setIsHarvesting(false);
      setProgress({ platform: "", status: "" });
    }
  }, []);

  // Search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    const results = await phantomHarvester.searchAll(searchQuery);
    setSearchResults(results);
  }, [searchQuery]);

  // ─── Dashboard View ───
  if (view === "dashboard") {
    return (
      <section className="border border-[#1a1f26] bg-[#080a0c]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1f26]">
          <div>
            <div className="tag">PHANTOM HARVESTER</div>
            <div className="text-[10px] text-zinc-600 font-mono mt-1">
              SCRAPER UNIVERSAL DE CONTATOS + CORRETORAS
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("exchanges")}
              className="px-3 py-1.5 text-[10px] font-mono text-[#00ff41] border border-[#00ff41]/20 hover:bg-[#00ff41]/10"
            >
              EXCHANGES
            </button>
            <button
              onClick={() => setView("contacts")}
              className="px-3 py-1.5 text-[10px] font-mono text-zinc-400 border border-zinc-800 hover:border-zinc-600"
            >
              CONTATOS ({stats?.totalContacts || 0})
            </button>
            <button
              onClick={() => setView("search")}
              className="px-3 py-1.5 text-[10px] font-mono text-zinc-400 border border-zinc-800 hover:border-zinc-600"
            >
              BUSCAR
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-[#1a1f26] p-4 text-center">
              <div className="text-2xl font-mono text-[#a855f7]">{stats?.totalContacts || 0}</div>
              <div className="text-[9px] font-mono text-zinc-600">TOTAL CONTATOS</div>
            </div>
            <div className="border border-[#1a1f26] p-4 text-center">
              <div className="text-2xl font-mono text-[#00ff41]">{stats?.withNostr || 0}</div>
              <div className="text-[9px] font-mono text-zinc-600">COM NOSTR</div>
            </div>
            <div className="border border-[#1a1f26] p-4 text-center">
              <div className="text-2xl font-mono text-yellow-400">{stats?.withExchangeData || 0}</div>
              <div className="text-[9px] font-mono text-zinc-600">TRADERS</div>
            </div>
            <div className="border border-[#1a1f26] p-4 text-center">
              <div className="text-2xl font-mono text-blue-400">
                {Object.keys(stats?.byPlatform || {}).length}
              </div>
              <div className="text-[9px] font-mono text-zinc-600">PLATAFORMAS</div>
            </div>
          </div>

          {/* Platform Grid */}
          <div>
            <div className="text-[10px] font-mono text-zinc-500 mb-3">PLATAFORMAS</div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((platform) => (
                <div
                  key={platform}
                  className="border border-[#1a1f26] p-3 flex items-center gap-2"
                >
                  <span className="text-lg">{PLATFORM_ICONS[platform]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-zinc-300 truncate">
                      {PLATFORM_LABELS[platform]}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-600">
                      {stats?.byPlatform[platform] || 0} contatos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Harvest Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleHarvestAll}
              disabled={isHarvesting}
              className={`px-8 py-3 font-mono text-xs tracking-widest transition-colors ${
                isHarvesting
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-[#a855f7] hover:bg-[#a855f7]/80 text-black"
              }`}
            >
              {isHarvesting ? `ESCANEANDO ${progress.platform.toUpperCase()}...` : "HARVEST ALL"}
            </button>
            {isHarvesting && (
              <div className="text-[10px] font-mono text-zinc-500 animate-pulse">
                {progress.status}
              </div>
            )}
          </div>

          {/* Reports */}
          {reports.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-zinc-500 mb-3">ÚLTIMO HARVEST</div>
              <div className="space-y-1">
                {reports.map((r) => (
                  <div
                    key={r.platform}
                    className="flex items-center gap-2 px-3 py-2 border border-[#1a1f26] text-[10px] font-mono"
                  >
                    <span>{PLATFORM_ICONS[r.platform]}</span>
                    <span className="text-zinc-300 flex-1">{PLATFORM_LABELS[r.platform]}</span>
                    <span className="text-[#00ff41]">{r.contactsFound} encontrados</span>
                    <span className="text-[#a855f7]">{r.newContacts} novos</span>
                    <span className="text-yellow-400">{r.nostrMapped} Nostr</span>
                    {r.errors.length > 0 && (
                      <span className="text-red-500">{r.errors.length} erros</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ─── Exchanges View ───
  if (view === "exchanges") {
    return (
      <section className="border border-[#1a1f26] bg-[#080a0c]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1f26]">
          <div>
            <div className="tag">EXCHANGE TICKERS</div>
            <div className="text-[10px] text-zinc-600 font-mono mt-1">
              PREÇOS EM TEMPO REAL — BINANCE · COINBASE · KRAKEN · BYBIT · MERCADO BITCOIN
            </div>
          </div>
          <button
            onClick={() => setView("dashboard")}
            className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
          >
            ← VOLTAR
          </button>
        </div>

        <div className="p-6">
          {tickers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-zinc-600 font-mono text-xs mb-2">CARREGANDO TICKERS...</div>
              <button
                onClick={() => phantomHarvester.getAllTickers("BTCUSDT").then(setTickers)}
                className="px-4 py-2 text-[10px] font-mono text-[#00ff41] border border-[#00ff41]/20 hover:bg-[#00ff41]/10"
              >
                RECARGAR
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickers.map((t) => (
                <div
                  key={t.exchange}
                  className="flex items-center gap-4 px-4 py-3 border border-[#1a1f26]"
                >
                  <span className="text-lg">{PLATFORM_ICONS[t.exchange.toLowerCase().replace(" ", "") as SocialPlatform] || "💱"}</span>
                  <div className="flex-1">
                    <div className="font-mono text-xs text-zinc-300">{t.exchange}</div>
                    <div className="text-[9px] text-zinc-600 font-mono">{t.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-white">${t.price.toLocaleString()}</div>
                    <div
                      className={`text-[9px] font-mono ${
                        t.priceChange24h >= 0 ? "text-[#00ff41]" : "text-red-500"
                      }`}
                    >
                      {t.priceChange24h >= 0 ? "+" : ""}
                      {t.priceChange24h.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-zinc-500">VOL 24h</div>
                    <div className="font-mono text-[10px] text-zinc-400">
                      ${(t.volume24h / 1e6).toFixed(1)}M
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // ─── Contacts View ───
  if (view === "contacts") {
    return (
      <section className="border border-[#1a1f26] bg-[#080a0c]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1f26]">
          <div>
            <div className="tag">DIRETÓRIO UNIVERSAL</div>
            <div className="text-[10px] text-zinc-600 font-mono mt-1">
              {contacts.length} CONTATOS HARVESTADOS
            </div>
          </div>
          <button
            onClick={() => setView("dashboard")}
            className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
          >
            ← VOLTAR
          </button>
        </div>

        <div className="p-6">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 font-mono text-xs">
              Nenhum contato harvestado ainda. Execute o Harvest All primeiro.
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 border border-[#1a1f26] hover:bg-[#0a0d10]"
                >
                  <span className="text-sm">{PLATFORM_ICONS[c.platform]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-zinc-300 truncate">
                      {c.username}
                    </div>
                    <div className="text-[8px] font-mono text-zinc-600 truncate">
                      {c.platformId} · {PLATFORM_LABELS[c.platform]}
                    </div>
                  </div>
                  {c.nostrPubkey && (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono text-[#00ff41] border border-[#00ff41]/20">
                      NOSTR
                    </span>
                  )}
                  {c.exchangeData && (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono text-yellow-400 border border-yellow-400/20">
                      TRADER
                    </span>
                  )}
                  <div className="text-[8px] font-mono text-zinc-700">
                    {Math.round(c.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // ─── Search View ───
  if (view === "search") {
    return (
      <section className="border border-[#1a1f26] bg-[#080a0c]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1f26]">
          <div>
            <div className="tag">BUSCA UNIVERSAL</div>
            <div className="text-[10px] text-zinc-600 font-mono mt-1">
              BUSCA EM TODAS AS PLATAFORMAS + DIRETÓRIO LOCAL
            </div>
          </div>
          <button
            onClick={() => setView("dashboard")}
            className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
          >
            ← VOLTAR
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar contatos, traders, usuários..."
              className="flex-1 bg-[#0a0d10] border border-[#1a1f26] px-4 py-2.5 text-xs font-mono text-zinc-300 outline-none focus:border-[#a855f7]/50 placeholder:text-zinc-700"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-[#a855f7] hover:bg-[#a855f7]/80 text-black font-mono text-[10px] tracking-widest"
            >
              BUSCAR
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500">
                {searchResults.length} resultados
              </div>
              {searchResults.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 border border-[#1a1f26]"
                >
                  <span className="text-sm">{PLATFORM_ICONS[c.platform]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-zinc-300">{c.username}</div>
                    <div className="text-[8px] font-mono text-zinc-600">{c.bio?.slice(0, 80)}</div>
                  </div>
                  {c.nostrPubkey && (
                    <span className="px-1.5 py-0.5 text-[8px] font-mono text-[#00ff41] border border-[#00ff41]/20">
                      NOSTR
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}
