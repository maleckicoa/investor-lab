'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '800px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '3rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 'bold', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Index Advisor
        </h1>
        
        <p style={{ 
          fontSize: '1.5rem', 
          color: '#4a5568', 
          marginBottom: '3rem',
          lineHeight: '1.6',
          fontWeight: '300'
        }}>
          Your gateway to intelligent financial data analysis and index creation
        </p>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          alignItems: 'center',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <Link href="/etl-summary" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{
              backgroundColor: '#667eea',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}>
              <svg style={{ width: '28px', height: '28px', marginRight: '12px', display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              ETL Summary Dashboard
            </button>
          </Link>
          
          <Link href="/index-maker" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{
              backgroundColor: '#764ba2',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(118, 75, 162, 0.4)'
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 6px 20px rgba(118, 75, 162, 0.6)';
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 15px rgba(118, 75, 162, 0.4)';
            }}>
              <svg style={{ width: '28px', height: '28px', marginRight: '12px', display: 'inline-block', verticalAlign: 'middle' }} fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Index Maker
            </button>
          </Link>
        </div>
        
        <div style={{ 
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '15px',
          border: '1px solid rgba(102, 126, 234, 0.2)'
        }}>
          <p style={{ 
            fontSize: '1rem', 
            color: '#4a5568',
            margin: '0',
            fontStyle: 'italic'
          }}>
            "Empowering financial decisions through data-driven insights"
          </p>
        </div>
      </div>
    </div>
  );
} 