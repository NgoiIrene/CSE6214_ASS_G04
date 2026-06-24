import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import emailjs from '@emailjs/react-native';
import { supabase } from '../../supabaseClient';

export default function AdminResetPasswordScreen({ onResetSuccess }) {
  const [step, setStep] = useState(1);                     
  const [isLoading, setIsLoading] = useState(false); 

  // 表单输入状态
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🛠️ EmailJS 凭证 (和你之前的一样)
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
      Alert.alert(
        "Email Sent Successfully! 📩",
        `A verification email has been sent to:\n${userEmail}\n\nPlease check your inbox!`,
        [{ text: "OK" }]
      );
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
      Alert.alert(
        "Verification Failed ❌",
        "The PIN code you entered is incorrect. Please try again.",
        [{ text: "Try Again" }]
      );
      return; 
    }
    
    setStep(2); 
  };

  // ⚡ 3. 重置密码
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
      Alert.alert(
        "Weak Password ❌",
        "Password must be at least 8 characters long and contain uppercase letters, numbers, and at least one special character!",
        [{ text: "OK" }]
      );
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
              if (onResetSuccess) {
                onResetSuccess(); // 成功后通过 prop 告诉 Navigation 切回主页
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

  // 注意：这里没有 SafeAreaView，也没有 Header 和 Sidebar，因为外层的 Navigation 已经包办了
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.wireframeCard}>
        
        {/* STEP 1: Email 验证界面 */}
        {step === 1 && (
          <View style={{ width: '100%' }}>
            <View style={styles.wireframeInputRow}>
              <View style={styles.inlineFieldRow}>
                <Text style={styles.wireframeLabel}>Email address:</Text>
                <TextInput 
                  style={styles.wireframeInputInline} 
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
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
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="6-digit PIN"
                  placeholderTextColor="#999"
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
                <Text style={styles.wireframeLabelLong}>Password:</Text>
                <TextInput 
                  style={styles.wireframeInputLong} 
                  secureTextEntry={true} 
                  value={password} 
                  onChangeText={setPassword}
                  placeholder="Upper + Num + Symbol (8+ min)"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <View style={styles.wireframeInputRow}>
              <View style={styles.inlineFieldRow}>
                <Text style={styles.wireframeLabelLong}>Confirm Password:</Text>
                <TextInput 
                  style={styles.wireframeInputLong} 
                  secureTextEntry={true} 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleReset} disabled={isLoading}>
              {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeSubmitBtnText}>Reset</Text>}
            </TouchableOpacity>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 30, alignItems: 'center' },
  
  // 主卡片与输入框 (移除了原来没用的外围边距，让它自适应)
  wireframeCard: { width: '100%', borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 20, paddingVertical: 45, backgroundColor: '#fff', marginTop: 10, borderRadius: 8 },
  wireframeInputRow: { marginBottom: 25, width: '100%' },
  inlineFieldRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  wireframeLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 110 },
  wireframeLabelLong: { fontSize: 14, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 130 },
  
  wireframeInputInline: { flex: 1, height: 40, borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 10, fontSize: 14, color: '#000', backgroundColor: '#fff', borderRadius: 4 },
  wireframeInputShort: { width: 130, height: 40, borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 10, fontSize: 14, color: '#000', backgroundColor: '#fff', borderRadius: 4 },
  wireframeInputLong: { flex: 1, height: 40, borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 10, fontSize: 14, color: '#000', backgroundColor: '#fff', borderRadius: 4 },
  
  wireframeVerifyBtn: { borderWidth: 1.5, borderColor: '#000', width: 60, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  wireframeVerifyBtnText: { fontSize: 13, color: '#000', fontWeight: 'bold' },
  wireframeSubmitBtn: { borderWidth: 1.5, borderColor: '#000', paddingVertical: 10, paddingHorizontal: 35, alignSelf: 'center', marginTop: 20, backgroundColor: '#e0e0e0', borderRadius: 4 },
  wireframeSubmitBtnText: { fontSize: 15, color: '#000', fontWeight: 'bold' },
});