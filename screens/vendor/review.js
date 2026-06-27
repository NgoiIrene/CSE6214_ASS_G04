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
  Image // 🎯 Ensure Image component is imported for displaying sidebar avatars
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 🎯 Import your Supabase client instance
import { supabase } from '../../supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReviewScreen({ navigateToScreen }) {
  // 1. State Management
  const [selectedStar, setSelectedStar] = useState(null); // Currently selected star filter (null means no filter)
  const [searchQuery, setSearchQuery] = useState('');     // Search bar text
  const [isAscending, setIsAscending] = useState(false);   // Sort order: default descending by time (newest first)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 🚪 Sidebar open/close state

  // 👤 New: Supabase user profile state (used for dynamic Sidebar display)
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 📊 New: Real review data state fetched from database
  const [dbReviews, setDbReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  // ⚙️ Effect 1: Dynamically fetch current logged-in user's profiles data to display in Sidebar
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
        setProfileName('User'); // Default fallback when error or no data
      }
    };

    fetchUserProfile();
  }, []);

  // ⚙️ Effect 2: Fetch Reviews for the current vendor
  useEffect(() => {
    const fetchReviewsFromDB = async () => {
      try {
        setIsReviewsLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log('No authenticated user');
          setDbReviews([]);
          return;
        }

        // Updated query logic
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
    *,
    orders!inner (
      vendor_id
    )
  `)
          .eq('orders.vendor_id', user.id); // The orders.vendor_id here forces an inner join filter

        if (reviewsError) {
          console.error('Reviews fetch error:', reviewsError);
          // Optional fallback (development use only)
          // const { data: fallback } = await supabase.from('reviews').select('*');
          setDbReviews([]);
          return;
        }

        if (reviewsData && reviewsData.length > 0) {
          const userIds = [...new Set(reviewsData.map(r => r.user_id).filter(Boolean))];

          let profileMap = {};
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', userIds);

            profilesData?.forEach(p => {
              profileMap[p.id] = {
                fullName: p.full_name,
                avatarUrl: p.avatar_url
              };
            });
          }

          const enrichedReviews = reviewsData.map(r => ({
            ...r,
            stars: r.rating,
            content: r.review_text,
            customer: profileMap[r.user_id]?.fullName || 'Customer',
            avatarUrl: profileMap[r.user_id]?.avatarUrl || null,
            date: new Date(r.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit'
            }).replace(/\//g, '-'),
            time: new Date(r.created_at).toLocaleTimeString('zh-CN', {
              hour: '2-digit', minute: '2-digit', hour12: false
            })
          }));

          setDbReviews(enrichedReviews);
        } else {
          setDbReviews([]);
        }
      } catch (error) {
        console.log('Fetch reviews error:', error.message);
        setDbReviews([]);
      } finally {
        setIsReviewsLoading(false);
      }
    };

    fetchReviewsFromDB();
  }, []);


  // 2. Core filtering and sorting logic
  const filteredReviews = useMemo(() => {
    let result = [...dbReviews];

    // Star rating filter
    if (selectedStar !== null) {
      result = result.filter(review => review.stars === selectedStar);
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(review =>
        (review.content && review.content.toLowerCase().includes(query)) ||
        (review.customer && review.customer.toLowerCase().includes(query))
      );
    }

    // ==================== Fixed sorting logic ====================
    result.sort((a, b) => {
      // Sort using created_at timestamp (most accurate)
      const dateA = new Date(a.created_at || a.date);
      const dateB = new Date(b.created_at || b.date);

      if (isAscending) {
        return dateA - dateB;   // Ascending (oldest first)
      } else {
        return dateB - dateA;   // Descending (newest first) ← default
      }
    });

    return result;
  }, [dbReviews, selectedStar, searchQuery, isAscending]);

  // 3. Handle star button press
  const handleStarPress = (star) => {
    if (selectedStar === star) {
      setSelectedStar(null);
    } else {
      setSelectedStar(star);
    }
  };

  // 4. Handle sidebar navigation
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false); // Close sidebar
    if (targetScreen === 'review') return;

    if (navigateToScreen) {
      navigateToScreen(targetScreen); // Trigger the outer main router to navigate
    }
  };

  // 5. Text highlight render function
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

  // 6. Render star rating icons
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

      {/* ==================== 🚪 Sidebar Component ==================== */}
      <Modal
        transparent={true}
        visible={isSidebarOpen}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Left side physical menu */}
          <View style={styles.sidebar}>
            {/* Top bar: Menu toggle button */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            {/* User avatar area (successfully connected to Supabase profile data for dynamic rendering) */}
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
              {/* Dynamically bind full name */}
              <Text style={styles.avatarName}>{profileName}</Text>
            </View>

            {/* Navigation list */}
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

            {/* Currently on Review page: highlight it */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => setIsSidebarOpen(false)}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            {/* Reset password page navigation entry */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            {/* Bottom logout button */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right side dark overlay backdrop */}
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* ==================== Header Navigation ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerMenuBtn} onPress={() => setIsSidebarOpen(true)}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.divider} />

      {/* ==================== Core Filter Section ==================== */}
      <View style={styles.filterSection}>
        {/* Star Level Selector */}
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

        {/* Search bar */}
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

      {/* ==================== Result Count and Sort Bar ==================== */}
      <View style={styles.resultBar}>
        <Text style={styles.resultBarText}>{filteredReviews.length} Found:</Text>
        <TouchableOpacity
          onPress={() => setIsAscending(!isAscending)}
          style={[styles.sortBtn, { flexDirection: 'row', alignItems: 'center' }]}
        >
          <Ionicons
            name={isAscending ? "arrow-up" : "arrow-down"}
            size={18}
            color="#000"
          />
          <Text style={{ fontSize: 13, marginLeft: 4, color: '#000' }}>
            {isAscending ? 'Oldest' : 'Newest'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* ==================== Review Content Scroll List ==================== */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {isReviewsLoading ? (
          /* Loading state indicator */
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
              {/* Card header: avatar, name, date, stars */}
              <View style={styles.cardHeader}>
                <View style={styles.userInfoContainer}>
                  <View style={styles.commentAvatarCircle}>
                    {review.avatarUrl ? (
                      <Image
                        source={{ uri: review.avatarUrl }}
                        style={{ width: 26, height: 26, borderRadius: 13 }}
                      />
                    ) : (
                      <Ionicons name="person-outline" size={20} color="#000" />
                    )}
                  </View>
                  <View style={styles.nameTimeContainer}>
                    <Text style={styles.customerName}>{review.customer}</Text>
                    <Text style={styles.dateTimeText}>{review.date}   {review.time}</Text>
                  </View>
                </View>
                {renderStars(review.stars)}
              </View>

              {/* Card body: review content (with highlight) */}
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

// ==================== 🎨 Bold-border minimalist style sheet ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  scrollContainer: { paddingBottom: 30 },

  // Header styles
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

  // Filter section styles
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

  // Search bar styles
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

  // Result count bar styles
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

  // Review card list styles
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

  // Empty state and loading handler
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },

  /* ==================== 📌 Sidebar Style Sheet ==================== */
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
    overflow: 'hidden' // Ensure loaded avatar image stays within circle boundary
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