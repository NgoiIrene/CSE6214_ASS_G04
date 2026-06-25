import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, ActivityIndicator, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabaseClient'; // 确保路径正确

export default function UserProfileScreen({ onProfileUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 新增：充值功能相关的 State
  const [minTopUpAmount, setMinTopUpAmount] = useState(5.00);
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    email: '',
    phone_number: '',
    gender: 'Female',
    age: '',
    account_type: 'customer',
    avatar_url: null,
    wallet_id: null,    // 新增：存下钱包的专属ID，用来写流水账
    wallet_number: '—',
    balance: 0.00
  });

  const [pendingProfile, setPendingProfile] = useState({ ...profile });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert("Error", "User not logged in or session expired.");
        return;
      }

      // 🌟 新增：去数据库查 Admin 设置的最低充值金额
      const { data: finSettingsData } = await supabase
        .from('system_financial_settings')
        .select('min_top_up')
        .eq('id', 1)
        .maybeSingle();

      if (finSettingsData && finSettingsData.min_top_up !== null) {
        setMinTopUpAmount(parseFloat(finSettingsData.min_top_up));
      }

      // 1. 先抓取 User 的基础资料
      const { data: profileData, error: dbError } = await supabase
        .from('profiles')
        .select('id, full_name, account_type, phone_number, gender, age, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (dbError) throw dbError;

      // 2. 抓取对应的 Wallet 资料
      let fetchedWalletId = null;
      let fetchedWalletNum = '—';
      let fetchedBalance = 0.00;

      if (profileData) {
        // 🌟 核心修复：用 maybeSingle() 代替 single()。这样即使当前用户暂时没有钱包，也不会导致整个页面崩溃。
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('wallet_id, wallet_number, balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletData) {
          fetchedWalletId = walletData.wallet_id;
          fetchedWalletNum = walletData.wallet_number || '—';
          fetchedBalance = parseFloat(walletData.balance) || 0.00;
        }
      }

      if (profileData) {
        const fetchedData = {
          id: profileData.id,
          full_name: profileData.full_name || '',
          email: profileData.email || user.email,
          phone_number: profileData.phone_number || '',
          gender: profileData.gender || 'Female',
          age: profileData.age ? String(profileData.age) : '',
          account_type: profileData.account_type || 'customer',
          avatar_url: profileData.avatar_url || null,
          wallet_id: fetchedWalletId,
          wallet_number: fetchedWalletNum,
          balance: fetchedBalance
        };
        setProfile(fetchedData);
        setPendingProfile(fetchedData);
      }
    } catch (error) {
      Alert.alert("Error Fetching Profile", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 新增：处理充值提交的逻辑
  const handleTopUpSubmit = async () => {
    const amount = parseFloat(topUpAmount);

    // 系统拦截 1：如果输入的不是数字，或者金额小于 minimum
    if (isNaN(amount) || amount < minTopUpAmount) {
      Alert.alert("Top-up Failed", `Minimum top up amount is RM ${minTopUpAmount.toFixed(2)}.`);
      return;
    }

    // 系统拦截 2：如果该用户没有绑定钱包
    if (!profile.wallet_id) {
      Alert.alert("Error", "No wallet found for this account. Please contact Admin.");
      return;
    }

    try {
      setIsLoading(true);
      const newBalance = profile.balance + amount;

      // 第一步：更新钱包余额
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date() })
        .eq('wallet_id', profile.wallet_id);

      if (updateError) throw updateError;

      // 第二步：写入流水账单表
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert([{
          wallet_id: profile.wallet_id,
          amount: amount,
          tx_type: 'topup',
          description: 'User Self Top-up'
        }]);

      if (txError) throw txError;

      // 第三步：更新前端 UI 并关闭弹窗
      setProfile({ ...profile, balance: newBalance });
      setTopUpModalVisible(false);
      setTopUpAmount('');
      Alert.alert("Success", `RM ${amount.toFixed(2)} has been added to your wallet!`);

    } catch (error) {
      Alert.alert("Top-up Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = () => {
    setPendingProfile({ ...profile });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPendingProfile({ ...pendingProfile, avatar_url: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!pendingProfile.full_name.trim()) {
      Alert.alert("Error", "Full Name cannot be empty.");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: pendingProfile.full_name.trim(),
          phone_number: pendingProfile.phone_number.trim(),
          gender: pendingProfile.gender,
          age: pendingProfile.age ? parseInt(pendingProfile.age, 10) : null,
          avatar_url: pendingProfile.avatar_url,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...pendingProfile });
      Alert.alert("Success", "User Profile updated successfully!");
      setIsEditMode(false);

      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      Alert.alert("Save Failed", error.message);
    } finally {
      setIsLoading(false);
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
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={styles.content}>

        {/* 操作栏 */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={isEditMode ? handleCancelEdit : handleStartEdit}>
            <Text style={styles.actionText}>{isEditMode ? "Cancel" : "Edit Profile"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wireframeCard}>
          {/* 头像组件 */}
          <TouchableOpacity disabled={!isEditMode} onPress={pickAvatar} style={styles.avatarBox}>
            {isEditMode ? (
              pendingProfile.avatar_url ? <Image source={{ uri: pendingProfile.avatar_url }} style={styles.avatarImage} /> : <Ionicons name="person" size={50} />
            ) : (
              profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <Ionicons name="person" size={50} />
            )}
            {isEditMode && <View style={styles.editBadge}><Ionicons name="camera" size={16} color="#fff" /></View>}
          </TouchableOpacity>

          {/* Full Name */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>USER FULL NAME:</Text>
            {isEditMode ? (
              <TextInput style={styles.input} value={pendingProfile.full_name} onChangeText={(v) => setPendingProfile({ ...pendingProfile, full_name: v })} />
            ) : (
              <Text style={styles.valueText}>{profile.full_name || '—'}</Text>
            )}
          </View>

          {/* Email Address */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>USER EMAIL (READ-ONLY):</Text>
            <Text style={[styles.valueText, isEditMode && styles.readOnlyText]}>{profile.email || '—'}</Text>
          </View>

          {/* 🌟 修改后的 Wallet 区块：实线框 + Top Up 按钮 */}
          <View style={styles.walletSection}>
            <Text style={styles.walletTitle}>CAMPUS EWALLET</Text>

            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Wallet Number:</Text>
              <Text style={styles.walletValue}>{profile.wallet_number}</Text>
            </View>

            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Balance:</Text>
              <Text style={styles.walletBalanceText}>RM {profile.balance.toFixed(2)}</Text>
            </View>

            {/* 新增：充值按钮区 (仅在非编辑模式下显示) */}
            {!isEditMode && (
              <View style={styles.topUpContainer}>
                <TouchableOpacity style={styles.topUpBtn} onPress={() => setTopUpModalVisible(true)}>
                  <Text style={styles.topUpBtnText}>Top-up</Text>
                </TouchableOpacity>
                <Text style={styles.minTopUpText}>
                  * Minimum top up amount: RM {minTopUpAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
          {/* ------------------------------- */}

          {/* Phone Number */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>PHONE NUMBER:</Text>
            {isEditMode ? (
              <TextInput style={styles.input} keyboardType="phone-pad" value={pendingProfile.phone_number} onChangeText={(v) => setPendingProfile({ ...pendingProfile, phone_number: v })} />
            ) : (
              <Text style={styles.valueText}>{profile.phone_number || '—'}</Text>
            )}
          </View>

          {/* Gender */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>GENDER:</Text>
            {isEditMode ? (
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderOption, pendingProfile.gender === 'Male' && styles.genderSelected]}
                  onPress={() => setPendingProfile({ ...pendingProfile, gender: 'Male' })}
                >
                  <Text style={[styles.genderText, pendingProfile.gender === 'Male' && styles.genderTextSelected]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderOption, pendingProfile.gender === 'Female' && styles.genderSelected]}
                  onPress={() => setPendingProfile({ ...pendingProfile, gender: 'Female' })}
                >
                  <Text style={[styles.genderText, pendingProfile.gender === 'Female' && styles.genderTextSelected]}>Female</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.valueText}>{profile.gender || '—'}</Text>
            )}
          </View>

          {/* Age */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>AGE:</Text>
            {isEditMode ? (
              <TextInput style={styles.input} keyboardType="number-pad" value={pendingProfile.age} onChangeText={(v) => setPendingProfile({ ...pendingProfile, age: v })} />
            ) : (
              <Text style={styles.valueText}>{profile.age || '—'}</Text>
            )}
          </View>

          {/* 保存按钮 */}
          {isEditMode && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ fontWeight: 'bold' }}>Save User Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 🌟 新增：充值输入弹窗 (Modal) */}
      <Modal visible={topUpModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up Wallet</Text>
            <Text style={styles.modalSubtitle}>Current Balance: RM {profile.balance.toFixed(2)}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount (e.g. 10.00)"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setTopUpModalVisible(false); setTopUpAmount(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleTopUpSubmit}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 25, paddingBottom: 50 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  actionText: { fontSize: 16, fontWeight: 'bold', color: '#000', textDecorationLine: 'underline' },
  wireframeCard: { borderWidth: 1.5, borderColor: '#000', padding: 20, borderRadius: 8, backgroundColor: '#fff' },
  avatarBox: { width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'visible' },
  avatarImage: { width: 100, height: 100, borderRadius: 48 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  inputRow: { marginBottom: 15 },
  label: { fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  input: { borderWidth: 1.5, height: 40, paddingHorizontal: 10, borderRadius: 4 },
  valueText: { fontSize: 16, paddingVertical: 8 },
  readOnlyText: { color: '#7f8c8d', fontStyle: 'italic' },
  saveBtn: { borderWidth: 1.5, marginTop: 20, padding: 15, alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 4 },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  genderOption: { flex: 1, borderWidth: 1.5, borderColor: '#000', padding: 10, alignItems: 'center', marginRight: 5, marginLeft: 5, borderRadius: 4 },
  genderSelected: { backgroundColor: '#000' },
  genderText: { fontWeight: '500', color: '#000' },
  genderTextSelected: { color: '#fff' },

  // 🌟 Wallet 区块专属样式修改
  // 核心修改：去掉了 borderStyle: 'dashed'，默认变成了实心框，完美贴合你的要求！
  walletSection: { borderWidth: 1.5, borderColor: '#000', padding: 15, borderRadius: 6, marginBottom: 20, backgroundColor: '#fcfcfc' },
  walletTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 10, letterSpacing: 1 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  walletLabel: { color: '#555', fontWeight: '500' },
  walletValue: { fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold', color: '#000' },
  walletBalanceText: { fontSize: 18, fontWeight: '800', color: '#000000' },

  // 🌟 新增：Top-up 按钮和字体样式
  topUpContainer: { marginTop: 15, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', paddingTop: 15 },
  topUpBtn: { backgroundColor: '#000', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 4 },
  topUpBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  minTopUpText: { fontSize: 11, color: '#666', marginTop: 8, fontStyle: 'italic' },

  // 🌟 新增：弹窗 (Modal) 样式
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 8, borderWidth: 2, borderColor: '#000' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1.5, borderColor: '#000', padding: 12, borderRadius: 4, fontSize: 16, marginBottom: 20, textAlign: 'center' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalCancelBtn: { flex: 1, padding: 12, borderWidth: 1.5, borderColor: '#000', borderRadius: 4, marginRight: 10, alignItems: 'center' },
  modalCancelText: { fontWeight: 'bold', color: '#000' },
  modalConfirmBtn: { flex: 1, padding: 12, backgroundColor: '#000', borderRadius: 4, alignItems: 'center' },
  modalConfirmText: { fontWeight: 'bold', color: '#fff' },
});