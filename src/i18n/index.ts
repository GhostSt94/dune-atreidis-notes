import en from './en.json';
import fr from './fr.json';
import { useSettingsStore, type Lang } from '@/store/settingsStore';

export type { Lang };

type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = { en: en as Dict, fr: fr as Dict };

export const translate = (
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string => {
  const raw = dicts[lang]?.[key] ?? dicts.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v !== undefined && v !== null ? String(v) : `{${k}}`;
  });
};

export const useT = () => {
  const lang = useSettingsStore((s) => s.language);
  return (key: string, vars?: Record<string, string | number>): string =>
    translate(lang, key, vars);
};
