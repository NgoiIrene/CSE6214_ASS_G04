import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import 'react-native-url-polyfill/auto';
import { supabase } from '../../supabaseClient';

export default function AdminProfileScreen({ onProfileUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    email: '', 
    phone_number: '',
    gender: 'Female',
    age: '',
    account_type: 'admin', 
    avatar_url: null
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

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id, full_name, account_type, phone_number, gender, age, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (dbError) throw dbError;

      if (data) {
        const fetchedData = {
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || user.email,
          phone_number: data.phone_number || '',
          gender: data.gender || 'Female',
          age: data.age ? String(data.age) : '',
          account_type: data.account_type || 'admin',
          avatar_url: data.avatar_url || null
        };
        setProfile(fetchedData);
        setPendingProfile(fetchedData);
      }
    } catch (error) {
     console.error("Save Error Details:", error);
      // 🌟 将错误对象转成字符串，直接在手机上弹窗显示，方便我们诊断
      Alert.alert(
        "报错详情请看这里", 
        JSON.stringify(error, null, 2) || error.message
      );
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
      quality: 0.5, // 建议把画质调成 0.5，减小图片体积，加快上传速度
    });
    
    if (!result.canceled) {
      // 此时存的还是 file:/// 本地路径，等点击 Save 时再去上传
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
      let finalAvatarUrl = pendingProfile.avatar_url;

<<<<<<< HEAD

      if (finalAvatarUrl && finalAvatarUrl.startsWith('file://')) {
        
=======
      // 🌟 新增的图片上传逻辑
      if (finalAvatarUrl && finalAvatarUrl.startsWith('file://')) {
        
        // 1. 使用 FileSystem 读取本地图片为 Base64
       const base64 = await FileSystem.readAsStringAsync(finalAvatarUrl, {
          encoding: 'base64',
        });
        
        // 2. 生成一个唯一的文件名
>>>>>>> 4ef8f30d0f0693d48eabed19c8f5745e8a450408
        const fileExt = finalAvatarUrl.split('.').pop() || 'jpeg';
        const mimeType = fileExt.toLowerCase() === 'jpg' ? 'jpeg' : fileExt.toLowerCase(); 
        const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
        const filePath = `admin_avatars/${fileName}`;

<<<<<<< HEAD
       
        const formData = new FormData();
        formData.append('file', {
          uri: finalAvatarUrl,
          name: fileName,
          type: `image/${mimeType}`
        });

     
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, formData, {
             cacheControl: '3600',
             upsert: false 
=======
        // 3. 使用 decode 将 Base64 转为 ArrayBuffer 并上传
        const { error: uploadError } = await supabase.storage
          .from('avatars') 
          .upload(filePath, decode(base64), {
            contentType: `image/${fileExt}`,
            upsert: true
>>>>>>> 4ef8f30d0f0693d48eabed19c8f5745e8a450408
          });

        if (uploadError) {
          console.log("Supabase Upload Error:", uploadError);
          throw new Error("图片上传到服务器失败: " + uploadError.message);
        }

    
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        finalAvatarUrl = publicUrlData.publicUrl;
      } 
      // ⚠️ 很多时候就是不小心删掉了上面这个闭合 if 语句的大括号！

     
      const { error: dbUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: pendingProfile.full_name.trim(),
          phone_number: pendingProfile.phone_number.trim(),
          gender: pendingProfile.gender,
          age: pendingProfile.age ? parseInt(pendingProfile.age, 10) : null,
          avatar_url: finalAvatarUrl, 
        })
        .eq('id', profile.id);

      if (dbUpdateError) throw dbUpdateError;

     
      const updatedProfile = { ...pendingProfile, avatar_url: finalAvatarUrl };
      setProfile(updatedProfile);
      setPendingProfile(updatedProfile);
      
      Alert.alert("Success", "Admin Profile updated successfully!");
      setIsEditMode(false);

      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error("Save Error:", error);
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
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={styles.content}>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={isEditMode ? handleCancelEdit : handleStartEdit}>
          <Text style={styles.actionText}>{isEditMode ? "Cancel" : "Edit Profile"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.wireframeCard}>
        <TouchableOpacity disabled={!isEditMode} onPress={pickAvatar} style={styles.avatarBox}>
          {isEditMode ? (
            pendingProfile.avatar_url ? <Image source={{ uri: pendingProfile.avatar_url }} style={styles.avatarImage} /> : <Ionicons name="person" size={50} />
          ) : (
            profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <Ionicons name="person" size={50} />
          )}
          {isEditMode && <View style={styles.editBadge}><Ionicons name="camera" size={16} color="#fff" /></View>}
        </TouchableOpacity>
        
        <View style={styles.inputRow}>
          <Text style={styles.label}>ADMIN FULL NAME:</Text>
          {isEditMode ? (
            <TextInput style={styles.input} value={pendingProfile.full_name} onChangeText={(v) => setPendingProfile({...pendingProfile, full_name: v})} />
          ) : (
            <Text style={styles.valueText}>{profile.full_name || '—'}</Text>
          )}
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>ADMIN EMAIL (READ-ONLY):</Text>
          <Text style={[styles.valueText, isEditMode && styles.readOnlyText]}>{profile.email || '—'}</Text>
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>PHONE NUMBER:</Text>
          {isEditMode ? (
            <TextInput style={styles.input} keyboardType="phone-pad" value={pendingProfile.phone_number} onChangeText={(v) => setPendingProfile({...pendingProfile, phone_number: v})} />
          ) : (
            <Text style={styles.valueText}>{profile.phone_number || '—'}</Text>
          )}
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>GENDER:</Text>
          {isEditMode ? (
            <View style={styles.genderContainer}>
              <TouchableOpacity 
                style={[styles.genderOption, pendingProfile.gender === 'Male' && styles.genderSelected]} 
                onPress={() => setPendingProfile({...pendingProfile, gender: 'Male'})}
              >
                <Text style={[styles.genderText, pendingProfile.gender === 'Male' && styles.genderTextSelected]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.genderOption, pendingProfile.gender === 'Female' && styles.genderSelected]} 
                onPress={() => setPendingProfile({...pendingProfile, gender: 'Female'})}
              >
                <Text style={[styles.genderText, pendingProfile.gender === 'Female' && styles.genderTextSelected]}>Female</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.valueText}>{profile.gender || '—'}</Text>
          )}
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>AGE:</Text>
          {isEditMode ? (
            <TextInput style={styles.input} keyboardType="number-pad" value={pendingProfile.age} onChangeText={(v) => setPendingProfile({...pendingProfile, age: v})} />
          ) : (
            <Text style={styles.valueText}>{profile.age || '—'}</Text>
          )}
        </View>

        {isEditMode && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={{ fontWeight: 'bold' }}>Save Admin Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
});