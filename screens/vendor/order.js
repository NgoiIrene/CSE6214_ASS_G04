import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableHighlight, TouchableOpacity, Platform,
  Modal, Dimensions, TouchableWithoutFeedback, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 🌟 核心修改 1：引入 Supabase
import { supabase } from '../../supabaseClient'; 

const { width } = Dimensions.get('window');

// 辅助工具：将时间秒数格式化为 MM:SS
const formatCountdown = (totalSeconds) => {
  if (totalSeconds <= 0) return "00:00 TIME'S UP";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs} MIN LEFT`;
};

// 辅助工具：把用户下单的纯文本食物清单转回数组，适配原本的 UI 格式
const parseFoodDetails = (detailsString) => {
  if (!detailsString) return [];
  return detailsString.split('\n').map(line => {
    const match = line.match(/^(\d+)x\s+(.*)$/);
    if (match) return { qty: match[1], name: match[2], remark: '' };
    return { qty: 1, name: line, remark: '' };
  });
};

// ==================== 📄 主页列表组件 ====================
function HomeScreen({ onNavigateToDetail, currentTab, setCurrentTab, requestedOrders, acceptedOrders, onOpenMenu }) {
  const displayOrders = currentTab === 'requested' ? requestedOrders : acceptedOrders;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerMenuBtn} onPress={onOpenMenu}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, currentTab === 'requested' ? styles.activeTab : styles.inactiveTab]} onPress={() => setCurrentTab('requested')}>
          <Text style={[styles.tabText, currentTab === 'requested' ? styles.activeTabText : styles.inactiveTabText]}>Requested Order List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, currentTab === 'accepted' ? styles.activeTab : styles.inactiveTab]} onPress={() => setCurrentTab('accepted')}>
          <Text style={[styles.tabText, currentTab === 'accepted' ? styles.activeTabText : styles.inactiveTabText]}>Accepted Order List</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayOrders.length === 0 ? (
           <View style={{ padding: 20, alignItems: 'center', marginTop: 50 }}>
             <Ionicons name="receipt-outline" size={48} color="#CCC" />
             <Text style={{ color: '#999', marginTop: 10 }}>No orders found.</Text>
           </View>
        ) : (
          displayOrders.map((order) => {
            const items = parseFoodDetails(order.food_details);
            // 格式化时间显示 (截取 created_at 的 HH:MM)
            const orderTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <TouchableHighlight key={order.id} style={styles.orderCard} underlayColor="#A9A9A9" onPress={() => onNavigateToDetail(order)}>
                <View style={styles.cardInnerContent}>
                  <View style={styles.cardLeftContent}>
                    <View style={styles.cardRowInline}>
                      <Text style={styles.orderNoText}>Order NO.: {order.order_ref}</Text>
                      <Text style={styles.timeText}>TIME: {orderTime}</Text>
                      <Text style={styles.nameText} numberOfLines={1}>{order.customer_name}</Text>
                    </View>
                    <View style={styles.itemsContainer}>
                      {items.map((item, idx) => (
                        <Text key={idx} style={styles.itemText} numberOfLines={1}>{item.name} X{item.qty}</Text>
                      ))}
                    </View>
                  </View>
                  <View style={styles.cardRightContent}>
                    <Text style={currentTab === 'requested' ? styles.priceText : styles.timeLeftText}>
                      {currentTab === 'requested' 
                        ? `RM ${Number(order.total_price).toFixed(2)}` 
                        : formatCountdown(1200) // 模拟倒计时 20 分钟
                      }
                    </Text>
                  </View>
                </View>
              </TouchableHighlight>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 📄 订单详情页组件 ====================
function OrderDetailScreen({ orderData, initialStatus, onBack, onAcceptOrder, onDeclineOrder, onDoneOrder }) {
  if (!orderData) return null;

  const items = parseFoodDetails(orderData.food_details);
  const orderTime = new Date(orderData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack}>
          <Ionicons name="arrow-back-circle-outline" size={32} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      <ScrollView style={styles.detailScrollView} contentContainerStyle={styles.detailScrollContainer}>
        <View style={styles.badgeRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.badgeText}>{initialStatus === 'waiting' ? 'WAITING FOR ACCEPT' : 'PREPARING'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.badgeText}>TYPE: {orderData.order_type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.metaInfoRow}>
          <Text style={styles.metaText}>CUSTOMER NAME: {orderData.customer_name}</Text>
          <Text style={styles.metaText}>TIME: {orderTime}</Text>
          {initialStatus === 'preparing' ? (
            <Text style={styles.timeLeftLarge}>{formatCountdown(1200)}</Text>
          ) : (
            <Text style={styles.metaText}>REMARKS: {orderData.remarks || 'None'}</Text>
          )}
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableRow}>
            <View style={[styles.colItem, styles.borderRight]}><Text style={styles.tableHeaderText}>ITEM</Text></View>
            <View style={[styles.colQty, styles.borderRight]}><Text style={styles.tableHeaderText}>QUANTITY</Text></View>
            <View style={styles.colRemark}><Text style={styles.tableHeaderText}>REMARK</Text></View>
          </View>
          {items.map((item, index) => (
            <View key={index} style={[styles.tableRow, styles.rowBorderTop]}>
              <View style={[styles.colItemLeft, styles.borderRight]}><Text style={styles.tableCellTextLeft}>{item.name}</Text></View>
              <View style={[styles.colQty, styles.borderRight]}><Text style={styles.tableCellText}>{item.qty}</Text></View>
              <View style={styles.colRemark}><Text style={styles.tableCellText}>{item.remark || ''}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.totalEarnedContainer}>
          <Text style={styles.totalEarnedText}>TOTAL EARNED: RM {Number(orderData.total_price).toFixed(2)}</Text>
        </View>

        <View style={styles.actionButtonContainer}>
          {initialStatus === 'waiting' ? (
            <>
              <TouchableOpacity style={styles.declineButton} onPress={() => onDeclineOrder(orderData.id)}>
                <Text style={styles.declineButtonText}>DECLINE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={() => onAcceptOrder(orderData.id)}>
                <Text style={styles.acceptButtonText}>ACCEPT</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.doneButton} onPress={() => onDoneOrder(orderData.id)}>
              <Text style={styles.doneButtonText}>DONE</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 📱 核心主干与云端实时拉取 ====================
export default function App({ navigateToScreen }) {
  const [screen, setScreen] = useState('HOME'); 
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [currentTab, setCurrentTab] = useState('requested'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🌟 核心：存储从 Supabase 拉取的真实订单
  const [requestedOrders, setRequestedOrders] = useState([]); 
  const [acceptedOrders, setAcceptedOrders] = useState([]); 

  // 1. 获取数据的函数
  const fetchOrders = async () => {
    try {
      // 拉取所有相关的订单
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending_vendor', 'pending_rider', 'accepted', 'completed']) // 获取没被拒绝或取消的
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // 分发到两个列表
        setRequestedOrders(data.filter(o => o.status === 'pending_vendor'));
        // 这里设定：只要不是待接单和已完成状态的，都算正在进行中(accepted)
        setAcceptedOrders(data.filter(o => o.status === 'pending_rider' || o.status === 'accepted'));
      }
    } catch (e) {
      console.log("Fetch orders error:", e);
    }
  };

  // 2. 挂载时拉取初始数据，并设置实时监听！
  useEffect(() => {
    fetchOrders();

    const orderSubscription = supabase
      .channel('vendor-order-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        // 一旦数据库有变化，立刻刷新列表！
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, []);

  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false);
    if (targetScreen === 'order') return;
    if (navigateToScreen) navigateToScreen(targetScreen); 
  };

  // 🌟🌟 核心：商家接单，修改状态唤醒外卖员 🌟🌟
  const handleAcceptOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        // 【关键 UPDATE】：把状态改成了 pending_rider，这会完美触发你刚才写的外卖员雷达！
        .update({ status: 'pending_rider' }) 
        .eq('id', orderId);

      if (error) throw error;
      
      setScreen('HOME');
      // 数据列表会被上面的 real-time 自动更新，体验无缝！
    } catch (e) {
      Alert.alert("Error", "Could not accept order.");
    }
  };

  const handleDeclineOrder = async (orderId) => {
    try {
      await supabase.from('orders').update({ status: 'declined_vendor' }).eq('id', orderId);
      setScreen('HOME');
    } catch (e) {
      console.log(e);
    }
  };

  const handleDoneOrder = async (orderId) => {
    try {
      await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
      setScreen('HOME');
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Modal transparent={true} visible={isSidebarOpen} animationType="none" onRequestClose={() => setIsSidebarOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}><TouchableOpacity onPress={() => setIsSidebarOpen(false)}><Ionicons name="menu" size={32} color="#000" /></TouchableOpacity></View>
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}><Ionicons name="person-outline" size={45} color="#000" /></View>
              <Text style={styles.avatarName}>Rasa Syiok</Text>
            </View>
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('order')}><Text style={styles.sidebarItemText}>Home</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}><Text style={styles.sidebarItemText}>Profile</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('menu')}><Text style={styles.sidebarItemText}>Menu</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('operationstatus')}><Text style={styles.sidebarItemText}>Update Status</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('historyorder')}><Text style={styles.sidebarItemText}>History Order</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('review')}><Text style={styles.sidebarItemText}>Review</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}><Text style={styles.sidebarItemText}>Reset Password</Text></TouchableOpacity>
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}><Ionicons name="log-out-outline" size={24} color="#000" /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}><View style={styles.backdrop} /></TouchableWithoutFeedback>
        </View>
      </Modal>

      {screen === 'DETAIL' && selectedOrder ? (
        <OrderDetailScreen 
          orderData={selectedOrder}
          initialStatus={currentTab === 'requested' ? 'waiting' : 'preparing'}
          onBack={() => setScreen('HOME')}
          onAcceptOrder={handleAcceptOrder}
          onDeclineOrder={handleDeclineOrder}
          onDoneOrder={handleDoneOrder}
        />
      ) : (
        <HomeScreen 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          requestedOrders={requestedOrders}
          acceptedOrders={acceptedOrders}
          onOpenMenu={() => setIsSidebarOpen(true)} 
          onNavigateToDetail={(order) => {
            setSelectedOrder(order);
            setScreen('DETAIL');
          }}
        />
      )}
    </SafeAreaView>
  );
}

// 🎨 样式表保持原样
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35 },
  headerMenuBtn: { width: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#000', borderRadius: 6, padding: 2 },
  headerBackBtn: { width: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'normal', color: '#000', textAlign: 'center' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  tabContainer: { flexDirection: 'row', width: '100%', height: 50, borderBottomWidth: 2, borderBottomColor: '#000' },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  activeTab: { backgroundColor: '#A9A9A9' },
  inactiveTab: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '500' },
  activeTabText: { color: '#fff' },
  inactiveTabText: { color: '#000' },
  scrollContainer: { paddingHorizontal: 10, paddingTop: 15, paddingBottom: 40 },
  orderCard: { borderWidth: 1.5, borderColor: '#000', borderRadius: 22, marginBottom: 12, backgroundColor: '#fff', overflow: 'hidden' },
  cardInnerContent: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center', minHeight: 75 },
  cardLeftContent: { flex: 1, justifyContent: 'center' },
  cardRowInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  orderNoText: { fontSize: 11, fontWeight: 'bold', color: '#000', marginRight: 10 },
  timeText: { fontSize: 10, color: '#000', marginRight: 15 },
  nameText: { fontSize: 10, color: '#000', fontWeight: '500', flex: 1 },
  itemsContainer: { marginTop: 2 },
  itemText: { fontSize: 11, color: '#888', lineHeight: 14 },
  cardRightContent: { justifyContent: 'center', alignItems: 'flex-end', marginLeft: 10 },
  priceText: { fontSize: 18, fontWeight: '500', color: '#000' },
  timeLeftText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  detailScrollView: { flex: 1, backgroundColor: '#fff' },
  detailScrollContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 60, alignItems: 'center' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  statusBadge: { backgroundColor: '#A9A9A9', paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  metaInfoRow: { width: '100%', marginBottom: 15, position: 'relative' },
  metaText: { fontSize: 11, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  timeLeftLarge: { fontSize: 24, fontWeight: 'bold', color: '#000', position: 'absolute', right: 0, top: 0 },
  tableContainer: { width: '100%', borderWidth: 1.5, borderColor: '#000', marginTop: 5, backgroundColor: '#fff' },
  tableRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%' },
  rowBorderTop: { borderTopWidth: 1.5, borderTopColor: '#000' },
  borderRight: { borderRightWidth: 1.5, borderRightColor: '#000' },
  colItem: { width: '45%', paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  colItemLeft: { width: '45%', paddingVertical: 8, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'flex-start' },
  colQty: { width: '22%', paddingVertical: 8, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  colRemark: { width: '33%', paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  tableHeaderText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  tableCellText: { fontSize: 10, color: '#000', textAlign: 'center', lineHeight: 14 },
  tableCellTextLeft: { fontSize: 10, color: '#000', textAlign: 'left', lineHeight: 14 },
  totalEarnedContainer: { width: '100%', alignItems: 'flex-end', marginTop: 30, paddingRight: 5 },
  totalEarnedText: { fontSize: 24, fontWeight: 'normal', color: '#000' },
  actionButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 40, paddingHorizontal: 10 },
  declineButton: { borderWidth: 1.5, borderColor: '#000', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 30 },
  declineButtonText: { color: '#000', fontSize: 20, fontWeight: '500' },
  acceptButton: { backgroundColor: '#D3D3D3', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 35 },
  acceptButtonText: { color: '#fff', fontSize: 20, fontWeight: '500' },
  doneButton: { backgroundColor: '#D3D3D3', borderRadius: 18, paddingVertical: 8, width: '45%', alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 20, fontWeight: '500' },
  modalContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { width: Dimensions.get('window').width * 0.75, height: '100%', backgroundColor: '#fff', borderRightWidth: 2, borderRightColor: '#000', paddingTop: Platform.OS === 'ios' ? 40 : 25, zIndex: 10 },
  sidebarHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  avatarSection: { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1.5, borderBottomColor: '#000', marginBottom: 10 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, borderColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  avatarName: { fontSize: 12, fontWeight: '500', color: '#000' },
  sidebarItem: { width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1.5, borderBottomColor: '#000', alignItems: 'center' },
  sidebarActiveItem: { backgroundColor: '#A9A9A9' },
  sidebarItemText: { fontSize: 22, color: '#000', fontWeight: 'normal' },
  sidebarFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, borderTopColor: '#000', paddingVertical: 12, backgroundColor: '#fff' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 22, color: '#000', marginLeft: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
});