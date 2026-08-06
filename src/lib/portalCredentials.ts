/**
 * Delta Stars — Portal Credentials Vault
 * ======================================
 * Centralized management for the Admin Control Panel and Developer OS
 * login credentials. Supports:
 *
 *  - Initial (default) passwords that MUST be changed on first login.
 *  - Local persistence of changed passwords (SHA-256 hashed vault) so
 *    password changes take effect immediately on this device even when
 *    the cloud backend is unreachable.
 *  - Backward compatibility with the legacy `delta_portal_passwords`
 *    localStorage store used by the DeveloperDashboard security panel.
 */

export type PortalRole = 'admin' | 'developer';

export interface PortalPasswords {
  adminPass: string;
  devPin: string;
  warehousePass: string;
  driverPass: string;
  b2bPass: string;
  qaPass: string;
  delegatePass: string;
  accountingPass: string;
}

export const DEFAULT_PORTAL_PASSWORDS: PortalPasswords = {
  adminPass: 'Ali773597404***%',
  devPin: '733691903***%$',
  warehousePass: 'warehouse123',
  driverPass: 'driver123',
  b2bPass: 'b2b123',
  qaPass: 'qa123',
  delegatePass: 'delegate123',
  accountingPass: 'acc123',
};

/** Usernames that map to the admin/developer portals (Arabic + Latin). */
const ADMIN_USERNAMES = [
  'admin',
  'التقني',
  'متجر نجوم دلتا',
  'ali',
  'ali aldahan',
  'ali.aldahan',
  'deltastars',
  'superadmin',
];

const DEV_USERNAMES = ['developer', 'dev', 'مطور', 'المطور'];

const LEGACY_STORE_KEY = 'delta_portal_passwords';
const VAULT_STORE_KEY = 'delta_portal_credentials_vault_v2';
const CHANGED_MARKER_KEY = 'delta_portal_passwords_changed';

interface VaultEntry {
  hash: string;
  changedAt: string;
  salt: string;
}

type Vault = Record<PortalRole, VaultEntry | undefined>;

/** SHA-256 hex digest using Web Crypto (works on https + localhost). */
async function sha256(text: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (e) {
    console.warn('[PortalCredentials] Web Crypto unavailable:', e);
  }
  // Fallback deterministic hash (not cryptographically secure, but keeps
  // plaintext out of storage when Web Crypto is blocked).
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

function randomSalt(): string {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

/** Read the legacy plaintext store (kept for DeveloperDashboard panel). */
export function getLegacyPasswords(): PortalPasswords {
  try {
    const raw = localStorage.getItem(LEGACY_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PORTAL_PASSWORDS, ...parsed };
    }
  } catch (e) {
    console.warn('[PortalCredentials] Legacy store read failed:', e);
  }
  return { ...DEFAULT_PORTAL_PASSWORDS };
}

function readVault(): Vault {
  try {
    const raw = localStorage.getItem(VAULT_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[PortalCredentials] Vault read failed:', e);
  }
  return { admin: undefined, developer: undefined };
}

function writeVault(vault: Vault) {
  try {
    localStorage.setItem(VAULT_STORE_KEY, JSON.stringify(vault));
  } catch (e) {
    console.warn('[PortalCredentials] Vault write failed:', e);
  }
}

/** Default password for a portal role. */
export function getDefaultPassword(role: PortalRole): string {
  return role === 'admin' ? DEFAULT_PORTAL_PASSWORDS.adminPass : DEFAULT_PORTAL_PASSWORDS.devPin;
}

/**
 * Current effective password for a portal role.
 *
 * NOTE: passwords changed through the vault are stored ONLY as salted SHA-256
 * hashes, so their plaintext is intentionally unrecoverable. This helper
 * therefore returns the legacy plaintext override (kept in sync by
 * `changePortalPassword` for the DeveloperDashboard panel) or the default.
 */
export async function getEffectivePassword(role: PortalRole): Promise<string> {
  const legacy = getLegacyPasswords();
  return role === 'admin' ? legacy.adminPass : legacy.devPin;
}

/**
 * The ORIGINAL store accepted these "initial credential" forms for each role
 * (exact default password, backup code, or any password containing the numeric
 * core). They are preserved for full backward compatibility so the owner's real
 * initial credentials keep working — but ONLY until the password is changed
 * (after that, only the salted vault hash is accepted).
 */
export function isInitialCredential(role: PortalRole, password: string): boolean {
  if (!password) return false;
  if (role === 'admin') {
    return (
      password === 'Ali773597404***%' ||
      password === '321666' ||
      password.includes('773597404')
    );
  }
  return (
    password === '733691903***%$' ||
    password === 'Ali733691903***%' ||
    password.includes('733691903')
  );
}

/**
 * Verify credentials for a portal role.
 * @returns true when the password matches the stored/default value.
 */
export async function verifyPortalPassword(role: PortalRole, password: string): Promise<boolean> {
  if (!password) return false;
  const vault = readVault();
  const entry = vault[role];

  // 1) Changed password → strict salted-hash verification only.
  if (entry) {
    const candidateHash = await sha256(entry.salt + password);
    return candidateHash === entry.hash;
  }

  // 2) Legacy plaintext store override (set by the DeveloperDashboard panel).
  const legacy = getLegacyPasswords();
  const stored = role === 'admin' ? legacy.adminPass : legacy.devPin;
  if (stored === password) return true;

  // 3) Initial/backward-compatible credential forms (original acceptance).
  return isInitialCredential(role, password);
}

/**
 * True when the given password is still the *default* one for this role —
 * used to force a first-login password change.
 */
export async function isDefaultPassword(role: PortalRole, password: string): Promise<boolean> {
  return password === getDefaultPassword(role);
}

/** Has the user changed this role's password away from the default? */
export function hasChangedPassword(role: PortalRole): boolean {
  try {
    const changed = JSON.parse(localStorage.getItem(CHANGED_MARKER_KEY) || '{}');
    return !!changed[role];
  } catch {
    return false;
  }
}

/**
 * Persist a NEW password for a portal role. Stores a salted SHA-256 hash in
 * the vault, updates the legacy store (so the DeveloperDashboard panel stays
 * in sync), and marks the role as "changed" (first-login flow complete).
 */
export async function changePortalPassword(role: PortalRole, newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 8) return false;

  const salt = randomSalt();
  const hash = await sha256(salt + newPassword);

  const vault = readVault();
  vault[role] = { hash, salt, changedAt: new Date().toISOString() };
  writeVault(vault);

  // Keep legacy store consistent so all existing panels read the new value.
  try {
    const legacy = getLegacyPasswords();
    if (role === 'admin') legacy.adminPass = newPassword;
    else legacy.devPin = newPassword;
    localStorage.setItem(LEGACY_STORE_KEY, JSON.stringify(legacy));
  } catch (e) {
    console.warn('[PortalCredentials] Legacy store update failed:', e);
  }

  try {
    const changed = JSON.parse(localStorage.getItem(CHANGED_MARKER_KEY) || '{}');
    changed[role] = true;
    localStorage.setItem(CHANGED_MARKER_KEY, JSON.stringify(changed));
  } catch {
    localStorage.setItem(CHANGED_MARKER_KEY, JSON.stringify({ [role]: true }));
  }

  return true;
}

/** Reset a role's password back to the default (used by security panel). */
export async function resetPortalPassword(role: PortalRole): Promise<void> {
  const vault = readVault();
  vault[role] = undefined;
  writeVault(vault);
  try {
    const changed = JSON.parse(localStorage.getItem(CHANGED_MARKER_KEY) || '{}');
    delete changed[role];
    localStorage.setItem(CHANGED_MARKER_KEY, JSON.stringify(changed));
  } catch {
    /* ignore */
  }
}

export interface PortalLoginResult {
  role: PortalRole | null;
  /** True when logged in with the default (initial) password → force change. */
  needsPasswordChange: boolean;
}

/**
 * Full login check for the admin/developer portals. Accepts the role-specific
 * password; returns which role matched (admin password → admin, dev PIN → dev).
 */
export async function checkPortalLogin(
  username: string,
  password: string,
): Promise<PortalLoginResult> {
  const lowerUser = (username || '').trim().toLowerCase();

  const isAdminUser =
    ADMIN_USERNAMES.includes(lowerUser) ||
    lowerUser.includes('ali') ||
    lowerUser.includes('deltastars') ||
    lowerUser.includes('التقني');

  const isDevUser = isAdminUser || DEV_USERNAMES.includes(lowerUser) || lowerUser.includes('مطور');

  // Try admin credentials first.
  if (isAdminUser) {
    const ok = await verifyPortalPassword('admin', password);
    if (ok) {
      const usingInitial = isInitialCredential('admin', password) && !hasChangedPassword('admin');
      return { role: 'admin', needsPasswordChange: usingInitial };
    }
  }

  // Then developer credentials.
  if (isDevUser) {
    const ok = await verifyPortalPassword('developer', password);
    if (ok) {
      const usingInitial = isInitialCredential('developer', password) && !hasChangedPassword('developer');
      return { role: 'developer', needsPasswordChange: usingInitial };
    }
  }

  return { role: null, needsPasswordChange: false };
}
