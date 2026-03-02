import Ionicons from '@react-native-vector-icons/ionicons';
import { StyleSheet, View } from 'react-native';
import { Typo } from '../AppText/Typo';

export function CheckItem({ label }: { label: string }) {
  return (
    <View style={checkStyles.row}>
      <Ionicons name="checkmark" size={16} color="#0B6E4F" />
      <Typo variant="caption">{label}</Typo>
    </View>
  );
}

const checkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
});
