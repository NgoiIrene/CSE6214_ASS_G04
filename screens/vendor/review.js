import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ==================== 🛠️ 模拟评价数据源 ====================
const MOCK_REVIEWS = [
  {
    id: '1',
    customer: 'Cindy',
    date: '13/5/2026',
    time: '16:20',
    stars: 1,
    content: 'I honestly have no idea how this place is still in business. The staff were extremely rude and completely ignored us from the moment we walked in. When we asked a simple question, they acted like we were bothering them and literally rolled their eyes. I am paying for a service, not to be treated with such disrespect. Zero stars if I could. Save your money and go somewhere else!'
  },
  {
    id: '2',
    customer: 'Amir',
    date: '13/5/2026',
    time: '15:20',
    stars: 5,
    content: 'I had a wonderful experience here! The food was absolutely delicious, bursting with flavor, and served piping hot. The staff were incredibly friendly, attentive, and made us feel welcome the entire time. The ambiance was also great—perfect for hanging out with friends. It’s rare to find a place that nails both food and service perfectly. Worth every penny, will definitely be coming back soon!'
  },
  {
    id: '3',
    customer: 'Ali',
    date: '13/5/2026',
    time: '15:10',
    stars: 3,
    content: 'The food itself was actually quite good and met my expectations in terms of taste. However, the experience was dragged down by the service. We had to wait for nearly [40 minutes] just for our food to arrive, and the staff seemed a bit disorganized and overwhelmed. It’s a decent place if you’re not in a rush, but don’t come here if you’re starving. Might give it another chance during off-peak hours.'
  },
  {
    id: '4',
    customer: 'Findy',
    date: '13/5/2026',
    time: '15:00',
    stars: 4,
    content: 'I came here with high expectations because of the social media hype, but it turned out to be just average. The food wasn’t bad, but it wasn’t mind-blowing either—just your standard [burger/pasta/rice dish]. The portion size was a bit small for the price they charge. The service was decent and the place was clean, but honestly, there are better and cheaper alternatives nearby. Okay to try once, but probably won’t rush back.'
  },
  {
    id: '5',
    customer: 'Candy',
    date: '13/5/2026',
    time: '14:20',
    stars: 2,
    content: 'The cleanliness of this place is deeply concerning. The tables and chairs were sticky, and there were visible grease stains on the utensils. To make matters worse, I found a [hair / insect / foreign object] in my order. When I pointed it out to the staff, they just gave a half-hearted apology with zero sincerity. Hygiene is the bare minimum for any establishment, and they failed miserably. My stomach feels upset after eating here. Never again.'
  },
  {
    id: '6',
    customer: 'Lala',
    date: '13/5/2026',
    time: '13:40',
    stars: 5,
    content: 'This place is a hidden gem! The portions are generous, and the prices are very reasonable, especially for students. I ordered the [insert dish name], and it exceeded my expectations. The service was fast, and the environment was clean and cozy. If you’re looking for good food that won’t break the bank, this is the place to go. 10/10 recommendation!'
  },
  {
    id: '7',
    customer: 'Lili',
    date: '13/5/2026',
    time: '13:05',
    stars: 3,
    content: 'I came here with high expectations because of the social media hype, but it turned out to be just average. The food wasn’t bad, but it wasn’t mind-blowing either—just your standard [burger/pasta/rice dish]. The portion size was a bit small for the price they charge. The service was decent and the place was clean, but honestly, there are better and cheaper alternatives nearby.'
  }
];

export default function ReviewScreen({ navigateToScreen }) {
  // 1. 状态管理
  const [selectedStar, setSelectedStar] = useState(null); // 当前选中的星级筛选（null 表示不过滤）
  const [searchQuery, setSearchQuery] = useState('');     // 搜索栏文本
  const [isAscending, setIsAscending] = useState(false);   // 排序：默认按时间降序（最新的在上）
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 🚪 侧边栏显隐状态

  // 2. 核心过滤与排序逻辑
  const filteredReviews = useMemo(() => {
    let result = [...MOCK_REVIEWS];

    // 星级筛选
    if (selectedStar !== null) {
      result = result.filter(review => review.stars === selectedStar);
    }

    // 搜索词筛选（不区分大小写）
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(review =>
        review.content.toLowerCase().includes(query) ||
        review.customer.toLowerCase().includes(query)
      );
    }

    // 时间排序 (格式 hh:mm)
    result.sort((a, b) => {
      const timeA = a.time.replace(':', '');
      const timeB = b.time.replace(':', '');
      return isAscending ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
    });

    return result;
  }, [selectedStar, searchQuery, isAscending]);

  // 3. 处理星级按钮点击
  const handleStarPress = (star) => {
    if (selectedStar === star) {
      setSelectedStar(null);
    } else {
      setSelectedStar(star);
    }
  };

  // 4. 处理侧边栏跳转逻辑
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false); // 关闭侧边栏
    if (targetScreen === 'review') return; // 如果已经是当前评价页面则不重复跳转

    if (navigateToScreen) {
      navigateToScreen(targetScreen); // 触发外部主路由层路由跳转
    }
  };

  // 5. 文本高亮渲染函数
  const renderHighlightedContent = (text, highlight) => {
    if (!highlight.trim()) return <Text style={styles.reviewContentText}>{text}</Text>;

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
      <Text style={styles.reviewContentText}>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>{part}</Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  // 6. 渲染星星评分图标
  const renderStars = (rating) => {
    const starIcons = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        starIcons.push(<Ionicons key={i} name="star" size={18} color="#000" style={{ marginRight: 2 }} />);
      } else {
        starIcons.push(<Ionicons key={i} name="star-outline" size={18} color="#000" style={{ marginRight: 2 }} />);
      }
    }
    return <View style={styles.starsContainer}>{starIcons}</View>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>

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

            {/* 导航列表 */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('order')}>
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

            {/* 当前在 Review 页面：高亮显示 */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            {/* 🛠️ 已经为您彻底打通并配置了修改密码页面的跳转入口 */}
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

      {/* ==================== 头部导航 ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerMenuBtn} onPress={() => setIsSidebarOpen(true)}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      {/* ==================== 核心筛选区 ==================== */}
      <View style={styles.filterSection}>
        {/* 星级级别选择器 (Star Level) */}
        <View style={styles.starLevelContainer}>
          <Text style={styles.starLevelLabel}>Star Level:</Text>
          <View style={styles.starButtonsGroup}>
            {[5, 4, 3, 2, 1].map((star, idx) => {
              const isSelected = selectedStar === star;
              return (
                <TouchableOpacity
                  key={star}
                  style={[
                    styles.starBtn,
                    isSelected && styles.starBtnActive,
                    idx === 4 && { borderRightWidth: 0 } // 👈 细节美化：最后一个格子的右框线去掉，更干净
                  ]}
                  onPress={() => handleStarPress(star)}
                >
                  <Text style={[styles.starBtnText, isSelected && styles.starBtnTextActive]}>
                    {star}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 搜索框 */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder=""
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} />
        </View>
      </View>
      <View style={styles.divider} />

      {/* ==================== 结果统计与排序条 ==================== */}
      <View style={styles.resultBar}>
        <Text style={styles.resultBarText}>{filteredReviews.length} Found:</Text>
        <TouchableOpacity onPress={() => setIsAscending(!isAscending)} style={styles.sortBtn}>
          <Ionicons name="swap-vertical" size={18} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* ==================== 评价内容滚动列表 ==================== */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredReviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews found.</Text>
          </View>
        ) : (
          filteredReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              {/* 卡片头部：头像、名字、日期、星星 */}
              <View style={styles.cardHeader}>
                <View style={styles.userInfoContainer}>
                  <View style={styles.commentAvatarCircle}>
                    <Ionicons name="person-outline" size={20} color="#000" />
                  </View>
                  <View style={styles.nameTimeContainer}>
                    <Text style={styles.customerName}>{review.customer}</Text>
                    <Text style={styles.dateTimeText}>{review.date}   {review.time}</Text>
                  </View>
                </View>
                {renderStars(review.stars)}
              </View>

              {/* 卡片主体评论内容（带高亮） */}
              <View style={styles.cardBody}>
                {renderHighlightedContent(review.content, searchQuery)}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 🎨 粗线框极简风格样式表 ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  scrollContainer: { paddingBottom: 30 },

  // 头部样式
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 15 : 35,
  },
  headerMenuBtn: {
    width: 32, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#000', borderRadius: 6, padding: 2,
  },
  headerTitle: { fontSize: 32, fontWeight: 'normal', color: '#000', textAlign: 'center' },

  // 筛选区域样式
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  starLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  starLevelLabel: {
    fontSize: 28,
    color: '#000',
    fontWeight: '400',
  },
  starButtonsGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  starBtn: {
    width: 40,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRightWidth: 1.5,
    borderRightColor: '#000',
  },
  starBtnActive: {
    backgroundColor: '#8e8e8e',
  },
  starBtnText: {
    fontSize: 14,
    color: '#000',
  },
  starBtnTextActive: {
    color: '#fff',
  },

  // 搜索框样式
  searchBarContainer: {
    width: '100%',
    height: 32,
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 14,
    color: '#000',
  },
  searchIcon: {
    marginLeft: 5,
  },

  // 统计条样式
  resultBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  resultBarText: {
    fontSize: 14,
    color: '#000',
  },
  sortBtn: {
    padding: 2,
  },

  // 评价卡片列表样式
  reviewCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameTimeContainer: {
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  dateTimeText: {
    fontSize: 9,
    color: '#999',
    marginTop: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: {
    width: '100%',
    paddingHorizontal: 2,
  },
  reviewContentText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#000',
    textAlign: 'justify',
  },
  highlightedText: {
    color: '#d93025',
    fontWeight: '500',
  },

  // 空白页处理
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },

  /* ==================== 📌 Sidebar 样式表 ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Dimensions.get('window').width * 0.75,
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