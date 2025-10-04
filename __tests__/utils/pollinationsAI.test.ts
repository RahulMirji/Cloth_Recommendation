import { generateText, generateTextWithImage, convertImageToBase64 } from '@/utils/pollinationsAI';
import { Platform } from 'react-native';

// Mock fetch
global.fetch = jest.fn();

describe('pollinationsAI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    it('should generate text successfully on web', async () => {
      Platform.OS = 'web';
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'This is a test response',
              },
            },
          ],
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateText({
        messages: [{ role: 'user', content: 'Test message' }],
        stream: false,
      });

      expect(result).toBe('This is a test response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://text.pollinations.ai/openai',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        generateText({
          messages: [{ role: 'user', content: 'Test message' }],
          stream: false,
        })
      ).rejects.toThrow('API request failed');
    });

    it('should use non-streaming mode on mobile', async () => {
      Platform.OS = 'android';
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Mobile response',
              },
            },
          ],
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateText({
        messages: [{ role: 'user', content: 'Test message' }],
        stream: true, // Request streaming but should be disabled on mobile
      });

      expect(result).toBe('Mobile response');
    });
  });

  describe('generateTextWithImage', () => {
    it('should generate text with image successfully', async () => {
      // Use mobile platform to avoid streaming
      Platform.OS = 'android';
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Image analysis result',
              },
            },
          ],
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await generateTextWithImage(
        'data:image/jpeg;base64,fake-base64-data',
        'Analyze this outfit'
      );

      expect(result).toBe('Image analysis result');
    });

    it('should prepend data URI if not present', async () => {
      // Use mobile platform to avoid streaming
      Platform.OS = 'android';
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Result',
              },
            },
          ],
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await generateTextWithImage('fake-base64-data', 'Analyze');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.messages[0].content[1].image_url.url).toContain('data:image/jpeg;base64,');
    });
  });

  describe('convertImageToBase64', () => {
    it('should return the same URI if already base64', async () => {
      const base64Uri = 'data:image/jpeg;base64,fake-data';
      const result = await convertImageToBase64(base64Uri);
      
      expect(result).toBe(base64Uri);
    });

    it('should convert URI to base64', async () => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onloadend: null as any,
        result: 'data:image/jpeg;base64,converted-data',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const promise = convertImageToBase64('https://example.com/image.jpg');

      // Trigger the onloadend callback
      setTimeout(() => {
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({} as any);
        }
      }, 10);

      const result = await promise;
      expect(result).toBe('data:image/jpeg;base64,converted-data');
    });
  });
});
