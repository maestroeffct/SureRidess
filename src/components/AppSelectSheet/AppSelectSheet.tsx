import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { AppBottomSheet } from '@/components/AppBottomSheet/AppBottomSheet';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';

export type SelectOption = {
  label: string;
  value: string;
  /** Optional left decoration: emoji or icon name */
  prefix?: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selected?: string;
  onClose: () => void;
  onSelect: (option: SelectOption) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  heightFactor?: number;
};

export function AppSelectSheet({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
  searchable = true,
  searchPlaceholder = 'Search...',
  heightFactor,
}: Props) {
  const { mode, colors } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, options]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (option: SelectOption) => {
    setQuery('');
    onSelect(option);
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={handleClose}
      heightFactor={heightFactor ?? (searchable ? 0.72 : 0.55)}
    >
      {/* HEADER */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Typo style={[styles.title, { color: colors.textPrimary }]}>{title}</Typo>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      {searchable && (
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: mode === 'dark' ? colors.background : '#F9FAFB',
              borderColor: colors.border,
            },
          ]}
        >
          <Icon name="search-outline" size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.value}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typo variant="caption" style={{ color: colors.textSecondary }}>
              No results found
            </Typo>
          </View>
        }
        renderItem={({ item, index }) => {
          const isActive = selected === item.value;
          const isLast = index === filtered.length - 1;

          return (
            <TouchableOpacity
              style={[
                styles.item,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                {item.prefix ? (
                  <Typo style={styles.prefix}>{item.prefix}</Typo>
                ) : null}
                <Typo
                  style={[
                    styles.itemLabel,
                    { color: colors.textPrimary },
                    isActive && styles.itemLabelActive,
                  ]}
                >
                  {item.label}
                </Typo>
              </View>

              {isActive && (
                <Icon name="checkmark-circle" size={20} color="#0A6A4B" />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  prefix: {
    fontSize: 18,
  },
  itemLabel: {
    fontSize: 15,
  },
  itemLabelActive: {
    color: '#0A6A4B',
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
