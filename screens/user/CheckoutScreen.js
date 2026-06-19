import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient'; // ⚠️ 确保路径正确

export default function CheckoutScreen({ route, navigation }) {
  const { items, remarks } = route.params || { items: [], remarks: '' };

  // 基础费用计算
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const sst = subtotal * 0.05;
  const deliveryFee = 5.00;
  const total = subtotal + sst + deliveryFee;

  // 🌟 下单逻辑 (在这里连接数据库)
  const handlePlaceOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Please login to place order.");
        return;
      }

      // 1. 插入到 orders 表 (根据你之前的设计)
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: total,
          status: 'pending',
          remarks: remarks
        });

      if (orderError) throw orderError;

      // 2. 下单成功后，记得清空购物车
      await supabase.from('cart').delete().eq('user_id', user.id);

      Alert.alert("Success", "Order placed successfully!");
      navigation.navigate('Home'); // 跳转回首页
    } catch (error) {
      Alert.alert("Order Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
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

        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
          <Text style={styles.btnText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContainer: { padding: 15 },
  sectionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1.5, borderColor: '#000' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  itemText: { fontSize: 14, marginBottom: 5 },
  remarksLabel: { fontSize: 12, fontWeight: 'bold', marginTop: 10, color: '#666' },
  remarksText: { fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 10 },
  totalLabel: { fontWeight: 'bold', fontSize: 16 },
  totalPrice: { fontWeight: 'bold', fontSize: 16 },
  placeOrderBtn: { backgroundColor: '#000', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});