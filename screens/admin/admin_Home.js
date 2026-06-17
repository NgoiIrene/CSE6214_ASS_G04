import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  Platform
} from 'react-native';

export default function HomeScreen() {
  // 模拟的 Database 数据 (保留纯数字，避免渲染异常)
  const [dashboardData] = useState({
    activeUsers: '1,245',
    pendingApprovals: '34',
    activeAds: '12',
    totalMenu: '325',
    // 柱状图高度数组 (Sun 到 Sat)
    chartHeights: [90, 50, 80, 70, 105, 85, 35]
  });

  return (
    // ✅ 直接从 ScrollView 开始返回，不需要 SafeAreaView，也不需要 Header
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      
      {/* 拆分 Title，防止换行符号引起报错 */}
      <Text style={styles.welcomeTitle}>Welcome,</Text>
      <Text style={styles.welcomeTitleBtm}>Charlene!</Text>

      <View style={styles.gridContainer}>
        
        {/* ==================== Card 1: Platform Overview ==================== */}
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Platform Overview</Text>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Active Users:</Text>
            <Text style={styles.metricValue}>{dashboardData.activeUsers}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pending Approvals:</Text>
            <Text style={styles.metricValue}>{dashboardData.pendingApprovals}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Active Advertising Banner:</Text>
            <Text style={styles.metricValue}>{dashboardData.activeAds}</Text>
          </View>
        </View>

        {/* ==================== Card 2: Total Menu ==================== */}
        <View style={[styles.card, styles.halfCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View>
            <Text style={styles.menuLabel}>Total Menu</Text>
            <Text style={styles.menuValue}>{dashboardData.totalMenu}</Text>
          </View>
          <View style={styles.circleChartTrack}>
            <View style={styles.circleChartProgress} />
            <View style={styles.iconDishContainer}>
              <View style={styles.iconDishCap} />
              <View style={styles.iconDishLine} />
            </View>
          </View>
        </View>

        {/* ==================== Card 3: Weekly Revenue ==================== */}
        <View style={[styles.card, styles.fullCard]}>
          <Text style={styles.cardTitle}>Weekly Revenue</Text>
          
          <View style={styles.chartWrapper}>
            
            {/* 🌟 Y轴完全重写：硬编码你的需求 120 90 60 30 20 0 */}
            <View style={styles.yAxisLabels}>
              <Text style={styles.yAxisText}>120</Text>
              <Text style={styles.yAxisText}>90</Text>
              <Text style={styles.yAxisText}>60</Text>
              <Text style={styles.yAxisText}>30</Text>
              <Text style={styles.yAxisText}>20</Text>
              <Text style={[styles.yAxisText, { marginBottom: 15 }]}>0</Text>
            </View>

            {/* 🌟 图表区：撤销 map 函数，恢复硬编码 View，彻底切断所有报错来源 */}
            <View style={styles.chartContainer}>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: dashboardData.chartHeights[0] }]} />
                <Text style={styles.xAxisLabel}>Sun</Text>
              </View>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: dashboardData.chartHeights[1] }]} />
                <Text style={styles.xAxisLabel}>Mon</Text>
              </View>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: dashboardData.chartHeights[2] }]} />
                <Text style={styles.xAxisLabel}>Tue</Text>
              </View>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: dashboardData.chartHeights[3] }]} />
                <Text style={styles.xAxisLabel}>Wed</Text>
              </View>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: dashboardData.chartHeights[4] }]} />
                <Text style={styles.xAxisLabel}>Thu</Text>
              </View>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: dashboardData.chartHeights[5] }]} />
                <Text style={styles.xAxisLabel}>Fri</Text>
              </View>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: dashboardData.chartHeights[6] }]} />
                <Text style={styles.xAxisLabel}>Sat</Text>
              </View>
            </View>

          </View>
        </View>

      </View>
    </ScrollView>
  );
}

// ==================== 🎨 STYLESHEET ====================
// 只保留了 Home.js 页面内容所需的样式，删除了 Sidebar 和 Header 的样式
const styles = StyleSheet.create({
  scrollContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 40 
  },
  
  welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 5 },
  welcomeTitleBtm: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#7f7f7f', borderRadius: 16,
    paddingVertical: 15, paddingHorizontal: 10, marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5 },
      android: { elevation: 5 }
    }),
  },
  halfCard: { width: '49%', minHeight: 140 },
  fullCard: { width: '100%' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#000' },
  
  metricItem: { alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 11, color: '#444' },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  
  menuLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  menuValue: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  
  circleChartTrack: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  circleChartProgress: { position: 'absolute', width: 65, height: 65, borderRadius: 32.5, borderWidth: 4, borderColor: '#ff5722', borderTopColor: 'transparent' },
  
  iconDishContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  iconDishCap: { width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  iconDishLine: { width: 18, height: 2, backgroundColor: '#000', marginTop: 1 },

  // === 🌟 Y轴与图表布局 (精确对齐) ===
  chartWrapper: {
    flexDirection: 'row',
    height: 140, // 图表总高度
    marginTop: 10,
  },
  yAxisLabels: {
    width: 30, // 设定固定宽度保证对齐
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisText: {
    fontSize: 9, // 字号调小一点以适应
    color: '#000000',
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#000000',
    paddingLeft: 10, 
    paddingRight: 5,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 18,
    backgroundColor: '#000000',
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#000000',
    marginTop: 5, // 将底部的字和线拉开一点距离
  },
});