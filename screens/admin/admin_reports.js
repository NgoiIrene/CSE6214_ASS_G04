import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { captureRef } from 'react-native-view-shot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

export default function App() {
  // ==========================================
  // 1. Sidebar & Page Base State
  // ==========================================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [category, setCategory] = useState('overall');
  const [format, setFormat] = useState('PDF');

  // 用于绑定图表区域的 Ref，实现 PNG 截图
  const chartRef = useRef(null);

  // ==========================================
  // 2. Report Core Data State 
  // ==========================================
  const [reportsData, setReportsData] = useState({
    overall: {
      title: 'Overall Platform Revenue Trend', type: 'bars', 
      data: [
        { label: 'Gross Merchandise Value (GMV)', value: 8500, prefix: 'RM ' },
        { label: 'Platform Commission', value: 850, prefix: 'RM ' },
        { label: 'Platform Net Profit', value: 600, prefix: 'RM ' },
        { label: 'Refund Total', value: 150, prefix: 'RM ' },
      ]
    },
    settlement: {
      title: 'Vendor Settlement & Reconciliation', type: 'table', 
      headers: ['Vendor Stall', 'Total Sales', 'Commission', 'Net Payable', 'Status'],
      rows: [
        ['Stall A (vendorname)', 'RM 1,200', 'RM 120', 'RM 1,080', 'Settled'],
        ['Stall B (vendorname)', 'RM 1,850', 'RM 185', 'RM 1,665', 'Pending'],
        ['Stall C (vendorname)', 'RM 950', 'RM 95', 'RM 855', 'Settled'],
        ['Stall D (vendorname)', 'RM 2,100', 'RM 210', 'RM 1,890', 'Pending'],
      ]
    },
    top_selling: {
      title: 'Top-Selling Items Ranking', type: 'ranking', 
      data: [
        { name: '1. Nasi Lemak', count: 320, percentage: '100%' },
        { name: '2. Chicken Rice', count: 240, percentage: '75%' },
        { name: '3. Milo Ice', count: 190, percentage: '60%' },
        { name: '4. Char Kway Teow', count: 120, percentage: '38%' },
      ]
    },
    peak_hours: {
      title: 'Peak Ordering Hours Distribution', type: 'hours', 
      data: [
        { hour: '08:00', orders: 45, height: 40 },
        { hour: '12:00 (Lunch)', orders: 180, height: 140 },
        { hour: '15:00', orders: 20, height: 20 },
        { hour: '18:00 (Dinner)', orders: 110, height: 90 },
        { hour: '21:00', orders: 35, height: 30 },
      ]
    },
    feedback: {
      title: 'Customer Feedback & Complaints Share', type: 'progress_bars', 
      data: [
        { reason: 'Food Hygiene Issues', percent: 45 },
        { reason: 'Slow Order Preparation', percent: 35 },
        { reason: 'Incorrect Order / Small Portion', percent: 20 },
      ],
      alert: '⚠️ Alert: 1 vendor has a rating below 3.5★. Please follow up immediately.'
    }
  });

  // ==========================================
  // 3. 颜色动态判定逻辑
  // ==========================================
  const getRevenueColor = (value) => {
    if (value >= 600) return '#111111'; 
    if (value >= 150 && value <= 590) return '#2E7D32'; 
    if (value >= 0 && value < 150) return '#C62828'; 
    return '#111111'; 
  };

  const getPeakBarColor = (currentOrders, allData) => {
    const maxOrders = Math.max(...allData.map(item => item.orders));
    return currentOrders === maxOrders ? '#111111' : '#888888';
  };

  const getFeedbackColor = (percent) => {
    if (percent > 40) return '#C62828'; 
    if (percent >= 21 && percent <= 40) return '#EF6C00'; 
    if (percent >= 0 && percent <= 20) return '#FBC02D'; 
    return '#111111'; 
  };

  useEffect(() => {
    const fetchSupabaseData = async () => {};
    fetchSupabaseData();
  }, []);

  const handleMenuClick = (moduleName) => {
    Alert.alert("Navigation", `Connecting to ${moduleName} module...`);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "You have been logged out successfully.");
    setIsSidebarOpen(false);
  };

  // ==========================================
  // Export 逻辑
  // ==========================================
  const handleExport = async () => {
    try {
      const reportTitle = currentReport.title;

      if (format === 'PDF') {
        let dataRowsHtml = '';

        if (currentReport.type === 'table') {
          const headersHtml = currentReport.headers.map(h => `<th>${h}</th>`).join('');
          const rowsHtml = currentReport.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
          dataRowsHtml = `
            <table>
              <thead><tr>${headersHtml}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          `;
        } else {
          let col1Title = 'Category';
          let col2Title = 'Value';

          if (category === 'top_selling') {
            col1Title = 'Food Items';
            col2Title = 'Number of Orders';
          } else if (category === 'peak_hours') {
            col1Title = 'Time frame';
            col2Title = 'Number of Orders';
          } else if (category === 'feedback') {
            col1Title = 'Feedback Reason';
            col2Title = 'Percentage';
          } else if (category === 'overall') {
            col1Title = 'Financial Metric';
            col2Title = 'Amount';
          }

          let rowsHtml = '';
          currentReport.data.forEach(item => {
            const label = item.label || item.name || item.hour || item.reason;
            const value = item.value || item.count || item.orders || (item.percent ? item.percent + '%' : '');
            const prefix = item.prefix || '';
            rowsHtml += `<tr><td>${label}</td><td>${prefix}${value}</td></tr>`;
          });

          dataRowsHtml = `
            <table>
              <thead>
                <tr>
                  <th>${col1Title}</th>
                  <th>${col2Title}</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          `;
        }

        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
                h1 { border-bottom: 2px solid #111; padding-bottom: 10px; color: #111; font-size: 22px; }
                .meta { color: #888; font-size: 13px; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f4f4f4; color: #111; font-weight: bold; }
                tr:nth-child(even) { background-color: #fafafa; }
                .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
              </style>
            </head>
            <body>
              <h1>${reportTitle}</h1>
              <p class="meta">Exported on: ${new Date().toLocaleString()}</p>
              ${dataRowsHtml}
              <div class="footer">This is an automated official report from the Campus Food Ordering System.</div>
            </body>
          </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        
        Alert.alert("Export Successful", "Your PDF report has been generated and exported successfully!");
      } 
      
      else if (format === 'PNG') {
        const uri = await captureRef(chartRef, {
          format: 'png',
          quality: 1, 
        });
        
        await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png' });
        
        Alert.alert("Export Successful", "Your PNG chart has been saved successfully!");
      }

    } catch (error) {
      Alert.alert("Export Error", "Something went wrong: " + error.message);
      console.log("Detailed Export Error:", error);
    }
  };

  const renderOverlay = () => {
    if (isSidebarOpen) {
      return <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsSidebarOpen(false)} />;
    }
    return null;
  };

  const currentReport = reportsData[category];

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderOverlay()}

      {/* ==================== LEFT SIDEBAR ==================== */}
      <View style={[styles.sidebar, isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        <View style={styles.userSection}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarHead} /><View style={styles.avatarBody} />
          </View>
          <Text style={styles.username}>Charlene</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Home')}>
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Profile')}>
            <Text style={styles.menuItemText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Accounts')}>
            <Text style={styles.menuItemText}>Manage Accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Menu & Content')}>
            <Text style={styles.menuItemText}>Manage Menu & Content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsSidebarOpen(false)}>
            <Text style={styles.menuItemText}>Generate Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Configure System Settings')}>
            <Text style={styles.menuItemText}>Configure System Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Manage Advertising Board')}>
            <Text style={styles.menuItemText}>Manage Advertising Board</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuClick('Process Application Approval')}>
            <Text style={styles.menuItemText}>Process Application Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 2 }]} onPress={() => handleMenuClick('Reset Password')}>
            <Text style={styles.menuItemText}>Reset Password</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
          <Ionicons name="arrow-forward-outline" size={16} color="#000" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ==================== Top Unified Header ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Reports</Text>
        <View style={{ width: 35, marginRight: 15 }} />
      </View>
      <View style={styles.headerDivider} />

      {/* ==================== Main Page Content ==================== */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Select Report Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBadgeRow}>
          {Object.keys(reportsData).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.badgeButton, category === key && styles.activeBadgeButton]}
              onPress={() => setCategory(key)}
            >
              <Text style={[styles.badgeText, category === key && styles.activeBadgeText]}>
                {key === 'overall' ? 'Revenue' : key === 'settlement' ? 'Settlement' : key === 'top_selling' ? 'Top-Selling' : key === 'peak_hours' ? 'Peak Hours' : 'Feedback'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.contentDivider} />
        <Text style={styles.canvasHeader}>Display Chart</Text>

        {/* 外框设置 flex-start 让内容从头开始排，而不是整体居中 */}
        <View style={styles.canvasWrapper} ref={chartRef} collapsable={false}>
          
          <Text style={styles.innerReportTitle}>{currentReport.title}</Text>
          
          {/* 🌟 核心修复1：将图表内容包裹在 flex:1 且居中的区域内，这样标题位置永远不动！ */}
          <View style={styles.chartContentWrapper}>
            {currentReport.type === 'bars' && (
              <View style={styles.barsContainer}>
                {currentReport.data.map((item, index) => {
                  const barColor = getRevenueColor(item.value);
                  return (
                    <View key={index} style={styles.barItemRow}>
                      <Text style={styles.barLabel}>{item.label}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${(item.value / 8500) * 100}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={styles.barValue}>{item.prefix}{item.value}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {currentReport.type === 'table' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableBox}>
                  <View style={styles.tableHeaderRow}>
                    {currentReport.headers.map((h, i) => (
                      <Text key={i} style={[
                        styles.tableHeaderText, 
                        // 🌟 核心修复2：如果 i 是 0 (第一列)，就靠左对齐并加左内边距；其余列居中
                        { width: i === 0 ? 150 : 100, textAlign: i === 0 ? 'left' : 'center', paddingLeft: i === 0 ? 10 : 0 }
                      ]}>{h}</Text>
                    ))}
                  </View>
                  {currentReport.rows.map((row, rIdx) => (
                    <View key={rIdx} style={styles.tableDataRow}>
                      {row.map((cell, cIdx) => (
                        <Text key={cIdx} style={[
                          styles.tableCellText, 
                          // 🌟 核心修复2：第一列文本强制靠左对齐，并留出 padding
                          { 
                            width: cIdx === 0 ? 150 : 100, 
                            textAlign: cIdx === 0 ? 'left' : 'center',
                            paddingLeft: cIdx === 0 ? 10 : 0,
                            color: cell === 'Pending' ? '#C62828' : '#333', 
                            fontWeight: cell === 'Pending' ? 'bold' : 'normal' 
                          }
                        ]}>
                          {cell}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            {currentReport.type === 'ranking' && (
              <View style={styles.rankingContainer}>
                {currentReport.data.map((item, index) => (
                  <View key={index} style={styles.rankItem}>
                    <Text style={styles.rankName}>{item.name}</Text>
                    <View style={styles.rankTrack}>
                      <View style={[styles.rankFill, { width: item.percentage }]} />
                      <Text style={styles.rankCount}>{item.count} Orders</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {currentReport.type === 'hours' && (
              <View style={styles.hoursContainer}>
                {currentReport.data.map((item, index) => {
                  const barColor = getPeakBarColor(item.orders, currentReport.data);
                  return (
                    <View key={index} style={styles.hourColumn}>
                      <Text style={styles.hourCountText}>{item.orders} Orders</Text>
                      <View style={[styles.hourVerticalBar, { height: item.height, backgroundColor: barColor }]} />
                      <Text style={styles.hourLabelText}>{item.hour}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {currentReport.type === 'progress_bars' && (
              <View style={styles.feedbackContainer}>
                {currentReport.data.map((item, index) => {
                  const barColor = getFeedbackColor(item.percent);
                  return (
                    <View key={index} style={styles.feedbackRow}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.feedbackLabel}>{item.reason}</Text>
                        <Text style={styles.feedbackPercent}>{item.percent}%</Text>
                      </View>
                      <View style={styles.feedbackTrack}>
                        <View style={[styles.feedbackFill, { width: `${item.percent}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  );
                })}
                <View style={styles.alertBox}>
                  <Text style={styles.alertText}>{currentReport.alert}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentDivider} />

        <Text style={styles.exportHeader}>Export Options</Text>
        <View style={styles.radioGroupRow}>
          {['PDF', 'PNG'].map((type) => (
            <TouchableOpacity key={type} style={styles.radioOption} onPress={() => setFormat(type)}>
              <View style={styles.outerRadio}>
                {format === type && <View style={styles.innerRadio} />}
              </View>
              <Text style={styles.radioText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>Export Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35, backgroundColor: '#ffffff', zIndex: 10 },
  hamburgerBtn: { width: 35, height: 30, borderRadius: 4, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4, marginRight: 15 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'center' },
  headerDivider: { height: 2, backgroundColor: '#000', width: '100%' },
  
  sidebar: { position: 'absolute', top: Platform.OS === 'ios' ? 44 : 40, height: '100%', width: SIDEBAR_WIDTH, backgroundColor: '#ffffff', borderRightWidth: 2, borderColor: '#000000', zIndex: 100 },
  sidebarOpen: { left: 0 },
  sidebarClosed: { left: -SIDEBAR_WIDTH - 10 },
  sidebarHeader: { height: 65, justifyContent: 'center', paddingLeft: 15, paddingTop: Platform.OS === 'ios' ? 0 : 20 },
  userSection: { alignItems: 'center', paddingVertical: 15 },
  avatarCircle: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 5 },
  avatarHead: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#000', marginTop: 4 },
  avatarBody: { width: 34, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginBottom: -8 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  menuList: { flex: 1 },
  menuItem: { width: '100%', paddingVertical: 12, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#fff' },
  menuItemText: { fontSize: 14, fontWeight: 'bold', textAlign: 'left', color: '#000', paddingLeft: 30 },
  logoutBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingBottom: Platform.OS === 'ios' ? 20 : 15, borderTopWidth: 2, borderColor: '#0f100f', backgroundColor: '#fff', marginBottom: Platform.OS === 'ios' ? 10 : 5 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#070707', marginLeft: 8 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 90 },

  scrollContent: { paddingTop: 10, paddingBottom: 40, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  categoryBadgeRow: { flexDirection: 'row', marginBottom: 10 },
  badgeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  activeBadgeButton: { backgroundColor: '#111111', borderColor: '#111111' },
  badgeText: { fontSize: 12, color: '#555' },
  activeBadgeText: { color: '#FFF', fontWeight: 'bold' },
  contentDivider: { borderBottomWidth: 1, borderColor: '#B0B0B0', borderStyle: 'dashed', marginVertical: 20 },
  
  canvasHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  innerReportTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 0, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 10 },
  
  // 🌟 将主包裹层改为顶部对齐 flex-start
  canvasWrapper: { borderWidth: 2, borderColor: '#000000', borderRadius: 6, padding: 16, backgroundColor: '#FCFCFC', height: 340, justifyContent: 'flex-start' },
  // 🌟 将图表内容区域设为独立居中
  chartContentWrapper: { flex: 1, justifyContent: 'center' },

  barsContainer: { width: '100%' },
  barItemRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  barLabel: { width: 110, fontSize: 13, fontWeight: '600', color: '#000000' },
  barTrack: { flex: 1, height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%' },
  barValue: { width: 75, fontSize: 13, textAlign: 'right', fontWeight: 'bold', color: '#000000' },
  
  tableBox: { borderWidth: 1, borderColor: '#000', backgroundColor: '#FFF' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#ECECEC', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 10 },
  tableHeaderText: { fontWeight: 'bold', fontSize: 13 }, // 🌟 删除了默认的 textAlign: center，交由 inline 控制
  tableDataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#E0E0E0', paddingVertical: 10 },
  tableCellText: { fontSize: 13 }, // 🌟 删除了默认的 textAlign: center，交由 inline 控制
  
  rankingContainer: { width: '100%' },
  rankItem: { marginVertical: 8 },
  rankName: { fontSize: 13, color: '#333', marginBottom: 4 },
  rankTrack: { height: 20, backgroundColor: '#E0E0E0', borderRadius: 4, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  rankFill: { height: '100%', backgroundColor: '#444' },
  rankCount: { position: 'absolute', right: 10, fontSize: 13, fontWeight: 'bold', color: '#333' },
  
  hoursContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, paddingTop: 20 },
  hourColumn: { alignItems: 'center' },
  hourVerticalBar: { width: 25, borderRadius: 4, marginTop: 4, marginBottom: 6 },
  hourCountText: { fontSize: 11, color: '#666' },
  hourLabelText: { fontSize: 12, fontWeight: '600', color: '#000000' },
  
  feedbackContainer: { width: '100%' },
  feedbackRow: { marginVertical: 8 },
  feedbackLabel: { fontSize: 13, color: '#000000' },
  feedbackPercent: { fontSize: 13, fontWeight: 'bold', color: '#000000' },
  feedbackTrack: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4 },
  feedbackFill: { height: '100%', borderRadius: 4 },
  alertBox: { backgroundColor: '#FFF3CD', padding: 10, borderRadius: 4, marginTop: 15, borderWidth: 1, borderColor: '#FFEBAA' },
  alertText: { fontSize: 12, color: '#856404', lineHeight: 18 },
  
  exportHeader: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  radioGroupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 30 },
  outerRadio: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  innerRadio: { height: 9, width: 9, borderRadius: 4.5, backgroundColor: '#111' },
  radioText: { fontSize: 13, fontWeight: 'bold' },
  exportButton: { backgroundColor: '#111111', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  exportButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});