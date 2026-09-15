import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, theme } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface CongratulationsScreenProps {
  visible: boolean;
  onClose: () => void;
  onPostToFeed: () => void;
  onKeepQuiet: () => void;
  company?: string;
  position?: string;
}

// Simple confetti particle component
const ConfettiParticle = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const duration = 2000 + Math.random() * 1000;
    const endX = (Math.random() - 0.5) * 200;
    const endY = height + 100;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: endY,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: endX,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 360,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.8,
        delay: delay + duration * 0.2,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          backgroundColor: color,
          left: startX,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotation },
          ],
          opacity,
        },
      ]}
    />
  );
};

const CONGRATULATIONS_MESSAGES = [
  "🤯You're so cracked🤯",
  "💯Time to get that bag💯",
  "🔥LETS GOOOOOOOOO🔥",
  "🤩WOOOOOOOOOOOOOO🤩",
];

export default function CongratulationsScreen({
  visible,
  onClose,
  onPostToFeed,
  onKeepQuiet,
  company,
  position,
}: CongratulationsScreenProps) {
  const { themeMode } = useApp();
  const currentTheme = theme[themeMode];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const hasShownRef = useRef(false);
  const [congratsMessage, setCongratsMessage] = useState(CONGRATULATIONS_MESSAGES[0]);

  useEffect(() => {
    if (visible && !hasShownRef.current) {
      hasShownRef.current = true;
      // Randomly select a congratulations message
      const randomMessage = CONGRATULATIONS_MESSAGES[Math.floor(Math.random() * CONGRATULATIONS_MESSAGES.length)];
      setCongratsMessage(randomMessage);
      
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else if (!visible) {
      hasShownRef.current = false;
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const confettiColors = [
    colors.electricLime,
    colors.warning,
    colors.info,
    '#FF6B9D',
    '#C44569',
    '#F8B500',
  ];

  const confettiParticles = Array.from({ length: 50 }, (_, i) => (
    <ConfettiParticle
      key={i}
      delay={i * 20}
      color={confettiColors[i % confettiColors.length]}
      startX={Math.random() * width}
    />
  ));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        // Prevent Android back button from closing - user must choose an option
        // Do nothing here, force user to choose Post to Feed or Keep Quiet
      }}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
        {/* Confetti */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiParticles}
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: currentTheme.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.electricLime + '20' }]}>
            <Ionicons name="trophy" size={80} color={colors.electricLime} />
          </View>

          <Text style={[styles.title, { color: currentTheme.text }]}>
            🎉 Congratulations! 🎉
          </Text>

          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            {congratsMessage}
          </Text>

          {(company || position) && (
            <View style={styles.offerDetails}>
              {company && (
                <Text style={[styles.offerText, { color: currentTheme.text }]}>
                  {company}
                </Text>
              )}
              {position && (
                <Text style={[styles.offerText, { color: currentTheme.textSecondary }]}>
                  {position}
                </Text>
              )}
            </View>
          )}

          <Text style={[styles.question, { color: currentTheme.text }]}>
            Share your success?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.electricLime }]}
              onPress={onPostToFeed}
            >
              <Ionicons name="share-social" size={20} color={colors.charcoal} />
              <Text style={[styles.buttonText, { color: colors.charcoal }]}>
                Post to Home Feed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: currentTheme.border }]}
              onPress={onKeepQuiet}
            >
              <Ionicons name="lock-closed" size={20} color={currentTheme.text} />
              <Text style={[styles.buttonText, { color: currentTheme.text }]}>
                Keep It Quiet
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    width: width * 0.85,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  offerDetails: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  offerText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    // backgroundColor set inline
  },
  secondaryButton: {
    borderWidth: 2,
    // borderColor set inline
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

