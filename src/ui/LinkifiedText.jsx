import { splitLinks } from '@/domain/links';

/** Text with any web addresses turned into tappable links (open in a new tab / the browser). */
export function LinkifiedText({ text, className }) {
  return (
    <span className={className}>
      {splitLinks(text).map((p, i) =>
        p.href ? (
          <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" dir="ltr" className="break-all font-medium text-accent underline decoration-accent/40 underline-offset-2">
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}
