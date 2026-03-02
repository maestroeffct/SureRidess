import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  hero: {
    backgroundColor: '#0A6A4B',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
  },

  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A6A4B',
    opacity: 0.92,
  },

  heroTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },

  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    backgroundColor: 'red',
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
    fontWeight: '600',
  },

  hello: {
    color: '#fff',
    marginTop: Spacing.lg,
  },

  question: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },

  subQuestion: {
    color: '#fff',
    marginTop: 4,
    maxWidth: 280,
  },

  card: {
    width: 350,
    backgroundColor: '#fff',
    borderRadius: Radius.sm,
    marginLeft: Spacing.md,
    overflow: 'hidden',
  },

  imageWrapper: {
    position: 'relative',
  },

  cardImage: {
    width: '100%',
    height: 160,
  },

  tagRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
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
    // padding: Spacing.sm,
    paddingTop: Spacing.sm,
    // paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },

  location: {
    marginTop: 2,
    opacity: 0.6,
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

  priceBox: {
    alignItems: 'flex-end',
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A6A4B',
  },

  searchRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: 12,
  },

  searchBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 52,
    gap: 8,
  },

  searchPlaceholder: {
    opacity: 0.5,
  },

  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },

  sectionSpacer: {
    marginTop: -Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: '#ffffffff',
  },

  searchWrapper: {
    // marginTop: Spacing.lg,
    marginBottom: Spacing.xxxxl,
    gap: 12,
    paddingHorizontal: Spacing.lg,
  },
});
