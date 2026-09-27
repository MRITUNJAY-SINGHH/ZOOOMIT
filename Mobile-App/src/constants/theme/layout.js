import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const layout = {
  window: {
    width,
    height
  },
  isSmallDevice: width < 375,
  isTablet: width >= 768,
  maxWidth: 600,
  headerHeight: 56,
  bottomTabHeight: 64
};
