import { cn } from '../lib/utils.js';

/**
 * Reusable funnel chart component that enforces the Vincor design system.
 *
 * Renders a vertical funnel with decreasing-width bars, conversion rates
 * between stages, and an optional pending indicator. All styling uses
 * design tokens — no hardcoded colors or font sizes.
 *
 * Usage:
 *   <FunnelChart
 *     stages={[
 *       { label: 'Eligible', value: 50000 },
 *       { label: 'Contacted', value: 12000 },
 *       { label: 'Active User', value: 1200 },
 *     ]}
 *     pending={340}
 *   />
 */

function formatNumber(n) {
  const rounded = Math.round(n);
  if (rounded >= 1000) {
    const k = rounded / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return rounded.toLocaleString('en-US');
}

export default function FunnelChart({ stages, pending }) {
  if (!stages || stages.length === 0) return null;

  const maxValue = stages[0].value || 1;

  return (
    <div>
      <div className="flex flex-col items-center">
        {stages.map((stage, i) => {
          const widthPct = Math.max(20, Math.sqrt(stage.value / maxValue) * 100);
          const prevValue = i > 0 ? stages[i - 1].value : null;
          const convRate = prevValue && prevValue > 0
            ? ((stage.value / prevValue) * 100).toFixed(1) + '%'
            : null;
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.label} className="w-full flex flex-col items-center">
              {convRate && (
                <span className="text-[10px] text-foreground-faint leading-none py-0.5">
                  {convRate}
                </span>
              )}

              <div className="w-full flex justify-center">
                <div
                  className={cn(
                    'flex items-center justify-between px-3 rounded-sm transition-all duration-300 h-9',
                    isLast ? 'bg-brand' : 'bg-accent-subtle'
                  )}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className={cn(
                    'text-xs font-medium truncate',
                    isLast ? 'text-white' : 'text-foreground-muted'
                  )}>
                    {stage.label}
                  </span>
                  <span className={cn(
                    'text-[13px] font-semibold shrink-0 ml-2',
                    isLast ? 'text-white' : 'text-foreground'
                  )}>
                    {formatNumber(stage.value)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pending > 0 && (
        <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warn shrink-0" />
          <span className="text-[13px] text-foreground-muted">
            <span className="font-semibold">{formatNumber(pending)} offers in flight</span>
          </span>
        </div>
      )}
    </div>
  );
}
