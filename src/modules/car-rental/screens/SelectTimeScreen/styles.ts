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
    borderColor: '#2563EB',
  },

  /* Groups */
  groupTitle: {
    marginVertical: 12,
    fontWeight: '600',
  },

  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  timeChip: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },

  activeTime: {
    backgroundColor: '#FBBF24', // yellow active state
  },
});
