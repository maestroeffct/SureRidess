import { Radius, Spacing } from '@/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});

export default styles;
