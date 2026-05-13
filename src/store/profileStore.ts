import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import type { Profile } from '@/types/profile';

interface ProfileStore {
  profile: Profile | null;
  setProfile: (pseudo: string, housePrefix: Profile['housePrefix']) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (pseudo, housePrefix) =>
        set({
          profile: { id: newId(), pseudo, housePrefix, createdAt: now() },
        }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: 'dune.profile' },
  ),
);
