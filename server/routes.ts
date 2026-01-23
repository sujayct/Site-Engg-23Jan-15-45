import type { Express, Request, Response } from "express";
import { db } from "./db";
import { profiles, clients, sites, engineerAssignments, checkIns, dailyReports, leaveRequests, notifications, companyProfiles } from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function registerRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const [user] = await db.select().from(profiles).where(eq(profiles.email, email));
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.passwordHash) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      }

      req.session.userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          phone: user.phone,
          designation: user.designation,
          createdAt: user.createdAt,
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(profiles).where(eq(profiles.id, req.session.userId));
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        phone: user.phone,
        designation: user.designation,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role, phone } = req.body;
      
      if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existing = await db.select().from(profiles).where(eq(profiles.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const [newUser] = await db.insert(profiles).values({
        email,
        fullName,
        role,
        phone,
        passwordHash,
      }).returning();

      if (role === "client") {
        await db.insert(clients).values({
          name: fullName,
          contactPerson: fullName,
          contactEmail: email,
          userId: newUser.id,
        });
      }

      req.session.userId = newUser.id;

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.fullName,
          role: newUser.role,
          phone: newUser.phone,
          createdAt: newUser.createdAt,
        }
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/profiles", async (req: Request, res: Response) => {
    try {
      const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
      res.json(allProfiles.map(p => ({
        id: p.id,
        email: p.email,
        name: p.fullName,
        role: p.role,
        phone: p.phone,
        designation: p.designation,
        createdAt: p.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/engineers", async (req: Request, res: Response) => {
    try {
      const engineers = await db.select().from(profiles).where(eq(profiles.role, "engineer")).orderBy(desc(profiles.createdAt));
      res.json(engineers.map(e => ({
        id: e.id,
        name: e.fullName,
        email: e.email,
        phone: e.phone,
        designation: e.designation,
        status: "available",
        userId: e.id,
        createdAt: e.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      const allClients = await db.select().from(clients).orderBy(desc(clients.createdAt));
      res.json(allClients.map(c => ({
        id: c.id,
        name: c.name,
        contactPerson: c.contactPerson,
        email: c.contactEmail,
        phone: c.contactPhone,
        userId: c.userId,
        createdAt: c.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const { name, contactPerson, email, phone, address, userId } = req.body;
      
      const insertData: any = {
        name,
        contactPerson,
        contactEmail: email,
      };
      
      if (phone) insertData.contactPhone = phone;
      if (address) insertData.address = address;
      if (userId) insertData.userId = userId;
      
      const [newClient] = await db.insert(clients).values(insertData).returning();

      res.status(201).json({
        id: newClient.id,
        name: newClient.name,
        contactPerson: newClient.contactPerson,
        email: newClient.contactEmail,
        phone: newClient.contactPhone,
        userId: newClient.userId,
        createdAt: newClient.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sites", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.query;
      let query = db.select().from(sites);
      
      if (clientId) {
        query = query.where(eq(sites.clientId, clientId as string)) as any;
      }
      
      const allSites = await query.orderBy(desc(sites.createdAt));
      res.json(allSites.map(s => ({
        id: s.id,
        clientId: s.clientId,
        name: s.name,
        location: s.location,
        status: "active",
        createdAt: s.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sites", async (req: Request, res: Response) => {
    try {
      const { clientId, name, location, address } = req.body;
      
      const [newSite] = await db.insert(sites).values({
        clientId,
        name,
        location,
        address,
      }).returning();

      res.status(201).json({
        id: newSite.id,
        clientId: newSite.clientId,
        name: newSite.name,
        location: newSite.location,
        status: "active",
        createdAt: newSite.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assignments", async (req: Request, res: Response) => {
    try {
      const { engineerId, clientId } = req.query;
      
      let allAssignments = await db
        .select({
          assignment: engineerAssignments,
          engineer: profiles,
          client: clients,
          site: sites,
        })
        .from(engineerAssignments)
        .leftJoin(profiles, eq(engineerAssignments.engineerId, profiles.id))
        .leftJoin(clients, eq(engineerAssignments.clientId, clients.id))
        .leftJoin(sites, eq(engineerAssignments.siteId, sites.id))
        .orderBy(desc(engineerAssignments.createdAt));

      if (engineerId) {
        allAssignments = allAssignments.filter(a => a.assignment.engineerId === engineerId);
      }
      if (clientId) {
        allAssignments = allAssignments.filter(a => a.assignment.clientId === clientId);
      }

      res.json(allAssignments.map(a => ({
        id: a.assignment.id,
        engineerId: a.assignment.engineerId,
        engineerName: a.engineer?.fullName,
        engineerDesignation: a.engineer?.designation,
        clientId: a.assignment.clientId,
        clientName: a.client?.name,
        siteId: a.assignment.siteId,
        siteName: a.site?.name,
        assignedDate: a.assignment.assignedDate,
        status: a.assignment.isActive ? "active" : "inactive",
        createdAt: a.assignment.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/assignments", async (req: Request, res: Response) => {
    try {
      const { engineerId, clientId, siteId, assignedDate } = req.body;
      
      const [newAssignment] = await db.insert(engineerAssignments).values({
        engineerId,
        clientId,
        siteId,
        assignedDate: assignedDate || new Date().toISOString().split("T")[0],
        isActive: true,
      }).returning();

      res.status(201).json({
        id: newAssignment.id,
        engineerId: newAssignment.engineerId,
        clientId: newAssignment.clientId,
        siteId: newAssignment.siteId,
        assignedDate: newAssignment.assignedDate,
        status: newAssignment.isActive ? "active" : "inactive",
        createdAt: newAssignment.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/check-ins", async (req: Request, res: Response) => {
    try {
      const { engineerId } = req.query;
      
      let allCheckIns = await db
        .select({
          checkIn: checkIns,
          engineer: profiles,
        })
        .from(checkIns)
        .leftJoin(profiles, eq(checkIns.engineerId, profiles.id))
        .orderBy(desc(checkIns.date));

      if (engineerId) {
        allCheckIns = allCheckIns.filter(c => c.checkIn.engineerId === engineerId);
      }

      res.json(allCheckIns.map(c => ({
        id: c.checkIn.id,
        engineerId: c.checkIn.engineerId,
        engineerName: c.engineer?.fullName,
        checkInTime: c.checkIn.checkInTime,
        checkOutTime: c.checkIn.checkOutTime,
        latitude: c.checkIn.latitude,
        longitude: c.checkIn.longitude,
        locationName: c.checkIn.locationName,
        date: c.checkIn.date,
        createdAt: c.checkIn.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/check-ins", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { latitude, longitude, locationName } = req.body;
      const today = new Date().toISOString().split("T")[0];

      const existing = await db.select().from(checkIns)
        .where(and(eq(checkIns.engineerId, req.session.userId), eq(checkIns.date, today)));
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Already checked in today" });
      }

      const [newCheckIn] = await db.insert(checkIns).values({
        engineerId: req.session.userId,
        checkInTime: new Date(),
        latitude,
        longitude,
        locationName,
        date: today,
      }).returning();

      res.status(201).json({
        id: newCheckIn.id,
        engineerId: newCheckIn.engineerId,
        checkInTime: newCheckIn.checkInTime,
        checkOutTime: newCheckIn.checkOutTime,
        latitude: newCheckIn.latitude,
        longitude: newCheckIn.longitude,
        locationName: newCheckIn.locationName,
        date: newCheckIn.date,
        createdAt: newCheckIn.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/check-ins/:id/checkout", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [updated] = await db.update(checkIns)
        .set({ checkOutTime: new Date() })
        .where(eq(checkIns.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Check-in not found" });
      }

      res.json({
        id: updated.id,
        engineerId: updated.engineerId,
        checkInTime: updated.checkInTime,
        checkOutTime: updated.checkOutTime,
        date: updated.date,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports", async (req: Request, res: Response) => {
    try {
      const { engineerId, clientId } = req.query;
      
      let allReports = await db
        .select({
          report: dailyReports,
          engineer: profiles,
          client: clients,
        })
        .from(dailyReports)
        .leftJoin(profiles, eq(dailyReports.engineerId, profiles.id))
        .leftJoin(clients, eq(dailyReports.clientId, clients.id))
        .orderBy(desc(dailyReports.reportDate));

      if (engineerId) {
        allReports = allReports.filter(r => r.report.engineerId === engineerId);
      }
      if (clientId) {
        allReports = allReports.filter(r => r.report.clientId === clientId);
      }

      res.json(allReports.map(r => ({
        id: r.report.id,
        engineerId: r.report.engineerId,
        engineerName: r.engineer?.fullName,
        clientId: r.report.clientId,
        clientName: r.client?.name,
        siteId: r.report.siteId,
        date: r.report.reportDate,
        workDone: r.report.workDone,
        issues: r.report.issues,
        createdAt: r.report.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reports", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { clientId, siteId, workDone, issues } = req.body;
      const today = new Date().toISOString().split("T")[0];

      const [newReport] = await db.insert(dailyReports).values({
        engineerId: req.session.userId,
        clientId,
        siteId,
        reportDate: today,
        workDone,
        issues,
      }).returning();

      res.status(201).json({
        id: newReport.id,
        engineerId: newReport.engineerId,
        clientId: newReport.clientId,
        siteId: newReport.siteId,
        date: newReport.reportDate,
        workDone: newReport.workDone,
        issues: newReport.issues,
        createdAt: newReport.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/leaves", async (req: Request, res: Response) => {
    try {
      const { engineerId, all } = req.query;
      
      let allLeaves = await db
        .select({
          leave: leaveRequests,
          engineer: profiles,
        })
        .from(leaveRequests)
        .leftJoin(profiles, eq(leaveRequests.engineerId, profiles.id))
        .orderBy(desc(leaveRequests.createdAt));

      if (engineerId) {
        allLeaves = allLeaves.filter(l => l.leave.engineerId === engineerId);
      } else if (all !== "true" && req.session.userId) {
        allLeaves = allLeaves.filter(l => l.leave.engineerId === req.session.userId);
      }

      res.json(allLeaves.map(l => ({
        id: l.leave.id,
        engineerId: l.leave.engineerId,
        engineerName: l.engineer?.fullName,
        startDate: l.leave.startDate,
        endDate: l.leave.endDate,
        reason: l.leave.reason,
        status: l.leave.status,
        backupEngineerId: l.leave.backupEngineerId,
        approvedBy: l.leave.approvedBy,
        approvedAt: l.leave.approvedAt,
        createdAt: l.leave.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/leaves", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { startDate, endDate, reason } = req.body;

      const [newLeave] = await db.insert(leaveRequests).values({
        engineerId: req.session.userId,
        startDate,
        endDate,
        reason,
        status: "pending",
      }).returning();

      res.status(201).json({
        id: newLeave.id,
        engineerId: newLeave.engineerId,
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        reason: newLeave.reason,
        status: newLeave.status,
        createdAt: newLeave.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/leaves/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      const { status, backupEngineerId } = req.body;

      const updateData: any = {};
      if (status) {
        updateData.status = status;
        updateData.approvedBy = req.session.userId;
        updateData.approvedAt = new Date();
      }
      if (backupEngineerId) {
        updateData.backupEngineerId = backupEngineerId;
      }

      const [updated] = await db.update(leaveRequests)
        .set(updateData)
        .where(eq(leaveRequests.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      res.json({
        id: updated.id,
        engineerId: updated.engineerId,
        startDate: updated.startDate,
        endDate: updated.endDate,
        reason: updated.reason,
        status: updated.status,
        backupEngineerId: updated.backupEngineerId,
        approvedBy: updated.approvedBy,
        approvedAt: updated.approvedAt,
        createdAt: updated.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard", async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const [
        engineersResult,
        clientsResult,
        sitesResult,
        assignmentsResult,
        checkInsResult,
        reportsResult,
        leavesResult,
      ] = await Promise.all([
        db.select().from(profiles).where(eq(profiles.role, "engineer")),
        db.select().from(clients),
        db.select().from(sites),
        db.select().from(engineerAssignments).where(eq(engineerAssignments.isActive, true)),
        db.select().from(checkIns).where(eq(checkIns.date, today)),
        db.select().from(dailyReports).where(eq(dailyReports.reportDate, today)),
        db.select().from(leaveRequests).where(eq(leaveRequests.status, "pending")),
      ]);

      res.json({
        totalEngineers: engineersResult.length,
        totalClients: clientsResult.length,
        totalSites: sitesResult.length,
        activeAssignments: assignmentsResult.length,
        todayCheckIns: checkInsResult.length,
        todayReports: reportsResult.length,
        pendingLeaves: leavesResult.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/company-profile", async (req: Request, res: Response) => {
    try {
      const [profile] = await db.select().from(companyProfiles).limit(1);
      
      if (!profile) {
        return res.json(null);
      }

      res.json({
        id: profile.id,
        companyName: profile.companyName,
        brandName: profile.brandName,
        logoUrl: profile.logoUrl,
        primaryColor: profile.primaryColor,
        secondaryColor: profile.secondaryColor,
        supportEmail: profile.supportEmail,
        contactNumber: profile.contactNumber,
        address: profile.address,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/company-profile", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { companyName, brandName, logoUrl, primaryColor, secondaryColor, supportEmail, contactNumber, address } = req.body;
      
      const existing = await db.select().from(companyProfiles).limit(1);
      
      if (existing.length === 0) {
        const [newProfile] = await db.insert(companyProfiles).values({
          companyName,
          brandName,
          logoUrl,
          primaryColor,
          secondaryColor,
          supportEmail,
          contactNumber,
          address,
          updatedBy: req.session.userId,
        }).returning();

        return res.json(newProfile);
      }

      const [updated] = await db.update(companyProfiles)
        .set({
          companyName,
          brandName,
          logoUrl,
          primaryColor,
          secondaryColor,
          supportEmail,
          contactNumber,
          address,
          updatedAt: new Date(),
          updatedBy: req.session.userId,
        })
        .where(eq(companyProfiles.id, existing[0].id))
        .returning();

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, req.session.userId))
        .orderBy(desc(notifications.createdAt));

      res.json(userNotifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [updated] = await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
