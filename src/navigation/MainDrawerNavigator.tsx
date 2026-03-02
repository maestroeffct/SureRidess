import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { MainNavigator } from './MainNavigator';
import { DrawerContent } from '@/components/DrawerContent/DrawerContent';

import type { MainDrawerParamList } from '@/navigation/types';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
      }}
      drawerContent={props => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="MainStack" component={MainNavigator} />
    </Drawer.Navigator>
  );
}
