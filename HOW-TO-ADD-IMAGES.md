# 🖼️ How to Add Your Own Images to the Project

## Quick Start Guide

### Step 1: Add Your Image Files

Choose one of these locations based on your needs:

#### Option A: `public/logos/` (Recommended for logos)
```
screens-test-for-nexus/
└── public/
    └── logos/
        ├── nexus-logo.png    ← Add your Nexus logo here
        ├── excel-logo.png    ← Add Excel logo here
        └── any-other-logo.png
```

#### Option B: `src/assets/logos/`
```
screens-test-for-nexus/
└── src/
    └── assets/
        └── logos/
            ├── nexus-logo.png
            └── excel-logo.png
```

---

## Step 2: Use Your Images in Code

### Method 1: From `public` folder (Simpler)

**In React Components (TSX/JSX):**
```tsx
<img src="/logos/nexus-logo.png" alt="Nexus Logo" className="h-8 w-auto" />
```

**In CSS:**
```css
.header {
  background-image: url('/logos/nexus-logo.png');
}
```

### Method 2: From `src/assets` folder (Better for TypeScript)

**In React Components:**
```tsx
// At the top of your file:
import nexusLogo from '../assets/logos/nexus-logo.png';

// In your JSX:
<img src={nexusLogo} alt="Nexus Logo" className="h-8 w-auto" />
```

---

## 📍 Where I Already Updated in Your Project

I've prepared the import modal (`src/pages/Users.tsx`) to use your logos. Look for these commented lines:

```tsx
{/* <img src="/logos/excel-logo.png" alt="Excel" className="w-full h-full object-contain" /> */}
{/* <img src="/logos/nexus-logo.png" alt="Nexus" className="w-full h-full object-contain" /> */}
```

**To activate your logos:**
1. Add `nexus-logo.png` and `excel-logo.png` to `public/logos/`
2. Uncomment the `<img>` lines
3. Comment out or remove the Material Icons fallback

---

## 💡 Example: Adding Nexus Logo to Header

Let's say you want to add the Nexus logo to the header component:

**Before:**
```tsx
<div className="header">
  <h1>Nexus</h1>
</div>
```

**After:**
```tsx
<div className="header flex items-center gap-3">
  <img src="/logos/nexus-logo.png" alt="Nexus" className="h-8 w-auto" />
  <h1>Nexus</h1>
</div>
```

---

## 🎨 Recommended Image Specifications

### Logo Files:
- **Format**: PNG (with transparency) or SVG (best quality)
- **Nexus Logo**: ~200x50px or similar aspect ratio
- **File size**: Under 100KB
- **Background**: Transparent

### How to Optimize:
1. Use [TinyPNG.com](https://tinypng.com) to compress
2. Use [Squoosh.app](https://squoosh.app) for advanced optimization
3. Convert to SVG if possible for best quality

---

## ✅ Testing Your Images

After adding your images:

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Check in browser**:
   - Open http://localhost:5173
   - Navigate to Users page
   - Click "ייבוא משתמשים"
   - Your logos should appear in the right panel

3. **Troubleshooting**:
   - If image doesn't show: Check file path and name (case-sensitive!)
   - If using `public` folder: URL must start with `/`
   - If using `src/assets`: Make sure import path is correct

---

## 📝 Example: Full Working Code

Here's a complete example showing both methods:

```tsx
// Import from assets (Option 1)
import nexusLogo from './assets/logos/nexus-logo.png';

function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      {/* Using imported image */}
      <img src={nexusLogo} alt="Nexus" className="h-8" />

      {/* Using public folder */}
      <img src="/logos/excel-logo.png" alt="Excel" className="h-8" />
    </header>
  );
}
```

---

## 🚀 Next Steps

1. **Get your logo files** (PNG or SVG format)
2. **Place them in** `public/logos/` folder
3. **Uncomment the image tags** in `src/pages/Users.tsx` (lines with logos)
4. **Refresh your browser** to see the changes!

Need help? The code is ready - just add your images! 🎉
