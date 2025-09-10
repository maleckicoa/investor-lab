'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        textAlign: 'left', 
        maxWidth: '1200px',
        width: '100%',
        minHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '80px 60px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#6b7280', 
          marginBottom: '3rem',
          lineHeight: '1.6',
          fontWeight: '400',
          textAlign: 'justify'
        }}>
          Welcome to maleckicoa - Investor Lab a page designed to help you in making your investment decisions.
        </p>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          alignItems: 'center',
          maxWidth: '300px',
          margin: '0 auto'
        }}>
          <Link href="/index-maker" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#2563eb';
            }}>
              Index Maker
            </button>
          </Link>
          
          <Link href="/etl-summary" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#4b5563';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#6b7280';
            }}>
              ETL Summary Dashboard
            </button>
          </Link>
        </div>
        
        {/* Profile Photo Placeholder */}
        <div style={{ 
          marginTop: '3rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#e5e7eb',
            border: '2px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Profile
          </div>
        </div>
      </div>
    </div>
  );
} 