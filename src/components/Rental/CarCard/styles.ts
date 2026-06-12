import { Colors, Radius, Spacing } from '@/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    // width: '100%',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 10,
    borderColor: Colors.primary,
  },

  imageWrapper: {
    position: 'relative',
  },

  cardImage: {
    width: '100%',
    height: 200,
  },

  tagRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },

  favoriteWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  tag: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  verified: {
    backgroundColor: '#16A34A',
  },

  cardBody: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  location: {
    marginTop: 2,
    opacity: 0.6,
  },

  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  providerName: {
    fontSize: 11,
    maxWidth: 160,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratingCount: {
    fontSize: 11,
  },

  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.sm,
  },

  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#c5c6c8ff',
    borderRadius: Spacing.sm,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.md,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  priceBox: {
    alignItems: 'flex-end',
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A6A4B',
  },
});

export default styles;
