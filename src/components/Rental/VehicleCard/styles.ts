import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  sortBtn: {
    flex: 1,
  },

  filterBtn: {
    flex: 1,
  },

  list: {
    paddingBottom: 40,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
  },

  image: {
    height: 180,
    width: '100%',
  },

  tags: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },

  tag: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  verified: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  cardContent: {
    padding: 14,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },

  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  price: {
    alignItems: 'flex-end',
  },
});
