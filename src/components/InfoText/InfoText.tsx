import Ionicons from '@react-native-vector-icons/ionicons';
import { View, StyleSheet } from 'react-native';
import { Typo } from '../AppText/Typo';

export function InfoText({ label }: { label: string }, style?: any) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name="information-circle-outline" size={16} color="#EC4899" />
      <Typo
        variant="caption"
        style={[{ color: '#EC4899', marginLeft: 6 }, style]}
      >
        {label}
      </Typo>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
