import React from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';
import { ProviderRow } from '@/components/Rental/ProviderRow/ProviderRow';
import { RentalPoint } from '@/components/Rental/RentalPoint/RentalPoint';
import { ProtectionRow } from '@/components/Rental/ProtectionRow/ProtectionRow';
import { PaymentSummaryRow } from '@/components/Rental/PaymentSummaryRow/PaymentSummaryRow';
import { CardPaymentRow } from '@/components/Rental/CardPaymentRow/CardPaymentRow';
import { HelpItem, PolicyItem } from '@/components/Rental/PolicyItem/Policy';
import { Tag } from '@/components/Rental/Tag/Tag';

type RouteParams = {
  bookingId: string;
  status?: 'in_progress' | 'completed';
};

const BookingDetailsScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation<any>();

  const { bookingId, status = 'in_progress' } = route.params || {};

  const isCompleted = status === 'completed';

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} />
          </TouchableOpacity>

          <Typo variant="subheading">Booking Details</Typo>

          <TouchableOpacity>
            <Icon name="ellipsis-horizontal" size={20} />
          </TouchableOpacity>
        </View>

        {/* IMAGE */}
        <View>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c6',
            }}
            style={styles.image}
          />

          <View style={styles.imageCounter}>
            <Typo variant="caption">1/7</Typo>
          </View>
        </View>

        {/* VEHICLE INFO */}
        <View style={styles.section}>
          <Typo style={styles.vehicleName}>Toyota RAV4</Typo>

          <View style={styles.locationRow}>
            <Icon name="location-outline" size={16} />
            <Typo variant="caption">Ogun State</Typo>
          </View>

          <View style={styles.tagsRow}>
            <Tag label="Van" />
            <Tag label="Automatic" />
            <Tag label="5" />
            <Tag label="A/C" />
            <Tag label="Unlimited Mileage" />
          </View>
        </View>

        {/* PROVIDER */}
        <ProviderRow
          name="AVIS"
          description="Professional rental service"
          verified
        />

        {/* BOOKING INFO */}
        <View style={styles.infoRow}>
          <Typo variant="caption">Booking</Typo>
          <Typo>{bookingId}</Typo>
        </View>

        {/* PICKUP CODE */}
        {!isCompleted && (
          <View style={styles.pickupCode}>
            <Typo variant="caption">Pickup Code:</Typo>
            <Typo style={styles.pickupValue}>982839477</Typo>
          </View>
        )}

        {/* RENTAL PERIOD */}
        <View style={styles.section}>
          <Typo variant="subheading">Rental Period</Typo>

          <RentalPoint
            label="Pick-Up"
            color="#22C55E"
            location="Murtala Muhammed International Airport"
            date="Tuesday, 7th January 2026"
            time="12:00"
            note="Please proceed to the SIXT counter in Terminal 1."
          />

          <RentalPoint
            label="Drop-Off"
            color="#EF4444"
            location="Murtala Muhammed International Airport"
            date="Tuesday, 7th January 2026"
            time="12:00"
          />
        </View>

        {/* PROTECTION */}
        <ProtectionRow
          title="Basic Protection"
          subtitle="Collision Damage Waiver"
          price="₦300"
        />

        {/* PAYMENT SUMMARY */}
        <View style={styles.section}>
          <Typo variant="subheading">Payment Summary</Typo>

          <PaymentSummaryRow label="Rental (1 day × $85)" amount="₦300,000" />
          <PaymentSummaryRow label="Insurance" amount="₦300" />

          <View style={styles.totalRow}>
            <Typo>Total</Typo>
            <Typo style={styles.total}>₦300,300</Typo>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <CardPaymentRow
          brand="Mastercard"
          last4="4296"
          status="Paid"
          date="Paid on 05/01/2026 14:32"
        />

        {/* DOWNLOAD RECEIPT */}
        {isCompleted && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.receiptBtn}
              onPress={() => {
                // TODO: download / open PDF
                console.log('Download receipt', bookingId);
              }}
            >
              <Icon name="download-outline" size={20} color="#0A6A4B" />
              <Typo style={styles.receiptText}>Download Receipt</Typo>
            </TouchableOpacity>
          </View>
        )}

        {/* POLICIES */}
        <View style={styles.section}>
          <Typo variant="subheading">Rental Policies</Typo>

          <PolicyItem
            title="Cancellation"
            value="Free cancellation up to 24 hours before pickup"
          />
          <PolicyItem title="Fuel Policy" value="Full to Full" />
          <PolicyItem title="Mileage" value="Unlimited mileage included" />
        </View>

        {/* CANCEL BOOKING */}
        {!isCompleted && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cancelBtn}
              onPress={() => {
                // TODO: confirm modal → call cancel API
                console.log('Cancel booking', bookingId);
              }}
            >
              <Icon name="close-circle-outline" size={20} color="#DC2626" />
              <Typo style={styles.cancelText}>Cancel Booking</Typo>
            </TouchableOpacity>
          </View>
        )}

        {/* HELP */}
        {!isCompleted && (
          <View style={styles.section}>
            <Typo variant="subheading">Need Help?</Typo>

            <HelpItem icon="call-outline" label="Call SIXT" />
            <HelpItem icon="mail-outline" label="Email Support" />
            <HelpItem icon="navigate-outline" label="Get Directions" />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default BookingDetailsScreen;
