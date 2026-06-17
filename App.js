import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabaseClient'; // 确保此文件路径正确

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

  // 状态定义
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [accountType, setAccountType] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 清空注册表单的辅助函数
  const clearForm = () => {
    setFullName('');
    setSignUpEmail('');
    setAccountType('');
    setPhoneNumber('');
    setGender('');
    setAge('');
    setSignUpPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    // 当 currentPage 发生变化时，执行清空
    clearForm();
  }, [currentPage]);

  // ⚡ 登录
  // const handleLoginSubmit = async () => {
  //   setIsLoading(true);
  //   const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
  //   setIsLoading(false);
  //   if (error) return Alert.alert("Error", error.message);
  //   Alert.alert("Success", "Login Successful!");
  // };

  // ⚡ 注册
  const handleSignUpSubmit = async () => {
    if (signUpPassword !== confirmPassword) return Alert.alert("Error", "Passwords don't match!");
    setIsLoading(true);

    // 1. 注册账号
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword
    });

    if (error) {
      setIsLoading(false);
      return Alert.alert("Error", error.message);
    }

    // 2. 注册成功后，存入 profiles 表 (添加了 email 字段)
    if (data.user) {
      const { error: dbError } = await supabase.from('profiles').insert([{
        id: data.user.id,
        email: signUpEmail, // <--- 新增这行，将邮箱存入数据库
        full_name: fullName,
        account_type: accountType,
        phone_number: phoneNumber,
        gender: gender,     // 确保你的 radio button 逻辑已更新 state
        age: parseInt(age) || 0
      }]);

      if (dbError) {
        setIsLoading(false);
        console.log("Database insertion error:", dbError);
        return Alert.alert("Data Save Failed", dbError.message);
      }
    }

    setIsLoading(false);
    Alert.alert("Success", "Registration Complete!");
    setCurrentPage('login');
  };

  const handleLoginSubmit = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword
    });

    setIsLoading(false);

    if (error) {
      console.log("Login failed details:", error); // ✅ Check terminal for error
      Alert.alert("Login Failed", error.message);
      return;
    }

    // If successful
    Alert.alert("Success", "Login Successful!");
    navigateToScreen?.('order');
  };

  const getHeaderTitle = () => {
    if (currentPage === 'login') return 'Log In';
    if (currentPage === 'signup') return 'Sign Up';
    return 'Reset Password';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {currentPage === 'login' && (
            <View style={styles.wireframeCard}>
              <View style={styles.wireframeInputRow}>
                <Text style={styles.wireframeLabel}>Email:</Text>
                <TextInput style={styles.wireframeInputInline} value={loginEmail} onChangeText={setLoginEmail} autoCapitalize="none" />
              </View>
              <View style={styles.wireframeInputRow}>
                <Text style={styles.wireframeLabel}>Password:</Text>
                <TextInput style={styles.wireframeInputInline} value={loginPassword} onChangeText={setLoginPassword} secureTextEntry />
              </View>
              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleLoginSubmit}>
                <Text style={styles.wireframeSubmitBtnText}>{isLoading ? '...' : 'Login'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentPage('signup')} style={{ marginTop: 15 }}>
                <Text style={styles.linkTextUnderline}>No account? Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentPage === 'signup' && (
            <View style={styles.wireframeCard}>
              <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
              <TextInput style={styles.input} placeholder="Email" value={signUpEmail} onChangeText={setSignUpEmail} autoCapitalize="none" />

              <View style={styles.pickerContainerEdge}>
                <Picker selectedValue={accountType} onValueChange={setAccountType}>
                  <Picker.Item label="Account Type" value="" />
                  <Picker.Item label="User(Customer)" value="user(customer)" />
                  <Picker.Item label="Vendor" value="vendor" />
                  <Picker.Item label="
                   Man" value="delivery" />
                </Picker>
              </View>

              {/* ⚡ Gender Radio Button 模拟 */}
              <Text style={styles.wireframeLabel}>Gender:</Text>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                {['male', 'female'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}
                    onPress={() => setGender(item)}
                  >
                    <View style={[styles.radioOuter, gender === item && styles.radioSelected]}>
                      {gender === item && <View style={styles.radioInner} />}
                    </View>
                    <Text style={{ textTransform: 'capitalize' }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={styles.input} placeholder="Phone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Password" value={signUpPassword} onChangeText={setSignUpPassword} secureTextEntry />
              <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleSignUpSubmit}>
                <Text style={styles.wireframeSubmitBtnText}>{isLoading ? '...' : 'Signup'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  divider: { height: 2, backgroundColor: '#000' },
  scrollContainer: { padding: 20 },
  wireframeCard: { borderWidth: 1.5, borderColor: '#000', padding: 20, marginTop: 20 },
  wireframeInputRow: { marginBottom: 15 },
  wireframeLabel: { fontWeight: 'bold', marginBottom: 5 },
  wireframeInputInline: { borderWidth: 1.5, borderColor: '#000', padding: 10, marginBottom: 10 },
  input: { borderWidth: 1.5, borderColor: '#000', padding: 10, marginBottom: 10 },
  pickerContainerEdge: { borderWidth: 1.5, borderColor: '#000', marginBottom: 10 },
  wireframeSubmitBtn: { borderWidth: 1.5, borderColor: '#000', padding: 15, alignItems: 'center', marginTop: 10 },
  wireframeSubmitBtnText: { fontWeight: 'bold' },
  linkTextUnderline: { textDecorationLine: 'underline', textAlign: 'center' },
  radioOuter: {
    height: 20, width: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#000', marginRight: 8, justifyContent: 'center', alignItems: 'center'
  },
  radioSelected: { borderColor: '#000' },
  radioInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#000' },
});

