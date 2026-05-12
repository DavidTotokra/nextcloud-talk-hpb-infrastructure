const { chromium } = require('playwright');

const TALK_URL = process.env.TALK_URL;
const PARTICIPANTS = Number(process.env.PARTICIPANTS || 20);
const HEADLESS = process.env.HEADLESS !== '0';
const JOIN_DELAY_MS = Number(process.env.JOIN_DELAY_MS || 1500);

const LOGIN_USER = process.env.LOGIN_USER || '';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || '';

if (!TALK_URL) {
  console.error('Missing TALK_URL.');
  console.error('Example:');
  console.error('set TALK_URL=https://nextcloud.example.com/index.php/call/EXAMPLE_TOKEN&& set PARTICIPANTS=20&& node scripts\\talk-load-test.js');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function clickByText(page, texts, timeout = 2500) {
  for (const text of texts) {
    try {
      const locator = page.locator('button, a, [role="button"], input[type="submit"]').filter({ hasText: text }).first();
      await locator.waitFor({ state: 'visible', timeout });
      await locator.click({ timeout });
      return true;
    } catch (_) {}
  }
  return false;
}

async function clickByRoleName(page, names, timeout = 2500) {
  for (const name of names) {
    try {
      const locator = page.getByRole('button', { name }).first();
      await locator.waitFor({ state: 'visible', timeout });
      await locator.click({ timeout });
      return true;
    } catch (_) {}
  }
  return false;
}

async function loginIfNeeded(page, participantName) {
  if (!LOGIN_USER || !LOGIN_PASSWORD) {
    console.log(`[${participantName}] login not configured, guest mode`);
    return false;
  }

  const loginSelectors = [
    'input#user',
    'input[name="user"]',
    'input[name="username"]',
    'input[autocomplete="username"]',
    'input[type="text"]'
  ];

  const passwordSelectors = [
    'input#password',
    'input[name="password"]',
    'input[autocomplete="current-password"]',
    'input[type="password"]'
  ];

  let userInput = null;
  let passwordInput = null;

  for (const selector of loginSelectors) {
    try {
      const el = page.locator(selector).first();
      await el.waitFor({ state: 'visible', timeout: 3000 });
      userInput = el;
      break;
    } catch (_) {}
  }

  for (const selector of passwordSelectors) {
    try {
      const el = page.locator(selector).first();
      await el.waitFor({ state: 'visible', timeout: 3000 });
      passwordInput = el;
      break;
    } catch (_) {}
  }

  if (!userInput || !passwordInput) {
    console.log(`[${participantName}] no login form found`);
    return false;
  }

  console.log(`[${participantName}] login form found, logging in`);

  await userInput.fill(LOGIN_USER);
  await passwordInput.fill(LOGIN_PASSWORD);

  const clicked = await clickByRoleName(page, [
    /log in/i,
    /login/i,
    /sign in/i,
    /anmelden/i,
    /einloggen/i,
    /se connecter/i,
    /connexion/i
  ], 3000);

  if (!clicked) {
    try {
      await page.locator('button[type="submit"], input[type="submit"], #submit-form').first().click({ timeout: 3000 });
    } catch (_) {
      await passwordInput.press('Enter');
    }
  }

  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await sleep(5000);

  console.log(`[${participantName}] login step finished`);
  return true;
}

async function fillGuestName(page, participantName) {
  const possibleInputs = [
    'input[placeholder*="name" i]',
    'input[placeholder*="nom" i]',
    'input[aria-label*="name" i]',
    'input[type="text"]',
    'input:not([type])'
  ];

  for (const selector of possibleInputs) {
    try {
      const input = page.locator(selector).first();
      await input.waitFor({ state: 'visible', timeout: 3000 });
      const value = await input.inputValue().catch(() => '');
      if (!value || value === LOGIN_USER) {
        await input.fill(participantName);
        console.log(`[${participantName}] name filled`);
      }
      return true;
    } catch (_) {}
  }

  console.log(`[${participantName}] no guest-name input found`);
  return false;
}

async function tryJoinChat(page, participantName) {
  const joined = await clickByRoleName(page, [
    /join/i,
    /join conversation/i,
    /join chat/i,
    /enter/i,
    /continue/i,
    /beitreten/i,
    /teilnehmen/i,
    /fortfahren/i,
    /rejoindre/i,
    /continuer/i
  ]);

  if (joined) {
    console.log(`[${participantName}] clicked join/chat button`);
    return true;
  }

  const joinedByText = await clickByText(page, [
    'Join',
    'Join conversation',
    'Join chat',
    'Enter',
    'Continue',
    'Beitreten',
    'Teilnehmen',
    'Fortfahren',
    'Rejoindre',
    'Continuer'
  ]);

  if (joinedByText) {
    console.log(`[${participantName}] clicked join/chat text`);
    return true;
  }

  console.log(`[${participantName}] no join/chat button found`);
  return false;
}

async function tryJoinCall(page, participantName) {
  await sleep(2000);

  const clicked = await clickByRoleName(page, [
    /start call/i,
    /join call/i,
    /join meeting/i,
    /^call$/i,
    /starten/i,
    /anruf starten/i,
    /anruf beitreten/i,
    /beitreten/i,
    /teilnehmen/i,
    /rejoindre l.?appel/i,
    /démarrer l.?appel/i,
    /appel/i
  ]);

  if (clicked) {
    console.log(`[${participantName}] clicked call button`);
    await sleep(3000);
  } else {
    const clickedByText = await clickByText(page, [
      'Start call',
      'Join call',
      'Join meeting',
      'Call',
      'Anruf starten',
      'Anruf beitreten',
      'Beitreten',
      'Teilnehmen',
      'Rejoindre l’appel',
      'Démarrer l’appel',
      'Appel'
    ]);

    if (clickedByText) {
      console.log(`[${participantName}] clicked call text`);
      await sleep(3000);
    } else {
      console.log(`[${participantName}] no call button found yet`);
    }
  }

  const finalJoin = await clickByRoleName(page, [
    /join call/i,
    /join meeting/i,
    /join/i,
    /start call/i,
    /beitreten/i,
    /teilnehmen/i,
    /rejoindre/i
  ], 4000);

  if (finalJoin) {
    console.log(`[${participantName}] confirmed device-check/join`);
    return true;
  }

  const finalJoinByText = await clickByText(page, [
    'Join call',
    'Join meeting',
    'Join',
    'Start call',
    'Beitreten',
    'Teilnehmen',
    'Rejoindre'
  ], 4000);

  if (finalJoinByText) {
    console.log(`[${participantName}] confirmed device-check/join by text`);
    return true;
  }

  console.log(`[${participantName}] no final device-check button found`);
  return false;
}

async function joinOne(browser, index) {
  const participantName = `HPB-Test-${String(index).padStart(2, '0')}`;

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: false
  });

  await context.grantPermissions(['camera', 'microphone'], {
    origin: new URL(TALK_URL).origin
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (/error|failed|websocket|spreed|webrtc|ice|turn/i.test(text)) {
      console.log(`[${participantName}] browser console ${msg.type()}: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    console.log(`[${participantName}] page error: ${err.message}`);
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (/spreed|signaling|ocs|turn|call/i.test(url)) {
      console.log(`[${participantName}] request failed: ${url} => ${request.failure()?.errorText}`);
    }
  });

  page.on('websocket', (ws) => {
    console.log(`[${participantName}] websocket opened: ${ws.url()}`);
    ws.on('close', () => console.log(`[${participantName}] websocket closed: ${ws.url()}`));
  });

  console.log(`[${participantName}] opening ${TALK_URL}`);
  await page.goto(TALK_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await sleep(3000);

  await loginIfNeeded(page, participantName);

  if (!page.url().includes('/call/')) {
    console.log(`[${participantName}] going back to call URL after login`);
    await page.goto(TALK_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
  }

  await fillGuestName(page, participantName);
  await tryJoinChat(page, participantName);

  await sleep(3000);

  await tryJoinCall(page, participantName);

  await sleep(5000);

  console.log(`[${participantName}] session started`);
  return { context, page, participantName };
}

(async () => {
  console.log(`Starting ${PARTICIPANTS} fake participants`);
  console.log(`URL: ${TALK_URL}`);
  console.log(`Headless: ${HEADLESS}`);
  console.log(`Login mode: ${LOGIN_USER ? 'enabled' : 'disabled / guest mode'}`);
  console.log('');

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-dev-shm-usage',
      '--no-sandbox'
    ]
  });

  const sessions = [];

  for (let i = 1; i <= PARTICIPANTS; i++) {
    try {
      const session = await joinOne(browser, i);
      sessions.push(session);
    } catch (err) {
      console.error(`[HPB-Test-${String(i).padStart(2, '0')}] failed: ${err.message}`);
    }

    await sleep(JOIN_DELAY_MS);
  }

  console.log('');
  console.log(`Started ${sessions.length}/${PARTICIPANTS} participants.`);
  console.log('Keep this terminal open. Press CTRL+C to stop.');

  process.on('SIGINT', async () => {
    console.log('\nClosing all participants...');
    await browser.close();
    process.exit(0);
  });

  while (true) {
    await sleep(30000);
    console.log(`Still running: ${sessions.length}/${PARTICIPANTS} participants`);
  }
})();
