import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global Error Boundary
 * Beklenmeyen UI hatalarında uygulamanın tamamen beyaz ekranda
 * kalmasını önler. Production'da stack trace gösterilmez.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: __DEV__ ? error.message : '',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.sunEmoji}>☀️</Text>
            <Text style={styles.title}>Bir şeyler ters gitti.</Text>
            <Text style={styles.subtitle}>
              Uygulama beklenmeyen bir hatayla karşılaştı.{'\n'}
              Aşağıdaki butona basarak tekrar deneyin.
            </Text>
            {__DEV__ && this.state.errorMessage ? (
              <View style={styles.devErrorBox}>
                <Text style={styles.devErrorText}>{this.state.errorMessage}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFBF7',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sunEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D2A26',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#706B63',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  devErrorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  devErrorText: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#FF8A7A',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
