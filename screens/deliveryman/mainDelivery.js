import { useNavigation } from '@react-navigation/native';

import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function DeliveryMain() {
    const navigation = useNavigation(); // 🌟 加上这一行
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const [shifts, setShifts] = useState([
    { id: '1', date: '2/6/2026 (Tue)', time: '8.00AM - 10.30AM', duration: '2hrs 30min' },
    { id: '2', date: '3/6/2026 (Wed)', time: '10.30AM - 12.30PM', duration: '2hrs' },
  ]);

  const handleDeleteShift = (id) => {
    setShifts(shifts.filter(shift => shift.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 状态栏防撞区 */}
      <View style={{ height: Platform.OS === 'ios' ? 10 : 40, backgroundColor: '#FFF' }} />

      {/* ==================== 1. 专业级顶部导航栏 ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIconBox} onPress={() => setIsSidebarOpen(true)} activeOpacity={0.7}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOME</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ==================== 2. 主体内容区 (悬浮卡片式设计) ==================== */}
      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Upcoming Shifts</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{shifts.length.toString()}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {shifts.map((shift) => (
            <View key={shift.id} style={styles.shiftCard}>
              <View style={styles.shiftIconBox}>
                <Ionicons name="calendar" size={24} color="#00C853" />
              </View>
              <View style={styles.shiftInfo}>
                <Text style={styles.shiftDate}>{shift.date}</Text>
                <Text style={styles.shiftTime}>{shift.time}</Text>
                <Text style={styles.shiftDuration}>Duration: {shift.duration}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteShift(shift.id)}
                activeOpacity={0.6}
              >
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          
          {/* 🌟 这里就是修复红屏的关键：使用了 ? : null 严格判断 */}
          {shifts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No upcoming shifts.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      {/* ==================== 3. 底部状态栏 (沉浸式操作区) ==================== */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomBar}>
          <View style={styles.switchWrapper}>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
              thumbColor={isOnline ? "#00C853" : "#F5F5F5"}
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => setIsOnline(!isOnline)}
              value={isOnline}
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }} 
            />
          </View>
          
          <View style={[styles.statusBox, isOnline ? styles.statusBoxOnline : styles.statusBoxOffline]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#FFF' : '#999' }]} />
            <Text style={[styles.statusText, { color: isOnline ? '#FFF' : '#666' }]}>
              {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
            </Text>
          </View>
        </View>
        <View style={{ height: Platform.OS === 'ios' ? 20 : 45, backgroundColor: '#FFF' }} />
      </View>

      {/* ==================== 4. 侧边栏 (高级抽屉效果) ==================== */}
      {isSidebarOpen ? (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.closeOverlay} 
            activeOpacity={1} 
            onPress={() => {setIsSidebarOpen(false); // 1. 先关掉菜单
    navigation.navigate('Home'); // 2. 跳转到对应名字的页面} 
            }}/>
          
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color="#FFF" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Irene</Text>
                <Text style={styles.userRole}>Delivery Partner</Text>
              </View>
            </View>

            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItemActive}>
                <Ionicons name="home" size={22} color="#00C853" style={styles.menuIconLeft} />
                <Text style={styles.menuTextActive}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="calendar-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Working Shift</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="wallet-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Earnings & History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Reset Password</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={{ marginRight: 12 }} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <View style={{ height: Platform.OS === 'ios' ? 25 : 45, backgroundColor: '#FFF' }} />
            </View>
          </View>
        </View>
      ) : null}

    </SafeAreaView>
  );
}

// ==================== 商业级样式表 (CSS) ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  menuIconBox: {
    padding: 5,
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 18, 
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  shiftIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  shiftDuration: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    marginTop: 10,
  },
  bottomBarContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  switchWrapper: {
    marginRight: 15,
  },
  statusBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
  },
  statusBoxOnline: {
    backgroundColor: '#00C853', 
  },
  statusBoxOffline: {
    backgroundColor: '#F0F0F0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    zIndex: 100, 
  },
  closeOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', 
  },
  sidebar: {
    width: '75%', 
    backgroundColor: '#FFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    backgroundColor: '#00C853', 
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userRole: {
    fontSize: 13,
    color: '#E8F5E9',
    marginTop: 2,
  },
  menuList: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
  },
  menuItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
    backgroundColor: '#E8F5E9', 
    borderLeftWidth: 4,
    borderColor: '#00C853',
  },
  menuIconLeft: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuTextActive: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00C853',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  logoutButton: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF3B30',
  }
});