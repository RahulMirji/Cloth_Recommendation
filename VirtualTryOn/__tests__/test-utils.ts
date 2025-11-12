/**
 * Test Utilities for Virtual Try-On Tests
 */

/**
 * Create a mock base64 image (1x1 transparent PNG)
 */
export const createMockBase64Image = (): string => {
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
};

/**
 * Create a mock ArrayBuffer from a string
 */
export const createMockArrayBuffer = (size: number = 8): ArrayBuffer => {
  return new ArrayBuffer(size);
};

/**
 * Create a mock Gemini API response
 */
export const createMockGeminiResponse = (imageBase64?: string) => {
  return {
    data: {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Here you go!' },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: imageBase64 || createMockBase64Image(),
                },
              },
            ],
          },
        },
      ],
      usageMetadata: {
        promptTokenCount: 533,
        candidatesTokenCount: 1295,
        totalTokenCount: 1828,
      },
    },
  };
};

/**
 * Create a mock error response
 */
export const createMockErrorResponse = (message: string) => {
  return {
    response: {
      data: {
        error: {
          message,
          code: 400,
        },
      },
    },
  };
};

/**
 * Wait for a specified duration
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock file URIs for testing
 */
export const MOCK_FILE_URIS = {
  userJpg: 'file:///test/user.jpg',
  userPng: 'file:///test/user.png',
  outfitJpg: 'file:///test/outfit.jpg',
  outfitPng: 'file:///test/outfit.png',
  outfitWebp: 'file:///test/outfit.webp',
  invalid: 'invalid://path/to/image.jpg',
};

/**
 * Validate that a result has the expected structure
 */
export const validateTryOnResult = (result: any): boolean => {
  if (!result) return false;
  if (typeof result.success !== 'boolean') return false;
  if (result.success && !result.imageUrl) return false;
  if (!result.success && !result.error) return false;
  return true;
};

/**
 * Create a mock File instance
 */
export const createMockFile = (uri: string, arrayBuffer?: ArrayBuffer) => {
  return {
    uri,
    arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer || createMockArrayBuffer()),
    writableStream: jest.fn().mockReturnValue({
      getWriter: jest.fn().mockReturnValue({
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  };
};

/**
 * Test data for various scenarios
 */
export const TEST_SCENARIOS = {
  success: {
    name: 'Successful generation',
    userImage: MOCK_FILE_URIS.userJpg,
    outfitImage: MOCK_FILE_URIS.outfitJpg,
    expectedSuccess: true,
  },
  differentFormats: {
    name: 'Different image formats',
    userImage: MOCK_FILE_URIS.userPng,
    outfitImage: MOCK_FILE_URIS.outfitWebp,
    expectedSuccess: true,
  },
  invalidUri: {
    name: 'Invalid URI',
    userImage: MOCK_FILE_URIS.invalid,
    outfitImage: MOCK_FILE_URIS.outfitJpg,
    expectedSuccess: false,
  },
};
