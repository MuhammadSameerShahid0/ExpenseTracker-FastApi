import React from 'react'
import Navbar from './Navbar'
import './HomePage.css'

const HomePage = () => {

  const features = [
    {
      title: "Secure Authentication",
      description: "Two-factor authentication and email verification for maximum security",
      icon: "🔐"
    },
    {
      title: "Track Expenses",
      description: "Easily record and categorize your daily expenses",
      icon: "📝"
    },
    {
      title: "Budget Management",
      description: "Set budgets and monitor your spending habits",
      icon: "💰"
    },
    {
      title: "Detailed Reports",
      description: "Generate insightful reports on your spending patterns",
      icon: "📊"
    }
  ]

  const steps = [
    {
      step: "1",
      title: "Sign Up in Seconds",
      description: "Create your secure account with our streamlined registration process.",
      icon: "📋"
    },
    {
      step: "2",
      title: "Secure Your Account",
      description: "Enable two-factor authentication for bank-level security.",
      icon: "🔒"
    },
    {
      step: "3",
      title: "Track Your Expenses",
      description: "Easily log your daily expenses with our intuitive interface.",
      icon: "💳"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Freelancer",
      content: "ExpenseTracker helped me save over $500 monthly by identifying unnecessary subscriptions.",
      avatar: "👩‍💼"
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      content: "The security features give me peace of mind knowing my financial data is protected.",
      avatar: "👨‍💻"
    },
    {
      name: "Emma Rodriguez",
      role: "Small Business Owner",
      content: "The reporting features have transformed how I manage my business expenses.",
      avatar: "👩‍💼"
    }
  ]

  const footerLinks = {
    product: ["Features", "Security", "Pricing", "Download App"],
    resources: ["Blog", "Tutorials", "Help Center", "Community"],
    company: ["About Us", "Careers", "Contact", "Partners"]
  }

  return (
    <div className="homepage" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-card">
            <div className="hero-content">
              <h1 className="hero-title">Take Control of Your Finances</h1>
              <p className="hero-subtitle">
                Securely track your expenses, manage budgets, and gain financial insights with our 
                two-factor authenticated expense tracking solution.
              </p>
              <div className="hero-buttons">
                <a href="/register" className="btn btn-primary btn-large">Get Started</a>
                <a href="/login" className="btn btn-outline btn-large">Sign In</a>
              </div>
            </div>
            <div className="hero-image">
              <div className="dashboard-preview">
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-title">Monthly Overview</div>
                  </div>
                  <div className="card-content">
                    <div className="chart-placeholder">
                      <div className="chart-bar" style={{height: '70%'}}></div>
                      <div className="chart-bar" style={{height: '45%'}}></div>
                      <div className="chart-bar" style={{height: '60%'}}></div>
                      <div className="chart-bar" style={{height: '30%'}}></div>
                      <div className="chart-bar" style={{height: '80%'}}></div>
                      <div className="chart-bar" style={{height: '55%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage your personal finances</p>
            <br></br>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Get started with our simple 3-step process</p>
            <br></br>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div className="step-card" key={index}>
                <div className="step-header">
                  <div className="step-number">{step.step}</div>
                  <div className="step-icon">{step.icon}</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>What Our Users Say</h2>
            <p>Join thousands of satisfied users who transformed their financial habits</p>
            <br></br>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-card" key={index}>
                <div className="testimonial-content">
                  <p>"{testimonial.content}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{testimonial.avatar}</div>
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security">
        <div className="container">
          <div className="security-card">
            <div className="security-content">
              <div className="security-text">
                <h2>Bank-Level Security</h2>
                <p>
                  Your financial data is protected with industry-standard security measures, 
                  including two-factor authentication, encrypted passwords, and secure email verification.
                </p>
                <div className="security-features">
                  <div className="security-feature">
                    <span className="security-icon">🔒</span>
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="security-feature">
                    <span className="security-icon">📧</span>
                    <span>Email verification</span>
                  </div>
                  <div className="security-feature">
                    <span className="security-icon">📱</span>
                    <span>Two-factor authentication</span>
                  </div>
                  <div className="security-feature">
                    <span className="security-icon">🛡️</span>
                    <span>Secure password hashing</span>
                  </div>
                </div>
              </div>
              <div className="security-image">
                <div className="shield-icon">🛡️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to Take Control?</h2>
            <p>Join thousands of users who have transformed their financial habits</p>
            <a href="/register" className="btn btn-primary btn-large">Create Your Account</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{marginTop: 'auto'}}>
        <div className="container">
          <div className="footer-content">
            <div className="footer-main">
              <div className="footer-brand">
                <h3>ExpenseTracker</h3>
                <p>Take control of your finances with our secure, easy-to-use expense management platform.</p>
                <div className="footer-social">
                  <a href="#" aria-label="Twitter">🐦</a>
                  <a href="#" aria-label="Facebook">📘</a>
                  <a href="#" aria-label="Instagram">📸</a>
                  <a href="#" aria-label="LinkedIn">💼</a>
                </div>
              </div>
              
              <div className="footer-links">
                <div className="footer-column">
                  <h4>Product</h4>
                  <ul>
                    {footerLinks.product.map((link, index) => (
                      <li key={index}><a href="#">{link}</a></li>
                    ))}
                  </ul>
                </div>
                <div className="footer-column">
                  <h4>Resources</h4>
                  <ul>
                    {footerLinks.resources.map((link, index) => (
                      <li key={index}><a href="#">{link}</a></li>
                    ))}
                  </ul>
                </div>
                <div className="footer-column">
                  <h4>Company</h4>
                  <ul>
                    {footerLinks.company.map((link, index) => (
                      <li key={index}><a href="#">{link}</a></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} ExpenseTracker. All rights reserved.</p>
              <div className="footer-legal">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage