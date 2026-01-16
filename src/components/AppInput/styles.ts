import { Radius, Spacing } from '@/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
    height: 62,
  },
  icon: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingRight: Spacing.md,
  },
  otpWrapper: {
    borderWidth: 0, // ❌ REMOVE INNER LINE
    paddingHorizontal: 0,
  },

  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    paddingVertical: 0,
  },
});

export default styles;
