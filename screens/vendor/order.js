import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView,
  ScrollView,
  TouchableHighlight, 
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.5; // 侧边栏宽度占屏幕的 50%

// ==================== 🛠️ 全量且严格校对的数据仓库 ====================
const ALL_ORDERS_DATA = {
  '#1034': {
    id: '#1034', time: '13:14', name: 'CANDY', customerName: 'CANDY', price: 'RM 20.00', totalEarned: 'RM 20.00', 
    timeLeftSeconds: 300, 
    orderTime: '13:14', estTime: '13:40', pickUpNo: '#1134',
    items: [
      { code: 'A01', name: 'NASI GORENG', qty: 1, remark: '' },
      { code: 'T11', name: 'TEH TARIK', qty: 1, remark: 'LESS ICE...' },
    ]
  },
  '#1054': {
    id: '#1054', time: '13:26', name: 'CINDY', customerName: 'CINDY', price: 'RM 34.20', totalEarned: 'RM 34.20', 
    timeLeftSeconds: 900, 
    orderTime: '13:26', estTime: '13:55', pickUpNo: '#1154',
    items: [
      { code: 'M20', name: 'SPECIAL MAGGIE GORENG EXTRA PEDAS SEAFOOD DOUBLE PLUS', qty: 1, remark: 'SAYUR LEBIH, MAU CABAI POTONG BANYAK BANYAK YA' },
      { code: 'R05', name: 'ROTI TELUR', qty: 5, remark: 'CRISPY' }
    ]
  },
  '#1055': {
    id: '#1055', time: '13:26', name: 'CELINE', customerName: 'CELINE', price: 'RM 8.00', totalEarned: 'RM 8.00', 
    timeLeftSeconds: 1200, 
    orderTime: '13:26', estTime: '13:50', pickUpNo: '#1155',
    items: [
      { code: 'A02', name: 'AYAM GORENG', qty: 1, remark: '' },
      { code: 'M01', name: 'MILO ICE', qty: 1, remark: 'LESS SUGAR' }
    ]
  },
  '#1060': {
    id: '#1060', time: '13:30', name: 'CATHY', customerName: 'CATHY', price: 'RM 96.00', totalEarned: 'RM 96.00', 
    timeLeftSeconds: 1500, 
    orderTime: '13:30', estTime: '14:00', pickUpNo: '#1160',
    items: [
      { code: 'A01', name: 'NASI GORENG', qty: 6, remark: '' },
      { code: 'T11', name: 'TEH TARIK', qty: 6, remark: 'LESS ICE' }
    ]
  },
  '#1099': {
    id: '#1099', time: '13:35', name: 'FINDY', customerName: 'FINDY', price: 'RM 118.00', totalEarned: 'RM 118.00', 
    timeLeftSeconds: 1800, 
    orderTime: '13:35', estTime: '14:15', pickUpNo: '#1199',
    items: [
      { code: 'A01', name: 'NASI GORENG', qty: 1, remark: '' },
      { code: 'A02', name: 'AYAM GORENG', qty: 10, remark: '' }
    ]
  }
};

const formatCountdown = (totalSeconds) => {
  if (totalSeconds <= 0) return "00:00 TIME'S UP";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const displayMins = mins < 10 ? `0${mins}` : mins;
  const displaySecs = secs < 10 ? `0${secs}` : secs;
  return `${displayMins}:${displaySecs} MIN LEFT`;
};

// ==================== 📄 页面 1 & 3：主页列表组件 ====================
function HomeScreen({ onNavigateToDetail, currentTab, setCurrentTab, requestedOrderIds, acceptedOrderIds, dynamicTimes, onOpenMenu }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* 🚪 替换原有的静态按钮，绑定打开侧边栏的方法 */}
        <TouchableOpacity style={styles.headerMenuBtn} onPress={onOpenMenu}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'requested' ? styles.activeTab : styles.inactiveTab]} 
          onPress={() => setCurrentTab('requested')}
        >
          <Text style={[styles.tabText, currentTab === 'requested' ? styles.activeTabText : styles.inactiveTabText]}>
            Requested Order List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'accepted' ? styles.activeTab : styles.inactiveTab]} 
          onPress={() => setCurrentTab('accepted')}
        >
          <Text style={[styles.tabText, currentTab === 'accepted' ? styles.activeTabText : styles.inactiveTabText]}>
            Accepted Order List
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {(currentTab === 'requested' ? requestedOrderIds : acceptedOrderIds).map((id) => {
          const order = ALL_ORDERS_DATA[id];
          if (!order) return null;

          return (
            <TouchableHighlight 
              key={id} 
              style={styles.orderCard}
              underlayColor="#A9A9A9" 
              onPress={() => onNavigateToDetail(id)}
            >
              <View style={styles.cardInnerContent}>
                <View style={styles.cardLeftContent}>
                  <View style={styles.cardRowInline}>
                    <Text style={styles.orderNoText}>Order NO.: {order.id}</Text>
                    <Text style={styles.timeText}>TIME: {order.time}</Text>
                    <Text style={styles.nameText} numberOfLines={1}>{order.name}</Text>
                  </View>
                  <View style={styles.itemsContainer}>
                    {order.items.map((item, idx) => (
                      <Text key={idx} style={styles.itemText} numberOfLines={1}>
                        {item.name} X{item.qty}
                      </Text>
                    ))}
                  </View>
                </View>
                <View style={styles.cardRightContent}>
                  <Text style={currentTab === 'requested' ? styles.priceText : styles.timeLeftText}>
                    {currentTab === 'requested' 
                      ? order.price 
                      : formatCountdown(dynamicTimes[id] !== undefined ? dynamicTimes[id] : order.timeLeftSeconds)
                    }
                  </Text>
                </View>
              </View>
            </TouchableHighlight>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 📄 页面 2 & 4：订单详情页组件 ====================
function OrderDetailScreen({ orderId, initialStatus, onBack, onAcceptOrder, onDeclineOrder, onDoneOrder, dynamicTimes }) {
  const orderData = ALL_ORDERS_DATA[orderId];
  const [status, setStatus] = useState(initialStatus);

  if (!orderData) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack}>
          <Ionicons name="arrow-back-circle-outline" size={32} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      <ScrollView 
        style={styles.detailScrollView}
        contentContainerStyle={styles.detailScrollContainer} 
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.badgeRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.badgeText}>
              {status === 'waiting' ? 'WAITING FOR ACCEPT' : 'PREPARING'}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.badgeText}>PICK UP {orderData.pickUpNo}</Text>
          </View>
        </View>

        <View style={styles.metaInfoRow}>
          <Text style={styles.metaText}>CUSTOMER NAME: {orderData.customerName}</Text>
          <Text style={styles.metaText}>TIME: {orderData.orderTime}</Text>
          {status === 'preparing' ? (
            <Text style={styles.timeLeftLarge}>
              {formatCountdown(dynamicTimes[orderId] !== undefined ? dynamicTimes[orderId] : orderData.timeLeftSeconds)}
            </Text>
          ) : (
            <Text style={styles.metaText}>ESTIMATED TIME: {orderData.estTime}</Text>
          )}
        </View>

        <View style={styles.tableContainer}>
          {/* 表头行 */}
          <View style={styles.tableRow}>
            <View style={[styles.colItem, styles.borderRight]}><Text style={styles.tableHeaderText}>ITEM</Text></View>
            <View style={[styles.colQty, styles.borderRight]}><Text style={styles.tableHeaderText}>QUANTITY</Text></View>
            <View style={styles.colRemark}><Text style={styles.tableHeaderText}>REMARK</Text></View>
          </View>
          
          {/* 数据数据行 */}
          {orderData.items.map((item, index) => (
            <View key={index} style={[styles.tableRow, styles.rowBorderTop]}>
              <View style={[styles.colItemLeft, styles.borderRight]}>
                <Text style={styles.tableCellTextLeft}>
                  {item.code ? `${item.code} ` : ''}{item.name}
                </Text>
              </View>
              <View style={[styles.colQty, styles.borderRight]}>
                <Text style={styles.tableCellText}>{item.qty}</Text>
              </View>
              <View style={styles.colRemark}>
                <Text style={styles.tableCellText}>{item.remark || ''}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalEarnedContainer}>
          <Text style={styles.totalEarnedText}>TOTAL EARNED: {orderData.totalEarned}</Text>
        </View>

        <View style={styles.actionButtonContainer}>
          {status === 'waiting' ? (
            <>
              <TouchableOpacity style={styles.declineButton} onPress={() => onDeclineOrder(orderId)}>
                <Text style={styles.declineButtonText}>DECLINE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={() => onAcceptOrder(orderId)}>
                <Text style={styles.acceptButtonText}>ACCEPT</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.doneButton} onPress={() => onDoneOrder(orderId)}>
              <Text style={styles.doneButtonText}>DONE</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 📱 全局路由及动态状态管理主入口 ====================
export default function App({ navigateToScreen }) {
  const [screen, setScreen] = useState('HOME'); 
  const [selectedOrderId, setSelectedOrderId] = useState('#1034'); 
  const [currentTab, setCurrentTab] = useState('requested'); 

  // 🚪 侧边栏显隐状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [requestedOrderIds, setRequestedOrderIds] = useState(['#1034', '#1054', '#1055', '#1060', '#1099']); 
  const [acceptedOrderIds, setAcceptedOrderIds] = useState(['#1034', '#1054']); 

  const [dynamicTimes, setDynamicTimes] = useState({
    '#1034': 300,
    '#1054': 900,
    '#1055': 1200,
    '#1060': 1500,
    '#1099': 1800,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setDynamicTimes((prevTimes) => {
        const updatedTimes = { ...prevTimes };
        Object.keys(updatedTimes).forEach((id) => {
          if (updatedTimes[id] > 0) {
            updatedTimes[id] = updatedTimes[id] - 1;
          }
        });
        return updatedTimes;
      });
    }, 1000);

    return () => clearInterval(timer); 
  }, []);

  // 处理侧边栏跳转逻辑
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false); // 关闭侧边栏
    if (targetScreen === 'order') return; // 如果已经是当前主页则不作处理

    if (navigateToScreen) {
      navigateToScreen(targetScreen); // 触发外部主导航层路由跳转
    }
  };

  const handleAcceptOrder = (id) => {
    setRequestedOrderIds(prev => prev.filter(item => item !== id));
    setAcceptedOrderIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setScreen('HOME');
  };

  const handleDeclineOrder = (id) => {
    setRequestedOrderIds(prev => prev.filter(item => item !== id));
    setScreen('HOME');
  };

  const handleDoneOrder = (id) => {
    setAcceptedOrderIds(prev => prev.filter(item => item !== id));
    setScreen('HOME');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      
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

            {/* 用户头像区域 */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person-outline" size={45} color="#000" />
              </View>
              <Text style={styles.avatarName}>Rasa Syiok</Text>
            </View>

            {/* 导航列表 - 当前 Home 页面高亮 */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('operationstatus')}>
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

      {/* 核心页面渲染分流 */}
      {screen === 'DETAIL' ? (
        <OrderDetailScreen 
          orderId={selectedOrderId}
          initialStatus={currentTab === 'requested' ? 'waiting' : 'preparing'}
          onBack={() => setScreen('HOME')}
          onAcceptOrder={handleAcceptOrder}
          onDeclineOrder={handleDeclineOrder}
          onDoneOrder={handleDoneOrder}
          dynamicTimes={dynamicTimes}
        />
      ) : (
        <HomeScreen 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          requestedOrderIds={requestedOrderIds}
          acceptedOrderIds={acceptedOrderIds}
          dynamicTimes={dynamicTimes}
          onOpenMenu={() => setIsSidebarOpen(true)} // 打开菜单方法传递
          onNavigateToDetail={(id) => {
            setSelectedOrderId(id);
            setScreen('DETAIL');
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ==================== 🎨 极简线框样式表 ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35, 
  },
  headerMenuBtn: {
    width: 32, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#000', borderRadius: 6, padding: 2,
  },
  headerBackBtn: { width: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'normal', color: '#000', textAlign: 'center' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', width: '100%', height: 50, borderBottomWidth: 2, borderBottomColor: '#000' },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  activeTab: { backgroundColor: '#A9A9A9' },
  inactiveTab: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '500' },
  activeTabText: { color: '#fff' },
  inactiveTabText: { color: '#000' },
  
  // 首页列表卡片
  scrollContainer: { paddingHorizontal: 10, paddingTop: 15, paddingBottom: 40 },
  orderCard: {
    borderWidth: 1.5, 
    borderColor: '#000', 
    borderRadius: 22, 
    marginBottom: 12,
    backgroundColor: '#fff', 
    overflow: 'hidden',
  },
  cardInnerContent: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center', minHeight: 75,
  },
  cardLeftContent: { flex: 1, justifyContent: 'center' },
  cardRowInline: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  orderNoText: { fontSize: 11, fontWeight: 'bold', color: '#000', marginRight: 10 },
  timeText: { fontSize: 10, color: '#000', marginRight: 15 },
  nameText: { fontSize: 10, color: '#000', fontWeight: '500', flex: 1 },
  itemsContainer: { marginTop: 2 },
  itemText: { fontSize: 11, color: '#888', lineHeight: 14 },
  cardRightContent: { justifyContent: 'center', alignItems: 'flex-end', marginLeft: 10 },
  priceText: { fontSize: 18, fontWeight: '500', color: '#000' },
  timeLeftText: { fontSize: 16, fontWeight: 'bold', color: '#000' },

  // 详情页
  detailScrollView: { flex: 1, backgroundColor: '#fff' },
  detailScrollContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 60, alignItems: 'center' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  statusBadge: { backgroundColor: '#A9A9A9', paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  metaInfoRow: { width: '100%', marginBottom: 15, position: 'relative' },
  metaText: { fontSize: 11, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  timeLeftLarge: { fontSize: 24, fontWeight: 'bold', color: '#000', position: 'absolute', right: 0, top: 0 },
  
  // 表格核心样式
  tableContainer: { 
    width: '100%', 
    borderWidth: 1.5, 
    borderColor: '#000', 
    marginTop: 5,
    backgroundColor: '#fff',
  },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'stretch', 
    width: '100%',
  },
  rowBorderTop: {
    borderTopWidth: 1.5,
    borderTopColor: '#000',
  },
  borderRight: {
    borderRightWidth: 1.5,
    borderRightColor: '#000',
  },
  colItem: { width: '45%', paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  colItemLeft: { 
    width: '45%', 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    justifyContent: 'center', 
    alignItems: 'flex-start' 
  },
  colQty: { width: '22%', paddingVertical: 8, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  colRemark: { width: '33%', paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  
  tableHeaderText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  tableCellText: { fontSize: 10, color: '#000', textAlign: 'center', lineHeight: 14 },
  tableCellTextLeft: { fontSize: 10, color: '#000', textAlign: 'left', lineHeight: 14 },
  
  totalEarnedContainer: { width: '100%', alignItems: 'flex-end', marginTop: 30, paddingRight: 5 },
  totalEarnedText: { fontSize: 24, fontWeight: 'normal', color: '#000' },
  
  // 底部动作按钮
  actionButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 40, paddingHorizontal: 10 },
  declineButton: { borderWidth: 1.5, borderColor: '#000', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 30 },
  declineButtonText: { color: '#000', fontSize: 20, fontWeight: '500' },
  acceptButton: { backgroundColor: '#D3D3D3', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 35 },
  acceptButtonText: { color: '#fff', fontSize: 20, fontWeight: '500' },
  doneButton: { backgroundColor: '#D3D3D3', borderRadius: 18, paddingVertical: 8, width: '45%', alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 20, fontWeight: '500' },

  /* ==================== 📌 新增的 Sidebar 样式表 ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
sidebar: {
    width: Dimensions.get('window').width * 0.75, // 👈 直接在这里改成 0.75 (75%) 或 0.8 (80%)
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
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
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