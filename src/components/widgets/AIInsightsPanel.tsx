import { Link } from 'react-router-dom';
import { Brain, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAnalysis } from '@/hooks/useAnalysis';
import { FACTIONS } from '@/data/factions';
import { useCurrentGame } from '@/store';

export const AIInsightsPanel = () => {
  const game = useCurrentGame();
  const analysis = useAnalysis();
  if (!game || !analysis) return null;

  const top = analysis.winProbs.slice(0, 3);

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Brain size={14} /> Mentat Atreides
        </span>
      }
      action={
        <Link
          to="/game/analysis"
          className="text-[11px] uppercase font-display tracking-wider text-atreides-gold hover:underline"
        >
          Analyse complète →
        </Link>
      }
    >
      <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted mb-2">
        Probabilités de victoire
      </p>
      <ul className="space-y-1.5 mb-4">
        {top.map((w) => (
          <li key={w.factionId} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: FACTIONS[w.factionId].color }}
            />
            <span className="text-xs text-atreides-silver flex-1 font-serif">
              {FACTIONS[w.factionId].shortName}
            </span>
            <div className="flex items-center gap-2 w-32">
              <div className="flex-1 h-1.5 bg-atreides-deep rounded-full overflow-hidden">
                <div
                  className="h-full bg-atreides-gold"
                  style={{ width: `${w.probability * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-atreides-gold w-9 text-right">
                {(w.probability * 100).toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>

      {analysis.suggestions.length > 0 && (
        <div className="pt-3 border-t border-atreides-gold/10">
          <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted mb-2 flex items-center gap-1">
            <TrendingUp size={11} /> Suggestion
          </p>
          <div className="text-xs">
            <p className="text-atreides-gold font-display tracking-wider uppercase text-[11px]">
              {analysis.suggestions[0].title}
            </p>
            <p className="text-atreides-silver mt-1 leading-relaxed text-[11px]">
              {analysis.suggestions[0].message}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
