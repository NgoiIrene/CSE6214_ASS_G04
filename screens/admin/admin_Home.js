import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Dimensions,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 模拟的 Database 数据 (使用纯数字，避免渲染异常)
  const [dashboardData, setDashboardData] = useState({
    activeUsers: '1,245',
    pendingApprovals: '34',
    activeAds: '12',
    totalMenu: '325',
    // 柱状图高度数组 (Sun 到 Sat)
    chartHeights: [90, 50, 80, 70, 105, 85, 35]
  });

  const handleMenuClick = (moduleName) => {
    Alert.alert("Navigation", `Connecting to ${moduleName} module...`);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "You have been logged out successfully.");
    setIsSidebarOpen(false);
  };

  // 🌟 核心防错渲染函数：确保侧边栏遮罩的闭合绝对干净
  const renderOverlay = () => {
    if (isSidebarOpen) {
      return (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setIsSidebarOpen(false)} 
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 调用渲染函数，彻底消灭条件渲染带来的隐形 Text 报错 */}
      {renderOverlay()}

      {/* ==================== 1. LEFT SIDEBAR ==================== */}
      <View style={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        <View style={styles.userSection}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>
          <Text style={styles.username}>Charlene</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}>
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Profile')}>
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Accounts')}>
            <Text style={styles.menuItemText}>Manage Accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Menu & Content')}>
            <Text style={styles.menuItemText}>Manage Menu & Content</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Generate Reports')}>
            <Text style={styles.menuItemText}>Generate Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Configure System Settings')}>
            <Text style={styles.menuItemText}>Configure System Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Advertising Board')}>
            <Text style={styles.menuItemText}>Manage Advertising Board</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Process Application Approval')}>
            <Text style={styles.menuItemText}>Process Application Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}>
            <Text style={styles.menuItemText}>Reset Password</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#000" style={{ transform: [{ scaleX: -1}]}} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ==================== 2. RIGHT MAIN CONTENT ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOME</Text>
        <View style={{ width: 35 }} /> 
      </View>

      <View style={styles.divider} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 使用安全的单行渲染 */}
        <Text style={styles.welcomeTitle}>Welcome,</Text>
        <Text style={styles.welcomeTitleBtm}>Charlene!</Text>

        <View style={styles.gridContainer}>
          
          {/* Card 1: Platform Overview */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Platform Overview</Text>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Active Users:</Text>
              <Text style={styles.metricValue}>{dashboardData.activeUsers}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Pending Approvals:</Text>
              <Text style={styles.metricValue}>{dashboardData.pendingApprovals}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Active Advertising Banner:</Text>
              <Text style={styles.metricValue}>{dashboardData.activeAds}</Text>
            </View>
          </View>

          {/* Card 2: Total Menu */}
          <View style={[styles.card, styles.halfCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
              <Text style={styles.menuLabel}>Total Menu</Text>
              <Text style={styles.menuValue}>{dashboardData.totalMenu}</Text>
            </View>
            <View style={styles.circleChartTrack}>
              <View style={styles.circleChartProgress} />
              <View style={styles.iconDishContainer}>
                <View style={styles.iconDishCap} />
                <View style={styles.iconDishLine} />
              </View>
            </View>
          </View>

          {/* Card 3: Weekly Revenue */}
          <View style={[styles.card, styles.fullCard]}>
            <Text style={styles.cardTitle}>Weekly Revenue</Text>
            
            <View style={styles.chartWrapper}>
              
              {/* 🌟 Y轴完全重写：硬编码你的需求 120 90 60 30 20 0 */}
              <View style={styles.yAxisLabels}>
                <Text style={styles.yAxisText}>120</Text>
                <Text style={styles.yAxisText}>90</Text>
                <Text style={styles.yAxisText}>60</Text>
                <Text style={styles.yAxisText}>30</Text>
                <Text style={styles.yAxisText}>20</Text>
                <Text style={[styles.yAxisText, { marginBottom: 15 }]}>0</Text>
              </View>

              {/* 🌟 图表区：撤销 map 函数，恢复硬编码 View，彻底切断所有报错来源 */}
              <View style={styles.chartContainer}>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: dashboardData.chartHeights[0] }]} />
                  <Text style={styles.xAxisLabel}>Sun</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: dashboardData.chartHeights[1] }]} />
                  <Text style={styles.xAxisLabel}>Mon</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: dashboardData.chartHeights[2] }]} />
                  <Text style={styles.xAxisLabel}>Tue</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: dashboardData.chartHeights[3] }]} />
                  <Text style={styles.xAxisLabel}>Wed</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: dashboardData.chartHeights[4] }]} />
                  <Text style={styles.xAxisLabel}>Thu</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: dashboardData.chartHeights[5] }]} />
                  <Text style={styles.xAxisLabel}>Fri</Text>
                </View>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height: dashboardData.chartHeights[6] }]} />
                  <Text style={styles.xAxisLabel}>Sat</Text>
                </View>
              </View>

            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 15 : 35, 
    backgroundColor: '#fff',
    zIndex: 10,
  },
  hamburgerBtn: {
    width: 35, height: 30, borderRadius: 4,
    justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4,
  },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', letterSpacing: 2 },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  
  scrollContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 40 },
  
  // 拆分 Title，防止换行符号引起报错
  welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 5 },
  welcomeTitleBtm: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#7f7f7f', borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 10, marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5 },
      android: { elevation: 5 }
    }),
  },
  halfCard: { width: '49%', minHeight: 140 },
  fullCard: { width: '100%' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#000' },
  
  metricItem: { alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 11, color: '#444' },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  
  menuLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  menuValue: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  
  circleChartTrack: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  circleChartProgress: { position: 'absolute', width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#ff5722', borderTopColor: 'transparent' },
  
  iconDishContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  iconDishCap: { width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  iconDishLine: { width: 18, height: 2, backgroundColor: '#000', marginTop: 1 },

  // === 🌟 Y轴与图表布局 (精确对齐) ===
  chartWrapper: {
    flexDirection: 'row',
    height: 140, // 图表总高度
    marginTop: 10,
  },
  yAxisLabels: {
    width: 30, // 设定固定宽度保证对齐
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisText: {
    fontSize: 9, // 字号调小一点以适应
    color: '#000000',
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#000000',
    paddingLeft: 10, 
    paddingRight: 5,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 18,
    backgroundColor: '#000000',
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#000000',
    marginTop: 5, // 将底部的字和线拉开一点距离
  },

  // === SIDEBAR 样式 ===
  sidebar: { position: 'absolute', top: Platform.OS === 'ios' ? 44 : 40,height: '100%', width: SIDEBAR_WIDTH, backgroundColor: '#ffffff', borderRightWidth: 2, borderColor: '#000000', zIndex: 100 },
  sidebarOpen: { left: 0 },
  sidebarClosed: { left: -SIDEBAR_WIDTH - 10 },
  sidebarHeader: { height: 65, justifyContent: 'center', paddingLeft: 15, paddingTop: Platform.OS === 'ios' ? 0 : 20 },
  userSection: { alignItems: 'center', paddingVertical: 15 },
  avatarCircle: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 5 },
  avatarHead: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#000', marginTop: 4 },
  avatarBody: { width: 34, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginBottom: -8 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  menuList: { flex: 1 },
  menuItem: { width: '100%', paddingVertical: 12, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#fff' },
  menuItemText: { fontSize: 14, fontWeight: 'bold', textAlign: 'left', color: '#000',paddingLeft: 30},
  logoutBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingBottom: Platform.OS === 'ios' ? 20 : 15, borderTopWidth: 2, borderColor: '#0f100f', backgroundColor: '#fff' ,marginBottom: Platform.OS === 'ios' ? 10 : 5,},
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#070707', marginLeft: 8 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 90 },
});