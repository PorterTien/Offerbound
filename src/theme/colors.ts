export const colors = {
  // Primary Accent
  electricLime: '#58cc02',
  
  // Backgrounds
  charcoal: '#121212',
  darkGray: '#1E1E1E',
  
  // Text
  white: '#FFFFFF',
  mutedGray: '#9E9E9E',
  
  // Status
  coral: '#FF4D4D', // Missed quotas, danger
  
  // Additional
  success: '#58cc02',
  warning: '#FFA500',
  info: '#4A9EFF',
};

export const theme = {
  dark: {
    background: colors.charcoal,
    card: colors.darkGray,
    text: colors.white,
    textSecondary: colors.mutedGray,
    primary: colors.electricLime,
    danger: colors.coral,
    border: '#2A2A2A',
  },
  light: {
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    primary: colors.electricLime,
    danger: colors.coral,
    border: '#E0E0E0',
  },
};

