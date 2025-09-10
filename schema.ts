import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'admin']);
export const notificationTypeEnum = pgEnum('notification_type', ['whatsapp', 'sms', 'email', 'push']);
export const alertSeverityEnum = pgEnum('alert_severity', ['low', 'medium', 'high', 'critical']);
export const doctorCodeStatusEnum = pgEnum('doctor_code_status', ['active', 'used', 'expired']);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('patient'),
  mobileNumber: varchar("mobile_number"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctor-specific information
export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  medicalLicenseNumber: varchar("medical_license_number").notNull(),
  specialty: varchar("specialty").notNull(),
  hospital: varchar("hospital"),
  isVerified: boolean("is_verified").default(false),
  doctorCodeUsed: varchar("doctor_code_used").references(() => doctorCodes.code),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctor verification codes
export const doctorCodes = pgTable("doctor_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  doctorName: varchar("doctor_name").notNull(),
  institution: varchar("institution").notNull(),
  status: doctorCodeStatusEnum("status").default('active'),
  expiryDate: timestamp("expiry_date").notNull(),
  usedAt: timestamp("used_at"),
  usedBy: varchar("used_by").references(() => users.id, { onUpdate: 'cascade' }),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onUpdate: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patient-specific information
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  dateOfBirth: timestamp("date_of_birth"),
  emergencyContact: varchar("emergency_contact"),
  emergencyContactName: varchar("emergency_contact_name"),
  doctorId: varchar("doctor_id").references(() => doctors.id),
  deviceConnected: boolean("device_connected").default(false),
  lastDeviceSync: timestamp("last_device_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ECG readings
export const ecgReadings = pgTable("ecg_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  heartRate: integer("heart_rate").notNull(),
  rhythm: varchar("rhythm").default('normal'),
  ecgData: jsonb("ecg_data").notNull(), // Raw ECG waveform data
  timestamp: timestamp("timestamp").defaultNow(),
  isNormal: boolean("is_normal").default(true),
  alertTriggered: boolean("alert_triggered").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health alerts
export const healthAlerts = pgTable("health_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: 'cascade' }),
  ecgReadingId: varchar("ecg_reading_id").references(() => ecgReadings.id),
  alertType: varchar("alert_type").notNull(), // 'high_heart_rate', 'low_heart_rate', 'irregular_rhythm', etc.
  severity: alertSeverityEnum("severity").notNull(),
  message: text("message").notNull(),
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id, { onUpdate: 'cascade' }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications sent
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull().references(() => healthAlerts.id, { onDelete: 'cascade' }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onUpdate: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  destination: varchar("destination").notNull(), // phone number, email, etc.
  message: text("message").notNull(),
  status: varchar("status").default('pending'), // 'pending', 'sent', 'delivered', 'failed'
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alert settings for patients
export const alertSettings = pgTable("alert_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().unique().references(() => patients.id, { onDelete: 'cascade' }),
  highHeartRateThreshold: integer("high_heart_rate_threshold").default(120),
  lowHeartRateThreshold: integer("low_heart_rate_threshold").default(50),
  enableIrregularRhythmAlerts: boolean("enable_irregular_rhythm_alerts").default(true),
  enableWhatsAppAlerts: boolean("enable_whatsapp_alerts").default(true),
  enableSmsAlerts: boolean("enable_sms_alerts").default(true),
  enableEmailAlerts: boolean("enable_email_alerts").default(true),
  enablePushNotifications: boolean("enable_push_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  doctor: one(doctors, { fields: [users.id], references: [doctors.userId] }),
  patient: one(patients, { fields: [users.id], references: [patients.userId] }),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  patients: many(patients),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, { fields: [patients.userId], references: [users.id] }),
  doctor: one(doctors, { fields: [patients.doctorId], references: [doctors.id] }),
  ecgReadings: many(ecgReadings),
  healthAlerts: many(healthAlerts),
  alertSettings: one(alertSettings, { fields: [patients.id], references: [alertSettings.patientId] }),
}));

export const ecgReadingsRelations = relations(ecgReadings, ({ one, many }) => ({
  patient: one(patients, { fields: [ecgReadings.patientId], references: [patients.id] }),
  healthAlerts: many(healthAlerts),
}));

export const healthAlertsRelations = relations(healthAlerts, ({ one, many }) => ({
  patient: one(patients, { fields: [healthAlerts.patientId], references: [patients.id] }),
  ecgReading: one(ecgReadings, { fields: [healthAlerts.ecgReadingId], references: [ecgReadings.id] }),
  notifications: many(notifications),
}));

export const doctorCodesRelations = relations(doctorCodes, ({ one }) => ({
  createdByUser: one(users, { fields: [doctorCodes.createdBy], references: [users.id] }),
  usedByUser: one(users, { fields: [doctorCodes.usedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorCodeSchema = createInsertSchema(doctorCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true,
  usedBy: true,
});

export const insertEcgReadingSchema = createInsertSchema(ecgReadings).omit({
  id: true,
  createdAt: true,
});

export const insertHealthAlertSchema = createInsertSchema(healthAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSettingsSchema = createInsertSchema(alertSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertDoctorCode = z.infer<typeof insertDoctorCodeSchema>;
export type DoctorCode = typeof doctorCodes.$inferSelect;
export type InsertEcgReading = z.infer<typeof insertEcgReadingSchema>;
export type EcgReading = typeof ecgReadings.$inferSelect;
export type InsertHealthAlert = z.infer<typeof insertHealthAlertSchema>;
export type HealthAlert = typeof healthAlerts.$inferSelect;
export type InsertAlertSettings = z.infer<typeof insertAlertSettingsSchema>;
export type AlertSettings = typeof alertSettings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
