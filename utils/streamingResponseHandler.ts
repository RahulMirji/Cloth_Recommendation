/**
 * Streaming Response Handler for Real-Time AI Responses
 * Simulates streaming and provides instant feedback
 */

interface StreamingConfig {
  wordsPerChunk: number;
  chunkDelayMs: number;
  enableInstantAck: boolean;
}

export interface QuickResponse {
  acknowledgment: string;
  template?: string;
  fullResponse?: string;
}

class StreamingResponseHandler {
  private config: StreamingConfig = {
    wordsPerChunk: 3,
    chunkDelayMs: 80,
    enableInstantAck: true,
  };

  // Instant acknowledgments for different question types
  private quickAcknowledgments = {
    how_look: ['Looking good!', 'Nice choice!', 'Great pick!', 'That works!'],
    what_think: ['Let me see...', 'Hmm, interesting!', 'Nice!', 'I like it!'],
    color: ['Love that color!', 'Good choice!', 'Nice shade!'],
    general: ['Sure!', 'Okay!', 'Got it!', 'Alright!'],
  };

  // Fashion templates for instant responses
  private fashionTemplates = {
    color_compliment: [
      'The {color} really suits you!',
      'That {color} {item} is a great choice!',
      '{color} works well with your look!',
    ],
    style_positive: [
      'That {item} fits you perfectly!',
      'Nice {style} vibe!',
      'The {item} looks great on you!',
    ],
    suggestion: [
      'Try pairing that with {suggestion}.',
      'You could add {accessory} to complete the look.',
      'Consider {tip} for a sharper style.',
    ],
  };

  /**
   * Get instant acknowledgment based on user question
   */
  getInstantAcknowledgment(userQuestion: string): string {
    const q = userQuestion.toLowerCase();

    if (q.includes('how') && (q.includes('look') || q.includes('outfit'))) {
      return this.randomChoice(this.quickAcknowledgments.how_look);
    }

    if (q.includes('what') && (q.includes('think') || q.includes('about'))) {
      return this.randomChoice(this.quickAcknowledgments.what_think);
    }

    if (q.includes('color') || q.includes('shade')) {
      return this.randomChoice(this.quickAcknowledgments.color);
    }

    return this.randomChoice(this.quickAcknowledgments.general);
  }

  /**
   * Simulate streaming by breaking response into chunks
   * This makes responses feel instant even though they're complete
   */
  async streamResponse(
    fullResponse: string,
    onChunk: (chunk: string, isFirst: boolean, isDone: boolean) => void
  ): Promise<void> {
    const words = fullResponse.split(' ');
    const chunks: string[] = [];

    // Break into chunks of N words
    for (let i = 0; i < words.length; i += this.config.wordsPerChunk) {
      const chunk = words.slice(i, i + this.config.wordsPerChunk).join(' ');
      chunks.push(chunk);
    }

    // Stream chunks with delay
    for (let i = 0; i < chunks.length; i++) {
      const isFirst = i === 0;
      const isDone = i === chunks.length - 1;
      
      await new Promise(resolve => setTimeout(resolve, this.config.chunkDelayMs));
      onChunk(chunks[i] + ' ', isFirst, isDone);
    }
  }

  /**
   * Create progressive response (instant ack + streamed details)
   */
  async createProgressiveResponse(
    userQuestion: string,
    fullAIResponse: string,
    onToken: (token: string, metadata: { phase: string; timestamp: number }) => void
  ): Promise<void> {
    const startTime = Date.now();

    // PHASE 1: Instant acknowledgment (0ms)
    if (this.config.enableInstantAck) {
      const ack = this.getInstantAcknowledgment(userQuestion);
      onToken(ack + ' ', {
        phase: 'acknowledgment',
        timestamp: Date.now() - startTime,
      });

      // Small pause before continuing
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // PHASE 2: Stream the actual AI response
    await this.streamResponse(fullAIResponse, (chunk, isFirst, isDone) => {
      onToken(chunk, {
        phase: isDone ? 'complete' : 'streaming',
        timestamp: Date.now() - startTime,
      });
    });
  }

  /**
   * Try to match user question with quick template
   */
  tryQuickTemplate(userQuestion: string, imageData?: any): string | null {
    if (!imageData) return null;

    const q = userQuestion.toLowerCase();

    // Color-based responses
    if (imageData.dominant_color) {
      if (q.includes('color') || q.includes('look')) {
        const template = this.randomChoice(this.fashionTemplates.color_compliment);
        return template
          .replace('{color}', imageData.dominant_color)
          .replace('{item}', imageData.clothing_type || 'outfit');
      }
    }

    // Style-based responses
    if (imageData.clothing_type) {
      const template = this.randomChoice(this.fashionTemplates.style_positive);
      return template
        .replace('{item}', imageData.clothing_type)
        .replace('{style}', imageData.style_type || 'casual');
    }

    return null;
  }

  /**
   * Analyze user question to extract intent
   */
  analyzeIntent(userQuestion: string): {
    type: 'compliment' | 'suggestion' | 'rating' | 'comparison' | 'general';
    keywords: string[];
  } {
    const q = userQuestion.toLowerCase();
    const keywords: string[] = [];

    // Extract color keywords
    const colors = ['blue', 'red', 'green', 'yellow', 'black', 'white', 'gray', 'pink'];
    colors.forEach(color => {
      if (q.includes(color)) keywords.push(color);
    });

    // Determine intent
    if (q.includes('suggest') || q.includes('recommend') || q.includes('should')) {
      return { type: 'suggestion', keywords };
    }

    if (q.includes('rate') || q.includes('score') || q.includes('out of')) {
      return { type: 'rating', keywords };
    }

    if (q.includes('better') || q.includes('compare') || q.includes('versus')) {
      return { type: 'comparison', keywords };
    }

    if (q.includes('how') && q.includes('look')) {
      return { type: 'compliment', keywords };
    }

    return { type: 'general', keywords };
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Set streaming configuration
   */
  configure(config: Partial<StreamingConfig>) {
    this.config = { ...this.config, ...config };
  }
}

// Export both the class and a singleton instance
export { StreamingResponseHandler };
export const streamingHandler = new StreamingResponseHandler();
export default streamingHandler;
