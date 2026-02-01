// Storage wrapper for Chrome storage API

const STORAGE_KEYS = {
  POSTMAN_API_KEY: 'postmanApiKey',
} as const;

/**
 * Save Postman API key to Chrome storage
 */
export async function savePostmanApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.POSTMAN_API_KEY]: apiKey
  });
}

/**
 * Get Postman API key from Chrome storage
 */
export async function getPostmanApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.POSTMAN_API_KEY);
  return result[STORAGE_KEYS.POSTMAN_API_KEY] || null;
}

/**
 * Remove Postman API key from Chrome storage
 */
export async function removePostmanApiKey(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.POSTMAN_API_KEY);
}

/**
 * Check if Postman API key is configured
 */
export async function hasPostmanApiKey(): Promise<boolean> {
  const apiKey = await getPostmanApiKey();
  return apiKey !== null && apiKey.length > 0;
}
