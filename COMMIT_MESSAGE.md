# Suggested Commit Message

```
feat: Modularize OutfitScorer into self-contained feature module

BREAKING: None - 100% backward compatible

Major refactoring to improve code organization and maintainability:

✨ New Structure:
- Created /OutfitScorer module with screens, components, hooks, utils, types
- Added index.ts files for clean exports
- Moved 13 files into feature module
- Created route wrapper for backward compatibility

🔧 Updates:
- Updated import paths in OutfitScorerScreen.tsx
- Updated imports in ProductRecommendations.tsx
- Updated imports in useImageUpload.ts
- Updated imports in chatHistory.ts
- All global resources (colors, themes, contexts) remain shared

📝 Documentation:
- Added OutfitScorer/README.md - Module documentation
- Added OUTFITSCORER_MODULARIZATION_SUMMARY.md - Refactoring guide
- Added MODULARIZATION_COMPLETE.md - Completion summary
- Moved OUTFIT_SCORER_TIMEOUT_FIX.md to OutfitScorer/docs/

✅ Benefits:
- Self-contained feature module
- Improved maintainability
- Clear separation of concerns
- Easy to test and extend
- Can be versioned independently
- Portable to other projects

🧪 Testing:
- No compilation errors
- All import paths resolved
- Backward compatibility maintained
- Ready for runtime testing

📦 Files Changed:
- Created: OutfitScorer/ directory structure (20 files)
- Modified: app/outfit-scorer.tsx (route wrapper)
- Modified: 4 files for import path updates

Co-authored-by: AI Assistant <ai@assistant.dev>
```

---

## Alternative Short Version

```
feat: Modularize OutfitScorer into /OutfitScorer module

- Move all Outfit Scorer files to /OutfitScorer directory
- Create index.ts files for clean exports
- Update import paths in modularized files
- Add comprehensive documentation
- Maintain 100% backward compatibility

Files: 20 created, 5 modified
Status: ✅ Ready for testing
```

---

## Git Commands

```bash
# Stage all new files
git add OutfitScorer/

# Stage modified files
git add app/outfit-scorer.tsx
git add *.md

# Review changes
git status
git diff --staged

# Commit
git commit -F .git/COMMIT_MESSAGE

# Or commit directly
git commit -m "feat: Modularize OutfitScorer into self-contained feature module"

# Push
git push origin outfit-score-v2
```
