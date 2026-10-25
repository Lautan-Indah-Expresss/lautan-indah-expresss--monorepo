import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(customers).orderBy(desc(customers.created_at));
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pelanggan B2B" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_name, contact_name, phone, address, city, province, postal_code } = body;

    if (!company_name || !contact_name || !phone || !address || !city) {
      return NextResponse.json(
        { error: "Nama perusahaan, kontak, telepon, alamat, dan kota wajib diisi" },
        { status: 400 }
      );
    }

    const [inserted] = await db.insert(customers).values({
      company_name: String(company_name).trim(),
      contact_name: String(contact_name).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      province: String(province || "DKI Jakarta").trim(),
      postal_code: String(postal_code || "").trim(),
    });

    const newCustomerId = inserted.insertId;

    return NextResponse.json({
      success: true,
      message: "Data pelanggan berhasil disimpan",
      customerId: newCustomerId,
    });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data pelanggan baru" },
      { status: 500 }
    );
  }
}
