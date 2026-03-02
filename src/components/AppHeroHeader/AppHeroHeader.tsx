import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  title?: string;
  subtitle?: string;
  description?: string;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
  avatarText?: string;
  titleText?: string;
};

export const AppHeroHeader = ({
  title,
  subtitle,
  description,
  titleText,
  avatarText = 'JA',
  onBellPress,
  onAvatarPress,
}: Props) => {
  return (
    <>
      <View style={styles.heroBackground} />

      <View style={styles.hero}>
        {/* TOP LEFT */}
        {titleText && (
          <View style={styles.topLeft}>
            <Typo variant="heading" style={styles.title}>
              {titleText}
            </Typo>
          </View>
        )}

        {/* TOP RIGHT */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBellPress}>
            <Icon name="notifications-outline" size={24} color="#fff" />
            <View style={styles.dot} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatar} onPress={onAvatarPress}>
            <Typo style={styles.avatarText}>{avatarText}</Typo>
          </TouchableOpacity>
        </View>

        {/* TEXT */}
        {subtitle && <Typo style={styles.subtitle}>{subtitle}</Typo>}
        <Typo style={styles.title}>{title}</Typo>

        {description && (
          <Typo variant="caption" style={styles.description}>
            {description}
          </Typo>
        )}
      </View>
    </>
  );
};
