export const ENV_URLS: Record<string, string> = {
  'QA-Dev':  'https://ih-sri-dev.symphonyai.dev',   
  'QA-Test': 'https://ih-sri-test.symphonyai.dev', 
};

export function getBaseUrl(): string {
  const env = process.env.TEST_ENV || 'QA-Dev';
  const customUrl = process.env.CUSTOM_ENV_URL || '';

  if (env === 'Custom') {
    if (!customUrl) {
      throw new Error('Custom environment selected but no URL provided!');
    }
    return customUrl;
  }

  const url = ENV_URLS[env];
  if (!url) {
    throw new Error(`Unknown environment: ${env}`);
  }
  return url;
}