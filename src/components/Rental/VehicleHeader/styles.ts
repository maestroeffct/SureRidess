import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  image: {
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
  content: {
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
});
