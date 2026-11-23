import { Input, Switch } from '@/ui';

/**
 * Optional 3-digit verification code (like a credit card's), behind an on/off switch. `aside` sits on the left
 * of the switch row (the digital / physical choice); the code field opens on the line below.
 */
export function CvvField({ on, onToggle, value, onChange, error, aside }) {
  return (
    <div data-field="cvv">
      <div className="flex min-h-[40px] items-center justify-between gap-2">
        <label className="flex shrink-0 items-center gap-2 text-xs font-medium tracking-wide text-mute">
          <Switch checked={on} onChange={onToggle} label="קוד אימות" />
          קוד אימות
          <span className="font-light text-mute/45">(לא חובה)</span>
        </label>
        {aside}
      </div>
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
          className="mt-2 w-[8rem] text-center font-mono tracking-[0.35em] placeholder:font-sans placeholder:tracking-normal"
        />
      )}
      {error && (
        <p role="alert" className="mt-1 text-[12px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
