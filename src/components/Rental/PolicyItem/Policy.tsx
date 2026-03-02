import { Typo } from '@/components/AppText/Typo';
import Ionicons from '@react-native-vector-icons/ionicons';
import { TouchableOpacity, View } from 'react-native';

export const PolicyItem = ({ title, value }: any) => (
  <View style={{ marginTop: 8 }}>
    <Typo variant="caption">{title}</Typo>
    <Typo>{value}</Typo>
  </View>
);

export const HelpItem = ({ icon, label }: any) => (
  <TouchableOpacity
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
    }}
  >
    <Ionicons name={icon} size={20} />
    <Typo>{label}</Typo>
  </TouchableOpacity>
);
