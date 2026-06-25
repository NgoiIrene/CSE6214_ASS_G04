import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useContext, useCallback, useEffect } from 'react';
import { Image, ActivityIndicator } from 'react-native'; 
import { RiderContext } from './RiderProvider'; 
import { supabase } from '../../supabaseClient';
import {
  Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet,
  Switch, Text, TouchableOpacity, View, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DeliveryMain() {
  const navigation = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { avatarUri, riderName, isOnline: contextIsOnline, setIsOnline: setContextIsOnline } = useContext(RiderContext);
  const isOnline = contextIsOnline;
  const setIsOnline = setContextIsOnline;
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMyShifts();
    }, [])
  );

  // 🌟 修复：精确到“小时”的时间比对自动删除 🌟
  const fetchMyShifts = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('rider_shifts')
        .select('*')
        .eq('rider_id', session.user.id)
        .order('shift_date', { ascending: true }); 

      if (error) {
        Alert.alert("Fetch Error ❌", error.message);
      } else if (data) {
        
        const now = new Date(); // 当前真实时间 (包含小时)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 仅留日期

        // 定义每个班次的结束小时 (24小时制)
        const endHours = {
          '8.00AM - 10.00AM': 10,
          '10.00AM - 12.00PM': 12,
          '12.00PM - 2.00PM': 14,
          '2.00PM - 4.00PM': 16,
          '4.00PM - 6.00PM': 18,
        };

        const validShifts = [];
        const expiredShiftIds = [];

        data.forEach(shift => {
          const shiftDateObj = new Date(shift.shift_date);
          shiftDateObj.setHours(0, 0, 0, 0);

          let isExpired = false;

          if (shiftDateObj < today) {
            isExpired = true; // 日期已经过了
          } else if (shiftDateObj.getTime() === today.getTime()) {
            const endHour = endHours[shift.shift_time] || 24; 
            if (now.getHours() >= endHour) {
              isExpired = true; // 时间过了这个小时
            }
          }

          if (isExpired) {
            expiredShiftIds.push(shift.id); // 丢进过期名单
          } else {
            validShifts.push(shift); // 还没过期
          }
        });

        if (expiredShiftIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('rider_shifts')
            .delete()
            .in('id', expiredShiftIds); 

          if (!deleteError) {
            Alert.alert(
              "Expired Shifts Cleaned 🧹",
              `We have automatically removed ${expiredShiftIds.length} past shift(s) from your schedule.`
            );
          }
        }

        setShifts(validShifts);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("System Error", "Something went wrong while pulling your shifts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShift = (id) => {
    Alert.alert(
      "Delete Shift",
      "Are you sure you want to drop this shift?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive",
          onPress: async () => {
            const { data, error } = await supabase
              .from('rider_shifts')
              .delete()
              .eq('id', id)
              .select();
            
            if (error) {
              Alert.alert("Error ❌", error.message);
              return;
            }

            if (!data || data.length === 0) {
              Alert.alert("Blocked by Database 🚫", "Delete failed! Please check if your RLS policy uses 'auth.uid() = rider_id'.");
              return;
            }

            setShifts(shifts.filter(shift => shift.id !== id));
          }
        }
      ]
    );
  };

  const fetchEarliestPendingOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'delivery')
      .in('status', ['pending_rider', 'ready_for_pickup'])
      .is('rider_id', null)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  };

  // 🌟 修复：如果没有排班则不准上线 🌟
  const handleToggleOnline = async (newValue) => {
    if (newValue === true && shifts.length === 0) {
      Alert.alert(
        "Action Required", 
        "Please go to Working Shift to add your working slots before going online."
      );
      return; 
    }

    setIsOnline(newValue);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ is_online: newValue })
        .eq('id', session.user.id);

      if (error) {
        setIsOnline(!newValue);
        Alert.alert("Network Error", "Failed to update your status.");
      } else {
        if (newValue === true) {
          const earliestOrder = await fetchEarliestPendingOrder();
          if (earliestOrder) {
            Alert.alert(
              "🟢 You are Online!",
              `Radar activated. Found an existing order request (#${earliestOrder.order_number || 'N/A'}) created earlier.`,
              [
                {
                  text: "View Request",
                  onPress: () => navigation.navigate('ProcessRequest', { orderData: earliestOrder })
                },
                {
                  text: "Later",
                  style: 'cancel'
                }
              ]
            );
          } else {
            Alert.alert("🟢 You are Online!", "Radar activated. Waiting for incoming delivery requests...");
          }
        } else {
          Alert.alert("⚪ You are Offline", "You will no longer receive delivery requests.");
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    let orderChannel = null;

    if (isOnline) {
      const uniqueChannelName = `rider-order-radar-${Date.now()}`;
      
      orderChannel = supabase
        .channel(uniqueChannelName)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          async (payload) => { 
            const newOrder = payload.new;
            const oldOrder = payload.old; 
            
            const waitingStatuses = ['pending_rider', 'ready_for_pickup'];
            
            if (
              waitingStatuses.includes(newOrder.status) && 
              !waitingStatuses.includes(oldOrder.status) && 
              newOrder.order_type === 'delivery'
            ) {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                const { data: activeOrders, error } = await supabase
                  .from('orders')
                  .select('id')
                  .eq('rider_id', session.user.id)
                  .in('status', ['accepted_by_rider', 'pickup_rider', 'otw_delivery']);

                if (error) throw error;

                if (activeOrders && activeOrders.length > 0) {
                  return;
                }

                Alert.alert(
                  "🔔 New Order Request!",
                  `Order #: ${newOrder.order_number || 'N/A'}\nEarning: RM ${Number(newOrder.earning || 0).toFixed(2)}\nDestination: ${newOrder.delivery_building || 'N/A'}`,
                  [
                    {
                      text: "View Request",
                      onPress: () => {
                        navigation.navigate('ProcessRequest', { orderData: newOrder });
                      }
                    }
                  ]
                );
              } catch (err) {
                console.log("Check active order error:", err);
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (orderChannel) {
        supabase.removeChannel(orderChannel);
      }
    };
  }, [isOnline]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ height: Platform.OS === 'ios' ? 10 : 40, backgroundColor: '#FFF' }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIconBox} onPress={() => setIsSidebarOpen(true)} activeOpacity={0.7}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOME</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Upcoming Shifts</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{shifts.length.toString()}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
          ) : (
            shifts.map((shift) => (
              <View key={shift.id} style={styles.shiftCard}>
                <View style={styles.shiftIconBox}>
                  <Ionicons name="calendar" size={24} color="#00C853" />
                </View>
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftDate}>{shift.shift_date}</Text>
                  <Text style={styles.shiftTime}>{shift.shift_time}</Text>
                  <Text style={styles.shiftDuration}>Duration: {shift.duration}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteShift(shift.id)} activeOpacity={0.6}>
                  <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {!isLoading && shifts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No upcoming shifts.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomBar}>
          <View style={styles.switchWrapper}>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
              thumbColor={isOnline ? "#00C853" : "#F5F5F5"}
              ios_backgroundColor="#E0E0E0"
              onValueChange={handleToggleOnline} 
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

      {isSidebarOpen ? (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.closeOverlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.profileAvatar}>
                {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImageReal} /> : <Ionicons name="person" size={36} color="#FFF" />}
              </View>
              <Text style={styles.profileName}>{riderName}</Text>
            </View>
            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItemActive} onPress={() => setIsSidebarOpen(false)}><Ionicons name="home" size={22} color="#424242" style={styles.menuIconLeft} /><Text style={styles.menuTextActive}>HOME</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Profile'); }}><Ionicons name="person-outline" size={22} color="#666" style={styles.menuIconLeft} /><Text style={styles.menuText}>PROFILE</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('WorkingShift'); }}><Ionicons name="calendar-outline" size={22} color="#666" style={styles.menuIconLeft} /><Text style={styles.menuText}>WORKING SHIFT</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('EarningsHistory'); }}><Ionicons name="wallet-outline" size={22} color="#666" style={styles.menuIconLeft} /><Text style={styles.menuText}>EARNINGS & HISTORY</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('ResetPassword'); }}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>RESET PASSWORD</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={async () => { setIsSidebarOpen(false); await supabase.auth.signOut(); }} >
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
  safeArea: { flex: 1, backgroundColor: '#F8F9FA', },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E0E0E0', },
  menuIconBox: { padding: 5, marginLeft: -5, },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000', letterSpacing: 1, },
  contentContainer: { flex: 1, },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', },
  badge: { backgroundColor: '#00C853', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 10, },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, },
  shiftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, borderWidth: 1, borderColor: '#F0F0F0', },
  shiftIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 15, },
  shiftInfo: { flex: 1, },
  shiftDate: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4, },
  shiftTime: { fontSize: 14, color: '#333', fontWeight: '600', },
  shiftDuration: { fontSize: 13, color: '#888', marginTop: 4, },
  deleteButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 50, },
  emptyStateText: { fontSize: 15, color: '#999', marginTop: 10, },
  bottomBarContainer: { backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E0E0E0', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, },
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, },
  switchWrapper: { marginRight: 15, },
  statusBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 25, paddingVertical: 12, },
  statusBoxOnline: { backgroundColor: '#00C853', },
  statusBoxOffline: { backgroundColor: '#F0F0F0', },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8, },
  statusText: { fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5, },
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