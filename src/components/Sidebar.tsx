import { memo, useState, useCallback } from "react";
import { Link, useRoute } from "wouter";
import { categories, getRoutesByCategory, type RouteDef } from "../router";

function Sidebar() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ home: true });

  const toggleCategory = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#080a0c] border-r border-[#1a1f26] flex flex-col z-40 overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1a1f26]">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-[#a855f7] font-mono text-lg font-bold tracking-widest">VØID</span>
          <span className="text-zinc-600 font-mono text-[9px]">ET-RNET</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {categories.map((cat) => (
          <div key={cat.id} className="mb-1">
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[#0a0d10] transition-colors"
            >
              <span className="text-zinc-500 text-xs">{expanded[cat.id] ? "▼" : "▶"}</span>
              <span className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
                {cat.label}
              </span>
            </button>

            {expanded[cat.id] && (
              <div className="ml-2">
                {getRoutesByCategory(cat.id).map((route) => (
                  <SidebarLink key={route.path} route={route} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1a1f26]">
        <div className="text-[8px] font-mono text-zinc-700">
          VØID PROTOCOL v∞ · GPL-3.0
        </div>
      </div>
    </aside>
  );
}

const SidebarLink = memo(function SidebarLink({ route }: { route: RouteDef }) {
  const [isActive] = useRoute(route.path);

  return (
    <Link
      href={route.path}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs no-underline transition-colors ${
        isActive
          ? "text-[#a855f7] bg-[#a855f7]/5 border-l-2 border-[#a855f7]"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-[#0a0d10] border-l-2 border-transparent"
      }`}
    >
      <span className="text-[10px] w-4 text-center">{route.icon}</span>
      <span className="font-mono truncate">{route.label}</span>
    </Link>
  );
});

export default memo(Sidebar);
