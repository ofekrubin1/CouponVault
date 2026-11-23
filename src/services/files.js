// Handing a file to the user: the phone's share sheet, a "save as" window, or a plain download.
// Browsers only allow the share sheet / save window right after a tap, so prepare the file first and call these
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

/** Save a file where the user chooses: a save window on a computer, the share sheet ("Save to Files") on a phone. */
export async function saveFileAs(file, { description = 'File', accept } = {}) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: file.name, ...(accept ? { types: [{ description, accept }] } : {}) });
      const out = await handle.createWritable();
      await out.write(file);
      await out.close();
      return 'saved';
    } catch (e) {
      if (cancelled(e)) return 'cancelled';
      throw e;
    }
  }
  if (canShareFile(file)) return share(file, { title: file.name });
  download(file);
  return 'saved';
}
