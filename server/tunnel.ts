import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let activeUrl: string | null = null;

async function verifyPublicUrl(url: string): Promise<boolean> {
  console.log(`\nVerifying global public HTTPS reachability for: ${url} ...`);
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`${url}/api/auth/status`, {
        headers: { 'User-Agent': 'ProjectDrive-Public-Verifier' },
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[Attempt ${attempt}] ✓ Live verification succeeded! HTTP ${res.status}`);
        console.log(`[Attempt ${attempt}] ✓ Backend API Response:`, data);
        return true;
      }
    } catch (err: any) {
      console.log(`[Attempt ${attempt}] Verifying connection... (${err.message || 'Connecting'})`);
    }
  }
  return false;
}

function startSshTunnel() {
  console.log('=================================================================');
  console.log('🚀 ProjectDrive Public HTTPS Gateway Service');
  console.log('=================================================================\n');
  console.log('Establishing secure public HTTPS tunnel for local port 3001...');

  const sshArgs = [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
    '-o', 'ExitOnForwardFailure=yes',
    '-R', '80:127.0.0.1:3001',
    'serveo.net',
  ];

  const sshProc = spawn('ssh.exe', sshArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  sshProc.stdout.on('data', async (data) => {
    const output = data.toString();
    console.log(output.trim());

    // Search for https URL in output
    const match = output.match(/https:\/\/[a-zA-Z0-9.-]+\.serveousercontent\.com|https:\/\/[a-zA-Z0-9.-]+\.serveo\.net/);
    if (match && match[0] && match[0] !== activeUrl) {
      activeUrl = match[0];
      console.log('\n=================================================================');
      console.log('✅ PUBLIC HTTPS ACCESS GRANTED!');
      console.log('-----------------------------------------------------------------');
      console.log(`🌐 ProjectDrive URL: ${activeUrl}`);
      console.log('=================================================================\n');

      fs.writeFileSync(path.join(DATA_DIR, 'public_url.txt'), activeUrl, 'utf8');

      const isVerified = await verifyPublicUrl(activeUrl);
      if (isVerified) {
        console.log('\n🎉 Global Public Accessibility Verified! ProjectDrive is live worldwide.\n');
      }
    }
  });

  sshProc.stderr.on('data', (data) => {
    const errText = data.toString().trim();
    if (!errText.includes('Warning: Permanently added') && !errText.includes('Pseudo-terminal')) {
      console.error('[Tunnel Log]:', errText);
    }
  });

  sshProc.on('close', (code) => {
    console.log(`Tunnel process exited with code ${code}. Reconnecting in 5 seconds...`);
    setTimeout(startSshTunnel, 5000);
  });

  sshProc.on('error', (err) => {
    console.error('Tunnel process error:', err.message);
  });

  process.on('SIGINT', () => {
    sshProc.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    sshProc.kill();
    process.exit(0);
  });
}

startSshTunnel();
