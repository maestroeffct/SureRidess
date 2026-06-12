import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import Icon from '@react-native-vector-icons/ionicons';

const GREEN = '#0A6A4B';
const GREEN_LIGHT = '#E6F4EF';

export type FilterState = {
  sort: 'price_asc' | 'price_desc' | null;
  transmission: 'AUTOMATIC' | 'MANUAL' | null;
  ac: boolean | null;
  seats: number | null;
};

export const DEFAULT_FILTERS: FilterState = {
  sort: null,
  transmission: null,
  ac: null,
  seats: null,
};

type Props = {
  visible: boolean;
  initial: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
};

type OptionChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

const OptionChip: React.FC<OptionChipProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[c.chip, active && c.chipActive]}
    onPress={onPress}
  >
    {active && (
      <Icon name="checkmark" size={13} color={GREEN} style={c.chipIcon} />
    )}
    <Typo style={[c.chipText, active && c.chipTextActive]}>{label}</Typo>
  </TouchableOpacity>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Typo style={c.sectionTitle}>{title}</Typo>
);

const SEAT_OPTIONS = [2, 4, 5, 7, 9];

export const FilterModal: React.FC<Props> = ({
  visible,
  initial,
  onApply,
  onClose,
}) => {
  const [filters, setFilters] = useState<FilterState>(initial);

  const update = <K extends keyof FilterState>(
    key: K,
    val: FilterState[K],
  ) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === val ? null : val }));
  };

  const handleApply = () => onApply(filters);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const activeCount = [
    filters.sort,
    filters.transmission,
    filters.ac,
    filters.seats,
  ].filter(v => v !== null).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={c.overlay}>
        <View style={c.sheet}>
          {/* Header */}
          <View style={c.header}>
            <Typo style={c.title}>Filter & Sort</Typo>
            {activeCount > 0 && (
              <TouchableOpacity onPress={handleReset}>
                <Typo style={c.resetText}>Reset all</Typo>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={c.closeBtn} onPress={onClose}>
              <Icon name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={c.content}
          >
            {/* Sort */}
            <SectionHeader title="Sort by Price" />
            <View style={c.chipRow}>
              <OptionChip
                label="Low to High"
                active={filters.sort === 'price_asc'}
                onPress={() => update('sort', 'price_asc')}
              />
              <OptionChip
                label="High to Low"
                active={filters.sort === 'price_desc'}
                onPress={() => update('sort', 'price_desc')}
              />
            </View>

            <View style={c.divider} />

            {/* Transmission */}
            <SectionHeader title="Transmission" />
            <View style={c.chipRow}>
              <OptionChip
                label="Automatic"
                active={filters.transmission === 'AUTOMATIC'}
                onPress={() => update('transmission', 'AUTOMATIC')}
              />
              <OptionChip
                label="Manual"
                active={filters.transmission === 'MANUAL'}
                onPress={() => update('transmission', 'MANUAL')}
              />
            </View>

            <View style={c.divider} />

            {/* Air Conditioning */}
            <SectionHeader title="Air Conditioning" />
            <View style={c.chipRow}>
              <OptionChip
                label="With AC"
                active={filters.ac === true}
                onPress={() => update('ac', true)}
              />
              <OptionChip
                label="Without AC"
                active={filters.ac === false}
                onPress={() => update('ac', false)}
              />
            </View>

            <View style={c.divider} />

            {/* Seats */}
            <SectionHeader title="Min. Seats" />
            <View style={c.chipRow}>
              {SEAT_OPTIONS.map(n => (
                <OptionChip
                  key={n}
                  label={`${n}+`}
                  active={filters.seats === n}
                  onPress={() => update('seats', n)}
                />
              ))}
            </View>
          </ScrollView>

          {/* Apply */}
          <View style={c.footer}>
            <TouchableOpacity style={c.applyBtn} onPress={handleApply}>
              <Typo style={c.applyText}>
                Apply{activeCount > 0 ? ` (${activeCount})` : ''}
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const c = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111' },
  resetText: { fontSize: 13, color: GREEN, fontWeight: '600' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    gap: 4,
  },
  chipActive: {
    borderColor: GREEN,
    backgroundColor: GREEN_LIGHT,
  },
  chipIcon: {},
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: GREEN, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  applyBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
