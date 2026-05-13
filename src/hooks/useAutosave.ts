import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export const useAutosave = (deps: unknown[]): { saving: boolean; lastSaved: number | null } => {
  const toastEnabled = useSettingsStore((s) => s.autosaveToast);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!toastEnabled) return;
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSaving(false);
      setLastSaved(Date.now());
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { saving, lastSaved };
};
