import React, { useState, useEffect, useMemo } from 'react';
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
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image // 🎯 确保导入了 Image 组件用于显示侧边栏头像
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 🎯 引入你的 Supabase 客户端实例
import { supabase } from '../../supabaseClient'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReviewScreen({ navigateToScreen }) {
  // 1. 状态管理
  const [selectedStar, setSelectedStar] = useState(null); // 当前选中的星级筛选（null 表示不过滤）
  const [searchQuery, setSearchQuery] = useState('');     // 搜索栏文本
  const [isAscending, setIsAscending] = useState(false);   // 排序：默认按时间降序（最新的在上）
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 🚪 侧边栏显隐状态

  // 👤 新增：Supabase 用户资料状态（Sidebar 动态展示使用）
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 📊 新增：从数据库读取的真实评价数据状态
  const [dbReviews, setDbReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  // ⚙️ 副作用 1：动态拉取当前登录用户的 profiles 数据来展示在 Sidebar 上
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setProfileName('Guest');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          if (profile.full_name) setProfileName(profile.full_name);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.log('Fetch profile error:', error.message);
        setProfileName('User'); // 出错或无数据时的默认降级显示
      }
    };

    fetchUserProfile();
  }, []);

  // ⚙️ 副作用 2：从 Supabase 数据库拉取真实的 Reviews 数据
  useEffect(() => {
    const fetchReviewsFromDB = async () => {
      try {
        setIsReviewsLoading(true);
        // 🎯 从你的 reviews 表中捞取所有评价数据
        const { data, error } = await supabase
          .from('reviews')
          .select('*');

        if (error) throw error;
        if (data) {
          setDbReviews(data);
        }
      } catch (error) {
        console.log('Fetch reviews error:', error.message);
      } finally {
        setIsReviewsLoading(false);
      }
    };

    fetchReviewsFromDB();
  }, []);


  // 2. 核心过滤与排序逻辑 (基于从数据库获取的 dbReviews)
  const filteredReviews = useMemo(() => {
    let result = [...dbReviews];

    // 星级筛选
    if (selectedStar !== null) {
      result = result.filter(review => review.stars === selectedStar);
    }

    // 搜索词筛选（不区分大小写）
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(review =>
        (review.content && review.content.toLowerCase().includes(query)) ||
        (review.customer && review.customer.toLowerCase().includes(query))
      );
    }

    // 时间排序 (格式 hh:mm)
    result.sort((a, b) => {
      const timeA = a.time ? a.time.replace(':', '') : '0000';
      const timeB = b.time ? b.time.replace(':', '') : '0000';
      return isAscending ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
    });

    return result;
  }, [dbReviews, selectedStar, searchQuery, isAscending]);

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
    if (targetScreen === 'review') return; 

    if (navigateToScreen) {
      navigateToScreen(targetScreen); // 触发外部主路由层路由跳转
    }
  };

  // 5. 文本高亮渲染函数
  const renderHighlightedContent = (text, highlight) => {
    if (!text) return null;
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

            {/* 用户头像区域 (🎯 已成功对接 Supabase 个人资料数据进行动态渲染) */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={{ width: 68, height: 68, borderRadius: 34 }} 
                  />
                ) : (
                  <Ionicons name="person-outline" size={45} color="#000" />
                )}
              </View>
              {/* 动态绑定全名 */}
              <Text style={styles.avatarName}>{profileName}</Text>
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
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => setIsSidebarOpen(false)}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            {/* 修改密码页面的跳转入口 */}
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
                    idx === 4 && { borderRightWidth: 0 } 
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
        {isReviewsLoading ? (
          /* 加载状态指示器 */
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={[styles.emptyText, { marginTop: 10 }]}>Loading reviews from database...</Text>
          </View>
        ) : filteredReviews.length === 0 ? (
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

              {/* 卡片主体评论内容（带高亮功能） */}
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

  // 空白页与加载处理
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
    width: SCREEN_WIDTH * 0.75,
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
    overflow: 'hidden' // 确保加载出来的图片不会超出圆圈范围
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 5
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