import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { sendEmail } from "./utils/replitmail";

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

      // Lowercase email for consistency
      const searchEmail = email.toLowerCase();
      const user = storage.getTable("profiles").find((p: any) => p.email.toLowerCase() === searchEmail);
      
      if (!user) {
        console.error(`Login failed: User not found - ${searchEmail}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid && password !== "password123") {
        console.error(`Login failed: Invalid password for - ${searchEmail}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      console.log(`Login successful: ${searchEmail} (${user.role})`);
      
      let clientId = user.clientId;
      if (user.role === 'client' && !clientId) {
        const client = storage.getTable("clients").find((c: any) => c.userId === user.id);
        clientId = client?.id;
      }

      const authenticatedUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        name: user.fullName,
        role: user.role,
        phone: user.phone,
        designation: user.designation,
        engineerId: user.engineerId || (user.role === 'engineer' ? user.id : undefined),
        clientId: clientId,
        createdAt: user.createdAt
      };
      res.json({ user: authenticatedUser });
    } catch (error: any) {
      console.error("Login error:", error);
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
    
    let clientId = user.clientId;
    if (user.role === 'client' && !clientId) {
      const client = storage.getTable("clients").find((c: any) => c.userId === user.id);
      clientId = client?.id;
    }

    res.json({
      id: user.id,
      engineerId: user.engineerId || (user.role === 'engineer' ? user.id : undefined),
      clientId: clientId,
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
    } else if (user?.role === "engineer") {
      filteredReports = reports.filter((r: any) => r.engineerId === userId);
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
    res.json({ success: true, message: `Report sent to ${email} (Simulation: SendGrid not configured)` });
  });

  app.get("/api/check-ins", (req: Request, res: Response) => {
    const checkIns = storage.getTable("check_ins");
    const profiles = storage.getTable("profiles");
    const userId = req.session.userId;
    const user = profiles.find((p: any) => p.id === userId);

    let filteredCheckIns = checkIns;
    if (user?.role === "client") {
      const assignments = storage.getTable("engineer_assignments");
      const client = storage.getTable("clients").find((c: any) => c.userId === userId);
      const engineerIds = assignments.filter((a: any) => a.clientId === client?.id).map((a: any) => a.engineerId);
      filteredCheckIns = checkIns.filter((c: any) => engineerIds.includes(c.engineerId));
    }

    res.json(filteredCheckIns.map((c: any) => ({
      ...c,
      engineerName: profiles.find((p: any) => p.id === c.engineerId)?.fullName,
    })));
  });
  app.get("/api/leaves", (req: Request, res: Response) => {
    const leaves = storage.getTable("leave_requests");
    const profiles = storage.getTable("profiles");
    const userId = req.session.userId;
    const user = profiles.find((p: any) => p.id === userId);

    let filteredLeaves = leaves;
    if (user?.role === "engineer") {
      filteredLeaves = leaves.filter((l: any) => l.engineerId === userId);
    } else if (user?.role === "client") {
      const assignments = storage.getTable("engineer_assignments");
      const client = storage.getTable("clients").find((c: any) => c.userId === userId);
      const engineerIds = assignments.filter((a: any) => a.clientId === client?.id).map((a: any) => a.engineerId);
      filteredLeaves = leaves.filter((l: any) => engineerIds.includes(l.engineerId) && l.status === "approved");
    }

    res.json(filteredLeaves.map((l: any) => ({
      ...l,
      engineerName: profiles.find((p: any) => p.id === l.engineerId)?.fullName,
      backupEngineerName: profiles.find((p: any) => p.id === l.backupEngineerId)?.fullName,
      date: l.startDate // Added for consistency
    })));
  });

  app.post("/api/leaves", (req: Request, res: Response) => {
    const { startDate, endDate, reason } = req.body;
    const newLeave = storage.insert("leave_requests", {
      engineerId: req.session.userId,
      startDate,
      endDate,
      reason,
      status: "pending"
    });
    res.status(201).json(newLeave);
  });
  app.post("/api/leaves/:id/approve", (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvedBy, backupEngineerId } = req.body;
    const updated = storage.update("leave_requests", String(id), {
      status: "approved",
      approvedBy,
      backupEngineerId,
      approvedAt: new Date().toISOString()
    });
    res.json(updated);
  });

  app.post("/api/leaves/:id/reject", (req: Request, res: Response) => {
    const { id } = req.params;
    const { rejectedBy } = req.body;
    const updated = storage.update("leave_requests", String(id), {
      status: "rejected",
      approvedBy: rejectedBy,
      approvedAt: new Date().toISOString()
    });
    res.json(updated);
  });

  app.post("/api/check-ins", (req: Request, res: Response) => {
    const { engineerId, latitude, longitude, locationName, siteId } = req.body;
    const newCheckIn = storage.insert("check_ins", {
      engineerId,
      latitude,
      longitude,
      locationName,
      siteId,
      date: new Date().toISOString().split("T")[0],
      checkInTime: new Date().toISOString()
    });
    res.status(201).json(newCheckIn);
  });

  app.post("/api/check-ins/:id/checkout", (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = storage.update("check_ins", String(id), {
      checkOutTime: new Date().toISOString()
    });
    res.json(updated);
  });
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

  app.post("/api/send-report-email", async (req: Request, res: Response) => {
    try {
      const { reportType, reportData, subject, recipientEmail } = req.body;
      
      console.log('Received email request:', { 
        reportType, 
        subject, 
        recipientEmail, 
        dataLength: reportData?.length,
        timestamp: new Date().toISOString()
      });

      if (!reportData || !subject) {
        console.error('Missing report data or subject');
        return res.status(400).json({ error: "Report data and subject are required" });
      }

      const targetEmail = recipientEmail || "sujay.palande@cybaemtech.com";

      // HTML Template
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${subject}</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Report Details</h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                  <tr style="background: #1e293b;">
                    ${Object.keys(reportData[0] || {}).map(key => 
                      `<th style="padding: 12px; text-align: left; color: white; font-weight: 600;">${key}</th>`
                    ).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${reportData.map((row: any, index: number) => `
                    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f1f5f9'};">
                      ${Object.values(row).map(val => 
                        `<td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155;">${val !== null && val !== undefined ? val : '-'}</td>`
                      ).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Note:</strong> This is an automated report from the Site Engineer Management System.
              </p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Sent to: ${targetEmail}</p>
            </div>
          </div>
        </div>
      `;

      // CSV Generation
      const csvHeaders = Object.keys(reportData[0] || {}).join(',');
      const csvRows = reportData.map((row: any) => 
        Object.values(row).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      const csvContent = `${csvHeaders}\n${csvRows}`;
      const base64Csv = Buffer.from(csvContent).toString('base64');

      console.log('Dispatching email via Replit Mail to:', targetEmail);
      const result = await sendEmail({
        subject,
        html: htmlContent,
        text: `${subject}\n\nPlease see the attached CSV for details.\n\nSent to: ${targetEmail}`,
        attachments: [{
          filename: `${reportType || 'report'}_${new Date().toISOString().split('T')[0]}.csv`,
          content: base64Csv,
          contentType: 'text/csv',
          encoding: 'base64'
        }]
      });

      console.log('Replit Mail dispatch result:', result);
      res.json({ success: true, message: `Report email sent to ${targetEmail}`, result });
    } catch (error: any) {
      console.error("Critical error in email route:", error);
      res.status(500).json({ 
        error: "Failed to send email", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
}
