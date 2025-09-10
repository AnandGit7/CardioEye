import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, AlertTriangle, Activity, Shield, Smartphone, Brain, Bell, User, UserCheck } from "lucide-react";
import PatientAuthModal from "@/components/auth/patient-auth-modal";
import DoctorAuthModal from "@/components/auth/doctor-auth-modal";
import RealTimeChart from "@/components/ecg/real-time-chart";

export default function Landing() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3" data-testid="logo">
              <div className="relative">
                <Heart className="text-accent text-2xl fill-current" />
                <AlertTriangle className="text-yellow-500 text-xs absolute -top-1 -right-1" size={12} />
              </div>
              <span className="text-2xl font-bold text-foreground">CardioEye</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#home" className="text-foreground hover:text-accent transition-colors" data-testid="nav-home">Home</a>
              <a href="#subscription" className="text-muted-foreground hover:text-accent transition-colors" data-testid="nav-subscription">Subscription</a>
              <a href="#product" className="text-muted-foreground hover:text-accent transition-colors" data-testid="nav-product">Product</a>
              <a href="#admin" className="text-muted-foreground hover:text-accent transition-colors" data-testid="nav-admin">Admin</a>
            </nav>

            {/* Notification Bell */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="text-muted-foreground text-xl cursor-pointer hover:text-accent transition-colors" data-testid="notification-bell" />
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce" data-testid="notification-count">
                  3
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-primary to-secondary py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight" data-testid="hero-title">
                Monitor Your Heart with
                <span className="text-accent"> CardioEye</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed" data-testid="hero-description">
                Real-time ECG monitoring with instant alerts. Stay connected to your heart health with our advanced AI-powered detection system.
              </p>
              
              {/* Enhanced Get Started Section */}
              <Card className="bg-card shadow-lg border border-border" data-testid="get-started-card">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-semibold text-foreground mb-6 text-center" data-testid="get-started-title">Get Started</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Patient Option */}
                    <div 
                      className="bg-secondary rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setShowPatientModal(true)}
                      data-testid="patient-option"
                    >
                      <User className="text-accent text-3xl mb-4 mx-auto" />
                      <h4 className="text-lg font-semibold text-foreground mb-2">Patient</h4>
                      <p className="text-muted-foreground text-sm mb-4">Monitor your heart health and receive real-time alerts</p>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-patient-auth">
                        Login / Sign Up
                      </Button>
                    </div>
                    
                    {/* Doctor Option */}
                    <div 
                      className="bg-secondary rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setShowDoctorModal(true)}
                      data-testid="doctor-option"
                    >
                      <UserCheck className="text-accent text-3xl mb-4 mx-auto" />
                      <h4 className="text-lg font-semibold text-foreground mb-2">Doctor</h4>
                      <p className="text-muted-foreground text-sm mb-4">Access patient data and provide remote monitoring</p>
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" data-testid="button-doctor-auth">
                        Login / Sign Up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ECG Visualization */}
            <Card className="bg-card shadow-xl border border-border" data-testid="ecg-card">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="ecg-title">Live ECG Reading</h3>
                  <RealTimeChart />
                </div>
                
                {/* Status Indicators */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center" data-testid="heart-rate-display">
                    <div className="text-2xl font-bold text-accent">72</div>
                    <div className="text-sm text-muted-foreground">BPM</div>
                  </div>
                  <div className="text-center" data-testid="status-display">
                    <div className="text-2xl font-bold text-green-600">Normal</div>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                  <div className="text-center" data-testid="sync-status">
                    <div className="text-2xl font-bold text-blue-600">Live</div>
                    <div className="text-sm text-muted-foreground">Sync</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card" id="product">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="features-title">Advanced Heart Monitoring Features</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="features-description">
              Experience the future of cardiac care with our comprehensive monitoring and alert system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-secondary hover:shadow-lg transition-shadow" data-testid="feature-realtime">
              <CardContent className="p-6">
                <Activity className="text-accent text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Real-time ECG</h3>
                <p className="text-muted-foreground">Continuous monitoring with smartwatch integration and instant data streaming to your healthcare providers.</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary hover:shadow-lg transition-shadow" data-testid="feature-alerts">
              <CardContent className="p-6">
                <AlertTriangle className="text-accent text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Instant Alerts</h3>
                <p className="text-muted-foreground">WhatsApp and SMS notifications for critical heart events, ensuring immediate response when needed.</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary hover:shadow-lg transition-shadow" data-testid="feature-dashboard">
              <CardContent className="p-6">
                <Activity className="text-accent text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Doctor Dashboard</h3>
                <p className="text-muted-foreground">Comprehensive patient data analysis with AI-powered insights for better diagnosis and treatment.</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary hover:shadow-lg transition-shadow" data-testid="feature-security">
              <CardContent className="p-6">
                <Shield className="text-accent text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Secure Access</h3>
                <p className="text-muted-foreground">Role-based authentication with doctor verification codes ensuring data privacy and compliance.</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary hover:shadow-lg transition-shadow" data-testid="feature-mobile">
              <CardContent className="p-6">
                <Smartphone className="text-accent text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Mobile First</h3>
                <p className="text-muted-foreground">Native mobile apps for iOS and Android with offline data storage and seamless synchronization.</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary hover:shadow-lg transition-shadow" data-testid="feature-ai">
              <CardContent className="p-6">
                <Brain className="text-accent text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">AI Analysis</h3>
                <p className="text-muted-foreground">Advanced machine learning algorithms for pattern recognition and predictive health analytics.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3" data-testid="footer-logo">
                <div className="relative">
                  <Heart className="text-accent text-2xl fill-current" />
                  <AlertTriangle className="text-yellow-500 text-xs absolute -top-1 -right-1" size={12} />
                </div>
                <span className="text-xl font-bold text-foreground">CardioEye</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Advanced heart monitoring with real-time ECG analysis and instant alerts for better cardiac care.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Products</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">ECG Monitoring</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Real-time Alerts</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Doctor Dashboard</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span>support@cardioeye.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Medical District, City</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 CardioEye. All rights reserved. Medical device - Professional use only.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PatientAuthModal 
        isOpen={showPatientModal} 
        onClose={() => setShowPatientModal(false)} 
      />
      <DoctorAuthModal 
        isOpen={showDoctorModal} 
        onClose={() => setShowDoctorModal(false)} 
      />
    </div>
  );
}
