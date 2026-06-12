import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { showError, showSuccess } from '@/helpers/toast';
import { resetPassword } from '@/services/auth.service';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';

const GREEN = '#0A6A4B';

type Props = {
  route: {
    params: {
      email: string;
      otp?: string;
    };
  };
};

export function ResetPasswordScreen({ route }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await resetPassword({ email, password });
      showSuccess('Password reset successful');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const strength =
    password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 8 ? 2 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthColor = ['#E5E7EB', '#EF4444', '#F59E0B', '#3B82F6', '#0A6A4B'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* ── GREEN HERO ── */}
      <View style={s.hero}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={s.heroIconWrap}>
          <Icon name="lock-closed" size={34} color="#fff" />
        </View>
        <Typo style={s.heroTitle}>New Password</Typo>
        <Typo style={s.heroSub}>
          Create a strong password for{'\n'}
          <Typo style={s.heroEmail}>{email}</Typo>
        </Typo>
      </View>

      {/* ── WHITE CARD ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.card}
          contentContainerStyle={s.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Password requirements hint */}
          <View style={s.hintBox}>
            <Icon name="information-circle-outline" size={16} color={GREEN} />
            <Typo style={s.hintText}>
              At least 8 characters. Use uppercase, numbers, and symbols for a
              stronger password.
            </Typo>
          </View>

          {/* New Password */}
          <AppInput
            label="New Password"
            placeholder="Enter new password"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            leftIcon={
              <Icon name="lock-closed-outline" size={18} color="#999" />
            }
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                <Icon
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            }
          />

          {/* Strength indicator */}
          {password.length > 0 && (
            <View style={s.strengthWrap}>
              <View style={s.strengthBars}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      s.strengthBar,
                      { backgroundColor: i <= strength ? strengthColor : '#E5E7EB' },
                    ]}
                  />
                ))}
              </View>
              <Typo style={[s.strengthLabel, { color: strengthColor }]}>
                {strengthLabel}
              </Typo>
            </View>
          )}

          {/* Confirm Password */}
          <View style={{ marginTop: 16 }}>
            <AppInput
              label="Confirm Password"
              placeholder="Re-enter new password"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={
                <Icon name="lock-closed-outline" size={18} color="#999" />
              }
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
                  <Icon
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              }
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <View style={s.matchRow}>
                <Icon name="close-circle" size={14} color="#EF4444" />
                <Typo style={s.matchError}>Passwords don't match</Typo>
              </View>
            )}
            {confirmPassword.length > 0 && password === confirmPassword && (
              <View style={s.matchRow}>
                <Icon name="checkmark-circle" size={14} color={GREEN} />
                <Typo style={s.matchOk}>Passwords match</Typo>
              </View>
            )}
          </View>

          <AppButton
            title="Set New Password"
            loading={loading}
            onPress={handleSubmit}
            style={s.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GREEN },

  /* hero */
  hero: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  heroEmail: {
    color: '#fff',
    fontWeight: '700',
  },

  /* card */
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cardContent: {
    padding: 24,
    paddingBottom: 40,
  },

  /* hint */
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },

  /* strength */
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },

  /* match */
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  matchError: { fontSize: 12, color: '#EF4444' },
  matchOk: { fontSize: 12, color: GREEN },

  btn: { marginTop: 28 },
});
