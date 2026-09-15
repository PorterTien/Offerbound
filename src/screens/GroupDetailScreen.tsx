import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  SafeAreaView,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import GroupMessageBubble from '../components/GroupMessageBubble';
import AvatarWithInitials from '../components/AvatarWithInitials';
import { StatusBar } from 'expo-status-bar';

export default function GroupDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params as { groupId: string };
  const {
    groups,
    currentUser,
    themeMode,
    getGroupActivity,
    sendGroupMessage,
  } = useApp();
  const currentTheme = theme[themeMode];
  const insets = useSafeAreaInsets();

  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const messageInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;
  const containerRef = useRef<View>(null);
  const inputContainerRef = useRef<View>(null);
  const [inputBottom, setInputBottom] = useState(0);
  const [inputContainerHeight, setInputContainerHeight] = useState(0);

  const group = groups.find(g => g.id === groupId);
  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.text }]}>Group not found</Text>
      </SafeAreaView>
    );
  }

  const groupActivity = getGroupActivity(groupId);
  const isMember = group.memberIds.includes(currentUser?.id || '');
  const totalPosts = groupActivity.length;

  // Track keyboard height and animate input container
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        // Position input container flush with keyboard top
        // Account for the container's own height to ensure it sits flush
        setInputBottom(height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        // Position input container back at bottom
        setInputBottom(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Handle touch move to detect when finger enters keyboard area
  const handleMoveShouldSetResponder = (event: any) => {
    if (keyboardHeight === 0) return false; // Keyboard not visible, allow scrolling
    
    const touchY = event.nativeEvent.pageY;
    const keyboardTopY = screenHeight - keyboardHeight;
    
    // Only intercept if touching keyboard area
    if (touchY >= keyboardTopY) {
      Keyboard.dismiss();
      return true;
    }
    return false; // Allow scrolling
  };

  // Handle touch start to detect initial touch in keyboard area
  const handleStartShouldSetResponder = (event: any) => {
    if (keyboardHeight === 0) return false; // Keyboard not visible, allow scrolling
    
    const touchY = event.nativeEvent.pageY;
    const keyboardTopY = screenHeight - keyboardHeight;
    
    // Only intercept if touching keyboard area
    if (touchY >= keyboardTopY) {
      Keyboard.dismiss();
      return true;
    }
    return false; // Allow scrolling
  };

  const handleScroll = () => {
    // Keep keyboard sticky - don't dismiss on scroll
  };

  const handleMessageFocus = () => {
    // Scroll to show message input above keyboard when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 400);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [groupActivity.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !isMember) return;

    await sendGroupMessage(groupId, messageText);
    setMessageText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleGroupPicturePress = () => {
    const rootNavigator = navigation.getParent()?.getParent();
    if (rootNavigator) {
      rootNavigator.navigate('GroupStats', { groupId });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View
        ref={containerRef}
        style={styles.touchHandler}
        onStartShouldSetResponder={handleStartShouldSetResponder}
        onMoveShouldSetResponder={handleMoveShouldSetResponder}
      >
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      
      {/* Chat Messages */}
      <View style={styles.keyboardView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.groupPictureContainer}
            onPress={handleGroupPicturePress}
            activeOpacity={0.8}
          >
            <AvatarWithInitials
              uri={group.profilePicture}
              name={group.name}
              size={40}
              backgroundColor={colors.electricLime + '40'}
              textColor={colors.electricLime}
            />
          </TouchableOpacity>
          
          <View style={styles.groupInfoContainer}>
            <TouchableOpacity
              onPress={handleGroupPicturePress}
              activeOpacity={0.7}
            >
              <Text style={[styles.groupName, { color: currentTheme.text }]} numberOfLines={1}>
                {group.name}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.memberCount, { color: currentTheme.textSecondary }]}>
              ${group.pot} pot • {group.dailyQuota} quota • {group.memberIds.length} members
            </Text>
          </View>
        </View>
        <View style={styles.scrollViewWrapper}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingBottom: keyboardHeight > 0 ? 400 : 70 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            bounces={true}
            alwaysBounceVertical={true}
          >
            {groupActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color={currentTheme.textSecondary} />
                <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            ) : (
              groupActivity.map((item, index) => {
                // Show timestamp if:
                // 1. It's the last message, OR
                // 2. The next message is more than 10 minutes later
                const isLastMessage = index === groupActivity.length - 1;
                const nextItem = groupActivity[index + 1];
                const timeDiff = nextItem 
                  ? nextItem.timestamp.getTime() - item.timestamp.getTime()
                  : Infinity;
                const showTimestamp = isLastMessage || timeDiff > 10 * 60 * 1000; // 10 minutes in milliseconds
                
                // Check if this message is within 10 minutes of the previous message
                const prevItem = index > 0 ? groupActivity[index - 1] : null;
                const prevTimeDiff = prevItem
                  ? item.timestamp.getTime() - prevItem.timestamp.getTime()
                  : Infinity;
                const isFlushWithPrevious = prevItem ? prevTimeDiff <= 10 * 60 * 1000 : false; // Within 10 minutes
                
                // Check if the next message is from the same user and within 10 minutes
                // If so, hide the avatar (only show on the most recent message in the group)
                const nextTimeDiff = nextItem
                  ? nextItem.timestamp.getTime() - item.timestamp.getTime()
                  : Infinity;
                const nextIsSameUser = nextItem && nextItem.userId === item.userId;
                const nextIsWithin10Min = nextTimeDiff <= 10 * 60 * 1000;
                const showAvatar = !(nextIsSameUser && nextIsWithin10Min); // Hide avatar if next message is same user within 10 min
                
                // Show name on the first message in a block (when previous message is different user or >10 min ago)
                const prevIsDifferentUser = !prevItem || prevItem.userId !== item.userId;
                const prevIsMoreThan10Min = prevTimeDiff > 10 * 60 * 1000;
                const showName = prevIsDifferentUser || prevIsMoreThan10Min; // Show name at top of block
                
                // Check if this is a system message (like "x joined the group")
                const isSystemMessage = item.metadata?.isSystemMessage === true;
                
                // Quota missed messages from groups should always appear on the left
                // Check if it's a group message (userId starts with "group-") or if it's the current user
                const isGroupMessage = item.userId?.startsWith('group-');
                const isCurrentUserMessage = !isGroupMessage && item.userId === currentUser?.id;
                
                return (
                  <GroupMessageBubble
                    key={item.id}
                    item={item}
                    isCurrentUser={isCurrentUserMessage}
                    theme={currentTheme}
                    themeMode={themeMode}
                    showTimestamp={isSystemMessage ? false : showTimestamp}
                    isFlushWithPrevious={isSystemMessage ? false : isFlushWithPrevious}
                    showAvatar={isSystemMessage ? false : showAvatar}
                    showName={isSystemMessage ? false : showName}
                  />
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Message Input */}
        {isMember && (
          <View
            ref={inputContainerRef}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setInputContainerHeight(height);
            }}
            style={[
              styles.inputContainer,
              {
                backgroundColor: 'transparent',
                bottom: keyboardHeight > 0 ? keyboardHeight : 0,
                paddingTop: keyboardHeight > 0 ? 0 : 12,
                paddingBottom: keyboardHeight > 0 ? 0 : 12,
                marginBottom: 0,
              },
            ]}
          >
            <TextInput
              ref={messageInputRef}
              style={[
                styles.messageInput,
                {
                  color: currentTheme.text,
                  backgroundColor: currentTheme.background,
                  borderWidth: 1,
                  borderColor: currentTheme.border,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={currentTheme.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              onFocus={handleMessageFocus}
              multiline
              maxLength={500}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              textContentType="none"
              keyboardType="default"
              returnKeyType="send"
              blurOnSubmit={false}
              inputAccessoryViewID={undefined}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: messageText.trim() ? colors.electricLime : currentTheme.textSecondary },
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={messageText.trim() ? colors.charcoal : currentTheme.background}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  touchHandler: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
    zIndex: 1,
  },
  groupPictureContainer: {
    marginRight: 12,
  },
  groupInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
  },
  keyboardView: {
    flex: 1,
  },
  scrollViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 100, // Space for header (back arrow + group photo + name + member count)
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 0,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
