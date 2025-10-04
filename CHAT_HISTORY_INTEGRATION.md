# 📝 Chat History Integration Guide

Complete guide for integrating chat history storage and retrieval in the AI Dresser app.

## 🗄️ Database Setup - COMPLETED ✅

### Migration Applied

Two migrations have been successfully applied to your Supabase database:

1. **enhance_analysis_history_for_chat_conversations**

   - Added `conversation_data` JSONB column for complete conversation storage
   - Added `updated_at` timestamp column
   - Updated `type` constraint to use new values: `'outfit_score'` and `'ai_stylist'`
   - Created indexes for efficient querying:
     - `idx_analysis_history_user_created` - on (user_id, created_at DESC)
     - `idx_analysis_history_user_type` - on (user_id, type)
   - Added auto-update trigger for `updated_at` field
   - Migrated existing data to new structure

2. **add_update_policy_analysis_history**
   - Added UPDATE RLS policy allowing users to update their own history

### Database Schema

```sql
Table: analysis_history
├── id                  (UUID, PRIMARY KEY)
├── user_id             (UUID, FOREIGN KEY → auth.users)
├── type                (TEXT, CHECK: 'outfit_score' OR 'ai_stylist')
├── conversation_data   (JSONB) ← NEW: Stores complete conversation
├── created_at          (TIMESTAMPTZ, DEFAULT now())
├── updated_at          (TIMESTAMPTZ, AUTO-UPDATED) ← NEW
├── image_url           (TEXT, nullable) - Legacy field
├── result              (TEXT) - Legacy field
├── score               (INTEGER, nullable) - Legacy field
└── feedback            (JSONB, nullable) - Legacy field
```

### RLS Policies - ACTIVE ✅

- ✅ Users can view their own history (SELECT)
- ✅ Users can insert their own history (INSERT)
- ✅ Users can update their own history (UPDATE)
- ✅ Users can delete their own history (DELETE)

---

## 📦 Files Created

### 1. Type Definitions

**File:** `types/chatHistory.types.ts`

Contains comprehensive TypeScript types:

- `ConversationType` - 'outfit_score' | 'ai_stylist'
- `OutfitScoreConversationData` - Complete outfit scoring data structure
- `AIStylistConversationData` - Complete AI stylist chat data structure
- `ChatHistoryEntry` - Database row interface
- `SaveHistoryOptions` - Options for saving
- `GetHistoryOptions` - Options for retrieval
- `HistoryResponse` - Response interfaces

### 2. Utility Functions

**File:** `utils/chatHistory.ts`

Provides complete functionality:

- `isHistorySavingEnabled(userId)` - Checks user's "Save History" setting
- `saveChatHistory(options)` - Saves conversation (respects toggle)
- `getChatHistory(options)` - Retrieves history with filters & pagination
- `getChatHistoryById(id, userId)` - Get single entry
- `deleteChatHistory(id, userId)` - Delete single entry
- `deleteAllChatHistory(userId, type?)` - Delete all (optional type filter)
- `getHistoryCounts(userId)` - Get counts by type for UI badges

### 3. Database Types Updated

**File:** `types/database.types.ts`

Updated `analysis_history` table types to include:

- `conversation_data` field
- `updated_at` field

---

## 🔧 Integration Steps

### Step 1: Update Outfit Scorer Screen

**File:** `app/outfit-scorer.tsx` (or wherever outfit scoring logic is)

```typescript
import { saveChatHistory } from "../utils/chatHistory";
import { OutfitScoreConversationData } from "../types/chatHistory.types";
import { useAuthStore } from "../store/authStore";

// After getting the outfit score results from AI:
async function saveOutfitScore(
  outfitImage: string,
  score: number,
  feedback: any,
  recommendations: any
) {
  const user = useAuthStore.getState().user;
  if (!user) return;

  // Prepare conversation data
  const conversationData: OutfitScoreConversationData = {
    type: "outfit_score",
    timestamp: new Date().toISOString(),
    outfitImage: outfitImage,
    overallScore: score,
    categoryScores: {
      colorHarmony: feedback.colorScore || 0,
      styleCoherence: feedback.styleScore || 0,
      fitAndProportion: feedback.fitScore || 0,
      occasionAppropriate: feedback.occasionScore || 0,
      accessorizing: feedback.accessoryScore || 0,
    },
    feedback: {
      strengths: feedback.strengths || [],
      improvements: feedback.improvements || [],
      summary: feedback.summary || "",
    },
    recommendations: recommendations,
    images: [outfitImage],
  };

  // Save to history (automatically checks if toggle is ON)
  const result = await saveChatHistory({
    userId: user.id,
    type: "outfit_score",
    conversationData,
  });

  if (result.success) {
    console.log("Outfit score saved to history");
  } else {
    console.log("History not saved:", result.error);
  }
}
```

### Step 2: Update AI Stylist Screen

**File:** `app/ai-stylist.tsx` (or wherever AI stylist logic is)

```typescript
import { saveChatHistory } from "../utils/chatHistory";
import { AIStylistConversationData } from "../types/chatHistory.types";
import { useAuthStore } from "../store/authStore";

// Maintain conversation messages as state
const [messages, setMessages] = useState<
  Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    image?: string;
  }>
>([]);

// After conversation ends or user exits:
async function saveAIStylistConversation() {
  const user = useAuthStore.getState().user;
  if (!user || messages.length === 0) return;

  // Prepare conversation data
  const conversationData: AIStylistConversationData = {
    type: "ai_stylist",
    timestamp: new Date().toISOString(),
    messages: messages,
    recommendations: extractRecommendations(messages), // Helper function
    context: {
      userQuery: messages[0]?.content,
      // Add other context as needed
    },
    images: messages.filter((m) => m.image).map((m) => m.image!),
  };

  // Save to history (automatically checks if toggle is ON)
  const result = await saveChatHistory({
    userId: user.id,
    type: "ai_stylist",
    conversationData,
  });

  if (result.success) {
    console.log("AI Stylist conversation saved to history");
  } else {
    console.log("History not saved:", result.error);
  }
}

// Call this when:
// 1. User navigates away
// 2. Conversation ends
// 3. User manually saves
```

### Step 3: Create History Screen Components

**File:** `screens/HistoryScreen.tsx`

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useApp } from "../contexts/AppContext";
import { useAuthStore } from "../store/authStore";
import { getChatHistory, getHistoryCounts } from "../utils/chatHistory";
import { ChatHistoryEntry } from "../types/chatHistory.types";
import { Colors } from "../constants/colors";

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const { settings } = useApp();
  const isDarkMode = colorScheme === "dark" || settings.isDarkMode;
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<"outfit_score" | "ai_stylist">(
    "outfit_score"
  );
  const [outfitHistory, setOutfitHistory] = useState<ChatHistoryEntry[]>([]);
  const [stylistHistory, setStylistHistory] = useState<ChatHistoryEntry[]>([]);
  const [counts, setCounts] = useState({ outfit_score: 0, ai_stylist: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user]);

  async function loadHistory() {
    if (!user) return;

    setLoading(true);

    // Load both types of history
    const [outfitResult, stylistResult, countsResult] = await Promise.all([
      getChatHistory({ userId: user.id, type: "outfit_score", limit: 50 }),
      getChatHistory({ userId: user.id, type: "ai_stylist", limit: 50 }),
      getHistoryCounts(user.id),
    ]);

    if (outfitResult.success && outfitResult.data) {
      setOutfitHistory(outfitResult.data);
    }

    if (stylistResult.success && stylistResult.data) {
      setStylistHistory(stylistResult.data);
    }

    setCounts(countsResult);
    setLoading(false);
  }

  const currentHistory =
    activeTab === "outfit_score" ? outfitHistory : stylistHistory;

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "outfit_score" && styles.tabActive,
            isDarkMode && styles.tabDark,
            activeTab === "outfit_score" && isDarkMode && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab("outfit_score")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "outfit_score" && styles.tabTextActive,
              isDarkMode && styles.tabTextDark,
            ]}
          >
            Outfit Scores ({counts.outfit_score})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "ai_stylist" && styles.tabActive,
            isDarkMode && styles.tabDark,
            activeTab === "ai_stylist" && isDarkMode && styles.tabActiveDark,
          ]}
          onPress={() => setActiveTab("ai_stylist")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "ai_stylist" && styles.tabTextActive,
              isDarkMode && styles.tabTextDark,
            ]}
          >
            AI Stylist ({counts.ai_stylist})
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView style={styles.historyList}>
        {loading ? (
          <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
            Loading...
          </Text>
        ) : currentHistory.length === 0 ? (
          <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
            No history yet
          </Text>
        ) : (
          currentHistory.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              isDarkMode={isDarkMode}
              onPress={() => handleHistoryItemPress(entry)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  containerDark: {
    backgroundColor: Colors.darkBackground,
  },
  tabContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
  },
  tabDark: {
    backgroundColor: Colors.darkCard,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabActiveDark: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextDark: {
    color: Colors.white,
  },
  tabTextActive: {
    color: Colors.white,
  },
  historyList: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyTextDark: {
    color: Colors.white,
  },
});
```

**File:** `components/HistoryCard.tsx`

```typescript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { ChatHistoryEntry } from "../types/chatHistory.types";
import { Colors } from "../constants/colors";
import { Clock } from "lucide-react-native";

interface HistoryCardProps {
  entry: ChatHistoryEntry;
  isDarkMode: boolean;
  onPress: () => void;
}

export function HistoryCard({ entry, isDarkMode, onPress }: HistoryCardProps) {
  const conversationData = entry.conversation_data;
  const date = new Date(entry.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Render different content based on type
  const isOutfitScore = entry.type === "outfit_score";

  return (
    <TouchableOpacity
      style={[styles.card, isDarkMode && styles.cardDark]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isOutfitScore ? (
        <View style={styles.cardContent}>
          {conversationData.outfitImage && (
            <Image
              source={{ uri: conversationData.outfitImage }}
              style={styles.thumbnail}
            />
          )}
          <View style={styles.cardInfo}>
            <Text
              style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}
            >
              Outfit Score: {conversationData.overallScore}
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                isDarkMode && styles.cardSubtitleDark,
              ]}
            >
              {conversationData.feedback?.summary?.substring(0, 60)}...
            </Text>
            <View style={styles.dateContainer}>
              <Clock
                size={14}
                color={isDarkMode ? Colors.white : Colors.textSecondary}
              />
              <Text
                style={[styles.dateText, isDarkMode && styles.dateTextDark]}
              >
                {formattedDate} at {formattedTime}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text
              style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}
            >
              AI Stylist Chat
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                isDarkMode && styles.cardSubtitleDark,
              ]}
            >
              {conversationData.messages?.length || 0} messages
            </Text>
            <View style={styles.dateContainer}>
              <Clock
                size={14}
                color={isDarkMode ? Colors.white : Colors.textSecondary}
              />
              <Text
                style={[styles.dateText, isDarkMode && styles.dateTextDark]}
              >
                {formattedDate} at {formattedTime}
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: Colors.darkCard,
  },
  cardContent: {
    flexDirection: "row",
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  cardInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  cardTitleDark: {
    color: Colors.white,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  cardSubtitleDark: {
    color: Colors.white,
    opacity: 0.7,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateTextDark: {
    color: Colors.white,
    opacity: 0.6,
  },
});
```

### Step 4: Add History to Navigation

**File:** `app/(tabs)/_layout.tsx`

Add the History tab between Home and Settings:

```typescript
<Tabs.Screen
  name="history"
  options={{
    title: "History",
    tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
  }}
/>
```

**File:** `app/(tabs)/history.tsx`

```typescript
import HistoryScreen from "../../screens/HistoryScreen";

export default HistoryScreen;
```

### Step 5: Render Previous Conversations

When user taps a history item, navigate to the appropriate screen with the conversation data pre-loaded.

**Example for Outfit Score:**

```typescript
import { useLocalSearchParams } from "expo-router";

function OutfitScorerScreen() {
  const params = useLocalSearchParams();
  const [conversationData, setConversationData] = useState(null);

  useEffect(() => {
    // Check if loading from history
    if (params.historyId) {
      loadHistoryEntry(params.historyId);
    }
  }, [params.historyId]);

  async function loadHistoryEntry(historyId: string) {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const entry = await getChatHistoryById(historyId, user.id);
    if (entry) {
      setConversationData(entry.conversation_data);
      // Pre-populate the UI with the conversation data
      displayOutfitScore(entry.conversation_data);
    }
  }

  function displayOutfitScore(data: OutfitScoreConversationData) {
    // Set all the state to show the previous result
    setOutfitImage(data.outfitImage);
    setScore(data.overallScore);
    setFeedback(data.feedback);
    setRecommendations(data.recommendations);
    // etc.
  }

  // Rest of your component...
}
```

---

## 🎨 Theme Consistency

All history components must follow the current theme:

```typescript
const colorScheme = useColorScheme();
const { settings } = useApp();
const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;

// Apply theme to all UI elements
<View style={[styles.container, isDarkMode && styles.containerDark]}>
```

---

## ✅ Testing Checklist

### 1. Database Testing

- [x] Migration applied successfully
- [x] Table has all required columns
- [x] RLS policies are active
- [x] Indexes created for performance

### 2. Save History Toggle

- [ ] Toggle appears in Settings page
- [ ] When OFF, history is NOT saved
- [ ] When ON, history IS saved
- [ ] Setting persists across app restarts

### 3. Outfit Score History

- [ ] Outfit score saves after analysis
- [ ] All data fields are stored (score, feedback, recommendations, image)
- [ ] Can retrieve outfit score history
- [ ] Can view previous outfit score (same UI as original)
- [ ] Date/time displayed correctly

### 4. AI Stylist History

- [ ] Conversation saves after chat session
- [ ] All messages stored correctly
- [ ] Can retrieve AI stylist history
- [ ] Can re-open previous conversation
- [ ] Date/time displayed correctly

### 5. History Screen UI

- [ ] Two tabs display correctly
- [ ] Badge counts show accurate numbers
- [ ] Empty state shows when no history
- [ ] Cards display proper information
- [ ] Scrolling works smoothly
- [ ] Theme switches correctly (dark/light)

### 6. Navigation

- [ ] History icon in bottom nav bar
- [ ] Can navigate to History screen
- [ ] Tapping history item opens detail view
- [ ] Back button returns to History screen

---

## 🔒 Security Notes

- ✅ RLS policies ensure users only see their own history
- ✅ User ID verification on all operations
- ✅ Foreign key constraints to auth.users table
- ✅ No public access without authentication

---

## 📊 Performance Considerations

- **Indexes created** for fast querying by user_id and date
- **Pagination supported** in getChatHistory (limit/offset)
- **JSONB field** for flexible conversation data storage
- **Count queries** optimized with head: true option

---

## 🚀 Next Steps

1. **Implement History Screen UI** - Create the history screen with tabs
2. **Integrate Save Calls** - Add saveChatHistory calls after AI operations
3. **Test Toggle Behavior** - Verify "Save History" toggle works
4. **Add Navigation** - Add History to bottom tabs
5. **Test Theme Switching** - Verify dark/light theme works throughout
6. **Test Data Persistence** - Verify all conversation details are preserved

---

## 📝 Summary

**Database:** ✅ Ready  
**Types:** ✅ Created  
**Utils:** ✅ Created  
**Integration:** ⏳ Pending (follow steps above)  
**Testing:** ⏳ Pending

All backend infrastructure is in place. Now integrate the save/load functions into your UI screens and test thoroughly!
