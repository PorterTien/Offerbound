import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import AvatarWithInitials from '../components/AvatarWithInitials';
import { StatusBar } from 'expo-status-bar';

export default function GroupSettingsModal() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };
  const {
    groups,
    currentUser,
    themeMode,
    updateGroupProfilePicture,
    updateGroupName,
    updateGroupQuota,
    updateGroupPunishmentPrice,
    getGroupCode,
    kickMember,
    toggleHideNotifications,
    getGroupMembers,
    leaveGroup,
  } = useApp();
  const currentTheme = theme[themeMode];

  const group = groups.find(g => g.id === groupId);
  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.text }]}>Group not found</Text>
      </View>
    );
  }

  const isCreator = group.createdBy === currentUser?.id;
  const members = getGroupMembers(groupId);
  const groupCode = getGroupCode(groupId);
  const userSettings = group.memberSettings?.[currentUser?.id || ''] || {
    hideNotifications: false,
  };

  const [hideNotifications, setHideNotifications] = useState(userSettings.hideNotifications);

  const handleChangePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to change the group picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateGroupProfilePicture(groupId, result.assets[0].uri);
    }
  };

  const handleViewCode = () => {
    if (!groupCode) return;
    Alert.alert('Group Code', `Code: ${groupCode}`, [
      { text: 'Copy', onPress: () => Alert.alert('Copied', `Code: ${groupCode}`) },
      { text: 'Share', onPress: handleShareCode },
      { text: 'OK' },
    ]);
  };

  const handleShareCode = async () => {
    if (!groupCode) return;
    try {
      await Share.share({
        message: `Join my Offerbound group! Code: ${groupCode}\n\nOr use this link: offerbound://join/${groupCode}`,
        title: 'Join Offerbound Group',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleKickMember = (userId: string, userName: string) => {
    if (!isCreator) return;
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${userName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await kickMember(groupId, userId);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleToggleHideNotifications = async (value: boolean) => {
    setHideNotifications(value);
    await toggleHideNotifications(groupId, value);
  };

  const handleEditQuota = () => {
    Alert.prompt(
      'Edit Group Quota',
      `Enter the daily application quota (1-100):\n\nCurrent: ${group.dailyQuota} apps/day`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (quotaText?: string) => {
            if (!quotaText) return;
            const quota = parseInt(quotaText, 10);
            if (isNaN(quota) || quota < 1 || quota > 100) {
              Alert.alert('Invalid Input', 'Please enter a number between 1 and 100');
              return;
            }
            try {
              await updateGroupQuota(groupId, quota);
              Alert.alert('Success', `Group quota updated to ${quota} apps/day`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update quota');
            }
          },
        },
      ],
      'plain-text',
      group.dailyQuota.toString()
    );
  };

  const handleEditGroupName = () => {
    Alert.prompt(
      'Edit Group Name',
      `Enter the new group name:\n\nCurrent: ${group.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (nameText?: string) => {
            if (!nameText || !nameText.trim()) {
              Alert.alert('Invalid Input', 'Group name cannot be empty');
              return;
            }
            if (nameText.length > 50) {
              Alert.alert('Invalid Input', 'Group name must be 50 characters or less');
              return;
            }
            try {
              await updateGroupName(groupId, nameText.trim());
              Alert.alert('Success', `Group name updated to "${nameText.trim()}"`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update group name');
            }
          },
        },
      ],
      'plain-text',
      group.name
    );
  };

  const handleEditPunishmentPrice = () => {
    Alert.prompt(
      'Edit Punishment Price',
      `Enter the price charged for not hitting quota:\n\nCurrent: $${(group.punishmentPrice || 0).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (priceText?: string) => {
            if (!priceText) return;
            const price = parseFloat(priceText);
            if (isNaN(price) || price < 0) {
              Alert.alert('Invalid Input', 'Please enter a number that is 0 or greater');
              return;
            }
            try {
              await updateGroupPunishmentPrice(groupId, price);
              Alert.alert('Success', `Punishment price updated to $${price.toFixed(2)}`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update punishment price');
            }
          },
        },
      ],
      'plain-text',
      (group.punishmentPrice || 0).toString()
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Group Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.profilePictureContainer}
          onPress={handleChangePicture}
          activeOpacity={0.8}
        >
          <AvatarWithInitials
            uri={group.profilePicture}
            name={group.name}
            size={100}
            backgroundColor={colors.electricLime + '40'}
            textColor={colors.electricLime}
          />
          <View style={[styles.editBadge, { backgroundColor: colors.electricLime, borderColor: currentTheme.card }]}>
            <Ionicons name="camera" size={16} color={colors.charcoal} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isCreator ? handleEditGroupName : undefined}
          disabled={!isCreator}
          activeOpacity={isCreator ? 0.7 : 1}
          style={styles.groupNameContainer}
        >
          <Text style={[styles.groupName, { color: currentTheme.text }]}>
            {group.name}
          </Text>
        </TouchableOpacity>
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(group.endDate);
          endDate.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <Text style={[styles.daysLeft, { color: currentTheme.textSecondary }]}>
              {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : daysLeft === 0 ? 'Last day' : 'Expired'}
            </Text>
          );
        })()}

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentTheme.card }]}
            onPress={handleViewCode}
          >
            <Ionicons name="key" size={24} color={colors.electricLime} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: currentTheme.text }]}>View Group Code</Text>
              <Text style={[styles.settingSubtitle, { color: currentTheme.textSecondary }]}>
                {groupCode || 'No code'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentTheme.card }]}
            onPress={isCreator ? handleEditQuota : undefined}
            disabled={!isCreator}
          >
            <Ionicons name="document-text" size={24} color={colors.electricLime} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: currentTheme.text }]}>Group Quota</Text>
              <Text style={[styles.settingSubtitle, { color: currentTheme.textSecondary }]}>
                {group.dailyQuota} apps/day
              </Text>
            </View>
            {isCreator && (
              <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentTheme.card }]}
            onPress={isCreator ? handleEditPunishmentPrice : undefined}
            disabled={!isCreator}
          >
            <Ionicons name="cash" size={24} color={colors.electricLime} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: currentTheme.text }]}>Punishment Price</Text>
              <Text style={[styles.settingSubtitle, { color: currentTheme.textSecondary }]}>
                ${(group.punishmentPrice || 0).toFixed(2)} charged for missing quota
              </Text>
            </View>
            {isCreator && (
              <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={[styles.settingItem, { backgroundColor: currentTheme.card }]}>
            <Ionicons name="notifications-off" size={24} color={colors.electricLime} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: currentTheme.text }]}>Hide Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: currentTheme.textSecondary }]}>
                Hide this group's activity from home feed
              </Text>
            </View>
            <Switch
              value={hideNotifications}
              onValueChange={handleToggleHideNotifications}
              trackColor={{ false: currentTheme.textSecondary, true: colors.electricLime }}
              thumbColor={currentTheme.background}
            />
          </View>
        </View>

        {isCreator && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Members</Text>
            {members.map((member) => {
              const memberUser = member.userId === currentUser?.id ? currentUser : null;
              const memberName = memberUser?.name || `User ${member.userId.slice(0, 4)}`;
              const isCurrentUser = member.userId === currentUser?.id;

              return (
                <View
                  key={member.userId}
                  style={[styles.memberItem, { backgroundColor: currentTheme.card }]}
                >
                  <AvatarWithInitials
                    uri={memberUser?.avatar}
                    name={memberName}
                    size={40}
                    backgroundColor={colors.electricLime + '40'}
                    textColor={colors.electricLime}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: currentTheme.text }]}>
                      {isCurrentUser ? 'You' : memberName}
                    </Text>
                    <Text style={[styles.memberStats, { color: currentTheme.textSecondary }]}>
                      {member.streak} day streak • {member.totalApplications} apps
                    </Text>
                  </View>
                  {isCreator && !isCurrentUser && (
                    <TouchableOpacity
                      onPress={() => handleKickMember(member.userId, memberName)}
                      style={styles.kickButton}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.coral} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Leave Group Button - Available to all members */}
        {group.memberIds.includes(currentUser?.id || '') && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.leaveButton, { backgroundColor: currentTheme.card }]}
              onPress={() => {
                Alert.alert(
                  'Leave Group',
                  `Are you sure you want to leave "${group.name}"? You will lose access to this group and its data.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Leave',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await leaveGroup(groupId);
                          navigation.goBack();
                        } catch (error: any) {
                          Alert.alert('Cannot Leave Group', error.message || 'You must settle up any amount owed before leaving this group.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="exit-outline" size={24} color={colors.coral} />
              <Text style={[styles.leaveButtonText, { color: colors.coral }]}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profilePictureContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
  groupNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    width: '100%',
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  daysLeft: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberStats: {
    fontSize: 13,
  },
  kickButton: {
    padding: 4,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});


