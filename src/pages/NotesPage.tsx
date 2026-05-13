import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Pin, Trash2, Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrentGame, useNotesStore } from '@/store';
import type { NoteCategory, NotePriority } from '@/types/note';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { relativeTime } from '@/lib/date';

const CATEGORIES: { id: NoteCategory; label: string }[] = [
  { id: 'enemy_plan', label: 'Plan ennemi' },
  { id: 'traitor', label: 'Traîtrise' },
  { id: 'leader', label: 'Leader' },
  { id: 'battle', label: 'Bataille' },
  { id: 'alliance', label: 'Alliance' },
  { id: 'revealed_info', label: 'Info révélée' },
  { id: 'mentat', label: 'Mentat' },
  { id: 'spice_economy', label: 'Économie' },
];

const priorityTone: Record<NotePriority, 'neutral' | 'gold' | 'red'> = {
  low: 'neutral',
  medium: 'gold',
  high: 'red',
  critical: 'red',
};

export const NotesPage = () => {
  const game = useCurrentGame();
  const notes = useNotesStore((s) => s.notes);
  const addNote = useNotesStore((s) => s.addNote);
  const togglePin = useNotesStore((s) => s.togglePin);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const updateNote = useNotesStore((s) => s.updateNote);

  const [filter, setFilter] = useState<NoteCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    body: '',
    category: 'enemy_plan' as NoteCategory,
    priority: 'medium' as NotePriority,
  });

  if (!game) return <Navigate to="/games" replace />;

  const filtered = useMemo(
    () =>
      notes
        .filter((n) => n.gameId === game.id)
        .filter((n) => (filter === 'all' ? true : n.category === filter))
        .filter((n) =>
          search.trim()
            ? (n.title + n.body).toLowerCase().includes(search.toLowerCase())
            : true,
        )
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [notes, game.id, filter, search],
  );

  const submitDraft = () => {
    if (!draft.title.trim() && !draft.body.trim()) return;
    addNote({
      gameId: game.id,
      category: draft.category,
      title: draft.title.trim() || draft.body.slice(0, 60),
      body: draft.body.trim(),
      priority: draft.priority,
      factionTags: [],
      pinned: false,
    });
    setDraft({ title: '', body: '', category: 'enemy_plan', priority: 'medium' });
    setDraftOpen(false);
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
          Notes stratégiques
        </h1>
        <Button variant="gold" leftIcon={<Plus size={14} />} onClick={() => setDraftOpen(true)}>
          Nouvelle note
        </Button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <Card title="Filtres">
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-atreides-silverMuted"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-7"
              />
            </div>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as never)}>
              <option value="all">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <EmptyState title="Aucune note" description="Commencez à consigner vos observations." />
            </Card>
          ) : (
            filtered.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card variant={n.pinned ? 'highlight' : 'default'}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge tone="neutral">
                          {CATEGORIES.find((c) => c.id === n.category)?.label}
                        </Badge>
                        <Badge tone={priorityTone[n.priority]}>{n.priority}</Badge>
                        <span className="text-[10px] text-atreides-silverMuted font-mono">
                          {relativeTime(n.updatedAt)}
                        </span>
                      </div>
                      <input
                        className="bg-transparent w-full text-sm text-atreides-silver font-display tracking-wide outline-none mb-1"
                        defaultValue={n.title}
                        onBlur={(e) =>
                          e.target.value !== n.title && updateNote(n.id, { title: e.target.value })
                        }
                      />
                      <textarea
                        className="bg-transparent w-full text-xs text-atreides-silver/90 outline-none leading-relaxed resize-y min-h-[40px]"
                        defaultValue={n.body}
                        onBlur={(e) =>
                          e.target.value !== n.body && updateNote(n.id, { body: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => togglePin(n.id)}
                        className={
                          n.pinned
                            ? 'text-atreides-gold'
                            : 'text-atreides-silverMuted hover:text-atreides-gold'
                        }
                        title="Épingler"
                      >
                        <Pin size={14} />
                      </button>
                      <button
                        onClick={() => deleteNote(n.id)}
                        className="text-atreides-silverMuted hover:text-severity-danger"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <Modal open={draftOpen} onClose={() => setDraftOpen(false)} title="Nouvelle note" size="lg">
        <div className="space-y-3">
          <Input
            label="Titre"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Mise élevée Harkonnen"
          />
          <Textarea
            label="Contenu"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            rows={5}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Catégorie"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as NoteCategory })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Select
              label="Priorité"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value as NotePriority })}
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Élevée</option>
              <option value="critical">Critique</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDraftOpen(false)}>
              Annuler
            </Button>
            <Button variant="gold" onClick={submitDraft}>
              Consigner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
