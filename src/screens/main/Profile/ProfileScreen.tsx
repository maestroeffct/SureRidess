import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert/AppAlert';
import Icon from '@react-native-vector-icons/ionicons';

import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { AppBottomSheet } from '@/components/AppBottomSheet/AppBottomSheet';
import { useAuth } from '@/providers/AuthProvider';
import { logoutUser } from '@/services/auth.service';
import { updateProfile, updatePassword } from '@/services/user.service';
import { removeItem, StorageKeys } from '@/helpers/storage';
import { showError, showSuccess } from '@/helpers/toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import { SUPPORTED_CURRENCIES } from '@/helpers/currency';
import dayjs from 'dayjs';

/* ──────────────────────────────────────────────── */
/*  Helpers                                         */
/* ──────────────────────────────────────────────── */

function initials(first?: string | null, last?: string | null) {
  const f = (first ?? '').trim()[0] ?? '';
  const l = (last ?? '').trim()[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function formatDate(raw?: string | null) {
  if (!raw) return '—';
  const d = dayjs(raw);
  return d.isValid() ? d.format('D MMM YYYY') : raw;
}

/* ──────────────────────────────────────────────── */
/*  Sub-components                                  */
/* ──────────────────────────────────────────────── */

function InfoRow({
  icon,
  label,
  value,
  verified,
}: {
  icon: string;
  label: string;
  value?: string | null;
  verified?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <Icon name={icon as any} size={17} color="#0A6A4B" />
      </View>
      <View style={s.infoContent}>
        <Typo style={[s.infoLabel, { color: colors.textSecondary }]}>{label}</Typo>
        <Typo style={[s.infoValue, { color: colors.textPrimary }]}>{value || '—'}</Typo>
      </View>
      {verified && (
        <Icon name="checkmark-circle" size={18} color="#22C55E" />
      )}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Typo style={s.sectionHeader}>{title}</Typo>;
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[s.actionRow, { borderTopColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          s.actionIconWrap,
          { backgroundColor: colors.background },
          danger && s.actionIconDanger,
        ]}
      >
        <Icon name={icon as any} size={17} color={danger ? '#EF4444' : colors.textPrimary} />
      </View>
      <Typo style={[s.actionLabel, { color: colors.textPrimary }, danger && { color: '#EF4444' }]}>{label}</Typo>
      {!danger && (
        <Icon name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
      )}
    </TouchableOpacity>
  );
}

/* ──────────────────────────────────────────────── */
/*  Main Screen                                     */
/* ──────────────────────────────────────────────── */

export const ProfileScreen = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const { preference, setPreference, colors } = useTheme();

  const { currency: displayCurrency, setCurrency: setDisplayCurrency } = useCurrency();
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [logoutAlert, setLogoutAlert] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  /* edit name state */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingName, setSavingName] = useState(false);

  /* change password state */
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => setLogoutAlert(true);

  const confirmLogout = async () => {
    setLogoutAlert(false);
    try {
      await removeItem(StorageKeys.LAST_MODULE);
      await logoutUser();
      logout();
    } catch {
      logout();
    }
  };

  const openEditName = () => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEditNameOpen(true);
  };

  const handleSaveName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError('First name and last name are required.');
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      await refreshUser();
      setEditNameOpen(false);
      showSuccess('Name updated successfully');
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const openChangePass = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePassOpen(true);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match.');
      return;
    }
    setSavingPass(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      setChangePassOpen(false);
      showSuccess('Password changed successfully');
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSavingPass(false);
    }
  };

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const kycLabel: Record<string, string> = {
    VERIFIED: 'Verified',
    APPROVED: 'Verified',
    PENDING_VERIFICATION: 'Pending review',
    PENDING: 'Pending review',
    REJECTED: 'Rejected',
    INCOMPLETE: 'Incomplete',
  };
  const kycStatus = user?.profileStatus?.toUpperCase() ?? '';
  const kycColor: Record<string, string> = {
    VERIFIED: '#22C55E',
    APPROVED: '#22C55E',
    PENDING_VERIFICATION: '#F59E0B',
    PENDING: '#F59E0B',
    REJECTED: '#EF4444',
  };

  const phone =
    user?.phoneCountry && user?.phoneNumber
      ? `${user.phoneCountry} ${user.phoneNumber}`
      : user?.phone ?? null;

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── AVATAR HEADER ── */}
        <View style={[s.avatarSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={s.avatarCircle}>
            <Typo style={s.avatarText}>
              {initials(user?.firstName, user?.lastName)}
            </Typo>
          </View>
          <Typo style={[s.fullName, { color: colors.textPrimary }]}>{fullName}</Typo>
          <Typo variant="caption" style={[s.emailSub, { color: colors.textSecondary }]}>{user?.email}</Typo>

          {kycStatus && (() => {
            const isVerified =
              kycStatus === 'VERIFIED' || kycStatus === 'APPROVED';
            const isPending =
              kycStatus === 'PENDING' || kycStatus === 'PENDING_VERIFICATION';
            const canOpen = !isVerified && !isPending;
            const badge = (
              <View style={[s.kycBadge, { borderColor: kycColor[kycStatus] ?? '#9CA3AF' }]}>
                <View style={[s.kycDot, { backgroundColor: kycColor[kycStatus] ?? '#9CA3AF' }]} />
                <Typo style={[s.kycText, { color: kycColor[kycStatus] ?? '#9CA3AF' }]}>
                  KYC {kycLabel[kycStatus] ?? kycStatus}
                </Typo>
              </View>
            );
            return canOpen ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => navigation.navigate('KYCFlow')}
              >
                {badge}
              </TouchableOpacity>
            ) : (
              badge
            );
          })()}
        </View>

        {/* ── PERSONAL INFO ── */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeader title="Personal Info" />
          <InfoRow icon="person-outline" label="Full Name" value={fullName} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email} verified={user?.isVerified} />
          <InfoRow icon="call-outline" label="Phone" value={phone} verified={!!phone} />
          <InfoRow icon="globe-outline" label="Nationality" value={user?.nationality} />
          <InfoRow
            icon="calendar-outline"
            label="Date of Birth"
            value={formatDate(user?.dateOfBirth ?? user?.dob)}
          />
        </View>

        {/* ── ACCOUNT ACTIONS ── */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeader title="Account" />
          {(() => {
            const verified = kycStatus === 'VERIFIED' || kycStatus === 'APPROVED';
            const pending =
              kycStatus === 'PENDING' || kycStatus === 'PENDING_VERIFICATION';
            const rejected = kycStatus === 'REJECTED';
            const label = verified
              ? 'Identity Verified'
              : pending
              ? 'Identity Verification — Pending Review'
              : rejected
              ? 'Identity Verification — Resubmit'
              : 'Verify Your Identity';
            const sub = verified
              ? 'Your documents are approved.'
              : pending
              ? 'We’re reviewing your documents.'
              : rejected
              ? 'Tap to upload again.'
              : 'Required to book a vehicle.';

            // Only let the user open KYCFlow when there's actually something
            // for them to do there:
            //   - Not started / Incomplete → start the flow
            //   - Rejected → resubmit
            // For Verified and Pending Review, the row is informational only.
            const navigable = !verified && !pending;

            return (
              <TouchableOpacity
                style={[s.actionRow, { borderTopColor: colors.border }]}
                onPress={() =>
                  navigable ? navigation.navigate('KYCFlow') : undefined
                }
                disabled={!navigable}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.actionIconWrap,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Icon
                    name={
                      verified
                        ? 'shield-checkmark-outline'
                        : pending
                        ? 'time-outline'
                        : rejected
                        ? 'warning-outline'
                        : 'shield-outline'
                    }
                    size={18}
                    color={
                      verified
                        ? '#22C55E'
                        : pending
                        ? '#F59E0B'
                        : rejected
                        ? '#EF4444'
                        : colors.textPrimary
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo style={[s.actionLabel, { color: colors.textPrimary }]}>
                    {label}
                  </Typo>
                  <Typo
                    style={[s.infoLabel, { color: colors.textSecondary }]}
                  >
                    {sub}
                  </Typo>
                </View>
                {navigable ? (
                  <Icon
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })()}
          <ActionRow
            icon="create-outline"
            label="Edit Name"
            onPress={openEditName}
          />
          <ActionRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={openChangePass}
          />
        </View>

        {/* ── CURRENCY ── */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeader title="Currency" />
          <TouchableOpacity
            style={[s.actionRow, { borderTopColor: colors.border }]}
            onPress={() => setCurrencyPickerOpen(true)}
            activeOpacity={0.7}
          >
            <View style={[s.actionIconWrap, { backgroundColor: colors.background }]}>
              <Icon name="cash-outline" size={18} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Typo style={[s.actionLabel, { color: colors.textPrimary }]}>Display Currency</Typo>
              <Typo style={[s.infoLabel, { color: colors.textSecondary }]}>
                Prices show in {displayCurrency}
              </Typo>
            </View>
            <Typo style={[s.infoValue, { color: colors.textSecondary, fontSize: 13 }]}>{displayCurrency}</Typo>
            <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── APPEARANCE ── */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeader title="Appearance" />
          <View style={s.themeRow}>
            {(
              [
                { value: 'light', icon: 'sunny-outline',  label: 'Light' },
                { value: 'dark',  icon: 'moon-outline',   label: 'Dark'  },
                { value: 'system',icon: 'phone-portrait-outline', label: 'System' },
              ] as { value: typeof preference; icon: string; label: string }[]
            ).map(opt => {
              const active = preference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    s.themeOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    active && s.themeOptionActive,
                  ]}
                  onPress={() => setPreference(opt.value)}
                  activeOpacity={0.75}
                >
                  <Icon
                    name={opt.icon as any}
                    size={18}
                    color={active ? '#fff' : colors.textSecondary}
                  />
                  <Typo style={[s.themeLabel, { color: colors.textSecondary }, active && s.themeLabelActive]}>
                    {opt.label}
                  </Typo>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── DANGER ZONE ── */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActionRow
            icon="log-out-outline"
            label="Log out"
            onPress={handleLogout}
            danger
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── EDIT NAME SHEET ── */}
      <AppBottomSheet
        visible={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        heightFactor={0.48}
      >
        <View style={[s.sheetInner, { backgroundColor: colors.surface }]}>
          <View style={s.sheetTitleRow}>
            <Typo style={[s.sheetTitle, { color: colors.textPrimary }]}>Edit Name</Typo>
            <TouchableOpacity onPress={() => setEditNameOpen(false)}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>First Name</Typo>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Enter first name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>Last Name</Typo>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Enter last name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <AppButton
            title={savingName ? 'Saving…' : 'Save Changes'}
            loading={savingName}
            onPress={handleSaveName}
          />
        </View>
      </AppBottomSheet>

      {/* ── CHANGE PASSWORD SHEET ── */}
      <AppBottomSheet
        visible={changePassOpen}
        onClose={() => setChangePassOpen(false)}
        heightFactor={0.68}
      >
        <View style={[s.sheetInner, { backgroundColor: colors.surface }]}>
          <View style={s.sheetTitleRow}>
            <Typo style={[s.sheetTitle, { color: colors.textPrimary }]}>Change Password</Typo>
            <TouchableOpacity onPress={() => setChangePassOpen(false)}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>Current Password</Typo>
          <View style={s.passwordRow}>
            <TextInput
              value={oldPassword}
              onChangeText={setOldPassword}
              style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showOld}
            />
            <TouchableOpacity onPress={() => setShowOld(v => !v)} style={s.eyeBtn}>
              <Icon name={showOld ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>New Password</Typo>
          <View style={s.passwordRow}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(v => !v)} style={s.eyeBtn}>
              <Icon name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>Confirm New Password</Typo>
          <View style={s.passwordRow}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[s.input, { flex: 1, marginBottom: 0, backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Repeat new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn}>
              <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 8 }}>
            <AppButton
              title={savingPass ? 'Updating…' : 'Update Password'}
              loading={savingPass}
              onPress={handleChangePassword}
            />
          </View>
        </View>
      </AppBottomSheet>

      <AppSelectSheet
        visible={currencyPickerOpen}
        title="Display Currency"
        searchPlaceholder="Search currency"
        options={SUPPORTED_CURRENCIES.map(c => ({
          label: `${c.code} — ${c.name}`,
          value: c.code,
        }))}
        selected={displayCurrency}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={opt => {
          setDisplayCurrency(String(opt.value));
          setCurrencyPickerOpen(false);
        }}
      />

      <AppAlert
        visible={logoutAlert}
        title="Log out"
        message="Are you sure you want to log out?"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setLogoutAlert(false) },
          { text: 'Log out', style: 'destructive', onPress: confirmLogout },
        ]}
        onDismiss={() => setLogoutAlert(false)}
      />
    </ScreenWrapper>
  );
};

export default ProfileScreen;

/* ──────────────────────────────────────────────── */
/*  Styles                                          */
/* ──────────────────────────────────────────────── */

const s = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0A6A4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  emailSub: {
    color: '#6B7280',
    marginTop: 2,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  kycDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '600',
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    gap: 12,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDanger: {
    backgroundColor: '#FEF2F2',
  },
  actionLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },

  /* ── sheet ── */
  sheetInner: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flex: 1,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 4,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: 50,
    justifyContent: 'center',
  },

  themeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  themeOptionActive: {
    backgroundColor: '#0A6A4B',
    borderColor: '#0A6A4B',
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  themeLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
