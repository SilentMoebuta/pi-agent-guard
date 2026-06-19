export interface GuardConfig {
  maxOutputLines: number;
  maxOutputBytes: number;
  doomLoopThreshold: number;
  sensitivePatterns: string[];
  logFile: string | null; // null = disabled
}

export const DEFAULT_CONFIG: GuardConfig = {
  maxOutputLines: 2000,
  maxOutputBytes: 50000,
  doomLoopThreshold: 3,
  sensitivePatterns: [".env", ".git-credentials", ".npmrc", "*.pem", "*.key", "id_rsa"],
  logFile: null,
};

export function resolveConfig(overrides: Partial<GuardConfig> = {}): GuardConfig {
  const envRaw = process.env.PI_GUARD_OPTIONS;
  let env: Partial<GuardConfig> = {};
  if (envRaw) {
    try { env = JSON.parse(envRaw) as Partial<GuardConfig>; } catch { /* ignore malformed */ }
  }
  return { ...DEFAULT_CONFIG, ...env, ...overrides };
}
