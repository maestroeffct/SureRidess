import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  header: {
    paddingVertical: 12,
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },

  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },

  tabLabel: {
    opacity: 0.6,
  },

  activeTab: {
    borderColor: '#089b52ff',
  },

  /* Calendar */
  monthBlock: {
    marginBottom: 32,
  },

  monthTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },

  activeDay: {
    backgroundColor: '#FBBF24', // yellow like screenshot
  },

  disabledDay: {
    opacity: 0.3,
  },
});
