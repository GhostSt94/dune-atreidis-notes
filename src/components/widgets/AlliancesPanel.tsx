import { useCurrentGame, useFactionStore } from '@/store';
import { FACTIONS } from '@/data/factions';
import { Card } from '@/components/ui/Card';
import { FactionPill } from '@/components/ui/FactionPill';
import { EmptyState } from '@/components/ui/EmptyState';

export const AlliancesPanel = () => {
  const game = useCurrentGame();
  const byGame = useFactionStore((s) => s.byGame);
  if (!game) return null;
  const map = byGame[game.id];
  if (!map) return null;

  const seen = new Set<string>();
  const pairs: [string, string][] = [];
  Object.values(map).forEach((f) => {
    f.alliances.forEach((a) => {
      const key = [f.id, a].sort().join('|');
      if (!seen.has(key) && map[a]) {
        seen.add(key);
        pairs.push([f.id, a]);
      }
    });
  });

  return (
    <Card title="Alliances" subtitle={`${pairs.length} actives`}>
      {pairs.length === 0 ? (
        <EmptyState title="Aucune alliance" description="Les puissances ne sont pas encore liées." />
      ) : (
        <ul className="space-y-2">
          {pairs.map(([a, b]) => (
            <li
              key={`${a}-${b}`}
              className="flex items-center gap-2 p-2 rounded bg-atreides-deep/40 border border-atreides-gold/10"
            >
              <FactionPill id={a as never} />
              <span className="text-atreides-silverMuted text-xs">⇌</span>
              <FactionPill id={b as never} />
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-atreides-silverMuted mt-3 font-mono">
        Gérer les alliances depuis la page Factions.
      </p>
      <div className="hidden">
        {FACTIONS.atreides.shortName}
      </div>
    </Card>
  );
};
