import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Trash2, Swords } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBattlesStore, useCurrentGame } from '@/store';
import { FACTIONS } from '@/data/factions';
import { TERRITORIES } from '@/data/territories';
import type { FactionId } from '@/types/faction';
import type { BattleOutcome } from '@/types/battle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FactionPill } from '@/components/ui/FactionPill';

const schema = z.object({
  territory: z.string().min(1),
  attacker: z.string(),
  defender: z.string(),
  attackerTroops: z.coerce.number().int().min(0),
  defenderTroops: z.coerce.number().int().min(0),
  outcome: z.enum(['attacker_win', 'defender_win', 'pending']),
  attackerLosses: z.coerce.number().int().min(0),
  defenderLosses: z.coerce.number().int().min(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const BattlesPage = () => {
  const game = useCurrentGame();
  const battles = useBattlesStore((s) => s.battles);
  const addBattle = useBattlesStore((s) => s.addBattle);
  const deleteBattle = useBattlesStore((s) => s.deleteBattle);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      territory: 'arrakeen',
      attacker: 'atreides',
      defender: 'harkonnen',
      attackerTroops: 1,
      defenderTroops: 1,
      attackerLosses: 0,
      defenderLosses: 0,
      outcome: 'pending',
      notes: '',
    },
  });

  if (!game) return <Navigate to="/games" replace />;

  const list = battles.filter((b) => b.gameId === game.id).sort((a, b) => b.createdAt - a.createdAt);

  const onSubmit = (d: FormData) => {
    addBattle(
      {
        gameId: game.id,
        turn: game.currentTurn,
        territory: d.territory,
        attacker: d.attacker as FactionId,
        defender: d.defender as FactionId,
        attackerTroops: d.attackerTroops,
        defenderTroops: d.defenderTroops,
        attackerCardsPlayed: [],
        defenderCardsPlayed: [],
        outcome: d.outcome as BattleOutcome,
        attackerLosses: d.attackerLosses,
        defenderLosses: d.defenderLosses,
        notes: d.notes ?? '',
      },
      game.currentPhase,
    );
    reset();
    setOpen(false);
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
          Batailles
        </h1>
        <Button variant="gold" leftIcon={<Plus size={14} />} onClick={() => setOpen(true)}>
          Consigner un combat
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Swords size={28} />}
            title="Aucun combat enregistré"
            description="Consignez chaque bataille pour analyser les tendances de force."
          />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {list.map((b) => {
            const terr = TERRITORIES.find((t) => t.id === b.territory)?.name ?? b.territory;
            return (
              <Card key={b.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display uppercase tracking-wider text-sm text-atreides-gold">
                    {terr}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">Tour {b.turn}</Badge>
                    <Badge
                      tone={
                        b.outcome === 'attacker_win'
                          ? 'gold'
                          : b.outcome === 'defender_win'
                            ? 'blue'
                            : 'neutral'
                      }
                    >
                      {b.outcome === 'attacker_win'
                        ? 'Attaquant victorieux'
                        : b.outcome === 'defender_win'
                          ? 'Défenseur tient'
                          : 'En cours'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase font-mono text-atreides-silverMuted">
                      Attaquant
                    </p>
                    <FactionPill id={b.attacker} />
                    <p className="text-atreides-silver mt-1 font-mono text-xs">
                      {b.attackerTroops} troupes · {b.attackerLosses} pertes
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono text-atreides-silverMuted">
                      Défenseur
                    </p>
                    <FactionPill id={b.defender} />
                    <p className="text-atreides-silver mt-1 font-mono text-xs">
                      {b.defenderTroops} troupes · {b.defenderLosses} pertes
                    </p>
                  </div>
                </div>
                {b.notes && (
                  <p className="text-xs text-atreides-silver/80 mt-3 italic border-t border-atreides-gold/10 pt-2">
                    {b.notes}
                  </p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => deleteBattle(b.id)}
                    className="text-atreides-silverMuted hover:text-severity-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle bataille" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <Select label="Territoire" {...register('territory')} className="col-span-2">
            {TERRITORIES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select label="Attaquant" {...register('attacker')}>
            {game.factionsInPlay.map((id) => (
              <option key={id} value={id}>
                {FACTIONS[id].shortName}
              </option>
            ))}
          </Select>
          <Select label="Défenseur" {...register('defender')}>
            {game.factionsInPlay.map((id) => (
              <option key={id} value={id}>
                {FACTIONS[id].shortName}
              </option>
            ))}
          </Select>
          <Input
            label="Troupes attaquant"
            type="number"
            {...register('attackerTroops')}
            error={formState.errors.attackerTroops?.message}
          />
          <Input
            label="Troupes défenseur"
            type="number"
            {...register('defenderTroops')}
            error={formState.errors.defenderTroops?.message}
          />
          <Input label="Pertes attaquant" type="number" {...register('attackerLosses')} />
          <Input label="Pertes défenseur" type="number" {...register('defenderLosses')} />
          <Select label="Issue" {...register('outcome')} className="col-span-2">
            <option value="pending">En cours</option>
            <option value="attacker_win">Attaquant victorieux</option>
            <option value="defender_win">Défenseur tient</option>
          </Select>
          <Textarea label="Notes" {...register('notes')} className="col-span-2" rows={3} />
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gold">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
