// Background service worker for PostSnap extension

import {
  initializeRequestCapture,
  getCapturedRequests,
  getCapturedRequest,
  clearCapturedRequests,
  getUniqueHosts,
  startCapture,
  stopCapture,
  getCaptureState,
  incrementSyncedCount,
  getMostRecentRequestWithAuth
} from './requestCapture';
import {
  getCollections,
  createRequestInCollection,
  updateTokenInCollection,
  testConnection,
  upsertRequestInCollection,
  updateTokenForHost
} from './postmanApi';
import { savePostmanApiKey } from './storage';
import type { Message, MessageResponse } from '../shared/types';

console.log('PostSnap background service worker loaded');

// Initialize request capture on service worker startup
initializeRequestCapture();

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('PostSnap extension installed');
});

// Message listener for communication with popup
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse: (response: MessageResponse) => void) => {
    console.log('Message received:', message);

    // Handle different message types
    switch (message.type) {
      case 'GET_REQUESTS':
        handleGetRequests(sendResponse);
        break;

      case 'SAVE_TO_POSTMAN':
        handleSaveToPostman(message.payload, sendResponse);
        break;

      case 'UPDATE_TOKEN':
        handleUpdateToken(message.payload, sendResponse);
        break;

      case 'GET_COLLECTIONS':
        handleGetCollections(sendResponse);
        break;

      case 'TEST_CONNECTION':
        handleTestConnection(message.payload, sendResponse);
        break;

      case 'SAVE_API_KEY':
        handleSaveApiKey(message.payload, sendResponse);
        break;

      case 'GET_HOSTS':
        handleGetHosts(sendResponse);
        break;

      case 'START_CAPTURE':
        handleStartCapture(message.payload, sendResponse);
        break;

      case 'STOP_CAPTURE':
        handleStopCapture(sendResponse);
        break;

      case 'GET_CAPTURE_STATE':
        handleGetCaptureState(sendResponse);
        break;

      case 'UPDATE_HOST_TOKEN':
        handleUpdateHostToken(message.payload, sendResponse);
        break;

      default:
        sendResponse({
          success: false,
          error: `Unknown message type: ${message.type}`
        });
    }

    return true; // Keep channel open for async responses
  }
);

/**
 * Get all captured requests
 */
function handleGetRequests(sendResponse: (response: MessageResponse) => void) {
  try {
    const requests = getCapturedRequests();
    sendResponse({
      success: true,
      data: requests
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get requests'
    });
  }
}

/**
 * Save captured request to Postman collection
 */
async function handleSaveToPostman(
  payload: { requestId: string; collectionId: string },
  sendResponse: (response: MessageResponse) => void
) {
  try {
    const request = getCapturedRequest(payload.requestId);

    if (!request) {
      sendResponse({
        success: false,
        error: 'Request not found. It may have been cleared from the capture list.'
      });
      return;
    }

    const result = await createRequestInCollection(payload.collectionId, request);

    sendResponse({
      success: true,
      data: {
        message: `Request "${result.requestName}" created successfully in Postman!`,
        requestName: result.requestName
      }
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save to Postman'
    });
  }
}

/**
 * Update token in existing Postman request
 */
async function handleUpdateToken(
  payload: { requestId: string; collectionId: string },
  sendResponse: (response: MessageResponse) => void
) {
  try {
    const request = getCapturedRequest(payload.requestId);

    if (!request) {
      sendResponse({
        success: false,
        error: 'Request not found. It may have been cleared from the capture list.'
      });
      return;
    }

    const result = await updateTokenInCollection(payload.collectionId, request);

    sendResponse({
      success: true,
      data: {
        message: `Token updated in "${result.requestName}"!`,
        requestName: result.requestName
      }
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update token'
    });
  }
}

/**
 * Get Postman collections
 */
async function handleGetCollections(sendResponse: (response: MessageResponse) => void) {
  try {
    const collections = await getCollections();

    sendResponse({
      success: true,
      data: collections
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get collections'
    });
  }
}

/**
 * Test Postman API connection
 */
async function handleTestConnection(
  payload: { apiKey: string },
  sendResponse: (response: MessageResponse) => void
) {
  try {
    const result = await testConnection(payload.apiKey);

    sendResponse({
      success: true,
      data: {
        message: `Connected successfully! Logged in as: ${result.user.username || result.user.email}`,
        user: result.user
      }
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test connection'
    });
  }
}

/**
 * Save Postman API key to storage
 */
async function handleSaveApiKey(
  payload: { apiKey: string },
  sendResponse: (response: MessageResponse) => void
) {
  try {
    await savePostmanApiKey(payload.apiKey);

    sendResponse({
      success: true,
      data: { message: 'API key saved successfully!' }
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save API key'
    });
  }
}

/**
 * Get unique hosts from captured requests
 */
function handleGetHosts(sendResponse: (response: MessageResponse) => void) {
  try {
    const hosts = getUniqueHosts();
    sendResponse({ success: true, data: hosts });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get hosts'
    });
  }
}

/**
 * Start capture mode for a host
 */
function handleStartCapture(
  payload: { host: string; collectionId: string },
  sendResponse: (response: MessageResponse) => void
) {
  try {
    // Start capture with callback that upserts to Postman
    startCapture(payload.host, payload.collectionId, async (request) => {
      try {
        await upsertRequestInCollection(payload.collectionId, request);
        incrementSyncedCount();
        console.log(`Auto-synced request: ${request.method} ${request.url}`);
      } catch (error) {
        console.error('Failed to auto-sync request:', error);
      }
    });

    sendResponse({
      success: true,
      data: { message: `Started capturing requests for ${payload.host}` }
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start capture'
    });
  }
}

/**
 * Stop capture mode
 */
function handleStopCapture(sendResponse: (response: MessageResponse) => void) {
  try {
    const finalState = stopCapture();
    sendResponse({
      success: true,
      data: {
        message: `Capture stopped. Synced ${finalState.syncedCount} requests.`,
        state: finalState
      }
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop capture'
    });
  }
}

/**
 * Get current capture state
 */
function handleGetCaptureState(sendResponse: (response: MessageResponse) => void) {
  try {
    const state = getCaptureState();
    sendResponse({ success: true, data: state });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get capture state'
    });
  }
}

/**
 * Update token in all requests for a host
 */
async function handleUpdateHostToken(
  payload: { host: string; collectionId: string },
  sendResponse: (response: MessageResponse) => void
) {
  try {
    // Get most recent request with auth for this host
    const authRequest = getMostRecentRequestWithAuth(payload.host);

    if (!authRequest) {
      sendResponse({
        success: false,
        error: `No authenticated requests found for host "${payload.host}"`
      });
      return;
    }

    const result = await updateTokenForHost(
      payload.collectionId,
      payload.host,
      authRequest.authValue || '',
      authRequest.authType
    );

    sendResponse({
      success: true,
      data: {
        message: `Updated token in ${result.updatedCount} requests`,
        ...result
      }
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update host token'
    });
  }
}
