import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typo } from '../../AppText/Typo';
import { CheckRadio } from '../../CheckRadio/CheckRadio';

export function InsuranceCard({
  title,
  description,
  price,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  price: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[insuranceStyles.card, selected && insuranceStyles.selected]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <CheckRadio selected={selected} />

      <View style={insuranceStyles.middle}>
        <Typo>{title}</Typo>
        <Typo variant="caption">{description}</Typo>
      </View>

      <Typo style={insuranceStyles.price}>{price}</Typo>
    </TouchableOpacity>
  );
}

const insuranceStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  selected: {
    borderColor: '#0B6E4F',
    backgroundColor: '#E7F5F0',
  },
  left: {
    justifyContent: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    borderWidth: 2,
    borderColor: '#bbb',
  },
  radioActive: {
    borderColor: '#0B6E4F',
    backgroundColor: '#0B6E4F',
  },
  middle: {
    flex: 1,
  },
  price: {
    color: '#0B6E4F',
    fontWeight: '600',
  },
});
