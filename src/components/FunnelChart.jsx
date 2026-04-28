import { cn } from '../lib/utils.js';
import { formatCompact } from './chartUtils.js';

/**
 * Reusable funnel chart component that enforces the Vincor design system.
 *
 * One row per stage: bar with stage name inside, count attached outside.
 * Cumulative % and (x days) appear on hover via tooltip.
 * When bar is narrower than the label text, count follows the label
 * instead of the bar edge to prevent overlap.
 *
 * Auto-height rows fill the parent container.
 *
 * Typography hierarchy (from DESIGN.md):
 *   Count: text-[13px] font-semibold text-foreground
 *   Stage name: text-[11px] font-medium text-foreground-muted
 */

export default function FunnelChart({ stages, pending }) {
  if (!stages || stages.length === 0) return null;

  const maxValue = stages[0].value || 1;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col gap-2">
        {stages.map((stage, i) => {
          const fillPct = Math.max(8, Math.sqrt(stage.value / maxValue) * 100);
          const isFirst = i === 0;
          const stageEmpty = stage.value === 0;

          const cumPct = isFirst ? null : ((stage.value / maxValue) * 100);
          const cumPctStr = cumPct !== null
            ? (cumPct < 1 ? cumPct.toFixed(1) + '%' : Math.round(cumPct) + '%')
            : null;

          // Tooltip: stage name, count, %, time
          const tooltipParts = [stage.label];
          if (!stageEmpty) tooltipParts.push(formatCompact(stage.value));
          if (cumPctStr) tooltipParts.push(cumPctStr);
          if (stage.time && !isFirst) tooltipParts.push(stage.time);

          // Bar too narrow for label — count follows label instead of bar edge
          const narrow = fillPct < 30;

          return (
            <div
              key={stage.label}
              className="flex-1 min-h-0 flex items-center gap-2"
            >
              {/* Bar: label left, count at far end, tooltip on hover */}
              <div
                className={cn(
                  'group relative h-full rounded-[4px] flex items-center px-3 transition-colors duration-200 cursor-default',
                  narrow ? 'overflow-visible gap-2' : 'justify-between',
                  stageEmpty ? 'bg-border-light' : 'bg-data-1 hover:bg-data-2'
                )}
                style={{ width: `${stageEmpty ? 8 : fillPct}%` }}
              >
                <span className="text-[11px] font-medium whitespace-nowrap text-foreground-muted">
                  {stage.label}
                </span>

                <span className={cn(
                  'text-[13px] font-semibold shrink-0 tabular-nums',
                  stageEmpty ? 'text-foreground-faint' : 'text-foreground'
                )}>
                  {stageEmpty ? '—' : formatCompact(stage.value)}
                </span>

                {/* Tooltip on hover */}
                {!isFirst && !stageEmpty && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="bg-surface border border-border text-[11px] font-semibold text-foreground-muted px-2 py-1 rounded-lg whitespace-nowrap" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      {cumPctStr}{stage.time ? ` · ${stage.time}` : ''}
                    </div>
                  </div>
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
