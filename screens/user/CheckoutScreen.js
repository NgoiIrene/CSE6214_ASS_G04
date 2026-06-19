import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../supabaseClient';

export default function CheckoutScreen({ route, navigation }) {
  const { items, remarks } = route.params || { items: [], remarks: '' };

  // --- 模拟数据与辅助函数 ---
  const getNowDate = () => new Date();
  const getPreorderMinDate = () => new Date();
  const [orderType, setOrderType] = useState('Delivery');
  const [campusBuilding, setCampusBuilding] = useState("Faculty of Computing");
  const [vendorAddress, setVendorAddress] = useState("MMU Campus Cafeteria - Vendor Stall 2");
  const [timingSelection, setTimingSelection] = useState('Order Now');
  const [isOperating, setIsOperating] = useState(true);
  const timeSlots = ['8:30 AM', '9:30 AM', '10:30 AM', '11:30 AM', '12:30 PM', '1:30 PM', '2:30 PM', '3:30 PM', '4:30 PM', '5:30 PM'];

  const [date, setDate] = useState(getPreorderMinDate());
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  const walletBalance = 40.00;

  // 🌟 修改这里：统一计算逻辑变量名以匹配 return 中的渲染
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const sst = subtotal * 0.05;
  const deliveryFee = orderType === 'Delivery' ? 5.00 : 0.00;
  const total = subtotal + sst + deliveryFee; // 确保这里叫 total


  // --- 核心下单逻辑 ---
  const handlePlaceOrder = async () => {
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
          remarks: remarks
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        {/* 订单摘要 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item, index) => (
            <Text key={index} style={styles.itemText}>{item.quantity}x {item.name} - RM {(item.price * item.quantity).toFixed(2)}</Text>
          ))}
          <Text style={styles.remarksLabel}>REMARKS:</Text>
          <Text style={styles.remarksText}>{remarks || 'None'}</Text>
        </View>

        {/* 费用明细 */}
        <View style={styles.sectionCard}>
          <View style={styles.row}><Text>Subtotal</Text><Text>RM {subtotal.toFixed(2)}</Text></View>
          <View style={styles.row}><Text>SST (5%)</Text><Text>RM {sst.toFixed(2)}</Text></View>
          <View style={styles.row}><Text>Delivery</Text><Text>RM {deliveryFee.toFixed(2)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalPrice}>RM {total.toFixed(2)}</Text></View>
        </View>

        <TouchableOpacity style={styles.placeOrderCenterBtn} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  // 修改为 header，匹配 return 中的 <View style={styles.header}>
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  // 修改为 scrollPadding，匹配 return 中的 contentContainerStyle={styles.scrollPadding}
  scrollPadding: { padding: 15 },
  sectionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1.5, borderColor: '#000' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  itemText: { fontSize: 14, marginBottom: 5 },
  remarksLabel: { fontSize: 12, fontWeight: 'bold', marginTop: 10, color: '#666' },
  remarksText: { fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 10 },
  totalLabel: { fontWeight: 'bold', fontSize: 16 },
  totalPrice: { fontWeight: 'bold', fontSize: 16 },
  // 修改为 placeOrderCenterBtn，匹配 return 中的 <TouchableOpacity style={styles.placeOrderCenterBtn}>
  placeOrderCenterBtn: { backgroundColor: '#000', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  placeOrderText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});