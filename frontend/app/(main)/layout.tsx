import type { Metadata } from 'next'
import PrefetchIndexMaker from './PrefetchIndexMaker'
import './globals.css'

export const metadata: Metadata = {
  title: 'Investor Lab',
  description: 'Financial Data Analysis Platform',
  icons: {
    icon: '/site-logo/site-logo.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
          <header style={{ 
            backgroundColor: 'white', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
            borderBottom: '1px solid #e5e7eb' 
          }}>
            <div style={{ 
              maxWidth: '80rem', /* 1280px */
              margin: '0 auto', 
              padding: '0 var(--space-4)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: 'clamp(0.75rem, 2vw, 1.5rem) 0',
                gap: 'clamp(0.5rem, 3vw, 1rem)',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(0.5rem, 2vw, 0.75rem)', minWidth: 0 }}>
                  <img 
                    src="/site-logo/site-logo.png" 
                    alt="Investor Lab" 
                    style={{ 
                      height: 'clamp(2rem, 8vw, 3.75rem)',
                      width: 'auto'
                    }}
                  />
                  <h1 style={{ 
                    fontSize: 'clamp(1rem, 1.2vw + 0.6rem, 1.5rem)', 
                    fontWeight: 'bold', 
                    color: '#111827',
                    margin: 0,
                    paddingBottom: '0.25rem'
                  }}>
                    Investor Lab
                  </h1>
                </div>
                <nav style={{ 
                  display: 'flex', 
                  gap: 'clamp(0.75rem, 4vw, 2rem)', 
                  flexWrap: 'wrap', 
                  alignSelf: 'flex-end',
                  marginTop: 'clamp(0.25rem, 1vw, 0.75rem)'
                }}>
                  <a href="/" style={{ 
                    color: '#111827', 
                    textDecoration: 'none',
                    padding: 'clamp(0.25rem, 1.5vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                    borderRadius: '0.375rem',
                    fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
                    fontWeight: '500'
                  }}>
                    Home
                  </a>
                  <a href="/index-maker" style={{ 
                    color: '#111827', 
                    textDecoration: 'none',
                    padding: 'clamp(0.25rem, 1.5vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                    borderRadius: '0.375rem',
                    fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
                    fontWeight: '500'
                  }}>
                    Index Maker
                  </a>
                  <a href="/etl-summary" style={{ 
                    color: '#111827', 
                    textDecoration: 'none',
                    padding: 'clamp(0.25rem, 1.5vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                    borderRadius: '0.375rem',
                    fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
                    fontWeight: '500'
                  }}>
                    ETL Summary
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main style={{ 
            maxWidth: '100rem', /* 1600px */
            margin: '0 auto', 
            padding: '1rem 0.5rem' 
          }}>
            <PrefetchIndexMaker />
            <div className="app-scale">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
} 