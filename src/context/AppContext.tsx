import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Application, Group, GroupMember, ActivityFeedItem } from '../types';
import { generateGroupCode, createGroupInviteLink } from '../utils/groupCodeGenerator';

type ThemeMode = 'light' | 'dark';

interface AppContextType {
  currentUser: User | null;
  applications: Application[];
  groups: Group[];
  activityFeed: ActivityFeedItem[];
  themeMode: ThemeMode;
  showCongratulationsEnabled: boolean;
  toggleTheme: () => void;
  toggleCongratulations: () => void;
  addApplication: (application: Omit<Application, 'id' | 'dateApplied'> & { dateApplied?: Date }) => void;
  updateApplicationStatus: (id: string, status: Application['status']) => void;
  updateApplication: (id: string, updates: Partial<Omit<Application, 'id' | 'userId'>>) => void;
  deleteApplication: (id: string) => Promise<void>;
  createGroup: (group: Omit<Group, 'id' | 'pot' | 'punishmentPrice' | 'memberIds' | 'code' | 'inviteLink' | 'profilePicture' | 'memberSettings'> & { punishmentPrice?: number }) => void;
  createGroupWithCode: (group: Omit<Group, 'id' | 'pot' | 'punishmentPrice' | 'memberIds' | 'code' | 'inviteLink' | 'profilePicture' | 'memberSettings'> & { punishmentPrice?: number }) => Promise<{ group: Group; code: string; inviteLink: string }>;
  joinGroup: (groupId: string) => void;
  joinGroupByCode: (code: string) => Promise<{ success: boolean; groupId?: string; error?: string }>;
  leaveGroup: (groupId: string) => Promise<void>;
  getGroupMembers: (groupId: string) => GroupMember[];
  checkQuota: (groupId: string, userId: string) => { met: boolean; applicationsToday: number; quota: number };
  linkBankAccount: () => void;
  updateGroupProfilePicture: (groupId: string, pictureUri: string) => Promise<void>;
  updateGroupName: (groupId: string, name: string) => Promise<void>;
  updateUserAvatar: (avatarUri: string) => Promise<void>;
  updateGroupQuota: (groupId: string, dailyQuota: number) => Promise<void>;
  updateGroupPunishmentPrice: (groupId: string, punishmentPrice: number) => Promise<void>;
  getGroupCode: (groupId: string) => string | null;
  kickMember: (groupId: string, userId: string) => Promise<void>;
  togglePostToGroup: (groupId: string, enabled: boolean) => Promise<void>;
  toggleHideNotifications: (groupId: string, enabled: boolean) => Promise<void>;
  sendGroupMessage: (groupId: string, message: string) => Promise<void>;
  getGroupActivity: (groupId: string) => ActivityFeedItem[];
  toggleLikeActivity: (activityId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [showCongratulationsEnabled, setShowCongratulationsEnabled] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  // Check end-of-day quotas on app load and when data is ready
  useEffect(() => {
    if (currentUser && groups.length > 0 && applications.length > 0) {
      checkEndOfDayQuotas();
    }
  }, [currentUser?.id, groups.length, applications.length]);

  const loadData = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme === 'light' || savedTheme === 'dark') setThemeMode(savedTheme);

      const savedCongratulations = await AsyncStorage.getItem('showCongratulationsEnabled');
      if (savedCongratulations !== null) {
        setShowCongratulationsEnabled(savedCongratulations === 'true');
      }

      let loadedUser: User | null = null;
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        loadedUser = JSON.parse(userData);
      } else {
        const demoUser: User = {
          id: '1',
          name: 'Demo User',
          email: 'demo@offerbound.com',
          streak: 0,
          bankAccountLinked: false,
          mode: 'Starter',
        };
        loadedUser = demoUser;
        await AsyncStorage.setItem('currentUser', JSON.stringify(demoUser));
      }

      let parsedApps: Application[] = [];
      const appsData = await AsyncStorage.getItem('applications');
      if (appsData) {
        const apps = JSON.parse(appsData);
        parsedApps = apps.map((app: any) => ({ ...app, dateApplied: new Date(app.dateApplied) }));
        setApplications(parsedApps);
      }

      if (loadedUser) {
        const calculatedStreak = calculateStreak(loadedUser.id, parsedApps);
        const updatedUser = { ...loadedUser, streak: calculatedStreak };
        setCurrentUser(updatedUser);
        if (calculatedStreak !== loadedUser.streak) {
          await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }

      const groupsData = await AsyncStorage.getItem('groups');
      if (groupsData) {
        const groups = JSON.parse(groupsData);
        setGroups(groups.map((group: any) => ({
          ...group,
          startDate: new Date(group.startDate),
          endDate: new Date(group.endDate),
        })));
      }

      const feedData = await AsyncStorage.getItem('activityFeed');
      if (feedData) {
        const feed = JSON.parse(feedData);
        setActivityFeed(feed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveApplications = async (apps: Application[]) => {
    await AsyncStorage.setItem('applications', JSON.stringify(apps));
  };

  const saveGroups = async (groups: Group[]) => {
    await AsyncStorage.setItem('groups', JSON.stringify(groups));
  };

  const saveActivityFeed = async (feed: ActivityFeedItem[]) => {
    await AsyncStorage.setItem('activityFeed', JSON.stringify(feed));
  };

  // Calculate streak based on consecutive days with applications
  const calculateStreak = (userId: string, apps: Application[]): number => {
    // Get all unique dates when user submitted applications, sorted by date
    const userApps = apps.filter(app => app.userId === userId);
    const uniqueDates = Array.from(
      new Set(
        userApps.map(app => {
          const date = new Date(app.dateApplied);
          // Normalize to midnight for date comparison
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
      )
    ).sort((a, b) => b - a); // Sort descending (most recent first)

    if (uniqueDates.length === 0) return 0;

    // Start from today and count backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    // Check if there's an application today or yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTime = yesterday.getTime();

    // If no application today or yesterday, streak is 0
    if (uniqueDates[0] !== todayTime && uniqueDates[0] !== yesterdayTime) {
      return 0;
    }

    // Count consecutive days
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(currentDate);
      expectedDate.setHours(0, 0, 0, 0);
      const expectedTime = expectedDate.getTime();

      if (uniqueDates[i] === expectedTime) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If we're checking today and it's not there, check yesterday
        if (i === 0 && expectedTime === todayTime) {
          currentDate.setDate(currentDate.getDate() - 1);
          i--; // Check this date again
          continue;
        }
        // Gap found, break
        break;
      }
    }

    return streak;
  };

  const addApplication = async (applicationData: Omit<Application, 'id' | 'dateApplied'> & { dateApplied?: Date }) => {
    if (!currentUser) return;

    const newApplication: Application = {
      ...applicationData,
      id: Date.now().toString(),
      dateApplied: applicationData.dateApplied || new Date(),
      userId: currentUser.id,
    };

    const updatedApplications = [...applications, newApplication];
    setApplications(updatedApplications);
    await saveApplications(updatedApplications);

    // Calculate streak based on all application dates
    const calculatedStreak = calculateStreak(currentUser.id, updatedApplications);
    const updatedUser = { ...currentUser, streak: calculatedStreak };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));

    let updatedFeed = activityFeed;

    if (newApplication.status !== 'Offer') {
      const applicationEmojis = ['📝', '💼', '🚀', '✨', '🎯', '📄', '🔥', '💪', '⭐', '🎉'];
      const randomEmoji = applicationEmojis[Math.floor(Math.random() * applicationEmojis.length)];

      // Post to home feed
      const homeActivityItem: ActivityFeedItem = {
        id: `${Date.now()}-home`,
        type: 'application',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        message: `${currentUser.name} logged an application ${randomEmoji}`,
        timestamp: new Date(),
        metadata: {
          company: newApplication.company,
          position: newApplication.position,
          applicationId: newApplication.id,
        },
      };
      updatedFeed = [homeActivityItem, ...updatedFeed];
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);

      // Post to groups where user has postToGroup enabled
      const groupsToPost = groups.filter(group => {
        if (!group.memberIds.includes(currentUser.id)) return false;
        const settings = group.memberSettings?.[currentUser.id];
        return settings?.postToGroup !== false; // Default to true
      });

      for (const group of groupsToPost) {
        // Post as the user who logged the application (not group creator)
        // This ensures the notification appears with their profile picture and name
        const activityItem: ActivityFeedItem = {
          id: `${Date.now()}-${group.id}`,
          type: 'application',
          userId: currentUser.id, // User who logged the application
          userName: currentUser.name, // Their name
          userAvatar: currentUser.avatar, // Their profile picture
          message: `${currentUser.name} logged an application ${randomEmoji}`,
          timestamp: new Date(),
          metadata: {
            company: newApplication.company,
            position: newApplication.position,
            applicationId: newApplication.id,
            groupId: group.id,
          },
        };
        updatedFeed = [activityItem, ...updatedFeed];
        setActivityFeed(updatedFeed);
        await saveActivityFeed(updatedFeed);
      }
    }

    // Check quotas and post notifications to groups (using updatedApplications to include the new app)
    const checkQuotaWithUpdatedApps = (groupId: string, userId: string): { met: boolean; applicationsToday: number; quota: number } => {
      const group = groups.find(g => g.id === groupId);
      if (!group) return { met: false, applicationsToday: 0, quota: 0 };

      const memberJoinDate = group.memberJoinDates?.[userId];
      const today = new Date().toDateString();
      
      // Only count applications from after the member joined
      const appsToday = memberJoinDate
        ? updatedApplications.filter(app =>
            app.userId === userId &&
            new Date(app.dateApplied).toDateString() === today &&
            new Date(app.dateApplied) >= new Date(memberJoinDate)
          ).length
        : updatedApplications.filter(app =>
            app.userId === userId && new Date(app.dateApplied).toDateString() === today
          ).length;

      return {
        met: appsToday >= group.dailyQuota,
        applicationsToday: appsToday,
        quota: group.dailyQuota,
      };
    };

    for (const group of groups) {
      if (group.memberIds.includes(currentUser.id)) {
        const quotaCheck = checkQuotaWithUpdatedApps(group.id, currentUser.id);
        if (quotaCheck.met && quotaCheck.applicationsToday === group.dailyQuota) {
          // Check if we already posted a quota_hit notification for this group today
          const today = new Date().toDateString();
          const alreadyNotified = updatedFeed.some((item: ActivityFeedItem) => 
            item.type === 'quota_hit' &&
            item.userId === currentUser.id &&
            item.metadata?.groupId === group.id &&
            new Date(item.timestamp).toDateString() === today
          );

          if (!alreadyNotified) {
            // Post to group feed
            const groupQuotaActivity: ActivityFeedItem = {
              id: `${Date.now()}-${group.id}-quota`,
              type: 'quota_hit',
              userId: currentUser.id,
              userName: currentUser.name,
              userAvatar: currentUser.avatar,
              message: `${currentUser.name} hit today's quota! 🎉`,
              timestamp: new Date(),
              metadata: {
                groupId: group.id,
              },
            };
            updatedFeed = [groupQuotaActivity, ...updatedFeed];
            setActivityFeed(updatedFeed);
            await saveActivityFeed(updatedFeed);

            // Also post to home feed (only once per day across all groups)
            const homeFeedAlreadyNotified = updatedFeed.some((item: ActivityFeedItem) =>
              item.type === 'quota_hit' &&
              item.userId === currentUser.id &&
              !item.metadata?.groupId &&
              new Date(item.timestamp).toDateString() === today
            );

            if (!homeFeedAlreadyNotified) {
              const homeQuotaActivity: ActivityFeedItem = {
                id: `${Date.now()}-home-quota`,
                type: 'quota_hit',
                userId: currentUser.id,
                userName: currentUser.name,
                userAvatar: currentUser.avatar,
                message: `${currentUser.name} hit today's quota`,
                timestamp: new Date(),
              };
              updatedFeed = [homeQuotaActivity, ...updatedFeed];
              setActivityFeed(updatedFeed);
              await saveActivityFeed(updatedFeed);
            }
          }
        }
      }
    }
  };

  const updateApplicationStatus = async (id: string, status: Application['status']) => {
    if (!currentUser) return;
    
    const originalApp = applications.find(app => app.id === id);
    const wasOffer = originalApp?.status === 'Offer';
    const isNowOffer = status === 'Offer';
    
    const updatedApplications = applications.map(app =>
      app.id === id ? { ...app, status } : app
    );
    setApplications(updatedApplications);
    await saveApplications(updatedApplications);

    if (wasOffer && !isNowOffer) {
      const updatedFeed = activityFeed.filter(item =>
        !(item.type === 'offer' && item.metadata?.applicationId === id)
      );
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);
    }

    if (!wasOffer && isNowOffer) {
      const app = updatedApplications.find(app => app.id === id);
      const activityItem: ActivityFeedItem = {
        id: Date.now().toString(),
        type: 'offer',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        message: `${currentUser.name} received an offer!`,
        timestamp: new Date(),
        metadata: {
          company: app?.company,
          position: app?.position,
          applicationId: id,
        },
      };
      const updatedFeed = [activityItem, ...activityFeed];
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);
    }
  };

  const updateApplication = async (id: string, updates: Partial<Omit<Application, 'id' | 'userId'>>) => {
    if (!currentUser) return;
    
    // Get the original application to check if status is changing
    const originalApp = applications.find(app => app.id === id);
    const wasOffer = originalApp?.status === 'Offer';
    const isNowOffer = updates.status === 'Offer';
    
    const updatedApplications = applications.map(app =>
      app.id === id ? { ...app, ...updates } : app
    );
    setApplications(updatedApplications);
    await saveApplications(updatedApplications);

    // Recalculate streak if dateApplied changed
    if (updates.dateApplied !== undefined) {
      const calculatedStreak = calculateStreak(currentUser.id, updatedApplications);
      const updatedUser = { ...currentUser, streak: calculatedStreak };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }

    // If status changed from Offer to something else, remove offer activity feed items for this application
    if (wasOffer && !isNowOffer && originalApp) {
      // Remove offer activity feed items that match this application
      const updatedFeed = activityFeed.filter(item => {
        // Remove if it's an offer type and matches this application ID
        if (item.type === 'offer' && item.metadata?.applicationId === id) {
          return false;
        }
        return true;
      });
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);
    }

    // If status changed to Offer, add activity feed item
    if (!wasOffer && isNowOffer && currentUser) {
      const updatedApp = updatedApplications.find(app => app.id === id);
      const activityItem: ActivityFeedItem = {
        id: Date.now().toString(),
        type: 'offer',
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        message: `${currentUser.name} received an offer!`,
        timestamp: new Date(),
        metadata: {
          company: updatedApp?.company,
          position: updatedApp?.position,
          applicationId: id, // Track which application this feed item is for
        },
      };
      const updatedFeed = [activityItem, ...activityFeed];
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!currentUser) return;
    
    try {
      const appToDelete = applications.find(app => app.id === id);
      if (!appToDelete) return;

      const updatedApplications = applications.filter(app => app.id !== id);
      setApplications(updatedApplications);
      await saveApplications(updatedApplications);

      const updatedFeed = activityFeed.filter(item => {
        if (item.metadata?.applicationId === id) return false;
        if (item.type === 'application' && 
            item.metadata?.company === appToDelete.company && 
            item.metadata?.position === appToDelete.position &&
            item.userId === currentUser.id) return false;
        return true;
      });
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);

      const calculatedStreak = calculateStreak(currentUser.id, updatedApplications);
      const updatedUser = { ...currentUser, streak: calculatedStreak };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const createGroup = async (groupData: Omit<Group, 'id' | 'pot' | 'punishmentPrice' | 'memberIds' | 'code' | 'inviteLink' | 'profilePicture' | 'memberSettings'> & { punishmentPrice?: number }) => {
    if (!currentUser) return;

    const existingCodes = groups.map(g => g.code).filter(Boolean);
    const code = generateGroupCode(existingCodes);
    const inviteLink = createGroupInviteLink(code);

    // ========== DEBUGGING FEATURE - EASY TO DELETE ==========
    // If group name is "debugging group", add 5 bot users
    let memberIds = [currentUser.id];
    let memberSettings: { [userId: string]: { postToGroup: boolean; hideNotifications: boolean } } = {
      [currentUser.id]: {
        postToGroup: true,
        hideNotifications: false,
      },
    };
    let memberJoinDates: { [userId: string]: Date } | undefined = undefined;

    if (groupData.name.toLowerCase() === 'debugging group') {
      const now = new Date();
      memberJoinDates = {
        [currentUser.id]: now,
      };
      
      // Create 5 bot users
      for (let i = 1; i <= 5; i++) {
        const botId = `bot-user-${Date.now()}-${i}`;
        memberIds.push(botId);
        memberSettings[botId] = {
          postToGroup: true,
          hideNotifications: false,
        };
        if (memberJoinDates) {
          memberJoinDates[botId] = now;
        }
      }
    }
    // ========== END DEBUGGING FEATURE ==========

    const newGroup: Group = {
      ...groupData,
      id: Date.now().toString(),
      pot: 0,
      punishmentPrice: groupData.punishmentPrice ?? 0,
      memberIds,
      code,
      inviteLink,
      memberSettings,
      memberJoinDates,
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const createGroupWithCode = async (groupData: Omit<Group, 'id' | 'pot' | 'punishmentPrice' | 'memberIds' | 'code' | 'inviteLink' | 'profilePicture' | 'memberSettings'> & { punishmentPrice?: number }): Promise<{ group: Group; code: string; inviteLink: string }> => {
    if (!currentUser) throw new Error('User not logged in');

    const existingCodes = groups.map(g => g.code).filter(Boolean);
    const code = generateGroupCode(existingCodes);
    const inviteLink = createGroupInviteLink(code);
    const now = new Date();

    // ========== DEBUGGING FEATURE - EASY TO DELETE ==========
    // If group name is "debugging group", add 5 bot users
    let memberIds = [currentUser.id];
    let memberSettings: { [userId: string]: { postToGroup: boolean; hideNotifications: boolean } } = {
      [currentUser.id]: {
        postToGroup: true,
        hideNotifications: false,
      },
    };
    let memberJoinDates: { [userId: string]: Date } = {
      [currentUser.id]: now, // Creator joins at group creation
    };

    if (groupData.name.toLowerCase() === 'debugging group') {
      // Create 5 bot users
      for (let i = 1; i <= 5; i++) {
        const botId = `bot-user-${Date.now()}-${i}`;
        memberIds.push(botId);
        memberSettings[botId] = {
          postToGroup: true,
          hideNotifications: false,
        };
        memberJoinDates[botId] = now;
      }
    }
    // ========== END DEBUGGING FEATURE ==========

    const newGroup: Group = {
      ...groupData,
      id: Date.now().toString(),
      pot: 0,
      punishmentPrice: groupData.punishmentPrice ?? 0,
      memberIds,
      code,
      inviteLink,
      memberSettings,
      memberJoinDates,
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);

    return { group: newGroup, code, inviteLink };
  };

  const joinGroupByCode = async (code: string): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'User not logged in' };
    }

    const group = groups.find(g => g.code === code);
    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    if (group.memberIds.includes(currentUser.id)) {
      return { success: false, error: 'Already a member' };
    }

    // Check if user can join (Starter mode: only 1 group)
    if (!currentUser.bankAccountLinked) {
      const userGroups = groups.filter(g => g.memberIds.includes(currentUser.id));
      if (userGroups.length >= 1) {
        return { success: false, error: 'Starter mode: You can only join 1 group. Link a bank account to join more.' };
      }
    }

    const now = new Date();
    const updatedGroups = groups.map(g =>
      g.id === group.id
        ? {
            ...g,
            memberIds: [...g.memberIds, currentUser.id],
            memberSettings: {
              ...g.memberSettings,
              [currentUser.id]: {
                postToGroup: true,
                hideNotifications: false,
              },
            },
            memberJoinDates: {
              ...g.memberJoinDates,
              [currentUser.id]: now, // Record join date
            },
          }
        : g
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);

    // Add join notification to group activity feed
    const joinActivity: ActivityFeedItem = {
      id: `${Date.now()}-${group.id}-join`,
      type: 'message',
      userId: `group-${group.id}`,
      userName: group.name,
      userAvatar: group.profilePicture,
      message: `${currentUser.name} joined the group`,
      timestamp: now,
      metadata: {
        groupId: group.id,
        textMessage: `${currentUser.name} joined the group`,
        isSystemMessage: true, // Mark as system message for centered display
      },
    };
    const updatedFeed = [joinActivity, ...activityFeed];
    setActivityFeed(updatedFeed);
    await saveActivityFeed(updatedFeed);

    return { success: true, groupId: group.id };
  };

  const joinGroup = async (groupId: string) => {
    if (!currentUser) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const now = new Date();
    const updatedGroups = groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            memberIds: [...g.memberIds, currentUser.id],
            memberSettings: {
              ...g.memberSettings,
              [currentUser.id]: {
                postToGroup: true,
                hideNotifications: false,
              },
            },
            memberJoinDates: {
              ...g.memberJoinDates,
              [currentUser.id]: now, // Record join date
            },
          }
        : g
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);

    // Add join notification to group activity feed
    const joinActivity: ActivityFeedItem = {
      id: `${Date.now()}-${groupId}-join`,
      type: 'message',
      userId: `group-${groupId}`,
      userName: group.name,
      userAvatar: group.profilePicture,
      message: `${currentUser.name} joined the group`,
      timestamp: now,
      metadata: {
        groupId,
        textMessage: `${currentUser.name} joined the group`,
        isSystemMessage: true, // Mark as system message for centered display
      },
    };
    const updatedFeed = [joinActivity, ...activityFeed];
    setActivityFeed(updatedFeed);
    await saveActivityFeed(updatedFeed);
  };

  const leaveGroup = async (groupId: string) => {
    if (!currentUser) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Check if user owes money
    const userPenalties = group.memberPenalties?.[currentUser.id];
    const amountOwed = userPenalties?.amountOwed || 0;

    if (amountOwed > 0) {
      // User must settle up before leaving
      throw new Error(`You must settle up $${amountOwed.toFixed(2)} before leaving this group.`);
    }

    // Remove user from the group's memberIds, then filter out groups where user is not a member
    const updatedGroups = groups
      .map(g =>
        g.id === groupId
          ? (() => {
              const remainingMemberIds = g.memberIds.filter(id => id !== currentUser.id);

              // If the current user was the creator, transfer leadership to the first remaining member (if any)
              const newCreatedBy =
                g.createdBy === currentUser.id && remainingMemberIds.length > 0
                  ? remainingMemberIds[0]
                  : g.createdBy;

              return {
                ...g,
                createdBy: newCreatedBy,
                memberIds: remainingMemberIds,
                memberSettings: (() => {
                  const settings = { ...g.memberSettings };
                  delete settings[currentUser.id];
                  return settings;
                })(),
                memberJoinDates: (() => {
                  const dates = { ...g.memberJoinDates };
                  delete dates[currentUser.id];
                  return dates;
                })(),
                memberPenalties: (() => {
                  const penalties = { ...g.memberPenalties };
                  delete penalties[currentUser.id];
                  return penalties;
                })(),
              };
            })()
          : g
      )
      .filter(g => g.memberIds.includes(currentUser.id)); // Only keep groups where user is still a member
    
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const getGroupMembers = (groupId: string): GroupMember[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    return group.memberIds.map(userId => {
      const memberJoinDate = group.memberJoinDates?.[userId];
      // Only count applications from after the member joined
      const userApps = memberJoinDate
        ? applications.filter(app => 
            app.userId === userId && new Date(app.dateApplied) >= new Date(memberJoinDate)
          )
        : applications.filter(app => app.userId === userId);
      
      const today = new Date().toDateString();
      const appsToday = userApps.filter(app => 
        new Date(app.dateApplied).toDateString() === today
      ).length;

      return {
        userId,
        streak: currentUser?.id === userId ? currentUser.streak : 0,
        missedDays: 0,
        amountOwed: 0,
        applicationsToday: appsToday,
        totalApplications: userApps.length,
        verifiedOffers: userApps.filter(app => app.status === 'Offer').length,
      };
    });
  };

  const checkQuota = (groupId: string, userId: string): { met: boolean; applicationsToday: number; quota: number } => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return { met: false, applicationsToday: 0, quota: 0 };

    const memberJoinDate = group.memberJoinDates?.[userId];
    const today = new Date().toDateString();
    
    // Only count applications from after the member joined
    const appsToday = memberJoinDate
      ? applications.filter(app =>
          app.userId === userId &&
          new Date(app.dateApplied).toDateString() === today &&
          new Date(app.dateApplied) >= new Date(memberJoinDate)
        ).length
      : applications.filter(app =>
          app.userId === userId && new Date(app.dateApplied).toDateString() === today
        ).length;

    return {
      met: appsToday >= group.dailyQuota,
      applicationsToday: appsToday,
      quota: group.dailyQuota,
    };
  };

  const updateUserAvatar = async (avatarUri: string) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      avatar: avatarUri,
    };

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const linkBankAccount = async () => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      bankAccountLinked: true,
      mode: 'Full' as const,
    };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const toggleTheme = async () => {
    const newTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newTheme);
    await AsyncStorage.setItem('themeMode', newTheme);
  };

  const toggleCongratulations = async () => {
    const newValue = !showCongratulationsEnabled;
    setShowCongratulationsEnabled(newValue);
    await AsyncStorage.setItem('showCongratulationsEnabled', String(newValue));
  };

  const updateGroupProfilePicture = async (groupId: string, pictureUri: string) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, profilePicture: pictureUri } : group
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const updateGroupName = async (groupId: string, name: string) => {
    if (!name.trim()) {
      throw new Error('Group name cannot be empty');
    }
    if (name.length > 50) {
      throw new Error('Group name must be 50 characters or less');
    }
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, name: name.trim() } : group
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const updateGroupPunishmentPrice = async (groupId: string, punishmentPrice: number) => {
    if (punishmentPrice < 0) {
      throw new Error('Punishment price must be 0 or greater');
    }

    const updatedGroups = groups.map((group) =>
      group.id === groupId ? { ...group, punishmentPrice } : group
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const updateGroupQuota = async (groupId: string, dailyQuota: number) => {
    if (dailyQuota < 1 || dailyQuota > 100) {
      throw new Error('Daily quota must be between 1 and 100');
    }
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, dailyQuota } : group
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const getGroupCode = (groupId: string): string | null => {
    const group = groups.find(g => g.id === groupId);
    return group?.code || null;
  };

  const kickMember = async (groupId: string, userId: string) => {
    if (!currentUser) return;

    const group = groups.find(g => g.id === groupId);
    if (!group || group.createdBy !== currentUser.id) {
      throw new Error('Only group creator can kick members');
    }

    // Remove member from group
    const updatedGroups = groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            memberIds: g.memberIds.filter(id => id !== userId),
            memberSettings: (() => {
              const settings = { ...g.memberSettings };
              delete settings[userId];
              return settings;
            })(),
          }
        : g
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);

    // Remove their activity feed items from this group
    const updatedFeed = activityFeed.filter(item => {
      if (item.metadata?.groupId === groupId && item.userId === userId) {
        return false;
      }
      return true;
    });
    setActivityFeed(updatedFeed);
    await saveActivityFeed(updatedFeed);
  };

  const togglePostToGroup = async (groupId: string, enabled: boolean) => {
    if (!currentUser) return;

    const updatedGroups = groups.map(group =>
      group.id === groupId
        ? {
            ...group,
            memberSettings: {
              ...group.memberSettings,
              [currentUser.id]: {
                ...group.memberSettings?.[currentUser.id],
                postToGroup: enabled,
                hideNotifications: group.memberSettings?.[currentUser.id]?.hideNotifications || false,
              },
            },
          }
        : group
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const toggleHideNotifications = async (groupId: string, enabled: boolean) => {
    if (!currentUser) return;

    const updatedGroups = groups.map(group =>
      group.id === groupId
        ? {
            ...group,
            memberSettings: {
              ...group.memberSettings,
              [currentUser.id]: {
                ...group.memberSettings?.[currentUser.id],
                postToGroup: group.memberSettings?.[currentUser.id]?.postToGroup !== false,
                hideNotifications: enabled,
              },
            },
          }
        : group
    );
    setGroups(updatedGroups);
    await saveGroups(updatedGroups);
  };

  const sendGroupMessage = async (groupId: string, message: string) => {
    if (!currentUser || !message.trim()) return;

    const group = groups.find(g => g.id === groupId);
    if (!group || !group.memberIds.includes(currentUser.id)) return;

    // ========== DEBUGGING FEATURE - EASY TO DELETE ==========
    // If message is "{clear chat}", clear all messages from this group and reset penalties
    if (message.trim() === '{clear chat}') {
      // Clear all messages from this group
      const updatedFeed = activityFeed.filter(item => {
        // Keep items that are not messages from this group
        if (item.type !== 'message') return true;
        if (item.metadata?.groupId !== groupId) return true;
        // Remove all messages from this group
        return false;
      });
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);

      // Reset all member penalties (missed days and amount owed)
      const updatedGroups = groups.map(g => {
        if (g.id !== groupId) return g;
        
        // Reset all member penalties to zero
        const resetPenalties: { [userId: string]: { missedDays: number; amountOwed: number } } = {};
        for (const memberId of g.memberIds) {
          resetPenalties[memberId] = { missedDays: 0, amountOwed: 0 };
        }

        return {
          ...g,
          memberPenalties: resetPenalties,
          pot: 0, // Reset pot since all penalties are cleared
        };
      });

      setGroups(updatedGroups);
      await saveGroups(updatedGroups);
      return; // Don't send the actual message
    }

    // ========== DEBUGGING FEATURE - EASY TO DELETE ==========
    // If message is "{simulate miss}", simulate everyone missing today's quota
    if (message.trim() === '{simulate miss}') {
      const today = new Date();
      const todayDateString = today.toDateString();
      const punishmentPrice = group.punishmentPrice || 0;
      const updatedFeed = [...activityFeed];
      let hasUpdates = false;

      // Helper to get user info
      const getUserInfo = (userId: string): { name: string; avatar?: string } => {
        const userActivity = activityFeed.find(item => item.userId === userId);
        if (userActivity) {
          return {
            name: userActivity.userName,
            avatar: userActivity.userAvatar,
          };
        }
        return {
          name: userId === currentUser.id ? currentUser.name : `User ${userId.substring(0, 6)}`,
          avatar: undefined,
        };
      };

      // Simulate missed quota for each member
      let updatedMemberPenalties = { ...group.memberPenalties };
      
      for (const memberId of group.memberIds) {
        // Get member's join date - skip if they joined today
        const memberJoinDate = group.memberJoinDates?.[memberId];
        if (memberJoinDate) {
          const joinDate = new Date(memberJoinDate);
          joinDate.setHours(0, 0, 0, 0);
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          if (joinDate > todayStart) {
            continue; // Skip members who joined today
          }
        }

        const userInfo = getUserInfo(memberId);
        const appsToday = applications.filter(app =>
          app.userId === memberId && new Date(app.dateApplied).toDateString() === todayDateString
        ).length;

        // Update member penalties table
        const currentPenalties = updatedMemberPenalties[memberId] || { missedDays: 0, amountOwed: 0 };
        const newMissedDays = currentPenalties.missedDays + 1;
        const newAmountOwed = newMissedDays * punishmentPrice;

        updatedMemberPenalties[memberId] = {
          missedDays: newMissedDays,
          amountOwed: newAmountOwed,
        };

        const messageText = punishmentPrice > 0
          ? `${userInfo.name} missed yesterday's quota (${appsToday}/${group.dailyQuota}) and now owes $${newAmountOwed.toFixed(2)} 😔`
          : `${userInfo.name} missed yesterday's quota (${appsToday}/${group.dailyQuota}) 😔`;

        const quotaMissedActivity: ActivityFeedItem = {
          id: `${Date.now()}-${group.id}-${memberId}-simulated-quota-missed`,
          type: 'message',
          userId: `group-${group.id}`,
          userName: group.name,
          userAvatar: group.profilePicture,
          message: messageText,
          timestamp: new Date(),
          metadata: {
            groupId: group.id,
            textMessage: messageText,
          },
        };
        updatedFeed.push(quotaMissedActivity);
        hasUpdates = true;
      }

      // Update group with new penalties and recalculate pot once after processing all members
      // Calculate pot as sum of all member penalties
      const totalPot = Object.values(updatedMemberPenalties).reduce(
        (sum, penalty) => sum + penalty.amountOwed,
        0
      );
      
      const updatedGroups = groups.map(g =>
        g.id === group.id
          ? {
              ...g,
              memberPenalties: updatedMemberPenalties,
              pot: totalPot,
            }
          : g
      );
      setGroups(updatedGroups);
      await saveGroups(updatedGroups);

      if (hasUpdates) {
        setActivityFeed(updatedFeed);
        await saveActivityFeed(updatedFeed);
      }
      return; // Don't send the actual message
    }

    // If message starts with "/", send it as if from another user
    // Example: "/hello" will appear as "hello" from another user
    let actualMessage = message.trim();
    let sendAsOtherUser = false;
    let otherUserId: string | undefined;
    let otherUserName: string | undefined;
    let otherUserAvatar: string | undefined;

    if (actualMessage.startsWith('/')) {
      actualMessage = actualMessage.substring(1).trim();
      sendAsOtherUser = true;
      
      // Find another member in the group (not current user)
      const otherMemberId = group.memberIds.find(id => id !== currentUser.id);
      if (otherMemberId) {
        // Try to get user info from activity feed
        const otherUserActivity = activityFeed.find(item => item.userId === otherMemberId);
        if (otherUserActivity) {
          otherUserId = otherMemberId;
          otherUserName = otherUserActivity.userName;
          otherUserAvatar = otherUserActivity.userAvatar;
        } else {
          // Fallback: use a generic name
          otherUserId = otherMemberId;
          otherUserName = `User ${otherMemberId.substring(0, 6)}`;
          otherUserAvatar = undefined;
        }
      } else {
        // No other members, use a fake user ID
        otherUserId = 'debug-user';
        otherUserName = 'Debug User';
        otherUserAvatar = undefined;
      }
    }
    // ========== END DEBUGGING FEATURE ==========

    const activityItem: ActivityFeedItem = {
      id: `${Date.now()}-${groupId}-msg`,
      type: 'message',
      userId: sendAsOtherUser ? (otherUserId || 'debug-user') : currentUser.id,
      userName: sendAsOtherUser ? (otherUserName || 'Debug User') : currentUser.name,
      userAvatar: sendAsOtherUser ? otherUserAvatar : currentUser.avatar,
      message: actualMessage,
      timestamp: new Date(),
      metadata: {
        groupId,
        textMessage: actualMessage,
      },
    };

    const updatedFeed = [activityItem, ...activityFeed];
    setActivityFeed(updatedFeed);
    await saveActivityFeed(updatedFeed);
  };

  const getGroupActivity = (groupId: string): ActivityFeedItem[] => {
    return activityFeed
      .filter(item => item.metadata?.groupId === groupId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Oldest first, newest at bottom
  };

  const toggleLikeActivity = async (activityId: string) => {
    if (!currentUser) return;

    const updatedFeed = activityFeed.map(item => {
      if (item.id === activityId) {
        const likedBy = item.likedBy || [];
        const isLiked = likedBy.includes(currentUser.id);
        
        return {
          ...item,
          likedBy: isLiked
            ? likedBy.filter(id => id !== currentUser.id)
            : [...likedBy, currentUser.id],
        };
      }
      return item;
    });

    setActivityFeed(updatedFeed);
    await saveActivityFeed(updatedFeed);
  };

  const checkEndOfDayQuotas = async () => {
    if (!currentUser || groups.length === 0 || applications.length === 0) return;

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateString = yesterday.toDateString();

    // Get the last time we checked end-of-day quotas
    const lastCheckKey = 'lastEndOfDayQuotaCheck';
    const lastCheckDate = await AsyncStorage.getItem(lastCheckKey);
    const lastCheckDateString = lastCheckDate ? new Date(lastCheckDate).toDateString() : null;

    // Only check if we haven't checked for yesterday yet
    if (lastCheckDateString === yesterdayDateString) {
      return; // Already checked for yesterday
    }

    const updatedFeed = [...activityFeed];
    let hasUpdates = false;

    // Helper to get user info from activity feed or applications
    const getUserInfo = (userId: string): { name: string; avatar?: string } => {
      // Try to find user info from activity feed
      const userActivity = activityFeed.find(item => item.userId === userId);
      if (userActivity) {
        return {
          name: userActivity.userName,
          avatar: userActivity.userAvatar,
        };
      }

      // Try to find user info from applications
      const userApp = applications.find(app => app.userId === userId);
      if (userApp) {
        // We don't have user name in applications, so use a fallback
        return {
          name: userId === currentUser.id ? currentUser.name : `User ${userId.substring(0, 6)}`,
          avatar: undefined,
        };
      }

      // Fallback
      return {
        name: userId === currentUser.id ? currentUser.name : `User ${userId.substring(0, 6)}`,
        avatar: undefined,
      };
    };

    // Check each group
    let updatedGroups = [...groups];
    
    for (const group of groups) {
      let groupUpdated = false;
      const updatedMemberPenalties = { ...group.memberPenalties };
      
      // Check each member in the group
      for (const memberId of group.memberIds) {
        // Get member's join date - if they joined after yesterday, skip quota check
        const memberJoinDate = group.memberJoinDates?.[memberId];
        if (memberJoinDate) {
          const joinDate = new Date(memberJoinDate);
          joinDate.setHours(0, 0, 0, 0);
          // If member joined today or later, skip checking yesterday's quota
          if (joinDate > yesterday) {
            continue; // Skip this member - they weren't in the group yesterday
          }
        }

        // Check if member hit quota yesterday
        const appsYesterday = applications.filter(app =>
          app.userId === memberId && new Date(app.dateApplied).toDateString() === yesterdayDateString
        ).length;

        const quotaMet = appsYesterday >= group.dailyQuota;

        if (!quotaMet) {
          const userInfo = getUserInfo(memberId);
          const punishmentPrice = group.punishmentPrice || 0;
          
          // Update member penalties table
          const currentPenalties = updatedMemberPenalties[memberId] || { missedDays: 0, amountOwed: 0 };
          const newMissedDays = currentPenalties.missedDays + 1;
          const newAmountOwed = newMissedDays * punishmentPrice;
          
          updatedMemberPenalties[memberId] = {
            missedDays: newMissedDays,
            amountOwed: newAmountOwed,
          };
          
          // Check if we already sent a notification for this member for yesterday
          // Look for message type from the group about this member missing quota
          const alreadyNotified = updatedFeed.some((item: ActivityFeedItem) =>
            item.type === 'message' &&
            item.userId === `group-${group.id}` &&
            item.metadata?.groupId === group.id &&
            item.message.includes(userInfo.name) &&
            item.message.includes('missed yesterday\'s quota') &&
            new Date(item.timestamp).toDateString() === yesterdayDateString
          );

          if (!alreadyNotified) {
            // Send as if from the group itself (using group ID as userId so it's never the current user)
            // This makes it display on the left side with grey styling and group profile picture
            const messageText = punishmentPrice > 0
              ? `${userInfo.name} missed yesterday's quota (${appsYesterday}/${group.dailyQuota}) and now owes $${newAmountOwed.toFixed(2)} 😔`
              : `${userInfo.name} missed yesterday's quota (${appsYesterday}/${group.dailyQuota}) 😔`;
            
            const quotaMissedActivity: ActivityFeedItem = {
              id: `${Date.now()}-${group.id}-${memberId}-quota-missed`,
              type: 'message', // Send as regular message
              userId: `group-${group.id}`, // Use group ID prefix so it's never the current user
              userName: group.name, // Use group name as sender
              userAvatar: group.profilePicture, // Use group profile picture
              message: messageText,
              timestamp: new Date(), // Current time when check runs
              metadata: {
                groupId: group.id,
                textMessage: messageText,
              },
            };
            updatedFeed.push(quotaMissedActivity);
            hasUpdates = true;
          }
          
          groupUpdated = true;
        }
      }
      
      // Update group with new penalties and recalculate pot
      if (groupUpdated) {
        // Calculate pot as sum of all member penalties
        const totalPot = Object.values(updatedMemberPenalties).reduce(
          (sum, penalty) => sum + penalty.amountOwed,
          0
        );
        
        updatedGroups = updatedGroups.map(g =>
          g.id === group.id
            ? {
                ...g,
                memberPenalties: updatedMemberPenalties,
                pot: totalPot,
              }
            : g
        );
      }
    }
    
    // Save updated groups if any were modified
    if (updatedGroups !== groups) {
      setGroups(updatedGroups);
      await saveGroups(updatedGroups);
    }

    if (hasUpdates) {
      setActivityFeed(updatedFeed);
      await saveActivityFeed(updatedFeed);
    }

    // Save that we checked for yesterday
    await AsyncStorage.setItem(lastCheckKey, yesterday.toISOString());
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        applications,
        groups,
        activityFeed,
        themeMode,
        showCongratulationsEnabled,
        toggleTheme,
        toggleCongratulations,
        addApplication,
        updateApplicationStatus,
        updateApplication,
        deleteApplication,
        createGroup,
        createGroupWithCode,
        joinGroup,
        joinGroupByCode,
        leaveGroup,
        getGroupMembers,
        checkQuota,
        linkBankAccount,
        updateGroupProfilePicture,
        updateGroupName,
        updateUserAvatar,
        updateGroupQuota,
        updateGroupPunishmentPrice,
        getGroupCode,
        kickMember,
        togglePostToGroup,
        toggleHideNotifications,
        sendGroupMessage,
        getGroupActivity,
        toggleLikeActivity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

