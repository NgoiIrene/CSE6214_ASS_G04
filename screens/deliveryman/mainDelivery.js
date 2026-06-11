//mainDelivery.js

import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function DeliveryMain() {
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
      
      {/* 🌟 顶部终极防撞：用独立 View 强行撑开状态栏高度 */}
      <View style={{ height: Platform.OS === 'ios' ? 10 : 40, backgroundColor: '#fff' }} />

      {/* ==================== 1. 顶部导航栏 ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIconBox} onPress={() => setIsSidebarOpen(true)}>
          <Ionicons name="menu-outline" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOME</Text>
        <View style={{ width: 30 }} />
      </View>
      <View style={styles.divider} />

      {/* ==================== 2. 主体内容区 ==================== */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Your Shifts ({shifts.length})</Text>
        <View style={styles.divider} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {shifts.map((shift) => (
            <View key={shift.id} style={styles.shiftCard}>
              <View style={styles.shiftInfo}>
                <Text style={styles.shiftDate}>{shift.date}</Text>
                <Text style={styles.shiftTime}>{shift.time}</Text>
                <Text style={styles.shiftDuration}>({shift.duration})</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteShift(shift.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ==================== 3. 底部状态栏 ==================== */}
      <View style={{ backgroundColor: '#fff' }}>
        <View style={styles.bottomBar}>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isOnline ? "#4CAF50" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => setIsOnline(!isOnline)}
            value={isOnline}
          />
          <View style={[styles.statusBox, { borderColor: isOnline ? '#000' : '#999' }]}>
            <Text style={[styles.statusText, { color: isOnline ? '#000' : '#999' }]}>
              {isOnline ? 'You are ONLINE' : 'You are OFFLINE'}
            </Text>
          </View>
        </View>
        
        {/* 🌟 底部终极防误触：用硬编码高度的白色物理方块，强行把上面的 bottomBar 往上顶 45 像素 */}
        <View style={{ height: Platform.OS === 'ios' ? 20 : 45, backgroundColor: '#fff' }} />
      </View>

      {/* ==================== 4. 侧边栏 ==================== */}
      {isSidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.closeOverlay} 
            activeOpacity={1} 
            onPress={() => setIsSidebarOpen(false)} 
          />
          
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)} style={styles.sidebarMenuIcon}>
                <Ionicons name="menu-outline" size={30} color="#000" />
              </TouchableOpacity>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#000" />
              </View>
              <Text style={styles.userName}>Charlene</Text>
            </View>

            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItemActive}>
                <Text style={styles.menuTextActive}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Working Shift</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Earnings and Delivery History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Reset Password</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={{ backgroundColor: '#fff' }}>
              <TouchableOpacity style={styles.logoutButton}>
                <Ionicons name="log-out-outline" size={24} color="#000" style={{marginRight: 10}} /><Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
              {/* 侧边栏底部同样强行垫高 */}
              <View style={{ height: Platform.OS === 'ios' ? 25 : 45, backgroundColor: '#fff' }} />
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

// ==================== 样式表 ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  divider: {
    height: 1, 
    backgroundColor: '#000', 
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 10, // 配合上面的防撞 View，这里只需要常规内边距
  },
  menuIconBox: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    padding: 2,
  },
  headerTitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 12,
    paddingLeft: 15,
  },
  shiftCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  shiftInfo: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  shiftTime: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  shiftDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#000',
    backgroundColor: '#fff',
  },
  statusBox: {
    marginLeft: 15,
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    flexDirection: 'row',
    zIndex: 100, 
  },
  closeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  sidebar: {
    width: '65%', 
    backgroundColor: '#fff',
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    paddingTop: 10,
  },
  sidebarHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 40 : 40, // 侧边栏顶部也防撞
  },
  sidebarMenuIcon: {
    position: 'absolute',
    top: 0,
    left: 15,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    padding: 2,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    alignItems: 'center',
  },
  menuItemActive: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', 
  },
  menuText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  logoutButton: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  }
});