import { NextResponse } from "next/server";
import { db } from "@/db";
import { shipments, shipment_items, shipment_checkpoints, fleets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      sender_customer_id,
      receiver_customer_id,
      fleet_id,
      driver_id,
      sender_company,
      sender_contact,
      sender_phone,
      sender_address,
      origin_city,
      origin_province,
      origin_postal_code,
      receiver_company,
      receiver_contact,
      receiver_phone,
      receiver_address,
      destination_city,
      destination_province,
      destination_postal_code,
      service_type,
      service_name,
      has_insurance,
      actual_weight_kg,
      volume_weight_kg,
      total_colli,
      payment_method,
      notes,
      reference_po,
      shipping_cost,
      insurance_cost,
      other_cost,
      total_cost,
      items,
      pre_departure_checked,
    } = body;

    if (!sender_company || !receiver_company || !destination_city) {
      return NextResponse.json(
        { error: "Data pengirim, penerima, dan kota tujuan wajib diisi lengkap" },
        { status: 400 }
      );
    }

    // Generate unique Resi (e.g. KG918273645ID)
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    const generatedResi = `KG${randomDigits}ID`;

    // Generate 6-digit PIN
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate dates
    const now = new Date();
    const estDaysNumber = service_type === "Express" ? 1 : 3;
    const estimatedArrival = new Date(now.getTime() + estDaysNumber * 24 * 60 * 60 * 1000);

    // 1. Insert into shipments table
    const [insertedShipment] = await db.insert(shipments).values({
      resi: generatedResi,
      reference_po: reference_po || null,
      pin_code: generatedPin,
      sender_customer_id: sender_customer_id ? Number(sender_customer_id) : null,
      receiver_customer_id: receiver_customer_id ? Number(receiver_customer_id) : null,
      fleet_id: fleet_id ? Number(fleet_id) : null,
      driver_id: driver_id ? Number(driver_id) : null,
      sender_company: String(sender_company).trim(),
      sender_contact: String(sender_contact || "").trim(),
      sender_phone: String(sender_phone || "").trim(),
      sender_address: String(sender_address || "").trim(),
      origin_city: String(origin_city || "Jakarta").trim(),
      origin_province: String(origin_province || "DKI Jakarta").trim(),
      origin_postal_code: origin_postal_code ? String(origin_postal_code).trim() : null,
      origin_lat: "-6.20000000",
      origin_lng: "106.81666600",
      receiver_company: String(receiver_company).trim(),
      receiver_contact: String(receiver_contact || "").trim(),
      receiver_phone: String(receiver_phone || "").trim(),
      receiver_address: String(receiver_address || "").trim(),
      destination_city: String(destination_city).trim(),
      destination_province: String(destination_province || "").trim(),
      destination_postal_code: destination_postal_code ? String(destination_postal_code).trim() : null,
      destination_lat: "-6.91474400",
      destination_lng: "107.60981000",
      service_type: service_type || "Reguler",
      service_name: service_name || (service_type === "Express" ? "Express Kilat" : "Pengiriman Biasa"),
      has_insurance: Boolean(has_insurance),
      actual_weight_kg: String(actual_weight_kg || "1.00"),
      volume_weight_kg: String(volume_weight_kg || "1.00"),
      total_colli: Number(total_colli) || 1,
      payment_method: payment_method || "Prepaid",
      notes: notes || null,
      shipping_cost: String(shipping_cost || "0.00"),
      insurance_cost: String(insurance_cost || "0.00"),
      other_cost: String(other_cost || "0.00"),
      total_cost: String(total_cost || "0.00"),
      pre_departure_checked: Boolean(pre_departure_checked),
      status: "tertunda",
      has_active_issue: false,
      estimated_days: `${estDaysNumber} hari kerja`,
      estimated_arrival: estimatedArrival,
      inspected_by: "Admin Kargo",
    });

    const newShipmentId = insertedShipment.insertId;

    // 2. Insert shipment items
    if (Array.isArray(items) && items.length > 0) {
      const itemValues = items.map((it) => ({
        shipment_id: newShipmentId,
        item_name: String(it.item_name || "Barang Kargo"),
        qty: Number(it.qty) || 1,
        weight_kg: String(it.weight_kg || "1.00"),
        item_value: String(it.item_value || "0.00"),
      }));
      await db.insert(shipment_items).values(itemValues);
    } else {
      // Default single item
      await db.insert(shipment_items).values([
        {
          shipment_id: newShipmentId,
          item_name: "Muatan Umum / Kargo",
          qty: 1,
          weight_kg: String(actual_weight_kg || "1.00"),
          item_value: "1000000.00",
        },
      ]);
    }

    // 3. Insert initial checkpoint
    await db.insert(shipment_checkpoints).values([
      {
        shipment_id: newShipmentId,
        actor_role: "admin",
        checkpoint_type: "created",
        status_label: "Resi Dibuat & Diverifikasi Admin",
        description: "Admin Kargo telah memverifikasi muatan dan membuat surat jalan pengiriman.",
        latitude: "-6.20000000",
        longitude: "106.81666600",
      },
    ]);

    // 4. Optionally update fleet status to on_trip if assigned
    if (fleet_id) {
      await db
        .update(fleets)
        .set({ status: "on_trip" })
        .where(eq(fleets.id, Number(fleet_id)));
    }

    return NextResponse.json({
      success: true,
      resi: generatedResi,
      shipmentId: newShipmentId,
      redirectUrl: `/admin/shipments/${generatedResi}/print`,
    });
  } catch (error) {
    console.error("POST /api/shipments error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pengiriman kargo baru" },
      { status: 500 }
    );
  }
}
