import React from 'react';
import { ScrollView, TouchableOpacity, Image } from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type CategoryItem = {
  label: string;
  image?: string;
};

type Props = {
  categories: CategoryItem[];
  selected: string | null;
  onSelect: (category: string) => void;
};

export function CategoryChips({ categories, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {categories.map(category => {
        const isActive = selected === category.label;

        return (
          <TouchableOpacity
            key={category.label}
            style={[styles.chip, isActive && styles.activeChip]}
            onPress={() => onSelect(category.label)}
          >
            {category.image && (
              <Image
                source={{ uri: category.image }}
                style={styles.chipImage}
                resizeMode="contain"
              />
            )}

            <Typo style={[styles.chipText, isActive && styles.activeChipText]}>
              {category.label}
            </Typo>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
