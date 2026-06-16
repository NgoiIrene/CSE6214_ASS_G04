import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Platform, Dimensions, KeyboardAvoidingView, Alert, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

export default function ManageMenuContent() {
  // ==================== 1. 基础页面与导航状态 ====================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 主分类筛选: 'menu' (看商家菜单) 或 'review' (看用户评论)
  const [mainCategory, setMainCategory] = useState('menu'); 
  const [isMainDropdownOpen, setIsMainDropdownOpen] = useState(false);

  // ==================== 2. Menu 专属状态与 Mock Data ====================
  const [vendorFilter, setVendorFilter] = useState('All');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  
  const [menuItems, setMenuItems] = useState([
    { id: '1', vendor: 'Vendor A', name: 'Nasi Lemak Ayam Goreng', price: '8.50', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?w=400&q=80' },
    { id: '2', vendor: 'Vendor B', name: 'Signature Beef Burger', price: '12.00', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
    { id: '3', vendor: 'Vendor A', name: 'Milo Ais', price: '3.00', status: 'Sold Out', imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
    { id: '4', vendor: 'Vendor C', name: 'Chicken Chop', price: '15.90', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80' },
  ]);

  // Edit Modal 状态
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ==================== 3. Review 专属状态与 Mock Data ====================
  const [searchReviewQuery, setSearchReviewQuery] = useState('');
  
  const [reviews, setReviews] = useState([
    { id: 'r1', userAccount: 'ali_123', vendor: 'Vendor A', rating: 5, date: '2026-06-10', comment: 'The food is very delicious and hot!' },
    { id: 'r2', userAccount: 'angry_bird', vendor: 'Vendor B', rating: 1, date: '2026-06-11', comment: 'Stupid food! Taste like rubbish! 🤬' }, // 模拟违规评论
    { id: 'r3', userAccount: 'jason_wong', vendor: 'Vendor C', rating: 4, date: '2026-06-12', comment: 'Good portion, but delivery was a bit slow.' },
    { id: 'r4', userAccount: 'sweet_girl', vendor: 'Vendor A', rating: 5, date: '2026-06-13', comment: 'Best Nasi Lemak in campus!' },
  ]);

  // ==================== 4. 核心业务逻辑 ====================

  // --- Menu 逻辑 ---
  const filteredMenu = menuItems.filter(item => 
    vendorFilter === 'All' ? true : item.vendor === vendorFilter
  );

  const openEditModal = (item) => {
    setEditingItem({ ...item }); // 复制一份数据到表单
    setIsEditModalVisible(true);
  };

  const handleSaveMenu = () => {
    if (!editingItem.name || !editingItem.price) {
      Alert.alert("Validation Error", "Item name and price cannot be empty.");
      return;
    }
    // 更新 Database (State)
    setMenuItems(menuItems.map(item => item.id === editingItem.id ? editingItem : item));
    setIsEditModalVisible(false);
    Alert.alert("Success", "Menu item updated successfully in the database.");
  };

  const handleDeleteMenu = (id, name) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete "${name}"? This action cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
          setMenuItems(menuItems.filter(item => item.id !== id));
          Alert.alert("Deleted", "Item has been removed from database and UI.");
      }}
    ]);
  };

  // --- Review 逻辑 ---
  const filteredReviews = reviews.filter(review => 
    review.userAccount.toLowerCase().includes(searchReviewQuery.toLowerCase())
  );

  const handleDeleteReview = (id, userAccount) => {
    Alert.alert("Moderate Comment", `Delete review by ${userAccount}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Review", style: "destructive", onPress: () => {
          setReviews(reviews.filter(review => review.id !== id));
          Alert.alert("Review Removed", "The rude/dirty comment has been deleted from the database.");
      }}
    ]);
  };

  // ==================== 5. 导航逻辑 ====================
  const handleMenuClick = (moduleName) => { Alert.alert("Navigation", `Connecting to ${moduleName} module...`); setIsSidebarOpen(false); };
  const handleLogout = () => { Alert.alert("Logout", "You have been logged out successfully."); setIsSidebarOpen(false); };
  const renderOverlay = () => isSidebarOpen ? <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} /> : null;

  // ==================== 渲染页面 ====================
  return (
    <SafeAreaView style={styles.safeArea}>
      {renderOverlay()}

      {/* ==================== LEFT SIDEBAR ==================== */}
      <View style={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed]}>
        <View style={styles.sidebarHeader}><TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(false)}><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /></TouchableOpacity></View>
        <View style={styles.userSection}><View style={styles.avatarCircle}><View style={styles.avatarHead} /><View style={styles.avatarBody} /></View><Text style={styles.username}>Charlene</Text></View>
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Home')}><Text style={styles.menuItemText}>Home</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Profile')}><Text style={styles.menuItemText}>Profile</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Accounts')}><Text style={styles.menuItemText}>Manage Accounts</Text></TouchableOpacity>
          
          {/* 🌟 停留在 Manage Menu & Content */}
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}>
            <Text style={styles.menuItemText}>Manage Menu & Content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Generate Reports')}><Text style={styles.menuItemText}>Generate Reports</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Configure System Settings')}><Text style={styles.menuItemText}>Configure System Settings</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Advertising Board')}><Text style={styles.menuItemText}>Manage Advertising Board</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Process Application Approval')}><Text style={styles.menuItemText}>Process Application Approval</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}><Text style={styles.menuItemText}>Reset Password</Text></TouchableOpacity>
        </ScrollView>
        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}><Ionicons name="arrow-forward-outline" size={16} color="#000" /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      {/* ==================== TOP HEADER ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu & Content</Text>
        <View style={{ width: 35, marginRight: 15 }} />
      </View>
      <View style={styles.headerDivider} />

      {/* ==================== MAIN CONTENT ==================== */}
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

          {/* ==================== VIEW 1: VENDOR MENU MANAGEMENT ==================== */}
          {mainCategory === 'menu' && (
            <View>
              {/* Secondary Filter: Select Vendor */}
              <View style={[styles.filterSection, { zIndex: 10 }]}>
                <Text style={styles.boldLabel}>Filter By Vendor:</Text>
                <TouchableOpacity style={[styles.dropdownBox, { width: 180 }]} onPress={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}>
                  <Text style={styles.dropdownText}>{vendorFilter}</Text>
                  <Ionicons name={isVendorDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
                </TouchableOpacity>
                {isVendorDropdownOpen && (
                  <View style={[styles.dropdownList, { width: 180 }]}>
                    {['All', 'Vendor A', 'Vendor B', 'Vendor C'].map((v) => (
                      <TouchableOpacity key={v} style={styles.dropdownItem} onPress={() => { setVendorFilter(v); setIsVendorDropdownOpen(false); }}>
                        <Text style={styles.dropdownText}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.sectionSubTitle}>Total Menu Items: {filteredMenu.length}</Text>

              {/* Menu List */}
              {filteredMenu.map(item => (
                <View key={item.id} style={styles.menuCard}>
                  <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
                  <View style={styles.menuInfo}>
                    <View style={styles.tagBadge}><Text style={styles.tagText}>{item.vendor}</Text></View>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemPrice}>RM {item.price}</Text>
                    
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

              {/* Review List */}
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

                  {/* 删除评论按钮 (用于清理脏话或违规内容) */}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Menu Item</Text>
            
            {editingItem && (
              <>
                <Text style={styles.modalLabel}>Item Name</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={editingItem.name} 
                  onChangeText={(text) => setEditingItem({...editingItem, name: text})} 
                />

                <Text style={styles.modalLabel}>Price (RM)</Text>
                <TextInput 
                  style={styles.modalInput} 
                  keyboardType="numeric"
                  value={editingItem.price} 
                  onChangeText={(text) => setEditingItem({...editingItem, price: text})} 
                />

                <Text style={styles.modalLabel}>Status</Text>
                <TouchableOpacity 
                  style={[styles.modalInput, { justifyContent: 'center', backgroundColor: editingItem.status === 'Available' ? '#e8f5e9' : '#ffebee' }]}
                  onPress={() => setEditingItem({...editingItem, status: editingItem.status === 'Available' ? 'Sold Out' : 'Available'})}
                >
                  <Text style={{ fontWeight: 'bold', color: editingItem.status === 'Available' ? '#2E7D32' : '#C62828' }}>
                    {editingItem.status === 'Available' ? '🟢 Available' : '🔴 Sold Out (Tap to change)'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMenu}>
                <Text style={styles.modalSaveBtnText}>Save</Text>
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
  hamburgerBtn: { width: 35, height: 30, borderWidth: 2, borderColor: '#000', borderRadius: 4, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4, marginRight: 15 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'center' },
  headerDivider: { height: 2, backgroundColor: '#000', width: '100%' },
  keyboardAvoid: { flex: 1 },
  
  // Sidebar
  sidebar: { position: 'absolute', top: Platform.OS === 'ios' ? 44 : 40, height: '100%', width: SIDEBAR_WIDTH, backgroundColor: '#ffffff', borderRightWidth: 2, borderColor: '#000000', zIndex: 100 },
  sidebarOpen: { left: 0 }, sidebarClosed: { left: -SIDEBAR_WIDTH - 10 },
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
  
  // Content General
  scrollContent: { paddingTop: 15, paddingBottom: 40, paddingHorizontal: 16 },
  boldLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  dashedDivider: { borderBottomWidth: 1.5, borderColor: '#a0a0a0', borderStyle: 'dashed', marginVertical: 15 },
  sectionSubTitle: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 10, textTransform: 'uppercase' },

  // Dropdowns
  filterSection: { marginBottom: 5, position: 'relative' },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#000', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  dropdownText: { fontSize: 15, color: '#000', fontWeight: 'bold' },
  dropdownList: { borderWidth: 2, borderColor: '#000', borderRadius: 6, marginTop: 4, backgroundColor: '#fff', position: 'absolute', top: 70, width: '100%', zIndex: 99, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },

  // --- Menu View Styles ---
  menuCard: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 2, borderColor: '#a0a0a0', borderRadius: 8, padding: 12, marginBottom: 15 },
  menuImage: { width: 90, height: 90, borderRadius: 6, borderWidth: 1, borderColor: '#000', marginRight: 15 },
  menuInfo: { flex: 1, justifyContent: 'center' },
  tagBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e0e0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  tagText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  menuItemName: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  menuItemPrice: { fontSize: 14, color: '#2E7D32', fontWeight: 'bold', marginBottom: 10 },
  
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
  modalContent: { width: SCREEN_WIDTH * 0.85, backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#000', padding: 20, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000', borderBottomWidth: 2, paddingBottom: 10 },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 6, marginTop: 10 },
  modalInput: { borderWidth: 2, borderColor: '#000', borderRadius: 4, height: 42, paddingHorizontal: 10, fontSize: 14, backgroundColor: '#fff' },
  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 10, backgroundColor: '#fff' },
  modalCancelBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalSaveBtn: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});