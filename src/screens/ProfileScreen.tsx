import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import AvatarWithInitials from '../components/AvatarWithInitials';

export default function ProfileScreen() {
  const { currentUser, linkBankAccount, themeMode, toggleTheme, showCongratulationsEnabled, toggleCongratulations, updateUserAvatar } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const currentTheme = theme[themeMode];

  const handleLinkBankAccount = () => {
    Alert.alert(
      'Link Bank Account',
      'Linking your bank account will unlock unlimited groups and full money mode features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Link Account',
          onPress: () => {
            linkBankAccount();
            Alert.alert('Success', 'Bank account linked!');
          },
        },
      ]
    );
  };

  const handleChangePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateUserAvatar(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => {
        // Handle logout
        Alert.alert('Logged Out', 'You have been logged out.');
      }},
    ]);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.errorText, { color: currentTheme.text }]}>No user found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: currentTheme.card }]}>
          <TouchableOpacity
            onPress={handleChangePicture}
            activeOpacity={0.8}
            style={styles.avatarContainer}
          >
            <AvatarWithInitials
              uri={currentUser.avatar}
              name={currentUser.name}
              size={96}
              backgroundColor={colors.electricLime + '20'}
              textColor={colors.electricLime}
            />
            <View style={[styles.editBadge, { backgroundColor: colors.electricLime, borderColor: currentTheme.card }]}>
              <Ionicons name="camera" size={16} color={colors.charcoal} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: currentTheme.text }]}>{currentUser.name}</Text>
          <Text style={[styles.email, { color: currentTheme.textSecondary }]}>
            {currentUser.email}
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: currentTheme.card }]}>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={24} color={colors.warning} />
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>
                {currentUser.streak}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                Day Streak
              </Text>
            </View>
          </View>
          <View style={[styles.statDivider, { backgroundColor: currentTheme.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="card" size={24} color={colors.electricLime} />
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>
                {currentUser.mode}
              </Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                Mode
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Account</Text>
        
        {!currentUser.bankAccountLinked && (
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: currentTheme.card }]}
            onPress={handleLinkBankAccount}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="card-outline" size={24} color={colors.electricLime} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  Link Bank Account
                </Text>
                <Text style={[styles.settingSubtitle, { color: currentTheme.textSecondary }]}>
                  Unlock unlimited groups & money mode
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        )}

        {currentUser.bankAccountLinked && (
          <View style={[styles.settingItem, { backgroundColor: currentTheme.card }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="checkmark-circle" size={24} color={colors.electricLime} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                  Bank Account Linked
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.electricLime }]}>
                  Full access enabled
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: currentTheme.text, marginTop: 24 }]}>
          Settings
        </Text>

        <View style={[styles.settingItem, { backgroundColor: currentTheme.card }]}>
          <View style={styles.settingLeft}>
            <Ionicons 
              name={themeMode === 'dark' ? 'moon' : 'sunny'} 
              size={24} 
              color={currentTheme.textSecondary} 
            />
            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>Theme</Text>
          </View>
          <View style={styles.themeToggle}>
            <Text style={[styles.themeLabel, { color: currentTheme.textSecondary }]}>
              {themeMode === 'dark' ? 'Dark' : 'Light'}
            </Text>
            <Switch
              value={themeMode === 'light'}
              onValueChange={toggleTheme}
              trackColor={{ false: currentTheme.border, true: colors.electricLime + '80' }}
              thumbColor={themeMode === 'light' ? colors.electricLime : currentTheme.textSecondary}
            />
          </View>
        </View>

        <View style={[styles.settingItem, { backgroundColor: currentTheme.card }]}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color={currentTheme.textSecondary} />
            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: currentTheme.border, true: colors.electricLime + '80' }}
            thumbColor={notificationsEnabled ? colors.electricLime : currentTheme.textSecondary}
          />
        </View>

        <View style={[styles.settingItem, { backgroundColor: currentTheme.card }]}>
          <View style={styles.settingLeft}>
            <Ionicons name="trophy-outline" size={24} color={currentTheme.textSecondary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                Congratulations Screen
              </Text>
              <Text style={[styles.settingSubtitle, { color: currentTheme.textSecondary }]}>
                Show celebration when logging offers
              </Text>
            </View>
          </View>
          <Switch
            value={showCongratulationsEnabled}
            onValueChange={toggleCongratulations}
            trackColor={{ false: currentTheme.border, true: colors.electricLime + '80' }}
            thumbColor={showCongratulationsEnabled ? colors.electricLime : currentTheme.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: currentTheme.card }]}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="lock-closed-outline" size={24} color={currentTheme.textSecondary} />
            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>Privacy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
        </TouchableOpacity>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: currentTheme.card }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.coral} />
          <Text style={[styles.actionButtonText, { color: colors.coral }]}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentTheme.textSecondary }]}>
            Offerbound v1.0.0
          </Text>
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    marginBottom: 24,
  },
  avatarContainer: {
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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  statsCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
  },
});

