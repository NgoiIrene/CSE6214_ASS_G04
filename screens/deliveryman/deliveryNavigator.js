import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// 1. 把你做好的界面全部 Import 进来 (确保路径跟你实际的文件名一致)
import DeliveryMain from './mainDelivery';
import EarningsAndHistory from './deliveryEarningsHistory';
import ProcessDeliveryRequest from './processRequest';
import UpdateDeliveryProgress from './updateDeliveryStatus';
import WorkingShift from './workingshift';

const Stack = createNativeStackNavigator();

export default function DeliveryNavigator() {
  return (
    // headerShown: false 会隐藏自带的头部栏
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* 第一个放的就是默认启动页 (Home) */}
      <Stack.Screen name="Home" component={DeliveryMain} />
      
      {/* 把其他页面全部注册进地图里 */}
      <Stack.Screen name="WorkingShift" component={WorkingShift} />
      <Stack.Screen name="EarningsHistory" component={EarningsAndHistory} />
      {/* <Stack.Screen name="ProcessRequest" component={ProcessDeliveryRequest} />
      <Stack.Screen name="UpdateProgress" component={UpdateDeliveryProgress} />
       */}
    </Stack.Navigator>
  );
}