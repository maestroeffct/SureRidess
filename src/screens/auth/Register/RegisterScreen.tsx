import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, FlatList } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { useTheme } from '@/theme/ThemeProvider';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { AppInput } from '@/components/AppInput/Input';
import styles from './styles';

import { fetchCountries } from '@/services/country.service';
import { showError, showSuccess } from '@/helpers/toast';
import {
  getPasswordStrength,
  getStrengthColor,
  isValidEmail,
} from '@/helpers/validation';
import { registerUser } from '@/services/auth.service';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';

/* ---------------- TYPES ---------------- */
export type Country = {
  name: string;
  callingCode: string;
};

/* ---------------- SCREEN ---------------- */
export function RegisterScreen() {
  const { colors } = useTheme();

  const [showPassword, setShowPassword] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [phoneCode, setPhoneCode] = useState('+234');

  const [phoneNumber, setPhoneNumber] = useState('');

  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showCountryModal, setShowCountryModal] = useState(false);

  const [search, setSearch] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const passwordStrength = getPasswordStrength(password);

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const [loading, setLoading] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  /* ---------------- LOAD COUNTRIES ---------------- */
  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => showError('Failed to load country list'));
  }, []);

  /* ---------------- SUBMIT ---------------- */
  const handleRegister = async () => {
    if (!isValidEmail(email)) {
      showError('Invalid email');
      return;
    }

    if (passwordStrength === 'weak') {
      showError('Password too weak');
      return;
    }

    if (!dob || !selectedCountry) {
      showError('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);

      const res = await registerUser({
        firstName,
        lastName,
        email,
        password,
        phone: `${phoneCode}${phoneNumber}`,
        country: selectedCountry.name,
        dob: dob.toISOString(),
      });

      // ✅ backend returns token

      showSuccess('Account created successfully');

      // ✅ Navigate to Login AFTER success
      setTimeout(() => {
        navigation.replace('Login');
      }, 500);
      // login(res.accessToken);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable showBack>
      {/* Header */}
      <View style={styles.header}>
        <Typo variant="heading">Create Account</Typo>
        <Typo variant="body">Sign up to start renting verified cars.</Typo>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <AppInput
          label="First Name"
          placeholder="Jola"
          value={firstName}
          onChangeText={setFirstName}
        />

        <AppInput
          label="Last Name"
          placeholder="Akin"
          value={lastName}
          onChangeText={setLastName}
        />

        <AppInput
          label="Email Address"
          placeholder="jolaakin@gmail.com"
          value={email}
          onChangeText={setEmail}
          error={
            email.length > 0 && !isValidEmail(email)
              ? 'Invalid email address'
              : undefined
          }
        />

        {/* DOB */}
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

        {/* Nationality */}
        <AppInput
          label="Nationality"
          placeholder={selectedCountry?.name ?? 'Select country'}
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

        {/* Phone */}
        <View>
          <Typo variant="caption" style={{ marginBottom: 6 }}>
            Phone Number
          </Typo>

          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={[
                styles.countryCode,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => setShowCountryModal(true)}
            >
              <Typo>{phoneCode}</Typo>
              <Icon
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <AppInput
                placeholder="8128903046"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>
        </View>

        {/* Password */}
        <AppInput
          label="Password"
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={{
            borderColor:
              password.length > 0
                ? getStrengthColor(passwordStrength, colors)
                : colors.border,
          }}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        {password.length > 0 && (
          <Typo
            variant="caption"
            color={getStrengthColor(passwordStrength, colors)}
          >
            Password strength: {passwordStrength}
          </Typo>
        )}
      </View>

      {/* Terms */}
      <View style={styles.terms}>
        <Typo variant="caption">
          Signing up to Sureride account means you agree the{' '}
          <Typo color={colors.primary}>Privacy Policy</Typo> and{' '}
          <Typo color={colors.primary}>Terms of Service</Typo>
        </Typo>
      </View>

      {/* Actions */}
      <AppButton
        title="Create Account"
        loading={loading}
        onPress={handleRegister}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Typo variant="caption">Have an account?</Typo>

        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Typo variant="caption" color={colors.primary} style={styles.signIn}>
            Sign In
          </Typo>
        </TouchableOpacity>
      </View>

      {/* COUNTRY MODAL */}
      <Modal visible={showCountryModal} animationType="slide">
        <ScreenWrapper>
          {/* Search */}
          <AppInput
            placeholder="Search country"
            value={search}
            onChangeText={setSearch}
            leftIcon={
              <Icon
                name="search-outline"
                size={18}
                color={colors.textSecondary}
              />
            }
          />

          {/* List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.name}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ paddingVertical: 14 }}
                onPress={() => {
                  setSelectedCountry(item);
                  setPhoneCode(item.callingCode);
                  setShowCountryModal(false);
                  setSearch('');
                }}
              >
                <Typo>{item.name}</Typo>
                <Typo variant="caption">{item.callingCode}</Typo>
              </TouchableOpacity>
            )}
          />
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
}
