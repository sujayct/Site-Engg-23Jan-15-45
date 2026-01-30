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
  const engineerUserId = "engineer-user-id-001";
  
  const clientId = "6ac5eb62-fbec-45f5-be84-d965bdf24c04";
  const profiles: any[] = [
    { id: adminId, email: "admin@company.com", fullName: "System Admin", role: "admin", passwordHash, createdAt: now, engineerId: "eng-admin" },
    { id: hrId, email: "hr@company.com", fullName: "HR Manager", role: "hr", passwordHash, createdAt: now, engineerId: "eng-hr" },
    { id: clientUserId, email: "client@company.com", fullName: "ABC Corp Contact", role: "client", passwordHash, createdAt: now, clientId: clientId, engineerId: "eng-client" },
    { id: engineerUserId, email: "engineer@company.com", fullName: "Rahul Sharma", role: "engineer", passwordHash, createdAt: now, engineerId: "eng-001" }
  ];

  const engineers: any[] = [
    { id: "eng-001", email: "engineer@company.com", fullName: "Rahul Sharma", role: "engineer", designation: "Lead Site Engineer", phone: "+919876543210", passwordHash, createdAt: now, engineerId: "eng-001" },
    { id: "eng-002", email: "vikram@company.com", fullName: "Vikram Singh", role: "engineer", designation: "Senior Engineer", phone: "+919876543211", passwordHash, createdAt: now, engineerId: "eng-002" },
    { id: "eng-003", email: "priya@company.com", fullName: "Priya Patel", role: "engineer", designation: "Site Supervisor", phone: "+919876543212", passwordHash, createdAt: now, engineerId: "eng-003" }
  ];

  // Add more engineers to reach 10
  for (let i = 4; i <= 10; i++) {
    const engId = `engineer-id-${i}`;
    engineers.push({
      id: engId,
      email: `engineer${i}@company.com`,
      fullName: `Engineer ${i}`,
      role: "engineer",
      designation: i % 2 === 0 ? "Senior Engineer" : "Junior Engineer",
      phone: `+91987654321${i-1}`,
      passwordHash,
      createdAt: now,
      engineerId: engId
    });
  }

  // Ensure all engineers have user profiles
  engineers.forEach(eng => {
    if (!profiles.find(p => p.email === eng.email)) {
      profiles.push({ ...eng, id: `user-${eng.id}` });
    }
  });

  const clients = [
    { id: clientId, name: "ABC Corporation", contactPerson: "Alice Client", contactEmail: "client@company.com", userId: clientUserId, createdAt: now },
    { id: "client-002", name: "BuildFast Infra", contactPerson: "Bob Builder", contactEmail: "bob@buildfast.com", createdAt: now }
  ];

  const sites = [
    { id: "site-001", clientId: clientId, name: "Downtown Plaza", location: "Mumbai, MH", createdAt: now },
    { id: "site-002", clientId: clientId, name: "Skyline Residency", location: "Pune, MH", createdAt: now },
    { id: "site-003", clientId: "client-002", name: "Highway Bridge", location: "Bangalore, KA", createdAt: now }
  ];

  const assignments = [
    { id: "asg-001", engineerId: "eng-001", clientId: clientId, siteId: "site-001", assignedDate: today, isActive: true, createdAt: now },
    { id: "asg-002", engineerId: "eng-002", clientId: clientId, siteId: "site-002", assignedDate: today, isActive: true, createdAt: now },
    { id: "asg-003", engineerId: "eng-003", clientId: "client-002", siteId: "site-003", assignedDate: today, isActive: true, createdAt: now }
  ];

  const checkIns = [
    { id: "ci-001", engineerId: "eng-001", date: today, checkInTime: new Date(new Date().getTime() - 4 * 60 * 60 * 1000).toISOString(), latitude: 19.0760, longitude: 72.8777, locationName: "Downtown Plaza, Mumbai", createdAt: now },
    { id: "ci-002", engineerId: "eng-002", date: today, checkInTime: new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString(), latitude: 18.5204, longitude: 73.8567, locationName: "Skyline Residency, Pune", createdAt: now }
  ];

  const reports = [
    { id: "rep-001", engineerId: "eng-001", clientId: clientId, siteId: "site-001", date: today, workDone: "Concrete pouring for foundation completed. Safety check passed.", issues: "Minor delay due to material transport.", createdAt: now },
    { id: "rep-002", engineerId: "eng-002", clientId: clientId, siteId: "site-002", date: today, workDone: "Electrical wiring in block A started.", issues: "None", createdAt: now }
  ];

  const leaves = [
    { id: "lv-001", engineerId: "eng-003", startDate: new Date(new Date().getTime() + 86400000).toISOString(), endDate: new Date(new Date().getTime() + 2 * 86400000).toISOString(), reason: "Personal work", status: "pending", createdAt: now }
  ];

  return { 
    ...initialData, 
    profiles, 
    clients, 
    sites, 
    engineer_assignments: assignments, 
    check_ins: checkIns, 
    daily_reports: reports,
    leave_requests: leaves 
  };
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
