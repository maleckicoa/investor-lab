export default function DemoProjectsPage() {
    const projects = [
      { name: "CIFAR-10 - Convolutional Neural Network Project", link: "/demo-apps/cifar-10" },
    ];
  
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Demo Projects Portal</h1>
  
        <ul style={{ listStyle: "none", padding: 0 }}>
          {projects.map((p) => (
            <li key={p.name} style={{ marginBottom: "1rem" }}>
              <a
                href={p.link}
                style={{
                  color: "#58a6ff",
                  textDecoration: "none",
                  fontSize: "1.1rem",
                }}
              >
                {p.name}
              </a>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  