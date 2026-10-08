import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, DollarSign, Bed, BedDouble, ShieldCheck,
  CheckCircle2, XCircle, Clock, Search, Filter, Download,
  Trash2, Plus, Edit3, ArrowLeft, ChevronRight, ChevronLeft, AlertCircle,
  Eye, FileText, Check, Lock, LogOut, KeyRound, Sparkles, LogIn, DoorOpen,
  Phone, PhoneCall, UserCheck, CalendarDays, ExternalLink, RefreshCw, Mail,
  Accessibility, Send, LayoutGrid
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
                          return (
                            <tr key={b.id} className={`${isCancelled ? 'row-cancelled' : ''} ${isOpenHold ? 'row-hold' : ''} ${isInquiry ? 'row-inquiry' : ''}`}>
                              <td>
                                <div className="cell-id">
                                  <strong>{b.bookingNumber}</strong>
                                  <small className="text-muted">{b.invoiceNumber || (isInquiry ? 'Langzeit-Anfrage' : '')}</small>
                                </div>
                              </td>
                              <td>
                                <div className="cell-guest">
                                  <span className="guest-name">{b.guest?.firstName} {b.guest?.lastName}</span>
                                  {b.guest?.company && <span className="guest-company">{b.guest.company}</span>}
                                  <small className="guest-contact">{b.guest?.email || b.guest?.phone || '-'}</small>
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
                                  {!isOpenHold && !isInquiry && (
                                    <>
                                      <button 
                                        className="btn-icon" 
                                        title="PDF-Rechnung herunterladen"
                                        onClick={() => downloadInvoicePDF(b)}
                                      >
                                        <Download size={16} />
                                      </button>
                                      {b.guest?.email && (
                                        <button 
                                          className="btn-icon" 
                                          title={`Rechnung & Bestätigung erneut per E-Mail an ${b.guest.email} senden`}
                                          onClick={() => handleResendInvoice(b)}
                                          disabled={isResendingInvoice}
                                        >
                                          <Mail size={16} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {isInquiry && b.guest?.email && (
                                    <a 
                                      href={`mailto:${b.guest.email}?subject=Angebot%20f%C3%BCr%20Ihre%20Buchungsanfrage%20${b.bookingNumber}`}
                                      className="btn-icon"
                                      title="E-Mail Angebot senden"
                                    >
                                      <Mail size={16} />
                                    </a>
                                  )}
                                  {isInquiry && b.guest?.phone && (
                                    <a 
                                      href={`tel:${b.guest.phone}`}
                                      className="btn-icon"
                                      title="Gast anrufen"
                                    >
                                      <PhoneCall size={16} />
                                    </a>
                                  )}
                                  <button 
                                    className="btn-icon" 
                                    title="Buchungsdetails ansehen"
                                    onClick={() => setSelectedBooking(b)}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  {b.status === 'confirmed' && (
                                    <button 
                                      className="btn-icon" 
                                      style={{ color: '#b45309' }}
                                      title="Buchung stornieren (Zimmer sofort freigeben & Mollie-Erstattung)"
                                      onClick={() => handleCancelBooking(b.id)}
                                      disabled={isCancellingBooking}
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  )}
                                  <button 
                                    className="btn-icon danger" 
                                    title={isOpenHold ? 'Hold abbrechen & Zimmer sofort freigeben' : isInquiry ? 'Anfrage entfernen' : 'Buchung dauerhaft aus dem System löschen'}
                                    onClick={() => handleDeleteBooking(b.id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
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
                      return (
                        <div 
                          key={b.id} 
                          className={`mobile-booking-card ${isCancelled ? 'card-cancelled' : ''} ${isOpenHold ? 'card-hold' : ''} ${isInquiry ? 'card-inquiry' : ''}`}
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
                            <h4 className="mobile-guest-name">
                              {b.guest?.firstName} {b.guest?.lastName}
                            </h4>
                            {b.guest?.company && (
                              <span className="mobile-guest-company">{b.guest.company}</span>
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
                              className="btn-mobile-act-primary"
                              onClick={() => setSelectedBooking(b)}
                            >
                              <Eye size={15} /> Details
                            </button>

                            {!isOpenHold && !isInquiry && (
                              <>
                                <button 
                                  className="btn-mobile-act-sec" 
                                  title="Rechnung PDF herunterladen"
                                  onClick={() => downloadInvoicePDF(b)}
                                >
                                  <Download size={15} /> PDF
                                </button>
                                {b.guest?.email && (
                                  <button 
                                    className="btn-mobile-act-sec" 
                                    title="Rechnung erneut an Gast senden"
                                    onClick={() => handleResendInvoice(b)}
                                    disabled={isResendingInvoice}
                                  >
                                    <Mail size={15} /> Senden
                                  </button>
                                )}
                              </>
                            )}

                            {b.status === 'confirmed' && (
                              <button 
                                className="btn-mobile-act-warn" 
                                title="Stornieren"
                                onClick={() => handleCancelBooking(b.id)}
                                disabled={isCancellingBooking}
                              >
                                <XCircle size={15} />
                              </button>
                            )}

                            <button 
                              className="btn-mobile-act-danger"
                              title="Löschen"
                              onClick={() => handleDeleteBooking(b.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
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
                                      onClick={() => setSelectedBooking(g)}
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
                                          onClick={() => setSelectedBooking(occBooking)}
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
          MODAL: BUCHUNGSDETAILS
         ========================================================================= */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="admin-modal-backdrop" onClick={() => setSelectedBooking(null)}>
            <motion.div 
              className="admin-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <span className={`modal-badge ${selectedBooking.status === 'inquiry' ? 'badge-inquiry' : ''}`}>
                    {selectedBooking.bookingNumber} {selectedBooking.status === 'inquiry' ? '· Langzeit-Anfrage' : ''}
                  </span>
                  <h3>{selectedBooking.status === 'inquiry' ? 'Individuelle Buchungsanfrage (ab 14 Nächte)' : 'Buchungsdetails & Kundendaten'}</h3>
                </div>
                <button className="modal-close" onClick={() => setSelectedBooking(null)}>×</button>
              </div>

              <div className="modal-body">
                {selectedBooking.status === 'inquiry' && (
                  <div className="desk-notes-banner" style={{ background: '#f5f3ff', borderColor: '#ddd6fe', color: '#5b21b6', marginBottom: '1.25rem' }}>
                    <Sparkles size={18} className="notes-icon" style={{ color: '#7c3aed' }} />
                    <div>
                      <strong>Individuelle Buchungsanfrage ({selectedBooking.nights} Nächte)</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                        Dieser Gast hat ein individuelles Angebot für einen Aufenthalt ab 14 Tagen angefragt. Sie können ihn direkt telefonisch oder per E-Mail kontaktieren, um ein passendes Angebot zu unterbreiten.
                      </p>
                    </div>
                  </div>
                )}

                {selectedBooking.status === 'open' && (
                  <div className="desk-notes-banner" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', marginBottom: '1.25rem' }}>
                    <Clock size={18} className="notes-icon" style={{ color: '#b45309' }} />
                    <div>
                      <strong>Gast befindet sich gerade im 10-Minuten-Buchungsprozess ({formatHoldTimer(selectedBooking.expiresAt)})</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                        Die Zimmer sind für diesen Gast reserviert. Wenn der Gast die Online-Zahlung abschließt, wechselt der Status automatisch zu „Bezahlt“. Bricht er ab oder geht zurück, wird der Eintrag sofort entfernt.
                      </p>
                    </div>
                  </div>
                )}

                {/* Guest Data */}
                <div className="modal-section">
                  <h4>Hauptbucher</h4>
                  <div className="modal-grid-2">
                    <div>
                      <small className="text-muted">Name:</small>
                      <p><strong>{selectedBooking.guest?.firstName} {selectedBooking.guest?.lastName}</strong></p>
                    </div>
                    <div>
                      <small className="text-muted">Firma:</small>
                      <p>{selectedBooking.guest?.company || 'Privat'}</p>
                    </div>
                    <div>
                      <small className="text-muted">E-Mail:</small>
                      <p>{selectedBooking.guest?.email}</p>
                    </div>
                    <div>
                      <small className="text-muted">Telefon:</small>
                      <p>
                        {selectedBooking.guest?.phone ? (
                          <a href={`tel:${selectedBooking.guest.phone}`} className="modal-phone-link">
                            <PhoneCall size={13} /> {selectedBooking.guest.phone}
                          </a>
                        ) : (
                          <span className="text-muted">Keine Angabe</span>
                        )}
                      </p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <small className="text-muted">Anschrift:</small>
                      <p>{selectedBooking.guest?.street}, {selectedBooking.guest?.zip} {selectedBooking.guest?.city}</p>
                    </div>
                  </div>
                  {selectedBooking.guest?.notes && (
                    <div className="modal-note-box">
                      <small className="text-muted">Anmerkungen des Gastes:</small>
                      <p>{selectedBooking.guest.notes}</p>
                    </div>
                  )}
                </div>

                {/* Stay & Room Data */}
                <div className="modal-section">
                  <h4>Aufenthalt & Zimmer</h4>
                  <div className="modal-grid-2">
                    <div>
                      <small className="text-muted">Früheste Anreise:</small>
                      <p><strong>{formatDateDE(getBookingCheckin(selectedBooking))}</strong></p>
                    </div>
                    <div>
                      <small className="text-muted">Späteste Abreise:</small>
                      <p><strong>{formatDateDE(getBookingCheckout(selectedBooking))}</strong></p>
                    </div>
                  </div>
                  <div className="modal-rooms-summary">
                    {(selectedBooking.rooms || []).map((r, i) => {
                      const roomName = r.name || (r.type === 'doppelzimmer' || r.typeId === 'doppelzimmer' ? 'Doppelzimmer' : 'Einzelzimmer');
                      const rCin = r.checkin || selectedBooking.checkin;
                      const rCout = r.checkout || selectedBooking.checkout;
                      const nights = r.nights || selectedBooking.nights || 1;
                      const price = r.total || r.totalPrice || 0;

                      return (
                        <div key={i} className="modal-room-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.65rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{r.count || 1}x {roomName}</strong>
                              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                                {formatDateDE(rCin)} – {formatDateDE(rCout)} ({nights} {nights === 1 ? 'Nacht' : 'Nächte'})
                              </div>
                            </div>
                            <strong>{selectedBooking.status === 'inquiry' ? 'Auf Anfrage' : `${Number(price).toFixed(2)} €`}</strong>
                          </div>

                          {selectedBooking.status !== 'inquiry' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.825rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#0369a1' }}>
                                <DoorOpen size={15} />
                                <span>{r.roomNumber ? `Zimmer ${r.roomNumber}${r.roomNumber === 2 ? ' (Barrierefrei ♿)' : ''}` : 'Noch kein Zimmer zugewiesen'}</span>
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Zimmer ändern:</label>
                                <select 
                                  value={r.roomNumber || ''} 
                                  onChange={(e) => handleUpdateBookingRoomNumber(selectedBooking.id, i, e.target.value)}
                                  style={{ padding: '0.3rem 0.6rem', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff' }}
                                  title="Zimmer für diesen Gast neu zuweisen"
                                >
                                  <option value="" disabled>Zimmer wählen...</option>
                                  {ROOM_DEFINITIONS.map(def => (
                                    <option key={def.number} value={def.number}>
                                      Zimmer {def.number} – {def.typeLabel}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment & Invoice / Inquiry Status */}
                {selectedBooking.status === 'inquiry' ? (
                  <div className="modal-section">
                    <h4>Anfragestatus & Direktkontakt</h4>
                    <div className="modal-grid-2">
                      <div>
                        <small className="text-muted">Status:</small>
                        <p style={{ color: '#7c3aed', fontWeight: 600 }}>📋 Anfrage eingegangen</p>
                      </div>
                      <div>
                        <small className="text-muted">Gewünschte Dauer:</small>
                        <p><strong>{selectedBooking.nights} Nächte</strong></p>
                      </div>
                      <div>
                        <small className="text-muted">Preiskondition:</small>
                        <p>Individuell auf Anfrage</p>
                      </div>
                      <div>
                        <small className="text-muted">Eingang am:</small>
                        <p>{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('de-DE') : '-'}</p>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {selectedBooking.guest?.email && (
                        <a 
                          href={`mailto:${selectedBooking.guest.email}?subject=Angebot%20f%C3%BCr%20Ihre%20Buchungsanfrage%20${selectedBooking.bookingNumber}%20-%20Hostel%20Neustadt`}
                          className="btn-admin-primary"
                          style={{ textDecoration: 'none' }}
                        >
                          <Mail size={16} /> E-Mail Angebot senden
                        </a>
                      )}
                      {selectedBooking.guest?.phone && (
                        <a 
                          href={`tel:${selectedBooking.guest.phone}`}
                          className="btn-admin-secondary"
                          style={{ textDecoration: 'none' }}
                        >
                          <PhoneCall size={16} /> Jetzt anrufen ({selectedBooking.guest.phone})
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="modal-section">
                    <h4>Zahlung & Rechnung</h4>
                    <div className="modal-grid-2">
                      <div>
                        <small className="text-muted">Zahlungsart:</small>
                        <p>
                          {(selectedBooking.paymentStatus === 'pending' || selectedBooking.payment?.status === 'pending')
                            ? 'Noch keine (Zahlung offen)'
                            : (selectedBooking.payment?.methodLabel || 'Online-Zahlung')}
                        </p>
                      </div>
                      <div>
                        <small className="text-muted">Status:</small>
                        {selectedBooking.status === 'cancelled' ? (
                          <p className="text-danger">Storniert</p>
                        ) : (selectedBooking.paymentStatus === 'pending' || selectedBooking.payment?.status === 'pending') ? (
                          <p style={{ color: '#d97706', fontWeight: 600 }}>⏳ Nicht bezahlt (Offen)</p>
                        ) : (
                          <p className="text-success">✓ Vollständig bezahlt</p>
                        )}
                      </div>
                      <div>
                        <small className="text-muted">Rechnungsnummer:</small>
                        <p><strong>{selectedBooking.invoiceNumber}</strong></p>
                      </div>
                      <div>
                        <small className="text-muted">Transaktions-ID:</small>
                        <p className="font-mono text-muted">{selectedBooking.payment?.transactionId || '-'}</p>
                      </div>
                    </div>

                    {selectedBooking.status !== 'cancelled' && (selectedBooking.paymentStatus === 'pending' || selectedBooking.payment?.status === 'pending') && (
                      <div className="quick-pay-action-box">
                        <span>Zahlung jetzt erfassen & als bezahlt markieren:</span>
                        <div className="quick-pay-btn-group">
                          <button 
                            type="button" 
                            className="btn-mark-paid"
                            onClick={() => handleMarkBookingPaid(selectedBooking.id, 'bar')}
                          >
                            ✓ Bar bezahlt
                          </button>
                          <button 
                            type="button" 
                            className="btn-mark-paid"
                            onClick={() => handleMarkBookingPaid(selectedBooking.id, 'ec')}
                          >
                            ✓ EC / Karte bezahlt
                          </button>
                          <button 
                            type="button" 
                            className="btn-mark-paid"
                            onClick={() => handleMarkBookingPaid(selectedBooking.id, 'ueberweisung')}
                          >
                            ✓ Banküberweisung
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {selectedBooking.status !== 'open' && selectedBooking.status !== 'inquiry' && (
                  <>
                    <button 
                      className="btn-admin-primary" 
                      onClick={() => downloadInvoicePDF(selectedBooking)}
                    >
                      <Download size={16} /> PDF-Rechnung
                    </button>
                    {selectedBooking.guest?.email && (
                      <button 
                        className="btn-admin-secondary" 
                        onClick={() => handleResendInvoice(selectedBooking)}
                        disabled={isResendingInvoice}
                        title={`Rechnung erneut an ${selectedBooking.guest.email} senden`}
                      >
                        {isResendingInvoice ? <RefreshCw size={16} className="spin-icon" /> : <Mail size={16} />}
                        Rechnung erneut versenden
                      </button>
                    )}
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button 
                    className="btn-admin-secondary" 
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={isCancellingBooking}
                    style={{ color: '#b45309', borderColor: '#fde68a' }}
                    title="Buchung stornieren (Zimmer sofort freigeben & Mollie-Erstattung)"
                  >
                    <XCircle size={16} /> {isCancellingBooking ? 'Storniere...' : 'Buchung stornieren'}
                  </button>
                )}
                <button 
                  className="btn-admin-danger" 
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                >
                  <Trash2 size={16} /> {selectedBooking.status === 'open' ? 'Hold abbrechen & Zimmer freigeben' : selectedBooking.status === 'inquiry' ? 'Anfrage löschen' : 'Buchung endgültig löschen'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
