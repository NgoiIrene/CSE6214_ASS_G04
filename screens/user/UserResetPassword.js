import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import emailjs from '@emailjs/react-native';

// 🌟 引入你的 Supabase 和 User 全局状态
import { supabase } from '../../supabaseClient'; 
import { UserContext } from './UserContext';

// 接收 onOpenMenu 参数（从 Sidebar 进来时会传）
export default function UserResetPassword({ onOpenMenu }) {
  const navigation = useNavigation();
  const { profile } = useContext(UserContext); // 获取用户信息（非必须，因为重置密码可能未登录）

  const [step, setStep] = useState(1);                     
  const [isLoading, setIsLoading] = useState(false); 

  // 表单输入状态
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🛠️ EmailJS 凭证 (复用 Delivery 端的)
  const EMAILJS_SERVICE_ID = 'service_cfa71kb';       
  const EMAILJS_TEMPLATE_ID = 'template_4lhl9wd';     
  const EMAILJS_PUBLIC_KEY = 'IWTAe2ZuqgcQdTyX_';     

  useEffect(() => {
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
    });
  }, []);

  const resetAllFields = () => {
    setStep(1);
    setEmail('');
    setPin('');
    setGeneratedPin('');
    setPassword('');
    setConfirmPassword('');
  };

  // ⚡ 1. 发送验证码邮件
  const handleVerify = async () => {
    const userEmail = email.trim();
    if (!userEmail) {
      Alert.alert("Error", "Please enter your email address first!");
      return;
    }

    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(randomPin); 
    setIsLoading(true);

    const templateParams = {
      email: userEmail,      
      reply_pin: randomPin,   
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      Alert.alert("Email Sent Successfully! 📩", `A verification email has been sent to:\n${userEmail}\n\nPlease check your inbox!`);
    } catch (error) {
      console.log('EmailJS Error:', error);
      Alert.alert("Mail Delivery Error", "Failed to send email. Please check your network.");
    } finally {
      setIsLoading(false); 
    }
  };

  // ⚡ 2. 验证 PIN 码
  const handleContinue = () => {
    const enteredEmail = email.trim();
    const enteredPin = pin.trim();

    if (!enteredEmail || !enteredPin) {
      Alert.alert("Error", "Please fill in both Email and Verification PIN!");
      return;
    }

    if (!generatedPin || enteredPin !== generatedPin) {
      Alert.alert("Verification Failed ❌", "The PIN code you entered is incorrect. Please try again.");
      return; 
    }
    
    setStep(2); 
  };

  // ⚡ 3. 重置密码 (调用 Supabase RPC)
  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      Alert.alert("Weak Password ❌", "Password must be at least 8 characters long and contain uppercase letters, numbers, and at least one special character!");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('reset_user_password_by_email', {
        target_email: email.trim(),
        new_password: password
      });

      if (error) throw error;

      if (data === 'Success') {
        Alert.alert("Success ✅", "Password reset successful!", [
          { 
            text: "OK", 
            onPress: () => { 
              resetAllFields(); 
              // 判断：如果是从登录页来的，就返回 Login；如果是在 App 内，就回 Home
              if (onOpenMenu) {
                // 如果存在 onOpenMenu，说明是在 MainLayout 里
                navigation.navigate('Home'); 
              } else {
                // 如果不存在，说明是在未登录的 Login Stack 里
                navigation.goBack();
              }
            } 
          } 
        ]);
      } else {
        Alert.alert("Error ❌", data || "User reset failed.");
      }

    } catch (error) {
      console.log('Supabase RPC Error:', error.message);
      Alert.alert("Error ❌", error.message || "Failed to update password.");
    } finally {
      setIsLoading(false); 
    }
  };

  // 动态处理左上角按钮点击事件
  const handleTopLeftPress = () => {
    if (step === 2) {
      setStep(1); // 步骤 2 时，固定返回步骤 1
    } else if (onOpenMenu) {
      onOpenMenu(); // 步骤 1 且已登录：打开侧边栏
    } else {
      navigation.goBack(); // 步骤 1 且未登录：返回 Login 页面
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 区分是否有导航栏传来的 paddingTop (处理未登录页和已登录页的差异) */}
      {!onOpenMenu && <View style={{ height: Platform.OS === 'ios' ? 10 : 40, backgroundColor: '#FFF' }} />}

      {/* ==================== 顶部导航栏 ==================== */}
      <View style={[styles.header, onOpenMenu && { borderBottomWidth: 2, borderColor: '#000' }]}>
        <TouchableOpacity style={styles.menuIconBox} onPress={handleTopLeftPress} activeOpacity={0.7}>
          <View style={styles.menuIconBorder}>
            {/* 动态图标：步骤2或从Login来时显示返回箭头，否则显示汉堡菜单 */}
            <Ionicons 
              name={(step === 2 || !onOpenMenu) ? "arrow-back" : "menu"} 
              size={26} color="black" 
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 1 ? "VERIFICATION" : "RESET PASSWORD"}</Text>
        <View style={{ width: 40, marginLeft: 15 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.wireframeCard}>
            
            {/* STEP 1: Email 验证界面 */}
            {step === 1 && (
              <View style={{ width: '100%' }}>
                <View style={styles.wireframeInputRow}>
                  <View style={styles.inlineFieldRow}>
                    <Text style={styles.wireframeLabel}>Email address:</Text>
                    <TextInput 
                      style={styles.wireframeInputInline} 
                      value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
                      placeholder="Enter your email" placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.wireframeVerifyBtn} onPress={handleVerify} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeVerifyBtnText}>Verify</Text>}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.wireframeInputRow}>
                  <View style={styles.inlineFieldRow}>
                    <Text style={styles.wireframeLabel}>Verification Pin:</Text>
                    <TextInput 
                      style={styles.wireframeInputShort} 
                      value={pin} onChangeText={setPin} keyboardType="numeric" maxLength={6}
                      placeholder="6-digit PIN" placeholderTextColor="#999"
                    />
                    <View style={{ width: 68 }} /> 
                  </View>
                </View>

                <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleContinue}>
                  <Text style={styles.wireframeSubmitBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: 修改新密码界面 */}
            {step === 2 && (
              <View style={{ width: '100%' }}>
                <View style={styles.wireframeInputRow}>
                  <View style={styles.inlineFieldRow}>
                    <Text style={styles.wireframeLabelLong}>New Password:</Text>
                    <TextInput 
                      style={styles.wireframeInputLong} secureTextEntry={true} 
                      value={password} onChangeText={setPassword}
                      placeholder="Upper + Num + Symbol" placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View style={styles.wireframeInputRow}>
                  <View style={styles.inlineFieldRow}>
                    <Text style={styles.wireframeLabelLong}>Confirm Pwd:</Text>
                    <TextInput 
                      style={styles.wireframeInputLong} secureTextEntry={true} 
                      value={confirmPassword} onChangeText={setConfirmPassword}
                      placeholder="Repeat password" placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleReset} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeSubmitBtnText}>Reset Password</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 15, paddingTop: 10, backgroundColor: '#FFF' },
  menuIconBox: { width: 40, alignItems: 'flex-start' },
  menuIconBorder: { width: 35, height: 30, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#000', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  
  // Wireframe 表单样式 (完全一致)
  wireframeCard: { width: '100%', borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 15, paddingVertical: 40, backgroundColor: '#fff', borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.1, shadowRadius:4 },
  wireframeInputRow: { marginBottom: 25, width: '100%' },
  inlineFieldRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  wireframeLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginRight: 5, minWidth: 105 },
  wireframeLabelLong: { fontSize: 13, fontWeight: 'bold', color: '#000', marginRight: 5, minWidth: 115 },
  
  wireframeInputInline: { flex: 1, height: 45, borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 10, fontSize: 13, color: '#000', backgroundColor: '#fff' },
  wireframeInputShort: { width: 110, height: 45, borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 10, fontSize: 13, color: '#000', backgroundColor: '#fff' },
  wireframeInputLong: { flex: 1, height: 45, borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 10, fontSize: 13, color: '#000', backgroundColor: '#fff' },
  
  wireframeVerifyBtn: { borderWidth: 1.5, borderColor: '#000', width: 65, height: 45, justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: '#fff' },
  wireframeVerifyBtnText: { fontSize: 13, color: '#000', fontWeight: 'bold' },
  wireframeSubmitBtn: { borderWidth: 1.5, borderColor: '#000', paddingVertical: 12, paddingHorizontal: 30, alignSelf: 'center', marginTop: 20, backgroundColor: '#fff' },
  wireframeSubmitBtnText: { fontSize: 15, color: '#000', fontWeight: 'bold' },
});