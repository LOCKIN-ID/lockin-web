/**
 * The three plans, and the feature rows `/pricing` compares them on.
 *
 * Prices are the deck's own ladder (Beginner free, Pro Rp49.000 for 30 days, Lifetime
 * Rp399.000) and nothing here is invented: every feature row is a thing the product
 * actually does, and each one names the surface that proves it.
 *
 * This module is content, not data: it is the single place a price is written down, and
 * `prisma/seed.ts` shares the same numbers for the book rows. `planToItem` converts a plan
 * into the `OrderItem` shape `src/lib/payments/order.ts` prices server-side, so the browser
 * never sends a price.
 */

import type { BookTier } from "./types";

export type PlanId = "free" | "bundle" | "booster" | "pro" | "lifetime";

/** `OrderItem.kind` for a plan, verbatim from the schema comment. */
export type PlanItemKind = "book" | "pro_subscription" | "lifetime";

export interface Plan {
  id: PlanId;
  title: string;
  badge?: string;
  badgeTone?: "default" | "success" | "warning" | "forest";
  /** What the reader gets, in one sentence. */
  blurb: string;
  priceIdr: number;
  compareAtIdr: number | null;
  /** "akun", "paket seri", "100 interaksi", "bulan", "once", "forever". */
  period: string;
  kind: PlanItemKind;
  /** The book slug for a single-book plan, `""` for the whole catalogue. */
  refId: string;
  /** The `Entitlement.kind` this plan grants when it settles. */
  grants: "book" | "all_books" | "pro";
  /** The days the entitlement lasts; `null` is a lifetime grant. */
  durationDays: number | null;
  /** What the reader can open. */
  includes: string[];
  /** What the plan deliberately leaves out: a row with no caveat reads as a lie. */
  excludes: string[];
  cta: string;
  featured?: boolean;
}

export interface CustomService {
  number: string;
  title: string;
  badge: string;
  badgeTone: "custom" | "nego";
  description: string;
  accentColor: string;
}

export const CUSTOM_SERVICES: CustomService[] = [
  {
    number: "1.",
    title: "Paket Konversi Diktat Praktikum Kampus",
    badge: "HARGA DISKUSI / CUSTOM",
    badgeTone: "custom",
    description: "Mengubah buku panduan praktikum tebal (50-100 halaman) menjadi seri micro-learning ringkas terintegrasi QR Code dan sandbox peramban. Cocok untuk mata kuliah Otomasi, Pemrograman Web, dan IoT.",
    accentColor: "var(--color-success)",
  },
  {
    number: "2.",
    title: "Paket Bootcamp & Pelatihan Singkat UKM",
    badge: "HARGA DISKUSI / CUSTOM",
    badgeTone: "custom",
    description: "Penyusunan kurikulum kilat bersiklus 3-7 hari lengkap dengan bank kuis interaktif, template proyek koding akhir, serta bot asisten Telegram pendukung kegiatan praktikum online.",
    accentColor: "#0284c7",
  },
  {
    number: "3.",
    title: "Lisensi Institusi & Integrasi Silabus Khusus",
    badge: "CUSTOM QUOTE / NEGO",
    badgeTone: "nego",
    description: "Penyediaan paket modul custom sesuai topik riset/spesifik kampus (misal: SCADA, PLC merk spesifik, atau Python Computer Vision) lengkap dengan pendampingan teknis dan kuis terstruktur.",
    accentColor: "#d97706",
  },
];

export const PLANS: Plan[] = [
  {
    id: "free",
    title: "Starter / Free",
    badge: "AKSES TERBUKA",
    badgeTone: "default",
    blurb: "Akses gratis modul 01 (Beginner), cheatsheet sintaks esensial, sandbox web, dan kuota 10 petunjuk AI per hari.",
    priceIdr: 0,
    compareAtIdr: null,
    period: "akun",
    kind: "book",
    refId: "beginner",
    grants: "book",
    durationDays: null,
    includes: [
      "Modul 01 PDF Interaktif",
      "AI Tutor: 10 Hint / Hari",
    ],
    excludes: ["Modul lanjutan Intermediate & Expert", "Reward XP redemptions"],
    cta: "Mulai Gratis",
  },
  {
    id: "bundle",
    title: "Paket Bundle Seri E-Book",
    badge: "PALING HEMAT",
    badgeTone: "success",
    blurb: "Akses seluruh seri lengkap Modul 01 sampai modul terakhir dalam satu paket hemat (tidak perlu beli satuan), bonus akses playground.",
    priceIdr: 20000,
    compareAtIdr: 50000,
    period: "paket seri",
    kind: "lifetime",
    refId: "",
    grants: "all_books",
    durationDays: null,
    includes: [
      "Paket Seri Lengkap (Modul 01-Akhir)",
      "Termasuk Kuota AI Tutor Dasar",
    ],
    excludes: ["Unlimited AI prompt streaming"],
    cta: "Beli Paket Bundle",
    featured: true,
  },
  {
    id: "booster",
    title: "AI Tutor Token Booster",
    badge: "ADD-ON KUOTA AI",
    badgeTone: "warning",
    blurb: "Bagi pembelajar yang membutuhkan bantuan ekstra tanpa ingin berlangganan bulanan. Token tidak ada masa hangus.",
    priceIdr: 10000,
    compareAtIdr: null,
    period: "100 interaksi",
    kind: "lifetime",
    refId: "booster",
    grants: "all_books",
    durationDays: null,
    includes: [
      "100 Kuota Prompt Socratic AI",
      "Masa Aktif Selamanya (No Expiry)",
    ],
    excludes: ["Akses materi e-book tidak termasuk"],
    cta: "Beli Kuota AI",
  },
  {
    id: "pro",
    title: "Ekosistem Web Pro",
    badge: "Akses Maksimal",
    badgeTone: "forest",
    blurb: "Akses tanpa batas (unlimited) ke Socratic AI Tutor, seluruh materi e-book, cloud playground lanjutan, dan sistem email streak.",
    priceIdr: 49000,
    compareAtIdr: 99000,
    period: "bulan",
    kind: "pro_subscription",
    refId: "",
    grants: "pro",
    durationDays: 30,
    includes: [
      "Unlimited Socratic AI Tutor",
      "Cloud Playground & Email Streak",
    ],
    excludes: ["Masa aktif berjalan 30 hari"],
    cta: "Langganan Pro",
  },
  {
    id: "lifetime",
    title: "Lifetime",
    badge: "LIFETIME",
    blurb: "All three books, kept. Later editions land in your library.",
    priceIdr: 399000,
    compareAtIdr: 497000,
    period: "once",
    kind: "lifetime",
    refId: "",
    grants: "all_books",
    durationDays: null,
    includes: [
      "All three books, no expiry",
      "Every future edition of those titles",
    ],
    excludes: [],
    cta: "Buy once",
  },
];
export function planById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

/** The `OrderItem` shape `createOrder` accepts. The price comes from the plan, never the client. */
export function planToItem(plan: Plan): {
  kind: PlanItemKind;
  refId: string;
  titleSnapshot: string;
  priceIdr: number;
  qty: number;
} {
  return {
    kind: plan.kind,
    refId: plan.refId,
    titleSnapshot: `LOCK.IN ${plan.title}`,
    priceIdr: plan.priceIdr,
    qty: 1,
  };
}

/** Feature rows for the comparison table. `value` is per plan id; `null` renders as a dash. */
export interface FeatureRow {
  label: string;
  /** Where the reader can go and check, phrased as the surface, not a promise. */
  proof: string;
  value: Partial<Record<PlanId, string | null>>;
}

export const PRICELIST_PLANS: Plan[] = PLANS.filter((p) =>
  ["free", "bundle", "pro", "booster"].includes(p.id),
);

export interface MatrixCategory {
  category: string;
  features: Array<{
    name: string;
    description: string;
    values: Partial<Record<PlanId, string | boolean>>;
  }>;
}

export const PRICING_MATRIX: MatrixCategory[] = [
  {
    category: "Materi & Kurikulum E-Book",
    features: [
      {
        name: "Akses Modul 01 (Beginner)",
        description: "Dasar web HTML, CSS, dan latihan deploy pertama.",
        values: { free: true, bundle: true, booster: false, pro: true, lifetime: true },
      },
      {
        name: "Seluruh Seri Lengkap (Modul 01-Akhir)",
        description: "Kurikulum lengkap dari pemula hingga arsitektur sistem.",
        values: { free: false, bundle: true, booster: false, pro: "30 Hari", lifetime: true },
      },
      {
        name: "Format PDF Interaktif & Cheatsheet",
        description: "Buku digital ringkas 20 halaman per modul siap baca dan cetak.",
        values: { free: "Modul 01", bundle: "Semua Seri", booster: false, pro: "Semua Seri", lifetime: "Semua Seri" },
      },
      {
        name: "Update Revisi & Edisi Masa Depan",
        description: "Setiap pembaruan kurikulum otomatis masuk ke akun Anda.",
        values: { free: false, bundle: "Selamanya", booster: false, pro: "Selama Aktif", lifetime: "Selamanya" },
      },
    ],
  },
  {
    category: "Sandbox & Runtime Peramban",
    features: [
      {
        name: "Sandbox 4 Bahasa (Python, JS, Shell, HTML)",
        description: "Eksekusi kode langsung di tab browser dengan WebAssembly.",
        values: { free: true, bundle: true, booster: false, pro: "Cloud Pro", lifetime: true },
      },
      {
        name: "Tantangan QR Code Interaktif",
        description: "Integrasi latihan kuis fisik dari buku cetak ke web.",
        values: { free: "3 Quest", bundle: "Semua Quest", booster: false, pro: "Semua Quest", lifetime: "Semua Quest" },
      },
      {
        name: "Starter Repository GitHub",
        description: "Template proyek nyata yang diuji otomatis saat Anda push.",
        values: { free: false, bundle: true, booster: false, pro: true, lifetime: true },
      },
    ],
  },
  {
    category: "Socratic AI Tutor",
    features: [
      {
        name: "Kuota Pertanyaan AI Coach",
        description: "Pelatih AI yang membimbing langkah demi langkah tanpa membocorkan jawaban.",
        values: { free: "10 Hint / Hari", bundle: "Kuota Dasar", booster: "100 Interaksi", pro: "Tanpa Batas", lifetime: "Kuota Penuh" },
      },
      {
        name: "Masa Berlaku Kuota AI",
        description: "Masa aktif kuota token interaksi AI.",
        values: { free: "Reset Harian", bundle: "Selamanya", booster: "Tanpa Hangus", pro: "30 Hari", lifetime: "Selamanya" },
      },
      {
        name: "Dukungan Hint Berjenjang (L1-L4)",
        description: "Hint berjenjang dari pemahaman soal hingga titik kesalahan kode.",
        values: { free: true, bundle: true, booster: true, pro: "Prioritas", lifetime: true },
      },
    ],
  },
  {
    category: "Gamifikasi, XP & Komunitas",
    features: [
      {
        name: "Sistem Daily Streak & XP Ledger",
        description: "Kumpulkan XP setiap menyelesaikan checkpoint dan quest.",
        values: { free: true, bundle: true, booster: false, pro: true, lifetime: true },
      },
      {
        name: "Tukar XP ke Rewards & Voucher",
        description: "Gunakan akumulasi XP untuk klaim cheatsheet dan diskon.",
        values: { free: false, bundle: true, booster: false, pro: true, lifetime: true },
      },
      {
        name: "Email Streak Digest",
        description: "Pengingat progres belajar berkala untuk menjaga konsistensi.",
        values: { free: false, bundle: false, booster: false, pro: true, lifetime: true },
      },
    ],
  },
];
export const PLAN_FEATURES: FeatureRow[] = [
  {
    label: "Books open",
    proof: "the library",
    value: { free: "Beginner", pro: "All three", lifetime: "All three, kept" },
  },
  {
    label: "Print pages",
    proof: "the PDF tab in any chapter",
    value: { free: "20", pro: "60", lifetime: "60" },
  },
  {
    label: "Levels",
    proof: "the books",
    value: { free: "Beginner", pro: "Beginner, Intermediate, Expert", lifetime: "Beginner, Intermediate, Expert" },
  },
  {
    label: "Playground languages",
    proof: "the playground",
    value: { free: "HTML, JS, Python, Shell", pro: "HTML, JS, Python, Shell", lifetime: "HTML, JS, Python, Shell" },
  },
  {
    label: "Socratic coach",
    proof: "the coach tab in the reader",
    value: { free: "On the Beginner chapters", pro: "On every chapter", lifetime: "On every chapter" },
  },
  {
    label: "QR quests and quizzes",
    proof: "the quests page",
    value: { free: "Three Beginner quests", pro: "All nine", lifetime: "All nine" },
  },
  {
    label: "XP, badges and rewards",
    proof: "the badges and rewards pages",
    value: { free: "XP and badges", pro: "XP, badges and redemptions", lifetime: "XP, badges and redemptions" },
  },
  {
    label: "Tips by e-mail",
    proof: "the settings page",
    value: { free: "Day 1, 3 and 7", pro: "Day 1, 3 and 7, plus the weekly digest", lifetime: "Day 1, 3 and 7, plus the weekly digest" },
  },
];

/** The tier a book slug belongs to, for the catalogue's price column. */
export function tierOf(slug: string): BookTier | undefined {
  if (slug === "beginner" || slug === "intermediate" || slug === "expert") return slug;
  return undefined;
}

export const BOOK_PRICES: Record<BookTier, number> = {
  beginner: 0,
  intermediate: 99000,
  expert: 149000,
};

export function bookPrice(slug: string): number {
  if (slug === "beginner") return 0;
  if (slug === "intermediate") return 99000;
  if (slug === "expert") return 149000;
  return 0;
}
