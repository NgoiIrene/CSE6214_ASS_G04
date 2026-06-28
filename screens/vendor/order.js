import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableHighlight, TouchableOpacity, Platform,
  Modal, Dimensions, TouchableWithoutFeedback, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 🌟 Import Supabase
import { supabase } from '../../supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 🌟 Helper: formats seconds into MM:SS (supports negative overdue display)
const formatCountdown = (totalSeconds) => {
  const isOverdue = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;

  const formattedTime = `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;

  if (isOverdue) {
    return `-${formattedTime} OVERDUE`; // Overdue changes to negative display
  }
  return `${formattedTime} MIN LEFT`;
};

// 🌟 Helper: parse the plain-text food list from an order back into an array (compatible with both newlines and comma separators)
const parseFoodDetails = (detailsString) => {
  if (!detailsString) return [];

  return detailsString.split(/[\n,]+/).map(item => {
    const trimmedItem = item.trim();
    if (!trimmedItem) return null;

    const startMatch = trimmedItem.match(/^(\d+)[xX]?\s+(.*)$/);
    if (startMatch) {
      return { qty: startMatch[1], name: startMatch[2] };
    }

    const endMatch = trimmedItem.match(/^(.*)\s+[xX]?(\d+)$/);
    if (endMatch) {
      return { qty: endMatch[2], name: endMatch[1].trim() };
    }

    return { qty: 1, name: trimmedItem };
  }).filter(Boolean);
};

// ==================== 🕒 Real-world time independent countdown component ====================
function OrderCountdown({ createdAt, style, isLarge = false }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!createdAt) return;

    const calculateSecondsLeft = () => {
      const createdTime = new Date(createdAt).getTime(); 
      const duration = 20 * 60 * 1000;                  // Preparation time: 20 minutes
      const deadlineTime = createdTime + duration;       

      const now = new Date().getTime();                  
      return Math.floor((deadlineTime - now) / 1000);    
    };

    setSecondsLeft(calculateSecondsLeft());

    const interval = setInterval(() => {
      setSecondsLeft(calculateSecondsLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const isOverdue = secondsLeft < 0;
  const countdownText = formatCountdown(secondsLeft);

  // 🌟 Dynamically compute font size based on text length to prevent squishing the left layout
  let dynamicFontSize = isLarge ? 24 : 16;
  if (countdownText.length > 12) {
    dynamicFontSize = isLarge ? 14 : 11;
  }

  return (
    <Text style={[style, isOverdue && styles.overdueRedText, { fontSize: dynamicFontSize }]}>
      {countdownText}
    </Text>
  );
}

// ==================== 📔 Main list component ====================
function HomeScreen({ onNavigateToDetail, currentTab, setCurrentTab, requestedOrders, acceptedOrders, onOpenMenu, acceptedAtMap }) {
  const displayOrders = currentTab === 'requested' ? requestedOrders : acceptedOrders;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerMenuBtn} onPress={onOpenMenu}>
          <Ionicons name="menu" size={35} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={{ width: 35 }} />
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
            const orderTime = order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';

            return (
              <TouchableHighlight key={order.id} style={styles.orderCard} underlayColor="#A9A9A9" onPress={() => onNavigateToDetail(order)}>
                <View style={styles.cardInnerContent}>
                  <View style={styles.cardLeftContent}>
                    <View style={styles.cardRowInline}>
                      <Text style={styles.orderNoText}>Order NO.: {order.order_number || 'N/A'}</Text>
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
                    {currentTab === 'requested' ? (
                      <Text style={styles.priceText}>RM {Number(order.profit || 0).toFixed(2)}</Text>
                    ) : (
                      <OrderCountdown createdAt={acceptedAtMap?.[order.id] || order.created_at} style={styles.timeLeftText} isLarge={false} />
                    )}
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

// ==================== 📔 Order detail page component ====================
function OrderDetailScreen({ orderData, initialStatus, onBack, onAcceptOrder, onDeclineOrder, onDoneOrder }) {
  if (!orderData) return null;

  const items = parseFoodDetails(orderData.food_details);
  const orderTime = orderData.created_at ? new Date(orderData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';

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
            <Text style={styles.badgeText}>TYPE: {String(orderData.order_type || '').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.metaInfoFlexRow}>
          <View style={styles.metaInfoLeftColumn}>
            <Text style={styles.metaText}>CUSTOMER NAME: {orderData.customer_name}</Text>
            <Text style={styles.metaText}>TIME: {orderTime}</Text>
          </View>

          {initialStatus === 'preparing' && (
            <View style={styles.metaInfoRightColumn}>
              <OrderCountdown createdAt={orderData.accepted_at_local || orderData.created_at} style={styles.timeLeftLarge} isLarge={true} />
            </View>
          )}
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableRow}>
            <View style={[styles.colItem, styles.borderRight]}><Text style={styles.tableHeaderText}>ITEM</Text></View>
            <View style={styles.colQty}><Text style={styles.tableHeaderText}>QUANTITY</Text></View>
          </View>
          {items.map((item, index) => (
            <View key={index} style={[styles.tableRow, styles.rowBorderTop]}>
              <View style={[styles.colItemLeft, styles.borderRight]}><Text style={styles.tableCellTextLeft}>{item.name}</Text></View>
              <View style={styles.colQty}><Text style={styles.tableCellText}>{item.qty}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.entireOrderRemarkContainer}>
          <Text style={styles.entireOrderRemarkTitle}>ORDER REMARKS:</Text>
          <Text style={styles.entireOrderRemarkContent}>
            {orderData.remarks && orderData.remarks.trim() !== '' ? orderData.remarks : 'None'}
          </Text>
        </View>

        <View style={styles.totalEarnedContainer}>
          <Text style={styles.totalEarnedText}>TOTAL EARNED: RM {Number(orderData.profit || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.actionButtonContainer}>
          {initialStatus === 'waiting' ? (
            <>
              <TouchableOpacity style={styles.declineButton} onPress={() => onDeclineOrder(orderData.id)}>
                <Text style={styles.declineButtonText}>DECLINE</Text>
              </TouchableOpacity>
              {/* 🌟 The parameter here has been changed to pass the entire orderData object so the main logic can determine order_type */}
              <TouchableOpacity style={styles.acceptButton} onPress={() => onAcceptOrder(orderData)}>
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

// ==================== 📱 Main logic ====================
export default function App({ route, navigateToScreen }) {
  const [screen, setScreen] = useState('HOME');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentTab, setCurrentTab] = useState('requested');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [requestedOrders, setRequestedOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);

  // 🌟 Track acceptance time locally per order for countdown (no database change needed)
  const [acceptedAtMap, setAcceptedAtMap] = useState({});

  // 👤 Sidebar dynamic profile state
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [currentVendorId, setCurrentVendorId] = useState(null);

  // ⚙️ Load vendor profile from Supabase synchronously (aligned with Review implementation)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        let uid = route?.params?.vendor_id;

        if (!uid) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (user) {
            uid = user.id;
          }
        }

        setCurrentVendorId(uid);

        if (!uid) {
          setProfileName('Guest');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', uid)
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
  }, [route]);

  // Fetch order list from database (also fetch commission rate to calculate profit dynamically)
  const fetchOrders = async () => {
    if (!currentVendorId) return;

    try {
      const [ordersResult, finResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*, profiles:user_id(full_name)')
          .eq('vendor_id', currentVendorId)
          .in('status', ['pending_vendor', 'pending_rider', 'accepted', 'completed', 'preparing'])
          .order('created_at', { ascending: false }),
        supabase
          .from('system_financial_settings')
          .select('commission_rate')
          .eq('id', 1)
          .single(),
      ]);

      if (ordersResult.error) throw ordersResult.error;

      const commissionRate = finResult.data ? Number(finResult.data.commission_rate) : 0;

      if (ordersResult.data) {
        const enriched = ordersResult.data.map(o => ({
          ...o,
          customer_name: o.profiles?.full_name || o.customer_name || 'Customer',
          profit: Number(o.subtotal || 0) * (100 - commissionRate) / 100,
        }));

        setRequestedOrders(enriched.filter(o => o.status === 'pending_vendor'));
        setAcceptedOrders(enriched.filter(o =>
          o.status === 'pending_rider' ||
          o.status === 'preparing'
        ));
      }
    } catch (e) {
      console.log("Fetch orders error:", e);
    }
  };

  useEffect(() => {
    if (currentVendorId) {
      fetchOrders();

      const orderSubscription = supabase
        .channel('vendor-order-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${currentVendorId}` 
        }, payload => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(orderSubscription);
      };
    }
  }, [currentVendorId]);

  // Handle sidebar navigation logic
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false);
    if (targetScreen === 'order') return; 
    if (navigateToScreen) navigateToScreen(targetScreen);
  };

  {/* 🌟 Modified accept order handler */}
  const handleAcceptOrder = async (order) => {
    try {
      // Safe boundary check with case-insensitive matching, and strip all spaces to handle 'pickup' and 'pick up'
      const orderType = String(order?.order_type || '').toLowerCase().replace(/\s+/g, '');
      
      // If pickup, set to preparing; otherwise keep pending_rider
      const targetStatus = orderType === 'pickup' ? 'preparing' : 'pending_rider';

      const { error } = await supabase
        .from('orders')
        .update({ status: targetStatus })
        .eq('id', order.id);

      if (error) throw error;

      // 🌟 Record local acceptance time: countdown starts from now, not from order time
      setAcceptedAtMap(prev => ({ ...prev, [order.id]: new Date().toISOString() }));

      setScreen('HOME');
    } catch (e) {
      Alert.alert("Error", "Could not accept order.");
    }
  };

  const handleDeclineOrder = async (orderId) => {
    try {
      await supabase.from('orders').update({ status: 'rejected' }).eq('id', orderId);
      setScreen('HOME');
    } catch (e) {
      console.log(e);
    }
  };

  const handleDoneOrder = async (orderId) => {
    try {
      await supabase.from('orders').update({ status: 'ready_for_pickup' }).eq('id', orderId);
      setScreen('HOME');
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      
      {/* ==================== 🚪 Sidebar Component ==================== */}
      <Modal transparent={true} visible={isSidebarOpen} animationType="none" onRequestClose={() => setIsSidebarOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 68, height: 68, borderRadius: 34 }} />
                ) : (
                  <Ionicons name="person-outline" size={45} color="#000" />
                )}
              </View>
              <Text style={styles.avatarName}>{profileName}</Text>
            </View>

            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => setIsSidebarOpen(false)}>
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
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('historyorder')}>
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
          acceptedAtMap={acceptedAtMap}
          onNavigateToDetail={(order) => {
            // 🌟 Also pass the local acceptance time to the detail page
            setSelectedOrder({ ...order, accepted_at_local: acceptedAtMap[order.id] || null });
            setScreen('DETAIL');
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ==================== 🎨 Bold-border minimalist style sheet ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35 },
  headerMenuBtn: { width: 35, justifyContent: 'center', alignItems: 'center' },
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
  cardRightContent: { justifyContent: 'center', alignItems: 'flex-end', marginLeft: 10, width: 110 }, 
  priceText: { fontSize: 18, fontWeight: '500', color: '#000' },
  timeLeftText: { fontWeight: 'bold', color: '#000', textAlign: 'right' },
  overdueRedText: { color: '#FF0000' },
  detailScrollView: { flex: 1, backgroundColor: '#fff' },
  detailScrollContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 60, alignItems: 'center' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  statusBadge: { backgroundColor: '#A9A9A9', paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  
  metaInfoFlexRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 },
  metaInfoLeftColumn: { flex: 1, paddingRight: 10 },
  metaInfoRightColumn: { justifyContent: 'center', alignItems: 'flex-end' },
  metaText: { fontSize: 11, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  timeLeftLarge: { fontWeight: 'bold', color: '#000', textAlign: 'right' },

  tableContainer: { width: '100%', borderWidth: 1.5, borderColor: '#000', marginTop: 5, backgroundColor: '#fff' },
  tableRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%' },
  rowBorderTop: { borderTopWidth: 1.5, borderTopColor: '#000' },
  borderRight: { borderRightWidth: 1.5, borderRightColor: '#000' },
  colItem: { width: '75%', paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  colItemLeft: { width: '75%', paddingVertical: 8, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'flex-start' },
  colQty: { width: '25%', paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  tableHeaderText: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  tableCellText: { fontSize: 11, color: '#000', textAlign: 'center', lineHeight: 14 },
  tableCellTextLeft: { fontSize: 11, color: '#000', textAlign: 'left', lineHeight: 14 },

  entireOrderRemarkContainer: { width: '100%', borderWidth: 1.5, borderColor: '#000', padding: 12, marginTop: 15, backgroundColor: '#fff' },
  entireOrderRemarkTitle: { fontSize: 11, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  entireOrderRemarkContent: { fontSize: 11, color: '#333', lineHeight: 15 },

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
  sidebar: {
    width: SCREEN_WIDTH * 0.75,
    height: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderRightColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 25,
    zIndex: 10,
  },
  sidebarHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  avatarSection: { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1.5, borderBottomColor: '#000', marginBottom: 10 },
  avatarCircle: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, borderColor: '#000',
    justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden'
  },
  avatarName: { fontSize: 12, fontWeight: '500', color: '#000', marginTop: 5 },
  sidebarItem: { width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1.5, borderBottomColor: '#000', alignItems: 'center' },
  sidebarActiveItem: { backgroundColor: '#A9A9A9' },
  sidebarItemText: { fontSize: 22, color: '#000', fontWeight: 'normal' },
  sidebarFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, borderTopColor: '#000', paddingVertical: 12, backgroundColor: '#fff' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 22, color: '#000', marginLeft: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
});