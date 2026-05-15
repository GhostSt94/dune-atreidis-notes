import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfileStore } from '@/store';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AtreidesIcon } from '@/components/icons/FactionIcon';
import { useT } from '@/i18n';

export const LoginPage = () => {
  const t = useT();
  const [pseudo, setPseudo] = useState('');
  const [prefix, setPrefix] = useState<'Duke' | 'Count' | 'Baron' | 'Lord' | 'Lady'>('Duke');
  const setProfile = useProfileStore((s) => s.setProfile);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) return;
    setProfile(pseudo.trim(), prefix);
    navigate('/games');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-starfield">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-atreides-night/90 border border-atreides-gold/30 rounded-xl shadow-panel backdrop-blur-md p-8"
      >
        <div className="text-center mb-6">
          <AtreidesIcon
            width={80}
            height={80}
            className="mx-auto mb-3 drop-shadow-[0_0_16px_rgba(212,164,55,0.4)]"
          />
          <h1 className="font-display text-xl uppercase tracking-[0.3em] text-atreides-gold">
            Atreides Command
          </h1>
          <p className="text-xs text-atreides-silverMuted mt-2 font-mono">
            // Imperial strategic terminal
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Select
            label={t('login.title')}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value as typeof prefix)}
          >
            <option value="Duke">Duke</option>
            <option value="Count">Count</option>
            <option value="Baron">Baron</option>
            <option value="Lord">Lord</option>
            <option value="Lady">Lady</option>
          </Select>
          <Input
            label={t('login.nobleName')}
            placeholder="Leto"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            autoFocus
          />
          <Button type="submit" variant="gold" size="lg" className="mt-2">
            {t('login.enter')}
          </Button>
        </div>

        <p className="text-[10px] text-center text-atreides-silverMuted/70 mt-6 italic">
          « Le sommeil est bon, et la mort est meilleure, mais le mieux serait de n&apos;être
          jamais né. »
        </p>
      </motion.form>
    </div>
  );
};
