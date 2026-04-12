import { Image, TouchableOpacity, View, ViewStyle } from 'react-native';
import type { ComponentProps } from 'react';
import { Typo } from '../../AppText/Typo';
import Ionicons from '@react-native-vector-icons/ionicons';
import type {
  RentalCar,
  RentalCarFeature,
  RentalCarFeatureLink,
} from '@/types/rental';
import styles from './styles';

export function CarCard({
  onPress,
  car,
  style,
}: {
  onPress: () => void;
  car?: RentalCar;
  style?: ViewStyle;
}) {
  const title =
    car?.brand && car?.model ? `${car.brand} ${car.model}` : 'Toyota RAV4';
  const location = car?.location?.name ?? 'Ogun State';
  const dailyRate =
    typeof car?.dailyRate === 'number' ? `₦${car.dailyRate}` : '₦250';
  const imageUrl =
    car?.images?.find(img => img.isPrimary)?.url ??
    car?.images?.[0]?.url;
  const imageSource = imageUrl
    ? { uri: imageUrl }
    : require('@/assets/images/car.png');

  const formatLabel = (value?: string) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const categoryLabel = car?.category ? formatLabel(car.category) : 'Van';
  const showVerified = car?.provider?.isVerified === true || car === undefined;

  const specs: {
    icon: ComponentProps<typeof Ionicons>['name'];
    label: string;
  }[] = [];

  const transmissionLabel = car?.transmission
    ? formatLabel(car.transmission)
    : '';
  if (transmissionLabel) {
    specs.push({ icon: 'settings-outline', label: transmissionLabel });
  } else if (!car) {
    specs.push({ icon: 'settings-outline', label: 'Auto' });
  }

  if (typeof car?.seats === 'number') {
    specs.push({ icon: 'people-outline', label: `${car.seats}` });
  } else if (!car) {
    specs.push({ icon: 'people-outline', label: '5' });
  }

  if (typeof car?.hasAC === 'boolean') {
    specs.push({ icon: 'snow-outline', label: car.hasAC ? 'A/C' : 'No A/C' });
  } else if (!car) {
    specs.push({ icon: 'snow-outline', label: 'A/C' });
  }

  const mileageLabel = car?.mileagePolicy ? formatLabel(car.mileagePolicy) : '';
  if (mileageLabel) {
    specs.push({
      icon: 'speedometer-outline',
      label: `${mileageLabel} Mileage`,
    });
  } else if (!car) {
    specs.push({ icon: 'speedometer-outline', label: 'Unlimited Mileage' });
  }

  if (car?.bags) {
    specs.push({
      icon: 'briefcase-outline',
      label: `${car.bags} Bags`,
    });
  }

  const normalizeFeatures = (
    items?: Array<RentalCarFeature | RentalCarFeatureLink>,
  ): RentalCarFeature[] => {
    if (!items) return [];
    return items
      .map(item => ('feature' in item ? item.feature : item))
      .filter(Boolean) as RentalCarFeature[];
  };

  const featureLabels = (() => {
    let labels: string[] = [];

    if (car?.features && car.features.length > 0) {
      labels = normalizeFeatures(car.features)
        .map(feature => feature.name)
        .filter(Boolean);
    }

    if (labels.length === 0 && car?.groupedFeatures) {
      labels = Object.values(car.groupedFeatures)
        .flat()
        .map(feature => feature.name)
        .filter(Boolean);
    }

    return labels;
  })();

  const footerFeatures =
    featureLabels.length > 0
      ? featureLabels.slice(0, 2)
      : ['Instant confirmation', 'Free cancelation'];

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.9}>
      {/* IMAGE */}
      <View style={styles.imageWrapper}>
        <Image
          source={imageSource}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* TAGS */}
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Typo variant="caption">{categoryLabel}</Typo>
          </View>

          {showVerified && (
            <View style={[styles.tag, styles.verified]}>
              <Typo variant="caption" style={{ color: '#fff' }}>
                Verified
              </Typo>
            </View>
          )}
        </View>
      </View>

      {/* INFO */}
      <View style={styles.cardBody}>
        <Typo variant="subheading">{title}</Typo>
        <Typo variant="caption" style={styles.location}>
          {location}
        </Typo>

        {/* SPECS */}
        <View style={styles.specRow}>
          {specs.map(spec => (
            <Spec key={`${spec.icon}-${spec.label}`} {...spec} />
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View>
            {footerFeatures.map((feature, index) => (
              <View key={`${feature}-${index}`} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={12} color="#0A6A4B" />
                <Typo variant="caption">{feature}</Typo>
              </View>
            ))}
          </View>

          <View style={styles.priceBox}>
            <Typo variant="caption">Day/</Typo>
            <Typo style={styles.price}>{dailyRate}</Typo>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
function Spec({
  icon,
  label,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <View style={styles.specChip}>
      <Ionicons name={icon} size={14} />
      <Typo variant="caption">{label}</Typo>
    </View>
  );
}
