import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import dayjs from 'dayjs';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import styles from './styles';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SelectDatesScreen = ({ navigation, route }: any) => {
  const initialPickupDate = route?.params?.pickupDate
    ? new Date(route.params.pickupDate)
    : new Date();
  const initialReturnDate = route?.params?.returnDate
    ? new Date(route.params.returnDate)
    : null;

  const [activeTab, setActiveTab] = useState<'pickup' | 'return'>('pickup');
  const [pickupDate, setPickupDate] = useState<Date | null>(initialPickupDate);
  const [returnDate, setReturnDate] = useState<Date | null>(initialReturnDate);

  const renderMonth = (monthOffset: number) => {
    const month = dayjs().add(monthOffset, 'month');
    const startOfMonth = month.startOf('month');
    const daysInMonth = month.daysInMonth();

    const emptyDays = startOfMonth.day();
    const days = [...Array(daysInMonth)].map((_, i) =>
      month.date(i + 1).toDate(),
    );

    return (
      <View key={monthOffset} style={styles.monthBlock}>
        <Typo style={styles.monthTitle}>{month.format('MMMM YYYY')}</Typo>

        <View style={styles.weekRow}>
          {WEEK_DAYS.map(d => (
            <Typo key={d} style={styles.weekDay}>
              {d}
            </Typo>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {[...Array(emptyDays)].map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}

          {days.map(date => {
            const isPickup =
              pickupDate && dayjs(date).isSame(pickupDate, 'day');
            const isReturn =
              returnDate && dayjs(date).isSame(returnDate, 'day');

            const isPast = dayjs(date).isBefore(dayjs(), 'day');
            const disabled =
              isPast ||
              !!(
                activeTab === 'return' &&
                pickupDate &&
                dayjs(date).isBefore(pickupDate, 'day')
              );

            return (
              <TouchableOpacity
                key={date.toString()}
                disabled={disabled}
                style={[
                  styles.dayCell,
                  (isPickup || isReturn) && styles.activeDay,
                  disabled && styles.disabledDay,
                ]}
                onPress={() => {
                  if (activeTab === 'pickup') {
                    setPickupDate(date);
                    setActiveTab('return');
                  } else {
                    setReturnDate(date);
                  }
                }}
              >
                <Typo>{dayjs(date).date()}</Typo>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
      </View>

      {/* PICKUP / RETURN TABS */}
      <View style={styles.tabRow}>
        {(['pickup', 'return'] as const).map(tab => {
          const date = tab === 'pickup' ? pickupDate : returnDate;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Typo variant="caption" style={styles.tabLabel}>
                {tab === 'pickup' ? 'Pickup' : 'Return'}
              </Typo>
              <Typo variant="subheading">
                {date ? dayjs(date).format('MMM D') : '—'}
              </Typo>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderMonth(0)}
        {renderMonth(1)}
        {renderMonth(2)}
      </ScrollView>

      <AppButton
        title="Select dates"
        disabled={!pickupDate || !returnDate}
        onPress={() => {
          if (!pickupDate || !returnDate) return;

          navigation.navigate('SearchLocation', {
            pickupDate: pickupDate.toISOString(),
            returnDate: returnDate.toISOString(),
          });
        }}
      />
    </ScreenWrapper>
  );
};

export default SelectDatesScreen;
