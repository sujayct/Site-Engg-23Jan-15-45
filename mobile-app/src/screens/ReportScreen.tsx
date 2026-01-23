import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../utils/AuthContext';
import { reportService } from '../services/reportService';
import { useNavigation } from '@react-navigation/native';

export default function ReportScreen() {
  const [siteLocation, setSiteLocation] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [progress, setProgress] = useState('');
  const [issues, setIssues] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!user) return;

    if (!siteLocation || !workDescription || !progress) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const progressNum = parseInt(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      Alert.alert('Error', 'Progress must be between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      await reportService.submitReport(user.id, user.name, {
        siteLocation,
        workDescription,
        progress: progressNum,
        issues: issues || undefined,
        materialsUsed: materialsUsed || undefined,
      });

      Alert.alert('Success', 'Daily report submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Daily Report</Text>
        <Text style={styles.description}>
          Submit your daily work report for tracking and review.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Site Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter site location"
            value={siteLocation}
            onChangeText={setSiteLocation}
            editable={!loading}
          />

          <Text style={styles.label}>Work Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the work completed today"
            value={workDescription}
            onChangeText={setWorkDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />

          <Text style={styles.label}>Progress (%) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0-100"
            value={progress}
            onChangeText={setProgress}
            keyboardType="numeric"
            editable={!loading}
          />

          <Text style={styles.label}>Issues (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any issues or concerns"
            value={issues}
            onChangeText={setIssues}
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <Text style={styles.label}>Materials Used (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="List materials used"
            value={materialsUsed}
            onChangeText={setMaterialsUsed}
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
