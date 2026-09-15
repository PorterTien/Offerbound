import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from '../utils/dateUtils';
import { ActivityFeedItem } from '../types';
import AvatarWithInitials from './AvatarWithInitials';
import { colors } from '../theme/colors';

interface GroupMessageBubbleProps {
  item: ActivityFeedItem;
  isCurrentUser: boolean;
  theme: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
  };
  showTimestamp?: boolean;
  isFlushWithPrevious?: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  themeMode?: 'light' | 'dark';
}

export default function GroupMessageBubble({
  item,
  isCurrentUser,
  theme,
  themeMode = 'dark',
  showTimestamp = true,
  isFlushWithPrevious = false,
  showAvatar = true,
  showName = true,
}: GroupMessageBubbleProps) {
  const renderBoldMessage = (message: string, userName: string, textColor: string) => {
    // Escape special regex characters in userName
    const escapedUserName = userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a combined regex pattern that matches user name, "offer", "application", or "quota" (case insensitive)
    // Use word boundaries to avoid partial matches
    const pattern = new RegExp(`\\b(${escapedUserName}|offer|application|quota)\\b`, 'gi');
    
    const parts: Array<{ text: string; bold: boolean }> = [];
    let lastIndex = 0;
    let match;

    // Find all matches
    const matches: RegExpExecArray[] = [];
    let tempMatch;
    // Reset regex lastIndex to avoid issues
    pattern.lastIndex = 0;
    while ((tempMatch = pattern.exec(message)) !== null) {
      matches.push(tempMatch);
    }

    // Process matches
    for (const match of matches) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ text: message.substring(lastIndex, match.index), bold: false });
      }
      // Add matched text (bold)
      parts.push({ text: match[0], bold: true });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last match
    if (lastIndex < message.length) {
      parts.push({ text: message.substring(lastIndex), bold: false });
    }

    // If no matches found, return original message
    if (parts.length === 0) {
      return <Text style={[styles.messageText, { color: textColor }]}>{message}</Text>;
    }

    return (
      <Text style={[styles.messageText, { color: textColor }]}>
        {parts.map((part, index) => (
          <Text key={index} style={part.bold ? styles.boldText : {}}>
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  const renderQuotaMissedMessage = (message: string, userName: string, textColor: string) => {
    // Extract the actual user name from the message (format: "Name missed yesterday's quota...")
    // The name is at the start of the message before "missed"
    const nameMatch = message.match(/^(.+?)\s+missed/i);
    const actualUserName = nameMatch ? nameMatch[1].trim() : userName;
    
    // Pattern to match: name, "missed" (word), "quota" (word), and money amount ($X.XX or $+X.XX)
    const escapedUserName = actualUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match: user name at start of string, "missed" (word), "quota" (word), and dollar amounts
    // Use start anchor for name since it's always at the beginning
    const pattern = new RegExp(`(^${escapedUserName}|\\bmissed\\b|\\bquota\\b|\\$[+\\-]?\\d+\\.\\d{2})`, 'gi');
    
    const parts: Array<{ text: string; bold: boolean }> = [];
    let lastIndex = 0;
    
    // Find all matches
    const matches: RegExpExecArray[] = [];
    pattern.lastIndex = 0;
    let tempMatch;
    while ((tempMatch = pattern.exec(message)) !== null) {
      matches.push(tempMatch);
    }
    
    // Process matches
    for (const match of matches) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({ text: message.substring(lastIndex, match.index), bold: false });
      }
      // Add matched text (bold)
      parts.push({ text: match[0], bold: true });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last match
    if (lastIndex < message.length) {
      parts.push({ text: message.substring(lastIndex), bold: false });
    }
    
    // If no matches found, return original message
    if (parts.length === 0) {
      return <Text style={[styles.messageText, { color: textColor }]}>{message}</Text>;
    }
    
    return (
      <Text style={[styles.messageText, { color: textColor }]}>
        {parts.map((part, index) => (
          <Text key={index} style={part.bold ? styles.boldText : {}}>
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  const renderMessageContent = () => {
    if (item.type === 'message') {
      const messageText = item.metadata?.textMessage || item.message;
      // Check if this is a quota missed message
      const isQuotaMissed = messageText.toLowerCase().includes('missed') && 
                           messageText.toLowerCase().includes('quota') &&
                           (messageText.includes('owes') || messageText.includes('owed'));
      
      if (isQuotaMissed) {
        return renderQuotaMissedMessage(
          messageText,
          item.userName,
          isCurrentUser ? colors.charcoal : theme.text
        );
      }
      
      return (
        <Text style={[styles.messageText, { color: isCurrentUser ? colors.charcoal : theme.text }]}>
          {messageText}
        </Text>
      );
    }

    if (item.type === 'application') {
      return (
        <View>
          {renderBoldMessage(
            item.message,
            item.userName,
            isCurrentUser ? colors.charcoal : theme.text
          )}
          {item.metadata?.company && (
            <Text style={[styles.detailText, { color: isCurrentUser ? colors.charcoal : theme.textSecondary }]}>
              {item.metadata.company} • {item.metadata.position}
            </Text>
          )}
        </View>
      );
    }

    if (item.type === 'offer') {
      const offerMessage = `🎉 ${item.userName} received an offer!`;
      return (
        <View>
          {renderBoldMessage(
            offerMessage,
            item.userName,
            isCurrentUser ? colors.charcoal : theme.text
          )}
          {item.metadata?.company && (
            <Text style={[styles.detailText, { color: isCurrentUser ? colors.charcoal : theme.textSecondary }]}>
              {item.metadata.company} • {item.metadata.position}
            </Text>
          )}
        </View>
      );
    }

    // For quota_hit, quota_missed, and other automated messages
    if (item.type === 'quota_hit' || item.type === 'quota_missed') {
      return renderBoldMessage(
        item.message,
        item.userName,
        isCurrentUser ? colors.charcoal : theme.text
      );
    }

    return (
      <Text style={[styles.messageText, { color: isCurrentUser ? colors.charcoal : theme.text }]}>
        {item.message}
      </Text>
    );
  };

  // Check if this is a system message (like "x joined the group")
  const isSystemMessage = item.metadata?.isSystemMessage === true;

  // Render system messages centered
  if (isSystemMessage) {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessageText}>
          {item.metadata?.textMessage || item.message}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
        isFlushWithPrevious && styles.flushContainer,
      ]}
    >
      {!isCurrentUser && showAvatar && (
        <AvatarWithInitials
          uri={item.userAvatar}
          name={item.userName}
          size={24}
          backgroundColor={colors.electricLime + '40'}
          textColor={colors.electricLime}
        />
      )}
      {!isCurrentUser && !showAvatar && (
        <View style={{ width: 24 }} />
      )}
      <View style={[styles.bubbleWrapper, !isCurrentUser && styles.bubbleWrapperLeft]}>
        {/* User name above message - only show on first message in a group */}
        {!isCurrentUser && showName && (
          <Text style={[styles.userName, { color: theme.textSecondary }]}>
            {item.userName}
          </Text>
        )}
        <View style={styles.bubbleContainer}>
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: isCurrentUser 
                  ? (item.type === 'message' ? '#89e219' : colors.electricLime)
                  : (themeMode === 'dark' ? '#1A1A1A' : '#E8E8E8'), // Slightly darker grey for other users
                borderTopLeftRadius: isCurrentUser ? 12 : 4,
                borderTopRightRadius: isCurrentUser ? 4 : 12,
                borderBottomLeftRadius: isCurrentUser ? 12 : 0, // No bottom left radius for other users (arrow will be there)
                borderBottomRightRadius: isCurrentUser ? 0 : 12, // No bottom right radius for current user (arrow will be there)
              },
            ]}
          >
            {renderMessageContent()}
          </View>
          {/* Arrow triangle at bottom left for other users, bottom right for current user */}
          <View
            style={[
              styles.arrow,
              isCurrentUser ? styles.arrowRight : styles.arrowLeft,
              {
                borderTopColor: isCurrentUser 
                  ? (item.type === 'message' ? '#89e219' : colors.electricLime)
                  : (themeMode === 'dark' ? '#1A1A1A' : '#E8E8E8'), // Match bubble color
              },
            ]}
          />
        </View>
        {showTimestamp && (
          <Text
            style={[
              styles.timestamp,
              { color: theme.textSecondary },
              isCurrentUser ? styles.timestampRight : styles.timestampLeft,
            ]}
          >
            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
          </Text>
        )}
      </View>
      {isCurrentUser && showAvatar && (
        <AvatarWithInitials
          uri={item.userAvatar}
          name={item.userName}
          size={24}
          backgroundColor={colors.electricLime + '40'}
          textColor={colors.electricLime}
        />
      )}
      {isCurrentUser && !showAvatar && (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  flushContainer: {
    marginTop: 0,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  bubbleWrapperLeft: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bubbleContainer: {
    position: 'relative',
  },
  bubble: {
    padding: 12,
  },
  arrow: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowLeft: {
    left: 0,
  },
  arrowRight: {
    right: 0,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailText: {
    fontSize: 13,
    marginTop: 2,
  },
  boldText: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  timestampRight: {
    alignSelf: 'flex-end',
  },
  timestampLeft: {
    alignSelf: 'flex-start',
  },
  systemMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  systemMessageText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#999999', // Grey color
  },
});

