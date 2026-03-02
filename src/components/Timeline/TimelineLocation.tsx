import Ionicons from '@react-native-vector-icons/ionicons';
import { StyleSheet, View } from 'react-native';
import { Typo } from '../AppText/Typo';

export function TimelineLocation({
  icon,
  color,
  date,
  place,
  address,
}: {
  icon: string;
  color: string;
  date: string;
  place: string;
  address: string;
}) {
  return (
    <View style={timelineStyles.row}>
      <View style={timelineStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View>
        <Typo variant="caption">{date}</Typo>
        <Typo>{place}</Typo>
        <Typo variant="caption">{address}</Typo>
      </View>
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    marginTop: 2,
  },
});
