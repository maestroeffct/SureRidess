import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import { fetchCountries, type Country } from '@/services/country.service';
import {
  getPasswordStrength,
  getStrengthColor,
  isValidEmail,
} from '@/helpers/validation';
import { getFlagEmoji } from '@/helpers/countryFlag';
import { registerUser } from '@/services/auth.service';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';
import {
  getGoogleAuthErrorMessage,
  signInWithGoogle,
} from '@/services/socialAuth.service';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => showError('Failed to load country list'));
  }, []);

  const handleRegister = async () => {
    if (!isValidEmail(email)) { showError('Invalid email'); return; }
    if (passwordStrength === 'weak') { showError('Password too weak'); return; }
    if (!dob || !selectedCountry) { showError('Please complete all required fields'); return; }

    try {
      setLoading(true);
      await registerUser({
        firstName,
        lastName,
        email,
        password,
        phone: `${phoneCode}${phoneNumber}`,
        country: selectedCountry.name,
        dob: dob.toISOString(),
      });
      showSuccess('Account created successfully');
      setTimeout(() => navigation.replace('Login'), 500);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      const res = await signInWithGoogle();
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A6A4B" />

      {/* ── GREEN HERO ── */}
      <View style={s.hero}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={s.heroCenter}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
          <Typo style={s.logoName}>SURERIDE</Typo>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── FORM CARD ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[s.card, { backgroundColor: colors.background }]}
          contentContainerStyle={s.cardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Typo style={[s.formTitle, { color: colors.textPrimary }]}>Create Account</Typo>
          <Typo style={[s.formSub, { color: colors.textSecondary }]}>
            Sign up to start renting verified cars
          </Typo>

          <View style={s.form}>
            {/* Name row */}
            <View style={s.nameRow}>
              <View style={{ flex: 1 }}>
                <AppInput label="First Name" placeholder="John" value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Last Name" placeholder="Doe" value={lastName} onChangeText={setLastName} />
              </View>
            </View>

            <AppInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={email.length > 0 && !isValidEmail(email) ? 'Invalid email address' : undefined}
            />

            {/* Date of Birth */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <AppInput
                  label="Date of Birth"
                  placeholder="Select date"
                  value={dob ? dob.toDateString() : ''}
                  editable={false}
                  rightIcon={<Icon name="calendar-outline" size={20} color={colors.textSecondary} />}
                />
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dob ?? new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={(_, date) => { setShowDatePicker(false); if (date) setDob(date); }}
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
                  leftIcon={selectedCountry ? <Text style={{ fontSize: 18 }}>{getFlagEmoji(selectedCountry.code)}</Text> : undefined}
                  rightIcon={<Icon name="chevron-down" size={18} color={colors.textSecondary} />}
                />
              </View>
            </TouchableOpacity>

            {/* Phone */}
            <View>
              <Typo style={[s.phoneLabel, { color: colors.textSecondary }]}>Phone Number</Typo>
              <View style={s.phoneRow}>
                <TouchableOpacity
                  style={[s.codeBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => setShowCountryModal(true)}
                >
                  {selectedCountry ? (
                    <Text style={{ fontSize: 16, marginRight: 4 }}>{getFlagEmoji(selectedCountry.code)}</Text>
                  ) : null}
                  <Typo style={{ color: colors.textPrimary }}>{phoneCode}</Typo>
                  <Icon name="chevron-down" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <AppInput placeholder="8012345678" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                </View>
              </View>
            </View>

            {/* Password */}
            <AppInput
              label="Password"
              placeholder="Min 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={{ borderColor: password.length > 0 ? getStrengthColor(passwordStrength, colors) : colors.border }}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              }
            />
            {password.length > 0 && (
              <View style={s.strengthRow}>
                <View style={[s.strengthBar, { backgroundColor: colors.border }]}>
                  <View style={[
                    s.strengthFill,
                    {
                      width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                      backgroundColor: getStrengthColor(passwordStrength, colors),
                    },
                  ]} />
                </View>
                <Typo style={[s.strengthText, { color: getStrengthColor(passwordStrength, colors) }]}>
                  {passwordStrength}
                </Typo>
              </View>
            )}
          </View>

          {/* Terms */}
          <Typo style={[s.terms, { color: colors.textSecondary }]}>
            By signing up you agree to our{' '}
            <Typo style={s.termsLink}>Privacy Policy</Typo>
            {' '}and{' '}
            <Typo style={s.termsLink}>Terms of Service</Typo>
          </Typo>

          <AppButton title={loading ? 'Creating Account…' : 'Create Account'} loading={loading} onPress={handleRegister} />

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Typo style={[s.dividerText, { color: colors.textSecondary }]}>or</Typo>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[s.googleBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleGoogleAuth}
            activeOpacity={0.8}
            disabled={googleLoading}
          >
            <Image source={require('@/assets/images/google-logo.png')} style={s.googleIcon} />
            <Typo style={[s.googleText, { color: colors.textPrimary }]}>
              {googleLoading ? 'Please wait…' : 'Continue with Google'}
            </Typo>
          </TouchableOpacity>

          <View style={s.footer}>
            <Typo style={[s.footerText, { color: colors.textSecondary }]}>Already have an account? </Typo>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Typo style={s.footerLink}>Sign In</Typo>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── COUNTRY MODAL ── */}
      <Modal visible={showCountryModal} animationType="slide">
        <SafeAreaView style={[s.modalSafe, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Typo style={[s.modalTitle, { color: colors.textPrimary }]}>Select Country</Typo>
            <TouchableOpacity onPress={() => { setShowCountryModal(false); setSearch(''); }}>
              <Icon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={[s.modalSearch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              placeholder="Search country"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              style={[s.modalSearchInput, { color: colors.textPrimary }]}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.name}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.countryRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedCountry(item);
                  setPhoneCode(item.callingCode);
                  setShowCountryModal(false);
                  setSearch('');
                }}
              >
                <Text style={{ fontSize: 22, marginRight: 12 }}>{getFlagEmoji(item.code)}</Text>
                <View style={{ flex: 1 }}>
                  <Typo style={{ color: colors.textPrimary }}>{item.name}</Typo>
                  <Typo style={{ color: colors.textSecondary, fontSize: 12 }}>{item.callingCode}</Typo>
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A6A4B' },

  /* hero */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg: { width: 30, height: 30 },
  logoName: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  /* card */
  card: { borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 1 },
  cardContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48 },
  formTitle: { fontSize: 22, fontWeight: '700' },
  formSub: { fontSize: 14, marginTop: 4, marginBottom: 20 },

  /* form */
  form: { gap: 14, marginBottom: 16 },
  nameRow: { flexDirection: 'row', gap: 10 },
  phoneLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 52, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
  },

  /* strength */
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  /* terms */
  terms: { fontSize: 12, marginBottom: 16, lineHeight: 18 },
  termsLink: { color: '#0A6A4B', fontWeight: '600', fontSize: 12 },

  /* divider */
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },

  /* google */
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 14, borderWidth: 1, gap: 10,
  },
  googleIcon: { width: 22, height: 22, resizeMode: 'contain' },
  googleText: { fontSize: 15, fontWeight: '500' },

  /* footer */
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700', color: '#0A6A4B' },

  /* country modal */
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, height: 48,
  },
  modalSearchInput: {
    flex: 1, fontSize: 14, padding: 0, margin: 0, height: '100%',
  },
  countryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
  },
});
