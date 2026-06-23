import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere below it so a single crash shows a
 * recoverable fallback instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled error in app:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ opacity: 0.7, maxWidth: '320px' }}>
            The app hit an unexpected error. Your saved cards are still on your
            device — reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
