import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// 3.1. users (Admin & Drivers)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  role: mysqlEnum("role", ["admin", "driver"]).default("driver").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 3.2. fleets (Armada - Nopol & Kurir Default)
export const fleets = mysqlTable("fleets", {
  id: serial("id").primaryKey(),
  nopol: varchar("nopol", { length: 20 }).notNull().unique(),
  vehicle_name: varchar("vehicle_name", { length: 100 }).notNull(),
  default_driver_id: bigint("default_driver_id", { mode: "number", unsigned: true }).references(
    () => users.id,
    { onDelete: "set null" }
  ),
  status: mysqlEnum("status", ["available", "on_trip", "maintenance", "trouble"])
    .default("available")
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 3.3. customers (Master Pelanggan B2B)
export const customers = mysqlTable("customers", {
  id: serial("id").primaryKey(),
  company_name: varchar("company_name", { length: 150 }).notNull(),
  contact_name: varchar("contact_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  postal_code: varchar("postal_code", { length: 15 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 3.4. shipments (Header Surat Jalan / Resi)
export const shipments = mysqlTable("shipments", {
  id: serial("id").primaryKey(),
  resi: varchar("resi", { length: 30 }).notNull().unique(),
  reference_po: varchar("reference_po", { length: 100 }),
  pin_code: varchar("pin_code", { length: 6 }).notNull(),

  // Foreign Keys
  sender_customer_id: bigint("sender_customer_id", { mode: "number", unsigned: true }).references(
    () => customers.id
  ),
  receiver_customer_id: bigint("receiver_customer_id", { mode: "number", unsigned: true }).references(
    () => customers.id
  ),
  fleet_id: bigint("fleet_id", { mode: "number", unsigned: true }).references(() => fleets.id),
  driver_id: bigint("driver_id", { mode: "number", unsigned: true }).references(() => users.id),

  // Point-in-Time Snapshot
  sender_company: varchar("sender_company", { length: 150 }).notNull(),
  sender_contact: varchar("sender_contact", { length: 100 }).notNull(),
  sender_phone: varchar("sender_phone", { length: 30 }).notNull(),
  sender_address: text("sender_address").notNull(),
  origin_city: varchar("origin_city", { length: 100 }).notNull(),
  origin_province: varchar("origin_province", { length: 100 }).notNull(),
  origin_postal_code: varchar("origin_postal_code", { length: 15 }),
  origin_lat: decimal("origin_lat", { precision: 10, scale: 8 }).default("-6.20000000"),
  origin_lng: decimal("origin_lng", { precision: 11, scale: 8 }).default("106.81666600"),

  receiver_company: varchar("receiver_company", { length: 150 }).notNull(),
  receiver_contact: varchar("receiver_contact", { length: 100 }).notNull(),
  receiver_phone: varchar("receiver_phone", { length: 30 }).notNull(),
  receiver_address: text("receiver_address").notNull(),
  destination_city: varchar("destination_city", { length: 100 }).notNull(),
  destination_province: varchar("destination_province", { length: 100 }).notNull(),
  destination_postal_code: varchar("destination_postal_code", { length: 15 }),
  destination_lat: decimal("destination_lat", { precision: 10, scale: 8 }).default("-6.91474400"),
  destination_lng: decimal("destination_lng", { precision: 11, scale: 8 }).default("107.60981000"),

  // Service & Cargo Totals
  service_type: mysqlEnum("service_type", ["Reguler", "Express"]).default("Reguler").notNull(),
  service_name: varchar("service_name", { length: 100 }).default("Pengiriman Biasa").notNull(),
  has_insurance: boolean("has_insurance").default(false).notNull(),
  actual_weight_kg: decimal("actual_weight_kg", { precision: 10, scale: 2 }).default("0.00").notNull(),
  volume_weight_kg: decimal("volume_weight_kg", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total_colli: int("total_colli").default(1).notNull(),
  payment_method: mysqlEnum("payment_method", ["Prepaid", "COD", "Invoice"]).default("Prepaid").notNull(),
  notes: text("notes"),

  // Financials
  shipping_cost: decimal("shipping_cost", { precision: 14, scale: 2 }).default("0.00").notNull(),
  insurance_cost: decimal("insurance_cost", { precision: 14, scale: 2 }).default("0.00").notNull(),
  other_cost: decimal("other_cost", { precision: 14, scale: 2 }).default("0.00").notNull(),
  total_cost: decimal("total_cost", { precision: 14, scale: 2 }).default("0.00").notNull(),

  // Status, Checklists & Timestamps
  pre_departure_checked: boolean("pre_departure_checked").default(true).notNull(),
  status: mysqlEnum("status", [
    "tertunda",
    "dalam_pengiriman",
    "kendala",
    "terkirim",
    "komplain",
    "dibatalkan",
  ])
    .default("tertunda")
    .notNull(),
  has_active_issue: boolean("has_active_issue").default(false).notNull(),
  current_issue_note: varchar("current_issue_note", { length: 255 }),
  shipped_date: timestamp("shipped_date").defaultNow().notNull(),
  estimated_days: varchar("estimated_days", { length: 50 }).default("3 hari kerja"),
  estimated_arrival: timestamp("estimated_arrival"),
  received_date: timestamp("received_date"),
  received_by: varchar("received_by", { length: 100 }),
  inspected_by: varchar("inspected_by", { length: 100 }).default("Admin Kargo"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// 3.5. shipment_items (Barang Muatan)
export const shipment_items = mysqlTable("shipment_items", {
  id: serial("id").primaryKey(),
  shipment_id: bigint("shipment_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  item_name: varchar("item_name", { length: 200 }).notNull(),
  qty: int("qty").default(1).notNull(),
  weight_kg: decimal("weight_kg", { precision: 10, scale: 2 }).notNull(),
  item_value: decimal("item_value", { precision: 14, scale: 2 }).notNull(),
});

// 3.6. shipment_checkpoints (Log Polyline, Absen, Kendala, Foto Terima & Komplain)
export const shipment_checkpoints = mysqlTable("shipment_checkpoints", {
  id: serial("id").primaryKey(),
  shipment_id: bigint("shipment_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => shipments.id, { onDelete: "cascade" }),
  actor_role: mysqlEnum("actor_role", ["admin", "driver", "recipient"]).notNull(),
  checkpoint_type: mysqlEnum("checkpoint_type", [
    "created",
    "departure_selfie",
    "transit_update",
    "incident",
    "incident_resolved",
    "arrival_driver",
    "arrival_confirm",
    "complaint",
  ]).notNull(),
  status_label: varchar("status_label", { length: 150 }).notNull(),
  description: text("description"),
  photo_url: varchar("photo_url", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  driverFleets: many(fleets),
  driverShipments: many(shipments),
}));

export const fleetsRelations = relations(fleets, ({ one, many }) => ({
  defaultDriver: one(users, {
    fields: [fleets.default_driver_id],
    references: [users.id],
  }),
  shipments: many(shipments),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sentShipments: many(shipments, { relationName: "sender" }),
  receivedShipments: many(shipments, { relationName: "receiver" }),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  senderCustomer: one(customers, {
    fields: [shipments.sender_customer_id],
    references: [customers.id],
    relationName: "sender",
  }),
  receiverCustomer: one(customers, {
    fields: [shipments.receiver_customer_id],
    references: [customers.id],
    relationName: "receiver",
  }),
  fleet: one(fleets, {
    fields: [shipments.fleet_id],
    references: [fleets.id],
  }),
  driver: one(users, {
    fields: [shipments.driver_id],
    references: [users.id],
  }),
  items: many(shipment_items),
  checkpoints: many(shipment_checkpoints),
}));

export const shipmentItemsRelations = relations(shipment_items, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipment_items.shipment_id],
    references: [shipments.id],
  }),
}));

export const shipmentCheckpointsRelations = relations(shipment_checkpoints, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipment_checkpoints.shipment_id],
    references: [shipments.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Fleet = typeof fleets.$inferSelect;
export type NewFleet = typeof fleets.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;
export type ShipmentItem = typeof shipment_items.$inferSelect;
export type NewShipmentItem = typeof shipment_items.$inferInsert;
export type ShipmentCheckpoint = typeof shipment_checkpoints.$inferSelect;
export type NewShipmentCheckpoint = typeof shipment_checkpoints.$inferInsert;
