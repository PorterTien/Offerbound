import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StackActions, CommonActions } from '@react-navigation/native';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, theme } from '../theme/colors';
import { useApp } from '../context/AppContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import GroupsScreen from '../screens/GroupsScreen';
import LogApplicationScreen from '../screens/LogApplicationScreen';
import ApplicationsScreen from '../screens/ApplicationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import LeaderboardsScreen from '../screens/LeaderboardsScreen';
import ApplicationSuccessScreen from '../screens/ApplicationSuccessScreen';
import EditApplicationScreen from '../screens/EditApplicationScreen';
import CreateJoinGroupScreen from '../screens/CreateJoinGroupScreen';
import GroupSettingsModal from '../screens/GroupSettingsModal';
import GroupStatsModal from '../screens/GroupStatsModal';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RootStack = createStackNavigator();

// Empty component for CenterAction tab (fixes inline function warning)
const EmptyComponent = () => null;

const GroupsStack = () => {
  const { themeMode } = useApp();
  const currentTheme = theme[themeMode];
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: currentTheme.card },
        headerTintColor: currentTheme.text,
      }}
    >
      <Stack.Screen 
        name="GroupsList" 
        component={GroupsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const HomeStack = () => {
  const { themeMode } = useApp();
  const currentTheme = theme[themeMode];
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: currentTheme.card },
        headerTintColor: currentTheme.text,
      }}
    >
      <Stack.Screen 
        name="HomeFeed" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Leaderboards" 
        component={LeaderboardsScreen}
        options={{ 
          title: 'Leaderboards',
        }}
      />
    </Stack.Navigator>
  );
};

const ApplicationsStack = () => {
  const { themeMode } = useApp();
  const currentTheme = theme[themeMode];
  
  return (
    <Stack.Navigator
      initialRouteName="ApplicationsList"
      screenOptions={{
        headerStyle: { backgroundColor: currentTheme.card },
        headerTintColor: currentTheme.text,
      }}
    >
      <Stack.Screen 
        name="ApplicationsList" 
        component={ApplicationsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditApplication" 
        component={EditApplicationScreen}
        options={({ navigation }) => {
          // Use theme from parent component scope, not hooks
          const currentTheme = theme[themeMode];
          
          return {
            presentation: 'modal',
            ...TransitionPresets.ModalPresentationIOS,
            title: 'Edit Application',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
                style={{ marginLeft: 16, padding: 8 }}
              >
                <Ionicons name="arrow-back" size={20} color={currentTheme.text} />
              </TouchableOpacity>
            ),
          };
        }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator (wrapped in Root Stack)
const MainTabs = () => {
  const { themeMode } = useApp();
  const currentTheme = theme[themeMode];
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: currentTheme.card,
          borderTopColor: currentTheme.border,
          borderTopWidth: 1,
          height: 100,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.electricLime,
        tabBarInactiveTintColor: currentTheme.textSecondary,
        headerStyle: {
          backgroundColor: currentTheme.card,
        },
        headerTintColor: currentTheme.text,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="CenterAction"
        component={EmptyComponent}
        options={({ navigation }) => ({
          tabBarButton: () => (
            <View style={styles.centerButtonContainer}>
              <CenterActionButton navigation={navigation} />
            </View>
          ),
          tabBarLabel: '',
          tabBarItemStyle: {
            maxWidth: 80,
          },
        })}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
          title: 'My Apps',
          headerShown: false,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const applicationsRoute = state.routes.find((r: any) => r.name === 'Applications');
            const applicationsState = applicationsRoute?.state;
            
            if (applicationsState && applicationsState.index > 0) {
              e.preventDefault();
              navigation.navigate('Applications', {
                screen: 'ApplicationsList',
              });
            } else {
              e.preventDefault();
              navigation.navigate('Applications', {
                screen: 'ApplicationsList',
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const CenterActionButton = ({ navigation }: { navigation: any }) => {
  const { themeMode } = useApp();
  const currentTheme = theme[themeMode];
  
  const handlePress = () => {
    try {
      // Navigate to root-level LogApplication modal
      // This will slide up from bottom regardless of current tab
      // The Tab Navigator is inside RootStack, so getParent() gives us RootStack
      const rootNavigator = navigation.getParent();
      if (rootNavigator) {
        rootNavigator.navigate('LogApplication');
      } else {
        // Fallback: try direct navigation
        navigation.navigate('LogApplication' as never);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <View style={styles.centerButtonContainer}>
      <View style={[styles.centerButtonWrapper, { 
        backgroundColor: currentTheme.background,
        borderColor: currentTheme.card,
      }]}>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={36} color={colors.charcoal} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.centerButtonLabel, { color: currentTheme.textSecondary }]}>
        Log App
      </Text>
    </View>
  );
};

export default function AppNavigator() {
  const { themeMode } = useApp();
  const currentTheme = theme[themeMode];
  
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: currentTheme.card },
        headerTintColor: currentTheme.text,
      }}
    >
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="LogApplication"
        component={LogApplicationScreen}
        options={{
          presentation: 'modal',
          ...TransitionPresets.ModalPresentationIOS,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="ApplicationSuccess"
        component={ApplicationSuccessScreen}
        options={{
          presentation: 'modal',
          ...TransitionPresets.ModalPresentationIOS,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="CreateJoinGroup"
        component={CreateJoinGroupScreen}
        options={{
          presentation: 'modal',
          ...TransitionPresets.ModalPresentationIOS,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="GroupSettings"
        component={GroupSettingsModal}
        options={{
          presentation: 'modal',
          ...TransitionPresets.ModalPresentationIOS,
          headerShown: false,
        }}
      />
      <RootStack.Screen
        name="GroupStats"
        component={GroupStatsModal}
        options={{
          presentation: 'modal',
          ...TransitionPresets.ModalPresentationIOS,
          headerShown: false,
        }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  centerButtonWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    marginTop: -32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0, // removes shadow
    shadowRadius: 4,
    elevation: 4,
   
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.electricLime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.electricLime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: .8,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});

