import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';
import { ApplicationStatus, Semester } from '../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from '../utils/dateUtils';
import CongratulationsScreen from './CongratulationsScreen';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Applied',
  'Interview scheduled',
  'Interviewed',
  'Rejected',
  'Offer',
];

const SEMESTER_OPTIONS: Semester[] = ['Fall', 'Spring', 'Winter', 'Summer'];

export default function LogApplicationScreen() {
  const navigation = useNavigation();
  const { addApplication, themeMode, showCongratulationsEnabled } = useApp();
  
  const validThemeMode: 'dark' | 'light' = (themeMode === 'dark' || themeMode === 'light') ? themeMode : 'dark';
  const currentTheme = theme[validThemeMode] || theme.dark;
  const scrollViewRef = useRef<ScrollView>(null);
  const commentsInputRef = useRef<TextInput>(null);
  const commentsContainerRef = useRef<View>(null);
  const lastScrollY = useRef(0);
  const commentsYPosition = useRef<number>(0);
  const isProgrammaticScroll = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;
  const containerRef = useRef<View>(null);

  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [semester, setSemester] = useState<Semester | undefined>(undefined);
  const [comments, setComments] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [offerDetails, setOfferDetails] = useState<{ company?: string; position?: string }>({});

  // Track keyboard height
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Handle touch move to detect when finger enters keyboard area
  const handleTouchMove = (event: any) => {
    if (keyboardHeight === 0) return; // Keyboard not visible
    
    const touchY = event.nativeEvent.pageY;
    const keyboardTopY = screenHeight - keyboardHeight;
    
    // If touch moves into keyboard area, dismiss keyboard
    if (touchY >= keyboardTopY) {
      Keyboard.dismiss();
    }
  };

  // Handle touch start to detect initial touch in keyboard area
  const handleTouchStart = (event: any) => {
    if (keyboardHeight === 0) return; // Keyboard not visible
    
    const touchY = event.nativeEvent.pageY;
    const keyboardTopY = screenHeight - keyboardHeight;
    
    // If touch starts in keyboard area, dismiss keyboard
    if (touchY >= keyboardTopY) {
      Keyboard.dismiss();
    }
  };

  const handleScroll = (event: any) => {
    // Don't dismiss keyboard on scroll - keep it sticky like iOS Messages
    const currentScrollY = event.nativeEvent.contentOffset.y;
    lastScrollY.current = currentScrollY;
  };

  const handleCommentsLayout = (event: any) => {
    // Store the Y position and height of the comments container
    const { y, height } = event.nativeEvent.layout;
    commentsYPosition.current = y;
  };

  const handleCommentsFocus = () => {
    // Set flag to prevent keyboard dismissal during programmatic scroll
    isProgrammaticScroll.current = true;
    
    // Scroll to show comments input above keyboard when focused
    // Use multiple attempts to ensure it works after keyboard animation
    setTimeout(() => {
      isProgrammaticScroll.current = true;
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
    
    setTimeout(() => {
      isProgrammaticScroll.current = true;
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
    
    setTimeout(() => {
      isProgrammaticScroll.current = true;
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 400);
    
    // Keep flag set longer to prevent keyboard dismissal while comments is focused
    // Only reset after a longer delay to ensure keyboard stays open
    setTimeout(() => {
      // Only reset if comments is no longer focused
      if (!commentsInputRef.current?.isFocused()) {
        isProgrammaticScroll.current = false;
      }
    }, 1000);
  };
  
  const handleCommentsBlur = () => {
    // Reset flag when comments loses focus
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 200);
  };


  const handleSubmit = () => {
    if (!company.trim() || !position.trim()) {
      Alert.alert('Missing Information', 'Please fill in company and position.');
      return;
    }

    const isOffer = status === 'Offer';
    const savedCompany = company.trim();
    const savedPosition = position.trim();

    // If it's an offer, save details first before resetting form
    if (isOffer) {
      setOfferDetails({ company: savedCompany, position: savedPosition });
    }

    addApplication({
      company: savedCompany,
      position: savedPosition,
      location: location.trim() || 'Remote',
      status,
      semester: semester || undefined,
      comments: comments.trim() || undefined,
      dateApplied: selectedDate,
      userId: '', // Will be set by context
    });

    // Reset form
    setCompany('');
    setPosition('');
    setLocation('');
    setStatus('Applied' as ApplicationStatus);
    setSemester(undefined);
    setComments('');
    setSelectedDate(new Date());

    if (isOffer && showCongratulationsEnabled) {
      setTimeout(() => setShowCongratulations(true), 100);
    } else {
      navigation.navigate('ApplicationSuccess' as never);
    }
  };

  const handlePostToFeed = () => {
    setShowCongratulations(false);
    navigation.navigate('ApplicationSuccess' as never);
  };

  const handleKeepQuiet = () => {
    setShowCongratulations(false);
    navigation.navigate('ApplicationSuccess' as never);
  };

  const safeBackground = currentTheme.background;
  const safeText = currentTheme.text;
  const safeCard = currentTheme.card;
  const safeBorder = currentTheme.border;
  const safeTextSecondary = currentTheme.textSecondary;

  return (
    <View 
      ref={containerRef}
      style={[styles.container, { backgroundColor: safeBackground }]}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      <StatusBar style={validThemeMode === 'dark' ? 'light' : 'dark'} translucent={true} />
      <View style={[styles.customHeader, { backgroundColor: safeBackground, borderBottomColor: safeBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={safeText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: safeText }]}>
          Log Application
        </Text>
        <View style={styles.backButton} />
      </View>
   
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
        <Text style={[styles.title, { color: safeText }]}>Log Application</Text>
        <Text style={[styles.subtitle, { color: safeTextSecondary }]}>
          Track your internship applications
        </Text>

        {/* Date Button */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: safeText }]}>Date Applied</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: safeCard, borderColor: safeBorder }]}
            onPress={() => {
              setTempSelectedDate(selectedDate);
              setCalendarMonth(selectedDate);
              setShowCalendar(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={safeTextSecondary} />
            <Text style={[styles.dateButtonText, { color: safeText }]}>
              {format(selectedDate, 'EEE MMM d')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={safeTextSecondary} />
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
              style={[styles.calendarModal, { backgroundColor: safeBackground }]}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <View style={[styles.calendarHeader, { borderBottomColor: safeBorder }]}>
                <TouchableOpacity
                  onPress={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  style={styles.calendarNavButton}
                >
                  <Ionicons name="chevron-back" size={24} color={safeText} />
                </TouchableOpacity>
                <Text style={[styles.calendarMonthText, { color: safeText }]}>
                  {format(calendarMonth, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity
                  onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  style={styles.calendarNavButton}
                >
                  <Ionicons name="chevron-forward" size={24} color={safeText} />
                </TouchableOpacity>
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <View key={day} style={styles.calendarDayHeader}>
                    <Text style={[styles.calendarDayHeaderText, { color: safeTextSecondary }]}>
                      {day.toUpperCase()}
                    </Text>
                  </View>
                ))}

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
                                : safeText,
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
            <Text style={[styles.label, { color: safeText }]}>Company *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: safeCard, color: safeText, borderColor: safeBorder }]}
              placeholder="e.g., Google, Microsoft"
              placeholderTextColor={safeTextSecondary}
              value={company}
              onChangeText={setCompany}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: safeText }]}>Position / Role *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: safeCard, color: safeText, borderColor: safeBorder }]}
              placeholder="e.g., Software Engineering Intern"
              placeholderTextColor={safeTextSecondary}
              value={position}
              onChangeText={setPosition}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: safeText }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: safeCard, color: safeText, borderColor: safeBorder }]}
              placeholder="e.g., San Francisco, CA or Remote"
              placeholderTextColor={safeTextSecondary}
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: safeText }]}>Status</Text>
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
                          : safeCard,
                      borderColor: safeBorder,
                    },
                  ]}
                  onPress={() => setStatus(option)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          status === option ? colors.charcoal : safeText,
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
            <Text style={[styles.label, { color: safeText }]}>Semester</Text>
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
                          : safeCard,
                      borderColor: safeBorder,
                    },
                  ]}
                  onPress={() => setSemester(semester === option ? undefined : option)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          semester === option ? colors.charcoal : safeText,
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

          <View 
            ref={commentsContainerRef}
            style={[styles.inputGroup, styles.commentsInputGroup]}
            onLayout={handleCommentsLayout}
          >
            <Text style={[styles.label, { color: safeText }]}>Comments</Text>
            <TextInput
              ref={commentsInputRef}
              style={[
                styles.commentsInput,
                {
                  backgroundColor: safeCard,
                  color: safeText,
                  borderColor: safeBorder,
                },
              ]}
              placeholder="Add any notes or comments about this application..."
              placeholderTextColor={safeTextSecondary}
              value={comments}
              onChangeText={setComments}
              onFocus={handleCommentsFocus}
              onBlur={handleCommentsBlur}
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
            Log Application
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CongratulationsScreen
        visible={showCongratulations}
        onClose={() => {
          setShowCongratulations(false);
          navigation.navigate('ApplicationSuccess' as never);
        }}
        onPostToFeed={handlePostToFeed}
        onKeepQuiet={handleKeepQuiet}
        company={offerDetails.company}
        position={offerDetails.position}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 90, // Extra padding to ensure comments field is fully visible above keyboard
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
  commentsInputGroup: {
    marginBottom: 0, // Reduced spacing between comments and submit button
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 20 : 0, // Reduced padding to move content higher
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 36,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  keyboardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});

