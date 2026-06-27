import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, ActivityIndicator, Image, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import emailjs from '@emailjs/react-native';

//  import Supabase and Rider
import { supabase } from '../../supabaseClient'; 
import { RiderContext } from './RiderProvider';

export default function DeliveryResetPassword() {
  const navigation = useNavigation();
  const { avatarUri, riderName } = useContext(RiderContext); // 直接从全局拿头像和名字

  const [step, setStep] = useState(1);                     
  const [isLoading, setIsLoading] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // inputs state
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // email
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

  // send verification email
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

  // verify otp
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

  // reset password
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
          { text: "OK", onPress: () => { resetAllFields(); navigation.navigate('Home'); } } 
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ height: Platform.OS === 'ios' ? 10 : 40, backgroundColor: '#FFF' }} />

      {/* ==================== 顶部导航栏 ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIconBox} onPress={() => step === 1 ? setIsSidebarOpen(true) : setStep(1)} activeOpacity={0.7}>
          <View style={styles.menuIconBorder}>
            <Ionicons name={step === 1 ? "menu" : "arrow-back"} size={26} color="black" />
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

      {/* ==================== 侧边栏 (   RESET PASSWORD 高亮) ==================== */}
      {isSidebarOpen ? (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.closeOverlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.profileAvatar}>
                {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImageReal} /> : <Ionicons name="person" size={36} color="#FFF" />}
              </View>
              <Text style={styles.profileName}>{riderName}</Text>
            </View>
            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Home'); }}><Ionicons name="home-outline" size={22} color="#666" style={styles.menuIconLeft} /><Text style={styles.menuText}>HOME</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Profile'); }}><Ionicons name="person-outline" size={22} color="#666" style={styles.menuIconLeft} /><Text style={styles.menuText}>PROFILE</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('WorkingShift'); }}><Ionicons name="calendar-outline" size={22} color="#666" style={styles.menuIconLeft} /><Text style={styles.menuText}>WORKING SHIFT</Text></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('EarningsHistory'); }}><Ionicons name="wallet-outline" size={22} color="#666" style={styles.menuIconLeft} /><Text style={styles.menuText}>EARNINGS & HISTORY</Text></TouchableOpacity>
              
              {/* 这里是当前页，设为 Active 状态 */}
              <TouchableOpacity style={styles.menuItemActive} onPress={() => setIsSidebarOpen(false)}><Ionicons name="lock-closed" size={22} color="#424242" style={styles.menuIconLeft} /><Text style={styles.menuTextActive}>RESET PASSWORD</Text></TouchableOpacity>
            </ScrollView>
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={async () => { setIsSidebarOpen(false); await supabase.auth.signOut(); }} >
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={{ marginRight: 12 }} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <View style={{ height: Platform.OS === 'ios' ? 25 : 45, backgroundColor: '#FFF' }} />
            </View>
          </View>
        </View>
      ) : null}

    </SafeAreaView>
  );
}

// delivery man main framework
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10, backgroundColor: '#FFF', borderBottomWidth: 1.5, borderColor: '#E0E0E0' },
  menuIconBox: { width: 40, alignItems: 'flex-start' },
  menuIconBorder: { width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: '#000', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#000', letterSpacing: 1 },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  
  // Wireframe 
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

  // Sidebar 
  sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', zIndex: 100 },
  closeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { width: '75%', backgroundColor: '#FFF', height: '100%', shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 15 },
  sidebarHeader: { alignItems: 'center', padding: 25, paddingTop: Platform.OS === 'ios' ? 60 : 50, backgroundColor: '#424242' },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarImageReal: { width: 60, height: 60, borderRadius: 30 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  menuList: { flex: 1, paddingTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 25 },
  menuItemActive: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 25, backgroundColor: '#F5F5F5', borderLeftWidth: 4, borderColor: '#424242' },
  menuIconLeft: { marginRight: 15 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#333' },
  menuTextActive: { fontSize: 15, fontWeight: 'bold', color: '#424242' },
  sidebarFooter: { borderTopWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
  logoutButton: { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 25, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: 'bold', color: '#FF3B30' }
});