import React, { useState, useRef ,useEffect} from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Platform, Dimensions, Alert, Animated, TouchableWithoutFeedback,Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

// 🌟 1. 引入你的其他页面 (确保路径和你的文件名一模一样)
import HomeScreen from './admin_Home';
import ManageAccounts from './admin_manageAccounts';
import ManageAdvertisingBanner from './admin_manageAdvertising';
import ManageContent from './admin_manageContent';
import ProcessApplicationApproval from "./admin_processApplicantApproval";
import GenerateReport from './admin_reports';
import ConfigureSystemSettings from './admin_systemSettings';
import AdminProfileScreen from './admin_profile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

export default function App() {
  // 🌟 2. 核心 State：记录当前打开的是哪个页面，默认是 'Home'
  const [currentPage, setCurrentPage] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  //状态：用于存储 Sidebar 显示的个人信息
  const [sidebarProfile, setSidebarProfile] = useState({
    full_name: 'Admin',
    avatar_url: null
  });

  // 动画控制
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // 每次组件加载时，去 Supabase 抓取当前管理员的名字和头像
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

  // 页面初次加载时执行抓取
  useEffect(() => {
    fetchSidebarProfile();
  }, []);

  // 🌟 3. 这是真正的 toggleSidebar 逻辑，只放动画计算
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

  // 🌟 4. 点击菜单时的动作：设定新页面，并关掉侧边栏
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

  // 🌟 5. 核心渲染器：根据当前点击的菜单，决定中间显示哪个你写好的 UI 页面
  const renderMainContent = () => {
    switch (currentPage) {
      case 'Home':
        return <HomeScreen />; // 显示你的主页 Dashboard
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
      case 'Process Application Approval':
        return <ProcessApplicationApproval />;
      case 'Profile':
        //把 fetchSidebarProfile 作为 prop 传给 Profile 页面
        return <AdminProfileScreen onProfileUpdate={fetchSidebarProfile} />;
      case 'Reset Password':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>{currentPage} Page is coming soon...</Text>
          </View>
        );
      default:
        return <HomeScreen />;
    }
  };

  // 🌟 6. 这里是 RETURN 区域：所有你看到的画面 (UI) 都在这里
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* 遮罩层 */}
      <Animated.View
        style={[styles.overlayWrapper, { opacity: overlayAnim }]}
        pointerEvents={isSidebarOpen ? 'auto' : 'none'}>
        <TouchableWithoutFeedback onPress={() => toggleSidebar(false)}>
          <View style={styles.overlayClickableArea} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* 侧边栏 (这里就是你刚才想放的 UI，我已经帮你改成了支持原生动画的版本) */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => toggleSidebar(false)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        {/* Sidebar 头像和名字根据 state 动态渲染 */}
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
          {/* 显示真实名字 */}
          <Text style={styles.username}>{sidebarProfile.full_name}</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {/* 如果当前页面是 Home，就高亮背景色 */}
          <TouchableOpacity
            style={[styles.menuItem, currentPage === 'Home' && { backgroundColor: '#f0f0f0' }]}
            onPress={() => handleMenuClick('Home')}
          >
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>

          {[
            'Profile', 'Manage Accounts', 'Manage Menu & Content',
            'Generate Reports', 'Configure System Settings',
            'Manage Advertising Board', 'Process Application Approval'
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

      {/* 右侧主界面的顶部 Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => toggleSidebar(true)}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        {/* 标题会根据你点击的页面自动变化！ */}
        <Text style={styles.headerTitle}>{currentPage.toUpperCase()}</Text>
        <View style={{ width: 35 }} />
      </View>

      <View style={styles.divider} />

      {/* 🌟 核心：这里会根据上方的 renderMainContent 自动替换成你的不同文件内容 */}
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
  // 【新增样式】真实图片的尺寸
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