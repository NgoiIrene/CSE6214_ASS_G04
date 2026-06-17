import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function OrderHistoryScreen({ onOpenMenu }) { 
  const [activeTab, setActiveTab] = useState('Active');
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // 🌟 100% 还原原本全部的 4 个订单数据
  const orders = [
    { id: 'ORD-210626', date: '15 May 2026', status: 'Completed', shopName: 'Rasa Sedap' },
    { id: 'ORD-210628', date: '15 May 2026', status: 'Cancelled', shopName: 'Korean House' },
    { id: 'ORD-231410', date: '19 May 2026', status: 'Completed', shopName: 'Rasa Sedap' },
    { id: 'ORD-241511', date: '16 Jun 2026', status: 'Processing', shopName: 'Burger Joint' },
  ];

  const filteredOrders = orders.filter(order => {
    const isPastOrder = order.status === 'Completed' || order.status === 'Cancelled';
    return activeTab === 'Past' ? isPastOrder : !isPastOrder;
  });

  // 🌟 完全连回你原本高精度的发票 HTML 渲染加分享逻辑
  const handleDownloadInvoice = async (order) => {
    try {
      const htmlContent = `
        <html>
          <body style="font-family: Helvetica, sans-serif; padding: 30px; color: #333;">
            <h1 style="text-align: center; color: #000;">E-Invoice</h1>
            <p style="text-align: center; color: #666;">Campus Food Ordering System</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${order.date}</p>
            <p><strong>Shop Name:</strong> ${order.shopName}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <table style="width: 100%; text-align: left; margin-bottom: 20px;">
              <tr><th>Item Description</th><th style="text-align: right;">Amount</th></tr>
              <tr><td>Mock Item 1 (Food)</td><td style="text-align: right;">RM 12.00</td></tr>
              <tr><td>Mock Item 2 (Beverage)</td><td style="text-align: right;">RM 3.50</td></tr>
            </table>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <h2 style="text-align: right;">Total: RM 15.50</h2>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Save E-Invoice #${order.id}`, UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Oops', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate the E-invoice.');
    }
  };

  const openReviewModal = (orderId) => {
    setCurrentOrderId(orderId);
    setRating(0);
    setReviewText('');
    setModalVisible(true);
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert("Hold on!", "Please select a star rating first.");
      return;
    }
    Alert.alert("Success", `Review for ${currentOrderId} submitted!`);
    setModalVisible(false);
  };

  const renderStars = () => {
    let stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <FontAwesome name={i <= rating ? "star" : "star-o"} size={36} color={i <= rating ? "#f5c518" : "#ccc"} style={{ marginHorizontal: 5 }} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenMenu}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'Active' ? styles.activeTab : null]} onPress={() => setActiveTab('Active')}>
          <Text style={styles.tabText}>Active Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'Past' ? styles.activeTab : null]} onPress={() => setActiveTab('Past')}>
          <Text style={styles.tabText}>Past Orders</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>#{order.id}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Order status</Text>
              {order.status === 'Completed' ? (
                <View style={styles.iconTextWrapper}><Ionicons name="checkmark-circle" size={16} color="green" /><Text style={styles.statusCompleted}> Completed</Text></View>
              ) : order.status === 'Cancelled' ? (
                <View style={styles.iconTextWrapper}><Ionicons name="close-circle" size={16} color="red" /><Text style={styles.statusCancelled}> Cancelled</Text></View>
              ) : (
                <View style={styles.iconTextWrapper}><Ionicons name="time" size={16} color="orange" /><Text style={{ color: 'orange', fontWeight: 'bold' }}> {order.status}</Text></View>
              )}
            </View>

            <Text style={styles.label}>Shop Name:</Text>
            <Text style={styles.shopName}>{order.shopName}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnDownload} onPress={() => handleDownloadInvoice(order)}>
                <View style={styles.iconTextWrapper}><MaterialIcons name="file-download" size={18} color="black" /><Text style={styles.btnTextBlack}> Download E-invoice</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnReorder}>
                <View style={styles.iconTextWrapper}><Ionicons name="cart-outline" size={18} color="white" /><Text style={styles.btnTextWhite}> Reorder</Text></View>
              </TouchableOpacity>
            </View>

            {order.status === 'Completed' && (
              <TouchableOpacity style={styles.btnReview} onPress={() => openReviewModal(order.id)}>
                <View style={styles.iconTextWrapper}><MaterialIcons name="rate-review" size={18} color="black" /><Text style={styles.btnTextBlack}> Make a review</Text></View>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 🌟 100% 完整评分反馈弹窗 */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#ccc" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Rate your Order</Text>
            <Text style={styles.modalOrderId}>#{currentOrderId}</Text>
            {renderStars()}
            <Text style={styles.reviewLabel}>Your Review (Optional)</Text>
            <TextInput style={styles.textInput} multiline={true} numberOfLines={4} placeholder="The food is excellent..." value={reviewText} onChangeText={setReviewText} textAlignVertical="top" />
            <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmitReview}><Text style={styles.btnTextWhite}>Submit</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderBottomWidth: 2, borderColor: 'black' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#e0e0e0', borderRadius: 25, marginVertical: 15, padding: 5 },
  tabButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20 },
  activeTab: { backgroundColor: 'white' },
  tabText: { fontWeight: 'bold', fontSize: 16 },
  scrollArea: { paddingHorizontal: 15 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  orderDate: { fontSize: 14, color: 'black', fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 14, color: '#555', marginTop: 5 },
  iconTextWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusCompleted: { color: 'green', fontWeight: 'bold' },
  statusCancelled: { color: 'red', fontWeight: 'bold' },
  shopName: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btnDownload: { flex: 1.3, backgroundColor: '#d3d3d3', paddingVertical: 10, paddingHorizontal: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnReorder: { flex: 0.9, backgroundColor: '#222', paddingVertical: 10, paddingHorizontal: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnReview: { backgroundColor: 'white', marginTop: 10, padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnTextBlack: { fontWeight: 'bold', color: 'black', fontSize: 12 },
  btnTextWhite: { fontWeight: 'bold', color: 'white', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: 'white', borderRadius: 15, padding: 25, position: 'relative' },
  closeBtn: { position: 'absolute', top: 15, right: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  modalOrderId: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  reviewLabel: { fontWeight: 'bold', marginBottom: 10 },
  textInput: { borderWidth: 1, borderColor: '#333', borderRadius: 10, height: 100, padding: 10, fontSize: 14, backgroundColor: '#fafafa' },
  btnSubmit: { backgroundColor: '#222', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 }
});