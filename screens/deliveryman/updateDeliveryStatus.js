import { useNavigation, useRoute } from '@react-navigation/native'; 
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Alert, Image, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function UpdateDeliveryProgress() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const orderData = route.params?.orderData;

  const [stage, setStage] = useState(1); 
  const [vendorReady, setVendorReady] = useState(false); 
  const [photoUri, setPhotoUri] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [vendorProfileName, setVendorProfileName] = useState(null);
  const [customerProfileName, setCustomerProfileName] = useState(null);
  const [vendorProfileAddress, setVendorProfileAddress] = useState(null);
  const [customerProfileAddress, setCustomerProfileAddress] = useState(null);
  const mapRef = useRef(null);
  
  // get earnings
  const [calculatedEarning, setCalculatedEarning] = useState(5.00); 

  useEffect(() => {
    const fetchBaseFee = async () => {
      if (orderData?.vendor_id) {
        const { data, error } = await supabase
          .from('delivery_zones')
          .select('base_fee')
          .eq('vendor_id', orderData.vendor_id)
          .single();

        if (data && data.base_fee) {
          setCalculatedEarning(data.base_fee); 
        }
      } else if (orderData?.earning) {
        setCalculatedEarning(Number(orderData.earning));
      }
    };

    const fetchProfileNames = async () => {
      if (!orderData) return;
      const ids = [];
      if (orderData.vendor_id) ids.push(orderData.vendor_id);
      if (orderData.user_id) ids.push(orderData.user_id);
      if (orderData.customer_id) ids.push(orderData.customer_id);
      if (ids.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, address')
        .in('id', ids);

      if (!error && data) {
        data.forEach((profile) => {
          if (profile.id === orderData.vendor_id) {
            setVendorProfileName(profile.full_name);
            setVendorProfileAddress(profile.address || null);
          }
          if (profile.id === orderData.user_id || profile.id === orderData.customer_id) {
            setCustomerProfileName(profile.full_name);
            setCustomerProfileAddress(profile.address || null);
          }
        });
      }
    };

    fetchBaseFee();
    fetchProfileNames();
  }, [orderData]);

  // actual database field names
  const [orderRef] = useState('ORD-' + Math.floor(100000 + Math.random() * 900000));
  const customerName = customerProfileName || orderData?.customer_name || orderData?.customer?.full_name || orderData?.customer || orderData?.user_name || 'Cindy Kiki';
  const vendorName = vendorProfileName || orderData?.vendor_name || orderData?.vendor?.full_name || orderData?.vendor || 'Rasa Syiokk';
  const pickupLocation = vendorName;
  const dropoffLocation = orderData?.delivery_building || orderData?.dropoff_location || orderData?.building || customerProfileAddress || 'Hostel HB3 & 4';
  const foodDetails = orderData?.food_details || orderData?.notes || '2x Nasi Lemak w Ayam Rendang\n1x Teh Tarik (Ice)';
  
  const earningValue = orderData?.earning != null ? Number(orderData.earning) : calculatedEarning;
  const earningPrice = `RM ${earningValue.toFixed(2)}`;

  const starbeesCoords = { latitude: 2.9278, longitude: 101.6415 };
  const deliveryManStartCoords = { latitude: 2.9273, longitude: 101.6422 };

  const customerLocationMap = {
    'Hostel HB 1': { latitude: 2.9300, longitude: 101.6443, icon: 'home', color: '#FF3B30' },
    'Hostel HB 2': { latitude: 2.9298, longitude: 101.6438, icon: 'home', color: '#FF3B30' },
    'Hostel HB 3 & 4': { latitude: 2.9305, longitude: 101.6440, icon: 'home', color: '#FF3B30' },
    'FCI Building': { latitude: 2.9284, longitude: 101.6439, icon: 'business', color: '#4A90E2' },
    'FOM Building': { latitude: 2.9270, longitude: 101.6432, icon: 'business', color: '#4A90E2' },
    'Main Library': { latitude: 2.9292, longitude: 101.6420, icon: 'book', color: '#7B1FA2' },
  };

  const pickupRouteCoordinates = [
    deliveryManStartCoords,
    { latitude: 2.9275, longitude: 101.6426 },
    { latitude: 2.9277, longitude: 101.6430 },
    starbeesCoords
  ];

  const routePathMap = {
    'Hostel HB 1': [
      starbeesCoords,
      { latitude: 2.9288, longitude: 101.6422 },
      { latitude: 2.9295, longitude: 101.6433 },
      { latitude: 2.9300, longitude: 101.6443 }
    ],
    'Hostel HB 2': [
      starbeesCoords,
      { latitude: 2.9286, longitude: 101.6420 },
      { latitude: 2.9293, longitude: 101.6430 },
      { latitude: 2.9298, longitude: 101.6438 }
    ],
    'Hostel HB 3 & 4': [
      starbeesCoords,
      { latitude: 2.9289, longitude: 101.6423 },
      { latitude: 2.9297, longitude: 101.6436 },
      { latitude: 2.9305, longitude: 101.6440 }
    ],
    'FCI Building': [
      starbeesCoords,
      { latitude: 2.9281, longitude: 101.6422 },
      { latitude: 2.9284, longitude: 101.6439 }
    ],
    'FOM Building': [
      starbeesCoords,
      { latitude: 2.9274, longitude: 101.6418 },
      { latitude: 2.9270, longitude: 101.6432 }
    ],
    'Main Library': [
      starbeesCoords,
      { latitude: 2.9284, longitude: 101.6419 },
      { latitude: 2.9292, longitude: 101.6420 }
    ]
  };

  const selectedCustomerLocation = customerLocationMap[dropoffLocation] || { latitude: 2.9305, longitude: 101.6440, icon: 'home', color: '#FF3B30' };
  const routeCoordinates = routePathMap[dropoffLocation] || [starbeesCoords, selectedCustomerLocation];
  const customerCoords = routeCoordinates[routeCoordinates.length - 1];
  const customerIconName = selectedCustomerLocation.icon;
  const customerIconColor = selectedCustomerLocation.color;
  const currentStageRoute = stage === 1 ? pickupRouteCoordinates : routeCoordinates;
  const initialRegion = {
    latitude: (currentStageRoute[0].latitude + currentStageRoute[currentStageRoute.length - 1].latitude) / 2,
    longitude: (currentStageRoute[0].longitude + currentStageRoute[currentStageRoute.length - 1].longitude) / 2,
    latitudeDelta: Math.max(Math.abs(currentStageRoute[0].latitude - currentStageRoute[currentStageRoute.length - 1].latitude) * 2, 0.01),
    longitudeDelta: Math.max(Math.abs(currentStageRoute[0].longitude - currentStageRoute[currentStageRoute.length - 1].longitude) * 2, 0.01),
  };
  const [riderCoords, setRiderCoords] = useState(deliveryManStartCoords);
  const [remainingMinutes, setRemainingMinutes] = useState(2);
  const animationIntervalRef = useRef(null);

  const animateRiderAlongRoute = (path, durationMs = 120000) => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    if (!path || path.length < 2) {
      setRiderCoords(deliveryManStartCoords);
      return;
    }

    const startTime = Date.now();
    setRiderCoords(path[0]);
    setRemainingMinutes(Math.ceil(durationMs / 60000));

    animationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(durationMs - elapsed, 0);
      const remaining = Math.ceil(remainingMs / 60000);
      const progress = Math.min(elapsed / durationMs, 1);
      const totalSegments = path.length - 1;
      const pathPosition = progress * totalSegments;
      const segmentIndex = Math.min(Math.floor(pathPosition), totalSegments - 1);
      const segmentProgress = pathPosition - segmentIndex;
      const from = path[segmentIndex];
      const to = path[segmentIndex + 1];
      const nextCoords = {
        latitude: from.latitude + (to.latitude - from.latitude) * segmentProgress,
        longitude: from.longitude + (to.longitude - from.longitude) * segmentProgress,
      };

      setRiderCoords(nextCoords);
      setRemainingMinutes(remaining);

      if (progress >= 1) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
        setRemainingMinutes(0);
      }
    }, 1000);
  };

  useEffect(() => {
    if (stage === 1) {
      // rider icon start moving along the route 
      animateRiderAlongRoute(pickupRouteCoordinates, 60000); // 60s heading to the stall
    }
  }, [stage]);

  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!orderData?.id) return;

    if (orderData.status === 'ready_for_pickup') {
      setVendorReady(true);
    }

    const statusChannel = supabase
      .channel(`order-status-${orderData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderData.id}` 
        },
        (payload) => {
          const updatedOrder = payload.new;
          if (updatedOrder.status === 'ready_for_pickup') {
            setVendorReady(true);
            Alert.alert("🔔 Food Ready!", "The vendor has finished preparing the food. Please pick it up.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [orderData?.id]);

  const currentPickupRoute = pickupRouteCoordinates;

  //  Picked up by Delivery Man
  const handleConfirmPickUp = async () => {
    try {
      if (orderData?.id) {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'pickup_rider' }) // update status
          .eq('id', orderData.id);
        if (error) throw error;
      }
      setStage(2); 
      setRiderCoords(starbeesCoords);
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(pickupRouteCoordinates, {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }, 500);
      Alert.alert("Order Picked Up ✅", "Food is secured. Click 'Start Delivery' when you are ready to hit the road.");
    } catch (e) {
      Alert.alert("Error", "Could not update status.");
      console.log(e);
    }
  };

  // Action2：start delivery (Out for Delivery)
  const handleStartDelivery = async () => {
    try {
      if (orderData?.id) {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'otw_delivery' }) // update status to delivery
          .eq('id', orderData.id);
        if (error) throw error;
      }
      setStage(3); 
      setRemainingMinutes(2);
      animateRiderAlongRoute(routeCoordinates, 120000);
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoordinates, {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }, 500);
    } catch (e) {
      Alert.alert("Error", "Could not update status.");
      console.log(e);
    }
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

  const handleConfirmDelivered = async () => {
    try {
      if (orderData?.id) {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', orderData.id);

        if (error) throw error;
      }

      Alert.alert("Delivery Completed!", "Order moved to delivery history.", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate('Home'); 
          }
        }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not update delivery status.");
      console.log(e);
    }
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
          </View>
        )}

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.realMap}
            initialRegion={initialRegion}
            onMapReady={() => {
              if (stage === 1) {
                mapRef.current?.fitToCoordinates(pickupRouteCoordinates, {
                  edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                  animated: true,
                });
              }
            }}
          >
            <Marker coordinate={riderCoords} title="You" zIndex={3}>
              <View style={[styles.customMarkerContainer, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="delivery-dining" size={18} color="white" />
              </View>
            </Marker>
            <Marker coordinate={starbeesCoords} title={vendorName} zIndex={2}>
              <View style={[styles.customMarkerContainer, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="restaurant" size={18} color="white" />
              </View>
            </Marker>
            <Marker coordinate={customerCoords} title={dropoffLocation} zIndex={1}>
              <View style={[styles.customMarkerContainer, { backgroundColor: customerIconColor }]}>
                <Ionicons name={customerIconName} size={18} color="white" />
              </View>
            </Marker>
            {stage === 1 && <Polyline coordinates={pickupRouteCoordinates} strokeColor="#2196F3" strokeWidth={4} lineDashPattern={[4, 4]} />}
            {stage === 3 && <Polyline coordinates={routeCoordinates} strokeColor="#00C853" strokeWidth={4} lineDashPattern={[5, 5]} />}
          </MapView>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.iconWrapper}>
            <Ionicons name={stage <= 2 ? "restaurant-outline" : "person-outline"} size={22} color="black" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>
              {stage <= 2 ? vendorName || 'Vendor' : `${customerName || 'Customer'} • ${orderRef || ''}`}
            </Text>
            <Text style={styles.locationSub}>
              {stage === 3 ? `Drop-off Point • ${dropoffLocation}` : `Pickup Point • ${pickupLocation || 'Loading...'}`}
            </Text>
          </View>
          <Text style={styles.timeEst}>
            {stage === 1 ? 'Awaiting pickup' : stage === 2 ? 'On the way' : `${remainingMinutes || '<1'} min`}
          </Text>
        </View>

        {stage === 1 && (
          <View style={styles.orderDetailsCard}>
            <Text style={styles.orderDetailsLabel}>Order Number</Text>
            <Text style={styles.orderDetailsValue}>{orderRef}</Text>
            <Text style={[styles.orderDetailsLabel, { marginTop: 12 }]}>Order Details</Text>
            <Text style={styles.orderDetailsValue}>{foodDetails}</Text>
          </View>
        )}

        {stage === 3 && (
          <View>
            <View style={styles.remarksRow}>
              <Ionicons name="document-text-outline" size={20} color="#F57C00" style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.remarksLabel}>User Remarks:</Text>
                <Text style={styles.remarksText}>{orderData?.remarks || 'Please put the order on the white table outside the lobby. Thank you so much!'}</Text>
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
          <TouchableOpacity style={[styles.acceptBtn, !vendorReady && styles.btnDisabled]} onPress={handleConfirmPickUp} disabled={!vendorReady} activeOpacity={0.8}>
            <Text style={[styles.acceptBtnText, !vendorReady && styles.btnTextDisabled]}>{vendorReady ? "Confirm Pick Up" : "Waiting for Food..."}</Text>
          </TouchableOpacity>
        ) : stage === 2 ? (
          <TouchableOpacity style={styles.acceptBtn} onPress={handleStartDelivery} activeOpacity={0.8}>
            <Text style={styles.acceptBtnText}>Start Delivery</Text>
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
  orderDetailsCard: { marginHorizontal: 15, padding: 16, borderRadius: 14, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 10 },
  orderDetailsLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 4 },
  orderDetailsValue: { fontSize: 15, color: '#222', lineHeight: 22 },
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