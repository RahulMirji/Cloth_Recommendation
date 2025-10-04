# 🏗️ Chat History Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI DRESSER APP                               │
│                      Chat History Feature                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          MOBILE APP (React Native + Expo)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Home Tab   │  │ History Tab  │  │ Settings Tab │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│         │                  │                  │                     │
│         │                  │                  │                     │
│         │                  ▼                  │                     │
│         │       ┌──────────────────┐         │                     │
│         │       │  HistoryScreen   │         │                     │
│         │       │  ┌────┐  ┌────┐ │         │                     │
│         │       │  │Out-│  │ AI │ │         │                     │
│         │       │  │fit │  │Sty-│ │         │                     │
│         │       │  └────┘  └────┘ │         │                     │
│         │       │                  │         │                     │
│         │       │  ┌────────────┐ │         │                     │
│         │       │  │ History    │ │         │                     │
│         │       │  │ Cards      │ │         │                     │
│         │       │  │ (gradient) │ │         │                     │
│         │       │  └────────────┘ │         │                     │
│         │       └──────────────────┘         │                     │
│         │                  │                  │                     │
│         ▼                  ▼                  ▼                     │
│  ┌──────────────────────────────────────────────────┐             │
│  │           Outfit Scorer      AI Stylist           │             │
│  │                                                    │             │
│  │  1. User analyzes outfit  or  chats with AI      │             │
│  │  2. Gets AI response/score                        │             │
│  │  3. Calls saveChatHistory()  ────────────┐       │             │
│  └──────────────────────────────────────────│────────┘             │
│                                              │                      │
└──────────────────────────────────────────────│──────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      UTILS LAYER (TypeScript)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  chatHistory.ts                                              │  │
│  │                                                              │  │
│  │  • isHistorySavingEnabled(userId) ─────► Check Settings    │  │
│  │                                                              │  │
│  │  • saveChatHistory(options)                                 │  │
│  │    ├─ Check if "Save History" is ON                        │  │
│  │    ├─ Prepare conversation_data                            │  │
│  │    └─ Insert to Supabase ──────────────┐                   │  │
│  │                                         │                   │  │
│  │  • getChatHistory(options)             │                   │  │
│  │    ├─ Query with filters               │                   │  │
│  │    ├─ Pagination support                │                   │  │
│  │    └─ Return typed data ──────────┐    │                   │  │
│  │                                    │    │                   │  │
│  │  • getChatHistoryById(id, userId) │    │                   │  │
│  │  • deleteChatHistory(id, userId)  │    │                   │  │
│  │  • getHistoryCounts(userId)       │    │                   │  │
│  └────────────────────────────────────────│────│───────────────┘  │
│                                            │    │                  │
└────────────────────────────────────────────│────│──────────────────┘
                                             │    │
                                             ▼    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TABLE: analysis_history                                     │  │
│  │                                                              │  │
│  │  Columns:                                                    │  │
│  │  ├─ id (UUID, PK)                                           │  │
│  │  ├─ user_id (UUID, FK → auth.users) ◄─ RLS FILTERED        │  │
│  │  ├─ type ('outfit_score' | 'ai_stylist')                   │  │
│  │  ├─ conversation_data (JSONB) ◄──── COMPLETE CONVERSATION  │  │
│  │  ├─ created_at (TIMESTAMPTZ)                               │  │
│  │  ├─ updated_at (TIMESTAMPTZ) ◄──── AUTO-UPDATED           │  │
│  │  └─ ... legacy fields ...                                   │  │
│  │                                                              │  │
│  │  Indexes:                                                    │  │
│  │  ├─ idx_analysis_history_user_created (user_id, created_at)│  │
│  │  └─ idx_analysis_history_user_type (user_id, type)        │  │
│  │                                                              │  │
│  │  RLS Policies:                                               │  │
│  │  ├─ SELECT: auth.uid() = user_id                           │  │
│  │  ├─ INSERT: auth.uid() = user_id                           │  │
│  │  ├─ UPDATE: auth.uid() = user_id                           │  │
│  │  └─ DELETE: auth.uid() = user_id                           │  │
│  │                                                              │  │
│  │  Triggers:                                                   │  │
│  │  └─ BEFORE UPDATE: Set updated_at = now()                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TABLE: app_settings                                         │  │
│  │                                                              │  │
│  │  Columns:                                                    │  │
│  │  ├─ user_id (UUID)                                          │  │
│  │  ├─ save_history (BOOLEAN) ◄──── TOGGLE CHECKED HERE       │  │
│  │  ├─ is_dark_mode (BOOLEAN)                                  │  │
│  │  └─ ...                                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Saving Outfit Score

```
User takes photo in Outfit Scorer
           │
           ▼
    AI analyzes outfit
           │
           ▼
    Display results to user
           │
           ▼
┌──────────────────────────┐
│ saveChatHistory({        │
│   userId: user.id,       │
│   type: 'outfit_score',  │
│   conversationData: {    │
│     outfitImage: '...',  │
│     overallScore: 85,    │
│     feedback: {...},     │
│     recommendations: {}, │
│   }                      │
│ })                       │
└──────────────────────────┘
           │
           ▼
Check "Save History" toggle
           │
     ┌─────┴─────┐
     │           │
    OFF         ON
     │           │
     ▼           ▼
  Skip      Continue
           │
           ▼
Insert to Supabase
           │
           ▼
RLS Policy validates user_id
           │
           ▼
    Record saved ✅
```

### 2. Viewing History

```
User opens History tab
           │
           ▼
┌──────────────────────────┐
│ getChatHistory({         │
│   userId: user.id,       │
│   type: 'outfit_score',  │
│   limit: 50              │
│ })                       │
└──────────────────────────┘
           │
           ▼
Query Supabase with RLS
           │
           ▼
RLS filters by user_id automatically
           │
           ▼
Index speeds up query ⚡
           │
           ▼
Return sorted results
           │
           ▼
Display in beautiful cards
           │
           ▼
User sees their history 🎉
```

### 3. Reopening Conversation

```
User taps history card
           │
           ▼
Navigate with historyId param
           │
           ▼
┌──────────────────────────┐
│ getChatHistoryById(      │
│   historyId,             │
│   userId                 │
│ )                        │
└──────────────────────────┘
           │
           ▼
Fetch specific entry
           │
           ▼
RLS validates ownership
           │
           ▼
Extract conversation_data
           │
           ▼
Pre-populate screen UI
           │
           ▼
User sees exact same data ✅
```

---

## conversation_data Structure

### Outfit Score Type

```
{
  type: 'outfit_score',
  timestamp: '2025-10-04T12:34:56.789Z',
  ┌─────────────────────────────────────────┐
  │ COMPLETE OUTFIT ANALYSIS DATA           │
  ├─────────────────────────────────────────┤
  │ outfitImage: 'https://...'              │
  │ overallScore: 85                        │
  │ categoryScores: {                       │
  │   colorHarmony: 90,                     │
  │   styleCoherence: 85,                   │
  │   fitAndProportion: 80,                 │
  │   occasionAppropriate: 88,              │
  │   accessorizing: 82                     │
  │ }                                        │
  │ feedback: {                             │
  │   strengths: ['...', '...'],            │
  │   improvements: ['...', '...'],         │
  │   summary: '...'                        │
  │ }                                        │
  │ recommendations: {                      │
  │   colorSuggestions: ['...'],            │
  │   styleTips: ['...'],                   │
  │   accessoryRecommendations: ['...']     │
  │ }                                        │
  │ images: ['https://...']                 │
  └─────────────────────────────────────────┘
}
```

### AI Stylist Type

```
{
  type: 'ai_stylist',
  timestamp: '2025-10-04T12:34:56.789Z',
  ┌─────────────────────────────────────────┐
  │ COMPLETE CHAT CONVERSATION              │
  ├─────────────────────────────────────────┤
  │ messages: [                             │
  │   {                                      │
  │     role: 'user',                       │
  │     content: 'What should I wear?',     │
  │     timestamp: '...',                   │
  │     image: 'https://...'                │
  │   },                                     │
  │   {                                      │
  │     role: 'assistant',                  │
  │     content: 'I recommend...',          │
  │     timestamp: '...'                    │
  │   },                                     │
  │   ...more messages                      │
  │ ]                                        │
  │ recommendations: {                      │
  │   outfitSuggestions: ['...'],           │
  │   shoppingSuggestions: ['...'],         │
  │   styleTips: ['...']                    │
  │ }                                        │
  │ context: {                              │
  │   userQuery: 'What should I wear?',     │
  │   occasion: 'wedding',                  │
  │   season: 'summer'                      │
  │ }                                        │
  │ images: ['https://...']                 │
  └─────────────────────────────────────────┘
}
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST FROM CLIENT                           │
│                                                                  │
│  User makes request (SELECT, INSERT, UPDATE, DELETE)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUPABASE AUTH CHECK                              │
│                                                                  │
│  ├─ Is user authenticated?                                      │
│  ├─ Extract auth.uid() from JWT token                           │
│  └─ If not authenticated → REJECT ❌                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RLS POLICY CHECK                              │
│                                                                  │
│  For analysis_history table:                                     │
│                                                                  │
│  SELECT Policy:                                                  │
│  ├─ USING (auth.uid() = user_id)                                │
│  └─ User can only SELECT their own rows                         │
│                                                                  │
│  INSERT Policy:                                                  │
│  ├─ WITH CHECK (auth.uid() = user_id)                           │
│  └─ User can only INSERT with their user_id                     │
│                                                                  │
│  UPDATE Policy:                                                  │
│  ├─ USING (auth.uid() = user_id)                                │
│  ├─ WITH CHECK (auth.uid() = user_id)                           │
│  └─ User can only UPDATE their own rows                         │
│                                                                  │
│  DELETE Policy:                                                  │
│  ├─ USING (auth.uid() = user_id)                                │
│  └─ User can only DELETE their own rows                         │
│                                                                  │
│  If policy fails → REJECT ❌                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FOREIGN KEY CHECK                              │
│                                                                  │
│  ├─ user_id exists in auth.users?                               │
│  └─ If not → REJECT ❌                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TYPE CONSTRAINT CHECK                          │
│                                                                  │
│  ├─ type IN ('outfit_score', 'ai_stylist')?                     │
│  └─ If not → REJECT ❌                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTE QUERY ✅                             │
│                                                                  │
│  Query executes successfully                                     │
│  Return data to client                                           │
└─────────────────────────────────────────────────────────────────┘

Result: User can ONLY access their own data! 🔒
```

---

## Performance Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                              │
│                                                                  │
│  getChatHistory({ userId, type: 'outfit_score', limit: 50 })   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     QUERY OPTIMIZER                              │
│                                                                  │
│  SELECT * FROM analysis_history                                  │
│  WHERE user_id = $1        ◄─── Uses INDEX                     │
│    AND type = $2            ◄─── Uses INDEX                     │
│  ORDER BY created_at DESC   ◄─── Uses INDEX                     │
│  LIMIT 50                   ◄─── Pagination                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INDEX USAGE                                    │
│                                                                  │
│  idx_analysis_history_user_created:                              │
│  ├─ Covers: user_id, created_at DESC                            │
│  └─ Perfect for chronological user queries ⚡                   │
│                                                                  │
│  idx_analysis_history_user_type:                                 │
│  ├─ Covers: user_id, type                                       │
│  └─ Perfect for filtered queries ⚡                             │
│                                                                  │
│  Result: Query is FAST even with thousands of records!          │
└─────────────────────────────────────────────────────────────────┘

Without indexes: Full table scan = SLOW 🐌
With indexes: Direct lookup = FAST ⚡
```

---

## UI Component Hierarchy

```
app/(tabs)/history.tsx
  │
  ├─► screens/HistoryScreen.tsx
       │
       ├─► Header
       │    ├─ History icon
       │    ├─ Title
       │    └─ Subtitle
       │
       ├─► Tab Switcher
       │    ├─ Outfit Scores Tab (with badge)
       │    └─ AI Stylist Tab (with badge)
       │
       ├─► ScrollView (with RefreshControl)
       │    │
       │    └─► HistoryCard[] (for each entry)
       │         │
       │         └─► components/HistoryCard.tsx
       │              ├─ LinearGradient border
       │              ├─ Image/Icon
       │              ├─ Title
       │              ├─ Score/Message count
       │              ├─ Summary text
       │              ├─ Date/Time
       │              └─ Delete button
       │
       └─► Empty State
            ├─ Icon
            ├─ Title
            └─ Subtitle
```

---

## File Structure

```
ai-dresser/
├── app/
│   └── (tabs)/
│       ├── _layout.tsx          ◄─── Add History tab here
│       ├── index.tsx
│       ├── history.tsx           ◄─── Route file (exists)
│       └── settings.tsx
│
├── screens/
│   ├── HistoryScreen.tsx         ◄─── NEW: Main history screen
│   └── history/                  ◄─── Old partial implementation
│       └── ...
│
├── components/
│   └── HistoryCard.tsx           ◄─── NEW: History card component
│
├── utils/
│   └── chatHistory.ts            ◄─── NEW: CRUD functions
│
├── types/
│   ├── chatHistory.types.ts      ◄─── NEW: Type definitions
│   └── database.types.ts         ◄─── UPDATED: Added new fields
│
├── lib/
│   └── supabase.ts               ◄─── Existing Supabase client
│
└── docs/
    ├── CHAT_HISTORY_INTEGRATION.md
    ├── CHAT_HISTORY_SETUP_COMPLETE.md
    ├── CHAT_HISTORY_TECHNICAL_SUMMARY.md
    ├── QUICK_START_CHAT_HISTORY.md
    ├── DATABASE_VERIFICATION.md
    ├── COMPLETE_CHAT_HISTORY_SUMMARY.md
    └── ARCHITECTURE_DIAGRAM.md    ◄─── This file
```

---

## Theme System

```
┌─────────────────────────────────────────────────────────────────┐
│                     THEME DETECTION                              │
│                                                                  │
│  const colorScheme = useColorScheme();  ◄─── System preference │
│  const { settings } = useApp();         ◄─── User setting      │
│  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;│
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   THEME APPLICATION                              │
│                                                                  │
│  Light Mode:                 Dark Mode:                         │
│  ├─ Background: #FFFFFF      ├─ Background: #0F172A            │
│  ├─ Card: #FFFFFF            ├─ Card: #1E293B                  │
│  ├─ Text: #1F2937            ├─ Text: #FFFFFF                  │
│  ├─ Secondary: #6B7280       ├─ Secondary: #FFFFFF (60%)       │
│  └─ Border: #E5E7EB          └─ Border: rgba(255,255,255,0.1) │
│                                                                  │
│  Accent Colors (Same in both):                                  │
│  ├─ Primary: #8B5CF6 (Purple)                                  │
│  ├─ Secondary: #EC4899 (Pink)                                  │
│  └─ Gradient: Purple → Pink                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

This architecture provides:

- ✅ **Scalability** - Can handle millions of history entries
- ✅ **Security** - Complete user isolation
- ✅ **Performance** - Indexed queries are fast
- ✅ **Flexibility** - JSONB allows schema evolution
- ✅ **Maintainability** - Clean separation of concerns
- ✅ **User Experience** - Beautiful, theme-aware UI

**Ready for production! 🚀**
