import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';

export default function ApplicationSuccessScreen() {
  const navigation = useNavigation();
  const { currentUser, groups, applications, checkQuota, themeMode } = useApp();
  const currentTheme = theme[themeMode];

  if (!currentUser) {
    return null;
  }

  // Calculate applications sent today
  const today = new Date().toDateString();
  const applicationsToday = applications.filter(
    app => app.userId === currentUser.id && new Date(app.dateApplied).toDateString() === today
  ).length;

  // Calculate remaining applications needed for groups
  const groupQuotas = groups
    .filter(group => group.memberIds.includes(currentUser.id))
    .map(group => {
      const quotaCheck = checkQuota(group.id, currentUser.id);
      const remaining = Math.max(0, group.dailyQuota - quotaCheck.applicationsToday);
      return {
        groupName: group.name,
        remaining,
        quota: group.dailyQuota,
        met: quotaCheck.met,
      };
    });

  const totalRemaining = groupQuotas.reduce((sum, g) => sum + g.remaining, 0);
  const allQuotasMet = groupQuotas.length > 0 && groupQuotas.every(g => g.met);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.header}>
          <View style={[styles.successIcon, { backgroundColor: colors.electricLime + '20' }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.electricLime} />
          </View>
          <Text style={[styles.successTitle, { color: currentTheme.text }]}>
            Application Logged!
          </Text>
          <Text style={[styles.successSubtitle, { color: currentTheme.textSecondary }]}>
            Keep up the momentum
          </Text>
        </View>

        {/* Streak Card */}
        <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={24} color={colors.warning} />
            <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Current Streak</Text>
          </View>
          <Text style={[styles.streakNumber, { color: colors.warning }]}>
            {currentUser.streak} {currentUser.streak === 1 ? 'day' : 'days'}
          </Text>
          <Text style={[styles.cardSubtext, { color: currentTheme.textSecondary }]}>
            {currentUser.streak === 0
              ? 'Start your streak today!'
              : currentUser.streak < 7
              ? 'Keep it going!'
              : currentUser.streak < 30
              ? 'You\'re on fire! 🔥'
              : 'Incredible dedication! 🌟'}
          </Text>
        </View>

        {/* Applications Today Card */}
        <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color={colors.electricLime} />
            <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Applications Today</Text>
          </View>
          <Text style={[styles.streakNumber, { color: colors.electricLime }]}>
            {applicationsToday}
          </Text>
          <Text style={[styles.cardSubtext, { color: currentTheme.textSecondary }]}>
            {applicationsToday === 1
              ? 'Great start! Keep it up!'
              : applicationsToday < 5
              ? 'You\'re making progress!'
              : applicationsToday < 10
              ? 'Impressive dedication!'
              : 'Outstanding effort! 🚀'}
          </Text>
        </View>

        {/* Group Quotas */}
        {groupQuotas.length > 0 ? (
          <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={24} color={colors.electricLime} />
              <Text style={[styles.cardTitle, { color: currentTheme.text }]}>
                Group Quotas
              </Text>
            </View>

            {allQuotasMet ? (
              <View style={styles.quotaMetContainer}>
                <Ionicons name="checkmark-circle" size={32} color={colors.electricLime} />
                <Text style={[styles.quotaMetText, { color: colors.electricLime }]}>
                  All quotas met for today! 🎉
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.remainingTotal, { color: currentTheme.text }]}>
                  {totalRemaining} application{totalRemaining !== 1 ? 's' : ''} remaining
                </Text>
                {groupQuotas.map((group, index) => (
                  <View key={index} style={styles.groupQuotaItem}>
                    <Text style={[styles.groupName, { color: currentTheme.text }]}>
                      {group.groupName}
                    </Text>
                    <View style={[styles.quotaProgress, { backgroundColor: currentTheme.border }]}>
                      <View
                        style={[
                          styles.quotaBar,
                          {
                            // Green bar proportional to how much of the quota is completed
                            backgroundColor: colors.electricLime,
                            width: `${(group.quota - group.remaining) / group.quota * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.quotaText, { color: currentTheme.textSecondary }]}>
                      {group.quota - group.remaining}/{group.quota}
                      {group.remaining > 0 && (
                        <Text style={{ color: colors.coral }}> • {group.remaining} left</Text>
                      )}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={24} color={currentTheme.textSecondary} />
              <Text style={[styles.cardTitle, { color: currentTheme.text }]}>
                No Active Groups
              </Text>
            </View>
            <Text style={[styles.cardSubtext, { color: currentTheme.textSecondary }]}>
              Join a group to set daily quotas and stay accountable
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.electricLime }]}
            onPress={() => {
              // Replace this success modal with a fresh LogApplication modal
              navigation.dispatch(StackActions.replace('LogApplication' as never));
            }}
          >
            <Text style={[styles.primaryButtonText, { color: colors.charcoal }]}>
              Log Another Application
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: currentTheme.border }]}
            onPress={() => {
              // Close all modals by going back
              navigation.dispatch(StackActions.popToTop());
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: currentTheme.text }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  remainingTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quotaMetContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  quotaMetText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  groupQuotaItem: {
    marginBottom: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  quotaProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  quotaBar: {
    height: '100%',
    borderRadius: 4,
  },
  quotaText: {
    fontSize: 14,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

