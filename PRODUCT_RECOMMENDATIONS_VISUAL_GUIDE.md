# 🎨 Product Recommendations - Visual Guide

## 📱 **Screen Flow**

```
┌─────────────────────────────────────┐
│  Outfit Scorer                   [X]│
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │      [Outfit Photo]         │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │       Score: 72/100         │   │
│   │         Good ⭐             │   │
│   └─────────────────────────────┘   │
│                                     │
│   📝 Overall Feedback               │
│   Professional look but missing     │
│   key elements for an interview     │
│                                     │
│   ✨ Strengths                      │
│   • Clean color palette            │
│   • Good fit and proportions       │
│   • Appropriate style              │
│                                     │
│   💡 Room for Improvement           │
│   • Consider adding a tie          │
│   • Formal shoes would complete    │
│     the outfit                     │
│                                     │
├─────────────────────────────────────┤
│  🛍️ My Recommendations             │
│  Shop the missing pieces for your  │
│  perfect outfit                    │
├─────────────────────────────────────┤
│                                     │
│  Tie                      4 options │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 👔  │ │ 👔  │ │ 👔  │ │ 👔  │  │
│  │ F   │ │ A   │ │ M   │ │ F   │  │
│  ├─────┤ ├─────┤ ├─────┤ ├─────┤  │
│  │Classic│Professional│Striped│Premium│
│  │Silk │ │Cotton│ │Formal│ │Tie │  │
│  │[Shop]│ │[Shop]│ │[Shop]│ │[Shop]│
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│          ← Scroll →                │
│                                     │
│  Shoes                    4 options │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 👞  │ │ 👞  │ │ 👞  │ │ 👞  │  │
│  │ F   │ │ A   │ │ M   │ │ F   │  │
│  ├─────┤ ├─────┤ ├─────┤ ├─────┤  │
│  │Oxford│ │Derby│ │Brogue│ │Classic│
│  │Leather│Formal│Leather│Oxford│  │
│  │[Shop]│ │[Shop]│ │[Shop]│ │[Shop]│
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│          ← Scroll →                │
│                                     │
│  💡 These recommendations are       │
│  curated based on your outfit      │
│  analysis. Prices may vary.        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Analyze Another Outfit      │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 **Component Breakdown**

### **1. Header Section**
```
┌─────────────────────────────────────────────┐
│  ┌──┐                                       │
│  │🛍️│  My Recommendations                   │
│  └──┘  Shop the missing pieces for your    │
│        perfect outfit                       │
└─────────────────────────────────────────────┘
```
- Shopping bag icon with gradient background
- Title + subtitle
- Card with border and shadow
- Theme-aware colors

### **2. Item Type Header**
```
Tie                               4 options
────────────────────────────────────────────
```
- Item name (capitalized)
- Number of product options
- Divider line

### **3. Product Card**
```
┌─────────────┐
│ ┌─────────┐ │
│ │  Image  │F│  ← Marketplace Badge
│ │ 160x160 │ │     (F/A/M)
│ └─────────┘ │
│             │
│ Product     │  ← Name (2 lines max)
│ Name Here   │
│             │
│ ┌─────────┐ │
│ │Shop Now→│ │  ← Clickable button
│ └─────────┘ │
└─────────────┘
```

**Dimensions**:
- Card: 160px wide
- Image: 160px height
- Badge: 24x24px circle
- Border radius: 12px
- Gap between cards: 12px

**Marketplace Badges**:
- **F** = Flipkart (Blue #2874F0)
- **A** = Amazon (Orange #FF9900)
- **M** = Meesho (Purple #9F2089)

### **4. Horizontal Scroll**
```
┌─────────────────────────────────────────┐
│ [Card1] [Card2] [Card3] [Card4] ·····→ │
└─────────────────────────────────────────┘
         Swipe to see more →
```
- Scrolls horizontally
- 4 products visible per item type
- Smooth scrolling animation
- No scroll indicator (cleaner look)

### **5. Disclaimer**
```
┌─────────────────────────────────────────┐
│ 💡 These recommendations are curated    │
│ based on your outfit analysis. Prices   │
│ and availability may vary.              │
└─────────────────────────────────────────┘
```
- Light background
- Small text
- Center aligned
- Info icon

---

## 🎨 **Theme Support**

### **Light Mode**
```
Background:         #FFFFFF (White)
Card:              #FFFFFF with shadow
Border:            #E5E7EB (Light gray)
Text:              #1F2937 (Dark gray)
Secondary Text:    #6B7280 (Medium gray)
Badge Background:  Marketplace color
```

### **Dark Mode**
```
Background:         #0F172A (Dark blue)
Card:              #1E293B with shadow
Border:            #334155 (Dark gray)
Text:              #FFFFFF (White)
Secondary Text:    #94A3B8 (Light gray)
Badge Background:  Marketplace color
```

---

## 📊 **Interaction States**

### **Product Card States**

#### **Default**:
```
┌─────────────┐
│ [Image]   F │
│ Product Name│
│ [Shop Now →]│
└─────────────┘
```

#### **Pressed** (activeOpacity: 0.7):
```
┌─────────────┐
│ [Image]   F │  ← Slight fade
│ Product Name│
│ [Shop Now →]│
└─────────────┘
```

#### **After Tap**:
```
Opening marketplace...
→ https://www.flipkart.com/search?q=tie+for+interview
```

---

## 🔄 **Loading States**

### **Analyzing Outfit**:
```
┌─────────────────────────────────────┐
│      ⏳                              │
│   Analyzing your outfit...          │
└─────────────────────────────────────┘
```

### **Loading Recommendations**:
```
┌─────────────────────────────────────┐
│      ⏳                              │
│   Finding perfect products for you..│
└─────────────────────────────────────┘
```

### **Recommendations Ready**:
```
┌─────────────────────────────────────┐
│  🛍️ My Recommendations              │
│  [Products displayed]               │
└─────────────────────────────────────┘
```

---

## 📱 **Responsive Layout**

### **Small Screens (< 375px)**:
- Card width: 140px
- Image height: 140px
- Smaller text (12px)
- 2-3 cards visible

### **Medium Screens (375px - 425px)**:
- Card width: 160px
- Image height: 160px
- Normal text (14px)
- 2-3 cards visible

### **Large Screens (> 425px)**:
- Card width: 180px
- Image height: 180px
- Larger text (16px)
- 3-4 cards visible

---

## 🎯 **User Journey**

```
┌────────────────┐
│ Upload Photo   │
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ Enter Context  │
│ (e.g. interview)│
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ Analyze Outfit │
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ View Score &   │
│ Feedback       │
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ See Missing    │
│ Items          │
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ Browse Product │
│ Recommendations│
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ Tap Product    │
│ Card           │
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ Redirected to  │
│ Marketplace    │
└───────┬────────┘
        │
        ↓
┌────────────────┐
│ Shop & Purchase│
└────────────────┘
```

---

## 🎨 **Color Palette**

### **Primary Colors**:
```
Purple:       #8B5CF6  ████
Pink:         #EC4899  ████
Success:      #10B981  ████
Warning:      #F59E0B  ████
```

### **Marketplace Colors**:
```
Flipkart:     #2874F0  ████
Amazon:       #FF9900  ████
Meesho:       #9F2089  ████
```

### **Neutral Colors (Light)**:
```
Background:   #FFFFFF  ████
Card:         #F9FAFB  ████
Border:       #E5E7EB  ████
Text:         #1F2937  ████
Text Light:   #6B7280  ████
```

### **Neutral Colors (Dark)**:
```
Background:   #0F172A  ████
Card:         #1E293B  ████
Border:       #334155  ████
Text:         #FFFFFF  ████
Text Light:   #94A3B8  ████
```

---

## 📐 **Spacing & Layout**

### **Margins**:
```
Screen Edge:       20px
Section Gap:       24px
Card Gap:          12px
Item Header Gap:   12px
```

### **Padding**:
```
Header:            20px
Card:              12px
Section:           16px
Button:            6px vertical, 10px horizontal
```

### **Border Radius**:
```
Large Cards:       16px-20px
Product Cards:     12px
Buttons:           6px-8px
Badges:            12px (circle)
```

---

## 🎬 **Animations**

### **Score Animation**:
```
0 → 72
Duration: ~1 second
Spring animation with bounce
```

### **Card Entrance**:
```
Fade in + Slide up
Duration: 300ms
Stagger: 50ms per card
```

### **Scroll Animation**:
```
Smooth horizontal scroll
Momentum-based
Snap to grid (optional)
```

### **Tap Feedback**:
```
Scale: 0.95
Opacity: 0.7
Duration: 150ms
```

---

## 🧪 **Test Scenarios - Visual**

### **Scenario 1: Single Missing Item (Tie)**
```
📊 Score: 75/100
✨ Strengths: [3 items]
💡 Improvements: [Add a tie]
🛍️ Recommendations:
   Tie: [4 products] ←←←
```

### **Scenario 2: Multiple Missing Items**
```
📊 Score: 65/100
✨ Strengths: [2 items]
💡 Improvements: [Missing tie, shoes, blazer]
🛍️ Recommendations:
   Tie: [4 products] ←←←
   Shoes: [4 products] ←←←
   Blazer: [4 products] ←←←
```

### **Scenario 3: No Missing Items**
```
📊 Score: 95/100
✨ Strengths: [4 items]
💡 Improvements: [Minor color tweaks]
🛍️ Recommendations: [Not shown] ✓
```

---

## 📝 **Typography**

### **Header Title**:
```
Font Size:     20px
Font Weight:   700 (Bold)
Line Height:   24px
Color:         Theme Text
```

### **Product Name**:
```
Font Size:     14px
Font Weight:   600 (Semibold)
Line Height:   18px
Max Lines:     2
Color:         Theme Text
```

### **Shop Button**:
```
Font Size:     12px
Font Weight:   600 (Semibold)
Color:         Primary Purple
```

### **Disclaimer**:
```
Font Size:     12px
Font Weight:   400 (Regular)
Line Height:   16px
Align:         Center
Color:         Theme Text Light
```

---

**Created**: October 5, 2025  
**Feature**: Product Recommendations Visual Guide  
**Status**: ✅ Complete
