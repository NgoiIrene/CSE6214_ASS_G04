import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useContext, useCallback } from 'react';
import { Image, ActivityIndicator } from 'react-native';
import { RiderContext } from './RiderProvider';
import { supabase } from '../../supabaseClient';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function EarningsAndHistory() {
  const navigation = useNavigation();
  const { avatarUri, riderName } = useContext(RiderContext);

  // 获取今天的日期 (YYYY-MM-DD 格式)
  const getTodayStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ================= 1. 状态管理 =================
  const [activeTab, setActiveTab] = useState('Week');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 🌟 从数据库拉取的真实历史数据
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 每次进入此页面，自动从 Supabase 的 orders 表拉取已完成订单
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // 🌟 核心修改：直接查 orders 表，且只看 completed 的单子！
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles:user_id(full_name)')
        .eq('rider_id', session.user.id)
        .eq('status', 'completed') // 🎯 只要已完成的订单
        .order('created_at', { ascending: false }); // 最新的排在最上面

      if (error) {
        Alert.alert("Fetch Error", error.message);
      } else if (data) {
        // 🌟 将 orders 里的 created_at 格式化为日历能读懂的结构
        const formattedData = data.map(item => {
          const dateObj = new Date(item.created_at);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          
          return {
            ...item,
            customer_name: item.profiles?.full_name || item.customer_name || 'Customer',
            calendar_date: `${year}-${month}-${day}`, // 专门给日历过滤用的 YYYY-MM-DD
            display_time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // 显示用的 14:30 PM
          };
        });

        setHistoryData(formattedData);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 核心算法：日历大面积涂色
  const markedDates = useMemo(() => {
    const marks = {};
    const dateObj = new Date(selectedDate);
    const themeBlue = '#2196F3';

    if (activeTab === 'Day') {
      marks[selectedDate] = { color: themeBlue, textColor: 'white', startingDay: true, endingDay: true };
    }
    else if (activeTab === 'Week') {
      const dayOfWeek = dateObj.getDay();
      const sunday = new Date(dateObj);
      sunday.setDate(dateObj.getDate() - dayOfWeek);

      for (let i = 0; i < 7; i++) {
        const nextDate = new Date(sunday);
        nextDate.setDate(sunday.getDate() + i);
        const dateStr = formatDate(nextDate);

        marks[dateStr] = {
          color: themeBlue,
          textColor: 'white',
          startingDay: i === 0,
          endingDay: i === 6,
        };
      }
    }
    else if (activeTab === 'Month') {
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= lastDay; i++) {
        const d = new Date(year, month, i);
        const dateStr = formatDate(d);
        marks[dateStr] = {
          color: themeBlue,
          textColor: 'white',
          startingDay: i === 1,
          endingDay: i === lastDay,
        };
      }
    }
    return marks;
  }, [selectedDate, activeTab]);

  // 🌟 根据日历选中的区间过滤数据 (对比 calendar_date)
  const filteredData = useMemo(() => {
    const activeMarkedDates = Object.keys(markedDates);
    return historyData.filter(item => activeMarkedDates.includes(item.calendar_date));
  }, [markedDates, historyData]);

  // 计算所选区间的总收入
  const totalEarnings = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (Number(item.earning) || 0), 0).toFixed(2);
  }, [filteredData]);

  const handleBack = () => navigation.goBack();

  // ================= 2. 界面渲染 =================
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => setIsSidebarOpen(true)}>
          <View style={styles.menuIconBorder}>
            <Ionicons name="menu" size={26} color="black" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTORY</Text>
        <View style={{ width: 40, marginLeft: 15 }} />
      </View>

      <View style={styles.totalEarningsBoard}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconOutline}>
          <Ionicons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <View style={styles.totalEarningsCenter}>
          <Text style={styles.totalLabel}>Total Earnings ({activeTab}):</Text>
          <Text style={styles.totalAmount}>RM {totalEarnings}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        <View style={styles.tabsContainer}>
          {['Day', 'Week', 'Month'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab ? styles.tabButtonActive : null]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markingType={'period'}
            markedDates={markedDates}
            theme={{
              todayTextColor: '#2196F3',
              arrowColor: 'black',
              monthTextColor: 'black',
              textMonthFontWeight: 'bold',
            }}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>{filteredData.length} Deliveries Found:</Text>
        </View>

        <View style={styles.listContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
          ) : (
            filteredData.map((item) => (
              <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.7}>
                <View style={styles.cardLeft}>
                  {/* 🌟 日期与时间 */}
                  <Text style={styles.timeText}>{item.calendar_date} • {item.display_time}</Text>
                  
                  {/* 🌟 订单编号 */}
                  <Text style={styles.orderIdText}>Order {item.order_number}</Text>
                  
                  {/* 🌟 顾客名字 */}
                  <View style={styles.customerRow}>
                    <Ionicons name="person" size={12} color="#666" />
                    <Text style={styles.customerText}>{item.customer_name}</Text>
                  </View>
                  
                  {/* 🌟 食物详情 */}
                  <View style={styles.foodRow}>
                    <Ionicons name="restaurant-outline" size={12} color="#888" />
                    <Text style={styles.foodText} numberOfLines={2}>{item.food_details}</Text>
                  </View>

                </View>
                <View style={styles.cardRight}>
                  {/* 🌟 外卖员收益 */}
                  <Text style={styles.earningText}>RM {Number(item.earning).toFixed(2)}</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#00C853" style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            ))
          )}

          {!isLoading && filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color="#CCC" />
              <Text style={styles.emptyStateText}>No deliveries found for this period.</Text>
            </View>
          ) : null}
        </View>

      </ScrollView>

      {/* 侧边栏 */}
      {isSidebarOpen ? (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.closeOverlay}
            activeOpacity={1}
            onPress={() => setIsSidebarOpen(false)}
          />

          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.profileAvatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImageReal} />
                ) : (
                  <Ionicons name="person" size={36} color="#FFF" />
                )}
              </View>
              <Text style={styles.profileName}>{riderName}</Text>
            </View>

            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Home'); }}>
                <Ionicons name="home-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>HOME</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Profile'); }}>
                <Ionicons name="person-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>PROFILE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('WorkingShift'); }}>
                <Ionicons name="calendar-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>WORKING SHIFT</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItemActive} onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="wallet" size={22} color="#424242" style={styles.menuIconLeft} />
                <Text style={styles.menuTextActive}>EARNINGS & HISTORY</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('ResetPassword'); }}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>RESET PASSWORD</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity
                style={styles.logoutButton}
                activeOpacity={0.7}
                onPress={async () => {
                  setIsSidebarOpen(false);
                  const { error } = await supabase.auth.signOut();
                  if (error) return Alert.alert('Logout failed', error.message || 'Please try again.');
                }}
              >
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, marginTop: 30, backgroundColor: '#FFF', borderBottomWidth: 1.5, borderBottomColor: '#E0E0E0' },
  menuIcon: { paddingHorizontal: 5 },
  menuIconBorder: { width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: '#000', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  totalEarningsBoard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingVertical: 20, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', position: 'relative' },
  backIconOutline: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', position: 'absolute', left: 15, zIndex: 10 },
  totalEarningsCenter: { flex: 1, alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { fontSize: 36, fontWeight: '900', color: '#00C853', marginTop: 5 },
  tabsContainer: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
  tabButton: { flex: 1, paddingVertical: 10, borderWidth: 1.5, borderColor: '#000', alignItems: 'center', marginHorizontal: 4, borderRadius: 6, backgroundColor: '#FFF' },
  tabButtonActive: { backgroundColor: '#424242', borderColor: '#424242' },
  tabText: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  tabTextActive: { color: '#FFF' },
  calendarContainer: { paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 10 },
  listHeader: { padding: 15, backgroundColor: '#F0F0F0', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  listHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  listContainer: { paddingBottom: 20 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#FFF' },
  cardLeft: { flex: 1, paddingRight: 10 },
  timeText: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  orderIdText: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  customerText: { fontSize: 12, color: '#666', marginLeft: 6 },
  foodRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 },
  foodText: { fontSize: 12, color: '#888', marginLeft: 6, flex: 1, lineHeight: 16 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  earningText: { fontSize: 18, fontWeight: '900', color: '#000' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { marginTop: 10, color: '#999', fontSize: 14 },
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', zIndex: 100 },
  closeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { width: '75%', backgroundColor: '#FFF', height: '100%', shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15 },
  sidebarHeader: { alignItems: 'center', padding: 25, paddingTop: Platform.OS === 'ios' ? 60 : 50, backgroundColor: '#424242' },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarImageReal: { width: 60, height: 60, borderRadius: 30 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  menuList: { flex: 1, paddingTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 25 },
  menuItemActive: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 25, backgroundColor: '#F5F5F5', borderLeftWidth: 4, borderColor: '#424242' },
  menuIconLeft: { marginRight: 15 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#333' },
  menuTextActive: { fontSize: 15, fontWeight: 'bold', color: '#424242' },
  sidebarFooter: { borderTopWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
  logoutButton: { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 25, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: 'bold', color: '#FF3B30' }
});