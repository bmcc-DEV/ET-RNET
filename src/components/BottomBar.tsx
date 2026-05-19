import { memo, useState, useCallback } from "react";
import { Link, useRoute } from "wouter";
import { categories, getRoutesByCategory } from "../router";

const TABS = [
  { id: "home", label: "Home", icon: "◈" },
  { id: "crypto", label: "Crypto", icon: "🔐" },
  { id: "finance", label: "Finance", icon: "◈" },
  { id: "network", label: "Rede", icon: "◎" },
  { id: "more", label: "Mais", icon: "≡" },
];

function BottomBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string | null>(null);

  const handleTab = useCallback((id: string) => {
    if (id === "more") {
      setDrawerOpen(true);
      setDrawerCategory(null);
    } else if (id === "home") {
      window.location.href = "/";
    } else {
      setDrawerOpen(true);
      setDrawerCategory(id);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerCategory(null);
  }, []);

  return (
    <>
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080a0c] border-t border-[#1a1f26] flex items-center justify-around z-50 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTab(tab.id)}
            className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] active:bg-[#0a0d10] transition-colors"
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[9px] font-mono text-zinc-500">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50" onClick={closeDrawer}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-14 left-0 right-0 bg-[#080a0c] border-t border-[#1a1f26] max-h-[70vh] overflow-y-auto rounded-t-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="sticky top-0 bg-[#080a0c] px-4 py-3 border-b border-[#1a1f26] flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-300">
                {drawerCategory
                  ? categories.find((c) => c.id === drawerCategory)?.label
                  : "TODAS AS CATEGORIAS"}
              </span>
              <button onClick={closeDrawer} className="text-zinc-500 text-lg px-2">
                ✕
              </button>
            </div>

            {/* Category buttons (when no category selected) */}
            {!drawerCategory && (
              <div className="p-4 grid grid-cols-3 gap-2">
                {categories.filter((c) => c.id !== "home").map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setDrawerCategory(cat.id)}
                    className="flex flex-col items-center gap-1 py-3 border border-[#1a1f26] hover:border-[#a855f7]/30 transition-colors"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[9px] font-mono text-zinc-400">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Routes list */}
            {drawerCategory && (
              <div className="p-2">
                <button
                  onClick={() => setDrawerCategory(null)}
                  className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-zinc-500"
                >
                  ← Voltar
                </button>
                {getRoutesByCategory(drawerCategory).map((route) => (
                  <MobileLink key={route.path} route={route} onClose={closeDrawer} />
                ))}
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
  onClose,
}: {
  route: { path: string; label: string; icon: string };
  onClose: () => void;
}) {
  const [isActive] = useRoute(route.path);

  return (
    <Link
      href={route.path}
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-3 no-underline transition-colors ${
        isActive ? "bg-[#a855f7]/10 text-[#a855f7]" : "text-zinc-400 active:bg-[#0a0d10]"
      }`}
    >
      <span className="text-sm w-6 text-center">{route.icon}</span>
      <span className="font-mono text-xs">{route.label}</span>
    </Link>
  );
});

export default memo(BottomBar);
