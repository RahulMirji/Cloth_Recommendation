/**
 * Context Manager for Conversational AI
 * Remembers recent exchanges and resolves references
 */

export interface ConversationExchange {
  timestamp: number;
  userSaid: string;
  aiReplied: string;
  imageUrl?: string;
  detectedItems: string[];
  detectedColors: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ContextMemory {
  exchanges: ConversationExchange[];
  sessionStart: number;
  totalExchanges: number;
}

class ConversationContextManager {
  private context: ContextMemory = {
    exchanges: [],
    sessionStart: Date.now(),
    totalExchanges: 0,
  };

  private readonly MAX_HISTORY = 5;
  private readonly REFERENCE_KEYWORDS = ['this', 'that', 'previous', 'earlier', 'last', 'other', 'one'];

  /**
   * Add new exchange to context
   */
  addExchange(
    userQuestion: string,
    aiResponse: string,
    metadata?: {
      imageUrl?: string;
      detectedItems?: string[];
      detectedColors?: string[];
    }
  ): void {
    const exchange: ConversationExchange = {
      timestamp: Date.now(),
      userSaid: userQuestion,
      aiReplied: aiResponse,
      imageUrl: metadata?.imageUrl,
      detectedItems: metadata?.detectedItems || this.extractItems(aiResponse),
      detectedColors: metadata?.detectedColors || this.extractColors(aiResponse),
      sentiment: this.analyzeSentiment(aiResponse),
    };

    this.context.exchanges.push(exchange);
    this.context.totalExchanges++;

    // Keep only last N exchanges
    if (this.context.exchanges.length > this.MAX_HISTORY) {
      this.context.exchanges.shift();
    }

    console.log(`📝 Context updated: ${this.context.exchanges.length} exchanges in memory`);
  }

  /**
   * Resolve references in user question
   */
  resolveReference(userQuestion: string): {
    hasReference: boolean;
    referredItem?: string;
    referredColor?: string;
    referredExchange?: ConversationExchange;
    contextHint?: string;
  } {
    const q = userQuestion.toLowerCase();

    // Check if question contains reference keywords
    const hasReference = this.REFERENCE_KEYWORDS.some(keyword => q.includes(keyword));

    if (!hasReference || this.context.exchanges.length === 0) {
      return { hasReference: false };
    }

    // Look for color references
    const colors = this.extractColors(userQuestion);
    if (colors.length > 0) {
      const color = colors[0];
      const matchingExchange = this.findExchangeWithColor(color);
      
      if (matchingExchange) {
        return {
          hasReference: true,
          referredColor: color,
          referredExchange: matchingExchange,
          contextHint: `Referring to the ${color} item from earlier.`,
        };
      }
    }

    // Look for item references
    const items = this.extractItems(userQuestion);
    if (items.length > 0) {
      const item = items[0];
      const matchingExchange = this.findExchangeWithItem(item);
      
      if (matchingExchange) {
        return {
          hasReference: true,
          referredItem: item,
          referredExchange: matchingExchange,
          contextHint: `Referring to the ${item} mentioned earlier.`,
        };
      }
    }

    // Reference to previous exchange (e.g., "what about the other one?")
    if (q.includes('previous') || q.includes('earlier') || q.includes('last')) {
      const previousExchange = this.context.exchanges[this.context.exchanges.length - 2];
      
      if (previousExchange) {
        return {
          hasReference: true,
          referredExchange: previousExchange,
          contextHint: `Comparing to previous: ${previousExchange.detectedItems.join(', ')}`,
        };
      }
    }

    return { hasReference: true };
  }

  /**
   * Build context prompt for AI
   */
  buildContextPrompt(): string {
    if (this.context.exchanges.length === 0) {
      return '';
    }

    const recent = this.context.exchanges.slice(-3);
    
    const contextLines = recent.map(ex => {
      const items = ex.detectedItems.join(', ') || 'outfit';
      const sentiment = ex.sentiment === 'positive' ? '(liked it)' : 
                       ex.sentiment === 'negative' ? '(didn\'t like it)' : '';
      
      return `- User asked about ${items} ${sentiment}: "${ex.userSaid.substring(0, 50)}..."`;
    });

    return `Recent conversation:\n${contextLines.join('\n')}`;
  }

  /**
   * Get conversation summary
   */
  getSummary(): string {
    if (this.context.exchanges.length === 0) {
      return 'No conversation yet.';
    }

    const duration = Math.floor((Date.now() - this.context.sessionStart) / 1000);
    const allItems = new Set<string>();
    const allColors = new Set<string>();

    this.context.exchanges.forEach(ex => {
      ex.detectedItems.forEach(item => allItems.add(item));
      ex.detectedColors.forEach(color => allColors.add(color));
    });

    return `Session: ${duration}s, ${this.context.totalExchanges} exchanges. ` +
           `Discussed: ${Array.from(allItems).join(', ')} in ${Array.from(allColors).join(', ')}.`;
  }

  /**
   * Clear context (start new session)
   */
  clearContext(): void {
    this.context = {
      exchanges: [],
      sessionStart: Date.now(),
      totalExchanges: 0,
    };
    console.log('🗑️ Context cleared');
  }

  /**
   * Get recent exchanges
   */
  getRecentExchanges(count: number = 3): ConversationExchange[] {
    return this.context.exchanges.slice(-count);
  }

  // Private helper methods

  private extractItems(text: string): string[] {
    const items: string[] = [];
    const itemKeywords = [
      'shirt', 'pants', 'jeans', 'dress', 'skirt', 'jacket', 'coat',
      'shoes', 'sneakers', 'boots', 'hat', 'cap', 'scarf', 'tie',
      'sweater', 'hoodie', 'shorts', 'tee', 'top', 'blouse', 'outfit',
    ];

    const lowerText = text.toLowerCase();
    itemKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        items.push(keyword);
      }
    });

    return [...new Set(items)]; // Remove duplicates
  }

  private extractColors(text: string): string[] {
    const colors: string[] = [];
    const colorKeywords = [
      'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey',
      'pink', 'purple', 'orange', 'brown', 'navy', 'beige', 'tan',
      'maroon', 'teal', 'mint', 'pastel', 'dark', 'light',
    ];

    const lowerText = text.toLowerCase();
    colorKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        colors.push(keyword);
      }
    });

    return [...new Set(colors)];
  }

  private analyzeSentiment(response: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'good', 'nice', 'perfect', 'love', 'excellent', 'fantastic', 'suits'];
    const negativeWords = ['not', 'don\'t', 'avoid', 'skip', 'wrong', 'bad', 'unflattering'];

    const lowerResponse = response.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerResponse.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerResponse.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private findExchangeWithColor(color: string): ConversationExchange | undefined {
    return this.context.exchanges
      .slice()
      .reverse()
      .find(ex => ex.detectedColors.includes(color.toLowerCase()));
  }

  private findExchangeWithItem(item: string): ConversationExchange | undefined {
    return this.context.exchanges
      .slice()
      .reverse()
      .find(ex => ex.detectedItems.includes(item.toLowerCase()));
  }
}

export const contextManager = new ConversationContextManager();
export default contextManager;
