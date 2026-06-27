import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useContext, useCallback } from 'react';
import { Calendar, LocaleConfig } from 'react-native-calendars'; // 🌟 替换了原先的 DateTimePicker
import { RiderContext } from './RiderProvider';
import { supabase } from '../../supabaseClient';
import {
  Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, ActivityIndicator
} from 'react-native';

// 🌟 显式配置 react-native-calendars 为纯英文
LocaleConfig.locales = {
  en: {
    monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    today: 'Today'
  }
};
LocaleConfig.defaultLocale = 'en';

export default function WorkingShift() {
  const navigation = useNavigation();
  const { avatarUri, riderName } = useContext(RiderContext);

  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // 🌟 新增：用于将 Date 对象转换为 YYYY-MM-DD 字符串传递给日历组件
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [currentDate, setCurrentDate] = useState(getToday());
  const [showPicker, setShowPicker] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  const initialShiftsTemplate = [
    { id: 1, time: '8.00AM - 10.00AM', duration: '2hrs', startHour: 8, state: 'available' },
    { id: 2, time: '10.00AM - 12.00PM', duration: '2hrs', startHour: 10, state: 'available' },
    { id: 3, time: '12.00PM - 2.00PM', duration: '2hrs', startHour: 12, state: 'available' },
    { id: 4, time: '2.00PM - 4.00PM', duration: '2hrs', startHour: 14, state: 'available' },
    { id: 5, time: '4.00PM - 6.00PM', duration: '2hrs', startHour: 16, state: 'available' },
  ];

  const [shiftsByDate, setShiftsByDate] = useState({});
  const currentDateKey = currentDate.toDateString();
  const currentShifts = shiftsByDate[currentDateKey] || initialShiftsTemplate;

  useFocusEffect(
    useCallback(() => {
      fetchTakenShifts();
    }, [currentDateKey])
  );

  const fetchTakenShifts = async () => {
    setIsLoadingShifts(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('rider_shifts')
        .select('shift_time')
        .eq('rider_id', session.user.id)
        .eq('shift_date', currentDateKey);

      if (error) {
        Alert.alert("Fetch Error", error.message);
      } else {
        const takenTimes = data ? data.map(d => d.shift_time) : [];
        
        const now = new Date();
        const isToday = currentDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();

        const updatedShifts = initialShiftsTemplate.map(shift => {
          let currentState = shift.state;

          if (isToday && currentHour >= (shift.startHour + 2)) {
            currentState = 'expired';
          } 
          else if (takenTimes.includes(shift.time)) {
            currentState = 'taken';
          }

          return { ...shift, state: currentState };
        });

        setShiftsByDate(prev => ({ ...prev, [currentDateKey]: updatedShifts }));
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const getWeekDays = (targetDate) => {
    const dateCopy = new Date(targetDate);
    const dayOfWeek = dateCopy.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(dateCopy.setDate(dateCopy.getDate() + distanceToMonday));

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekArray = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekArray.push({
        day: dayNames[i],
        date: nextDay.getDate().toString(),
        fullDate: nextDay
      });
    }
    return weekArray;
  };

  const weekDays = getWeekDays(currentDate);
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const currentMonthText = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const isPastDate = (dateToCheck) => {
    const copy = new Date(dateToCheck);
    copy.setHours(0, 0, 0, 0);
    return copy < getToday();
  };

  // 🌟 新增：处理自定义英文日历选定日期的逻辑
  const onCalendarDateSelect = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    setCurrentDate(selectedDate);
    setShowPicker(false);
  };

  const handleDatePress = (fullDate) => {
    if (!isPastDate(fullDate)) setCurrentDate(fullDate);
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    if (isPastDate(prev)) {
      Alert.alert("Notice", "Kept at today to prevent accessing past dates.");
      setCurrentDate(getToday());
      return;
    }
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    setCurrentDate(next);
  };

  const toggleShift = (id) => {
    const updatedShifts = currentShifts.map(shift => {
      if (shift.id === id) {
        if (shift.state === 'available') return { ...shift, state: 'selected' };
        if (shift.state === 'selected') return { ...shift, state: 'available' };
      }
      return shift;
    });
    setShiftsByDate({ ...shiftsByDate, [currentDateKey]: updatedShifts });
  };

  const handleSave = async () => {
    const selectedShifts = currentShifts.filter(shift => shift.state === 'selected');

    if (selectedShifts.length === 0) {
      Alert.alert("Notice", "Please select at least one available shift.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const shiftsToInsert = selectedShifts.map(shift => ({
        rider_id: session.user.id,
        shift_date: currentDateKey,
        shift_time: shift.time,
        duration: shift.duration
      }));

      const { data, error } = await supabase.from('rider_shifts').insert(shiftsToInsert).select();

      if (error) {
        Alert.alert("Save Failed ❌", error.message);
      } else if (!data || data.length === 0) {
        Alert.alert("Blocked by Database 🚫", "Insert failed! Please check if your RLS policy uses 'auth.uid() = rider_id'.");
      } else {
        Alert.alert("Success ✅", "Shifts saved successfully!");
        fetchTakenShifts(); 
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    const hasUnsavedChanges = currentShifts.some(shift => shift.state === 'selected');
    if (hasUnsavedChanges) {
      Alert.alert("Unsaved Changes", "You have selected shifts but haven't saved them. Are you sure you want to leave?", [
        { text: "No", style: "cancel" },
        { text: "Yes, Discard", style: "destructive", onPress: () => navigation.goBack() }
      ]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => setIsSidebarOpen(true)}>
          <View style={styles.menuIconBorder}>
            <Ionicons name="menu" size={26} color="black" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AVAILABLE SHIFTS</Text>
        <View style={{ width: 40, marginLeft: 15 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.monthNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButtonOutline}>
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}><Ionicons name="chevron-back" size={20} color="black" /></TouchableOpacity>
            <Text style={styles.monthText}>{currentMonthText}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}><Ionicons name="chevron-forward" size={20} color="black" /></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.iconButtonOutline}>
            <Ionicons name="calendar-outline" size={20} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekStrip}>
          {weekDays.map((item) => {
            const isActive = item.fullDate.toDateString() === currentDate.toDateString();
            const isPast = isPastDate(item.fullDate);
            return (
              <TouchableOpacity
                key={item.fullDate.toString()}
                style={[styles.dayBlock, isActive && styles.dayBlockActive, isPast && !isActive && styles.dayBlockPast]}
                onPress={() => handleDatePress(item.fullDate)}
                disabled={isPast} activeOpacity={0.7}
              >
                <Text style={[styles.dayName, isActive && styles.dayTextActive, isPast && !isActive && styles.dayTextPast]}>{item.day}</Text>
                <Text style={[styles.dayDate, isActive && styles.dayTextActive, isPast && !isActive && styles.dayTextPast]}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Available Shifts</Text>

          {isLoadingShifts ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 30 }} />
          ) : (
            currentShifts.map((shift) => {
              let btnStyle = styles.btnAvailable; 
              let btnTextStyle = styles.btnTextAvailable; 
              let btnLabel = "Take Shift"; 
              let cardHighlight = null;

              if (shift.state === 'selected') { 
                btnStyle = styles.btnSelected; 
                btnTextStyle = styles.btnTextSelected; 
                btnLabel = "Selected ✓"; 
                cardHighlight = styles.shiftCardSelected; 
              }
              else if (shift.state === 'taken') { 
                btnStyle = styles.btnTaken; 
                btnTextStyle = styles.btnTextTaken; 
                btnLabel = "Taken"; 
              }
              else if (shift.state === 'expired') { 
                btnStyle = styles.btnExpired; 
                btnTextStyle = styles.btnTextExpired; 
                btnLabel = "Expired"; 
              }

              const isDisabled = shift.state === 'taken' || shift.state === 'expired';

              return (
                <View key={shift.id} style={[styles.shiftCard, cardHighlight, isDisabled && { opacity: 0.6 }]}>
                  <View style={styles.shiftInfo}>
                    <Ionicons name="time-outline" size={20} color="#666" style={{ marginRight: 8, marginTop: 2 }} />
                    <View>
                      <Text style={[styles.shiftTime, isDisabled && styles.textDisabled]}>
                        {shift.time}
                      </Text>
                      <Text style={styles.shiftDuration}>({shift.duration})</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionBtn, btnStyle]} 
                    onPress={() => toggleShift(shift.id)} 
                    disabled={isDisabled} 
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionBtnText, btnTextStyle]}>{btnLabel}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} disabled={isSaving}>
          {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Shifts</Text>}
        </TouchableOpacity>
      </View>

      {/* 🌟 替换：将原先的 DateTimePicker 彻底移除，替换为纯英文样式的遮罩层 Modal 日历 */}
      {showPicker && (
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={formatDateString(currentDate)}
              minDate={formatDateString(getToday())}
              onDayPress={(day) => onCalendarDateSelect(day.dateString)}
              theme={{
                todayTextColor: '#2196F3',
                arrowColor: 'black',
                monthTextColor: 'black',
                textMonthFontWeight: 'bold',
              }}
            />
          </View>
        </View>
      )}

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
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Home'); }}>
                <Ionicons name="home-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>HOME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('Profile'); }}>
                <Ionicons name="person-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>PROFILE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItemActive} onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="calendar" size={22} color="#424242" style={styles.menuIconLeft} />
                <Text style={styles.menuTextActive}>WORKING SHIFT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('EarningsHistory'); }}>
                <Ionicons name="wallet-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>EARNINGS & HISTORY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation.navigate('ResetPassword'); }}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>RESET PASSWORD</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={async () => { setIsSidebarOpen(false); await supabase.auth.signOut(); }}><Ionicons name="log-out-outline" size={22} color="#FF3B30" style={{ marginRight: 12 }} /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
              <View style={{ height: Platform.OS === 'ios' ? 25 : 45, backgroundColor: '#FFF' }} />
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, marginTop: 30, backgroundColor: '#FFF', borderBottomWidth: 1.5, borderBottomColor: '#E0E0E0' },
  menuIcon: { paddingHorizontal: 5 },
  menuIconBorder: { width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: '#000', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  monthNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF' },
  iconButtonOutline: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  monthSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15, textAlign: 'center' },
  arrowBtn: { padding: 5 },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  dayBlock: { width: 45, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#F0F0F0' },
  dayBlockActive: { backgroundColor: '#424242', elevation: 4, shadowColor: '#424242', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  dayBlockPast: { backgroundColor: '#E8E8E8' },
  dayName: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  dayDate: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  dayTextActive: { color: '#FFF' },
  dayTextPast: { color: '#A0A0A0' },
  listContainer: { flex: 1, padding: 20 },
  listHeader: { fontWeight: 'bold', fontSize: 14, color: '#666', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  shiftCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, marginBottom: 12, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#FFF' },
  shiftCardSelected: { borderColor: '#424242', backgroundColor: '#F5F5F5' },
  shiftInfo: { flexDirection: 'row', alignItems: 'flex-start' },
  shiftTime: { fontWeight: 'bold', fontSize: 15, color: '#000' },
  textDisabled: { color: '#A0A0A0' },
  shiftDuration: { color: '#888', fontSize: 13, marginTop: 4 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5 },
  actionBtnText: { fontWeight: 'bold', fontSize: 13 },
  btnAvailable: { backgroundColor: '#FFF', borderColor: '#000' },
  btnTextAvailable: { color: '#000' },
  btnSelected: { backgroundColor: '#424242', borderColor: '#424242' },
  btnTextSelected: { color: '#FFF' },
  btnTaken: { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' },
  btnTextTaken: { color: '#A0A0A0' },
  btnExpired: { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' },
  btnTextExpired: { color: '#B0B0B0', textDecorationLine: 'line-through' },
  footerRow: { flexDirection: 'row', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  saveBtn: { flex: 1, paddingVertical: 15, borderRadius: 10, backgroundColor: '#424242', alignItems: 'center', elevation: 3, shadowColor: '#424242', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  saveBtnText: { fontWeight: 'bold', fontSize: 16, color: '#FFF' },
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
  logoutText: { fontSize: 15, fontWeight: 'bold', color: '#FF3B30' },
  
  // 🌟 新增：全英文自定义日历弹窗的遮罩样式
  calendarModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calendarModalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  calendarModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});