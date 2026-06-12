/**
 * @format
 */

import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setBackgroundMessageHandler } from './src/services/notification.service';

setBackgroundMessageHandler();

AppRegistry.registerComponent(appName, () => App);
