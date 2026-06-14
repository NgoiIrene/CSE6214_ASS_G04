import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ==================== 🛠️ 模拟订单数据源 ====================
const MOCK_ORDERS = [
  { id: '1', date: '2026-06-10', time: '13:40', orderNo: '1330', customer: 'Cindy', price: 30 },
  { id: '2', date: '2026-06-10', time: '15:20', orderNo: '1331', customer: 'Alex', price: 45 },
  { id: '3', date: '2026-06-12', time: '09:15', orderNo: '1332', customer: 'Ben', price: 15 },
  { id: '4', date: '2026-06-01', time: '18:00', orderNo: '1320', customer: 'David', price: 60 },
  { id: '5', date: '2026-05-28', time: '11:30', orderNo: '1299', customer: 'Eva', price: 25 },
];

export default function OrderHistoryScreen({ onBack, navigateToScreen }) {
  // 🚪 侧边栏显隐状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. 获取今天的真实系统时间
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentDate = today.getDate();

  // 2. 日历状态管理：默认定位到当前真实年、月
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonth); 
  
  // 3. 筛选模式：默认进入为 'D' (天)
  const [filterType, setFilterType] = useState('D'); 
  
  // 4. 用户选中的具体日子：默认进入为当天 (几号)
  const [selectedDay, setSelectedDay] = useState(currentDate); 

  // 5. 动态计算当前月份的日历矩阵 (标准日历：Sun - Sat)
  const calendarDays = useMemo(() => {
    const firstDayInstance = new Date(viewYear, viewMonth, 1);
    const startDayOfWeek = firstDayInstance.getDay(); 
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    const daysArray = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }
    for (let d = 1; d <= totalDaysInMonth; d++) {
      daysArray.push(d);
    }
    return daysArray;
  }, [viewYear, viewMonth]);

  // 6. 获取当前选中的周区间 (Sun 到 Sat) 的精确起止时间戳
  const currentWeekRange = useMemo(() => {
    const selectedDateInstance = new Date(viewYear, viewMonth, selectedDay);
    const selectedWeekDay = selectedDateInstance.getDay(); 
    
    const sunday = new Date(viewYear, viewMonth, selectedDay - selectedWeekDay);
    sunday.setHours(0, 0, 0, 0);
    
    const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
    saturday.setHours(23, 59, 59, 999);

    return { start: sunday.getTime(), end: saturday.getTime() };
  }, [viewYear, viewMonth, selectedDay]);

  // 🚀 核心过滤：根据日历选择动态过滤订单
  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter(order => {
      const orderDate = new Date(order.date);
      const oYear = orderDate.getFullYear();
      const oMonth = orderDate.getMonth();
      const oDay = orderDate.getDate();

      if (filterType === 'M') {
        return oYear === viewYear && oMonth === viewMonth;
      }

      if (filterType === 'D') {
        return oYear === viewYear && oMonth === viewMonth && oDay === selectedDay;
      }

      if (filterType === 'W') {
        const orderTime = orderDate.getTime();
        return orderTime >= currentWeekRange.start && orderTime <= currentWeekRange.end;
      }

      return false;
    });
  }, [filterType, viewYear, viewMonth, selectedDay, currentWeekRange]);

  // 💰 动态累加筛选后的总营业额
  const totalAmount = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + order.price, 0);
  }, [filteredOrders]);

  // 7. 核心高亮逻辑：判断某一天是否应该亮起
  const isDayHighlighted = (day) => {
    if (!day) return false;

    const isFuture = viewYear > currentYear || 
                     (viewYear === currentYear && viewMonth > currentMonth) ||
                     (viewYear === currentYear && viewMonth === currentMonth && day > currentDate);
    if (isFuture) return false;

    if (filterType === 'M') {
      return true;
    }

    if (filterType === 'D') {
      return day === selectedDay;
    }

    if (filterType === 'W') {
      const thisDayTime = new Date(viewYear, viewMonth, day).getTime();
      return thisDayTime >= currentWeekRange.start && thisDayTime <= currentWeekRange.end;
    }

    return false;
  };

  // 8. 判定某个格子是否属于未来日期（用于置灰）
  const isFutureDay = (day) => {
    if (!day) return false;
    if (viewYear > currentYear) return true;
    if (viewYear === currentYear && viewMonth > currentMonth) return true;
    return viewYear === currentYear && viewMonth === currentMonth && day > currentDate;
  };

  // 9. 月份切换处理函数（智能体验修正）
  const handlePrevMonth = () => {
    let targetMonth = viewMonth - 1;
    let targetYear = viewYear;
    if (viewMonth === 0) {
      targetMonth = 11;
      targetYear = viewYear - 1;
    }
    
    setViewMonth(targetMonth);
    setViewYear(targetYear);

    if (targetYear === currentYear && targetMonth === currentMonth) {
      setSelectedDay(currentDate);
    } else {
      setSelectedDay(1);
    }
  };

  const handleNextMonth = () => {
    if (viewYear === currentYear && viewMonth === currentMonth) return;

    let targetMonth = viewMonth + 1;
    let targetYear = viewYear;
    if (viewMonth === 11) {
      targetMonth = 0;
      targetYear = viewYear + 1;
    }

    setViewMonth(targetMonth);
    setViewYear(targetYear);

    if (targetYear === currentYear && targetMonth === currentMonth) {
      setSelectedDay(currentDate);
    } else {
      setSelectedDay(1);
    }
  };

  const isAtCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // 辅助函数：将 YYYY-MM-DD 转换为 D/M/YYYY
  const formatDateStr = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)}/${parseInt(m)}/${y}`;
  };

  // ⚙️ 核心打通：处理侧边栏导航点击与跳转
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false); // 1. 先平滑关闭侧边栏弹窗
    if (targetScreen === 'historyorder') return; // 如果已经是当前页，则不进行操作

    // 2. 双重保障触发外部路由机制
    if (navigateToScreen) {
      navigateToScreen(targetScreen);
    } else if (onBack) {
      onBack(targetScreen); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* ==================== 🚪 侧边栏（Sidebar）组件 ==================== */}
      <Modal
        transparent={true}
        visible={isSidebarOpen}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* 左侧实体菜单 */}
          <View style={styles.sidebar}>
            {/* 顶栏：Menu 切换按钮 */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            {/* 用户头像区域 */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person-outline" size={45} color="#000" />
              </View>
              <Text style={styles.avatarName}>Rasa Syiok</Text>
            </View>

            {/* 导航列表 */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('operationstatus')}>
              <Text style={styles.sidebarItemText}>Update Status</Text>
            </TouchableOpacity>

            {/* 当前页面高亮为灰色背景 */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('historyorder')}>
              <Text style={styles.sidebarItemText}>History Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            {/* 🛠️ 重置密码跳转入口（已确认完美通车） */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            {/* 底部退出登录 */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 右侧空白处暗色遮罩层 */}
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* ==================== 头部导航 ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => setIsSidebarOpen(true)}>
          <Ionicons name="menu" size={35} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      {/* ==================== 营业额总计 ==================== */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>TOTAL : RM {totalAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.divider} />

      {/* ==================== D / W / M 切换标签 ==================== */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, filterType === 'D' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setFilterType('D')}
        >
          <Text style={[styles.tabText, filterType === 'D' && styles.activeTabText]}>D</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, filterType === 'W' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setFilterType('W')}
        >
          <Text style={[styles.tabText, filterType === 'W' && styles.activeTabText]}>W</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, filterType === 'M' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setFilterType('M')}
        >
          <Text style={[styles.tabText, filterType === 'M' && styles.activeTabText]}>M</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* ==================== 主内容区 ==================== */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* ==================== 动态日历面板 ==================== */}
        <View style={styles.googleCalendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonthText}>{monthNames[viewMonth]} {viewYear}</Text>
            <View style={styles.arrowContainer}>
              <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.arrowBtn} 
                onPress={handleNextMonth}
                disabled={isAtCurrentMonth}
              >
                <Ionicons name="chevron-forward" size={18} color={isAtCurrentMonth ? "#ccc" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 星期表头 */}
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, idx) => (
              <Text key={idx} style={styles.weekText}>{w}</Text>
            ))}
          </View>

          {/* 日期格子网格 */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <View key={idx} style={styles.dayBoxEmpty} />;
              }

              const isFuture = isFutureDay(day);
              const isHighlighted = isDayHighlighted(day);
              const isTargetClick = filterType !== 'M' && day === selectedDay && !isFuture;

              return (
                <TouchableOpacity 
                  key={idx} 
                  style={[
                    styles.dayBox, 
                    isHighlighted && styles.dayBoxActive,
                  ]}
                  onPress={() => {
                    if (!isFuture) setSelectedDay(day);
                  }}
                  disabled={isFuture}
                >
                  <View style={[
                    styles.dayNumberContainer,
                    isTargetClick && styles.dayNumberActive
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isFuture && styles.dayTextDisabled,
                      isTargetClick && styles.dayTextActive,
                      isHighlighted && !isTargetClick && styles.dayTextHighlightText
                    ]}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ==================== 底部历史订单卡片列表 ==================== */}
        <View style={styles.resultBar}>
          <Text style={styles.resultBarText}>{filteredOrders.length} Found:</Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found for this period.</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderHistoryGridCard}>
              <View style={styles.cardInnerContent}>
                <View style={styles.cardLeftContent}>
                  <View style={styles.cardRowInline}>
                    <Text style={styles.cardMetaText}>{formatDateStr(order.date)}</Text>
                    <Text style={[styles.cardMetaText, { marginLeft: 30 }]}>{order.time}</Text>
                  </View>
                  <View style={styles.itemsContainer}>
                    <Text style={styles.orderNoText}>Delivery #{order.orderNo}</Text>
                    <Text style={styles.customerNameText}>{order.customer}</Text>
                  </View>
                </View>
                <View style={styles.cardRightContent}>
                  <Text style={styles.priceText}>RM {order.price.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 🎨 粗线框极简风格样式表 ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 40 },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35, 
  },
  headerBackBtn: { width: 35, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'normal', color: '#000' },

  totalContainer: { width: '100%', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  totalText: { fontSize: 28, color: '#000' },

  tabContainer: { flexDirection: 'row', width: '100%', height: 50 },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1.5, borderRightColor: '#000' },
  activeTab: { backgroundColor: '#A9A9A9' },
  inactiveTab: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#000' },
  activeTabText: { color: '#fff' },

  googleCalendarCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calendarMonthText: { fontSize: 16, fontWeight: '600', color: '#3c4043' },
  arrowContainer: { flexDirection: 'row' },
  arrowBtn: { padding: 4, marginLeft: 16 },
  
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekText: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '500', color: '#70757a' },
  
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  dayBox: { width: `${100 / 7}%`, aspectRatio: 1.1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  dayBoxEmpty: { width: `${100 / 7}%`, aspectRatio: 1.1, marginVertical: 2 },
  
  dayBoxActive: { backgroundColor: '#e8f0fe' },
  dayNumberContainer: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayNumberActive: { backgroundColor: '#1a73e8' },
  
  dayText: { fontSize: 12, fontWeight: '400', color: '#3c4043' },
  dayTextActive: { color: '#fff', fontWeight: '600' },
  dayTextHighlightText: { color: '#1a73e8', fontWeight: '500' },
  dayTextDisabled: { color: '#c5c5c5' },

  resultBar: { width: '100%', paddingVertical: 10 },
  resultBarText: { fontSize: 14, color: '#000', fontWeight: '500' },

  orderHistoryGridCard: {
    borderWidth: 1.5, borderColor: '#000', borderRadius: 18,
    backgroundColor: '#fff', overflow: 'hidden', width: '100%', marginBottom: 12
  },
  cardInnerContent: { flexDirection: 'row', paddingVertical: 15, paddingHorizontal: 15, alignItems: 'center', minHeight: 85 },
  cardLeftContent: { flex: 1, justifyContent: 'center' },
  cardRowInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardMetaText: { fontSize: 13, color: '#000' },
  itemsContainer: { marginTop: 2 },
  orderNoText: { fontSize: 14, fontWeight: 'bold', color: '#000', lineHeight: 18 },
  customerNameText: { fontSize: 13, color: '#555', lineHeight: 16 },
  cardRightContent: { justifyContent: 'center', alignItems: 'flex-end', marginLeft: 10 },
  priceText: { fontSize: 28, fontWeight: '500', color: '#000' },

  emptyContainer: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', fontSize: 14 },

  /* ==================== 📌 Sidebar 样式表 ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Dimensions.get('window').width * 0.75, 
    height: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderRightColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 25,
    zIndex: 10,
  },
  sidebarHeader: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  sidebarItem: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    alignItems: 'center',
  },
  sidebarActiveItem: {
    backgroundColor: '#A9A9A9', 
  },
  sidebarItemText: {
    fontSize: 22,
    color: '#000',
    fontWeight: 'normal',
  },
  sidebarFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderTopColor: '#000',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 22,
    color: '#000',
    marginLeft: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
  },
});