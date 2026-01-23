import { pgTable, text, uuid, boolean, timestamp, date, integer, numeric } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().$type<"admin" | "engineer" | "hr" | "client">(),
  phone: text("phone"),
  designation: text("designation"),
  photoUrl: text("photo_url"),
  mobileNumber: text("mobile_number"),
  alternateNumber: text("alternate_number"),
  personalEmail: text("personal_email"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  pincode: text("pincode"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  yearsOfExperience: integer("years_of_experience"),
  skills: text("skills"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  reportingManagerId: uuid("reporting_manager_id"),
  profilePhotoUrl: text("profile_photo_url"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  address: text("address"),
  userId: uuid("user_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const engineerAssignments = pgTable("engineer_assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  engineerId: uuid("engineer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  assignedDate: date("assigned_date").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  engineerId: uuid("engineer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  checkInTime: timestamp("check_in_time").notNull(),
  checkOutTime: timestamp("check_out_time"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  locationName: text("location_name"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyReports = pgTable("daily_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  engineerId: uuid("engineer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  reportDate: date("report_date").notNull(),
  workDone: text("work_done").notNull(),
  issues: text("issues"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  engineerId: uuid("engineer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending").$type<"pending" | "approved" | "rejected">(),
  backupEngineerId: uuid("backup_engineer_id").references(() => profiles.id),
  approvedBy: uuid("approved_by").references(() => profiles.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<"info" | "warning" | "success" | "error">(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").default("sent"),
});

export const companyProfiles = pgTable("company_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  brandName: text("brand_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563eb"),
  secondaryColor: text("secondary_color").default("#1e40af"),
  supportEmail: text("support_email").notNull(),
  contactNumber: text("contact_number").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: uuid("updated_by").references(() => profiles.id),
});

export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  clientRecord: one(clients, {
    fields: [profiles.id],
    references: [clients.userId],
  }),
  engineerAssignments: many(engineerAssignments),
  checkIns: many(checkIns),
  dailyReports: many(dailyReports),
  leaveRequests: many(leaveRequests),
  notifications: many(notifications),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(profiles, {
    fields: [clients.userId],
    references: [profiles.id],
  }),
  sites: many(sites),
  assignments: many(engineerAssignments),
  dailyReports: many(dailyReports),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  client: one(clients, {
    fields: [sites.clientId],
    references: [clients.id],
  }),
  assignments: many(engineerAssignments),
}));

export const engineerAssignmentsRelations = relations(engineerAssignments, ({ one }) => ({
  engineer: one(profiles, {
    fields: [engineerAssignments.engineerId],
    references: [profiles.id],
  }),
  client: one(clients, {
    fields: [engineerAssignments.clientId],
    references: [clients.id],
  }),
  site: one(sites, {
    fields: [engineerAssignments.siteId],
    references: [sites.id],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;
export type EngineerAssignment = typeof engineerAssignments.$inferSelect;
export type InsertEngineerAssignment = typeof engineerAssignments.$inferInsert;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;
export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
