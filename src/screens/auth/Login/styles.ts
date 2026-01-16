import { Spacing } from '@/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  header: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  forgot: {
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
  },

  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
});

export default styles;
