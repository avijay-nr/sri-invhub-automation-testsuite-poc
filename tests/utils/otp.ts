import { execSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { testSettings } from '../configFiles/config';

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function extractOtp(output: string, matcher: RegExp): string | undefined {
  const match = output.match(matcher);
  if (!match) return undefined;
  return match[1] || match[0];
}

function buildMatcher(patternFromEnv: string): RegExp {
  // Supports either plain pattern like "(\\d{6})" or "/pattern/flags" format.
  const slashFormat = patternFromEnv.match(/^\/(.*)\/([a-z]*)$/i);
  if (slashFormat) {
    const [, body, flags] = slashFormat;
    return new RegExp(body, flags);
  }

  return new RegExp(patternFromEnv, 'i');
}

export async function resolveOtpOrThrow(): Promise<string> {
  const seededOtp = process.env.TEST_OTP?.trim();
  if (seededOtp) return seededOtp;

  const fetchCmd = process.env.OTP_FETCH_CMD?.trim() || testSettings.otpFetchCommand;
  if (!fetchCmd) {
    throw new Error('Missing OTP source. Set TEST_OTP or configure OTP_FETCH_CMD.');
  }

  const timeoutSec = readPositiveInt(process.env.OTP_FETCH_TIMEOUT_SEC, testSettings.otpFetchTimeoutSec);
  const pollSec = readPositiveInt(process.env.OTP_FETCH_POLL_SEC, testSettings.otpFetchPollSec);
  const regexPattern = process.env.OTP_REGEX?.trim() || testSettings.otpRegex;
  const matcher = buildMatcher(regexPattern);
  const deadline = Date.now() + timeoutSec * 1_000;

  while (Date.now() < deadline) {
    try {
      const output = execSync(fetchCmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();

      const otp = extractOtp(output, matcher);
      if (otp) return otp;
    } catch {
      // Swallow transient command errors and retry until timeout.
    }

    await delay(pollSec * 1_000);
  }

  throw new Error(
    `Unable to auto-fetch OTP within ${timeoutSec}s. Check OTP_FETCH_CMD and OTP_REGEX.`,
  );
}
