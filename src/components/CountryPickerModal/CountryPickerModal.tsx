import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, FlatList, Modal } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { Country } from '@/services/country.service';
import { getFlagEmoji } from '@/helpers/countryFlag';
import styles from './styles';

type Props = {
  visible: boolean;
  countries: Country[];
  selected?: Country;
  onClose: () => void;
  onSelect: (country: Country) => void;
};

export const CountryPickerModal = ({
  visible,
  countries,
  selected,
  onClose,
  onSelect,
}: Props) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, countries]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScreenWrapper>
        {/* HEADER */}
        <View style={styles.header}>
          <Typo variant="heading">Select country</Typo>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={26} />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <AppInput
          placeholder="Search country"
          value={query}
          onChangeText={setQuery}
        />

        <FlatList
          data={filtered}
          keyExtractor={item => item.code}
          renderItem={({ item }) => {
            const active = selected?.code === item.code;

            return (
              <TouchableOpacity
                style={[styles.item, active && styles.itemActive]}
                onPress={() => onSelect(item)}
              >
                <Typo>
                  {getFlagEmoji(item.code)} {item.name}
                </Typo>
                <Typo color="gray">{item.callingCode}</Typo>
              </TouchableOpacity>
            );
          }}
        />
      </ScreenWrapper>
    </Modal>
  );
};
