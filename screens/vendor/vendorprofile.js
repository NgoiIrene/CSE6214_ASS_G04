import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Platform, Modal, Dimensions, Alert, Image, TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// 1. 引入刚才创建的 supabase 客户端
import { supabase } from '../../supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ navigateToScreen }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  
  // 资料数据流（结构与你的 Supabase profiles 表完全对应）
  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    email: '', 
    phone_number: '',
    gender: 'Female',
    age: '',
    account_type: '',
    avatar_url: null // 【已更新】同步数据库 avatar_url 字段
  });

  // 编辑模式下的临时缓冲区
  const [pendingProfile, setPendingProfile] = useState({ ...profile });

  // 2. 页面加载时自动读取 Supabase 数据
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // 从 Supabase 获取用户资料
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // a. 获取当前登录用户的 auth 信息
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        Alert.alert("Error", "User not logged in or session expired.");
        if (navigateToScreen) navigateToScreen('login'); // 没登录则跳转去登录
        return;
      }

      // b. 用用户的 id 去 profiles 表查询对应数据
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id, full_name, account_type, phone_number, gender, age, email, avatar_url') // 【已更新】加入 avatar_url 查询
        .eq('id', user.id) // 条件：表里的 id 等于当前登录的 user.id
        .single(); // 因为 id 是主键，只取单条数据

      if (dbError) throw dbError;

      if (data) {
        const fetchedData = {
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || user.email, // 如果 profile 没存 email，就用 auth 的 email
          phone_number: data.phone_number || '',
          gender: data.gender || 'Female',
          age: data.age ? String(data.age) : '',
          account_type: data.account_type || '',
          avatar_url: data.avatar_url || null // 【已更新】读取数据库图片
        };
        setProfile(fetchedData);
        setPendingProfile(fetchedData);
      }
    } catch (error) {
      Alert.alert("Error Fetching Profile", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 进入编辑模式时，同步最新数据到缓冲区
  const handleStartEdit = () => {
    setPendingProfile({ ...profile });
    setIsEditMode(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  // 侧边栏菜单跳转逻辑
  const handleMenuSelect = (screenName) => {
    setIsSidebarOpen(false);
    if (navigateToScreen) navigateToScreen(screenName);
  };

  // 更换头像（本地预览）
  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    
    if (!result.canceled) {
      // 【已更新】将选中的图片路径塞入缓冲区的 avatar_url 中
      setPendingProfile({ ...pendingProfile, avatar_url: result.assets[0].uri });
    }
  };

  // 3. 保存资料到 Supabase
  const handleSave = async () => {
    // 表单非空验证
    if (!pendingProfile.full_name.trim()) {
      Alert.alert("Error", "Full Name cannot be empty.");
      return;
    }
    if (!pendingProfile.phone_number.trim()) {
      Alert.alert("Error", "Phone Number cannot be empty.");
      return;
    }
    if (!pendingProfile.age.trim()) {
      Alert.alert("Error", "Age cannot be empty.");
      return;
    }

    try {
      setIsLoading(true);

      // 将修改后的数据 update 回 Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: pendingProfile.full_name.trim(),
          phone_number: pendingProfile.phone_number.trim(),
          gender: pendingProfile.gender,
          age: parseInt(pendingProfile.age, 10), // 转为数字存入数据库
          avatar_url: pendingProfile.avatar_url, // 【已更新】同步更新图片路径到数据库
        })
        .eq('id', profile.id); // 锁定当前用户的行

      if (error) throw error;

      // 数据库更新成功后，同步本地状态
      setProfile({ ...pendingProfile });
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditMode(false);
    } catch (error) {
      Alert.alert("Save Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 如果正在加载，显示加载圈圈
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- 侧边栏 --- */}
      <Modal transparent={true} visible={isSidebarOpen} animationType="none" onRequestClose={() => setIsSidebarOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarSection}>
              <View style={styles.sidebarAvatarCircle}>
                {/* 【已更新】侧边栏头像根据 profile.avatar_url 动态展示 */}
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.sidebarAvatarImage} />
                ) : (
                  <Ionicons name="person-outline" size={45} />
                )}
              </View>
              {/* 【已更新】样式进行了优化升级，摆脱太小看不见的问题 */}
              <Text style={styles.avatarName}>{profile.full_name || 'No Name'}</Text>
            </View>
            {['order', 'profile', 'menu', 'operationstatus', 'historyorder', 'review', 'resetpassword'].map((item) => (
              <TouchableOpacity key={item} style={[styles.sidebarItem, item === 'profile' && styles.sidebarActiveItem]} onPress={() => handleMenuSelect(item)}>
                <Text style={styles.sidebarItemText}>{item.charAt(0).toUpperCase() + item.slice(1).replace(/([A-Z])/g, ' $1')}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuSelect('logout')}>
                <Ionicons name="log-out-outline" size={24} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => setIsSidebarOpen(true)}>
          <Ionicons name="menu-outline" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? "Edit Profile" : "My Profile"}</Text>
        <TouchableOpacity onPress={isEditMode ? handleCancelEdit : handleStartEdit}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{isEditMode ? "Cancel" : "Edit"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* --- 内容区域 --- */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.wireframeCard}>
          
          {/* 头像组件 */}
          <TouchableOpacity disabled={!isEditMode} onPress={pickAvatar} style={styles.avatarBox}>
            {/* 【已更新】区分编辑模式缓冲区和普通查看模式下的 avatar_url */}
            {isEditMode ? (
              pendingProfile.avatar_url ? <Image source={{ uri: pendingProfile.avatar_url }} style={styles.avatarImage} /> : <Ionicons name="person" size={50} />
            ) : (
              profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <Ionicons name="person" size={50} />
            )}
            {isEditMode && <View style={styles.editBadge}><Ionicons name="camera" size={16} color="#fff" /></View>}
          </TouchableOpacity>
          
          {/* Full Name */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>FULL NAME:</Text>
            {isEditMode ? (
              <TextInput style={styles.input} value={pendingProfile.full_name} onChangeText={(v) => setPendingProfile({...pendingProfile, full_name: v})} />
            ) : (
              <Text style={styles.valueText}>{profile.full_name || '—'}</Text>
            )}
          </View>

          {/* Email Address (只读字段) */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>EMAIL ADDRESS (READ-ONLY):</Text>
            <Text style={[styles.valueText, isEditMode && styles.readOnlyText]}>{profile.email || '—'}</Text>
          </View>

          {/* Phone Number */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>PHONE NUMBER:</Text>
            {isEditMode ? (
              <TextInput style={styles.input} keyboardType="phone-pad" value={pendingProfile.phone_number} onChangeText={(v) => setPendingProfile({...pendingProfile, phone_number: v})} />
            ) : (
              <Text style={styles.valueText}>{profile.phone_number || '—'}</Text>
            )}
          </View>

          {/* Gender */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>GENDER:</Text>
            {isEditMode ? (
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[styles.genderOption, pendingProfile.gender === 'Male' && styles.genderSelected]} 
                  onPress={() => setPendingProfile({...pendingProfile, gender: 'Male'})}
                >
                  <Text style={[styles.genderText, pendingProfile.gender === 'Male' && styles.genderTextSelected]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderOption, pendingProfile.gender === 'Female' && styles.genderSelected]} 
                  onPress={() => setPendingProfile({...pendingProfile, gender: 'Female'})}
                >
                  <Text style={[styles.genderText, pendingProfile.gender === 'Female' && styles.genderTextSelected]}>Female</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.valueText}>{profile.gender || '—'}</Text>
            )}
          </View>

          {/* Age */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>AGE:</Text>
            {isEditMode ? (
              <TextInput style={styles.input} keyboardType="number-pad" value={pendingProfile.age} onChangeText={(v) => setPendingProfile({...pendingProfile, age: v})} />
            ) : (
              <Text style={styles.valueText}>{profile.age || '—'}</Text>
            )}
          </View>

          {/* 保存按钮 */}
          {isEditMode && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ fontWeight: 'bold' }}>Save Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35 },
  headerBackBtn: { width: 32, borderWidth: 1.5, borderColor: '#000', borderRadius: 6, padding: 2, alignItems: 'center' },
  headerTitle: { fontSize: 24 },
  divider: { height: 2, backgroundColor: '#000' },
  content: { padding: 25 },
  wireframeCard: { borderWidth: 1.5, borderColor: '#000', padding: 20 },
  avatarBox: { width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'visible' },
  avatarImage: { width: 100, height: 100, borderRadius: 48 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  inputRow: { marginBottom: 15 },
  label: { fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  input: { borderWidth: 1.5, height: 40, paddingHorizontal: 10 },
  valueText: { fontSize: 16, paddingVertical: 8 },
  readOnlyText: { color: '#7f8c8d', fontStyle: 'italic' },
  saveBtn: { borderWidth: 1.5, marginTop: 20, padding: 15, alignItems: 'center' },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  genderOption: { flex: 1, borderWidth: 1.5, borderColor: '#000', padding: 10, alignItems: 'center', marginRight: 5, marginLeft: 5 },
  genderSelected: { backgroundColor: '#000' },
  genderText: { fontWeight: '500', color: '#000' },
  genderTextSelected: { color: '#fff' },
  modalContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { width: SCREEN_WIDTH * 0.75, height: '100%', backgroundColor: '#fff', borderRightWidth: 2, paddingTop: Platform.OS === 'ios' ? 40 : 25 },
  sidebarHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  avatarSection: { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1.5, marginBottom: 10 },
  sidebarAvatarCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden' },
  sidebarAvatarImage: { width: 70, height: 70, borderRadius: 34 }, // 加了圆角防止溢出
  avatarName: { fontSize: 16, fontWeight: 'bold', marginTop: 8, color: '#000' }, // 【已优化】调大字号加粗
  sidebarItem: { width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1.5, alignItems: 'center' },
  sidebarActiveItem: { backgroundColor: '#A9A9A9' },
  sidebarItemText: { fontSize: 22 },
  sidebarFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, paddingVertical: 12 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 22, marginLeft: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }
});