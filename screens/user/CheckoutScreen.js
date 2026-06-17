import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 引入 Expo 原生或通用的日期选择器（仅保留日期选择即可）
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CheckoutScreen({ route, navigation }) {
  // 1. 接收来自主页/购物车的共享数据
  const { items = [], remarks = "Don't want nuts, thanks." } = route?.params || {};

  // ==================== 【营业时间与动态 Slot 计算】 ====================
  const getNowDate = () => new Date();

  // 检查现在是否在实时营业时间内 (8:00 AM - 6:00 PM)
  const isWithinOperationTime = () => {
    const now = getNowDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const nowMinutes = currentHour * 60 + currentMinute;
    return nowMinutes >= (8 * 60) && nowMinutes < (18 * 60);
  };

  const isOperating = isWithinOperationTime(); // 布尔值：当前食堂是否在营业

  // 根据你要求的 8:30 AM 至 6:00 PM，生成每半小时一档的 Time Slots 列表
  const timeSlots = [
    "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM",
    "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM"
  ];
  // ======================================================================

  // 2. 核心状态控制（若打烊，默认切到 Preorder 允许用户继续下单）
  const [orderType, setOrderType] = useState('Delivery');
  const [timingSelection, setTimingSelection] = useState(isOperating ? 'Order Now' : 'Preorder');
  const [campusBuilding, setCampusBuilding] = useState('Hostel HB 3 & 4');

  // ==================== 【优化：智能计算 Preorder 最小日期】 ====================
  const getPreorderMinDate = () => {
    const now = getNowDate();
    // 如果今天已经超过或等于 18 点 (6:00 PM)，说明今天的打烊时间已过
    if (now.getHours() >= 18) {
      const tomorrow = getNowDate();
      tomorrow.setDate(tomorrow.getDate() + 1); // 强制把最小可选日期推到明天
      return tomorrow;
    }
    return now; // 6:00 PM 之前，今天依旧可选
  };

  // 🌟 核心提前：将校验函数放在状态初始化之前，防止变量找不到报错
  const isSlotExpiredByDate = (slotString, targetDate) => {
    const now = getNowDate();
    if (targetDate.toDateString() !== now.toDateString()) {
      return false;
    }

    const [time, modifier] = slotString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const slotTotalMinutes = hours * 60 + minutes;
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    return slotTotalMinutes <= currentTotalMinutes;
  };

  // 3. 日期与自定义 Time Slot 选择器状态
  const [date, setDate] = useState(getPreorderMinDate());

  // 🌟 闭盘绝杀：这里让初始化默认选择今天第一个未过期的时间段！
  const [selectedSlot, setSelectedSlot] = useState(() => {
    const initialDate = getPreorderMinDate();
    const firstValidSlot = timeSlots.find(slot => !isSlotExpiredByDate(slot, initialDate));
    return firstValidSlot || timeSlots[0];
  });
  // ======================================================================

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false); // 控制下拉 Slots 区域展示

  const isSlotExpired = (slotString) => {
    return isSlotExpiredByDate(slotString, date);
  };

  // 格式化当前时间展示
  const formatCurrentTime = () => {
    return getNowDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // 日期格式化方法
  const formatDate = (targetDate) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' };
    return targetDate.toLocaleDateString('en-MY', options);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      // 当用户手动切换日期时，如果切回今天导致原本选中的时间段已经过期，自动重置为可用的第一个最早时段！
      const firstValid = timeSlots.find(slot => !isSlotExpiredByDate(slot, selectedDate));
      if (firstValid) setSelectedSlot(firstValid);
    }
  };

  // 模拟固定数据
  const walletBalance = 40.00;
  const [vendorAddress, setVendorAddress] = useState("MMU Campus Cafeteria - Vendor Stall 2 (Malay Cuisine)");

  // 4. 金额计算逻辑
  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = itemsTotal * 0.05;
  const subtotalWithTax = itemsTotal + tax;
  const deliveryFee = orderType === 'Delivery' ? 5.00 : 0.00;
  const totalPayment = subtotalWithTax + deliveryFee;

  // 下单时电子钱包余额精准校验与充值引导
  const handlePlaceOrder = () => {
    if (walletBalance < totalPayment) {
      const shortAmount = totalPayment - walletBalance;
      Alert.alert(
        "Insufficient Balance",
        `Your Campus Wallet balance is insufficient.\n\n` +
        `• Total Payment: RM ${totalPayment.toFixed(2)}\n` +
        `• Current Balance: RM ${walletBalance.toFixed(2)}\n` +
        `• Shortfall: RM ${shortAmount.toFixed(2)}\n\n` +
        `Please top up your wallet.`,
        [{ text: "Cancel", style: "cancel" }, { text: "Top-up Now" }]
      );
      return;
    }

    const newBalance = walletBalance - totalPayment;

    Alert.alert(
      "Payment Successful! 🎉",
      `Your order has been placed!\n\n` +
      `📅 Date: ${formatDate(date)}\n` +
      `⏰ Time: ${timingSelection === 'Order Now' ? 'ASAP' : selectedSlot}\n` +
      `💰 Total Paid: RM ${totalPayment.toFixed(2)}\n` +
      `📱 eWallet Balance: RM ${newBalance.toFixed(2)}\n\n`,
      [
        {
          text: "View Order Status",
          onPress: () => {
            navigation.navigate('OrderTracking', {
              orderDate: formatDate(date),
              orderTime: timingSelection === 'Order Now' ? 'ASAP' : selectedSlot
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ==================== SCROLLABLE CONTENT ==================== */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>

        {/* ==================== 1. ORDER SUMMARY CARD ==================== */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{items.length} Items</Text></View>
          </View>

          {/* 🌟 核心修改：用 map 动态渲染购物车里真实的食物数据，彻底打通连接！ */}
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <View style={styles.itemRow} key={index}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>RM {(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))
          ) : (
            // 安全退路：如果没有数据传过来，显示一个提示
            <Text style={{ color: '#999', fontSize: 14, marginVertical: 10 }}>No items in order</Text>
          )}

          <View style={styles.dashedDivider} />
          <Text style={styles.remarkLabel}>Special Remarks:</Text>
          <Text style={styles.remarkValue}>{remarks}</Text>
        </View>

        {/* ==================== 2. FULFILLMENT & LOGISTICS ==================== */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'Delivery' && styles.toggleBtnActive]}
            onPress={() => setOrderType('Delivery')}
          >
            <Ionicons name="bicycle-outline" size={18} color={orderType === 'Delivery' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, orderType === 'Delivery' && styles.toggleTextActive]}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'Pick up' && styles.toggleBtnActive]}
            onPress={() => setOrderType('Pick up')}
          >
            <Ionicons name="storefront-outline" size={18} color={orderType === 'Pick up' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, orderType === 'Pick up' && styles.toggleTextActive]}>Pick up</Text>
          </TouchableOpacity>
        </View>

        {orderType === 'Delivery' ? (
          <View style={styles.card}>
            <Text style={styles.inputHeading}>Campus Delivery Building</Text>
            <TouchableOpacity style={styles.selectorSelector} onPress={() => Alert.alert("Select Campus Building", "Import from database later...")}>
              <View style={styles.rowAlign}>
                <Ionicons name="location" size={20} color="#FF8C32" style={{ marginRight: 8 }} />
                <Text style={styles.selectorValueText}>{campusBuilding}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: '#F9F9F9' }]}>
            <Text style={styles.inputHeading}>Pick up Address (Vendor)</Text>
            <View style={[styles.rowAlign, { marginTop: 4, paddingHorizontal: 4 }]}>
              <Ionicons name="cafe" size={20} color="#4A3424" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.addressText}>{vendorAddress}</Text>
            </View>
          </View>
        )}

        {/* ==================== 3. TIMING SELECTION ==================== */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Timing Selection</Text>
            <View style={styles.operationBadge}>
              <Text style={styles.operationBadgeText}>Open: 8:00 AM - 6:00 PM</Text>
            </View>
          </View>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentOption,
                timingSelection === 'Order Now' && styles.segmentOptionActive,
                !isOperating && { opacity: 0.4 }
              ]}
              disabled={!isOperating}
              onPress={() => setTimingSelection('Order Now')}
            >
              <Text style={[styles.segmentText, timingSelection === 'Order Now' && styles.segmentTextActive]}>Order Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentOption, timingSelection === 'Preorder' && styles.segmentOptionActive]}
              onPress={() => setTimingSelection('Preorder')}
            >
              <Text style={[styles.segmentText, timingSelection === 'Preorder' && styles.segmentTextActive]}>Preorder</Text>
            </TouchableOpacity>
          </View>

          {timingSelection === 'Order Now' ? (
            <View style={styles.asapInfoBox}>
              <Ionicons name="time" size={18} color="#FF8C32" style={{ marginRight: 6 }} />
              <Text style={styles.asapText}>Current Time: {formatCurrentTime()}</Text>
            </View>
          ) : (
            <View>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity style={styles.dateTimeBlock} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateTimeLabel}>Select Date</Text>
                  <View style={styles.dateTimeValueRow}>
                    <Ionicons name="calendar-outline" size={16} color="#444" />
                    <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dateTimeBlock} onPress={() => setShowSlotPicker(!showSlotPicker)}>
                  <Text style={styles.dateTimeLabel}>Select Time</Text>
                  <View style={styles.dateTimeValueRow}>
                    <Ionicons name="time-outline" size={16} color="#444" />
                    <Text style={styles.dateTimeValue}>{selectedSlot}</Text>
                    <Ionicons name={showSlotPicker ? "chevron-up" : "chevron-down"} size={14} color="#666" style={{ marginLeft: 'auto' }} />
                  </View>
                </TouchableOpacity>
              </View>

              {showSlotPicker && (
                <View style={styles.slotsDropdownContainer}>
                  <Text style={styles.slotsHeading}>Available Time Slots (8:30 AM - 6:00 PM)</Text>
                  <ScrollView nestedScrollEnabled={true} style={styles.slotsScrollView} showsVerticalScrollIndicator={true}>
                    <View style={styles.slotsGrid}>
                      {timeSlots.map((slot, index) => {
                        const expired = isSlotExpired(slot);
                        return (
                          <TouchableOpacity
                            key={index}
                            disabled={expired}
                            style={[
                              styles.slotItemBtn,
                              selectedSlot === slot && styles.slotItemBtnActive,
                              expired && { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0', opacity: 0.5 }
                            ]}
                            onPress={() => {
                              setSelectedSlot(slot);
                              setShowSlotPicker(false);
                            }}
                          >
                            <Text style={[
                              styles.slotItemText,
                              selectedSlot === slot && styles.slotItemTextActive,
                              expired && { color: '#A0A0A0', fontWeight: 'normal' }
                            ]}>
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {!isOperating && (
                <View style={styles.closedNoticeBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#A0521D" style={{ marginRight: 6 }} />
                  <Text style={styles.closedNoticeText}>Dear customer, we are closed now. You are preordering for the selected slot.</Text>
                </View>
              )}
            </View>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="calendar"
              minimumDate={getPreorderMinDate()}
              onChange={onDateChange}
            />
          )}
        </View>

        {/* ==================== 4. PAYMENT METHOD ==================== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <View style={styles.rowAlign}>
              <View style={styles.walletIconContainer}>
                <Ionicons name="card" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.paymentMethodName}>Campus Wallet</Text>
                <Text style={styles.walletId}>Wallet ID: ***251</Text>
              </View>
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={[styles.balanceValue, walletBalance < totalPayment && { color: '#D9383A' }]}>
                RM {walletBalance.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== 5. BILLING DETAILS ==================== */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={styles.cardTitle}>Billing Details</Text>
          <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Items Subtotal</Text><Text style={styles.priceDetailValue}>RM {itemsTotal.toFixed(2)}</Text></View>
          <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>SST (5%)</Text><Text style={styles.priceDetailValue}>RM {tax.toFixed(2)}</Text></View>
          {orderType === 'Delivery' && (
            <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Delivery Fee</Text><Text style={styles.priceDetailValue}>RM {deliveryFee.toFixed(2)}</Text></View>
          )}
        </View>

        {/* ==================== 6. IN-LINE ACTION BAR (跟随滚动) ==================== */}
        <View style={styles.inlineActionBarVertical}>
          <View style={styles.totalRowSplit}>
            <Text style={styles.totalStickyLabel}>Total Payment</Text>
            <Text style={styles.totalStickyPrice}>RM {totalPayment.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.placeOrderCenterBtn} activeOpacity={0.8} onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderText}>Place Order</Text>
            <Ionicons name="arrow-forward-circle" size={24} color="#ffffff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderColor: '#000000',
    paddingTop: StatusBar.currentHeight - 35,
    height: 20 + StatusBar.currentHeight,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: 0.3 },

  scrollPadding: {
    paddingHorizontal: 15,
    paddingTop: 19,
    paddingBottom: 100
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  badge: { backgroundColor: '#FFF0E5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#FF8C32', fontSize: 12, fontWeight: '700' },

  operationBadge: { backgroundColor: '#F0F4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  operationBadgeText: { color: '#2B6CB0', fontSize: 11, fontWeight: '700' },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  itemQty: { fontSize: 14, fontWeight: '700', color: '#FF8C32', width: 26 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#333', flex: 1, paddingRight: 10, lineHeight: 18 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#111' },
  dashedDivider: { height: 1, borderStyle: 'dashed', borderWidth: 0.6, borderColor: '#DDD', marginVertical: 12 },
  remarkLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  remarkValue: { fontSize: 14, color: '#444', fontStyle: 'italic', lineHeight: 20, marginTop: 2 },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#EFEFEF', borderRadius: 25, padding: 4, marginBottom: 14 },
  toggleBtn: { flex: 1, flexDirection: 'row', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  toggleBtnActive: { backgroundColor: '#22252A', elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#666', marginLeft: 6 },
  toggleTextActive: { color: '#FFF', fontWeight: '700' },

  inputHeading: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8 },
  selectorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  selectorValueText: { fontSize: 14, fontWeight: '600', color: '#111' },
  addressText: { fontSize: 14, fontWeight: '500', color: '#555', flex: 1, lineHeight: 18 },
  rowAlign: { flexDirection: 'row', alignItems: 'center' },

  segmentedControl: { flexDirection: 'row', backgroundColor: '#F0F1F3', borderRadius: 10, padding: 3, marginBottom: 12 },
  segmentOption: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  segmentOptionActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#777' },
  segmentTextActive: { color: '#000', fontWeight: '700' },

  dateTimeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dateTimeBlock: { flex: 0.48, backgroundColor: '#F5F6F8', padding: 10, borderRadius: 10 },
  dateTimeLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 4 },
  dateTimeValueRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  dateTimeValue: { fontSize: 13, fontWeight: '700', color: '#222', marginLeft: 6 },
  asapInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF6F0', padding: 12, borderRadius: 10, marginTop: 4 },
  asapText: { fontSize: 13, color: '#A0521D', flex: 1, fontWeight: '500' },

  slotsDropdownContainer: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 10,
    padding: 10,
    marginTop: 10
  },
  slotsHeading: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  slotsScrollView: { maxHeight: 150 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  slotItemBtn: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8
  },
  slotItemBtnActive: { backgroundColor: '#22252A', borderColor: '#22252A' },
  slotItemText: { fontSize: 13, fontWeight: '600', color: '#333' },
  slotItemTextActive: { color: '#FFFFFF', fontWeight: '700' },

  closedNoticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF6F0', padding: 10, borderRadius: 8, marginTop: 12 },
  closedNoticeText: { fontSize: 12, color: '#A0521D', flex: 1, fontWeight: '500' },

  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  walletIconContainer: { backgroundColor: '#FF8C32', width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  paymentMethodName: { fontSize: 14, fontWeight: '700', color: '#111' },
  walletId: { fontSize: 12, color: '#777', marginTop: 1 },
  balanceContainer: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  balanceValue: { fontSize: 15, fontWeight: '800', color: '#2E7D32', marginTop: 2 },

  priceDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  priceDetailLabel: { fontSize: 15, color: '#000000' },
  priceDetailValue: { fontSize: 14, fontWeight: '600', color: '#222' },

  inlineActionBarVertical: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 15,
    marginBottom: 20,
  },
  totalRowSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16, // 与下方按钮拉开舒适的间距
  },

  totalStickyLabel: { 
  fontSize: 16,          
  fontWeight: '600', 
  color: '#666' 
},
totalStickyPrice: { 
  fontSize: 18,          
  fontWeight: '800', 
  color: '#111', 
  marginTop: 2 
},



  placeOrderCenterBtn: {
    backgroundColor: '#1a1611d4',
    flexDirection: 'row',
    width: '100%',         // 撑满容器，保持长方形在中心
    height: 52,            // 稍微加高，让长方形按钮更大气
    borderRadius: 14,      //  复刻图三硬核圆边长方形的关键（12 - 14 最佳）
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#454542',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  placeOrderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  }
});