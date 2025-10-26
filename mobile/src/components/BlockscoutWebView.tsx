import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BLOCKSCOUT } from '../lib/chains';

interface BlockscoutWebViewProps {
  visible: boolean;
  onClose: () => void;
  url?: string;
  txHash?: string;
  address?: string;
  title?: string;
}

export default function BlockscoutWebView({
  visible,
  onClose,
  url,
  txHash,
  address,
  title = 'Blockscout',
}: BlockscoutWebViewProps) {

  // Determine the URL to load
  const getWebViewUrl = (): string => {
    if (url) return url;
    if (txHash) return `${BLOCKSCOUT.baseUrl}/tx/${txHash}`;
    if (address) return `${BLOCKSCOUT.baseUrl}/address/${address}`;
    return BLOCKSCOUT.baseUrl;
  };

  const webViewUrl = getWebViewUrl();

  const handleOpenInBrowser = () => {
    Linking.openURL(webViewUrl).catch(() => {
      Alert.alert('Error', 'Unable to open URL in browser');
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: webViewUrl,
        url: webViewUrl,
      });
    } catch (error) {
      console.warn('Error sharing:', error);
    }
  };

  const handleMoreActions = () => {
    Alert.alert(
      'More Actions',
      'Choose an action',
      [
        { text: 'Share', onPress: handleShare },
        { text: 'Open in Browser', onPress: handleOpenInBrowser },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {BLOCKSCOUT.chainName}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={handleMoreActions} 
              style={styles.headerButton}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
            disabled={!canGoBack}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={canGoBack ? '#007AFF' : '#C7C7CC'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoForward}
            style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
            disabled={!canGoForward}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={canGoForward ? '#007AFF' : '#C7C7CC'} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRefresh} style={styles.navButton}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>

          <View style={styles.urlContainer}>
            <Text style={styles.urlText} numberOfLines={1}>
              {currentUrl || webViewUrl}
            </Text>
          </View>

          <TouchableOpacity onPress={handleOpenInBrowser} style={styles.navButton}>
            <Ionicons name="open-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBar} />
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={setWebViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={() => {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load page');
          }}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          decelerationRate="normal"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  urlContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  urlText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    height: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    width: '30%',
    // Add animation here if needed
  },
  webView: {
    flex: 1,
  },
});
