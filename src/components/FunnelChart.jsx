import { cn } from '../lib/utils.js';
import { formatCompact } from './chartUtils.js';

/**
 * Reusable funnel chart component that enforces the Vincor design system.
 *
 * Two rows per stage:
 *   Row 1: stage name + (x days) — text only
 *   Row 2: bar + count + (%) — count attached to bar's right edge
 *
 * Auto-height rows fill the parent container.
 *
 * Typography hierarchy (from DESIGN.md):
 *   Count: text-[13px] font-semibold text-foreground
 *   Stage name: text-[11px] font-medium text-foreground-muted
 *   (%) and (x days): text-[11px] text-foreground-faint
 */

export default function FunnelChart({ stages, pending }) {
  if (!stages || stages.length === 0) return null;

  const maxValue = stages[0].value || 1;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col gap-2">
        {stages.map((stage, i) => {
          const fillPct = Math.max(15, Math.sqrt(stage.value / maxValue) * 100);
          const isFirst = i === 0;
          const stageEmpty = stage.value === 0;

          const cumPct = isFirst ? null : ((stage.value / maxValue) * 100);
          const cumPctStr = cumPct !== null
            ? (cumPct < 1 ? cumPct.toFixed(1) + '%' : Math.round(cumPct) + '%')
            : null;

          return (
            <div key={stage.label} className="flex-1 min-h-0 flex flex-col">
              {/* Row 1: stage name + (x days) */}
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-[11px] font-medium text-foreground-muted">
                  {stage.label}
                </span>
                {stage.time && !stageEmpty && !isFirst && (
                  <span className="text-[11px] text-foreground-faint">
                    ({stage.time})
                  </span>
                )}
              </div>

              {/* Row 2: bar + count + (%) */}
              <div className="flex-1 min-h-0 flex items-center gap-2">
                <div
                  className="h-full rounded-[4px] bg-gray-200 transition-all duration-300"
                  style={{ width: `${stageEmpty ? 15 : fillPct}%` }}
                />
                <span className={cn(
                  'text-[13px] font-semibold shrink-0 tabular-nums',
                  stageEmpty ? 'text-foreground-faint' : 'text-foreground'
                )}>
                  {stageEmpty ? '—' : formatCompact(stage.value)}
                </span>
                {cumPctStr && !stageEmpty && (
                  <span className="text-[11px] shrink-0 tabular-nums text-foreground-faint">
                    ({cumPctStr})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pending > 0 && (
        <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warn shrink-0" />
          <span className="text-[13px] text-foreground-muted">
            <span className="font-semibold">{formatCompact(pending)} offers in flight</span>
          </span>
        </div>
      )}
    </div>
  );
}
