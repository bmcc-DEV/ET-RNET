import { memo, useState, useCallback } from "react";
import { Link, useRoute } from "wouter";
import { categories, getRoutesByCategory } from "../router";

function SvgIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const TABS = [
  { id: "home", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "finance", label: "Finance", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "crypto", label: "Crypto", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { id: "network", label: "Rede", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" },
  { id: "more", label: "Mais", icon: "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" },
];

function BottomBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleTab = useCallback((id: string) => {
    if (id === "more") {
      setDrawerOpen(true);
      setDrawerCategory(null);
    } else {
      setDrawerOpen(true);
      setDrawerCategory(id);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerCategory(null);
    setSearch("");
  }, []);

  const currentCat = categories.find((c) => c.id === drawerCategory);
  const routes = drawerCategory ? getRoutesByCategory(drawerCategory) : [];
  const filteredRoutes = search.trim()
    ? categories.flatMap((cat) => getRoutesByCategory(cat.id)).filter((r) => r.label.toLowerCase().includes(search.toLowerCase()))
    : routes;

  return (
    <>
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080a0c]/95 backdrop-blur border-t border-[#1a1f26] flex items-center justify-around z-50 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const isActive = drawerOpen && (drawerCategory === tab.id || (tab.id === "more" && !drawerCategory));
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] transition-colors ${
                isActive ? "text-[#a855f7]" : "text-zinc-500 active:text-zinc-300"
              }`}
            >
              <SvgIcon path={tab.icon} className="w-5 h-5" />
              <span className="text-[8px] font-mono">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50" onClick={closeDrawer}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-14 left-0 right-0 bg-[#080a0c] border-t border-[#1a1f26] max-h-[70vh] overflow-y-auto rounded-t-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="sticky top-0 bg-[#080a0c]/95 backdrop-blur px-4 py-3 border-b border-[#1a1f26] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentCat && (
                  <div className="w-5 h-5 flex items-center justify-center rounded" style={{ background: `${currentCat.color}15` }}>
                    <SvgIcon path={currentCat.icon} className="w-3 h-3" />
                  </div>
                )}
                <span className="font-mono text-xs text-zinc-300">
                  {currentCat ? currentCat.label : "TODAS AS CATEGORIAS"}
                </span>
              </div>
              <button onClick={closeDrawer} className="text-zinc-500 text-lg px-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search (when showing all categories) */}
            {!drawerCategory && (
              <div className="px-4 py-2 border-b border-[#1a1f26]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar painéis..."
                  className="w-full bg-[#0a0d10] border border-[#1a1f26] px-3 py-2.5 text-xs font-mono text-zinc-300 outline-none focus:border-[#a855f7]/30 rounded placeholder:text-zinc-700"
                  style={{ fontSize: 16 }}
                />
              </div>
            )}

            {/* Category grid (when no category selected and no search) */}
            {!drawerCategory && !search.trim() && (
              <div className="p-4 grid grid-cols-3 gap-2">
                {categories.filter((c) => c.id !== "home").map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setDrawerCategory(cat.id)}
                    className="flex flex-col items-center gap-1.5 py-3 border border-[#1a1f26] rounded-lg hover:border-[#2a2f36] transition-colors active:bg-[#0a0d10]"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: `${cat.color}15` }}>
                      <SvgIcon path={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Routes list */}
            {(drawerCategory || search.trim()) && (
              <div className="p-2">
                {drawerCategory && (
                  <button
                    onClick={() => { setDrawerCategory(null); setSearch(""); }}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-zinc-500"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                  </button>
                )}
                {filteredRoutes.map((route) => {
                  const cat = categories.find((c) => c.id === route.category);
                  return (
                    <MobileLink
                      key={route.path}
                      route={route}
                      color={cat?.color || "#5a6268"}
                      onClose={closeDrawer}
                    />
                  );
                })}
                {filteredRoutes.length === 0 && (
                  <div className="text-center py-8 text-zinc-600 font-mono text-xs">
                    Nenhum painel encontrado
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const MobileLink = memo(function MobileLink({
  route,
  color,
  onClose,
}: {
  route: { path: string; label: string; description: string; icon: string };
  color: string;
  onClose: () => void;
}) {
  const [isActive] = useRoute(route.path);

  return (
    <Link
      href={route.path}
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-3 no-underline rounded-lg transition-colors ${
        isActive ? "bg-[#a855f7]/10 text-[#a855f7]" : "text-zinc-400 active:bg-[#0a0d10]"
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: `${color}15` }}>
        <svg className="w-4 h-4" fill="none" stroke={isActive ? "#a855f7" : color} viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={route.icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs">{route.label}</div>
        <div className="text-[9px] text-zinc-600 truncate">{route.description}</div>
      </div>
    </Link>
  );
});

export default memo(BottomBar);
