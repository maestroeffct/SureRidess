import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  heroImage: {
    height: 220,
    width: '100%',
  },

  imageCarousel: {
    width: '100%',
    height: 220,
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

  section: {
    padding: 16,
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

  provider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  providerLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
  },

  providerText: {
    color: '#fff',
    fontWeight: '700',
  },

  bottomBar: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    backgroundColor: '#989898ff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  total: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },

});

export default styles;
