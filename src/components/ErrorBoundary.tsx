import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You could also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    // Reset error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Force page reload if error persists
    if (this.state.hasError) {
      window.location.reload();
    }
  };

  private handleReset = () => {
    // Reset error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-red-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <CardTitle className="text-red-600 text-2xl">哎呀，出错了！</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-gray-600">
                <p>应用遇到了一个意外错误，请尝试以下操作：</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={this.handleReset}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  🔄 重试
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  🔃 重新加载页面
                </Button>
              </div>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    开发者信息 (点击展开)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded border text-xs font-mono overflow-auto max-h-40">
                    <div className="text-red-600 font-bold mb-2">错误信息:</div>
                    <div className="mb-3">{this.state.error.message}</div>
                    
                    <div className="text-red-600 font-bold mb-2">错误堆栈:</div>
                    <div className="whitespace-pre-wrap">{this.state.error.stack}</div>
                    
                    {this.state.errorInfo && (
                      <>
                        <div className="text-red-600 font-bold mb-2 mt-3">组件堆栈:</div>
                        <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className="text-center text-sm text-gray-500 mt-4">
                如果问题持续存在，请联系技术支持
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundary for sections
export function SectionErrorBoundary({ children, sectionName }: { children: ReactNode; sectionName: string }) {
  const fallback = (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <div className="text-yellow-700 font-semibold mb-2">
          {sectionName} 暂时不可用
        </div>
        <div className="text-yellow-600 text-sm">
          我们正在修复这个问题，请稍后再试
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}