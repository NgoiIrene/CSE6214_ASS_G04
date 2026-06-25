import React, { useState, useMemo, useEffect } from 'react';
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
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image // 🎯 确保导入了 Image 组件用于显示头像
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 🎯 引入 Supabase 客户端实例 (根据你的项目结构，路径保持与 resetpassword 相同)
import { supabase } from '../../supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OrderHistoryScreen({ onBack, navigateToScreen }) {
  // 🚪 侧边栏显隐状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // 👤 Supabase 用户资料状态（Sidebar 动态展示使用）
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 📦 真实订单数据源
  const [orders, setOrders] = useState([]);

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

  // ==================== 👤 副作用 1：动态拉取当前登录用户的 profiles 数据 ====================
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setProfileName('Guest');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          if (profile.full_name) setProfileName(profile.full_name);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.log('Fetch profile error:', error.message);
        setProfileName('User');
      }
    };

    fetchUserProfile();
  }, []);

  // ==================== 📦 副作用 2：动态拉取当前 Vendor 对应的所有订单 ====================
  useEffect(() => {
    const fetchVendorOrders = async () => {
      try {
        setIsLoadingOrders(true);
        // 1. 获取当前登录的 Vendor 用户
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;

        // 2. 同时拉取订单列表（status 为 'completed'）和 佣金率配置
        const [ordersResult, finResult] = await Promise.all([
          supabase
            .from('orders')
            .select('id, created_at, order_number, subtotal, total_price, profiles:user_id(full_name)')
            .eq('vendor_id', user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false }),
          supabase
            .from('system_financial_settings')
            .select('commission_rate')
            .eq('id', 1)
            .single(),
        ]);

        if (ordersResult.error) throw ordersResult.error;

        // 3. 取出佣金率
        const commissionRate = finResult.data ? Number(finResult.data.commission_rate) : 0;

        if (ordersResult.data) {
          // 格式规范化转换
          const formattedOrders = ordersResult.data.map(o => {
            // 解析 created_at 为本地日期和时间
            const dateObj = new Date(o.created_at);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            // 计算利润: subtotal * (100 - commissionRate) / 100
            const profit = Number(o.subtotal || 0) * (100 - commissionRate) / 100;

            return {
              id: String(o.id),
              date: dateStr,
              time: timeStr,
              orderNo: o.order_number || String(o.id),
              customer: o.profiles?.full_name || 'Customer',
              price: Number(o.total_price || 0),
              profit: profit
            };
          });
          setOrders(formattedOrders);
        }
      } catch (error) {
        console.log('Fetch orders error:', error.message);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchVendorOrders();
  }, []);

  // 5. 动态计算当前月份的日历矩阵
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

  // 6. 获取当前选中的周区间精确定位时间戳
  const currentWeekRange = useMemo(() => {
    const selectedDateInstance = new Date(viewYear, viewMonth, selectedDay);
    const selectedWeekDay = selectedDateInstance.getDay();

    const sunday = new Date(viewYear, viewMonth, selectedDay - selectedWeekDay);
    sunday.setHours(0, 0, 0, 0);

    const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
    saturday.setHours(23, 59, 59, 999);

    return { start: sunday.getTime(), end: saturday.getTime() };
  }, [viewYear, viewMonth, selectedDay]);

  // 🚀 核心过滤：根据选择过滤对应周期的订单数据
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
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
  }, [orders, filterType, viewYear, viewMonth, selectedDay, currentWeekRange]);

  // 💰 动态累加筛选后的总利润 (Total Profit)
  const totalProfitAmount = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + order.profit, 0);
  }, [filteredOrders]);

  // 7. 核心高亮逻辑：判断某一天是否应该亮起
  const isDayHighlighted = (day) => {
    if (!day) return false;

    const isFuture = viewYear > currentYear ||
      (viewYear === currentYear && viewMonth > currentMonth) ||
      (viewYear === currentYear && viewMonth === currentMonth && day > currentDate);
    if (isFuture) return false;

    if (filterType === 'M') return true;

    if (filterType === 'D') return day === selectedDay;

    if (filterType === 'W') {
      const thisDayTime = new Date(viewYear, viewMonth, day).getTime();
      return thisDayTime >= currentWeekRange.start && thisDayTime <= currentWeekRange.end;
    }

    return false;
  };

  // 8. 判定某个格子是否属于未来日期
  const isFutureDay = (day) => {
    if (!day) return false;
    if (viewYear > currentYear) return true;
    if (viewYear === currentYear && viewMonth > currentMonth) return true;
    return viewYear === currentYear && viewMonth === currentMonth && day > currentDate;
  };

  // 9. 月份切换处理函数
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
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)}/${parseInt(m)}/${y}`;
  };

  // ⚙️ 处理侧边栏导航点击与跳转
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false);
    if (targetScreen === 'historyorder') return;

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
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            {/* 用户头像区域 */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={{ width: 68, height: 68, borderRadius: 34 }} 
                  />
                ) : (
                  <Ionicons name="person-outline" size={45} color="#000" />
                )}
              </View>
              <Text style={styles.avatarName}>{profileName}</Text>
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
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('historyorder')}>
              <Text style={styles.sidebarItemText}>History Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

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

      {/* ==================== 营业总计：显示计算后的总利润 (Total Profit) ==================== */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>TOTAL PROFIT : RM {totalProfitAmount.toFixed(2)}</Text>
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

          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, idx) => (
              <Text key={idx} style={styles.weekText}>{w}</Text>
            ))}
          </View>

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

        {isLoadingOrders ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : filteredOrders.length === 0 ? (
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
                    <Text style={styles.orderPriceSubText}>Total Price: RM {order.price.toFixed(2)}</Text>
                  </View>
                </View>
                {/* 右侧区域：高亮渲染该笔订单为当前 Vendor 产生的真实 Profit (利润) */}
                <View style={styles.cardRightContent}>
                  <Text style={styles.profitLabelText}>PROFIT</Text>
                  <Text style={styles.priceText}>RM {order.profit.toFixed(2)}</Text>
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
  totalText: { fontSize: 24, fontWeight: 'bold', color: '#000' },

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

  weekRow: { flexDirection: 'row', marginBottom: 10 },
  weekText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500', color: '#70757a' },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  dayBox: { flexBasis: '14.2857%', maxWidth: '14.2857%', aspectRatio: 1.1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  dayBoxEmpty: { flexBasis: '14.2857%', maxWidth: '14.2857%', aspectRatio: 1.1, marginVertical: 2 },

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
  orderPriceSubText: { fontSize: 12, color: '#999', marginTop: 2 },
  cardRightContent: { justifyContent: 'center', alignItems: 'flex-end', marginLeft: 10 },
  profitLabelText: { fontSize: 10, fontWeight: 'bold', color: '#555', marginBottom: -2 },
  priceText: { fontSize: 24, fontWeight: 'bold', color: '#000' },

  emptyContainer: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', fontSize: 14 },

  /* ==================== 📌 Sidebar 样式表 ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SCREEN_WIDTH * 0.75,
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
    overflow: 'hidden', 
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 5,
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