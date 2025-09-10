import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, AlertTriangle, Users, Activity, Code, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [formData, setFormData] = useState({
    doctorName: '',
    institution: '',
    expiryDate: '',
  });

  // Fetch system stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/admin/stats'],
  });
  
  // Handle stats error
  if (statsError && isUnauthorizedError(statsError as Error)) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Fetch doctor codes
  const { data: doctorCodes, isLoading: codesLoading, error: codesError } = useQuery({
    queryKey: ['/api/admin/doctor-codes'],
  });
  
  // Handle codes error
  if (codesError && isUnauthorizedError(codesError as Error)) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Generate doctor code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest('POST', '/api/admin/doctor-codes', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Doctor verification code generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/doctor-codes'] });
      setShowGenerateForm(false);
      setFormData({ doctorName: '', institution: '', expiryDate: '' });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate doctor code",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateCodeMutation.mutate(formData);
  };

  const logout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3" data-testid="admin-logo">
              <div className="relative">
                <Heart className="text-accent text-2xl fill-current" />
                <AlertTriangle className="text-yellow-500 text-xs absolute -top-1 -right-1" size={12} />
              </div>
              <span className="text-2xl font-bold text-foreground">CardioEye Admin</span>
            </div>
            
            <Button onClick={logout} variant="outline" data-testid="button-logout">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="admin-title">Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground" data-testid="admin-description">
            Manage doctor verification codes and system administration
          </p>
        </div>

        {/* System Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-doctors">
            <CardContent className="p-6 text-center">
              <Users className="text-accent text-2xl mb-2 mx-auto" />
              <div className="text-3xl font-bold text-foreground" data-testid="stat-doctors-count">
                {statsLoading ? '...' : (stats as any)?.totalDoctors || 0}
              </div>
              <div className="text-sm text-muted-foreground">Registered Doctors</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-patients">
            <CardContent className="p-6 text-center">
              <Activity className="text-blue-600 text-2xl mb-2 mx-auto" />
              <div className="text-3xl font-bold text-blue-600" data-testid="stat-patients-count">
                {statsLoading ? '...' : (stats as any)?.activePatients || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Patients</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-codes">
            <CardContent className="p-6 text-center">
              <Code className="text-green-600 text-2xl mb-2 mx-auto" />
              <div className="text-3xl font-bold text-green-600" data-testid="stat-codes-count">
                {statsLoading ? '...' : (stats as any)?.activeDoctorCodes || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Codes</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-alerts">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="text-yellow-600 text-2xl mb-2 mx-auto" />
              <div className="text-3xl font-bold text-yellow-600" data-testid="stat-alerts-count">
                {statsLoading ? '...' : (stats as any)?.alertsToday || 0}
              </div>
              <div className="text-sm text-muted-foreground">Alerts Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Code Management */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Generate New Code */}
          <Card data-testid="generate-code-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generate Doctor Code</CardTitle>
              <Button
                onClick={() => setShowGenerateForm(!showGenerateForm)}
                variant={showGenerateForm ? "secondary" : "default"}
                size="sm"
                data-testid="button-toggle-form"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {showGenerateForm && (
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="generate-code-form">
                  <div>
                    <Label htmlFor="doctorName" className="text-sm font-medium text-foreground mb-2">
                      Doctor Name
                    </Label>
                    <Input
                      id="doctorName"
                      type="text"
                      placeholder="Enter doctor's full name"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      required
                      data-testid="input-doctor-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution" className="text-sm font-medium text-foreground mb-2">
                      Hospital/Clinic
                    </Label>
                    <Input
                      id="institution"
                      type="text"
                      placeholder="Enter institution name"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      required
                      data-testid="input-institution"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate" className="text-sm font-medium text-foreground mb-2">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      required
                      data-testid="input-expiry-date"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={generateCodeMutation.isPending}
                    data-testid="button-generate-code"
                  >
                    {generateCodeMutation.isPending ? 'Generating...' : 'Generate Code'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Active Codes List */}
          <Card data-testid="active-codes-card">
            <CardHeader>
              <CardTitle>Active Doctor Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="codes-list">
                {codesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  </div>
                ) : (doctorCodes as any)?.length > 0 ? (
                  (doctorCodes as any).map((code: any) => (
                    <div key={code.id} className="bg-background rounded p-3 border border-border" data-testid={`code-item-${code.id}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-foreground" data-testid={`doctor-name-${code.id}`}>
                            {code.doctorName}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`institution-${code.id}`}>
                            {code.institution}
                          </div>
                          <div className="text-xs text-accent font-mono" data-testid={`code-${code.id}`}>
                            {code.code}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={code.status === 'active' ? 'default' : code.status === 'used' ? 'secondary' : 'destructive'}
                            data-testid={`status-${code.id}`}
                          >
                            {code.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1" data-testid={`expiry-${code.id}`}>
                            Expires: {new Date(code.expiryDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="no-codes">
                    No active doctor codes found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
