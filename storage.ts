import {
  users,
  doctors,
  patients,
  doctorCodes,
  ecgReadings,
  healthAlerts,
  notifications,
  alertSettings,
  type User,
  type UpsertUser,
  type Doctor,
  type Patient,
  type DoctorCode,
  type EcgReading,
  type HealthAlert,
  type InsertDoctor,
  type InsertPatient,
  type InsertDoctorCode,
  type InsertEcgReading,
  type InsertHealthAlert,
  type InsertAlertSettings,
  type AlertSettings,
  type Notification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Doctor operations
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getDoctorByUserId(userId: string): Promise<Doctor | undefined>;
  getDoctorWithUser(doctorId: string): Promise<(Doctor & { user: User }) | undefined>;
  getAllDoctors(): Promise<(Doctor & { user: User })[]>;
  
  // Patient operations
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatientByUserId(userId: string): Promise<Patient | undefined>;
  getPatientWithUser(patientId: string): Promise<(Patient & { user: User }) | undefined>;
  getPatientsByDoctorId(doctorId: string): Promise<(Patient & { user: User })[]>;
  getAllPatients(): Promise<(Patient & { user: User })[]>;
  
  // Doctor code operations
  createDoctorCode(doctorCode: InsertDoctorCode): Promise<DoctorCode>;
  getDoctorCodeByCode(code: string): Promise<DoctorCode | undefined>;
  markDoctorCodeAsUsed(code: string, usedBy: string): Promise<void>;
  getActiveDoctorCodes(): Promise<DoctorCode[]>;
  
  // ECG operations
  createEcgReading(reading: InsertEcgReading): Promise<EcgReading>;
  getLatestEcgReadings(patientId: string, limit?: number): Promise<EcgReading[]>;
  getEcgReadingById(id: string): Promise<EcgReading | undefined>;
  
  // Health alert operations
  createHealthAlert(alert: InsertHealthAlert): Promise<HealthAlert>;
  getAlertsByPatientId(patientId: string): Promise<HealthAlert[]>;
  getUnresolvedAlerts(): Promise<(HealthAlert & { patient: Patient & { user: User } })[]>;
  markAlertAsResolved(alertId: string, resolvedBy: string): Promise<void>;
  
  // Alert settings
  createOrUpdateAlertSettings(settings: InsertAlertSettings): Promise<AlertSettings>;
  getAlertSettingsByPatientId(patientId: string): Promise<AlertSettings | undefined>;
  
  // Notification operations
  getRecentNotifications(limit?: number): Promise<Notification[]>;
  
  // Statistics
  getSystemStats(): Promise<{
    totalDoctors: number;
    activePatients: number;
    activeDoctorCodes: number;
    alertsToday: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Doctor operations
  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db
      .insert(doctors)
      .values(doctor)
      .returning();
    return newDoctor;
  }

  async getDoctorByUserId(userId: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
    return doctor;
  }

  async getDoctorWithUser(doctorId: string): Promise<(Doctor & { user: User }) | undefined> {
    const [result] = await db
      .select()
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.id, doctorId));
    
    if (!result) return undefined;
    
    return {
      ...result.doctors,
      user: result.users,
    };
  }

  async getAllDoctors(): Promise<(Doctor & { user: User })[]> {
    const results = await db
      .select()
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .orderBy(desc(doctors.createdAt));
    
    return results.map(result => ({
      ...result.doctors,
      user: result.users,
    }));
  }

  // Patient operations
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db
      .insert(patients)
      .values(patient)
      .returning();
    return newPatient;
  }

  async getPatientByUserId(userId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient;
  }

  async getPatientWithUser(patientId: string): Promise<(Patient & { user: User }) | undefined> {
    const [result] = await db
      .select()
      .from(patients)
      .innerJoin(users, eq(patients.userId, users.id))
      .where(eq(patients.id, patientId));
    
    if (!result) return undefined;
    
    return {
      ...result.patients,
      user: result.users,
    };
  }

  async getPatientsByDoctorId(doctorId: string): Promise<(Patient & { user: User })[]> {
    const results = await db
      .select()
      .from(patients)
      .innerJoin(users, eq(patients.userId, users.id))
      .where(eq(patients.doctorId, doctorId))
      .orderBy(desc(patients.createdAt));
    
    return results.map(result => ({
      ...result.patients,
      user: result.users,
    }));
  }

  async getAllPatients(): Promise<(Patient & { user: User })[]> {
    const results = await db
      .select()
      .from(patients)
      .innerJoin(users, eq(patients.userId, users.id))
      .orderBy(desc(patients.createdAt));
    
    return results.map(result => ({
      ...result.patients,
      user: result.users,
    }));
  }

  // Doctor code operations
  async createDoctorCode(doctorCode: InsertDoctorCode): Promise<DoctorCode> {
    const code = `CARD-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const [newCode] = await db
      .insert(doctorCodes)
      .values({ ...doctorCode, code })
      .returning();
    return newCode;
  }

  async getDoctorCodeByCode(code: string): Promise<DoctorCode | undefined> {
    const [doctorCode] = await db.select().from(doctorCodes).where(eq(doctorCodes.code, code));
    return doctorCode;
  }

  async markDoctorCodeAsUsed(code: string, usedBy: string): Promise<void> {
    await db
      .update(doctorCodes)
      .set({
        status: 'used',
        usedAt: new Date(),
        usedBy,
      })
      .where(eq(doctorCodes.code, code));
  }

  async getActiveDoctorCodes(): Promise<DoctorCode[]> {
    return await db
      .select()
      .from(doctorCodes)
      .where(eq(doctorCodes.status, 'active'))
      .orderBy(desc(doctorCodes.createdAt));
  }

  // ECG operations
  async createEcgReading(reading: InsertEcgReading): Promise<EcgReading> {
    const [newReading] = await db
      .insert(ecgReadings)
      .values(reading)
      .returning();
    return newReading;
  }

  async getLatestEcgReadings(patientId: string, limit = 50): Promise<EcgReading[]> {
    return await db
      .select()
      .from(ecgReadings)
      .where(eq(ecgReadings.patientId, patientId))
      .orderBy(desc(ecgReadings.timestamp))
      .limit(limit);
  }

  async getEcgReadingById(id: string): Promise<EcgReading | undefined> {
    const [reading] = await db.select().from(ecgReadings).where(eq(ecgReadings.id, id));
    return reading;
  }

  // Health alert operations
  async createHealthAlert(alert: InsertHealthAlert): Promise<HealthAlert> {
    const [newAlert] = await db
      .insert(healthAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getAlertsByPatientId(patientId: string): Promise<HealthAlert[]> {
    return await db
      .select()
      .from(healthAlerts)
      .where(eq(healthAlerts.patientId, patientId))
      .orderBy(desc(healthAlerts.createdAt));
  }

  async getUnresolvedAlerts(): Promise<(HealthAlert & { patient: Patient & { user: User } })[]> {
    const results = await db
      .select()
      .from(healthAlerts)
      .innerJoin(patients, eq(healthAlerts.patientId, patients.id))
      .innerJoin(users, eq(patients.userId, users.id))
      .where(eq(healthAlerts.isResolved, false))
      .orderBy(desc(healthAlerts.createdAt));
    
    return results.map(result => ({
      ...result.health_alerts,
      patient: {
        ...result.patients,
        user: result.users,
      },
    }));
  }

  async markAlertAsResolved(alertId: string, resolvedBy: string): Promise<void> {
    await db
      .update(healthAlerts)
      .set({
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(healthAlerts.id, alertId));
  }

  // Alert settings
  async createOrUpdateAlertSettings(settings: InsertAlertSettings): Promise<AlertSettings> {
    const [result] = await db
      .insert(alertSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: alertSettings.patientId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getAlertSettingsByPatientId(patientId: string): Promise<AlertSettings | undefined> {
    const [settings] = await db
      .select()
      .from(alertSettings)
      .where(eq(alertSettings.patientId, patientId));
    return settings;
  }

  // Notification operations
  async getRecentNotifications(limit = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  // Statistics
  async getSystemStats(): Promise<{
    totalDoctors: number;
    activePatients: number;
    activeDoctorCodes: number;
    alertsToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [doctorCount] = await db.select({ count: count() }).from(doctors);
    const [patientCount] = await db.select({ count: count() }).from(patients).where(eq(patients.deviceConnected, true));
    const [activeCodesCount] = await db.select({ count: count() }).from(doctorCodes).where(eq(doctorCodes.status, 'active'));
    const [alertsCount] = await db.select({ count: count() }).from(healthAlerts).where(and(
      eq(healthAlerts.isResolved, false),
      // @ts-ignore
      sql`${healthAlerts.createdAt} >= ${today}`
    ));

    return {
      totalDoctors: doctorCount.count,
      activePatients: patientCount.count,
      activeDoctorCodes: activeCodesCount.count,
      alertsToday: alertsCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
