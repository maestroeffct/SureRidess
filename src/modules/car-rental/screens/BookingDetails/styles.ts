import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

/**
 * Booking Details visual scaffold.
 *
 * The screen matches the Payment/Checkout pattern — a full-width photo
 * hero followed by flat sections separated by hairline dividers. Each
 * `section` provides horizontal + vertical padding; the divider is
 * baked into the styles (borderBottom) so callers don't have to draw
 * one manually. Hero + bottom bar live inside the screen component.
 */
export default StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },

  image: {
    width: '100%',
    height: 220,
  },

  imageCounter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    gap: 10,
  },

  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    opacity: 0.7,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },

  infoRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },

  pickupCode: {
    marginHorizontal: Spacing.lg,
    marginTop: 10,
    padding: Spacing.md,
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  pickupValue: {
    color: '#0A6A4B',
    fontWeight: '600',
  },

  totalRow: {
    marginTop: Spacing.md,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  total: {
    fontWeight: '800',
    fontSize: 16,
    color: '#0A6A4B',
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },

  cancelText: {
    color: '#DC2626',
    fontWeight: '700',
  },

  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },

  receiptText: {
    color: '#0A6A4B',
    fontWeight: '700',
  },
});
