import { Input, Switch } from '@/ui';

/** Optional 3-digit verification code (like a credit card's), behind an on/off switch. */
export function CvvField({ on, onToggle, value, onChange, error }) {
  return (
    <div data-field="cvv">
      <div className="flex min-h-[46px] items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-xs font-medium tracking-wide text-mute">
          <Switch checked={on} onChange={onToggle} label="קוד אימות" />
          קוד אימות
          <span className="font-light text-mute/45">(לא חובה)</span>
        </label>
        {on && (
          <Input
            id="cvv"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            // digits only, at most 3 (no maxLength: a pasted "4a07" must be filtered before it's cut)
            onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="3 ספרות"
            aria-label="קוד אימות (3 ספרות)"
            error={error}
            className="w-[8rem] text-center font-mono tracking-[0.35em] placeholder:font-sans placeholder:tracking-normal"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-left text-[12px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
