import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

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
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
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
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  pickupCode: {
    marginHorizontal: Spacing.lg,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  total: {
    fontWeight: '700',
    color: '#0A6A4B',
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
  },

  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
  },
});
