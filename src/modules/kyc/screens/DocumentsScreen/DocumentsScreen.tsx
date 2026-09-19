import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { KYCStepHeader } from '@/components/kyc/KYCStepHeader/KYCStepHeader';
import { KYCInfoAlert } from '@/components/kyc/KYCInfoAlert/KYCInfoAlert';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';

import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { UploadField } from '@/components/kyc/UploadField/UploadField';
import { useTheme } from '@/theme/ThemeProvider';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import { showError, showSuccess } from '@/helpers/toast';
import { uploadKycDocuments } from '@/services/kyc.service';
import { useAuth } from '@/providers/AuthProvider';
import { PassportCameraModal } from '@/modules/kyc/components/PassportCameraModal';

const GOVERNMENT_ID_TYPES = ['International Passport', 'National Id Card'] as const;
type GovernmentIdType = (typeof GOVERNMENT_ID_TYPES)[number];

export default function DocumentsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const { t } = useTranslation('kyc');

  function getAssetLabel(asset: Asset | null) {
    if (!asset) return undefined;
    if (asset.fileName) return asset.fileName;
    if (asset.uri) {
      const fallback = asset.uri.split('/').pop();
      if (fallback) return fallback;
    }
    return t('documentsScreen.selectedImage');
  }

  const govIdTypeLabel = (idType: GovernmentIdType) =>
    idType === 'International Passport'
      ? t('documentsScreen.passportOption')
      : t('documentsScreen.nationalIdOption');

  const [governmentIdType, setGovernmentIdType] =
    useState<GovernmentIdType | null>(null);
  const [showGovernmentIdTypeModal, setShowGovernmentIdTypeModal] =
    useState(false);

  const [governmentIdNumber, setGovernmentIdNumber] = useState('');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverLicenseExpiryDate, setDriverLicenseExpiryDate] =
    useState<Date | null>(null);
  const [showLicenseExpiryPicker, setShowLicenseExpiryPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassportCamera, setShowPassportCamera] = useState(false);

  const [passportPhotoAsset, setPassportPhotoAsset] = useState<Asset | null>(null);
  const [governmentIdFrontAsset, setGovernmentIdFrontAsset] =
    useState<Asset | null>(null);
  const [governmentIdBackAsset, setGovernmentIdBackAsset] = useState<Asset | null>(null);
  const [driverLicenseFrontAsset, setDriverLicenseFrontAsset] =
    useState<Asset | null>(null);
  const [driverLicenseBackAsset, setDriverLicenseBackAsset] =
    useState<Asset | null>(null);

  const governmentIdNumberLabel =
    governmentIdType === 'International Passport'
      ? t('documentsScreen.passportNumberLabel')
      : t('documentsScreen.nationalIdNumberLabel');

  const governmentIdFrontUploadLabel =
    governmentIdType === 'International Passport'
      ? t('documentsScreen.passportUploadFront')
      : t('documentsScreen.nationalIdUploadFront');

  const governmentIdBackUploadLabel =
    governmentIdType === 'International Passport'
      ? t('documentsScreen.passportUploadBack')
      : t('documentsScreen.nationalIdUploadBack');

  const pickImage = async (
    setAsset: React.Dispatch<React.SetStateAction<Asset | null>>,
    label: string,
  ) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        showError(result.errorMessage || t('documentsScreen.errorGallery'));
        return;
      }

      const pickedAsset = result.assets?.[0];
      if (!pickedAsset?.uri) {
        showError(t('documentsScreen.errorNoImageSelected'));
        return;
      }

      setAsset(pickedAsset);
      showSuccess(t('documentsScreen.imageSelected', { label }));
    } catch (error) {
      if (__DEV__) {
        console.log('[KYC][Documents] Failed to pick image', error);
      }
      showError(t('documentsScreen.errorImagePicker'));
    }
  };

  const handleCompleteVerification = async () => {
    if (!governmentIdType) {
      showError(t('documentsScreen.errorSelectGovIdType'));
      return;
    }

    if (!governmentIdNumber.trim()) {
      showError(t('documentsScreen.errorEnterGovIdNumber'));
      return;
    }

    if (!driverLicenseNumber.trim()) {
      showError(t('documentsScreen.errorEnterLicenseNumber'));
      return;
    }

    if (!driverLicenseExpiryDate) {
      showError(t('documentsScreen.errorSelectLicenseExpiry'));
      return;
    }

    if (!passportPhotoAsset) {
      showError(t('documentsScreen.errorUploadPassport'));
      return;
    }

    if (!governmentIdFrontAsset || !governmentIdBackAsset) {
      showError(t('documentsScreen.errorUploadGovId'));
      return;
    }

    if (!driverLicenseFrontAsset || !driverLicenseBackAsset) {
      showError(t('documentsScreen.errorUploadLicense'));
      return;
    }

    try {
      setSubmitting(true);

      await uploadKycDocuments({
        passport: passportPhotoAsset,
        govFront: governmentIdFrontAsset,
        govBack: governmentIdBackAsset,
        licenseFront: driverLicenseFrontAsset,
        licenseBack: driverLicenseBackAsset,
        governmentIdType,
        governmentIdNumber: governmentIdNumber.trim(),
        driverLicenseNumber: driverLicenseNumber.trim(),
        driverLicenseExpiry: driverLicenseExpiryDate.toISOString().slice(0, 10),
      });

      await refreshUser();

      showSuccess(t('documentsScreen.submitted'));

      navigation.popToTop();
      const parent = navigation.getParent();
      if (parent?.canGoBack()) {
        parent.goBack();
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || t('documentsScreen.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <KYCStepHeader
        step={3}
        title={t('documentsScreen.title')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <KYCInfoAlert message={t('documentsScreen.infoAlert')} />

        <View style={styles.inputSpacing}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowGovernmentIdTypeModal(true)}
          >
            <View pointerEvents="none">
              <AppInput
                label={t('documentsScreen.govIdTypeLabel')}
                placeholder={t('documentsScreen.govIdTypePlaceholder')}
                value={governmentIdType ? govIdTypeLabel(governmentIdType) : ''}
                editable={false}
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
        </View>

        {governmentIdType && (
          <>
            <View style={styles.inputSpacing}>
              <AppInput
                label={governmentIdNumberLabel}
                placeholder={t('documentsScreen.idNumberPlaceholder')}
                value={governmentIdNumber}
                onChangeText={setGovernmentIdNumber}
              />
            </View>

            <UploadField
              label={governmentIdFrontUploadLabel}
              selectedFileName={getAssetLabel(governmentIdFrontAsset)}
              onPress={() => pickImage(setGovernmentIdFrontAsset, t('documentsScreen.govIdFrontLabel'))}
            />

            <UploadField
              label={governmentIdBackUploadLabel}
              selectedFileName={getAssetLabel(governmentIdBackAsset)}
              onPress={() => pickImage(setGovernmentIdBackAsset, t('documentsScreen.govIdBackLabel'))}
            />
          </>
        )}

        <View style={styles.inputSpacing}>
          <AppInput
            label={t('documentsScreen.licenseNumberLabel')}
            placeholder={t('documentsScreen.licenseNumberPlaceholder')}
            value={driverLicenseNumber}
            onChangeText={setDriverLicenseNumber}
          />
        </View>

        <View style={styles.inputSpacing}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowLicenseExpiryPicker(true)}
          >
            <View pointerEvents="none">
              <AppInput
                label={t('documentsScreen.licenseExpiryLabel')}
                placeholder={t('documentsScreen.selectDatePlaceholder')}
                value={driverLicenseExpiryDate ? driverLicenseExpiryDate.toDateString() : ''}
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
        </View>

        {showLicenseExpiryPicker && (
          <DateTimePicker
            value={driverLicenseExpiryDate ?? new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, date) => {
              setShowLicenseExpiryPicker(false);
              if (date) setDriverLicenseExpiryDate(date);
            }}
          />
        )}

        <UploadField
          label={t('documentsScreen.passportUploadLabel')}
          selectedFileName={getAssetLabel(passportPhotoAsset)}
          onPress={() => setShowPassportCamera(true)}
        />

        <UploadField
          label={t('documentsScreen.licenseUploadFront')}
          selectedFileName={getAssetLabel(driverLicenseFrontAsset)}
          onPress={() => pickImage(setDriverLicenseFrontAsset, t('documentsScreen.licenseFrontLabel'))}
        />

        <UploadField
          label={t('documentsScreen.licenseUploadBack')}
          selectedFileName={getAssetLabel(driverLicenseBackAsset)}
          onPress={() => pickImage(setDriverLicenseBackAsset, t('documentsScreen.licenseBackLabel'))}
        />

        <AppButton
          title={t('documentsScreen.completeVerification')}
          style={styles.buttonSpacing}
          loading={submitting}
          onPress={handleCompleteVerification}
        />
      </ScrollView>

      <PassportCameraModal
        visible={showPassportCamera}
        onClose={() => setShowPassportCamera(false)}
        onCapture={asset => {
          setPassportPhotoAsset(asset);
          showSuccess(t('documentsScreen.passportCaptured'));
        }}
      />

      <AppSelectSheet
        visible={showGovernmentIdTypeModal}
        title={t('documentsScreen.selectIdTypeTitle')}
        searchable={false}
        options={GOVERNMENT_ID_TYPES.map(idType => ({ label: govIdTypeLabel(idType), value: idType }))}
        selected={governmentIdType ?? undefined}
        onClose={() => setShowGovernmentIdTypeModal(false)}
        onSelect={opt => {
          setGovernmentIdType(opt.value as GovernmentIdType);
          setGovernmentIdNumber('');
          setGovernmentIdFrontAsset(null);
          setGovernmentIdBackAsset(null);
          setShowGovernmentIdTypeModal(false);
        }}
      />
    </ScreenWrapper>
  );
}
