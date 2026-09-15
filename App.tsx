import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

const linking = {
  prefixes: ['offerbound://'],
  config: {
    screens: {
      CreateJoinGroup: {
        path: 'join/:code',
        parse: {
          code: (code: string) => code,
        },
      },
    },
  },
};

function AppContent() {
  const { themeMode } = useApp();
  const navigationRef = useRef<any>(null);
  
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      const route = url.replace(/.*?:\/\//g, '');
      const [path, code] = route.split('/');
      
      if (path === 'join' && code && navigationRef.current) {
        navigationRef.current.navigate('CreateJoinGroup', { code });
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer ref={navigationRef} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

