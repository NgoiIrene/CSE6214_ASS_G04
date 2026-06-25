import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Platform, Dimensions, KeyboardAvoidingView, Alert, Modal, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient'; // 确保路径正确

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ManageMenuContent() {
  const [mainCategory, setMainCategory] = useState('menu'); 
  const [isMainDropdownOpen, setIsMainDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ==================== Menu 专属状态 ====================
  const [vendorFilter, setVendorFilter] = useState('All');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [dynamicVendors, setDynamicVendors] = useState(['All']); 
  
  const [menuItems, setMenuItems] = useState([]);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ==================== Review 专属状态 (Mock Data) ====================
  const [searchReviewQuery, setSearchReviewQuery] = useState('');
  const [reviews, setReviews] = useState([
    { id: 'r1', userAccount: 'ali_123', vendor: 'Vendor A', rating: 5, date: '2026-06-10', comment: 'The food is very delicious and hot!' },
    { id: 'r2', userAccount: 'angry_bird', vendor: 'Vendor B', rating: 1, date: '2026-06-11', comment: 'Stupid food! Taste like rubbish! 🤬' }, 
  ]);

  // ==================== 核心数据库逻辑 ====================

  useEffect(() => {
    if (mainCategory === 'menu') {
      fetchMenuItems();
    }
  }, [mainCategory]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      // 🌟 修复 1：利用 Foreign Key 拿商家名字
      // 注意：如果你的 profile 表名没有 s (就叫 profile)，请把下面的 profiles 改成 profile
      const { data, error } = await supabase
        .from('food_items') // 使用你提供的表名 food_item
        .select(`
          id, vendor_id, name, price, stock, desc, image_url, created_at,
          profiles ( full_name ) 
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMenuItems(data || []);

      // 智能提取商家名字放入 Filter 列表
      const vendors = ['All'];
      data?.forEach(item => {
        // 兼容 profiles 或 profile 两种表名写法
        const vendorName = item.profiles?.full_name || item.profile?.full_name || 'Vendor ' + String(item.vendor_id).substring(0,4);
        if (!vendors.includes(vendorName)) {
          vendors.push(vendorName);
        }
      });
      setDynamicVendors(vendors);

    } catch (error) {
      console.log("Fetch Error: ", error.message);
      // Alert.alert("Error fetching menu", error.message); // 如果报错，会把真正的错误原因打印在 Console
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMenu = async () => {
    if (!editingItem.name || !editingItem.price) {
      Alert.alert("Validation Error", "Item name and price cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('food_items')
        .update({
          name: editingItem.name,
          desc: editingItem.desc, 
          price: parseFloat(editingItem.price) || 0,
          stock: parseInt(editingItem.stock) || 0 
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      Alert.alert("Success", "Menu item updated successfully.");
      setIsEditModalVisible(false);
      fetchMenuItems(); 
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMenu = (id, name) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setIsLoading(true);
          try {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
            
            Alert.alert("Deleted", "Item has been removed.");
            fetchMenuItems(); 
          } catch (error) {
            Alert.alert("Delete Failed", error.message);
          } finally {
            setIsLoading(false);
          }
      }}
    ]);
  };

  const openEditModal = (item) => {
    setEditingItem({ 
      ...item, 
      price: String(item.price), 
      stock: String(item.stock || 0)
    }); 
    setIsEditModalVisible(true);
  };

  const filteredMenu = menuItems.filter(item => {
    const vName = item.profiles?.full_name || item.profile?.full_name || 'Vendor ' + String(item.vendor_id).substring(0,4);
    return vendorFilter === 'All' ? true : vName === vendorFilter;
  });

  const filteredReviews = reviews.filter(review => 
    review.userAccount.toLowerCase().includes(searchReviewQuery.toLowerCase())
  );

  const handleDeleteReview = (id, userAccount) => {
    Alert.alert("Moderate Comment", `Delete review by ${userAccount}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Review", style: "destructive", onPress: () => {
          setReviews(reviews.filter(review => review.id !== id));
      }}
    ]);
  };

  // 🌟 修复 2：智能图片检测函数
  const getValidImageUrl = (url) => {
    // 如果 url 存在，并且是以 http 开头，就是有效链接。否则给一张好看的美食占位图。
    if (url && typeof url === 'string' && url.startsWith('http')) {
      return url;
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'; // 漂亮的默认美食图
  };

  return (
    <>
      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.filterSection, { zIndex: 20 }]}>
            <Text style={styles.boldLabel}>Select Management Category:</Text>
            <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsMainDropdownOpen(!isMainDropdownOpen)}>
              <Text style={styles.dropdownText}>{mainCategory === 'menu' ? '🍔 Vendor Menus' : '⭐ User Reviews'}</Text>
              <Ionicons name={isMainDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
            </TouchableOpacity>
            {isMainDropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMainCategory('menu'); setIsMainDropdownOpen(false); }}>
                  <Text style={styles.dropdownText}>🍔 Vendor Menus</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMainCategory('review'); setIsMainDropdownOpen(false); }}>
                  <Text style={styles.dropdownText}>⭐ User Reviews</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.dashedDivider} />

          {isLoading && mainCategory === 'menu' && (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
          )}

          {/* ==================== VENDOR MENU ==================== */}
          {!isLoading && mainCategory === 'menu' && (
            <View>
              <View style={[styles.filterSection, { zIndex: 10 }]}>
                <Text style={styles.boldLabel}>Filter By Vendor:</Text>
                <TouchableOpacity style={[styles.dropdownBox, { width: 200 }]} onPress={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}>
                  <Text style={styles.dropdownText} numberOfLines={1}>{vendorFilter}</Text>
                  <Ionicons name={isVendorDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
                </TouchableOpacity>
                {isVendorDropdownOpen && (
                  <View style={[styles.dropdownList, { width: 200 }]}>
                    {dynamicVendors.map((v) => (
                      <TouchableOpacity key={v} style={styles.dropdownItem} onPress={() => { setVendorFilter(v); setIsVendorDropdownOpen(false); }}>
                        <Text style={styles.dropdownText}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.sectionSubTitle}>Total Menu Items: {filteredMenu.length}</Text>

              {filteredMenu.map(item => (
                <View key={item.id} style={styles.menuCard}>
                  {/* 🌟 采用智能检测，确保图片不管怎样都不会导致手机报错 */}
                  <Image 
                    source={{ uri: getValidImageUrl(item.image_url) }} 
                    style={styles.menuImage} 
                  />
                  <View style={styles.menuInfo}>
                    <View style={styles.tagBadge}>
                      {/* 🌟 完美显示商家的名字 */}
                      <Text style={styles.tagText}>{item.profiles?.full_name || item.profile?.full_name || 'Vendor ' + String(item.vendor_id).substring(0,4)}</Text>
                    </View>
                    
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    
                    <Text style={styles.menuItemDesc} numberOfLines={2}>
                      {item.desc || 'No description provided.'}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={styles.menuItemPrice}>RM {parseFloat(item.price || 0).toFixed(2)}</Text>
                      <Text style={[styles.menuItemStock, { color: item.stock > 0 ? '#2E7D32' : '#C62828' }]}>
                        Stock: {item.stock}
                      </Text>
                    </View>
                    
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteMenu(item.id, item.name)}>
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ==================== USER REVIEW ==================== */}
          {mainCategory === 'review' && (
            <View>
              <Text style={styles.boldLabel}>Search User Review:</Text>
              <View style={styles.searchBoxContainer}>
                <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Enter User Account..."
                  value={searchReviewQuery}
                  onChangeText={setSearchReviewQuery}
                />
              </View>
              <Text style={styles.sectionSubTitle}>Total Reviews Found: {filteredReviews.length}</Text>

              {filteredReviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>👤 {review.userAccount}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  <Text style={styles.reviewComment}>"{review.comment}"</Text>
                  <TouchableOpacity style={styles.deleteReviewBtn} onPress={() => handleDeleteReview(review.id, review.userAccount)}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.deleteReviewText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== EDIT MODAL ==================== */}
      <Modal animationType="fade" transparent={true} visible={isEditModalVisible} onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Menu Item</Text>
              
              {editingItem && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                  <Text style={styles.modalLabel}>Item Name</Text>
                  <TextInput style={styles.modalInput} value={editingItem.name} onChangeText={(text) => setEditingItem({...editingItem, name: text})} />

                  <Text style={styles.modalLabel}>Description</Text>
                  <TextInput 
                    style={[styles.modalInput, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]} 
                    multiline={true}
                    value={editingItem.desc} 
                    onChangeText={(text) => setEditingItem({...editingItem, desc: text})} 
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.modalLabel}>Price (RM)</Text>
                      <TextInput style={styles.modalInput} keyboardType="numeric" value={editingItem.price} onChangeText={(text) => setEditingItem({...editingItem, price: text})} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Stock Qty</Text>
                      <TextInput style={styles.modalInput} keyboardType="numeric" value={editingItem.stock} onChangeText={(text) => setEditingItem({...editingItem, stock: text})} />
                    </View>
                  </View>
                </ScrollView>
              )}

              <View style={styles.modalBtnGroup}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditModalVisible(false)} disabled={isLoading}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMenu} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </>
  );
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { paddingTop: 15, paddingBottom: 40, paddingHorizontal: 16 },
  boldLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  dashedDivider: { borderBottomWidth: 1.5, borderColor: '#a0a0a0', borderStyle: 'dashed', marginVertical: 15 },
  sectionSubTitle: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 10, textTransform: 'uppercase' },

  filterSection: { marginBottom: 5, position: 'relative' },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#000', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  dropdownText: { fontSize: 15, color: '#000', fontWeight: 'bold' },
  dropdownList: { borderWidth: 2, borderColor: '#000', borderRadius: 6, marginTop: 4, backgroundColor: '#fff', position: 'absolute', top: 70, width: '100%', zIndex: 99, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },

  menuCard: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 2, borderColor: '#a0a0a0', borderRadius: 8, padding: 12, marginBottom: 15 },
  menuImage: { width: 90, height: 90, borderRadius: 6, borderWidth: 1, borderColor: '#000', marginRight: 15, backgroundColor: '#f0f0f0', resizeMode: 'cover' },
  menuInfo: { flex: 1, justifyContent: 'center' },
  tagBadge: { alignSelf: 'flex-start', backgroundColor: '#000', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginBottom: 6 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  menuItemName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  menuItemDesc: { fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 6, lineHeight: 16 },
  menuItemPrice: { fontSize: 15, color: '#000', fontWeight: 'bold' },
  menuItemStock: { fontSize: 13, fontWeight: 'bold' },
  
  actionBtnRow: { flexDirection: 'row' },
  editBtn: { backgroundColor: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 4, marginRight: 10 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#C62828', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4 },
  deleteBtnText: { color: '#C62828', fontSize: 13, fontWeight: 'bold' },

  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#000', borderRadius: 6, paddingHorizontal: 10, height: 45, backgroundColor: '#fff', marginBottom: 15 },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
  reviewCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', borderRadius: 8, padding: 15, marginBottom: 15 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  reviewerName: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  reviewDate: { fontSize: 12, color: '#666' },
  reviewComment: { fontSize: 14, color: '#000', marginTop: 8, fontStyle: 'italic', marginBottom: 15 },
  deleteReviewBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#C62828', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, borderWidth: 2, borderColor: '#000' },
  deleteReviewText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: SCREEN_WIDTH * 0.85, backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#000', padding: 20, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000', borderBottomWidth: 2, paddingBottom: 10 },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 6, marginTop: 10 },
  modalInput: { borderWidth: 2, borderColor: '#000', borderRadius: 4, height: 42, paddingHorizontal: 10, fontSize: 14, backgroundColor: '#fff' },
  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalCancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 10, backgroundColor: '#fff' },
  modalCancelBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalSaveBtn: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});