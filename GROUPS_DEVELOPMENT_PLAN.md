# Groups Section Development Plan

## Clarifying Questions - ANSWERED ✅

1. **Group Code Format**: ✅ **6-digit numeric** (e.g., "123456")

2. **Invite Link**: 
   - **Deep Link**: `offerbound://join/123456` - When clicked, automatically opens the app and joins the group (requires app to be installed and deep linking configured)
   - **Shareable Code**: Just the text "123456" that users copy and paste manually
   - **Recommendation for MVP**: Start with shareable code (simpler), add deep linking later

3. **Group Profile Picture**: ✅ **Image upload** with default to circle with initials if no image

4. **Post to Group Toggle**: ✅ **Per-group setting** (each group has its own toggle)

5. **Group Activity Feed**:
   - ✅ **Main Home Feed**: Shows ALL applications by group members UNLESS "Hide Notifications" slider is turned on
   - ✅ **Group Detail Screen**: Shows applications where "post to this group" is enabled
   - ✅ **Hide Notifications slider**: Located next to "Post to Group" slider in group settings

6. **Kick Members**:
   - ✅ Only creator can kick members
   - ✅ **Kicked member's data is deleted from group** (applications, penalties, etc.)

7. **Group Chat Messages**: ✅ **Allow text messages** in addition to application logs

---

## Implementation Plan

### Phase 1: Data Model Updates

#### 1.1 Update Type Definitions (`src/types/index.ts`)

```typescript
export interface Group {
  id: string;
  name: string;
  dailyQuota: number;
  durationMonths: number;
  startDate: Date;
  endDate: Date;
  pot: number;
  memberIds: string[];
  createdBy: string;
  // NEW FIELDS:
  code: string;                    // Unique group code (e.g., "ABC123")
  inviteLink?: string;             // Shareable invite link
  profilePicture?: string;          // URL or local path to group picture
  memberSettings?: {                // Per-member settings
    [userId: string]: {
      postToGroup: boolean;         // Whether user posts to this group
      hideNotifications: boolean;  // Whether to hide this group's notifications in home feed
    };
  };
}

export interface GroupActivityItem {
  id: string;
  type: 'application' | 'quota_hit' | 'quota_missed' | 'streak' | 'offer' | 'message';
  userId: string;
  userName: string;
  userAvatar?: string;              // User's profile picture
  message: string;
  timestamp: Date;
  metadata?: {
    company?: string;
    position?: string;
    streakDays?: number;
    applicationId?: string;
    textMessage?: string;            // For text messages
  };
}
```

#### 1.2 Update User Interface (`src/types/index.ts`)

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  streak: number;
  bankAccountLinked: boolean;
  mode: 'Starter' | 'Full';
  avatar?: string;                  // User profile picture
}
```

---

### Phase 2: AppContext Updates

#### 2.1 Add New Functions to AppContext

```typescript
interface AppContextType {
  // ... existing ...
  
  // Group Management
  createGroupWithCode: (group: Omit<Group, 'id' | 'pot' | 'memberIds' | 'code'>) => { group: Group; code: string; inviteLink: string };
  joinGroupByCode: (code: string) => Promise<{ success: boolean; groupId?: string; error?: string }>;
  updateGroupProfilePicture: (groupId: string, pictureUri: string) => void;
  getGroupCode: (groupId: string) => string | null;
  kickMember: (groupId: string, userId: string) => void;
  togglePostToGroup: (groupId: string, enabled: boolean) => void;
  toggleHideNotifications: (groupId: string, enabled: boolean) => void;
  getGroupActivity: (groupId: string) => GroupActivityItem[];
  addGroupActivity: (groupId: string, activity: Omit<GroupActivityItem, 'id' | 'timestamp'>) => void;
  sendGroupMessage: (groupId: string, message: string) => void;
}
```

#### 2.2 Group Activity Feed Logic

- Filter activity feed items by group membership
- Only show items where user has "post to group" enabled
- Store group-specific activity separately or tag with `groupId` in metadata

---

### Phase 3: New Screens

#### 3.1 Create/Join Group Screen (`src/screens/CreateJoinGroupScreen.tsx`)

**Layout:**
```
┌─────────────────────────┐
│   Join or Create Group  │
├─────────────────────────┤
│                         │
│   [Join Group Button]   │
│   (Large, prominent)    │
│                         │
│   [Create Group Button] │
│   (Large, prominent)     │
│                         │
└─────────────────────────┘
```

**Join Flow:**
1. User taps "Join Group"
2. Modal/Input appears: "Enter Group Code"
3. Text input for code
4. "Join" button validates code
5. If valid → Join group → Navigate to GroupDetailScreen
6. If invalid → Show error

**Create Flow:**
1. User taps "Create Group"
2. Form appears:
   - Group Name
   - Daily Quota (picker)
   - Duration (months picker)
3. On submit:
   - Generate unique code (6-8 characters)
   - Create group
   - Show success screen with:
     - Group Code (large, copyable)
     - Invite Link (copyable)
     - "Share" button
   - Navigate to GroupDetailScreen

#### 3.2 Group Settings Modal (`src/screens/GroupSettingsModal.tsx`)

**Triggered by:** Tapping group profile picture in GroupDetailScreen

**Layout:**
```
┌─────────────────────────┐
│  [Group Picture]        │
│  (Large, tappable)      │
├─────────────────────────┤
│  Change Profile Picture │
│  View Group Code        │
│  View Group Members     │
│  View Group Quota       │
│  [Post to Group Toggle] │
└─────────────────────────┘
```

**Options:**
1. **Change Profile Picture**: 
   - Image picker (use expo-image-picker)
   - Default to circle with initials if no image
   - Crop/resize functionality

2. **View Group Code**: 
   - Display code (large, easy to read)
   - Copy button
   - Share button (share code as text)

3. **View Group Members**: 
   - List of members with avatars
   - Creator can see "Remove" button next to each member
   - Confirmation dialog before removing
   - Kicked member's data is deleted from group

4. **View Group Quota**: 
   - Current quota settings
   - Duration
   - Pot amount

5. **Post to Group Toggle**: 
   - Switch to enable/disable posting applications to this group
   - Persisted per-group

6. **Hide Notifications Toggle**: 
   - Switch to hide/show this group's notifications in home feed
   - Located next to "Post to Group" toggle
   - Persisted per-group

---

### Phase 4: Redesign GroupDetailScreen

#### 4.1 Chat-Style Layout

**Header:**
```
┌─────────────────────────┐
│  [←]  [Group Pic]  [⚙️] │
│       Group Name        │
└─────────────────────────┘
```

**Body (Chat Interface):**
```
┌─────────────────────────┐
│                         │
│  [Other User Bubble]    │
│  (Grey, left-aligned)   │
│  [Avatar] Message       │
│                         │
│        [Your Bubble]    │
│        (Green, right)    │
│        Message [Avatar] │
│                         │
└─────────────────────────┘
```

**Bubble Design:**
- **Your messages**: 
  - Green background (`colors.electricLime`)
  - Right-aligned
  - Your avatar on right side (small, 24px)
  - Rounded corners (top-left, top-right, bottom-right sharp)
  
- **Others' messages**:
  - Grey background (`currentTheme.card`)
  - Left-aligned
  - Their avatar on left side (small, 24px)
  - Rounded corners (top-left, top-right, bottom-left sharp)

**Message Content:**
- User name (small, above message)
- For applications: Company, position, status badge
- For text messages: Plain text content
- Timestamp (small, below message)

**Text Message Input:**
- Text input at bottom of screen
- Send button
- Only visible to group members

#### 4.2 Activity Feed Integration

- Filter `activityFeed` by group membership
- Only show items where `postToGroup` is enabled for that user
- Display in reverse chronological order (newest at bottom)
- Auto-scroll to bottom on new messages

---

### Phase 5: Update GroupsScreen

#### 5.1 Instagram-Style Group List

**Design:**
- Larger group avatars (60px)
- Group name prominent
- Last activity preview (like Instagram preview text)
- Timestamp (relative, e.g., "2m ago")
- Unread indicator (if applicable)

**Plus Button:**
- Green circular button (matches center action button style)
- Opens CreateJoinGroupScreen modal

---

### Phase 6: Navigation Updates

#### 6.1 Add New Routes

```typescript
// In AppNavigator.tsx
<RootStack.Screen
  name="CreateJoinGroup"
  component={CreateJoinGroupScreen}
  options={{
    presentation: 'modal',
    ...TransitionPresets.ModalPresentationIOS,
    headerShown: false,
  }}
/>

<RootStack.Screen
  name="GroupSettings"
  component={GroupSettingsModal}
  options={{
    presentation: 'modal',
    ...TransitionPresets.ModalPresentationIOS,
    headerShown: false,
  }}
/>
```

---

## Implementation Steps (Priority Order)

### Step 1: Data Model & Context (Foundation)
1. ✅ Update `Group` interface with new fields
2. ✅ Update `User` interface with avatar
3. ✅ Add `GroupActivityItem` type
4. ✅ Implement `createGroupWithCode` function
5. ✅ Implement `joinGroupByCode` function
6. ✅ Add group activity management functions
7. ✅ Add `togglePostToGroup` function
8. ✅ Add `kickMember` function

### Step 2: Create/Join Screen
1. ✅ Create `CreateJoinGroupScreen.tsx`
2. ✅ Implement "Join" flow with code input
3. ✅ Implement "Create" flow with form
4. ✅ Generate unique group codes
5. ✅ Create invite links
6. ✅ Add to navigation

### Step 3: Group Settings Modal
1. ✅ Create `GroupSettingsModal.tsx`
2. ✅ Implement profile picture change (MVP: preset avatars)
3. ✅ Show group code with copy/share
4. ✅ Member list with kick functionality
5. ✅ Group quota display
6. ✅ Post to group toggle
7. ✅ Add to navigation

### Step 4: Redesign GroupDetailScreen
1. ✅ Update header with group picture
2. ✅ Implement chat-style layout
3. ✅ Create message bubble components
4. ✅ Filter and display group activity
5. ✅ Implement avatar display
6. ✅ Add auto-scroll to bottom
7. ✅ Connect to group settings modal

### Step 5: Update GroupsScreen
1. ✅ Redesign group list (Instagram style)
2. ✅ Add larger avatars
3. ✅ Show last activity preview
4. ✅ Connect plus button to CreateJoinGroupScreen
5. ✅ Improve group card design

### Step 6: Integration & Polish
1. ✅ Connect application logging to group activity
2. ✅ Respect "post to group" toggle
3. ✅ Add animations
4. ✅ Test all flows
5. ✅ Handle edge cases

---

## Technical Considerations

### Group Code Generation
- **6-digit numeric codes** (e.g., "123456")
- Ensure uniqueness (check against existing groups)
- Generate random 6-digit number
- Store in AsyncStorage for persistence

### Invite Links
- **MVP**: Shareable text code (e.g., "123456") that users copy and paste
- Format for future: `offerbound://join/123456` (deep linking)
- For now: Simple text sharing via system share sheet

### Profile Pictures
- **Image upload** using `expo-image-picker`
- Store as base64 string or file URI
- **Default**: Circle with user/group initials if no image
- Generate initials from name (e.g., "John Doe" → "JD")
- For groups: Use first letter of each word in group name

### Group Activity Storage
- Tag existing `activityFeed` items with `groupId` in metadata
- Add `groupId` to `ActivityFeedItem.metadata`
- Filter home feed by `hideNotifications` setting
- Group detail screen shows only items with matching `groupId` and `postToGroup: true`

### Text Messages
- New activity type: `type: 'message'`
- Store in `activityFeed` with `groupId` in metadata
- Only visible in group detail screen (not home feed)
- Text input at bottom of GroupDetailScreen

### Post to Group Toggle
- Store in `Group.memberSettings[userId].postToGroup`
- Default: `true` (enabled)
- Per-group setting (user can enable/disable per group)

### Hide Notifications Toggle
- Store in `Group.memberSettings[userId].hideNotifications`
- Default: `false` (show notifications)
- When enabled: Filters out this group's activity from home feed
- Per-group setting

---

## Answers Confirmed ✅

1. **Group Code Format**: ✅ 6-digit numeric (e.g., "123456")
2. **Invite Links**: ✅ Shareable text code for MVP (deep linking later)
3. **Profile Pictures**: ✅ Image upload with default to initials circle
4. **Activity Types**: ✅ All applications in home feed (unless hide notifications), filtered by postToGroup in group detail
5. **Kick Members**: ✅ Data deleted from group
6. **Chat Messages**: ✅ Allow text messages in addition to application logs

---

## Estimated File Changes

### New Files:
- `src/screens/CreateJoinGroupScreen.tsx` (~300-400 lines)
- `src/screens/GroupSettingsModal.tsx` (~500-600 lines)
- `src/components/GroupMessageBubble.tsx` (~150-200 lines)
- `src/components/AvatarWithInitials.tsx` (~80-100 lines)
- `src/utils/groupCodeGenerator.ts` (~30-50 lines)

### Modified Files:
- `src/types/index.ts` (add new fields)
- `src/context/AppContext.tsx` (add new functions)
- `src/screens/GroupsScreen.tsx` (redesign)
- `src/screens/GroupDetailScreen.tsx` (complete redesign with chat + text input)
- `src/navigation/AppNavigator.tsx` (add new routes)
- `src/screens/LogApplicationScreen.tsx` (add group posting logic)
- `src/screens/HomeScreen.tsx` (filter by hideNotifications)
- `package.json` (add expo-image-picker dependency)

### Total Estimated Lines: ~2500-3000 new/modified lines

### New Dependencies:
- `expo-image-picker` - For image upload functionality

---

## Next Steps

Once you answer the clarifying questions, I'll proceed with implementation in the priority order listed above.

