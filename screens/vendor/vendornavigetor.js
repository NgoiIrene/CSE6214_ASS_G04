import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import { supabase } from '../../supabaseClient';

// ==================== 🛠️ 真实子页面引入 ====================
import OrderScreen from './order';
import ReviewScreen from './review';
import MenuScreen from './menu';
import HistoryOrderScreen from './historyorder';
import OperationStatusScreen from './operationstatus';
import ResetPasswordScreen from './resetpassword';
import ProfileScreen from './vendorprofile'; // 确保文件名与此处完全一致

export default function App() {
  // 初始设为 'order' 页面
  const [currentScreen, setCurrentScreen] = useState('order');

  // 路由跳转核心方法
  const navigateToScreen = async (screenName) => {
    console.log(`[路由导航] 正在前往页面: ${screenName}`);
    if (screenName === 'logout') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Logout failed', error.message || 'Please try again.');
        return;
      }
      // 登出成功后，根 App 会收到 auth state 改变并切回 Auth 登录页
      return;
    }
    setCurrentScreen(screenName);
  };

  // 根据子页面侧边栏传回的字符串渲染对应的真实组件
  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MenuScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'order':
        return <OrderScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'review':
        return <ReviewScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'historyorder':
        return <HistoryOrderScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'operationstatus':
        return <OperationStatusScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'resetpassword':
        return <ResetPasswordScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'profile': // ✨ 新增：个人资料页面分支
        return <ProfileScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      default:
        return <MenuScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

