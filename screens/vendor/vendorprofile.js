import React, { useState } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Platform, Modal, Dimensions, Alert, Image, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ navigateToScreen }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 模拟正式资料
  const [profile, setProfile] = useState({
    Name: 'Charlene',
    Address: 'Cyberjaya, Selangor',
    HealthCert: 'Uploaded_HC.pdf',
    NightLicense: 'Uploaded_NL.jpg',
    CleanlinessRating: '9.5/10'
  });

  const [pendingProfile, setPendingProfile] = useState({ ...profile });
  const [avatarUri, setAvatarUri] = useState(null);

  // 侧边栏菜单跳转逻辑
  const handleMenuSelect = (screenName) => {
    setIsSidebarOpen(false);
    if (navigateToScreen) navigateToScreen(screenName);
  };

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleFileUpload = async (key) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (!result.canceled) setPendingProfile({ ...pendingProfile, [key]: result.assets[0].name });
  };

  const handleSave = () => {
    Alert.alert("Success", "Profile updated! Please wait for admin approval.");
    setIsEditMode(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- 侧边栏 (与 ResetPassword 一致) --- */}
      <Modal transparent={true} visible={isSidebarOpen} animationType="none" onRequestClose={() => setIsSidebarOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}><Ionicons name="menu" size={32} /></TouchableOpacity>
            </View>
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}><Ionicons name="person-outline" size={45} /></View>
              <Text style={styles.avatarName}>Rasa Syiok</Text>
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
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}><View style={styles.backdrop} /></TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => setIsSidebarOpen(true)}><Ionicons name="menu-outline" size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? "Edit Profile" : "My Profile"}</Text>
        <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}><Text style={{fontSize: 16, fontWeight: 'bold'}}>{isEditMode ? "Cancel" : "Edit"}</Text></TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* --- 内容区域 --- */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.wireframeCard}>
          <TouchableOpacity disabled={!isEditMode} onPress={pickAvatar} style={styles.avatarBox}>
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} /> : <Ionicons name="person" size={50} />}
            {isEditMode && <View style={styles.editBadge}><Ionicons name="camera" size={16} color="#fff" /></View>}
          </TouchableOpacity>
          
          {Object.entries(pendingProfile).map(([key, value]) => (
            <View key={key} style={styles.inputRow}>
              <Text style={styles.label}>{key.toUpperCase()}:</Text>
              {isEditMode ? (
                (key === 'HealthCert' || key === 'NightLicense' || key === 'CleanlinessRating') ? (
                  <View>
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => handleFileUpload(key)}><Text>Change File</Text></TouchableOpacity>
                    {value && <Text style={styles.fileNameText}>Selected: {value}</Text>}
                  </View>
                ) : (
                  <TextInput style={styles.input} value={value} onChangeText={(v) => setPendingProfile({...pendingProfile, [key]: v})} />
                )
              ) : (
                <Text style={styles.valueText}>{profile[key]}</Text>
              )}
            </View>
          ))}
          {isEditMode && <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{fontWeight: 'bold'}}>Save Profile</Text></TouchableOpacity>}
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
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  inputRow: { marginBottom: 15 },
  label: { fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  input: { borderWidth: 1.5, height: 40, paddingHorizontal: 10 },
  valueText: { fontSize: 16, paddingVertical: 8 },
  uploadBtn: { borderWidth: 1.5, padding: 10, alignItems: 'center', backgroundColor: '#f9f9f9' },
  fileNameText: { fontSize: 12, fontStyle: 'italic', marginTop: 5 },
  saveBtn: { borderWidth: 1.5, marginTop: 20, padding: 15, alignItems: 'center' },
  // Sidebar 样式 (与 ResetPassword 完全一致)
  modalContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { width: SCREEN_WIDTH * 0.75, height: '100%', backgroundColor: '#fff', borderRightWidth: 2, paddingTop: Platform.OS === 'ios' ? 40 : 25 },
  sidebarHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  avatarSection: { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1.5, marginBottom: 10 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  avatarName: { fontSize: 12, fontWeight: '500' },
  sidebarItem: { width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1.5, alignItems: 'center' },
  sidebarActiveItem: { backgroundColor: '#A9A9A9' },
  sidebarItemText: { fontSize: 22 },
  sidebarFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, paddingVertical: 12 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 22, marginLeft: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }
});