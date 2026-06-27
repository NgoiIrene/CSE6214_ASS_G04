import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  Dimensions, Alert, Modal, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ConfigureSystemSettings() {
  const [currentCategory, setCurrentCategory] = useState('Delivery Zones & Fees');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [zones, setZones] = useState([]);

  // ==================== Financial & Commission State ====================
  const [commissionRate, setCommissionRate] = useState('10');
  const [sstRate, setSstRate] = useState('6'); // 新增：SST Rate
  const [minTopUp, setMinTopUp] = useState('10'); // 新增：最低充值金额

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [editZoneName, setEditZoneName] = useState(''); 
  const [editBaseFee, setEditBaseFee] = useState('');
  const [editExtraFee, setEditExtraFee] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: zonesData, error: zonesError } = await supabase
        .from('delivery_zones')
        .select(`
          *,
          vendor:profiles (
            full_name
          )
        `)
        .order('id', { ascending: true });

      if (zonesError) throw zonesError;

      if (zonesData) {
        const formattedZones = zonesData.map(z => ({
          id: z.id.toString(),
          name: z.vendor?.full_name || 'Unknown Vendor', 
          baseFee: Number(z.base_fee).toFixed(2),
          extraFee: Number(z.extra_fee).toFixed(2)
        }));
        setZones(formattedZones);
      }

      const { data: finData, error: finError } = await supabase
        .from('system_financial_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (finError && finError.code !== 'PGRST116') {
        console.error("Error fetching financials:", finError);
      } else if (finData) {
        setCommissionRate(Number(finData.commission_rate).toString());
        if (finData.sst_rate !== undefined) setSstRate(Number(finData.sst_rate).toString());
        if (finData.min_top_up !== undefined) setMinTopUp(Number(finData.min_top_up).toString());
      }
    } catch (error) {
      Alert.alert("Data Fetch Error", error.message);
    }
  };

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

  const handleSaveEdit = async () => {
    if (!editBaseFee || !editExtraFee) {
      Alert.alert("Validation Error", "Please fill in all fee fields.");
      return;
    }

    const baseNum = parseFloat(editBaseFee);
    const extraNum = parseFloat(editExtraFee);

    if (isNaN(baseNum) || isNaN(extraNum) || baseNum < 0 || extraNum < 0) {
      Alert.alert("Input Validation Error", "Please enter valid positive fees.");
      return;
    }

    const { error } = await supabase
      .from('delivery_zones')
      .update({ 
        base_fee: baseNum, 
        extra_fee: extraNum 
      })
      .eq('id', editingZoneId);

    if (error) {
      Alert.alert("Update Error", error.message);
      return;
    }

    setZones(zones.map(z => z.id === editingZoneId ? 
      { ...z, baseFee: baseNum.toFixed(2), extraFee: extraNum.toFixed(2) } : z
    ));
    
    setIsModalVisible(false);
    Alert.alert("Update Successful", "Settings updated successfully!");
  };

  const handleMasterUpdate = async () => {
    if (currentCategory === 'Financial & Commission') {
      const rate = parseFloat(commissionRate);
      const sst = parseFloat(sstRate);
      const topUp = parseFloat(minTopUp);

      if (isNaN(rate) || rate < 0 || rate > 100 || isNaN(sst) || sst < 0 || sst > 100 || isNaN(topUp) || topUp <= 0) {
        Alert.alert("Validation Error", "Please ensure all rates and amounts are valid positive numbers.");
        return;
      }

      const { error } = await supabase
        .from('system_financial_settings')
        .update({ 
          commission_rate: rate,
          sst_rate: sst,        // 写入新字段
          min_top_up: topUp     // 写入新字段
        })
        .eq('id', 1);

      if (error) {
        Alert.alert("Database Error", error.message);
      } else {
        Alert.alert("Success", "Financial and Commission settings saved successfully.");
      }
    } else {
      Alert.alert("Notice", "Delivery zones are saved automatically when you edit or delete them.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#fff' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} 
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
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

        {currentCategory === 'Delivery Zones & Fees' ? (
          <View>
            <Text style={styles.sectionSubTitle}>CURRENT CONFIGURATIONS</Text>
            
            {zones.map((zone) => (
              <View key={zone.id} style={styles.configCard}>
                <View style={styles.configRow}><Text style={styles.configLabel}>Vendor Name:</Text><Text style={styles.configValue}>{zone.name}</Text></View>
                <View style={styles.configRow}><Text style={styles.configLabel}>Base Fee($):</Text><Text style={styles.configValue}>{zone.baseFee}</Text></View>
                <View style={styles.configRow}><Text style={styles.configLabel}>Extra Fee($):</Text><Text style={styles.configValue}>{zone.extraFee}</Text></View>

                <View style={styles.cardBtnGroup}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(zone)}><Text style={styles.editBtnText}>Edit Fees</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(zone.id)}><Text style={styles.deleteBtnText}>Delete</Text></TouchableOpacity>
                </View>
              </View>
            ))}
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
                placeholder="e.g. 10"
              />
              <Text style={styles.formLabel}>Commission Calculation Basis</Text>
              <View style={styles.radioContainer}>
                <View style={styles.radioButtonRow}>
                  <Ionicons name="radio-button-on" size={18} color="#a0a0a0" />
                  <Text style={[styles.radioLabelText, { color: '#777' }]}>Based on Total Order Amount (incl. packaging)</Text>
                </View>
              </View>
            </View>

            {/* 2. SST Settings */}
            <View style={styles.financialCard}>
              <Text style={styles.financialCardTitle}>🏛️ 2. SST (Sales & Service Tax)</Text>
              <Text style={styles.formLabel}>Government Tax Rate (%)</Text>
              <TextInput 
                style={styles.formInput} 
                value={sstRate} 
                onChangeText={setSstRate} 
                keyboardType="numeric" 
                placeholder="e.g. 6"
              />
            </View>

            {/* 3. User Wallet Minimum Top-up */}
            <View style={styles.financialCard}>
              <Text style={styles.financialCardTitle}>💰 3. Campus Wallet Settings</Text>
              <Text style={styles.formLabel}>Minimum Top-up Amount (RM)</Text>
              <TextInput 
                style={styles.formInput} 
                value={minTopUp} 
                onChangeText={setMinTopUp} 
                keyboardType="numeric" 
                placeholder="e.g. 10"
              />
            </View>
            
            <TouchableOpacity style={styles.updateMasterBtn} onPress={handleMasterUpdate}>
              <Text style={styles.updateMasterBtnText}>Update Settings</Text>
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Delivery Fees</Text>
            
            <Text style={styles.modalLabel}>Vendor Name: {editZoneName}</Text>
            <View style={styles.dashedDivider} />

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
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 10, paddingBottom: 60, paddingHorizontal: 16 },
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

  formLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  formInput: { borderWidth: 1, borderColor: '#a0a0a0', borderRadius: 4, height: 40, paddingHorizontal: 10, marginBottom: 12, fontSize: 14 },
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