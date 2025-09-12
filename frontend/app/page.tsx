'use client';

import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="home-container">
        <div className="home-panel">
          <div className="text-content">
            <p style={{ marginBottom: '2rem' }}>
              Welcome to maleckicoa - Investor Lab, a comprehensive collection of tools designed to 
              help investors make better investment decisions. 
              Our platform provides sophisticated analytical tools that empower both novice and experienced 
              investors to build robust, data-driven investment strategies. 
              The Investor Lab is built on the principle that successful investing requires not just intuition, 
              but rigorous analysis of market data, company fundamentals, and risk-return relationships.
            </p>
            
            <p style={{ marginBottom: '2rem' }}>
              Currently, we offer the Index Maker tool, which allows you to create custom stock indices based 
              on your specific investment criteria, including geographic regions, sectors, industries, and fundamental metrics. 
              The Index Maker enables you to backtest your investment strategies, analyze risk-return profiles, 
              and compare your custom indices against traditional benchmarks to validate your investment thesis. 
              Soon, we will be adding a Momentum Analyzer tool that will help you identify stocks with strong price 
              momentum and analyze trend patterns to optimize your entry and exit timing.
            </p>
            
            <p style={{ marginBottom: '2rem' }}>
              Our tools are designed to handle large datasets efficiently, processing thousands of stocks across 
              multiple markets and timeframes to provide you with comprehensive insights. 
              Whether you're building a diversified portfolio, testing a sector rotation strategy, or analyzing 
              specific market segments, our platform provides the analytical depth you need to make informed decisions. 
              All tools are built with institutional-grade data quality and real-time processing capabilities, 
              ensuring that your analysis is based on accurate, up-to-date market information.
            </p>
            
            <p style={{ marginBottom: '2rem' }}>
              We believe that democratizing access to sophisticated investment analysis tools will help level the 
              playing field for individual investors and improve overall market efficiency. 
              The platform is continuously evolving, with new features and analytical capabilities being added 
              regularly based on user feedback and market needs. 
              Our mission is to provide you with the tools and insights necessary to build wealth through intelligent, 
              data-driven investment decisions.
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