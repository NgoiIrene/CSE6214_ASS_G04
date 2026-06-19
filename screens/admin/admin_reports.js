// import React, { useState, useEffect, useRef } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   ScrollView,
//   Alert
// } from 'react-native';
// import * as Sharing from 'expo-sharing';
// import * as Print from 'expo-print';
// import { captureRef } from 'react-native-view-shot';

// export default function GenerateReport() {
//   // ==========================================
//   // 1. Report Core Data & State 
//   // ==========================================
//   const [category, setCategory] = useState('overall');
//   const [format, setFormat] = useState('PDF');
//   const chartRef = useRef(null);

//   const [reportsData, setReportsData] = useState({
//     overall: {
//       title: 'Overall Platform Revenue Trend', type: 'bars',
//       data: [
//         { label: 'Gross Merchandise Value (GMV)', value: 8500, prefix: 'RM ' },
//         { label: 'Platform Commission', value: 850, prefix: 'RM ' },
//         { label: 'Platform Net Profit', value: 600, prefix: 'RM ' },
//         { label: 'Refund Total', value: 150, prefix: 'RM ' },
//       ]
//     },
//     settlement: {
//       title: 'Vendor Settlement & Reconciliation', type: 'table',
//       headers: ['Vendor Stall', 'Total Sales', 'Commission', 'Net Payable', 'Status'],
//       rows: [
//         ['Stall A (vendorname)', 'RM 1,200', 'RM 120', 'RM 1,080', 'Settled'],
//         ['Stall B (vendorname)', 'RM 1,850', 'RM 185', 'RM 1,665', 'Pending'],
//         ['Stall C (vendorname)', 'RM 950', 'RM 95', 'RM 855', 'Settled'],
//         ['Stall D (vendorname)', 'RM 2,100', 'RM 210', 'RM 1,890', 'Pending'],
//       ]
//     },
//     top_selling: {
//       title: 'Top-Selling Items Ranking', type: 'ranking',
//       data: [
//         { name: '1. Nasi Lemak', count: 320, percentage: '100%' },
//         { name: '2. Chicken Rice', count: 240, percentage: '75%' },
//         { name: '3. Milo Ice', count: 190, percentage: '60%' },
//         { name: '4. Char Kway Teow', count: 120, percentage: '38%' },
//       ]
//     },
//     peak_hours: {
//       title: 'Peak Ordering Hours Distribution', type: 'hours',
//       data: [
//         { hour: '08:00', orders: 45, height: 40 },
//         { hour: '12:00 (Lunch)', orders: 180, height: 140 },
//         { hour: '15:00', orders: 20, height: 20 },
//         { hour: '18:00 (Dinner)', orders: 110, height: 90 },
//         { hour: '21:00', orders: 35, height: 30 },
//       ]
//     },
//     feedback: {
//       title: 'User Feedback & Complaints Share', type: 'progress_bars',
//       data: [
//         { reason: 'Food Hygiene Issues', percent: 45 },
//         { reason: 'Slow Order Preparation', percent: 35 },
//         { reason: 'Incorrect Order / Small Portion', percent: 20 },
//       ],
//       alert: '⚠️ Alert: 1 vendor has a rating below 3.5★. Please follow up immediately.'
//     }
//   });

//   // ==========================================
//   // 2. 颜色动态判定逻辑
//   // ==========================================
//   const getRevenueColor = (value) => {
//     if (value >= 600) return '#111111';
//     if (value >= 150 && value <= 590) return '#2E7D32';
//     if (value >= 0 && value < 150) return '#C62828';
//     return '#111111';
//   };

//   const getPeakBarColor = (currentOrders, allData) => {
//     const maxOrders = Math.max(...allData.map(item => item.orders));
//     return currentOrders === maxOrders ? '#111111' : '#888888';
//   };

//   const getFeedbackColor = (percent) => {
//     if (percent > 40) return '#C62828';
//     if (percent >= 21 && percent <= 40) return '#EF6C00';
//     if (percent >= 0 && percent <= 20) return '#FBC02D';
//     return '#111111';
//   };

//   useEffect(() => {
//     const fetchSupabaseData = async () => { };
//     fetchSupabaseData();
//   }, []);

//   // ==========================================
//   // 3. Export 逻辑
//   // ==========================================
//   const currentReport = reportsData[category];

//   const handleExport = async () => {
//     try {
//       const reportTitle = currentReport.title;

//       if (format === 'PDF') {
//         let dataRowsHtml = '';

//         if (currentReport.type === 'table') {
//           const headersHtml = currentReport.headers.map(h => `<th>${h}</th>`).join('');
//           const rowsHtml = currentReport.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
//           dataRowsHtml = `
//             <table>
//               <thead><tr>${headersHtml}</tr></thead>
//               <tbody>${rowsHtml}</tbody>
//             </table>
//           `;
//         } else {
//           let col1Title = 'Category';
//           let col2Title = 'Value';

//           if (category === 'top_selling') {
//             col1Title = 'Food Items';
//             col2Title = 'Number of Orders';
//           } else if (category === 'peak_hours') {
//             col1Title = 'Time frame';
//             col2Title = 'Number of Orders';
//           } else if (category === 'feedback') {
//             col1Title = 'Feedback Reason';
//             col2Title = 'Percentage';
//           } else if (category === 'overall') {
//             col1Title = 'Financial Metric';
//             col2Title = 'Amount';
//           }

//           let rowsHtml = '';
//           currentReport.data.forEach(item => {
//             const label = item.label || item.name || item.hour || item.reason;
//             const value = item.value || item.count || item.orders || (item.percent ? item.percent + '%' : '');
//             const prefix = item.prefix || '';
//             rowsHtml += `<tr><td>${label}</td><td>${prefix}${value}</td></tr>`;
//           });

//           dataRowsHtml = `
//             <table>
//               <thead>
//                 <tr>
//                   <th>${col1Title}</th>
//                   <th>${col2Title}</th>
//                 </tr>
//               </thead>
//               <tbody>${rowsHtml}</tbody>
//             </table>
//           `;
//         }

//         const htmlContent = `
//           <html>
//             <head>
//               <style>
//                 body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
//                 h1 { border-bottom: 2px solid #111; padding-bottom: 10px; color: #111; font-size: 22px; }
//                 .meta { color: #888; font-size: 13px; margin-bottom: 30px; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
//                 th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
//                 th { background-color: #f4f4f4; color: #111; font-weight: bold; }
//                 tr:nth-child(even) { background-color: #fafafa; }
//                 .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
//               </style>
//             </head>
//             <body>
//               <h1>${reportTitle}</h1>
//               <p class="meta">Exported on: ${new Date().toLocaleString()}</p>
//               ${dataRowsHtml}
//               <div class="footer">This is an automated official report from the Campus Food Ordering System.</div>
//             </body>
//           </html>
//         `;

//         const { uri } = await Print.printToFileAsync({ html: htmlContent });
//         await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

//         Alert.alert("Export Successful", "Your PDF report has been generated and exported successfully!");
//       }

//       else if (format === 'PNG') {
//         const uri = await captureRef(chartRef, {
//           format: 'png',
//           quality: 1,
//         });

//         await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png' });

//         Alert.alert("Export Successful", "Your PNG chart has been saved successfully!");
//       }

//     } catch (error) {
//       Alert.alert("Export Error", "Something went wrong: " + error.message);
//       console.log("Detailed Export Error:", error);
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

//       <Text style={styles.sectionTitle}>Select Report Category</Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBadgeRow}>
//         {Object.keys(reportsData).map((key) => (
//           <TouchableOpacity
//             key={key}
//             style={[styles.badgeButton, category === key && styles.activeBadgeButton]}
//             onPress={() => setCategory(key)}
//           >
//             <Text style={[styles.badgeText, category === key && styles.activeBadgeText]}>
//               {key === 'overall' ? 'Revenue' : key === 'settlement' ? 'Settlement' : key === 'top_selling' ? 'Top-Selling' : key === 'peak_hours' ? 'Peak Hours' : 'Feedback'}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       <View style={styles.contentDivider} />
//       <Text style={styles.canvasHeader}>Display Chart</Text>

//       <View style={styles.canvasWrapper} ref={chartRef} collapsable={false}>
//         <Text style={styles.innerReportTitle}>{currentReport.title}</Text>

//         <View style={styles.chartContentWrapper}>
//           {currentReport.type === 'bars' && (
//             <View style={styles.barsContainer}>
//               {currentReport.data.map((item, index) => {
//                 const barColor = getRevenueColor(item.value);
//                 return (
//                   <View key={index} style={styles.barItemRow}>
//                     <Text style={styles.barLabel}>{item.label}</Text>
//                     <View style={styles.barTrack}>
//                       <View style={[styles.barFill, { width: `${(item.value / 8500) * 100}%`, backgroundColor: barColor }]} />
//                     </View>
//                     <Text style={styles.barValue}>{item.prefix}{item.value}</Text>
//                   </View>
//                 );
//               })}
//             </View>
//           )}

//           {currentReport.type === 'table' && (
//             <ScrollView horizontal showsHorizontalScrollIndicator={true}>
//               <View style={styles.tableBox}>
//                 <View style={styles.tableHeaderRow}>
//                   {currentReport.headers.map((h, i) => (
//                     <Text key={i} style={[
//                       styles.tableHeaderText,
//                       { width: i === 0 ? 150 : 100, textAlign: i === 0 ? 'left' : 'center', paddingLeft: i === 0 ? 10 : 0 }
//                     ]}>{h}</Text>
//                   ))}
//                 </View>
//                 {currentReport.rows.map((row, rIdx) => (
//                   <View key={rIdx} style={styles.tableDataRow}>
//                     {row.map((cell, cIdx) => (
//                       <Text key={cIdx} style={[
//                         styles.tableCellText,
//                         {
//                           width: cIdx === 0 ? 150 : 100,
//                           textAlign: cIdx === 0 ? 'left' : 'center',
//                           paddingLeft: cIdx === 0 ? 10 : 0,
//                           color: cell === 'Pending' ? '#C62828' : '#333',
//                           fontWeight: cell === 'Pending' ? 'bold' : 'normal'
//                         }
//                       ]}>
//                         {cell}
//                       </Text>
//                     ))}
//                   </View>
//                 ))}
//               </View>
//             </ScrollView>
//           )}

//           {currentReport.type === 'ranking' && (
//             <View style={styles.rankingContainer}>
//               {currentReport.data.map((item, index) => (
//                 <View key={index} style={styles.rankItem}>
//                   <Text style={styles.rankName}>{item.name}</Text>
//                   <View style={styles.rankTrack}>
//                     <View style={[styles.rankFill, { width: item.percentage }]} />
//                     <Text style={styles.rankCount}>{item.count} Orders</Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {currentReport.type === 'hours' && (
//             <View style={styles.hoursContainer}>
//               {currentReport.data.map((item, index) => {
//                 const barColor = getPeakBarColor(item.orders, currentReport.data);
//                 return (
//                   <View key={index} style={styles.hourColumn}>
//                     <Text style={styles.hourCountText}>{item.orders} Orders</Text>
//                     <View style={[styles.hourVerticalBar, { height: item.height, backgroundColor: barColor }]} />
//                     <Text style={styles.hourLabelText}>{item.hour}</Text>
//                   </View>
//                 );
//               })}
//             </View>
//           )}

//           {currentReport.type === 'progress_bars' && (
//             <View style={styles.feedbackContainer}>
//               {currentReport.data.map((item, index) => {
//                 const barColor = getFeedbackColor(item.percent);
//                 return (
//                   <View key={index} style={styles.feedbackRow}>
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
//                       <Text style={styles.feedbackLabel}>{item.reason}</Text>
//                       <Text style={styles.feedbackPercent}>{item.percent}%</Text>
//                     </View>
//                     <View style={styles.feedbackTrack}>
//                       <View style={[styles.feedbackFill, { width: `${item.percent}%`, backgroundColor: barColor }]} />
//                     </View>
//                   </View>
//                 );
//               })}
//               <View style={styles.alertBox}>
//                 <Text style={styles.alertText}>{currentReport.alert}</Text>
//               </View>
//             </View>
//           )}
//         </View>
//       </View>

//       <View style={styles.contentDivider} />

//       <Text style={styles.exportHeader}>Export Options</Text>
//       <View style={styles.radioGroupRow}>
//         {['PDF', 'PNG'].map((type) => (
//           <TouchableOpacity key={type} style={styles.radioOption} onPress={() => setFormat(type)}>
//             <View style={styles.outerRadio}>
//               {format === type && <View style={styles.innerRadio} />}
//             </View>
//             <Text style={styles.radioText}>{type}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
//         <Text style={styles.exportButtonText}>Export Report</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   scrollContent: { paddingTop: 10, paddingBottom: 40, paddingHorizontal: 16 },
//   sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
//   categoryBadgeRow: { flexDirection: 'row', marginBottom: 10 },
//   badgeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
//   activeBadgeButton: { backgroundColor: '#111111', borderColor: '#111111' },
//   badgeText: { fontSize: 12, color: '#555' },
//   activeBadgeText: { color: '#FFF', fontWeight: 'bold' },
//   contentDivider: { borderBottomWidth: 1, borderColor: '#B0B0B0', borderStyle: 'dashed', marginVertical: 20 },

//   canvasHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
//   innerReportTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 0, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 10 },

//   canvasWrapper: { borderWidth: 2, borderColor: '#000000', borderRadius: 6, padding: 16, backgroundColor: '#FCFCFC', height: 340, justifyContent: 'flex-start' },
//   chartContentWrapper: { flex: 1, justifyContent: 'center' },

//   barsContainer: { width: '100%' },
//   barItemRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
//   barLabel: { width: 110, fontSize: 13, fontWeight: '600', color: '#000000' },
//   barTrack: { flex: 1, height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
//   barFill: { height: '100%' },
//   barValue: { width: 75, fontSize: 13, textAlign: 'right', fontWeight: 'bold', color: '#000000' },

//   tableBox: { borderWidth: 1, borderColor: '#000', backgroundColor: '#FFF' },
//   tableHeaderRow: { flexDirection: 'row', backgroundColor: '#ECECEC', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 10 },
//   tableHeaderText: { fontWeight: 'bold', fontSize: 13 },
//   tableDataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#E0E0E0', paddingVertical: 10 },
//   tableCellText: { fontSize: 13 },

//   rankingContainer: { width: '100%' },
//   rankItem: { marginVertical: 8 },
//   rankName: { fontSize: 13, color: '#333', marginBottom: 4 },
//   rankTrack: { height: 20, backgroundColor: '#E0E0E0', borderRadius: 4, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
//   rankFill: { height: '100%', backgroundColor: '#444' },
//   rankCount: { position: 'absolute', right: 10, fontSize: 13, fontWeight: 'bold', color: '#333' },

//   hoursContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, paddingTop: 20 },
//   hourColumn: { alignItems: 'center' },
//   hourVerticalBar: { width: 25, borderRadius: 4, marginTop: 4, marginBottom: 6 },
//   hourCountText: { fontSize: 11, color: '#666' },
//   hourLabelText: { fontSize: 12, fontWeight: '600', color: '#000000' },

//   feedbackContainer: { width: '100%' },
//   feedbackRow: { marginVertical: 8 },
//   feedbackLabel: { fontSize: 13, color: '#000000' },
//   feedbackPercent: { fontSize: 13, fontWeight: 'bold', color: '#000000' },
//   feedbackTrack: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4 },
//   feedbackFill: { height: '100%', borderRadius: 4 },
//   alertBox: { backgroundColor: '#FFF3CD', padding: 10, borderRadius: 4, marginTop: 15, borderWidth: 1, borderColor: '#FFEBAA' },
//   alertText: { fontSize: 12, color: '#856404', lineHeight: 18 },

//   exportHeader: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
//   radioGroupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
//   radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 30 },
//   outerRadio: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
//   innerRadio: { height: 9, width: 9, borderRadius: 4.5, backgroundColor: '#111' },
//   radioText: { fontSize: 13, fontWeight: 'bold' },
//   exportButton: { backgroundColor: '#111111', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
//   exportButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
// });

//2
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   ActivityIndicator
// } from 'react-native';
// import * as Sharing from 'expo-sharing';
// import * as Print from 'expo-print';
// import { captureRef } from 'react-native-view-shot';

// // ⚠️ 引入你的 supabase 客户端 (请确认路径正确)
// import { supabase } from '../../supabaseClient';

// export default function GenerateReport() {
//   const [category, setCategory] = useState('overall');
//   const [format, setFormat] = useState('PDF');
//   const [loading, setLoading] = useState(true); // 加入 loading 状态
//   const chartRef = useRef(null);

//   // 初始状态，等待数据库数据覆盖
//   const [reportsData, setReportsData] = useState({
//     overall: { title: 'Overall Platform Revenue Trend', type: 'bars', data: [] },
//     settlement: { title: 'Vendor Settlement & Reconciliation', type: 'table', headers: ['Vendor Stall', 'Total Sales', 'Commission', 'Net Payable', 'Status'], rows: [] },
//     top_selling: { title: 'Top-Selling Items Ranking', type: 'ranking', data: [] },
//     feedback: { title: 'User Feedback & Complaints Share', type: 'progress_bars', data: [] }
//   });

//   // ==========================================
//   // 1. Color Logic
//   // ==========================================
//   const getRevenueColor = (value) => {
//     if (value >= 600) return '#111111';
//     if (value >= 150 && value <= 590) return '#2E7D32';
//     if (value >= 0 && value < 150) return '#C62828';
//     return '#111111';
//   };

//   const getFeedbackColor = (percent) => {
//     if (percent > 40) return '#C62828';
//     if (percent >= 21 && percent <= 40) return '#EF6C00';
//     if (percent >= 0 && percent <= 20) return '#FBC02D';
//     return '#111111';
//   };

//   // ==========================================
//   // 2. Database Fetch Logic
//   // ==========================================
//   useEffect(() => {
//     const fetchSupabaseData = async () => {
//       setLoading(true);
//       try {
//         // 同步拉取四个 Table 的数据
//         const [
//           { data: revenueData },
//           { data: settlementData },
//           { data: topSellingData },
//           { data: feedbackData }
//         ] = await Promise.all([
//           supabase.from('platform_revenue_summary').select('*').order('id', { ascending: true }),
//           supabase.from('vendor_settlements').select('*').order('id', { ascending: true }),
//           supabase.from('top_selling_items').select('*').order('id', { ascending: true }),
//           supabase.from('user_feedback_summary').select('*').order('id', { ascending: true })
//         ]);

//         // 更新状态，将数据库的数据 Map 进 UI 格式
//         setReportsData({
//           overall: {
//             title: 'Overall Platform Revenue Trend', type: 'bars',
//             data: revenueData ? revenueData.map(item => ({ label: item.label, value: item.amount, prefix: item.prefix })) : []
//           },
//           settlement: {
//             title: 'Vendor Settlement & Reconciliation', type: 'table',
//             headers: ['Vendor Stall', 'Total Sales', 'Commission', 'Net Payable', 'Status'],
//             rows: settlementData ? settlementData.map(item => [item.vendor_stall, `RM ${item.total_sales}`, `RM ${item.commission}`, `RM ${item.net_payable}`, item.status]) : []
//           },
//           top_selling: {
//             title: 'Top-Selling Items Ranking', type: 'ranking',
//             data: topSellingData ? topSellingData.map(item => ({ name: item.item_name, count: item.order_count, percentage: item.percentage_str })) : []
//           },
//           feedback: {
//             title: 'User Feedback & Complaints Share', type: 'progress_bars',
//             data: feedbackData ? feedbackData.map(item => ({ reason: item.reason, percent: item.percent_share })) : []
//           }
//         });
//       } catch (error) {
//         console.error("Fetch Error:", error.message);
//         Alert.alert("Database Error", "Failed to load report data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSupabaseData();
//   }, []);

//   // ==========================================
//   // 3. Export Logic
//   // ==========================================
//   const currentReport = reportsData[category];

//   const handleExport = async () => {
//     try {
//       const reportTitle = currentReport.title;

//       if (format === 'PDF') {
//         let dataRowsHtml = '';

//         if (currentReport.type === 'table') {
//           const headersHtml = currentReport.headers.map(h => `<th>${h}</th>`).join('');
//           const rowsHtml = currentReport.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
//           dataRowsHtml = `
//             <table>
//               <thead><tr>${headersHtml}</tr></thead>
//               <tbody>${rowsHtml}</tbody>
//             </table>
//           `;
//         } else {
//           let col1Title = 'Category';
//           let col2Title = 'Value';

//           if (category === 'top_selling') {
//             col1Title = 'Food Items';
//             col2Title = 'Number of Orders';
//           } else if (category === 'feedback') {
//             col1Title = 'Feedback Reason';
//             col2Title = 'Percentage';
//           } else if (category === 'overall') {
//             col1Title = 'Financial Metric';
//             col2Title = 'Amount';
//           }

//           let rowsHtml = '';
//           currentReport.data.forEach(item => {
//             const label = item.label || item.name || item.reason;
//             const value = item.value || item.count || (item.percent ? item.percent + '%' : '');
//             const prefix = item.prefix || '';
//             rowsHtml += `<tr><td>${label}</td><td>${prefix}${value}</td></tr>`;
//           });

//           dataRowsHtml = `
//             <table>
//               <thead>
//                 <tr>
//                   <th>${col1Title}</th>
//                   <th>${col2Title}</th>
//                 </tr>
//               </thead>
//               <tbody>${rowsHtml}</tbody>
//             </table>
//           `;
//         }

//         const htmlContent = `
//           <html>
//             <head>
//               <style>
//                 body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
//                 h1 { border-bottom: 2px solid #111; padding-bottom: 10px; color: #111; font-size: 22px; }
//                 .meta { color: #888; font-size: 13px; margin-bottom: 30px; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
//                 th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
//                 th { background-color: #f4f4f4; color: #111; font-weight: bold; }
//                 tr:nth-child(even) { background-color: #fafafa; }
//                 .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; }
//               </style>
//             </head>
//             <body>
//               <h1>${reportTitle}</h1>
//               <p class="meta">Exported on: ${new Date().toLocaleString()}</p>
//               ${dataRowsHtml}
//               <div class="footer">This is an automated official report from the Campus Food Ordering System.</div>
//             </body>
//           </html>
//         `;

//         const { uri } = await Print.printToFileAsync({ html: htmlContent });
//         await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

//         Alert.alert("Export Successful", "Your PDF report has been generated and exported successfully!");
//       } else if (format === 'PNG') {
//         const uri = await captureRef(chartRef, {
//           format: 'png',
//           quality: 1,
//         });
//         await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png' });
//         Alert.alert("Export Successful", "Your PNG chart has been saved successfully!");
//       }
//     } catch (error) {
//       Alert.alert("Export Error", "Something went wrong: " + error.message);
//       console.log("Detailed Export Error:", error);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#111111" />
//         <Text style={{ marginTop: 10 }}>Loading database...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

//       <Text style={styles.sectionTitle}>Select Report Category</Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBadgeRow}>
//         {Object.keys(reportsData).map((key) => (
//           <TouchableOpacity
//             key={key}
//             style={[styles.badgeButton, category === key && styles.activeBadgeButton]}
//             onPress={() => setCategory(key)}
//           >
//             <Text style={[styles.badgeText, category === key && styles.activeBadgeText]}>
//               {key === 'overall' ? 'Revenue' : key === 'settlement' ? 'Settlement' : key === 'top_selling' ? 'Top-Selling' : 'Feedback'}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       <View style={styles.contentDivider} />
//       <Text style={styles.canvasHeader}>Display Chart</Text>

//       <View style={styles.canvasWrapper} ref={chartRef} collapsable={false}>
//         <Text style={styles.innerReportTitle}>{currentReport.title}</Text>

//         <View style={styles.chartContentWrapper}>
//           {currentReport.type === 'bars' && currentReport.data && (
//             <View style={styles.barsContainer}>
//               {currentReport.data.map((item, index) => {
//                 const barColor = getRevenueColor(item.value);
//                 return (
//                   <View key={index} style={styles.barItemRow}>
//                     <Text style={styles.barLabel}>{item.label}</Text>
//                     <View style={styles.barTrack}>
//                       <View style={[styles.barFill, { width: `${(item.value / 8500) * 100}%`, backgroundColor: barColor }]} />
//                     </View>
//                     <Text style={styles.barValue}>{item.prefix}{item.value}</Text>
//                   </View>
//                 );
//               })}
//             </View>
//           )}

//           {currentReport.type === 'table' && currentReport.rows && (
//             <ScrollView horizontal showsHorizontalScrollIndicator={true}>
//               <View style={styles.tableBox}>
//                 <View style={styles.tableHeaderRow}>
//                   {currentReport.headers.map((h, i) => (
//                     <Text key={i} style={[
//                       styles.tableHeaderText,
//                       { width: i === 0 ? 150 : 100, textAlign: i === 0 ? 'left' : 'center', paddingLeft: i === 0 ? 10 : 0 }
//                     ]}>{h}</Text>
//                   ))}
//                 </View>
//                 {currentReport.rows.map((row, rIdx) => (
//                   <View key={rIdx} style={styles.tableDataRow}>
//                     {row.map((cell, cIdx) => (
//                       <Text key={cIdx} style={[
//                         styles.tableCellText,
//                         {
//                           width: cIdx === 0 ? 150 : 100,
//                           textAlign: cIdx === 0 ? 'left' : 'center',
//                           paddingLeft: cIdx === 0 ? 10 : 0,
//                           color: cell === 'Pending' ? '#C62828' : '#333',
//                           fontWeight: cell === 'Pending' ? 'bold' : 'normal'
//                         }
//                       ]}>
//                         {cell}
//                       </Text>
//                     ))}
//                   </View>
//                 ))}
//               </View>
//             </ScrollView>
//           )}

//           {currentReport.type === 'ranking' && currentReport.data && (
//             <View style={styles.rankingContainer}>
//               {currentReport.data.map((item, index) => (
//                 <View key={index} style={styles.rankItem}>
//                   <Text style={styles.rankName}>{item.name}</Text>
//                   <View style={styles.rankTrack}>
//                     <View style={[styles.rankFill, { width: item.percentage }]} />
//                     <Text style={styles.rankCount}>{item.count} Orders</Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {currentReport.type === 'progress_bars' && currentReport.data && (
//             <View style={styles.feedbackContainer}>
//               {currentReport.data.map((item, index) => {
//                 const barColor = getFeedbackColor(item.percent);
//                 return (
//                   <View key={index} style={styles.feedbackRow}>
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
//                       <Text style={styles.feedbackLabel}>{item.reason}</Text>
//                       <Text style={styles.feedbackPercent}>{item.percent}%</Text>
//                     </View>
//                     <View style={styles.feedbackTrack}>
//                       <View style={[styles.feedbackFill, { width: `${item.percent}%`, backgroundColor: barColor }]} />
//                     </View>
//                   </View>
//                 );
//               })}
//             </View>
//           )}
//         </View>
//       </View>

//       <View style={styles.contentDivider} />

//       <Text style={styles.exportHeader}>Export Options</Text>
//       <View style={styles.radioGroupRow}>
//         {['PDF', 'PNG'].map((type) => (
//           <TouchableOpacity key={type} style={styles.radioOption} onPress={() => setFormat(type)}>
//             <View style={styles.outerRadio}>
//               {format === type && <View style={styles.innerRadio} />}
//             </View>
//             <Text style={styles.radioText}>{type}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
//         <Text style={styles.exportButtonText}>Export Report</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   scrollContent: { paddingTop: 10, paddingBottom: 40, paddingHorizontal: 16 },
//   sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
//   categoryBadgeRow: { flexDirection: 'row', marginBottom: 10 },
//   badgeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
//   activeBadgeButton: { backgroundColor: '#111111', borderColor: '#111111' },
//   badgeText: { fontSize: 12, color: '#555' },
//   activeBadgeText: { color: '#FFF', fontWeight: 'bold' },
//   contentDivider: { borderBottomWidth: 1, borderColor: '#B0B0B0', borderStyle: 'dashed', marginVertical: 20 },

//   canvasHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
//   innerReportTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 0, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 10 },

//   canvasWrapper: { borderWidth: 2, borderColor: '#000000', borderRadius: 6, padding: 16, backgroundColor: '#FCFCFC', height: 340, justifyContent: 'flex-start' },
//   chartContentWrapper: { flex: 1, justifyContent: 'center' },

//   barsContainer: { width: '100%' },
//   barItemRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
//   barLabel: { width: 110, fontSize: 13, fontWeight: '600', color: '#000000' },
//   barTrack: { flex: 1, height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
//   barFill: { height: '100%' },
//   barValue: { width: 75, fontSize: 13, textAlign: 'right', fontWeight: 'bold', color: '#000000' },

//   tableBox: { borderWidth: 1, borderColor: '#000', backgroundColor: '#FFF' },
//   tableHeaderRow: { flexDirection: 'row', backgroundColor: '#ECECEC', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 10 },
//   tableHeaderText: { fontWeight: 'bold', fontSize: 13 },
//   tableDataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#E0E0E0', paddingVertical: 10 },
//   tableCellText: { fontSize: 13 },

//   rankingContainer: { width: '100%' },
//   rankItem: { marginVertical: 8 },
//   rankName: { fontSize: 13, color: '#333', marginBottom: 4 },
//   rankTrack: { height: 20, backgroundColor: '#E0E0E0', borderRadius: 4, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
//   rankFill: { height: '100%', backgroundColor: '#444' },
//   rankCount: { position: 'absolute', right: 10, fontSize: 13, fontWeight: 'bold', color: '#333' },

//   feedbackContainer: { width: '100%' },
//   feedbackRow: { marginVertical: 8 },
//   feedbackLabel: { fontSize: 13, color: '#000000' },
//   feedbackPercent: { fontSize: 13, fontWeight: 'bold', color: '#000000' },
//   feedbackTrack: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4 },
//   feedbackFill: { height: '100%', borderRadius: 4 },

//   exportHeader: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
//   radioGroupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
//   radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 30 },
//   outerRadio: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
//   innerRadio: { height: 9, width: 9, borderRadius: 4.5, backgroundColor: '#111' },
//   radioText: { fontSize: 13, fontWeight: 'bold' },
//   exportButton: { backgroundColor: '#111111', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
//   exportButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
// });


import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { captureRef } from 'react-native-view-shot';

// ⚠️ 引入你的 supabase 客户端 (请确认路径正确)
import { supabase } from '../../supabaseClient';

export default function GenerateReport() {
  const [category, setCategory] = useState('overall');
  const [format, setFormat] = useState('PDF');
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  const [reportsData, setReportsData] = useState({
    overall: { title: 'Overall Platform Revenue Trend', type: 'bars', data: [] },
    settlement: { title: 'Vendor Settlement & Reconciliation', type: 'table', headers: ['Vendor Stall', 'Total Sales', 'Commission', 'Net Payable', 'Status'], rows: [] },
    top_selling: { title: 'Top-Selling Items Ranking', type: 'ranking', data: [] }
  });

  // ==========================================
  // 1. Color Logic (Revenue)
  // ==========================================
  const getRevenueColor = (value) => {
    if (value >= 600) return '#111111';
    if (value >= 150 && value <= 590) return '#2E7D32';
    if (value >= 0 && value < 150) return '#C62828';
    return '#111111';
  };

  // ==========================================
  // 2. Database Fetch Logic
  // ==========================================
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setLoading(true);
      try {
        // 同步拉取三个 Table 的数据
        const [
          { data: revenueData },
          { data: settlementData },
          { data: topSellingData }
        ] = await Promise.all([
          supabase.from('platform_revenue_summary').select('*').order('id', { ascending: true }),
          supabase.from('vendor_settlements').select('*').order('id', { ascending: true }),
          supabase.from('top_selling_items').select('*').order('id', { ascending: true })
        ]);

        // 更新状态，将数据库的数据 Map 进 UI 格式
        setReportsData({
          overall: {
            title: 'Overall Platform Revenue Trend', type: 'bars',
            data: revenueData ? revenueData.map(item => ({ label: item.label, value: item.amount, prefix: item.prefix })) : []
          },
          settlement: {
            title: 'Vendor Settlement & Reconciliation', type: 'table',
            headers: ['Vendor Stall', 'Total Sales', 'Commission', 'Net Payable', 'Status'],
            rows: settlementData ? settlementData.map(item => [item.vendor_stall, `RM ${item.total_sales}`, `RM ${item.commission}`, `RM ${item.net_payable}`, item.status]) : []
          },
          top_selling: {
            title: 'Top-Selling Items Ranking', type: 'ranking',
            data: topSellingData ? topSellingData.map(item => ({ name: item.item_name, count: item.order_count, percentage: item.percentage_str })) : []
          }
        });
      } catch (error) {
        console.error("Fetch Error:", error.message);
        Alert.alert("Database Error", "Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSupabaseData();
  }, []);

  // ==========================================
  // 3. Export Logic
  // ==========================================
  const currentReport = reportsData[category];

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
          } else if (category === 'overall') {
            col1Title = 'Financial Metric';
            col2Title = 'Amount';
          }

          let rowsHtml = '';
          currentReport.data.forEach(item => {
            const label = item.label || item.name;
            const value = item.value || item.count;
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
      } else if (format === 'PNG') {
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={{ marginTop: 10 }}>Loading database...</Text>
      </View>
    );
  }

  return (
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
              {key === 'overall' ? 'Revenue' : key === 'settlement' ? 'Settlement' : 'Top-Selling'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.contentDivider} />
      <Text style={styles.canvasHeader}>Display Chart</Text>

      <View style={styles.canvasWrapper} ref={chartRef} collapsable={false}>
        <Text style={styles.innerReportTitle}>{currentReport.title}</Text>

        <View style={styles.chartContentWrapper}>
          {currentReport.type === 'bars' && currentReport.data && (
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

          {currentReport.type === 'table' && currentReport.rows && (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.tableBox}>
                <View style={styles.tableHeaderRow}>
                  {currentReport.headers.map((h, i) => (
                    <Text key={i} style={[
                      styles.tableHeaderText,
                      { width: i === 0 ? 150 : 100, textAlign: i === 0 ? 'left' : 'center', paddingLeft: i === 0 ? 10 : 0 }
                    ]}>{h}</Text>
                  ))}
                </View>
                {currentReport.rows.map((row, rIdx) => (
                  <View key={rIdx} style={styles.tableDataRow}>
                    {row.map((cell, cIdx) => (
                      <Text key={cIdx} style={[
                        styles.tableCellText,
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

          {currentReport.type === 'ranking' && currentReport.data && (
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
  );
}

const styles = StyleSheet.create({
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

  canvasWrapper: { borderWidth: 2, borderColor: '#000000', borderRadius: 6, padding: 16, backgroundColor: '#FCFCFC', height: 340, justifyContent: 'flex-start' },
  chartContentWrapper: { flex: 1, justifyContent: 'center' },

  barsContainer: { width: '100%' },
  barItemRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  barLabel: { width: 110, fontSize: 13, fontWeight: '600', color: '#000000' },
  barTrack: { flex: 1, height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%' },
  barValue: { width: 75, fontSize: 13, textAlign: 'right', fontWeight: 'bold', color: '#000000' },

  tableBox: { borderWidth: 1, borderColor: '#000', backgroundColor: '#FFF' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#ECECEC', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 10 },
  tableHeaderText: { fontWeight: 'bold', fontSize: 13 },
  tableDataRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#E0E0E0', paddingVertical: 10 },
  tableCellText: { fontSize: 13 },

  rankingContainer: { width: '100%' },
  rankItem: { marginVertical: 8 },
  rankName: { fontSize: 13, color: '#333', marginBottom: 4 },
  rankTrack: { height: 20, backgroundColor: '#E0E0E0', borderRadius: 4, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  rankFill: { height: '100%', backgroundColor: '#444' },
  rankCount: { position: 'absolute', right: 10, fontSize: 13, fontWeight: 'bold', color: '#333' },

  exportHeader: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  radioGroupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 30 },
  outerRadio: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  innerRadio: { height: 9, width: 9, borderRadius: 4.5, backgroundColor: '#111' },
  radioText: { fontSize: 13, fontWeight: 'bold' },
  exportButton: { backgroundColor: '#111111', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  exportButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});