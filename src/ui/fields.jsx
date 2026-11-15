import { forwardRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { cx } from './primitives';
import { formatDate } from '../lib';

/** Label + control + inline error. `id` ties the label to the control. */
export function Field({ label, error, hint, children, id, className, aside }) {
  return (
    <div className={cx('space-y-1.5', className)} data-field={id}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={id} className="text-xs font-medium tracking-wide text-mute">
              {label}
            </label>
          )}
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[12px] font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] font-light text-mute/50">{hint}</p>
      )}
    </div>
  );
}

/** Text input in the TripFlow style, with an optional leading icon and trailing unit. */
export const Input = forwardRef(function Input({ icon: Icon, unit, error, className, ...props }, ref) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute/40" strokeWidth={1.5} />}
      <input
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className={cx('field', Icon && 'pr-10', unit && 'pl-10', error && 'field-error animate-shake', className)}
        {...props}
      />
      {unit && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-mute/50">{unit}</span>}
    </div>
  );
});

export const TextArea = forwardRef(function TextArea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cx('field min-h-[88px] resize-none leading-relaxed', className)} {...props} />;
});

/**
 * Native date picker under a styled dd/mm/yyyy face, so it looks the same on iOS and Android and never
 * overflows its box (iOS date inputs ignore width in RTL layouts).
 */
export function DateInput({ id, value, onChange, min, placeholder = 'בחר תאריך' }) {
  return (
    <div className="relative h-[50px] w-full min-w-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px] border border-line bg-white shadow-inset">
        <span className={cx('absolute inset-y-0 left-3.5 right-10 flex items-center truncate text-base', value ? 'text-ink' : 'text-mute/35')}>
          {value ? formatDate(value) : placeholder}
        </span>
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-mute/50 hover:bg-canvas"
          aria-label="נקה תאריך"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      ) : (
        <Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute/40" strokeWidth={1.5} />
      )}
      <input
        id={id}
        type="date"
        value={value || ''}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full min-w-0 cursor-pointer opacity-0"
        style={{ fontSize: 16, boxSizing: 'border-box' }}
      />
    </div>
  );
}
