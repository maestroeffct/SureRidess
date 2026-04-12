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

  /* ── Payment Method Cards ── */
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    backgroundColor: '#fff',
  },

  paymentCardSelected: {
    borderColor: '#0B6E4F',
    backgroundColor: '#F0FDF4',
  },

  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  paymentIconSelected: {
    backgroundColor: '#D1FAE5',
  },

  paymentInfo: {
    flex: 1,
    gap: 2,
  },

  paymentLabelSelected: {
    color: '#0B6E4F',
    fontWeight: '600',
  },

  paymentSubtitle: {
    opacity: 0.55,
  },

  paymentCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  paymentCheckSelected: {
    borderColor: '#0B6E4F',
    backgroundColor: '#0B6E4F',
  },

  /* ── Fixed Bottom Bar ── */
  bottomBar: {
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  priceInfo: {
    flex: 1,
  },

  priceLabel: {
    opacity: 0.55,
    marginBottom: 2,
  },

  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B6E4F',
  },

  priceSub: {
    opacity: 0.5,
    marginTop: 2,
  },

  bookBtn: {
    flex: 1,
  },
});

export default styles;
