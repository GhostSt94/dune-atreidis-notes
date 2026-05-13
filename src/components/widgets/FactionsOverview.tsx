import { Link } from 'react-router-dom';
import { useCurrentGame, useFactionStore } from '@/store';
import { FACTIONS } from '@/data/factions';
import { Card } from '@/components/ui/Card';
import { ThreatMeter } from '@/components/ui/ThreatMeter';
import { useAnalysis } from '@/hooks/useAnalysis';
import { FactionIcon } from '@/components/icons/FactionIcon';

export const FactionsOverview = () => {
  const game = useCurrentGame();
  const byGame = useFactionStore((s) => s.byGame);
  const analysis = useAnalysis();
  if (!game) return null;
  const map = byGame[game.id];
  if (!map) return null;

  return (
    <Card
      title="Factions présentes"
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
          return (
            <li key={id} className="py-2.5 flex items-center justify-between gap-3">
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
                <div className="min-w-0">
                  <p className="text-sm text-atreides-silver truncate font-serif">
                    {meta.shortName}
                  </p>
                  <p className="text-[10px] text-atreides-silverMuted font-mono">
                    {f.estimatedTroops} troupes · {f.estimatedSpice} épice
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <ThreatMeter level={level} showLabel={false} />
                <span className="text-xs font-mono text-atreides-gold w-10 text-right">
                  {score}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
