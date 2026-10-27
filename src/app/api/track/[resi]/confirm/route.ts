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
    const { phone_last4, received_by, photo_url, notes } = body;

    const cleanResi = resi ? resi.trim().toUpperCase() : "";

    const [shipment] = await db
      .select({
        id: shipments.id,
        resi: shipments.resi,
        pin_code: shipments.pin_code,
        receiver_phone: shipments.receiver_phone,
        status: shipments.status,
        receiver_company: shipments.receiver_company,
      })
      .from(shipments)
      .where(eq(shipments.resi, cleanResi))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: "Resi tidak ditemukan" }, { status: 404 });
    }

    // Validasi: Supir harus sudah lapor tiba di tujuan (arrival_driver) terlebih dahulu
    const [arrivalCheck] = await db
      .select({ id: shipment_checkpoints.id })
      .from(shipment_checkpoints)
      .where(eq(shipment_checkpoints.shipment_id, shipment.id))
      .where(eq(shipment_checkpoints.checkpoint_type, 'arrival_driver'))
      .limit(1);

    if (!arrivalCheck) {
      return NextResponse.json(
        { error: 'Armada supir belum sampai di lokasi tujuan. Konfirmasi penerimaan baru dapat dilakukan setelah armada tiba di tujuan.' },
        { status: 400 }
      );
    }

    if (shipment.status === "terkirim") {
      return NextResponse.json(
        { error: "Pengiriman ini sudah dikonfirmasi selesai diterima sebelumnya" },
        { status: 400 }
      );
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

    if (!received_by || !photo_url) {
      return NextResponse.json(
        { error: "Nama penerima dan foto bukti serah terima wajib dilampirkan" },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Update shipment status to terkirim
    await db
      .update(shipments)
      .set({
        status: "terkirim",
        received_by: String(received_by).trim(),
        received_date: now,
        has_active_issue: false,
      })
      .where(eq(shipments.id, shipment.id));

    // 2. Insert checkpoint
    await db.insert(shipment_checkpoints).values({
      shipment_id: shipment.id,
      actor_role: "recipient",
      checkpoint_type: "arrival_confirm",
      status_label: "Barang Diterima & Dikonfirmasi Penerima",
      description: `Diterima oleh ${String(received_by).trim()}. ${notes ? `Catatan: ${notes}` : "Kondisi paket lengkap dan sesuai."}`,
      photo_url: photo_url,
      latitude: "-6.91474400",
      longitude: "107.60981000",
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      message: "Konfirmasi serah terima barang berhasil dicatat",
    });
  } catch (error) {
    console.error("Recipient confirm error:", error);
    return NextResponse.json(
      { error: "Gagal memproses konfirmasi penerimaan" },
      { status: 500 }
    );
  }
}
