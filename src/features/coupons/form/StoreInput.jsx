import { useMemo, useState } from 'react';
import { Store } from 'lucide-react';
import { Input } from '@/ui';

/** Store field that suggests stores already used in the family. */
export function StoreInput({ value, onChange, stores, error }) {
  const [focus, setFocus] = useState(false);
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    return stores.filter((s) => s.toLowerCase() !== q && (!q || s.toLowerCase().includes(q))).slice(0, 6);
  }, [stores, value]);

  return (
    <>
      <Input
        id="store"
        icon={Store}
        className="!py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder="למשל: שופרסל, Buyme, כל רשתות האופנה"
        error={error}
        autoComplete="off"
      />
      {focus && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1" data-testid="store-suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(s)}
              className="rounded-[10px] border border-white/80 bg-white/55 px-2.5 py-1 text-xs text-mute"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
