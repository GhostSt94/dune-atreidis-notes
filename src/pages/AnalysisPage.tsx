import { Navigate } from 'react-router-dom';
import { Brain, Shield, Target, AlertTriangle } from 'lucide-react';
import { useCurrentGame } from '@/store';
import { useAnalysis } from '@/hooks/useAnalysis';
import { FACTIONS, factionTextColor } from '@/data/factions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ThreatMeter } from '@/components/ui/ThreatMeter';
import { FactionPill } from '@/components/ui/FactionPill';
import { PhaseTracker } from '@/components/widgets/PhaseTracker';
import { FactionsOverview } from '@/components/widgets/FactionsOverview';
import { AlertsPanel } from '@/components/widgets/AlertsPanel';
import { QuickNote } from '@/components/widgets/QuickNote';
import { AlliancesPanel } from '@/components/widgets/AlliancesPanel';

export const AnalysisPage = () => {
  const game = useCurrentGame();
  const analysis = useAnalysis();
  if (!game) return <Navigate to="/games" replace />;
  if (!analysis) return null;

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Brain className="text-atreides-gold" size={22} />
        <div>
          <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
            Stratégie
          </h1>
          <p className="text-xs text-atreides-silverMuted">
            État de la partie et analyse heuristique Mentat.
          </p>
        </div>
      </div>

      {/* ─── Vue d'ensemble : phase + widgets ─── */}
      <PhaseTracker />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <FactionsOverview />
          <AlliancesPanel />
        </div>
        <div className="space-y-4">
          <AlertsPanel />
          <QuickNote />
        </div>
      </div>

      {/* ─── Séparateur Mentat ─── */}
      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-atreides-gold/15">
        <Brain size={16} className="text-atreides-gold" />
        <h2 className="font-display text-sm uppercase tracking-widest text-atreides-gold">
          Analyse Mentat
        </h2>
        <span className="flex-1 h-px bg-atreides-gold/15" />
      </div>

      <Card
        title={
          <span className="flex items-center gap-2">
            <Target size={14} /> Probabilités de victoire
          </span>
        }
      >
        <ul className="space-y-2">
          {analysis.winProbs.map((w) => (
            <li key={w.factionId} className="flex items-center gap-3">
              <FactionPill id={w.factionId} />
              <div className="flex-1 h-2 bg-atreides-deep rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-atreides-blue to-atreides-gold"
                  style={{ width: `${w.probability * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-atreides-gold w-12 text-right">
                {(w.probability * 100).toFixed(0)}%
              </span>
              <span className="text-[11px] text-atreides-silverMuted w-72 truncate">
                {w.rationale}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title={
          <span className="flex items-center gap-2">
            <Shield size={14} /> Scores de menace
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(analysis.threats).map((t) => (
            <div
              key={t.factionId}
              className="p-3 rounded border border-atreides-gold/15 bg-atreides-deep/40"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-serif"
                  style={{ color: factionTextColor(t.factionId) }}
                >
                  {FACTIONS[t.factionId].shortName}
                </span>
                <span className="text-xs font-mono text-atreides-gold">{t.score}/100</span>
              </div>
              <ThreatMeter level={t.level} />
              <ul className="mt-2 space-y-0.5">
                {t.factors.map((f) => (
                  <li
                    key={f.label}
                    className="text-[10px] flex justify-between text-atreides-silverMuted font-mono"
                  >
                    <span>{f.label}</span>
                    <span className="text-atreides-silver">+{Math.round(f.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Risques d'alliance">
          {analysis.allianceRisks.length === 0 ? (
            <p className="text-xs text-atreides-silverMuted">Aucune alliance hostile détectée.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.allianceRisks.map((r) => (
                <li
                  key={r.factions.join('-')}
                  className="flex items-center justify-between p-2 rounded bg-atreides-deep/40 border border-atreides-gold/10"
                >
                  <div className="flex items-center gap-2">
                    <FactionPill id={r.factions[0]} />
                    <span className="text-atreides-silverMuted">⇌</span>
                    <FactionPill id={r.factions[1]} />
                  </div>
                  <Badge
                    tone={
                      r.level === 'critical' ? 'red' : r.level === 'high' ? 'red' : 'gold'
                    }
                  >
                    {r.level} — {r.combinedScore}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle size={14} /> Suggestions Mentat
            </span>
          }
        >
          {analysis.suggestions.length === 0 ? (
            <p className="text-xs text-atreides-silverMuted">Position stable.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.suggestions.map((s) => (
                <li
                  key={s.id}
                  className="p-2 rounded bg-atreides-deep/40 border border-atreides-gold/10"
                >
                  <p className="text-xs font-display uppercase tracking-wider text-atreides-gold">
                    {s.title}
                  </p>
                  <p className="text-[11px] text-atreides-silver mt-1 leading-relaxed">
                    {s.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Estimations de mains adverses">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(analysis.hands)
            .filter((h) => h.factionId !== game.playerFaction)
            .map((h) => (
              <div
                key={h.factionId}
                className="p-3 rounded border border-atreides-gold/15 bg-atreides-deep/40"
              >
                <p className="text-sm font-serif" style={{ color: factionTextColor(h.factionId) }}>
                  {FACTIONS[h.factionId].shortName}
                </p>
                <p className="text-[11px] font-mono text-atreides-silverMuted mt-1">
                  {h.knownCount} connue(s) · {h.unknownCount} inconnue(s)
                </p>
                {h.topKnownCards.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {h.topKnownCards.map((c) => (
                      <li key={c.cardId} className="text-[11px] text-atreides-silver">
                        • {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};
