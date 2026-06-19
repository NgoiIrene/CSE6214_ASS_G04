// import React, { useState } from 'react';
// import { 
//   StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
//   Platform, Dimensions, KeyboardAvoidingView, Alert, Modal, Image
// } from 'react-native';
// //import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// export default function ManageMenuContent() {
//   // ==================== 1. 基础页面状态 ====================
//   // 主分类筛选: 'menu' (看商家菜单) 或 'review' (看用户评论)
//   const [mainCategory, setMainCategory] = useState('menu'); 
//   const [isMainDropdownOpen, setIsMainDropdownOpen] = useState(false);

//   // ==================== 2. Menu 专属状态与 Mock Data ====================
//   const [vendorFilter, setVendorFilter] = useState('All');
//   const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  
//   const [menuItems, setMenuItems] = useState([
//     { id: '1', vendor: 'Vendor A', name: 'Nasi Lemak Ayam Goreng', price: '8.50', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?w=400&q=80' },
//     { id: '2', vendor: 'Vendor B', name: 'Signature Beef Burger', price: '12.00', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
//     { id: '3', vendor: 'Vendor A', name: 'Milo Ais', price: '3.00', status: 'Sold Out', imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
//     { id: '4', vendor: 'Vendor C', name: 'Chicken Chop', price: '15.90', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80' },
//   ]);

//   // Edit Modal 状态
//   const [isEditModalVisible, setIsEditModalVisible] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);

//   // ==================== 3. Review 专属状态与 Mock Data ====================
//   const [searchReviewQuery, setSearchReviewQuery] = useState('');
  
//   const [reviews, setReviews] = useState([
//     { id: 'r1', userAccount: 'ali_123', vendor: 'Vendor A', rating: 5, date: '2026-06-10', comment: 'The food is very delicious and hot!' },
//     { id: 'r2', userAccount: 'angry_bird', vendor: 'Vendor B', rating: 1, date: '2026-06-11', comment: 'Stupid food! Taste like rubbish! 🤬' }, 
//     { id: 'r3', userAccount: 'jason_wong', vendor: 'Vendor C', rating: 4, date: '2026-06-12', comment: 'Good portion, but delivery was a bit slow.' },
//     { id: 'r4', userAccount: 'sweet_girl', vendor: 'Vendor A', rating: 5, date: '2026-06-13', comment: 'Best Nasi Lemak in campus!' },
//   ]);

//   // ==================== 4. 核心业务逻辑 ====================

//   // --- Menu 逻辑 ---
//   const filteredMenu = menuItems.filter(item => 
//     vendorFilter === 'All' ? true : item.vendor === vendorFilter
//   );

//   const openEditModal = (item) => {
//     setEditingItem({ ...item }); 
//     setIsEditModalVisible(true);
//   };

//   const handleSaveMenu = () => {
//     if (!editingItem.name || !editingItem.price) {
//       Alert.alert("Validation Error", "Item name and price cannot be empty.");
//       return;
//     }
//     setMenuItems(menuItems.map(item => item.id === editingItem.id ? editingItem : item));
//     setIsEditModalVisible(false);
//     Alert.alert("Success", "Menu item updated successfully in the database.");
//   };

//   const handleDeleteMenu = (id, name) => {
//     Alert.alert("Confirm Delete", `Are you sure you want to delete "${name}"? This action cannot be undone.`, [
//       { text: "Cancel", style: "cancel" },
//       { text: "Delete", style: "destructive", onPress: () => {
//           setMenuItems(menuItems.filter(item => item.id !== id));
//           Alert.alert("Deleted", "Item has been removed from database and UI.");
//       }}
//     ]);
//   };

//   // --- Review 逻辑 ---
//   const filteredReviews = reviews.filter(review => 
//     review.userAccount.toLowerCase().includes(searchReviewQuery.toLowerCase())
//   );

//   const handleDeleteReview = (id, userAccount) => {
//     Alert.alert("Moderate Comment", `Delete review by ${userAccount}?`, [
//       { text: "Cancel", style: "cancel" },
//       { text: "Delete Review", style: "destructive", onPress: () => {
//           setReviews(reviews.filter(review => review.id !== id));
//           Alert.alert("Review Removed", "The rude/dirty comment has been deleted from the database.");
//       }}
//     ]);
//   };

//   // ==================== 渲染页面 ====================
//   return (
//     <>
//       {/* ==================== MAIN CONTENT ==================== */}
//       <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === "ios" ? "padding" : "height"}>
//         <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
//           {/* 🌟 Master Filter: Menu vs Reviews */}
//           <View style={[styles.filterSection, { zIndex: 20 }]}>
//             <Text style={styles.boldLabel}>Select Management Category:</Text>
//             <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsMainDropdownOpen(!isMainDropdownOpen)}>
//               <Text style={styles.dropdownText}>{mainCategory === 'menu' ? '🍔 Vendor Menus' : '⭐ User Reviews'}</Text>
//               <Ionicons name={isMainDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
//             </TouchableOpacity>
//             {isMainDropdownOpen && (
//               <View style={styles.dropdownList}>
//                 <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMainCategory('menu'); setIsMainDropdownOpen(false); }}>
//                   <Text style={styles.dropdownText}>🍔 Vendor Menus</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMainCategory('review'); setIsMainDropdownOpen(false); }}>
//                   <Text style={styles.dropdownText}>⭐ User Reviews</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>
          
//           <View style={styles.dashedDivider} />

//           {/* ==================== VIEW 1: VENDOR MENU MANAGEMENT ==================== */}
//           {mainCategory === 'menu' && (
//             <View>
//               {/* Secondary Filter: Select Vendor */}
//               <View style={[styles.filterSection, { zIndex: 10 }]}>
//                 <Text style={styles.boldLabel}>Filter By Vendor:</Text>
//                 <TouchableOpacity style={[styles.dropdownBox, { width: 180 }]} onPress={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}>
//                   <Text style={styles.dropdownText}>{vendorFilter}</Text>
//                   <Ionicons name={isVendorDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
//                 </TouchableOpacity>
//                 {isVendorDropdownOpen && (
//                   <View style={[styles.dropdownList, { width: 180 }]}>
//                     {['All', 'Vendor A', 'Vendor B', 'Vendor C'].map((v) => (
//                       <TouchableOpacity key={v} style={styles.dropdownItem} onPress={() => { setVendorFilter(v); setIsVendorDropdownOpen(false); }}>
//                         <Text style={styles.dropdownText}>{v}</Text>
//                       </TouchableOpacity>
//                     ))}
//                   </View>
//                 )}
//               </View>

//               <Text style={styles.sectionSubTitle}>Total Menu Items: {filteredMenu.length}</Text>

//               {/* Menu List */}
//               {filteredMenu.map(item => (
//                 <View key={item.id} style={styles.menuCard}>
//                   <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
//                   <View style={styles.menuInfo}>
//                     <View style={styles.tagBadge}><Text style={styles.tagText}>{item.vendor}</Text></View>
//                     <Text style={styles.menuItemName}>{item.name}</Text>
//                     <Text style={styles.menuItemPrice}>RM {item.price}</Text>
                    
//                     <View style={styles.actionBtnRow}>
//                       <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
//                         <Text style={styles.editBtnText}>Edit</Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteMenu(item.id, item.name)}>
//                         <Text style={styles.deleteBtnText}>Delete</Text>
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* ==================== VIEW 2: USER REVIEW MANAGEMENT ==================== */}
//           {mainCategory === 'review' && (
//             <View>
//               <Text style={styles.boldLabel}>Search User Review:</Text>
//               <View style={styles.searchBoxContainer}>
//                 <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
//                 <TextInput 
//                   style={styles.searchInput}
//                   placeholder="Enter User Account (e.g. ali_123)"
//                   value={searchReviewQuery}
//                   onChangeText={setSearchReviewQuery}
//                 />
//               </View>

//               <Text style={styles.sectionSubTitle}>Total Reviews Found: {filteredReviews.length}</Text>

//               {/* Review List */}
//               {filteredReviews.map(review => (
//                 <View key={review.id} style={styles.reviewCard}>
//                   <View style={styles.reviewHeader}>
//                     <Text style={styles.reviewerName}>👤 {review.userAccount}</Text>
//                     <Text style={styles.reviewDate}>{review.date}</Text>
//                   </View>
                  
//                   <View style={{ flexDirection: 'row', marginBottom: 5 }}>
//                     {[...Array(review.rating)].map((_, i) => <Ionicons key={i} name="star" size={14} color="#FFC107" />)}
//                     {[...Array(5 - review.rating)].map((_, i) => <Ionicons key={i} name="star-outline" size={14} color="#a0a0a0" />)}
//                     <Text style={styles.reviewVendorTag}> @ {review.vendor}</Text>
//                   </View>

//                   <Text style={styles.reviewComment}>"{review.comment}"</Text>

//                   {/* 删除评论按钮 (用于清理脏话或违规内容) */}
//                   <TouchableOpacity style={styles.deleteReviewBtn} onPress={() => handleDeleteReview(review.id, review.userAccount)}>
//                     <Ionicons name="trash-outline" size={16} color="#fff" />
//                     <Text style={styles.deleteReviewText}>Remove Review</Text>
//                   </TouchableOpacity>
//                 </View>
//               ))}
//             </View>
//           )}

//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* ==================== EDIT MENU POP-UP WINDOW (Modal) ==================== */}
//       <Modal animationType="fade" transparent={true} visible={isEditModalVisible} onRequestClose={() => setIsEditModalVisible(false)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Edit Menu Item</Text>
            
//             {editingItem && (
//               <>
//                 <Text style={styles.modalLabel}>Item Name</Text>
//                 <TextInput 
//                   style={styles.modalInput} 
//                   value={editingItem.name} 
//                   onChangeText={(text) => setEditingItem({...editingItem, name: text})} 
//                 />

//                 <Text style={styles.modalLabel}>Price (RM)</Text>
//                 <TextInput 
//                   style={styles.modalInput} 
//                   keyboardType="numeric"
//                   value={editingItem.price} 
//                   onChangeText={(text) => setEditingItem({...editingItem, price: text})} 
//                 />

//                 <Text style={styles.modalLabel}>Status</Text>
//                 <TouchableOpacity 
//                   style={[styles.modalInput, { justifyContent: 'center', backgroundColor: editingItem.status === 'Available' ? '#e8f5e9' : '#ffebee' }]}
//                   onPress={() => setEditingItem({...editingItem, status: editingItem.status === 'Available' ? 'Sold Out' : 'Available'})}
//                 >
//                   <Text style={{ fontWeight: 'bold', color: editingItem.status === 'Available' ? '#2E7D32' : '#C62828' }}>
//                     {editingItem.status === 'Available' ? '🟢 Available' : '🔴 Sold Out (Tap to change)'}
//                   </Text>
//                 </TouchableOpacity>
//               </>
//             )}

//             <View style={styles.modalBtnGroup}>
//               <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditModalVisible(false)}>
//                 <Text style={styles.modalCancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMenu}>
//                 <Text style={styles.modalSaveBtnText}>Save</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//     </>
//   );
// }

// // ==================== 🎨 STYLESHEET ====================
// const styles = StyleSheet.create({
//   keyboardAvoid: { flex: 1, backgroundColor: '#ffffff' },
  
//   // Content General
//   scrollContent: { paddingTop: 15, paddingBottom: 40, paddingHorizontal: 16 },
//   boldLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 5 },
//   dashedDivider: { borderBottomWidth: 1.5, borderColor: '#a0a0a0', borderStyle: 'dashed', marginVertical: 15 },
//   sectionSubTitle: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 10, textTransform: 'uppercase' },

//   // Dropdowns
//   filterSection: { marginBottom: 5, position: 'relative' },
//   dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#000', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
//   dropdownText: { fontSize: 15, color: '#000', fontWeight: 'bold' },
//   dropdownList: { borderWidth: 2, borderColor: '#000', borderRadius: 6, marginTop: 4, backgroundColor: '#fff', position: 'absolute', top: 70, width: '100%', zIndex: 99, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 },
//   dropdownItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },

//   // --- Menu View Styles ---
//   menuCard: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 2, borderColor: '#a0a0a0', borderRadius: 8, padding: 12, marginBottom: 15 },
//   menuImage: { width: 90, height: 90, borderRadius: 6, borderWidth: 1, borderColor: '#000', marginRight: 15 },
//   menuInfo: { flex: 1, justifyContent: 'center' },
//   tagBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e0e0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
//   tagText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
//   menuItemName: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 2 },
//   menuItemPrice: { fontSize: 14, color: '#2E7D32', fontWeight: 'bold', marginBottom: 10 },
  
//   actionBtnRow: { flexDirection: 'row' },
//   editBtn: { backgroundColor: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 4, marginRight: 10 },
//   editBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
//   deleteBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#C62828', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4 },
//   deleteBtnText: { color: '#C62828', fontSize: 13, fontWeight: 'bold' },

//   // --- Review View Styles ---
//   searchBoxContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#000', borderRadius: 6, paddingHorizontal: 10, height: 45, backgroundColor: '#fff', marginBottom: 15 },
//   searchInput: { flex: 1, fontSize: 14, color: '#000' },
  
//   reviewCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', borderRadius: 8, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
//   reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
//   reviewerName: { fontSize: 14, fontWeight: 'bold', color: '#000' },
//   reviewDate: { fontSize: 12, color: '#666' },
//   reviewVendorTag: { fontSize: 12, fontWeight: 'bold', color: '#666', marginLeft: 8 },
//   reviewComment: { fontSize: 14, color: '#000', marginTop: 8, fontStyle: 'italic', marginBottom: 15 },
  
//   deleteReviewBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#C62828', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, borderWidth: 2, borderColor: '#000' },
//   deleteReviewText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },

//   // --- Modal Styles ---
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
//   modalContent: { width: SCREEN_WIDTH * 0.85, backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#000', padding: 20, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 },
//   modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000', borderBottomWidth: 2, paddingBottom: 10 },
//   modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 6, marginTop: 10 },
//   modalInput: { borderWidth: 2, borderColor: '#000', borderRadius: 4, height: 42, paddingHorizontal: 10, fontSize: 14, backgroundColor: '#fff' },
//   modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
//   modalCancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 10, backgroundColor: '#fff' },
//   modalCancelBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
//   modalSaveBtn: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
//   modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
// });


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

  // ==================== Menu 专属状态 (连接真实 Database) ====================
  const [vendorFilter, setVendorFilter] = useState('All');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [dynamicVendors, setDynamicVendors] = useState(['All']); // 动态生成的商家列表
  
  const [menuItems, setMenuItems] = useState([]);
  
  // Edit Modal 状态
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ==================== Review 专属状态 (保留 Mock Data) ====================
  const [searchReviewQuery, setSearchReviewQuery] = useState('');
  const [reviews, setReviews] = useState([
    { id: 'r1', userAccount: 'ali_123', vendor: 'Vendor A', rating: 5, date: '2026-06-10', comment: 'The food is very delicious and hot!' },
    { id: 'r2', userAccount: 'angry_bird', vendor: 'Vendor B', rating: 1, date: '2026-06-11', comment: 'Stupid food! Taste like rubbish! 🤬' }, 
    { id: 'r3', userAccount: 'jason_wong', vendor: 'Vendor C', rating: 4, date: '2026-06-12', comment: 'Good portion, but delivery was a bit slow.' },
  ]);

  // ==================== 核心数据库逻辑 (Supabase) ====================

  // 页面加载或切换到 'menu' 时抓取数据
  useEffect(() => {
    if (mainCategory === 'menu') {
      fetchMenuItems();
    }
  }, [mainCategory]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      // 抓取 food_items，并尝试通过 vendor_id 关联 profiles 表拿商家名字
      const { data, error } = await supabase
        .from('food_items')
        .select('id, vendor_id, name, price, stock, desc, image_url, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMenuItems(data || []);

      // 智能提取：把有发布过菜品的 Vendor 名字提取出来，放进筛选下拉菜单里
      const vendors = ['All'];
      data?.forEach(item => {
        const vendorName = item.profiles?.full_name || item.vendor_id || 'Unknown Vendor';
        if (!vendors.includes(vendorName)) {
          vendors.push(vendorName);
        }
      });
      setDynamicVendors(vendors);

    } catch (error) {
      console.log("Fetch Error: ", error.message);
      Alert.alert("Error fetching menu", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存修改到 Database
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
          desc: editingItem.desc, // 🌟 存入修改后的 Description
          price: parseFloat(editingItem.price) || 0,
          stock: parseInt(editingItem.stock) || 0 // 🌟 存入修改后的 Stock
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      Alert.alert("Success", "Menu item updated successfully in the database.");
      setIsEditModalVisible(false);
      fetchMenuItems(); // 刷新列表，显示最新数据
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 从 Database 删除菜品
  const handleDeleteMenu = (id, name) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete "${name}"? This action cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setIsLoading(true);
          try {
            const { error } = await supabase.from('food_items').delete().eq('id', id);
            if (error) throw error;
            
            Alert.alert("Deleted", "Item has been removed from database.");
            fetchMenuItems(); // 刷新列表
          } catch (error) {
            Alert.alert("Delete Failed", error.message);
          } finally {
            setIsLoading(false);
          }
      }}
    ]);
  };

  const openEditModal = (item) => {
    // 把当前菜品的数据丢进弹窗里准备修改
    setEditingItem({ 
      ...item, 
      price: String(item.price), // 转成字符串方便 TextInput 修改
      stock: String(item.stock || 0)
    }); 
    setIsEditModalVisible(true);
  };

  // Menu 筛选逻辑
  const filteredMenu = menuItems.filter(item => {
    const vName = item.profiles?.full_name || item.vendor_id || 'Unknown Vendor';
    return vendorFilter === 'All' ? true : vName === vendorFilter;
  });

  // Review 筛选逻辑
  const filteredReviews = reviews.filter(review => 
    review.userAccount.toLowerCase().includes(searchReviewQuery.toLowerCase())
  );

  const handleDeleteReview = (id, userAccount) => {
    Alert.alert("Moderate Comment", `Delete review by ${userAccount}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Review", style: "destructive", onPress: () => {
          setReviews(reviews.filter(review => review.id !== id));
          Alert.alert("Review Removed", "The rude/dirty comment has been deleted.");
      }}
    ]);
  };

  // ==================== 渲染页面 ====================
  return (
    <>
      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* 🌟 Master Filter: Menu vs Reviews */}
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

          {/* 如果正在加载，显示圈圈 */}
          {isLoading && mainCategory === 'menu' && (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
          )}

          {/* ==================== VIEW 1: VENDOR MENU MANAGEMENT ==================== */}
          {!isLoading && mainCategory === 'menu' && (
            <View>
              {/* Secondary Filter: 动态生成的 Vendor 列表 */}
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

              {/* 真实的数据库 Menu List */}
              {filteredMenu.map(item => (
                <View key={item.id} style={styles.menuCard}>
                  <Image 
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
                    style={styles.menuImage} 
                  />
                  <View style={styles.menuInfo}>
                    <View style={styles.tagBadge}>
                      {/* 显示关联出来的商家名字，如果找不到就显示 ID */}
                      <Text style={styles.tagText}>{item.profiles?.full_name || 'Vendor ID: ' + String(item.vendor_id).substring(0,6)}</Text>
                    </View>
                    
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    
                    {/* 🌟 新增：显示 Description (最多显示两行，超出用...代替) */}
                    <Text style={styles.menuItemDesc} numberOfLines={2}>
                      {item.desc || 'No description provided.'}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={styles.menuItemPrice}>RM {parseFloat(item.price || 0).toFixed(2)}</Text>
                      {/* 🌟 真实 Stock 显示 */}
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

          {/* ==================== VIEW 2: USER REVIEW MANAGEMENT ==================== */}
          {mainCategory === 'review' && (
            <View>
              <Text style={styles.boldLabel}>Search User Review:</Text>
              <View style={styles.searchBoxContainer}>
                <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Enter User Account (e.g. ali_123)"
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
                  
                  <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                    {[...Array(review.rating)].map((_, i) => <Ionicons key={i} name="star" size={14} color="#FFC107" />)}
                    {[...Array(5 - review.rating)].map((_, i) => <Ionicons key={i} name="star-outline" size={14} color="#a0a0a0" />)}
                    <Text style={styles.reviewVendorTag}> @ {review.vendor}</Text>
                  </View>

                  <Text style={styles.reviewComment}>"{review.comment}"</Text>

                  <TouchableOpacity style={styles.deleteReviewBtn} onPress={() => handleDeleteReview(review.id, review.userAccount)}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.deleteReviewText}>Remove Review</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== EDIT MENU POP-UP WINDOW (Modal) ==================== */}
      <Modal animationType="fade" transparent={true} visible={isEditModalVisible} onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Menu Item</Text>
              
              {editingItem && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                  <Text style={styles.modalLabel}>Item Name</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={editingItem.name} 
                    onChangeText={(text) => setEditingItem({...editingItem, name: text})} 
                  />

                  {/* 🌟 新增：修改 Description 的多行输入框 */}
                  <Text style={styles.modalLabel}>Description</Text>
                  <TextInput 
                    style={[styles.modalInput, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]} 
                    multiline={true}
                    placeholder="Enter item description..."
                    value={editingItem.desc} 
                    onChangeText={(text) => setEditingItem({...editingItem, desc: text})} 
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.modalLabel}>Price (RM)</Text>
                      <TextInput 
                        style={styles.modalInput} 
                        keyboardType="numeric"
                        value={editingItem.price} 
                        onChangeText={(text) => setEditingItem({...editingItem, price: text})} 
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      {/* 🌟 新增：修改真实的 Stock 数量 */}
                      <Text style={styles.modalLabel}>Stock Qty</Text>
                      <TextInput 
                        style={styles.modalInput} 
                        keyboardType="numeric"
                        value={editingItem.stock} 
                        onChangeText={(text) => setEditingItem({...editingItem, stock: text})} 
                      />
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

  // --- Menu View Styles ---
  menuCard: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 2, borderColor: '#a0a0a0', borderRadius: 8, padding: 12, marginBottom: 15 },
  menuImage: { width: 90, height: 90, borderRadius: 6, borderWidth: 1, borderColor: '#000', marginRight: 15, backgroundColor: '#f0f0f0' },
  menuInfo: { flex: 1, justifyContent: 'center' },
  tagBadge: { alignSelf: 'flex-start', backgroundColor: '#000', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginBottom: 6 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  menuItemName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  
  // 🌟 新增的 UI 样式
  menuItemDesc: { fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 6, lineHeight: 16 },
  menuItemPrice: { fontSize: 15, color: '#000', fontWeight: 'bold' },
  menuItemStock: { fontSize: 13, fontWeight: 'bold' },
  
  actionBtnRow: { flexDirection: 'row' },
  editBtn: { backgroundColor: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 4, marginRight: 10 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#C62828', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4 },
  deleteBtnText: { color: '#C62828', fontSize: 13, fontWeight: 'bold' },

  // --- Review View Styles ---
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#000', borderRadius: 6, paddingHorizontal: 10, height: 45, backgroundColor: '#fff', marginBottom: 15 },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
  reviewCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', borderRadius: 8, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  reviewerName: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  reviewDate: { fontSize: 12, color: '#666' },
  reviewVendorTag: { fontSize: 12, fontWeight: 'bold', color: '#666', marginLeft: 8 },
  reviewComment: { fontSize: 14, color: '#000', marginTop: 8, fontStyle: 'italic', marginBottom: 15 },
  deleteReviewBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#C62828', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, borderWidth: 2, borderColor: '#000' },
  deleteReviewText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },

  // --- Modal Styles ---
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