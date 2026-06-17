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
  TouchableWithoutFeedback,
  Image // 🎯 确保导入了 Image 组件用于显示头像
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import emailjs from '@emailjs/react-native';
// 🎯 已经配对成功的相对路径，成功引入 Supabase 客户端实例
import { supabase } from '../../supabaseClient';

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

  // 👤 新增：Supabase 用户资料状态（Sidebar 动态展示使用）
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 🛠️ EmailJS 凭证
  const EMAILJS_SERVICE_ID = 'service_cfa71kb';       
  const EMAILJS_TEMPLATE_ID = 'template_4lhl9wd';     
  const EMAILJS_PUBLIC_KEY = 'IWTAe2ZuqgcQdTyX_';     

  // ⚙️ 副作用 1：初始化 EmailJS
  useEffect(() => {
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
    });
  }, []);

  // 👤 副作用 2：动态拉取当前登录用户的 profiles 数据来展示在 Sidebar 上
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // 1. 从官方 Auth 拿到当前会话的用户 UID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setProfileName('Guest');
          return;
        }

        // 2. 拿着 UID 去你的 profiles 表查 full_name 和 avatar_url
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id) // 🎯 这里的 'id' 对应你 profiles 表中关联用户的字段名
          .single();

        if (profileError) throw profileError;

        if (profile) {
          if (profile.full_name) setProfileName(profile.full_name);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.log('Fetch profile error:', error.message);
        setProfileName('User'); // 出错或无数据时的默认降级显示
      }
    };

    fetchUserProfile();
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

  // ⚡ 1. 发送验证码邮件 (保持使用你配置好的 EmailJS)
  const handleVerify = async () => {
    const userEmail = email.trim();
    if (!userEmail) {
      Alert.alert("Error", "Please enter your email address first!");
      return;
    }

    // 生成 6 位随机验证码并临时保存在本地内存中
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

  // ⚡ 2. Continue 拦截检查 (纯前端 PIN 码安全对比，通过后证明账号归属)
  const handleContinue = () => {
    const enteredEmail = email.trim();
    const enteredPin = pin.trim();

    if (!enteredEmail || !enteredPin) {
      Alert.alert("Error", "Please fill in both Email and Verification PIN!");
      return;
    }

    // 比对输入和刚刚发送出去的 PIN
    if (!generatedPin || enteredPin !== generatedPin) {
      Alert.alert(
        "Verification Failed ❌",
        "The PIN code you entered is incorrect. Please try again.",
        [{ text: "Try Again" }]
      );
      return; 
    }
    
    // 成功自证身份，放行进入 Step 2 修改新密码
    setStep(2); 
  };

  // ⚡ 3. 重置密码 (联动调用 Supabase 中你成功创建的自定义 RPC 数据库函数)
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
        "Password must be at least 8 characters long and contain uppercase letters, numbers, and at least one special character (e.g., . , ! @)!",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // 🎯 核心调用：唤醒你在 SQL Editor 成功运行过的特殊权限修改函数
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
              if (navigateToScreen) {
                navigateToScreen('order'); // 成功后安全跳回主页
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
    resetAllFields(); 

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

            {/* 用户头像区域 (已经改为根据 Supabase 数据进行动态渲染) */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={{ width: 68, height: 68, borderRadius: 34 }} 
                  />
                ) : (
                  <Ionicons name="person-outline" size={45} color="#000" />
                )}
              </View>
              {/* 动态绑定全名 */}
              <Text style={styles.avatarName}>{profileName}</Text>
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
              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleReset} disabled={isLoading}>
                {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeSubmitBtnText}>Reset</Text>}
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
    overflow: 'hidden' // 确保加载出来的图片不会超出边框范围
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 5
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