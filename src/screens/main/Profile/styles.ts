import { Radius, Spacing } from '@/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  menu: {
    gap: Spacing.sm,
  },
  item: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  button: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});

export default styles;
