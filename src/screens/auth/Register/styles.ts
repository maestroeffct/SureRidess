import { Radius, Spacing } from '@/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  header: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.md,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 62,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  terms: {
    marginVertical: Spacing.md,
  },
  googleBtn: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row', // 🔥 THIS IS THE KEY
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },

  signIn: {
    marginLeft: 4, // spacing between texts
  },
});

export default styles;
