import { useState } from 'react';
import { motion } from 'framer-motion';
import { FACTIONS, factionTextColor } from '@/data/factions';
import type { FactionId } from '@/types/faction';
import { FactionIcon } from '@/components/icons/FactionIcon';
import { cn } from '@/lib/cn';

interface AllianceWheelProps {
  factionsInPlay: FactionId[];
  alliances: Record<FactionId, FactionId[]>; // map faction → ses alliés (souvent 0 ou 1)
  suggestedPairs?: Set<string>; // clés "factionA|factionB" triées
  dangerPairs?: Set<string>;
  onToggleAlliance: (a: FactionId, b: FactionId) => void;
  onSelectPair?: (a: FactionId, b: FactionId) => void;
  selectedPair?: [FactionId, FactionId] | null;
  size?: number;
}

const pairKey = (a: FactionId, b: FactionId): string => [a, b].sort().join('|');

export const AllianceWheel = ({
  factionsInPlay,
  alliances,
  suggestedPairs,
  dangerPairs,
  onToggleAlliance,
  onSelectPair,
  selectedPair,
  size = 360,
}: AllianceWheelProps) => {
  const selectedKey = selectedPair ? pairKey(selectedPair[0], selectedPair[1]) : null;
  const [selected, setSelected] = useState<FactionId | null>(null);

  const total = factionsInPlay.length;
  const center = size / 2;
  const nodeRadius = 26;
  // Marge entre le bord SVG et l'extérieur des nœuds (pour les labels)
  const labelOffset = 18;
  const ringRadius = center - nodeRadius - labelOffset;

  // Position de chaque faction sur le cercle (12h pour index 0, sens horaire)
  const positionFor = (index: number) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;
    return {
      x: center + ringRadius * Math.cos(angle),
      y: center + ringRadius * Math.sin(angle),
    };
  };

  const positions: Record<FactionId, { x: number; y: number }> = {} as never;
  factionsInPlay.forEach((id, i) => {
    positions[id] = positionFor(i);
  });

  // Toutes les paires possibles, dédoublonnées
  const allPairs: [FactionId, FactionId][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < factionsInPlay.length; i++) {
    for (let j = i + 1; j < factionsInPlay.length; j++) {
      const a = factionsInPlay[i];
      const b = factionsInPlay[j];
      const k = pairKey(a, b);
      if (!seen.has(k)) {
        seen.add(k);
        allPairs.push([a, b]);
      }
    }
  }

  const handleNodeClick = (id: FactionId) => {
    if (selected === null) {
      setSelected(id);
      return;
    }
    if (selected === id) {
      setSelected(null);
      return;
    }
    onToggleAlliance(selected, id);
    setSelected(null);
  };

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[420px] aspect-square"
        role="img"
        aria-label="Cercle des alliances"
      >
        {/* Cercle de fond subtil */}
        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke="rgba(212,164,55,0.08)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />

        {/* Connexions entre paires */}
        {allPairs.map(([a, b]) => {
          const k = pairKey(a, b);
          const allied = alliances[a]?.includes(b) ?? false;
          const suggested = !allied && suggestedPairs?.has(k);
          const dangerous = !allied && dangerPairs?.has(k);
          const preview =
            !allied &&
            selected !== null &&
            ((selected === a && b !== a) || (selected === b && a !== b)) &&
            (selected === a || selected === b);

          const isVisible = allied || suggested || dangerous || preview;
          if (!isVisible) return null;

          const pa = positions[a];
          const pb = positions[b];
          const isSelectedLine = selectedKey === k;

          let stroke = 'transparent';
          let strokeWidth = 0;
          let dasharray: string | undefined;
          let opacity = 1;

          if (allied) {
            stroke = '#d4a437';
            strokeWidth = isSelectedLine ? 4 : 2.5;
          } else if (preview) {
            stroke = '#d4a437';
            strokeWidth = 2;
            dasharray = '5 3';
            opacity = 0.7;
          } else if (suggested) {
            stroke = '#2c4d9e';
            strokeWidth = isSelectedLine ? 3 : 1.5;
            dasharray = '4 3';
          } else if (dangerous) {
            stroke = '#7f1d1d';
            strokeWidth = isSelectedLine ? 3 : 1.5;
            dasharray = '4 3';
          }

          return (
            <g key={k}>
              {/* Glow autour de la ligne sélectionnée */}
              {isSelectedLine && (
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={stroke}
                  strokeWidth={strokeWidth + 6}
                  strokeLinecap="round"
                  opacity={0.25}
                />
              )}
              <motion.line
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity }}
                transition={{ duration: 0.35 }}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={dasharray}
                strokeLinecap="round"
              />
              {/* Hit area transparente pour faciliter le clic */}
              {onSelectPair && !preview && (
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke="transparent"
                  strokeWidth={14}
                  strokeLinecap="round"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPair(a, b);
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Nœuds (factions) */}
        {factionsInPlay.map((id) => {
          const { x, y } = positions[id];
          const isSelected = selected === id;
          const meta = FACTIONS[id];

          return (
            <g key={id} style={{ cursor: 'pointer' }}>
              {/* Halo de sélection */}
              {isSelected && (
                <motion.circle
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  cx={x}
                  cy={y}
                  r={nodeRadius + 6}
                  fill="none"
                  stroke="#d4a437"
                  strokeWidth="2"
                  className="animate-pulseGold"
                />
              )}

              {/* Background ring derrière l'icône (rend le clic plus fiable) */}
              <circle
                cx={x}
                cy={y}
                r={nodeRadius + 2}
                fill="#0b1426"
                stroke="rgba(212,164,55,0.25)"
                strokeWidth="1"
                onClick={() => handleNodeClick(id)}
              />

              {/* Icône de la faction */}
              <foreignObject
                x={x - nodeRadius}
                y={y - nodeRadius}
                width={nodeRadius * 2}
                height={nodeRadius * 2}
                onClick={() => handleNodeClick(id)}
                style={{ pointerEvents: 'all' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <FactionIcon faction={id} size={nodeRadius * 2 - 4} />
                </div>
              </foreignObject>

              {/* Label sous le nœud */}
              <text
                x={x}
                y={y + nodeRadius + 14}
                textAnchor="middle"
                fontSize="11"
                fontFamily="Cinzel, serif"
                fill={factionTextColor(id)}
                className={cn(isSelected && 'font-bold')}
                style={{ pointerEvents: 'none' }}
              >
                {meta.shortName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
