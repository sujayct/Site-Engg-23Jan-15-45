import { storage } from './storage';

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const clientNames = ["Tech Corp", "Build It Ltd", "Global Infra", "Smart Solutions", "City Projects", "Future Systems"];

export async function seedLargeDataset() {
  const users = storage.getTable("profiles");
  const clients = storage.getTable("clients");
  
  // Seed 20 Engineers
  for (let i = 1; i <= 20; i++) {
    const email = `engineer${i}@company.com`;
    if (!users.find((u: any) => u.email === email)) {
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      storage.insert("profiles", {
        email,
        password: "password123",
        fullName: name,
        role: "engineer",
        phone: `+91 ${9000000000 + i}`,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Seed 30 Clients
  for (let i = 1; i <= 30; i++) {
    const email = `client${i}@example.com`;
    if (!clients.find((c: any) => c.email === email)) {
      const name = `${clientNames[Math.floor(Math.random() * clientNames.length)]} ${i}`;
      storage.insert("clients", {
        name,
        contactPerson: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        email,
        phone: `+91 ${8000000000 + i}`,
        userId: "dummy-user-id"
      });
    }
  }

  // Seed 15 Assignments
  const allEngineers = storage.getTable("profiles").filter((u: any) => u.role === 'engineer');
  const allClients = storage.getTable("clients");
  const existingAssignments = storage.getTable("engineer_assignments");
  
  if (existingAssignments.length < 15) {
      for (let i = 0; i < 15; i++) {
        storage.insert("engineer_assignments", {
          engineerId: allEngineers[i % allEngineers.length].id,
          clientId: allClients[i % allClients.length].id,
          assignedDate: new Date().toISOString().split('T')[0],
          isActive: true
        });
      }
  }

  // Seed Check-ins (some present, some absent)
  const today = new Date().toISOString().split('T')[0];
  const existingCheckIns = storage.getTable("check_ins").filter((c: any) => c.date === today);
  
  if (existingCheckIns.length === 0) {
      for (let i = 0; i < 15; i++) {
        if (Math.random() > 0.3) { // 70% present
          storage.insert("check_ins", {
            engineerId: allEngineers[i].id,
            latitude: 19.0760,
            longitude: 72.8777,
            locationName: "Mumbai Site",
            date: today,
            checkInTime: new Date(new Date().setHours(9, 0, 0)).toISOString(),
            checkOutTime: Math.random() > 0.5 ? new Date(new Date().setHours(18, 0, 0)).toISOString() : null
          });
        }
      }
  }
}
