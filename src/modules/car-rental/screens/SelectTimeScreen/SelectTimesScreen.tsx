import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import styles from './styles';
import { formatTime, generateTimes } from '@/helpers/dateTime';

const TIME_GROUPS = [
  { label: 'Early morning', times: generateTimes(0, 5) },
  { label: 'Morning', times: generateTimes(6, 11) },
  { label: 'Afternoon', times: generateTimes(12, 16) },
  { label: 'Evening', times: generateTimes(17, 23) },
];

const SelectTimesScreen = ({ navigation, route }: any) => {
  const initialPickupTime = route?.params?.pickupTime
    ? new Date(route.params.pickupTime)
    : new Date();
  const initialReturnTime = route?.params?.returnTime
    ? new Date(route.params.returnTime)
    : new Date();

  const [activeTab, setActiveTab] = useState<'pickup' | 'return'>('pickup');
  const [pickupTime, setPickupTime] = useState<Date>(initialPickupTime);
  const [returnTime, setReturnTime] = useState<Date>(initialReturnTime);

  const applyTime = (base: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(base);
    next.setHours(hours, minutes, 0, 0);
    return next;
  };

  const getTimeKey = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        {(['pickup', 'return'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Typo variant="caption" style={styles.tabLabel}>
              {tab === 'pickup' ? 'Pickup' : 'Return'}
            </Typo>
            <Typo>
              {tab === 'pickup' ? formatTime(pickupTime) : formatTime(returnTime)}
            </Typo>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {TIME_GROUPS.map(group => (
          <View key={group.label}>
            <Typo style={styles.groupTitle}>{group.label}</Typo>

            <View style={styles.timeGrid}>
              {group.times.map(time => {
                const selected =
                  (activeTab === 'pickup' && getTimeKey(pickupTime) === time) ||
                  (activeTab === 'return' && getTimeKey(returnTime) === time);

                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeChip, selected && styles.activeTime]}
                    onPress={() =>
                      activeTab === 'pickup'
                        ? setPickupTime(applyTime(pickupTime, time))
                        : setReturnTime(applyTime(returnTime, time))
                    }
                  >
                    <Typo>{time}</Typo>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <AppButton
        title="Select times"
        onPress={() =>
          navigation.navigate('SearchLocation', {
            pickupTime: pickupTime.toISOString(),
            returnTime: returnTime.toISOString(),
          })
        }
      />
    </ScreenWrapper>
  );
};

export default SelectTimesScreen;
