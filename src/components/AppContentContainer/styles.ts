import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

const styles = StyleSheet.create({
  container: {
    marginTop: -Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: '#fff',
  },
});

export default styles;
