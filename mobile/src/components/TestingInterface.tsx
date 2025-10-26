import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  error?: string;
  duration?: number;
  timestamp?: number;
}

interface SystemInfo {
  platform: string;
  userAgent: string;
  screenSize: string;
  timestamp: number;
  errors: string[];
  warnings: string[];
}

export default function TestingInterface({ onClose }: { onClose: () => void }) {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'tests' | 'system' | 'console'>('tests');
  const [consoleLogs, setConsoleLogs] = useState<Array<{type: string, message: string, timestamp: number}>>([]);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      setConsoleLogs(prev => [...prev, {
        type: 'log',
        message: args.join(' '),
        timestamp: Date.now()
      }]);
      originalLog(...args);
    };

    console.error = (...args) => {
      setConsoleLogs(prev => [...prev, {
        type: 'error',
        message: args.join(' '),
        timestamp: Date.now()
      }]);
      originalError(...args);
    };

    console.warn = (...args) => {
      setConsoleLogs(prev => [...prev, {
        type: 'warn',
        message: args.join(' '),
        timestamp: Date.now()
      }]);
      originalWarn(...args);
    };

    // Initialize tests
    initializeTests();
    gatherSystemInfo();

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const initializeTests = () => {
    const testSuite: TestResult[] = [
      { id: 'react-native', name: 'React Native Core', status: 'pending' },
      { id: 'navigation', name: 'React Navigation', status: 'pending' },
      { id: 'expo-vector-icons', name: 'Expo Vector Icons', status: 'pending' },
      { id: 'safe-area', name: 'Safe Area Context', status: 'pending' },
      { id: 'async-storage', name: 'Async Storage', status: 'pending' },
      { id: 'privy-sdk', name: 'Privy SDK', status: 'pending' },
      { id: 'blockscout-api', name: 'Blockscout API', status: 'pending' },
      { id: 'asi-integration', name: 'ASI Integration', status: 'pending' },
      { id: 'yellow-session', name: 'Yellow Session Mode', status: 'pending' },
      { id: 'qr-generation', name: 'QR Code Generation', status: 'pending' },
    ];
    setTests(testSuite);
  };

  const gatherSystemInfo = () => {
    const info: SystemInfo = {
      platform: typeof window !== 'undefined' ? 'web' : 'native',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
      timestamp: Date.now(),
      errors: [],
      warnings: [],
    };
    setSystemInfo(info);
  };

  const runTest = async (testId: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      switch (testId) {
        case 'react-native':
          // Test React Native core
          if (typeof React !== 'undefined') {
            return {
              id: testId,
              name: 'React Native Core',
              status: 'passed',
              message: `React version: ${React.version}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          }
          throw new Error('React not found');

        case 'navigation':
          // Test navigation
          try {
            const { NavigationContainer } = require('@react-navigation/native');
            return {
              id: testId,
              name: 'React Navigation',
              status: 'passed',
              message: 'Navigation library loaded successfully',
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          } catch (e) {
            throw new Error('Navigation library not found');
          }

        case 'expo-vector-icons':
          // Test Expo Vector Icons
          try {
            const { Ionicons } = require('@expo/vector-icons');
            return {
              id: testId,
              name: 'Expo Vector Icons',
              status: 'passed',
              message: 'Icons library loaded successfully',
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          } catch (e) {
            throw new Error('Vector icons library not found');
          }

        case 'safe-area':
          // Test Safe Area Context
          try {
            const { SafeAreaProvider } = require('react-native-safe-area-context');
            return {
              id: testId,
              name: 'Safe Area Context',
              status: 'passed',
              message: 'Safe area context loaded successfully',
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          } catch (e) {
            throw new Error('Safe area context not found');
          }

        case 'async-storage':
          // Test Async Storage
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage');
            await AsyncStorage.setItem('test-key', 'test-value');
            const value = await AsyncStorage.getItem('test-key');
            if (value === 'test-value') {
              await AsyncStorage.removeItem('test-key');
              return {
                id: testId,
                name: 'Async Storage',
                status: 'passed',
                message: 'Storage read/write successful',
                duration: Date.now() - startTime,
                timestamp: Date.now(),
              };
            }
            throw new Error('Storage test failed');
          } catch (e) {
            throw new Error(`Async Storage error: ${e.message}`);
          }

        case 'privy-sdk':
          // Test Privy SDK
          try {
            const { PrivyProvider } = require('@privy-io/expo');
            return {
              id: testId,
              name: 'Privy SDK',
              status: 'passed',
              message: 'Privy SDK loaded successfully',
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          } catch (e) {
            return {
              id: testId,
              name: 'Privy SDK',
              status: 'failed',
              error: `Privy SDK error: ${e.message}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          }

        case 'blockscout-api':
          // Test Blockscout API
          try {
            const response = await fetch('https://base-sepolia.blockscout.com/api/v2/blocks?page=1');
            if (response.ok) {
              return {
                id: testId,
                name: 'Blockscout API',
                status: 'passed',
                message: 'Blockscout API accessible',
                duration: Date.now() - startTime,
                timestamp: Date.now(),
              };
            }
            throw new Error(`HTTP ${response.status}`);
          } catch (e) {
            return {
              id: testId,
              name: 'Blockscout API',
              status: 'failed',
              error: `API error: ${e.message}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          }

        case 'asi-integration':
          // Test ASI Integration
          try {
            const { volatilityOracle } = require('../lib/asi/volatilityOracle');
            const vol = await volatilityOracle.fetchVolatility();
            return {
              id: testId,
              name: 'ASI Integration',
              status: 'passed',
              message: `Volatility: ${vol.value}% (${vol.source})`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          } catch (e) {
            return {
              id: testId,
              name: 'ASI Integration',
              status: 'failed',
              error: `ASI error: ${e.message}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          }

        case 'yellow-session':
          // Test Yellow Session Mode
          try {
            const { yellowClient } = require('../lib/yellow/clearNodeClient');
            return {
              id: testId,
              name: 'Yellow Session Mode',
              status: 'passed',
              message: 'Yellow client initialized (mock mode)',
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          } catch (e) {
            return {
              id: testId,
              name: 'Yellow Session Mode',
              status: 'failed',
              error: `Yellow error: ${e.message}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          }

        case 'qr-generation':
          // Test QR Code Generation
          try {
            const { generateQRCode } = require('../lib/payments/qrUtils');
            const qr = generateQRCode('test-payment-data');
            return {
              id: testId,
              name: 'QR Code Generation',
              status: 'passed',
              message: 'QR code generated successfully',
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          } catch (e) {
            return {
              id: testId,
              name: 'QR Code Generation',
              status: 'failed',
              error: `QR error: ${e.message}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
          }

        default:
          throw new Error('Unknown test');
      }
    } catch (error) {
      return {
        id: testId,
        name: tests.find(t => t.id === testId)?.name || 'Unknown Test',
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const updatedTests = [...tests];

    for (let i = 0; i < updatedTests.length; i++) {
      // Set test as running
      updatedTests[i] = { ...updatedTests[i], status: 'running' };
      setTests([...updatedTests]);

      // Run the test
      const result = await runTest(updatedTests[i].id);
      updatedTests[i] = result;
      setTests([...updatedTests]);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const runSingleTest = async (testId: string) => {
    const updatedTests = tests.map(test => 
      test.id === testId ? { ...test, status: 'running' as const } : test
    );
    setTests(updatedTests);

    const result = await runTest(testId);
    setTests(tests.map(test => test.id === testId ? result : test));
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'ellipse-outline';
      case 'running': return 'refresh';
      case 'passed': return 'checkmark-circle';
      case 'failed': return 'close-circle';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '#9CA3AF';
      case 'running': return '#F59E0B';
      case 'passed': return '#10B981';
      case 'failed': return '#EF4444';
    }
  };

  const clearConsole = () => {
    setConsoleLogs([]);
  };

  const exportResults = () => {
    const results = {
      timestamp: Date.now(),
      systemInfo,
      tests,
      consoleLogs,
    };
    
    // In a real app, this would download or share the results
    Alert.alert('Export Results', JSON.stringify(results, null, 2));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Testing Interface</Text>
        <TouchableOpacity onPress={exportResults} style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['tests', 'system', 'console'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'tests' && (
          <View>
            {/* Test Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={[styles.runButton, isRunning && styles.disabledButton]}
                onPress={runAllTests}
                disabled={isRunning}
              >
                {isRunning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.runButtonText}>
                  {isRunning ? 'Running Tests...' : 'Run All Tests'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Test Results */}
            <View style={styles.testsContainer}>
              {tests.map((test) => (
                <View key={test.id} style={styles.testItem}>
                  <View style={styles.testHeader}>
                    <View style={styles.testInfo}>
                      <Ionicons
                        name={getStatusIcon(test.status)}
                        size={20}
                        color={getStatusColor(test.status)}
                        style={test.status === 'running' ? styles.spinning : undefined}
                      />
                      <Text style={styles.testName}>{test.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => runSingleTest(test.id)}
                      style={styles.testRunButton}
                    >
                      <Ionicons name="play-outline" size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                  
                  {test.message && (
                    <Text style={styles.testMessage}>{test.message}</Text>
                  )}
                  
                  {test.error && (
                    <Text style={styles.testError}>{test.error}</Text>
                  )}
                  
                  {test.duration && (
                    <Text style={styles.testDuration}>{test.duration}ms</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'system' && systemInfo && (
          <View style={styles.systemContainer}>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Platform:</Text>
              <Text style={styles.systemValue}>{systemInfo.platform}</Text>
            </View>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Screen Size:</Text>
              <Text style={styles.systemValue}>{systemInfo.screenSize}</Text>
            </View>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>User Agent:</Text>
              <Text style={styles.systemValue}>{systemInfo.userAgent}</Text>
            </View>
            <View style={styles.systemItem}>
              <Text style={styles.systemLabel}>Timestamp:</Text>
              <Text style={styles.systemValue}>{new Date(systemInfo.timestamp).toLocaleString()}</Text>
            </View>
          </View>
        )}

        {selectedTab === 'console' && (
          <View style={styles.consoleContainer}>
            <View style={styles.consoleHeader}>
              <Text style={styles.consoleTitle}>Console Logs</Text>
              <TouchableOpacity onPress={clearConsole} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            {consoleLogs.map((log, index) => (
              <View key={index} style={[styles.logItem, styles[`log${log.type.charAt(0).toUpperCase() + log.type.slice(1)}`]]}>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))}
            
            {consoleLogs.length === 0 && (
              <Text style={styles.noLogs}>No console logs yet</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  exportButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  runButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testsContainer: {
    gap: 12,
  },
  testItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  testRunButton: {
    padding: 4,
  },
  testMessage: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 4,
  },
  testError: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 4,
  },
  testDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  spinning: {
    // Add rotation animation if needed
  },
  systemContainer: {
    gap: 16,
  },
  systemItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  systemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  systemValue: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  consoleContainer: {
    flex: 1,
  },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  consoleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  logItem: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  logLog: {
    backgroundColor: '#F3F4F6',
    borderLeftColor: '#6B7280',
  },
  logError: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  logWarn: {
    backgroundColor: '#FFFBEB',
    borderLeftColor: '#F59E0B',
  },
  logTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  noLogs: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
  },
});
