import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, DollarSign, Bed, BedDouble, ShieldCheck,
  CheckCircle2, XCircle, Clock, Search, Filter, Download,
  Trash2, Plus, Edit3, ArrowLeft, ChevronRight, ChevronLeft, AlertCircle,
  Eye, FileText, Check, Lock, LogOut, KeyRound, Sparkles, LogIn, DoorOpen,
  Phone, PhoneCall, UserCheck, CalendarDays, ExternalLink, RefreshCw, Mail,
  Accessibility, Send, LayoutGrid, ChevronDown, ChevronUp, User, Building2, MapPin
} from 'lucide-react';
import { bookingStore, ROOM_DEFINITIONS } from '../services/bookingStore';
import { downloadInvoicePDF } from '../services/pdfGenerator';
import { resendInvoiceEmail, sendCancellationEmail } from '../services/emailService';
import './AdminPage.css';

export default function AdminPage() {
  // Password Protection Gate
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('hostel_admin_auth') === 'true';
  });
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dashboard Tabs: 'bookings' | 'inventory' | 'pricing'
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Dashboard Store Data
  const [bookings, setBookings] = useState([]);
  const [inventory, setInventory] = useState({ einzelzimmer: 3, doppelzimmer: 12 });
  const [pricing, setPricing] = useState({
    einzelzimmer: { tier1_3: 70, tier4_6: 65, tier7plus: 60 },
    doppelzimmer: { tier1_3: 100, tier4_6: 90, tier7plus: 80 }
  });
  const [customPeriods, setCustomPeriods] = useState([]);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'today_checkin' | 'today_inhouse' | 'today_checkout' | 'upcoming' | 'open' | 'inquiry' | 'cancelled'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [nowTime, setNowTime] = useState(Date.now());
  const [isResendingInvoice, setIsResendingInvoice] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState('grid'); // 'grid' | 'matrix'

  // Weekly Calendar Navigation State
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMonday(new Date()));
  const [jumpDateInput, setJumpDateInput] = useState('');

  // Manual Booking Modal State
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    email: '',
    street: '',
    zip: '',
    city: '',
    notes: '',
    checkin: '',
    checkout: '',
    countEZ: 1,
    countDZ: 0,
    roomNumber: '', // specific assigned room number 1-15 or '' for auto
    paymentStatus: 'paid', // 'paid' | 'pending'
    paymentMethod: 'bar', // 'bar' | 'ec' | 'ueberweisung' | 'rechnung' | 'online'
    customPrice: ''
  });

  // New Special Condition Form
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    startDate: '',
    endDate: '',
    priceEZ: '',
    priceDZ: '',
    note: ''
  });

  // Load from store
  const loadData = () => {
    setBookings(bookingStore.getBookings());
    setInventory(bookingStore.getInventory());
    setPricing(bookingStore.getPricing());
    setCustomPeriods(bookingStore.getCustomPeriods());
  };

  useEffect(() => {
    loadData();
    bookingStore.syncFromServer();

    const handleUpdate = () => loadData();
    window.addEventListener('hostel_store_change', handleUpdate);

    // Live 1-second ticker for remaining hold times & local auto-cleanup of expired holds
    const ticker = setInterval(() => {
      setNowTime(Date.now());
      setBookings(prev => {
        const hasExpired = prev.some(b => b.status === 'open' && b.expiresAt && b.expiresAt <= Date.now());
        if (hasExpired) {
          bookingStore.syncFromServer();
          return prev.filter(b => !(b.status === 'open' && b.expiresAt && b.expiresAt <= Date.now()));
        }
        return prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener('hostel_store_change', handleUpdate);
      clearInterval(ticker);
    };
  }, []);

  const formatHoldTimer = (expiresAt) => {
    if (!expiresAt) return '';
    const diffSec = Math.max(0, Math.floor((expiresAt - nowTime) / 1000));
    if (diffSec === 0) return 'Abgelaufen';
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} Min.`;
  };

  const triggerSaveNotification = (msg = 'Änderungen erfolgreich gespeichert!') => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(''), 3500);
  };

  // --- Handlers: Authentication ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    const masterSecret = 'Hostel#Neustadt!2026';

    try {
      // 1. Try server-side authentication via /api/auth
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword })
      });

      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Not JSON (e.g. 405 Method Not Allowed or 404 from static host)
      }

      if (res.ok && data?.success) {
        sessionStorage.setItem('hostel_admin_auth', data.token || 'true');
        setIsAuthenticated(true);
        setAuthError('');
        loadData();
        return;
      }

      if (data && data.success === false && res.status === 401) {
        setAuthError(data.error || 'Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.');
        return;
      }

      // 2. Fallback if static host does not support POST /api/auth (e.g. 405 Method Not Allowed)
      if (inputPassword === masterSecret) {
        sessionStorage.setItem('hostel_admin_auth', 'true');
        setIsAuthenticated(true);
        setAuthError('');
        loadData();
      } else {
        setAuthError('Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.');
      }
    } catch (err) {
      // Network or offline fallback
      if (inputPassword === masterSecret) {
        sessionStorage.setItem('hostel_admin_auth', 'true');
        setIsAuthenticated(true);
        setAuthError('');
        loadData();
      } else {
        setAuthError('Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('hostel_admin_auth');
    setIsAuthenticated(false);
    setInputPassword('');
  };

  // --- Handlers: Inventory ---
  const handleSaveInventory = (e) => {
    e.preventDefault();
    bookingStore.setInventory(inventory);
    triggerSaveNotification('Zimmerkontingente erfolgreich aktualisiert!');
  };

  // --- Handlers: Base Tiered Pricing ---
  const handleSavePricing = (e) => {
    e.preventDefault();
    bookingStore.setPricing(pricing);
    triggerSaveNotification('Staffelpreise erfolgreich gespeichert!');
  };

  // --- Handlers: Custom Periods (Sonderkonditionen) ---
  const handleAddPeriod = (e) => {
    e.preventDefault();
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      alert('Bitte füllen Sie mindestens Bezeichnung, Startdatum und Enddatum aus.');
      return;
    }
    bookingStore.addCustomPeriod({
      ...newPeriod,
      priceEZ: Number(newPeriod.priceEZ) || 70,
      priceDZ: Number(newPeriod.priceDZ) || 100,
      active: true
    });
    setNewPeriod({ name: '', startDate: '', endDate: '', priceEZ: '', priceDZ: '', note: '' });
    setShowAddPeriodModal(false);
    triggerSaveNotification('Sonderkondition erfolgreich angelegt!');
  };

  const handleDeletePeriod = (id) => {
    if (window.confirm('Möchten Sie diese Sonderkondition wirklich löschen?')) {
      bookingStore.deleteCustomPeriod(id);
      triggerSaveNotification('Sonderkondition gelöscht.');
    }
  };

  const handleTogglePeriodActive = (period) => {
    const updated = customPeriods.map(p => p.id === period.id ? { ...p, active: !p.active } : p);
    bookingStore.setCustomPeriods(updated);
    setCustomPeriods(updated);
  };

  // --- Handlers: Bookings ---
  const handleCancelBooking = async (bookingId) => {
    const b = bookings.find(item => item.id === bookingId || item.bookingNumber === bookingId);
    if (!b) return;

    const guestName = `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.trim() || 'Gast';
    const isPaid = (b.payment?.status === 'paid' || b.paymentStatus === 'paid');
    const paymentId = b.payment?.transactionId;

    const confirmMsg = isPaid
      ? `Buchung ${b.bookingNumber} (${guestName}) wirklich stornieren?\n\n` +
        `• Gebuchte Zimmer werden sofort freigegeben\n` +
        `• Rückerstattung über Mollie (${Number(b.totalPrice || 0).toFixed(2)} €) wird angewiesen\n` +
        `• Gast (${b.guest?.email || 'keine E-Mail'}) erhält eine Stornierungs-E-Mail mit Details zur Rückabwicklung (2–5 Werktage).`
      : `Buchung ${b.bookingNumber} (${guestName}) wirklich stornieren? Die gebuchten Zimmer werden sofort freigegeben.`;

    if (!window.confirm(confirmMsg)) return;

    setIsCancellingBooking(true);
    let refundDetails = null;

    if (isPaid && paymentId) {
      try {
        const refundRes = await fetch('/api/mollie/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            amount: b.totalPrice,
            description: `Stornierung Buchung ${b.bookingNumber}`
          })
        });
        const refundData = await refundRes.json();
        if (refundData.success) {
          refundDetails = {
            refundId: refundData.refundId,
            status: refundData.status,
            amount: b.totalPrice,
            refundedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('[Admin] Mollie refund API call error:', err);
      }
    }

    const cancelled = bookingStore.cancelBooking(bookingId, refundDetails);
    loadData();

    if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingNumber === bookingId)) {
      setSelectedBooking(cancelled);
    }

    // Send stylish cancellation email with explanation of refund timeframe (2-5 business days)
    try {
      await sendCancellationEmail(cancelled, refundDetails);
    } catch (mailErr) {
      console.warn('[Admin] Cancellation email dispatch note:', mailErr);
    }

    setIsCancellingBooking(false);
    triggerSaveNotification(`Buchung ${b.bookingNumber} storniert, Zimmer freigegeben & Stornierungs-Mail gesendet.`);
  };

  const handleResendInvoice = async (b) => {
    if (!b) return;
    const email = b.guest?.email;
    if (!email) {
      alert('Für diesen Gast ist keine E-Mail-Adresse hinterlegt.');
      return;
    }
    
    setIsResendingInvoice(true);
    try {
      const res = await resendInvoiceEmail(b, email);
      setIsResendingInvoice(false);
      if (res.success) {
        triggerSaveNotification(`Rechnung & Buchungsbestätigung erfolgreich erneut an ${email} versendet!`);
      } else {
        alert(res.error || 'Fehler beim erneuten E-Mail-Versand');
      }
    } catch (err) {
      setIsResendingInvoice(false);
      alert(err.message || 'Fehler beim Versenden der E-Mail');
    }
  };

  const handleUpdateBookingRoomNumber = (bookingId, roomIndex, newRoomNum) => {
    const updated = bookingStore.updateBookingRoom(bookingId, roomIndex, newRoomNum);
    loadData();
    if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingNumber === bookingId)) {
      setSelectedBooking(updated);
    }
    triggerSaveNotification(`Zimmernummer erfolgreich auf Zimmer ${newRoomNum} geändert!`);
  };

  const handleDeleteBooking = async (bookingId) => {
    const b = bookings.find(item => item.id === bookingId || item.bookingNumber === bookingId);
    const name = b ? `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.trim() : '';
    const num = b?.bookingNumber || bookingId;
    const isHold = b?.status === 'open';

    const confirmMsg = isHold 
      ? `10-Minuten-Reservierung (${num}) abbrechen und Zimmer sofort wieder freigeben?`
      : `Buchung ${num} (${name || 'Gast'}) wirklich komplett und dauerhaft aus dem System entfernen?`;

    if (window.confirm(confirmMsg)) {
      // Optimistic instant state update
      setBookings(prev => prev.filter(item => item.id !== bookingId && item.bookingNumber !== bookingId));
      if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingNumber === bookingId)) {
        setSelectedBooking(null);
      }
      await bookingStore.deleteBooking(bookingId);
      triggerSaveNotification(isHold ? 'Reservierung abgebrochen und Zimmer freigegeben.' : 'Buchung dauerhaft aus dem System gelöscht.');
    }
  };

  const handleMarkBookingPaid = (bookingId, method = 'bar') => {
    bookingStore.markBookingAsPaid(bookingId, method);
    loadData();
    if (selectedBooking && selectedBooking.id === bookingId) {
      const methodLabels = {
        bar: 'Barzahlung vor Ort',
        ec: 'EC-Karte / Terminal vor Ort',
        ueberweisung: 'Banküberweisung',
        rechnung: 'Rechnung auf Ziel',
        online: 'Online bezahlt'
      };
      setSelectedBooking(prev => ({
        ...prev,
        paymentStatus: 'paid',
        payment: {
          ...prev.payment,
          status: 'paid',
          method,
          methodLabel: methodLabels[method] || 'Barzahlung vor Ort',
          paidAt: new Date().toISOString()
        }
      }));
    }
    triggerSaveNotification('Zahlung erfolgreich erfasst! Status ist nun Bezahlt.');
  };

  // --- Helpers: Room & Guest Assignment ("erst alle Zimmer befüllen dann doppelt") ---
  const computeRoomGuestAssignments = (booking) => {
    if (!booking) return [];

    // 1. Gather all persons
    const mainGuestName = `${booking.guest?.firstName || ''} ${booking.guest?.lastName || ''}`.trim() || 'Hauptbucher';
    let additional = [];
    if (Array.isArray(booking.guest?.allGuests) && booking.guest.allGuests.length > 0) {
      additional = booking.guest.allGuests
        .filter(g => !g.isMain)
        .map(g => g.fullName || `${g.firstName || ''} ${g.lastName || ''}`.trim())
        .filter(Boolean);
    } else if (Array.isArray(booking.guest?.additionalGuests)) {
      additional = booking.guest.additionalGuests
        .map(g => typeof g === 'string' ? g.trim() : `${g.firstName || ''} ${g.lastName || ''}`.trim())
        .filter(Boolean);
    }

    const allPersons = [
      { name: mainGuestName, isMain: true },
      ...additional.map(name => ({ name, isMain: false }))
    ];

    // 2. Gather individual room slots (expanding multiple room counts)
    const rawRooms = (Array.isArray(booking.rooms) && booking.rooms.length > 0)
      ? booking.rooms
      : (booking.roomNumbers || [booking.roomNumber || 1]).map(rn => {
          const def = ROOM_DEFINITIONS.find(d => d.number === rn);
          return {
            roomNumber: rn,
            typeId: def?.typeId || ((rn === 1 || rn === 2 || rn === 15) ? 'einzelzimmer' : 'doppelzimmer'),
            name: def?.typeLabel || 'Zimmer ' + rn
          };
        });

    const slots = [];
    let slotCounter = 0;
    rawRooms.forEach((r, originalIdx) => {
      const count = Math.max(1, Number(r.count) || 1);
      for (let c = 0; c < count; c++) {
        const rNum = (c === 0 && r.roomNumber) ? r.roomNumber : (r.roomNumbers?.[c] || r.roomNumber || null);
        const isDouble = r.typeId === 'doppelzimmer' || (rNum && rNum >= 3 && rNum <= 14);
        slots.push({
          slotIndex: slotCounter++,
          originalRoomIndex: originalIdx,
          roomNumber: rNum,
          typeId: r.typeId,
          name: r.name || (isDouble ? 'Doppelzimmer' : 'Einzelzimmer'),
          accessible: Boolean(r.accessible || rNum === 2),
          maxCap: isDouble ? 2 : 1,
          checkin: r.checkin || booking.checkin,
          checkout: r.checkout || booking.checkout,
          nights: r.nights || booking.nights || 1,
          price: r.total || r.totalPrice || 0,
          guests: []
        });
      }
    });

    // Rule: "erst alle Zimmer befüllen dann doppelt"
    const queue = [...allPersons];

    // Pass 1: Erst alle Zimmer befüllen mit je 1 Person
    for (let i = 0; i < slots.length; i++) {
      if (queue.length > 0) {
        slots[i].guests.push(queue.shift());
      }
    }

    // Pass 2: Dann Doppelzimmer mit zweiter Person befüllen
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].maxCap > 1 && slots[i].guests.length < slots[i].maxCap) {
        if (queue.length > 0) {
          slots[i].guests.push(queue.shift());
        }
      }
    }

    // Pass 3: Übrige Personen anhängen, damit kein Name verloren geht
    while (queue.length > 0) {
      const extra = queue.shift();
      if (slots.length > 0) {
        slots[slots.length - 1].guests.push(extra);
      }
    }

    return slots;
  };

  const isRoomCheckedIn = (booking, roomNumber, slotIndex = 0) => {
    const key = String(roomNumber ?? `slot_${slotIndex}`);
    return Boolean(booking?.checkinState?.[key]?.checkedIn || (slotIndex === 0 && booking?.checkedIn));
  };

  const isRoomCheckedOut = (booking, roomNumber, slotIndex = 0) => {
    const key = String(roomNumber ?? `slot_${slotIndex}`);
    return Boolean(booking?.checkinState?.[key]?.checkedOut || (slotIndex === 0 && booking?.checkedOut));
  };

  const handleToggleRoomStatus = (bookingId, roomNumber, slotIndex = 0, field) => {
    bookingStore.updateBooking(bookingId, current => {
      const key = String(roomNumber ?? `slot_${slotIndex}`);
      const existingState = current.checkinState || {};
      const roomState = existingState[key] || { checkedIn: false, checkedOut: false };

      const newVal = !roomState[field];
      const updatedRoomState = {
        ...roomState,
        [field]: newVal,
        [`${field}At`]: newVal ? new Date().toISOString() : null
      };

      if (field === 'checkedOut' && newVal) {
        updatedRoomState.checkedIn = true;
      }

      return {
        ...current,
        checkinState: {
          ...existingState,
          [key]: updatedRoomState
        }
      };
    });

    loadData();
    triggerSaveNotification(field === 'checkedIn' ? 'Check-in Status aktualisiert' : 'Check-out Status aktualisiert');
  };

  const handleSelectBookingFromCalendar = (b) => {
    if (!b) return;
    setActiveTab('bookings');
    setStatusFilter('all');
    setExpandedBookingId(b.id);
    setTimeout(() => {
      const el = document.getElementById(`booking-row-${b.id}`) || document.getElementById(`booking-card-${b.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // --- Inline Accordion Renderer: Grosses, übersichtliches Aufklapp-Panel ---
  const renderExpandedBooking = (b) => {
    const assignedSlots = computeRoomGuestAssignments(b);
    const isInquiry = b.status === 'inquiry';
    const isOpenHold = b.status === 'open';
    const isCancelled = b.status === 'cancelled';
    const isPendingPayment = !isCancelled && !isInquiry && (b.paymentStatus === 'pending' || b.payment?.status === 'pending');

    return (
      <div className="expanded-booking-panel-inner">
        {/* Banner for Special Statuses */}
        {isInquiry && (
          <div className="desk-notes-banner banner-inquiry">
            <Sparkles size={18} className="notes-icon" />
            <div>
              <strong>Individuelle Buchungsanfrage ({b.nights || 14}+ Nächte)</strong>
              <p>Der Gast hat ein individuelles Angebot für einen Langzeitaufenthalt angefragt. Nutzen Sie die Kontaktdaten unten, um direkt per Mail oder Anruf ein Angebot zu unterbreiten.</p>
            </div>
          </div>
        )}

        {isOpenHold && (
          <div className="desk-notes-banner banner-hold">
            <Clock size={18} className="notes-icon" />
            <div>
              <strong>Gast befindet sich im 10-Minuten-Buchungsprozess ({formatHoldTimer(b.expiresAt)})</strong>
              <p>Zimmer sind temporär blockiert. Schließt der Kunde die Zahlung erfolgreich ab, wird die Buchung automatisch als Bezahlt übernommen.</p>
            </div>
          </div>
        )}

        <div className="exp-grid-container">
          {/* Column 1: Kunde & Kontaktdaten + Abrechnung */}
          <div className="exp-card-col">
            <div className="exp-subhead">
              <User size={16} />
              <h4>Kundendaten & Kontakt</h4>
            </div>

            <div className="exp-info-box">
              <div className="exp-field-row">
                <span className="exp-label">Hauptbucher:</span>
                <span className="exp-val"><strong>{b.guest?.firstName} {b.guest?.lastName}</strong></span>
              </div>

              {b.guest?.company && (
                <div className="exp-field-row">
                  <span className="exp-label">Firma:</span>
                  <span className="exp-val"><strong>{b.guest.company}</strong></span>
                </div>
              )}

              <div className="exp-field-row">
                <span className="exp-label">E-Mail:</span>
                <span className="exp-val">
                  {b.guest?.email ? (
                    <a href={`mailto:${b.guest.email}`} className="exp-link">
                      <Mail size={13} /> {b.guest.email}
                    </a>
                  ) : '-'}
                </span>
              </div>

              <div className="exp-field-row">
                <span className="exp-label">Telefon:</span>
                <span className="exp-val">
                  {b.guest?.phone ? (
                    <a href={`tel:${b.guest.phone}`} className="exp-link">
                      <PhoneCall size={13} /> {b.guest.phone}
                    </a>
                  ) : <span className="text-muted">Keine Angabe</span>}
                </span>
              </div>

              {(b.guest?.street || b.guest?.city) && (
                <div className="exp-field-row">
                  <span className="exp-label">Anschrift:</span>
                  <span className="exp-val">
                    {b.guest?.street ? `${b.guest.street}, ` : ''}{b.guest?.zip || ''} {b.guest?.city || ''}
                  </span>
                </div>
              )}

              {b.guest?.notes && (
                <div className="exp-notes-box">
                  <span className="exp-label">Anmerkungen des Gastes:</span>
                  <p className="exp-notes-text">„{b.guest.notes}“</p>
                </div>
              )}
            </div>

            {/* Rechnungs- und Zahlungsdetails */}
            <div className="exp-subhead mt-4">
              <DollarSign size={16} />
              <h4>Zahlung & Rechnung</h4>
            </div>

            <div className="exp-info-box">
              <div className="exp-field-row">
                <span className="exp-label">Rechnungs-Nr.:</span>
                <span className="exp-val font-mono"><strong>{b.invoiceNumber || '-'}</strong></span>
              </div>

              <div className="exp-field-row">
                <span className="exp-label">Gesamtbetrag:</span>
                <span className="exp-val exp-price-highlight">
                  {isInquiry ? 'Auf Anfrage' : `${Number(b.totalPrice || 0).toFixed(2)} €`}
                </span>
              </div>

              <div className="exp-field-row">
                <span className="exp-label">Zahlungsstatus:</span>
                <span className="exp-val">
                  {isCancelled ? (
                    <span className="badge-cancelled-inline">✕ Storniert</span>
                  ) : isPendingPayment ? (
                    <span className="badge-pending-inline">⏳ Offen (nicht bezahlt)</span>
                  ) : (
                    <span className="badge-paid-inline">✓ Bezahlt ({b.payment?.methodLabel || 'Online-Zahlung'})</span>
                  )}
                </span>
              </div>

              {b.payment?.transactionId && (
                <div className="exp-field-row">
                  <span className="exp-label">Transaktion:</span>
                  <span className="exp-val font-mono text-muted text-xs">{b.payment.transactionId}</span>
                </div>
              )}

              {/* Quick Pay Buttons if pending */}
              {isPendingPayment && (
                <div className="exp-quick-pay-actions">
                  <span className="exp-quick-pay-title">Zahlungseingang erfassen:</span>
                  <div className="exp-quick-pay-btns">
                    <button type="button" className="btn-mark-paid" onClick={() => handleMarkBookingPaid(b.id, 'bar')}>
                      ✓ Bar bezahlt
                    </button>
                    <button type="button" className="btn-mark-paid" onClick={() => handleMarkBookingPaid(b.id, 'ec')}>
                      ✓ EC-Karte
                    </button>
                    <button type="button" className="btn-mark-paid" onClick={() => handleMarkBookingPaid(b.id, 'ueberweisung')}>
                      ✓ Überweisung
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Zimmer & Reisende (mit Zimmerzuteilung & Check-in Checkboxen) */}
          <div className="exp-card-col exp-rooms-col">
            <div className="exp-subhead">
              <DoorOpen size={16} />
              <h4>Gebuchte Zimmer & Reisende</h4>
              <span className="exp-subtitle-pill">
                {assignedSlots.length} {assignedSlots.length === 1 ? 'Zimmer' : 'Zimmer'} · Erst alle Zimmer befüllen, dann doppelt
              </span>
            </div>

            <div className="exp-rooms-list">
              {assignedSlots.map((slot) => {
                const checkedIn = isRoomCheckedIn(b, slot.roomNumber, slot.slotIndex);
                const checkedOut = isRoomCheckedOut(b, slot.roomNumber, slot.slotIndex);

                return (
                  <div key={slot.slotIndex} className={`exp-room-card ${checkedOut ? 'room-checked-out' : checkedIn ? 'room-checked-in' : ''}`}>
                    {/* Room Header */}
                    <div className="exp-room-top">
                      <div className="exp-room-title-cluster">
                        <span className={`exp-room-badge ${slot.accessible ? 'badge-accessible' : ''}`}>
                          {slot.roomNumber ? `Zimmer ${slot.roomNumber}` : 'Zimmer unzugewiesen'}
                          {slot.accessible ? ' (♿ Barrierefrei)' : ''}
                        </span>
                        <span className="exp-room-type-text">
                          {slot.typeId === 'einzelzimmer' ? 'Einzelzimmer (1 Person)' : 'Doppelzimmer (max. 2 Personen)'}
                        </span>
                      </div>

                      {/* Discrete Checkboxen: Eingecheckt / Ausgecheckt */}
                      <div className="exp-room-check-cluster">
                        <label 
                          className={`exp-discrete-checkbox ${checkedIn ? 'checked-in' : ''}`}
                          title="Häkchen setzen wenn der Gast anwesend / eingecheckt ist"
                        >
                          <input 
                            type="checkbox" 
                            checked={checkedIn} 
                            onChange={() => handleToggleRoomStatus(b.id, slot.roomNumber, slot.slotIndex, 'checkedIn')} 
                          />
                          <span className="exp-checkbox-box">
                            {checkedIn && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="exp-checkbox-text">Anwesend</span>
                        </label>

                        <label 
                          className={`exp-discrete-checkbox ${checkedOut ? 'checked-out' : ''}`}
                          title="Häkchen setzen wenn der Gast abgereist / ausgecheckt ist"
                        >
                          <input 
                            type="checkbox" 
                            checked={checkedOut} 
                            onChange={() => handleToggleRoomStatus(b.id, slot.roomNumber, slot.slotIndex, 'checkedOut')} 
                          />
                          <span className="exp-checkbox-box">
                            {checkedOut && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="exp-checkbox-text">Ausgecheckt</span>
                        </label>
                      </div>
                    </div>

                    {/* Room Reassign Select */}
                    {!isInquiry && (
                      <div className="exp-room-reassign-bar">
                        <label htmlFor={`reassign-select-${b.id}-${slot.slotIndex}`}>Zimmernummer ändern:</label>
                        <select 
                          id={`reassign-select-${b.id}-${slot.slotIndex}`}
                          value={slot.roomNumber || ''} 
                          onChange={(e) => handleUpdateBookingRoomNumber(b.id, slot.originalRoomIndex, e.target.value)}
                          className="exp-reassign-select"
                        >
                          <option value="" disabled>Zimmer auswählen...</option>
                          {ROOM_DEFINITIONS.map(def => (
                            <option key={def.number} value={def.number}>
                              Zimmer {def.number} – {def.typeLabel}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Assigned Travelers for this specific room */}
                    <div className="exp-assigned-travelers">
                      <div className="exp-travelers-header">
                        <Users size={13} />
                        <span>Zugeordnete Gäste für dieses Zimmer ({slot.guests.length}/{slot.maxCap}):</span>
                      </div>

                      <div className="exp-travelers-list">
                        {slot.guests.length === 0 ? (
                          <span className="text-muted text-xs">Kein Name hinterlegt</span>
                        ) : (
                          slot.guests.map((g, gIdx) => (
                            <div key={gIdx} className={`exp-traveler-pill ${g.isMain ? 'is-main-guest' : ''}`}>
                              <User size={13} className="pill-user-icon" />
                              <span className="pill-traveler-name">{g.name}</span>
                              <span className="pill-traveler-role">
                                {g.isMain ? 'Hauptbucher' : `Reisender ${gIdx + 1}`}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="exp-bottom-actions-bar">
          <div className="exp-actions-left">
            {!isOpenHold && !isInquiry && (
              <>
                <button 
                  className="btn-admin-primary" 
                  onClick={() => downloadInvoicePDF(b)}
                  title="PDF-Rechnung herunterladen"
                >
                  <Download size={15} /> PDF-Rechnung
                </button>

                {b.guest?.email && (
                  <button 
                    className="btn-admin-secondary" 
                    onClick={() => handleResendInvoice(b)}
                    disabled={isResendingInvoice}
                    title={`Rechnung erneut an ${b.guest.email} senden`}
                  >
                    {isResendingInvoice ? <RefreshCw size={15} className="spin-icon" /> : <Mail size={15} />}
                    Rechnung erneut senden
                  </button>
                )}
              </>
            )}

            {isInquiry && (
              <>
                {b.guest?.email && (
                  <a 
                    href={`mailto:${b.guest.email}?subject=Angebot%20f%C3%BCr%20Ihre%20Buchungsanfrage%20${b.bookingNumber}%20-%20Hostel%20Neustadt`}
                    className="btn-admin-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Mail size={15} /> Angebot per E-Mail senden
                  </a>
                )}
                {b.guest?.phone && (
                  <a 
                    href={`tel:${b.guest.phone}`}
                    className="btn-admin-secondary"
                    style={{ textDecoration: 'none' }}
                  >
                    <PhoneCall size={15} /> Jetzt anrufen ({b.guest.phone})
                  </a>
                )}
              </>
            )}

            {b.status === 'confirmed' && (
              <button 
                className="btn-admin-secondary btn-cancel-booking" 
                onClick={() => handleCancelBooking(b.id)}
                disabled={isCancellingBooking}
                title="Buchung stornieren (Zimmer sofort freigeben & Mollie-Erstattung)"
              >
                <XCircle size={15} /> {isCancellingBooking ? 'Storniere...' : 'Buchung stornieren'}
              </button>
            )}
          </div>

          <div className="exp-actions-right">
            <button 
              className="btn-admin-danger" 
              onClick={() => handleDeleteBooking(b.id)}
              title={b.status === 'open' ? 'Hold abbrechen & Zimmer freigeben' : 'Buchung endgültig löschen'}
            >
              <Trash2 size={15} /> {b.status === 'open' ? 'Hold abbrechen' : 'Löschen'}
            </button>
            
            <button 
              className="btn-admin-ghost"
              onClick={() => setExpandedBookingId(null)}
              title="Details einklappen"
            >
              <ChevronUp size={15} /> Zuklappen
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Handlers: Manual Bookings (Admin Hub) ---
  const handleOpenManualBooking = (initialDate = null, initialRoomNumber = null) => {
    const today = new Date();
    const checkinDate = initialDate ? new Date(initialDate) : today;
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + 1);

    const checkinStr = checkinDate.toISOString().split('T')[0];
    const checkoutStr = checkoutDate.toISOString().split('T')[0];

    const initialDef = initialRoomNumber 
      ? ROOM_DEFINITIONS.find(def => def.number === Number(initialRoomNumber))
      : null;

    const countEZ = initialDef ? (initialDef.typeId === 'einzelzimmer' ? 1 : 0) : 1;
    const countDZ = initialDef ? (initialDef.typeId === 'doppelzimmer' ? 1 : 0) : 0;

    const calcEZ = bookingStore.calculateRoomPrice(initialDef?.typeId || 'einzelzimmer', checkinStr, checkoutStr);

    setManualBooking({
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
      email: '',
      street: '',
      zip: '',
      city: '',
      notes: '',
      checkin: checkinStr,
      checkout: checkoutStr,
      countEZ,
      countDZ,
      roomNumber: initialRoomNumber ? String(initialRoomNumber) : '',
      paymentStatus: 'paid',
      paymentMethod: 'bar',
      customPrice: calcEZ.total
    });
    setShowManualBookingModal(true);
  };

  const updateManualSuggestedPrice = (checkin, checkout, countEZ, countDZ) => {
    if (!checkin || !checkout) return;
    let sum = 0;
    if (countEZ > 0) {
      const calcEZ = bookingStore.calculateRoomPrice('einzelzimmer', checkin, checkout);
      sum += (calcEZ.total || 0) * countEZ;
    }
    if (countDZ > 0) {
      const calcDZ = bookingStore.calculateRoomPrice('doppelzimmer', checkin, checkout);
      sum += (calcDZ.total || 0) * countDZ;
    }
    setManualBooking(prev => ({ ...prev, customPrice: sum }));
  };

  const handleSaveManualBooking = (e) => {
    e.preventDefault();
    if (!manualBooking.firstName || !manualBooking.lastName) {
      alert('Bitte geben Sie mindestens Vor- und Nachname des Gastes ein.');
      return;
    }
    if (!manualBooking.checkin || !manualBooking.checkout) {
      alert('Bitte geben Sie Anreise- und Abreisedatum ein.');
      return;
    }
    const countEZ = Number(manualBooking.countEZ) || 0;
    const countDZ = Number(manualBooking.countDZ) || 0;
    if (countEZ === 0 && countDZ === 0 && !manualBooking.roomNumber) {
      alert('Bitte wählen Sie mindestens 1 Zimmer (Einzel- oder Doppelzimmer) aus.');
      return;
    }

    try {
      const roomsToBook = [];
      const chosenRoomDef = manualBooking.roomNumber
        ? ROOM_DEFINITIONS.find(def => def.number === Number(manualBooking.roomNumber))
        : null;

      if (chosenRoomDef) {
        roomsToBook.push({
          typeId: chosenRoomDef.typeId,
          count: 1,
          guests: chosenRoomDef.typeId === 'doppelzimmer' ? 2 : 1,
          roomNumber: chosenRoomDef.number,
          accessible: chosenRoomDef.accessible,
          name: chosenRoomDef.typeLabel
        });
      } else {
        if (countEZ > 0) {
          roomsToBook.push({ typeId: 'einzelzimmer', count: countEZ, guests: 1 });
        }
        if (countDZ > 0) {
          roomsToBook.push({ typeId: 'doppelzimmer', count: countDZ, guests: 2 });
        }
      }

      const newB = bookingStore.createManualBooking({
        checkin: manualBooking.checkin,
        checkout: manualBooking.checkout,
        rooms: roomsToBook,
        guest: {
          firstName: manualBooking.firstName,
          lastName: manualBooking.lastName,
          company: manualBooking.company,
          phone: manualBooking.phone,
          email: manualBooking.email,
          street: manualBooking.street,
          zip: manualBooking.zip,
          city: manualBooking.city,
          notes: manualBooking.notes
        },
        paymentStatus: manualBooking.paymentStatus,
        paymentMethod: manualBooking.paymentMethod,
        customPrice: manualBooking.customPrice !== '' ? Number(manualBooking.customPrice) : null
      });

      loadData();
      setShowManualBookingModal(false);
      triggerSaveNotification(`Buchung ${newB.bookingNumber} (${newB.guest.firstName} ${newB.guest.lastName}) erfolgreich angelegt!`);
    } catch (err) {
      alert(err.message || 'Fehler beim Anlegen der Buchung');
    }
  };

  // --- Handlers: Weekly Calendar Navigation ---
  const handlePrevWeek = () => {
    setCurrentWeekMonday(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekMonday(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
    setJumpDateInput('');
  };

  const handleJumpToDate = (dStr) => {
    if (!dStr) return;
    setJumpDateInput(dStr);
    setCurrentWeekMonday(getMonday(new Date(dStr)));
  };

  // Today's Date String (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const formatDateDE = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dStr;
  };

  const getBookingCheckin = (b) => {
    if (b.checkin) return b.checkin;
    if (b.rooms && b.rooms.length > 0) {
      const dates = b.rooms.map(r => r.checkin).filter(Boolean);
      if (dates.length > 0) return dates.sort()[0];
    }
    return '';
  };

  const getBookingCheckout = (b) => {
    if (b.checkout) return b.checkout;
    if (b.rooms && b.rooms.length > 0) {
      const dates = b.rooms.map(r => r.checkout).filter(Boolean);
      if (dates.length > 0) return dates.sort().reverse()[0];
    }
    return '';
  };

  // Filtered Bookings for Unified Table & Reception View
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const isCancelled = b.status === 'cancelled';
      const isOpenHold = b.status === 'open';
      const isInquiry = b.status === 'inquiry';
      const cIn = getBookingCheckin(b);
      const cOut = getBookingCheckout(b);

      if (statusFilter === 'upcoming') {
        if (isCancelled || isOpenHold || isInquiry) return false;
        if (cOut < todayStr) return false;
      } else if (statusFilter === 'today_checkin') {
        if (isCancelled || isOpenHold || isInquiry) return false;
        if (cIn !== todayStr) return false;
      } else if (statusFilter === 'today_inhouse') {
        if (isCancelled || isOpenHold || isInquiry) return false;
        if (!(cIn <= todayStr && cOut > todayStr)) return false;
      } else if (statusFilter === 'today_checkout') {
        if (isCancelled || isOpenHold || isInquiry) return false;
        if (cOut !== todayStr) return false;
      } else if (statusFilter === 'open') {
        if (!isOpenHold) return false;
      } else if (statusFilter === 'inquiry') {
        if (!isInquiry) return false;
      } else if (statusFilter === 'cancelled') {
        if (!isCancelled) return false;
      }
      // 'all': shows all

      // Search term filter (Phone, Name, Company, Email, Booking #, Notes)
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const cleanTerm = term.replace(/[\s\-\/\(\)]/g, '');
        const guestName = `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.toLowerCase();
        const guestPhone = (b.guest?.phone || '').toLowerCase().replace(/[\s\-\/\(\)]/g, '');
        const guestEmail = (b.guest?.email || '').toLowerCase();
        const company = (b.guest?.company || '').toLowerCase();
        const bookNum = (b.bookingNumber || '').toLowerCase();
        const invNum = (b.invoiceNumber || '').toLowerCase();
        const notes = (b.guest?.notes || '').toLowerCase();

        const matches = (
          guestName.includes(term) ||
          guestPhone.includes(cleanTerm) ||
          guestEmail.includes(term) ||
          company.includes(term) ||
          bookNum.includes(term) ||
          invNum.includes(term) ||
          notes.includes(term)
        );
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize active holds and new inquiries at the top so they are noticed immediately
      if (a.status === 'inquiry' && b.status !== 'inquiry') return -1;
      if (b.status === 'inquiry' && a.status !== 'inquiry') return 1;
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (b.status === 'open' && a.status !== 'open') return 1;
      const dateA = getBookingCheckin(a);
      const dateB = getBookingCheckin(b);
      return dateA.localeCompare(dateB);
    });
  }, [bookings, statusFilter, searchTerm, todayStr]);

  // Statistics calculation
  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const openHolds = bookings.filter(b => b.status === 'open');
    const inquiries = bookings.filter(b => b.status === 'inquiry');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalNights = confirmed.reduce((sum, b) => sum + (b.nights || 1), 0);
    const totalGuests = confirmed.reduce((sum, b) => {
      const roomGuests = (b.rooms || []).reduce((rSum, r) => rSum + (r.guests || 1), 0);
      return sum + roomGuests;
    }, 0);

    return {
      revenue: totalRevenue,
      activeBookingsCount: confirmed.length,
      openCount: openHolds.length,
      inquiryCount: inquiries.length,
      cancelledCount: cancelled.length,
      totalNights,
      totalGuests
    };
  }, [bookings]);

  // Reception Desk Counts (Badge numbers)
  const deskCounts = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const todayCheckin = confirmed.filter(b => getBookingCheckin(b) === todayStr).length;
    const todayInHouse = confirmed.filter(b => {
      const cin = getBookingCheckin(b);
      const cout = getBookingCheckout(b);
      return cin <= todayStr && cout > todayStr;
    }).length;
    const todayCheckout = confirmed.filter(b => getBookingCheckout(b) === todayStr).length;
    const upcoming = confirmed.filter(b => getBookingCheckout(b) >= todayStr).length;
    const openHolds = bookings.filter(b => b.status === 'open').length;
    const inquiries = bookings.filter(b => b.status === 'inquiry').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    return {
      todayCheckin,
      todayInHouse,
      todayCheckout,
      upcoming,
      openHolds,
      inquiries,
      cancelled,
      all: bookings.length
    };
  }, [bookings, todayStr]);

  // Guests Checking In / Out Today for Quick KPI Cards
  const todayCheckinGuests = useMemo(() => {
    return bookings.filter(b => b.status === 'confirmed' && getBookingCheckin(b) === todayStr);
  }, [bookings, todayStr]);

  const todayCheckoutGuests = useMemo(() => {
    return bookings.filter(b => b.status === 'confirmed' && getBookingCheckout(b) === todayStr);
  }, [bookings, todayStr]);


  // Live availability in Manual Booking Modal
  const manualModalAvailability = useMemo(() => {
    if (!manualBooking.checkin || !manualBooking.checkout) return null;
    return bookingStore.getAvailableRooms(manualBooking.checkin, manualBooking.checkout);
  }, [manualBooking.checkin, manualBooking.checkout, bookings]);

  const manualOccupiedRooms = useMemo(() => {
    if (!manualBooking.checkin || !manualBooking.checkout) return [];
    return bookingStore.getOccupiedRoomNumbers(manualBooking.checkin, manualBooking.checkout);
  }, [manualBooking.checkin, manualBooking.checkout, bookings]);

  // 7 Days of the currently selected week (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const days = [];
    const monday = new Date(currentWeekMonday);
    const totalEZ = inventory.einzelzimmer || 10;
    const totalDZ = inventory.doppelzimmer || 8;
    const totalRooms = totalEZ + totalDZ;

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(cur.getDate() + i);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const next = new Date(cur);
      next.setDate(next.getDate() + 1);
      const nextY = next.getFullYear();
      const nextM = String(next.getMonth() + 1).padStart(2, '0');
      const nextD = String(next.getDate()).padStart(2, '0');
      const nextDateStr = `${nextY}-${nextM}-${nextD}`;

      const avail = bookingStore.getAvailableRooms(dateStr, nextDateStr);
      const bookedEZ = Math.max(0, totalEZ - avail.einzelzimmer);
      const bookedDZ = Math.max(0, totalDZ - avail.doppelzimmer);
      const totalBooked = bookedEZ + bookedDZ;
      const rate = totalRooms > 0 ? Math.round((totalBooked / totalRooms) * 100) : 0;

      // Guests staying the night of dateStr
      const guestsOnDate = bookings.filter(b => {
        if (b.status === 'cancelled') return false;
        const cIn = getBookingCheckin(b);
        const cOut = getBookingCheckout(b);
        return cIn <= dateStr && cOut > dateStr;
      });

      days.push({
        dateStr,
        dayName: cur.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        weekdayName: cur.toLocaleDateString('de-DE', { weekday: 'long' }),
        formattedDate: `${d}.${m}.${y}`,
        isToday: dateStr === todayStr,
        bookedEZ,
        availEZ: avail.einzelzimmer,
        bookedDZ,
        availDZ: avail.doppelzimmer,
        rate,
        guests: guestsOnDate
      });
    }
    return days;
  }, [currentWeekMonday, inventory, bookings, todayStr]);

  const currentWeekRangeLabel = useMemo(() => {
    if (currentWeekDays.length !== 7) return '';
    const first = currentWeekDays[0];
    const last = currentWeekDays[6];
    return `Woche: ${first.formattedDate} – ${last.formattedDate}`;
  }, [currentWeekDays]);

  // =========================================================================
  // VIEW: LOGIN SCREEN (PASSWORD PROTECTED)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-box">
          <div className="login-header">
            <div className="login-badge-lock">
              <Lock size={24} />
            </div>
            <h2>Hostel Neustadt</h2>
            <span className="login-subtext">Geschützter Administrationsbereich</span>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group-admin">
              <label htmlFor="adminPassword">Administrator-Passwort</label>
              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon-inner" />
                <input 
                  id="adminPassword"
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Passwort eingeben..."
                  autoFocus
                  required
                />
              </div>
              {authError && <p className="auth-error-msg">{authError}</p>}
            </div>

            <button type="submit" className="btn-admin-primary w-100" disabled={isAuthenticating}>
              {isAuthenticating ? 'Prüfe Passwort...' : 'Anmelden'}
            </button>
          </form>

          <div className="login-footer">
            <Link to="/" className="login-back-link">
              <ArrowLeft size={16} /> Zurück zur Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN AUTHENTICATED DASHBOARD
  // =========================================================================
  return (
    <div className="admin-page">
      {/* Top Bar */}
      <header className="admin-header">
        <div className="admin-header-container">
          <div className="admin-brand">
            <Link to="/" className="admin-back-btn" title="Zur öffentlichen Website">
              <ArrowLeft size={18} />
              <span>Website</span>
            </Link>
            <div className="admin-logo-lockup">
              <h2>Hostel Neustadt</h2>
              <span className="admin-badge">Admin Hub</span>
            </div>
          </div>

          <div className="admin-header-actions">
            <button 
              className="btn-admin-secondary btn-logout" 
              onClick={handleLogout}
              title="Vom Dashboard abmelden"
            >
              <LogOut size={16} />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-container">
        {/* Toast Notification */}
        <AnimatePresence>
          {saveSuccessMessage && (
            <motion.div 
              className="admin-toast"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CheckCircle2 size={18} />
              <span>{saveSuccessMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 KPI Summary Cards */}
        <section className="admin-kpi-grid four-cards">
          {/* Card 1: Check-in heute */}
          <div 
            className="admin-kpi-card interactive"
            onClick={() => { setActiveTab('bookings'); setStatusFilter('today_checkin'); }}
            title="Klicken, um heutige Check-ins in der Tabelle anzuzeigen"
          >
            <div className="kpi-icon-box green">
              <LogIn size={22} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Check-in heute</span>
              <h3 className="kpi-value">{deskCounts.todayCheckin}</h3>
              <div className="kpi-guests-preview">
                {todayCheckinGuests.length === 0 ? (
                  <span className="kpi-subtext">Keine Anreisen heute</span>
                ) : (
                  <div className="kpi-names-list">
                    {todayCheckinGuests.map((b, i) => (
                      <span key={b.id || i} className="kpi-name-tag">
                        {b.guest?.lastName ? `${b.guest?.firstName ? b.guest.firstName[0] + '. ' : ''}${b.guest.lastName}` : 'Gast'}
                        {(b.rooms || []).length > 0 && (
                          <small className="kpi-room-tag">
                            ({b.rooms.map(r => `${r.count || 1}x ${r.typeId === 'einzelzimmer' ? 'EZ' : 'DZ'}`).join(', ')})
                          </small>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Check-out heute */}
          <div 
            className="admin-kpi-card interactive"
            onClick={() => { setActiveTab('bookings'); setStatusFilter('today_checkout'); }}
            title="Klicken, um heutige Check-outs in der Tabelle anzuzeigen"
          >
            <div className="kpi-icon-box rose">
              <DoorOpen size={22} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Check-out heute</span>
              <h3 className="kpi-value">{deskCounts.todayCheckout}</h3>
              <div className="kpi-guests-preview">
                {todayCheckoutGuests.length === 0 ? (
                  <span className="kpi-subtext">Keine Abreisen heute</span>
                ) : (
                  <div className="kpi-names-list">
                    {todayCheckoutGuests.map((b, i) => (
                      <span key={b.id || i} className="kpi-name-tag checkout">
                        {b.guest?.lastName ? `${b.guest?.firstName ? b.guest.firstName[0] + '. ' : ''}${b.guest.lastName}` : 'Gast'}
                        {(b.rooms || []).length > 0 && (
                          <small className="kpi-room-tag">
                            ({b.rooms.map(r => `${r.count || 1}x ${r.typeId === 'einzelzimmer' ? 'EZ' : 'DZ'}`).join(', ')})
                          </small>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Aktive Buchungen */}
          <div 
            className="admin-kpi-card interactive"
            onClick={() => { setActiveTab('bookings'); setStatusFilter('all'); }}
            title="Klicken, um alle Buchungen anzuzeigen"
          >
            <div className="kpi-icon-box blue">
              <CheckCircle2 size={22} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Aktive Buchungen</span>
              <h3 className="kpi-value">{stats.activeBookingsCount}</h3>
              <span className="kpi-subtext kpi-subtext-desktop">{stats.totalGuests} Gäste · {stats.totalNights} gebuchte Nächte</span>
              <span className="kpi-subtext kpi-subtext-mobile">{stats.totalGuests} Gäste · {stats.totalNights} Nächte</span>
            </div>
          </div>

          {/* Card 4: Zimmerbestand */}
          <div 
            className="admin-kpi-card interactive"
            onClick={() => setActiveTab('pricing')}
            title="Klicken, um Zimmerkontingente & Preise zu öffnen"
          >
            <div className="kpi-icon-box amber">
              <Bed size={22} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Zimmerbestand</span>
              <h3 className="kpi-value">
                <span className="kpi-val-num">{(inventory.einzelzimmer || 10) + (inventory.doppelzimmer || 8)}</span>
                <small className="kpi-val-unit"> Zimmer</small>
              </h3>
              <span className="kpi-subtext kpi-subtext-desktop">{inventory.einzelzimmer} Einzelzimmer · {inventory.doppelzimmer} Doppelzimmer</span>
              <span className="kpi-subtext kpi-subtext-mobile">{inventory.einzelzimmer} EZ · {inventory.doppelzimmer} DZ</span>
            </div>
          </div>
        </section>

        {/* Tab Navigation (3 Tabs) */}
        <nav className="admin-nav-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Users size={18} />
            <span className="tab-label-desktop">Buchungsübersicht & Rezeption ({bookings.length})</span>
            <span className="tab-label-mobile">Buchungen ({bookings.length})</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <CalendarDays size={18} />
            <span className="tab-label-desktop">Wochen-Belegungskalender</span>
            <span className="tab-label-mobile">Kalender</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <Calendar size={18} />
            <span className="tab-label-desktop">Staffelpreise & Sonderkonditionen ({customPeriods.length})</span>
            <span className="tab-label-mobile">Preise ({customPeriods.length})</span>
          </button>
        </nav>

        {/* =========================================================================
            TAB 1: BUCHUNGEN & REZEPTION
           ========================================================================= */}
        {activeTab === 'bookings' && (
          <section className="admin-tab-content">
            <div className="tab-header-flex">
              <div>
                <h2>Buchungsübersicht & Rezeption</h2>
                <p className="tab-subtitle">Zentrale Verwaltung aller Buchungen: Wer reist an? Wer übernachtet heute? Schnelle Suche bei Anrufen, Check-in Verwaltung, Rechnungsdruck und Stornierungen.</p>
              </div>

              <div className="tab-actions-group">
                <button 
                  className="btn-admin-primary" 
                  onClick={() => handleOpenManualBooking()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} /> Neue Buchung anlegen
                </button>

                <div className="admin-search-wrap">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Gast suchen (Name, Telefon, Buchungsnr., E-Mail)..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
                  )}
                </div>
              </div>
            </div>

            {/* Reception Filter Pills Bar */}
            <div className="desk-controls-card mb-4">
              <div className="desk-filter-pills">
                <button 
                  className={`desk-pill ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  <span>Alle</span>
                  <span className="desk-pill-badge">{deskCounts.all}</span>
                </button>

                <button 
                  className={`desk-pill ${statusFilter === 'today_checkin' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('today_checkin')}
                >
                  <span>🛎️ Check-in heute</span>
                  <span className="desk-pill-badge badge-green">{deskCounts.todayCheckin}</span>
                </button>

                <button 
                  className={`desk-pill ${statusFilter === 'today_inhouse' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('today_inhouse')}
                >
                  <span>🛏️ Aktuell im Haus</span>
                  <span className="desk-pill-badge badge-blue">{deskCounts.todayInHouse}</span>
                </button>

                <button 
                  className={`desk-pill ${statusFilter === 'today_checkout' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('today_checkout')}
                >
                  <span>🚪 Abreise heute</span>
                  <span className="desk-pill-badge badge-amber">{deskCounts.todayCheckout}</span>
                </button>

                <button 
                  className={`desk-pill ${statusFilter === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('upcoming')}
                >
                  <span>📅 Anstehend</span>
                  <span className="desk-pill-badge">{deskCounts.upcoming}</span>
                </button>

                {deskCounts.openHolds > 0 && (
                  <button 
                    className={`desk-pill ${statusFilter === 'open' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('open')}
                    title="Aktuell im 10-Minuten-Buchungsprozess"
                    style={{ borderColor: '#f59e0b', color: '#b45309' }}
                  >
                    <span>⏳ In Buchung (Hold)</span>
                    <span className="desk-pill-badge badge-amber">{deskCounts.openHolds}</span>
                  </button>
                )}

                {deskCounts.inquiries > 0 && (
                  <button 
                    className={`desk-pill ${statusFilter === 'inquiry' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('inquiry')}
                    title="Individuelle Langzeit-Anfragen (ab 14 Nächte)"
                    style={{ borderColor: '#8b5cf6', color: '#6d28d9' }}
                  >
                    <span>📋 Langzeit-Anfragen</span>
                    <span className="desk-pill-badge" style={{ background: '#7c3aed', color: '#ffffff' }}>{deskCounts.inquiries}</span>
                  </button>
                )}

                {deskCounts.cancelled > 0 && (
                  <button 
                    className={`desk-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('cancelled')}
                  >
                    <span>✕ Storniert</span>
                    <span className="desk-pill-badge">{deskCounts.cancelled}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bookings Table */}
            <div className="admin-card table-card">
              {filteredBookings.length === 0 ? (
                <div className="admin-empty-state">
                  <AlertCircle size={40} className="empty-icon" />
                  <h4>Keine Buchungen gefunden</h4>
                  <p>Für die ausgewählten Filterkriterien liegen derzeit keine Buchungsdaten vor.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (>= 768px) */}
                  <div className="table-responsive admin-desktop-table-view">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Buchungs- / Rechnungs-Nr.</th>
                          <th>Kunde / Gast</th>
                          <th>Reisezeitraum</th>
                          <th>Zimmer</th>
                          <th>Betrag</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b) => {
                          const isCancelled = b.status === 'cancelled';
                          const isOpenHold = b.status === 'open';
                          const isInquiry = b.status === 'inquiry';
                          const isExpanded = expandedBookingId === b.id;
                          return (
                            <React.Fragment key={b.id}>
                              <tr 
                                id={`booking-row-${b.id}`}
                                className={`${isCancelled ? 'row-cancelled' : ''} ${isOpenHold ? 'row-hold' : ''} ${isInquiry ? 'row-inquiry' : ''} ${isExpanded ? 'row-expanded-active' : ''}`}
                              >
                                <td>
                                  <div className="cell-id">
                                    <strong>{b.bookingNumber}</strong>
                                    <small className="text-muted">{b.invoiceNumber || (isInquiry ? 'Langzeit-Anfrage' : '')}</small>
                                  </div>
                                </td>
                                <td>
                                  <div className="cell-guest">
                                    {b.guest?.company?.trim() ? (
                                      <>
                                        <strong className="guest-name guest-company-only">{b.guest.company.trim()}</strong>
                                        <small className="guest-contact">{b.guest?.email || b.guest?.phone || '-'}</small>
                                      </>
                                    ) : (
                                      <>
                                        <span className="guest-name">{b.guest?.firstName} {b.guest?.lastName}</span>
                                        <small className="guest-contact">{b.guest?.email || b.guest?.phone || '-'}</small>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="cell-dates">
                                    <span>{new Date(b.checkin).toLocaleDateString('de-DE')} – {new Date(b.checkout).toLocaleDateString('de-DE')}</span>
                                    <small className="text-muted">{b.nights} {b.nights === 1 ? 'Nacht' : 'Nächte'}</small>
                                  </div>
                                </td>
                                <td>
                                  <div className="cell-rooms">
                                    {(b.rooms || []).map((r, ri) => (
                                      <span key={ri} className="room-pill">
                                        {r.roomNumber ? <strong>Zimmer {r.roomNumber}{r.roomNumber === 2 ? ' (♿)' : ''} · </strong> : ''}
                                        {r.count || 1}x {r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer'}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td>
                                  <div className="cell-price">
                                    <strong>{isInquiry ? 'Auf Anfrage' : `${Number(b.totalPrice || 0).toFixed(2)} €`}</strong>
                                    <small className="text-muted">
                                      {isInquiry
                                        ? 'Sonderangebot'
                                        : isOpenHold 
                                        ? '⏳ In Bearbeitung'
                                        : (b.paymentStatus === 'pending' || b.payment?.status === 'pending') 
                                        ? 'Zahlung offen' 
                                        : (b.payment?.methodLabel || 'Online-Zahlung')}
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  {isOpenHold ? (
                                    <span className="status-badge amber" title="Zimmer für 10 Min. reserviert – Zahlung noch offen">
                                      <Clock size={14} /> In Buchung ({formatHoldTimer(b.expiresAt)})
                                    </span>
                                  ) : isInquiry ? (
                                    <span className="status-badge purple" title="Individuelle Langzeit-Anfrage (ab 14 Nächte)">
                                      <Sparkles size={14} /> Langzeit-Anfrage
                                    </span>
                                  ) : isCancelled ? (
                                    <span className="status-badge red">
                                      <XCircle size={14} /> Storniert
                                    </span>
                                  ) : (b.paymentStatus === 'pending' || b.payment?.status === 'pending') ? (
                                    <span className="status-badge amber">
                                      <Clock size={14} /> Offen
                                    </span>
                                  ) : (
                                    <span className="status-badge green">
                                      <CheckCircle2 size={14} /> Bezahlt
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div className="actions-cluster">
                                    <button 
                                      className={`btn-icon ${isExpanded ? 'btn-icon-active' : ''}`}
                                      title={isExpanded ? "Details einklappen" : "Buchungsdetails aufklappen"}
                                      onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                                      aria-expanded={isExpanded}
                                    >
                                      <Eye size={16} />
                                    </button>
                                    {!isOpenHold && !isInquiry && (
                                      <button 
                                        className="btn-icon" 
                                        title="PDF-Rechnung herunterladen"
                                        onClick={() => downloadInvoicePDF(b)}
                                      >
                                        <Download size={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="expanded-booking-tr">
                                  <td colSpan={7} className="expanded-booking-td">
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.25, ease: 'easeOut' }}
                                      className="expanded-booking-panel-wrapper"
                                    >
                                      {renderExpandedBooking(b)}
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View (< 768px) */}
                  <div className="admin-mobile-booking-cards">
                    {filteredBookings.map((b) => {
                      const isCancelled = b.status === 'cancelled';
                      const isOpenHold = b.status === 'open';
                      const isInquiry = b.status === 'inquiry';
                      const isExpanded = expandedBookingId === b.id;
                      return (
                        <div 
                          key={b.id} 
                          id={`booking-card-${b.id}`}
                          className={`mobile-booking-card ${isCancelled ? 'card-cancelled' : ''} ${isOpenHold ? 'card-hold' : ''} ${isInquiry ? 'card-inquiry' : ''} ${isExpanded ? 'mobile-card-expanded' : ''}`}
                        >
                          <div className="mobile-card-top">
                            <div className="mobile-card-ids">
                              <span className="mobile-card-booking-nr">{b.bookingNumber}</span>
                              {b.invoiceNumber && <span className="mobile-card-sub">{b.invoiceNumber}</span>}
                              {isInquiry && <span className="mobile-card-sub" style={{ color: '#7c3aed', fontWeight: 600 }}>Langzeit-Anfrage</span>}
                            </div>
                            <div className="mobile-card-badge">
                              {isOpenHold ? (
                                <span className="status-badge amber">
                                  <Clock size={12} /> In Buchung ({formatHoldTimer(b.expiresAt)})
                                </span>
                              ) : isInquiry ? (
                                <span className="status-badge purple">
                                  <Sparkles size={12} /> Anfrage ({b.nights || 14}+ N.)
                                </span>
                              ) : isCancelled ? (
                                <span className="status-badge red">
                                  <XCircle size={12} /> Storniert
                                </span>
                              ) : (b.paymentStatus === 'pending' || b.payment?.status === 'pending') ? (
                                <span className="status-badge amber">
                                  <Clock size={12} /> Offen
                                </span>
                              ) : (
                                <span className="status-badge green">
                                  <CheckCircle2 size={12} /> Bezahlt
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mobile-card-guest-info">
                            {b.guest?.company?.trim() ? (
                              <h4 className="mobile-guest-name">
                                {b.guest.company.trim()}
                              </h4>
                            ) : (
                              <h4 className="mobile-guest-name">
                                {b.guest?.firstName} {b.guest?.lastName}
                              </h4>
                            )}
                          </div>

                          {/* Quick Contact Buttons */}
                          {(b.guest?.phone || b.guest?.email) && (
                            <div className="mobile-contact-pill-bar">
                              {b.guest?.phone && (
                                <a href={`tel:${b.guest.phone}`} className="mobile-contact-tap-pill" title="Gast anrufen">
                                  <PhoneCall size={13} />
                                  <span>{b.guest.phone}</span>
                                </a>
                              )}
                              {b.guest?.email && (
                                <a href={`mailto:${b.guest.email}`} className="mobile-contact-tap-pill" title="E-Mail schreiben">
                                  <Mail size={13} />
                                  <span>{b.guest.email}</span>
                                </a>
                              )}
                            </div>
                          )}

                          <div className="mobile-card-meta-list">
                            <div className="mobile-meta-row">
                              <span className="meta-row-label">Zeitraum:</span>
                              <span className="meta-row-val">
                                {new Date(b.checkin).toLocaleDateString('de-DE')} – {new Date(b.checkout).toLocaleDateString('de-DE')} 
                                <small className="meta-nights-pill"> ({b.nights} {b.nights === 1 ? 'Nacht' : 'Nächte'})</small>
                              </span>
                            </div>

                            <div className="mobile-meta-row">
                              <span className="meta-row-label">Zimmer:</span>
                              <div className="mobile-meta-rooms">
                                {(b.rooms || []).map((r, ri) => (
                                  <span key={ri} className="room-pill-mobile">
                                    {r.roomNumber ? `Zimmer ${r.roomNumber} · ` : ''}{r.count || 1}x {r.typeId === 'einzelzimmer' ? 'EZ' : 'DZ'}{r.roomNumber === 2 ? ' ♿' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mobile-meta-row">
                              <span className="meta-row-label">{isInquiry ? 'Kondition:' : 'Betrag:'}</span>
                              <span className="meta-row-price">
                                <strong>{isInquiry ? 'Auf Anfrage' : `${Number(b.totalPrice || 0).toFixed(2)} €`}</strong>
                                {!isInquiry && (
                                  <small className="meta-pay-label">
                                    {isOpenHold 
                                      ? ' · Hold' 
                                      : (b.paymentStatus === 'pending' || b.payment?.status === 'pending') 
                                      ? ' · Offen' 
                                      : ' · Bezahlt'}
                                  </small>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="mobile-card-action-bar">
                            <button 
                              className={`btn-mobile-act-primary ${isExpanded ? 'active' : ''}`}
                              onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                            >
                              <Eye size={15} /> {isExpanded ? 'Zuklappen' : 'Details'}
                            </button>

                            {!isOpenHold && !isInquiry && (
                              <button 
                                className="btn-mobile-act-sec" 
                                title="Rechnung PDF herunterladen"
                                onClick={() => downloadInvoicePDF(b)}
                              >
                                <Download size={15} /> PDF
                              </button>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="mobile-expanded-booking-panel">
                              {renderExpandedBooking(b)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB 2: WOCHEN-BELEGUNGSPLAN & ZIMMERKONTINGENT
           ========================================================================= */}
        {activeTab === 'inventory' && (
          <section className="admin-tab-content">
            <div className="tab-header-flex">
              <div>
                <h2>Wochen-Belegungskalender</h2>
                <p className="tab-subtitle">
                  Visuelle 7-Tage-Übersicht der Auslastung, Zimmerverfügbarkeiten und Gäste im Haus.
                </p>
              </div>
              <button 
                className="btn-admin-primary"
                onClick={() => handleOpenManualBooking()}
                title="Buchung für einen Gast direkt eintragen"
              >
                <Plus size={16} /> Neue Buchung anlegen
              </button>
            </div>

            {/* WOCHEN-BELEGUNGSPLAN (7-TAGE RASTER MIT NAVIGATION) */}
            <div className="weekly-calendar-section">
              <div className="admin-card">
                <div className="calendar-week-header">
                  <div className="week-header-info">
                    <div className="week-title-badge">
                      <CalendarDays size={20} />
                      <span className="week-current-range">{currentWeekRangeLabel}</span>
                    </div>
                  </div>

                  <div className="calendar-view-toggle">
                    <button 
                      type="button" 
                      className={`btn-view-toggle ${calendarViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('grid')}
                      title="Klassische 7-Tage Übersicht"
                    >
                      <CalendarDays size={15} />
                      <span className="btn-week-text-desktop">Tages-Karten</span>
                      <span className="btn-week-text-mobile">Karten</span>
                    </button>
                    <button 
                      type="button" 
                      className={`btn-view-toggle ${calendarViewMode === 'matrix' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('matrix')}
                      title="Matrix aller Zimmer 1 bis 15"
                    >
                      <LayoutGrid size={15} />
                      <span className="btn-week-text-desktop">Zimmer-Matrix (1–15)</span>
                      <span className="btn-week-text-mobile">Matrix</span>
                    </button>
                  </div>

                  <div className="calendar-nav-controls">
                    <div className="calendar-btn-nav-group">
                      <button className="btn-week-nav" onClick={handlePrevWeek} title="Vorherige Woche">
                        <ChevronLeft size={16} />
                        <span className="btn-week-text-desktop">Vorherige Woche</span>
                        <span className="btn-week-text-mobile">Zurück</span>
                      </button>
                      <button className="btn-week-nav today-btn" onClick={handleCurrentWeek} title="Zur aktuellen Woche springen">
                        <span className="btn-week-text-desktop">Aktuelle Woche</span>
                        <span className="btn-week-text-mobile">Heute</span>
                      </button>
                      <button className="btn-week-nav" onClick={handleNextWeek} title="Nächste Woche">
                        <span className="btn-week-text-desktop">Nächste Woche</span>
                        <span className="btn-week-text-mobile">Weiter</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="date-jump-wrap">
                      <Calendar size={15} className="date-jump-icon" />
                      <label htmlFor="jumpDateInput" className="date-jump-label">Datum:</label>
                      <input 
                        id="jumpDateInput"
                        type="date" 
                        value={jumpDateInput} 
                        onChange={(e) => handleJumpToDate(e.target.value)} 
                        title="Direkt zu einer Woche springen"
                      />
                    </div>
                  </div>
                </div>

                {calendarViewMode === 'grid' ? (
                  /* 7 Days Grid */
                  <div className="week-grid-7">
                    {currentWeekDays.map((d, di) => {
                      const isHigh = d.rate >= 75;
                      const isFull = d.availEZ === 0 && d.availDZ === 0;

                      return (
                        <div 
                          key={di} 
                          className={`day-col-card ${d.isToday ? 'is-today' : ''}`}
                        >
                          {/* Day Card Header */}
                          <div className="day-card-header">
                            <div>
                              <span className="day-name-short">{d.dayName}</span>
                              <span className="day-name-long">{d.weekdayName}</span>
                            </div>
                            {d.isToday && <span className="today-badge">Heute</span>}
                          </div>

                          {/* Occupancy Rate Bar */}
                          <div className="day-rate-box">
                            <div className="progress-track">
                              <div 
                                className={`progress-fill ${isFull ? 'red' : (isHigh ? 'amber' : 'green')}`}
                                style={{ width: `${d.rate}%` }}
                              ></div>
                            </div>
                            <span className="day-rate-text">{d.rate}% belegt</span>
                          </div>

                          {/* Room stats */}
                          <div className="day-rooms-stat">
                            <div className="room-stat-chip">
                              <strong>EZ:</strong> <span className={d.availEZ === 0 ? 'text-danger' : 'text-success'}>{d.availEZ} frei</span>
                            </div>
                            <div className="room-stat-chip">
                              <strong>DZ:</strong> <span className={d.availDZ === 0 ? 'text-danger' : 'text-success'}>{d.availDZ} frei</span>
                            </div>
                          </div>

                          {/* Guests in House this day */}
                          <div className="day-guests-container">
                            <span className="day-guests-title">Gäste im Haus ({d.guests.length}):</span>
                            {d.guests.length === 0 ? (
                              <span className="no-guests-label">Keine Buchungen</span>
                            ) : (
                              <ul className="day-guests-list">
                                {d.guests.map((g, gi) => {
                                  const ezCount = (g.rooms || []).filter(r => r.typeId === 'einzelzimmer').reduce((sum, r) => sum + (r.count || 1), 0);
                                  const dzCount = (g.rooms || []).filter(r => r.typeId === 'doppelzimmer').reduce((sum, r) => sum + (r.count || 1), 0);
                                  const roomDesc = [ezCount > 0 && `${ezCount}× EZ`, dzCount > 0 && `${dzCount}× DZ`].filter(Boolean).join(', ');

                                  return (
                                    <li 
                                      key={gi} 
                                      className="day-guest-chip" 
                                      onClick={() => handleSelectBookingFromCalendar(g)}
                                      title={`Klicken für Details: ${g.guest?.firstName} ${g.guest?.lastName}`}
                                    >
                                      <span className="guest-chip-name">{g.guest?.lastName || 'Gast'}</span>
                                      {roomDesc && <span className="guest-chip-rooms">({roomDesc})</span>}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>

                          {/* Quick action: Add booking for this day */}
                          <button 
                            className="btn-add-booking-day"
                            onClick={() => handleOpenManualBooking(d.dateStr)}
                            title={`Neue Reservierung ab ${d.formattedDate} anlegen`}
                          >
                            <Plus size={13} /> Buchung eintragen
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Zimmer-Belegungsmatrix (Zimmer 1 bis 15) */
                  <div className="room-matrix-container">
                    <div className="room-matrix-legend">
                      <div className="matrix-legend-item">
                        <span className="legend-indicator indicator-free"></span>
                        <span>Frei (Klick zum Reservieren)</span>
                      </div>
                      <div className="matrix-legend-item">
                        <span className="legend-indicator indicator-occupied"></span>
                        <span>Belegt (Klick für Gast-Details)</span>
                      </div>
                      <div className="matrix-legend-item">
                        <span className="legend-indicator indicator-checkin"></span>
                        <span>Anreise am Tag</span>
                      </div>
                      <div className="matrix-legend-item accessibility-legend">
                        <Accessibility size={14} className="text-accessibility" />
                        <span>Zimmer 2 ist barrierefrei / rollstuhlgerecht ♿</span>
                      </div>
                    </div>

                    <div className="room-matrix-table-scroll">
                      <table className="room-matrix-table">
                        <thead>
                          <tr>
                            <th className="th-matrix-room">Zimmer (1–15)</th>
                            {currentWeekDays.map((d, di) => (
                              <th key={di} className={`th-matrix-day ${d.isToday ? 'is-today-th' : ''}`}>
                                <div className="matrix-day-name">{d.dayName}</div>
                                <div className="matrix-day-date">{d.formattedDate.slice(0, 5)}</div>
                                {d.isToday && <span className="matrix-today-pill">Heute</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ROOM_DEFINITIONS.map(def => {
                            return (
                              <tr key={def.number} className={`matrix-row ${def.accessible ? 'is-accessible-row' : ''}`}>
                                <td className="td-matrix-room-meta">
                                  <div className="matrix-room-info-cell">
                                    <div className="matrix-room-number-wrap">
                                      <span className="matrix-room-badge">Zimmer {def.number}</span>
                                      {def.accessible && (
                                        <span className="matrix-badge-accessible" title="Barrierefreies Einzelzimmer">
                                          <Accessibility size={12} /> Barrierefrei
                                        </span>
                                      )}
                                    </div>
                                    <span className="matrix-room-type-label">
                                      {def.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer'}
                                    </span>
                                  </div>
                                </td>

                                {currentWeekDays.map((d, di) => {
                                  const occBooking = bookings.find(b => {
                                    if (b.status === 'cancelled') return false;
                                    const inRange = b.checkin <= d.dateStr && b.checkout > d.dateStr;
                                    if (!inRange) return false;
                                    if (b.rooms && Array.isArray(b.rooms) && b.rooms.length > 0) {
                                      return b.rooms.some(r => Number(r.roomNumber) === def.number);
                                    }
                                    return Number(b.roomNumber) === def.number;
                                  });

                                  const isCheckin = occBooking && occBooking.checkin === d.dateStr;

                                  if (occBooking) {
                                    return (
                                      <td key={di} className="td-matrix-day-slot">
                                        <div 
                                          className={`matrix-slot-card slot-occupied ${isCheckin ? 'is-checkin' : ''}`}
                                          onClick={() => handleSelectBookingFromCalendar(occBooking)}
                                          title={`Buchung: ${occBooking.bookingNumber}\nGast: ${occBooking.guest?.firstName} ${occBooking.guest?.lastName}\nZeitraum: ${formatDateDE(occBooking.checkin)} – ${formatDateDE(occBooking.checkout)}\nKlicken für vollständige Details`}
                                        >
                                          <div className="slot-guest-header">
                                            {isCheckin && <span className="slot-badge-checkin">IN</span>}
                                            <span className="slot-guest-name">
                                              {occBooking.guest?.lastName || 'Gast'}
                                            </span>
                                          </div>
                                          <div className="slot-booking-no">{occBooking.bookingNumber}</div>
                                        </div>
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={di} className="td-matrix-day-slot">
                                      <button 
                                        type="button"
                                        className="matrix-slot-free-btn"
                                        onClick={() => handleOpenManualBooking(d.dateStr, def.number)}
                                        title={`Zimmer ${def.number} ab ${d.formattedDate} reservieren`}
                                      >
                                        <Plus size={13} />
                                        <span>Frei</span>
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>
        )}

        {/* =========================================================================
            TAB 3: PREISE & SONDERKONDITIONEN
           ========================================================================= */}
        {activeTab === 'pricing' && (
          <section className="admin-tab-content">
            <div className="tab-header-flex">
              <div>
                <h2>Preise & Zimmerverwaltung</h2>
                <p className="tab-subtitle">Reguläre Übernachtungs-Staffelpreise, Sonderkonditionen für Messen & Saisons sowie Zimmerkontingente.</p>
              </div>
            </div>

            {/* Staffelpreise Config Form */}
            <div className="admin-card mb-8">
              <div className="card-header">
                <h3>Reguläre Staffelpreise (pro Zimmer / Nacht)</h3>
              </div>
              <form onSubmit={handleSavePricing} className="admin-pricing-form">
                <div className="pricing-grid-2">
                  {/* Einzelzimmer */}
                  <div className="pricing-box">
                    <div className="pricing-box-header">
                      <h4>Einzelzimmer</h4>
                      <span className="pill-badge">Private Single</span>
                    </div>

                    <div className="tier-input-row">
                      <label>1–3 Tage:</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          value={pricing.einzelzimmer?.tier1_3 || 70}
                          onChange={(e) => setPricing({
                            ...pricing,
                            einzelzimmer: { ...pricing.einzelzimmer, tier1_3: Number(e.target.value) }
                          })}
                          required 
                        />
                        <span>€</span>
                      </div>
                    </div>

                    <div className="tier-input-row">
                      <label>4–6 Tage:</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          value={pricing.einzelzimmer?.tier4_6 || 65}
                          onChange={(e) => setPricing({
                            ...pricing,
                            einzelzimmer: { ...pricing.einzelzimmer, tier4_6: Number(e.target.value) }
                          })}
                          required 
                        />
                        <span>€</span>
                      </div>
                    </div>

                    <div className="tier-input-row highlight">
                      <label>ab 7 Tage (Sparpreis):</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          value={pricing.einzelzimmer?.tier7plus || 60}
                          onChange={(e) => setPricing({
                            ...pricing,
                            einzelzimmer: { ...pricing.einzelzimmer, tier7plus: Number(e.target.value) }
                          })}
                          required 
                        />
                        <span>€</span>
                      </div>
                    </div>
                  </div>

                  {/* Doppelzimmer */}
                  <div className="pricing-box">
                    <div className="pricing-box-header">
                      <h4>Doppelzimmer</h4>
                      <span className="pill-badge">Private Double</span>
                    </div>

                    <div className="tier-input-row">
                      <label>1–3 Tage:</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          value={pricing.doppelzimmer?.tier1_3 || 100}
                          onChange={(e) => setPricing({
                            ...pricing,
                            doppelzimmer: { ...pricing.doppelzimmer, tier1_3: Number(e.target.value) }
                          })}
                          required 
                        />
                        <span>€</span>
                      </div>
                    </div>

                    <div className="tier-input-row">
                      <label>4–6 Tage:</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          value={pricing.doppelzimmer?.tier4_6 || 90}
                          onChange={(e) => setPricing({
                            ...pricing,
                            doppelzimmer: { ...pricing.doppelzimmer, tier4_6: Number(e.target.value) }
                          })}
                          required 
                        />
                        <span>€</span>
                      </div>
                    </div>

                    <div className="tier-input-row highlight">
                      <label>ab 7 Tage (Sparpreis):</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          value={pricing.doppelzimmer?.tier7plus || 80}
                          onChange={(e) => setPricing({
                            ...pricing,
                            doppelzimmer: { ...pricing.doppelzimmer, tier7plus: Number(e.target.value) }
                          })}
                          required 
                        />
                        <span>€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-submit-row">
                  <button type="submit" className="btn-admin-primary">
                    <Check size={16} /> Staffelpreise speichern
                  </button>
                </div>
              </form>
            </div>

            {/* Custom Periods (Sonderkonditionen) Table */}
            <div className="admin-card">
              <div className="card-header space-between">
                <div>
                  <h3>Sonderkonditionen & Messezeiträume ({customPeriods.length})</h3>
                  <small className="text-muted">Für Daten innerhalb dieser Intervalle überschreiben diese Preise die reguläre Staffel.</small>
                </div>
                <button className="btn-admin-primary" onClick={() => setShowAddPeriodModal(true)}>
                  <Plus size={16} /> Neue Sonderkondition hinzufügen
                </button>
              </div>

              {customPeriods.length === 0 ? (
                <div className="admin-empty-state">
                  <Calendar size={36} className="empty-icon" />
                  <h4>Keine Sonderkonditionen hinterlegt</h4>
                  <p>Legen Sie Sonderzeiträume an, um zu bestimmten Terminen angepasste Raten festzulegen.</p>
                  <button className="btn-admin-primary mt-4" onClick={() => setShowAddPeriodModal(true)}>
                    <Plus size={16} /> Neue Sonderkondition hinzufügen
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Bezeichnung</th>
                        <th>Zeitraum (Von – Bis)</th>
                        <th>Preis EZ / Nacht</th>
                        <th>Preis DZ / Nacht</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customPeriods.map((cp) => (
                        <tr key={cp.id}>
                          <td>
                            <strong>{cp.name}</strong>
                            {cp.note && <small className="text-muted block">{cp.note}</small>}
                          </td>
                          <td>
                            <span>{new Date(cp.startDate).toLocaleDateString('de-DE')} – {new Date(cp.endDate).toLocaleDateString('de-DE')}</span>
                          </td>
                          <td>
                            <strong className="text-primary">{cp.priceEZ} €</strong>
                          </td>
                          <td>
                            <strong className="text-primary">{cp.priceDZ} €</strong>
                          </td>
                          <td>
                            <button 
                              className={`status-toggle ${cp.active ? 'active' : 'inactive'}`}
                              onClick={() => handleTogglePeriodActive(cp)}
                              title={cp.active ? 'Klicken zum Pausieren' : 'Klicken zum Aktivieren'}
                            >
                              {cp.active ? 'Aktiv' : 'Pausiert'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-icon danger" 
                              onClick={() => handleDeletePeriod(cp.id)}
                              title="Zeitraum entfernen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Zimmerbestand & Überbuchungsschutz einstellen */}
            <div className="admin-card mt-6">
              <div className="card-header">
                <h3>Hostel-Zimmerkontingent & Überbuchungsschutz</h3>
                <p className="text-muted text-xs">Gesamtzahl physischer Zimmer zur automatischen Überbuchungsvermeidung</p>
              </div>
              <form onSubmit={handleSaveInventory} className="admin-form">
                <div className="admin-split-grid">
                  <div className="form-group-admin">
                    <label>
                      <span>Verfügbare Einzelzimmer (Gesamtkontingent)</span>
                      <small className="help-text">Physische Einzelzimmer im Gebäude</small>
                    </label>
                    <div className="input-with-stepper">
                      <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        value={inventory.einzelzimmer}
                        onChange={(e) => setInventory({ ...inventory, einzelzimmer: parseInt(e.target.value) || 0 })}
                        required
                      />
                      <span className="unit-label">Zimmer</span>
                    </div>
                  </div>

                  <div className="form-group-admin">
                    <label>
                      <span>Verfügbare Doppelzimmer (Gesamtkontingent)</span>
                      <small className="help-text">Physische Doppelzimmer im Gebäude</small>
                    </label>
                    <div className="input-with-stepper">
                      <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        value={inventory.doppelzimmer}
                        onChange={(e) => setInventory({ ...inventory, doppelzimmer: parseInt(e.target.value) || 0 })}
                        required
                      />
                      <span className="unit-label">Zimmer</span>
                    </div>
                  </div>
                </div>

                <div className="inventory-summary-box">
                  <ShieldCheck size={20} className="shield-icon" />
                  <div>
                    <strong>Überbuchungsschutz aktiv</strong>
                    <p>Vor jeder Reservierung prüft das System in Echtzeit das Kontingent. Sobald alle Zimmer belegt sind, blockiert die Buchungsseite weitere Anfragen für den Zeitraum automatisch.</p>
                  </div>
                </div>

                <button type="submit" className="btn-admin-primary">
                  <Check size={16} /> Zimmerkontingente aktualisieren
                </button>
              </form>
            </div>
          </section>
        )}
      </main>



      {/* =========================================================================
          MODAL: NEUE SONDERKONDITION
         ========================================================================= */}
      <AnimatePresence>
        {showAddPeriodModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowAddPeriodModal(false)}>
            <motion.div 
              className="admin-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <span className="modal-badge">Sonderkondition</span>
                  <h3>Neue Sonderkondition / Messezeit anlegen</h3>
                </div>
                <button className="modal-close" onClick={() => setShowAddPeriodModal(false)}>×</button>
              </div>

              <form onSubmit={handleAddPeriod} className="admin-form">
                <div className="modal-body">
                  <div className="form-group-admin">
                    <label>Bezeichnung des Anlasses (z. B. Messe, Event, Saison) *</label>
                    <input 
                      type="text" 
                      placeholder="z. B. Hannover Messe, Interschutz, Domfest..."
                      value={newPeriod.name}
                      onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-grid-2-admin">
                    <div className="form-group-admin">
                      <label>Von (Erster Tag) *</label>
                      <input 
                        type="date" 
                        value={newPeriod.startDate}
                        onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Bis (Letzter Tag) *</label>
                      <input 
                        type="date" 
                        value={newPeriod.endDate}
                        min={newPeriod.startDate}
                        onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2-admin">
                    <div className="form-group-admin">
                      <label>Preis Einzelzimmer pro Nacht *</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          placeholder="z. B. 120"
                          value={newPeriod.priceEZ}
                          onChange={(e) => setNewPeriod({ ...newPeriod, priceEZ: e.target.value })}
                          required
                        />
                        <span>€</span>
                      </div>
                    </div>
                    <div className="form-group-admin">
                      <label>Preis Doppelzimmer pro Nacht *</label>
                      <div className="input-euro">
                        <input 
                          type="number" 
                          placeholder="z. B. 160"
                          value={newPeriod.priceDZ}
                          onChange={(e) => setNewPeriod({ ...newPeriod, priceDZ: e.target.value })}
                          required
                        />
                        <span>€</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group-admin">
                    <label>Notiz / Beschreibung (optional)</label>
                    <textarea 
                      rows="2"
                      placeholder="Zusätzliche interne Notizen..."
                      value={newPeriod.note}
                      onChange={(e) => setNewPeriod({ ...newPeriod, note: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-admin-secondary" onClick={() => setShowAddPeriodModal(false)}>
                    Abbrechen
                  </button>
                  <button type="submit" className="btn-admin-primary">
                    <Plus size={16} /> Zeitraum speichern
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: MANUELLE BUCHUNG ANLEGEN (ADMIN / HOTELIER)
         ========================================================================= */}
      <AnimatePresence>
        {showManualBookingModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowManualBookingModal(false)}>
            <motion.div 
              className="admin-modal-card modal-large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <span className="modal-badge">Manuelle Reservierung</span>
                  <h3>Neue Buchung anlegen</h3>
                </div>
                <button className="modal-close" onClick={() => setShowManualBookingModal(false)}>×</button>
              </div>

              <form onSubmit={handleSaveManualBooking} className="admin-form">
                <div className="modal-body">
                  {/* Reisedaten & Zimmer */}
                  <div className="manual-booking-section">
                    <h4>1. Reisedaten & Zimmer</h4>
                    <div className="form-grid-2-admin">
                      <div className="form-group-admin">
                        <label>Anreise-Datum *</label>
                        <input 
                          type="date" 
                          value={manualBooking.checkin} 
                          onChange={(e) => {
                            const newIn = e.target.value;
                            setManualBooking(prev => ({ ...prev, checkin: newIn }));
                            updateManualSuggestedPrice(newIn, manualBooking.checkout, manualBooking.countEZ, manualBooking.countDZ);
                          }}
                          required 
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Abreise-Datum *</label>
                        <input 
                          type="date" 
                          value={manualBooking.checkout} 
                          min={manualBooking.checkin}
                          onChange={(e) => {
                            const newOut = e.target.value;
                            setManualBooking(prev => ({ ...prev, checkout: newOut }));
                            updateManualSuggestedPrice(manualBooking.checkin, newOut, manualBooking.countEZ, manualBooking.countDZ);
                          }}
                          required 
                        />
                      </div>
                    </div>

                    {manualModalAvailability && (
                      <div className="availability-hint-banner">
                        <ShieldCheck size={16} />
                        <span>
                          Freie Zimmer für diesen Zeitraum: 
                          <strong> {manualModalAvailability.einzelzimmer} Einzelzimmer</strong>, 
                          <strong> {manualModalAvailability.doppelzimmer} Doppelzimmer</strong>
                        </span>
                      </div>
                    )}

                    <div className="form-group-admin mt-3">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DoorOpen size={16} /> Zimmernummer gezielt zuweisen (Zimmer 1–15)
                      </label>
                      <select
                        value={manualBooking.roomNumber}
                        onChange={(e) => {
                          const chosenNum = e.target.value;
                          if (!chosenNum) {
                            setManualBooking(prev => ({ ...prev, roomNumber: '' }));
                          } else {
                            const def = ROOM_DEFINITIONS.find(r => r.number === Number(chosenNum));
                            const newEZ = def?.typeId === 'einzelzimmer' ? 1 : 0;
                            const newDZ = def?.typeId === 'doppelzimmer' ? 1 : 0;
                            setManualBooking(prev => ({
                              ...prev,
                              roomNumber: chosenNum,
                              countEZ: newEZ,
                              countDZ: newDZ
                            }));
                            updateManualSuggestedPrice(manualBooking.checkin, manualBooking.checkout, newEZ, newDZ);
                          }
                        }}
                      >
                        <option value="">Automatische Zuweisung nach Zimmerkontingent</option>
                        {ROOM_DEFINITIONS.map(def => {
                          const isOccupied = manualOccupiedRooms.includes(def.number);
                          return (
                            <option key={def.number} value={def.number} disabled={isOccupied}>
                              Zimmer {def.number} · {def.typeLabel} {def.accessible ? '♿' : ''} {isOccupied ? '— [Belegt]' : '— [Frei]'}
                            </option>
                          );
                        })}
                      </select>
                      <small className="form-help-text">
                        {manualBooking.roomNumber ? (
                          <span style={{ color: '#059669', fontWeight: 600 }}>
                            Feste Zuweisung aktiv: Zimmer {manualBooking.roomNumber} ({ROOM_DEFINITIONS.find(r => r.number === Number(manualBooking.roomNumber))?.typeLabel})
                          </span>
                        ) : (
                          <span>Standardmäßig wählt das System beim Eintragen automatisch ein freies Zimmer.</span>
                        )}
                      </small>
                    </div>

                    <div className="form-grid-2-admin mt-3">
                      <div className="form-group-admin">
                        <label>Anzahl Einzelzimmer</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="20"
                          value={manualBooking.countEZ} 
                          disabled={Boolean(manualBooking.roomNumber)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setManualBooking(prev => ({ ...prev, countEZ: val }));
                            updateManualSuggestedPrice(manualBooking.checkin, manualBooking.checkout, val, manualBooking.countDZ);
                          }}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Anzahl Doppelzimmer</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="20"
                          value={manualBooking.countDZ} 
                          disabled={Boolean(manualBooking.roomNumber)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setManualBooking(prev => ({ ...prev, countDZ: val }));
                            updateManualSuggestedPrice(manualBooking.checkin, manualBooking.checkout, manualBooking.countEZ, val);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gastdaten */}
                  <div className="manual-booking-section mt-3">
                    <h4>2. Gastdaten & Kontakt</h4>
                    <div className="form-grid-2-admin">
                      <div className="form-group-admin">
                        <label>Vorname des Gastes *</label>
                        <input 
                          type="text" 
                          placeholder="z. B. Max"
                          value={manualBooking.firstName}
                          onChange={(e) => setManualBooking({ ...manualBooking, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Nachname des Gastes *</label>
                        <input 
                          type="text" 
                          placeholder="z. B. Mustermann"
                          value={manualBooking.lastName}
                          onChange={(e) => setManualBooking({ ...manualBooking, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2-admin">
                      <div className="form-group-admin">
                        <label>Firma / Organisation (optional)</label>
                        <input 
                          type="text" 
                          placeholder="z. B. Siemens AG"
                          value={manualBooking.company}
                          onChange={(e) => setManualBooking({ ...manualBooking, company: e.target.value })}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Telefonnummer (für Rezeption)</label>
                        <input 
                          type="text" 
                          placeholder="z. B. 0176 12345678"
                          value={manualBooking.phone}
                          onChange={(e) => setManualBooking({ ...manualBooking, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group-admin">
                      <label>E-Mail-Adresse (optional für Rechnungsversand)</label>
                      <input 
                        type="email" 
                        placeholder="gast@beispiel.de"
                        value={manualBooking.email}
                        onChange={(e) => setManualBooking({ ...manualBooking, email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Zahlung & Preis */}
                  <div className="manual-booking-section mt-3">
                    <h4>3. Abrechnung & Zahlungsstatus</h4>
                    
                    <div className="form-group-admin">
                      <label>Zahlungsstatus</label>
                      <div className="payment-toggle-group">
                        <label className={`payment-toggle-btn ${manualBooking.paymentStatus === 'paid' ? 'active-green' : ''}`}>
                          <input 
                            type="radio" 
                            name="paymentStatus" 
                            checked={manualBooking.paymentStatus === 'paid'}
                            onChange={() => setManualBooking(prev => ({ 
                              ...prev, 
                              paymentStatus: 'paid',
                              paymentMethod: prev.paymentMethod && prev.paymentMethod !== 'pending' ? prev.paymentMethod : 'bar'
                            }))}
                          />
                          <span>✓ Bereits bezahlt</span>
                        </label>

                        <label className={`payment-toggle-btn ${manualBooking.paymentStatus === 'pending' ? 'active-amber' : ''}`}>
                          <input 
                            type="radio" 
                            name="paymentStatus" 
                            checked={manualBooking.paymentStatus === 'pending'}
                            onChange={() => setManualBooking(prev => ({ 
                              ...prev, 
                              paymentStatus: 'pending',
                              paymentMethod: 'pending'
                            }))}
                          />
                          <span>⏳ Nicht bezahlt (Offen)</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-grid-2-admin mt-2">
                      <div className="form-group-admin">
                        <label>Zahlungsart</label>
                        {manualBooking.paymentStatus === 'pending' ? (
                          <div className="payment-method-locked-hint">
                            <span className="badge-locked">
                              ⏳ Keine Auswahl möglich (Zahlung noch offen)
                            </span>
                            <small className="form-help-muted">
                              Wird erst erfasst, sobald der Gast vor Ort oder per Überweisung bezahlt.
                            </small>
                          </div>
                        ) : (
                          <select 
                            value={manualBooking.paymentMethod}
                            onChange={(e) => setManualBooking({ ...manualBooking, paymentMethod: e.target.value })}
                          >
                            <option value="bar">Barzahlung vor Ort</option>
                            <option value="ec">EC-Karte / Terminal vor Ort</option>
                            <option value="ueberweisung">Banküberweisung</option>
                            <option value="rechnung">Rechnung auf Ziel</option>
                            <option value="online">Online bezahlt</option>
                          </select>
                        )}
                      </div>

                      <div className="form-group-admin">
                        <label>Gesamtpreis in € (frei anpassbar)</label>
                        <div className="input-euro">
                          <input 
                            type="number" 
                            step="0.01"
                            value={manualBooking.customPrice}
                            onChange={(e) => setManualBooking({ ...manualBooking, customPrice: e.target.value })}
                            required
                          />
                          <span>€</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group-admin mt-2">
                      <label>Interne Notiz / Bemerkung</label>
                      <textarea 
                        rows="2"
                        placeholder="z. B. Spätanreise nach 21 Uhr, Stammkunde, Parkplatz gewünscht..."
                        value={manualBooking.notes}
                        onChange={(e) => setManualBooking({ ...manualBooking, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-admin-secondary" onClick={() => setShowManualBookingModal(false)}>
                    Abbrechen
                  </button>
                  <button type="submit" className="btn-admin-primary">
                    <Check size={16} /> Buchung verbindlich speichern
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
