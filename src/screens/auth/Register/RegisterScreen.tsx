import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, FlatList, Text } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { useTheme } from '@/theme/ThemeProvider';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { AppInput } from '@/components/AppInput/Input';
import styles from './styles';

import { fetchCountries, type Country } from '@/services/country.service';
import { showError, showSuccess } from '@/helpers/toast';
import {
  getPasswordStrength,
  getStrengthColor,
  isValidEmail,
} from '@/helpers/validation';
import { getFlagEmoji } from '@/helpers/countryFlag';
import { registerUser } from '@/services/auth.service';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';
import { useAuth } from '@/providers/AuthProvider';
import {
  getGoogleAuthErrorMessage,
  signInOrSignUpWithGoogle,
} from '@/services/socialAuth.service';

/* ---------------- SCREEN ---------------- */
export function RegisterScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();

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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      const res = await signInOrSignUpWithGoogle();
      await login(res.token, res.user);

      if (res.isNewUser || res.needsProfileCompletion) {
        showSuccess('Account created with Google. Complete your profile to continue.');
        return;
      }

      showSuccess('Signed in with Google');
    } catch (error) {
      showError(getGoogleAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
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
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Date of Birth"
              placeholder="Select date"
              value={dob ? dob.toDateString() : ''}
              editable={false}
              rightIcon={
                <Icon
                  name="calendar-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              }
            />
          </View>
        </TouchableOpacity>

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
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowCountryModal(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Nationality"
              placeholder="Select country"
              value={selectedCountry ? selectedCountry.name : ''}
              editable={false}
              leftIcon={
                selectedCountry ? (
                  <Text style={{ fontSize: 18 }}>
                    {getFlagEmoji(selectedCountry.code)}
                  </Text>
                ) : undefined
              }
              rightIcon={
                <Icon
                  name="chevron-down"
                  size={18}
                  color={colors.textSecondary}
                />
              }
            />
          </View>
        </TouchableOpacity>

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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {selectedCountry ? (
                  <Text style={{ fontSize: 16, marginRight: 6 }}>
                    {getFlagEmoji(selectedCountry.code)}
                  </Text>
                ) : null}
                <Typo>{phoneCode}</Typo>
              </View>
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

      <AppButton
        title="Continue with Google"
        variant="outline"
        loading={googleLoading}
        onPress={handleGoogleAuth}
        style={styles.googleBtn}
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>
                    {getFlagEmoji(item.code)}
                  </Text>
                  <View>
                    <Typo>{item.name}</Typo>
                    <Typo variant="caption">{item.callingCode}</Typo>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
}
