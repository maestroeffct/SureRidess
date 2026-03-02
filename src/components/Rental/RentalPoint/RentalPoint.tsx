import { Typo } from '@/components/AppText/Typo';
import { Spacing } from '@/theme';
import { View } from 'react-native';

export const RentalPoint = ({
  label,
  color,
  location,
  date,
  time,
  note,
}: any) => (
  <View style={{ marginTop: Spacing.md }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
        }}
      />
      <Typo>{label}</Typo>
    </View>

    <Typo style={{ marginTop: 4, fontWeight: '600' }}>{location}</Typo>
    <Typo variant="caption">
      {date} · {time}
    </Typo>

    {note && (
      <View
        style={{
          marginTop: 8,
          padding: 8,
          borderLeftWidth: 3,
          borderColor: '#FACC15',
          backgroundColor: '#FFFBEB',
        }}
      >
        <Typo variant="caption">{note}</Typo>
      </View>
    )}
  </View>
);
