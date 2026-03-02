import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },

  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  logoText: {
    fontWeight: '600',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xl,
  },

  locationText: {
    opacity: 0.7,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  card: {
    width: '47%',
    height: 150,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  cardText: {
    color: '#fff',
    textAlign: 'center',
  },
  welcomeBox: {
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    fontWeight: '600',
  },
  welcomeSubtext: {
    marginTop: Spacing.sm,
    color: '#666',
  },
});
