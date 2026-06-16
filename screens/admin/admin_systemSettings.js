import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Platform, Dimensions, KeyboardAvoidingView, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

export default function ConfigureSystemSettings() {
  // ==================== 1. Basic Page State ====================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('Delivery Zones & Fees');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // ==================== 2. Mock Database Data ====================
  const [zones, setZones] = useState([
    { id: '1', name: 'CanteenA', baseFee: '5.00', extraFee: '2.00' },
    { id: '2', name: 'CanteenB', baseFee: '7.50', extraFee: '1.50' },
    { id: '3', name: 'CanteenC', baseFee: '10.00', extraFee: '2.00' },
  ]);

  // Form input state for new Zone
  const [newZoneName, setNewZoneName] = useState('');
  const [newBaseFee, setNewBaseFee] = useState('');
  const [newExtraFee, setNewExtraFee] = useState('');

  // ==================== 🌟 NEW: Financial & Commission State Management ====================
  const [commissionRate, setCommissionRate] = useState('10');
  const [calcBasis, setCalcBasis] = useState('total'); // 'total': Based on total order, 'dish': Based on dish price only
  const [platformSplit, setPlatformSplit] = useState('20');
  const [riderSplit, setRiderSplit] = useState('80');
  const [minWithdrawal, setMinWithdrawal] = useState('50.00');
  const [settlementPeriod, setSettlementPeriod] = useState('Weekly');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  // ==================== 3. Pop-up Window States ====================
  const [isModalVisible, setIsModalVisible] = useState(false); // Control modal visibility
  const [editingZoneId, setEditingZoneId] = useState(null);    // Record which ID is being edited
  const [editZoneName, setEditZoneName] = useState('');        // Input field states inside modal
  const [editBaseFee, setEditBaseFee] = useState('');
  const [editExtraFee, setEditExtraFee] = useState('');

  // ==================== 4. Core Business Logic (including Error Checks) ====================
  
  // Dynamically handle delivery fee split logic (when platform changes, rider auto-calculates)
  const handlePlatformSplitChange = (val) => {
    setPlatformSplit(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num <= 100 && num >= 0) {
      setRiderSplit((100 - num).toString());
    } else if (val === '') {
      setRiderSplit('');
    }
  };

  // Delete function
  const handleDelete = (id) => {
    setZones(zones.filter(z => z.id !== id));
  };

  // 🌟 Open Edit Pop-up and load existing data
  const startEdit = (zone) => {
    setEditingZoneId(zone.id);
    setEditZoneName(zone.name);
    setEditBaseFee(zone.baseFee);
    setEditExtraFee(zone.extraFee);
    setIsModalVisible(true); // Open modal
  };

  // 🌟 Save Edit (including Error Check)
  const handleSaveEdit = () => {
    if (!editZoneName || !editBaseFee || !editExtraFee) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    const baseNum = parseFloat(editBaseFee);
    const extraNum = parseFloat(editExtraFee);

    if (isNaN(baseNum) || isNaN(extraNum) || baseNum < 0 || extraNum < 0) {
      Alert.alert("Input Validation Error", "Please enter a valid positive value for fees.");
      return;
    }

    const isDuplicate = zones.some(z => 
      z.name.toLowerCase() === editZoneName.toLowerCase() && z.id !== editingZoneId
    );
    if (isDuplicate) {
      Alert.alert("Duplicate Error", "This delivery zone location already exists.");
      return;
    }

    setZones(zones.map(z => z.id === editingZoneId ? 
      { ...z, name: editZoneName, baseFee: baseNum.toFixed(2), extraFee: extraNum.toFixed(2) } : z
    ));
    
    setIsModalVisible(false); // Close modal
    Alert.alert("Update Successful", "Settings updated successfully!");
  };

  // 🌟 Add New Zone Submit Logic (including Error Check)
  const handleAddZone = () => {
    if (!newZoneName || !newBaseFee || !newExtraFee) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    const baseNum = parseFloat(newBaseFee);
    const extraNum = parseFloat(newExtraFee);

    if (isNaN(baseNum) || isNaN(extraNum) || baseNum < 0 || extraNum < 0) {
      Alert.alert("Input Validation Error", "Please enter a valid positive value for fees.");
      return;
    }

    const isDuplicate = zones.some(z => z.name.toLowerCase() === newZoneName.toLowerCase());
    if (isDuplicate) {
      Alert.alert("Duplicate Error", "This delivery zone location already exists.");
      return;
    }

    setZones([...zones, {
      id: Date.now().toString(),
      name: newZoneName,
      baseFee: baseNum.toFixed(2),
      extraFee: extraNum.toFixed(2)
    }]);

    setNewZoneName(''); setNewBaseFee(''); setNewExtraFee('');
  };

  // 🌟 Global Master Configuration Save Logic
  const handleMasterUpdate = () => {
    if (currentCategory === 'Financial & Commission') {
      // Financial configuration validation
      const rate = parseFloat(commissionRate);
      const pSplit = parseFloat(platformSplit);
      const minWithdraw = parseFloat(minWithdrawal);

      if (isNaN(rate) || rate < 0 || rate > 100 || isNaN(pSplit) || pSplit < 0 || pSplit > 100 || isNaN(minWithdraw) || minWithdraw < 0) {
        Alert.alert("Validation Error", "Please ensure all financial parameters are valid positive numbers.");
        return;
      }
      Alert.alert("Success", "Financial and Commission settings saved successfully.");
    } else {
      Alert.alert("Success", "All delivery zone settings saved.");
    }
  };

  // ==================== 5. Navigation & Overlay Logic ====================
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
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}>
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
        <Text style={styles.headerTitle}>Configure System Settings</Text>
        <View style={{ width: 35, marginRight: 15 }} />
      </View>
      <View style={styles.headerDivider} />

      {/* ==================== MAIN CONTENT ==================== */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Category Dropdown */}
          <View style={styles.sectionContainer} style={{ zIndex: 10 }}>
            <Text style={styles.boldLabel}>Category</Text>
            <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Text style={styles.dropdownText}>{currentCategory}</Text>
              <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                {['Delivery Zones & Fees', 'Financial & Commission'].map((item) => (
                  <TouchableOpacity key={item} style={styles.dropdownItem} onPress={() => { setCurrentCategory(item); setIsDropdownOpen(false); }}>
                    <Text style={styles.dropdownText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.dashedDivider} />

          {/* Conditional Page Rendering */}
          {currentCategory === 'Delivery Zones & Fees' ? (
            <View>
              <Text style={styles.sectionSubTitle}>CURRENT CONFIGURATIONS</Text>
              
              {zones.map((zone) => (
                <View key={zone.id} style={styles.configCard}>
                  <View style={styles.configRow}><Text style={styles.configLabel}>Zone Name:</Text><Text style={styles.configValue}>{zone.name}</Text></View>
                  <View style={styles.configRow}><Text style={styles.configLabel}>Base Fee($):</Text><Text style={styles.configValue}>{zone.baseFee}</Text></View>
                  <View style={styles.configRow}><Text style={styles.configLabel}>Extra Fee($):</Text><Text style={styles.configValue}>{zone.extraFee}</Text></View>

                  <View style={styles.cardBtnGroup}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(zone)}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(zone.id)}><Text style={styles.deleteBtnText}>Delete</Text></TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add New Zone Form */}
              <View style={styles.addFormContainer}>
                <Text style={styles.formTitle}>+ Add New Delivery Zone</Text>
                <Text style={styles.formLabel}>Category</Text>
                <TextInput style={styles.formInput} value={newZoneName} onChangeText={setNewZoneName} placeholder="e.g. CanteenD" />
                <Text style={styles.formLabel}>Base Fee ($)</Text>
                <TextInput style={styles.formInput} value={newBaseFee} onChangeText={setNewBaseFee} keyboardType="numeric" placeholder="0.00" />
                <Text style={styles.formLabel}>Extra Fee ($)</Text>
                <TextInput style={styles.formInput} value={newExtraFee} onChangeText={setNewExtraFee} keyboardType="numeric" placeholder="0.00" />
                <View style={styles.formBtnGroup}>
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddZone}><Text style={styles.addBtnText}>Add Zone</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setNewZoneName(''); setNewBaseFee(''); setNewExtraFee(''); }}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* ==================== 🌟 Replaced Financial & Commission UI ==================== */
            <View style={styles.commissionWrapper}>
              
              {/* 1. Global Platform Commission */}
              <View style={styles.financialCard}>
                <Text style={styles.financialCardTitle}>📊 1. Global Platform Commission</Text>
                
                <Text style={styles.formLabel}>Default Order Commission Rate (%)</Text>
                <TextInput 
                  style={styles.formInput} 
                  value={commissionRate} 
                  onChangeText={setCommissionRate} 
                  keyboardType="numeric" 
                  placeholder="10"
                />

                <Text style={styles.formLabel}>Commission Calculation Basis</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity style={styles.radioButtonRow} onPress={() => setCalcBasis('total')}>
                    <Ionicons name={calcBasis === 'total' ? "radio-button-on" : "radio-button-off"} size={18} color="#000" />
                    <Text style={styles.radioLabelText}>Based on Total Order Amount (incl. packaging)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.radioButtonRow} onPress={() => setCalcBasis('dish')}>
                    <Ionicons name={calcBasis === 'dish' ? "radio-button-on" : "radio-button-off"} size={18} color="#000" />
                    <Text style={styles.radioLabelText}>Based on Dish Price Only</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Rider Delivery Fee Split */}
              <View style={styles.financialCard}>
                <Text style={styles.financialCardTitle}>🛵 2. Rider Delivery Fee Split</Text>
                
                <Text style={styles.formLabel}>Platform Delivery Fee Split (%) (as dispatch fee)</Text>
                <TextInput 
                  style={styles.formInput} 
                  value={platformSplit} 
                  onChangeText={handlePlatformSplitChange} 
                  keyboardType="numeric" 
                  placeholder="20"
                />

                <Text style={styles.formLabel}>Rider Delivery Fee Split (%) (auto-calculated)</Text>
                <TextInput 
                  style={[styles.formInput, styles.disabledInput]} 
                  value={riderSplit} 
                  editable={false} 
                  backgroundColor="#f2f2f2"
                />
              </View>

              {/* 3. Settlement Rules */}
              <View style={styles.financialCard} style={{ zIndex: 5, borderWidth: 1, borderColor: '#a0a0a0', padding: 15, marginBottom: 15 }}>
                <Text style={styles.financialCardTitle}>💳 3. Settlement Rules</Text>
                
                <Text style={styles.formLabel}>Merchant/Rider Minimum Withdrawal Threshold (RM)</Text>
                <TextInput 
                  style={styles.formInput} 
                  value={minWithdrawal} 
                  onChangeText={setMinWithdrawal} 
                  keyboardType="numeric" 
                  placeholder="50.00"
                />

                <Text style={styles.formLabel}>Automatic Settlement Period</Text>
                <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}>
                  <Text style={styles.dropdownText}>{settlementPeriod}</Text>
                  <Ionicons name={isPeriodDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#a0a0a0" />
                </TouchableOpacity>

                {isPeriodDropdownOpen && (
                  <View style={styles.innerDropdownList}>
                    {['Weekly', 'Monthly', 'Daily'].map((period) => (
                      <TouchableOpacity key={period} style={styles.dropdownItem} onPress={() => { setSettlementPeriod(period); setIsPeriodDropdownOpen(false); }}>
                        <Text style={styles.dropdownText}>{period}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

            </View>
          )}

          <TouchableOpacity style={styles.updateMasterBtn} onPress={handleMasterUpdate}>
            <Text style={styles.updateMasterBtnText}>Update Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== EDIT POP-UP WINDOW (Modal) ==================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Existing Zone</Text>
            
            <Text style={styles.modalLabel}>Zone Name</Text>
            <TextInput style={styles.modalInput} value={editZoneName} onChangeText={setEditZoneName} />

            <Text style={styles.modalLabel}>Base Fee ($)</Text>
            <TextInput style={styles.modalInput} value={editBaseFee} onChangeText={setEditBaseFee} keyboardType="numeric" />

            <Text style={styles.modalLabel}>Extra Fee ($)</Text>
            <TextInput style={styles.modalInput} value={editExtraFee} onChangeText={setEditExtraFee} keyboardType="numeric" />

            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit}>
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
  sectionContainer: { marginTop: 10, marginBottom: 15, position: 'relative' },
  boldLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  dropdownText: { fontSize: 14, color: '#000' },
  dropdownList: { borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, marginTop: 2, backgroundColor: '#fff', position: 'absolute', top: 65, width: '100%', zIndex: 99 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  dashedDivider: { borderBottomWidth: 1.5, borderColor: '#a0a0a0', borderStyle: 'dashed', marginVertical: 10 },
  sectionSubTitle: { fontSize: 12, color: '#000', marginBottom: 15, letterSpacing: 1 },
  configCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d0d0d0', padding: 15, marginBottom: 10, position: 'relative' },
  configRow: { flexDirection: 'row', marginBottom: 4 },
  configLabel: { width: 100, fontSize: 14, color: '#000', fontWeight: 'bold' },
  configValue: { flex: 1, fontSize: 14, color: '#000' },
  
  cardBtnGroup: { position: 'absolute', bottom: 15, right: 15, flexDirection: 'row' },
  editBtn: { backgroundColor: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 4, marginRight: 8 },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#a8a59e', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 4 },
  deleteBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },

  addFormContainer: { borderWidth: 1, borderColor: '#a0a0a0', padding: 15, marginTop: 10, marginBottom: 20 },
  formTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  formLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  formInput: { borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, height: 40, paddingHorizontal: 10, marginBottom: 12, fontSize: 14 },
  disabledInput: { color: '#777', backgroundColor: '#f2f2f2' },
  formBtnGroup: { flexDirection: 'row', marginTop: 5 },
  addBtn: { backgroundColor: '#1a1a1a', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 4, marginRight: 10 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#1a1a1a', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 4 },
  cancelBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  updateMasterBtn: { backgroundColor: '#1a1a1a', paddingVertical: 15, borderRadius: 4, alignItems: 'center', marginTop: 10 },
  updateMasterBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // 🌟 NEW: Financial UI Styles
  commissionWrapper: { marginTop: 5 },
  financialCard: { borderWidth: 1, borderColor: '#a0a0a0', padding: 15, marginBottom: 15, backgroundColor: '#fff' },
  financialCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  radioContainer: { flexDirection: 'column', marginTop: 5, marginBottom: 5 },
  radioButtonRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  radioLabelText: { fontSize: 14, marginLeft: 8, color: '#000' ,flex:1,flexWrap:'wrap'}, // 加上 flex: 1 和 flexWrap，确保如果用户的手机屏幕比较小，文字会自动换行而不会被切断
  innerDropdownList: { borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, marginTop: 2, backgroundColor: '#fff', position: 'absolute', top: 135, width: '100%', zIndex: 99 },

  // POP-UP MODAL WINDOW STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: SCREEN_WIDTH * 0.85, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#000' },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 5, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, height: 40, paddingHorizontal: 10, fontSize: 14, backgroundColor: '#fafafa' },
  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  modalCancelBtn: { flex: 1, borderWidth: 2, borderColor: '#000', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 10 },
  modalCancelBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  modalSaveBtn: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});