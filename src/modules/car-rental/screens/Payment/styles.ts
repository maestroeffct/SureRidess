import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  bullet: {
    marginTop: 10,
    gap: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  heroImage: {
    height: 320,
    width: '100%',
  },

  imageCarousel: {
    width: '100%',
    height: 320,
  },

  imageCount: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },

  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  gatewayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },

  gatewayRowActive: {
    borderColor: '#0B6E4F',
    backgroundColor: '#F0FDF4',
  },

  gatewayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  gatewayLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
});

export default styles;
