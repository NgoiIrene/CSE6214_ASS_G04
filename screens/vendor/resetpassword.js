import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import emailjs from '@emailjs/react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResetPasswordScreen({ navigateToScreen }) {
  const [step, setStep] = useState(1);                     
  const [isLoading, setIsLoading] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // 表单输入状态
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🛠️ EmailJS 凭证
  const EMAILJS_SERVICE_ID = 'service_cfa71kb';       
  const EMAILJS_TEMPLATE_ID = 'template_4lhl9wd';     
  const EMAILJS_PUBLIC_KEY = 'IWTAe2ZuqgcQdTyX_';     

  useEffect(() => {
    // 💡 警告：React Native 前端千万不要初始化 privateKey，有重大安全隐患
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
    });
  }, []);

  // 清空所有状态的辅助函数
  const resetAllFields = () => {
    setStep(1);
    setEmail('');
    setPin('');
    setGeneratedPin('');
    setPassword('');
    setConfirmPassword('');
  };

  // ⚡ 发送验证码邮件
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
      console.log('SDK Error:', error);
      Alert.alert("Mail Delivery Error", "Failed to send email. Please check your network.");
    } finally {
      setIsLoading(false); 
    }
  };

  // ⚡ Continue 拦截检查
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

  // ⚡ 重置密码并返回首页
  const handleReset = () => {
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
        "Password must be at least 8 characters long and contain uppercase letters, numbers, and at least one special character (e.g., . , ! @)!",
        [{ text: "OK" }]
      );
      return;
    }

    // 🎯 核心修改点：成功后清空数据，并安全跳转回 order (Home) 页面
    Alert.alert("Success ✅", "Password reset successful!", [
      { 
        text: "OK", 
        onPress: () => { 
          resetAllFields(); // 1. 重置所有表单状态和 Step 状态
          if (navigateToScreen) {
            navigateToScreen('order'); // 2. 执行父级跳转，回到 home 页面
          } 
        } 
      } 
    ]);
  };

  // ⚡ 顶部左侧按钮点击逻辑
  const handleHeaderLeftPress = () => {
    if (step === 1) {
      setIsSidebarOpen(true); 
    } else {
      setStep(1); 
    }
  };

  // ⚡ 侧边栏菜单项点击跳转逻辑
  const handleMenuSelect = (screenName) => {
    setIsSidebarOpen(false); 
    resetAllFields(); // 离开当前页面前全面清空，防止数据残留

    if (screenName === 'resetpassword') return;

    if (navigateToScreen) {
      navigateToScreen(screenName); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* ==================== 🚪 侧边栏（Sidebar）组件 ==================== */}
      <Modal
        transparent={true}
        visible={isSidebarOpen}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* 左侧实体菜单 */}
          <View style={styles.sidebar}>
            {/* 顶栏：Menu 切换按钮 */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            {/* 用户头像区域 */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person-outline" size={45} color="#000" />
              </View>
              <Text style={styles.avatarName}>Rasa Syiok</Text>
            </View>

            {/* 导航列表 */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('operationstatus')}>
              <Text style={styles.sidebarItemText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('historyorder')}>
              <Text style={styles.sidebarItemText}>History Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            {/* 当前在 Reset Password 页面：高亮显示 */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => setIsSidebarOpen(false)}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            {/* 底部退出登录 */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuSelect('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 右侧空白处暗色遮罩层 */}
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* ==================== 顶部导航栏 ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={handleHeaderLeftPress}>
          {step === 1 ? (
            <Ionicons name="menu-outline" size={28} color="#000" />
          ) : (
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? "Email Verification" : "Reset Password"}
        </Text>
        <View style={{ width: 32 }} /> 
      </View>
      <View style={styles.divider} />

      {/* 主卡片区域 */}
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
              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleReset}>
                <Text style={styles.wireframeSubmitBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  scrollContainer: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 30, alignItems: 'center' },
  
  // 头部样式
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 15, 
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 15 : 35,
  },
  headerBackBtn: { 
    width: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#000', 
    borderRadius: 6,
    padding: 2
  },
  headerTitle: { fontSize: 24, fontWeight: 'normal', color: '#000' },
  
  // 主卡片与输入框
  wireframeCard: { width: '100%', borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 20, paddingVertical: 45, backgroundColor: '#fff', marginTop: 30 },
  wireframeInputRow: { marginBottom: 25, width: '100%' },
  inlineFieldRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  wireframeLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 110 },
  wireframeLabelLong: { fontSize: 14, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 130 },
  
  wireframeInputInline: { 
    flex: 1, 
    height: 40, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    paddingHorizontal: 10, 
    fontSize: 14, 
    color: '#000', 
    backgroundColor: '#fff',
  },
  wireframeInputShort: { 
    width: 130, 
    height: 40, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    paddingHorizontal: 10, 
    fontSize: 14, 
    color: '#000', 
    backgroundColor: '#fff',
  },
  wireframeInputLong: { 
    flex: 1, 
    height: 40, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    paddingHorizontal: 10, 
    fontSize: 14, 
    color: '#000', 
    backgroundColor: '#fff',
  },
  
  wireframeVerifyBtn: { borderWidth: 1.5, borderColor: '#000', width: 60, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: '#fff' },
  wireframeVerifyBtnText: { fontSize: 13, color: '#000', fontWeight: 'bold' },
  wireframeSubmitBtn: { borderWidth: 1.5, borderColor: '#000', paddingVertical: 8, paddingHorizontal: 30, alignSelf: 'center', marginTop: 20, backgroundColor: '#fff' },
  wireframeSubmitBtnText: { fontSize: 15, color: '#000', fontWeight: 'bold' },

  /* ==================== 📌 Sidebar 样式表 ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SCREEN_WIDTH * 0.75, 
    height: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderRightColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 25,
    zIndex: 10,
  },
  sidebarHeader: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  sidebarItem: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    alignItems: 'center',
  },
  sidebarActiveItem: {
    backgroundColor: '#A9A9A9', 
  },
  sidebarItemText: {
    fontSize: 22,
    color: '#000',
    fontWeight: 'normal',
  },
  sidebarFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderTopColor: '#000',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 22,
    color: '#000',
    marginLeft: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
  },
});