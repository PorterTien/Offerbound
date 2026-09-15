# Quick Start Guide

## Running the App

### Option 1: Using Expo Go (Recommended for Testing)

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **On your phone:**
   - Install **Expo Go** app from App Store (iOS) or Google Play (Android)
   - Make sure your phone and computer are on the same WiFi network
   - Scan the QR code that appears in the terminal
   - The app will load on your phone

### Option 2: iOS Simulator (Mac only)

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Press `i` in the terminal** to open in iOS Simulator
   - Requires Xcode to be installed

### Option 3: Android Emulator

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Press `a` in the terminal** to open in Android Emulator
   - Requires Android Studio to be installed

### Option 4: Web Browser

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Press `w` in the terminal** to open in web browser
   - Note: Some mobile-specific features may not work perfectly on web

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Expo Go can't connect
- Make sure both devices are on the same WiFi
- Try tunnel mode: `npm start -- --tunnel`
- Or use LAN mode: `npm start -- --lan`

### Port already in use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

## First Time Setup

If you haven't installed dependencies yet:
```bash
npm install
```

Then run:
```bash
npm start
```

