import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image // 🎯 导入 Image 组件用于在侧边栏显示用户头像
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
// 🎯 引入你的 Supabase 客户端实例
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

export default function OperationStatusApp({ onBack, navigateToScreen }) {
  // 🚪 侧边栏显隐状态与加载状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- 表单状态控制 ---
  const [dateStart, setDateStart] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date());

  const [showPickerStart, setShowPickerStart] = useState(false);
  const [showPickerEnd, setShowPickerEnd] = useState(false);

  // 日期文本状态
  const [dateStartText, setDateStartText] = useState('');
  const [dateEndText, setDateEndText] = useState('');

  const [timeStartHour, setTimeStartHour] = useState('');
  const [timeStartMin, setTimeStartMin] = useState('');
  const [timeEndHour, setTimeEndHour] = useState('');
  const [timeEndMin, setTimeEndMin] = useState('');

  const [status, setStatus] = useState('active');

  // 👤 Supabase 用户资料状态（Sidebar 动态展示使用）
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 用于嵌入式显示时间格式提示或错误的状态
  const [timeNotice, setTimeNotice] = useState('Use 24-hour format (00-23)');
  const [isNoticeError, setIsNoticeError] = useState(false);

  // 获取清空时分秒的“今天”的凌晨时间
  const getTodayWithNoon = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 👤 副作用：动态拉取当前登录用户的 profiles 数据来展示在 Sidebar 上
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // 1. 从官方 Auth 拿到当前会话的用户 UID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setProfileName('Guest');
          return;
        }

        // 2. 拿着 UID 去 profiles 表查询 full_name 和 avatar_url
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
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

  // 处理侧边栏导航点击
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false); // 先关闭侧边栏

    // 如果点击的是当前页面，不需要跳转
    if (targetScreen === 'operationstatus') return;

    // 回传参数给上层主控组件进行界面跳转
    if (navigateToScreen) {
      navigateToScreen(targetScreen);
    } else if (onBack) {
      onBack(targetScreen);
    }
  };

  const onChangeDateStart = (event, selectedDate) => {
    setShowPickerStart(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate < getTodayWithNoon()) {
        Alert.alert("Error", "Start date cannot be earlier than today!");
        return;
      }

      setDateStart(selectedDate);
      const formatted = formatDate(selectedDate);
      setDateStartText(formatted);

      if (dateEndText && selectedDate > dateEnd) {
        setDateEnd(selectedDate);
        setDateEndText(formatted);
      }
    }
  };

  const onChangeDateEnd = (event, selectedDate) => {
    setShowPickerEnd(Platform.OS === 'ios');
    if (selectedDate) {
      const compareDate = dateStartText ? dateStart : getTodayWithNoon();
      const targetCompare = new Date(compareDate);
      targetCompare.setHours(0, 0, 0, 0);

      if (selectedDate < targetCompare) {
        Alert.alert("Error", "End date cannot be earlier than Start date!");
        return;
      }

      setDateEnd(selectedDate);
      const formatted = formatDate(selectedDate);
      setDateEndText(formatted);
    }
  };

  const validateHours = (val, setHourState) => {
    if (val === '') return;
    const hour = parseInt(val, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      setTimeNotice("Hours must be between 0 and 23!");
      setIsNoticeError(true);
      setHourState('');
    } else {
      setTimeNotice('Use 24-hour format (00-23)');
      setIsNoticeError(false);
    }
  };

  const validateMinutes = (val, setMinState) => {
    if (val === '') return;
    const min = parseInt(val, 10);
    if (isNaN(min) || min < 0 || min > 59) {
      setTimeNotice("Minutes cannot exceed 59!");
      setIsNoticeError(true);
      setMinState('');
    } else {
      setTimeNotice('Use 24-hour format (00-23)');
      setIsNoticeError(false);
    }
  };

  const handleHourFocus = () => {
    setTimeNotice('Please use 24-hour format (00-23).');
    setIsNoticeError(false);
  };

  // ⚡ 核心提交功能：使用 .insert() 每次都在 Supabase 产生新行记录
  const handleUpdateSubmit = async () => {
    if (!dateStartText || !dateEndText || !timeStartHour || !timeStartMin || !timeEndHour || !timeEndMin) {
      Alert.alert("Error", "Please fill in all date and time fields!");
      return;
    }

    const sMin = parseInt(timeStartMin, 10);
    const eMin = parseInt(timeEndMin, 10);
    const sHour = parseInt(timeStartHour, 10);
    const eHour = parseInt(timeEndHour, 10);

    if (sMin > 59 || eMin > 59 || sHour > 23 || eHour > 23) {
      setTimeNotice("Hours max 23, Minutes max 59.");
      setIsNoticeError(true);
      return;
    }

    const dStart = new Date(dateStartText);
    const dEnd = new Date(dateEndText);
    const today = getTodayWithNoon();

    if (dStart < today) {
      Alert.alert("Error", "Operation cannot start in the past!");
      return;
    }

    if (dEnd < dStart) {
      Alert.alert("Error", "End date cannot be earlier than Start date!");
      return;
    }

    // 格式化时间字符串 例如将 9:5 转成 "09:05" 存入数据库
    const startTimeStr = `${timeStartHour.padStart(2, '0')}:${timeStartMin.padStart(2, '0')}`;
    const endTimeStr = `${timeEndHour.padStart(2, '0')}:${timeEndMin.padStart(2, '0')}`;

    setIsLoading(true);

    try {
      // 1. 获取当前用户 UID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User session not found. Please log in again.");
      }

      // 2. 🎯 改用 .insert() 确保每次提交都是一条独立的、全新的新纪录
      const { error: uploadError } = await supabase
        .from('operation_status')
        .insert({
          user_id: user.id,
          date_start: dateStartText,
          date_end: dateEndText,
          time_start: startTimeStr,
          time_end: endTimeStr,
          status: status
        });

      if (uploadError) throw uploadError;

      Alert.alert(
        "Success ✅",
        `New status record added successfully!\nStatus: ${status}\nDate: ${dateStartText} to ${dateEndText}\nTime: ${startTimeStr} - ${endTimeStr}`
      );

      // 成功后清空输入框，方便商家输入添加下一组时段状态
      setDateStartText('');
      setDateEndText('');
      setTimeStartHour('');
      setTimeStartMin('');
      setTimeEndHour('');
      setTimeEndMin('');

    } catch (error) {
      console.log('Supabase Save Error:', error.message);
      Alert.alert("Error ❌", error.message || "Failed to save operation status.");
    } finally {
      setIsLoading(false);
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

            {/* 用户头像区域 (已经同步绑定为来自 Supabase profiles 的动态数据) */}
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
              {/* 动态显示全名 */}
              <Text style={styles.avatarName}>{profileName}</Text>
            </View>

            {/* 导航列表 */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            {/* 当前页面：高亮为灰色背景 */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => setIsSidebarOpen(false)}>
              <Text style={styles.sidebarItemText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('historyorder')}>
              <Text style={styles.sidebarItemText}>History Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            {/* 底部退出登录 */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
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

      {/* 1. 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.backButton}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operation Status</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.divider} />

      {/* KeyboardAvoidingView 包裹 ScrollView 解决键盘挡住输入框问题 */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* 字段 1: Date Start */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Date Start:</Text>
            <TouchableOpacity
              style={styles.dateBoxContainer}
              onPress={() => setShowPickerStart(true)}
            >
              {dateStartText ? (
                <Text style={styles.dateBoxText}>{dateStartText}</Text>
              ) : (
                <Ionicons name="calendar-outline" size={18} color="#333" />
              )}
            </TouchableOpacity>
          </View>

          {showPickerStart && (
            <DateTimePicker
              value={dateStart}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChangeDateStart}
              minimumDate={getTodayWithNoon()}
            />
          )}

          {/* 字段 2: Date End */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Date End:</Text>
            <TouchableOpacity
              style={styles.dateBoxContainer}
              onPress={() => setShowPickerEnd(true)}
            >
              {dateEndText ? (
                <Text style={styles.dateBoxText}>{dateEndText}</Text>
              ) : (
                <Ionicons name="calendar-outline" size={18} color="#333" />
              )}
            </TouchableOpacity>
          </View>

          {showPickerEnd && (
            <DateTimePicker
              value={dateEnd}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChangeDateEnd}
              minimumDate={dateStartText ? dateStart : getTodayWithNoon()}
            />
          )}

          {/* 字段 3: Time Start */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Time Start:</Text>
            <View style={styles.timeGroup}>
              <TextInput
                style={styles.timeInput}
                placeholder="HH"
                keyboardType="numeric"
                maxLength={2}
                value={timeStartHour}
                onFocus={handleHourFocus}
                onChangeText={setTimeStartHour}
                onBlur={() => validateHours(timeStartHour, setTimeStartHour)}
              />
              <Text style={styles.colon}>:</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="MM"
                keyboardType="numeric"
                maxLength={2}
                value={timeStartMin}
                onChangeText={setTimeStartMin}
                onBlur={() => validateMinutes(timeStartMin, setTimeStartMin)}
              />
            </View>
          </View>

          {/* 字段 4: Time End */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Time End:</Text>
            <View style={styles.timeGroup}>
              <TextInput
                style={styles.timeInput}
                placeholder="HH"
                keyboardType="numeric"
                maxLength={2}
                value={timeEndHour}
                onFocus={handleHourFocus}
                onChangeText={setTimeEndHour}
                onBlur={() => validateHours(timeEndHour, setTimeEndHour)}
              />
              <Text style={styles.colon}>:</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="MM"
                keyboardType="numeric"
                maxLength={2}
                value={timeEndMin}
                onChangeText={setTimeEndMin}
                onBlur={() => validateMinutes(timeEndMin, setTimeEndMin)}
              />
            </View>
          </View>

          {/* 嵌入式 Notice 区域 */}
          <View style={styles.noticeContainer}>
            <Text style={[styles.noticeText, isNoticeError ? styles.noticeError : styles.noticeNormal]}>
              {timeNotice}
            </Text>
          </View>

          {/* 字段 5: Status */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Status:</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={styles.radioButton} onPress={() => setStatus('active')}>
                <View style={styles.radioCircle}>
                  {status === 'active' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Active</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioButton} onPress={() => setStatus('inactive')}>
                <View style={styles.radioCircle}>
                  {status === 'inactive' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* UPDATE 按钮（带优雅的加载等待动画） */}
          <TouchableOpacity style={styles.button} onPress={handleUpdateSubmit} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>UPDATE</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35 },
  backButton: { justifyContent: 'center', alignItems: 'center', padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#000', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#000', width: '100%' },
  keyboardAvoid: { flex: 1 },
  scrollContainer: { paddingHorizontal: 28, paddingTop: 30, paddingBottom: 60 },
  inputGroupRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#000', width: 100 },
  dateBoxContainer: { borderWidth: 1, borderColor: '#000', borderRadius: 2, minWidth: 90, paddingHorizontal: 8, height: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  dateBoxText: { fontSize: 13, color: '#000', fontWeight: '500' },
  timeGroup: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { borderWidth: 1, borderColor: '#000', borderRadius: 2, width: 70, height: 28, backgroundColor: '#fff', textAlign: 'center', fontSize: 13, padding: 0 },
  colon: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, color: '#000' },

  noticeContainer: {
    paddingLeft: 100,
    marginBottom: 18,
    marginTop: -8,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noticeNormal: {
    color: '#7f8c8d',
  },
  noticeError: {
    color: '#ff4d4d',
  },

  radioGroup: { flexDirection: 'row', alignItems: 'center' },
  radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radioCircle: { height: 14, width: 14, borderRadius: 7, borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  radioDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#000' },
  radioLabel: { fontSize: 12, color: '#000' },
  button: { backgroundColor: '#A9A9A9', paddingVertical: 10, borderRadius: 20, marginTop: 35, width: '55%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', height: 44 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  /* ==================== 📌 Sidebar 样式表 ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Dimensions.get('window').width * 0.75,
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
    overflow: 'hidden' // 🎯 确保图片加载出时完美收纳在圆圈内
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