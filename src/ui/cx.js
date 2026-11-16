/** Join class names, skipping falsy ones. */
export const cx = (...a) => a.filter(Boolean).join(' ');
