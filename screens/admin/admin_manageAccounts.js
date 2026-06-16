import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity, 
  ScrollView,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

export default function ManageAccounts() {
  // ==================== 状态管理区 ====================
  // 1. 侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 2. 页面导航状态: 'list' (列表), 'detail' (详情), 'edit' (编辑)
  const [currentView, setCurrentView] = useState('list');
  
  // 3. 当前选中的用户 (点击 View 时存放的数据)
  const [selectedUser, setSelectedUser] = useState(null);

  // 4. 搜索框内容
  const [searchQuery, setSearchQuery] = useState('');

  // 5. 模拟数据库 (Mock Data) - 增加了一些详细字段用于详情页
  const [accounts, setAccounts] = useState([
    { id: 'A-001', name: 'Charlene', email: 'charlene@email.com', role: 'Admin', status: 'Active', phone: '012-3456789', joined: '2023-01-15' },
    { id: 'V-001', name: 'Adam', email: 'adam145@email.com', role: 'Vendor', status: 'Active', phone: '011-9876543', joined: '2023-05-20' },
    { id: 'U-001', name: 'Lily', email: 'lily234@email.com', role: 'User', status: 'Active', phone: '019-1122334', joined: '2023-11-02' }
  ]);


  // 处理菜单点击
  const handleMenuClick = (moduleName) => {
    Alert.alert("Navigation", `Connecting to ${moduleName} module...`);
    setIsSidebarOpen(false);
  };

  // 处理退出登录点击
  const handleLogout = () => {
    Alert.alert("Logout", "You have been logged out successfully.");
    setIsSidebarOpen(false);
  };
  
  // ==================== 逻辑处理区 ====================
  // 过滤搜索结果
  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 点击 View 按钮
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setCurrentView('detail'); // 切换到详情页
  };

  // 点击 Edit 按钮
  const handleEditUser = () => {
    setCurrentView('edit'); // 切换到编辑页
  };

  // 保存修改
  const handleSaveChanges = () => {
    // 模拟将数据保存回数据库
    const updatedAccounts = accounts.map(acc => 
      acc.id === selectedUser.id ? selectedUser : acc
    );
    setAccounts(updatedAccounts);
    Alert.alert("Success", "Account details updated successfully!");
    setCurrentView('detail'); // 回到详情页
  };

  // 侧边栏防错遮罩
  const renderOverlay = () => {
    if (isSidebarOpen) {
      return <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} />;
    }
    return null;
  };

  // ==================== UI 渲染区: 1. 列表页 (List) ====================
  const renderList = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* 搜索区 */}
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

      {/* 列表区 */}
      <View style={styles.listSection}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabText}>Active Accounts</Text>
        </View>

        {/* 如果搜不到结果，显示提示语 */}
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
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
  return (
    <SafeAreaView style={styles.safeArea}>
      {renderOverlay()}

      {/* 侧边栏 (仅作展示保留，实际项目中通过 Navigation 控制) */}
      {/* ==================== LEFT SIDEBAR ==================== */}
      <View style={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        {/* 线稿风格头像 */}
        <View style={styles.userSection}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>
          <Text style={styles.username}>Charlene</Text>
        </View>

        {/* 完整的菜单列表 */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Home')}>
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Profile')}>
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>
          {/* 灰色高亮保留在 Manage Accounts */}
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}>
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
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Advertising Board')}>
            <Text style={styles.menuItemText}>Manage Advertising Board</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Process Application Approval')}>
            <Text style={styles.menuItemText}>Process Application Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}>
            <Text style={styles.menuItemText}>Reset Password</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 底部登出 */}
        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#000" style={{ transform: [{ scaleX: -1}]}} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 顶部固定 Header */}
      <View style={styles.header}>
        {currentView === 'list' ? (
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
            <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 35, marginRight: 15 }} /> /* 占位符保持标题居中 */
        )}
        <Text style={styles.headerTitle}>
          {currentView === 'list' ? 'Manage Accounts' : currentView === 'detail' ? 'Profile Detail' : 'Edit Account'}
        </Text>
      </View>
      <View style={styles.divider} />

      {/* 核心视图切换器 */}
      {currentView === 'list' && renderList()}
      {currentView === 'detail' && renderDetail()}
      {currentView === 'edit' && renderEdit()}

    </SafeAreaView>
  );
}

// ==================== 🎨 STYLESHEET ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35, backgroundColor: '#ffffff', zIndex: 10 },
  hamburgerBtn: { width: 35, height: 30, borderRadius: 4, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4, marginRight: 15 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', flex: 1 },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

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

  // --- 侧边栏 ---
  sidebar: { position: 'absolute', top: Platform.OS === 'ios' ? 44 : 40,height: '100%', width: SIDEBAR_WIDTH, backgroundColor: '#ffffff', borderRightWidth: 2, borderColor: '#000000', zIndex: 100 },
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
  menuItemText: { fontSize: 14, fontWeight: 'bold', textAlign: 'left', color: '#000',paddingLeft: 30},
  logoutBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingBottom: Platform.OS === 'ios' ? 20 : 15, borderTopWidth: 2, borderColor: '#0f100f', backgroundColor: '#fff' ,marginBottom: Platform.OS === 'ios' ? 10 : 5,},
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#070707', marginLeft: 8 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 90 },
 });