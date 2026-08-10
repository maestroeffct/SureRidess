import React, { useEffect, useMemo, useState } from 'react';
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
import { fetchCountries, type Country } from '@/services/country.service';
import { getFlagEmoji } from '@/helpers/countryFlag';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import { loginUser } from '@/services/auth.service';
import { DEV_AUTH_ENABLED, DEV_TEST_CREDENTIALS } from '@/config/devAuth';
import {
  getGoogleAuthErrorMessage,
  signInWithGoogle,
} from '@/services/socialAuth.service';
import { sendPhoneOtp } from '@/services/firebasePhoneAuth.service';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';

type LoginMode = 'email' | 'phone';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [mode, setMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneCode, setPhoneCode] = useState('+234');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  // Country picker (matches Register screen)
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    fetchCountries()
      .then(list => {
        setCountries(list);
        // Default to Nigeria so the +234 placeholder matches
        const ng = list.find(c => c.code === 'NG') ?? list[0];
        if (ng) {
          setSelectedCountry(ng);
          setPhoneCode(ng.callingCode);
        }
      })
      .catch(() => {/* silent — user can still type the code */});
  }, []);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      c => c.name.toLowerCase().includes(q) || c.callingCode.includes(q),
    );
  }, [countrySearch, countries]);

  useEffect(() => {
    if (__DEV__) {
      setEmail('test@sureride.dev');
      setPassword('password123');
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);

      if (
        DEV_AUTH_ENABLED &&
        email === DEV_TEST_CREDENTIALS.email &&
        password === DEV_TEST_CREDENTIALS.password
      ) {
        login(DEV_TEST_CREDENTIALS.token, DEV_TEST_CREDENTIALS.user);
        showSuccess('Logged in with test account');
        return;
      }

      const res = await loginUser({ email, password });
      login(res.token, res.user);
    } catch (err: any) {
      if (
        err?.response?.status === 403 &&
        err?.response?.data?.status === 'verification_required'
      ) {
        setTimeout(() => showSuccess('Please verify your email to continue'), 500);
        navigation.navigate('VerifyOtp', {
          userId: err.response.data.userId,
          email,
        });
        return;
      }
      showError(err?.response?.data?.message || 'Login failed');
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
        showSuccess('Signed in with Google. Complete your profile to continue.');
        return;
      }
      showSuccess('Signed in with Google');
    } catch (error) {
      showError(getGoogleAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    const localPart = phoneNumber.replace(/\D/g, '');
    if (!localPart || localPart.length < 6) {
      showError('Enter your phone number');
      return;
    }
    const fullPhone = `${phoneCode}${localPart}`;
    if (!/^\+\d{8,15}$/.test(fullPhone)) {
      showError('Phone number format is invalid');
      return;
    }
    try {
      setSendingOtp(true);
      const verificationId = await sendPhoneOtp(fullPhone);
      navigation.navigate('PhoneVerifyOtp', {
        phone: fullPhone,
        verificationId,
      });
    } catch (e: any) {
      const code = e?.code as string | undefined;
      if (code === 'auth/too-many-requests') {
        showError('Too many attempts — try again in a few minutes.');
      } else if (code === 'auth/invalid-phone-number') {
        showError('Phone number format is invalid.');
      } else if (code === 'auth/network-request-failed') {
        showError('Network error. Check your connection.');
      } else {
        showError(e?.message || 'Failed to send code');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A6A4B" />

      {/* ── GREEN HERO ── */}
      <View style={s.hero}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={s.logoImg}
          resizeMode="contain"
        />
        <Typo style={s.logoName}>SURERIDE</Typo>
        <Typo style={s.logoTagline}>Your complete mobility partner</Typo>
      </View>

      {/* ── FORM CARD ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={[s.card, { backgroundColor: colors.background }]}
          contentContainerStyle={s.cardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Typo style={[s.formTitle, { color: colors.textPrimary }]}>Welcome back</Typo>
          <Typo style={[s.formSub, { color: colors.textSecondary }]}>
            Sign in to continue your journey
          </Typo>

          <View style={s.form}>
            {mode === 'email' ? (
              <>
                <AppInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <AppInput
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                      <Icon
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  }
                />

                <TouchableOpacity
                  style={s.forgotRow}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Typo style={s.forgotText}>Forgot Password?</Typo>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Typo style={[s.phoneLabel, { color: colors.textSecondary }]}>
                  Phone Number
                </Typo>
                <View style={s.phoneRow}>
                  <TouchableOpacity
                    style={[
                      s.codeBtn,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    onPress={() => setShowCountryModal(true)}
                  >
                    {selectedCountry ? (
                      <Text style={{ fontSize: 16, marginRight: 4 }}>
                        {getFlagEmoji(selectedCountry.code)}
                      </Text>
                    ) : null}
                    <Typo style={{ color: colors.textPrimary }}>{phoneCode}</Typo>
                    <Icon
                      name="chevron-down"
                      size={14}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      placeholder="8012345678"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          <AppButton
            title={mode === 'email' ? 'Sign In' : 'Send Code'}
            loading={mode === 'email' ? loading : sendingOtp}
            onPress={mode === 'email' ? handleLogin : handleSendPhoneOtp}
          />

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
            <Image
              source={require('@/assets/images/google-logo.png')}
              style={s.googleIcon}
            />
            <Typo style={[s.googleText, { color: colors.textPrimary }]}>
              {googleLoading ? 'Signing in…' : 'Continue with Google'}
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.googleBtn, { borderColor: colors.border, backgroundColor: colors.surface, marginTop: 10 }]}
            onPress={() => setMode(m => (m === 'email' ? 'phone' : 'email'))}
            activeOpacity={0.8}
          >
            <Icon
              name={mode === 'email' ? 'phone-portrait-outline' : 'mail-outline'}
              size={20}
              color={colors.textPrimary}
              style={s.googleIcon}
            />
            <Typo style={[s.googleText, { color: colors.textPrimary }]}>
              {mode === 'email' ? 'Continue with phone' : 'Continue with email'}
            </Typo>
          </TouchableOpacity>

          <View style={s.footer}>
            <Typo style={[s.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Typo>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Typo style={s.footerLink}>Sign Up</Typo>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country picker modal — same UX as Register */}
      <Modal visible={showCountryModal} animationType="slide">
        <SafeAreaView style={[s.modalSafe, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Typo style={[s.modalTitle, { color: colors.textPrimary }]}>
              Select Country
            </Typo>
            <TouchableOpacity
              onPress={() => {
                setShowCountryModal(false);
                setCountrySearch('');
              }}
            >
              <Icon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              s.modalSearch,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              placeholder="Search country"
              placeholderTextColor={colors.textSecondary}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoCapitalize="none"
              autoCorrect={false}
              style={[s.modalSearchInput, { color: colors.textPrimary }]}
            />
            {countrySearch ? (
              <TouchableOpacity onPress={() => setCountrySearch('')}>
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
                  setCountrySearch('');
                }}
              >
                <Text style={{ fontSize: 22, marginRight: 12 }}>
                  {getFlagEmoji(item.code)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Typo style={{ color: colors.textPrimary }}>{item.name}</Typo>
                  <Typo style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {item.callingCode}
                  </Typo>
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
  safe: {
    flex: 1,
    backgroundColor: '#0A6A4B',
  },

  /* hero */
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    gap: 6,
  },
  logoImg: {
    width: 64,
    height: 64,
  },
  logoName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
  },
  logoTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },

  /* card */
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  formSub: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },

  /* form */
  form: {
    gap: 14,
    marginBottom: 20,
  },
  forgotRow: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: '#0A6A4B',
    fontSize: 13,
    fontWeight: '600',
  },

  /* divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },

  /* google */
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  googleIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '500',
  },

  /* footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A6A4B',
  },

  /* phone (matches Register) */
  phoneLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 52, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
  },

  /* country modal */
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 16, fontWeight: '600' },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
    height: '100%',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
