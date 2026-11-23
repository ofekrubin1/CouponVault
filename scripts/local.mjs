// The local test environment, in one command: `npm run local`.
// Starts Firebase emulators on this computer (firebase.local.json), fills them with fictional users and coupons,
// and serves the app on port 5175 in "sandbox" mode, which talks only to those emulators, never to production.
// "Sign in with Google" there signs straight in as the test user. Everything starts fresh on each run.
// Ctrl+C stops it all.
import { spawn, execSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { seedLocal } from './seed-local.mjs';

const PORT = 5175;
const children = [];

function run(cmd, onLine) {
  const child = spawn(cmd, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child);
  const feed = (buf) => String(buf).split(/\r?\n/).filter(Boolean).forEach((l) => onLine?.(l));
  child.stdout.on('data', feed);
  child.stderr.on('data', feed);
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`\n✖ "${cmd.split(' ').slice(0, 3).join(' ')}…" stopped (code ${code}). Shutting down.`);
      stop(1);
    }
  });
  return child;
}

let stopping = false;
function stop(code = 0) {
  stopping = true;
  for (const c of children) {
    try {
      if (process.platform === 'win32') execSync(`taskkill /pid ${c.pid} /T /F`, { stdio: 'ignore' });
      else c.kill('SIGINT');
    } catch {
      /* already gone */
    }
  }
  process.exit(code);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

const lanAddresses = () =>
  Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);

console.log('Starting the local Firebase (test data only)…');
run('npx firebase emulators:start --config firebase.local.json --project demo-couponvault-local', async (line) => {
  if (/error|already in use/i.test(line)) console.error('  firebase:', line);
  if (!line.includes('All emulators ready')) return;
  try {
    const r = await seedLocal();
    console.log(`Loaded ${r.users} test users and ${r.coupons} fictional coupons.`);
  } catch (e) {
    console.error('Could not load the test data:', e.message);
    return stop(1);
  }
  run(`npx vite --mode sandbox --host --port ${PORT} --strictPort`, (l) => {
    if (/error/i.test(l)) console.error('  vite:', l);
    if (!l.includes('ready in')) return;
    console.log(`\nTest environment ready (fictional data, not production):`);
    console.log(`  On this computer:  http://localhost:${PORT}`);
    for (const ip of lanAddresses()) console.log(`  From a phone:      http://${ip}:${PORT}`);
    console.log('\n"Sign in with Google" signs in as "משתמש בדיקה". Ctrl+C to stop.');
  });
});
