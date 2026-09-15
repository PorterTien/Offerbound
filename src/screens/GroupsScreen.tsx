import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import { Group } from '../types';
import AvatarWithInitials from '../components/AvatarWithInitials';

export default function GroupsScreen() {
  const navigation = useNavigation();
  const { groups, currentUser, activityFeed, themeMode, applications, checkQuota, getGroupActivity } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupsTable, setShowGroupsTable] = useState(false);
  const currentTheme = theme[themeMode];

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!currentUser || groups.length === 0) {
      return {
        highestQuota: 0,
        amountOwed: 0,
        daysUntilNextEnd: null,
      };
    }

    // Highest quota across all groups
    const highestQuota = Math.max(...groups.map(g => g.dailyQuota), 0);

    // Calculate amount owed: (amount owed to you by group members) - (amount you owe to groups)
    // Penalties are split among all other members (not the person who owes)
    let amountOwedToYou = 0; // Money owed to you from penalties split among members
    let amountYouOwe = 0; // Amount you owe for missing quotas

    for (const group of groups) {
      if (!group.memberIds.includes(currentUser.id)) continue;

      const totalMembers = group.memberIds.length;
      const otherMembersCount = totalMembers - 1; // Excluding the person who owes

      // Use memberPenalties table to calculate amounts owed
      const userPenalties = group.memberPenalties?.[currentUser.id];
      if (userPenalties) {
        amountYouOwe += userPenalties.amountOwed;
      }

      // Calculate money owed to you: sum of (each other member's penalty / other members count)
      // Each penalty is split equally among all other members
      for (const memberId of group.memberIds) {
        if (memberId === currentUser.id) continue; // Skip yourself
        
        const memberPenalties = group.memberPenalties?.[memberId];
        if (memberPenalties && memberPenalties.amountOwed > 0 && otherMembersCount > 0) {
          // Split this member's penalty among all other members (including you)
          amountOwedToYou += memberPenalties.amountOwed / otherMembersCount;
        }
      }
    }

    const netAmountOwed = amountOwedToYou - amountYouOwe;

    // Days until next group ends
    const now = new Date();
    const activeGroups = groups.filter(g => 
      g.memberIds.includes(currentUser.id) && new Date(g.endDate) > now
    );
    const nextEndDate = activeGroups.length > 0
      ? activeGroups.reduce((earliest, group) => {
          const endDate = new Date(group.endDate);
          return endDate < earliest ? endDate : earliest;
        }, new Date(activeGroups[0].endDate))
      : null;

    const daysUntilNextEnd = nextEndDate
      ? Math.ceil((nextEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      highestQuota,
      amountOwed: netAmountOwed,
      daysUntilNextEnd,
    };
  };

  const summary = calculateSummary();

  const getLastActivity = (groupId: string) => {
    // Get all activities for this specific group
    const groupActivity = getGroupActivity(groupId);
    
    // Return the most recent activity (last item since getGroupActivity sorts oldest first)
    return groupActivity.length > 0 ? groupActivity[groupActivity.length - 1] : null;
  };

  const filteredGroups = groups.filter(group => {
    // Only show groups the user is a member of
    if (!currentUser || !group.memberIds.includes(currentUser.id)) {
      return false;
    }
    // Filter by search query
    return group.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate group details for table
  const getGroupDetails = () => {
    if (!currentUser) return [];

    return groups
      .filter(group => group.memberIds.includes(currentUser.id))
      .map(group => {
        const quota = group.dailyQuota;

        // Calculate gain/loss for THIS group, matching the members table logic:
        // Gain/Loss = (amount owed to you from other members' penalties)
        //             - (amount you personally owe for missed quotas)
        const totalMembers = group.memberIds.length;
        const otherMembersCount = totalMembers - 1; // Excluding you

        // Amount you personally owe in this group
        const userPenalties = group.memberPenalties?.[currentUser.id];
        const amountYouOwe = userPenalties?.amountOwed || 0;

        // Amount owed to you from other members in this group
        let amountOwedToYou = 0;
        for (const memberId of group.memberIds) {
          if (memberId === currentUser.id) continue; // Skip yourself

          const memberPenalties = group.memberPenalties?.[memberId];
          if (memberPenalties && memberPenalties.amountOwed > 0 && otherMembersCount > 0) {
            // Split this member's penalty among all other members (including you)
            amountOwedToYou += memberPenalties.amountOwed / otherMembersCount;
          }
        }

        const gainLoss = amountOwedToYou - amountYouOwe;

        // Calculate days until group ends
        const now = new Date();
        const endDate = new Date(group.endDate);
        const daysUntilEnd = endDate > now
          ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          group,
          quota,
           gainLoss,
          daysUntilEnd,
        };
      })
      .sort((a, b) => {
        // Sort by days until end (ascending)
        if (a.daysUntilEnd !== b.daysUntilEnd) {
          return a.daysUntilEnd - b.daysUntilEnd;
        }
        // Then by group name
        return a.group.name.localeCompare(b.group.name);
      });
  };

  const renderGroupItem = (group: Group) => {
    const lastActivity = getLastActivity(group.id);
    const isMember = group.memberIds.includes(currentUser?.id || '');

    return (
      <TouchableOpacity
        key={group.id}
        style={[styles.groupCard, { backgroundColor: currentTheme.card }]}
        onPress={() => {
          const stackNavigator = navigation.getParent();
          if (stackNavigator) {
            stackNavigator.navigate('GroupDetail', { groupId: group.id });
          }
        }}
      >
        <View style={styles.groupHeader}>
          <View style={{ marginRight: 12 }}>
            <AvatarWithInitials
              uri={group.profilePicture}
              name={group.name}
              size={60}
              backgroundColor={colors.electricLime + '20'}
              textColor={colors.electricLime}
            />
          </View>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: currentTheme.text }]}>{group.name}</Text>
            <Text style={[styles.groupMeta, { color: currentTheme.textSecondary }]}>
              ${group.pot} pot • {group.dailyQuota} quota • {group.memberIds.length} members
            </Text>
            {lastActivity && (
              <Text style={[styles.groupActivity, { color: currentTheme.textSecondary }]}>
                {lastActivity.message} • {formatDistanceToNow(lastActivity.timestamp, { addSuffix: true })}
              </Text>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={currentTheme.textSecondary}
          />
        </View>
        {!isMember && (
          <View style={styles.joinBadge}>
            <Text style={[styles.joinText, { color: colors.electricLime }]}>Join</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Groups</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            const rootNavigator = navigation.getParent();
            if (rootNavigator) {
              rootNavigator.navigate('CreateJoinGroup');
            } else {
              navigation.navigate('CreateJoinGroup' as never);
            }
          }}
        >
          <Ionicons name="add-circle" size={32} color={colors.electricLime} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: currentTheme.card }]}>
        <Ionicons name="search" size={20} color={currentTheme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: currentTheme.text }]}
          placeholder="Search groups or friends..."
          placeholderTextColor={currentTheme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.groupsList}
        contentContainerStyle={styles.groupsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        {groups.length > 0 && currentUser && (
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: currentTheme.card }]}
            onPress={() => setShowGroupsTable(true)}
            activeOpacity={0.7}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="trophy-outline" size={24} color={colors.electricLime} />
                <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>
                  Highest Quota
                </Text>
                <Text style={[styles.summaryValue, { color: currentTheme.text }]}>
                  {summary.highestQuota}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="cash-outline" size={24} color={colors.electricLime} />
                <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>
                  Amount Owed
                </Text>
                <Text style={[styles.summaryValue, { color: summary.amountOwed >= 0 ? colors.electricLime : colors.coral }]}>
                  ${summary.amountOwed >= 0 ? '+' : ''}{summary.amountOwed.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar-outline" size={24} color={colors.electricLime} />
                <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>
                  Next Group End
                </Text>
                <Text style={[styles.summaryValue, { color: currentTheme.text }]}>
                  {summary.daysUntilNextEnd !== null ? `${summary.daysUntilNextEnd} day${summary.daysUntilNextEnd !== 1 ? 's' : ''}` : 'N/A'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
              {searchQuery ? 'No groups found' : 'No groups yet. Create or join one!'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.electricLime }]}
              >
                <Text style={[styles.createButtonText, { color: colors.charcoal }]}>
                  Create Group
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredGroups.map(renderGroupItem)
        )}
      </ScrollView>

      {/* Groups Table Modal */}
      <Modal
        visible={showGroupsTable}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupsTable(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGroupsTable(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, { backgroundColor: currentTheme.card }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>All Groups</Text>
              <TouchableOpacity
                onPress={() => setShowGroupsTable(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.tableContainer}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: currentTheme.textSecondary + '40' }]}>
                <Text style={[styles.tableHeaderText, styles.tableCellGroup, { color: currentTheme.textSecondary }]}>Group</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellQuota, { color: currentTheme.textSecondary }]}>Quota</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellAmount, { color: currentTheme.textSecondary }]}>Gain/Loss</Text>
                <Text style={[styles.tableHeaderText, styles.tableCellDays, { color: currentTheme.textSecondary }]}>Days</Text>
              </View>

              {/* Table Rows */}
              {getGroupDetails().map((detail, index) => (
                <View
                  key={detail.group.id}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: currentTheme.textSecondary + '20' },
                    index === getGroupDetails().length - 1 && styles.tableRowLast
                  ]}
                >
                  <Text style={[styles.tableCellText, styles.tableCellGroup, { color: currentTheme.text }]} numberOfLines={1}>
                    {detail.group.name}
                  </Text>
                  <Text style={[styles.tableCellText, styles.tableCellQuota, { color: currentTheme.text }]}>
                    {detail.quota}
                  </Text>
                  <Text
                    style={[
                      styles.tableCellText,
                      styles.tableCellAmount,
                      { color: detail.gainLoss >= 0 ? colors.electricLime : colors.coral }
                    ]}
                  >
                    ${detail.gainLoss >= 0 ? '+' : ''}{detail.gainLoss.toFixed(2)}
                  </Text>
                  <Text style={[styles.tableCellText, styles.tableCellDays, { color: currentTheme.text }]}>
                    {detail.daysUntilEnd > 0 ? detail.daysUntilEnd : 'Ended'}
                  </Text>
                </View>
              ))}

              {getGroupDetails().length === 0 && (
                <View style={styles.emptyTableState}>
                  <Text style={[styles.emptyTableText, { color: currentTheme.textSecondary }]}>
                    No groups found
                  </Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  groupsList: {
    flex: 1,
  },
  groupsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  groupActivity: {
    fontSize: 12,
    marginTop: 4,
  },
  joinBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.electricLime,
  },
  joinText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  tableContainer: {
    paddingHorizontal: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeader: {
    paddingBottom: 8,
    borderBottomWidth: 2,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 14,
  },
  tableCellGroup: {
    flex: 1,
    textAlign: 'left',
  },
  tableCellQuota: {
    flex: 0.5,
    textAlign: 'right',
  },
  tableCellAmount: {
    flex: 0.8,
    textAlign: 'right',
    fontWeight: '600',
  },
  tableCellDays: {
    flex: 0.6,
    textAlign: 'right',
  },
  emptyTableState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 14,
  },
});

