import { StorageService } from './storage';

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const clientNames = ["Tech Corp", "Build It Ltd", "Global Infra", "Smart Solutions", "City Projects", "Future Systems"];

export async function seedLargeDataset() {
  const users = await StorageService.getTable("profiles");
  const clients = await StorageService.getTable("clients");
  
  // Seed 20 Engineers
  for (let i = 1; i <= 20; i++) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const email = `engineer${i}@company.com`;
    if (!users.find((u: any) => u.email === email)) {
      await StorageService.insert("profiles", {
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
    const name = `${clientNames[Math.floor(Math.random() * clientNames.length)]} ${i}`;
    const email = `client${i}@example.com`;
    if (!clients.find((c: any) => c.email === email)) {
      await StorageService.insert("clients", {
        name,
        contactPerson: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        email,
        phone: `+91 ${8000000000 + i}`,
        userId: "dummy-user-id"
      });
    }
  }

  // Seed 15 Assignments
  const allEngineers = (await StorageService.getTable("profiles")).filter((u: any) => u.role === 'engineer');
  const allClients = await StorageService.getTable("clients");
  for (let i = 0; i < 15; i++) {
    const engineer = allEngineers[i % allEngineers.length];
    const client = allClients[i % allClients.length];
    await StorageService.insert("assignments", {
      engineerId: engineer.id,
      clientId: client.id,
      clientName: client.name,
      engineerName: engineer.fullName,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
  }

  // Seed Check-ins (some present, some absent)
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < 15; i++) {
    if (Math.random() > 0.3) { // 70% present
      await StorageService.insert("check_ins", {
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
