import { cn } from '../lib/utils.js';

/**
 * Reusable funnel chart component that enforces the Vincor design system.
 *
 * Renders a vertical funnel with left-aligned horizontal bars, stage labels
 * above each bar, and metrics to the right. Follows analytics-product
 * conventions (Stripe, Amplitude, HubSpot).
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
      <div className="flex flex-col gap-2">
        {stages.map((stage, i) => {
          const widthPct = Math.max(18, (stage.value / maxValue) * 100);
          const prevValue = i > 0 ? stages[i - 1].value : null;
          const convRate = prevValue && prevValue > 0
            ? ((stage.value / prevValue) * 100).toFixed(1) + '%'
            : null;
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.label} className="w-full">
              {/* Stage label + conversion rate above bar */}
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[11px] font-medium text-foreground-muted">
                  {stage.label}
                </span>
                {convRate && (
                  <span className="text-[10px] text-foreground-faint">
                    {convRate}
                  </span>
                )}
              </div>

              {/* Bar (left-aligned) + number to the right */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-8 rounded-[4px] transition-all duration-300',
                    isLast ? 'bg-brand' : 'bg-accent-subtle'
                  )}
                  style={{ width: `${widthPct}%` }}
                />
                <span className={cn(
                  'text-[13px] font-semibold shrink-0 tabular-nums',
                  isLast ? 'text-brand' : 'text-foreground'
                )}>
                  {formatNumber(stage.value)}
                </span>
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
