# 🔗 History Feature Integration Guide

## Quick Integration Steps

This guide shows you how to connect the History feature with your existing Outfit Scorer and AI Stylist screens.

---

## 📸 Outfit Scorer Integration

### Step 1: Import the History Hook

```typescript
// In your outfit scorer screen (e.g., app/outfit-scorer.tsx)
import { useAuthStore } from "@/store/authStore";
```

### Step 2: Get the addToHistory Function

```typescript
export function OutfitScorerScreen() {
  const addToHistory = useAuthStore((state) => state.addToHistory);

  // ... rest of your component
}
```

### Step 3: Save to History After Scoring

```typescript
const handleAnalyzeOutfit = async (imageUri: string) => {
  try {
    // Your existing analysis logic
    const analysisResult = await analyzeOutfitWithAI(imageUri);
    const score = extractScore(analysisResult);

    // ✅ NEW: Save to history
    await addToHistory({
      type: "scorer",
      result: analysisResult,
      score: score,
    });

    // Show results to user
    setAnalysisResult(analysisResult);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Step 4: Handle History Data on Screen Load (Optional)

If you want to show historical data when navigating from History screen:

```typescript
import { useLocalSearchParams } from "expo-router";

export function OutfitScorerScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if we're loading historical data
    if (params.historyData) {
      try {
        const data = JSON.parse(params.historyData as string);
        // Display the historical result
        setScore(data.score);
        setResult(data.result);
        setDate(data.date);
      } catch (error) {
        console.error("Error parsing history data:", error);
      }
    }
  }, [params]);

  // ... rest of component
}
```

---

## 💬 AI Stylist Integration

### Step 1: Import the History Hook

```typescript
// In your AI stylist screen (e.g., app/ai-stylist.tsx)
import { useAuthStore } from "@/store/authStore";
```

### Step 2: Get the addToHistory Function

```typescript
export function AIStylistScreen() {
  const addToHistory = useAuthStore((state) => state.addToHistory);

  // ... rest of your component
}
```

### Step 3: Save to History After Each AI Response

```typescript
const handleSendMessage = async (userMessage: string) => {
  try {
    // Your existing AI chat logic
    const aiResponse = await getAIResponse(userMessage);

    // ✅ NEW: Save to history
    await addToHistory({
      type: "stylist",
      result: aiResponse,
    });

    // Update chat UI
    addMessageToChat({ role: "assistant", content: aiResponse });
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Step 4: Handle History Data on Screen Load (Optional)

```typescript
import { useLocalSearchParams } from "expo-router";

export function AIStylistScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if we're loading historical conversation
    if (params.historyData) {
      try {
        const data = JSON.parse(params.historyData as string);
        // Display the historical conversation
        setChatHistory([{ role: "assistant", content: data.result }]);
        setConversationDate(data.date);
      } catch (error) {
        console.error("Error parsing history data:", error);
      }
    }
  }, [params]);

  // ... rest of component
}
```

---

## 🎯 Complete Example: Outfit Scorer

Here's a complete example of how to integrate History with an Outfit Scorer screen:

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { analyzeOutfitWithAI } from "@/utils/pollinationsAI";

export function OutfitScorerScreen() {
  const params = useLocalSearchParams();
  const addToHistory = useAuthStore((state) => state.addToHistory);
  const settings = useAuthStore((state) => state.settings);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isHistoricalData, setIsHistoricalData] = useState(false);

  // Load historical data if coming from History screen
  useEffect(() => {
    if (params.historyData) {
      try {
        const data = JSON.parse(params.historyData as string);
        setScore(data.score);
        setAnalysis(data.result);
        setIsHistoricalData(true);
      } catch (error) {
        console.error("Error parsing history data:", error);
      }
    }
  }, [params]);

  const handlePickImage = async () => {
    // Your image picker logic
    const result = await pickImage();
    if (result) {
      setImageUri(result.uri);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;

    try {
      setLoading(true);

      // Analyze with AI
      const result = await analyzeOutfitWithAI(imageUri);
      const calculatedScore = extractScoreFromResult(result);

      setScore(calculatedScore);
      setAnalysis(result);

      // ✅ Save to history (only if not viewing historical data)
      if (!isHistoricalData && settings.saveHistory) {
        await addToHistory({
          type: "scorer",
          result: result,
          score: calculatedScore,
        });
      }
    } catch (error) {
      console.error("Error analyzing outfit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* UI for image picker, analysis display, etc. */}
      {loading && <ActivityIndicator />}

      {!imageUri && (
        <TouchableOpacity onPress={handlePickImage}>
          <Text>Pick an Image</Text>
        </TouchableOpacity>
      )}

      {imageUri && !score && (
        <TouchableOpacity onPress={handleAnalyze}>
          <Text>Analyze Outfit</Text>
        </TouchableOpacity>
      )}

      {score !== null && (
        <View>
          <Text>Score: {score}/100</Text>
          <Text>{analysis}</Text>
        </View>
      )}
    </View>
  );
}

// Helper function to extract score from AI response
function extractScoreFromResult(result: string): number {
  // Your logic to parse score from AI response
  const match = result.match(/score.*?(\d+)/i);
  return match ? parseInt(match[1]) : 75;
}
```

---

## 🎯 Complete Example: AI Stylist

Here's a complete example for AI Stylist integration:

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { generateText } from "@/utils/pollinationsAI";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIStylistScreen() {
  const params = useLocalSearchParams();
  const addToHistory = useAuthStore((state) => state.addToHistory);
  const settings = useAuthStore((state) => state.settings);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHistoricalData, setIsHistoricalData] = useState(false);

  // Load historical conversation if coming from History screen
  useEffect(() => {
    if (params.historyData) {
      try {
        const data = JSON.parse(params.historyData as string);
        setMessages([{ role: "assistant", content: data.result }]);
        setIsHistoricalData(true);
      } catch (error) {
        console.error("Error parsing history data:", error);
      }
    }
  }, [params]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      // Get AI response
      const aiResponse = await generateText({
        messages: [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: inputText },
        ],
        stream: false,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // ✅ Save to history (only for new conversations)
      if (!isHistoricalData && settings.saveHistory) {
        await addToHistory({
          type: "stylist",
          result: aiResponse,
        });
      }

      // After first exchange, this is no longer historical data
      setIsHistoricalData(false);
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        {messages.map((msg, index) => (
          <View key={index}>
            <Text>
              {msg.role}: {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask for style advice..."
        />
        <TouchableOpacity onPress={handleSendMessage} disabled={loading}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## ⚠️ Important Notes

### 1. Check saveHistory Setting

Always check if the user has enabled history saving:

```typescript
const settings = useAuthStore((state) => state.settings);

if (settings.saveHistory) {
  await addToHistory({ ... });
}
```

### 2. Don't Save Historical Views

When viewing data from history, don't save it again:

```typescript
// Only save if this is NOT historical data
if (!isHistoricalData && settings.saveHistory) {
  await addToHistory({ ... });
}
```

### 3. Handle Errors Gracefully

```typescript
try {
  await addToHistory({ ... });
} catch (error) {
  console.error('Failed to save to history:', error);
  // Don't block the user flow if history save fails
}
```

---

## 🧪 Testing Your Integration

### Test Checklist:

1. **Outfit Scorer:**

   - [ ] Score an outfit
   - [ ] Check it appears in History → Outfit Scores tab
   - [ ] Tap the history entry
   - [ ] Verify it shows the same score and analysis

2. **AI Stylist:**

   - [ ] Have a conversation with AI
   - [ ] Check it appears in History → AI Stylist tab
   - [ ] Tap the history entry
   - [ ] Verify it shows the same conversation

3. **Settings:**

   - [ ] Disable "Save History" in Settings
   - [ ] Score an outfit or chat with AI
   - [ ] Verify it does NOT appear in history

4. **Persistence:**
   - [ ] Create some history entries
   - [ ] Close and reopen the app
   - [ ] Verify history is still there

---

## 🎨 UI/UX Tips

### Show Loading States

```typescript
{
  loading && (
    <View>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text>Analyzing your outfit...</Text>
    </View>
  );
}
```

### Show Success Feedback

```typescript
const [showSavedIndicator, setShowSavedIndicator] = useState(false);

await addToHistory({ ... });
setShowSavedIndicator(true);
setTimeout(() => setShowSavedIndicator(false), 2000);

// In JSX
{showSavedIndicator && (
  <Text style={{ color: Colors.success }}>✓ Saved to history</Text>
)}
```

### Handle Historical Data Badge

```typescript
{
  isHistoricalData && (
    <View style={styles.historicalBadge}>
      <Text>From History</Text>
    </View>
  );
}
```

---

## 📚 API Reference

### `addToHistory(entry)`

Adds a new entry to the user's history.

**Parameters:**

- `entry` (object):
  - `type` (string): `'scorer'` or `'stylist'`
  - `result` (string): The AI response text
  - `score` (number, optional): Score value (only for outfit scorer)

**Returns:** `Promise<void>`

**Example:**

```typescript
await addToHistory({
  type: "scorer",
  result: "Your outfit looks great!...",
  score: 85,
});
```

---

## ✅ Summary

Integration is simple:

1. Import `useAuthStore`
2. Get `addToHistory` function
3. Call it after getting AI response
4. Handle historical data on screen load (optional)

**That's it!** The History feature will automatically handle:

- Saving to Supabase (if authenticated)
- Fallback to AsyncStorage
- Displaying in History screen
- Theme adaptation
- Empty states
- Loading states

---

_Integration Guide - October 4, 2025_  
_Ready to implement in your existing screens!_
