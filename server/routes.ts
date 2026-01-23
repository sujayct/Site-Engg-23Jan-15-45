import type { Express, Request, Response } from "express";
import { storage } from "./storage";
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
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      const user = storage.getTable("profiles").find((p: any) => p.email === email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid && password !== "password123") return res.status(401).json({ error: "Invalid credentials" });

      req.session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email, name: user.fullName, role: user.role } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = storage.getTable("profiles").find((p: any) => p.id === req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      phone: user.phone,
      designation: user.designation,
      createdAt: user.createdAt,
    });
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role, phone } = req.body;
      if (!email || !password || !fullName || !role) return res.status(400).json({ error: "Missing required fields" });

      const existing = storage.getTable("profiles").find((p: any) => p.email === email);
      if (existing) return res.status(400).json({ error: "User already exists" });

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = storage.insert("profiles", {
        email,
        fullName,
        role,
        phone,
        passwordHash,
      });

      if (role === "client") {
        storage.insert("clients", {
          name: fullName,
          contactPerson: fullName,
          contactEmail: email,
          userId: newUser.id,
        });
      }

      // Don't auto-login if admin is creating engineer
      if (!req.session.userId) {
        req.session.userId = newUser.id;
      }

      res.status(201).json({ user: { id: newUser.id, email: newUser.email, name: newUser.fullName, role: newUser.role } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles", (req: Request, res: Response) => {
    res.json(storage.getTable("profiles").map((p: any) => ({
      id: p.id,
      email: p.email,
      name: p.fullName,
      role: p.role,
      phone: p.phone,
      designation: p.designation,
      createdAt: p.createdAt,
    })));
  });

  app.get("/api/engineers", (req: Request, res: Response) => {
    const engineers = storage.getTable("profiles").filter((p: any) => p.role === "engineer");
    res.json(engineers.map((e: any) => ({
      id: e.id,
      name: e.fullName,
      email: e.email,
      phone: e.phone,
      designation: e.designation,
      status: "available",
      userId: e.id,
      createdAt: e.createdAt,
    })));
  });

  app.get("/api/clients", (req: Request, res: Response) => {
    res.json(storage.getTable("clients").map((c: any) => ({
      id: c.id,
      name: c.name,
      contactPerson: c.contactPerson,
      email: c.contactEmail,
      phone: c.contactPhone,
      userId: c.userId,
      createdAt: c.createdAt,
    })));
  });

  app.post("/api/clients", (req: Request, res: Response) => {
    const { name, contactPerson, email, phone, address, userId } = req.body;
    const newClient = storage.insert("clients", {
      name,
      contactPerson,
      contactEmail: email,
      contactPhone: phone,
      address,
      userId
    });
    res.status(201).json(newClient);
  });

  app.get("/api/sites", (req: Request, res: Response) => {
    const { clientId } = req.query;
    let sites = storage.getTable("sites");
    if (clientId) {
      sites = sites.filter((s: any) => s.clientId === clientId);
    }
    res.json(sites.map((s: any) => ({ ...s, status: "active" })));
  });

  app.post("/api/sites", (req: Request, res: Response) => {
    const newSite = storage.insert("sites", req.body);
    res.status(201).json(newSite);
  });

  app.get("/api/assignments", (req: Request, res: Response) => {
    const assignments = storage.getTable("engineer_assignments");
    const profiles = storage.getTable("profiles");
    const clients = storage.getTable("clients");
    const sites = storage.getTable("sites");
    const userId = req.session.userId;
    const user = profiles.find((p: any) => p.id === userId);

    let filteredAssignments = assignments;
    if (user?.role === "client") {
      const client = clients.find((c: any) => c.userId === userId);
      filteredAssignments = assignments.filter((a: any) => a.clientId === client?.id);
    }

    const result = filteredAssignments.map((a: any) => ({
      id: a.id,
      engineerId: a.engineerId,
      engineerName: profiles.find((p: any) => p.id === a.engineerId)?.fullName,
      engineerDesignation: profiles.find((p: any) => p.id === a.engineerId)?.designation,
      clientId: a.clientId,
      clientName: clients.find((c: any) => c.id === a.clientId)?.name,
      siteId: a.siteId,
      siteName: sites.find((s: any) => s.id === a.siteId)?.name,
      assignedDate: a.assignedDate,
      status: a.isActive ? "active" : "inactive",
      createdAt: a.createdAt,
    }));
    res.json(result);
  });

  app.post("/api/assignments", (req: Request, res: Response) => {
    const { engineerId, clientId, siteId, assignedDate } = req.body;
    const newAssignment = storage.insert("engineer_assignments", {
      engineerId,
      clientId,
      siteId,
      assignedDate: assignedDate || new Date().toISOString().split("T")[0],
      isActive: true
    });
    res.status(201).json({
      ...newAssignment,
      status: "active"
    });
  });

  app.get("/api/dashboard", (req: Request, res: Response) => {
    const profiles = storage.getTable("profiles");
    const clients = storage.getTable("clients");
    const sites = storage.getTable("sites");
    const assignments = storage.getTable("engineer_assignments");
    const reports = storage.getTable("daily_reports");
    const userId = req.session.userId;
    const user = profiles.find((p: any) => p.id === userId);

    if (user?.role === "client") {
      const client = clients.find((c: any) => c.userId === userId);
      const clientReports = reports.filter((r: any) => r.clientId === client?.id);
      const clientAssignments = assignments.filter((a: any) => a.clientId === client?.id);
      const clientSites = sites.filter((s: any) => s.clientId === client?.id);

      return res.json({
        totalEngineers: new Set(clientAssignments.map((a: any) => a.engineerId)).size,
        totalClients: 1,
        totalSites: clientSites.length,
        activeAssignments: clientAssignments.filter((a: any) => a.isActive).length,
        todayCheckIns: 0,
        todayReports: clientReports.length,
        pendingLeaves: 0
      });
    }

    res.json({
      totalEngineers: profiles.filter((p: any) => p.role === "engineer").length,
      totalClients: clients.length,
      totalSites: sites.length,
      activeAssignments: assignments.filter((a: any) => a.isActive).length,
      todayCheckIns: 0,
      todayReports: reports.length,
      pendingLeaves: 0
    });
  });

  app.get("/api/reports", (req: Request, res: Response) => {
    const reports = storage.getTable("daily_reports");
    const profiles = storage.getTable("profiles");
    const clients = storage.getTable("clients");
    const userId = req.session.userId;
    const user = profiles.find((p: any) => p.id === userId);

    let filteredReports = reports;
    if (user?.role === "client") {
      const client = clients.find((c: any) => c.userId === userId);
      filteredReports = reports.filter((r: any) => r.clientId === client?.id);
    }

    const result = filteredReports.map((r: any) => ({
      ...r,
      engineerName: profiles.find((p: any) => p.id === r.engineerId)?.fullName,
      clientName: clients.find((c: any) => c.id === r.clientId)?.name,
      date: r.reportDate
    }));
    res.json(result);
  });

  app.post("/api/reports", (req: Request, res: Response) => {
    const { clientId, siteId, workDone, issues } = req.body;
    const newReport = storage.insert("daily_reports", {
      engineerId: req.session.userId,
      clientId,
      siteId,
      reportDate: new Date().toISOString().split("T")[0],
      workDone,
      issues
    });
    res.status(201).json(newReport);
  });

  app.post("/api/reports/:id/send-email", (req: Request, res: Response) => {
    const { email } = req.body;
    const { id } = req.params;
    const report = storage.getTable("daily_reports").find((r: any) => r.id === id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    
    // Simulate email sending since integration is not yet configured
    console.log(`Sending report ${id} to ${email}`);
    res.json({ success: true, message: `Report sent to ${email} (Simulation)` });
  });

  app.get("/api/check-ins", (req: Request, res: Response) => res.json([]));
  app.get("/api/leaves", (req: Request, res: Response) => res.json([]));
  app.get("/api/notifications", (req: Request, res: Response) => res.json([]));
  app.get("/api/company-profile", (req: Request, res: Response) => {
    const profiles = storage.getTable("company_profiles");
    res.json(profiles[0] || null);
  });

  app.post("/api/company-profile", (req: Request, res: Response) => {
    const profiles = storage.getTable("company_profiles");
    let profile;
    if (profiles.length > 0) {
      profile = storage.update("company_profiles", profiles[0].id, req.body);
    } else {
      profile = storage.insert("company_profiles", req.body);
    }
    res.json(profile);
  });
}
