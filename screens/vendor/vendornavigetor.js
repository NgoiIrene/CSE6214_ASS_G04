import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import { supabase } from '../../supabaseClient';

// ==================== 🛠️ Real sub-page imports ====================
import OrderScreen from './order';
import ReviewScreen from './review';
import MenuScreen from './menu';
import HistoryOrderScreen from './historyorder';
import OperationStatusScreen from './operationstatus';
import ResetPasswordScreen from './resetpassword';
import ProfileScreen from './vendorprofile'; // Make sure the filename matches exactly

export default function App() {
  // Initially set to the 'order' page
  const [currentScreen, setCurrentScreen] = useState('order');

  // Core routing method
  const navigateToScreen = async (screenName) => {
    console.log(`[Router Navigation] Navigating to page: ${screenName}`);
    if (screenName === 'logout') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Logout failed', error.message || 'Please try again.');
        return;
      }
      // After successful logout, the root App will receive the auth state change and return to the Auth login page
      return;
    }
    setCurrentScreen(screenName);
  };

  // Renders the corresponding real component based on the string returned by the child page sidebar
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
      case 'profile': // ✨ New addition: personal profile page branch
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

