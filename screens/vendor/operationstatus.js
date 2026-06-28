import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Default business hours
const DEFAULT_OPEN  = '09:00';
const DEFAULT_CLOSE = '22:00';

export default function OperationStatusApp({ onBack, navigateToScreen }) {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Supabase profile ──────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl,   setAvatarUrl]   = useState(null);

  // ── Calendar navigation ───────────────────────────────────────────────────
  const today         = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  // ── Records fetched from Supabase ─────────────────────────────────────────
  const [records,        setRecords]        = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // ── Form / edit state ─────────────────────────────────────────────────────
  const [editingRecord, setEditingRecord] = useState(null); // null = add mode

  const [dateStart,     setDateStart]     = useState(new Date());
  const [dateEnd,       setDateEnd]       = useState(new Date());
  const [showPickerStart, setShowPickerStart] = useState(false);
  const [showPickerEnd,   setShowPickerEnd]   = useState(false);
  const [dateStartText, setDateStartText] = useState('');
  const [dateEndText,   setDateEndText]   = useState('');

  const [timeStartHour, setTimeStartHour] = useState('');
  const [timeStartMin,  setTimeStartMin]  = useState('');
  const [timeEndHour,   setTimeEndHour]   = useState('');
  const [timeEndMin,    setTimeEndMin]    = useState('');

  const [status, setStatus] = useState('inactive');

  const [isLoading,     setIsLoading]     = useState(false);
  const [timeNotice,    setTimeNotice]    = useState('Use 24-hour format (00-23)');
  const [isNoticeError, setIsNoticeError] = useState(false);

  // ── Scroll ref so we can jump to the form when a date is tapped ──────────
  const scrollRef = React.useRef(null);
  const formYRef  = React.useRef(0);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getTodayMidnight = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatDate(today);

  const checkIfStartTimeIsPast = useCallback((hour, min) => {
    if (!hour || !min) return false;
    if (dateStartText !== todayStr) return false;
    
    const now = new Date();
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    if (isNaN(h) || isNaN(m)) return false;
    
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    if (h < currentHour || (h === currentHour && m < currentMin)) {
      return true;
    }
    return false;
  }, [dateStartText, todayStr]);

  // Build a Set of all YYYY-MM-DD strings that fall inside any record's range
  const buildHighlightSet = useCallback((recs) => {
    const set = new Set();
    recs.forEach((r) => {
      const start = new Date(r.date_start);
      const end   = new Date(r.date_end);
      const cur   = new Date(start);
      while (cur <= end) {
        set.add(formatDate(cur));
        cur.setDate(cur.getDate() + 1);
      }
    });
    return set;
  }, []);

  // ── Fetch records from Supabase ───────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('operation_status')
        .select('*')
        .eq('user_id', user.id)
        .order('date_start', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.log('fetchRecords error:', err.message);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) { setProfileName('Guest'); return; }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;
        if (profile?.full_name) setProfileName(profile.full_name);
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      } catch (error) {
        console.log('Fetch profile error:', error.message);
        setProfileName('User');
      }
    };
    fetchUserProfile();
    fetchRecords();
  }, [fetchRecords]);

  // ── Sidebar navigation ────────────────────────────────────────────────────
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false);
    if (targetScreen === 'operationstatus') return;
    if (navigateToScreen) navigateToScreen(targetScreen);
    else if (onBack) onBack(targetScreen);
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Build grid cells for the current calendar month
  const buildCalendarGrid = () => {
    const firstDay   = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // pad to fill last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  // Find record(s) that cover a given date string
  const getRecordForDate = (dateStr) =>
    records.find((r) => {
      const s = new Date(r.date_start);
      const e = new Date(r.date_end);
      const d = new Date(dateStr);
      return d >= s && d <= e;
    });

  const highlightSet = buildHighlightSet(records);

  // ── Tapping a calendar day ────────────────────────────────────────────────
  const handleDayPress = (day) => {
    if (!day) return;
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr < todayStr) return; // Prevent selecting past dates
    const existing = getRecordForDate(dateStr);

    if (existing) {
      // Pre-fill form with existing record for editing
      setEditingRecord(existing);
      const sDate = new Date(existing.date_start);
      const eDate = new Date(existing.date_end);
      setDateStart(sDate);
      setDateEnd(eDate);
      setDateStartText(existing.date_start);
      setDateEndText(existing.date_end);
      const [sh, sm] = existing.time_start.split(':');
      const [eh, em] = existing.time_end.split(':');
      setTimeStartHour(sh);
      setTimeStartMin(sm);
      setTimeEndHour(eh);
      setTimeEndMin(em);
      setStatus(existing.status);
    } else {
      // Pre-fill form for new inactive entry on that date
      setEditingRecord(null);
      const d = new Date(dateStr);
      setDateStart(d);
      setDateEnd(d);
      setDateStartText(dateStr);
      setDateEndText(dateStr);

      let startH = 9;
      let startM = 0;
      let endH = 22;
      let endM = 0;

      const now = new Date();
      if (dateStr === todayStr) {
        const curH = now.getHours();
        if (curH >= 9) {
          startH = Math.min(23, curH + 1);
          startM = 0;
        }
      }
      if (startH >= 22) {
        endH = Math.min(23, startH);
        endM = 59;
      }

      setTimeStartHour(String(startH).padStart(2, '0'));
      setTimeStartMin(String(startM).padStart(2, '0'));
      setTimeEndHour(String(endH).padStart(2, '0'));
      setTimeEndMin(String(endM).padStart(2, '0'));
      setStatus('inactive');
    }

    // Scroll to form
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: formYRef.current, animated: true });
    }, 100);
  };

  // ── Edit a record directly from the card list ─────────────────────────────
  // (safe regardless of which calendar month is currently shown)
  const handleEditRecord = (record) => {
    // Navigate calendar to the month of the record's start date
    const [y, m] = record.date_start.split('-').map(Number);
    setCalYear(y);
    setCalMonth(m - 1); // 0-indexed

    // Fill the form
    setEditingRecord(record);
    const sDate = new Date(record.date_start);
    const eDate = new Date(record.date_end);
    setDateStart(sDate);
    setDateEnd(eDate);
    setDateStartText(record.date_start);
    setDateEndText(record.date_end);
    const [sh, sm] = record.time_start.split(':');
    const [eh, em] = record.time_end.split(':');
    setTimeStartHour(sh);
    setTimeStartMin(sm);
    setTimeEndHour(eh);
    setTimeEndMin(em);
    setStatus(record.status);

    // Scroll to form
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: formYRef.current, animated: true });
    }, 100);
  };

  // ── Delete a record ───────────────────────────────────────────────────────
  const handleDeleteRecord = (record) => {
    Alert.alert(
      'Delete Record',
      `Remove override for ${record.date_start}${record.date_start !== record.date_end ? ` – ${record.date_end}` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('operation_status')
                .delete()
                .eq('id', record.id);
              if (error) throw error;
              if (editingRecord?.id === record.id) clearForm();
              fetchRecords();
            } catch (err) {
              Alert.alert('Error ❌', err.message);
            }
          },
        },
      ]
    );
  };

  // ── Clear form ────────────────────────────────────────────────────────────
  const clearForm = () => {
    setEditingRecord(null);
    setDateStartText('');
    setDateEndText('');
    setTimeStartHour('');
    setTimeStartMin('');
    setTimeEndHour('');
    setTimeEndMin('');
    setStatus('inactive');
  };

  // ── Date pickers ──────────────────────────────────────────────────────────
  const onChangeDateStart = (event, selectedDate) => {
    setShowPickerStart(Platform.OS === 'ios');
    if (!selectedDate) return;
    if (selectedDate < getTodayMidnight()) {
      Alert.alert('Error', 'Start date cannot be earlier than today!');
      return;
    }
    setDateStart(selectedDate);
    const formatted = formatDate(selectedDate);
    setDateStartText(formatted);

    // Check if the current start time is in the past for this new date
    if (formatted === todayStr && timeStartHour && timeStartMin) {
      const isPast = checkIfStartTimeIsPast(timeStartHour, timeStartMin);
      if (isPast) {
        setTimeNotice('Start time cannot be in the past!');
        setIsNoticeError(true);
      }
    } else {
      setTimeNotice('Use 24-hour format (00-23)');
      setIsNoticeError(false);
    }

    if (dateEndText && selectedDate > dateEnd) {
      setDateEnd(selectedDate);
      setDateEndText(formatted);
    }
  };

  const onChangeDateEnd = (event, selectedDate) => {
    setShowPickerEnd(Platform.OS === 'ios');
    if (!selectedDate) return;
    const compare = new Date(dateStartText || getTodayMidnight());
    compare.setHours(0, 0, 0, 0);
    if (selectedDate < compare) {
      Alert.alert('Error', 'End date cannot be earlier than Start date!');
      return;
    }
    setDateEnd(selectedDate);
    setDateEndText(formatDate(selectedDate));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateHours = (val, setter) => {
    if (val === '') return;
    const h = parseInt(val, 10);
    if (isNaN(h) || h < 0 || h > 23) {
      setTimeNotice('Hours must be between 0 and 23!');
      setIsNoticeError(true);
      setter('');
      return;
    }

    if (setter === setTimeStartHour) {
      const isPast = checkIfStartTimeIsPast(val, timeStartMin);
      if (isPast) {
        setTimeNotice('Start time cannot be in the past!');
        setIsNoticeError(true);
        return;
      }
    }

    setTimeNotice('Use 24-hour format (00-23)');
    setIsNoticeError(false);
  };

  const validateMinutes = (val, setter) => {
    if (val === '') return;
    const m = parseInt(val, 10);
    if (isNaN(m) || m < 0 || m > 59) {
      setTimeNotice('Minutes cannot exceed 59!');
      setIsNoticeError(true);
      setter('');
      return;
    }

    if (setter === setTimeStartMin) {
      const isPast = checkIfStartTimeIsPast(timeStartHour, val);
      if (isPast) {
        setTimeNotice('Start time cannot be in the past!');
        setIsNoticeError(true);
        return;
      }
    }

    setTimeNotice('Use 24-hour format (00-23)');
    setIsNoticeError(false);
  };

  const handleHourFocus = () => {
    setTimeNotice('Please use 24-hour format (00-23).');
    setIsNoticeError(false);
  };

  // ── Submit (Insert or Update) ─────────────────────────────────────────────
  const handleUpdateSubmit = async () => {
    if (!dateStartText || !dateEndText || !timeStartHour || !timeStartMin || !timeEndHour || !timeEndMin) {
      Alert.alert('Error', 'Please fill in all date and time fields!');
      return;
    }

    const sH = parseInt(timeStartHour, 10);
    const sM = parseInt(timeStartMin,  10);
    const eH = parseInt(timeEndHour,   10);
    const eM = parseInt(timeEndMin,    10);

    if (sH > 23 || eH > 23 || sM > 59 || eM > 59) {
      setTimeNotice('Hours max 23, Minutes max 59.');
      setIsNoticeError(true);
      return;
    }

    const [sYear, sMonth, sDay] = dateStartText.split('-').map(Number);
    const [eYear, eMonth, eDayVal] = dateEndText.split('-').map(Number);

    const startDateTime = new Date(sYear, sMonth - 1, sDay, sH, sM, 0, 0);
    const endDateTime   = new Date(eYear, eMonth - 1, eDayVal, eH, eM, 0, 0);
    const nowCompare    = new Date();
    nowCompare.setSeconds(0, 0);

    if (startDateTime < nowCompare) {
      Alert.alert('Error', 'Start date and time cannot be in the past!');
      return;
    }
    if (endDateTime <= startDateTime) {
      Alert.alert('Error', 'End date and time must be after Start date and time!');
      return;
    }

    const startTimeStr = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
    const endTimeStr   = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User session not found. Please log in again.');

      if (editingRecord) {
        // ── UPDATE existing row ──
        const { error: updateError } = await supabase
          .from('operation_status')
          .update({
            date_start: dateStartText,
            date_end:   dateEndText,
            time_start: startTimeStr,
            time_end:   endTimeStr,
            status,
          })
          .eq('id', editingRecord.id);
        if (updateError) throw updateError;
        Alert.alert('Updated ✅', `Record updated!\nStatus: ${status}\n${dateStartText} → ${dateEndText}\n${startTimeStr} – ${endTimeStr}`);
      } else {
        // ── INSERT new row ──
        const { error: insertError } = await supabase
          .from('operation_status')
          .insert({
            user_id:    user.id,
            date_start: dateStartText,
            date_end:   dateEndText,
            time_start: startTimeStr,
            time_end:   endTimeStr,
            status,
          });
        if (insertError) throw insertError;
        Alert.alert('Saved ✅', `New override saved!\nStatus: ${status}\n${dateStartText} → ${dateEndText}\n${startTimeStr} – ${endTimeStr}`);
      }

      clearForm();
      fetchRecords();
    } catch (err) {
      console.log('Save error:', err.message);
      Alert.alert('Error ❌', err.message || 'Failed to save.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render calendar ───────────────────────────────────────────────────────
  const cells     = buildCalendarGrid();
  const cellWidth = (width - 56) / 7; // 28px padding each side

  const renderCalendar = () => (
    <View style={styles.calendarCard}>
      {/* Month navigation */}
      <View style={styles.calMonthRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.calMonthLabel}>
          {MONTH_NAMES[calMonth]} {calYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.calDayHeaderRow}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={[styles.calDayHeader, { width: cellWidth }]}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.calGrid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={{ width: cellWidth, height: 36 }} />;

          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isInactive = highlightSet.has(dateStr);
          const isToday    = dateStr === todayStr;
          const isPast     = dateStr < todayStr;
          const isSelected = editingRecord
            ? (dateStr >= editingRecord.date_start && dateStr <= editingRecord.date_end)
            : (dateStr === dateStartText && dateStr === dateEndText && dateStartText !== '');

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.calCell,
                { width: cellWidth, height: 36 },
                isInactive && styles.calCellInactive,
                isToday    && !isInactive && styles.calCellToday,
                isSelected && styles.calCellSelected,
                isPast     && styles.calCellPast,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={isPast}
              activeOpacity={isPast ? 1 : 0.7}
            >
              <Text style={[
                styles.calCellText,
                isInactive && styles.calCellTextInactive,
                isToday    && !isInactive && styles.calCellTextToday,
                isPast     && styles.calCellTextPast,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#000' }]} />
          <Text style={styles.legendText}>Active (default 09:00–22:00)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>Inactive / Custom</Text>
        </View>
      </View>
    </View>
  );

  // ── Render record cards ───────────────────────────────────────────────────
  const renderRecordCards = () => {
    if (calendarLoading) {
      return <ActivityIndicator size="small" color="#000" style={{ marginVertical: 12 }} />;
    }
    if (records.length === 0) {
      return (
        <Text style={styles.noRecordsText}>
          No overrides saved yet. Tap a date to add one.
        </Text>
      );
    }
    return records.map((r) => {
      const isEditing = editingRecord?.id === r.id;
      const isInactiveRecord = r.status === 'inactive';
      const isPastRecord = r.date_end < todayStr;
      return (
        <View key={r.id} style={[styles.recordCard, isEditing && styles.recordCardEditing]}>
          <View style={styles.recordCardLeft}>
            <View style={[styles.statusBadge, isInactiveRecord ? styles.badgeInactive : styles.badgeActive]}>
              <Text style={styles.badgeText}>{r.status.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.recordDateText}>
                {r.date_start === r.date_end ? r.date_start : `${r.date_start} → ${r.date_end}`}
              </Text>
              <Text style={styles.recordTimeText}>{r.time_start} – {r.time_end}</Text>
            </View>
          </View>
          <View style={styles.recordCardActions}>
            {!isPastRecord && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => handleEditRecord(r)}
              >
                <Ionicons name="pencil-outline" size={14} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn, { marginLeft: 6 }]}
              onPress={() => handleDeleteRecord(r)}
            >
              <Ionicons name="trash-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ==================== Sidebar Modal ==================== */}
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

            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 68, height: 68, borderRadius: 34 }} />
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

      {/* ==================== Header ==================== */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.backButton}>
          <Ionicons name="menu" size={35} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operation Status</Text>
        <View style={{ width: 35 }} />
      </View>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Default hours notice ── */}
          <View style={styles.defaultNoticeBox}>
            <Ionicons name="time-outline" size={16} color="#27ae60" />
            <Text style={styles.defaultNoticeText}>
              Default hours: {DEFAULT_OPEN} – {DEFAULT_CLOSE} (active every day)
            </Text>
          </View>

          {/* ── Calendar ── */}
          {renderCalendar()}

          {/* ── Saved override records ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Overrides</Text>
            {records.length > 0 && (
              <Text style={styles.sectionCount}>{records.length} record{records.length !== 1 ? 's' : ''}</Text>
            )}
          </View>
          {renderRecordCards()}

          {/* ── Divider before form ── */}
          <View
            style={styles.formDivider}
            onLayout={(e) => { formYRef.current = e.nativeEvent.layout.y; }}
          >
            <View style={styles.formDividerLine} />
            <Text style={styles.formDividerLabel}>
              {editingRecord ? '✏️  Edit Override' : '＋  Add Override'}
            </Text>
            <View style={styles.formDividerLine} />
          </View>

          {editingRecord && (
            <TouchableOpacity style={styles.cancelEditBtn} onPress={clearForm}>
              <Ionicons name="close-circle-outline" size={16} color="#e74c3c" />
              <Text style={styles.cancelEditText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}

          {/* ── Date Start ── */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Date Start:</Text>
            <TouchableOpacity style={styles.dateBoxContainer} onPress={() => setShowPickerStart(true)}>
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
              minimumDate={getTodayMidnight()}
            />
          )}

          {/* ── Date End ── */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Date End:</Text>
            <TouchableOpacity style={styles.dateBoxContainer} onPress={() => setShowPickerEnd(true)}>
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
              minimumDate={dateStartText ? dateStart : getTodayMidnight()}
            />
          )}

          {/* ── Time Start ── */}
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

          {/* ── Time End ── */}
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

          {/* ── Notice ── */}
          <View style={styles.noticeContainer}>
            <Text style={[styles.noticeText, isNoticeError ? styles.noticeError : styles.noticeNormal]}>
              {timeNotice}
            </Text>
          </View>

          {/* ── Status ── */}
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

          {/* ── Submit button ── */}
          <TouchableOpacity style={styles.button} onPress={handleUpdateSubmit} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{editingRecord ? 'SAVE CHANGES' : 'UPDATE'}</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 15 : 35,
  },
  backButton: { width: 35, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#000', textAlign: 'center' },
  divider:     { height: 1, backgroundColor: '#000', width: '100%' },
  keyboardAvoid:   { flex: 1 },
  scrollContainer: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 60 },

  // ── Default notice ──
  defaultNoticeBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eafaf1', borderRadius: 8, padding: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#a9dfbf',
  },
  defaultNoticeText: { marginLeft: 8, fontSize: 13, color: '#1e8449', fontWeight: '500' },

  // ── Calendar ──
  calendarCard: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 4,
    backgroundColor: '#fafafa', marginBottom: 20,
  },
  calMonthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, marginBottom: 10,
  },
  calNavBtn:     { padding: 6 },
  calMonthLabel: { fontSize: 16, fontWeight: '700', color: '#000' },

  calDayHeaderRow: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 0 },
  calDayHeader:    { textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#888' },

  calGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:    { alignItems: 'center', justifyContent: 'center', borderRadius: 6, margin: 1 },
  calCellInactive: { backgroundColor: '#fde8e8' },
  calCellToday:    { backgroundColor: '#eaf0fb', borderWidth: 1, borderColor: '#3b82f6' },
  calCellSelected: { backgroundColor: '#d4edda', borderWidth: 1, borderColor: '#27ae60' },
  calCellPast:     { backgroundColor: '#f3f4f6', opacity: 0.5 },

  calCellText:         { fontSize: 13, color: '#000' },
  calCellTextInactive: { color: '#c0392b', fontWeight: '700' },
  calCellTextToday:    { color: '#2563eb', fontWeight: '700' },
  calCellTextPast:     { color: '#9ca3af' },

  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginTop: 10, paddingHorizontal: 8, gap: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 },
  legendDot:  { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
  legendText: { fontSize: 11, color: '#555' },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#000' },
  sectionCount: { fontSize: 12, color: '#888' },

  noRecordsText: { fontSize: 13, color: '#aaa', textAlign: 'center', marginBottom: 16 },

  // ── Record card ──
  recordCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, marginBottom: 8, backgroundColor: '#fff',
  },
  recordCardEditing: { borderColor: '#27ae60', backgroundColor: '#f0fdf4' },
  recordCardLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  recordCardActions: { flexDirection: 'row' },

  statusBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  badgeInactive: { backgroundColor: '#e74c3c' },
  badgeActive:   { backgroundColor: '#27ae60' },
  badgeText:     { fontSize: 10, fontWeight: '700', color: '#fff' },

  recordDateText: { fontSize: 13, fontWeight: '600', color: '#000' },
  recordTimeText: { fontSize: 12, color: '#555', marginTop: 2 },

  actionBtn:  { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  editBtn:    { backgroundColor: '#3b82f6' },
  deleteBtn:  { backgroundColor: '#e74c3c' },

  // ── Form divider ──
  formDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20,
  },
  formDividerLine:  { flex: 1, height: 1, backgroundColor: '#ddd' },
  formDividerLabel: { marginHorizontal: 10, fontSize: 13, fontWeight: '600', color: '#555' },

  cancelEditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  cancelEditText: { fontSize: 13, color: '#e74c3c', marginLeft: 5 },

  // ── Form fields (preserved from original) ──
  inputGroupRow:    { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 18 },
  fieldLabel:       { fontSize: 14, fontWeight: '500', color: '#000', width: 100 },
  dateBoxContainer: {
    borderWidth: 1, borderColor: '#000', borderRadius: 2,
    minWidth: 90, paddingHorizontal: 8, height: 28,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  dateBoxText: { fontSize: 13, color: '#000', fontWeight: '500' },
  timeGroup:   { flexDirection: 'row', alignItems: 'center' },
  timeInput:   {
    borderWidth: 1, borderColor: '#000', borderRadius: 2,
    width: 70, height: 28, backgroundColor: '#fff',
    textAlign: 'center', fontSize: 13, padding: 0,
  },
  colon: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, color: '#000' },

  noticeContainer: { paddingLeft: 100, marginBottom: 18, marginTop: -8 },
  noticeText:      { fontSize: 12, fontWeight: '500' },
  noticeNormal:    { color: '#7f8c8d' },
  noticeError:     { color: '#ff4d4d' },

  radioGroup:  { flexDirection: 'row', alignItems: 'center' },
  radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radioCircle: {
    height: 14, width: 14, borderRadius: 7,
    borderWidth: 1, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  radioDot:   { height: 8, width: 8, borderRadius: 4, backgroundColor: '#000' },
  radioLabel: { fontSize: 12, color: '#000' },

  button: {
    backgroundColor: '#A9A9A9', paddingVertical: 10, borderRadius: 20,
    marginTop: 35, width: '55%', alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', height: 44,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  // ── Sidebar ──
  modalContainer: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: Dimensions.get('window').width * 0.75,
    height: '100%', backgroundColor: '#fff',
    borderRightWidth: 2, borderRightColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 25, zIndex: 10,
  },
  sidebarHeader:     { paddingHorizontal: 15, paddingBottom: 10 },
  avatarSection:     { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1.5, borderBottomColor: '#000', marginBottom: 10 },
  avatarCircle:      { width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, borderColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden' },
  avatarName:        { fontSize: 12, fontWeight: '500', color: '#000', marginTop: 5 },
  sidebarItem:       { width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1.5, borderBottomColor: '#000', alignItems: 'center' },
  sidebarActiveItem: { backgroundColor: '#A9A9A9' },
  sidebarItemText:   { fontSize: 22, color: '#000', fontWeight: 'normal' },
  sidebarFooter:     { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, borderTopColor: '#000', paddingVertical: 12, backgroundColor: '#fff' },
  logoutButton:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText:        { fontSize: 22, color: '#000', marginLeft: 10 },
  backdrop:          { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
});