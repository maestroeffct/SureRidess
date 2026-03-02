import React from 'react';
import { View, Image } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  image: string;
  title: string;
  location: string;
  tags: string[];
  imageCount?: string;
};

export const VehicleHeaderCard = ({
  image,
  title,
  location,
  tags,
  imageCount,
}: Props) => {
  return (
    <View>
      <View>
        <Image source={{ uri: image }} style={styles.image} />
        {imageCount && (
          <View style={styles.imageCount}>
            <Typo variant="caption">{imageCount}</Typo>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Typo variant="subheading">{title}</Typo>

        <View style={styles.locationRow}>
          <Icon name="location-outline" size={14} />
          <Typo variant="caption">{location}</Typo>
        </View>

        <View style={styles.tags}>
          {tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Typo variant="caption">{tag}</Typo>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
