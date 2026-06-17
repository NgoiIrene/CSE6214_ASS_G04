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
  Image // 👈 引入 Image 组件用于显示头像
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// 🔌 引入你项目中的 Supabase 客户端实例
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

export default function OperationStatusApp({ onBack, navigateToScreen }) {
  // 🚪 侧边栏显隐状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 👤 用户与商家状态（参考 menu.js）
  const [vendorId, setVendorId] = useState(null);
  const [profileName, setProfileName] = useState('Loading...');
  const [profileAvatar, setProfileAvatar] = useState(null);

  // --- 状态控制 ---
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

  // 用于嵌入式显示时间格式提示或错误的状态
  const [timeNotice, setTimeNotice] = useState('Use 24-hour format (00-23)');
  const [isNoticeError, setIsNoticeError] = useState(false);

  // ==================== 🔄 初始化拉取 Supabase 数据 ====================
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 1. 获取当前登录用户的 Auth 信息
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setProfileName('GUEST');
          return;
        }
        setVendorId(user.id);

        // 2. 并发读取商家 Profile 以及现有的运营状态（若有）
        const [profileRes, statusRes] = await Promise.all([
          supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
          supabase.from('vendor_statuses').select('*').eq('vendor_id', user.id).maybeSingle()
        ]);

        // 绑定侧边栏个人信息
        if (profileRes.data) {
          setProfileName(profileRes.data.full_name || 'No Name');
          setProfileAvatar(profileRes.data.avatar_url || null);
        }

        // 自动回填已有的运营状态数据（提升用户体验）
        if (statusRes.data) {
          const currentStatus = statusRes.data;
          setStatus(currentStatus.status);
          setDateStartText(currentStatus.date_start);
          setDateEndText(currentStatus.date_end);
          setDateStart(new Date(currentStatus.date_start));
          setDateEnd(new Date(currentStatus.date_end));

          // 拆分时间字段 (例如 "09:30:00" -> ["09", "30"])
          if (currentStatus.time_start) {
            const [sh, sm] = currentStatus.time_start.split(':');
            setTimeStartHour(sh);
            setTimeStartMin(sm);
          }
          if (currentStatus.time_end) {
            const [eh, em] = currentStatus.time_end.split(':');
            setTimeEndHour(eh);
            setTimeEndMin(em);
          }
        }
      } catch (err) {
        console.error('Initialization failed:', err);
        setProfileName('ERROR');
      }
    };

    initializeData();
  }, []);

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

  // 处理侧边栏导航点击
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false);
    if (targetScreen === 'operationstatus') return;
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

  // ==================== 💾 核心修改：提交并同步到 Supabase ====================
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

    // 格式化为标准的 HH:MM:SS 供 Postgres 的 time 类型读取
    const formattedTimeStart = `${timeStartHour.padStart(2, '0')}:${timeStartMin.padStart(2, '0')}:00`;
    const formattedTimeEnd = `${timeEndHour.padStart(2, '0')}:${timeEndMin.padStart(2, '0')}:00`;

    try {
      // 写入数据库：使用 upsert，依靠 vendor_id 的唯一性约束覆盖旧记录
      const { error } = await supabase
        .from('vendor_statuses')
        .upsert({
          vendor_id: vendorId,
          date_start: dateStartText,
          date_end: dateEndText,
          time_start: formattedTimeStart,
          time_end: formattedTimeEnd,
          status: status
        }, { onConflict: 'vendor_id' });

      if (error) {
        Alert.alert("Error", "Failed to upload status: " + error.message);
      } else {
        Alert.alert(
          "Success",
          `Status updated successfully!\nStatus: ${status}\nDate: ${dateStartText} to ${dateEndText}\nTime: ${timeStartHour}:${timeStartMin} - ${timeEndHour}:${timeEndMin}`
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "An unexpected network error occurred.");
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
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            {/* 👤 头像区域（已改为从 Supabase 获取的真实状态数据） */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {profileAvatar ? (
                  <Image source={{ uri: profileAvatar }} style={styles.sidebarAvatarImage} />
                ) : (
                  <Ionicons name="person-outline" size={45} color="#000" />
                )}
              </View>
              <Text style={styles.avatarName}>{profileName}</Text>
            </View>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('operationstatus')}>
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

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

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

          {/* UPDATE 按钮 */}
          <TouchableOpacity style={styles.button} onPress={handleUpdateSubmit}>
            <Text style={styles.buttonText}>UPDATE</Text>
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
  button: { backgroundColor: '#A9A9A9', paddingVertical: 10, borderRadius: 20, marginTop: 35, width: '55%', alignSelf: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  /* ==================== 📌 Sidebar 样式表修复更新 ==================== */
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
    overflow: 'hidden' // 👈 确保头像图片超过圆形容器时被切圆
  },
  sidebarAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35
  },
  avatarName: {
    fontSize: 16, // 👈 增大字体，与 menu.js 一致
    fontWeight: 'bold',
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