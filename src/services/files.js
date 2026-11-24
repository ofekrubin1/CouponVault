// Handing a file to the user: the phone's share sheet, or a plain download where there is none.
// Browsers only allow the share sheet right after a tap, so prepare the file first and call these
// straight from the click handler. Each resolves 'shared' | 'saved' | 'cancelled'.

const canShareFile = (file) => !!navigator.canShare?.({ files: [file] });
const cancelled = (e) => e?.name === 'AbortError';

function download(file) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function share(file, data) {
  try {
    await navigator.share({ files: [file], ...data });
    return 'shared';
  } catch (e) {
    if (cancelled(e)) return 'cancelled';
    throw e;
  }
}

/** Send a file to another app (WhatsApp, mail…); where that isn't possible, download it. */
export async function shareFile(file, { title, text } = {}) {
  if (canShareFile(file)) return share(file, { title, text });
  download(file);
  return 'saved';
}

