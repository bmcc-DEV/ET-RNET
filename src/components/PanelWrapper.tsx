import { memo, type ReactNode } from "react";
import { Link } from "wouter";
import { categoryColorMap, getCategoryById } from "../router";

interface Props {
  title: string;
  category: string;
  icon?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

function PanelWrapper({ title, category, icon, description, children, actions }: Props) {
  const color = categoryColorMap[category] || "#5a6268";
  const cat = getCategoryById(category);

  return (
    <section className="void-panel page-enter">
      {/* Header */}
      <div className="void-panel-header" style={{ borderLeftColor: color, borderLeftWidth: 3, borderLeftStyle: "solid" }}>
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: `${color}15` }}>
            <svg className="w-4 h-4" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-sm text-zinc-200 font-medium tracking-wide">{title}</h2>
            {cat && (
              <span className="cat-badge" style={{ color, borderColor: `${color}40` }}>
                {cat.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[10px] font-mono text-zinc-600 mt-0.5 truncate">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Body */}
      <div className="void-panel-body">
        {children}
      </div>
    </section>
  );
}

export default memo(PanelWrapper);
