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

  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 140,
    alignItems: 'center',
  },

  successWrap: {
    marginBottom: 20,
  },

  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },

  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    color: '#6B7280',
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 28,
  },

  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  label: {
    color: '#6B7280',
  },

  value: {
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
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
});

export default styles;
