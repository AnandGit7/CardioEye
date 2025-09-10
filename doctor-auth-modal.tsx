import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DoctorAuthModal({ isOpen, onClose }: DoctorAuthModalProps) {
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    doctorCode: '',
    medicalLicenseNumber: '',
    specialty: '',
    hospital: '',
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
      const response = await apiRequest('POST', '/api/auth/register/doctor', data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Doctor account created successfully! Redirecting to login...",
      });
      onClose();
      // Redirect to login immediately
      window.location.href = "/api/login";
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create doctor account. Please check your verification code.",
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="doctor-auth-modal">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <UserCheck className="text-accent text-3xl" />
          </div>
          <DialogTitle className="text-2xl font-bold" data-testid="modal-title">Doctor Access</DialogTitle>
          <p className="text-muted-foreground" data-testid="modal-description">
            Secure access for healthcare professionals
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  data-testid="input-email"
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
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
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

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  data-testid="input-signup-email"
                />
              </div>

              <div>
                <Label htmlFor="doctorCode">Doctor Verification Code</Label>
                <Input
                  id="doctorCode"
                  type="text"
                  placeholder="Enter unique doctor code"
                  value={signupData.doctorCode}
                  onChange={(e) => setSignupData({ ...signupData, doctorCode: e.target.value })}
                  required
                  data-testid="input-doctor-code"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact your administrator for the verification code
                </p>
              </div>

              <div>
                <Label htmlFor="medicalLicenseNumber">Medical License Number</Label>
                <Input
                  id="medicalLicenseNumber"
                  type="text"
                  placeholder="Enter license number"
                  value={signupData.medicalLicenseNumber}
                  onChange={(e) => setSignupData({ ...signupData, medicalLicenseNumber: e.target.value })}
                  required
                  data-testid="input-license-number"
                />
              </div>

              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select
                  value={signupData.specialty}
                  onValueChange={(value) => setSignupData({ ...signupData, specialty: value })}
                >
                  <SelectTrigger data-testid="select-specialty">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                    <SelectItem value="emergency_medicine">Emergency Medicine</SelectItem>
                    <SelectItem value="general_practice">General Practice</SelectItem>
                    <SelectItem value="family_medicine">Family Medicine</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hospital">Hospital/Clinic</Label>
                <Input
                  id="hospital"
                  type="text"
                  placeholder="Enter institution name"
                  value={signupData.hospital}
                  onChange={(e) => setSignupData({ ...signupData, hospital: e.target.value })}
                  data-testid="input-hospital"
                />
              </div>

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
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? 'Creating Account...' : 'Create Doctor Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
