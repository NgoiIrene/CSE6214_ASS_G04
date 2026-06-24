import { useNavigation, useRoute } from '@react-navigation/native'; 
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Alert, Platform, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function ProcessDeliveryRequest() {
  const navigation = useNavigation();
  const route = useRoute(); 
  const orderData = route.params?.orderData; 

  const [orderStatus, setOrderStatus] = useState('pending');
  const [timeLeft, setTimeLeft] = useState(20);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const orderRef = orderData?.order_number || '#8680';
  const customerName = orderData?.customer_name || 'Cindy Kiki';
  const vendorName = orderData?.vendor_name || 'Rasa Syiokk';
  const pickupLocation = orderData?.vendor_name || 'MMU Starbees';
  const dropoffLocation = orderData?.delivery_building || 'Hostel HB3 & 4';
  const foodDetails = orderData?.food_details || '2x Nasi Lemak w Ayam Rendang\n1x Teh Tarik (Ice)';
  const earningPrice = orderData?.earning ? `RM ${Number(orderData.earning).toFixed(2)}` : 'RM 5.00';

  const riderCoords = { latitude: 2.9255, longitude: 101.6405 };
  const starbeesCoords = { latitude: 2.9278, longitude: 101.6415 };
  const hostelCoords = { latitude: 2.9305, longitude: 101.6440 };

  useEffect(() => {
    if (timeLeft === 0 && orderStatus === 'pending') {
      setOrderStatus('missed');
      Alert.alert("Time's Up", "You didn't respond in 20 seconds. The request has been reassigned.");
      return;
    }

    if (orderStatus === 'pending' && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [timeLeft, orderStatus]);

  // 🌟🌟 核心：抢单并跳转逻辑 (已完全修复) 🌟🌟
  const handleAccept = async () => {
    // 【修复 1】如果没有真实 ID (单纯UI测试)，传原本的 orderData，名字改成 UpdateProgress
    if (!orderData?.id) {
      setOrderStatus('accepted');
      navigation.navigate('UpdateProgress', { orderData: orderData });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // 🌟 动态判断：如果已经是 ready_for_pickup，接单后保持 ready_for_pickup，否则变成 accepted
      const nextStatus = orderData?.status === 'ready_for_pickup' ? 'ready_for_pickup' : 'accepted';

      // 1. 去数据库把这单抢下来！
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: nextStatus,
          rider_id: session.user.id 
        })
        .eq('id', orderData.id)
        .in('status', ['pending_rider', 'ready_for_pickup'])
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
         Alert.alert("Too slow! 🏃💨", "This order has already been taken by another rider or canceled.");
         navigation.navigate('Home');
         return;
      }

      setOrderStatus('accepted');
      Alert.alert("Order Accepted! 🚀", "GPS connected. Please follow the route to the restaurant for pick-up.");
      
      // 【修复 2】抢单成功，带着订单数据，名字统一改成 UpdateProgress
      navigation.navigate('UpdateProgress', { orderData: data[0] });

    } catch (error) {
      Alert.alert("System Error", error.message);
    }
  };

  const handleDecline = () => {
    setOrderStatus('declined');
    Alert.alert("Order Declined", "This request will be passed to another rider.");
    navigation.goBack(); // 拒绝后回到主页
  };

  const resetOrderForTesting = () => {
    setOrderStatus('pending');
    setTimeLeft(20);
  };

  if (orderStatus !== 'pending') {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
          {orderStatus === 'accepted' ? "✅ Order Accepted" : orderStatus === 'declined' ? "❌ Order Declined" : "⏰ Request Missed"}
        </Text>
        <TouchableOpacity style={styles.simulateBtn} onPress={resetOrderForTesting}>
          <Text style={styles.simulateBtnText}>Simulate New Incoming Order</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isUrgent = timeLeft <= 5;
  const timerColor = isUrgent ? '#FF3B30' : '#000000';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => setIsSidebarOpen(true)}>
          <View style={styles.menuIconBorder}><Ionicons name="menu" size={26} color="black" /></View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DELIVERIES</Text>
        <View style={{ width: 40, marginLeft: 15 }} />
      </View>

      <ScrollView style={{ flex: 1 }} bounces={false}>
        <View style={styles.topInfoRow}>
          <View>
            <Text style={styles.newDeliveryText}>New Delivery</Text>
            <Text style={styles.earningText}>{earningPrice} Earning</Text>
          </View>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.realMap}
            initialRegion={{ latitude: 2.9280, longitude: 101.6420, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
          >
            <Marker coordinate={riderCoords} title="Your Location (GPS)">
              <View style={[styles.customMarkerContainer, { backgroundColor: '#4CAF50' }]}><MaterialIcons name="delivery-dining" size={18} color="white" /></View>
            </Marker>
            <Marker coordinate={starbeesCoords} title={vendorName}>
              <View style={[styles.customMarkerContainer, { backgroundColor: '#2196F3' }]}><Ionicons name="restaurant" size={18} color="white" /></View>
            </Marker>
            <Marker coordinate={hostelCoords} title={customerName}>
              <View style={[styles.customMarkerContainer, { backgroundColor: '#FF3B30' }]}><Ionicons name="home" size={18} color="white" /></View>
            </Marker>
            <Polyline coordinates={[riderCoords, starbeesCoords, hostelCoords]} strokeColor="#00C853" strokeWidth={4} lineDashPattern={[5, 5]} />
          </MapView>
        </View>

        <View style={styles.gpsNoticeRow}>
          <Ionicons name="location-sharp" size={14} color="#00C853" />
          <Text style={styles.gpsNoticeText}> Distance auto-calculated from your current GPS</Text>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.iconWrapper}><Ionicons name="restaurant-outline" size={22} color="black" /></View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>{vendorName}</Text>
            <Text style={styles.locationSub}>({pickupLocation})</Text>
          </View>
          <Text style={styles.timeEst}>5 mins</Text>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.iconWrapper}><Ionicons name="person-outline" size={22} color="black" /></View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>{customerName} ({orderRef})</Text>
            <Text style={styles.locationSub}>{dropoffLocation}</Text>
          </View>
          <Text style={styles.timeEst}>4 mins</Text>
        </View>

        <TouchableOpacity style={styles.orderSummaryRow} onPress={() => setIsDetailsExpanded(!isDetailsExpanded)} activeOpacity={0.7}>
          <View style={styles.iconWrapper}><Ionicons name="bag-handle-outline" size={22} color="black" /></View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.orderId}>Order ({orderRef})</Text>
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
          <Ionicons name={isDetailsExpanded ? "chevron-up" : "chevron-down"} size={20} color="black" />
        </TouchableOpacity>

        {isDetailsExpanded && (
          <View style={styles.orderDetailsContainer}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', lineHeight: 22 }}>{foodDetails}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footerActionArea}>
        <View style={[styles.timerCircle, { borderColor: timerColor }]}>
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
        </View>
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, marginTop: 30, backgroundColor: '#FFF', borderBottomWidth: 1.5, borderBottomColor: '#E0E0E0' },
  menuIcon: { paddingHorizontal: 5 },
  menuIconBorder: { width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: '#000', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  topInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  newDeliveryText: { fontSize: 16, fontWeight: 'bold' },
  earningText: { fontSize: 16, fontWeight: 'bold', color: '#00C853', marginTop: 4 },
  declineBtn: { borderWidth: 1.5, borderColor: '#FF3B30', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFF' },
  declineBtnText: { fontWeight: 'bold', fontSize: 14, color: '#FF3B30' },
  mapContainer: { height: 200, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  realMap: { width: '100%', height: '100%' },
  customMarkerContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  gpsNoticeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#F0FFF4', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  gpsNoticeText: { fontSize: 12, color: '#00C853', fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  iconWrapper: { width: 35, alignItems: 'flex-start' },
  locationTextContainer: { flex: 1, paddingLeft: 5 },
  locationTitle: { fontWeight: 'bold', fontSize: 15 },
  locationSub: { fontSize: 13, color: '#666', marginTop: 2 },
  timeEst: { fontWeight: 'bold', fontSize: 14 },
  orderSummaryRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#F8F9FA' },
  orderId: { fontWeight: 'bold', fontSize: 14 },
  customerName: { fontSize: 12, color: '#888', marginTop: 2 },
  orderDetailsContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  footerActionArea: { padding: 20, backgroundColor: '#FFF', paddingBottom: 40, position: 'relative', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  timerCircle: { position: 'absolute', right: 25, top: -25, width: 50, height: 50, borderRadius: 25, borderWidth: 3, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 5 },
  timerText: { fontWeight: 'bold', fontSize: 18 },
  acceptBtn: { backgroundColor: '#424242', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 5, shadowColor: '#424242', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  acceptBtnText: { fontWeight: 'bold', fontSize: 18, color: '#FFFFFF', letterSpacing: 0.5 },
  simulateBtn: { marginTop: 20, padding: 15, backgroundColor: '#000', borderRadius: 8 },
  simulateBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});