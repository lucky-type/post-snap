// Shared TypeScript types for PostSnap extension

export type AuthType = 'bearer' | 'basic' | 'apikey' | 'cookie' | 'none';

export interface CapturedRequest {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  headers: RequestHeader[];
  body?: string | object;
  authType: AuthType;
  authValue?: string;
}

export interface RequestHeader {
  key: string;
  value: string;
}

export interface PostmanCollection {
  id: string;
  name: string;
  uid: string;
}

export interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: RequestHeader[];
    url: PostmanUrl | string;
    body?: PostmanRequestBody;
    auth?: PostmanAuth;
  };
}

export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: Array<{ key: string; value: string }>;
}

export interface PostmanRequestBody {
  mode: 'raw' | 'urlencoded' | 'formdata';
  raw?: string;
  urlencoded?: Array<{ key: string; value: string }>;
  formdata?: Array<{ key: string; value: string }>;
  options?: {
    raw?: {
      language: string;
    };
  };
}

export interface PostmanAuth {
  type: string;
  bearer?: Array<{ key: string; value: string }>;
  basic?: Array<{ key: string; value: string }>;
  apikey?: Array<{ key: string; value: string }>;
}

// Capture state tracking
export interface CaptureState {
  isCapturing: boolean;
  targetHost: string | null;
  collectionId: string | null;
  capturedCount: number;
  syncedCount: number;
}

// Host info for dropdown
export interface HostInfo {
  host: string;
  requestCount: number;
  lastSeen: number;
  hasAuth: boolean;
}

// Upsert result
export interface UpsertResult {
  action: 'created' | 'updated';
  requestName: string;
}

// Bulk token update result
export interface BulkTokenUpdateResult {
  updatedCount: number;
  totalMatched: number;
  requestNames: string[];
}

// Message types for communication between popup and background
export type MessageType =
  | 'GET_REQUESTS'
  | 'SAVE_TO_POSTMAN'
  | 'UPDATE_TOKEN'
  | 'GET_COLLECTIONS'
  | 'TEST_CONNECTION'
  | 'SAVE_API_KEY'
  | 'GET_HOSTS'
  | 'START_CAPTURE'
  | 'STOP_CAPTURE'
  | 'GET_CAPTURE_STATE'
  | 'UPDATE_HOST_TOKEN';

export interface Message {
  type: MessageType;
  payload?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
