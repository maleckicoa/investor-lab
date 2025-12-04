'use client';

import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="home-container">
        <div className="home-panel">
          <div className="text-content">
            <p style={{ marginBottom: '2rem' }}>
            Welcome to <strong>Investor Lab</strong> — a toolkit that help investors make sharper, more informed decisions.  
            This space is built on a simple belief: successful investing isn’t guesswork — 
            it’s about carefully analyzing market behavior, company fundamentals, and the relationship between risk and return.

            </p>
            
            <p style={{ marginBottom: '2rem' }}>
            Right now, you can explore the <strong>Index Maker</strong> — a tool that lets you build your own stock indices 
            based on your exact criteria: countries, sectors, industries, and fundamental filters.  
            You can test your strategies, understand their risk and return characteristics, and benchmark them against traditional indices.  
            And this is just the beginning — I’m currently working on the <strong>Momentum Analyzer</strong>, a tool 
            that spots strong price trends and helps you time your moves with precision. 
            </p>

            <p style={{ marginBottom: '2rem' }}>
            A bit about me: I’m a senior data scientist, ex-quant and a developer with years of experience 
            building analytical tools for top-tier investment banks. Investor Lab is the product of that journey — 
            and I hope it becomes a tool you return to often.
            You can explore more of my work on
            <a 
              href="/demo-apps" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#0070f3', textDecoration: 'underline', marginLeft: '4px' }}
            >
              Demo Apps page
            </a>
            {" "}and
            <a 
              href="https://github.com/maleckicoa" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#0070f3', textDecoration: 'underline', marginLeft: '4px' }}
            >
              GitHub 
            </a>

          </p>
            
            
            {/* Profile Photo and Name - Now positioned relative to text block */}
            <div className="profile-section">
              {/* Text */}
              <div className="profile-text">
                <div className="profile-name">
                  Aleksa Mihajlovic
                </div>
                <div className="profile-title">
                  Investor Lab author
                </div>
              </div>
              
              {/* Photo */}
              <div className="profile-photo">
                <Image
                  src="/site-logo/004.jpg"
                  alt="Profile Photo"
                  width={160}
                  height={160}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}