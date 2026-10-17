import React from 'react';

export default function LoadingSpinner({ size = 28, color = '#e94560' }) {
  const style = {
    width: size,
    height: size,
    border: `3px solid rgba(0,0,0,0.08)`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={style} role="status" aria-label="Loading" />
    </>
  );
}

