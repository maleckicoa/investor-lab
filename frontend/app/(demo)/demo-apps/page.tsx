

export default function DemoProjectsPage() {
    const projects = [
      { name: "CIFAR-10 - Convolutional Neural Network Project", link: "/demo-apps/cifar-10" },
    ];
  
    return (
      <main className="demo-container">
        <h1 className="demo-title">Demo Projects Portal</h1>
  
        <ul className="demo-project-list">
          {projects.map((p) => (
            <li key={p.name} className="demo-project-item">
              <a
                href={p.link}
                className="demo-project-link"
              >
                {p.name}
              </a>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  