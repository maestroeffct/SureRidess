import { StyleSheet, TouchableOpacity } from 'react-native';
import { CheckRadio } from '../CheckRadio/CheckRadio';
import { Typo } from '../AppText/Typo';

export function PaymentRow({
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
      style={[paymentStyles.row, selected && paymentStyles.selected]}
      onPress={onPress}
    >
      <CheckRadio selected={selected} />
      <Typo>{label}</Typo>
    </TouchableOpacity>
  );
}

const paymentStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  selected: {
    backgroundColor: '#E7F5F0',
    borderColor: '#0B6E4F',
  },
});
