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
import { leaveService } from '../services/leaveService';
import { syncService } from '../services/syncService';
import { storageService } from '../services/storageService';
import NetInfo from '@react-native-community/netinfo';

export default function EngineerDashboard() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    checkIns: 0,
    reports: 0,
    leaveRequests: 0,
  });

  useEffect(() => {
    loadData();
    setupNetworkListener();
  }, []);

  const setupNetworkListener = () => {
    NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
  };

  const loadData = async () => {
    const checkIns = await checkInService.getCheckIns(user?.id);
    const reports = await reportService.getReports(user?.id);
    const leaves = await leaveService.getLeaveRequests(user?.id);
    const queue = await storageService.getSyncQueue();

    setStats({
      checkIns: checkIns.length,
      reports: reports.length,
      leaveRequests: leaves.length,
    });
    setPendingSync(queue.length);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (isOnline) {
      await syncService.processSyncQueue();
    }
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
          <Text style={styles.role}>Engineer</Text>
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

      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]}>
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        {pendingSync > 0 && (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>{pendingSync} pending sync</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.checkIns}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.reports}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.leaveRequests}</Text>
          <Text style={styles.statLabel}>Leave Requests</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('CheckIn' as never)}
        >
          <Text style={styles.actionTitle}>GPS Check-In</Text>
          <Text style={styles.actionDescription}>
            Record your location and check in to the site
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Report' as never)}
        >
          <Text style={styles.actionTitle}>Submit Daily Report</Text>
          <Text style={styles.actionDescription}>
            Document your daily work progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Leave' as never)}
        >
          <Text style={styles.actionTitle}>Request Leave</Text>
          <Text style={styles.actionDescription}>
            Submit a new leave request for approval
          </Text>
        </TouchableOpacity>
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
  statusBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  online: {
    backgroundColor: '#d1fae5',
  },
  offline: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  syncIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
});
