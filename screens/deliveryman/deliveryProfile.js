import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useContext } from 'react';
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
  View,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DeliveryProfile() {
  const navigation = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false); // 🌟 新增：保存时的 Loading 状态，防误触

  const { avatarUri, setAvatarUri, riderName, setRiderName } = useContext(RiderContext);

  const [profileData, setProfileData] = useState({
    name: '', 
    gender: '', 
    age: '',
    phone: '',
    email: '', 
  });

  useEffect(() => {
    loadRiderProfile();
  }, []);

  // 🌟 读取数据时，把头像链接也一并拿下来
  const loadRiderProfile = async () => {
    try {
      setIsDataLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        Alert.alert("Error", "User session not found.");
        setIsDataLoading(false);
        return;
      }

      // 查询加入了 avatar_url 字段
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('full_name, gender, age, phone_number, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (dbError) {
        console.log("Fetch profile error:", dbError);
        Alert.alert("Error", "Failed to load profile data.");
      } else if (data) {
        setProfileData({
          name: data.full_name || '',
          gender: data.gender || 'male',
          age: data.age ? data.age.toString() : '',
          phone: data.phone_number || '',
          email: data.email || user.email, 
        });

        if (data.full_name) setRiderName(data.full_name);
        // 如果数据库有头像链接，同步到全局状态，侧边栏也会跟着变
        if (data.avatar_url) setAvatarUri(data.avatar_url);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setProfileData({ ...profileData, [key]: value });
  };

  // 🌟 核心：图片上传至 Supabase Storage 的逻辑
  const uploadAvatar = async (uri, userId) => {
    try {
      // 1. 将本地图片转换成 Blob 格式
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // 2. 提取后缀并生成唯一文件名
      const fileExt = uri.split('.').pop() || 'jpeg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // 3. 上传到刚才建好的 avatars 桶
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. 获取公开的图片 URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      Alert.alert("Image Upload Error", error.message);
      return null;
    }
  };

  // 🌟 点击保存时：先传图片，再存文字
  const handleSave = async () => {
    setIsSaving(true); // 开启 Loading，防止多次点击
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalAvatarUrl = avatarUri;

      // 如果当前头像是本地路径 (file:// 开头)，说明用户刚选了新照片，需要上传
      if (avatarUri && avatarUri.startsWith('file://')) {
        const uploadedUrl = await uploadAvatar(avatarUri, user.id);
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
          setAvatarUri(uploadedUrl); // 把全局状态也替换成网络 URL
        }
      }

      // 更新所有数据到 profiles 表
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.name,
          gender: profileData.gender,
          age: parseInt(profileData.age) || 0,
          phone_number: profileData.phone,
          avatar_url: finalAvatarUrl // 🌟 这里把头像链接存进去了
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert("Save Failed", error.message);
        return;
      }

      setRiderName(profileData.name); 
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

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

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery access is needed to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  if (isDataLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Loading profile...</Text>
      </View>
    );
  }

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
          <TouchableOpacity style={styles.saveActionBtn} onPress={handleSave} disabled={isSaving}>
             {/* 🌟 Save 按钮在上传图片时会变成 Loading */}
            {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionText}>Save</Text>}
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

          <TouchableOpacity style={styles.avatarCircle} onPress={isEditing ? handleChangeAvatar : null} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={50} color="#FFF" />
            )}
            {/* 只在编辑模式下显示相机小图标 */}
            {isEditing && (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.partnerName}>{profileData.name}</Text>
          <View style={styles.statusBadgeOnline}>
            <Text style={styles.statusBadgeText}>ACTIVE RIDER</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="card-outline" size={20} color="#424242" />
            <Text style={styles.cardHeaderTitle}>Personal Information</Text>
          </View>

          {renderInputField('Full Name', profileData.name, (val) => handleInputChange('name', val), isEditing)}
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Gender</Text>
            {isEditing ? (
              <View style={{ flexDirection: 'row', marginTop: 5, paddingVertical: 8 }}>
                {['male', 'female'].map((item) => (
                  <TouchableOpacity key={item} style={styles.radioContainer} onPress={() => handleInputChange('gender', item)}>
                    <View style={[styles.radioOuter, profileData.gender === item && styles.radioSelected]}>
                      {profileData.gender === item && <View style={styles.radioInner} />}
                    </View>
                    <Text style={{ textTransform: 'capitalize', fontSize: 16, fontWeight: '600', color: '#424242' }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.textInputViewMode}>
                {profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not Set'}
              </Text>
            )}
          </View>

          {renderInputField('Age', profileData.age, (val) => handleInputChange('age', val), isEditing, 'numeric')}
          {renderInputField('Phone Number', profileData.phone, (val) => handleInputChange('phone', val), isEditing, 'phone-pad')}
          {renderInputField('Email Address (Cannot be changed)', profileData.email, null, false, 'email-address')}

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==================== 3. 侧边栏 ==================== */}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10,
    backgroundColor: '#FFF', borderBottomWidth: 1.5, borderColor: '#E0E0E0',
  },
  menuIconBox: { width: 40, alignItems: 'flex-start' },
  menuIconBorder: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF'
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#000', letterSpacing: 1 },
  editActionBtn: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  saveActionBtn: { minWidth: 60, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#424242', borderRadius: 15 },
  saveActionText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  mainScrollContent: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 25, position: 'relative', width: '100%' },
  backButtonAbsolute: {
    position: 'absolute', left: 0, top: 0, width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', zIndex: 10
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#424242', justifyContent: 'center', alignItems: 'center',
    position: 'relative', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5
  },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00C853', width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF'
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

  radioContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#000', backgroundColor: '#000' },
  radioInner: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#FFF' },

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
  logoutText: { fontSize: 15, fontWeight: 'bold', color: '#FF3B30' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }
});