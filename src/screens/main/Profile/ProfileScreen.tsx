import React, { useState } from 'react';
import {
  Linking,
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
import { useBrowseCountry } from '@/providers/CountryProvider';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import { SUPPORTED_CURRENCIES, symbolFor } from '@/helpers/currency';
import {
  findCountry,
  flagForCountry,
  SUPPORTED_COUNTRIES,
} from '@/helpers/region';
import { CURRENT_BUILD_CODE, CURRENT_VERSION_NAME } from '@/config/appVersion';
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

type ColorTokens = ReturnType<typeof useTheme>['colors'];

function SectionLabel({ title, colors }: { title: string; colors: ColorTokens }) {
  return (
    <Typo style={[s.sectionLabel, { color: colors.textSecondary }]}>
      {title.toUpperCase()}
    </Typo>
  );
}

type TrailingKind = 'pencil' | 'check' | 'chevron';

// Single-line settings row used across Personal / Preferences / Support /
// Legal. Pass `onPress` to make it tappable (pencil and chevron trailing
// indicators imply tappable). `isFirst` suppresses the top border so the
// first row doesn't show a double-rule against the card edge.
function FieldRow({
  label,
  value,
  trailing,
  onPress,
  isFirst,
  verifiedColor,
}: {
  label: string;
  value?: string | null;
  trailing?: TrailingKind;
  onPress?: () => void;
  isFirst?: boolean;
  verifiedColor?: string;
}) {
  const { colors } = useTheme();
  const Component: any = onPress ? TouchableOpacity : View;
  const hasValue = !!value && value !== '';

  return (
    <Component
      style={[
        s.fieldRow,
        !isFirst && { borderTopWidth: 1, borderTopColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : undefined}
    >
      <Typo style={[s.fieldRowLabel, { color: colors.textSecondary }]}>
        {label}
      </Typo>
      <Typo
        style={[s.fieldRowValue, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {hasValue ? value : '—'}
      </Typo>
      {trailing === 'pencil' && (
        <Icon name="pencil-outline" size={15} color={colors.textSecondary} />
      )}
      {trailing === 'check' && (
        <Icon
          name="checkmark-circle"
          size={16}
          color={verifiedColor ?? '#22C55E'}
        />
      )}
      {trailing === 'chevron' && (
        <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
      )}
    </Component>
  );
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
  const { country: browseCountry, setCountry: setBrowseCountry } = useBrowseCountry();
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [logoutAlert, setLogoutAlert] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [appearancePickerOpen, setAppearancePickerOpen] = useState(false);
  const [switchAlert, setSwitchAlert] = useState(false);
  const [comingSoonAlert, setComingSoonAlert] = useState(false);

  const browseCountryMeta = findCountry(browseCountry);
  const browseCountryFlag = flagForCountry(browseCountry);
  const currencySymbol = symbolFor(displayCurrency);

  const handleContact = () =>
    Linking.openURL('mailto:support@sureride.ng').catch(() => {});
  const handleComingSoon = () => setComingSoonAlert(true);
  const handleSwitchModule = () => setSwitchAlert(true);

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

        {/* ── HEADER ── */}
        {(() => {
          const isVerified =
            kycStatus === 'VERIFIED' || kycStatus === 'APPROVED';
          const isPending =
            kycStatus === 'PENDING' || kycStatus === 'PENDING_VERIFICATION';
          const kycCanOpen = !!kycStatus && !isVerified && !isPending;
          const kycBadge = kycStatus ? (
            <View
              style={[
                s.kycBadge,
                { borderColor: kycColor[kycStatus] ?? '#9CA3AF' },
              ]}
            >
              <View
                style={[
                  s.kycDot,
                  { backgroundColor: kycColor[kycStatus] ?? '#9CA3AF' },
                ]}
              />
              <Typo
                style={[
                  s.kycText,
                  { color: kycColor[kycStatus] ?? '#9CA3AF' },
                ]}
              >
                KYC {kycLabel[kycStatus] ?? kycStatus}
              </Typo>
            </View>
          ) : null;

          return (
            <View
              style={[
                s.header,
                {
                  backgroundColor: colors.background,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View>
                <View style={s.avatarCircle}>
                  <Typo style={s.avatarText}>
                    {initials(user?.firstName, user?.lastName)}
                  </Typo>
                </View>
                <TouchableOpacity
                  style={[
                    s.avatarEditBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleComingSoon}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="camera-outline"
                    size={14}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
              <Typo style={[s.fullName, { color: colors.textPrimary }]}>
                {fullName}
              </Typo>
              <Typo
                variant="caption"
                style={[s.emailSub, { color: colors.textSecondary }]}
              >
                {user?.email}
              </Typo>
              {kycBadge ? (
                kycCanOpen ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('KYCFlow')}
                  >
                    {kycBadge}
                  </TouchableOpacity>
                ) : (
                  kycBadge
                )
              ) : null}
            </View>
          );
        })()}

        {/* ── PERSONAL ── */}
        <SectionLabel title="Personal" colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label="Full name"
            value={fullName}
            trailing="pencil"
            onPress={openEditName}
            isFirst
          />
          <FieldRow
            label="Email"
            value={user?.email}
            trailing={user?.isVerified ? 'check' : undefined}
            verifiedColor="#22C55E"
          />
          <FieldRow
            label="Phone"
            value={phone}
            trailing={phone ? 'check' : undefined}
            verifiedColor="#22C55E"
          />
          <FieldRow
            label="Nationality"
            value={user?.nationality}
            trailing="pencil"
            onPress={handleComingSoon}
          />
          <FieldRow
            label="Date of birth"
            value={formatDate(user?.dateOfBirth ?? user?.dob)}
          />
          <FieldRow
            label="Password"
            value="••••••••"
            trailing="pencil"
            onPress={openChangePass}
          />
        </View>

        {/* ── PREFERENCES ── */}
        <SectionLabel title="Preferences" colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label="Country"
            value={`${browseCountryFlag}  ${browseCountryMeta?.name ?? browseCountry}`}
            trailing="chevron"
            onPress={() => setCountryPickerOpen(true)}
            isFirst
          />
          <FieldRow
            label="Currency"
            value={`${currencySymbol || ''}  ${displayCurrency}`.trim()}
            trailing="chevron"
            onPress={() => setCurrencyPickerOpen(true)}
          />
          <FieldRow
            label="Appearance"
            value={
              preference === 'light'
                ? 'Light'
                : preference === 'dark'
                ? 'Dark'
                : 'System'
            }
            trailing="chevron"
            onPress={() => setAppearancePickerOpen(true)}
          />
          <FieldRow
            label="Notifications"
            value="On"
            trailing="chevron"
            onPress={handleComingSoon}
          />
        </View>

        {/* ── SUPPORT ── */}
        <SectionLabel title="Support" colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label="Help & FAQ"
            trailing="chevron"
            onPress={handleComingSoon}
            isFirst
          />
          <FieldRow
            label="Contact us"
            trailing="chevron"
            onPress={handleContact}
          />
          <FieldRow
            label="Switch module"
            trailing="chevron"
            onPress={handleSwitchModule}
          />
        </View>

        {/* ── LEGAL ── */}
        <SectionLabel title="Legal" colors={colors} />
        <View
          style={[
            s.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FieldRow
            label="Terms of Service"
            trailing="chevron"
            onPress={handleComingSoon}
            isFirst
          />
          <FieldRow
            label="Privacy Policy"
            trailing="chevron"
            onPress={handleComingSoon}
          />
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Typo style={[s.footerVersion, { color: colors.textSecondary }]}>
            SureRide {CURRENT_VERSION_NAME} ({CURRENT_BUILD_CODE})
          </Typo>
          <TouchableOpacity
            style={[s.logoutBtn, { borderColor: colors.border }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Icon name="log-out-outline" size={18} color="#EF4444" />
            <Typo style={s.logoutText}>Log out</Typo>
          </TouchableOpacity>
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
        options={SUPPORTED_CURRENCIES.map(c => {
          const sym = symbolFor(c.code);
          return {
            label: `${sym ? `${sym}  ` : ''}${c.code} — ${c.name}`,
            value: c.code,
          };
        })}
        selected={displayCurrency}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={opt => {
          setDisplayCurrency(String(opt.value));
          setCurrencyPickerOpen(false);
        }}
      />

      <AppSelectSheet
        visible={countryPickerOpen}
        title="Browse cars in"
        searchPlaceholder="Search country"
        options={SUPPORTED_COUNTRIES.map(c => {
          const flag = flagForCountry(c.code);
          return {
            label: `${flag ? `${flag}  ` : ''}${c.name}`,
            value: c.code,
          };
        })}
        selected={browseCountry}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={opt => {
          const code = String(opt.value);
          setBrowseCountry(code);
          const target = findCountry(code);
          if (target) setDisplayCurrency(target.currency);
          setCountryPickerOpen(false);
        }}
      />

      <AppSelectSheet
        visible={appearancePickerOpen}
        title="Appearance"
        options={[
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'Match system', value: 'system' },
        ]}
        selected={preference}
        onClose={() => setAppearancePickerOpen(false)}
        onSelect={opt => {
          setPreference(opt.value as typeof preference);
          setAppearancePickerOpen(false);
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

      <AppAlert
        visible={switchAlert}
        title="Switch Module"
        message="Go back to the SureRide home screen to choose a different service?"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setSwitchAlert(false) },
          {
            text: 'Switch',
            style: 'default',
            onPress: async () => {
              setSwitchAlert(false);
              await removeItem(StorageKeys.LAST_MODULE);
              navigation.navigate('Home');
            },
          },
        ]}
        onDismiss={() => setSwitchAlert(false)}
      />

      <AppAlert
        visible={comingSoonAlert}
        title="Coming Soon"
        message="This feature will be available in a future update."
        buttons={[
          { text: 'OK', style: 'default', onPress: () => setComingSoonAlert(false) },
        ]}
        onDismiss={() => setComingSoonAlert(false)}
      />
    </ScreenWrapper>
  );
};

export default ProfileScreen;

/* ──────────────────────────────────────────────── */
/*  Styles                                          */
/* ──────────────────────────────────────────────── */

const s = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 22,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0A6A4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 8,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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

  /* switch module banner */
  switchCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#0A6A4B',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  switchIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },

  /* about rows */
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* ── new settings layout ── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  fieldRowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldRowValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 16,
    gap: 14,
  },
  footerVersion: {
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
