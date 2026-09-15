# Quick Setup Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go
   - **Web**: Press `w` in the terminal

## First Run

When you first open the app, you'll see:
- A demo user is automatically created
- No applications or groups yet
- You can start logging applications immediately

## Testing the App

### 1. Log Your First Application
- Tap the center (+) button
- Fill in company, position, location
- Select status (default: Applied)
- Submit

### 2. Create a Group
- Go to Groups tab
- Tap the + icon (coming soon - for now, groups are created programmatically)
- Or use the context API to create groups programmatically

### 3. View Your Applications
- Go to Applications tab
- See your logged applications in a table format
- Filter by status or sort by date/company/status

### 4. Check Activity Feed
- Go to Home tab
- See your logged applications appear in the feed
- Streak counter updates automatically

## Notes

- All data is stored locally using AsyncStorage
- No backend required for MVP
- Demo user is created automatically on first launch
- Bank account linking is simulated (no actual payment processing)

## Troubleshooting

### "Module not found" errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Expo Go not working
- Make sure your phone and computer are on the same WiFi network
- Try using tunnel mode: `expo start --tunnel`

### TypeScript errors
- Run `npx tsc --noEmit` to check for type errors
- Make sure all dependencies are installed

## Next Steps

1. Add app icons and splash screens to `/assets`
2. Customize colors in `/src/theme/colors.ts`
3. Add more features as needed
4. Connect to a backend when ready

