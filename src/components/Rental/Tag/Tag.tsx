import { Typo } from '@/components/AppText/Typo';
import Ionicons from '@react-native-vector-icons/ionicons';
import { StyleSheet, View } from 'react-native';

export function Tag({ label, icon }: { label: string; icon?: string }) {
  return (
    <View style={tagStyles.container}>
      {icon && <Ionicons name={icon} size={14} />}
      <Typo variant="caption">{label}</Typo>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
});
