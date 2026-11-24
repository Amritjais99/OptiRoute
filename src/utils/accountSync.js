const RETRY_DELAYS = [2000, 6000, 16000];
const MAX_RETRY_AFTER = 30000;

function getRetryDelay(response, fallback) {
  const retryAfter = response?.headers.get('Retry-After');
  if (!retryAfter) return fallback;
  const seconds = Number(retryAfter);
  const milliseconds = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
  return Number.isFinite(milliseconds) ? Math.max(fallback, milliseconds) : fallback;
}

export async function syncAccount(url, idToken, organizationName) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(organizationName ? { organization_name: organizationName } : {}),
    cache: 'no-store',
  };

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    let response;
    try {
      response = await fetch(url, { ...options, signal: AbortSignal.timeout(18000) });
    } catch (error) {
      if (!(error instanceof TypeError) && error.name !== 'TimeoutError') throw error;
    }

    if (response) {
      const isJson = response.headers.get('Content-Type')?.includes('application/json');
      if (response.ok && isJson) {
        const account = await response.json().catch(() => null);
        if (typeof account?.client_id === 'string' && account.client_id) return account;
      }
      if (response.headers.get('cf-mitigated') === 'challenge' ||
          (!isJson && [403, 429].includes(response.status))) {
        throw new Error('OptiRoute’s hosting service is blocking the connection. Try Continue to dashboard again in a few minutes.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('OptiRoute could not verify this sign-in session. Please sign in again.');
      }
      if (!response.ok && response.status < 500 && ![408, 429].includes(response.status)) {
        throw new Error(`OptiRoute could not connect your account (HTTP ${response.status}). Please try again.`);
      }
    }

    if (attempt === RETRY_DELAYS.length) break;
    const delay = getRetryDelay(response, RETRY_DELAYS[attempt]);
    if (delay > MAX_RETRY_AFTER) break;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('OptiRoute’s backend is temporarily unavailable. Use Continue to dashboard to retry without entering your password again.');
}
