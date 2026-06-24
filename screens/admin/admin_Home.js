import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../../supabaseClient'; // 确保路径正确

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化真实数据的 State
  const [dashboardData, setDashboardData] = useState({
    activeUsers: 0,
    activeAds: 0,
    totalMenu: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      const usersPromise = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      const menuPromise = supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true });

      const adsPromise = supabase
        .from('advertising_banners')
        .select('*', { count: 'exact', head: true });

      // 🌟 核心修复：完全匹配你真实的 order 表结构！
      const ordersPromise = supabase
        .from('orders') // 换成了你真实的表名: order
        .select('order_ref, subtotal, status, created_at') // 换成了你真实的列名
        .order('created_at', { ascending: false }) // 默认用 Supabase 自带的 created_at 排序
        .limit(5);

      const [usersRes, menuRes, adsRes, ordersRes] = await Promise.all([
        usersPromise, menuPromise, adsPromise, ordersPromise
      ]);

      if (usersRes.error) throw usersRes.error;
      if (menuRes.error) throw menuRes.error;
      if (adsRes.error) throw adsRes.error;
      if (ordersRes.error) throw ordersRes.error;

      setDashboardData({
        activeUsers: usersRes.count || 0,
        totalMenu: menuRes.count || 0,
        activeAds: adsRes.count || 0,
      });

      setRecentOrders(ordersRes.data || []);

    } catch (error) {
      console.log("Error fetching dashboard data:", error.message);
      // Alert.alert("Data Error", "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    let bgColor = '#f0f0f0';
    let textColor = '#333';

    if (status === 'Completed') { bgColor = '#d4edda'; textColor = '#155724'; }
    else if (status === 'Pending') { bgColor = '#fff3cd'; textColor = '#856404'; }
    else if (status === 'Cancelled') { bgColor = '#f8d7da'; textColor = '#721c24'; }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.statusBadgeText, { color: textColor }]}>{status || 'Unknown'}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      
      <Text style={styles.welcomeTitle}>Welcome,</Text>
      <Text style={styles.welcomeTitleBtm}>Admin!</Text>

      <View style={styles.gridContainer}>
        
        {/* ==================== Card 1: Platform Overview ==================== */}
        <View style={[styles.card, styles.halfCard, { justifyContent: 'space-evenly', paddingVertical: 10 }]}>
          <Text style={styles.cardTitle}>Platform Overview</Text>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Active Users:</Text>
            <Text style={styles.metricValue}>{dashboardData.activeUsers}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Active Advertising Banner:</Text>
            <Text style={styles.metricValue}>{dashboardData.activeAds}</Text>
          </View>
        </View>

        {/* ==================== Card 2: Total Menu ==================== */}
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

        {/* ==================== Card 3: Recent Orders ==================== */}
        <View style={[styles.card, styles.fullCard]}>
          <Text style={styles.cardTitle}>Recent Orders Activity</Text>
          
          <View style={styles.ordersContainer}>
            {recentOrders.length === 0 ? (
              <View style={styles.emptyOrderBox}>
                <Text style={{ color: '#888', fontStyle: 'italic' }}>No recent orders found.</Text>
              </View>
            ) : (
              recentOrders.map((order, index) => (
                <View key={order.order_ref || index} style={[styles.orderRow, index === recentOrders.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    {/* 修复：使用真实的 order_ref */}
                    <Text style={styles.orderIdText}>Order #{String(order.order_ref || 'N/A').substring(0, 6).toUpperCase()}</Text>
                    {renderStatusBadge(order.status)}
                  </View>
                  {/* 修复：使用真实的 total_price */}
                  <Text style={styles.orderAmountText}>RM {parseFloat(order.total_price || 0).toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  scrollContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 40, backgroundColor: '#fff' },
  welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 5 },
  welcomeTitleBtm: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#7f7f7f', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 10, marginBottom: 15, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5 }, android: { elevation: 5 } }) },
  halfCard: { width: '49%', minHeight: 140 },
  fullCard: { width: '100%', paddingHorizontal: 15 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#000' },
  metricItem: { alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 13, fontWeight: '600', color: '#444', textAlign: 'center' },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#000', marginTop: 2 },
  menuLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  menuValue: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  circleChartTrack: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  circleChartProgress: { position: 'absolute', width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#ff5722', borderTopColor: 'transparent' },
  iconDishContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  iconDishCap: { width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  iconDishLine: { width: 18, height: 2, backgroundColor: '#000', marginTop: 1 },
  ordersContainer: { marginTop: 10 },
  emptyOrderBox: { paddingVertical: 20, alignItems: 'center' },
  orderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  orderIdText: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  orderAmountText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' }
});