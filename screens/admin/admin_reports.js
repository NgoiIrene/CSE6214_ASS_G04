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
    return '#111111';
  };

  // ==========================================
  // 🌟 2. 聪明的 Database Fetch Logic 🌟
  // ==========================================
  useEffect(() => {
    const fetchSupabaseData = async () => {
      setLoading(true);
      try {
        
        const [
          { data: revenueData, error: revError },
          { data: settlementData, error: setError },
          { data: topSellingData, error: topError }
        ] = await Promise.all([
          supabase.from('platform_revenue_summary').select('*').order('id', { ascending: true }),
          supabase.from('vendor_settlements').select('*').order('total_sales', { ascending: false }),
          supabase.from('top_selling_items').select('*').order('order_count', { ascending: false })
        ]);

        if (revError) throw revError;
        if (setError) throw setError;
        if (topError) throw topError;

        setReportsData({
          overall: {
            title: 'Overall Platform Revenue Trend', 
            type: 'bars',
            data: revenueData ? revenueData.map(item => ({ 
              label: item.label, 
              value: Number(item.amount), 
              prefix: item.prefix 
            })) : []
          },
          settlement: {
            title: 'Vendor Settlement & Reconciliation', 
            type: 'table',
            headers: ['Vendor Stall', 'Total Sales', 'Commission', 'Net Payable', 'Status'],
            rows: settlementData ? settlementData.map(item => [
              item.vendor_stall, 
              `RM ${item.total_sales}`, 
              `RM ${item.commission}`, 
              `RM ${item.net_payable}`, 
              item.status
            ]) : []
          },
          top_selling: {
            title: 'Top-Selling Items Ranking', 
            type: 'ranking',
            data: topSellingData ? topSellingData.map(item => ({ 
              name: item.item_name, 
              count: item.order_count, 
              percentage: item.percentage_str 
            })) : []
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
  // 3. Export Logic (保持不变)
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
            const displayValue = typeof value === 'number' && category === 'overall' ? value.toFixed(2) : value;
            rowsHtml += `<tr><td>${label}</td><td>${prefix}${displayValue}</td></tr>`;
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

      } else if (format === 'PNG') {
        const uri = await captureRef(chartRef, {
          format: 'png',
          quality: 1,
        });
        await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png' });
      }
      // 🌟 ADDED SUCCESS NOTIFICATION HERE 🌟
      Alert.alert("Success", "Report exported successfully.");
    } catch (error) {
      Alert.alert("Export Error", "Something went wrong: " + error.message);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={{ marginTop: 10 }}>Loading charts...</Text>
      </View>
    );
  }

  const maxBarValue = currentReport.type === 'bars' && currentReport.data.length > 0
    ? Math.max(...currentReport.data.map(item => item.value))
    : 1;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      <Text style={styles.sectionTitle}>Select Report Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBadgeRow}>
        {Object.keys(reportsData).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.badgeButton, category === key && styles.activeBadgeButton]}
            onPress={() => {setCategory(key);if (key === 'settlement' && format === 'PNG') {
                setFormat('PDF');
              }}}
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
          {/* Revenue Bars */}
          {currentReport.type === 'bars' && currentReport.data && (
            <View style={styles.barsContainer}>
              {currentReport.data.map((item, index) => {
                const barColor = getRevenueColor(item.value);
                const barWidthPercent = maxBarValue > 0 ? (item.value / maxBarValue) * 100 : 0;
                
                return (
                  <View key={index} style={styles.barItemRow}>
                    <Text style={styles.barLabel}>{item.label}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${barWidthPercent}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={styles.barValue}>{item.prefix}{item.value.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Settlement Table */}
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

          {/* Top Selling Ranking */}
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
        {['PDF', 'PNG'].map((type) => {
          // 🌟 新增逻辑：如果是 settlement 且当前遍历到 PNG，则不渲染该按钮
          if (category === 'settlement' && type === 'PNG') return null;

          return (
            <TouchableOpacity key={type} style={styles.radioOption} onPress={() => setFormat(type)}>
              <View style={styles.outerRadio}>
                {format === type && <View style={styles.innerRadio} />}
              </View>
              <Text style={styles.radioText}>{type}</Text>
            </TouchableOpacity>
          );
        })}
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
  rankTrack: { height: 17, backgroundColor: '#E0E0E0', borderRadius: 4, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  rankFill: { height: '100%', backgroundColor: '#7a7878' },
  rankCount: { position: 'absolute', right: 10, fontSize: 13, fontWeight: 'bold', color: '#000000' },

  exportHeader: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  radioGroupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 30 },
  outerRadio: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  innerRadio: { height: 9, width: 9, borderRadius: 4.5, backgroundColor: '#111' },
  radioText: { fontSize: 13, fontWeight: 'bold' },
  exportButton: { backgroundColor: '#111111', paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  exportButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});