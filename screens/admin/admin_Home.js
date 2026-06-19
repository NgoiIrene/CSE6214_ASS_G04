// import React, { useState, useEffect } from 'react';
// import { 
//   StyleSheet, 
//   Text, 
//   View, 
//   ScrollView,
//   Platform,
//   ActivityIndicator,
//   Alert
// } from 'react-native';
// import { supabase } from '../../supabaseClient'; // 确保路径正确

// export default function HomeScreen() {
//   const [isLoading, setIsLoading] = useState(true);
  
//   // 初始化真实数据的 State
//   const [dashboardData, setDashboardData] = useState({
//     activeUsers: 0,
//     activeAds: 0,
//     totalMenu: 0,
//     chartHeights: [90, 50, 80, 70, 105, 85, 35] // 默认的图表高度
//   });

//   // 页面加载时抓取数据
//   useEffect(() => {
//     fetchDashboardStats();
//   }, []);

//   const fetchDashboardStats = async () => {
//     try {
//       setIsLoading(true);

//       // 1. 抓取 Active Users (利用 count: 'exact', head: true 高效数人头)
//       const usersPromise = supabase
//         .from('profiles')
//         .select('*', { count: 'exact', head: true })
//         .eq('status', 'Active'); // 只算 Active 的人

//       // 2. 抓取 Total Menu
//       const menuPromise = supabase
//         .from('food_items')
//         .select('*', { count: 'exact', head: true });

//       // 3. 抓取 Active Ads
//       const adsPromise = supabase
//         .from('advertising_banners')
//         .select('*', { count: 'exact', head: true });

//       // 等待三个数据库请求一起完成 (并行处理，速度更快)
//       const [usersRes, menuRes, adsRes] = await Promise.all([
//         usersPromise, menuPromise, adsPromise
//       ]);

//       if (usersRes.error) throw usersRes.error;
//       if (menuRes.error) throw menuRes.error;
//       if (adsRes.error) throw adsRes.error;

//       // 把算出来的真实数字放进页面里
//       setDashboardData({
//         activeUsers: usersRes.count || 0,
//         totalMenu: menuRes.count || 0,
//         activeAds: adsRes.count || 0,
//         chartHeights: [90, 50, 80, 70, 105, 85, 35] // Weekly Revenue 图表暂时保留默认假数据
//       });

//     } catch (error) {
//       console.log("Error fetching dashboard data:", error.message);
//       Alert.alert("Data Error", "Failed to load dashboard data.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // 如果还在加载中，显示 Loading 圈圈
//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
//         <ActivityIndicator size="large" color="#000" />
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      
//       <Text style={styles.welcomeTitle}>Welcome,</Text>
//       <Text style={styles.welcomeTitleBtm}>Charlene!</Text>

//       <View style={styles.gridContainer}>
        
//         {/* ==================== Card 1: Platform Overview ==================== */}
//         <View style={[styles.card, styles.halfCard, { justifyContent: 'space-evenly', paddingVertical: 10 }]}>
//           <Text style={styles.cardTitle}>Platform Overview</Text>
          
//           <View style={styles.metricItem}>
//             <Text style={styles.metricLabel}>Active Users:</Text>
//             {/* 显示真实的 Active Users 数字 */}
//             <Text style={styles.metricValue}>{dashboardData.activeUsers}</Text>
//           </View>
          
//           <View style={styles.metricItem}>
//             <Text style={styles.metricLabel}>Active Advertising Banner:</Text>
//             {/* 显示真实的 Ads 数字 */}
//             <Text style={styles.metricValue}>{dashboardData.activeAds}</Text>
//           </View>
//         </View>

//         {/* ==================== Card 2: Total Menu ==================== */}
//         <View style={[styles.card, styles.halfCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
//           <View>
//             <Text style={styles.menuLabel}>Total Menu</Text>
//             {/* 显示真实的 Menu 数字 */}
//             <Text style={styles.menuValue}>{dashboardData.totalMenu}</Text>
//           </View>
//           <View style={styles.circleChartTrack}>
//             <View style={styles.circleChartProgress} />
//             <View style={styles.iconDishContainer}>
//               <View style={styles.iconDishCap} />
//               <View style={styles.iconDishLine} />
//             </View>
//           </View>
//         </View>

//         {/* ==================== Card 3: Weekly Revenue ==================== */}
//         <View style={[styles.card, styles.fullCard]}>
//           <Text style={styles.cardTitle}>Weekly Revenue</Text>
          
//           <View style={styles.chartWrapper}>
//             <View style={styles.yAxisLabels}>
//               <Text style={styles.yAxisText}>120</Text>
//               <Text style={styles.yAxisText}>90</Text>
//               <Text style={styles.yAxisText}>60</Text>
//               <Text style={styles.yAxisText}>30</Text>
//               <Text style={styles.yAxisText}>20</Text>
//               <Text style={[styles.yAxisText, { marginBottom: 15 }]}>0</Text>
//             </View>

//             <View style={styles.chartContainer}>
//               <View style={styles.barGroup}>
//                 <View style={[styles.bar, { height: dashboardData.chartHeights[0] }]} />
//                 <Text style={styles.xAxisLabel}>Sun</Text>
//               </View>
//               <View style={styles.barGroup}>
//                 <View style={[styles.bar, { height: dashboardData.chartHeights[1] }]} />
//                 <Text style={styles.xAxisLabel}>Mon</Text>
//               </View>
//               <View style={styles.barGroup}>
//                 <View style={[styles.bar, { height: dashboardData.chartHeights[2] }]} />
//                 <Text style={styles.xAxisLabel}>Tue</Text>
//               </View>
//               <View style={styles.barGroup}>
//                 <View style={[styles.bar, { height: dashboardData.chartHeights[3] }]} />
//                 <Text style={styles.xAxisLabel}>Wed</Text>
//               </View>
//               <View style={styles.barGroup}>
//                 <View style={[styles.bar, { height: dashboardData.chartHeights[4] }]} />
//                 <Text style={styles.xAxisLabel}>Thu</Text>
//               </View>
//               <View style={styles.barGroup}>
//                 <View style={[styles.bar, { height: dashboardData.chartHeights[5] }]} />
//                 <Text style={styles.xAxisLabel}>Fri</Text>
//               </View>
//               <View style={styles.barGroup}>
//                 <View style={[styles.bar, { height: dashboardData.chartHeights[6] }]} />
//                 <Text style={styles.xAxisLabel}>Sat</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//       </View>
//     </ScrollView>
//   );
// }

// // ==================== 🎨 STYLESHEET ====================
// const styles = StyleSheet.create({
//   scrollContainer: { 
//     paddingHorizontal: 20, 
//     paddingTop: 15, 
//     paddingBottom: 40,
//     backgroundColor: '#fff'
//   },
  
//   welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 5 },
//   welcomeTitleBtm: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  
//   gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   card: {
//     backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#7f7f7f', borderRadius: 16,
//     paddingVertical: 15, paddingHorizontal: 10, marginBottom: 15,
//     ...Platform.select({
//       ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5 },
//       android: { elevation: 5 }
//     }),
//   },
//   halfCard: { width: '49%', minHeight: 140 },
//   fullCard: { width: '100%' },
  
//   cardTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#000' },
  
//   metricItem: { alignItems: 'center', marginBottom: 8 },
//   metricLabel: { fontSize: 13, fontWeight: '600', color: '#444', textAlign: 'center' },
//   metricValue: { fontSize: 24, fontWeight: 'bold', color: '#000', marginTop: 2 },
  
//   menuLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 },
//   menuValue: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  
//   circleChartTrack: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
//   circleChartProgress: { position: 'absolute', width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#ff5722', borderTopColor: 'transparent' },
  
//   iconDishContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
//   iconDishCap: { width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
//   iconDishLine: { width: 18, height: 2, backgroundColor: '#000', marginTop: 1 },

//   chartWrapper: { flexDirection: 'row', height: 140, marginTop: 10 },
//   yAxisLabels: { width: 30, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8 },
//   yAxisText: { fontSize: 9, color: '#000000' },
//   chartContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#000000', paddingLeft: 10, paddingRight: 5 },
//   barGroup: { alignItems: 'center', flex: 1 },
//   bar: { width: 18, backgroundColor: '#000000' },
//   xAxisLabel: { fontSize: 10, color: '#000000', marginTop: 5 },
// });


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
        .select('order_ref, total_price, status, created_at') // 换成了你真实的列名
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