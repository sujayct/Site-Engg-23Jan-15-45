import fs from "fs";
import path from "path";

const STORAGE_PATH = path.resolve(process.cwd(), "storage.json");

// Initial data structure
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

// Seed data if needed
const seedData = () => {
  const passwordHash = "$2a$10$wT0vR2E9vN.pG9v9v9v9v.wT0vR2E9vN.pG9v9v9v9v.wT0vR2E9vN"; // "password123" dummy
  return {
    ...initialData,
    profiles: [
      {
        id: "5574d283-22f6-4817-8435-35ddda27b9f0",
        email: "admin@company.com",
        fullName: "System Admin",
        role: "admin",
        passwordHash,
        createdAt: new Date().toISOString()
      },
      {
        id: "25b78dbc-b651-4f58-bde0-2f3014ee2ef2",
        email: "engineer@company.com",
        fullName: "John Doe",
        role: "engineer",
        designation: "Senior Engineer",
        passwordHash,
        createdAt: new Date().toISOString()
      }
    ],
    clients: [
      {
        id: "6ac5eb62-fbec-45f5-be84-d965bdf24c04",
        name: "ABC Corporation",
        contactPerson: "Alice Client",
        contactEmail: "client@company.com",
        createdAt: new Date().toISOString()
      }
    ]
  };
};

if (!fs.existsSync(STORAGE_PATH)) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(seedData(), null, 2));
}

export const storage = {
  read: () => JSON.parse(fs.readFileSync(STORAGE_PATH, "utf-8")),
  write: (data) => fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2)),
  
  getTable: (tableName) => storage.read()[tableName] || [],
  
  insert: (tableName, item) => {
    const data = storage.read();
    const newItem = { 
      id: crypto.randomUUID(), 
      createdAt: new Date().toISOString(),
      ...item 
    };
    if (!data[tableName]) data[tableName] = [];
    data[tableName].push(newItem);
    storage.write(data);
    return newItem;
  },
  
  update: (tableName, id, updates) => {
    const data = storage.read();
    const index = data[tableName].findIndex(i => i.id === id);
    if (index !== -1) {
      data[tableName][index] = { ...data[tableName][index], ...updates, updatedAt: new Date().toISOString() };
      storage.write(data);
      return data[tableName][index];
    }
    return null;
  }
};
