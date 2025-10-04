# Product Recommendations - Testing & Debugging Guide

## ✅ Database Verification - WORKING

I tested the database directly and confirmed:

- ✅ Table structure is correct
- ✅ RLS policies allow inserts
- ✅ Foreign key constraints work properly
- ✅ Manual insert successful (1 test record added)

## 🔍 What I Added - Enhanced Logging

I've added extensive console logging to help debug the issue. Here's what to look for:

### In `outfit-scorer.tsx`:

```javascript
// After recommendations are generated
console.log('Checking if we should save recommendations:', {
  hasHistoryId: !!savedHistory.data?.id,
  recommendationsSize: generatedRecommendations.size,
  shouldSave: savedHistory.data?.id && generatedRecommendations.size > 0
});

// If saving
console.log('Starting to save product recommendations to database...');
console.log('Recommendations data:', ...);

// Result
console.log('✅ Product recommendations saved to database successfully');
// OR
console.error('❌ Failed to save product recommendations:', error);
```

### In `productRecommendationStorage.ts`:

```javascript
console.log('📥 saveProductRecommendations called with:', { ... });
console.log('📤 Attempting to insert X records into product_recommendations table');
console.log('✅ Successfully saved X product recommendations');
// OR
console.error('❌ Supabase error saving product recommendations:', error);
```

## 🧪 Testing Instructions

### Step 1: Perform a New Analysis

1. Open the Outfit Scorer screen
2. Upload an outfit image that's **clearly missing items** like:

   - No tie with a formal shirt
   - No shoes visible
   - Missing blazer/jacket
   - No accessories

3. **Add context** (IMPORTANT!): Type something like:

   - "office interview"
   - "formal meeting"
   - "party"

4. Click **"Analyze Outfit"**

5. Wait for the analysis to complete

### Step 2: Check Console Logs

Open your browser/app console and look for these logs **in order**:

```
✅ Expected Log Sequence:
1. "Converting image to base64..."
2. "Analyzing outfit with AI..."
3. "AI Response: {...}"
4. "Detected missing items: [...]"
5. "Generated recommendations for X item types"
6. "Outfit analysis saved to history"
7. "Checking if we should save recommendations: {...}"
8. "Starting to save product recommendations to database..."
9. "📥 saveProductRecommendations called with: {...}"
10. "📤 Attempting to insert X records..."
11. "✅ Successfully saved X product recommendations"
```

### Step 3: If Logs Show Success But DB is Empty

Check these scenarios:

**Scenario A: "⚠️ Skipping recommendation save"**

```javascript
// This means either:
- No history ID was generated
- No recommendations were generated

// Check earlier logs for:
- "Generated recommendations for 0 item types" (no items detected)
- "Outfit analysis saved to history" should show historyId
```

**Scenario B: "❌ Failed to save product recommendations"**

```javascript
// Look for the error message, common issues:
- "violates foreign key constraint" → analysis_id doesn't exist
- "new row violates row-level security policy" → RLS issue
- Other error messages will tell us what's wrong
```

**Scenario C: No Save Logs At All**

```javascript
// This means the code never reached the save block
// Possible reasons:
- generatedRecommendations.size === 0
- No session.user
- No selectedImage
- Error thrown before save
```

## 🔎 What to Report Back

After testing, please share:

1. **Did recommendations appear in the UI?** (Yes/No)

2. **Console logs showing:**

   - "Generated recommendations for X item types" - what is X?
   - "Checking if we should save recommendations" - what are the values?
   - Did you see "📥 saveProductRecommendations called"?
   - Any error messages (copy the full error)

3. **Database check:**
   ```sql
   SELECT COUNT(*) FROM product_recommendations;
   ```
   How many records now?

## 🐛 Common Issues & Solutions

### Issue 1: Recommendations Size is 0

**Symptom:** `recommendationsSize: 0`
**Cause:** No missing items detected by AI
**Solution:**

- Use a more obviously incomplete outfit
- Add specific context (e.g., "office interview")
- Check if AI response includes "improvements" array

### Issue 2: No History ID

**Symptom:** `hasHistoryId: false`
**Cause:** History save failed
**Solution:**

- Check earlier logs for history save errors
- Verify user is logged in (`session.user`)
- Check Supabase connection

### Issue 3: Foreign Key Violation

**Symptom:** "violates foreign key constraint"
**Cause:** analysis_id doesn't match any record in analysis_history
**Solution:**

- This is a timing issue - history save might be failing
- Check if `saveChatHistory` is working properly

## 📊 Database Queries to Help Debug

```sql
-- Check total recommendations
SELECT COUNT(*) FROM product_recommendations;

-- Check recent analysis history
SELECT id, type, created_at
FROM analysis_history
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Check if recommendations exist for recent analysis
SELECT pr.*, ah.created_at
FROM product_recommendations pr
JOIN analysis_history ah ON pr.analysis_id = ah.id
ORDER BY ah.created_at DESC
LIMIT 10;

-- Delete test record I added
DELETE FROM product_recommendations WHERE item_type = 'test_tie';
```

## 🎯 Next Steps

Based on the console logs, I'll be able to identify exactly where the flow is breaking:

1. **If recommendations aren't generated** → Issue with AI parsing or extractMissingItems()
2. **If save isn't called** → Issue with conditions (historyId, recommendationsSize)
3. **If save is called but fails** → Issue with Supabase (will see error details)
4. **If save succeeds but DB is empty** → RLS or transaction issue

Please run a new analysis and share the console logs! 🚀

---

## Current Status

- ✅ Database schema: WORKING
- ✅ RLS policies: WORKING
- ✅ Manual insert: WORKING
- ✅ Storage function: WORKING (enhanced with logging)
- ❓ Integration flow: NEEDS TESTING
- ❓ Recommendation generation: NEEDS VERIFICATION

The fix from earlier should work, but we need to see the logs to confirm the code is being executed.
