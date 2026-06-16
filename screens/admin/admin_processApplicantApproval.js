import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Platform, Dimensions, KeyboardAvoidingView, Alert, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

export default function ProcessApplicationApproval() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('list'); 
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ visible: false, type: '', title: '' });
  const [adminRemark, setAdminRemark] = useState('');

  const [applicants, setApplicants] = useState([
    { 
      id: '1', title: 'Applicant 1', name: 'Jane Doe', date: '2026-05-26', category: 'vendor', status: 'New', 
      email: 'venuslee397@gmail.com', phone: '012-3456789', extraInfo: { shopName: 'Jane Kitchen', ssmNumber: '202101012345' },
      docUrl: 'https://images.unsplash.com/photo-1610486820245-c81fb3a0c4f8?w=400&q=80' 
    },
    { 
      id: '2', title: 'Applicant 2', name: 'John Smith', date: '2026-05-25', category: 'vendor', status: 'Pending', 
      email: 'leepuisee051202@gmail.com', phone: '011-9876543', extraInfo: { shopName: 'John Burgers', ssmNumber: '202001098765' },
      docUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80'
    },
    { 
      id: '3', title: 'Applicant 3', name: 'Alice Wong', date: '2026-05-24', category: 'delivery man', status: 'New', 
      email: 'alice@rider.com', phone: '019-1122334', extraInfo: { vehicleType: 'Motorcycle', vehiclePlate: 'BCA 1234', licenseNo: 'D-99887766' },
      docUrl: 'https://images.unsplash.com/photo-1623910271038-f9b87fecf205?w=400&q=80' 
    },
    { 
      id: '4', title: 'Applicant 4', name: 'Jason Wong', date: '2026-05-23', category: 'delivery man', status: 'New', 
      email: 'jason@rider.com', phone: '017-6655443', extraInfo: { vehicleType: 'Car', vehiclePlate: 'VAF 9999', licenseNo: 'D-11223344' },
      docUrl: 'https://images.unsplash.com/photo-1541892079144-8848037198bb?w=400&q=80'
    }
  ]);

  const filteredApplicants = applicants.filter(app => filterCategory === 'All' ? true : app.category === filterCategory);

  // ==================== 🌟 核心：统一的发邮件函数 ====================
  const sendEmailToUser = (statusLabel, customMessage) => {
    const templateParams = {
      to_email: selectedApplicant.email,  
      to_name: selectedApplicant.name,    
      status: statusLabel,                
      message: customMessage              
    };

    console.log(`Trying to send email to: ${selectedApplicant.email}`);

    // 使用 React Native 原生的 fetch 直接呼叫 EmailJS 服务器
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_v397',        
        template_id: 'template_5z0hpd8',   
        user_id: 'MDqC7cME4HPDjYVOS',      // Public Key
        accessToken: '2qTcKG1YpJH7Fd0JAPJ9r',
        template_params: templateParams, //private key
      }),
    })
    .then(async (response) => {
      if (response.ok) {
        console.log("✅ Email sent successfully!");
        Alert.alert("Success", `Status updated to ${statusLabel} and email sent!`);
      } else {
        // 🌟 核心改动：把 EmailJS 的真实报错信息抓出来，显示在手机屏幕上！
        const errorText = await response.text();
        console.error("❌ API decline:", response.status, errorText);
        Alert.alert("Email Failed", `EmailJS Error:\n\n${errorText}\n\nStatus Code: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error("❌ Email network error:", error);
      Alert.alert("Network Error", "Failed to connect to EmailJS server.");
    });
  };


  // ==================== 业务逻辑 ====================
  
  // Path 1: 批准 (Approve)
  const handleApprove = () => {
    Alert.alert(
      "Confirm Approval",
      `Approve ${selectedApplicant.name}'s application?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Approve", 
          onPress: () => {
            updateApplicantStatus(selectedApplicant.id, 'Active');
            // 🌟 呼叫发邮件函数
            sendEmailToUser('Approved', 'Congratulations! Your account is now active. You can log in to the platform.');
            setCurrentView('list');
          }
        }
      ]
    );
  };

  const openActionModal = (actionType) => {
    setAdminRemark(''); 
    if (actionType === 'Reject') {
      setModalConfig({ visible: true, type: 'Reject', title: 'Provide Rejection Reason' });
    } else if (actionType === 'Clarify') {
      setModalConfig({ visible: true, type: 'Clarify', title: 'Request Clarification / More Info' });
    }
  };

  // Path 2 & 3: 拒绝或补充资料 (Reject & Clarify)
  const handleModalSubmit = () => {
    if (!adminRemark.trim()) {
      Alert.alert("Validation Error", "Please provide a remark or reason.");
      return;
    }

    if (modalConfig.type === 'Reject') {
      updateApplicantStatus(selectedApplicant.id, 'Locked');
      // 🌟 呼叫发邮件函数，带上 Admin 写的拒绝理由
      sendEmailToUser('Rejected', `Unfortunately, your application was rejected. Reason: ${adminRemark}`);
    } else {
      updateApplicantStatus(selectedApplicant.id, 'Pending');
      // 🌟 呼叫发邮件函数，带上 Admin 写的补充要求
      sendEmailToUser('Clarification Needed', `We need more info to process your application. Admin remark: ${adminRemark}`);
    }

    setModalConfig({ visible: false, type: '', title: '' });
    setCurrentView('list');
  };

  const updateApplicantStatus = (id, newStatus) => {
    setApplicants(applicants.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  const handleMenuClick = (moduleName) => { Alert.alert("Navigation", `Connecting to ${moduleName} module...`); setIsSidebarOpen(false); };
  const handleLogout = () => { Alert.alert("Logout", "You have been logged out successfully."); setIsSidebarOpen(false); };
  const renderOverlay = () => isSidebarOpen ? <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} /> : null;

  // ==================== 渲染页面 ====================
  const renderListView = () => (
    // 🌟 列表页自带自己的 ScrollView
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.filterSection}>
        <Text style={styles.boldLabel}>Filter By:</Text>
        <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
          <Text style={styles.dropdownText}>{filterCategory}</Text>
          <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
        </TouchableOpacity>
        {isDropdownOpen && (
          <View style={styles.dropdownList}>
            {['All', 'vendor', 'delivery man'].map((item) => (
              <TouchableOpacity key={item} style={styles.dropdownItem} onPress={() => { setFilterCategory(item); setIsDropdownOpen(false); }}>
                <Text style={styles.dropdownText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.pendingHeader}>Pending Approvals ({filteredApplicants.length})</Text>
      <View style={styles.dashedDivider} />
      {filteredApplicants.map((app) => (
        <View key={app.id} style={styles.applicantCard}>
          <Text style={styles.cardTitleText}>{app.title}</Text>
          <View style={styles.cardRow}><Text style={styles.cardLabel}>Name:</Text><Text style={styles.cardValue}>{app.name}</Text></View>
          <View style={styles.cardRow}><Text style={styles.cardLabel}>Submission Date:</Text><Text style={styles.cardValue}>{app.date}</Text></View>
          <View style={styles.cardRow}><Text style={styles.cardLabel}>Category:</Text><Text style={styles.cardValue}>{app.category}</Text></View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Status:</Text>
            <Text style={[styles.cardValue, { fontWeight: 'bold', color: app.status === 'New' ? '#2E7D32' : app.status === 'Locked' ? '#C62828' : '#F57F17' }]}>{app.status}</Text>
          </View>
          <TouchableOpacity style={styles.viewBtn} onPress={() => { setSelectedApplicant(app); setCurrentView('detail'); }}><Text style={styles.viewBtnText}>View</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderDetailView = () => {
    const isVendor = selectedApplicant.category === 'vendor';
    return (
      <View style={styles.detailWrapper}>
        
        {/* 🌟 上半部分：资料区域独立滚动 */}
        <ScrollView contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtnRow} onPress={() => setCurrentView('list')}><Ionicons name="arrow-back" size={20} color="#000" /><Text style={styles.backBtnText}>Back to Pending List</Text></TouchableOpacity>
          <View style={styles.detailCard}>
            <Text style={styles.detailSectionTitle}>Applicant Information</Text>
            <View style={styles.dashedDivider} />
            <View style={styles.cardRow}><Text style={styles.cardLabel}>Name:</Text><Text style={styles.cardValue}>{selectedApplicant.name}</Text></View>
            <View style={styles.cardRow}><Text style={styles.cardLabel}>Email:</Text><Text style={styles.cardValue}>{selectedApplicant.email}</Text></View>
            <View style={styles.cardRow}><Text style={styles.cardLabel}>Phone:</Text><Text style={styles.cardValue}>{selectedApplicant.phone}</Text></View>
            <View style={styles.cardRow}><Text style={styles.cardLabel}>Category:</Text><Text style={[styles.cardValue, { textTransform: 'uppercase', fontWeight: 'bold' }]}>{selectedApplicant.category}</Text></View>
            
            <Text style={[styles.detailSectionTitle, { marginTop: 20 }]}>Submitted Documents & Details</Text>
            <View style={styles.dashedDivider} />
            {isVendor ? (
              <>
                <View style={styles.cardRow}><Text style={styles.cardLabel}>Shop Name:</Text><Text style={styles.cardValue}>{selectedApplicant.extraInfo.shopName}</Text></View>
                <View style={styles.cardRow}><Text style={styles.cardLabel}>SSM Number:</Text><Text style={styles.cardValue}>{selectedApplicant.extraInfo.ssmNumber}</Text></View>
              </>
            ) : (
              <>
                <View style={styles.cardRow}><Text style={styles.cardLabel}>Vehicle Type:</Text><Text style={styles.cardValue}>{selectedApplicant.extraInfo.vehicleType}</Text></View>
                <View style={styles.cardRow}><Text style={styles.cardLabel}>Vehicle Plate:</Text><Text style={styles.cardValue}>{selectedApplicant.extraInfo.vehiclePlate}</Text></View>
                <View style={styles.cardRow}><Text style={styles.cardLabel}>License No.:</Text><Text style={styles.cardValue}>{selectedApplicant.extraInfo.licenseNo}</Text></View>
              </>
            )}
            <Text style={{ marginTop: 15, fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 }}>DOCUMENT PREVIEW:</Text>
            <Image source={{ uri: selectedApplicant.docUrl }} style={styles.docImage} />
          </View>
        </ScrollView>

        {/* 🌟 下半部分：固定在底部的按钮区域 (Sticky Footer) */}
        <View style={styles.fixedActionBlock}>
          <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
            <Text style={styles.btnTextWhite}>Approve Application</Text>
          </TouchableOpacity>
          <View style={styles.secondaryActionRow}>
            <TouchableOpacity style={styles.clarifyBtn} onPress={() => openActionModal('Clarify')}>
              <Text style={styles.btnTextBlack}>Request Clarification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => openActionModal('Reject')}>
              <Text style={styles.btnTextWhite}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderOverlay()}
      {/* 侧边栏 */}
      <View style={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed]}>
        <View style={styles.sidebarHeader}><TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(false)}><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /></TouchableOpacity></View>
        <View style={styles.userSection}><View style={styles.avatarCircle}><View style={styles.avatarHead} /><View style={styles.avatarBody} /></View><Text style={styles.username}>Charlene</Text></View>
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Home')}><Text style={styles.menuItemText}>Home</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Profile')}><Text style={styles.menuItemText}>Profile</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Accounts')}><Text style={styles.menuItemText}>Manage Accounts</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Menu & Content')}><Text style={styles.menuItemText}>Manage Menu & Content</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Generate Reports')}><Text style={styles.menuItemText}>Generate Reports</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Configure System Settings')}><Text style={styles.menuItemText}>Configure System Settings</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Advertising Board')}><Text style={styles.menuItemText}>Manage Advertising Board</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}><Text style={styles.menuItemText}>Process Application Approval</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}><Text style={styles.menuItemText}>Reset Password</Text></TouchableOpacity>
        </ScrollView>
        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}><Ionicons name="arrow-forward-outline" size={16} color="#000" /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>
      
      {/* 顶部 Header */}
      <View style={styles.header}><TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /></TouchableOpacity><Text style={styles.headerTitle}>Application Approval</Text><View style={{ width: 35, marginRight: 15 }} /></View>
      <View style={styles.headerDivider} />

      {/* 🌟 取消了原本包围全局的 ScrollView，改为按需渲染 */}
      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {currentView === 'list' ? renderListView() : renderDetailView()}
      </KeyboardAvoidingView>

      {/* 弹窗 */}
      <Modal animationType="fade" transparent={true} visible={modalConfig.visible} onRequestClose={() => setModalConfig({ ...modalConfig, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalLabel}>Please provide details for the applicant:</Text>
            <TextInput style={styles.textArea} value={adminRemark} onChangeText={setAdminRemark} multiline={true} numberOfLines={4} placeholder="Enter your message here..." />
            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalConfig({ ...modalConfig, visible: false })}><Text style={styles.modalCancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: modalConfig.type === 'Reject' ? '#C62828' : '#1a1a1a' }]} onPress={handleModalSubmit}><Text style={styles.modalSaveBtnText}>Submit & Send Email</Text></TouchableOpacity>
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
  
  scrollContent: { paddingTop: 10, paddingBottom: 40, paddingHorizontal: 16 },
  boldLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  dashedDivider: { borderBottomWidth: 1.5, borderColor: '#a0a0a0', borderStyle: 'dashed', marginVertical: 12 },
  filterSection: { marginBottom: 10, position: 'relative', zIndex: 10 },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#000', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', width: 200 },
  dropdownText: { fontSize: 14, color: '#000' },
  dropdownList: { borderWidth: 1, borderColor: '#000', borderRadius: 4, marginTop: 2, backgroundColor: '#fff', position: 'absolute', top: 65, width: 200, zIndex: 99 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  pendingHeader: { fontSize: 14, fontWeight: 'bold', color: '#000', marginTop: 10 },
  applicantCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#7f7f7f', padding: 12, marginBottom: 15, borderRadius: 2, position: 'relative' },
  cardTitleText: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  cardRow: { flexDirection: 'row', marginBottom: 6 },
  cardLabel: { width: 125, fontSize: 17, color: '#333' },
  cardValue: { flex: 1, fontSize: 16, color: '#000' },
  viewBtn: { position: 'absolute', bottom: 12, right: 12, borderWidth: 2, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 4, backgroundColor: '#fff' },
  viewBtnText: { color: '#000', fontSize: 13, fontWeight: 'bold' },
  
  // 🌟 Detail View 专属样式更新
  detailWrapper: { flex: 1 }, 
  detailScrollContent: { paddingTop: 10, paddingBottom: 20, paddingHorizontal: 16 },
  backBtnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backBtnText: { fontSize: 20, fontWeight: 'bold', color: '#000', marginLeft: 8 },
  detailCard: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#a0a0a0', padding: 15, marginBottom: 20 },
  detailSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  docImage: { width: '100%', height: 200, resizeMode: 'cover', borderWidth: 1, borderColor: '#ccc', borderRadius: 4 },
  
  // 🌟 独立出来的底部固定区域样式 (Sticky Footer)
  fixedActionBlock: { 
    paddingHorizontal: 16, 
    paddingTop: 15, 
    paddingBottom: Platform.OS === 'ios' ? 25 : 15, // 适配 iOS 底部安全区
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#e0e0e0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 // 增加微妙的阴影让它浮起
  },
  approveBtn: { backgroundColor: '#06980d', paddingVertical: 14, borderRadius: 6, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#06980d'},
  btnTextWhite: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  clarifyBtn: { flex: 1.2, backgroundColor: '#000', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#000'},
  btnTextBlack: { color: '#fcf8f8', fontSize: 14, fontWeight: 'bold' },
  rejectBtn: { flex: 0.8, backgroundColor: '#ef3535', paddingVertical: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#ef3535' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: SCREEN_WIDTH * 0.85, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000', padding: 20, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000' },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  textArea: { borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, height: 100, padding: 10, fontSize: 14, backgroundColor: '#fafafa', textAlignVertical: 'top' },
  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 10 },
  modalCancelBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalSaveBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});