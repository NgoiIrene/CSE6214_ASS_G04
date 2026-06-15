import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import VendorNavigator from './screens/vendor/vendornavigetor';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <VendorNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

// import React, { useState } from 'react';
// import { View, StyleSheet, StatusBar } from 'react-native';

// // ==================== 🛠️ 真实子页面引入（同级目录版） ====================
// import OrderScreen from './order';          
// import ReviewScreen from './review';          
// import MenuScreen from './menu';              
// import HistoryOrderScreen from './historyorder'; 
// import OperationStatusScreen from './operationstatus'; 
// import ResetPasswordScreen from './resetpassword'; // ✨ 新增：引入重置密码页面

// export default function App() {
//   // 初始设为 'menu' 页面
//   const [currentScreen, setCurrentScreen] = useState('menu');

//   // 路由跳转核心方法
//   const navigateToScreen = (screenName) => {
//     console.log(`[路由导航] 正在前往页面: ${screenName}`);
//     if (screenName === 'logout') {
//       setCurrentScreen('menu'); // 退出登录时重置回 menu
//       return;
//     }
//     setCurrentScreen(screenName);
//   };

//   // 根据子页面侧边栏传回的字符串渲染对应的真实组件
//   const renderScreen = () => {
//     switch (currentScreen) {
//       case 'menu':
//         return <MenuScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
//       case 'order':
//         return <OrderScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
//       case 'review':
//         return <ReviewScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
//       case 'historyorder':
//         return <HistoryOrderScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
//       case 'operationstatus':
//         return <OperationStatusScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
//       case 'resetpassword': // ✨ 新增：处理重置密码页面的路由分支
//         return <ResetPasswordScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
//       default:
//         return <MenuScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
//       {renderScreen()}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
// });

// import React from 'react';
// // 引入你想看的那个 js 文件（这里以同级目录的 order.js 为例）
// import OrderScreen from './resetpassword'; 

// export default function App() {
//   // 直接在这里渲染你想看的页面
//   return <OrderScreen />;
// }

// import React, { useState, useEffect } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   TextInput,
//   Platform,
//   Alert,
//   ActivityIndicator,
//   Dimensions,
//   KeyboardAvoidingView
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Picker } from '@react-native-picker/picker';
// import emailjs from '@emailjs/react-native';

// export default function AuthScreen({ navigateToScreen }) {
//   // 🌟 核心页面流转状态：'login' | 'signup' | 'reset_step1' | 'reset_step2'
//   const [currentPage, setCurrentPage] = useState('login'); 
//   const [isLoading, setIsLoading] = useState(false);

//   // --- 登录页面的状态 ---
//   const [loginEmail, setLoginEmail] = useState('');
//   const [loginPassword, setLoginPassword] = useState('');

//   // --- 注册页面的状态 ---
//   const [fullName, setFullName] = useState('');
//   const [signUpEmail, setSignUpEmail] = useState('');
//   const [accountType, setAccountType] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [gender, setGender] = useState('');
//   const [age, setAge] = useState('');
//   const [signUpPassword, setSignUpPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   // --- 忘记密码/重置密码状态 ---
//   const [resetEmail, setResetEmail] = useState('');
//   const [pin, setPin] = useState('');
//   const [generatedPin, setGeneratedPin] = useState(''); 
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');

//   // 🛠️ EmailJS 凭证配置
//   const EMAILJS_SERVICE_ID = 'service_cfa71kb';       
//   const EMAILJS_TEMPLATE_ID = 'template_4lhl9wd';     
//   const EMAILJS_PUBLIC_KEY = 'IWTAe2ZuqgcQdTyX_';     
//   const EMAILJS_PRIVATE_KEY = 'lgCg5nmv8BNjHdUMVH1Bp'; 

//   useEffect(() => {
//     emailjs.init({
//       publicKey: EMAILJS_PUBLIC_KEY,
//       privateKey: EMAILJS_PRIVATE_KEY, 
//     });
//   }, []);

//   // ⚡ 登录按钮触发
//   const handleLoginSubmit = () => {
//     if (!loginEmail || !loginPassword) {
//       Alert.alert("Error", "Please fill in all fields!");
//       return;
//     }
//     Alert.alert("Success", "Logged in successfully!", [
//       { text: "OK", onPress: () => { if (navigateToScreen) navigateToScreen('order'); } }
//     ]);
//   };

//   // ⚡ 注册按钮触发
//   const handleSignUpSubmit = () => {
//     if (!fullName || !signUpEmail || !accountType || !phoneNumber || !gender || !age || !signUpPassword || !confirmPassword) {
//       Alert.alert("Error", "Please fill in all fields!");
//       return;
//     }
//     if (signUpPassword !== confirmPassword) {
//       Alert.alert("Error", "The passwords you entered do not match!");
//       return;
//     }
//     Alert.alert("Success", `Welcome, ${fullName}! Account created.`);
//     setCurrentPage('login');
//   };

//   // ⚡ 流程2：发送验证码邮件
//   const handleVerifyEmail = async () => {
//     const userEmail = resetEmail.trim();
//     if (!userEmail) {
//       Alert.alert("Error", "Please enter your email address first!");
//       return;
//     }

//     const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
//     setGeneratedPin(randomPin); 
//     setIsLoading(true);

//     const templateParams = {
//       email: userEmail,      
//       reply_pin: randomPin,   
//     };

//     try {
//       await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
//       Alert.alert(
//         "Email Sent Successfully! 📩",
//         `A verification email has been sent to:\n${userEmail}\n\nPlease check your inbox!`,
//         [{ text: "OK" }]
//       );
//     } catch (error) {
//       console.log('SDK Error:', error);
//       Alert.alert("Mail Delivery Error", "Failed to send email. Please check your network.");
//     } finally {
//       setIsLoading(false); 
//     }
//   };

//   // ⚡ 流程2：验证验证码并继续
//   const handleContinueReset = () => {
//     const enteredEmail = resetEmail.trim();
//     const enteredPin = pin.trim();

//     if (!enteredEmail || !enteredPin) {
//       Alert.alert("Error", "Please fill in both Email and Verification PIN!");
//       return;
//     }

//     if (!generatedPin || enteredPin !== generatedPin) {
//       Alert.alert("Verification Failed ❌", "The PIN code you entered is incorrect.");
//       return; 
//     }
//     setCurrentPage('reset_step2'); // 进入图3设置新密码阶段
//   };

//   // ⚡ 流程3：最终确认重置新密码
//   const handleFinalReset = () => {
//     if (!newPassword || !confirmNewPassword) {
//       Alert.alert("Error", "Please fill in all fields!");
//       return;
//     }
//     if (newPassword !== confirmNewPassword) {
//       Alert.alert("Error", "Passwords do not match!");
//       return;
//     }

//     const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
//     if (!strongPasswordRegex.test(newPassword)) {
//       Alert.alert(
//         "Weak Password ❌",
//         "Password must be at least 8 characters long and contain uppercase letters, numbers, and at least one special character!",
//         [{ text: "OK" }]
//       );
//       return;
//     }

//     Alert.alert("Success ✅", "Password reset successful!", [
//       { text: "OK", onPress: () => setCurrentPage('login') } 
//     ]);
//   };

//   // 处理返回箭头动作
//   const handleBackPress = () => {
//     if (currentPage === 'reset_step1') {
//       setCurrentPage('login');
//     } else if (currentPage === 'reset_step2') {
//       setCurrentPage('reset_step1');
//     }
//   };

//   // 获取动态标题
//   const getHeaderTitle = () => {
//     if (currentPage === 'login') return 'Log In';
//     if (currentPage === 'signup') return 'Sign Up';
//     if (currentPage === 'reset_step1') return 'Email Verification';
//     return 'Reset Password';
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       {/* ==================== 顶部导航栏 ==================== */}
//       <View style={styles.header}>
//         {/* 如果是重置密码的分步页面，左侧显示返回箭头，否则留空保持居中占位 */}
//         {['reset_step1', 'reset_step2'].includes(currentPage) ? (
//           <TouchableOpacity style={styles.headerBackBtn} onPress={handleBackPress}>
//             <Ionicons name="arrow-back-outline" size={24} color="#000" />
//           </TouchableOpacity>
//         ) : (
//           <View style={{ width: 32 }} />
//         )}
        
//         <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
//         <View style={{ width: 32 }} />
//       </View>

//       <View style={styles.divider} />

//       <KeyboardAvoidingView
//         style={styles.keyboardAvoid}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
//       >
//         <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
//           {/* ==================== 1. 登录界面 UI（对应图片左侧） ==================== */}
//           {currentPage === 'login' && (
//             <View style={styles.wireframeCard}>
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Email address:</Text>
//                   <TextInput
//                     style={styles.wireframeInputInline}
//                     placeholder="example@gmail.com"
//                     placeholderTextColor="#bbb"
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                     value={loginEmail}
//                     onChangeText={setLoginEmail}
//                   />
//                 </View>
//               </View>

//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Password:</Text>
//                   <TextInput
//                     style={styles.wireframeInputInline}
//                     placeholder="••••••••"
//                     placeholderTextColor="#bbb"
//                     secureTextEntry={true}
//                     value={loginPassword}
//                     onChangeText={setLoginPassword}
//                   />
//                 </View>
//               </View>

//               {/* 注册与忘记密码链接行 */}
//               <View style={styles.linksRow}>
//                 <TouchableOpacity onPress={() => setCurrentPage('signup')}>
//                   <Text style={styles.linkTextUnderline}>Sign Up</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => setCurrentPage('reset_step1')}>
//                   <Text style={styles.linkTextUnderline}>Forgot Password</Text>
//                 </TouchableOpacity>
//               </View>

//               <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleLoginSubmit}>
//                 <Text style={styles.wireframeSubmitBtnText}>Login</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* ==================== 2. 注册界面 UI ==================== */}
//           {currentPage === 'signup' && (
//             <View style={[styles.wireframeCard, { paddingVertical: 25 }]}>
//               {/* Full Name */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Full Name:</Text>
//                   <TextInput style={styles.wireframeInputInline} placeholder="John Doe" placeholderTextColor="#bbb" value={fullName} onChangeText={setFullName} />
//                 </View>
//               </View>

//               {/* Email */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Email:</Text>
//                   <TextInput style={styles.wireframeInputInline} placeholder="johndoe@gmail.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" value={signUpEmail} onChangeText={setSignUpEmail} />
//                 </View>
//               </View>

//               {/* Account Type */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Account Type:</Text>
//                   <View style={styles.pickerContainerEdge}>
//                     <Picker selectedValue={accountType} onValueChange={(v) => setAccountType(v)} style={styles.pickerBody}>
//                       <Picker.Item label="--- SELECT ---" value="" color="#bbb" />
//                       <Picker.Item label="Customer" value="customer" />
//                       <Picker.Item label="Vendor" value="vendor" />
//                       <Picker.Item label="Delivery Man" value="delivery" />
//                     </Picker>
//                   </View>
//                 </View>
//               </View>

//               {/* Phone */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Phone:</Text>
//                   <TextInput style={styles.wireframeInputInline} placeholder="012-3456789" placeholderTextColor="#bbb" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
//                 </View>
//               </View>

//               {/* Gender */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Gender:</Text>
//                   <View style={styles.pickerContainerEdge}>
//                     <Picker selectedValue={gender} onValueChange={(v) => setGender(v)} style={styles.pickerBody}>
//                       <Picker.Item label="--- SELECT ---" value="" color="#bbb" />
//                       <Picker.Item label="Male" value="male" />
//                       <Picker.Item label="Female" value="female" />
//                     </Picker>
//                   </View>
//                 </View>
//               </View>

//               {/* Age */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Age:</Text>
//                   <TextInput style={styles.wireframeInputInline} placeholder="20" placeholderTextColor="#bbb" keyboardType="numeric" value={age} onChangeText={setAge} />
//                 </View>
//               </View>

//               {/* Password */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Password:</Text>
//                   <TextInput style={styles.wireframeInputInline} secureTextEntry={true} placeholder="••••••••" placeholderTextColor="#bbb" value={signUpPassword} onChangeText={setSignUpPassword} />
//                 </View>
//               </View>

//               {/* Confirm Password */}
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Confirm Pwd:</Text>
//                   <TextInput style={styles.wireframeInputInline} secureTextEntry={true} placeholder="••••••••" placeholderTextColor="#bbb" value={confirmPassword} onChangeText={setConfirmPassword} />
//                 </View>
//               </View>

//               <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleSignUpSubmit}>
//                 <Text style={styles.wireframeSubmitBtnText}>Signup</Text>
//               </TouchableOpacity>

//               <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setCurrentPage('login')}>
//                 <Text style={[styles.linkTextUnderline, { textAlign: 'center' }]}>Already have an account? Log In</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* ==================== 3. 忘记密码：邮箱验证（对应图片中间） ==================== */}
//           {currentPage === 'reset_step1' && (
//             <View style={styles.wireframeCard}>
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Email address:</Text>
//                   <TextInput 
//                     style={styles.wireframeInputInline} 
//                     value={resetEmail}
//                     onChangeText={setResetEmail}
//                     autoCapitalize="none"
//                     keyboardType="email-address"
//                     placeholder="Enter email to verify"
//                     placeholderTextColor="#999"
//                   />
//                   <TouchableOpacity style={styles.wireframeVerifyBtn} onPress={handleVerifyEmail} disabled={isLoading}>
//                     {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeVerifyBtnText}>Verify</Text>}
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabel}>Verification Pin:</Text>
//                   <TextInput 
//                     style={styles.wireframeInputShort} 
//                     value={pin}
//                     onChangeText={setPin}
//                     keyboardType="numeric"
//                     maxLength={6}
//                     placeholder="6-digit PIN"
//                     placeholderTextColor="#999"
//                   />
//                   <View style={{ width: 68 }} /> {/* 右侧对称占位 */}
//                 </View>
//               </View>

//               <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleContinueReset}>
//                 <Text style={styles.wireframeSubmitBtnText}>Continue</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* ==================== 4. 重置新密码界面（对应图片右侧） ==================== */}
//           {currentPage === 'reset_step2' && (
//             <View style={styles.wireframeCard}>
//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabelLong}>Password:</Text>
//                   <TextInput 
//                     style={styles.wireframeInputLong} 
//                     secureTextEntry={true} 
//                     value={newPassword} 
//                     onChangeText={setNewPassword}
//                     placeholder="New password (8+ min)"
//                     placeholderTextColor="#999"
//                   />
//                 </View>
//               </View>

//               <View style={styles.wireframeInputRow}>
//                 <View style={styles.inlineFieldRow}>
//                   <Text style={styles.wireframeLabelLong}>Confirm Password:</Text>
//                   <TextInput 
//                     style={styles.wireframeInputLong} 
//                     secureTextEntry={true} 
//                     value={confirmNewPassword} 
//                     onChangeText={setConfirmNewPassword}
//                     placeholder="Repeat new password"
//                     placeholderTextColor="#999"
//                   />
//                 </View>
//               </View>

//               <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleFinalReset}>
//                 <Text style={styles.wireframeSubmitBtnText}>Reset</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// // ==================== 🎨 粗线框极简风格全新样式表 ====================
// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: '#fff' },
//   divider: { height: 2, backgroundColor: '#000', width: '100%' },
//   keyboardAvoid: { flex: 1 },
//   scrollContainer: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 40, alignItems: 'center' },
  
//   // 顶部标准导航
//   header: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     justifyContent: 'space-between',
//     paddingHorizontal: 15, 
//     paddingBottom: 12,
//     paddingTop: Platform.OS === 'ios' ? 15 : 35,
//   },
//   headerBackBtn: { 
//     width: 32, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     borderWidth: 1.5, 
//     borderColor: '#000', 
//     borderRadius: 6,
//     padding: 2
//   },
//   headerTitle: { fontSize: 24, fontWeight: 'normal', color: '#000' },
  
//   // 核心粗框卡片组件
//   wireframeCard: { 
//     width: '100%', 
//     borderWidth: 1.5, 
//     borderColor: '#000', 
//     paddingHorizontal: 20, 
//     paddingVertical: 45, 
//     backgroundColor: '#fff', 
//     marginTop: 20 
//   },
//   wireframeInputRow: { marginBottom: 20, width: '100%' },
//   inlineFieldRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  
//   // 标签宽度限制（实现黑白两端对齐效果）
//   wireframeLabel: { fontSize: 13, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 105 },
//   wireframeLabelLong: { fontSize: 13, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 125 },
  
//   // 各种粗线框输入框
//   wireframeInputInline: { 
//     flex: 1, 
//     height: 40, 
//     borderWidth: 1.5, 
//     borderColor: '#000', 
//     paddingHorizontal: 10, 
//     fontSize: 13, 
//     color: '#000', 
//     backgroundColor: '#fff',
//   },
//   wireframeInputShort: { 
//     width: 120, 
//     height: 40, 
//     borderWidth: 1.5, 
//     borderColor: '#000', 
//     paddingHorizontal: 10, 
//     fontSize: 13, 
//     color: '#000', 
//     backgroundColor: '#fff',
//   },
//   wireframeInputLong: { 
//     flex: 1, 
//     height: 40, 
//     borderWidth: 1.5, 
//     borderColor: '#000', 
//     paddingHorizontal: 10, 
//     fontSize: 13, 
//     color: '#000', 
//     backgroundColor: '#fff',
//   },

//   // 粗线框下拉选择器容器
//   pickerContainerEdge: {
//     flex: 1,
//     height: 40,
//     borderWidth: 1.5,
//     borderColor: '#000',
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//   },
//   pickerBody: {
//     width: '100%',
//     color: '#000',
//   },
  
//   // 登录界面的超链接布局
//   linksRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: 5,
//     marginBottom: 20,
//     paddingHorizontal: 2,
//   },
//   linkTextUnderline: {
//     fontSize: 12,
//     color: '#000',
//     textDecorationLine: 'underline',
//   },

//   // 独立小 Verify 按钮
//   wireframeVerifyBtn: { 
//     borderWidth: 1.5, 
//     borderColor: '#000', 
//     width: 60, 
//     height: 40, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     marginLeft: 8, 
//     backgroundColor: '#fff' 
//   },
//   wireframeVerifyBtnText: { fontSize: 13, color: '#000', fontWeight: 'bold' },
  
//   // 底部提交大按钮
//   wireframeSubmitBtn: { 
//     borderWidth: 1.5, 
//     borderColor: '#000', 
//     paddingVertical: 8, 
//     paddingHorizontal: 35, 
//     alignSelf: 'center', 
//     marginTop: 10, 
//     backgroundColor: '#fff' 
//   },
//   wireframeSubmitBtnText: { fontSize: 15, color: '#000', fontWeight: 'bold' },
// });