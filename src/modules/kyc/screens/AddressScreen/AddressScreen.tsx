import { AppButton } from '@/components/AppButton/CustomButton';
import { AppInput } from '@/components/AppInput/Input';
import { KYCInfoAlert } from '@/components/kyc/KYCInfoAlert/KYCInfoAlert';
import { KYCStepHeader } from '@/components/kyc/KYCStepHeader/KYCStepHeader';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, View } from 'react-native';
import styles from './styles';

export default function AddressScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper padded={false}>
      <KYCStepHeader
        step={2}
        title="Resident Address"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <KYCInfoAlert message="Provide your current residential address for verification" />

        <View style={styles.inputSpacing}>
          <AppInput label="State" placeholder="Select state" />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput label="Region" placeholder="Select region" />
        </View>

        <View style={styles.inputSpacing}>
          <AppInput label="Home Address" placeholder="Enter address" />
        </View>

        <AppButton
          title="Next"
          style={styles.buttonSpacing}
          onPress={() => navigation.navigate('Documents')}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
