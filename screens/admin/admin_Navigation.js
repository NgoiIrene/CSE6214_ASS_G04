import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Platform, Dimensions, Alert, Animated, TouchableWithoutFeedback, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

// 🌟 1. Import your other pages (make sure the paths match your file names exactly)
import HomeScreen from './admin_Home';
import ManageAccounts from './admin_manageAccounts';
import ManageAdvertisingBanner from './admin_manageAdvertising';
import ManageContent from './admin_manageContent';
import GenerateReport from './admin_reports';
import ConfigureSystemSettings from './admin_systemSettings';
import AdminProfileScreen from './admin_profile';
import AdminResetPasswordScreen from './admin_ResetPassword'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

export default function App() {
  // 🌟 2. Core State: records which page is currently open, defaults to 'Home'
  const [currentPage, setCurrentPage] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State: stores the personal info displayed in the Sidebar
  const [sidebarProfile, setSidebarProfile] = useState({
    full_name: 'Admin',
    avatar_url: null
  });

  // Animation control
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Fetch the current admin's name and avatar from Supabase each time the component loads
  const fetchSidebarProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setSidebarProfile({
            full_name: data.full_name || 'Admin',
            avatar_url: data.avatar_url || null
          });
        }
      }
    } catch (error) {
      console.log("Error fetching profile for sidebar:", error.message);
    }
  };

  // Fetch on initial page load
  useEffect(() => {
    fetchSidebarProfile();
  }, []);

  // 🌟 3. This is the real toggleSidebar logic, only contains animation calculations
  const toggleSidebar = (open) => {
    setIsSidebarOpen(open);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: open ? 0 : -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: open ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  // 🌟 4. Action when clicking a menu item: set the new page and close the sidebar
  const handleMenuClick = (moduleName) => {
    setCurrentPage(moduleName);
    toggleSidebar(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Logout failed', error.message || 'Please try again.');
      return;
    }
    toggleSidebar(false);
  };

  // 🌟 5. Core renderer: based on the clicked menu item, decide which UI page to show
  const renderMainContent = () => {
    switch (currentPage) {
      case 'Home':
        return <HomeScreen />; 
      case 'Manage Accounts':
        return <ManageAccounts />;
      case 'Manage Menu & Content':
        return <ManageContent />;
      case 'Generate Reports':
        return <GenerateReport />;
      case 'Configure System Settings':
        return <ConfigureSystemSettings />;
      case 'Manage Advertising Board':
        return <ManageAdvertisingBanner />;
      case 'Profile':
        return <AdminProfileScreen onProfileUpdate={fetchSidebarProfile} />;
      case 'Reset Password':
        return <AdminResetPasswordScreen onResetSuccess={() => setCurrentPage('Home')} />;
      default:
        return <HomeScreen />;
    }
  };

  // 🌟 6. This is the RETURN area: all the UI you see on screen is here
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Overlay layer */}
      <Animated.View
        style={[styles.overlayWrapper, { opacity: overlayAnim }]}
        pointerEvents={isSidebarOpen ? 'auto' : 'none'}>
        <TouchableWithoutFeedback onPress={() => toggleSidebar(false)}>
          <View style={styles.overlayClickableArea} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => toggleSidebar(false)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        {/* Sidebar avatar and name */}
        <View style={styles.userSection}>
          <View style={styles.avatarCircle}>
            {sidebarProfile.avatar_url ? (
              <Image source={{ uri: sidebarProfile.avatar_url }} style={styles.realAvatarImage} />
            ) : (
              <>
                <View style={styles.avatarHead} />
                <View style={styles.avatarBody} />
              </>
            )}
          </View>
          <Text style={styles.username}>{sidebarProfile.full_name}</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.menuItem, currentPage === 'Home' && { backgroundColor: '#f0f0f0' }]}
            onPress={() => handleMenuClick('Home')}
          >
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>

          {[
            'Profile', 'Manage Accounts', 'Manage Menu & Content',
            'Generate Reports', 'Configure System Settings',
            'Manage Advertising Board' // Removed: Process Application Approval
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, currentPage === item && { backgroundColor: '#f0f0f0' }]}
              onPress={() => handleMenuClick(item)}
            >
              <Text style={styles.menuItemText}>{item}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}>
            <Text style={styles.menuItemText}>Reset Password</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#000" style={{ transform: [{ scaleX: -1 }] }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Top Header for the main content area on the right */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => toggleSidebar(true)}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentPage.toUpperCase()}</Text>
        <View style={{ width: 35 }} />
      </View>

      <View style={styles.divider} />

      {/* Main content rendering */}
      <View style={{ flex: 1 }}>
        {renderMainContent()}
      </View>

    </SafeAreaView>
  );
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35, backgroundColor: '#fff', zIndex: 10 },
  hamburgerBtn: { width: 35, height: 30, borderRadius: 4, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', letterSpacing: 2 },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  sidebar: { position: 'absolute', top: 0, left: 0, height: SCREEN_HEIGHT + 60, width: SIDEBAR_WIDTH, backgroundColor: '#ffffff', borderRightWidth: 2, borderColor: '#000000', zIndex: 100, paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  sidebarHeader: { height: 65, justifyContent: 'center', paddingLeft: 15, paddingTop: Platform.OS === 'ios' ? 0 : 20 },
  userSection: { alignItems: 'center', paddingVertical: 15 },
  avatarCircle: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 5 },
  realAvatarImage: { width: 55, height: 55, borderRadius: 27.5 },
  avatarHead: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#000', marginTop: 4 },
  avatarBody: { width: 34, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginBottom: -8 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  menuList: { flex: 1 },
  menuItem: { width: '100%', paddingVertical: 12, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#fff' },
  menuItemText: { fontSize: 14, fontWeight: 'bold', textAlign: 'left', color: '#000', paddingLeft: 30 },
  logoutBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 2, borderColor: '#0f100f', backgroundColor: '#fff' },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#070707', marginLeft: 8 },
  overlayWrapper: { position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT + 90, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 90 },
  overlayClickableArea: { flex: 1 }
});