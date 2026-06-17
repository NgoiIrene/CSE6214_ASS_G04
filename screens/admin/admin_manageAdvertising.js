import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Platform, Dimensions, KeyboardAvoidingView, Alert, Modal, Image
} from 'react-native';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// 🌟 新增：导入 Expo 的真实相册选择器
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ManageAdvertisingBanner() {
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

  const pickImageFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, 
      aspect: [900, 336],    
      quality: 1,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      const localUri = selectedAsset.uri;
      
      const fileNameStr = selectedAsset.fileName || localUri.split('/').pop();
      const fileExtension = fileNameStr.split('.').pop().toLowerCase();

      if (!['png', 'jpeg', 'jpg'].includes(fileExtension)) {
        Alert.alert("File Error", "Invalid file type. Please select a .png or .jpeg image.");
        return; 
      }

      setEditFileName(fileNameStr);
      setEditLocalImageUri(localUri);
    }
  };

  const handleSaveBanner = () => {
    if (!editTitle || !editFileName) {
      Alert.alert("Validation Error", "Please fill in all fields and select a file.");
      return;
    }

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
        imageUrl: editLocalImageUri 
      };
      setBanners([newBanner, ...banners]);
      Alert.alert("Success", "New banner uploaded to database.");
    }

    setIsModalVisible(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* 确保只返回 ScrollView 的主要内容 */}
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

        {/* 弹窗放置在 ScrollView 内部或底部 */}
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
                <TextInput 
                  style={[styles.modalInput, { flex: 1, marginBottom: 0, color: '#666', backgroundColor: '#f0f0f0' }]} 
                  value={editFileName} 
                  placeholder="No file chosen"
                  editable={false} 
                />
                <TouchableOpacity style={styles.browseBtn} onPress={pickImageFromGallery}>
                  <Text style={styles.browseBtnText}>Browse</Text>
                </TouchableOpacity>
              </View>

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

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: '#ffffff' },

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
  
  previewImage: { width: '100%', aspectRatio: 900 / 336, borderRadius: 6, marginTop: 10, borderWidth: 1, borderColor: '#ccc', resizeMode: 'cover' },

  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 10 },
  modalCancelBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalSaveBtn: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});