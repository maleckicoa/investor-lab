import type { Metadata } from 'next'
import './globals.css';

export const metadata: Metadata = {
    title: "Demo Projects Portal",
    description: "AI/ML Demo Applications",
    icons: {
      icon: '/site-logo/site-logo.png'
    }
  };
  
  export default function DemoProjectsLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body className="demo-body">
        {children}
      </body>
    </html>
  );
  }

  