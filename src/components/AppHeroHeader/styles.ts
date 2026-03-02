import { StyleSheet } from 'react-native';
import { Spacing } from '@/theme';

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#0A6A4B',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A6A4B',
    opacity: 0.92,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },

  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    position: 'absolute',
    top: 3,
    right: 5,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontWeight: '700',
    color: '#0A6A4B',
  },

  subtitle: {
    color: '#fff',
    marginTop: Spacing.lg,
  },

  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
    lineHeight: 36,
    maxWidth: 320,
  },

  description: {
    color: '#fff',
    marginTop: 6,
    opacity: 0.9,
    maxWidth: 300,
  },

  topLeft: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
  },
});

export default styles;
