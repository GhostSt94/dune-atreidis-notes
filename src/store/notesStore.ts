import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import type { Note } from '@/types/note';

interface NotesStore {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  clearForGame: (gameId: string) => void;
  notesForGame: (gameId: string) => Note[];
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (note) => {
        const created: Note = {
          ...note,
          id: newId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ notes: [created, ...s.notes] }));
        return created;
      },

      updateNote: (id, patch) => {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
        }));
      },

      deleteNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      },

      togglePin: (id) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now() } : n,
          ),
        }));
      },

      clearForGame: (gameId) => {
        set((s) => ({ notes: s.notes.filter((n) => n.gameId !== gameId) }));
      },

      notesForGame: (gameId) => get().notes.filter((n) => n.gameId === gameId),
    }),
    { name: 'dune.notes' },
  ),
);
