import { useNavigation } from '@react-navigation/native';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function ProcessDeliveryRequest() {
  const [orderStatus, setOrderStatus] = useState('pending');
  const [timeLeft, setTimeLeft] = useState(20);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleAccept = () => {
    setOrderStatus('accepted');
    Alert.alert("Order Accepted!", "GPS connected. Please follow the route to the restaurant for pick-up.");
  };

  const handleDecline = () => {
    setOrderStatus('declined');
    Alert.alert("Order Declined", "This request will be passed to another rider.");
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
          <View style={styles.menuIconBorder}>
            <Ionicons name="menu" size={26} color="black" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DELIVERIES</Text>
        <View style={{ width: 40, marginLeft: 15 }} />
      </View>

      <ScrollView style={{ flex: 1 }} bounces={false}>
        
        <View style={styles.topInfoRow}>
          <View>
            <Text style={styles.newDeliveryText}>New Delivery</Text>
            <Text style={styles.earningText}>RM5.00 Earning</Text>
          </View>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView 
            style={styles.realMap}
            initialRegion={{
              latitude: 2.9280, 
              longitude: 101.6420,
              latitudeDelta: 0.012, 
              longitudeDelta: 0.012,
            }}
          >
            <Marker coordinate={riderCoords} title="Your Location (GPS)">
              <View style={[styles.customMarkerContainer, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="delivery-dining" size={18} color="white" />
              </View>
            </Marker>

            <Marker coordinate={starbeesCoords} title="Rasa Syiokk (Starbees)">
              <View style={[styles.customMarkerContainer, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="restaurant" size={18} color="white" />
              </View>
            </Marker>

            <Marker coordinate={hostelCoords} title="Cindy Kiki (Hostel HB3)">
              <View style={[styles.customMarkerContainer, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="home" size={18} color="white" />
              </View>
            </Marker>
            
            <Polyline 
              coordinates={[riderCoords, starbeesCoords, hostelCoords]} 
              strokeColor="#00C853" 
              strokeWidth={4} 
              lineDashPattern={[5, 5]} 
            />
          </MapView>
        </View>

        <View style={styles.gpsNoticeRow}>
          <Ionicons name="location-sharp" size={14} color="#00C853" />
          <Text style={styles.gpsNoticeText}> Distance auto-calculated from your current GPS</Text>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.iconWrapper}>
            <Ionicons name="restaurant-outline" size={22} color="black" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Rasa Syiokk</Text>
            <Text style={styles.locationSub}>(MMU Starbees)</Text>
          </View>
          <Text style={styles.timeEst}>5 mins</Text>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.iconWrapper}>
            <Ionicons name="person-outline" size={22} color="black" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Cindy Kiki (#8680)</Text>
            <Text style={styles.locationSub}>Hostel HB3 & 4</Text>
          </View>
          <Text style={styles.timeEst}>4 mins</Text>
        </View>

        <TouchableOpacity 
          style={styles.orderSummaryRow} 
          onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="bag-handle-outline" size={22} color="black" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.orderId}>x4cs-b789q (#8680)</Text>
            <Text style={styles.customerName}>Cindy Kiki</Text>
          </View>
          <Ionicons name={isDetailsExpanded ? "chevron-up" : "chevron-down"} size={20} color="black" />
        </TouchableOpacity>

        {isDetailsExpanded && (
          <View style={styles.orderDetailsContainer}>
            <View style={styles.foodItemRow}>
              <Text style={styles.foodQty}>2x</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>Nasi Lemak w Ayam Rendang</Text>
                <Text style={styles.foodRemarks}>Add-on sambal, 1 telur rebus</Text>
              </View>
              <Text style={styles.foodPrice}>RM 24.00</Text>
            </View>
            <View style={styles.foodItemRow}>
              <Text style={styles.foodQty}>1x</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>Teh Tarik (Ice)</Text>
              </View>
              <Text style={styles.foodPrice}>RM 2.00</Text>
            </View>
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
                <Ionicons name="person" size={36} color="#FFF" />
              </View>
              <Text style={styles.profileName}>Charlene</Text>
            </View>

            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItemActive}>
                <Ionicons name="home" size={22} color="#424242" style={styles.menuIconLeft} />
                <Text style={styles.menuTextActive}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="calendar-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Working Shift</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="wallet-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Earnings & History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Reset Password</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity 
                style={styles.logoutButton} 
                activeOpacity={0.7}
                onPress={() => {
                  setIsSidebarOpen(false);
                  Alert.alert("Logout", "Logging out...");
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
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15, 
    marginTop: 30, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1.5, 
    borderBottomColor: '#E0E0E0' 
  },
  
  menuIcon: { paddingHorizontal: 5 },
  menuIconBorder: {
    width: 40, 
    height: 40, 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  
  headerTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  topInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  newDeliveryText: { fontSize: 16, fontWeight: 'bold' },
  earningText: { fontSize: 16, fontWeight: 'bold', color: '#00C853', marginTop: 4 },
  
  declineBtn: { borderWidth: 1.5, borderColor: '#FF3B30', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFF' },
  declineBtnText: { fontWeight: 'bold', fontSize: 14, color: '#FF3B30' },
  
  mapContainer: { height: 200, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  realMap: { width: '100%', height: '100%' },
  
  customMarkerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
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
  
  orderDetailsContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  foodItemRow: { flexDirection: 'row', marginBottom: 15 },
  foodQty: { fontWeight: 'bold', fontSize: 14, width: 30, color: '#00C853' }, 
  foodName: { fontWeight: 'bold', fontSize: 14 },
  foodRemarks: { fontSize: 12, color: '#888', marginTop: 2 },
  foodPrice: { fontWeight: 'bold', fontSize: 14 },
  
  footerActionArea: { padding: 20, backgroundColor: '#FFF', paddingBottom: 40, position: 'relative', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  timerCircle: { position: 'absolute', right: 25, top: -25, width: 50, height: 50, borderRadius: 25, borderWidth: 3, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 5 },
  timerText: { fontWeight: 'bold', fontSize: 18 },
  
  /* 🌟 Accept 按钮改为了暗黑色，并且调整了阴影颜色 */
  acceptBtn: { backgroundColor: '#424242', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 5, shadowColor: '#424242', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  acceptBtnText: { fontWeight: 'bold', fontSize: 18, color: '#FFFFFF', letterSpacing: 0.5 },
  
  simulateBtn: { marginTop: 20, padding: 15, backgroundColor: '#000', borderRadius: 8 },
  simulateBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  sidebarOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    zIndex: 100, 
  },
  closeOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', 
  },
  sidebar: {
    width: '75%', 
    backgroundColor: '#FFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  sidebarHeader: {
    alignItems: 'center',
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    backgroundColor: '#424242', 
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  menuList: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
  },
  menuItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
    backgroundColor: '#F5F5F5', 
    borderLeftWidth: 4,
    borderColor: '#424242',
  },
  menuIconLeft: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuTextActive: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#424242',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  logoutButton: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF3B30',
  }
});