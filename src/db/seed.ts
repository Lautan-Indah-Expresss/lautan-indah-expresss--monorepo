import { db, pool } from "./index";
import { users, fleets, customers, shipments, shipment_items, shipment_checkpoints } from "./schema";
import { hashPassword } from "../lib/auth";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🌱 Seeding database 'lie-db'...");

  // Ensure public/uploads exists
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Seed Users
  console.log("Inserting users...");
  const adminPassword = hashPassword("admin123");
  const driverPassword = hashPassword("driver123");

  await db.insert(users).values([
    {
      name: "Admin Kargo",
      username: "admin",
      password_hash: adminPassword,
      phone: "081234567890",
      role: "admin",
      is_active: true,
    },
    {
      name: "Bambang Wijaya",
      username: "driver1",
      password_hash: driverPassword,
      phone: "081298765432",
      role: "driver",
      is_active: true,
    },
    {
      name: "Asep Supriatna",
      username: "driver2",
      password_hash: driverPassword,
      phone: "081345678901",
      role: "driver",
      is_active: true,
    },
  ]).onDuplicateKeyUpdate({
    set: {
      password_hash: adminPassword,
      is_active: true,
    },
  });

  const allUsers = await db.select().from(users);
  const adminUser = allUsers.find((u) => u.username === "admin")!;
  const driver1 = allUsers.find((u) => u.username === "driver1")!;
  const driver2 = allUsers.find((u) => u.username === "driver2")!;

  // 2. Seed Fleets
  console.log("Inserting fleets...");
  await db.insert(fleets).values([
    {
      nopol: "B 9123 KRG",
      vehicle_name: "Mitsubishi Fuso Box",
      default_driver_id: driver1.id,
      status: "on_trip",
    },
    {
      nopol: "D 8472 KGO",
      vehicle_name: "Isuzu Giga Wingbox",
      default_driver_id: driver2.id,
      status: "available",
    },
  ]).onDuplicateKeyUpdate({
    set: {
      status: "available",
    },
  });

  const allFleets = await db.select().from(fleets);
  const fleet1 = allFleets.find((f) => f.nopol === "B 9123 KRG")!;
  const fleet2 = allFleets.find((f) => f.nopol === "D 8472 KGO")!;

  // 3. Seed Customers
  console.log("Inserting customers...");
  const customerData = [
    {
      company_name: "PT. Sentosa Abadi",
      contact_name: "Budi Santoso",
      phone: "081288990011",
      address: "Jl. Industri Raya No. 45, Kawasan Industri Pulogadung",
      city: "Jakarta Timur",
      province: "DKI Jakarta",
      postal_code: "13920",
    },
    {
      company_name: "CV. Maju Bersama",
      contact_name: "Hendra Gunawan",
      phone: "081377889900",
      address: "Jl. Soekarno Hatta No. 512, Batununggal",
      city: "Bandung",
      province: "Jawa Barat",
      postal_code: "40266",
    },
    {
      company_name: "Toko Bintang",
      contact_name: "Cindy Claudia",
      phone: "081911223344",
      address: "Jl. Malioboro No. 88",
      city: "Yogyakarta",
      province: "DI Yogyakarta",
      postal_code: "55271",
    },
    {
      company_name: "PT. Sukses Selalu",
      contact_name: "Ahmad Dahlan",
      phone: "082155667788",
      address: "Jl. Rungkut Industri III No. 12",
      city: "Surabaya",
      province: "Jawa Timur",
      postal_code: "60293",
    },
    {
      company_name: "UD. Jaya Makmur",
      contact_name: "Joko Widodo",
      phone: "085233445566",
      address: "Jl. Pemuda No. 102",
      city: "Semarang",
      province: "Jawa Tengah",
      postal_code: "50132",
    },
  ];

  for (const c of customerData) {
    const existing = await db.select().from(customers);
    const found = existing.find((x) => x.company_name === c.company_name);
    if (!found) {
      await db.insert(customers).values(c);
    }
  }

  const allCustomers = await db.select().from(customers);
  const custSentosa = allCustomers.find((c) => c.company_name.includes("Sentosa"))!;
  const custMaju = allCustomers.find((c) => c.company_name.includes("Maju"))!;
  const custBintang = allCustomers.find((c) => c.company_name.includes("Bintang"))!;
  const custSukses = allCustomers.find((c) => c.company_name.includes("Sukses"))!;
  const custJaya = allCustomers.find((c) => c.company_name.includes("Jaya"))!;

  // 4. Seed Shipments
  console.log("Inserting shipments...");
  const now = new Date();
  const eta1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const shipmentList = [
    {
      resi: "KG123456789ID",
      reference_po: "PO-2024-05-9921",
      pin_code: "123456",
      sender_customer_id: custSentosa.id,
      receiver_customer_id: custMaju.id,
      fleet_id: fleet1.id,
      driver_id: driver1.id,
      sender_company: custSentosa.company_name,
      sender_contact: custSentosa.contact_name,
      sender_phone: custSentosa.phone,
      sender_address: custSentosa.address,
      origin_city: custSentosa.city,
      origin_province: custSentosa.province,
      origin_postal_code: custSentosa.postal_code,
      origin_lat: "-6.20000000",
      origin_lng: "106.81666600",
      receiver_company: custMaju.company_name,
      receiver_contact: custMaju.contact_name,
      receiver_phone: custMaju.phone,
      receiver_address: custMaju.address,
      destination_city: custMaju.city,
      destination_province: custMaju.province,
      destination_postal_code: custMaju.postal_code,
      destination_lat: "-6.91474400",
      destination_lng: "107.60981000",
      service_type: "Reguler" as const,
      service_name: "Pengiriman Biasa",
      has_insurance: true,
      actual_weight_kg: "5.20",
      volume_weight_kg: "5.00",
      total_colli: 1,
      payment_method: "Prepaid" as const,
      notes: "Harap hati-hati barang presisi dan mudah lecet",
      shipping_cost: "35000.00",
      insurance_cost: "2500.00",
      other_cost: "0.00",
      total_cost: "37500.00",
      pre_departure_checked: true,
      status: "dalam_pengiriman" as const,
      has_active_issue: false,
      current_issue_note: null,
      estimated_days: "3 hari kerja",
      estimated_arrival: eta1,
      inspected_by: "Admin Kargo",
    },
    {
      resi: "KG123456790ID",
      reference_po: "PO-2024-05-9922",
      pin_code: "234567",
      sender_customer_id: custSentosa.id,
      receiver_customer_id: custBintang.id,
      fleet_id: fleet1.id,
      driver_id: driver1.id,
      sender_company: custSentosa.company_name,
      sender_contact: custSentosa.contact_name,
      sender_phone: custSentosa.phone,
      sender_address: custSentosa.address,
      origin_city: "Jakarta",
      origin_province: "DKI Jakarta",
      origin_postal_code: "13920",
      origin_lat: "-6.20000000",
      origin_lng: "106.81666600",
      receiver_company: custBintang.company_name,
      receiver_contact: custBintang.contact_name,
      receiver_phone: custBintang.phone,
      receiver_address: custBintang.address,
      destination_city: "Yogyakarta",
      destination_province: "DI Yogyakarta",
      destination_postal_code: "55271",
      destination_lat: "-7.79558000",
      destination_lng: "110.36949000",
      service_type: "Express" as const,
      service_name: "Express Kilat",
      has_insurance: true,
      actual_weight_kg: "12.00",
      volume_weight_kg: "10.00",
      total_colli: 2,
      payment_method: "Prepaid" as const,
      notes: "Pengiriman cepat suku cadang",
      shipping_cost: "120000.00",
      insurance_cost: "10000.00",
      other_cost: "0.00",
      total_cost: "130000.00",
      pre_departure_checked: true,
      status: "dalam_pengiriman" as const,
      has_active_issue: false,
      current_issue_note: null,
      estimated_days: "1 hari kerja",
      estimated_arrival: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      inspected_by: "Admin Kargo",
    },
    {
      resi: "KG123456791ID",
      reference_po: "PO-2024-05-9923",
      pin_code: "345678",
      sender_customer_id: custMaju.id,
      receiver_customer_id: custSukses.id,
      fleet_id: fleet2.id,
      driver_id: driver2.id,
      sender_company: custMaju.company_name,
      sender_contact: custMaju.contact_name,
      sender_phone: custMaju.phone,
      sender_address: custMaju.address,
      origin_city: "Bandung",
      origin_province: "Jawa Barat",
      origin_postal_code: "40266",
      origin_lat: "-6.91474400",
      origin_lng: "107.60981000",
      receiver_company: custSukses.company_name,
      receiver_contact: custSukses.contact_name,
      receiver_phone: custSukses.phone,
      receiver_address: custSukses.address,
      destination_city: "Surabaya",
      destination_province: "Jawa Timur",
      destination_postal_code: "60293",
      destination_lat: "-7.25747200",
      destination_lng: "112.75209000",
      service_type: "Reguler" as const,
      service_name: "Pengiriman Biasa",
      has_insurance: false,
      actual_weight_kg: "25.50",
      volume_weight_kg: "20.00",
      total_colli: 3,
      payment_method: "Prepaid" as const,
      notes: "Barang tekstil",
      shipping_cost: "175000.00",
      insurance_cost: "0.00",
      other_cost: "0.00",
      total_cost: "175000.00",
      pre_departure_checked: true,
      status: "terkirim" as const,
      has_active_issue: false,
      current_issue_note: null,
      estimated_days: "2 hari kerja",
      estimated_arrival: now,
      received_date: now,
      received_by: "Ahmad Dahlan",
      inspected_by: "Admin Kargo",
    },
    {
      resi: "KG123456792ID",
      reference_po: "PO-2024-05-9924",
      pin_code: "456789",
      sender_customer_id: custJaya.id,
      receiver_customer_id: custSentosa.id,
      fleet_id: null,
      driver_id: null,
      sender_company: custJaya.company_name,
      sender_contact: custJaya.contact_name,
      sender_phone: custJaya.phone,
      sender_address: custJaya.address,
      origin_city: "Semarang",
      origin_province: "Jawa Tengah",
      origin_postal_code: "50132",
      origin_lat: "-6.96666700",
      origin_lng: "110.41666400",
      receiver_company: custSentosa.company_name,
      receiver_contact: custSentosa.contact_name,
      receiver_phone: custSentosa.phone,
      receiver_address: custSentosa.address,
      destination_city: "Jakarta Timur",
      destination_province: "DKI Jakarta",
      destination_postal_code: "13920",
      destination_lat: "-6.20000000",
      destination_lng: "106.81666600",
      service_type: "Reguler" as const,
      service_name: "Pengiriman Biasa",
      has_insurance: false,
      actual_weight_kg: "8.00",
      volume_weight_kg: "8.00",
      total_colli: 1,
      payment_method: "Prepaid" as const,
      notes: "Menunggu penugasan armada",
      shipping_cost: "55000.00",
      insurance_cost: "0.00",
      other_cost: "0.00",
      total_cost: "55000.00",
      pre_departure_checked: false,
      status: "tertunda" as const,
      has_active_issue: false,
      current_issue_note: null,
      estimated_days: "3 hari kerja",
      estimated_arrival: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      inspected_by: "Admin Kargo",
    },
    {
      resi: "KG123456793ID",
      reference_po: "PO-2024-05-9925",
      pin_code: "567890",
      sender_customer_id: custSentosa.id,
      receiver_customer_id: custMaju.id,
      fleet_id: fleet1.id,
      driver_id: driver1.id,
      sender_company: custSentosa.company_name,
      sender_contact: custSentosa.contact_name,
      sender_phone: custSentosa.phone,
      sender_address: custSentosa.address,
      origin_city: "Jakarta",
      origin_province: "DKI Jakarta",
      origin_postal_code: "13920",
      origin_lat: "-6.20000000",
      origin_lng: "106.81666600",
      receiver_company: custMaju.company_name,
      receiver_contact: custMaju.contact_name,
      receiver_phone: custMaju.phone,
      receiver_address: custMaju.address,
      destination_city: "Bandung",
      destination_province: "Jawa Barat",
      destination_postal_code: "40266",
      destination_lat: "-6.91474400",
      destination_lng: "107.60981000",
      service_type: "Reguler" as const,
      service_name: "Pengiriman Biasa",
      has_insurance: true,
      actual_weight_kg: "14.50",
      volume_weight_kg: "12.00",
      total_colli: 2,
      payment_method: "Prepaid" as const,
      notes: "Ban belakang meledak di KM 72",
      shipping_cost: "60000.00",
      insurance_cost: "5000.00",
      other_cost: "0.00",
      total_cost: "65000.00",
      pre_departure_checked: true,
      status: "kendala" as const,
      has_active_issue: true,
      current_issue_note: "Ban belakang meledak di Tol Cipularang KM 72",
      estimated_days: "3 hari kerja",
      estimated_arrival: eta1,
      inspected_by: "Admin Kargo",
    },
  ];

  for (const s of shipmentList) {
    const existing = await db.select().from(shipments);
    const found = existing.find((x) => x.resi === s.resi);
    if (!found) {
      await db.insert(shipments).values(s);
    }
  }

  const allShipments = await db.select().from(shipments);
  const shipment1 = allShipments.find((s) => s.resi === "KG123456789ID")!;
  const shipment5 = allShipments.find((s) => s.resi === "KG123456793ID")!;

  // 5. Seed Items for KG123456789ID
  console.log("Inserting shipment items for KG123456789ID...");
  const existingItems = await db.select().from(shipment_items);
  if (!existingItems.some((i) => i.shipment_id === shipment1.id)) {
    await db.insert(shipment_items).values([
      {
        shipment_id: shipment1.id,
        item_name: "Spare Part Mesin Industri",
        qty: 1,
        weight_kg: "5.20",
        item_value: "2500000.00",
      },
    ]);
  }

  // 6. Seed Checkpoints for KG123456789ID (Jakarta to Bandung)
  console.log("Inserting checkpoints for KG123456789ID...");
  const existingCheckpoints = await db.select().from(shipment_checkpoints);
  if (!existingCheckpoints.some((c) => c.shipment_id === shipment1.id)) {
    await db.insert(shipment_checkpoints).values([
      {
        shipment_id: shipment1.id,
        actor_role: "admin",
        checkpoint_type: "created",
        status_label: "Resi Dibuat & Diverifikasi Admin",
        description: "Admin Kargo telah melakukan pengecekan muatan dan membuat resi pengiriman.",
        latitude: "-6.20000000",
        longitude: "106.81666600",
      },
      {
        shipment_id: shipment1.id,
        actor_role: "driver",
        checkpoint_type: "departure_selfie",
        status_label: "Sopir Absen Berangkat (Selfie Armada B 9123 KRG)",
        description: "Sopir Bambang Wijaya telah melakukan absen berangkat bersama armada.",
        photo_url: "/uploads/selfie-sample.jpg",
        latitude: "-6.22000000",
        longitude: "106.84000000",
      },
      {
        shipment_id: shipment1.id,
        actor_role: "driver",
        checkpoint_type: "transit_update",
        status_label: "Melewati Gerbang Tol Cikampek Utama",
        description: "Armada bergerak lancar melintasi rute tol Jakarta-Cikampek.",
        latitude: "-6.40000000",
        longitude: "107.45000000",
      },
    ]);
  }

  // Seed Checkpoints for KG123456793ID (with incident)
  if (!existingCheckpoints.some((c) => c.shipment_id === shipment5.id)) {
    await db.insert(shipment_checkpoints).values([
      {
        shipment_id: shipment5.id,
        actor_role: "admin",
        checkpoint_type: "created",
        status_label: "Resi Dibuat & Diverifikasi Admin",
        description: "Resi KG123456793ID dibuat.",
        latitude: "-6.20000000",
        longitude: "106.81666600",
      },
      {
        shipment_id: shipment5.id,
        actor_role: "driver",
        checkpoint_type: "departure_selfie",
        status_label: "Sopir Absen Berangkat (Selfie Armada B 9123 KRG)",
        description: "Sopir Bambang Wijaya berangkat.",
        photo_url: "/uploads/selfie-sample.jpg",
        latitude: "-6.22000000",
        longitude: "106.84000000",
      },
      {
        shipment_id: shipment5.id,
        actor_role: "driver",
        checkpoint_type: "incident",
        status_label: "Kendala: Ban Belakang Meledak",
        description: "Ban belakang kanan pecah di Tol Cipularang KM 72. Sedang menunggu bantuan derek.",
        photo_url: "/uploads/incident-sample.jpg",
        latitude: "-6.58000000",
        longitude: "107.44000000",
      },
    ]);
  }

  console.log("✅ Seeding completed successfully!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
