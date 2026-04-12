import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useNavigation } from '@react-navigation/native';
import styles from './styles';
import { KYCStepHeader } from '@/components/kyc/KYCStepHeader/KYCStepHeader';
import { KYCInfoAlert } from '@/components/kyc/KYCInfoAlert/KYCInfoAlert';
import { AppInput } from '@/components/AppInput/Input';
import { Typo } from '@/components/AppText/Typo';
import { useAuth, type User } from '@/providers/AuthProvider';
import { fetchMe } from '@/services/user.service';
import { fetchCountries, type Country } from '@/services/country.service';
import { showError, showSuccess } from '@/helpers/toast';
import { getFlagEmoji } from '@/helpers/countryFlag';
import { useTheme } from '@/theme/ThemeProvider';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import { isValidEmail } from '@/helpers/validation';
import { saveKycPersonalInfo } from '@/services/kyc.service';

function toDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function resolvePhoneNumber(user?: User | null) {
  if (!user) return '';

  const candidates = [user.phone, user.phoneNumber, user.phoneCountry]
    .filter(Boolean)
    .map(value => String(value).trim())
    .filter(Boolean);

  if (!candidates.length) return '';

  return candidates.sort((a, b) => b.length - a.length)[0];
}

function applyUserToForm(
  user: User,
  setters: {
    setFirstName: (v: string) => void;
    setLastName: (v: string) => void;
    setEmail: (v: string) => void;
    setDob: (v: Date | null) => void;
    setNationality: (v: string) => void;
    setPhone: (v: string) => void;
  },
) {
  const nationality = user.nationality || user.country || '';

  setters.setFirstName(user.firstName || '');
  setters.setLastName(user.lastName || '');
  setters.setEmail(user.email || '');
  setters.setDob(toDate(user.dateOfBirth || user.dob));
  setters.setNationality(nationality);
  setters.setPhone(resolvePhoneNumber(user));
}

export default function PersonalInfoScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phone, setPhone] = useState('');

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [nationality, setNationality] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCountries = useMemo(
    () => countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [countries, search],
  );

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => showError('Failed to load country list'));
  }, []);

  useEffect(() => {
    if (!user) return;

    applyUserToForm(user, {
      setFirstName,
      setLastName,
      setEmail,
      setDob,
      setNationality,
      setPhone,
    });
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const hydrateFromDb = async () => {
      try {
        const me = await fetchMe();
        if (!mounted || !me) return;

        applyUserToForm(me, {
          setFirstName,
          setLastName,
          setEmail,
          setDob,
          setNationality,
          setPhone,
        });
      } catch (error) {
        if (__DEV__) {
          console.log('[KYC][PersonalInfo] Failed to preload /auth/me', error);
        }
      }
    };

    hydrateFromDb();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!nationality || !countries.length) return;

    const match = countries.find(
      c => c.name.toLowerCase() === nationality.toLowerCase(),
    );

    if (match) {
      setSelectedCountry(match);
    }
  }, [countries, nationality]);

  const handleNext = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError('First name and last name are required');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showError('Please enter a valid email');
      return;
    }

    if (!dob) {
      showError('Please select date of birth');
      return;
    }

    const resolvedNationality = selectedCountry?.name || nationality.trim();
    if (!resolvedNationality) {
      showError('Please select nationality');
      return;
    }

    if (!phone.trim()) {
      showError('Please enter phone number');
      return;
    }

    let phoneCountry = selectedCountry?.callingCode || user?.phoneCountry || '+234';
    let phoneValue = phone.replace(/\s+/g, '');

    if (phoneValue.startsWith('+')) {
      if (phoneValue.startsWith(phoneCountry)) {
        phoneValue = phoneValue.slice(phoneCountry.length);
      } else {
        const matchedCountry = [...countries]
          .sort((a, b) => b.callingCode.length - a.callingCode.length)
          .find(c => phoneValue.startsWith(c.callingCode));

        if (matchedCountry) {
          phoneCountry = matchedCountry.callingCode;
          phoneValue = phoneValue.slice(matchedCountry.callingCode.length);
          setSelectedCountry(matchedCountry);
          setNationality(matchedCountry.name);
        }
      }
    }

    const phoneNumber = phoneValue.replace(/\D/g, '');
    if (!phoneNumber) {
      showError('Please enter a valid phone number');
      return;
    }

    try {
      setSaving(true);

      await saveKycPersonalInfo({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth: dob.toISOString().slice(0, 10),
        nationality: resolvedNationality,
        phoneCountry,
        phoneNumber,
      });

      showSuccess('Personal info saved');

      navigation.navigate('Address', {
        countryName: selectedCountry?.name || resolvedNationality,
        countryCode: selectedCountry?.code || null,
      });
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to save personal info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <KYCStepHeader
        step={1}
        title="Personal Information"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <KYCInfoAlert message="Your personal information must match your government-issued ID" />

        <View style={styles.inputSpacing}>
          <AppInput
            label="First Name"
            placeholder="Enter first name"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Last Name"
            placeholder="Enter last name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Email Address"
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Date of Birth"
            placeholder="Select date"
            value={dob ? dob.toDateString() : ''}
            editable={false}
            rightIcon={
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Icon
                  name="calendar-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dob ?? new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setDob(date);
            }}
          />
        )}

        <View style={styles.inputSpacing}>
          <AppInput
            label="Nationality"
            placeholder={
              selectedCountry
                ? getFlagEmoji(selectedCountry.code) + ' ' + selectedCountry.name
                : nationality || 'Select country'
            }
            editable={false}
            leftIcon={
              <TouchableOpacity onPress={() => setShowCountryModal(true)}>
                <Icon
                  name="chevron-down"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Phone Number"
            placeholder="+234..."
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <AppButton
          title="Next"
          style={styles.buttonSpacing}
          loading={saving}
          onPress={handleNext}
        />
      </ScrollView>

      <AppSelectSheet
        visible={showCountryModal}
        title="Select Nationality"
        searchPlaceholder="Search country..."
        options={filteredCountries.map(c => ({
          label: c.name,
          value: c.code,
          prefix: getFlagEmoji(c.code),
        }))}
        selected={selectedCountry?.code}
        onClose={() => setShowCountryModal(false)}
        onSelect={opt => {
          const match = countries.find(c => c.code === opt.value);
          if (match) {
            setSelectedCountry(match);
            setNationality(match.name);
          }
          setShowCountryModal(false);
          setSearch('');
        }}
      />
    </ScreenWrapper>
  );
}
