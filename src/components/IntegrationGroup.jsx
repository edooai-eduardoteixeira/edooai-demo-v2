import React from 'react';
import { cn } from '../lib/utils';
import PlatformLogo from './PlatformLogo.jsx';

export default function IntegrationGroup({
  group,
  connected,
  connecting,
  connectedPlatform,
  onConnect,
  step,
  isOptional,
}) {
  return (
    <div
      className={cn(
        'rounded-lg bg-surface transition-opacity duration-300 ease-out',
        isOptional ? 'border border-dashed border-border shadow-none mt-3' : 'border border-border shadow-sm',
        isOptional && !connected && 'opacity-75'
      )}
      style={{ padding: '32px' }}
    >
      {/* Title row: step · title + data direction tag */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-baseline">
          <span className="text-[17px] font-bold text-foreground">
            {step} &middot;&nbsp;
          </span>
          <span className="text-[17px] font-bold text-foreground">
            {group.label}
          </span>
          {isOptional && (
            <span className="text-[17px] font-normal text-foreground-faint ml-1">
              (optional)
            </span>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap',
            group.dataDirection === 'Read only'
              ? 'bg-[#dbeafe] text-[#1e40af]'
              : 'bg-border-light text-[#334155]'
          )}
        >
          {group.dataDirection}
        </span>
      </div>

      {/* WHY line */}
      <p className="text-[15px] text-foreground-muted font-normal leading-normal mb-6">
        {group.whyLine}
      </p>

      {/* Logos */}
      <div className="flex gap-5 flex-wrap">
        {group.platforms.map((platform) => (
          <PlatformLogo
            key={platform}
            name={platform}
            connected={connected && connectedPlatform === platform}
            connecting={connecting && connectedPlatform === platform}
            disabled={connected || connecting}
            onClick={() => {
              if (!connected && !connecting) onConnect(platform);
            }}
          />
        ))}
      </div>
    </div>
  );
}
