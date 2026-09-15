import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import { ActivityFeedItem } from '../types';
import AvatarWithInitials from '../components/AvatarWithInitials';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { activityFeed, currentUser, applications, themeMode, groups, toggleLikeActivity } = useApp();
  const currentTheme = theme[themeMode];

  // Filter activity feed - exclude group-specific items and respect hideNotifications setting
  const filteredFeed = activityFeed.filter(item => {
    // Exclude all group-specific items (items with groupId in metadata)
    if (item.metadata?.groupId) {
      return false; // Don't show group items in home feed
    }
    
    // For other items, check hideNotifications setting if they're related to groups
    // (This handles edge cases where items might be group-related but don't have groupId)
    return true; // Show all non-group items
  });

  // Calculate applications sent today
  const today = new Date().toDateString();
  const applicationsTodayCount = currentUser
    ? applications.filter(
        app => app.userId === currentUser.id && new Date(app.dateApplied).toDateString() === today
      ).length
    : 0;
  
  // Find the largest quota from all groups the user is in
  const userGroups = currentUser
    ? groups.filter(group => group.memberIds.includes(currentUser.id))
    : [];
  const largestQuota = userGroups.length > 0
    ? Math.max(...userGroups.map(group => group.dailyQuota))
    : 0;
  
  // Format the applications today text as "x/y"
  const applicationsTodayText = largestQuota > 0
    ? `${applicationsTodayCount}/${largestQuota}`
    : applicationsTodayCount === 1 
      ? '1 app' 
      : `${applicationsTodayCount} apps`;

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'application':
        return 'document-text';
      case 'quota_hit':
        return 'checkmark-circle';
      case 'quota_missed':
        return 'close-circle';
      case 'streak':
        return 'flame';
      case 'offer':
        return 'trophy';
      default:
        return 'ellipse';
    }
  };

  const getActivityColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'quota_hit':
      case 'quota_missed':
        return '#9B59B6'; // Purple for quota notifications
      case 'offer':
        return colors.electricLime;
      case 'streak':
        return colors.warning;
      default:
        return colors.info;
    }
  };

  const renderBoldMessage = (message: string, userName: string, textColor: string) => {
    // Escape special regex characters in userName
    const escapedUserName = userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a combined regex pattern that matches user name, "offer", "application", or "quota" (case insensitive)
    const pattern = new RegExp(`(${escapedUserName}|offer|application|quota)`, 'gi');
    
    const parts: Array<{ text: string; bold: boolean }> = [];
    let lastIndex = 0;
    let match;

    // Find all matches
    while ((match = pattern.exec(message)) !== null) {
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
      return <Text style={[styles.activityMessage, { color: textColor }]}>{message}</Text>;
    }

    return (
      <Text style={[styles.activityMessage, { color: textColor }]}>
        {parts.map((part, index) => (
          <Text key={index} style={part.bold ? styles.boldText : {}}>
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  const LikeButton = ({ item }: { item: ActivityFeedItem }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isLiked = item.likedBy?.includes(currentUser?.id || '') || false;
    const likeCount = item.likedBy?.length || 0;

    const handleLike = () => {
      // Animate the stamp effect
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 2.2,
          friction: 2,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      toggleLikeActivity(item.id);
    };

    return (
      <TouchableOpacity
        onPress={handleLike}
        style={styles.likeButton}
        activeOpacity={0.7}
      >
        <View style={styles.likeContainer}>
          {likeCount > 0 && (
            <Text style={[styles.likeCount, { color: currentTheme.textSecondary }]}>
              {likeCount}
            </Text>
          )}
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? colors.coral : currentTheme.textSecondary}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActivityItem = (item: ActivityFeedItem) => {
    const activityColor = getActivityColor(item.type);
    
    return (
      <View key={item.id} style={[styles.activityCard, { backgroundColor: currentTheme.card }]}>
        <View style={styles.activityHeader}>
          <View
            style={[
              styles.avatarContainer,
              { borderColor: activityColor },
            ]}
          >
            <AvatarWithInitials
              uri={item.userAvatar}
              name={item.userName}
              size={48}
              backgroundColor={currentTheme.card}
              textColor={activityColor}
            />
          </View>
          <View style={styles.activityContent}>
            {renderBoldMessage(item.message, item.userName, currentTheme.text)}
            {item.metadata?.company && (
              <Text style={[styles.activityMeta, { color: currentTheme.textSecondary }]}>
                {item.metadata.company} • {item.metadata.position}
              </Text>
            )}
            {item.metadata?.streakDays && (
              <Text style={[styles.activityMeta, { color: currentTheme.textSecondary }]}>
                {item.metadata.streakDays} day streak! 🔥
              </Text>
            )}
            <View style={styles.activityFooter}>
              <Text style={[styles.activityTime, { color: currentTheme.textSecondary }]}>
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </Text>
              <LikeButton item={item} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Activity Feed</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Leaderboards' as never)}
          style={styles.leaderboardButton}
        >
          <Ionicons name="trophy" size={24} color={colors.electricLime} />
        </TouchableOpacity>
      </View>

      {currentUser && (
        <View style={[styles.streakCard, { backgroundColor: currentTheme.card }]}>
          <View style={styles.streakContent}>
            <Ionicons name="flame" size={32} color={colors.warning} />
            <View style={styles.streakText}>
              <Text style={[styles.streakLabel, { color: currentTheme.textSecondary }]}>
                Streak
              </Text>
              <Text style={[styles.streakValue, { color: currentTheme.text }]}>
                {currentUser.streak} days
              </Text>
            </View>
          </View>
          <View style={[styles.streakDivider, { backgroundColor: currentTheme.border }]} />
          <View style={styles.streakContent}>
            <Ionicons name="document-text" size={32} color={colors.electricLime} />
            <View style={styles.streakText}>
              <Text style={[styles.streakLabel, { color: currentTheme.textSecondary }]}>
                Today
              </Text>
              <Text style={[styles.streakValue, { color: currentTheme.text }]}>
                {applicationsTodayText}
              </Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredFeed.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
              No activity yet. Start logging applications!
            </Text>
          </View>
        ) : (
          filteredFeed.map(renderActivityItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  leaderboardButton: {
    padding: 8,
  },
  streakCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streakText: {
    marginLeft: 16,
    flex: 1,
  },
  streakDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 20,
  },
  streakLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activityCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  likeButton: {
    padding: 4,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityHeader: {
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    padding: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  activityMeta: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

