import React, { useMemo } from 'react';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import { Country } from '@/services/country.service';
import { getFlagEmoji } from '@/helpers/countryFlag';

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
  const options = useMemo(
    () =>
      countries.map(c => ({
        label: c.name,
        value: c.code,
        prefix: getFlagEmoji(c.code),
      })),
    [countries],
  );

  return (
    <AppSelectSheet
      visible={visible}
      title="Select Country"
      options={options}
      selected={selected?.code}
      searchPlaceholder="Search country..."
      onClose={onClose}
      onSelect={opt => {
        const country = countries.find(c => c.code === opt.value);
        if (country) onSelect(country);
      }}
    />
  );
};
