import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_checkpoints } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resi: string }> }
) {
  try {
    const { resi } = await params;
    const body = await request.json();
    const { phone_last4, reported_by, issue_type, description, photo_url } = body;

    const cleanResi = resi ? resi.trim().toUpperCase() : "";

    const [shipment] = await db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        pin_code: shipments.pin_code,
        receiver_phone: shipments.receiver_phone,
      })
      .from(shipments)
      .where(eq(shipments.resi, cleanResi))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: "Resi tidak ditemukan" }, { status: 404 });
    }

    // Verify authentication code: can be 4 digits last of receiver phone OR 6-digit PIN code on resi
    const cleanDbPhone = (shipment.receiver_phone || "").replace(/\D/g, "");
    const cleanDbPin = (shipment.pin_code || "").trim();
    const cleanInputCode = String(phone_last4 || "").trim();

    const isMatchPhoneLast4 =
      cleanInputCode.length >= 4 && cleanDbPhone.endsWith(cleanInputCode);
    const isMatchPin =
      cleanDbPin && cleanInputCode.toUpperCase() === cleanDbPin.toUpperCase();

    if (!isMatchPhoneLast4 && !isMatchPin) {
      return NextResponse.json(
        {
          error:
            "Kode verifikasi salah. Masukkan 4 digit terakhir nomor telepon penerima atau 6 digit PIN Resi yang tertera di surat jalan.",
        },
        { status: 403 }
      );
    }

    if (!description || !issue_type) {
      return NextResponse.json(
        { error: "Jenis keluhan dan deskripsi wajib diisi lengkap" },
        { status: 400 }
      );
    }

    const now = new Date();
    const summaryNote = `[${issue_type}] ${description.slice(0, 150)}`;

    // 1. Update shipment status to komplain
    await db
      .update(shipments)
      .set({
        status: "komplain",
        has_active_issue: true,
        current_issue_note: summaryNote,
      })
      .where(eq(shipments.id, shipment.id));

    // 2. Insert complaint checkpoint
    await db.insert(shipment_checkpoints).values({
      shipment_id: shipment.id,
      actor_role: "recipient",
      checkpoint_type: "complaint",
      status_label: `Keluhan Penerima: ${issue_type}`,
      description: `Dilaporkan oleh: ${reported_by || "Penerima"}. Detail: ${description}`,
      photo_url: photo_url || null,
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      message: "Laporan komplain berhasil dicatat dan sedang ditinjau tim operasional",
    });
  } catch (error) {
    console.error("Recipient complaint error:", error);
    return NextResponse.json(
      { error: "Gagal memproses laporan keluhan" },
      { status: 500 }
    );
  }
}
