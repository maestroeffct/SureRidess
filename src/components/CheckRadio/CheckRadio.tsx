import Ionicons from '@react-native-vector-icons/ionicons';
import { View } from 'react-native';

export function CheckRadio({ selected }: { selected: boolean }) {
  return (
    <View
      style={[
        checkRadioStyles.outer,
        selected && checkRadioStyles.outerSelected,
      ]}
    >
      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
    </View>
  );
}

const checkRadioStyles = {
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  outerSelected: {
    backgroundColor: '#0B6E4F',
    borderColor: '#0B6E4F',
  },
};
