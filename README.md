# Offerbound

A mobile-first accountability app for college students applying to internships. Offerbound uses social pressure, streaks, and light financial penalties to increase daily application consistency.

## Features

- **Social Accountability**: Join groups with friends to stay motivated
- **Daily Quotas**: Set and track daily application goals
- **Streaks**: Build consistency with streak tracking
- **Financial Penalties**: $0.50 penalty for missing daily quotas (optional, requires bank account)
- **Activity Feed**: See what your friends are up to
- **Leaderboards**: Compete for most applications, rejections, and offers
- **Personal Tracker**: Google Sheets-style application tracking

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation (Bottom Tabs + Stack)
- AsyncStorage for local data persistence
- Context API for state management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

## Project Structure

```
Offerbound/
├── App.tsx                 # Main app entry point
├── src/
│   ├── context/           # App state management
│   │   └── AppContext.tsx
│   ├── navigation/        # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/          # All app screens
│   │   ├── HomeScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   ├── GroupDetailScreen.tsx
│   │   ├── LogApplicationScreen.tsx
│   │   ├── ApplicationsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── LeaderboardsScreen.tsx
│   ├── theme/            # Colors and theming
│   │   └── colors.ts
│   └── types/            # TypeScript types
│       └── index.ts
└── package.json
```

## Design System

### Colors
- **Electric Lime** (#6CFF5A): Primary accent, actions, success
- **Charcoal** (#121212): Dark background
- **Dark Gray** (#1E1E1E): Cards
- **Coral** (#FF4D4D): Missed quotas, danger
- **White**: Primary text
- **Muted Gray**: Secondary text

### Navigation
Bottom navigation with 5 tabs:
1. Home (Activity Feed)
2. Groups
3. Center Action (+) - Log Application
4. Applications
5. Profile

## Core Features

### Groups
- Create or join groups with friends
- Set daily application quotas
- Track group duration (weeks/months)
- View member stats (streaks, missed days, amount owed)
- Group pot accumulates penalties

### Applications
- Log applications with company, position, location, and status
- Track status: Applied, Interview scheduled, Rejected, Offer
- View personal application history
- Sort and filter applications

### Streaks
- Automatic streak calculation
- Streaks break when daily quota is missed
- Visual streak indicators throughout the app

### Penalties
- $0.50 per missed quota day
- Only applies when bank account is linked
- Penalties go into group pot
- Pot splits evenly at end of challenge
- Bonus percentage for most verified offers

## Access Levels

### Starter Mode (No Bank Account)
- Join 1 group
- Limited features
- No financial penalties

### Full Mode (Bank Account Linked)
- Unlimited groups
- Full money mode
- All features unlocked

## Development Notes

- Data is stored locally using AsyncStorage
- No backend required for MVP
- All verification is manual input (v1)
- Anti-cheat: Pattern detection, social enforcement, reputation

## Future Enhancements

- Email forwarding for automatic verification
- Inbox scanning
- Screenshot uploads
- Push notifications
- Social features (comments, reactions)
- Analytics dashboard

## License

Private - All rights reserved

