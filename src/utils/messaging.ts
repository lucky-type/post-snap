// Utility functions for popup-background communication

import type { Message, MessageResponse, CapturedRequest, PostmanCollection, HostInfo, CaptureState, BulkTokenUpdateResult } from '../shared/types';

/**
 * Send a message to the background service worker
 */
function sendMessage(message: Message): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response) {
        reject(new Error('No response from background service'));
        return;
      }

      resolve(response);
    });
  });
}

/**
 * Get all captured requests
 */
export async function getCapturedRequests(): Promise<CapturedRequest[]> {
  const response = await sendMessage({ type: 'GET_REQUESTS' });

  if (!response.success) {
    throw new Error(response.error || 'Failed to get requests');
  }

  return response.data;
}

/**
 * Get Postman collections
 */
export async function getCollections(): Promise<PostmanCollection[]> {
  const response = await sendMessage({ type: 'GET_COLLECTIONS' });

  if (!response.success) {
    throw new Error(response.error || 'Failed to get collections');
  }

  return response.data;
}

/**
 * Save Postman API key
 */
export async function saveApiKey(apiKey: string): Promise<string> {
  const response = await sendMessage({
    type: 'SAVE_API_KEY',
    payload: { apiKey }
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to save API key');
  }

  return response.data.message;
}

/**
 * Test Postman API connection
 */
export async function testConnection(apiKey: string): Promise<{ message: string; user: any }> {
  const response = await sendMessage({
    type: 'TEST_CONNECTION',
    payload: { apiKey }
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to test connection');
  }

  return response.data;
}

/**
 * Save captured request to Postman collection
 */
export async function saveToPostman(
  requestId: string,
  collectionId: string
): Promise<{ message: string; requestName: string }> {
  const response = await sendMessage({
    type: 'SAVE_TO_POSTMAN',
    payload: { requestId, collectionId }
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to save to Postman');
  }

  return response.data;
}

/**
 * Update token in existing Postman request
 */
export async function updateToken(
  requestId: string,
  collectionId: string
): Promise<{ message: string; requestName: string }> {
  const response = await sendMessage({
    type: 'UPDATE_TOKEN',
    payload: { requestId, collectionId }
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to update token');
  }

  return response.data;
}

/**
 * Get unique hosts from captured requests
 */
export async function getHosts(): Promise<HostInfo[]> {
  const response = await sendMessage({ type: 'GET_HOSTS' });

  if (!response.success) {
    throw new Error(response.error || 'Failed to get hosts');
  }

  return response.data;
}

/**
 * Start capture mode for a host
 */
export async function startCapture(
  host: string,
  collectionId: string
): Promise<{ message: string }> {
  const response = await sendMessage({
    type: 'START_CAPTURE',
    payload: { host, collectionId }
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to start capture');
  }

  return response.data;
}

/**
 * Stop capture mode
 */
export async function stopCapture(): Promise<{ message: string; state: CaptureState }> {
  const response = await sendMessage({ type: 'STOP_CAPTURE' });

  if (!response.success) {
    throw new Error(response.error || 'Failed to stop capture');
  }

  return response.data;
}

/**
 * Get current capture state
 */
export async function getCaptureState(): Promise<CaptureState> {
  const response = await sendMessage({ type: 'GET_CAPTURE_STATE' });

  if (!response.success) {
    throw new Error(response.error || 'Failed to get capture state');
  }

  return response.data;
}

/**
 * Update token in all requests for a host
 */
export async function updateHostToken(
  host: string,
  collectionId: string
): Promise<BulkTokenUpdateResult & { message: string }> {
  const response = await sendMessage({
    type: 'UPDATE_HOST_TOKEN',
    payload: { host, collectionId }
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to update host token');
  }

  return response.data;
}
