import './globals.css';

export const metadata = {
    title: "Demo Projects Portal",
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

  