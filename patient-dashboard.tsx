import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, AlertTriangle, Activity, Settings, Wifi, WifiOff } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import RealTimeChart from "@/components/ecg/real-time-chart";
import NotificationCenter from "@/components/notifications/notification-center";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch ECG readings
  const { data: ecgReadings, isLoading: ecgLoading, error: ecgError } = useQuery({
    queryKey: ['/api/patient/ecg-readings'],
  });
  
  // Handle ECG error
  if (ecgError && isUnauthorizedError(ecgError as Error)) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['/api/patient/alerts'],
  });
  
  // Handle alerts error
  if (alertsError && isUnauthorizedError(alertsError as Error)) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Fetch alert settings
  const { data: alertSettings, error: settingsError } = useQuery({
    queryKey: ['/api/patient/alert-settings'],
  });
  
  // Handle settings error
  if (settingsError && isUnauthorizedError(settingsError as Error)) {
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const logout = () => {
    window.location.href = "/api/logout";
  };

  const latestReading = (ecgReadings as any)?.[0];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3" data-testid="patient-logo">
              <div className="relative">
                <Heart className="text-accent text-2xl fill-current" />
                <AlertTriangle className="text-yellow-500 text-xs absolute -top-1 -right-1" size={12} />
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">CardioEye</span>
                <div className="text-sm text-muted-foreground">
                  {(user as any)?.firstName} {(user as any)?.lastName}
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
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="patient-title">Heart Monitoring Dashboard</h1>
          <p className="text-xl text-muted-foreground" data-testid="patient-description">
            Monitor your heart health in real-time
          </p>
        </div>

        {/* Device Status */}
        <Card className="mb-8" data-testid="device-status-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {(user as any)?.roleData?.deviceConnected ? (
                    <Wifi className="text-green-600" size={20} />
                  ) : (
                    <WifiOff className="text-red-600" size={20} />
                  )}
                  <span className="font-semibold text-foreground" data-testid="device-status">
                    Device {(user as any)?.roleData?.deviceConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
                {(user as any)?.roleData?.lastDeviceSync && (
                  <span className="text-sm text-muted-foreground" data-testid="last-sync">
                    Last sync: {new Date((user as any).roleData.lastDeviceSync).toLocaleString()}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" data-testid="button-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Real-time ECG */}
          <Card data-testid="ecg-chart-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Real-time ECG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <RealTimeChart />
              </div>
              
              {/* Current Vital Signs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center" data-testid="current-heart-rate">
                  <div className="text-3xl font-bold text-accent">
                    {latestReading?.heartRate || '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">BPM</div>
                </div>
                <div className="text-center" data-testid="current-rhythm">
                  <div className="text-2xl font-bold text-green-600">
                    {latestReading?.rhythm || 'Normal'}
                  </div>
                  <div className="text-sm text-muted-foreground">Rhythm</div>
                </div>
                <div className="text-center" data-testid="current-status">
                  <div className="text-2xl font-bold text-blue-600">
                    {latestReading ? (latestReading.isNormal ? 'Normal' : 'Alert') : 'No Data'}
                  </div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card data-testid="alerts-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Recent Alerts ({(alerts as any)?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="alerts-list">
                {alertsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  </div>
                ) : (alerts as any)?.length > 0 ? (
                  (alerts as any).slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className="bg-secondary rounded-lg p-4" data-testid={`alert-${alert.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-accent" />
                            <span className="font-semibold text-foreground" data-testid={`alert-type-${alert.id}`}>
                              {alert.alertType.replace('_', ' ').toUpperCase()}
                            </span>
                            <Badge variant={getSeverityColor(alert.severity)} data-testid={`alert-severity-${alert.id}`}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`alert-message-${alert.id}`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2" data-testid={`alert-time-${alert.id}`}>
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={alert.isResolved ? "default" : "secondary"} data-testid={`alert-status-${alert.id}`}>
                          {alert.isResolved ? "Resolved" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="no-alerts">
                    No alerts - your heart is doing great! 💚
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Settings Overview */}
        <Card className="mt-8" data-testid="settings-overview-card">
          <CardHeader>
            <CardTitle>Alert Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Thresholds</h4>
                <div className="space-y-2">
                  <div className="flex justify-between" data-testid="high-threshold">
                    <span className="text-sm text-muted-foreground">High Heart Rate:</span>
                    <span className="font-medium">{(alertSettings as any)?.highHeartRateThreshold || 120} BPM</span>
                  </div>
                  <div className="flex justify-between" data-testid="low-threshold">
                    <span className="text-sm text-muted-foreground">Low Heart Rate:</span>
                    <span className="font-medium">{(alertSettings as any)?.lowHeartRateThreshold || 50} BPM</span>
                  </div>
                  <div className="flex justify-between" data-testid="rhythm-alerts">
                    <span className="text-sm text-muted-foreground">Irregular Rhythm:</span>
                    <span className="font-medium">
                      {(alertSettings as any)?.enableIrregularRhythmAlerts ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Notifications</h4>
                <div className="space-y-2">
                  <div className="flex justify-between" data-testid="whatsapp-setting">
                    <span className="text-sm text-muted-foreground">WhatsApp:</span>
                    <Badge variant={(alertSettings as any)?.enableWhatsAppAlerts ? "default" : "secondary"}>
                      {(alertSettings as any)?.enableWhatsAppAlerts ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex justify-between" data-testid="sms-setting">
                    <span className="text-sm text-muted-foreground">SMS:</span>
                    <Badge variant={(alertSettings as any)?.enableSmsAlerts ? "default" : "secondary"}>
                      {(alertSettings as any)?.enableSmsAlerts ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex justify-between" data-testid="email-setting">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <Badge variant={(alertSettings as any)?.enableEmailAlerts ? "default" : "secondary"}>
                      {(alertSettings as any)?.enableEmailAlerts ? 'On' : 'Off'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
