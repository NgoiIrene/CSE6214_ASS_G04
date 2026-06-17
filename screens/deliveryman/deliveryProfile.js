import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useContext } from 'react';
import { RiderContext } from './RiderProvider';
import { supabase } from '../../supabaseClient';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DeliveryProfile() {
  const navigation = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🌟 把它改成同时获取头像和名字的状态
  const { avatarUri, setAvatarUri, riderName, setRiderName } = useContext(RiderContext);

  // 骑手基础资料与载具证件信息
  const [profileData, setProfileData] = useState({
    name: riderName, // 🌟 改成全局变量，这样每次进页面显示的就是最新修改的名字
    phone: '012-345 6789',
    email: 'irene.partner@campusfood.com',
    vehicleType: 'Motorcycle (Yamaha Y15)',
    plateNumber: 'WAA 1234 B',
    licenseNumber: 'D19980512-KL',
    licenseExpiry: '15/06/2028',
  });

  const handleInputChange = (key, value) => {
    setProfileData({ ...profileData, [key]: value });
  };

  const handleSave = () => {
    setRiderName(profileData.name); // 🌟 加上这行，点击 Save 时将新名字同步到全局
    Alert.alert("Success", "Profile updated successfully!");
    setIsEditing(false);
  };

  // 更换头像弹窗选择
  const handleChangeAvatar = () => {
    Alert.alert(
      "Update Profile Picture",
      "Choose where to get your new photo",
      [
        { text: "Take Photo", onPress: openCamera },
        { text: "Choose from Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // 启动相机拍照
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // 打开系统相册
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery access is needed to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ height: Platform.OS === 'ios' ? 10 : 40, backgroundColor: '#FFF' }} />

      {/* ==================== 1. 顶部导航栏 ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIconBox} onPress={() => setIsSidebarOpen(true)}>
          <View style={styles.menuIconBorder}>
            <Ionicons name="menu" size={26} color="black" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>PROFILE</Text>

        {isEditing ? (
          <TouchableOpacity style={styles.saveActionBtn} onPress={handleSave}>
            <Text style={styles.saveActionText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editActionBtn} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={22} color="#424242" />
          </TouchableOpacity>
        )}
      </View>

      {/* ==================== 2. 主体内容滚动区 ==================== */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScrollContent}>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonAbsolute}>
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarCircle} onPress={handleChangeAvatar} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={50} color="#FFF" />
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.partnerName}>{profileData.name}</Text>
          <View style={styles.statusBadgeOnline}>
            <Text style={styles.statusBadgeText}>ACTIVE PARTNER</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="card-outline" size={20} color="#424242" />
            <Text style={styles.cardHeaderTitle}>Personal Information</Text>
          </View>

          {renderInputField('Full Name', profileData.name, (val) => handleInputChange('name', val), isEditing)}
          {renderInputField('Phone Number', profileData.phone, (val) => handleInputChange('phone', val), isEditing, 'phone-pad')}
          {renderInputField('Email Address', profileData.email, null, false, 'email-address')}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="bicycle-outline" size={20} color="#424242" />
            <Text style={styles.cardHeaderTitle}>Delivery & License Information</Text>
          </View>

          {renderInputField('Vehicle Type', profileData.vehicleType, (val) => handleInputChange('vehicleType', val), isEditing)}
          {renderInputField('Plate Number', profileData.plateNumber, (val) => handleInputChange('plateNumber', val), isEditing, 'default', true)}
          {renderInputField('Driving License No.', profileData.licenseNumber, (val) => handleInputChange('licenseNumber', val), isEditing)}
          {renderInputField('License Expiry Date', profileData.licenseExpiry, (val) => handleInputChange('licenseExpiry', val), isEditing)}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==================== 3. 侧边栏 (🌟 PROFILE 激活状态) ==================== */}
      {isSidebarOpen ? (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.closeOverlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.profileAvatar}>
                {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImageReal} /> : <Ionicons name="person" size={36} color="#FFF" />}
              </View>
              {/* 🌟 改成动态的大括号变量 */}
              <Text style={styles.profileName}>{riderName}</Text>
            </View>

            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Home'); }}>
                <Ionicons name="home-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>HOME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItemActive} onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="person" size={22} color="#424242" style={styles.menuIconLeft} />
                <Text style={styles.menuTextActive}>PROFILE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('WorkingShift'); }}>
                <Ionicons name="calendar-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>WORKING SHIFT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('EarningsHistory'); }}>
                <Ionicons name="wallet-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>EARNINGS & HISTORY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); Alert.alert("Notice", "Reset Password clicked"); }}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>RESET PASSWORD</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={async () => { setIsSidebarOpen(false); const { error } = await supabase.auth.signOut(); if (error) return Alert.alert('Logout failed', error.message || 'Please try again.'); }}>
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

const renderInputField = (label, value, onChange, isEditing, keyboardType = 'default', autoCaps = false) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    {isEditing ? (
      <TextInput
        style={styles.textInputEditing}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={autoCaps ? 'characters' : 'words'}
        selectionColor="#424242"
      />
    ) : (
      <Text style={styles.textInputViewMode}>{value || 'Not Set'}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  menuIconBox: { width: 40, alignItems: 'flex-start' },
  menuIconBorder: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF'
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#000', letterSpacing: 1 },
  editActionBtn: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  saveActionBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#424242', borderRadius: 15 },
  saveActionText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  mainScrollContent: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 25, position: 'relative', width: '100%' },
  backButtonAbsolute: {
    position: 'absolute', left: 0, top: 0,
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#D0D0D0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', zIndex: 10
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#424242',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5
  },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00C853',
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF'
  },
  partnerName: { fontSize: 22, fontWeight: 'bold', color: '#000', marginTop: 15 },
  statusBadgeOnline: { backgroundColor: '#E8F5E9', borderColor: '#81C784', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 8 },
  statusBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  cardHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#424242', marginLeft: 10 },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8 },
  textInputViewMode: { fontSize: 16, fontWeight: '600', color: '#111', paddingVertical: 5 },
  textInputEditing: { fontSize: 16, fontWeight: '600', color: '#424242', backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#D0D0D0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10 },

  // 🌟 完全统一的侧边栏样式
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