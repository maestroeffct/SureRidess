import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { KYCStepHeader } from '@/components/kyc/KYCStepHeader/KYCStepHeader';
import { KYCInfoAlert } from '@/components/kyc/KYCInfoAlert/KYCInfoAlert';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { UploadField } from '@/components/kyc/UploadField/UploadField';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import { uploadKycDocuments } from '@/services/kyc.service';
import { useAuth } from '@/providers/AuthProvider';

const GOVERNMENT_ID_TYPES = ['International Passport', 'National Id Card'] as const;
type GovernmentIdType = (typeof GOVERNMENT_ID_TYPES)[number];

function getAssetLabel(asset: Asset | null) {
  if (!asset) return undefined;
  if (asset.fileName) return asset.fileName;
  if (asset.uri) {
    const fallback = asset.uri.split('/').pop();
    if (fallback) return fallback;
  }
  return 'Selected image';
}

export default function DocumentsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { refreshUser } = useAuth();

  const [governmentIdType, setGovernmentIdType] =
    useState<GovernmentIdType | null>(null);
  const [showGovernmentIdTypeModal, setShowGovernmentIdTypeModal] =
    useState(false);
  const [idTypeSearch, setIdTypeSearch] = useState('');

  const [governmentIdNumber, setGovernmentIdNumber] = useState('');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverLicenseExpiryDate, setDriverLicenseExpiryDate] =
    useState<Date | null>(null);
  const [showLicenseExpiryPicker, setShowLicenseExpiryPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [passportPhotoAsset, setPassportPhotoAsset] = useState<Asset | null>(null);
  const [governmentIdFrontAsset, setGovernmentIdFrontAsset] =
    useState<Asset | null>(null);
  const [governmentIdBackAsset, setGovernmentIdBackAsset] = useState<Asset | null>(null);
  const [driverLicenseFrontAsset, setDriverLicenseFrontAsset] =
    useState<Asset | null>(null);
  const [driverLicenseBackAsset, setDriverLicenseBackAsset] =
    useState<Asset | null>(null);

  const filteredGovernmentIdTypes = useMemo(
    () =>
      GOVERNMENT_ID_TYPES.filter(item =>
        item.toLowerCase().includes(idTypeSearch.trim().toLowerCase()),
      ),
    [idTypeSearch],
  );

  const governmentIdNumberLabel =
    governmentIdType === 'International Passport'
      ? 'International Passport Number'
      : 'National ID Number';

  const governmentIdFrontUploadLabel =
    governmentIdType === 'International Passport'
      ? 'International Passport Upload (Front)'
      : 'National ID Card Upload (Front)';

  const governmentIdBackUploadLabel =
    governmentIdType === 'International Passport'
      ? 'International Passport Upload (Back)'
      : 'National ID Card Upload (Back)';

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
        showError(result.errorMessage || 'Unable to open gallery');
        return;
      }

      const pickedAsset = result.assets?.[0];
      if (!pickedAsset?.uri) {
        showError('No image selected');
        return;
      }

      setAsset(pickedAsset);
      showSuccess(`${label} selected`);
    } catch (error) {
      if (__DEV__) {
        console.log('[KYC][Documents] Failed to pick image', error);
      }
      showError('Failed to open image picker');
    }
  };

  const handleCompleteVerification = async () => {
    if (!governmentIdType) {
      showError('Please select government ID type');
      return;
    }

    if (!governmentIdNumber.trim()) {
      showError('Please enter government ID number');
      return;
    }

    if (!driverLicenseNumber.trim()) {
      showError('Please enter driver license number');
      return;
    }

    if (!driverLicenseExpiryDate) {
      showError('Please select driver license expiry date');
      return;
    }

    if (!passportPhotoAsset) {
      showError('Please upload passport photograph');
      return;
    }

    if (!governmentIdFrontAsset || !governmentIdBackAsset) {
      showError('Please upload government ID front and back');
      return;
    }

    if (!driverLicenseFrontAsset || !driverLicenseBackAsset) {
      showError('Please upload driver license front and back');
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

      showSuccess('Documents submitted for verification');

      navigation.popToTop();
      const parent = navigation.getParent();
      if (parent?.canGoBack()) {
        parent.goBack();
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to submit documents');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <KYCStepHeader
        step={3}
        title="Documents"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <KYCInfoAlert message="Upload clear photos of your documents. All information will be encrypted and secure." />

        <View style={styles.inputSpacing}>
          <AppInput
            label="Government ID Type"
            placeholder="Select ID type"
            value={governmentIdType ?? ''}
            editable={false}
            leftIcon={
              <TouchableOpacity onPress={() => setShowGovernmentIdTypeModal(true)}>
                <Icon
                  name="chevron-down"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />
        </View>

        {governmentIdType && (
          <>
            <View style={styles.inputSpacing}>
              <AppInput
                label={governmentIdNumberLabel}
                placeholder="Enter ID number"
                value={governmentIdNumber}
                onChangeText={setGovernmentIdNumber}
              />
            </View>

            <UploadField
              label={governmentIdFrontUploadLabel}
              selectedFileName={getAssetLabel(governmentIdFrontAsset)}
              onPress={() => pickImage(setGovernmentIdFrontAsset, 'Government ID front')}
            />

            <UploadField
              label={governmentIdBackUploadLabel}
              selectedFileName={getAssetLabel(governmentIdBackAsset)}
              onPress={() => pickImage(setGovernmentIdBackAsset, 'Government ID back')}
            />
          </>
        )}

        <View style={styles.inputSpacing}>
          <AppInput
            label="Driver License Number"
            placeholder="Enter license number"
            value={driverLicenseNumber}
            onChangeText={setDriverLicenseNumber}
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Driver License Expiry Date"
            placeholder="Select date"
            value={driverLicenseExpiryDate ? driverLicenseExpiryDate.toDateString() : ''}
            editable={false}
            rightIcon={
              <TouchableOpacity onPress={() => setShowLicenseExpiryPicker(true)}>
                <Icon
                  name="calendar-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />
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
          label="Passport Photograph Upload"
          selectedFileName={getAssetLabel(passportPhotoAsset)}
          onPress={() => pickImage(setPassportPhotoAsset, 'Passport photograph')}
        />

        <UploadField
          label="Driver License Upload (Front)"
          selectedFileName={getAssetLabel(driverLicenseFrontAsset)}
          onPress={() => pickImage(setDriverLicenseFrontAsset, 'Driver license front')}
        />

        <UploadField
          label="Driver License Upload (Back)"
          selectedFileName={getAssetLabel(driverLicenseBackAsset)}
          onPress={() => pickImage(setDriverLicenseBackAsset, 'Driver license back')}
        />

        <AppButton
          title="Complete Verification"
          style={styles.buttonSpacing}
          loading={submitting}
          onPress={handleCompleteVerification}
        />
      </ScrollView>

      <Modal visible={showGovernmentIdTypeModal} animationType="slide">
        <ScreenWrapper>
          <AppInput
            placeholder="Search ID type"
            value={idTypeSearch}
            onChangeText={setIdTypeSearch}
            leftIcon={
              <Icon
                name="search-outline"
                size={18}
                color={colors.textSecondary}
              />
            }
          />

          <FlatList
            data={filteredGovernmentIdTypes}
            keyExtractor={item => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ paddingVertical: 14 }}
                onPress={() => {
                  setGovernmentIdType(item);
                  setGovernmentIdNumber('');
                  setGovernmentIdFrontAsset(null);
                  setGovernmentIdBackAsset(null);
                  setShowGovernmentIdTypeModal(false);
                  setIdTypeSearch('');
                }}
              >
                <Typo>{item}</Typo>
              </TouchableOpacity>
            )}
          />

          <AppButton
            title="Close"
            variant="outline"
            onPress={() => setShowGovernmentIdTypeModal(false)}
          />
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
}
