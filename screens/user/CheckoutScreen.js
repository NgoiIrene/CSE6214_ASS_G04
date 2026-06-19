import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

export default function CheckoutScreen({ route, navigation }) {
  // 1. 接收来自主页/购物车的共享数据
  const { items = [], remarks = "" } = route?.params || {};

  // 2. 状态控制
  const [orderType, setOrderType] = useState('Delivery');
  const [campusBuilding, setCampusBuilding] = useState('Hostel HB 3 & 4');
  const [vendorAddress, setVendorAddress] = useState("MMU Campus Cafeteria - Vendor Stall 2 (Malay Cuisine)");

  // 模拟钱包数据
  const walletBalance = 40.00;

  // 4. 金额计算逻辑 (去除了时间相关的复杂逻辑)
  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = itemsTotal * 0.05;
  const deliveryFee = orderType === 'Delivery' ? 5.00 : 0.00;
  const totalPayment = itemsTotal + tax + deliveryFee;

  // 下单逻辑
  const handlePlaceOrder = async () => {
    if (walletBalance < totalPayment) {
      Alert.alert("Insufficient Balance", "Please top up your wallet.");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const customerId = session?.user?.id || 'anonymous_customer';
      const formattedFoodDetails = items.map(item => `${item.quantity}x ${item.name}`).join('\n');
      const generatedRef = '#' + Math.floor(1000 + Math.random() * 9000);

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_id: customerId,
          order_ref: generatedRef,
          food_details: formattedFoodDetails,
          total_price: totalPayment,
          status: 'pending_vendor',
          remarks: remarks,
          order_type: orderType.toLowerCase()
        }])
        .select();

      if (error) throw error;
      Alert.alert("Success", "Order placed successfully!");
      navigation.navigate('Home');
    } catch (dbError) {
      Alert.alert("Order Failed", dbError.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* 1. Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{items.length} Items</Text></View>
          </View>
          {items.map((item, index) => (
            <View style={styles.itemRow} key={index}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>RM {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.dashedDivider} />
          <Text style={styles.remarkLabel}>Special Remarks:</Text>
          <Text style={styles.remarkValue}>{remarks || 'None'}</Text>
        </View>

        {/* 2. Delivery/Pickup */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, orderType === 'Delivery' && styles.toggleBtnActive]} onPress={() => setOrderType('Delivery')}>
            <Ionicons name="bicycle-outline" size={18} color={orderType === 'Delivery' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, orderType === 'Delivery' && styles.toggleTextActive]}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, orderType === 'Pick up' && styles.toggleBtnActive]} onPress={() => setOrderType('Pick up')}>
            <Ionicons name="storefront-outline" size={18} color={orderType === 'Pick up' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, orderType === 'Pick up' && styles.toggleTextActive]}>Pick up</Text>
          </TouchableOpacity>
        </View>

        {orderType === 'Delivery' ? (
          <View style={styles.card}>
            <Text style={styles.inputHeading}>Campus Delivery Building</Text>
            <View style={styles.selectorSelector}>
              <View style={styles.rowAlign}>
                <Ionicons name="location" size={20} color="#FF8C32" style={{ marginRight: 8 }} />
                <Text style={styles.selectorValueText}>{campusBuilding}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: '#F9F9F9' }]}>
            <Text style={styles.inputHeading}>Pick up Address (Vendor)</Text>
            <View style={[styles.rowAlign, { marginTop: 4, paddingHorizontal: 4 }]}>
              <Ionicons name="cafe" size={20} color="#4A3424" style={{ marginRight: 8 }} />
              <Text style={styles.addressText}>{vendorAddress}</Text>
            </View>
          </View>
        )}

        {/* 4. Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <View style={styles.rowAlign}>
              <View style={styles.walletIconContainer}><Ionicons name="card" size={20} color="#fff" /></View>
              <View>
                <Text style={styles.paymentMethodName}>Campus Wallet</Text>
                <Text style={styles.walletId}>Balance: RM {walletBalance.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Billing */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={styles.cardTitle}>Billing Details</Text>
          <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Items Subtotal</Text><Text style={styles.priceDetailValue}>RM {itemsTotal.toFixed(2)}</Text></View>
          <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>SST (5%)</Text><Text style={styles.priceDetailValue}>RM {tax.toFixed(2)}</Text></View>
          {orderType === 'Delivery' && <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Delivery Fee</Text><Text style={styles.priceDetailValue}>RM {deliveryFee.toFixed(2)}</Text></View>}
        </View>

        {/* 6. Action */}
        <View style={styles.inlineActionBar}>
          <View style={styles.totalPaymentBox}>
            <Text style={styles.totalStickyLabel}>Total Payment</Text>
            <Text style={styles.totalStickyPrice}>RM {totalPayment.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// 样式表无需修改，继续使用你原本的即可
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
  remarkValue: { fontSize: 14, color: '#444', fontStyle: 'italic' },

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
  priceDetailLabel: { fontSize: 14, color: '#666' },
  priceDetailValue: { fontSize: 14, fontWeight: '600', color: '#222' },

  inlineActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  totalPaymentBox: { justifyContent: 'center' },
  totalStickyLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  totalStickyPrice: { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 2 },
  placeOrderBtn: {
    backgroundColor: '#FF8C32',
    flexDirection: 'row',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }
});