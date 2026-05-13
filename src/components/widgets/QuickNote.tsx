import { useState } from 'react';
import { StickyNote, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCurrentGame, useNotesStore } from '@/store';
import type { NoteCategory, NotePriority } from '@/types/note';

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

export const QuickNote = () => {
  const game = useCurrentGame();
  const addNote = useNotesStore((s) => s.addNote);
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<NoteCategory>('enemy_plan');
  const [priority, setPriority] = useState<NotePriority>('medium');

  if (!game) return null;

  const submit = () => {
    if (!body.trim()) return;
    addNote({
      gameId: game.id,
      category,
      title: body.split('\n')[0].slice(0, 60),
      body: body.trim(),
      priority,
      factionTags: [],
      pinned: false,
    });
    setBody('');
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <StickyNote size={14} /> Note rapide
        </span>
      }
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Harkonnen mise élevée au tour 2, peut-être une bonne carte..."
        rows={3}
      />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Select value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value as NotePriority)}>
          <option value="low">Faible</option>
          <option value="medium">Moyenne</option>
          <option value="high">Élevée</option>
          <option value="critical">Critique</option>
        </Select>
      </div>
      <Button
        size="sm"
        variant="gold"
        className="mt-3 w-full"
        onClick={submit}
        rightIcon={<Send size={12} />}
      >
        Consigner
      </Button>
    </Card>
  );
};
