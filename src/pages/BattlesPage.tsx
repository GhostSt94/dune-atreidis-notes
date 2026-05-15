import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Swords,
  Brain,
  Target,
  ShieldAlert,
  AlertTriangle,
  Coins,
  Castle,
  Crown,
  TrendingUp,
} from 'lucide-react';
import {
  useCardsStore,
  useCurrentGame,
  useFactionStore,
  useMapStore,
  useTraitorsStore,
} from '@/store';
import {
  computeBattleAnalysis,
  type BattleAnalysis,
  type Metric,
} from '@/ai/battleAnalysis';
import { FACTIONS, factionTextColor } from '@/data/factions';
import { TERRITORIES } from '@/data/territories';
import type { FactionId } from '@/types/faction';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FactionIcon } from '@/components/icons/FactionIcon';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

export const BattlesPage = () => {
  const t = useT();
  const game = useCurrentGame();
  const factionsByGame = useFactionStore((s) => s.byGame);
  const mapByGame = useMapStore((s) => s.byGame);
  const cards = useCardsStore((s) => s.entries);
  const traitors = useTraitorsStore((s) => s.traitors);

  // ─── État du simulateur ───
  const [simAttacker, setSimAttacker] = useState<FactionId>('atreides');
  const [simDefender, setSimDefender] = useState<FactionId>('harkonnen');
  const [simTerritory, setSimTerritory] = useState<string>('arrakeen');
  const [simTroops, setSimTroops] = useState<number>(5);
  const [simDial, setSimDial] = useState<number>(10);

  // ─── Calcul d'analyse en live ───
  const analysis: BattleAnalysis | null = useMemo(() => {
    if (!game) return null;
    const factions = factionsByGame[game.id];
    if (!factions) return null;
    return computeBattleAnalysis(
      {
        attackerId: simAttacker,
        defenderId: simDefender,
        territoryId: simTerritory,
        troopsEngaged: simTroops,
        maxDial: simDial,
      },
      game,
      factions,
      mapByGame[game.id] ?? {},
      cards,
      traitors,
    );
  }, [
    factionsByGame,
    mapByGame,
    cards,
    traitors,
    game,
    simAttacker,
    simDefender,
    simTerritory,
    simTroops,
    simDial,
  ]);

  if (!game) return <Navigate to="/games" replace />;

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4">
      <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold mb-2">
        {t('nav.battles')}
      </h1>

      {/* ─── Simulateur de bataille ─── */}
      <BattleSimulator
        attacker={simAttacker}
        defender={simDefender}
        territory={simTerritory}
        troops={simTroops}
        dial={simDial}
        factionsInPlay={game.factionsInPlay}
        analysis={analysis}
        onAttackerChange={setSimAttacker}
        onDefenderChange={setSimDefender}
        onTerritoryChange={setSimTerritory}
        onTroopsChange={setSimTroops}
        onDialChange={setSimDial}
      />

    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Battle simulator sub-component
// ──────────────────────────────────────────────────────────

interface BattleSimulatorProps {
  attacker: FactionId;
  defender: FactionId;
  territory: string;
  troops: number;
  dial: number;
  factionsInPlay: FactionId[];
  analysis: BattleAnalysis | null;
  onAttackerChange: (id: FactionId) => void;
  onDefenderChange: (id: FactionId) => void;
  onTerritoryChange: (id: string) => void;
  onTroopsChange: (n: number) => void;
  onDialChange: (n: number) => void;
}

const BattleSimulator = ({
  attacker,
  defender,
  territory,
  troops,
  dial,
  factionsInPlay,
  analysis,
  onAttackerChange,
  onDefenderChange,
  onTerritoryChange,
  onTroopsChange,
  onDialChange,
}: BattleSimulatorProps) => {
  return (
    <Card
      variant="highlight"
      title={
        <span className="flex items-center gap-2">
          <Brain size={14} /> Simulateur Mentat
        </span>
      }
      subtitle="Analyse stratégique avant engagement"
    >
      {/* Inputs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <Select
          label="Attaquant"
          value={attacker}
          onChange={(e) => onAttackerChange(e.target.value as FactionId)}
        >
          {factionsInPlay.map((id) => (
            <option key={id} value={id}>
              {FACTIONS[id].shortName}
            </option>
          ))}
        </Select>
        <Select
          label="Défenseur"
          value={defender}
          onChange={(e) => onDefenderChange(e.target.value as FactionId)}
        >
          {factionsInPlay.map((id) => (
            <option key={id} value={id}>
              {FACTIONS[id].shortName}
            </option>
          ))}
        </Select>
        <Select
          label="Territoire"
          value={territory}
          onChange={(e) => onTerritoryChange(e.target.value)}
          className="lg:col-span-1 col-span-2"
        >
          {TERRITORIES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Input
          label="Troupes engagées"
          type="number"
          min={0}
          value={troops}
          onChange={(e) => onTroopsChange(parseInt(e.target.value, 10) || 0)}
        />
        <Input
          label="Dial max"
          type="number"
          min={0}
          value={dial}
          onChange={(e) => onDialChange(parseInt(e.target.value, 10) || 0)}
        />
      </div>

      {!analysis ? (
        <p className="text-xs text-atreides-silverMuted text-center py-4">
          Renseignez les paramètres de bataille pour obtenir une analyse.
        </p>
      ) : (
        <AnalysisDisplay analysis={analysis} />
      )}
    </Card>
  );
};

// ──────────────────────────────────────────────────────────

const AnalysisDisplay = ({ analysis }: { analysis: BattleAnalysis }) => {
  const winPct = Math.round(analysis.victoryProbability * 100);
  const winColor =
    winPct >= 70
      ? 'text-emerald-400'
      : winPct >= 45
        ? 'text-atreides-gold'
        : 'text-severity-danger';

  return (
    <div className="space-y-4">
      {/* Header : probabilité + recommandations */}
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="p-3 rounded border border-atreides-gold/30 bg-atreides-deep/50 text-center">
          <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted flex items-center justify-center gap-1">
            <Target size={11} /> Probabilité victoire
          </p>
          <p className={cn('font-display text-3xl tabular-nums mt-1', winColor)}>
            {winPct}%
          </p>
        </div>
        <div className="p-3 rounded border border-atreides-gold/30 bg-atreides-deep/50">
          <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted flex items-center gap-1 mb-1">
            <Crown size={11} /> Leader recommandé
          </p>
          {analysis.recommendedLeader ? (
            <>
              <p className="text-sm font-serif text-atreides-silver">
                {analysis.recommendedLeader.leaderName}{' '}
                <span className="text-atreides-gold text-xs">
                  val {analysis.recommendedLeader.leaderValue}
                </span>
              </p>
              <p className="text-[10px] text-atreides-silverMuted mt-1 line-clamp-2">
                {analysis.recommendedLeader.rationale}
              </p>
            </>
          ) : (
            <p className="text-xs text-atreides-silverMuted italic">
              Aucun leader vivant.
            </p>
          )}
        </div>
        <div className="p-3 rounded border border-atreides-gold/30 bg-atreides-deep/50">
          <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted flex items-center gap-1 mb-1">
            <Target size={11} /> Dial recommandé
          </p>
          <p className="font-display text-2xl text-atreides-gold tabular-nums">
            {analysis.recommendedDial.dial}
          </p>
          <p className="text-[10px] text-atreides-silverMuted mt-1 line-clamp-2">
            {analysis.recommendedDial.rationale}
          </p>
        </div>
      </div>

      {/* Verdict */}
      <div
        className={cn(
          'p-3 rounded border',
          winPct >= 70
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : winPct >= 45
              ? 'border-atreides-gold/30 bg-atreides-gold/5'
              : 'border-severity-danger/40 bg-severity-danger/5',
        )}
      >
        <p className="text-[11px] font-display uppercase tracking-wider text-atreides-silverMuted mb-1">
          Verdict Mentat
        </p>
        <p className="text-sm text-atreides-silver leading-relaxed">
          {analysis.verdict}
        </p>
      </div>

      {/* Grille des 14 métriques */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <MetricBox
          icon={<AlertTriangle size={11} />}
          label="Risque traître"
          metric={analysis.traitorRisk}
        />
        <MetricBox
          icon={<Swords size={11} />}
          label="Arme ennemie"
          metric={analysis.enemyWeaponRisk}
        />
        <MetricBox
          icon={<ShieldAlert size={11} />}
          label="Poison / projectile"
          metric={analysis.poisonProjectileRisk}
        />
        <MetricBox
          icon={<Target size={11} />}
          label="Full dial ennemi"
          metric={analysis.fullDialProbability}
        />
        <MetricBox
          icon={<Coins size={11} />}
          label="Avantage économique"
          metric={analysis.economicAdvantage}
        />
        <MetricBox
          icon={<Coins size={11} />}
          label="Coût en épice"
          metric={analysis.spiceCost}
        />
        <MetricBox
          icon={<TrendingUp size={11} />}
          label="Trade troupe/épice"
          metric={analysis.troopSpiceTrade}
        />
        <MetricBox
          icon={<Crown size={11} />}
          label="Danger leader"
          metric={analysis.leaderDanger}
        />
        <MetricBox
          icon={<Castle size={11} />}
          label="Avantage territoire"
          metric={analysis.territoryAdvantage}
        />
        <MetricBox
          icon={<Brain size={11} />}
          label="Synergie alliance"
          metric={analysis.allianceSynergy}
        />
        <MetricBox
          icon={<AlertTriangle size={11} />}
          label="Contre-attaque"
          metric={analysis.counterAttackDanger}
        />
        <MetricBox
          icon={<TrendingUp size={11} />}
          label="Impact long terme"
          metric={analysis.longTermImpact}
        />
        <MetricBox
          icon={<Target size={11} />}
          label="Valeur stratégique"
          metric={analysis.strategicValue}
        />
      </div>

      {/* Précédents historiques similaires (kNN) */}
      {analysis.similarBattles.length > 0 && (
        <div className="p-3 rounded border border-atreides-gold/20 bg-atreides-deep/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase font-display tracking-wider text-atreides-gold flex items-center gap-1">
              <Brain size={11} /> Précédents historiques
            </p>
            {analysis.knnProbability !== null && (
              <span className="text-[10px] font-mono text-atreides-silverMuted">
                kNN : {(analysis.knnProbability * 100).toFixed(0)}% · confiance{' '}
                {(analysis.knnConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <ul className="space-y-1.5">
            {analysis.similarBattles.map(({ battle, similarity }) => {
              const winnerIsAttacker = battle.winner === battle.attackerFaction;
              return (
                <li
                  key={battle.gameId}
                  className="flex items-center gap-2 p-2 rounded bg-atreides-deep/60 border border-atreides-gold/10 text-xs"
                >
                  <span className="font-mono text-[10px] text-atreides-silverMuted shrink-0 w-12">
                    {battle.gameId.replace('GAME_', '#')}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <FactionIcon faction={battle.attackerFaction} size={16} />
                    <span className="text-[10px] text-atreides-silver">
                      {battle.attackerTroops}
                    </span>
                  </span>
                  <span className="text-atreides-silverMuted text-[10px]">vs</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <FactionIcon faction={battle.defenderFaction} size={16} />
                    <span className="text-[10px] text-atreides-silver">
                      {battle.defenderTroops}
                    </span>
                  </span>
                  <span className="flex-1 text-[10px] text-atreides-silverMuted truncate">
                    {battle.territory} · T{battle.round}
                  </span>
                  <Badge tone={winnerIsAttacker ? 'gold' : 'blue'}>
                    {winnerIsAttacker ? 'Attaquant' : 'Défenseur'} ·{' '}
                    {Math.round(battle.battleValue * 100)}%
                  </Badge>
                  <span
                    className="font-mono text-[10px] text-atreides-gold/70 shrink-0 w-12 text-right"
                    title="Similarité avec votre simulation"
                  >
                    {Math.round(similarity * 100)}%
                  </span>
                </li>
              );
            })}
          </ul>
          {analysis.knnProbability !== null && (
            <p className="text-[10px] text-atreides-silverMuted italic mt-2">
              Probabilité finale = mix heuristique ({(analysis.heuristicProbability * 100).toFixed(0)}%)
              {' '}+ moyenne pondérée des précédents (
              {(analysis.knnProbability * 100).toFixed(0)}%).
            </p>
          )}
        </div>
      )}

      {/* Cartes dangereuses */}
      {analysis.dangerousCards.length > 0 && (
        <div className="p-3 rounded border border-severity-danger/30 bg-severity-danger/5">
          <p className="text-[11px] uppercase font-display tracking-wider text-severity-danger mb-2 flex items-center gap-1">
            <ShieldAlert size={11} /> Cartes adverses dangereuses
          </p>
          <ul className="space-y-1">
            {analysis.dangerousCards.map((c) => (
              <li key={c.name} className="text-xs flex items-baseline gap-2">
                <Badge tone="red">{c.type}</Badge>
                <span className="text-atreides-silver font-serif">{c.name}</span>
                <span className="text-[10px] text-atreides-silverMuted">{c.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Camp info */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-atreides-gold/10 text-xs">
        <span className="flex items-center gap-1.5">
          <FactionIcon faction={analysis.attackerId} size={18} />
          <span style={{ color: factionTextColor(analysis.attackerId) }}>
            {FACTIONS[analysis.attackerId].shortName}
          </span>
        </span>
        <span className="font-display text-atreides-gold">VS</span>
        <span className="flex items-center gap-1.5">
          <FactionIcon faction={analysis.defenderId} size={18} />
          <span style={{ color: factionTextColor(analysis.defenderId) }}>
            {FACTIONS[analysis.defenderId].shortName}
          </span>
        </span>
        <span className="text-atreides-silverMuted">·</span>
        <span className="text-atreides-silver">
          {analysis.territory?.name ?? '—'}
        </span>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────

interface MetricBoxProps {
  icon: React.ReactNode;
  label: string;
  metric: Metric;
}

const LEVEL_TONE: Record<Metric['level'], string> = {
  low: 'border-emerald-500/30 bg-emerald-500/5',
  moderate: 'border-atreides-gold/30 bg-atreides-gold/5',
  high: 'border-orange-500/40 bg-orange-500/5',
  critical: 'border-severity-danger/50 bg-severity-danger/10',
  positive: 'border-emerald-500/40 bg-emerald-500/5',
  negative: 'border-severity-danger/40 bg-severity-danger/5',
  neutral: 'border-atreides-gold/15 bg-atreides-deep/40',
};

const LEVEL_TEXT: Record<Metric['level'], string> = {
  low: 'text-emerald-300',
  moderate: 'text-atreides-gold',
  high: 'text-orange-300',
  critical: 'text-severity-danger',
  positive: 'text-emerald-300',
  negative: 'text-severity-danger',
  neutral: 'text-atreides-silver',
};

const MetricBox = ({ icon, label, metric }: MetricBoxProps) => (
  <div className={cn('p-2 rounded border', LEVEL_TONE[metric.level])}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted flex items-center gap-1">
        {icon} {label}
      </span>
      <span className={cn('text-[11px] font-mono', LEVEL_TEXT[metric.level])}>
        {metric.label}
      </span>
    </div>
    <p className="text-[11px] text-atreides-silver/90 leading-snug">
      {metric.reason}
    </p>
  </div>
);
