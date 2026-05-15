import { Castle, Coins, Skull, Heart, Layers, ShieldOff, Swords, Users } from 'lucide-react';
import {
  useCardsStore,
  useCurrentGame,
  useFactionStore,
  useTraitorsStore,
} from '@/store';
import { FACTIONS, factionTextColor } from '@/data/factions';
import type { FactionId } from '@/types/faction';
import { Card } from '@/components/ui/Card';
import { FactionIcon } from '@/components/icons/FactionIcon';
import { cn } from '@/lib/cn';
import {
  TOTAL_TROOPS,
  troopsOnMapOf,
  troopsDeadOf,
  aliveLeadersCount,
  cardStatsFor,
  activeTraitorsHeld,
} from '@/ai/factionStats';

/**
 * Tableau comparatif compact des factions — un coup d'œil sur toutes les
 * stats issues de la carte de faction (CardsPage).
 */
export const FactionComparisonTable = () => {
  const game = useCurrentGame();
  const byGame = useFactionStore((s) => s.byGame);
  const allCards = useCardsStore((s) => s.entries);
  const allTraitors = useTraitorsStore((s) => s.traitors);

  if (!game) return null;
  const map = byGame[game.id];
  if (!map) return null;

  const rows = game.factionsInPlay.map((id) => {
    const f = map[id];
    if (!f) return null;
    const zones = f.zonesControlled ?? 0;
    const dead = troopsDeadOf(id, map);
    const alive = TOTAL_TROOPS - dead;
    const onMap = troopsOnMapOf(id, map);
    const reserve = Math.max(0, alive - onMap);
    const aliveLeaders = aliveLeadersCount(id, map);
    const totalLeaders = f.leaders.length;
    const cards = cardStatsFor(id, allCards, game.id);
    const traitors = activeTraitorsHeld(id, allTraitors, game.id);
    return {
      id,
      zones,
      spice: f.estimatedSpice,
      alive,
      onMap,
      reserve,
      dead,
      aliveLeaders,
      totalLeaders,
      cards,
      traitors,
      allies: f.alliances.length,
    };
  });

  return (
    <Card title="Tableau comparatif" subtitle="Toutes les stats des cartes de faction">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono tabular-nums">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-atreides-silverMuted">
              <th className="text-left py-2 pr-2">Faction</th>
              <Th icon={<Castle size={11} />} label="Zones" />
              <Th icon={<Coins size={11} />} label="Épice" />
              <Th icon={<Users size={11} />} label="Vivants" />
              <Th icon={<Swords size={11} />} label="Carte" />
              <Th icon={<Users size={11} />} label="Réserve" />
              <Th icon={<Skull size={11} />} label="Mort" />
              <Th icon={<Heart size={11} />} label="Leaders" />
              <Th icon={<Layers size={11} />} label="Cartes" />
              <Th icon={<ShieldOff size={11} />} label="Traîtres" />
            </tr>
          </thead>
          <tbody className="divide-y divide-atreides-gold/10">
            {rows.map((r) => {
              if (!r) return null;
              const isPlayer = r.id === game.playerFaction;
              return (
                <tr
                  key={r.id}
                  className={cn(
                    'hover:bg-atreides-deep/40',
                    isPlayer && 'bg-atreides-gold/5',
                  )}
                >
                  <td className="py-2 pr-2">
                    <span className="flex items-center gap-2">
                      <FactionIcon faction={r.id as FactionId} size={18} />
                      <span
                        className="font-serif text-sm"
                        style={{ color: factionTextColor(r.id as FactionId) }}
                      >
                        {FACTIONS[r.id as FactionId].shortName}
                      </span>
                    </span>
                  </td>
                  <Td
                    value={`${r.zones}/4`}
                    highlight={r.zones >= 3}
                  />
                  <Td value={`${r.spice}`} highlight={r.spice >= 15} />
                  <Td value={`${r.alive}`} negative={r.alive <= 8} />
                  <Td value={`${r.onMap}`} />
                  <Td value={`${r.reserve}`} />
                  <Td value={`${r.dead}`} negative={r.dead >= 10} />
                  <Td
                    value={`${r.aliveLeaders}/${r.totalLeaders}`}
                    negative={r.aliveLeaders <= r.totalLeaders / 2}
                  />
                  <Td
                    value={
                      r.cards.total > 0
                        ? `${r.cards.total} (${r.cards.weapons}A·${r.cards.defenses}D)`
                        : '—'
                    }
                  />
                  <Td value={r.traitors > 0 ? `${r.traitors}` : '—'} highlight={r.traitors > 0} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-atreides-silverMuted italic mt-3 pt-2 border-t border-atreides-gold/10">
        Total = {TOTAL_TROOPS} troupes par faction · Zones (max 4) = compteur saisi sur la
        carte de faction · A = armes · D = défenses.
      </p>
    </Card>
  );
};

const Th = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <th className="text-right py-2 px-1.5 font-normal">
    <span className="inline-flex items-center justify-end gap-1">
      {icon}
      {label}
    </span>
  </th>
);

const Td = ({
  value,
  highlight = false,
  negative = false,
}: {
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) => (
  <td
    className={cn(
      'text-right py-2 px-1.5',
      highlight && 'text-atreides-gold',
      negative && 'text-severity-danger',
      !highlight && !negative && 'text-atreides-silver',
    )}
  >
    {value}
  </td>
);
