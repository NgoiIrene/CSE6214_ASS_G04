import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../supabaseClient';

export default function MenuScreen({ onOpenMenu, navigateToVendor }) {

  // 垫底数据防白屏
  const defaultTags = [{ id: '0', name: 'All' }];
  const [tags, setTags] = useState(defaultTags);
  const [vendors, setVendors] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);


  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // 1. 抓取所有商家
        const { data: vends, error: vendError } = await supabase
          .from('profiles')
          .select('*')
          .eq('account_type', 'vendor');

        if (vendError) throw vendError;

        // 2. 抓取分类表
        const { data: mappings, error: mapError } = await supabase
          .from('categories')
          .select('vendor_id, name');

        if (mapError) throw mapError;

        // 🌟 3. 抓取 reviews，并同时连表获取 orders 里的 vendor_id
        const { data: reviewsData, error: reviewError } = await supabase
          .from('reviews')
          .select(`
              rating, 
              orders ( vendor_id ) 
            `);

        if (reviewError) throw reviewError;

        if (vends && mappings) {
          // --- 处理顶部的 Filter 按钮 ---
          const allNames = mappings.map(m => m.name.trim());
          const uniqueNames = [...new Set(allNames)];

          const dynamicTags = uniqueNames.map((name, index) => ({
            id: (index + 1).toString(),
            name: name
          }));
          setTags([{ id: '0', name: 'All' }, ...dynamicTags]);

          // --- 处理下方的商家列表并绑定分类 ---
          const formattedVendors = vends.map(vendor => {
            const vendorTags = mappings
              .filter(m => m.vendor_id === vendor.id)
              .map(m => m.name);

            // 🌟 4. 筛选评价并动态计算平均分
            const vendorReviews = reviewsData ? reviewsData.filter(r => r.orders?.vendor_id === vendor.id) : [];
            let avgRating = 'N/A';
            if (vendorReviews.length > 0) {
              const total = vendorReviews.reduce((sum, r) => sum + r.rating, 0);
              avgRating = (total / vendorReviews.length).toFixed(1);
            }

            return {
              id: vendor.id,
              name: vendor.full_name || vendor.username || 'Unnamed Vendor',
              rating: avgRating, // 👈 动态平均分
              cuisine: vendorTags.length > 0 ? vendorTags.join(', ') : 'LOCAL FOOD',
              image: vendor.avatar_url || 'https://via.placeholder.com/150',
              tags: vendorTags
            };
          });

          setVendors(formattedVendors);
        }
      } catch (error) {
        console.log("Fetch Menu Data error:", error.message);
      }
    };

    fetchMenuData();
  }, []);



  const filteredVendors = (selectedTag && selectedTag.name !== 'All')
    ? vendors.filter(vendor => vendor.tags.includes(selectedTag.name))
    : vendors;

  const toggleTagSelection = (tag) => {
    if (tag.name === 'All') setSelectedTag(null);
    else if (selectedTag && selectedTag.id === tag.id) setSelectedTag(null);
    else setSelectedTag({ id: tag.id, name: tag.name });
  };

  // 自动将动态生成的标签折半，分为两行显示以保持绝美排版
  const halfLength = Math.ceil(tags.length / 2);
  const topRowTags = tags.slice(0, halfLength);
  const bottomRowTags = tags.slice(halfLength);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenMenu}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MENU</Text>
        <View style={{ width: 35 }} />
      </View>

      <View style={styles.divider} />

      <View style={styles.tagsAreaContainer}>
        <View style={styles.tagRowWithFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollInline}>
            {topRowTags.map((tag) => {
              const isSelected = (selectedTag === null && tag.name === 'All') || (selectedTag && selectedTag.id === tag.id);
              return (
                <TouchableOpacity key={tag.id} style={[styles.tagBadge, isSelected && styles.tagBadgeActive]} onPress={() => toggleTagSelection(tag)}>
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.tagRowSecond}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollInline}>
            {bottomRowTags.map((tag) => {
              const isSelected = selectedTag && selectedTag.id === tag.id;
              return (
                <TouchableOpacity key={tag.id} style={[styles.tagBadge, isSelected && styles.tagBadgeActive]} onPress={() => toggleTagSelection(tag)}>
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.vendorScrollPadding}>
        {filteredVendors.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No food vendor available for "{selectedTag?.name}"
            </Text>
          </View>
        ) : (
          filteredVendors.map((vendor) => (
            <TouchableOpacity
              key={vendor.id}
              style={styles.vendorCard}
              activeOpacity={0.9}
              onPress={() => navigateToVendor(vendor)}
            >
              <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
              <View style={styles.vendorInfoBox}>
                <Text style={styles.vendorNameText}>{vendor.name}</Text>
                <View style={styles.metaRatingRow}>
                  <Ionicons name="star" size={16} color="#FFD700" style={{ marginTop: 1 }} />
                  <Text style={styles.ratingNumberText}>{vendor.rating}</Text>
                  <Text style={styles.cuisineTypeText} numberOfLines={2}>
                    {vendor.cuisine.replace(/,\s*/g, '\n')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: 10, backgroundColor: '#ffffff', zIndex: 10 },
  hamburgerBtn: { width: 35, height: 30, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  divider: { height: 2, backgroundColor: '#000000', width: '100%' },
  tagsAreaContainer: { paddingVertical: 10, backgroundColor: '#ffffff' },
  tagRowWithFilter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  tagsScrollInline: { paddingRight: 10 },
  tagRowSecond: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 8, marginBottom: 2 },
  tagBadge: { paddingHorizontal: 14, paddingVertical: 5, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', borderRadius: 8, marginRight: 8 },
  tagBadgeActive: { backgroundColor: '#f0f0f0' },
  tagText: { fontSize: 13, fontWeight: '700', color: '#000000' },
  tagTextActive: { color: '#000000', textDecorationLine: 'underline' },
  vendorScrollPadding: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 },
  vendorCard: { flexDirection: 'row', width: '100%', marginBottom: 16, height: 105, alignItems: 'center' },
  vendorImage: { width: 105, height: 105, borderRadius: 12, borderWidth: 1.5, borderColor: '#000000', resizeMode: 'cover' },
  vendorInfoBox: { flex: 1, height: 90, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', borderLeftWidth: 0, borderTopRightRadius: 4, borderBottomRightRadius: 4, paddingHorizontal: 12, justifyContent: 'center' },
  vendorNameText: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 6 },
  // metaRatingRow: { flexDirection: 'row', alignItems: 'center' },
  // ratingNumberText: { fontSize: 14, fontWeight: 'bold', color: '#000000', marginLeft: 4, marginRight: 12 },
  // cuisineTypeText: { fontSize: 14, fontWeight: 'bold', color: '#000000' },
  metaRatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // 🌟 改为顶端对齐，适配换行
    marginTop: 2
  },
  ratingNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 4,
    marginRight: 12
  },
  cuisineTypeText: {
    fontSize: 11, // 🌟 稍微缩小字号，适应换行
    fontWeight: '800',
    color: '#555555', // 颜色变深灰
    flex: 1, // 🌟 核心限制：把它困在框架里
    lineHeight: 15 // 增加一点行高，让分行更清晰
  },
  noDataContainer: { width: '100%', paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  noDataText: { fontSize: 14, fontWeight: '700', color: '#7f7f7f', textAlign: 'center' }
});