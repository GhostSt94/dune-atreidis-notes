import { Link } from 'react-router-dom';
import { Castle, Coins, Users, Heart, Layers, ShieldOff } from 'lucide-react';
import {
  useCardsStore,
  useCurrentGame,
  useFactionStore,
  useTraitorsStore,
} from '@/store';
import { FACTIONS } from '@/data/factions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ThreatMeter } from '@/components/ui/ThreatMeter';
import { useAnalysis } from '@/hooks/useAnalysis';
import { FactionIcon } from '@/components/icons/FactionIcon';
import {
  TOTAL_TROOPS,
  troopsOnMapOf,
  troopsDeadOf,
  aliveLeadersCount,
  cardStatsFor,
  activeTraitorsHeld,
} from '@/ai/factionStats';

export const FactionsOverview = () => {
  const game = useCurrentGame();
  const byGame = useFactionStore((s) => s.byGame);
  const allCards = useCardsStore((s) => s.entries);
  const allTraitors = useTraitorsStore((s) => s.traitors);
  const analysis = useAnalysis();

  if (!game) return null;
  const map = byGame[game.id];
  if (!map) return null;

  return (
    <Card
      title="Factions présentes"
      subtitle="Données issues des cartes de faction"
      action={
        <Link
          to="/game/factions"
          className="text-[11px] uppercase font-display tracking-wider text-atreides-gold hover:underline"
        >
          Détails →
        </Link>
      }
    >
      <ul className="divide-y divide-atreides-gold/10">
        {game.factionsInPlay.map((id) => {
          const f = map[id];
          const meta = FACTIONS[id];
          const score = analysis?.threats[id]?.score ?? 0;
          const level = analysis?.threats[id]?.level ?? 0;
          if (!f) return null;

          const zones = f.zonesControlled ?? 0;
          const onMap = troopsOnMapOf(id, map);
          const dead = troopsDeadOf(id, map);
          const alive = TOTAL_TROOPS - dead;
          const aliveLeaders = aliveLeadersCount(id, map);
          const totalLeaders = f.leaders.length;
          const cardStats = cardStatsFor(id, allCards, game.id);
          const traitorCount = activeTraitorsHeld(id, allTraitors, game.id);
          const isPlayer = id === game.playerFaction;

          return (
            <li key={id} className="py-2.5">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center border"
                    style={{
                      background: `${meta.color}1a`,
                      borderColor: `${meta.color}55`,
                    }}
                  >
                    <FactionIcon faction={id} size={24} />
                  </div>
                  <div className="min-w-0 flex items-center gap-2">
                    <p className="text-sm text-atreides-silver truncate font-serif">
                      {meta.shortName}
                    </p>
                    {isPlayer && <Badge tone="gold">Vous</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ThreatMeter level={level} showLabel={false} />
                  <span className="text-xs font-mono text-atreides-gold w-10 text-right tabular-nums">
                    {score}
                  </span>
                </div>
              </div>

              {/* Stats issues de la carte de faction */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pl-12 text-[10px] font-mono">
                <Stat icon={<Castle size={10} />} value={`${zones}/4`} label="zones" tone={zones >= 3 ? 'gold' : 'muted'} />
                <Stat icon={<Coins size={10} />} value={`${f.estimatedSpice}`} label="épice" />
                <Stat icon={<Users size={10} />} value={`${alive}`} label="vivants" />
                <Stat icon={<Users size={10} />} value={`${onMap}`} label="sur carte" tone="muted" />
                <Stat
                  icon={<Heart size={10} />}
                  value={`${aliveLeaders}/${totalLeaders}`}
                  label="leaders"
                  tone={aliveLeaders <= totalLeaders / 2 ? 'red' : 'muted'}
                />
                <Stat
                  icon={cardStats.total > 0 ? <Layers size={10} /> : <ShieldOff size={10} />}
                  value={traitorCount > 0 ? `${cardStats.total}·${traitorCount}T` : `${cardStats.total}`}
                  label={traitorCount > 0 ? 'cartes·traîtres' : 'cartes'}
                  tone={traitorCount > 0 ? 'gold' : 'muted'}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

const Stat = ({
  icon,
  value,
  label,
  tone = 'muted',
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone?: 'muted' | 'gold' | 'red';
}) => {
  const valueClass =
    tone === 'gold'
      ? 'text-atreides-gold'
      : tone === 'red'
        ? 'text-severity-danger'
        : 'text-atreides-silver';
  return (
    <div className="flex items-center gap-1 truncate">
      <span className="text-atreides-silverMuted shrink-0">{icon}</span>
      <span className={`tabular-nums ${valueClass}`}>{value}</span>
      <span className="text-atreides-silverMuted/70 truncate">{label}</span>
    </div>
  );
};
