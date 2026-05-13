import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bootstrapGame, useGameStore } from '@/store';
import { FACTIONS, FACTION_IDS, factionTextColor } from '@/data/factions';
import type { FactionId } from '@/types/faction';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { FactionIcon } from '@/components/icons/FactionIcon';

export const NewGamePage = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [playerCount, setPlayerCount] = useState(6);
  const [factions, setFactions] = useState<Set<FactionId>>(new Set(FACTION_IDS));
  const createGame = useGameStore((s) => s.createGame);
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

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    if (!name.trim() || factions.size < 2) return;
    const id = createGame({
      name: name.trim(),
      playerCount,
      factionsInPlay: Array.from(factions),
      playerFaction: 'atreides',
    });
    bootstrapGame(id, Array.from(factions));
    navigate('/game');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-10">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/games')}
          className="text-atreides-silverMuted hover:text-atreides-gold"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display uppercase tracking-widest text-atreides-gold">
          Nouvelle partie
        </h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        {['Identité', 'Factions', 'Confirmation'].map((label, i) => (
          <div key={label} className="flex-1 flex items-center">
            <div
              className={cn(
                'w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono',
                step >= i
                  ? 'bg-atreides-gold text-atreides-deep border-atreides-gold'
                  : 'border-atreides-gold/30 text-atreides-silverMuted',
              )}
            >
              {step > i ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={cn(
                'ml-2 text-xs font-display uppercase tracking-wider',
                step >= i ? 'text-atreides-gold' : 'text-atreides-silverMuted',
              )}
            >
              {label}
            </span>
            {i < 2 && <div className="flex-1 h-px bg-atreides-gold/15 mx-3" />}
          </div>
        ))}
      </div>

      <Card>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex flex-col gap-4"
            >
              <Input
                label="Nom de la partie"
                placeholder="Première Guerre d'Arrakis"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <Input
                label="Nombre de joueurs"
                type="number"
                min={2}
                max={6}
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value, 10) || 6)}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
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
                    style={active ? { borderColor: `${meta.color}99` } : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FactionIcon faction={id} size={24} />
                        <span className="font-serif text-sm" style={{ color: factionTextColor(id) }}>
                          {meta.shortName}
                        </span>
                      </div>
                      {isPlayer && (
                        <span className="text-[10px] font-mono text-atreides-gold uppercase">
                          Vous
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-atreides-silverMuted mt-1 italic">
                      {meta.motto}
                    </p>
                  </button>
                );
              })}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted">
                    Nom
                  </p>
                  <p className="text-atreides-silver">{name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted">
                    Joueurs
                  </p>
                  <p className="text-atreides-silver">{playerCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted">
                    Factions ({factions.size})
                  </p>
                  <p className="text-atreides-silver">
                    {Array.from(factions)
                      .map((f) => FACTIONS[f].shortName)
                      .join(' · ')}
                  </p>
                </div>
                <div className="mt-4 p-3 rounded bg-atreides-blue/10 border border-atreides-gold/20">
                  <p className="text-xs text-atreides-gold font-display uppercase tracking-wider mb-1">
                    Avantage Atreides
                  </p>
                  <p className="text-[12px] text-atreides-silver leading-relaxed">
                    {FACTIONS.atreides.specialAbility}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-4 border-t border-atreides-gold/10">
          <Button variant="ghost" onClick={back} disabled={step === 0} leftIcon={<ArrowLeft size={14} />}>
            Précédent
          </Button>
          {step < 2 ? (
            <Button
              variant="primary"
              onClick={next}
              disabled={(step === 0 && !name.trim()) || (step === 1 && factions.size < 2)}
              rightIcon={<ArrowRight size={14} />}
            >
              Suivant
            </Button>
          ) : (
            <Button variant="gold" onClick={submit} rightIcon={<Check size={14} />}>
              Lancer la partie
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
