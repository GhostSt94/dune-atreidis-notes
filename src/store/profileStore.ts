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

const defaultProfile = (): Profile => ({
  id: newId(),
  pseudo: "Muad'Dib",
  housePrefix: 'Duke',
  createdAt: now(),
});

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile(),
      setProfile: (pseudo, housePrefix) =>
        set({
          profile: { id: newId(), pseudo, housePrefix, createdAt: now() },
        }),
      clearProfile: () => set({ profile: defaultProfile() }),
    }),
    { name: 'dune.profile' },
  ),
);
