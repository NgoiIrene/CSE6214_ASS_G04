import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabaseClient';

import DeliveryNavigator from './screens/deliveryman/deliveryNavigator';
import VendorNavigator from './screens/vendor/vendornavigetor';
import AdminNavigator from './screens/admin/admin_Navigation';
import UserNavigator from './screens/user/user_Navigation';
// import CustomerNavigator from './customerNavigator'; 
// import VendorNavigator from './vendorNavigator'; 

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

  useEffect(() => {
    setFullName(''); setSignUpEmail(''); setAccountType(''); setPhoneNumber('');
    setGender(''); setAge(''); setSignUpPassword(''); setConfirmPassword('');
  }, [currentPage]);

  // ⚡ 注册逻辑
  const handleSignUpSubmit = async () => {
    if (signUpPassword !== confirmPassword) return Alert.alert("Error", "Passwords don't match!");

    setIsLoading(true);
    isSigningUpFlag = true; // 🔴 亮起红灯：正在注册中，大管家不要监听状态变化！

    // 1. Supabase 账号注册
    const { data, error } = await supabase.auth.signUp({ email: signUpEmail, password: signUpPassword });

    if (error) {
      setIsLoading(false);
      isSigningUpFlag = false; // 🟢 发生错误，恢复绿灯
      return Alert.alert("Error", error.message);
    }

    // 2. 存入 Profile 资料
    if (data.user) {
      const { error: dbError } = await supabase.from('profiles').insert([{
        id: data.user.id,
        email: signUpEmail,
        full_name: fullName,
        account_type: accountType,
        phone_number: phoneNumber,
        gender: gender,
        age: parseInt(age) || 0
      }]);

      if (dbError) {
        setIsLoading(false);
        isSigningUpFlag = false; // 🟢 发生错误，恢复绿灯
        return Alert.alert("Data Save Failed", dbError.message);
      }
    }

    // 3. 强制登出（因为这时候还没切页面，用户完全察觉不到）
    await supabase.auth.signOut();

    setIsLoading(false);
    isSigningUpFlag = false; // 🟢 注册全套流程完毕，恢复绿灯！

    Alert.alert("Success", "Registration Complete! Please log in.");
    setCurrentPage('login'); // 稳稳地停留在当前页面，切回 Login 表单
  };

  // ⚡ 登录逻辑
  const handleLoginSubmit = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setIsLoading(false);

    if (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const getHeaderTitle = () => currentPage === 'login' ? 'Log In' : 'Sign Up';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>
      <View style={styles.divider} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {currentPage === 'login' && (
            <View style={styles.wireframeCard}>
              <View style={styles.wireframeInputRow}>
                <Text style={styles.wireframeLabel}>Email:</Text>
                <TextInput style={styles.input} value={loginEmail} onChangeText={setLoginEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View style={styles.wireframeInputRow}>
                <Text style={styles.wireframeLabel}>Password:</Text>
                <TextInput style={styles.input} value={loginPassword} onChangeText={setLoginPassword} secureTextEntry />
              </View>
              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleLoginSubmit} disabled={isLoading}>
                <Text style={styles.wireframeSubmitBtnText}>{isLoading ? 'Loading...' : 'Login'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentPage('signup')} style={{ marginTop: 20 }}>
                <Text style={styles.linkTextUnderline}>No account? Sign Up</Text>
              </TouchableOpacity>
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
                  <Picker.Item label="DeliveryMan" value="delivery" />
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
                <Text style={styles.linkTextUnderline}>Already have an account? Log In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ==================== 2. ROOT NAVIGATOR ====================
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
      // 🌟 拦截器：如果正在执行 Signup 流程，无视任何登录通知！
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
      .select('account_type,status')
      .eq('id', userId)
      .single();

    if (!error && data) {
      const dbStatus = data.status ? data.status.toLowerCase().trim() : 'active';
      const dbRole = data.account_type ? data.account_type.toLowerCase().trim() : '';

      // 2. 状态判断：【把 Blocked 和 Deleted 分开】
      if (dbStatus === 'blocked') {
        setUserRole('BLOCKED');
      } else if (dbStatus === 'deleted') {
        setUserRole('DELETED');
      } else {
        // 3. 智能兼容角色名
        if (dbRole === 'user' || dbRole === 'customer') {
          setUserRole('user(customer)');
        } else {
          setUserRole(dbRole);
        }
      }
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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !userRole ? (
          // 🌟 缓冲页面：拿到了 session 但还没拿到 role 时，给一个加载动画，而不是直接丢 Error
          <Stack.Screen name="RoleCheck">
            {() => (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={{ marginTop: 15, fontWeight: 'bold', fontSize: 16 }}>Verifying Account...</Text>
              </View>
            )}
          </Stack.Screen>
        ) : (
          <>
            {userRole === 'delivery' && <Stack.Screen name="DeliveryRoot" component={DeliveryNavigator} />}
            {userRole === 'user(customer)' && <Stack.Screen name="CustomerRoot" component={UserNavigator} />}
            {userRole === 'vendor' && <Stack.Screen name="VendorRoot" component={VendorNavigator} />}
            {userRole === 'admin' && <Stack.Screen name="AdminRoot" component={AdminNavigator} />}

{/* 🌟 拦截情况 1：账号被 Block 了 */}
            {userRole === 'BLOCKED' && (
              <Stack.Screen name="Blocked">
                {() => (
                  <View style={styles.centerContainer}>
                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18, textAlign: 'center', paddingHorizontal: 20 }}>
                      Error: your account have been blocked within 30 days
                    </Text>
                    <TouchableOpacity 
                      style={styles.wireframeSubmitBtn} 
                      onPress={async () => {
                        await supabase.auth.signOut();
                        setSession(null);
                        setUserRole(null);
                      }}
                    >
                      <Text style={styles.wireframeSubmitBtnText}>Log Out</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Stack.Screen>
            )}

            {/* 🌟 拦截情况 2：账号被 Delete 了 */}
            {userRole === 'DELETED' && (
              <Stack.Screen name="Deleted">
                {() => (
                  <View style={styles.centerContainer}>
                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18, textAlign: 'center', paddingHorizontal: 20 }}>
                      Error: your account have been deleted
                    </Text>
                    <TouchableOpacity 
                      style={styles.wireframeSubmitBtn} 
                      onPress={async () => {
                        await supabase.auth.signOut();
                        setSession(null);
                        setUserRole(null);
                      }}
                    >
                      <Text style={styles.wireframeSubmitBtnText}>Log Out</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Stack.Screen>
            )}

            {/* 🌟 拦截情况 3：账号没被 Block 也没被 Delete，但是角色填错了 */}
            {userRole !== 'BLOCKED' && userRole !== 'DELETED' && !['delivery', 'user(customer)', 'vendor', 'admin'].includes(userRole) && (
              <Stack.Screen name="InvalidRole">
                {() => (
                  <View style={styles.centerContainer}>
                    <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>
                      Error: Invalid Role ({userRole})
                    </Text>
                    <Text style={{ marginTop: 10, paddingHorizontal: 30, textAlign: 'center', color: '#666' }}>
                      System doesn't recognize this role. Please ask Admin to edit this account's role to: user(customer), vendor, delivery, or admin.
                    </Text>
                    <TouchableOpacity 
                      style={styles.wireframeSubmitBtn} 
                      onPress={async () => {
                        await supabase.auth.signOut();
                        setSession(null);
                        setUserRole(null);
                      }}
                    >
                      <Text style={styles.wireframeSubmitBtnText}>Log Out</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Stack.Screen>
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
  header: { padding: 20, flexDirection: 'row', justifyContent: 'center', paddingTop: Platform.OS === 'ios' ? 10 : 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  divider: { height: 2, backgroundColor: '#000' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  wireframeCard: { borderWidth: 1.5, borderColor: '#000', padding: 25, width: '100%', marginTop: 10, backgroundColor: '#fff' },
  wireframeInputRow: { marginBottom: 15 },
  wireframeLabel: { fontWeight: 'bold', marginBottom: 8, fontSize: 13 },

  input: { borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 15, paddingVertical: 12, marginBottom: 18, backgroundColor: '#fff', fontSize: 14 },
  pickerContainerEdge: { borderWidth: 1.5, borderColor: '#000', marginBottom: 18, height: 50, justifyContent: 'center' },

  wireframeSubmitBtn: { borderWidth: 1.5, borderColor: '#000', padding: 15, alignItems: 'center', marginTop: 10, backgroundColor: '#fff' },
  wireframeSubmitBtnText: { fontWeight: 'bold', color: '#000', fontSize: 15 },
  linkTextUnderline: { textDecorationLine: 'underline', textAlign: 'center', color: '#000', fontSize: 13 },

  radioContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#000', backgroundColor: '#000' },
  radioInner: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#FFF' }
});