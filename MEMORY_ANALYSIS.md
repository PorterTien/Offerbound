# Memory Usage Analysis - Offerbound App

## Total Project Size: ~357MB

### Breakdown by Category:

#### 1. **node_modules: 357MB** (99.4% of total)
   - **react-native: 84MB** (23.5%)
     - Includes Hermes compilers for all platforms (Windows, Linux, macOS)
     - Development tools and SDKs
   
   - **date-fns: 36MB** (10.1%) ⚠️ **MAJOR ISSUE**
     - Includes ALL locale files (200+ languages)
     - Most locales are never used
     - Should use tree-shaking or import only needed locales
   
   - **expo: 24MB** (6.7%)
     - Core Expo framework
     - Required for app functionality
   
   - **typescript: 23MB** (6.4%)
     - Development dependency
     - Only needed during build, not in production
   
   - **@react-native: 21MB** (5.9%)
     - React Native core packages
     - Required for app functionality
   
   - **@expo: 19MB** (5.3%)
     - Expo packages
     - Required for app functionality
   
   - **react-devtools-core: 16MB** (4.5%)
     - Development tools only
     - Not included in production builds
   
   - **@img (sharp): 16MB** (4.5%)
     - Image processing library
     - Only used in dev scripts, not in app
   
   - **@babel: 15MB** (4.2%)
     - Build tool
     - Only needed during build, not in production

#### 2. **Source Code: 176KB** (0.05%)
   - All TypeScript/React files
   - Very small, not an issue

#### 3. **Assets: 208KB** (0.06%)
   - Images and icons
   - Very small, not an issue

---

## Recommendations to Reduce Size:

### High Impact (Can save ~40-50MB):

1. **Optimize date-fns (Save ~30MB)**
   - Currently: 36MB with all locales
   - Solution: Import only needed locales or use a lighter alternative
   - Example: `import { format } from 'date-fns'` instead of importing entire library
   - Or use: `date-fns-tz` with tree-shaking

2. **Remove unused Hermes compilers (Save ~30-40MB)**
   - React Native includes compilers for Windows, Linux, macOS: **53MB total**
   - Only need the one for your development platform (macOS)
   - Can be cleaned up but will be reinstalled on npm install
   - Note: These are dev tools, not included in production builds

3. **sharp is already in devDependencies** ✅
   - Correctly placed, not an issue

### Medium Impact (Can save ~20-30MB):

4. **Remove react-devtools-core from production**
   - Already excluded in production builds
   - No action needed, but good to know

5. **Optimize TypeScript**
   - Already in devDependencies (correct)
   - Consider using `tsc --skipLibCheck` to reduce build time

### Low Impact (Can save ~5-10MB):

6. **Review @babel packages**
   - Ensure only necessary Babel plugins are installed
   - Current setup looks minimal

---

## Production Build Size:

**Important Note:** The 357MB is your **development** folder size. Your actual **production app** will be much smaller because:
- TypeScript is not included
- Development tools are excluded
- Only used code is bundled
- Assets are optimized
- Hermes compilers are not included

**Expected production app size:** ~10-30MB (depending on platform)

---

## Quick Wins:

1. **Optimize date-fns imports** (Save ~30MB) - **BIGGEST IMPACT**
   - Currently importing entire library with all 98 locales
   - Only using: `format`, `formatDistanceToNow`, `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `isSameMonth`, `isSameDay`, `addMonths`, `subMonths`
   - Solution: Use tree-shaking or import only needed functions
   - The locale files (24MB) are not being used but are included

2. **Use Expo's built-in optimizations**
   - Production builds automatically exclude dev dependencies
   - Assets are optimized during build

## Current date-fns Usage:
- **LogApplicationScreen**: format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
- **EditApplicationScreen**: Same as above
- **ApplicationsScreen**: format
- **HomeScreen**: formatDistanceToNow
- **GroupsScreen**: formatDistanceToNow

**Total unique functions used: 11 out of 200+**
**Total locales used: 0 out of 98**

This is why date-fns is so large - you're bundling 98 unused locale files!

