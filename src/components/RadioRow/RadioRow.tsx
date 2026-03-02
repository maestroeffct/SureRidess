import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typo } from '../AppText/Typo';

export function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={radioStyles.row}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[radioStyles.radio, selected && radioStyles.active]} />
      <Typo>{label}</Typo>
    </TouchableOpacity>
  );
}

const radioStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#bbb',
  },
  active: {
    borderColor: '#0B6E4F',
    backgroundColor: '#0B6E4F',
  },
});
