import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import { Application, ApplicationStatus } from '../types';

export default function ApplicationsScreen() {
  const navigation = useNavigation();
  const { applications, currentUser, updateApplicationStatus, themeMode } = useApp();
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status' | 'semester'>('date');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'All'>('All');
  const currentTheme = theme[themeMode];

  const userApplications = applications.filter(
    app => app.userId === currentUser?.id
  );

  const sortedApplications = [...userApplications].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.dateApplied.getTime() - a.dateApplied.getTime();
      case 'company':
        return a.company.localeCompare(b.company);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'semester':
        // Sort by semester: Fall, Spring, Summer, then undefined/null
        const semesterOrder = ['Fall', 'Spring', 'Summer'];
        const aSemester = a.semester || '';
        const bSemester = b.semester || '';
        const aIndex = aSemester ? semesterOrder.indexOf(aSemester) : semesterOrder.length;
        const bIndex = bSemester ? semesterOrder.indexOf(bSemester) : semesterOrder.length;
        if (aIndex === bIndex) {
          return aSemester.localeCompare(bSemester);
        }
        return aIndex - bIndex;
      default:
        return 0;
    }
  });

  const filteredApplications = filterStatus === 'All'
    ? sortedApplications
    : sortedApplications.filter(app => app.status === filterStatus);

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'Offer':
        return '#58cc02'; // Green color for offers
      case 'Interview scheduled':
      case 'Interviewed':
        return colors.info;
      case 'Rejected':
        return colors.coral;
      default:
        return currentTheme.textSecondary;
    }
  };

  const statusOptions: (ApplicationStatus | 'All')[] = ['All', 'Applied', 'Interview scheduled', 'Interviewed', 'Rejected', 'Offer'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Filters */}
      <View style={[styles.filters, { backgroundColor: currentTheme.background }]}>
        <View style={styles.filtersContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilter}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filterStatus === status ? colors.electricLime : currentTheme.card,
                    borderColor: currentTheme.border,
                  },
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        filterStatus === status ? colors.charcoal : currentTheme.text,
                      fontWeight: filterStatus === status ? '600' : '400',
                    },
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sortContainer}>
            <Text style={[styles.sortLabel, { color: currentTheme.textSecondary }]}>Sort:</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                const options: ('date' | 'company' | 'status' | 'semester')[] = ['date', 'company', 'status', 'semester'];
                const currentIndex = options.indexOf(sortBy);
                setSortBy(options[(currentIndex + 1) % options.length]);
              }}
            >
              <Text style={[styles.sortText, { color: colors.electricLime }]}>
                {sortBy === 'date' ? 'Date' : sortBy === 'company' ? 'Company' : sortBy === 'status' ? 'Status' : 'Semester'}
              </Text>
              <Ionicons name="swap-vertical" size={16} color={colors.electricLime} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable Table Container */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredApplications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
              {filterStatus !== 'All'
                ? `No ${filterStatus.toLowerCase()} applications`
                : 'No applications yet. Start logging!'}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
                <View style={[styles.cell, styles.cellDate]}>
                  <Text style={[styles.headerText, { color: currentTheme.textSecondary }]}>Date</Text>
                </View>
                <View style={[styles.cell, styles.cellFixed]}>
                  <Text style={[styles.headerText, { color: currentTheme.textSecondary }]}>Company</Text>
                </View>
                <View style={[styles.cell, styles.cellPosition]}>
                  <Text style={[styles.headerText, { color: currentTheme.textSecondary }]}>Position</Text>
                </View>
                <View style={[styles.cell, styles.cellFixed]}>
                  <Text style={[styles.headerText, { color: currentTheme.textSecondary }]}>Status</Text>
                </View>
                <View style={[styles.cell, styles.cellFixed]}>
                  <Text style={[styles.headerText, { color: currentTheme.textSecondary }]}>Semester</Text>
                </View>
                <View style={[styles.cell, styles.cellComments]}>
                  <Text style={[styles.headerText, { color: currentTheme.textSecondary }]}>Comments</Text>
                </View>
              </View>

              {/* Applications Rows */}
              {filteredApplications.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.tableRow, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}
                  onPress={() => {
                    (navigation as any).navigate('EditApplication', {
                      application: app,
                    });
                  }}
                >
                  <View style={[styles.cell, styles.cellDate]}>
                    <Text style={[styles.cellText, { color: currentTheme.textSecondary }]}>
                      {format(app.dateApplied, 'MMM d')}
                    </Text>
                  </View>
                  <View style={[styles.cell, styles.cellFixed]}>
                    <Text style={[styles.cellText, { color: currentTheme.text }]} numberOfLines={1}>
                      {app.company}
                    </Text>
                  </View>
                  <View style={[styles.cell, styles.cellPosition]}>
                    <Text style={[styles.cellText, { color: currentTheme.text }]} numberOfLines={1}>
                      {app.position}
                    </Text>
                  </View>
                  <View style={[styles.cell, styles.cellFixed]}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(app.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(app.status) }]}
                        numberOfLines={1}
                      >
                        {app.status}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.cell, styles.cellFixed]}>
                    <Text style={[styles.cellText, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                      {app.semester || '-'}
                    </Text>
                  </View>
                  <View style={[styles.cell, styles.cellComments]}>
                    <Text style={[styles.cellText, { color: currentTheme.textSecondary }]} numberOfLines={2}>
                      {app.comments || '-'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      {/* Summary */}
      {filteredApplications.length > 0 && (
        <View
          style={[
            styles.summary,
            {
              backgroundColor: currentTheme.card,
              borderColor: currentTheme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.summaryText, { color: currentTheme.text }]}>
            {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Ionicons name="checkmark-circle" size={16} color={colors.electricLime} />
              <Text style={[styles.summaryStatText, { color: currentTheme.textSecondary }]}>
                {filteredApplications.filter(a => a.status === 'Offer').length} offers
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Ionicons name="calendar" size={16} color={colors.info} />
              <Text style={[styles.summaryStatText, { color: currentTheme.textSecondary }]}>
                {filteredApplications.filter(a => a.status === 'Interview scheduled').length} interviews
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    paddingTop: 16,
    paddingBottom: 12,
    width: '100%',
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  statusFilter: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 0,
    // Extra bottom padding so last rows aren't hidden behind the summary overlay
    paddingBottom: 100,
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cellFixed: {
    width: 120,
    minWidth: 120,
  },
  cellDate: {
    width: 80,
    minWidth: 80,
  },
  cellPosition: {
    width: 180,
    minWidth: 180,
  },
  cellComments: {
    width: 200,
    minWidth: 200,
  },
  cellText: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
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
  },
  summary: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryStatText: {
    fontSize: 12,
  },
});

