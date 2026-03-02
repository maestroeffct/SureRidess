import { View } from 'react-native';
import { Typo } from '../AppText/Typo';

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.wrapper}>
      <Typo variant="subheading" style={sectionStyles.title}>
        {title}
      </Typo>
      {children}
    </View>
  );
}

const sectionStyles = {
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    marginBottom: 10,
  },
};
