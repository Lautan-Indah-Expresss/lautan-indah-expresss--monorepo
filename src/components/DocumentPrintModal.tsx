import React, { useState } from 'react';
import { Printer, Download, X, FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Shipment } from '../types';
import { BrandLogo } from './BrandLogo';

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  initialDocumentType?: 'form_sop' | 'surat_jalan';
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  isOpen,
  onClose,
  shipment,
  initialDocumentType = 'form_sop',
}) => {
  const [docType, setDocType] = useState<'form_sop' | 'surat_jalan'>(initialDocumentType);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[96vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print px-5 py-3.5 bg-gradient-to-r from-blue-950 to-teal-950 text-white flex items-center justify-between border-b border-teal-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Dokumen Cetak &amp; PDF Resmi</h3>
              <p className="text-xs text-slate-300">
                PT LAUTAN INDAH Express • {shipment.sjNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Document Selector */}
            <div className="flex bg-blue-900/60 p-0.5 rounded-lg border border-teal-500/30 text-xs font-medium">
              <button
                type="button"
                onClick={() => setDocType('form_sop')}
                className={`px-3 py-1 rounded-md transition-all ${
                  docType === 'form_sop' ? 'bg-teal-500 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Form SOP Monitoring (A-D)
              </button>
              <button
                type="button"
                onClick={() => setDocType('surat_jalan')}
                className={`px-3 py-1 rounded-md transition-all ${
                  docType === 'surat_jalan' ? 'bg-teal-500 text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Surat Jalan (SJ)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak / PDF
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="p-4 sm:p-10 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-900 print-container">
          {/* KOP SURAT RESMI */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandLogo size="lg" showSubtitle={false} />
                <div>
                  <h1 className="text-xl font-black tracking-tight text-blue-950 uppercase leading-none">
                    PT LAUTAN INDAH Express
                  </h1>
                  <p className="text-[11px] font-bold tracking-wide text-teal-800 mt-0.5 uppercase">
                    Jasa Ekspedisi &amp; Transportasi Cargo Antar Kota &amp; Lintas Pulau
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Jl. Pelabuhan Tanjung Priok Raya No. 108, Jakarta Utara 14310 • Telp: (021) 4390-8812 • WhatsApp: 0811-9876-543
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Email: operasional@lautanindah-express.co.id • Izin Kemenhub: SIUJPT/EXP-DKI/2021/8849
                  </p>
                </div>
              </div>

              {/* Barcode / Document Stamp Box */}
              <div className="text-right border border-slate-300 rounded p-2 bg-slate-50 shrink-0">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Nomor Registrasi</div>
                <div className="font-mono font-black text-sm text-slate-900 tracking-wider">
                  {shipment.sjNumber}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Tgl: {shipment.date}
                </div>
              </div>
            </div>
            {/* Double decorative rule */}
            <div className="mt-2 border-b border-slate-900 h-0.5"></div>
          </div>

          {/* DOCUMENT BODY 1: FORM MONITORING SOP (FORMAT A-D) */}
          {docType === 'form_sop' && (
            <div className="space-y-4 text-xs">
              <div className="text-center py-1 bg-slate-100 border border-slate-300 rounded font-black text-sm uppercase text-slate-900 tracking-wide">
                FORM MONITORING PENGIRIMAN &amp; PENGECEKAN BARANG (SOP-LOG-04)
              </div>

              {/* BAGIAN A: DATA ARMADA & DRIVER */}
              <div className="border border-slate-300 rounded-md overflow-hidden">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Bagian A: Data Armada &amp; Pengemudi</span>
                  <span className="font-mono text-[10px] text-teal-300">Status: {shipment.status}</span>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/50">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tanggal Muat</span>
                    <span className="font-bold text-slate-800">{shipment.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Jam Berangkat</span>
                    <span className="font-bold text-slate-800">{shipment.departedAt || shipment.loadedAt || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">No. Polisi Armada</span>
                    <span className="font-bold text-blue-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                      {shipment.plateNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">No. Surat Jalan</span>
                    <span className="font-black text-teal-800 font-mono">{shipment.sjNumber}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Nama Driver</span>
                    <span className="font-bold text-slate-800">{shipment.driverName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">No. Handphone Driver</span>
                    <span className="font-mono text-slate-700">{shipment.driverPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tujuan / Gudang Penerima</span>
                    <span className="font-bold text-slate-900">
                      {shipment.destination} ({shipment.destinationCity})
                    </span>
                  </div>
                </div>
              </div>

              {/* BAGIAN B: CEKLIST KONDISI ARMADA SEBELUM MUAT */}
              <div className="border border-slate-300 rounded-md overflow-hidden">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 text-[11px] uppercase tracking-wider">
                  Bagian B: Ceklist Kelayakan Armada Sebelum Muat
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase text-slate-600">
                      <th className="p-2 border-r border-slate-300 w-12 text-center">No</th>
                      <th className="p-2 border-r border-slate-300">Item Pemeriksaan Armada</th>
                      <th className="p-2 border-r border-slate-300 w-28 text-center">Kondisi</th>
                      <th className="p-2">Catatan Pemeriksaan Checker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 text-center font-bold border-r border-slate-300">1</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-800">
                        Kebersihan Dalam Box / Bak Armada
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            shipment.checklist.cleanliness.status === 'Baik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {shipment.checklist.cleanliness.status}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700">{shipment.checklist.cleanliness.notes || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-center font-bold border-r border-slate-300">2</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-800">
                        Terpal / Segel Kontainer / Gembok Box
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            shipment.checklist.tarpaulinSeal.status === 'Baik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {shipment.checklist.tarpaulinSeal.status}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700">{shipment.checklist.tarpaulinSeal.notes || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-center font-bold border-r border-slate-300">3</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-800">
                        Ban, Lampu &amp; Kelayakan Fisik Armada
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            shipment.checklist.tiresRoadworthy.status === 'Baik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {shipment.checklist.tiresRoadworthy.status}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700">{shipment.checklist.tiresRoadworthy.notes || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* BAGIAN C: DETAIL MUAT VS TERIMA */}
              <div className="border border-slate-300 rounded-md overflow-hidden">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Bagian C: Detail Pengecekan Barang (Muat vs Terima)</span>
                  <span className="text-[10px] text-teal-300 font-semibold">
                    Total Muat: {shipment.totalQtyLoaded} Koli | Terima: {shipment.totalQtyReceived ?? '-'} Koli
                  </span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase text-slate-600">
                      <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                      <th className="p-2 border-r border-slate-300 w-24">Kode</th>
                      <th className="p-2 border-r border-slate-300">Nama Barang / Deskripsi</th>
                      <th className="p-2 border-r border-slate-300 w-20 text-center">Qty Muat</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">Kondisi Muat</th>
                      <th className="p-2 border-r border-slate-300 w-20 text-center">Qty Terima</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">Kondisi Terima</th>
                      <th className="p-2 border-r border-slate-300 w-16 text-center">Selisih</th>
                      <th className="p-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {shipment.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 text-center font-medium border-r border-slate-300">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-[11px] text-slate-600">
                          {item.code}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">
                          {item.qtyLoaded}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-medium">
                            {item.conditionLoaded}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">
                          {item.qtyReceived !== undefined ? item.qtyReceived : '-'}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center">
                          {item.conditionReceived ? (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                item.conditionReceived === 'Bagus'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.conditionReceived}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">
                          {item.discrepancy !== undefined ? (
                            <span
                              className={
                                item.discrepancy < 0
                                  ? 'text-rose-600 font-bold'
                                  : item.discrepancy > 0
                                  ? 'text-amber-600 font-bold'
                                  : 'text-slate-600'
                              }
                            >
                              {item.discrepancy === 0 ? '0' : item.discrepancy}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2 text-[11px] text-slate-600">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td colSpan={3} className="p-2 text-right border-r border-slate-300">
                        TOTAL KOLI:
                      </td>
                      <td className="p-2 text-center text-blue-900 border-r border-slate-300">
                        {shipment.totalQtyLoaded}
                      </td>
                      <td className="border-r border-slate-300"></td>
                      <td className="p-2 text-center text-blue-900 border-r border-slate-300">
                        {shipment.totalQtyReceived ?? '-'}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* BERITA ACARA CLAIM (JIKA ADA) */}
              {shipment.claimReport && (
                <div className="border border-rose-300 rounded-md p-3 bg-rose-50/70 text-rose-950">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    BERITA ACARA KLAIM: {shipment.claimReport.baNumber} ({shipment.claimReport.status})
                  </div>
                  <p className="text-[11px] mt-1 text-rose-800">{shipment.claimReport.description}</p>
                </div>
              )}

              {/* BAGIAN D: KOLOM TANDA TANGAN 3 PIHAK */}
              <div className="border border-slate-300 rounded-md overflow-hidden mt-3">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 text-[11px] uppercase tracking-wider">
                  Bagian D: Pengesahan &amp; Tanda Tangan Tiga Pihak (SOP Logistik)
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-300 text-center bg-white">
                  {/* Pihak 1: Checker Muat */}
                  <div className="p-3 flex flex-col justify-between h-36">
                    <div className="text-[10px] font-bold uppercase text-slate-600">
                      1. Checker Muat (Gudang Asal)
                    </div>
                    <div className="my-1 flex items-center justify-center h-16">
                      {shipment.checkerSignature ? (
                        <img
                          src={shipment.checkerSignature}
                          alt="Tanda Tangan Checker"
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">(Belum ditandatangani)</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 underline">{shipment.checkerName}</div>
                      <div className="text-[9px] text-slate-500">Checker Operasional</div>
                    </div>
                  </div>

                  {/* Pihak 2: Pengemudi / Driver */}
                  <div className="p-3 flex flex-col justify-between h-36">
                    <div className="text-[10px] font-bold uppercase text-slate-600">
                      2. Pengemudi / Sopir
                    </div>
                    <div className="my-1 flex items-center justify-center h-16">
                      {shipment.driverSignature ? (
                        <img
                          src={shipment.driverSignature}
                          alt="Tanda Tangan Driver"
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">(Belum ditandatangani)</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 underline">{shipment.driverName}</div>
                      <div className="text-[9px] text-slate-500">Pengemudi Armada {shipment.plateNumber}</div>
                    </div>
                  </div>

                  {/* Pihak 3: Penerima / Gudang Tujuan */}
                  <div className="p-3 flex flex-col justify-between h-36">
                    <div className="text-[10px] font-bold uppercase text-slate-600">
                      3. Checker Bongkar / Penerima
                    </div>
                    <div className="my-1 flex items-center justify-center h-16">
                      {shipment.recipientSignature ? (
                        <img
                          src={shipment.recipientSignature}
                          alt="Tanda Tangan Penerima"
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">(Menunggu Penerimaan)</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 underline">{shipment.recipientName}</div>
                      <div className="text-[9px] text-slate-500">{shipment.destination}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT BODY 2: SURAT JALAN PENGIRIMAN RESMI */}
          {docType === 'surat_jalan' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border border-slate-300 rounded p-2.5 bg-slate-50">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase">SURAT JALAN PENGIRIMAN BARANG</h2>
                  <p className="text-[10px] text-slate-600 font-medium">Dokumen Sah Pengantar Angkutan Darat &amp; Penyeberangan</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">NO. SURAT JALAN</div>
                  <div className="text-lg font-black font-mono text-teal-800">{shipment.sjNumber}</div>
                </div>
              </div>

              {/* Data Penerima & Pengirim Grid */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-md p-3.5 bg-white">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Pengirim (Asal):</div>
                  <div className="font-bold text-slate-900">PT LAUTAN INDAH Express (Hub Jakarta)</div>
                  <div className="text-slate-600 text-[11px]">Kawasan Pergudangan Marunda Center, Cilincing, Jakarta Utara</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">Telp: 021-4390-8812</div>
                </div>

                <div className="border-l border-slate-200 pl-4">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Kepada Yth. (Penerima):</div>
                  <div className="font-bold text-slate-900">{shipment.recipientName}</div>
                  <div className="text-slate-800 font-medium">{shipment.destination}</div>
                  <div className="text-slate-600 text-[11px]">{shipment.destinationAddress}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">Kontak: {shipment.recipientPhone}</div>
                </div>
              </div>

              {/* Metadata Armada */}
              <div className="grid grid-cols-4 gap-2 bg-slate-100 p-2.5 rounded border border-slate-200 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">No. Polisi:</span>
                  <span className="font-mono font-bold text-slate-900">{shipment.plateNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Nama Driver:</span>
                  <span className="font-bold text-slate-900">{shipment.driverName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Tanggal Kirim:</span>
                  <span className="font-bold text-slate-900">{shipment.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Total Koli:</span>
                  <span className="font-bold text-teal-800">{shipment.totalQtyLoaded} Koli</span>
                </div>
              </div>

              {/* Daftar Barang Surat Jalan */}
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-200/80 text-[10px] uppercase text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                    <th className="p-2 border-r border-slate-300 w-28">Kode Barang</th>
                    <th className="p-2 border-r border-slate-300">Nama &amp; Jenis Muatan Barang</th>
                    <th className="p-2 border-r border-slate-300 w-24 text-center">Jumlah Koli</th>
                    <th className="p-2 border-r border-slate-300 w-24 text-center">Kondisi Muat</th>
                    <th className="p-2">Keterangan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {shipment.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="p-2 text-center font-bold border-r border-slate-300">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-300 font-mono text-[11px] text-slate-700">{it.code}</td>
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-900">{it.name}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-900">{it.qtyLoaded}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-medium text-slate-700">{it.conditionLoaded}</td>
                      <td className="p-2 text-slate-600 text-[11px]">{it.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t border-slate-300">
                    <td colSpan={3} className="p-2 text-right border-r border-slate-300 uppercase">
                      Total Muatan Koli:
                    </td>
                    <td className="p-2 text-center text-teal-800 border-r border-slate-300 text-sm">
                      {shipment.totalQtyLoaded} Koli
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>

              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-600 leading-relaxed">
                <strong>Catatan Pengiriman:</strong> Barang diterima dalam kondisi baik, segel utuh dan jumlah sesuai Surat Jalan. Segala bentuk komplain atau selisih wajib melampirkan Berita Acara dan foto bukti dalam tempo 1x24 jam sejak pembongkaran.
              </div>

              {/* Tanda Tangan Surat Jalan */}
              <div className="grid grid-cols-3 divide-x divide-slate-300 border border-slate-300 rounded text-center pt-2 pb-3 mt-4">
                <div className="px-2">
                  <div className="text-[10px] font-bold uppercase text-slate-600">Yang Menyerahkan,</div>
                  <div className="h-16 flex items-center justify-center my-1">
                    {shipment.checkerSignature ? (
                      <img src={shipment.checkerSignature} alt="Checker" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">(Ttd Checker)</span>
                    )}
                  </div>
                  <div className="font-bold underline text-slate-900">{shipment.checkerName}</div>
                  <div className="text-[9px] text-slate-500">PT LAUTAN INDAH Express</div>
                </div>

                <div className="px-2">
                  <div className="text-[10px] font-bold uppercase text-slate-600">Pengemudi / Driver,</div>
                  <div className="h-16 flex items-center justify-center my-1">
                    {shipment.driverSignature ? (
                      <img src={shipment.driverSignature} alt="Driver" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">(Ttd Pengemudi)</span>
                    )}
                  </div>
                  <div className="font-bold underline text-slate-900">{shipment.driverName}</div>
                  <div className="text-[9px] text-slate-500">{shipment.plateNumber}</div>
                </div>

                <div className="px-2">
                  <div className="text-[10px] font-bold uppercase text-slate-600">Yang Menerima,</div>
                  <div className="h-16 flex items-center justify-center my-1">
                    {shipment.recipientSignature ? (
                      <img src={shipment.recipientSignature} alt="Penerima" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">(Ttd &amp; Cap Penerima)</span>
                    )}
                  </div>
                  <div className="font-bold underline text-slate-900">{shipment.recipientName}</div>
                  <div className="text-[9px] text-slate-500">{shipment.destination}</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer watermark note in document */}
          <div className="mt-6 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
            <span>Dicetak secara otomatis melalui Sistem Digital PT LAUTAN INDAH Express</span>
            <span>Halaman 1 dari 1 • Status Valid</span>
          </div>
        </div>
      </div>
    </div>
  );
};
