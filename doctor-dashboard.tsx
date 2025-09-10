import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, AlertTriangle, Users, Activity, CheckCircle2, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import NotificationCenter from "@/components/notifications/notification-center";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ['/api/doctor/patients'],
  });
  
  // Handle patients error
  if (patientsError && isUnauthorizedError(patientsError as Error)) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['/api/doctor/alerts'],
  });
  
  // Handle alerts error
  if (alertsError && isUnauthorizedError(alertsError as Error)) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest('PATCH', `/api/doctor/alerts/${alertId}/resolve`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alert resolved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/alerts'] });
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
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    window.location.href = "/api/logout";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3" data-testid="doctor-logo">
              <div className="relative">
                <Heart className="text-accent text-2xl fill-current" />
                <AlertTriangle className="text-yellow-500 text-xs absolute -top-1 -right-1" size={12} />
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">CardioEye</span>
                <div className="text-sm text-muted-foreground">
                  Dr. {(user as any)?.firstName} {(user as any)?.lastName}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <Button onClick={logout} variant="outline" data-testid="button-logout">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="doctor-title">Doctor Dashboard</h1>
          <p className="text-xl text-muted-foreground" data-testid="doctor-description">
            Monitor your patients and manage critical heart alerts
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Patients Overview */}
          <Card data-testid="patients-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                My Patients ({(patients as any)?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="patients-list">
                {patientsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  </div>
                ) : (patients as any)?.length > 0 ? (
                  (patients as any).map((patient: any) => (
                    <div key={patient.id} className="bg-secondary rounded-lg p-4" data-testid={`patient-${patient.id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground" data-testid={`patient-name-${patient.id}`}>
                            {patient.user.firstName} {patient.user.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`patient-contact-${patient.id}`}>
                            {patient.user.email || patient.user.mobileNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={patient.deviceConnected ? "default" : "secondary"}
                            data-testid={`device-status-${patient.id}`}
                          >
                            {patient.deviceConnected ? "Connected" : "Offline"}
                          </Badge>
                          {patient.lastDeviceSync && (
                            <p className="text-xs text-muted-foreground mt-1" data-testid={`last-sync-${patient.id}`}>
                              Last sync: {new Date(patient.lastDeviceSync).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="no-patients">
                    No patients assigned yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card data-testid="alerts-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Critical Alerts ({(alerts as any)?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="alerts-list">
                {alertsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  </div>
                ) : (alerts as any)?.length > 0 ? (
                  (alerts as any).map((alert: any) => (
                    <div key={alert.id} className={`rounded-lg p-4 border-l-4 ${getSeverityColor(alert.severity)}`} data-testid={`alert-${alert.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold" data-testid={`alert-type-${alert.id}`}>
                              {alert.alertType.replace('_', ' ').toUpperCase()}
                            </span>
                            <Badge variant="outline" data-testid={`alert-severity-${alert.id}`}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1" data-testid={`patient-info-${alert.id}`}>
                            Patient: {alert.patient.user.firstName} {alert.patient.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`alert-message-${alert.id}`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2" data-testid={`alert-time-${alert.id}`}>
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <Button
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                            size="sm"
                            variant="outline"
                            data-testid={`button-resolve-${alert.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="no-alerts">
                    No critical alerts at this time
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card data-testid="stat-total-patients">
            <CardContent className="p-6 text-center">
              <Users className="text-accent text-2xl mb-2 mx-auto" />
              <div className="text-3xl font-bold text-foreground" data-testid="total-patients-count">
                {(patients as any)?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Patients</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-devices">
            <CardContent className="p-6 text-center">
              <Activity className="text-green-600 text-2xl mb-2 mx-auto" />
              <div className="text-3xl font-bold text-green-600" data-testid="active-devices-count">
                {(patients as any)?.filter((p: any) => p.deviceConnected).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Devices</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending-alerts">
            <CardContent className="p-6 text-center">
              <Clock className="text-orange-600 text-2xl mb-2 mx-auto" />
              <div className="text-3xl font-bold text-orange-600" data-testid="pending-alerts-count">
                {(alerts as any)?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pending Alerts</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
