import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Platform, Dimensions, KeyboardAvoidingView, Alert, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// 🌟 新增：导入 Expo 的真实相册选择器
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

export default function ManageAdvertisingBanner() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [banners, setBanners] = useState([
    { id: '1', title: '20% Off First Order', fileName: 'firstpromo.png', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80' },
    { id: '2', title: 'New Dessert Published', fileName: 'coconutdessert.png', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80' },
    { id: '3', title: 'Buy 1 Free 1 for New User', fileName: 'B1F1noodle.png', imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80' },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('upload');
  const [editingBannerId, setEditingBannerId] = useState(null);
  
  const [editTitle, setEditTitle] = useState('');
  const [editFileName, setEditFileName] = useState('');
  // 🌟 新增：存放真实选中图片的本地路径，用于之后上传数据库
  const [editLocalImageUri, setEditLocalImageUri] = useState(null);

  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure to delete the selected item?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          style: "destructive",
          onPress: () => {
            setBanners(banners.filter(b => b.id !== id));
            Alert.alert("Success", "Banner deleted successfully.");
          }
        }
      ]
    );
  };

  const openUploadModal = () => {
    setModalMode('upload');
    setEditTitle('');
    setEditFileName('');
    setEditLocalImageUri(null);
    setIsModalVisible(true);
  };

  const openReplaceModal = (banner) => {
    setModalMode('replace');
    setEditingBannerId(banner.id);
    setEditTitle(banner.title);
    setEditFileName(banner.fileName);
    setEditLocalImageUri(banner.imageUrl);
    setIsModalVisible(true);
  };

  // ==================== 🌟 核心升级：调用真实手机相册 ====================
  const pickImageFromGallery = async () => {
    // 1. 调起相册，只允许选图片
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // 允许用户裁剪
      aspect: [900, 336],     // 广告图通常是宽屏比例
      quality: 1,
    });

    // 2. 如果用户没有取消选择
    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      const localUri = selectedAsset.uri;
      
      // 提取文件后缀名 (Error Check 第一道防线)
      // 有些安卓手机没带 fileName，所以我们通过 uri 的最后一部分来判断
      const fileNameStr = selectedAsset.fileName || localUri.split('/').pop();
      const fileExtension = fileNameStr.split('.').pop().toLowerCase();

      // 3. 执行真正的 Error Check
      if (!['png', 'jpeg', 'jpg'].includes(fileExtension)) {
        Alert.alert("File Error", "Invalid file type. Please select a .png or .jpeg image.");
        return; // 阻止后续操作
      }

      // 4. 如果格式正确，把数据填入表格
      setEditFileName(fileNameStr);
      setEditLocalImageUri(localUri);
    }
  };
  // ========================================================================

  const handleSaveBanner = () => {
    if (!editTitle || !editFileName) {
      Alert.alert("Validation Error", "Please fill in all fields and select a file.");
      return;
    }

    // 更新或新增逻辑
    if (modalMode === 'replace') {
      setBanners(banners.map(b => b.id === editingBannerId ? 
        { ...b, title: editTitle, fileName: editFileName, imageUrl: editLocalImageUri || b.imageUrl } : b
      ));
      Alert.alert("Success", "Banner replaced and updated in database.");
    } else {
      const newBanner = {
        id: Date.now().toString(),
        title: editTitle,
        fileName: editFileName,
        // 将真实选中的本地图片放进列表展示
        imageUrl: editLocalImageUri 
      };
      setBanners([newBanner, ...banners]);
      Alert.alert("Success", "New banner uploaded to database.");
    }

    setIsModalVisible(false);
  };

  const handleMenuClick = (moduleName) => {
    Alert.alert("Navigation", `Connecting to ${moduleName} module...`);
    setIsSidebarOpen(false);
  };
  const handleLogout = () => {
    Alert.alert("Logout", "You have been logged out successfully.");
    setIsSidebarOpen(false);
  };
  const renderOverlay = () => isSidebarOpen ? <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} /> : null;
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {renderOverlay()}

      {/* ==================== LEFT SIDEBAR ==================== */}
      <View style={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        <View style={styles.userSection}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarHead} /><View style={styles.avatarBody} />
          </View>
          <Text style={styles.username}>Charlene</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Home')}>
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Profile')}>
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Accounts')}>
            <Text style={styles.menuItemText}>Manage Accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Menu & Content')}>
            <Text style={styles.menuItemText}>Manage Menu & Content</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Generate Reports')}>
            <Text style={styles.menuItemText}>Generate Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Configure System Settings')}>
            <Text style={styles.menuItemText}>Configure System Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}>
            <Text style={styles.menuItemText}>Manage Advertising Board</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Process Application Approval')}>
            <Text style={styles.menuItemText}>Process Application Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}>
            <Text style={styles.menuItemText}>Reset Password</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
          <Ionicons name="arrow-forward-outline" size={16} color="#000" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* ==================== TOP HEADER ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Advertising Banner</Text>
        <View style={{ width: 35, marginRight: 15 }} />
      </View>
      <View style={styles.headerDivider} />

      {/* ==================== MAIN CONTENT ==================== */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.subHeaderRow}>
            <Text style={styles.subHeaderTitle}>Active Banners Gallery</Text>
            <TouchableOpacity onPress={openUploadModal}>
              <Text style={styles.uploadNewBtnText}>[ + Upload New]</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dashedDivider} />

          {banners.map((banner) => (
            <View key={banner.id} style={styles.bannerCard}>
              <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} />
              
              <View style={styles.bannerInfoBox}>
                <Text style={styles.bannerInfoText}><Text style={styles.boldText}>File:</Text> {banner.fileName}</Text>
                <Text style={styles.bannerInfoText}><Text style={styles.boldText}>Title:</Text> {banner.title}</Text>
              </View>
              
              <View style={styles.actionBtnRow}>
                <TouchableOpacity style={styles.replaceBtn} onPress={() => openReplaceModal(banner)}>
                  <Text style={styles.replaceBtnText}>Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(banner.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== UPLOAD / REPLACE POP-UP WINDOW ==================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'upload' ? 'Upload New Banner' : 'Replace Banner'}
            </Text>
            
            <Text style={styles.modalLabel}>Banner Title</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editTitle} 
              onChangeText={setEditTitle} 
              placeholder="e.g. 50% Off Special Promo"
            />

            <Text style={styles.modalLabel}>Select Image File (.png / .jpeg)</Text>
            <View style={styles.fileMockRow}>
              {/* 改为不可手动打字的框，强制用户点击 Browse 开相册 */}
              <TextInput 
                style={[styles.modalInput, { flex: 1, marginBottom: 0, color: '#666', backgroundColor: '#f0f0f0' }]} 
                value={editFileName} 
                placeholder="No file chosen"
                editable={false} 
              />
              {/* 🌟 核心：触发打开真实相册 */}
              <TouchableOpacity style={styles.browseBtn} onPress={pickImageFromGallery}>
                <Text style={styles.browseBtnText}>Browse</Text>
              </TouchableOpacity>
            </View>

            {/* 如果用户选了图片，在弹窗里立刻给他们一个预览图，体验更好 */}
            {editLocalImageUri && (
              <Image source={{ uri: editLocalImageUri }} style={styles.previewImage} />
            )}

            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveBanner}>
                <Text style={styles.modalSaveBtnText}>{modalMode === 'upload' ? 'Upload' : 'Update'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35, backgroundColor: '#ffffff', zIndex: 10 },
  hamburgerBtn: { width: 35, height: 30, borderRadius: 4, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4, marginRight: 15 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'center' },
  headerDivider: { height: 2, backgroundColor: '#000', width: '100%' },
  keyboardAvoid: { flex: 1 },

  // Sidebar
  sidebar: { position: 'absolute', top: Platform.OS === 'ios' ? 44 : 40, height: '100%', width: SIDEBAR_WIDTH, backgroundColor: '#ffffff', borderRightWidth: 2, borderColor: '#000000', zIndex: 100 },
  sidebarOpen: { left: 0 },
  sidebarClosed: { left: -SIDEBAR_WIDTH - 10 },
  sidebarHeader: { height: 65, justifyContent: 'center', paddingLeft: 15, paddingTop: Platform.OS === 'ios' ? 0 : 20 },
  userSection: { alignItems: 'center', paddingVertical: 15 },
  avatarCircle: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 5 },
  avatarHead: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#000', marginTop: 4 },
  avatarBody: { width: 34, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginBottom: -8 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  menuList: { flex: 1 },
  menuItem: { width: '100%', paddingVertical: 12, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#fff' },
  menuItemText: { fontSize: 14, fontWeight: 'bold', textAlign: 'left', color: '#000', paddingLeft: 30 },
  logoutBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingBottom: Platform.OS === 'ios' ? 20 : 15, borderTopWidth: 2, borderColor: '#0f100f', backgroundColor: '#fff', marginBottom: Platform.OS === 'ios' ? 10 : 5 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#070707', marginLeft: 8 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 90 },

  // Content
  scrollContent: { paddingTop: 10, paddingBottom: 40, paddingHorizontal: 16 },
  subHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  subHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  uploadNewBtnText: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  dashedDivider: { borderBottomWidth: 1.5, borderColor: '#a0a0a0', borderStyle: 'dashed', marginVertical: 10 },

  bannerCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#a0a0a0', padding: 12, marginBottom: 15, borderRadius: 2 },
  bannerImage: { width: '100%', aspectRatio: 900 / 336, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ccc', resizeMode: 'cover'},
  bannerInfoBox: { marginBottom: 12 },
  bannerInfoText: { fontSize: 14, color: '#000', marginBottom: 2 },
  boldText: { fontWeight: 'bold' },

  actionBtnRow: { flexDirection: 'row' },
  replaceBtn: { backgroundColor: '#1a1a1a', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 4, marginRight: 10 },
  replaceBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#a8a59e', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 4 },
  deleteBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: SCREEN_WIDTH * 0.85, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000' },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 5, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, height: 40, paddingHorizontal: 10, fontSize: 14, backgroundColor: '#fafafa', marginBottom: 10 },
  
  fileMockRow: { flexDirection: 'row', alignItems: 'center' },
  browseBtn: { backgroundColor: '#000', height: 40, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 4, marginLeft: 8 },
  browseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  // 🌟 新增：选中图片后的微型预览图样式
  previewImage: { width: '100%', aspectRatio: 900 / 336, borderRadius: 6, marginTop: 10, borderWidth: 1, borderColor: '#ccc', resizeMode: 'cover' },

  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 10 },
  modalCancelBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalSaveBtn: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});