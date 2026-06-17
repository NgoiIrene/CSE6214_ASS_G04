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
  Alert
} from 'react-native';
// 🌟 严格引入项目统一的全面屏安全区域组件
import { SafeAreaView } from 'react-native-safe-area-context';
// 使用你项目中的 Expo 图标库
import { Ionicons } from '@expo/vector-icons';

// 获取当前设备的屏幕尺寸，用来精准计算
const { width, height } = Dimensions.get('window');

// 🌟 同步：侧边栏宽度严格对齐你的完全体设计：260
const SIDEBAR_WIDTH = 260;

export default function MenuScreen() {
  // 🌟 状态 1：控制侧边栏的弹出与隐藏（true = 打开，false = 关闭）
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- 顶部各类食物标签（Dietary Tags）数据源 ---
  // 🌟 在这里增加了 { id: '0', name: 'All' }
  const tags = [
    { id: '0', name: 'All' },
    { id: '1', name: 'Healthy' },
    { id: '2', name: 'Nut-free' },
    { id: '3', name: 'Vegan' },
    { id: '4', name: 'Fries' },
    { id: '5', name: 'Rice' },
    { id: '6', name: 'Bread' },
    { id: '10', name: 'Noodles' },
    { id: '7', name: 'non-Spicy' },
    { id: '8', name: 'Beverage' },
    { id: '9', name: 'Fast Food' }
  ];

  // --- 校园内的商家/档口数据源 ---
  const vendors = [
    { id: '1', name: 'Korean House', rating: '4.7', cuisine: 'Korean food', image: 'https://img.magnific.com/premium-photo/assortment-korean-traditional-dishes-asian-food-top-view-generative-ai_21085-39489.jpg', tags: ['Healthy', 'Rice', 'Noodles', 'non-Spicy'] },
    { id: '2', name: 'Rasa Sedap', rating: '4.9', cuisine: 'Malaysian food', image: 'https://www.nasilemakbamboo.my/wp-content/uploads/2023/07/Nasi-Lemak-Ayam-Goreng-Compressed.jpg', tags: ['Rice', 'Noodles', 'Beverage'] },
    { id: '3', name: 'Haji Curry Restaurant', rating: '4.3', cuisine: 'Indian food', image: 'https://thumbs.dreamstime.com/b/traditional-roti-canai-curry-dhal-served-banana-leaf-delicious-authentic-serving-roti-canai-popular-400619434.jpg', tags: ['Bread', 'Rice', 'Noodles', 'Beverage', 'non-Spicy'] },
    { id: '4', name: 'Vege & Health', rating: '4.4', cuisine: 'Healthy food', image: 'https://static.vecteezy.com/system/resources/previews/035/327/993/large_2x/ai-generated-salad-with-grilled-chicken-egg-and-cherry-tomatoes-on-black-plate-photo.jpg', tags: ['Healthy', 'Vegan', 'non-Spicy', 'Bread'] },
    { id: '5', name: 'Burger Lover', rating: '4.6', cuisine: 'Fast food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300', tags: ['Fast Food', 'Fries', 'Bread', 'non-Spicy', 'Beverage', 'Nut-free'] },
    { id: '6', name: 'Neko & Coffee', rating: '4.5', cuisine: 'Beverage', image: 'https://images.lifestyleasia.com/wp-content/uploads/sites/5/2023/03/07152920/283728712_305044915168177_39218947419656438_n-e1678091604513.jpeg', tags: ['non-Spicy', 'Beverage', 'Nut-free'] },
  ];

  // 🌟 状态 2：默认不选中任何标签，初始化为 null
  const [selectedTag, setSelectedTag] = useState(null);

  // 🌟 实时计算出符合当前选中标签的商家列表
  const filteredVendors = selectedTag ? vendors.filter(vendor => vendor.tags.includes(selectedTag.name)) : vendors;

  // 🌟【核心连接点 1】：点击左侧黑框三条杠按钮，激活侧边栏滑出
  const openSidebarMenu = () => {
    setIsSidebarOpen(true);
  };

  // 侧边栏内部导航点击处理函数
  const handleMenuClick = (moduleName) => {
    Alert.alert("Navigation", `Connecting to ${moduleName} module...`);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "You have been logged out successfully.");
    setIsSidebarOpen(false);
  };

  // 🌟 标签点击切换/取消选择函数
  const toggleTagSelection = (tag) => {
    // 如果点击的是 'All'，直接清空选择，展示所有店铺
    if (tag.name === 'All') {
      setSelectedTag(null);
    } else if (selectedTag && selectedTag.id === tag.id) {
      setSelectedTag(null);
    } else {
      setSelectedTag({ id: tag.id, name: tag.name });
    }
  };

  // 🌟 核心防错遮罩层渲染：点击侧边栏右侧半透明阴影，自动收起侧边栏
  const renderOverlay = () => {
    if (isSidebarOpen) {
      return (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsSidebarOpen(false)}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 调用遮罩渲染 */}
      {renderOverlay()}

      {/* ==================== 1. LEFT SIDEBAR (完全对齐主页与 Admin 级的高还原设计) ==================== */}
      <View style={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed]}>

        {/* 侧边栏头部黑框三条杠（负责将其点回去关闭） */}
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        {/* 纯代码精细绘制的经典框线大头像 */}
        <View style={styles.userSection}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>
          <Text style={styles.username}>Charlotte</Text>
        </View>

        {/* 侧边栏的核心功能选项单 */}
        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Home')}>
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Profile')}>
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>

          {/* 在当前 Menu 页面下，让 Menu 选项默认呈现高亮底色背景 */}
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}>
            <Text style={styles.menuItemText}>Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Order History')}>
            <Text style={styles.menuItemText}>Order History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}>
            <Text style={styles.menuItemText}>Reset Password</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 底部固定的安全防挡道 Logout 动作条 */}
        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#000" style={{ transform: [{ scaleX: -1 }] }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ==================== 2. MAIN MENU SCREEN (右侧主功能层视图) ==================== */}
      <View style={styles.mainPageContainer}>

        {/* HEADER ROW (顶部导航栏) */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={openSidebarMenu}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>MENU</Text>
          <View style={{ width: 35 }} />
        </View>

        {/* 细黑分界线 */}
        <View style={styles.divider} />

        {/* DIETARY TAGS SECTION (双行标签过滤区) */}
        <View style={styles.tagsAreaContainer}>
          {/* 第一行标签 (调整 slice 范围确保把 All 容纳进去且两行均分平衡) */}
          <View style={styles.tagRowWithFilter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollInline}>
              {tags.slice(0, 6).map((tag) => {
                // 如果当前未选择任何标签(selectedTag为null)，则 'All' 自动呈现高亮下划线激活状态
                const isSelected = (selectedTag === null && tag.name === 'All') || (selectedTag && selectedTag.id === tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.tagBadge, isSelected && styles.tagBadgeActive]}
                    onPress={() => toggleTagSelection(tag)}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 第二行标签 */}
          <View style={styles.tagRowSecond}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollInline}>
              {tags.slice(6, 11).map((tag) => {
                const isSelected = selectedTag && selectedTag.id === tag.id;
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.tagBadge, isSelected && styles.tagBadgeActive]}
                    onPress={() => toggleTagSelection(tag)}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* 下方的另一条黑粗分界线 */}
        <View style={styles.divider} />

        {/* VENDOR LIST SECTION (纵向档口卡片列表) */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.vendorScrollPadding}>
          {filteredVendors.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No food vendor available for "{selectedTag?.name}"</Text>
            </View>
          ) : (
            filteredVendors.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                style={styles.vendorCard}
                activeOpacity={0.9}
                onPress={() => Alert.alert("Store Details", `Entering ${vendor.name}'s individual Menu...`)}
              >
                {/* 左侧食物图片 */}
                <Image source={{ uri: vendor.image }} style={styles.vendorImage} />

                {/* 右侧信息白框卡片 */}
                <View style={styles.vendorInfoBox}>
                  <Text style={styles.vendorNameText}>{vendor.name}</Text>

                  <View style={styles.metaRatingRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingNumberText}>{vendor.rating}</Text>
                    <Text style={styles.cuisineTypeText}>{vendor.cuisine}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

    </SafeAreaView>
  );
}

// ==================== 🎨 STYLESYSTEM DESIGN 样式控制表 ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainPageContainer: {
    flex: 1,
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
  hamburgerBtn: {
    width: 35,
    height: 30,
    // borderWidth: 2,
    // borderColor: '#000',
    // borderRadius: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: '#000'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  divider: {
    height: 2,
    backgroundColor: '#000000',
    width: '100%'
  },
  tagsAreaContainer: {
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  tagRowWithFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  tagsScrollInline: {
    paddingRight: 10,
  },
  tagRowSecond: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 8,
    marginBottom: 2,
  },
  tagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 8,
    marginRight: 8,
  },
  tagBadgeActive: {
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  tagTextActive: {
    color: '#000000',
    textDecorationLine: 'underline',
  },
  vendorScrollPadding: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  vendorCard: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
    height: 105,
    alignItems: 'center',
  },
  vendorImage: {
    width: 105,
    height: 105,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#000000',
    resizeMode: 'cover',
  },
  vendorInfoBox: {
    flex: 1,
    height: 90,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderLeftWidth: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  vendorInfoBox: {
    flex: 1,
    height: 90,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderLeftWidth: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  vendorNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  metaRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 4,
    marginRight: 12,
  },
  cuisineTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  noDataContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7f7f7f',
    textAlign: 'center',
  },

  // ==================== 🌟【完全同步整合的侧边栏样式子系统】====================
  sidebar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#ffffff',
    borderRightWidth: 2,
    borderColor: '#000000',
    zIndex: 100,
    height: '100%',
  },
  sidebarOpen: { left: 0 },
  sidebarClosed: { left: -SIDEBAR_WIDTH - 10 },
  sidebarHeader: {
    height: 50,
    justifyContent: 'center',
    paddingLeft: 15,
    paddingTop: 0
  },
  userSection: { alignItems: 'center', paddingVertical: 15 },
  avatarCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 5
  },
  avatarHead: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#000', marginTop: 4 },
  avatarBody: { width: 34, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginBottom: -8 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  menuList: { flex: 1 },
  menuItem: {
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff'
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#000',
    paddingLeft: 30
  },
  logoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    borderTopWidth: 2,
    borderColor: '#0f100f',
    backgroundColor: '#fff',
    marginBottom: Platform.OS === 'ios' ? 10 : 5,
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#070707', marginLeft: 10 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 90
  },
});