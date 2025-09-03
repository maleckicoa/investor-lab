import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Index Advisor',
  description: 'Financial Data Analysis and Index Creation Platform',
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
              maxWidth: '1280px', 
              margin: '0 auto', 
              padding: '0 1rem' 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1.5rem 0' 
              }}>
                <h1 style={{ 
                  fontSize: '1.875rem', 
                  fontWeight: 'bold', 
                  color: '#111827' 
                }}>
                  Index Advisor
                </h1>
                <nav style={{ display: 'flex', gap: '2rem' }}>
                  <a href="/" style={{ 
                    color: '#111827', 
                    textDecoration: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Home
                  </a>
                  <a href="/index-maker" style={{ 
                    color: '#111827', 
                    textDecoration: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Index Maker
                  </a>
                  <a href="/etl-summary" style={{ 
                    color: '#111827', 
                    textDecoration: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    ETL Summary
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main style={{ 
            maxWidth: '1280px', 
            margin: '0 auto', 
            padding: '1.5rem 1rem' 
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 