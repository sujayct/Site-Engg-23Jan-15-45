import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../utils/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { checkInService } from '../services/checkInService';
import { reportService } from '../services/reportService';
import { CheckIn, DailyReport } from '../types';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const checkInData = await checkInService.getCheckIns();
    const reportData = await reportService.getReports();

    setCheckIns(checkInData.slice(0, 10));
    setReports(reportData.slice(0, 10));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}</Text>
          <Text style={styles.role}>Client</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>
                {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Check-Ins</Text>
        {checkIns.length === 0 ? (
          <Text style={styles.emptyText}>No check-ins yet</Text>
        ) : (
          checkIns.map(checkIn => (
            <View key={checkIn.id} style={styles.card}>
              <Text style={styles.cardName}>{checkIn.userName}</Text>
              <Text style={styles.cardDate}>
                {new Date(checkIn.timestamp).toLocaleString()}
              </Text>
              {checkIn.address && (
                <Text style={styles.cardLocation}>{checkIn.address}</Text>
              )}
              <View style={styles.coordinates}>
                <Text style={styles.coordinateText}>
                  {checkIn.latitude.toFixed(6)}, {checkIn.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {reports.length === 0 ? (
          <Text style={styles.emptyText}>No reports yet</Text>
        ) : (
          reports.map(report => (
            <View key={report.id} style={styles.card}>
              <Text style={styles.cardName}>{report.userName}</Text>
              <Text style={styles.cardDate}>{report.date}</Text>
              <Text style={styles.cardLocation}>{report.siteLocation}</Text>
              <Text style={styles.cardDescription}>{report.workDescription}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${report.progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{report.progress}% Complete</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  role: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  cardLocation: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  coordinates: {
    marginTop: 8,
  },
  coordinateText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
});
