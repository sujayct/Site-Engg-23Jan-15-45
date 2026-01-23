import { db, pool } from "../server/db";
import { profiles, clients, sites, engineerAssignments } from "../shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");
  
  const passwordHash = await bcrypt.hash("password123", 10);
  
  const existingProfiles = await db.select().from(profiles);
  if (existingProfiles.length > 0) {
    console.log("Database already has data, skipping seed.");
    await pool.end();
    return;
  }
  
  const [admin] = await db.insert(profiles).values({
    email: "admin@company.com",
    fullName: "System Admin",
    role: "admin",
    passwordHash,
  }).returning();
  console.log("Created admin:", admin.email);
  
  const [hr] = await db.insert(profiles).values({
    email: "hr@company.com",
    fullName: "HR Manager",
    role: "hr",
    passwordHash,
  }).returning();
  console.log("Created HR:", hr.email);
  
  const [engineer1] = await db.insert(profiles).values({
    email: "engineer@company.com",
    fullName: "John Doe",
    role: "engineer",
    phone: "1234567890",
    designation: "Senior Engineer",
    passwordHash,
  }).returning();
  console.log("Created engineer:", engineer1.email);
  
  const [engineer2] = await db.insert(profiles).values({
    email: "jane@company.com",
    fullName: "Jane Smith",
    role: "engineer",
    phone: "0987654321",
    designation: "Junior Engineer",
    passwordHash,
  }).returning();
  console.log("Created engineer:", engineer2.email);
  
  const [clientUser] = await db.insert(profiles).values({
    email: "client@company.com",
    fullName: "ABC Corp Contact",
    role: "client",
    passwordHash,
  }).returning();
  console.log("Created client user:", clientUser.email);
  
  const [client1] = await db.insert(clients).values({
    name: "ABC Corporation",
    contactPerson: "Alice Client",
    contactEmail: "client@company.com",
    userId: clientUser.id,
  }).returning();
  console.log("Created client:", client1.name);
  
  const [client2] = await db.insert(clients).values({
    name: "XYZ Industries",
    contactPerson: "Bob Builder",
    contactEmail: "bob@xyz.com",
  }).returning();
  console.log("Created client:", client2.name);
  
  const [site1] = await db.insert(sites).values({
    clientId: client1.id,
    name: "Main Office",
    location: "Downtown",
  }).returning();
  console.log("Created site:", site1.name);
  
  const [site2] = await db.insert(sites).values({
    clientId: client1.id,
    name: "Warehouse A",
    location: "Industrial Zone",
  }).returning();
  console.log("Created site:", site2.name);
  
  await db.insert(engineerAssignments).values({
    engineerId: engineer1.id,
    clientId: client1.id,
    siteId: site1.id,
    isActive: true,
  });
  console.log("Created assignment for:", engineer1.fullName);
  
  await db.insert(engineerAssignments).values({
    engineerId: engineer2.id,
    clientId: client1.id,
    siteId: site2.id,
    isActive: true,
  });
  console.log("Created assignment for:", engineer2.fullName);
  
  console.log("Seed completed successfully!");
  console.log("\nTest login credentials:");
  console.log("  Admin: admin@company.com / password123");
  console.log("  HR: hr@company.com / password123");
  console.log("  Engineer: engineer@company.com / password123");
  console.log("  Client: client@company.com / password123");
  
  await pool.end();
}

seed().catch(console.error);
