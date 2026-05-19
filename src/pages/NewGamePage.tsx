import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { bootstrapGame, useCurrentGame, useGameStore } from '@/store';
import { FACTIONS, FACTION_IDS, factionTextColor } from '@/data/factions';
import type { FactionId } from '@/types/faction';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { FactionIcon } from '@/components/icons/FactionIcon';
import { useT } from '@/i18n';

export const NewGamePage = () => {
  const t = useT();
  const [factions, setFactions] = useState<Set<FactionId>>(new Set(FACTION_IDS));
  const createGame = useGameStore((s) => s.createGame);
  const currentGame = useCurrentGame();
  const navigate = useNavigate();

  const toggleFaction = (id: FactionId) => {
    if (id === 'atreides') return;
    setFactions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      next.add('atreides');
      return next;
    });
  };

  const submit = () => {
    if (factions.size < 2) return;
    const factionsArr = Array.from(factions);
    const name = t('newGame.autoName', { date: new Date().toISOString().slice(0, 10) });
    const id = createGame({
      name,
      playerCount: factionsArr.length,
      factionsInPlay: factionsArr,
      playerFaction: 'atreides',
    });
    bootstrapGame(id, factionsArr);
    navigate('/game');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-10">
      <div className="mb-6 flex items-center gap-3">
        {currentGame && (
          <button
            onClick={() => navigate('/')}
            className="text-atreides-silverMuted hover:text-atreides-gold"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className="font-display uppercase tracking-widest text-atreides-gold">
          {t('newGame.title')}
        </h1>
      </div>

      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[11px] font-display uppercase tracking-wider text-atreides-silverMuted">
            {t('newGame.factionsLabel')}
          </span>
          <span className="text-[11px] font-mono text-atreides-gold/80">
            {factions.size}/{FACTION_IDS.length}
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          {FACTION_IDS.map((id) => {
            const meta = FACTIONS[id];
            const active = factions.has(id);
            const isPlayer = id === 'atreides';
            return (
              <button
                key={id}
                onClick={() => toggleFaction(id)}
                disabled={isPlayer}
                className={cn(
                  'p-3 rounded-md border text-left transition-all',
                  active
                    ? 'border-atreides-gold/60 bg-atreides-blue/10'
                    : 'border-atreides-gold/15 opacity-50 hover:opacity-80',
                  isPlayer && 'ring-1 ring-atreides-gold/40',
                )}
                style={
                  active
                    ? { borderColor: id === 'harkonnen' ? 'rgba(255,255,255,0.45)' : `${meta.color}99` }
                    : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FactionIcon faction={id} size={24} />
                    <span className="font-serif text-sm" style={{ color: factionTextColor(id) }}>
                      {t(`faction.${id}.short`)}
                    </span>
                  </div>
                  {isPlayer && (
                    <span className="text-[10px] font-mono text-atreides-gold uppercase">
                      {t('newGame.you')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-atreides-silverMuted mt-1 italic">
                  {t(`faction.${id}.motto`)}
                </p>
              </button>
            );
          })}
        </motion.div>

        {factions.size < 2 && (
          <p className="mt-3 text-[11px] text-severity-warning font-mono">
            {t('newGame.minFactionsHint')}
          </p>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-atreides-gold/10">
          <Button
            variant="gold"
            onClick={submit}
            disabled={factions.size < 2}
            rightIcon={<Check size={14} />}
          >
            {t('newGame.startButton')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
