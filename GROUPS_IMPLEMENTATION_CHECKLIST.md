 # Groups Section Implementation Checklist

## ✅ Requirements Confirmed

- [x] 6-digit numeric group codes
- [x] Shareable text codes (deep linking later)
- [x] Image upload with initials fallback
- [x] Per-group "Post to Group" toggle
- [x] Per-group "Hide Notifications" toggle
- [x] Kick members (creator only, deletes data)
- [x] Text messages in group chat
- [x] Chat-style UI with speech bubbles
- [x] Instagram-style group list

## 📋 Implementation Checklist

### Phase 1: Data Model & Types
- [ ] Update `Group` interface with:
  - [ ] `code: string` (6-digit numeric)
  - [ ] `inviteLink?: string`
  - [ ] `profilePicture?: string`
  - [ ] `memberSettings?: { [userId: string]: { postToGroup: boolean; hideNotifications: boolean } }`
- [ ] Update `User` interface with:
  - [ ] `avatar?: string` (already exists, verify)
- [ ] Update `ActivityFeedItem` interface with:
  - [ ] `type: 'message'` added to union
  - [ ] `metadata.groupId?: string`
  - [ ] `metadata.textMessage?: string`
- [ ] Create `GroupActivityItem` type (or extend ActivityFeedItem)

### Phase 2: AppContext Functions
- [ ] `generateGroupCode()` - Generate unique 6-digit code
- [ ] `createGroupWithCode()` - Create group with code generation
- [ ] `joinGroupByCode(code: string)` - Join group by code
- [ ] `updateGroupProfilePicture(groupId, pictureUri)` - Update group picture
- [ ] `getGroupCode(groupId)` - Get group code
- [ ] `kickMember(groupId, userId)` - Remove member and delete their data
- [ ] `togglePostToGroup(groupId, enabled)` - Toggle posting to group
- [ ] `toggleHideNotifications(groupId, enabled)` - Toggle hide notifications
- [ ] `sendGroupMessage(groupId, message)` - Send text message to group
- [ ] `getGroupActivity(groupId)` - Get filtered activity for group
- [ ] Update `addApplication()` to respect `postToGroup` setting
- [ ] Update home feed filtering to respect `hideNotifications`

### Phase 3: Components
- [ ] `AvatarWithInitials.tsx` - Avatar component with initials fallback
- [ ] `GroupMessageBubble.tsx` - Speech bubble component
  - [ ] Left-aligned (grey) for others
  - [ ] Right-aligned (green) for current user
  - [ ] Avatar positioning
  - [ ] Message content rendering

### Phase 4: Screens
- [ ] `CreateJoinGroupScreen.tsx`
  - [ ] Join/Create selection UI
  - [ ] Join flow with code input
  - [ ] Create flow with form
  - [ ] Code display and sharing
  - [ ] Invite link generation
- [ ] `GroupSettingsModal.tsx`
  - [ ] Group picture display (tappable)
  - [ ] Change profile picture (image picker)
  - [ ] View group code
  - [ ] View group members with kick functionality
  - [ ] View group quota
  - [ ] Post to Group toggle
  - [ ] Hide Notifications toggle
- [ ] Redesign `GroupDetailScreen.tsx`
  - [ ] Chat-style layout
  - [ ] Group picture header (tappable)
  - [ ] Message bubbles (applications + text)
  - [ ] Text input at bottom
  - [ ] Auto-scroll to bottom
  - [ ] Filter by postToGroup
- [ ] Update `GroupsScreen.tsx`
  - [ ] Instagram-style list design
  - [ ] Larger avatars
  - [ ] Last activity preview
  - [ ] Plus button connects to CreateJoinGroupScreen
- [ ] Update `HomeScreen.tsx`
  - [ ] Filter by hideNotifications setting

### Phase 5: Navigation
- [ ] Add `CreateJoinGroup` route to RootStack
- [ ] Add `GroupSettings` route to RootStack
- [ ] Connect GroupsScreen plus button
- [ ] Connect GroupDetailScreen group picture

### Phase 6: Dependencies
- [ ] Install `expo-image-picker`
- [ ] Configure image picker permissions in app.json

### Phase 7: Testing & Polish
- [ ] Test group creation with code
- [ ] Test joining by code
- [ ] Test image upload
- [ ] Test post to group toggle
- [ ] Test hide notifications toggle
- [ ] Test text messaging
- [ ] Test kicking members
- [ ] Test chat UI scrolling
- [ ] Test avatar initials fallback

## 🎨 Design Specifications

### Group Code
- Format: 6-digit numeric (000000-999999)
- Display: Large, monospace font
- Copy: One-tap copy button
- Share: System share sheet

### Profile Pictures
- Default: Circle with initials (2 letters)
- Size: 60px for group list, 80px for group header
- Upload: Image picker with crop
- Storage: Base64 or file URI

### Speech Bubbles
- Your messages: Green (#6CFF5A), right-aligned, avatar right
- Others: Grey (card color), left-aligned, avatar left
- Avatar size: 24px in bubbles
- Border radius: 12px (with tail on appropriate side)

### Group List (Instagram Style)
- Avatar: 60px circle
- Name: Bold, 18px
- Preview: Last activity message (truncated)
- Time: Relative time (e.g., "2m ago")
- Layout: Full-width cards with padding

## 📝 Notes

- Group codes must be unique (check on generation)
- Image upload requires expo-image-picker
- Text messages only appear in group detail, not home feed
- Home feed respects hideNotifications per group
- Group detail shows only items where postToGroup is true


