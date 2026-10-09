import { jsPDF } from 'jspdf';
import { HOSTEL_LOGO_BASE64 } from '../assets/logoBase64.js';

const formatEuro = (val) => {
  return Number(val || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
};

/**
 * Generates an official, formal German Business Invoice (DIN 5008 standard)
 * Clean black & white/dark-slate typography, delicate hairline rules, official fiscal formatting.
 */
export async function generateInvoicePDF(booking) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const guest = booking.guest || {};
  const payment = booking.payment || {};
  const rooms = booking.rooms || [];
  const taxRate = 7; // 7% Hotel USt (§ 12 Abs. 2 Nr. 11 UStG)

  const grossTotal = Number(booking.totalPrice || 0);
  const netTotal = grossTotal / (1 + taxRate / 100);
  const taxAmount = grossTotal - netTotal;

  const invoiceDate = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('de-DE') 
    : new Date().toLocaleDateString('de-DE');

  const checkinFmt = booking.checkin ? new Date(booking.checkin).toLocaleDateString('de-DE') : '-';
  const checkoutFmt = booking.checkout ? new Date(booking.checkout).toLocaleDateString('de-DE') : '-';

  // Formal colors (Strictly black & dark neutral slate)
  const COLOR_BLACK = [20, 20, 20];
  const COLOR_DARK = [40, 45, 55];
  const COLOR_MUTED = [105, 115, 130];
  const COLOR_LINE = [200, 205, 215];

  // --- 1. Header (Logo on left, Company details on right) ---
  let logoDrawn = false;
  if (HOSTEL_LOGO_BASE64) {
    try {
      // 22mm width, 24mm height (proportional to 368x400)
      doc.addImage(HOSTEL_LOGO_BASE64, 'PNG', 20, 13, 22, 24);
      logoDrawn = true;
    } catch (e) {
      console.error('Embedded logo error:', e);
    }
  }

  if (!logoDrawn) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLOR_BLACK);
    doc.text('HOSTEL NEUSTADT', 20, 24);
  }

  // Company details (Right aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Hostel Neustadt', 190, 17, { align: 'right' });
  doc.text('Bertha-Sicius-Str. 6', 190, 21.5, { align: 'right' });
  doc.text('31535 Neustadt am Rübenberge', 190, 26, { align: 'right' });
  doc.text('Telefon: +49 172 8572368', 190, 30.5, { align: 'right' });
  doc.text('E-Mail: vermietung@bh-am-ruebenberge.de', 190, 35, { align: 'right' });
  doc.text('Web: www.hostel-neustadt.de', 190, 39.5, { align: 'right' });

  // Thin header rule
  doc.setDrawColor(...COLOR_LINE);
  doc.setLineWidth(0.25);
  doc.line(20, 44, 190, 44);

  // --- 2. DIN 5008 Address Window (Left Column) ---
  // Small single-line sender address
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Hostel Neustadt · Bertha-Sicius-Str. 6 · 31535 Neustadt am Rübenberge', 20, 50);

  // Recipient Address
  let yPos = 57;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_BLACK);

  if (guest.company) {
    doc.setFont('helvetica', 'bold');
    doc.text(guest.company, 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 4.8;
  }

  const guestFullName = `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
  if (guestFullName) {
    doc.text(guestFullName, 20, yPos);
    yPos += 4.8;
  }

  if (guest.street) {
    doc.text(guest.street, 20, yPos);
    yPos += 4.8;
  }

  if (guest.zip || guest.city) {
    doc.text(`${guest.zip || ''} ${guest.city || ''}`.trim(), 20, yPos);
    yPos += 4.8;
  }
  doc.text('Deutschland', 20, yPos);

  // --- 3. Invoice Metadata (Right Column - Clean Key/Value) ---
  const metaLabelsX = 130;
  const metaValuesX = 190;
  let metaY = 54;

  doc.setFontSize(8.5);

  const drawMetaRow = (label, val, isBold = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(label, metaLabelsX, metaY);

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...COLOR_BLACK);
    doc.text(val, metaValuesX, metaY, { align: 'right' });
    metaY += 5.2;
  };

  drawMetaRow('Rechnungs-Nr.:', booking.invoiceNumber || 'RE-2026-0001', true);
  drawMetaRow('Rechnungsdatum:', invoiceDate);
  drawMetaRow('Buchungs-Nr.:', booking.bookingNumber || 'HN-2026-0001');
  drawMetaRow('Leistungszeitraum:', `${checkinFmt} – ${checkoutFmt}`);
  drawMetaRow('Rechtsform:', 'GbR (HRB entfällt)');
  drawMetaRow('USt-IdNr.:', 'DE463070397');

  // --- 4. Subject / Title ---
  yPos = 98;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_BLACK);
  const docTitle = booking.status === 'cancelled'
    ? `Stornierungsbeleg zu ${booking.invoiceNumber || 'HN'}`
    : `Rechnung ${booking.invoiceNumber || 'RE-2026-0001'}`;
  doc.text(docTitle, 20, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_DARK);

  const salutation = guest.lastName 
    ? `Sehr geehrte(r) Frau/Herr ${guest.lastName},`
    : 'Sehr geehrte Damen und Herren,';

  doc.text(`${salutation}`, 20, yPos);
  yPos += 4.5;
  const introMsg = booking.status === 'cancelled'
    ? 'hiermit bestätigen wir Ihnen die Stornierung der gebuchten Beherbergungsleistung:'
    : 'wir bedanken uns für Ihre Buchung und stellen Ihnen die vereinbarten Leistungen wie folgt in Rechnung:';
  doc.text(introMsg, 20, yPos);

  // --- 5. Table Header ---
  yPos += 9;
  doc.setDrawColor(...COLOR_BLACK);
  doc.setLineWidth(0.35);
  doc.line(20, yPos, 190, yPos);

  yPos += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_BLACK);
  doc.text('Pos.', 22, yPos);
  doc.text('Leistungsbeschreibung / Zimmer', 34, yPos);
  doc.text('Nächte', 114, yPos, { align: 'center' });
  doc.text('Einzelpreis netto', 150, yPos, { align: 'right' });
  doc.text('Gesamtbetrag', 188, yPos, { align: 'right' });

  yPos += 2.5;
  doc.line(20, yPos, 190, yPos);

  // --- 6. Table Line Items ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  rooms.forEach((r, idx) => {
    yPos += 6;

    const roomTitle = r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer';
    const qtyText = r.count > 1 ? `${r.count}x ` : '';
    const tierInfo = r.tierName ? ` (${r.tierName})` : '';
    const roomNumStr = r.roomNumber 
      ? ` · Zimmer ${r.roomNumber}${r.roomNumber === 2 ? ' (Barrierefrei ♿)' : ''}` 
      : '';

    const itemInFmt = r.checkin ? new Date(r.checkin).toLocaleDateString('de-DE') : checkinFmt;
    const itemOutFmt = r.checkout ? new Date(r.checkout).toLocaleDateString('de-DE') : checkoutFmt;
    const itemNights = r.nights || booking.nights || 1;

    const itemGross = Number(r.totalPrice || 0);
    const itemNet = itemGross / (1 + taxRate / 100);
    const singlePriceNet = itemNet / (r.count || 1) / itemNights;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_DARK);
    doc.text(String(idx + 1), 22, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text(`${qtyText}${roomTitle}${roomNumStr}${tierInfo}`, 34, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text(String(itemNights), 114, yPos, { align: 'center' });
    doc.text(formatEuro(singlePriceNet), 150, yPos, { align: 'right' });
    doc.text(formatEuro(itemGross), 188, yPos, { align: 'right' });

    yPos += 4.5;
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`Aufenthalt: ${itemInFmt} bis ${itemOutFmt} (${itemNights} ${itemNights === 1 ? 'Nacht' : 'Nächte'}) · ${r.guests || 1} Gast/Gäste · inkl. 7% USt.`, 34, yPos);

    yPos += 3.5;
    doc.setDrawColor(...COLOR_LINE);
    doc.setLineWidth(0.2);
    doc.line(20, yPos, 190, yPos);
  });

  // --- 7. Totals Block ---
  yPos += 7;
  const totLabelX = 98;
  const totValX = 188;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Nettobetrag (ohne USt.):', totLabelX, yPos);
  doc.setTextColor(...COLOR_BLACK);
  doc.text(formatEuro(netTotal), totValX, yPos, { align: 'right' });

  yPos += 5;
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Zuzüglich 7,0 % USt. (Beherbergung):`, totLabelX, yPos);
  doc.setTextColor(...COLOR_BLACK);
  doc.text(formatEuro(taxAmount), totValX, yPos, { align: 'right' });

  yPos += 3;
  doc.setDrawColor(...COLOR_BLACK);
  doc.setLineWidth(0.35);
  doc.line(totLabelX, yPos, 190, yPos);

  yPos += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_BLACK);
  doc.text('Rechnungsbetrag (brutto):', totLabelX, yPos);
  doc.text(formatEuro(grossTotal), totValX, yPos, { align: 'right' });

  // Double underline below final gross total
  yPos += 2;
  doc.line(totLabelX, yPos, 190, yPos);
  doc.line(totLabelX, yPos + 0.6, 190, yPos + 0.6);

  // --- 8. Formal Payment Acknowledgement / Notice ---
  yPos += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_BLACK);

  const isCancelled = booking.status === 'cancelled';
  const isPaid = (payment.status === 'paid' || booking.paymentStatus === 'paid') && !isCancelled;

  if (isCancelled) {
    doc.text('Buchungsstatus: Storniert', 20, yPos);
    yPos += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK);
    doc.text('Diese Buchung wurde storniert. Es besteht kein Zahlungsanspruch.', 20, yPos);
  } else if (isPaid) {
    doc.text('Zahlungshinweis:', 20, yPos);
    yPos += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK);

    const paidDate = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('de-DE') : invoiceDate;
    const methodLabel = payment.methodLabel || 'Online-Zahlung';
    const txInfo = payment.transactionId ? ` (Transaktion: ${payment.transactionId})` : '';

    doc.text(
      `Der Rechnungsbetrag in Höhe von ${formatEuro(grossTotal)} wurde am ${paidDate} vollständig per ${methodLabel}${txInfo} beglichen.`,
      20,
      yPos
    );
    yPos += 4;
    doc.text('Es ist kein weiterer Ausgleich erforderlich. Vielen Dank für Ihren Besuch!', 20, yPos);
  } else {
    // Unpaid / Pending
    doc.text('Zahlungshinweis & Fälligkeit:', 20, yPos);
    yPos += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK);
    doc.text(
      `Der Rechnungsbetrag in Höhe von ${formatEuro(grossTotal)} ist noch offen und zahlbar bei Anreise vor Ort (bar oder EC-/Kreditkarte) bzw. vorab per Banküberweisung.`,
      20,
      yPos
    );
    yPos += 4;
    doc.text(
      `Fälligkeit: Bei Check-in am ${checkinFmt}. Bitte geben Sie bei Überweisungen stets die Rechnungsnummer ${booking.invoiceNumber || 'HN'} an.`,
      20,
      yPos
    );
  }

  // Fiscal note
  yPos += 8;
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Hinweis: Beherbergungsleistungen unterliegen dem ermäßigten Steuersatz gem. § 12 Abs. 2 Nr. 11 UStG.', 20, yPos);

  // --- 9. Official DIN 5008 Three-Column Footer ---
  const footY = 268;
  doc.setDrawColor(...COLOR_LINE);
  doc.setLineWidth(0.25);
  doc.line(20, footY - 4, 190, footY - 4);

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);

  // Col 1: Anschrift
  doc.setFont('helvetica', 'bold');
  doc.text('Hostel Neustadt', 20, footY);
  doc.setFont('helvetica', 'normal');
  doc.text('Bertha-Sicius-Str. 6', 20, footY + 3.5);
  doc.text('31535 Neustadt am Rübenberge', 20, footY + 7);
  doc.text('vermietung@bh-am-ruebenberge.de', 20, footY + 10.5);

  // Col 2: Bankverbindung
  doc.setFont('helvetica', 'bold');
  doc.text('Bankverbindung', 85, footY);
  doc.setFont('helvetica', 'normal');
  doc.text('IBAN: DE98 2506 9262 0011 3700 00', 85, footY + 3.5);
  doc.text('Verwendungszweck: ' + (booking.invoiceNumber || booking.bookingNumber), 85, footY + 7);
  doc.text('WhatsApp: +49 172 8572368', 85, footY + 10.5);

  // Col 3: Steuer & Register
  doc.setFont('helvetica', 'bold');
  doc.text('Unternehmensdaten', 145, footY);
  doc.setFont('helvetica', 'normal');
  doc.text('Eigentümergemeinschaft GbR', 145, footY + 3.5);
  doc.text('Ahmed Bagari & Corinna Pasqualini', 145, footY + 7);
  doc.text('USt-IdNr.: DE463070397', 145, footY + 10.5);

  return doc;
}

/**
 * Direct download helper for UI buttons
 */
export async function downloadInvoicePDF(booking) {
  try {
    const doc = await generateInvoicePDF(booking);
    const filename = `Rechnung_${booking.invoiceNumber || 'HN'}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error('PDF generation error:', err);
    alert('Fehler beim Erstellen der PDF-Rechnung: ' + err.message);
  }
}
