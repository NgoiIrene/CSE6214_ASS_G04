import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Platform, Dimensions, KeyboardAvoidingView, Alert, Modal, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabaseClient'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ManageAdvertisingBanner() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('upload');
  const [editingBannerId, setEditingBannerId] = useState(null);
  
  const [editTitle, setEditTitle] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [editLocalImageUri, setEditLocalImageUri] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('advertising_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      Alert.alert("Error fetching banners", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id, imageUrl) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this banner?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              const filePathMatch = imageUrl.match(/banners\/(.+)$/);
              if (filePathMatch && filePathMatch[1]) {
                const filePath = filePathMatch[1];
                await supabase.storage.from('banners').remove([filePath]);
              }
              const { error } = await supabase.from('advertising_banners').delete().eq('id', id);
              if (error) throw error;

              Alert.alert("Success", "Banner deleted successfully.");
              fetchBanners();
            } catch (error) {
              Alert.alert("Delete Failed", error.message);
            } finally {
              setIsProcessing(false);
            }
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
    setEditFileName(banner.file_name);
    setEditLocalImageUri(banner.image_url);
    setIsModalVisible(true);
  };

  const pickImageFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [900, 336],    
      quality: 0.8, 
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      const localUri = selectedAsset.uri;
      
      const fileNameStr = selectedAsset.fileName || localUri.split('/').pop();
      setEditFileName(fileNameStr);
      setEditLocalImageUri(localUri);
    }
  };

  // 🌟 This is the stable upload function using FormData
  const handleSaveBanner = async () => {
    if (!editTitle || !editFileName || !editLocalImageUri) {
      Alert.alert("Validation Error", "Please fill in all fields and select a file.");
      return;
    }

    try {
      setIsProcessing(true);
      let finalImageUrl = editLocalImageUri;

      if (editLocalImageUri.startsWith('file://')) {
        const fileExt = editFileName.split('.').pop().toLowerCase();
        const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
        const uniqueFileName = `${Date.now()}_${editFileName}`;

        const formData = new FormData();
        formData.append('file', {
          uri: editLocalImageUri,
          name: uniqueFileName,
          type: mimeType,
        });

        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(uniqueFileName, formData);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('banners')
          .getPublicUrl(uniqueFileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      if (modalMode === 'upload') {
        const { error } = await supabase.from('advertising_banners').insert({
          title: editTitle,
          file_name: editFileName,
          image_url: finalImageUrl
        });
        if (error) throw error;
        Alert.alert("Success", "New banner uploaded successfully.");
      } else {
        const { error } = await supabase.from('advertising_banners').update({
          title: editTitle,
          file_name: editFileName,
          image_url: finalImageUrl
        }).eq('id', editingBannerId);
        if (error) throw error;
        Alert.alert("Success", "Banner updated successfully.");
      }

      setIsModalVisible(false);
      fetchBanners(); 
    } catch (error) {
      Alert.alert("Save Failed", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
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

        {banners.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="images-outline" size={50} color="#ccc" />
            <Text style={{ marginTop: 10, color: '#888' }}>No banners found. Upload one!</Text>
          </View>
        ) : (
          banners.map((banner) => (
            <View key={banner.id} style={styles.bannerCard}>
              <Image source={{ uri: banner.image_url }} style={styles.bannerImage} />
              
              <View style={styles.bannerInfoBox}>
                <Text style={styles.bannerInfoText}><Text style={styles.boldText}>File:</Text> {banner.file_name}</Text>
                <Text style={styles.bannerInfoText}><Text style={styles.boldText}>Title:</Text> {banner.title}</Text>
              </View>
              
              <View style={styles.actionBtnRow}>
                <TouchableOpacity style={styles.replaceBtn} onPress={() => openReplaceModal(banner)}>
                  <Text style={styles.replaceBtnText}>Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(banner.id, banner.image_url)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

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
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)} disabled={isProcessing}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveBanner} disabled={isProcessing}>
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>{modalMode === 'upload' ? 'Upload' : 'Update'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: '#ffffff' },
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