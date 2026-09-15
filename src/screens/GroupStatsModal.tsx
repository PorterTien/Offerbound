import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  PanResponder,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import AvatarWithInitials from '../components/AvatarWithInitials';
import { StatusBar } from 'expo-status-bar';

type SortColumn = 'name' | 'applications' | 'missedQuotas' | 'amountOwed' | 'gainLoss';
type SortDirection = 'asc' | 'desc';

export default function GroupStatsModal() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };
  const {
    groups,
    currentUser,
    themeMode,
    applications,
    getGroupMembers,
    activityFeed,
  } = useApp();
  const currentTheme = theme[themeMode];

  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const headerDragYRef = useRef(0);

  // PanResponder for header drag-to-close
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward drags
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        headerDragYRef.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        headerDragYRef.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 50px, close the modal
        if (gestureState.dy > 50) {
          navigation.goBack();
        }
        headerDragYRef.current = 0;
      },
    })
  ).current;

  const group = groups.find(g => g.id === groupId);
  if (!group) {
    return null;
  }

  const members = getGroupMembers(groupId);
  const groupStartDate = new Date(group.startDate);

  // Helper to get user name from userId
  const getUserName = (userId: string): string => {
    if (userId === currentUser?.id) {
      return currentUser.name;
    }
    // Try to find in activity feed
    const userActivity = activityFeed.find(item => item.userId === userId);
    if (userActivity) {
      return userActivity.userName;
    }
    return `User ${userId.substring(0, 6)}`;
  };

  // Helper to get user avatar from userId
  const getUserAvatar = (userId: string): string | undefined => {
    if (userId === currentUser?.id) {
      return currentUser.avatar;
    }
    // Try to find in activity feed
    const userActivity = activityFeed.find(item => item.userId === userId);
    return userActivity?.userAvatar;
  };

  // Calculate member stats
  const memberStats = useMemo(() => {
    return members.map(member => {
      const memberJoinDate = group.memberJoinDates?.[member.userId];
      const effectiveStartDate = memberJoinDate && new Date(memberJoinDate) > groupStartDate
        ? new Date(memberJoinDate)
        : groupStartDate;

      // Count applications since group start (or member join date, whichever is later)
      const appsSinceStart = applications.filter(app =>
        app.userId === member.userId &&
        new Date(app.dateApplied) >= effectiveStartDate
      ).length;

      // Get penalties from memberPenalties table
      const penalties = group.memberPenalties?.[member.userId] || {
        missedDays: 0,
        amountOwed: 0,
      };

      // Calculate gain/loss: amount owed to you from other members - amount you owe
      // Penalties are split among all other members (not the person who owes)
      const totalMembers = members.length;
      const otherMembersCount = totalMembers - 1; // Excluding the person who owes
      
      // Calculate money owed to this member: sum of (each other member's penalty / other members count)
      // Each penalty is split equally among all other members
      let amountOwedToYou = 0;
      for (const otherMemberId of members.map(m => m.userId)) {
        if (otherMemberId === member.userId) continue; // Skip yourself
        
        const otherMemberPenalties = group.memberPenalties?.[otherMemberId];
        if (otherMemberPenalties && otherMemberPenalties.amountOwed > 0 && otherMembersCount > 0) {
          // Split this member's penalty among all other members (including you)
          amountOwedToYou += otherMemberPenalties.amountOwed / otherMembersCount;
        }
      }
      
      // Gain/Loss = amount owed to you - amount you owe
      const gainLoss = amountOwedToYou - penalties.amountOwed;

      return {
        userId: member.userId,
        userName: getUserName(member.userId),
        userAvatar: getUserAvatar(member.userId),
        applications: appsSinceStart,
        missedQuotas: penalties.missedDays,
        amountOwed: penalties.amountOwed,
        gainLoss: gainLoss,
      };
    });
  }, [members, applications, group.memberPenalties, group.memberJoinDates, groupStartDate, group.pot, activityFeed, currentUser]);

  // Sort members
  const sortedStats = useMemo(() => {
    const sorted = [...memberStats];
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'name':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'applications':
          comparison = a.applications - b.applications;
          break;
        case 'missedQuotas':
          comparison = a.missedQuotas - b.missedQuotas;
          break;
        case 'amountOwed':
          comparison = a.amountOwed - b.amountOwed;
          break;
        case 'gainLoss':
          comparison = a.gainLoss - b.gainLoss;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [memberStats, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleEdit = () => {
    // Navigate to GroupSettings using CommonActions to ensure proper navigation
    // Get the root navigator (RootStack) which contains both GroupStats and GroupSettings
    const rootNavigator = navigation.getParent()?.getParent() || navigation.getParent();
    
    if (rootNavigator) {
      // Close current modal and navigate to GroupSettings
      navigation.goBack();
      setTimeout(() => {
        rootNavigator.dispatch(
          CommonActions.navigate({
            name: 'GroupSettings',
            params: { groupId },
          })
        );
      }, 300);
    } else {
      // Fallback: try direct navigation
      navigation.goBack();
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'GroupSettings',
            params: { groupId },
          })
        );
      }, 300);
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <Text style={[styles.sortIcon, { color: currentTheme.textSecondary }]}>-</Text>;
    }
    return (
      <Ionicons
        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={colors.electricLime}
      />
    );
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={() => navigation.goBack()}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={() => navigation.goBack()}
        />
        <View style={[styles.modalContent, { backgroundColor: currentTheme.background }]}>
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          
          {/* Header */}
          <View 
            style={[styles.header, { borderBottomColor: currentTheme.border }]}
            {...headerPanResponder.panHandlers}
          >
            <View style={styles.headerLeft}>
              <AvatarWithInitials
                uri={group.profilePicture}
                name={group.name}
                size={50}
                backgroundColor={colors.electricLime + '40'}
                textColor={colors.electricLime}
              />
              <View style={styles.headerInfo}>
                <Text style={[styles.groupName, { color: currentTheme.text }]} numberOfLines={1}>
                  {group.name}
                </Text>
                <Text style={[styles.groupMeta, { color: currentTheme.textSecondary }]}>
                  ${group.pot.toFixed(2)} pot • {group.dailyQuota} quota • {group.memberIds.length} members
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Text style={[styles.editButtonText, { color: colors.electricLime }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Table */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.tableContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
            onScroll={(event) => {
              const currentOffset = event.nativeEvent.contentOffset.y;
              // If user is at the top and scrolling down (negative offset means bouncing/pulling down)
              if (currentOffset < -30 && isDraggingRef.current) {
                navigation.goBack();
              }
              scrollOffsetRef.current = currentOffset;
            }}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onScrollEndDrag={() => {
              isDraggingRef.current = false;
            }}
            scrollEventThrottle={16}
          >
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={true}
              style={styles.horizontalScrollView}
            >
              <View>
                {/* Table Header */}
                <View style={[styles.tableHeader, { backgroundColor: currentTheme.card }]}>
                  <TouchableOpacity
                    style={[styles.headerCell, styles.nameCell]}
                    onPress={() => handleSort('name')}
                  >
                    <Text style={[styles.headerText, { color: currentTheme.text }]}>Name</Text>
                    {renderSortIcon('name')}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.headerCell, styles.numberCell]}
                    onPress={() => handleSort('applications')}
                  >
                    <Text style={[styles.headerText, { color: currentTheme.text }]}>Apps</Text>
                    {renderSortIcon('applications')}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.headerCell, styles.numberCell]}
                    onPress={() => handleSort('missedQuotas')}
                  >
                    <Text style={[styles.headerText, { color: currentTheme.text }]}>Missed</Text>
                    {renderSortIcon('missedQuotas')}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.headerCell, styles.numberCell]}
                    onPress={() => handleSort('amountOwed')}
                  >
                    <Text style={[styles.headerText, { color: currentTheme.text }]}>Owed</Text>
                    {renderSortIcon('amountOwed')}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.headerCell, styles.numberCell]}
                    onPress={() => handleSort('gainLoss')}
                  >
                    <Text style={[styles.headerText, { color: currentTheme.text }]}>Gain/Loss</Text>
                    {renderSortIcon('gainLoss')}
                  </TouchableOpacity>
                </View>

                {/* Table Rows */}
                {sortedStats.map((member) => {
                  const isCurrentUser = member.userId === currentUser?.id;
                  return (
                    <View
                      key={member.userId}
                      style={[
                        styles.tableRow,
                        { backgroundColor: currentTheme.card },
                        isCurrentUser && { backgroundColor: currentTheme.card + '80' },
                      ]}
                    >
                      <View style={[styles.cell, styles.nameCell]}>
                        <AvatarWithInitials
                          uri={member.userAvatar}
                          name={member.userName}
                          size={32}
                          backgroundColor={colors.electricLime + '40'}
                          textColor={colors.electricLime}
                        />
                        <Text
                          style={[
                            styles.cellText,
                            { color: currentTheme.text },
                            isCurrentUser && { fontWeight: '600' },
                          ]}
                          numberOfLines={1}
                        >
                          {isCurrentUser ? 'You' : member.userName}
                        </Text>
                      </View>
                      
                      <View style={[styles.cell, styles.numberCell]}>
                        <Text style={[styles.cellText, { color: currentTheme.text }]}>
                          {member.applications}
                        </Text>
                      </View>
                      
                      <View style={[styles.cell, styles.numberCell]}>
                        <Text style={[styles.cellText, { color: currentTheme.text }]}>
                          {member.missedQuotas}
                        </Text>
                      </View>
                      
                      <View style={[styles.cell, styles.numberCell]}>
                        <Text
                          style={[
                            styles.cellText,
                            { color: member.amountOwed > 0 ? colors.coral : currentTheme.text },
                          ]}
                        >
                          ${member.amountOwed.toFixed(2)}
                        </Text>
                      </View>
                      
                      <View style={[styles.cell, styles.numberCell]}>
                        <Text
                          style={[
                            styles.cellText,
                            { 
                              color: member.gainLoss > 0 
                                ? colors.electricLime 
                                : member.gainLoss < 0 
                                ? colors.coral 
                                : currentTheme.text 
                            },
                          ]}
                        >
                          {member.gainLoss >= 0 ? '+' : ''}${member.gainLoss.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  horizontalScrollView: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  sortIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 8,
  },
  nameCell: {
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberCell: {
    width: 80,
    alignItems: 'flex-end',
  },
  cellText: {
    fontSize: 14,
  },
});

