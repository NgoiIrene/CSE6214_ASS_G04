import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons'; 
import emailjs from '@emailjs/react-native'; 
import { supabase } from './supabaseClient';

import DeliveryNavigator from './screens/deliveryman/deliveryNavigator';
import VendorNavigator from './screens/vendor/vendornavigetor';
import AdminNavigator from './screens/admin/admin_Navigation';
import UserNavigator from './screens/user/user_Navigation';

const Stack = createNativeStackNavigator();

// 🌟 核心防闪烁机制：红绿灯标志
let isSigningUpFlag = false;

// ==================== 1. 登录与注册页面 (Auth Screen) ====================
const AuthScreen = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

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

  const [resetEmail, setResetEmail] = useState('');
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState(''); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const EMAILJS_SERVICE_ID = 'service_cfa71kb';       
  const EMAILJS_TEMPLATE_ID = 'template_4lhl9wd';     
  const EMAILJS_PUBLIC_KEY = 'IWTAe2ZuqgcQdTyX_';     

  useEffect(() => {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }, []);

  useEffect(() => {
    if (currentPage === 'login' || currentPage === 'signup') {
      setResetEmail(''); setPin(''); setGeneratedPin(''); setNewPassword(''); setConfirmNewPassword('');
    }
    if (currentPage === 'login') {
      setFullName(''); setSignUpEmail(''); setAccountType(''); setPhoneNumber('');
      setGender(''); setAge(''); setSignUpPassword(''); setConfirmPassword('');
    }
  }, [currentPage]);

  const handleSignUpSubmit = async () => {
    if (!fullName || !signUpEmail || !accountType || !phoneNumber || !gender || !age || !signUpPassword || !confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields!");
    }
    if (signUpPassword !== confirmPassword) return Alert.alert("Error", "Passwords don't match!");

    setIsLoading(true);
    isSigningUpFlag = true;

    const { data, error } = await supabase.auth.signUp({ email: signUpEmail, password: signUpPassword });

    if (error) {
      setIsLoading(false);

      isSigningUpFlag = false; // 🟢 发生错误，恢复绿灯
      //return Alert.alert("Error", error.message);
      console.error("Signup Raw Error: ", error); // 在终端打印完整错误，方便追踪
return Alert.alert("Error", error?.message || "An unexpected server error occurred.");
    }

    if (data.user) {
      const { error: dbError } = await supabase.from('profiles').insert([{
        id: data.user.id, email: signUpEmail, full_name: fullName, account_type: accountType,
        phone_number: phoneNumber, gender: gender, age: parseInt(age) || 0
      }]);

      if (dbError) {
        setIsLoading(false);
        isSigningUpFlag = false;
        return Alert.alert("Data Save Failed", dbError.message);
      }
    }

    await supabase.auth.signOut();
    setIsLoading(false);
    isSigningUpFlag = false;
    Alert.alert("Success", "Registration Complete! Please log in.");
    setCurrentPage('login');
  };

  const handleLoginSubmit = async () => {
    if (!loginEmail || !loginPassword) return Alert.alert("Error", "Please enter email and password!");
    
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setIsLoading(false);

    if (error) Alert.alert("Login Failed", error.message);
  };

  const handleVerifyEmail = async () => {
    const userEmail = resetEmail.trim();
    if (!userEmail) return Alert.alert("Error", "Please enter your email address first!");

    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(randomPin); 
    setIsLoading(true);

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { email: userEmail, reply_pin: randomPin });
      Alert.alert("Email Sent! 📩", `A verification email has been sent to:\n${userEmail}`);
    } catch (error) {
      Alert.alert("Error", "Failed to send email. Please check your network.");
    } finally {
      setIsLoading(false); 
    }
  };

  const handleContinueReset = () => {
    const enteredEmail = resetEmail.trim();
    const enteredPin = pin.trim();

    if (!enteredEmail || !enteredPin) return Alert.alert("Error", "Please fill in both Email and Verification PIN!");
    if (!generatedPin || enteredPin !== generatedPin) return Alert.alert("Verification Failed ❌", "The PIN code is incorrect.");
    
    setCurrentPage('reset_step2'); 
  };

  const handleFinalReset = async () => {
    if (!newPassword || !confirmNewPassword) return Alert.alert("Error", "Please fill in all fields!");
    if (newPassword !== confirmNewPassword) return Alert.alert("Error", "Passwords do not match!");

    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return Alert.alert("Weak Password ❌", "Password must be at least 8 characters long and contain uppercase letters, numbers, and at least one special character!");
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('reset_user_password_by_email', {
        target_email: resetEmail.trim(), new_password: newPassword
      });

      if (error) throw error;

      if (data === 'Success') {
        Alert.alert("Success ✅", "Password reset successful! You can now log in.", [
          { text: "OK", onPress: () => setCurrentPage('login') } 
        ]);
      } else {
        Alert.alert("Error ❌", data || "User reset failed.");
      }
    } catch (error) {
      Alert.alert("Error ❌", error.message || "Failed to update password.");
    } finally {
      setIsLoading(false); 
    }
  };

  const getHeaderTitle = () => {
    if (currentPage === 'login') return 'Log In';
    if (currentPage === 'signup') return 'Sign Up';
    if (currentPage === 'reset_step1') return 'Verification';
    return 'Reset Password';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {currentPage === 'reset_step2' ? (
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => setCurrentPage('reset_step1')}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
        ) : <View style={{ width: 32 }} />}
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {currentPage === 'login' && (
            <View style={styles.wireframeCard}>
              <View style={styles.wireframeInputRow}>
                <Text style={styles.wireframeLabel}>Email address:</Text>
                <TextInput style={styles.input} value={loginEmail} onChangeText={setLoginEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View style={styles.wireframeInputRow}>
                <Text style={styles.wireframeLabel}>Password:</Text>
                <TextInput style={styles.input} value={loginPassword} onChangeText={setLoginPassword} secureTextEntry />
              </View>
              
              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleLoginSubmit} disabled={isLoading}>
                <Text style={styles.wireframeSubmitBtnText}>{isLoading ? 'Loading...' : 'Login'}</Text>
              </TouchableOpacity>

              <View style={styles.linksRow}>
                <TouchableOpacity onPress={() => setCurrentPage('reset_step1')}><Text style={styles.linkTextUnderline}>Forgot Password</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setCurrentPage('signup')}><Text style={styles.linkTextUnderline}>Sign Up</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {currentPage === 'signup' && (
            <View style={styles.wireframeCard}>
              <Text style={styles.wireframeLabel}>Full Name:</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
              <Text style={styles.wireframeLabel}>Email:</Text>
              <TextInput style={styles.input} value={signUpEmail} onChangeText={setSignUpEmail} autoCapitalize="none" keyboardType="email-address" />
              <Text style={styles.wireframeLabel}>Account Type:</Text>
              <View style={styles.pickerContainerEdge}>
                <Picker selectedValue={accountType} onValueChange={setAccountType}>
                  <Picker.Item label="--- Select ---" value="" color="#999" />
                  <Picker.Item label="User(Customer)" value="user(customer)" />
                  <Picker.Item label="Vendor" value="vendor" />
                  <Picker.Item label="Delivery Man" value="delivery" />
                </Picker>
              </View>
              <Text style={styles.wireframeLabel}>Gender:</Text>
              <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                {['male', 'female'].map((item) => (
                  <TouchableOpacity key={item} style={styles.radioContainer} onPress={() => setGender(item)}>
                    <View style={[styles.radioOuter, gender === item && styles.radioSelected]}>
                      {gender === item && <View style={styles.radioInner} />}
                    </View>
                    <Text style={{ textTransform: 'capitalize', fontWeight: '500' }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.wireframeLabel}>Phone Number:</Text>
              <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
              <Text style={styles.wireframeLabel}>Age:</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
              <Text style={styles.wireframeLabel}>Password:</Text>
              <TextInput style={styles.input} value={signUpPassword} onChangeText={setSignUpPassword} secureTextEntry />
              <Text style={styles.wireframeLabel}>Confirm Password:</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleSignUpSubmit} disabled={isLoading}>
                <Text style={styles.wireframeSubmitBtnText}>{isLoading ? 'Processing...' : 'Signup'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentPage('login')} style={{ marginTop: 20 }}>
                <Text style={[styles.linkTextUnderline, { textAlign: 'center' }]}>Already have an account? Log In</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentPage === 'reset_step1' && (
            <View style={styles.wireframeCard}>
              <Text style={styles.wireframeLabel}>Email address:</Text>
              <View style={styles.verifyRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={resetEmail} onChangeText={setResetEmail} autoCapitalize="none" keyboardType="email-address" />
                <TouchableOpacity style={styles.wireframeVerifyBtn} onPress={handleVerifyEmail} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeVerifyBtnText}>Verify</Text>}
                </TouchableOpacity>
              </View>
              <Text style={[styles.wireframeLabel, { marginTop: 18 }]}>Verification Pin:</Text>
              <TextInput style={[styles.input, { width: 140 }]} value={pin} onChangeText={setPin} keyboardType="numeric" maxLength={6} placeholder="6-digit" />

              <TouchableOpacity style={[styles.wireframeSubmitBtn, { marginTop: 10 }]} onPress={handleContinueReset}>
                <Text style={styles.wireframeSubmitBtnText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentPage('login')} style={{ marginTop: 20 }}>
                <Text style={[styles.linkTextUnderline, { textAlign: 'center' }]}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentPage === 'reset_step2' && (
            <View style={styles.wireframeCard}>
              <Text style={styles.wireframeLabel}>New Password:</Text>
              <TextInput style={styles.input} secureTextEntry={true} value={newPassword} onChangeText={setNewPassword} placeholder="Upper + Num + Symbol" placeholderTextColor="#999" />
              <Text style={styles.wireframeLabel}>Confirm Password:</Text>
              <TextInput style={styles.input} secureTextEntry={true} value={confirmNewPassword} onChangeText={setConfirmNewPassword} />

              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleFinalReset} disabled={isLoading}>
                {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeSubmitBtnText}>Reset Password</Text>}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ==================== 🌟 2. 独立出来的加载和错误组件 ====================
const RoleCheckScreen = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#000" />
    <Text style={{ marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>Verifying Account...</Text>
  </View>
);

const ErrorScreen = () => (
  <View style={styles.centerContainer}>
    <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>Error: Invalid Role.</Text>
    <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={() => supabase.auth.signOut()}>
      <Text style={styles.wireframeSubmitBtnText}>Log Out</Text>
    </TouchableOpacity>
  </View>
);

// ==================== 3. ROOT NAVIGATOR ====================
export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else setIsAppLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isSigningUpFlag) return;
      setSession(session);
      if (session) {
        setIsAppLoading(true);
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsAppLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('account_type, status') // 🌟 1. 这里加上 status，把它一起查出来
      .eq('id', userId)
      .single();

    if (!error && data) {
      // 🌟 2. 核心拦截逻辑：检查状态
      if (data.status === 'Blocked') {
        // 发现被封禁，立刻执行登出，清除 session
        await supabase.auth.signOut();
        // 弹窗警告
        Alert.alert(
          "Account Suspended ❌", 
          "Your account has been blocked by the administrator. Please contact support."
        );
        // 清空角色状态，让他回到登录页
        setUserRole(null); 
      } else {
        // 正常用户，赋予对应的身份，放行进入 App
        setUserRole(data.account_type);
      }

      if (data.status === 'Deleted') {
        // 发现被封禁，立刻执行登出，清除 session
        await supabase.auth.signOut();
        // 弹窗警告
        Alert.alert(
          "Account deleted ❌", 
          "Your account has been delete by the administrator. Please contact support."
        );
        // 清空角色状态，让他回到登录页
        setUserRole(null); 
      } else {
        // 正常用户，赋予对应的身份，放行进入 App
        setUserRole(data.account_type);
      }
      
    } else {
      // 如果查询出错或找不到资料，确保设为空
      setUserRole(null);
    }
    setIsAppLoading(false);
  };

  if (isAppLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Loading Campus App...</Text>
      </View>
    );
  }

  // 🌟 干净整洁，绝对不会报语法错误的 Navigator
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !userRole ? (
          <Stack.Screen name="RoleCheck" component={RoleCheckScreen} />
        ) : (
          <>
            {userRole === 'delivery' && <Stack.Screen name="DeliveryRoot" component={DeliveryNavigator} />}
            {userRole === 'user(customer)' && <Stack.Screen name="CustomerRoot" component={UserNavigator} />}
            {userRole === 'vendor' && <Stack.Screen name="VendorRoot" component={VendorNavigator} />}
            {userRole === 'admin' && <Stack.Screen name="AdminRoot" component={AdminNavigator} />}

            {!['delivery', 'user(customer)', 'vendor', 'admin'].includes(userRole) && (
              <Stack.Screen name="Error" component={ErrorScreen} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 15 : 40 },
  headerBackBtn: { width: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#000', borderRadius: 6, padding: 2 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  divider: { height: 2, backgroundColor: '#000' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  wireframeCard: { borderWidth: 1.5, borderColor: '#000', padding: 25, width: '100%', marginTop: 10, backgroundColor: '#fff' },
  wireframeInputRow: { marginBottom: 15 },
  wireframeLabel: { fontWeight: 'bold', marginBottom: 8, fontSize: 13 },

  input: { borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 15, paddingVertical: 12, marginBottom: 18, backgroundColor: '#fff', fontSize: 14 },
  pickerContainerEdge: { borderWidth: 1.5, borderColor: '#000', marginBottom: 18, height: 50, justifyContent: 'center' },

  verifyRow: { flexDirection: 'row', alignItems: 'center' },
  wireframeVerifyBtn: { borderWidth: 1.5, borderColor: '#000', width: 75, height: 46, justifyContent: 'center', alignItems: 'center', marginLeft: 10, backgroundColor: '#fff' },
  wireframeVerifyBtnText: { fontSize: 13, color: '#000', fontWeight: 'bold' },

  wireframeSubmitBtn: { borderWidth: 1.5, borderColor: '#000', padding: 15, alignItems: 'center', marginTop: 10, backgroundColor: '#fff', marginBottom: 15 },
  wireframeSubmitBtnText: { fontWeight: 'bold', color: '#000', fontSize: 15 },
  
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 5 },
  linkTextUnderline: { textDecorationLine: 'underline', color: '#000', fontSize: 13, fontWeight: '500' },

  radioContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#000', backgroundColor: '#000' },
  radioInner: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#FFF' }
});