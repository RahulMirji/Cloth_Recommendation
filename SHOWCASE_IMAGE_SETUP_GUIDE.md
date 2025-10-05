# 📸 Outfit Scorer Showcase - Image Setup Guide

## 🎯 Overview

You need to add **2 images** to showcase the Outfit Scorer functionality on the home screen.

---

## 📁 Location

Place the images in the following directory:

```
d:\ai-dresser\assets\images\showcase\
```

---

## 🖼️ Required Images

### 1. **Women's Formal Outfit**

- **Filename**: `women-formal.jpg`
- **Full Path**: `d:\ai-dresser\assets\images\showcase\women-formal.jpg`
- **Score**: 83
- **Category**: Excellent
- **Summary**: "This outfit presents a clean and classic office-appropriate silhouette, with a sharp contrast between the white blouse and black skirt."
- **Recommendations**:
  - Professional office attire
  - White blouse with black skirt
  - Clean, classic silhouette
  - Good color contrast

---

### 2. **Men's Formal Outfit**

- **Filename**: `men-formal.jpg`
- **Full Path**: `d:\ai-dresser\assets\images\showcase\men-formal.jpg`
- **Score**: 89
- **Category**: Outstanding
- **Summary**: "Impeccably tailored navy suit with crisp white shirt creates a powerful professional presence. The fit is excellent across shoulders and torso, with proper sleeve length and trouser break."
- **Recommendations**:
  - Professional business attire
  - Navy suit with white shirt
  - Well-tailored and fitted
  - Proper proportions

---

## 📐 Image Specifications

### Recommended Dimensions:

- **Width**: 400-800px
- **Height**: 600-1200px (portrait orientation)
- **Aspect Ratio**: 1:1.5 or 2:3 (portrait)
- **Format**: JPG or PNG
- **File Size**: < 500KB each (for optimal app performance)

### Image Quality:

- **Resolution**: High quality, clear details
- **Lighting**: Good, even lighting
- **Background**: Clean, uncluttered
- **Focus**: Full-body or 3/4 body shot showing outfit clearly
- **Composition**: Person should be centered, outfit clearly visible

---

## 🎨 What to Look For in Images

### Women's Formal (83 score):

- ✅ White blouse (clean, professional)
- ✅ Black skirt (pencil or A-line)
- ✅ Office-appropriate length
- ✅ Clean silhouette
- ✅ Professional appearance
- ⚠️ Minor room for improvement (hence 83, not 90+)

### Men's Formal (89 score):

- ✅ Navy blue suit (well-tailored)
- ✅ Crisp white shirt
- ✅ Proper fit across shoulders
- ✅ Good sleeve length
- ✅ Proper trouser break
- ✅ Professional tie (optional but preferred)
- ⚠️ Near-perfect but not absolute perfection (hence 89)

---

## 🚀 How to Add the Images

### Step 1: Prepare Your Images

1. Download or capture the two outfit images
2. Rename them to match the required filenames:
   - `women-formal.jpg`
   - `men-formal.jpg`

### Step 2: Place in Directory

1. Navigate to: `d:\ai-dresser\assets\images\showcase\`
2. Copy both images into this folder
3. Ensure filenames match exactly (case-sensitive)

### Step 3: Verify

After adding images, restart the Expo server:

```bash
npx expo start --clear
```

---

## 🖼️ Image Source Suggestions

### Where to Find Images:

1. **Stock Photo Websites** (Free):

   - Unsplash (unsplash.com) - High-quality professional photos
   - Pexels (pexels.com) - Free stock photos
   - Pixabay (pixabay.com) - Free images

   **Search Terms**:

   - For Women: "business woman office attire", "professional woman white blouse black skirt"
   - For Men: "businessman navy suit", "professional man suit office"

2. **AI-Generated** (if needed):

   - Midjourney, DALL-E, or Stable Diffusion
   - Prompts:
     - Women: "Professional woman in white blouse and black pencil skirt, office attire, full body, studio lighting, clean background"
     - Men: "Professional businessman in navy blue suit and white shirt, well-tailored, full body, studio lighting, clean background"

3. **Take Your Own**:
   - Photograph someone in appropriate attire
   - Use good lighting
   - Clean background
   - Portrait orientation

---

## 🔧 Troubleshooting

### If Images Don't Show:

1. **Check Filename**:

   - Must be exactly: `women-formal.jpg` and `men-formal.jpg`
   - Check for typos, extra spaces, or wrong extensions

2. **Check Location**:

   - Must be in: `d:\ai-dresser\assets\images\showcase\`
   - Not in a subfolder

3. **Clear Cache**:

   ```bash
   npx expo start --clear
   ```

4. **Check File Format**:

   - Use JPG or PNG
   - Avoid WEBP or other formats

5. **Check File Size**:
   - Should be < 500KB
   - If larger, compress the image

---

## 📱 How It Will Look

### In the App:

- Showcase section appears after "How It Works"
- Two cards displayed vertically
- Each card shows:
  - Image (240px height)
  - Score badge overlay (top-right corner)
  - Category label
  - Gender badge ("Women's Formal" / "Men's Formal")
  - Summary text
- Dark mode supported
- Same styling as other info cards

---

## ✨ Quick Setup Commands

```bash
# 1. Navigate to showcase directory
cd d:\ai-dresser\assets\images\showcase

# 2. Add your images here (women-formal.jpg and men-formal.jpg)

# 3. Return to project root
cd d:\ai-dresser

# 4. Clear cache and restart
npx expo start --clear
```

---

## 📋 Checklist

Before testing:

- [ ] Created `showcase` folder in `assets/images/`
- [ ] Added `women-formal.jpg` to showcase folder
- [ ] Added `men-formal.jpg` to showcase folder
- [ ] Verified filenames are correct (no typos)
- [ ] Verified images are portrait orientation
- [ ] Verified file sizes are reasonable (< 500KB)
- [ ] Cleared Expo cache: `npx expo start --clear`
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Verified images load correctly

---

## 🎯 Expected Result

Once images are added, you should see:

1. ✅ "See It In Action" section on home screen
2. ✅ Two showcase cards with images
3. ✅ Score badges (83 and 89) overlaid on images
4. ✅ Category labels ("Excellent" and "Outstanding")
5. ✅ Gender badges ("Women's Formal" and "Men's Formal")
6. ✅ Summary text under each image
7. ✅ Dark mode compatible styling

---

## 💡 Tips

1. **Image Quality**: Higher quality images create better first impressions
2. **Consistency**: Use similar style/lighting for both images
3. **Professional**: Choose images that look polished and professional
4. **Diversity**: If possible, show diversity in models
5. **File Size**: Optimize images to keep app size reasonable

---

## 📞 Support

If images still don't appear after following this guide:

1. Check console for error messages
2. Verify file paths are correct
3. Try PNG format if JPG doesn't work
4. Ensure Metro bundler has restarted with clear cache

---

**Last Updated**: October 5, 2025  
**Status**: ✅ Component Created - Awaiting Images
