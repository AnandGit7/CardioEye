import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, AlertTriangle, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientAuthModal({ isOpen, onClose }: PatientAuthModalProps) {
  const { toast } = useToast();
  const [preferredContact, setPreferredContact] = useState<'email' | 'mobile'>('email');
  const [loginData, setLoginData] = useState({
    emailOrMobile: '',
    password: '',
  });
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      // This would typically go through the auth system
      window.location.href = "/api/login";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: typeof signupData) => {
      const response = await apiRequest('POST', '/api/auth/register/patient', {
        ...data,
        preferredContact,
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Account created successfully! Redirecting to login...",
      });
      onClose();
      // Redirect to login immediately
      window.location.href = "/api/login";
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate(signupData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="patient-auth-modal">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Heart className="text-accent text-3xl fill-current" />
              <AlertTriangle className="text-yellow-500 text-sm absolute -top-1 -right-1" size={12} />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold" data-testid="modal-title">Patient Access</DialogTitle>
          <p className="text-muted-foreground" data-testid="modal-description">
            Join CardioEye to monitor your heart health
          </p>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2" data-testid="auth-tabs">
            <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
              <div>
                <Label htmlFor="emailOrMobile">Email or Mobile</Label>
                <Input
                  id="emailOrMobile"
                  type="text"
                  placeholder="Enter email or mobile number"
                  value={loginData.emailOrMobile}
                  onChange={(e) => setLoginData({ ...loginData, emailOrMobile: e.target.value })}
                  required
                  data-testid="input-email-mobile"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>
              <div className="text-center">
                <Button variant="link" className="text-accent text-sm" data-testid="link-forgot-password">
                  Forgot Password?
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4" data-testid="signup-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                    required
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              {/* Contact Method Selection */}
              <div>
                <Label>Preferred Contact</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Card
                    className={`cursor-pointer transition-colors ${
                      preferredContact === 'email' ? 'border-primary bg-primary/10' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setPreferredContact('email')}
                    data-testid="contact-email"
                  >
                    <CardContent className="p-3 text-center">
                      <Mail className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs">Email</div>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-colors ${
                      preferredContact === 'mobile' ? 'border-primary bg-primary/10' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setPreferredContact('mobile')}
                    data-testid="contact-mobile"
                  >
                    <CardContent className="p-3 text-center">
                      <Smartphone className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs">Mobile</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {preferredContact === 'email' ? (
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={signupData.mobileNumber}
                    onChange={(e) => setSignupData({ ...signupData, mobileNumber: e.target.value })}
                    required
                    data-testid="input-mobile"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="signupPassword">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="Create password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  data-testid="input-signup-password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  required
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
