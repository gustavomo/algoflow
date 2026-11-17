'use client';

import { motion } from 'framer-motion';
import type { SystemNode, VisualStagePhase } from '@algoflow/contracts';
import {
  SYSTEM_PHASE_VISUALS,
  resolveSystemNodeVisual,
  truncateSystemLabel,
} from '../../lib/simulations/visualGrammar';

interface GlyphArtworkProps {
  type: string;
  mark: string;
  stroke: string;
  fill: string;
  soft: string;
  strokeWidth: number;
}

function GlyphArtwork({
  type,
  mark,
  stroke,
  fill,
  soft,
  strokeWidth,
}: GlyphArtworkProps) {
  const line = {
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
  };
  const markText = (
    <text
      x="0"
      y="4"
      textAnchor="middle"
      fill={stroke}
      fontSize="9"
      fontWeight="700"
      letterSpacing=".8"
    >
      {mark}
    </text>
  );

  switch (type) {
    case 'client':
      return (
        <g>
          <rect x="-30" y="-24" width="60" height="39" rx="4" {...line} />
          <line x1="-20" y1="23" x2="20" y2="23" {...line} />
          <line x1="0" y1="15" x2="0" y2="23" {...line} />
          <circle cx="0" cy="-5" r="4" fill={stroke} />
        </g>
      );
    case 'dns':
      return (
        <g>
          <circle r="28" {...line} />
          <path
            d="M-27 0H27M0-27V27M-19-19C-5-7-5 7-19 19M19-19C5-7 5 7 19 19"
            {...line}
          />
          <circle r="4" fill={stroke} />
        </g>
      );
    case 'cdn':
      return (
        <g>
          <path d="M0-29 27-14 27 14 0 29-27 14-27-14Z" {...line} />
          <circle cx="0" cy="-15" r="4" fill={stroke} />
          <circle cx="-15" cy="10" r="4" fill={stroke} />
          <circle cx="15" cy="10" r="4" fill={stroke} />
          <path d="m0-11-12 18M0-11 12 7M-11 10h22" {...line} />
        </g>
      );
    case 'load-balancer':
      return (
        <g>
          <path d="M0-29 34 0 0 29-34 0Z" {...line} />
          <path d="M-21 0H-7M-7 0 9-13M-7 0 9 13M9-13h12M9 13h12" {...line} />
          <path d="m16-17 5 4-5 4M16 9l5 4-5 4" {...line} />
        </g>
      );
    case 'api-gateway':
      return (
        <g>
          <path
            d="M-31-28H-15M-31-28V28M-31 28h16M31-28H15M31-28V28M31 28H15"
            {...line}
          />
          <path d="M-18 0H17M10-8l8 8-8 8" {...line} />
          <circle cx="-19" cy="0" r="3" fill={stroke} />
        </g>
      );
    case 'service':
      return (
        <g>
          <path d="M0-30 27-15 27 15 0 30-27 15-27-15Z" {...line} />
          <circle r="10" {...line} />
          <path
            d="M0-17V-10M0 10v7M-17 0h7M10 0h7M-12-12l5 5M7 7l5 5M12-12 7-7M-7 7l-5 5"
            {...line}
          />
        </g>
      );
    case 'cache':
      return (
        <g>
          {[-16, 0, 16].map((y, index) => (
            <g key={y}>
              <path d={`M-32 ${y - 6}H24L32 ${y} 24 ${y + 6}H-32Z`} {...line} />
              <circle
                cx="-23"
                cy={y}
                r="2.5"
                fill={index === 0 ? stroke : soft}
              />
            </g>
          ))}
        </g>
      );
    case 'relational-database':
      return (
        <g>
          <ellipse
            cx="0"
            cy="-20"
            rx="29"
            ry="9"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <path
            d="M-29-20v39c0 5 13 9 29 9s29-4 29-9v-39M-29 0c0 5 13 9 29 9S29 5 29 0"
            {...line}
          />
          <path d="M-29-20c0 5 13 9 29 9s29-4 29-9" {...line} />
          {markText}
        </g>
      );
    case 'document-database':
      return (
        <g>
          <path d="M-22-29H14L27-16v43H-22Z" {...line} />
          <path d="M14-29v13h13M-12-8H16M-12 1H16M-12 10H8" {...line} />
          <path
            d="M-30-20v55H18"
            stroke={soft}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </g>
      );
    case 'object-storage':
      return (
        <g>
          <path d="M-30-20H30L23 27H-23Z" {...line} />
          <path d="M-34-20c8-10 18-13 34-13s26 3 34 13M-20-7H20" {...line} />
          {markText}
        </g>
      );
    case 'queue':
      return (
        <g>
          <path d="M-34-20v40M34-20v40" {...line} />
          {[-22, -7, 8, 23].map((x, index) => (
            <circle
              key={x}
              cx={x}
              cy="0"
              r="6"
              fill={index === 3 ? stroke : fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          ))}
          <path d="m27-8 8 8-8 8" {...line} />
        </g>
      );
    case 'stream':
      return (
        <g>
          <path
            d="M-35-12C-23-28-10 4 2-12S27 4 36-12M-35 12C-23-4-10 28 2 12S27 28 36 12"
            {...line}
          />
          <circle cx="-20" cy="0" r="3" fill={stroke} />
          <circle cx="0" cy="0" r="3" fill={stroke} />
          <circle cx="20" cy="0" r="3" fill={stroke} />
        </g>
      );
    case 'worker':
      return (
        <g>
          <path
            d="M0-31 10-25 21-26 26-16 35-10 31 0 35 10 26 16 21 26 10 25 0 31-10 25-21 26-26 16-35 10-31 0-35-10-26-16-21-26-10-25Z"
            {...line}
          />
          <circle r="12" {...line} />
          {markText}
        </g>
      );
    case 'search':
      return (
        <g>
          <circle cx="-6" cy="-6" r="23" {...line} />
          <path d="m10 11 22 22M-17-11H5M-17-2H1M-17 7H-3" {...line} />
        </g>
      );
    case 'observability':
      return (
        <g>
          <circle r="29" {...line} />
          <path d="M-23 5h10l6-18L3 16l8-21 6 10h9" {...line} />
          <circle cx="0" cy="0" r="3" fill={stroke} />
        </g>
      );
    case 'legacy-system':
      return (
        <g>
          <path d="M-31-27H20L31-16V27H-31Z" {...line} />
          <path
            d="M20-27v11h11M-22-11H13M-22 0H7M-22 11H16"
            stroke={soft}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray="4 4"
          />
          <path d="m-30-27 7 7-7 7M31 5l-7 7 7 7" {...line} />
        </g>
      );
    case 'proxy':
      return (
        <g>
          <circle cx="-27" cy="0" r="5" {...line} />
          <circle cx="28" cy="-17" r="5" {...line} />
          <circle cx="28" cy="17" r="5" {...line} />
          <path d="M-21 0H-4C7 0 10-17 22-17M-4 0C7 0 10 17 22 17" {...line} />
          <path d="m17-22 6 5-6 5M17 12l6 5-6 5" {...line} />
        </g>
      );
    case 'database-replica':
      return (
        <g>
          <ellipse
            cx="-10"
            cy="-18"
            rx="24"
            ry="8"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <path
            d="M-34-18v32c0 5 11 8 24 8s24-3 24-8v-32M-34-18c0 5 11 8 24 8s24-3 24-8"
            {...line}
          />
          <path d="M11-2c15 0 23 5 23 11s-8 11-23 11M27 3l7 6-7 6" {...line} />
        </g>
      );
    case 'change-data-capture':
      return (
        <g>
          <ellipse
            cx="-18"
            cy="-17"
            rx="17"
            ry="6"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <path
            d="M-35-17v25c0 4 8 6 17 6S-1 12-1 8v-25M-35-17c0 4 8 6 17 6s17-2 17-6"
            {...line}
          />
          <path d="M4-7C24-7 31 2 31 17M24 10l7 7 7-7" {...line} />
          <circle cx="8" cy="15" r="4" fill={stroke} />
        </g>
      );
    case 'feature-flag':
      return (
        <g>
          <path d="M-22 31v-61M-21-27H25L14-9l11 18H-21" {...line} />
          <circle cx="-22" cy="32" r="4" fill={stroke} />
          {markText}
        </g>
      );
    case 'backup':
      return (
        <g>
          <path d="M-25-10a29 29 0 1 1-1 24M-27-10v-17M-27-10h17" {...line} />
          <path d="M-14 10H17V27H-14ZM-8 10v-8H11v8" {...line} />
        </g>
      );
    case 'firewall':
      return (
        <g>
          <path
            d="M0-32C13-23 24-23 31-23v20C31 16 18 28 0 35-18 28-31 16-31-3v-20c7 0 18 0 31-9Z"
            {...line}
          />
          <path
            d="M-22-9H22M-25 3H25M-19 15H19M-8-20v11M9-20v11M-14-9V3M14-9V3M-7 3v12M8 3v12"
            stroke={soft}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </g>
      );
    case 'identity-provider':
      return (
        <g>
          <circle cx="-10" cy="-12" r="11" {...line} />
          <path d="M-31 25c3-14 10-21 21-21S8 11 11 25" {...line} />
          <circle cx="22" cy="-4" r="8" {...line} />
          <path d="M22 4v20M22 14h10M22 20h7" {...line} />
        </g>
      );
    case 'scheduler':
      return (
        <g>
          <circle r="30" {...line} />
          <path d="M0-20V0l15 9M-5-35H5M-34 0h8M26 0h8" {...line} />
          <circle r="3" fill={stroke} />
        </g>
      );
    case 'data-warehouse':
      return (
        <g>
          <path
            d="M-33 28V-8L0-29 33-8v36ZM-20 28V3H20v25M-25-6H25"
            {...line}
          />
          <ellipse
            cx="0"
            cy="4"
            rx="14"
            ry="5"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <path d="M-14 4v12c0 3 6 5 14 5s14-2 14-5V4" {...line} />
        </g>
      );
    case 'dead-letter-queue':
      return (
        <g>
          <path d="M-35-20v40M35-20v40" {...line} />
          {[-22, -7, 8].map((x) => (
            <circle
              key={x}
              cx={x}
              cy="0"
              r="6"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          ))}
          <path d="m21-9 16 18M37-9 21 9" {...line} />
        </g>
      );
    default:
      return (
        <g>
          <circle r="29" {...line} strokeDasharray="5 4" />
          {markText}
        </g>
      );
  }
}

export default function SystemNodeGlyph({
  node,
  active,
  selected,
  emphasized,
  connecting,
  phase,
  reducedMotion,
  failurePatternId,
  onPointerDown,
  onSelect,
}: {
  node: SystemNode;
  active: boolean;
  selected: boolean;
  emphasized: boolean;
  connecting: boolean;
  phase?: VisualStagePhase;
  reducedMotion: boolean;
  failurePatternId: string;
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
  onSelect: () => void;
}) {
  const visual = resolveSystemNodeVisual(node.type);
  const stroke =
    active || selected || emphasized
      ? 'rgb(var(--color-ink))'
      : 'rgb(var(--color-muted))';
  const soft = active
    ? 'rgb(var(--color-ink-soft))'
    : 'rgb(var(--color-subtle))';
  const fill = 'rgb(var(--color-surface))';
  const strokeWidth = active ? 2.8 : selected || emphasized ? 2.2 : 1.6;
  const phaseVisual = phase ? SYSTEM_PHASE_VISUALS[phase] : undefined;
  const stateLabel =
    phaseVisual?.label ?? (connecting ? 'connection source' : 'idle');

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${node.label}, ${node.type.replaceAll('-', ' ')}, ${visual.meaning}, ${stateLabel}`}
      data-system-node={node.id}
      onKeyDown={(event) => {
        // Activation is explicit: focus alone never selects or connects, and
        // the node consumes Space and Enter so playback does not toggle too.
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          if (!event.repeat) onSelect();
        }
      }}
      onPointerDown={onPointerDown}
      style={{ cursor: 'grab', touchAction: 'none' }}
    >
      <motion.g
        animate={
          reducedMotion
            ? { opacity: active ? 1 : 0.88 }
            : { opacity: active ? 1 : 0.88, scale: active ? 1.035 : 1 }
        }
        transition={{ duration: 0.2 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <title>{`${node.label} · ${node.type.replaceAll('-', ' ')} · ${visual.meaning}`}</title>
        <rect x="-76" y="-58" width="152" height="130" fill="transparent" />

        {(selected || connecting || emphasized) && (
          <path
            d="M-53-24V-47H-30M30-47H53V-24M53 24V47H30M-30 47H-53V24"
            fill="none"
            stroke={stroke}
            strokeWidth={connecting ? 2.5 : 1.5}
            strokeDasharray={
              connecting ? '4 4' : emphasized ? '2 5' : undefined
            }
            opacity=".8"
          />
        )}

        {phase === 'failure' && (active || emphasized) && (
          <circle
            r="46"
            fill={`url(#${failurePatternId})`}
            stroke="rgb(var(--color-ink))"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        )}
        {phase === 'recovery' && (active || emphasized) && (
          <g fill="none" stroke="rgb(var(--color-ink))">
            <path
              d="M-43 4A44 44 0 0 1 31-31"
              strokeWidth="2"
              strokeDasharray="10 4"
            />
            <path d="m25-38 9 5-6 9" strokeWidth="2" />
          </g>
        )}
        {phase === 'terminal' && active && (
          <g fill="none" stroke="rgb(var(--color-ink))" strokeWidth="2">
            <circle r="45" />
            <path d="m26-34 7 7 13-16" />
          </g>
        )}

        <GlyphArtwork
          type={visual.type}
          mark={visual.mark}
          stroke={stroke}
          fill={fill}
          soft={soft}
          strokeWidth={strokeWidth}
        />

        <text
          x="0"
          y="52"
          textAnchor="middle"
          fill="rgb(var(--color-ink))"
          fontSize="13"
          fontWeight="650"
        >
          {truncateSystemLabel(node.label)}
        </text>
        <text
          x="0"
          y="68"
          textAnchor="middle"
          fill={soft}
          fontSize="8"
          letterSpacing="1.1"
        >
          {`${visual.mark} · ${visual.family}`.toUpperCase()}
        </text>

        {phaseVisual && active && (
          <g transform="translate(0 -48)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="rgb(var(--color-ink))"
              fontSize="8"
              fontWeight="700"
              letterSpacing="1"
            >
              {`${phaseVisual.symbol} ${phaseVisual.label}`.toUpperCase()}
            </text>
          </g>
        )}
      </motion.g>
    </g>
  );
}
