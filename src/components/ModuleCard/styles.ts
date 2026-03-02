import { StyleSheet } from 'react-native';
import { Radius } from '@/theme';

export default StyleSheet.create({
  card: {
    width: '47%',
    height: 150,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  cardText: {
    color: '#fff',
    textAlign: 'center',
  },

  disabledCard: {
    opacity: 0.5,
  },

  disabledText: {
    color: '#ccc',
  },

  comingSoon: {
    marginTop: 4,
    color: '#ddd',
    fontSize: 12,
  },
});
