// deliveryNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import DeliveryMain from './mainDelivery';
import EarningsAndHistory from './deliveryEarningsHistory';
import ProcessDeliveryRequest from './processRequest';
import UpdateDeliveryProgress from './updateDeliveryStatus';
import WorkingShift from './workingshift';
import DeliveryProfile from './deliveryProfile';
import DeliveryResetPassword from './deliveryResetPassword';

// 🌟 引入刚创建的全局 Provider
import { RiderProvider } from './RiderProvider'; 

const Stack = createNativeStackNavigator();

export default function DeliveryNavigator() {
  return (
    // 🌟 用 RiderProvider 包裹 Navigator
    <RiderProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={DeliveryMain} />
        <Stack.Screen name="Profile" component={DeliveryProfile} /> 
        <Stack.Screen name="WorkingShift" component={WorkingShift} />
        <Stack.Screen name="EarningsHistory" component={EarningsAndHistory} />
        <Stack.Screen name="ProcessRequest" component={ProcessDeliveryRequest} />
        <Stack.Screen name="UpdateProgress" component={UpdateDeliveryProgress} />
        <Stack.Screen name="ResetPassword" component={DeliveryResetPassword} />
      </Stack.Navigator>
    </RiderProvider>
  );
}