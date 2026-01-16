import { StyleSheet } from 'react-native';
// import { Spacing } from '@/theme/spacing';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 230,
    height: 230,
    // marginBottom: Spacing.md,
  },
  logoText: {
    width: 290,
    height: 50,
    marginBottom: 6,
  },
  tagline: {
    width: 240,
    height: 24,
    opacity: 0.9,
  },
});
