import { useNavigation } from '@react-navigation/native';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function UpdateDeliveryProgress() {
  // ================= 1. 动态业务状态管理 =================
  const [stage, setStage] = useState(1); // 1: At Restaurant, 2: Delivering to Customer
  const [vendorReady, setVendorReady] = useState(false); // 模拟商家是否出餐
  const [photoUri, setPhotoUri] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 控制侧边栏
  const mapRef = useRef(null);

  // 坐标定义 (完美模拟动态位置)
  const starbeesCoords = { latitude: 2.9278, longitude: 101.6415 }; 
  const customerCoords = { latitude: 2.9305, longitude: 101.6440 };  
  
  // 🌟 核心逻辑：骑手当前的位置是动态的
  // Stage 1: 骑手在餐厅等 (坐标和餐厅重合)
  // Stage 2: 骑手开始送餐 (模拟他正在前往顾客的路上，坐标微调)
  const currentRiderCoords = stage === 1 
    ? { latitude: 2.9278, longitude: 101.6415 } 
    : { latitude: 2.9290, longitude: 101.6425 };

  // ================= 2. 交互与流转逻辑 =================

  // 模拟商家点击 "Ready for Pickup" (测试用)
  const simulateVendorReady = () => {
    setVendorReady(true);
    Alert.alert("System Notification", "Vendor has prepared the food! Customer and you are notified.");
  };

  // 骑手点击 Picked Up
  const handlePickedUp = () => {
    setStage(2);
    // 切换阶段后，让地图自动缩放聚焦到骑手和顾客
    setTimeout(() => {
      mapRef.current?.fitToCoordinates([currentRiderCoords, customerCoords], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }, 500);
    Alert.alert("Order Picked Up", "Customer has been notified. Please follow the GPS to drop-off point.");
  };

  // 照片上传模块 (仅保留拍照)
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
          setStage(1);
          setVendorReady(false);
          setPhotoUri(null);
        } 
      }
    ]);
  };

  // ================= 3. 界面渲染 UI =================
  return (
    <SafeAreaView style={styles.container}>
      
      {/* 🌟 统一的 Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => setIsSidebarOpen(true)}>
          <View style={styles.menuIconBorder}>
            <Ionicons name="menu" size={26} color="black" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DELIVERIES</Text>
        <View style={{ width: 40, marginLeft: 15 }} /> {/* 用于保持中间标题绝对居中 */}
      </View>

      <ScrollView style={{ flex: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* 商家状态横幅 (Stage 1 特有) */}
        {stage === 1 && (
          <View style={[styles.vendorStatusBanner, vendorReady ? styles.vendorReadyBg : styles.vendorWaitingBg]}>
            <Ionicons name={vendorReady ? "checkmark-circle" : "time"} size={20} color={vendorReady ? "#00C853" : "#F57C00"} />
            <Text style={[styles.vendorStatusText, { color: vendorReady ? "#00C853" : "#F57C00" }]}>
              {vendorReady ? " Food is ready for pickup!" : " Waiting for vendor to prepare food..."}
            </Text>
            {/* 这个按钮只是给你做演示测试用的，真正开发时是商家端按的 */}
            {!vendorReady && (
              <TouchableOpacity style={styles.testBtn} onPress={simulateVendorReady}>
                <Text style={styles.testBtnText}>Test: Vendor Ready</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 动态全屏地图 (复用专业样式) */}
        <View style={styles.mapContainer}>
          <MapView 
            ref={mapRef}
            style={styles.realMap}
            initialRegion={{
              latitude: 2.9290, 
              longitude: 101.6425,
              latitudeDelta: 0.008, 
              longitudeDelta: 0.008,
            }}
          >
            <Marker coordinate={currentRiderCoords} title="You" zIndex={2}>
              <View style={[styles.customMarkerContainer, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="delivery-dining" size={18} color="white" />
              </View>
            </Marker>

            <Marker coordinate={starbeesCoords} title="Rasa Syiokk" zIndex={1}>
              <View style={[styles.customMarkerContainer, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="restaurant" size={18} color="white" />
              </View>
            </Marker>

            <Marker coordinate={customerCoords} title="Cindy Kiki" zIndex={1}>
              <View style={[styles.customMarkerContainer, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="home" size={18} color="white" />
              </View>
            </Marker>
            
            {stage === 2 && (
              <Polyline coordinates={[currentRiderCoords, customerCoords]} strokeColor="#00C853" strokeWidth={4} lineDashPattern={[5, 5]} />
            )}
          </MapView>
        </View>

        {/* 当前任务目标地址栏 */}
        <View style={styles.locationRow}>
          <View style={styles.iconWrapper}>
            <Ionicons name={stage === 1 ? "restaurant-outline" : "person-outline"} size={22} color="black" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>{stage === 1 ? "Rasa Syiokk" : "Cindy Kiki (#8680)"}</Text>
            <Text style={styles.locationSub}>{stage === 1 ? "Pickup Point • MMU Starbees" : "Drop-off Point • Hostel HB3 & 4"}</Text>
          </View>
          <Text style={styles.timeEst}>{stage === 1 ? "Wait" : "2 mins"}</Text>
        </View>

        {/* 统一的专业折叠订单列表 */}
        <TouchableOpacity style={styles.orderSummaryRow} onPress={() => setIsDetailsExpanded(!isDetailsExpanded)} activeOpacity={0.7}>
          <View style={styles.iconWrapper}>
            <Ionicons name="bag-handle-outline" size={22} color="black" />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.orderId}>Order x4cs-b789q (#8680)</Text>
            <Text style={styles.customerName}>RM 31.00 Total</Text>
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

        {/* Stage 2 特有：支付、备注与 POD */}
        {stage === 2 && (
          <View>
            {/* 备注区域 */}
            <View style={styles.remarksRow}>
              <Ionicons name="document-text-outline" size={20} color="#F57C00" style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.remarksLabel}>Customer Remarks:</Text>
                <Text style={styles.remarksText}>Please put the order on the white table outside the lobby. Thank you so much!</Text>
              </View>
            </View>

            {/* POD 区域 (🌟 移除了相册按钮) */}
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

      {/* 底部操作区 */}
      <View style={styles.footerActionArea}>
        {stage === 1 ? (
          <TouchableOpacity 
            style={[styles.acceptBtn, !vendorReady && styles.btnDisabled]} 
            onPress={handlePickedUp} 
            disabled={!vendorReady}
            activeOpacity={0.8}
          >
            <Text style={[styles.acceptBtnText, !vendorReady && styles.btnTextDisabled]}>
              {vendorReady ? "Picked Up" : "Waiting for Food..."}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.acceptBtn, !photoUri && styles.btnDisabled]} 
            onPress={handleConfirmDelivered}
            disabled={!photoUri} 
            activeOpacity={0.8}
          >
            <Text style={[styles.acceptBtnText, !photoUri && styles.btnTextDisabled]}>Confirmed Delivered</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🌟 侧边栏完全照搬 Working Shift */}
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

// ================= 4. 专业统一级样式表 (CSS) =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // 🌟 Header 更新：同步边框和排版
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
  
  // 商家状态横幅
  vendorStatusBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#E0E0E0' },
  vendorWaitingBg: { backgroundColor: '#FFF3E0' },
  vendorReadyBg: { backgroundColor: '#E8F5E9' },
  vendorStatusText: { flex: 1, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  testBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F57C00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  testBtnText: { fontSize: 10, color: '#F57C00', fontWeight: 'bold' },

  // 地图部分
  mapContainer: { height: 220, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  realMap: { width: '100%', height: '100%' },
  customMarkerContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  
  // 统一的布局
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
  foodItemRow: { flexDirection: 'row', marginBottom: 15 },
  foodQty: { fontWeight: 'bold', fontSize: 14, width: 30, color: '#00C853' }, 
  foodName: { fontWeight: 'bold', fontSize: 14 },
  foodRemarks: { fontSize: 12, color: '#888', marginTop: 2 },
  foodPrice: { fontWeight: 'bold', fontSize: 14 },

  // 备注区域
  remarksRow: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  remarksLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  remarksText: { fontSize: 13, color: '#444', lineHeight: 18 },

  // POD 区域 (调整了 optionBtn 使其作为唯一选项时样式更好看)
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

  // Footer 底部按钮区
  footerActionArea: { padding: 20, backgroundColor: '#FFF', paddingBottom: 40, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  acceptBtn: { backgroundColor: '#00C853', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  acceptBtnText: { fontWeight: 'bold', fontSize: 18, color: '#FFFFFF', letterSpacing: 0.5 },
  
  // 禁用的灰色状态
  btnDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0, elevation: 0 },
  btnTextDisabled: { color: '#9E9E9E' },

  // 🌟 Sidebar Styles
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