import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function VendorMenuScreen() {

  // --- 1. 模拟当前选中的 Vendor 信息 ---
  const currentVendor = {
    name: 'Korean House',
    cuisine: 'Korean food',
    rating: '4.7',
    announcement: 'Welcome to Korean House, enjoy your meal⭐ \n\n🔥 Today Special：\nWe have limited NEW items available NOW\n\n⚠️ IMPORTANT：\nPlease hurry up before it finished!'
  };

  // --- 2. 食物数据库 ---
  const foodItems = [
    {
      id: 'f1',
      name: 'Kimchi Jjigaen',
      price: 'RM 9.00',
      image: 'https://www.eatingwell.com/thmb/PtjVB6QZxEin5M6hHu0GvvPVubg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Kimchi-jjigae-de45aa8daada45a6b4daf266f0b36011.jpg',
      ingredient: 'kimchi, toufu, vege',
      allergen: 'soy, spicy',
      calories: '920 - 1,350 kcal',
      status: 'out_of_stock'
    },
    {
      id: 'f2',
      name: 'Bibimbap',
      price: 'RM 11.00',
      image: 'https://tse4.mm.bing.net/th/id/OIP.pAFgQhDRw0rTWFY1SQgCXAHaLH?cb=thfc1falcon2&rs=1&pid=ImgDetMain&o=7&rm=3',
      ingredient: 'rice, carrot, kimchi, chicken/beef slice',
      allergen: 'spicy',
      calories: '920 - 1,350 kcal',
      status: 'new'
    },
    {
      id: 'f3',
      name: 'Tteokbokki',
      price: 'RM 10.50',
      image: 'https://takestwoeggs.com/wp-content/uploads/2023/08/Tteokbokki-Takestwoeggs-sq.jpg',
      ingredient: 'rice-made tteokbokki',
      allergen: 'wheat',
      calories: '920 - 1,350 kcal',
      status: null
    },
    {
      id: 'f4',
      name: 'Spicy Gochujang Fried Chicken',
      price: 'RM 16.00',
      image: 'https://quickygirlrecipes.com/wp-content/uploads/2025/11/Dakgangjeong-Sweet-Crispy-Korean-Fried-Chicken-The-Ultimate-Guide-to-Authentic-Korean-Glazed-Fried-Chicken.png',
      ingredient: 'soy sauce, garlic',
      allergen: 'wheat, milk, soy',
      calories: '920 - 1,350 kcal',
      status: null
    },
    {
      id: 'f5',
      name: 'Cheesy Fried Chicken',
      price: 'RM 16.50',
      image: 'https://kristinesubagiyo.com.au/wp-content/uploads/2024/01/mrkorean-1-1080x675.jpg',
      ingredient: 'fried chicken, mozzarella cheese, corn syrup, soy sauce, garlic',
      allergen: 'wheat, milk, soy',
      calories: '920 - 1,350 kcal',
      status: 'new'
    },
    {
      id: 'f6',
      name: 'Iced Green Tea',
      price: 'RM 2.00',
      image: 'https://d3s8tbcesxr4jm.cloudfront.net/recipe-images/v0/green-iced-tea_large.jpg',
      ingredient: 'brewed green tea leaves, water, cane sugar, ice ice',
      allergen: 'none',
      calories: '80 - 120 kcal',
      status: null
    }
  ];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  // 共享的购物车状态与弹窗控制（同步自主页高级架构）
  const [cart, setCart] = useState([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [remarks, setRemarks] = useState("");

  const handleItemPress = (food) => {
    setSelectedFood(food);
    setIsModalVisible(true);
  };

  // 购物车核心处理函数
  const handleAddToCart = (food, isAvailable) => {
    if (!isAvailable) {
      Alert.alert("Oops!", `"${food.name}" is currently out of stock.`);
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === food.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const cleanPrice = parseFloat(food.price ? food.price.replace('RM ', '') : '10.00') || 10.00;
        return [...prevCart, { id: food.id, name: food.name, price: cleanPrice, quantity: 1, image: food.image }];
      }
    });
  };

  // 供购物车弹窗内部调用的数据加减管理函数
  const increaseQuantity = (id) => {
    setCart(prevItems => prevItems.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decreaseQuantity = (id) => {
    setCart(prevItems => prevItems.map(item => item.id === id ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 } : item));
  };

  const removeItemFromCart = (id) => {
    setCart(prevItems => prevItems.filter(item => item.id !== id));
  };

  // 获取购物车中商品总数
  const getTotalCartQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ==================== 1. TOP HEADER (导航栏) ==================== */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => Alert.alert("Navigation", "Back...")}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentVendor.name}
        </Text>

        <TouchableOpacity style={styles.cartHeaderIcon} onPress={() => setIsCartVisible(true)}>
          <Ionicons name="cart" size={26} color="#757575" />
          {getTotalCartQuantity() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalCartQuantity()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* ==================== 主滚动区域 ==================== */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>

        {/* ==================== 2. VENDOR ANNOUNCEMENT BOARD ==================== */}
        {currentVendor.announcement && (
          <View style={styles.announcementCard}>
            <View style={styles.announcementBadge}>
              <Ionicons name="reader-outline" size={15} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.announcementBadgeText}>NOTICE</Text>
            </View>
            <Text style={styles.announcementText}>
              {currentVendor.announcement}
            </Text>
          </View>
        )}

        {/* ==================== 3. ASYMMETRIC MENU LIST ==================== */}
        {foodItems.map((food, index) => {
          const isEvenRow = index % 2 === 0;
          const isOutOfStock = food.status === 'out_of_stock';
          const isNew = food.status === 'new';

          return (
            <TouchableOpacity
              key={food.id}
              style={[styles.foodCard, isOutOfStock && styles.foodCardDisabled]}
              activeOpacity={isOutOfStock ? 0.6 : 0.8}
              onPress={() => handleItemPress(food)}
            >
              {isEvenRow ? (
                <>
                  {/* 左侧图片区 */}
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: food.image }} style={styles.foodImageLeft} />
                    {isNew && (
                      <View style={[styles.statusBadge, styles.badgeLeft]}>
                        <Text style={styles.statusBadgeText}>NEW!</Text>
                      </View>
                    )}
                  </View>

                  {/* 右侧信息栏 */}
                  <View style={[styles.foodInfoBox, styles.infoBoxRight]}>
                    <View>
                      <Text style={styles.foodNameText} numberOfLines={2}>{food.name}</Text>
                      <Text style={styles.foodPriceText}>{food.price}</Text>
                    </View>

                    {/* 缺货状态 */}
                    {isOutOfStock && (
                      <View style={styles.outOfStockContainer}>
                        <Ionicons name="warning-outline" size={14} color="#000000" style={{ marginRight: 4 }} />
                        <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.plusButtonRight, isOutOfStock && styles.plusButtonDisabled]}
                      disabled={isOutOfStock}
                      onPress={() => handleAddToCart(food, !isOutOfStock)}
                    >
                      <Ionicons name={isOutOfStock ? "close" : "add"} size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* 左侧信息栏 */}
                  <View style={[styles.foodInfoBox, styles.infoBoxLeft]}>
                    <View>
                      <Text style={styles.foodNameText} numberOfLines={2}>{food.name}</Text>
                      <Text style={styles.foodPriceText}>{food.price}</Text>
                    </View>

                    {/* 缺货状态 */}
                    {isOutOfStock && (
                      <View style={styles.outOfStockContainer}>
                        <Ionicons name="warning-outline" size={14} color="#000000" style={{ marginRight: 4 }} />
                        <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.plusButtonLeft, isOutOfStock && styles.plusButtonDisabled]}
                      disabled={isOutOfStock}
                      onPress={() => handleAddToCart(food, !isOutOfStock)}
                    >
                      <Ionicons name={isOutOfStock ? "close" : "add"} size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* 右侧图片区 */}
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: food.image }} style={styles.foodImageRight} />
                    {isNew && (
                      <View style={[styles.statusBadge, styles.badgeRight]}>
                        <Text style={styles.statusBadgeText}>NEW!</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ==================== 4. FOOD DETAILS POP-UP MODAL ==================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdropCloser} activeOpacity={1} onPress={() => setIsModalVisible(false)} />

          {selectedFood && (
            <View style={styles.popupCardBody}>
              <View style={styles.popupHeaderRow}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.popupImageWrapper}>
                <Image source={{ uri: selectedFood.image }} style={styles.popupFoodImage} />
                {selectedFood.status === 'new' && (
                  <View style={styles.modalStatusBadge}>
                    <Text style={styles.statusBadgeText}>NEW!</Text>
                  </View>
                )}
              </View>

              <Text style={styles.popupFoodName}>{selectedFood.name}</Text>

              <ScrollView style={styles.popupDetailsScroll} showsVerticalScrollIndicator={false}>

                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Ingredient:</Text>
                  <Text style={styles.detailValue}>{selectedFood.ingredient}</Text>
                </View>

                <View style={styles.detailTextGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Ionicons name="warning-outline" size={22} color="#D9383A" style={{ marginRight: 6, marginTop: -2 }} />
                    <Text style={styles.detailLabel}>Allergen Warning:</Text>
                  </View>
                  <Text style={[styles.detailValue, { color: '#000000', fontWeight: '900' }]}>
                    {selectedFood.allergen}
                  </Text>
                </View>

                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Calories:</Text>
                  <Text style={styles.detailValue}>{selectedFood.calories}</Text>
                </View>

                <View style={styles.detailTextGroup}>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={styles.popupPriceValue}>{selectedFood.price}</Text>
                </View>

              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.popupOrderButton,
                  selectedFood.status === 'out_of_stock' && styles.popupOrderButtonDisabled
                ]}
                disabled={selectedFood.status === 'out_of_stock'}
                onPress={() => {
                  setIsModalVisible(false);
                  handleAddToCart(selectedFood, selectedFood.status !== 'out_of_stock');
                }}
              >
                <Text style={styles.popupOrderButtonText}>
                  {selectedFood.status === 'out_of_stock' ? 'OUT OF STOCK' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ==================== 5. SHOPPING CART POP-UP MODAL ==================== */}
      <Modal animationType="slide" transparent={false} visible={isCartVisible} onRequestClose={() => setIsCartVisible(false)}>
        <ShoppingCartView
          cartItems={cart} remarks={remarks} setRemarks={setRemarks}
          increaseQuantity={increaseQuantity} decreaseQuantity={decreaseQuantity}
          removeItemFromCart={removeItemFromCart} onClose={() => setIsCartVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ==================== 📦 6. REFACTORED SHOPPING CART COMPONENT ====================
function ShoppingCartView({ cartItems, remarks, setRemarks, increaseQuantity, decreaseQuantity, removeItemFromCart, onClose }) {
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const [itemToIdToRemove, setItemToIdToRemove] = useState(null);
  const [itemNameToRemove, setItemNameToRemove] = useState("");

  const triggerRemovePrompt = (id, name) => { setItemToIdToRemove(id); setItemNameToRemove(name); setIsRemoveModalVisible(true); };
  const confirmRemoveItem = (confirm) => { if (confirm && itemToIdToRemove) removeItemFromCart(itemToIdToRemove); setIsRemoveModalVisible(false); };
  const calculateSubtotal = () => {
    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return itemsTotal === 0 ? "RM 0.00" : `RM ${(itemsTotal + 1.55).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={cartStyles.safeArea}>
      <View style={cartStyles.headerRow}>
        <View style={{ width: 28 }} />
        <View style={cartStyles.titleContainer}><Text style={cartStyles.headerTitle}>Shopping Cart</Text></View>
        <TouchableOpacity style={cartStyles.closeXBtn} onPress={onClose}><Ionicons name="close-circle-outline" size={28} color="#000" /></TouchableOpacity>
      </View>
      <View style={cartStyles.divider} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cartStyles.scrollContainer}>
        <Text style={cartStyles.sectionTitle}>Order Items</Text>
        {cartItems.length === 0 ? (
          <View style={cartStyles.emptyContainer}><Ionicons name="cart-outline" size={64} color="#cccccc" /><Text style={cartStyles.emptyText}>Your cart is empty</Text></View>
        ) : (
          cartItems.map((item) => (
            <View key={item.id} style={cartStyles.cartCard}>
              <Image source={{ uri: item.image }} style={cartStyles.cartItemImage} />
              <View style={cartStyles.cartItemInfoBox}>
                <View><Text style={cartStyles.itemNameText} numberOfLines={1}>{item.name}</Text><Text style={cartStyles.itemPriceText}>Price: RM {item.price.toFixed(2)}</Text></View>
                <View style={cartStyles.actionRow}>
                  <View style={cartStyles.quantityController}>
                    <TouchableOpacity style={cartStyles.qtyBtn} onPress={() => decreaseQuantity(item.id)}><Ionicons name="remove" size={14} color="#000" /></TouchableOpacity>
                    <Text style={cartStyles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={cartStyles.qtyBtn} onPress={() => increaseQuantity(item.id)}><Ionicons name="add" size={14} color="#000" /></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={cartStyles.removeButton} onPress={() => triggerRemovePrompt(item.id, item.name)}><Text style={cartStyles.removeButtonText}>Remove</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <Text style={cartStyles.sectionTitle}>Special Remarks:</Text>
        <View style={cartStyles.remarksInputWrapper}>
          <TextInput style={cartStyles.remarksInput} multiline numberOfLines={4} textAlignVertical="top" value={remarks} onChangeText={setRemarks} placeholder="Please type remark here" placeholderTextColor="#999999" />
        </View>
        <View style={cartStyles.priceRow}><Text style={cartStyles.totalLabel}>Subtotal (include Tax)</Text><Text style={cartStyles.totalPriceText}>{calculateSubtotal()}</Text></View>
      </ScrollView>
      <View style={cartStyles.fixedFooter}>
        <TouchableOpacity style={[cartStyles.checkoutButton, cartItems.length === 0 && cartStyles.checkoutButtonDisabled]} disabled={cartItems.length === 0} onPress={() => Alert.alert("Checkout", "Proceeding...")}><Text style={cartStyles.checkoutButtonText}>Go to Checkout</Text></TouchableOpacity>
      </View>
      <Modal animationType="fade" transparent visible={isRemoveModalVisible}>
        <View style={cartStyles.modalOverlay}>
          <View style={cartStyles.promptCardBody}>
            <View style={cartStyles.promptHeader}><Ionicons name="warning-outline" size={24} color="#000" style={{ marginRight: 6 }} /><Text style={cartStyles.promptTitleText}>Remove Item?</Text></View>
            <Text style={cartStyles.promptContentText}>Are you sure to remove "{itemNameToRemove}"?</Text>
            <View style={cartStyles.promptActionRow}>
              <TouchableOpacity style={[cartStyles.promptBtn, cartStyles.promptBtnNo]} onPress={() => confirmRemoveItem(false)}><Text style={cartStyles.promptBtnNoText}>No</Text></TouchableOpacity>
              <TouchableOpacity style={[cartStyles.promptBtn, cartStyles.promptBtnYes]} onPress={() => confirmRemoveItem(true)}><Text style={cartStyles.promptBtnYesText}>Yes</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==================== 🎨 STYLESYSTEM DESIGN 样式控制表 ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  backBtn: {
    width: 35,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartHeaderIcon: {
    padding: 2,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  divider: {
    height: 2,
    backgroundColor: '#000000',
    width: '100%',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  announcementCard: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
      android: { elevation: 4 }
    }),
  },
  announcementBadge: {
    position: 'absolute',
    top: -12,
    left: 12,
    backgroundColor: '#FF8C32',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  announcementText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 20,
    marginTop: 4,
  },
  foodCard: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 21,
    height: 115,
    alignItems: 'center',
  },
  foodCardDisabled: {
    opacity: 0.55,
  },
  imageContainer: {
    position: 'relative',
    width: 113,
    height: 115,
  },
  foodImageLeft: {
    width: 113,
    height: 115,
    borderRadius: 12,
    borderWidth: 1.7,
    borderColor: '#000000',
    resizeMode: 'cover',
  },
  foodImageRight: {
    width: 113,
    height: 115,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    backgroundColor: '#00E676',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 5,
  },
  badgeLeft: { top: -6, left: -4 },
  badgeRight: { top: -6, right: -4 },
  statusBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  foodInfoBox: {
    flex: 1,
    height: 105,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    paddingVertical: 10,
    position: 'relative',
  },
  infoBoxRight: { borderLeftWidth: 0 },
  infoBoxLeft: { borderRightWidth: 0 },
  foodNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 18,
    paddingRight: 10,
  },
  foodPriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    marginTop: 4,
  },
  outOfStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
  },
  plusButtonRight: {
    backgroundColor: '#FF8C32',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 6,
    right: 8,
    // borderWidth: 1.5,
    // borderColor: '#000',
  },
  plusButtonLeft: {
    backgroundColor: '#FF8C32',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 6,
    left: 8,
    // borderWidth: 1.5,
    // borderColor: '#000',
  },
  plusButtonDisabled: {
    backgroundColor: '#757575',
    borderColor: '#000',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D9383A',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalBackdropCloser: { position: 'absolute', width: width, height: height },
  popupCardBody: {
    width: width * 0.86,
    maxHeight: height * 0.85,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 16,
    padding: 18,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 0.2, shadowRadius: 0 },
      android: { elevation: 8 }
    }),
  },
  popupHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  popupImageWrapper: {
    width: '100%',
    height: 175,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
    position: 'relative'
  },
  popupFoodImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#00E676',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popupFoodName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  popupDetailsScroll: { flexGrow: 0, marginBottom: 20 },
  detailTextGroup: {
    marginBottom: 18,
    width: '100%'
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#333333', lineHeight: 18 },
  popupPriceValue: { fontSize: 18, fontWeight: '900', color: '#000000' },
  popupOrderButton: {
    width: '100%',
    backgroundColor: '#FF8C32',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  popupOrderButtonDisabled: { backgroundColor: '#757575' },
  popupOrderButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});

// 🌟 这里补全了之前漏掉的购物车样式表，防止因为找不到 cartStyles 样式而报错白屏
const cartStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: 10, backgroundColor: '#ffffff' },
  titleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#000', fontFamily: 'serif' },
  closeXBtn: { padding: 2 },
  divider: { height: 2, backgroundColor: '#000000', width: '100%' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000000', marginVertical: 14, fontFamily: 'serif' },
  cartCard: { flexDirection: 'row', width: '100%', marginBottom: 21, height: 115, alignItems: 'center' },
  cartItemImage: { width: 113, height: 115, borderRadius: 12, borderWidth: 1.7, borderColor: '#000000', resizeMode: 'cover' },
  cartItemInfoBox: { flex: 1, height: 105, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', paddingHorizontal: 14, justifyContent: 'space-between', paddingVertical: 10, borderLeftWidth: 0 },
  itemNameText: { fontSize: 14, fontWeight: 'bold', color: '#000000', lineHeight: 18 },
  itemPriceText: { fontSize: 13, fontWeight: '700', color: '#444444', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  quantityController: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#000000', borderRadius: 20, backgroundColor: '#ffffff', paddingHorizontal: 4 },
  qtyBtn: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '900', color: '#000000', paddingHorizontal: 8 },
  removeButton: { backgroundColor: '#262626', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  removeButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  remarksInputWrapper: { width: '100%', borderWidth: 1.5, borderColor: '#000000', backgroundColor: '#ffffff', borderRadius: 8, padding: 10, marginBottom: 20 },
  remarksInput: { fontSize: 14, fontWeight: '600', color: '#000000', height: 90 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%', paddingHorizontal: 2 },
  totalLabel: { fontSize: 15, fontWeight: '900', color: '#000000' },
  totalPriceText: { fontSize: 18, fontWeight: '900', color: '#000000' },
  fixedFooter: { width: '100%', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderTopWidth: 1, borderColor: '#efefef' },
  checkoutButton: { width: '100%', backgroundColor: '#22252A', borderRadius: 25, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  checkoutButtonDisabled: { backgroundColor: '#999999' },
  checkoutButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  promptCardBody: { width: width * 0.82, backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#000000', borderRadius: 14, padding: 20, elevation: 6 },
  promptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  promptTitleText: { fontSize: 18, fontWeight: '900', color: '#000000' },
  promptContentText: { fontSize: 14, fontWeight: '600', color: '#333333', lineHeight: 20, marginBottom: 22 },
  promptActionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  promptBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  promptBtnNo: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', marginRight: 10 },
  promptBtnNoText: { color: '#000000', fontSize: 14, fontWeight: '900' },
  promptBtnYes: { backgroundColor: '#FF8C32', borderWidth: 1.5, borderColor: '#000000' },
  promptBtnYesText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#999999', marginTop: 10 }
});