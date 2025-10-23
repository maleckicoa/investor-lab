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
        <body
          style={{
            margin: 0,
            fontFamily: "Inter, sans-serif",
            backgroundColor: "#0d1117",
            color: "#e6edf3",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </body>
      </html>
    );
  }

  