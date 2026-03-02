import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  /* ---------- HEADER ---------- */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },

  /* ---------- SECTIONS ---------- */
  sectionTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },

  /* ---------- SWITCH ROW ---------- */
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3FAF7',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#C7D7D1',
  },

  /* ---------- CHECKBOX ---------- */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 12,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#C7D7D1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checked: {
    backgroundColor: '#0A6A4B',
    borderColor: '#0A6A4B',
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },

  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
  },

  dateWrapper: {
    flexDirection: 'row',
    gap: 12,
  },

  dateCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },

  dateDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },

  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },

  sectionDivider: {
    height: 2,
    backgroundColor: '#c2c4c7ff',
    marginVertical: 16,
  },

  countrySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },

  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  flagCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32', // Nigeria green placeholder
  },

  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },

  input: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },

  helperText: {
    color: '#6B7280',
  },

  resultsWrapper: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },

  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationText: {
    flex: 1,
  },

  locationName: {
    fontWeight: '600',
  },

  locationAddress: {
    color: '#6B7280',
  },

  searchBtn: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },

  countryItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  countryItemActive: {
    backgroundColor: '#F0FDF4',
  },

  flagEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
});
