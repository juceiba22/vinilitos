"use client";

import { QRCodeSVG } from "qrcode.react";
import { buildTrackUrl } from "@/lib/codeUrl";

interface QrCodeGridProps {
  codes: string[];
  title: string;
}

export default function QrCodeGrid({ codes, title }: QrCodeGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 print:hidden">
        <p className="text-sm text-vinyl-cream-dim">
          {codes.length} códigos — cada QR apunta directo a{" "}
          <code className="text-vinyl-cream">/t/&lt;codigo&gt;</code>, listo
          para grabar en el NFC o imprimir junto al vinilito.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-vinyl-accent hover:bg-vinyl-accent-dim transition-colors text-vinyl-black font-semibold rounded-lg px-4 py-2 text-sm whitespace-nowrap ml-4"
        >
          Imprimir
        </button>
      </div>
      <div className="hidden print:block mb-4 text-black font-semibold">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3 gap-4 bg-white rounded-xl p-4 print:p-0 print:rounded-none">
        {codes.map((code) => (
          <div
            key={code}
            className="flex flex-col items-center gap-1 p-2 break-inside-avoid"
          >
            <QRCodeSVG value={buildTrackUrl(code)} size={120} />
            <span className="text-[11px] font-mono text-black">{code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
