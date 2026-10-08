import { generateInvoicePDF } from './pdfGenerator.js';

export const SENDER_EMAIL = 'Hostel Neustadt <noreply@scholz-friese-webdesign.de>';
export const OWNER_NOTIFICATION_EMAIL = 'scholz.friese@gmail.com';
export const REPLY_TO_EMAIL = 'info@hostel-neustadt.de';

const formatEuro = (val) => {
  return Number(val || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
};

/**
 * Generic email sender using Scholz & Friese Resend Worker or Cloudflare Function fallback
 */
async function sendResendMail({ to, subject, html, attachments, replyTo = REPLY_TO_EMAIL }) {
  const recipients = Array.isArray(to) ? to : [to];

  const payload = {
    from: SENDER_EMAIL,
    to: recipients,
    reply_to: replyTo,
    subject,
    html
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments;
  }

  let response = null;
  let resData = null;

  try {
    // 1. Primary: Official Scholz & Friese Shops Resend Worker
    response = await fetch('https://resend-mailer.friese-scholz.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    resData = await response.json();
  } catch (err) {
    // 2. Fallback: Cloudflare Pages / Vite Proxy
    try {
      response = await fetch('/api/resend/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      resData = await response.json();
    } catch (fallbackErr) {
      console.warn('[EmailService] Email dispatch failed on both endpoints:', fallbackErr);
    }
  }

  const ok = response ? response.ok : false;
  return { ok, data: resData };
}

/**
 * Generates official PDF invoice and sends both Customer & Owner confirmation emails
 */
export async function sendBookingConfirmationEmails(booking) {
  if (!booking) return { success: false, error: 'Keine Buchungsdaten übergeben' };

  const guest = booking.guest || {};
  const rooms = booking.rooms || [];
  const checkinDE = booking.checkin ? new Date(booking.checkin).toLocaleDateString('de-DE') : '-';
  const checkoutDE = booking.checkout ? new Date(booking.checkout).toLocaleDateString('de-DE') : '-';
  const isPaid = (booking.payment?.status === 'paid' || booking.paymentStatus === 'paid');
  const payLabel = isPaid 
    ? `Bereits bezahlt (${booking.payment?.methodLabel || 'Online-Zahlung'})` 
    : 'Zahlung offen (Zahlbar bei Anreise vor Ort oder per Überweisung)';

  // 1. Generate PDF invoice as Base64 attachment
  let invoiceBase64 = null;
  try {
    const doc = await generateInvoicePDF(booking);
    const dataUri = doc.output('datauristring');
    invoiceBase64 = dataUri.split(',')[1];
  } catch (pdfErr) {
    console.error('[EmailService] Failed to generate PDF invoice attachment:', pdfErr);
  }

  // 2. Build Room items HTML rows
  const roomsHtml = rooms.map(r => {
    const title = r.name || (r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer');
    const rIn = r.checkin ? new Date(r.checkin).toLocaleDateString('de-DE') : checkinDE;
    const rOut = r.checkout ? new Date(r.checkout).toLocaleDateString('de-DE') : checkoutDE;
    const rNights = r.nights || booking.nights || 1;
    const rTotal = Number(r.totalPrice || 0);

    const roomNumBadge = r.roomNumber 
      ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 6px;">Zimmer ${r.roomNumber}${r.roomNumber === 2 ? ' (Barrierefrei ♿)' : ''}</span>`
      : '';

    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
          <strong>${r.count || 1}x ${title}</strong>${roomNumBadge}<br>
          <span style="font-size: 12px; color: #64748b;">${rIn} – ${rOut} (${rNights} ${rNights === 1 ? 'Nacht' : 'Nächte'}) · ${r.guests || 1} Gast/Gäste</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a; white-space: nowrap;">
          ${formatEuro(rTotal)}
        </td>
      </tr>
    `;
  }).join('');

  // 3. Customer Email HTML
  const customerSalutation = guest.lastName ? `Sehr geehrte(r) Frau/Herr ${guest.lastName},` : 'Sehr geehrte Damen und Herren,';
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .header { background: #0F2B5C; padding: 32px 30px; text-align: center; color: #ffffff; }
        .brand-title { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .sub-title { margin: 8px 0 0 0; color: #93c5fd; font-size: 14px; }
        .content { padding: 32px 30px; line-height: 1.6; }
        .booking-badge-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin: 20px 0; }
        .dates-box { display: flex; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
        .total-row td { padding: 14px 0 6px 0; border-top: 2px solid #0F2B5C; font-size: 16px; font-weight: 700; color: #0F2B5C; }
        .pdf-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin: 22px 0; font-size: 13px; color: #1e40af; }
        .footer { background: #f8fafc; padding: 22px 30px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand-title">HOSTEL NEUSTADT</h1>
          <p class="sub-title">Reservierungsbestätigung · Buchungs-Nr. ${booking.bookingNumber}</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">${customerSalutation}</p>
          <p style="font-size: 14px; color: #334155;">
            vielen herzlichen Dank für Ihre Buchung! Wir haben Ihre Reservierung verbindlich eingetragen und freuen uns darauf, Sie bald im <strong>Hostel Neustadt</strong> begrüßen zu dürfen.
          </p>

          <div class="booking-badge-box">
            <span style="font-size: 13px; color: #166534; font-weight: bold;">✓ Reservierung verbindlich bestätigt</span><br>
            <span style="font-size: 13px; color: #14532d;">Rechnungsnummer: <strong>${booking.invoiceNumber || '-'}</strong> · Status: <strong>${payLabel}</strong></span>
          </div>

          <h3 style="color: #0F2B5C; margin: 24px 0 10px 0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Aufenthaltsdaten:</h3>
          <table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 16px;">
            <tr>
              <td style="padding: 4px 0;"><strong>Anreise:</strong></td>
              <td style="padding: 4px 0;">${checkinDE} (ab 15:00 Uhr)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Abreise:</strong></td>
              <td style="padding: 4px 0;">${checkoutDE} (bis 11:00 Uhr)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Dauer:</strong></td>
              <td style="padding: 4px 0;">${booking.nights || 1} ${booking.nights === 1 ? 'Übernachtung' : 'Übernachtungen'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Adresse:</strong></td>
              <td style="padding: 4px 0;">Bahnhofstraße 10, 31535 Neustadt am Rübenberge</td>
            </tr>
          </table>

          <h3 style="color: #0F2B5C; margin: 24px 0 10px 0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Gebuchte Zimmer & Leistungen:</h3>
          <table class="table">
            <tbody>
              ${roomsHtml}
              <tr class="total-row">
                <td>Gesamtbetrag (inkl. 7% USt.):</td>
                <td style="text-align: right; color: #0F2B5C;">${formatEuro(booking.totalPrice)}</td>
              </tr>
            </tbody>
          </table>

          <div class="pdf-notice">
            <strong>📄 Ihre offizielle PDF-Rechnung:</strong><br>
            Die offizielle Rechnung (Rechnungs-Nr. <strong>${booking.invoiceNumber}</strong>) mit ausgewiesener 7% Beherbergungsteuer ist dieser Bestätigungs-E-Mail als PDF-Dokument beigefügt.
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #475569; margin-top: 24px;">
            <strong>Haben Sie Fragen oder besondere Wünsche?</strong><br>
            Sie erreichen uns jederzeit per WhatsApp / Telefon unter <strong>+49 172 8572368</strong> oder per E-Mail an <a href="mailto:vermietung@bh-am-ruebenberge.de" style="color: #2563eb;">vermietung@bh-am-ruebenberge.de</a>.
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;"><strong>Hostel Neustadt</strong> · Eigentümergemeinschaft GbR Bagari und Pasqualini</p>
          <p style="margin: 0 0 4px 0;">Bertha-Sicius-Str. 6 · 31535 Neustadt am Rübenberge · Telefon / WhatsApp: +49 172 8572368</p>
          <p style="margin: 0; color: #94a3b8; font-size: 11px;">IBAN: DE98 2506 9262 0011 3700 00 · USt-IdNr.: in Zuteilung</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 4. Owner Notification Email HTML
  const ownerEmailHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .badge { display: inline-block; background: #0F2B5C; color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
        .info-card { background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; line-height: 1.6; }
        .table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
        .btn { display: inline-block; background: #0F2B5C; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 22px; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">Hostel Neustadt Reservierung</span>
        <h2 style="color: #0F2B5C; margin: 12px 0 6px 0;">🛎️ Neue Buchung eingegangen!</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Soeben wurde eine neue Reservierung über die Website abgeschlossen:</p>

        <div class="info-card">
          <strong>Buchungs-Nr.:</strong> ${booking.bookingNumber}<br>
          <strong>Rechnungs-Nr.:</strong> ${booking.invoiceNumber || '-'}<br>
          <strong>Reisezeitraum:</strong> ${checkinDE} bis ${checkoutDE} (${booking.nights || 1} Nächte)<br>
          <strong>Gesamtbetrag:</strong> <span style="font-size: 16px; font-weight: bold; color: #0F2B5C;">${formatEuro(booking.totalPrice)}</span><br>
          <strong>Status:</strong> ${payLabel}
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13.5px; color: #166534;">
          <strong>📄 Offizielle PDF-Rechnung im Anhang:</strong><br>
          Die offizielle Rechnung (<strong>${booking.invoiceNumber || booking.bookingNumber}</strong>) mit ausgewiesener MwSt. ist dieser E-Mail direkt als druckfertiger PDF-Anhang beigefügt.
        </div>

        <h4 style="margin: 20px 0 8px 0; color: #0F2B5C;">Gäste- & Kontaktdaten:</h4>
        <div style="font-size: 13.5px; color: #334155; line-height: 1.6; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <strong>Name:</strong> ${guest.firstName || ''} ${guest.lastName || ''}<br>
          <strong>E-Mail:</strong> <a href="mailto:${guest.email}">${guest.email}</a><br>
          <strong>Telefon:</strong> <a href="tel:${guest.phone}">${guest.phone || '-'}</a><br>
          ${guest.company ? `<strong>Firma:</strong> ${guest.company}<br>` : ''}
          <strong>Anschrift:</strong> ${guest.street || '-'}, ${guest.zip || ''} ${guest.city || ''}<br>
          ${guest.notes ? `<strong>Wichtige Notiz:</strong> <span style="color: #b45309;">${guest.notes}</span><br>` : ''}
        </div>

        <h4 style="margin: 20px 0 8px 0; color: #0F2B5C;">Gebuchte Zimmer:</h4>
        <table class="table">
          <tbody>
            ${roomsHtml}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://hostel-neustadt.pages.dev/admin" class="btn">Zum Admin Dashboard & Belegungsplan →</a>
        </div>
      </div>
    </body>
    </html>
  `;

  // Attachments array with official invoice PDF
  const attachments = [];
  if (invoiceBase64) {
    attachments.push({
      filename: `Rechnung_${booking.invoiceNumber || booking.bookingNumber}.pdf`,
      content: invoiceBase64
    });
  }

  // Dispatch Customer Email (if email address provided)
  let customerRes = { ok: false };
  if (guest.email && guest.email.includes('@')) {
    customerRes = await sendResendMail({
      to: guest.email,
      subject: `Ihre Reservierungsbestätigung & Rechnung - Hostel Neustadt (${booking.bookingNumber})`,
      html: customerEmailHtml,
      attachments
    });
  }

  // Dispatch Owner Notification Email (includes invoice PDF attached)
  const ownerRes = await sendResendMail({
    to: OWNER_NOTIFICATION_EMAIL,
    subject: `🛎️ Neue Buchung ${booking.bookingNumber} [Rechnung beigefügt]: ${guest.firstName || ''} ${guest.lastName || ''} (${formatEuro(booking.totalPrice)})`,
    html: ownerEmailHtml,
    attachments // PDF is attached directly to owner email as well
  });

  return {
    success: customerRes.ok || ownerRes.ok,
    customerSent: customerRes.ok,
    ownerSent: ownerRes.ok
  };
}

/**
 * Sends notifications for long-term stay inquiries (>= 14 nights)
 * to both customer (acknowledgment) and owner (lead notification).
 */
export async function sendLongTermInquiryEmails(inquiry) {
  if (!inquiry) return { success: false, error: 'Keine Anfragedaten übergeben' };

  const guest = inquiry.guest || {};
  const rooms = inquiry.rooms || [];
  const checkinDE = inquiry.checkin ? new Date(inquiry.checkin).toLocaleDateString('de-DE') : '-';
  const checkoutDE = inquiry.checkout ? new Date(inquiry.checkout).toLocaleDateString('de-DE') : '-';

  const roomsSummary = rooms.map(r => {
    const title = r.name || (r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer');
    return `${r.count || 1}x ${title} (${r.guests || 1} Gast/Gäste)`;
  }).join(', ');

  const customerSalutation = guest.lastName ? `Sehr geehrte(r) Frau/Herr ${guest.lastName},` : 'Sehr geehrte Damen und Herren,';

  // Customer Acknowledgment Email
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .header { background: #0F2B5C; padding: 32px 30px; text-align: center; color: #ffffff; }
        .brand-title { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .sub-title { margin: 8px 0 0 0; color: #93c5fd; font-size: 14px; }
        .content { padding: 32px 30px; line-height: 1.6; }
        .inquiry-badge-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; margin: 20px 0; color: #1e40af; }
        .table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
        .footer { background: #f8fafc; padding: 22px 30px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand-title">HOSTEL NEUSTADT</h1>
          <p class="sub-title">Eingangsbestätigung Langzeitaufenthalt · Vorgangs-Nr. ${inquiry.bookingNumber}</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">${customerSalutation}</p>
          <p style="font-size: 14px; color: #334155;">
            vielen Dank für Ihre Anfrage für einen Langzeitaufenthalt (ab 14 Nächte) im <strong>Hostel Neustadt</strong>.
            Wir haben Ihre Anfrage erfolgreich erhalten.
          </p>

          <div class="inquiry-badge-box">
            <strong style="font-size: 14px;">✓ Anfrage eingegangen & in Bearbeitung</strong><br>
            <span style="font-size: 13px;">Wir prüfen die Verfügbarkeit für Ihren Zeitraum und erstellen Ihnen kurzfristig ein individuelles Angebot mit attraktiven Sonderkonditionen.</span>
          </div>

          <h3 style="color: #0F2B5C; margin: 24px 0 10px 0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Ihre angefragten Daten:</h3>
          <table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 16px;">
            <tr>
              <td style="padding: 4px 0; width: 140px;"><strong>Anreise:</strong></td>
              <td style="padding: 4px 0;">${checkinDE}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Abreise:</strong></td>
              <td style="padding: 4px 0;">${checkoutDE}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Dauer:</strong></td>
              <td style="padding: 4px 0;">${inquiry.nights || 14} Übernachtungen</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Gewünschte Zimmer:</strong></td>
              <td style="padding: 4px 0;"><strong>${roomsSummary || 'Zimmer nach Vereinbarung'}</strong></td>
            </tr>
            ${guest.company ? `
            <tr>
              <td style="padding: 4px 0;"><strong>Firma:</strong></td>
              <td style="padding: 4px 0;">${guest.company}</td>
            </tr>` : ''}
            ${guest.notes ? `
            <tr>
              <td style="padding: 4px 0; vertical-align: top;"><strong>Ihre Notiz:</strong></td>
              <td style="padding: 4px 0; color: #b45309;">${guest.notes}</td>
            </tr>` : ''}
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #475569; margin-top: 24px;">
            <strong>Haben Sie dringende Rückfragen?</strong><br>
            Sie erreichen uns direkt per WhatsApp / Telefon unter <strong>+49 172 8572368</strong> oder per E-Mail an <a href="mailto:vermietung@bh-am-ruebenberge.de" style="color: #2563eb;">vermietung@bh-am-ruebenberge.de</a>.
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;"><strong>Hostel Neustadt</strong> · Eigentümergemeinschaft GbR Bagari und Pasqualini</p>
          <p style="margin: 0 0 4px 0;">Bertha-Sicius-Str. 6 · 31535 Neustadt am Rübenberge · Telefon / WhatsApp: +49 172 8572368</p>
          <p style="margin: 0; color: #94a3b8; font-size: 11px;">IBAN: DE98 2506 9262 0011 3700 00 · USt-IdNr.: in Zuteilung</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Owner Notification Email
  const ownerEmailHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .badge { display: inline-block; background: #7c3aed; color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
        .info-card { background: #f5f3ff; border: 1px solid #ddd6fe; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; line-height: 1.6; }
        .btn { display: inline-block; background: #0F2B5C; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 22px; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">📋 Langzeit-Anfrage (ab 14 Nächte)</span>
        <h2 style="color: #0F2B5C; margin: 12px 0 6px 0;">Neue individuelle Anfrage eingegangen!</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Ein Gast hat über das Langzeit-Formular angefragt:</p>

        <div class="info-card">
          <strong>Vorgangs-Nr.:</strong> ${inquiry.bookingNumber}<br>
          <strong>Zeitraum:</strong> ${checkinDE} bis ${checkoutDE} (<strong>${inquiry.nights || 14} Nächte</strong>)<br>
          <strong>Zimmerbedarf:</strong> ${roomsSummary}<br>
          <strong>Kunde:</strong> ${guest.firstName || ''} ${guest.lastName || ''} ${guest.company ? `(${guest.company})` : ''}
        </div>

        <h4 style="margin: 20px 0 8px 0; color: #0F2B5C;">Kontaktdaten:</h4>
        <div style="font-size: 13.5px; color: #334155; line-height: 1.6; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <strong>Name:</strong> ${guest.firstName || ''} ${guest.lastName || ''}<br>
          ${guest.company ? `<strong>Firma:</strong> ${guest.company}<br>` : ''}
          <strong>E-Mail:</strong> <a href="mailto:${guest.email}">${guest.email}</a><br>
          <strong>Telefon:</strong> <a href="tel:${guest.phone}">${guest.phone || '-'}</a><br>
          <strong>Anschrift:</strong> ${guest.street || '-'}, ${guest.zip || ''} ${guest.city || ''}<br>
          ${guest.notes ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;"><strong>Projektnotiz:</strong> <span style="color: #b45309;">${guest.notes}</span></div>` : ''}
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://hostel-neustadt.pages.dev/admin" class="btn">Im Admin Hub ansehen & Angebot erstellen →</a>
        </div>
      </div>
    </body>
    </html>
  `;

  // Dispatch Customer Email
  let customerRes = { ok: false };
  if (guest.email && guest.email.includes('@')) {
    customerRes = await sendResendMail({
      to: guest.email,
      subject: `Eingangsbestätigung Ihrer Anfrage - Hostel Neustadt (${inquiry.bookingNumber})`,
      html: customerEmailHtml
    });
  }

  // Dispatch Owner Notification Email
  const ownerRes = await sendResendMail({
    to: OWNER_NOTIFICATION_EMAIL,
    subject: `📋 Neue Langzeit-Anfrage (${inquiry.nights} Nächte): ${guest.firstName || ''} ${guest.lastName || ''}${guest.company ? ' (' + guest.company + ')' : ''}`,
    html: ownerEmailHtml
  });

  return {
    success: customerRes.ok || ownerRes.ok,
    customerSent: customerRes.ok,
    ownerSent: ownerRes.ok
  };
}

/**
 * Resends the official invoice PDF and booking confirmation to a customer
 */
export async function resendInvoiceEmail(booking, targetEmail = null) {
  if (!booking) return { success: false, error: 'Keine Buchung übergeben' };

  const guest = booking.guest || {};
  const recipient = (targetEmail && targetEmail.includes('@')) ? targetEmail : guest.email;
  if (!recipient || !recipient.includes('@')) {
    return { success: false, error: 'Keine gültige E-Mail-Adresse vorhanden' };
  }

  const rooms = booking.rooms || [];
  const checkinDE = booking.checkin ? new Date(booking.checkin).toLocaleDateString('de-DE') : '-';
  const checkoutDE = booking.checkout ? new Date(booking.checkout).toLocaleDateString('de-DE') : '-';
  const isPaid = (booking.payment?.status === 'paid' || booking.paymentStatus === 'paid');
  const payLabel = isPaid 
    ? `Bereits bezahlt (${booking.payment?.methodLabel || 'Online-Zahlung'})` 
    : 'Zahlung offen';

  // 1. Generate PDF invoice as Base64 attachment
  let invoiceBase64 = null;
  try {
    const doc = await generateInvoicePDF(booking);
    const dataUri = doc.output('datauristring');
    invoiceBase64 = dataUri.split(',')[1];
  } catch (pdfErr) {
    console.error('[EmailService] Failed to generate PDF for resending:', pdfErr);
  }

  const roomsHtml = rooms.map(r => {
    const title = r.name || (r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer');
    const rIn = r.checkin ? new Date(r.checkin).toLocaleDateString('de-DE') : checkinDE;
    const rOut = r.checkout ? new Date(r.checkout).toLocaleDateString('de-DE') : checkoutDE;
    const rNights = r.nights || booking.nights || 1;
    const rTotal = Number(r.totalPrice || 0);

    const roomNumBadge = r.roomNumber 
      ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 6px;">Zimmer ${r.roomNumber}${r.roomNumber === 2 ? ' (Barrierefrei ♿)' : ''}</span>`
      : '';

    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
          <strong>${r.count || 1}x ${title}</strong>${roomNumBadge}<br>
          <span style="font-size: 12px; color: #64748b;">${rIn} – ${rOut} (${rNights} ${rNights === 1 ? 'Nacht' : 'Nächte'}) · ${r.guests || 1} Gast/Gäste</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a; white-space: nowrap;">
          ${formatEuro(rTotal)}
        </td>
      </tr>
    `;
  }).join('');

  const customerSalutation = guest.lastName ? `Sehr geehrte(r) Frau/Herr ${guest.lastName},` : 'Sehr geehrte Damen und Herren,';

  const resendHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .header { background: #0F2B5C; padding: 32px 30px; text-align: center; color: #ffffff; }
        .brand-title { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .sub-title { margin: 8px 0 0 0; color: #93c5fd; font-size: 14px; }
        .content { padding: 32px 30px; line-height: 1.6; }
        .badge-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; margin: 20px 0; color: #1e40af; }
        .table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
        .total-row td { padding: 14px 0 6px 0; border-top: 2px solid #0F2B5C; font-size: 16px; font-weight: 700; color: #0F2B5C; }
        .footer { background: #f8fafc; padding: 22px 30px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand-title">HOSTEL NEUSTADT</h1>
          <p class="sub-title">Rechnung & Buchungsbestätigung · Buchungs-Nr. ${booking.bookingNumber}</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">${customerSalutation}</p>
          <p style="font-size: 14px; color: #334155;">
            anbei senden wir Ihnen wie gewünscht Ihre offizielle Rechnung und Bestätigung für Ihren Aufenthalt im <strong>Hostel Neustadt</strong> als druckfähiges PDF-Dokument erneut zu.
          </p>

          <div class="badge-box">
            <span style="font-size: 13.5px; font-weight: bold;">📄 Rechnungs-Nr.: ${booking.invoiceNumber || booking.bookingNumber}</span><br>
            <span style="font-size: 13px;">Status: <strong>${payLabel}</strong> · Reisezeitraum: <strong>${checkinDE} bis ${checkoutDE}</strong></span>
          </div>

          <h3 style="color: #0F2B5C; margin: 24px 0 10px 0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Gebuchte Zimmer & Leistungen:</h3>
          <table class="table">
            <tbody>
              ${roomsHtml}
              <tr class="total-row">
                <td>Gesamtbetrag (inkl. 7% USt.):</td>
                <td style="text-align: right; color: #0F2B5C;">${formatEuro(booking.totalPrice)}</td>
              </tr>
            </tbody>
          </table>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin: 22px 0; font-size: 13px; color: #1e40af;">
            <strong>📄 PDF-Rechnung im Anhang:</strong><br>
            Ihre offizielle Rechnung mit ausgewiesener Mehrwertsteuer finden Sie direkt als PDF im Anhang dieser E-Mail.
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #475569; margin-top: 24px;">
            <strong>Haben Sie Rückfragen zu Ihrer Buchung?</strong><br>
            Sie erreichen uns jederzeit per WhatsApp / Telefon unter <strong>+49 172 8572368</strong> oder per E-Mail an <a href="mailto:vermietung@bh-am-ruebenberge.de" style="color: #2563eb;">vermietung@bh-am-ruebenberge.de</a>.
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;"><strong>Hostel Neustadt</strong> · Eigentümergemeinschaft GbR Bagari und Pasqualini</p>
          <p style="margin: 0 0 4px 0;">Bertha-Sicius-Str. 6 · 31535 Neustadt am Rübenberge · Telefon / WhatsApp: +49 172 8572368</p>
          <p style="margin: 0; color: #94a3b8; font-size: 11px;">IBAN: DE98 2506 9262 0011 3700 00 · USt-IdNr.: in Zuteilung</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (invoiceBase64) {
    attachments.push({
      filename: `Rechnung_${booking.invoiceNumber || booking.bookingNumber}.pdf`,
      content: invoiceBase64
    });
  }

  const res = await sendResendMail({
    to: recipient,
    subject: `📄 Ihre Rechnung & Buchungsbestätigung - Hostel Neustadt (${booking.bookingNumber})`,
    html: resendHtml,
    attachments
  });

  return { success: res.ok, error: res.ok ? null : 'E-Mail konnte nicht zugestellt werden' };
}

/**
 * Sends a stylish cancellation confirmation email to the guest
 * informing them when and how their money will be refunded via Mollie.
 */
export async function sendCancellationEmail(booking, refundDetails = null) {
  if (!booking) return { success: false, error: 'Keine Buchung übergeben' };

  const guest = booking.guest || {};
  const rooms = booking.rooms || [];
  const checkinDE = booking.checkin ? new Date(booking.checkin).toLocaleDateString('de-DE') : '-';
  const checkoutDE = booking.checkout ? new Date(booking.checkout).toLocaleDateString('de-DE') : '-';
  const refundAmount = refundDetails?.amount ?? booking.totalPrice ?? 0;
  const isPaid = (booking.payment?.status === 'paid' || booking.paymentStatus === 'paid');

  const customerSalutation = guest.lastName ? `Sehr geehrte(r) Frau/Herr ${guest.lastName},` : 'Sehr geehrte Damen und Herren,';

  const roomsListText = rooms.map(r => {
    const title = r.name || (r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer');
    const roomNum = r.roomNumber ? ` (Zimmer ${r.roomNumber}${r.roomNumber === 2 ? ' · Barrierefrei ♿' : ''})` : '';
    return `<li><strong>${r.count || 1}x ${title}${roomNum}</strong> (${checkinDE} bis ${checkoutDE})</li>`;
  }).join('');

  const cancellationHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .header { background: #991b1b; padding: 32px 30px; text-align: center; color: #ffffff; }
        .brand-title { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .sub-title { margin: 8px 0 0 0; color: #fecaca; font-size: 14px; }
        .content { padding: 32px 30px; line-height: 1.6; }
        .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin: 20px 0; color: #991b1b; }
        .refund-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; margin: 22px 0; color: #14532d; }
        .footer { background: #f8fafc; padding: 22px 30px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand-title">HOSTEL NEUSTADT</h1>
          <p class="sub-title">Stornierungsbestätigung · Buchungs-Nr. ${booking.bookingNumber}</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">${customerSalutation}</p>
          <p style="font-size: 14px; color: #334155;">
            Ihre Reservierung im <strong>Hostel Neustadt</strong> wurde wie gewünscht erfolgreich storniert.
            Die reservierten Zimmer wurden aus unserem System freigegeben.
          </p>

          <div class="alert-box">
            <strong style="font-size: 14.5px;">✓ Buchung erfolgreich storniert</strong><br>
            <span style="font-size: 13px;">Buchungs-Nr.: <strong>${booking.bookingNumber}</strong> · Rechnungs-Nr.: <strong>${booking.invoiceNumber || '-'}</strong></span>
          </div>

          <h4 style="color: #0F2B5C; margin: 20px 0 8px 0;">Stornierte Leistungen:</h4>
          <ul style="font-size: 13.5px; color: #334155; padding-left: 20px; margin: 0 0 16px 0;">
            ${roomsListText}
          </ul>

          ${isPaid ? `
          <div class="refund-box">
            <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">💳 Informationen zu Ihrer Rückerstattung (Mollie)</h4>
            <p style="margin: 0 0 10px 0; font-size: 13.5px; line-height: 1.6;">
              <strong>Erstattungsbetrag:</strong> <span style="font-size: 16px; font-weight: bold; color: #15803d;">${formatEuro(refundAmount)}</span><br>
              <strong>Zahlungsabwicklung:</strong> Automatische Rückerstattung über unseren Zahlungsdienstleister Mollie.
            </p>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #166534;">
              <strong>Wann und wie erhalten Sie Ihr Geld zurück?</strong><br>
              Der Betrag wird automatisch auf die <strong>ursprüngliche Zahlungsmethode</strong> zurückgebucht, mit der Sie bezahlt haben (z. B. auf Ihr Bankkonto, Ihre Kreditkarte oder Ihr PayPal-Konto). Die Wertstellung erfolgt in der Regel innerhalb von <strong>2 bis 5 Bankarbeitstagen</strong>.
            </p>
          </div>
          ` : `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #475569; margin: 20px 0;">
            Da für diese Reservierung noch keine Online-Zahlung verbucht war, fallen für Sie keinerlei Zahlungen oder Gebühren an.
          </div>
          `}

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #475569; margin-top: 24px;">
            <strong>Haben Sie Fragen zur Stornierung oder Rückabwicklung?</strong><br>
            Sie erreichen uns jederzeit per WhatsApp / Telefon unter <strong>+49 172 8572368</strong> oder per E-Mail an <a href="mailto:vermietung@bh-am-ruebenberge.de" style="color: #2563eb;">vermietung@bh-am-ruebenberge.de</a>.
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;"><strong>Hostel Neustadt</strong> · Eigentümergemeinschaft GbR Bagari und Pasqualini</p>
          <p style="margin: 0 0 4px 0;">Bertha-Sicius-Str. 6 · 31535 Neustadt am Rübenberge · Telefon / WhatsApp: +49 172 8572368</p>
          <p style="margin: 0; color: #94a3b8; font-size: 11px;">IBAN: DE98 2506 9262 0011 3700 00 · USt-IdNr.: in Zuteilung</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Owner Notification
  const ownerCancellationHtml = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #991b1b;">⚠️ Buchung storniert: ${booking.bookingNumber}</h2>
      <p>Die folgende Buchung wurde storniert und die Zimmer wurden freigegeben:</p>
      <ul>
        <li><strong>Gast:</strong> ${guest.firstName || ''} ${guest.lastName || ''} (${guest.email || '-'})</li>
        <li><strong>Zeitraum:</strong> ${checkinDE} bis ${checkoutDE}</li>
        <li><strong>Betrag / Erstattung:</strong> ${formatEuro(refundAmount)}</li>
        <li><strong>Zimmer:</strong> ${rooms.map(r => r.name || r.typeId).join(', ')}</li>
      </ul>
      <p><a href="https://hostel-neustadt.pages.dev/admin">Zum Admin Dashboard</a></p>
    </div>
  `;

  let customerRes = { ok: false };
  if (guest.email && guest.email.includes('@')) {
    customerRes = await sendResendMail({
      to: guest.email,
      subject: `Stornierungsbestätigung - Hostel Neustadt (${booking.bookingNumber})`,
      html: cancellationHtml
    });
  }

  const ownerRes = await sendResendMail({
    to: OWNER_NOTIFICATION_EMAIL,
    subject: `⚠️ Stornierung Buchung ${booking.bookingNumber}: ${guest.firstName || ''} ${guest.lastName || ''} (${formatEuro(refundAmount)})`,
    html: ownerCancellationHtml
  });

  return {
    success: customerRes.ok || ownerRes.ok,
    customerSent: customerRes.ok,
    ownerSent: ownerRes.ok
  };
}
