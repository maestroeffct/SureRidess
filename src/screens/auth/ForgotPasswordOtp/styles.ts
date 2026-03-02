import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  header: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },

  subtitle: {
    marginTop: Spacing.sm,
    maxWidth: 300,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },

  otpBox: {
    width: 84,
    height: 84,
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
  },

  resendWrapper: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: 12,
  },

  resend: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
});
