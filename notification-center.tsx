import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: 'health_alert' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${(user as any).id}`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'health_alert') {
            const newNotification: Notification = {
              id: `alert-${data.data.alert.id}`,
              type: 'health_alert',
              title: 'Health Alert',
              message: data.data.alert.message,
              timestamp: new Date(data.data.alert.createdAt),
              read: false,
              severity: data.data.alert.severity,
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep last 20
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onopen = () => {
        console.log('WebSocket connected for notifications');
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      return () => {
        socket.close();
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [user]);

  // Simulate some initial notifications for demo
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: 'demo-1',
        type: 'system',
        title: 'Welcome to CardioEye',
        message: 'Your heart monitoring system is now active.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
      },
      {
        id: 'demo-2',
        type: 'reminder',
        title: 'Device Connection',
        message: 'Make sure your smartwatch is connected for continuous monitoring.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true,
      }
    ];
    
    setNotifications(initialNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'health_alert':
        return '🚨';
      case 'reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notification-trigger">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse bg-accent" 
              data-testid="notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end" data-testid="notification-popover">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
                data-testid="button-mark-all-read"
              >
                Mark all as read
              </Button>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto" data-testid="notifications-list">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground" data-testid="no-notifications">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-border hover:bg-secondary cursor-pointer transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    } ${notification.severity ? getSeverityColor(notification.severity) : ''}`}
                    onClick={() => markAsRead(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                          <p className="text-sm font-medium text-foreground truncate" data-testid={`notification-title-${notification.id}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`notification-message-${notification.id}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`notification-time-${notification.id}`}>
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="ml-2 h-6 w-6 p-0"
                        data-testid={`button-remove-${notification.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
