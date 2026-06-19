import { useNavigation, useRoute } from '@react-navigation/native'; // 🌟 引入 useRoute
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Alert, Image, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function UpdateDeliveryProgress() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // 🌟 接住上一页传过来的真实订单数据！
  const orderData = route.params?.orderData;

  const [stage, setStage] = useState(1); 
  const [vendorReady, setVendorReady] = useState(false); 
  const [photoUri, setPhotoUri] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const mapRef = useRef(null);

  // 🌟 动态数据绑定
  const orderRef = orderData?.order_ref || '#8680';
  const customerName = orderData?.customer_name || 'Cindy Kiki';
  const vendorName = orderData?.vendor_name || 'Rasa Syiokk';
  const pickupLocation = orderData?.pickup_location || 'MMU Starbees';
  const dropoffLocation = orderData?.dropoff_location || 'Hostel HB3 & 4';
  const foodDetails = orderData?.food_details || '2x Nasi Lemak w Ayam Rendang\n1x Teh Tarik (Ice)';
  const earningPrice = orderData?.earning ? `RM ${Number(orderData.earning).toFixed(2)}` : 'RM 5.00';

  const starbeesCoords = { latitude: 2.9278, longitude: 101.6415 };
  const customerCoords = { latitude: 2.9305, longitude: 101.6440 };

  const currentRiderCoords = stage === 1
    ? { latitude: 2.9278, longitude: 101.6415 }
    : { latitude: 2.9290, longitude: 101.6425 };

  const simulateVendorReady = () => {
    setVendorReady(true);
    Alert.alert("System Notification", "Vendor has prepared the food! Customer and you are notified.");
  };

  const handlePickedUp = () => {
    setStage(2);
    setTimeout(() => {
      mapRef.current?.fitToCoordinates([currentRiderCoords, customerCoords], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }, 500);
    Alert.alert("Order Picked Up", "Customer has been notified. Please follow the GPS to drop-off point.");
  };

  const setPhotoFromResult = (result) => {
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleLaunchCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed for POD.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
    setPhotoFromResult(result);
  };

  const handleConfirmDelivered = () => {
    Alert.alert("Delivery Completed!", "Order moved to delivery history.", [
      {
        text: "OK",
        onPress: () => {
          navigation.navigate('Home'); // 完成后直接回主页继续接单！
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => setIsSidebarOpen(true)}>
          <View style={styles.menuIconBorder}><Ionicons name="menu" size={26} color="black" /></View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DELIVERIES</Text>
        <View style={{ width: 40, marginLeft: 15 }} /> 
      </View>

      <ScrollView style={{ flex: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        {stage === 1 && (
          <View style={[styles.vendorStatusBanner, vendorReady ? styles.vendorReadyBg : styles.vendorWaitingBg]}>
            <Ionicons name={vendorReady ? "checkmark-circle" : "time"} size={20} color={vendorReady ? "#00C853" : "#F57C00"} />
            <Text style={[styles.vendorStatusText, { color: vendorReady ? "#00C853" : "#F57C00" }]}>
              {vendorReady ? " Food is ready for pickup!" : " Waiting for vendor to prepare food..."}
            </Text>
            {!vendorReady && (
              <TouchableOpacity style={styles.testBtn} onPress={simulateVendorReady}>
                <Text style={styles.testBtnText}>Test: Vendor Ready</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.mapContainer}>
          <MapView ref={mapRef} style={styles.realMap} initialRegion={{ latitude: 2.9290, longitude: 101.6425, latitudeDelta: 0.008, longitudeDelta: 0.008 }}>
            <Marker coordinate={currentRiderCoords} title="You" zIndex={2}><View style={[styles.customMarkerContainer, { backgroundColor: '#4CAF50' }]}><MaterialIcons name="delivery-dining" size={18} color="white" /></View></Marker>
            <Marker coordinate={starbeesCoords} title={vendorName} zIndex={1}><View style={[styles.customMarkerContainer, { backgroundColor: '#2196F3' }]}><Ionicons name="restaurant" size={18} color="white" /></View></Marker>
            <Marker coordinate={customerCoords} title={customerName} zIndex={1}><View style={[styles.customMarkerContainer, { backgroundColor: '#FF3B30' }]}><Ionicons name="home" size={18} color="white" /></View></Marker>
            {stage === 2 && <Polyline coordinates={[currentRiderCoords, customerCoords]} strokeColor="#00C853" strokeWidth={4} lineDashPattern={[5, 5]} />}
          </MapView>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.iconWrapper}><Ionicons name={stage === 1 ? "restaurant-outline" : "person-outline"} size={22} color="black" /></View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>{stage === 1 ? vendorName : `${customerName} (${orderRef})`}</Text>
            <Text style={styles.locationSub}>{stage === 1 ? `Pickup Point • ${pickupLocation}` : `Drop-off Point • ${dropoffLocation}`}</Text>
          </View>
          <Text style={styles.timeEst}>{stage === 1 ? "Wait" : "2 mins"}</Text>
        </View>

        <TouchableOpacity style={styles.orderSummaryRow} onPress={() => setIsDetailsExpanded(!isDetailsExpanded)} activeOpacity={0.7}>
          <View style={styles.iconWrapper}><Ionicons name="bag-handle-outline" size={22} color="black" /></View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.orderId}>Order ({orderRef})</Text>
            <Text style={styles.customerName}>Earning: {earningPrice}</Text>
          </View>
          <Ionicons name={isDetailsExpanded ? "chevron-up" : "chevron-down"} size={20} color="black" />
        </TouchableOpacity>

        {isDetailsExpanded && (
          <View style={styles.orderDetailsContainer}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', lineHeight: 22 }}>{foodDetails}</Text>
          </View>
        )}

        {stage === 2 && (
          <View>
            <View style={styles.remarksRow}>
              <Ionicons name="document-text-outline" size={20} color="#F57C00" style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.remarksLabel}>User Remarks:</Text>
                <Text style={styles.remarksText}>Please put the order on the white table outside the lobby. Thank you so much!</Text>
              </View>
            </View>

            <View style={styles.proofSection}>
              <View style={styles.proofHeader}>
                <Ionicons name={photoUri ? "checkmark-circle" : "ellipse-outline"} size={20} color={photoUri ? "#00C853" : "#666"} />
                <Text style={styles.proofHeaderText}>Proof of Delivered (POD)</Text>
              </View>
              <Text style={styles.proofSubText}>Add a photo as proof of delivered</Text>

              {!photoUri ? (
                <View style={styles.photoOptionsRow}>
                  <TouchableOpacity style={styles.optionBtn} onPress={handleLaunchCamera}>
                    <Ionicons name="camera" size={26} color="black" />
                    <Text style={styles.optionText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.thumbnailContainer}>
                  <Image source={{ uri: photoUri }} style={styles.thumbnailImage} />
                  <TouchableOpacity style={styles.deleteIconBtn} onPress={() => setPhotoUri(null)}>
                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footerActionArea}>
        {stage === 1 ? (
          <TouchableOpacity style={[styles.acceptBtn, !vendorReady && styles.btnDisabled]} onPress={handlePickedUp} disabled={!vendorReady} activeOpacity={0.8}>
            <Text style={[styles.acceptBtnText, !vendorReady && styles.btnTextDisabled]}>{vendorReady ? "Picked Up" : "Waiting for Food..."}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.acceptBtn, !photoUri && styles.btnDisabled]} onPress={handleConfirmDelivered} disabled={!photoUri} activeOpacity={0.8}>
            <Text style={[styles.acceptBtnText, !photoUri && styles.btnTextDisabled]}>Confirmed Delivered</Text>
          </TouchableOpacity>
        )}
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
  vendorStatusBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#E0E0E0' },
  vendorWaitingBg: { backgroundColor: '#FFF3E0' },
  vendorReadyBg: { backgroundColor: '#E8F5E9' },
  vendorStatusText: { flex: 1, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  testBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F57C00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  testBtnText: { fontSize: 10, color: '#F57C00', fontWeight: 'bold' },
  mapContainer: { height: 220, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  realMap: { width: '100%', height: '100%' },
  customMarkerContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  locationRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  iconWrapper: { width: 35, alignItems: 'flex-start' },
  locationTextContainer: { flex: 1, paddingLeft: 5 },
  locationTitle: { fontWeight: 'bold', fontSize: 16 },
  locationSub: { fontSize: 13, color: '#666', marginTop: 2 },
  timeEst: { fontWeight: 'bold', fontSize: 14 },
  orderSummaryRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#F8F9FA' },
  orderId: { fontWeight: 'bold', fontSize: 14 },
  customerName: { fontSize: 12, color: '#888', marginTop: 2 },
  orderDetailsContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  remarksRow: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  remarksLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  remarksText: { fontSize: 13, color: '#444', lineHeight: 18 },
  proofSection: { padding: 20, backgroundColor: '#FAFAFA' },
  proofHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  proofHeaderText: { fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  proofSubText: { fontSize: 13, color: '#888', marginLeft: 28, marginBottom: 15 },
  photoOptionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  optionBtn: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#000', paddingVertical: 18, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  optionText: { fontWeight: 'bold', marginTop: 8, fontSize: 13, color: '#000' },
  thumbnailContainer: { marginTop: 10, position: 'relative', alignSelf: 'center' },
  thumbnailImage: { width: 200, height: 150, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  deleteIconBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 15 },
  footerActionArea: { padding: 20, backgroundColor: '#FFF', paddingBottom: 40, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  acceptBtn: { backgroundColor: '#00C853', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  acceptBtnText: { fontWeight: 'bold', fontSize: 18, color: '#FFFFFF', letterSpacing: 0.5 },
  btnDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0, elevation: 0 },
  btnTextDisabled: { color: '#9E9E9E' }
});