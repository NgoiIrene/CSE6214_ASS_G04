import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Dimensions, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient'; // 确保路径正确

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ConfigureSystemSettings() {
  // ==================== 1. Basic Page State ====================
  const [currentCategory, setCurrentCategory] = useState('Delivery Zones & Fees');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // ==================== 2. Real Database Data State ====================
  // 初始值设为空数组，等待从数据库加载
  const [zones, setZones] = useState([]);

  // Form input state for new Zone
  const [newZoneName, setNewZoneName] = useState('');
  const [newBaseFee, setNewBaseFee] = useState('');
  const [newExtraFee, setNewExtraFee] = useState('');

  // ==================== Financial & Commission State Management ====================
  const [commissionRate, setCommissionRate] = useState('10');
  const [platformSplit, setPlatformSplit] = useState('20');
  const [riderSplit, setRiderSplit] = useState('80');

  // ==================== 3. Pop-up Window States ====================
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [editZoneName, setEditZoneName] = useState('');
  const [editBaseFee, setEditBaseFee] = useState('');
  const [editExtraFee, setEditExtraFee] = useState('');

  // ==================== 🌟 4. Database Fetch (Read) ====================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. 获取 Delivery Zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('id', { ascending: true });

      if (zonesError) throw zonesError;

      if (zonesData) {
        const formattedZones = zonesData.map(z => ({
          id: z.id.toString(),
          name: z.name,
          baseFee: Number(z.base_fee).toFixed(2),
          extraFee: Number(z.extra_fee).toFixed(2)
        }));
        setZones(formattedZones);
      }

      // 2. 获取 Financial Settings
      const { data: finData, error: finError } = await supabase
        .from('system_financial_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (finError && finError.code !== 'PGRST116') {
        console.error("Error fetching financials:", finError);
      } else if (finData) {
        setCommissionRate(Number(finData.commission_rate).toString());
        setPlatformSplit(Number(finData.platform_split).toString());
        setRiderSplit((100 - Number(finData.platform_split)).toString());
      }
    } catch (error) {
      Alert.alert("Data Fetch Error", error.message);
    }
  };

  // ==================== 5. Core Business Logic (CRUD) ====================
  
  const handlePlatformSplitChange = (val) => {
    setPlatformSplit(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num <= 100 && num >= 0) {
      setRiderSplit((100 - num).toString());
    } else if (val === '') {
      setRiderSplit('');
    }
  };

  // 🌟 删除区域 (Delete)
  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this zone?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const { error } = await supabase
            .from('delivery_zones')
            .delete()
            .eq('id', id);

          if (error) {
            Alert.alert("Delete Error", error.message);
          } else {
            setZones(zones.filter(z => z.id !== id));
          }
        } 
      }
    ]);
  };

  const startEdit = (zone) => {
    setEditingZoneId(zone.id);
    setEditZoneName(zone.name);
    setEditBaseFee(zone.baseFee);
    setEditExtraFee(zone.extraFee);
    setIsModalVisible(true);
  };

  // 🌟 保存编辑内容 (Update Zone)
  const handleSaveEdit = async () => {
    if (!editZoneName || !editBaseFee || !editExtraFee) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    const baseNum = parseFloat(editBaseFee);
    const extraNum = parseFloat(editExtraFee);

    if (isNaN(baseNum) || isNaN(extraNum) || baseNum < 0 || extraNum < 0) {
      Alert.alert("Input Validation Error", "Please enter valid positive fees.");
      return;
    }

    const isDuplicate = zones.some(z => 
      z.name.toLowerCase() === editZoneName.toLowerCase() && z.id !== editingZoneId
    );
    if (isDuplicate) {
      Alert.alert("Duplicate Error", "This delivery zone already exists.");
      return;
    }

    // 更新到数据库
    const { error } = await supabase
      .from('delivery_zones')
      .update({ 
        name: editZoneName, 
        base_fee: baseNum, 
        extra_fee: extraNum 
      })
      .eq('id', editingZoneId);

    if (error) {
      Alert.alert("Update Error", error.message);
      return;
    }

    // 更新前端画面
    setZones(zones.map(z => z.id === editingZoneId ? 
      { ...z, name: editZoneName, baseFee: baseNum.toFixed(2), extraFee: extraNum.toFixed(2) } : z
    ));
    
    setIsModalVisible(false);
    Alert.alert("Update Successful", "Settings updated successfully!");
  };

  // 🌟 新增区域 (Create Zone)
  const handleAddZone = async () => {
    if (!newZoneName || !newBaseFee || !newExtraFee) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    const baseNum = parseFloat(newBaseFee);
    const extraNum = parseFloat(newExtraFee);

    if (isNaN(baseNum) || isNaN(extraNum) || baseNum < 0 || extraNum < 0) {
      Alert.alert("Input Validation Error", "Please enter valid positive fees.");
      return;
    }

    const isDuplicate = zones.some(z => z.name.toLowerCase() === newZoneName.toLowerCase());
    if (isDuplicate) {
      Alert.alert("Duplicate Error", "This delivery zone already exists.");
      return;
    }

    // 写入数据库
    const { data, error } = await supabase
      .from('delivery_zones')
      .insert([{ name: newZoneName, base_fee: baseNum, extra_fee: extraNum }])
      .select();

    if (error) {
      Alert.alert("Database Error", error.message);
      return;
    }

    if (data && data.length > 0) {
      // 更新前端画面 (使用数据库返回的真实 ID)
      setZones([...zones, {
        id: data[0].id.toString(),
        name: data[0].name,
        baseFee: Number(data[0].base_fee).toFixed(2),
        extraFee: Number(data[0].extra_fee).toFixed(2)
      }]);
      setNewZoneName(''); setNewBaseFee(''); setNewExtraFee('');
      Alert.alert("Success", "New zone added successfully!");
    }
  };

  // 🌟 财务配置保存 (Update Master Settings)
  const handleMasterUpdate = async () => {
    if (currentCategory === 'Financial & Commission') {
      const rate = parseFloat(commissionRate);
      const pSplit = parseFloat(platformSplit);

      if (isNaN(rate) || rate < 0 || rate > 100 || isNaN(pSplit) || pSplit < 0 || pSplit > 100) {
        Alert.alert("Validation Error", "Please ensure all parameters are valid positive numbers.");
        return;
      }

      // 更新数据库财务设定
      const { error } = await supabase
        .from('system_financial_settings')
        .update({ 
          commission_rate: rate, 
          platform_split: pSplit 
        })
        .eq('id', 1);

      if (error) {
        Alert.alert("Database Error", error.message);
      } else {
        Alert.alert("Success", "Financial and Commission settings saved successfully.");
      }
    } else {
      Alert.alert("Notice", "Delivery zones are saved automatically when you add, edit, or delete them.");
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Category Dropdown */}
        <View style={[styles.sectionContainer, { zIndex: 10 }]}>
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
              <Text style={styles.formLabel}>Zone Name</Text>
              <TextInput style={styles.formInput} value={newZoneName} onChangeText={setNewZoneName} placeholder="e.g. CanteenD" />
              <Text style={styles.formLabel}>Base Fee ($)</Text>
              <TextInput style={styles.formInput} value={newBaseFee} onChangeText={setNewBaseFee} keyboardType="numeric" placeholder="0.00" />
              <Text style={styles.formLabel}>Extra Fee ($)</Text>
              <TextInput style={styles.formInput} value={newExtraFee} onChangeText={setNewExtraFee} keyboardType="numeric" placeholder="0.00" />
              <View style={styles.formBtnGroup}>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddZone}><Text style={styles.addBtnText}>Add Zone</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setNewZoneName(''); setNewBaseFee(''); setNewExtraFee(''); }}><Text style={styles.cancelBtnText}>Clear</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
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
                <View style={styles.radioButtonRow}>
                  <Ionicons name="radio-button-on" size={18} color="#a0a0a0" />
                  <Text style={[styles.radioLabelText, { color: '#777' }]}>Based on Total Order Amount (incl. packaging)</Text>
                </View>
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
              />
            </View>
            
            <TouchableOpacity style={styles.updateMasterBtn} onPress={handleMasterUpdate}>
              <Text style={styles.updateMasterBtnText}>Update Settings</Text>
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>

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
    </>
  );
}

// 样式部分保持不变，直接接下去即可
const styles = StyleSheet.create({
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

  commissionWrapper: { marginTop: 5 },
  financialCard: { borderWidth: 1, borderColor: '#a0a0a0', padding: 15, marginBottom: 15, backgroundColor: '#fff' },
  financialCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  radioContainer: { flexDirection: 'column', marginTop: 5, marginBottom: 5 },
  radioButtonRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  radioLabelText: { fontSize: 14, marginLeft: 8, color: '#000' ,flex:1,flexWrap:'wrap'}, 

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