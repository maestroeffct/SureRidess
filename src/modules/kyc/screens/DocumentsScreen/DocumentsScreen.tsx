import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { KYCStepHeader } from '@/components/kyc/KYCStepHeader/KYCStepHeader';
import { ScrollView, View } from 'react-native';
import { KYCInfoAlert } from '@/components/kyc/KYCInfoAlert/KYCInfoAlert';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { UploadField } from '@/components/kyc/UploadField/UploadField';

export default function DocumentsScreen() {
  const navigation = useNavigation<any>();

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
          <AppInput label="Government ID Type" placeholder="Select ID type" />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Government ID Number"
            placeholder="Enter ID number"
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Driver License Number"
            placeholder="Enter license number"
          />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput
            label="Driver License Expiry Date"
            placeholder="DD/MM/YYYY"
          />
        </View>

        <UploadField label="Passport Photograph Upload" onPress={() => {}} />

        <UploadField
          label="Government ID upload (front and back)"
          onPress={() => {}}
        />

        <UploadField
          label="Driver License upload (front and back)"
          onPress={() => {}}
        />

        <AppButton
          title="Complete Verification"
          style={styles.buttonSpacing}
          onPress={() => {}}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
