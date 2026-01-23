import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const STORAGE_PATH = path.resolve(process.cwd(), "storage.json");

const initialData = {
  profiles: [],
  clients: [],
  sites: [],
  engineer_assignments: [],
  check_ins: [],
  daily_reports: [],
  leave_requests: [],
  notifications: [],
  company_profiles: [],
  sessions: []
};

const seedData = () => {
  const passwordHash = bcrypt.hashSync("password123", 10);
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  const adminId = "5574d283-22f6-4817-8435-35ddda27b9f0";
  const hrId = "hr-user-id-001";
  const clientUserId = "client-user-id-001";
  
  const profiles = [
    { id: adminId, email: "admin@company.com", fullName: "System Admin", role: "admin", passwordHash, createdAt: now },
    { id: hrId, email: "hr@company.com", fullName: "HR Manager", role: "hr", passwordHash, createdAt: now },
    { id: clientUserId, email: "client@company.com", fullName: "ABC Corp Contact", role: "client", passwordHash, createdAt: now },
    { id: "engineer-user-id", email: "engineer@company.com", fullName: "Engineer User", role: "engineer", passwordHash, createdAt: now }
  ];

  const engineers = [];
  for (let i = 1; i <= 10; i++) {
    engineers.push({
      id: `engineer-id-${i}`,
      email: `engineer${i}@company.com`,
      fullName: `Engineer ${i}`,
      role: "engineer",
      designation: i % 2 === 0 ? "Senior Engineer" : "Junior Engineer",
      phone: `+91987654321${i-1}`,
      passwordHash,
      createdAt: now
    });
  }
  profiles.push(...engineers);

  const clientId = "6ac5eb62-fbec-45f5-be84-d965bdf24c04";
  const clients = [
    { id: clientId, name: "ABC Corporation", contactPerson: "Alice Client", contactEmail: "client@company.com", userId: clientUserId, createdAt: now }
  ];

  const sites = [
    { id: "site-id-001", clientId, name: "Main Office", location: "Downtown", createdAt: now },
    { id: "site-id-002", clientId, name: "Warehouse A", location: "Industrial Zone", createdAt: now }
  ];

  const assignments = engineers.slice(0, 5).map((e, idx) => ({
    id: `assign-id-${idx}`,
    engineerId: e.id,
    clientId,
    siteId: idx % 2 === 0 ? sites[0].id : sites[1].id,
    assignedDate: today,
    isActive: true,
    createdAt: now
  }));

  const reports = engineers.slice(0, 3).map((e, idx) => ({
    id: `report-id-${idx}`,
    engineerId: e.id,
    clientId,
    siteId: sites[0].id,
    reportDate: today,
    workDone: `Completed maintenance task #${idx + 101}`,
    issues: idx === 1 ? "Waiting for parts" : "None",
    createdAt: now
  }));

  return { ...initialData, profiles, clients, sites, engineer_assignments: assignments, daily_reports: reports };
};

if (!fs.existsSync(STORAGE_PATH)) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(seedData(), null, 2));
}

export const storage = {
  read: () => JSON.parse(fs.readFileSync(STORAGE_PATH, "utf-8")),
  write: (data) => fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2)),
  getTable: (tableName: string) => storage.read()[tableName] || [],
  insert: (tableName: string, item: any) => {
    const data = storage.read();
    const newItem = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...item };
    if (!data[tableName]) data[tableName] = [];
    data[tableName].push(newItem);
    storage.write(data);
    return newItem;
  },
  update: (tableName: string, id: string, updates: any) => {
    const data = storage.read();
    const index = data[tableName].findIndex((i: any) => i.id === id);
    if (index !== -1) {
      data[tableName][index] = { ...data[tableName][index], ...updates, updatedAt: new Date().toISOString() };
      storage.write(data);
      return data[tableName][index];
    }
    return null;
  }
};
