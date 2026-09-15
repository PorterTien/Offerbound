import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';

type ScreenMode = 'select' | 'join' | 'create' | 'success';

export default function CreateJoinGroupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { themeMode, createGroupWithCode, joinGroupByCode, currentUser } = useApp();
  const currentTheme = theme[themeMode];

  const [mode, setMode] = useState<ScreenMode>('select');
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [dailyQuota, setDailyQuota] = useState('3');
  const [durationMonths, setDurationMonths] = useState('1');
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{ code: string; inviteLink: string } | null>(null);

  // Handle deep linking
  useEffect(() => {
    const params = route.params as { code?: string } | undefined;
    if (params?.code) {
      setGroupCode(params.code);
      setMode('join');
      handleJoinGroup(params.code);
    }
  }, [route.params]);

  const handleJoinGroup = async (code?: string) => {
    const codeToUse = code || groupCode.trim();
    if (!codeToUse || codeToUse.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit group code.');
      return;
    }

    setLoading(true);
    try {
      const result = await joinGroupByCode(codeToUse);
      if (result.success && result.groupId) {
        navigation.goBack();
        const stackNavigator = navigation.getParent();
        if (stackNavigator) {
          stackNavigator.navigate('GroupDetail', { groupId: result.groupId });
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to join group');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const quota = parseInt(dailyQuota, 10);
    const duration = parseInt(durationMonths, 10);

    if (isNaN(quota) || quota < 1 || quota > 20) {
      Alert.alert('Error', 'Daily quota must be between 1 and 20');
      return;
    }

    if (isNaN(duration) || duration < 1 || duration > 12) {
      Alert.alert('Error', 'Duration must be between 1 and 12 months');
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + duration);

      const result = await createGroupWithCode({
        name: groupName.trim(),
        dailyQuota: quota,
        durationMonths: duration,
        startDate,
        endDate,
        createdBy: currentUser?.id || '',
      });

      setCreatedGroup({ code: result.code, inviteLink: result.inviteLink });
      setMode('success');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!createdGroup) return;

    try {
      await Share.share({
        message: `Join my Offerbound group! Code: ${createdGroup.code}\n\nOr use this link: ${createdGroup.inviteLink}`,
        title: 'Join Offerbound Group',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = () => {
    if (!createdGroup) return;
    // In a real app, use Clipboard API
    Alert.alert('Code Copied', `Group code: ${createdGroup.code}`);
  };

  const renderSelectMode = () => (
    <View style={styles.content}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Join or Create Group</Text>
      <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
        Connect with friends and stay locked in!
      </Text>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.electricLime }]}
        onPress={() => setMode('join')}
      >
        <Ionicons name="people" size={24} color={colors.charcoal} />
        <Text style={[styles.actionButtonText, { color: colors.charcoal }]}>Join Group</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.createButton, { backgroundColor: currentTheme.card, borderColor: colors.electricLime }]}
        onPress={() => setMode('create')}
      >
        <Ionicons name="add-circle" size={24} color={colors.electricLime} />
        <Text style={[styles.actionButtonText, { color: colors.electricLime }]}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );

  const renderJoinMode = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Join Group</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
          Enter the 6-digit group code
        </Text>

        <View style={[styles.inputContainer, { backgroundColor: currentTheme.card }]}>
          <TextInput
            style={[styles.codeInput, { color: currentTheme.text }]}
            placeholder="000000"
            placeholderTextColor={currentTheme.textSecondary}
            value={groupCode}
            onChangeText={setGroupCode}
            maxLength={6}
            keyboardType="number-pad"
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.electricLime },
            loading && styles.disabledButton,
          ]}
          onPress={() => handleJoinGroup()}
          disabled={loading}
        >
          <Text style={[styles.submitButtonText, { color: colors.charcoal }]}>
            {loading ? 'Joining...' : 'Join Group'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: currentTheme.textSecondary }]}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderCreateMode = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Create Group</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
          Set up your accountability group
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Group Name</Text>
          <View style={[styles.inputContainer, { backgroundColor: currentTheme.card }]}>
            <TextInput
              style={[styles.input, { color: currentTheme.text }]}
              placeholder="e.g., Summer Internship Squad"
              placeholderTextColor={currentTheme.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          <Text style={[styles.label, { color: currentTheme.text }]}>Daily Quota</Text>
          <View style={[styles.inputContainer, { backgroundColor: currentTheme.card }]}>
            <TextInput
              style={[styles.input, { color: currentTheme.text }]}
              placeholder="3"
              placeholderTextColor={currentTheme.textSecondary}
              value={dailyQuota}
              onChangeText={setDailyQuota}
              keyboardType="number-pad"
            />
          </View>

          <Text style={[styles.label, { color: currentTheme.text }]}>Duration (months)</Text>
          <View style={[styles.inputContainer, { backgroundColor: currentTheme.card }]}>
            <TextInput
              style={[styles.input, { color: currentTheme.text }]}
              placeholder="1"
              placeholderTextColor={currentTheme.textSecondary}
              value={durationMonths}
              onChangeText={setDurationMonths}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.electricLime },
            loading && styles.disabledButton,
          ]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={[styles.submitButtonText, { color: colors.charcoal }]}>
            {loading ? 'Creating...' : 'Create Group'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode('select')} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: currentTheme.textSecondary }]}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderSuccessMode = () => (
    <View style={styles.content}>
      <View style={[styles.successIcon, { backgroundColor: colors.electricLime + '20' }]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.electricLime} />
      </View>
      <Text style={[styles.title, { color: currentTheme.text }]}>Group Created!</Text>
      <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
        Share this code with your friends
      </Text>

      <View style={[styles.codeDisplay, { backgroundColor: currentTheme.card }]}>
        <Text style={[styles.codeText, { color: currentTheme.text }]}>{createdGroup?.code}</Text>
      </View>

      <TouchableOpacity
        style={[styles.shareButton, { backgroundColor: colors.electricLime }]}
        onPress={handleShare}
      >
        <Ionicons name="share" size={20} color={colors.charcoal} />
        <Text style={[styles.shareButtonText, { color: colors.charcoal }]}>Share Invite</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.copyButton, { borderColor: colors.electricLime }]}
        onPress={handleCopyCode}
      >
        <Ionicons name="copy" size={20} color={colors.electricLime} />
        <Text style={[styles.copyButtonText, { color: colors.electricLime }]}>Copy Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: currentTheme.card }]}
        onPress={() => {
          if (createdGroup) {
            navigation.goBack();
          }
        }}
      >
        <Text style={[styles.doneButtonText, { color: currentTheme.text }]}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      {mode === 'select' && renderSelectMode()}
      {mode === 'join' && renderJoinMode()}
      {mode === 'create' && renderCreateMode()}
      {mode === 'success' && renderSuccessMode()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  createButton: {
    borderWidth: 2,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
  },
  submitButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  codeDisplay: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeText: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  shareButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});


