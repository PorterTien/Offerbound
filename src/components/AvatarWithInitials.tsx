import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarWithInitialsProps {
  uri?: string;
  name: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

export default function AvatarWithInitials({
  uri,
  name,
  size = 40,
  backgroundColor,
  textColor,
}: AvatarWithInitialsProps) {
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const defaultBg = backgroundColor || '#58cc02';
  const defaultText = textColor || '#121212';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.initialsContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: defaultBg,
        },
      ]}
    >
      <Text
        style={[
          styles.initialsText,
          {
            fontSize: size * 0.4,
            color: defaultText,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '600',
  },
});


