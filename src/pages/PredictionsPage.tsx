import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, Plus, Trash2, Check, X } from 'lucide-react';
import { useCurrentGame, usePredictionsStore } from '@/store';
import { FACTIONS } from '@/data/factions';
import type { FactionId } from '@/types/faction';
import type { PredictionConfidence } from '@/types/prediction';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { FactionPill } from '@/components/ui/FactionPill';
import { EmptyState } from '@/components/ui/EmptyState';

export const PredictionsPage = () => {
  const game = useCurrentGame();
  const predictions = usePredictionsStore((s) => (game ? s.forGame(game.id) : []));
  const add = usePredictionsStore((s) => s.addPrediction);
  const resolve = usePredictionsStore((s) => s.resolvePrediction);
  const remove = usePredictionsStore((s) => s.removePrediction);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    predictedFaction: 'harkonnen' as FactionId,
    predictedTurn: 5,
    confidence: 'medium' as PredictionConfidence,
    reasoning: '',
  });

  if (!game) return <Navigate to="/games" replace />;

  const submit = () => {
    add({ ...draft, gameId: game.id });
    setOpen(false);
    setDraft({
      predictedFaction: 'harkonnen',
      predictedTurn: game.currentTurn + 2,
      confidence: 'medium',
      reasoning: '',
    });
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="text-atreides-gold" />
          <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
            Prédictions Bene Gesserit
          </h1>
        </div>
        <Button variant="gold" leftIcon={<Plus size={14} />} onClick={() => setOpen(true)}>
          Nouvelle suspicion
        </Button>
      </div>

      {predictions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Eye size={26} />}
            title="Aucune prédiction enregistrée"
            description="Notez vos hypothèses sur la prophétie BG."
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {predictions.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <FactionPill id={p.predictedFaction} />
                <Badge tone="gold">Tour {p.predictedTurn}</Badge>
              </div>
              <p className="text-[11px] text-atreides-silverMuted font-mono mb-1">
                Confiance : {p.confidence}
              </p>
              <p className="text-xs text-atreides-silver leading-relaxed">{p.reasoning}</p>
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-atreides-gold/10">
                {p.resolved ? (
                  <Badge tone={p.correct ? 'gold' : 'red'}>
                    {p.correct ? 'Correcte' : 'Fausse'}
                  </Badge>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="gold"
                      leftIcon={<Check size={12} />}
                      onClick={() => resolve(p.id, true)}
                    >
                      Confirmée
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<X size={12} />}
                      onClick={() => resolve(p.id, false)}
                    >
                      Infirmée
                    </Button>
                  </>
                )}
                <button
                  onClick={() => remove(p.id)}
                  className="ml-auto text-atreides-silverMuted hover:text-severity-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle suspicion BG" size="md">
        <div className="space-y-3">
          <Select
            label="Faction prédite"
            value={draft.predictedFaction}
            onChange={(e) =>
              setDraft({ ...draft, predictedFaction: e.target.value as FactionId })
            }
          >
            {game.factionsInPlay.map((id) => (
              <option key={id} value={id}>
                {FACTIONS[id].shortName}
              </option>
            ))}
          </Select>
          <Input
            label="Tour prédit"
            type="number"
            min={1}
            value={draft.predictedTurn}
            onChange={(e) => setDraft({ ...draft, predictedTurn: parseInt(e.target.value, 10) })}
          />
          <Select
            label="Confiance"
            value={draft.confidence}
            onChange={(e) =>
              setDraft({ ...draft, confidence: e.target.value as PredictionConfidence })
            }
          >
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Élevée</option>
          </Select>
          <Textarea
            label="Raisonnement"
            value={draft.reasoning}
            onChange={(e) => setDraft({ ...draft, reasoning: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="gold" onClick={submit}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
