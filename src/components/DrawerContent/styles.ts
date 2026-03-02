import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xxl,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    // marginBottom: Spacing.xl,
  },

  logo: {
    width: 80,
    height: 80,
  },

  tagline: {
    // marginTop: 4,
    marginLeft: 10,
    color: '#888',
    width: 180,
    height: 80,
  },

  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    color: '#999',
  },

  appItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 4,
  },

  activeAppItem: {
    backgroundColor: '#1B7C63',
  },

  appText: {
    fontSize: 16,
    color: '#222',
  },

  activeAppText: {
    color: '#fff',
    fontWeight: '600',
  },

  logoutText: {
    fontSize: 16,
    color: '#E53935',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: Spacing.lg,
  },

  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D7F2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontWeight: '600',
    color: '#1B7C63',
  },

  userName: {
    fontWeight: '600',
  },

  userEmail: {
    color: '#777',
    fontSize: 13,
  },
});
