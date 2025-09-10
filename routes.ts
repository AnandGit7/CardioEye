import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDoctorSchema, insertPatientSchema, insertDoctorCodeSchema } from "@shared/schema";
import { z } from "zod";

// Twilio setup for WhatsApp/SMS notifications
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

// WebSocket client management
const wsClients = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get role-specific data
      let roleData = null;
      if (user.role === 'doctor') {
        roleData = await storage.getDoctorByUserId(userId);
      } else if (user.role === 'patient') {
        roleData = await storage.getPatientByUserId(userId);
      }

      res.json({ ...user, roleData });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Patient registration
  app.post('/api/auth/register/patient', async (req, res) => {
    try {
      const { email, mobileNumber, firstName, lastName, password, preferredContact } = req.body;
      
      // Store registration data in session for completion after auth
      req.session.pendingRegistration = {
        type: 'patient',
        email: preferredContact === 'email' ? email : null,
        mobileNumber: preferredContact === 'mobile' ? mobileNumber : null,
        firstName,
        lastName,
      };

      // Redirect to login to complete registration
      res.json({ success: true, redirectToLogin: true });
    } catch (error) {
      console.error("Error setting up patient registration:", error);
      res.status(500).json({ message: "Failed to register patient" });
    }
  });

  // Doctor registration
  app.post('/api/auth/register/doctor', async (req, res) => {
    try {
      const { email, firstName, lastName, password, doctorCode, medicalLicenseNumber, specialty, hospital } = req.body;
      
      // Verify doctor code
      const codeRecord = await storage.getDoctorCodeByCode(doctorCode);
      if (!codeRecord || codeRecord.status !== 'active' || new Date() > new Date(codeRecord.expiryDate)) {
        return res.status(400).json({ message: "Invalid or expired doctor code" });
      }

      // Store registration data in session for completion after auth
      req.session.pendingRegistration = {
        type: 'doctor',
        email,
        firstName,
        lastName,
        medicalLicenseNumber,
        specialty,
        hospital,
        doctorCode,
      };

      // Redirect to login to complete registration
      res.json({ success: true, redirectToLogin: true });
    } catch (error) {
      console.error("Error setting up doctor registration:", error);
      res.status(500).json({ message: "Failed to register doctor" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post('/api/admin/doctor-codes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const doctorCodeData = insertDoctorCodeSchema.parse({
        ...req.body,
        createdBy: user.id,
      });

      const doctorCode = await storage.createDoctorCode(doctorCodeData);
      res.json(doctorCode);
    } catch (error) {
      console.error("Error creating doctor code:", error);
      res.status(500).json({ message: "Failed to create doctor code" });
    }
  });

  app.get('/api/admin/doctor-codes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const codes = await storage.getActiveDoctorCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching doctor codes:", error);
      res.status(500).json({ message: "Failed to fetch doctor codes" });
    }
  });

  // Doctor routes
  app.get('/api/doctor/patients', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'doctor') {
        return res.status(403).json({ message: "Doctor access required" });
      }

      const doctor = await storage.getDoctorByUserId(user.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor record not found" });
      }

      const patients = await storage.getPatientsByDoctorId(doctor.id);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get('/api/doctor/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'doctor') {
        return res.status(403).json({ message: "Doctor access required" });
      }

      const alerts = await storage.getUnresolvedAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.patch('/api/doctor/alerts/:alertId/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'doctor') {
        return res.status(403).json({ message: "Doctor access required" });
      }

      const { alertId } = req.params;
      await storage.markAlertAsResolved(alertId, user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // Patient routes
  app.get('/api/patient/ecg-readings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'patient') {
        return res.status(403).json({ message: "Patient access required" });
      }

      const patient = await storage.getPatientByUserId(user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient record not found" });
      }

      const readings = await storage.getLatestEcgReadings(patient.id);
      res.json(readings);
    } catch (error) {
      console.error("Error fetching ECG readings:", error);
      res.status(500).json({ message: "Failed to fetch ECG readings" });
    }
  });

  app.get('/api/patient/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'patient') {
        return res.status(403).json({ message: "Patient access required" });
      }

      const patient = await storage.getPatientByUserId(user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient record not found" });
      }

      const alerts = await storage.getAlertsByPatientId(patient.id);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get('/api/patient/alert-settings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'patient') {
        return res.status(403).json({ message: "Patient access required" });
      }

      const patient = await storage.getPatientByUserId(user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient record not found" });
      }

      const settings = await storage.getAlertSettingsByPatientId(patient.id);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching alert settings:", error);
      res.status(500).json({ message: "Failed to fetch alert settings" });
    }
  });

  app.put('/api/patient/alert-settings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'patient') {
        return res.status(403).json({ message: "Patient access required" });
      }

      const patient = await storage.getPatientByUserId(user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient record not found" });
      }

      const settings = await storage.createOrUpdateAlertSettings({
        patientId: patient.id,
        ...req.body,
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating alert settings:", error);
      res.status(500).json({ message: "Failed to update alert settings" });
    }
  });

  // ECG data submission (for device integration)
  app.post('/api/ecg/submit', async (req, res) => {
    try {
      const { patientId, heartRate, rhythm, ecgData, deviceId } = req.body;
      
      // Validate patient exists
      const patient = await storage.getPatientWithUser(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Analyze ECG data and determine if alert needed
      const isNormal = heartRate >= 50 && heartRate <= 120 && rhythm === 'normal';
      
      // Store ECG reading
      const reading = await storage.createEcgReading({
        patientId,
        heartRate,
        rhythm: rhythm || 'normal',
        ecgData,
        isNormal,
        alertTriggered: !isNormal,
      });

      // Check if alert needs to be triggered
      if (!isNormal) {
        const alertSettings = await storage.getAlertSettingsByPatientId(patientId);
        
        let alertType = 'abnormal_reading';
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
        
        if (heartRate > (alertSettings?.highHeartRateThreshold || 120)) {
          alertType = 'high_heart_rate';
          severity = heartRate > 140 ? 'critical' : 'high';
        } else if (heartRate < (alertSettings?.lowHeartRateThreshold || 50)) {
          alertType = 'low_heart_rate';
          severity = heartRate < 40 ? 'critical' : 'high';
        } else if (rhythm !== 'normal') {
          alertType = 'irregular_rhythm';
          severity = 'high';
        }

        // Create health alert
        const alert = await storage.createHealthAlert({
          patientId,
          ecgReadingId: reading.id,
          alertType,
          severity,
          message: `${alertType.replace('_', ' ').toUpperCase()}: Heart rate ${heartRate} BPM, Rhythm: ${rhythm}`,
        });

        // Send notifications (WhatsApp/SMS) if enabled
        if (alertSettings?.enableWhatsAppAlerts || alertSettings?.enableSmsAlerts) {
          await sendNotifications(patient, alert, alertSettings);
        }

        // Broadcast to connected WebSocket clients
        broadcastAlert(alert, patient);
      }

      res.json({ success: true, reading });
    } catch (error) {
      console.error("Error submitting ECG data:", error);
      res.status(500).json({ message: "Failed to submit ECG data" });
    }
  });

  // WebSocket setup
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url!, 'http://localhost');
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      wsClients.set(userId, ws);
      console.log(`WebSocket connected for user: ${userId}`);
      
      ws.on('close', () => {
        wsClients.delete(userId);
        console.log(`WebSocket disconnected for user: ${userId}`);
      });
      
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        wsClients.delete(userId);
      });
    }
  });

  // Helper function to broadcast alerts
  function broadcastAlert(alert: any, patient: any) {
    const message = JSON.stringify({
      type: 'health_alert',
      data: {
        alert,
        patient: {
          id: patient.id,
          name: `${patient.user.firstName} ${patient.user.lastName}`,
        },
      },
    });

    // Send to patient
    const patientWs = wsClients.get(patient.userId);
    if (patientWs && patientWs.readyState === WebSocket.OPEN) {
      patientWs.send(message);
    }

    // Send to patient's doctor if assigned
    if (patient.doctorId) {
      // Note: Would need doctor's userId, this is simplified
      const doctorWs = wsClients.get(patient.doctorId);
      if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
        doctorWs.send(message);
      }
    }
  }

  // Helper function to send notifications
  async function sendNotifications(patient: any, alert: any, settings: any) {
    try {
      // This would integrate with Twilio for real SMS/WhatsApp
      console.log(`Sending notifications for alert ${alert.id} to patient ${patient.id}`);
      
      // Example Twilio integration (would require actual implementation)
      if (settings.enableWhatsAppAlerts && patient.user.mobileNumber) {
        // await twilioClient.messages.create({
        //   from: 'whatsapp:' + TWILIO_PHONE_NUMBER,
        //   to: 'whatsapp:' + patient.user.mobileNumber,
        //   body: alert.message
        // });
      }
      
      if (settings.enableSmsAlerts && patient.user.mobileNumber) {
        // await twilioClient.messages.create({
        //   from: TWILIO_PHONE_NUMBER,
        //   to: patient.user.mobileNumber,
        //   body: alert.message
        // });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  return httpServer;
}
