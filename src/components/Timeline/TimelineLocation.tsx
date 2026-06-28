import Ionicons from '@react-native-vector-icons/ionicons';
import { StyleSheet, View } from 'react-native';

import { Typo } from '../AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  icon: string;
  color: string;
  date: string;
  place: string;
  address: string;
  /** Short banner above the date — e.g. "Pick-up" / "Drop-off". */
  label?: string;
  /**
   * When true, no connecting line is drawn below the icon. Set on the final
   * row in a sequence so the timeline doesn't trail into empty space.
   */
  isLast?: boolean;
};

export function TimelineLocation({
  icon,
  color,
  date,
  place,
  address,
  label,
  isLast,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={timelineStyles.row}>
      {/* Left rail — pin marker + optional connector down to the next row */}
      <View style={timelineStyles.rail}>
        <View
          style={[
            timelineStyles.pin,
            { backgroundColor: `${color}1A`, borderColor: color },
          ]}
        >
          <Ionicons name={icon as any} size={14} color={color} />
        </View>
        {!isLast && (
          <View
            style={[
              timelineStyles.connector,
              { backgroundColor: colors.border },
            ]}
          />
        )}
      </View>

      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
        {label ? (
          <Typo style={[timelineStyles.label, { color }]}>
            {label.toUpperCase()}
          </Typo>
        ) : null}
        <Typo style={[timelineStyles.date, { color: colors.textPrimary }]}>
          {date}
        </Typo>
        <Typo style={[timelineStyles.place, { color: colors.textPrimary }]}>
          {place}
        </Typo>
        <Typo
          style={[timelineStyles.address, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {address}
        </Typo>
      </View>
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  rail: {
    alignItems: 'center',
    width: 28,
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 24,
    borderRadius: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
  },
  place: {
    fontSize: 13,
    marginTop: 2,
  },
  address: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
