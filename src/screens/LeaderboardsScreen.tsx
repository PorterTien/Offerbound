import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import { LeaderboardEntry } from '../types';

type LeaderboardType = 'applications' | 'rejections' | 'offers';

export default function LeaderboardsScreen() {
  const { applications, currentUser, themeMode } = useApp();
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('applications');
  const currentTheme = theme[themeMode];

  // Calculate leaderboards
  const userStats = new Map<string, {
    applications: number;
    rejections: number;
    offers: number;
    userName: string;
  }>();

  applications.forEach(app => {
    const stats = userStats.get(app.userId) || {
      applications: 0,
      rejections: 0,
      offers: 0,
      userName: app.userId === currentUser?.id ? currentUser.name : `User ${app.userId.slice(0, 4)}`,
    };
    stats.applications++;
    if (app.status === 'Rejected') stats.rejections++;
    if (app.status === 'Offer') stats.offers++;
    userStats.set(app.userId, stats);
  });

  const getLeaderboard = (type: LeaderboardType): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = Array.from(userStats.entries()).map(([userId, stats]) => ({
      userId,
      userName: stats.userName,
      value: type === 'applications' ? stats.applications : type === 'rejections' ? stats.rejections : stats.offers,
      rank: 0,
    }));

    entries.sort((a, b) => b.value - a.value);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  };

  const leaderboard = getLeaderboard(leaderboardType);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Ionicons name="trophy" size={24} color="#FFD700" />;
      case 2:
        return <Ionicons name="medal" size={24} color="#C0C0C0" />;
      case 3:
        return <Ionicons name="medal" size={24} color="#CD7F32" />;
      default:
        return (
          <View style={[styles.rankNumber, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.rankText, { color: currentTheme.textSecondary }]}>{rank}</Text>
          </View>
        );
    }
  };

  const getTypeLabel = (type: LeaderboardType) => {
    switch (type) {
      case 'applications':
        return 'Most Applications';
      case 'rejections':
        return 'Most Rejections';
      case 'offers':
        return 'Most Offers';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Leaderboards</Text>
      </View>

      {/* Type Selector */}
      <View style={styles.typeSelector}>
        {(['applications', 'rejections', 'offers'] as LeaderboardType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              {
                backgroundColor:
                  leaderboardType === type ? colors.electricLime : currentTheme.card,
                borderColor: currentTheme.border,
              },
            ]}
            onPress={() => setLeaderboardType(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                {
                  color:
                    leaderboardType === type ? colors.charcoal : currentTheme.text,
                  fontWeight: leaderboardType === type ? '600' : '400',
                },
              ]}
            >
              {getTypeLabel(type)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leaderboard */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
              No data yet. Start logging applications!
            </Text>
          </View>
        ) : (
          leaderboard.map((entry) => {
            const isCurrentUser = entry.userId === currentUser?.id;
            return (
              <View
                key={entry.userId}
                style={[
                  styles.leaderboardItem,
                  {
                    backgroundColor: isCurrentUser
                      ? colors.electricLime + '20'
                      : currentTheme.card,
                    borderColor: isCurrentUser ? colors.electricLime : 'transparent',
                    borderWidth: isCurrentUser ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.rankContainer}>{getRankIcon(entry.rank)}</View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: currentTheme.text }]}>
                    {entry.userName}
                    {isCurrentUser && ' (You)'}
                  </Text>
                </View>
                <View style={styles.valueContainer}>
                  <Text style={[styles.value, { color: colors.electricLime }]}>
                    {entry.value}
                  </Text>
                </View>
              </View>
            );
          })
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
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

