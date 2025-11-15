/**
 * Test Utilities and Mock Data
 * 
 * Shared utilities, constants, and mock data for testing
 */

// Sample Images (1x1 transparent PNG)
export const SAMPLE_BASE64_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// Sample 1x1 red PNG
export const SAMPLE_RED_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

// Mock Service Account (DO NOT USE IN PRODUCTION)
export const MOCK_SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "test-project-123",
  private_key_id: "abc123def456",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj\nMzEfYyjiWA4R4/M2bS1+fWIcPm15j9mQ8zrzLhEBvPv3VJqMUW6V0lCkBsqSX0me\n9y8rNqQcCWEPTHlhqXtZEVXZzXzqHqZPF9dJqpQh0dFtq6R0S8CjPZ5tPe8eVLqZ\n3J+xqeF3ZXq8OwCIJjzjqVsxU0B5xGnvQQtbTMqZhNMPvDLiV8jFxqGW0s9L4cpF\n0T3L7qFYWdPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\nPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\nPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\nPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\nPPPPPPPPPPPPPPPPPPPPPPPPPPAgMBAAECggEAQkhFR0JJTI0U3BhY2luZy0tLS0K\n-----END PRIVATE KEY-----\n",
  client_email: "test-service-account@test-project-123.iam.gserviceaccount.com",
  client_id: "123456789012345678901",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/test-service-account%40test-project-123.iam.gserviceaccount.com"
};

// Mock OAuth Token Response
export const MOCK_OAUTH_TOKEN_RESPONSE = {
  access_token: "ya29.mock_access_token_123456789",
  expires_in: 3600,
  token_type: "Bearer",
};

// Mock Vertex AI Success Response
export const MOCK_VERTEX_AI_SUCCESS_RESPONSE = {
  predictions: [
    {
      bytesBase64Encoded: SAMPLE_BASE64_IMAGE,
      mimeType: "image/png",
    }
  ],
  metadata: {
    generation_time_ms: 2500,
  },
};

// Mock Vertex AI Error Response
export const MOCK_VERTEX_AI_ERROR_RESPONSE = {
  error: {
    code: 400,
    message: "Invalid image format. Please provide a valid PNG or JPEG image.",
    status: "INVALID_ARGUMENT",
    details: [
      {
        "@type": "type.googleapis.com/google.rpc.BadRequest",
        fieldViolations: [
          {
            field: "instances[0].personImage",
            description: "Image must be a valid PNG or JPEG format",
          }
        ]
      }
    ]
  }
};

// Mock Vertex AI Empty Response
export const MOCK_VERTEX_AI_EMPTY_RESPONSE = {
  predictions: [],
};

// Mock Vertex AI Rate Limit Response
export const MOCK_VERTEX_AI_RATE_LIMIT_RESPONSE = {
  error: {
    code: 429,
    message: "Resource has been exhausted (e.g. check quota).",
    status: "RESOURCE_EXHAUSTED",
  }
};

// Mock Supabase Storage Success Response
export const MOCK_SUPABASE_UPLOAD_SUCCESS = {
  data: {
    id: "abc123-def456-ghi789",
    path: "virtual-tryon/tryon_1234567890_uuid.png",
    fullPath: "generated-images/virtual-tryon/tryon_1234567890_uuid.png",
  },
  error: null,
};

// Mock Supabase Storage Error Response
export const MOCK_SUPABASE_UPLOAD_ERROR = {
  data: null,
  error: {
    message: "The object exceeded the maximum allowed size",
    statusCode: "413",
    name: "StorageApiError",
  },
};

// Mock Environment Variables
export const MOCK_ENV_VARS = {
  VERTEX_API: JSON.stringify(MOCK_SERVICE_ACCOUNT),
  GOOGLE_PROJECT_ID: "vertex-ai-test-project-123",
  GOOGLE_LOCATION: "us-central1",
  SUPABASE_URL: "https://test123.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.mock",
};

// Valid Request Body
export const VALID_REQUEST_BODY = {
  userImageBase64: SAMPLE_BASE64_IMAGE,
  outfitImageBase64: SAMPLE_RED_IMAGE,
};

// Invalid Request Bodies
export const INVALID_REQUEST_MISSING_USER = {
  outfitImageBase64: SAMPLE_BASE64_IMAGE,
};

export const INVALID_REQUEST_MISSING_OUTFIT = {
  userImageBase64: SAMPLE_BASE64_IMAGE,
};

export const INVALID_REQUEST_EMPTY_IMAGES = {
  userImageBase64: "",
  outfitImageBase64: "",
};

export const INVALID_REQUEST_INVALID_BASE64 = {
  userImageBase64: "not-valid-base64!@#$",
  outfitImageBase64: "also-invalid-base64!@#$",
};

// CORS Headers
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test Utilities

/**
 * Create a mock fetch function with predefined responses
 */
export function createMockFetch(responses: Map<string, any>) {
  return (url: string, options?: any) => {
    for (const [pattern, response] of responses.entries()) {
      if (url.includes(pattern)) {
        return Promise.resolve(
          new Response(JSON.stringify(response), {
            status: response.error ? (response.error.code || 500) : 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
    }
    
    // Default 404 response
    return Promise.resolve(
      new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  };
}

/**
 * Generate a mock filename with timestamp and UUID
 */
export function generateMockFileName(): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  return `tryon_${timestamp}_${uuid}.png`;
}

/**
 * Validate base64 string
 */
export function isValidBase64(str: string): boolean {
  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient(uploadSuccess = true) {
  return {
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, data: Uint8Array) => {
          if (uploadSuccess) {
            return {
              data: {
                path,
                id: crypto.randomUUID(),
                fullPath: `${bucket}/${path}`,
              },
              error: null,
            };
          } else {
            return {
              data: null,
              error: {
                message: "Upload failed",
                statusCode: "500",
              },
            };
          }
        },
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://test.supabase.co/storage/v1/object/public/generated-images/${path}`,
          },
        }),
      }),
    },
  };
}

/**
 * Create a mock Request object
 */
export function createMockRequest(body: any, method = "POST"): Request {
  return new Request("https://test.supabase.co/functions/v1/virtual-tryon", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: method !== "OPTIONS" ? JSON.stringify(body) : undefined,
  });
}

/**
 * Validate JWT structure
 */
export function isValidJWTStructure(jwt: string): boolean {
  const parts = jwt.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Validate header
    const headerDecoded = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
    const header = JSON.parse(headerDecoded);
    if (!header.alg || !header.typ) return false;
    
    // Validate payload
    const payloadDecoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadDecoded);
    if (!payload.iss || !payload.aud || !payload.iat || !payload.exp) return false;
    
    // Signature exists
    if (parts[2].length === 0) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate image size in KB
 */
export function getBase64SizeKB(base64: string): number {
  return base64.length / 1024;
}

/**
 * Calculate image size in MB
 */
export function getBase64SizeMB(base64: string): number {
  return base64.length / (1024 * 1024);
}

/**
 * Validate Vertex AI endpoint URL
 */
export function isValidVertexAIEndpoint(url: string): boolean {
  return url.includes('aiplatform.googleapis.com') &&
         url.includes('/publishers/google/models/virtual-try-on');
}

/**
 * Validate file path format
 */
export function isValidFilePath(path: string): boolean {
  return path.startsWith('virtual-tryon/') && path.endsWith('.png');
}

console.log("✅ Test utilities and mocks loaded");
