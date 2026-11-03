/**
 * `npm run admin:create -- --email <email>` (AD-9): buat akun admin atau perbarui password-nya
 * (idempoten, aman di produksi). Password diminta sekali: di terminal tanpa ditampilkan,
 * di non-TTY dibaca dari baris pertama stdin. Keluaran tidak memuat email maupun password.
 */
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { run, withServices } from './cli.js';

const USAGE = 'Gunakan: npm run admin:create -- --email <email>';

function readFirstLine(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, terminal: false });
    let done = false;
    const finish = (line: string): void => {
      if (done) return;
      done = true;
      rl.close();
      resolve(line);
    };
    rl.once('line', (line) => finish(line));
    rl.once('close', () => finish(''));
  });
}

function readHiddenLine(prompt: string): Promise<string> {
  const stdin = process.stdin;
  process.stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const cleanup = (): void => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
    };
    function onData(chunk: string): void {
      for (const char of chunk) {
        if (char === '\r' || char === '\n' || char === '\u0004') {
          cleanup();
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          cleanup();
          reject(new Error('Dibatalkan.'));
          return;
        }
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    }
    stdin.on('data', onData);
  });
}

run(async () => {
  let email: string | undefined;
  try {
    ({ values: { email } } = parseArgs({ options: { email: { type: 'string' } }, strict: true }));
  } catch {
    email = undefined;
  }
  if (email === undefined || email.trim() === '') {
    console.error(USAGE);
    process.exit(1);
  }

  const password = process.stdin.isTTY ? await readHiddenLine('Password: ') : await readFirstLine();
  const { created } = await withServices((services) => services.auth.upsertAdmin({ email, password }));
  console.log(created ? 'Akun admin dibuat.' : 'Password akun admin diperbarui.');
});
