import { StyleSheet } from 'react-native';

const GREEN = '#0B6E4F';

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

  summaryCard: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },

  location: {
    fontWeight: '600',
  },

  date: {
    marginTop: 4,
    color: '#777',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  sortBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    height: 48,
  },

  sortText: {
    color: '#fff',
  },

  filterBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    height: 48,
    backgroundColor: '#fff',
  },

  list: {
    paddingTop: 5,
    width: '100%',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },

  image: {
    height: 180,
    width: '100%',
  },

  badges: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },

  badgeLight: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeGreen: {
    backgroundColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  cardContent: {
    padding: 14,
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
    marginVertical: 10,
  },

  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  price: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },

  amount: {
    color: GREEN,
    fontWeight: '700',
  },

  icons: {
    paddingRight: 40,
  },
  spacer: {
    width: '100%',
    height: 32,
    backgroundColor: 'blue',
  },
});

export default styles;
