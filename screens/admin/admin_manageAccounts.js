import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity, 
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
//import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageAccounts() {
  // ==================== 状态管理区 ====================
  // 1. 页面导航状态: 'list' (列表), 'detail' (详情), 'edit' (编辑)
  const [currentView, setCurrentView] = useState('list');
  
  // 2. 当前选中的用户
  const [selectedUser, setSelectedUser] = useState(null);

  // 3. 搜索框内容
  const [searchQuery, setSearchQuery] = useState('');

  // 4. 模拟数据库 (Mock Data)
  const [accounts, setAccounts] = useState([
    { id: 'A-001', name: 'Charlene', email: 'charlene@email.com', role: 'Admin', status: 'Active', phone: '012-3456789', joined: '2023-01-15' },
    { id: 'V-001', name: 'Adam', email: 'adam145@email.com', role: 'Vendor', status: 'Active', phone: '011-9876543', joined: '2023-05-20' },
    { id: 'U-001', name: 'Lily', email: 'lily234@email.com', role: 'User', status: 'Active', phone: '019-1122334', joined: '2023-11-02' }
  ]);

  // ==================== 逻辑处理区 ====================
  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setCurrentView('detail'); 
  };

  const handleEditUser = () => {
    setCurrentView('edit'); 
  };

  const handleSaveChanges = () => {
    const updatedAccounts = accounts.map(acc => 
      acc.id === selectedUser.id ? selectedUser : acc
    );
    setAccounts(updatedAccounts);
    Alert.alert("Success", "Account details updated successfully!");
    setCurrentView('detail'); 
  };

  // ==================== UI 渲染区: 1. 列表页 (List) ====================
  const renderList = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Search Users</Text>
        <Text style={styles.searchSubtitle}>(Name, email, AccountID)</Text>
        <View style={styles.searchRow}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabText}>Active Accounts</Text>
        </View>

        {filteredAccounts.length === 0 ? (
          <View style={[styles.accountCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Ionicons name="search-outline" size={40} color="#ccc" />
            <Text style={{ marginTop: 10, color: '#888', fontWeight: 'bold' }}>No results found</Text>
          </View>
        ) : (
          filteredAccounts.map((item, index) => (
            <View key={index} style={styles.accountCard}>
              <View style={styles.iconBox}>
                <Ionicons name="person-outline" size={20} color="#000" />
              </View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Account ID:</Text><Text style={styles.infoValue}>{item.id}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Name:</Text><Text style={styles.infoValue}>{item.name}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Email:</Text><Text style={styles.infoValue}>{item.email}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Role:</Text><Text style={styles.infoValue}>{item.role}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Status:</Text><Text style={styles.infoValue}>{item.status}</Text></View>

              <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewUser(item)}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  // ==================== UI 渲染区: 2. 详情页 (Profile Detail) ====================
  const renderDetail = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentView('list')}>
        <Ionicons name="arrow-back-outline" size={20} color="#000" />
        <Text style={styles.backBtnText}>Back to List</Text>
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <View style={styles.bigAvatar}>
          <Ionicons name="person-outline" size={50} color="#000" />
        </View>
        <Text style={styles.profileName}>{selectedUser.name}</Text>
        <Text style={styles.profileRole}>{selectedUser.role} Account</Text>
      </View>

      <View style={styles.accountCard}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.dividerLight} />
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Account ID:</Text><Text style={styles.infoValue}>{selectedUser.id}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Email:</Text><Text style={styles.infoValue}>{selectedUser.email}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone:</Text><Text style={styles.infoValue}>{selectedUser.phone}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Status:</Text><Text style={styles.infoValue}>{selectedUser.status}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Joined:</Text><Text style={styles.infoValue}>{selectedUser.joined}</Text></View>
      </View>

      <TouchableOpacity style={styles.actionBtnBlack} onPress={handleEditUser}>
        <Ionicons name="pencil-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.actionBtnTextWhite}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ==================== UI 渲染区: 3. 编辑页 (Edit Mode) ====================
  const renderEdit = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.editPageTitle}>Edit Mode</Text>
      <Text style={styles.editPageSubtitle}>Modifying {selectedUser.id}</Text>

      <View style={styles.accountCard}>
        <Text style={styles.editLabel}>Full Name</Text>
        <TextInput 
          style={styles.editInput} 
          value={selectedUser.name} 
          onChangeText={(text) => setSelectedUser({...selectedUser, name: text})} 
        />

        <Text style={styles.editLabel}>Email Address</Text>
        <TextInput 
          style={styles.editInput} 
          value={selectedUser.email} 
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(text) => setSelectedUser({...selectedUser, email: text})} 
        />

        <Text style={styles.editLabel}>Phone Number</Text>
        <TextInput 
          style={styles.editInput} 
          value={selectedUser.phone} 
          keyboardType="phone-pad"
          onChangeText={(text) => setSelectedUser({...selectedUser, phone: text})} 
        />

        <Text style={styles.editLabel}>Role</Text>
        <TextInput 
          style={styles.editInput} 
          value={selectedUser.role} 
          onChangeText={(text) => setSelectedUser({...selectedUser, role: text})} 
        />
      </View>

      <View style={styles.editBtnGroup}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setCurrentView('detail')}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges}>
          <Text style={styles.actionBtnTextWhite}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ==================== 主体渲染 ====================
  // 直接返回对应的 ScrollView 内容
  if (currentView === 'detail') return renderDetail();
  if (currentView === 'edit') return renderEdit();
  return renderList();
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  scrollContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, backgroundColor: '#ffffff', flexGrow: 1 },

  // --- 搜索卡片 ---
  searchCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#7f7f7f', padding: 15, marginBottom: 30, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 0 }, android: { elevation: 4 } }) },
  searchTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  searchSubtitle: { fontSize: 14, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 15 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, height: 40, borderWidth: 1, borderColor: '#7f7f7f', borderRadius: 4, paddingHorizontal: 10, fontSize: 14, color: '#000', marginRight: 10 },
  searchBtn: { backgroundColor: '#1a1a1a', height: 40, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 4 },
  searchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // --- 列表区 ---
  listSection: { marginTop: 10 },
  tabHeader: { alignSelf: 'flex-start', borderWidth: 2, borderColor: '#7f7f7f', borderBottomWidth: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff', zIndex: 1, marginBottom: -2 },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  accountCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#7f7f7f', padding: 15, paddingTop: 15, marginBottom: 15, position: 'relative', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 0 }, android: { elevation: 3 } }) },
  iconBox: { width: 32, height: 32, borderWidth: 2, borderColor: '#000', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { width: 90, fontSize: 14, fontWeight: 'bold', color: '#000' },
  infoValue: { flex: 1, fontSize: 14, color: '#333' },
  viewBtn: { position: 'absolute', bottom: 15, right: 15, borderWidth: 2, borderColor: '#000', borderRadius: 4, paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#fff' },
  viewBtnText: { fontSize: 14, fontWeight: 'bold', color: '#000' },

  // --- Profile Detail 页专属 ---
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtnText: { fontSize: 16, fontWeight: 'bold', marginLeft: 5, color: '#000' },
  profileHeader: { alignItems: 'center', marginBottom: 25 },
  bigAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: '#f9f9f9' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  profileRole: { fontSize: 14, fontWeight: 'bold', color: '#666', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  dividerLight: { height: 1, backgroundColor: '#ccc', marginBottom: 15 },
  actionBtnBlack: { backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 8, marginTop: 10 },
  actionBtnTextWhite: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // --- Edit Mode 专属 ---
  editPageTitle: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  editPageSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  editLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 5, marginTop: 10 },
  editInput: { height: 45, borderWidth: 2, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, fontSize: 14, color: '#000', backgroundColor: '#fafafa', marginBottom: 5 },
  editBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingVertical: 14, marginRight: 10 },
  cancelBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
});