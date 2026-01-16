import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  spacer: {
    marginTop: 30,
  },
  subtitle: {
    marginTop: Spacing.sm,
    maxWidth: 320,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },

  otpContainer: {
    width: 88,
  },

  otpInput: {
    height: 88,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    borderWidth: 1.5,
    borderRadius: Radius.sm,
  },

  resend: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
});
