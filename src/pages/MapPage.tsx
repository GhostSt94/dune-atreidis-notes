import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentGame, useMapStore, useSettingsStore } from '@/store';
import { TERRITORIES } from '@/data/territories';
import { FACTIONS } from '@/data/factions';
import type { FactionId } from '@/types/faction';
import type { TerritoryMeta } from '@/types/territory';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { FactionIcon } from '@/components/icons/FactionIcon';

export const MapPage = () => {
  const game = useCurrentGame();
  const fog = useSettingsStore((s) => s.fogOfWar);
  const toggleFog = useSettingsStore((s) => s.toggleFog);
  const controls = useMapStore((s) => (game ? s.forGame(game.id) : {}));
  const setControl = useMapStore((s) => s.setControl);
  const setPresence = useMapStore((s) => s.setPresence);
  const setSpice = useMapStore((s) => s.setSpice);
  const setConflict = useMapStore((s) => s.setConflict);
  const [selected, setSelected] = useState<TerritoryMeta | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [debug, setDebug] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  if (!game) return <Navigate to="/games" replace />;

  const current = selected ? controls[selected.id] : null;

  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
          Carte d&apos;Arrakis
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={showLabels} onChange={setShowLabels} label="Étiquettes" />
          <Toggle checked={fog} onChange={toggleFog} label="Brouillard de guerre" />
          <Toggle checked={debug} onChange={setDebug} label="Debug coords" />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <Card className="overflow-hidden">
          <div
            className="relative w-full rounded overflow-hidden bg-atreides-deep"
            style={{ aspectRatio: '4145 / 4601' }}
            onMouseMove={(e) => {
              if (!debug) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setHoverPos({ x, y });
            }}
            onMouseLeave={() => setHoverPos(null)}
            onClick={(e) => {
              if (!debug) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              const coord = `x: ${x.toFixed(1)}, y: ${y.toFixed(1)}`;
              navigator.clipboard?.writeText(coord);
              // eslint-disable-next-line no-console
              console.log(`[map debug] ${coord}`);
            }}
          >
            <img
              src="/map/dune-board.jpg"
              alt="Plateau Dune"
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />

            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
            >
              {TERRITORIES.map((t) => {
                const ctrl = controls[t.id];
                const owner = ctrl?.controllingFaction;
                const presenceCount = Object.values(ctrl?.presence ?? {}).reduce(
                  (s, v) => s + (v ?? 0),
                  0,
                );
                const hidden =
                  fog && !owner && presenceCount === 0 && !t.isStronghold && t.kind !== 'polar';
                const isActive = selected?.id === t.id;
                const radius = t.isStronghold ? 2.2 : 1.4;

                return (
                  <motion.g
                    key={t.id}
                    onClick={() => setSelected(t)}
                    style={{ cursor: 'pointer' }}
                    whileHover={{ scale: 1.15 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hidden ? 0.15 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Anneau de conflit pulsant */}
                    {ctrl?.inConflict && !hidden && (
                      <circle
                        cx={t.x}
                        cy={t.y}
                        r={radius + 1.4}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="0.35"
                        opacity="0.9"
                        className="animate-pulseGold"
                      />
                    )}

                    {/* Cercle de base — gère le clic dans tous les cas */}
                    <circle
                      cx={t.x}
                      cy={t.y}
                      r={radius}
                      fill={owner ? 'transparent' : 'rgba(11,20,38,0.85)'}
                      stroke={
                        isActive
                          ? '#d4a437'
                          : t.isStronghold
                            ? 'rgba(212,164,55,0.9)'
                            : 'rgba(255,255,255,0.6)'
                      }
                      strokeWidth={isActive ? 0.6 : t.isStronghold ? 0.4 : 0.25}
                    />

                    {/* Emblème de la faction superposé (même taille que le cercle) */}
                    {owner && !hidden && (
                      <FactionIcon
                        faction={owner}
                        x={t.x - radius}
                        y={t.y - radius}
                        width={radius * 2}
                        height={radius * 2}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}

                    {/* Pastille épice */}
                    {ctrl?.hasSpice && !hidden && (
                      <circle
                        cx={t.x + radius - 0.3}
                        cy={t.y - radius + 0.3}
                        r={0.55}
                        fill="#d4a437"
                        stroke="#050a14"
                        strokeWidth="0.15"
                      />
                    )}
                    {(showLabels || isActive) && !hidden && (
                      <text
                        x={t.x}
                        y={t.y - radius - 0.6}
                        textAnchor="middle"
                        fontSize="1.3"
                        fontFamily="Cinzel, serif"
                        fill="#f5f5f5"
                        stroke="#050a14"
                        strokeWidth="0.25"
                        paintOrder="stroke"
                        style={{ pointerEvents: 'none' }}
                      >
                        {t.name}
                      </text>
                    )}
                  </motion.g>
                );
              })}
            </svg>

            <AnimatePresence>
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-2 left-2 px-2.5 py-1 rounded bg-atreides-deep/90 border border-atreides-gold/40 text-[11px] font-display uppercase tracking-wider text-atreides-gold backdrop-blur-sm"
                >
                  {selected.name}
                </motion.div>
              )}
            </AnimatePresence>

            {debug && hoverPos && (
              <>
                <div
                  className="absolute pointer-events-none border-l border-atreides-gold/60"
                  style={{ left: `${hoverPos.x}%`, top: 0, bottom: 0 }}
                />
                <div
                  className="absolute pointer-events-none border-t border-atreides-gold/60"
                  style={{ top: `${hoverPos.y}%`, left: 0, right: 0 }}
                />
                <div
                  className="absolute pointer-events-none w-3 h-3 rounded-full bg-atreides-gold border-2 border-white -translate-x-1/2 -translate-y-1/2 shadow-goldGlow"
                  style={{ left: `${hoverPos.x}%`, top: `${hoverPos.y}%` }}
                />
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-atreides-deep/90 border border-atreides-gold/40 text-[11px] font-mono text-atreides-gold backdrop-blur-sm pointer-events-none">
                  x: {hoverPos.x.toFixed(1)}, y: {hoverPos.y.toFixed(1)}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card
          title={selected?.name ?? 'Détails du territoire'}
          subtitle={selected?.kind ?? 'Cliquez un territoire'}
        >
          {!selected ? (
            <p className="text-xs text-atreides-silverMuted">
              Sélectionnez un territoire sur la carte pour éditer son état.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {selected.homeOf && <FactionIcon faction={selected.homeOf} size={28} />}
                {selected.isStronghold && <Badge tone="gold">Forteresse</Badge>}
                {selected.homeOf && (
                  <Badge tone="blue">Maison de {FACTIONS[selected.homeOf].shortName}</Badge>
                )}
                {selected.kind === 'polar' && <Badge tone="neutral">Sanctuaire polaire</Badge>}
                {current?.inConflict && <Badge tone="red">Conflit</Badge>}
              </div>

              <Select
                label="Contrôle"
                value={current?.controllingFaction ?? ''}
                onChange={(e) =>
                  setControl(
                    game.id,
                    selected.id,
                    (e.target.value || undefined) as FactionId | undefined,
                  )
                }
              >
                <option value="">Aucun</option>
                {game.factionsInPlay.map((id) => (
                  <option key={id} value={id}>
                    {FACTIONS[id].shortName}
                  </option>
                ))}
              </Select>

              <div>
                <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted mb-2">
                  Présence des factions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {game.factionsInPlay.map((id) => (
                    <div key={id} className="flex items-center gap-2">
                      <FactionIcon faction={id} size={16} />
                      <Input
                        type="number"
                        min={0}
                        value={current?.presence?.[id] ?? 0}
                        onChange={(e) =>
                          setPresence(
                            game.id,
                            selected.id,
                            id,
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Toggle
                  checked={current?.hasSpice ?? false}
                  onChange={(v) => setSpice(game.id, selected.id, v, v ? 6 : undefined)}
                  label="Présence d'épice"
                />
              </div>

              <Button
                size="sm"
                variant={current?.inConflict ? 'danger' : 'ghost'}
                onClick={() => setConflict(game.id, selected.id, !current?.inConflict)}
                className={cn('w-full')}
              >
                {current?.inConflict ? 'Conflit en cours — terminer' : 'Marquer en conflit'}
              </Button>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-atreides-gold/10">
            <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted mb-2">
              Légende
            </p>
            <ul className="space-y-1 text-[11px] text-atreides-silverMuted">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-atreides-gold" />
                Forteresse
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-white/60 bg-atreides-deep/80" />
                Territoire neutre
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-atreides-gold" /> Épice présente
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-severity-danger" />
                Conflit en cours
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};
