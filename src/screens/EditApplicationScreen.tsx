import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import { ApplicationStatus, Application, Semester } from '../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from '../utils/dateUtils';
import CongratulationsScreen from './CongratulationsScreen';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Applied',
  'Interview scheduled',
  'Interviewed',
  'Rejected',
  'Offer',
];

const SEMESTER_OPTIONS: Semester[] = ['Fall', 'Spring', 'Winter','Summer'];

type RouteParams = {
  EditApplication: {
    application: Application;
  };
};

export default function EditApplicationScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EditApplication'>>();
  const { updateApplication, deleteApplication, themeMode, showCongratulationsEnabled } = useApp();
  const currentTheme = theme[themeMode];
  const { application } = route.params;

  const [company, setCompany] = useState(application.company);
  const [position, setPosition] = useState(application.position);
  const [location, setLocation] = useState(application.location);
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [semester, setSemester] = useState<Semester | undefined>(application.semester);
  const [comments, setComments] = useState(application.comments || '');
  const [deletePressed, setDeletePressed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(application.dateApplied));
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date(application.dateApplied));
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(application.dateApplied));
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<ApplicationStatus>(application.status);

  const handleDelete = () => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setDeletePressed(false),
        },
        {
          text: 'Delete Application',
          style: 'destructive',
          onPress: async () => {
            await deleteApplication(application.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleDelete}
          onPressIn={() => setDeletePressed(true)}
          onPressOut={() => setDeletePressed(false)}
          style={{ marginRight: 16, padding: 8 }}
        >
          <Ionicons 
            name="trash-outline" 
            size={20} 
            color={deletePressed ? colors.coral : currentTheme.text} 
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, deletePressed, currentTheme.text, handleDelete]);

  const saveChanges = useCallback(() => {
    if (!company.trim() || !position.trim()) {
      Alert.alert('Missing Information', 'Please fill in company and position.');
      return false;
    }

    const isNewOffer = status === 'Offer' && previousStatus !== 'Offer';

    updateApplication(application.id, {
      company: company.trim(),
      position: position.trim(),
      location: location.trim() || 'Remote',
      status,
      semester: semester || undefined,
      comments: comments.trim() || undefined,
      dateApplied: selectedDate,
    });

    setPreviousStatus(status);

    // If status changed to Offer, show congratulations (if enabled)
    if (isNewOffer && showCongratulationsEnabled) {
      setShowCongratulations(true);
    }

    return true;
  }, [company, position, location, status, semester, comments, selectedDate, application.id, updateApplication, previousStatus]);

  const handleSubmit = () => {
    if (saveChanges()) {
      // Navigate back to ApplicationsList
      navigation.goBack();
    }
  };

  // Handle back button to save changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Check if this will trigger congratulations screen
      const willShowCongratulations = status === 'Offer' && previousStatus !== 'Offer';
      
      // Save changes
      if (saveChanges()) {
        // Don't navigate if congratulations screen should be showing
        if (!willShowCongratulations) {
          navigation.dispatch(e.data.action);
        }
        // If congratulations will show, it will handle navigation via its buttons
      }
    });

    return unsubscribe;
  }, [navigation, saveChanges, status, previousStatus]);

  const handlePostToFeed = () => {
    setShowCongratulations(false);
    // The activity feed item is already added by the context when status is 'Offer'
    navigation.goBack();
  };

  const handleKeepQuiet = () => {
    setShowCongratulations(false);
    // Remove the offer activity feed item if it was added
    // For now, we'll just navigate back
    // In a full implementation, we'd need to track and remove the feed item
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: currentTheme.text }]}>Edit Application</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
          Update your application details
        </Text>

        {/* Date Button */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Date Applied</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
            onPress={() => {
              setTempSelectedDate(selectedDate);
              setCalendarMonth(selectedDate);
              setShowCalendar(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} />
            <Text style={[styles.dateButtonText, { color: currentTheme.text }]}>
              {format(selectedDate, 'EEE MMM d')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Modal */}
        <Modal
          visible={showCalendar}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setTempSelectedDate(selectedDate);
            setShowCalendar(false);
          }}
        >
          <TouchableOpacity 
            style={styles.calendarModalOverlay}
            activeOpacity={1}
            onPress={() => {
              setTempSelectedDate(selectedDate);
              setShowCalendar(false);
            }}
          >
            <View 
              style={[styles.calendarModal, { backgroundColor: currentTheme.background }]}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <View style={[styles.calendarHeader, { borderBottomColor: currentTheme.border }]}>
                <TouchableOpacity
                  onPress={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  style={styles.calendarNavButton}
                >
                  <Ionicons name="chevron-back" size={24} color={currentTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.calendarMonthText, { color: currentTheme.text }]}>
                  {format(calendarMonth, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity
                  onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  style={styles.calendarNavButton}
                >
                  <Ionicons name="chevron-forward" size={24} color={currentTheme.text} />
                </TouchableOpacity>
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <View key={day} style={styles.calendarDayHeader}>
                    <Text style={[styles.calendarDayHeaderText, { color: currentTheme.textSecondary }]}>
                      {day.toUpperCase()}
                    </Text>
                  </View>
                ))}

                {/* Calendar days */}
                {(() => {
                  const monthStart = startOfMonth(calendarMonth);
                  const monthEnd = endOfMonth(calendarMonth);
                  const calendarStart = startOfWeek(monthStart);
                  const calendarEnd = endOfWeek(monthEnd);
                  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                  return days.map((day, index) => {
                    const isCurrentMonth = isSameMonth(day, calendarMonth);
                    const isSelected = isSameDay(day, tempSelectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          {
                            backgroundColor: isSelected ? colors.electricLime : 'transparent',
                            opacity: isCurrentMonth ? 1 : 0.3,
                          },
                        ]}
                        onPress={() => {
                          setTempSelectedDate(day);
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            {
                              color: isSelected
                                ? colors.charcoal
                                : isToday
                                ? colors.electricLime
                                : currentTheme.text,
                              fontWeight: isSelected || isToday ? '600' : '400',
                            },
                          ]}
                        >
                          {format(day, 'd')}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>

              <TouchableOpacity
                style={[styles.calendarConfirmButton, { backgroundColor: colors.electricLime }]}
                onPress={() => {
                  setSelectedDate(tempSelectedDate);
                  setShowCalendar(false);
                }}
              >
                <Text style={[styles.calendarConfirmText, { color: colors.charcoal }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Company *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentTheme.card, color: currentTheme.text, borderColor: currentTheme.border }]}
              placeholder="e.g., Google, Microsoft"
              placeholderTextColor={currentTheme.textSecondary}
              value={company}
              onChangeText={setCompany}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Position / Role *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentTheme.card, color: currentTheme.text, borderColor: currentTheme.border }]}
              placeholder="e.g., Software Engineering Intern"
              placeholderTextColor={currentTheme.textSecondary}
              value={position}
              onChangeText={setPosition}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentTheme.card, color: currentTheme.text, borderColor: currentTheme.border }]}
              placeholder="e.g., San Francisco, CA or Remote"
              placeholderTextColor={currentTheme.textSecondary}
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Status</Text>
            <View style={styles.statusContainer}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor:
                        status === option
                          ? colors.electricLime
                          : currentTheme.card,
                      borderColor: currentTheme.border,
                    },
                  ]}
                  onPress={() => setStatus(option)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          status === option ? colors.charcoal : currentTheme.text,
                        fontWeight: status === option ? '600' : '400',
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Semester</Text>
            <View style={styles.statusContainer}>
              {SEMESTER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor:
                        semester === option
                          ? colors.electricLime
                          : currentTheme.card,
                      borderColor: currentTheme.border,
                    },
                  ]}
                  onPress={() => setSemester(semester === option ? undefined : option)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          semester === option ? colors.charcoal : currentTheme.text,
                        fontWeight: semester === option ? '600' : '400',
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Comments</Text>
            <TextInput
              style={[
                styles.commentsInput,
                {
                  backgroundColor: currentTheme.card,
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                },
              ]}
              placeholder="Add any notes or comments about this application..."
              placeholderTextColor={currentTheme.textSecondary}
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.electricLime }]}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitButtonText, { color: colors.charcoal }]}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CongratulationsScreen
        visible={showCongratulations}
        onClose={() => {
          setShowCongratulations(false);
          navigation.goBack();
        }}
        onPostToFeed={handlePostToFeed}
        onKeepQuiet={handleKeepQuiet}
        company={company.trim()}
        position={position.trim()}
      />
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
  },
  commentsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
  },
  submitButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  calendarModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  calendarDayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarDayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  calendarDayText: {
    fontSize: 16,
  },
  calendarConfirmButton: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendarConfirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

