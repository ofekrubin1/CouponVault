// Invite links (/?join=CODE): read once at startup, remembered across the Google sign-in, then cleared.
const KEY = 'joinCode';

export function readJoinLink() {
  const code = new URLSearchParams(window.location.search).get('join');
  if (code) {
    sessionStorage.setItem(KEY, code.toUpperCase());
    window.history.replaceState(null, '', window.location.pathname);
  }
  return sessionStorage.getItem(KEY) || '';
}

export const clearJoinLink = () => sessionStorage.removeItem(KEY);
