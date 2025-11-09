# Gemini API Integration - Visual Flow Diagram

## 🔀 Request Routing Logic

```
User Opens Outfit Scorer
         ↓
    Takes/Uploads Photo
         ↓
    Clicks "Analyze Outfit"
         ↓
         ↓
    ┌────┴────┐
    │  Code   │ OutfitScorerScreen.tsx
    │  Reads  │ const globalModel = await getGlobalModel();
    │  Model  │
    └────┬────┘
         ↓
         ↓
    ┌────┴─────────────────────────────────────┐
    │ AsyncStorage Lookup                      │
    │ Key: @admin_selected_model               │
    │ Returns: "gemini-flash" OR "gemini-2-flash" │
    └────┬─────────────────────────────────────┘
         ↓
         ↓
    ┌────┴────┐
    │ Model   │ const model = AI_MODELS.find(m => m.id === savedId)
    │ Object  │
    │ Loaded  │ Returns full model configuration:
    └────┬────┘ { id, name, provider, endpoint, ... }
         ↓
         ↓
    ┌────┴────┐
    │  Call   │ await generateTextWithImageModel(
    │   API   │   globalModel,
    │ Helper  │   base64Image,
    └────┬────┘   prompt
         ↓         )
         ↓
    ┌────┴────────────────────────────┐
    │ multiModelAI.ts                 │
    │ generateTextWithImageModel()    │
    │                                 │
    │ if (model.provider === 'gemini') {  ← NEW CHECK
    │   return callGeminiAPI(...)     │
    │ } else {                        │
    │   return generateTextWithModel(...)  ← EXISTING
    │ }                               │
    └────┬─────────────┬──────────────┘
         ↓             ↓
    provider =     provider = 
    'gemini'       'pollinations'
         ↓             ↓
         ↓             ↓
    ┌────┴────┐   ┌────┴────┐
    │ NEW API │   │EXISTING │
    │         │   │  API    │
    └────┬────┘   └────┬────┘
         ↓             ↓
         ↓             ↓
┌────────┴────────┐ ┌────────┴────────┐
│  Gemini API     │ │ Pollinations    │
│  (Official)     │ │ API (Proxy)     │
│                 │ │                 │
│ POST https://   │ │ POST https://   │
│ generative      │ │ text.           │
│ language.       │ │ pollinations.ai │
│ googleapis.com  │ │ /openai         │
│                 │ │                 │
│ Headers:        │ │ Headers:        │
│ - Content-Type  │ │ - Authorization │
│                 │ │ - Content-Type  │
│ Query Params:   │ │                 │
│ ?key=API_KEY    │ │ Body:           │
│                 │ │ {               │
│ Body:           │ │   model: "..."  │
│ {               │ │   messages: []  │
│   contents: []  │ │ }               │
│   config: {}    │ │                 │
│ }               │ │                 │
└────────┬────────┘ └────────┬────────┘
         ↓                   ↓
         ↓                   ↓
    ┌────┴────┐         ┌────┴────┐
    │ Parse   │         │ Parse   │
    │ Gemini  │         │ OpenAI  │
    │ Format  │         │ Format  │
    └────┬────┘         └────┬────┘
         ↓                   ↓
         └──────────┬────────┘
                    ↓
              Return JSON
                    ↓
         Display Results to User
```

---

## 🎛️ Admin Dashboard Control Flow

```
Admin Login
    ↓
Dashboard Screen
    ↓
Scrolls to "AI Model Management" Section
    ↓
    ┌──────────────────────────────────────┐
    │  ModelManagementCard Component       │
    │                                      │
    │  Current Active: Gemini 1.5 Flash    │
    │                                      │
    │  Switch Model:                       │
    │  ○ Gemini 1.5 Flash (Pollinations)  │
    │  ● Gemini 2.0 Flash (Official)  ← SELECTED
    │  ○ Fine-tuned LLaVA                 │
    └──────────────────────────────────────┘
                    ↓
         Admin Clicks Model
                    ↓
    ┌──────────────────────────────────────┐
    │ handleSelectModel() triggered        │
    │                                      │
    │ 1. setSelectedModel(model)          │
    │ 2. AsyncStorage.setItem(            │
    │      '@admin_selected_model',       │
    │      'gemini-2-flash'                │
    │    )                                 │
    │ 3. Show checkmark on selected       │
    └──────────────────────────────────────┘
                    ↓
         ✅ Model Switch Complete
                    ↓
    All Future Requests from ALL USERS
         Will Use Gemini 2.0 Flash
```

---

## 🔄 Comparison: Before vs After

### BEFORE (Current - All via Pollinations)

```
User Request
    ↓
OutfitScorerScreen
    ↓
getGlobalModel() → "gemini-flash"
    ↓
generateTextWithImageModel()
    ↓
ALWAYS calls generateTextWithModel()
    ↓
ALWAYS goes to: https://text.pollinations.ai/openai
    ↓
Pollinations Proxy
    ↓
Gemini 1.5 Flash (via proxy)
```

### AFTER (New - Choice Between Direct & Proxy)

```
User Request
    ↓
OutfitScorerScreen
    ↓
getGlobalModel() → "gemini-flash" OR "gemini-2-flash"
    ↓
generateTextWithImageModel(model, ...)
    ↓
IF model.provider === 'gemini':
    ↓
    callGeminiAPI() ← NEW PATH
    ↓
    https://generativelanguage.googleapis.com/...
    ↓
    Gemini 2.0 Flash (DIRECT)
    
ELSE model.provider === 'pollinations':
    ↓
    generateTextWithModel() ← EXISTING PATH
    ↓
    https://text.pollinations.ai/openai
    ↓
    Gemini 1.5 Flash (via proxy)
```

---

## 📦 Data Structure Changes

### AI_MODELS Array (Before)

```javascript
[
  {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'pollinations',  ← Via proxy
    modelName: 'gemini',
    endpoint: 'https://text.pollinations.ai/openai',
  },
  {
    id: 'finetuned-llava',
    name: 'Fine-tuned LLaVA',
    provider: 'pollinations',
    // ...
  }
]
```

### AI_MODELS Array (After)

```javascript
[
  {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'pollinations',  ← Via proxy (unchanged)
    modelName: 'gemini',
    endpoint: 'https://text.pollinations.ai/openai',
  },
  {
    id: 'gemini-2-flash',  ← NEW
    name: 'Gemini 2.0 Flash (Official)',
    provider: 'gemini',  ← NEW provider type
    modelName: 'gemini-2.0-flash-exp',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  },
  {
    id: 'finetuned-llava',
    name: 'Fine-tuned LLaVA',
    provider: 'pollinations',  ← Unchanged
    // ...
  }
]
```

---

## 🔐 API Key Flow

```
App Starts
    ↓
Loads .env file
    ↓
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
    ↓
Available in app via:
- Constants.expoConfig.extra.geminiApiKey
- process.env.EXPO_PUBLIC_GEMINI_API_KEY
    ↓
User Selects "Gemini 2.0 Flash (Official)"
    ↓
User Analyzes Outfit
    ↓
callGeminiAPI() executed
    ↓
    ┌──────────────────────────┐
    │ Check API Key Exists     │
    │                          │
    │ if (!apiKey) {          │
    │   throw Error(...)       │
    │ }                        │
    └──────────────────────────┘
    ↓
API Key Found ✅
    ↓
Construct URL:
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSy...
    ↓
Make Request
    ↓
Success! ✅
```

---

## 🧪 Testing Scenarios

### Scenario 1: Switch from Pollinations to Gemini

```
1. Admin in Dashboard
2. Current: Gemini 1.5 Flash (Pollinations)
3. Clicks: Gemini 2.0 Flash (Official)
4. AsyncStorage saves: "gemini-2-flash"
5. User opens Outfit Scorer
6. Takes photo, clicks Analyze
7. getGlobalModel() returns: gemini-2-flash model object
8. generateTextWithImageModel() checks: model.provider === 'gemini' ✅
9. Calls: callGeminiAPI()
10. Request goes to: Google Gemini API (direct)
11. Response parsed from Gemini format
12. Results displayed ✅
```

### Scenario 2: Switch back to Pollinations

```
1. Admin in Dashboard
2. Current: Gemini 2.0 Flash (Official)
3. Clicks: Gemini 1.5 Flash (Pollinations)
4. AsyncStorage saves: "gemini-flash"
5. User opens Outfit Scorer
6. Takes photo, clicks Analyze
7. getGlobalModel() returns: gemini-flash model object
8. generateTextWithImageModel() checks: model.provider === 'pollinations' ✅
9. Calls: generateTextWithModel() (existing code)
10. Request goes to: Pollinations proxy
11. Response parsed from OpenAI format
12. Results displayed ✅
```

### Scenario 3: Missing API Key

```
1. Admin selects: Gemini 2.0 Flash (Official)
2. User analyzes outfit
3. callGeminiAPI() executes
4. Checks for API key
5. API key NOT found ❌
6. Throws error: "Gemini API key not configured..."
7. Error caught in OutfitScorerScreen
8. User sees alert: "Failed to analyze outfit"
9. Error message: "Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to .env"
10. User can try again or admin can switch models
```

---

## 🎯 Key Points for Decision

### ✅ What Stays the Same
- User experience (same UI)
- AIStylist feature (separate API)
- ImageGen feature (separate API)
- Dashboard UI (auto-updates)
- Model storage mechanism
- Error handling structure

### 🆕 What's New
- New model option in Dashboard
- Gemini official API integration
- Request routing based on provider
- Gemini-specific response parsing
- API key management

### 🔒 Safety Measures
- Isolated changes (only OutfitScorer)
- Backward compatible (existing models work)
- Graceful error handling (missing key, API errors)
- Easy rollback (just switch model in Dashboard)
- No database changes
- No breaking changes

---

## 📊 Decision Matrix

| Criteria | Score | Notes |
|----------|-------|-------|
| **Risk** | 🟢 LOW | Changes are isolated and reversible |
| **Complexity** | 🟢 LOW | Well-defined interfaces, clear routing |
| **Testing** | 🟡 MEDIUM | Need to test multiple models |
| **Value** | 🟢 HIGH | Access to latest Gemini features |
| **Timeline** | 🟢 FAST | 4-5 hours total |
| **Maintenance** | 🟢 EASY | Clean separation of concerns |

**Overall**: 🟢 **LOW RISK, HIGH REWARD**

---

## 🚦 Ready to Proceed?

If you approve, I will implement:
1. ✅ Create `geminiAPI.ts` with official Gemini integration
2. ✅ Update `aiModels.ts` to add Gemini 2.0 Flash
3. ✅ Update `multiModelAI.ts` to route based on provider
4. ✅ Update `.env` with API key placeholder
5. ✅ Update `app.json` to expose env variable
6. ✅ Add comprehensive error handling
7. ✅ Provide testing instructions

**All changes will be in the `models` branch** - easy to review and rollback if needed!

---

Generated by: GitHub Copilot  
Date: 9 November 2025
