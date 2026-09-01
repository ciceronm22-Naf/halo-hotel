import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
} from "drizzle-orm/pg-core";

/* =========================
   HÔTELS
========================= */

export const hotels = pgTable("hotels", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),

  address: text("address"),

  phone: varchar("phone", { length: 30 }),

  email: varchar("email", { length: 150 }),

  active: boolean("active").default(true).notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   UTILISATEURS
========================= */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  hotelId: uuid("hotel_id")
    .references(() => hotels.id),

  firstName: varchar("first_name", { length: 100 }).notNull(),

  lastName: varchar("last_name", { length: 100 }).notNull(),

  email: varchar("email", { length: 150 }).notNull().unique(),

  passwordHash: text("password_hash").notNull(),

  role: varchar("role", { length: 30 }).notNull(),

  active: boolean("active").default(true).notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   SESSIONS
========================= */

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),

  tokenHash: text("token_hash").notNull().unique(),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   INVITATIONS
========================= */

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),

  hotelId: uuid("hotel_id")
    .references(() => hotels.id),

  email: varchar("email", { length: 150 }).notNull(),

  tokenHash: text("token_hash").notNull().unique(),

  expiresAt: timestamp("expires_at").notNull(),

  used: boolean("used").default(false).notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   CHAMBRES
========================= */

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),

  hotelId: uuid("hotel_id")
    .references(() => hotels.id)
    .notNull(),

  number: varchar("number", { length: 20 }).notNull(),

  type: varchar("type", { length: 50 }),

  price: decimal("price", {
    precision: 12,
    scale: 2,
  }),

  status: varchar("status", { length: 30 })
    .default("available")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   CLIENTS
========================= */

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),

  hotelId: uuid("hotel_id")
    .references(() => hotels.id)
    .notNull(),

  firstName: varchar("first_name", { length: 100 }).notNull(),

  lastName: varchar("last_name", { length: 100 }).notNull(),

  phone: varchar("phone", { length: 30 }),

  email: varchar("email", { length: 150 }),

  documentType: varchar("document_type", { length: 50 }),

  documentNumber: varchar("document_number", { length: 100 }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   RÉSERVATIONS
========================= */

export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),

  hotelId: uuid("hotel_id")
    .references(() => hotels.id)
    .notNull(),

  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),

  roomId: uuid("room_id")
    .references(() => rooms.id)
    .notNull(),

  checkIn: timestamp("check_in").notNull(),

  checkOut: timestamp("check_out").notNull(),

  status: varchar("status", { length: 30 })
    .default("pending")
    .notNull(),

  totalAmount: decimal("total_amount", {
    precision: 12,
    scale: 2,
  }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   PAIEMENTS
========================= */

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),

  hotelId: uuid("hotel_id")
    .references(() => hotels.id)
    .notNull(),

  reservationId: uuid("reservation_id")
    .references(() => reservations.id)
    .notNull(),

  amount: decimal("amount", {
    precision: 12,
    scale: 2,
  }).notNull(),

  method: varchar("method", { length: 30 }).notNull(),

  status: varchar("status", { length: 30 })
    .default("completed")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
