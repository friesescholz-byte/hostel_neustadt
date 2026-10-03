import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, DollarSign, Bed, BedDouble, ShieldCheck,
  CheckCircle2, XCircle, Clock, Search, Filter, Download,
  Trash2, Plus, Edit3, ArrowLeft, ChevronRight, ChevronLeft, AlertCircle,
  Eye, FileText, Check, Lock, LogOut, KeyRound, Sparkles, LogIn, DoorOpen,
  Phone, PhoneCall, UserCheck, CalendarDays, ExternalLink, RefreshCw
} from 'lucide-react';
import { bookingStore } from '../services/bookingStore';
import { downloadInvoicePDF } from '../services/pdfGenerator';
import './AdminPage.css';

export default function AdminPage() {
  // Password Protection Gate
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('hostel_admin_auth') === 'true';
  });
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard Tabs: 'bookings' | 'inventory' | 'pricing'
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Dashboard Store Data
  const [bookings, setBookings] = useState([]);
  const [inventory, setInventory] = useState({ einzelzimmer: 10, doppelzimmer: 8 });
  const [pricing, setPricing] = useState({
    einzelzimmer: { tier1_3: 70, tier4_6: 65, tier7plus: 60 },
    doppelzimmer: { tier1_3: 100, tier4_6: 90, tier7plus: 80 }
  });
  const [customPeriods, setCustomPeriods] = useState([]);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('upcoming'); // 'upcoming' | 'today_checkin' | 'today_inhouse' | 'today_checkout' | 'open' | 'all' | 'cancelled'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [nowTime, setNowTime] = useState(Date.now());

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
  const handleLogin = (e) => {
    e.preventDefault();
    const adminSecret = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_PASSWORD) || '';
    if (adminSecret && inputPassword === adminSecret) {
      sessionStorage.setItem('hostel_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      loadData();
    } else {
      setAuthError('Falsches Passwort. Bitte überprüfen Sie Ihre Eingabe.');
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
  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Buchung wirklich stornieren? Die gebuchten Zimmer werden sofort wieder für andere Gäste freigegeben.')) {
      bookingStore.cancelBooking(bookingId);
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: 'cancelled' }));
      }
      loadData();
      triggerSaveNotification('Buchung storniert und Zimmer freigegeben.');
    }
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
  const handleOpenManualBooking = (initialDate = null) => {
    const today = new Date();
    const checkinDate = initialDate ? new Date(initialDate) : today;
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + 1);

    const checkinStr = checkinDate.toISOString().split('T')[0];
    const checkoutStr = checkoutDate.toISOString().split('T')[0];

    const calcEZ = bookingStore.calculateRoomPrice('einzelzimmer', checkinStr, checkoutStr);

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
      countEZ: 1,
      countDZ: 0,
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
    if (countEZ === 0 && countDZ === 0) {
      alert('Bitte wählen Sie mindestens 1 Zimmer (Einzel- oder Doppelzimmer) aus.');
      return;
    }

    try {
      const roomsToBook = [];
      if (countEZ > 0) {
        roomsToBook.push({ typeId: 'einzelzimmer', count: countEZ, guests: 1 });
      }
      if (countDZ > 0) {
        roomsToBook.push({ typeId: 'doppelzimmer', count: countDZ, guests: 2 });
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
      const cIn = getBookingCheckin(b);
      const cOut = getBookingCheckout(b);

      if (statusFilter === 'upcoming') {
        if (isCancelled || isOpenHold) return false;
        if (cOut < todayStr) return false;
      } else if (statusFilter === 'today_checkin') {
        if (isCancelled || isOpenHold) return false;
        if (cIn !== todayStr) return false;
      } else if (statusFilter === 'today_inhouse') {
        if (isCancelled || isOpenHold) return false;
        if (!(cIn <= todayStr && cOut > todayStr)) return false;
      } else if (statusFilter === 'today_checkout') {
        if (isCancelled || isOpenHold) return false;
        if (cOut !== todayStr) return false;
      } else if (statusFilter === 'open') {
        if (!isOpenHold) return false;
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
      // Prioritize active holds at the top so they are noticed immediately
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
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    return {
      todayCheckin,
      todayInHouse,
      todayCheckout,
      upcoming,
      openHolds,
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

            <button type="submit" className="btn-admin-primary w-100">
              Anmelden
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
              <span className="kpi-subtext">{stats.totalGuests} Gäste · {stats.totalNights} gebuchte Nächte</span>
            </div>
          </div>

          {/* Card 4: Zimmerbestand */}
          <div 
            className="admin-kpi-card interactive"
            onClick={() => setActiveTab('inventory')}
            title="Klicken, um Zimmerbestand & Kalender zu öffnen"
          >
            <div className="kpi-icon-box amber">
              <Bed size={22} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Zimmerbestand</span>
              <h3 className="kpi-value">{(inventory.einzelzimmer || 10) + (inventory.doppelzimmer || 8)} Zimmer</h3>
              <span className="kpi-subtext">{inventory.einzelzimmer} Einzelzimmer · {inventory.doppelzimmer} Doppelzimmer</span>
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
            <span>Buchungsübersicht & Rezeption ({bookings.length})</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <CalendarDays size={18} />
            <span>Wochen-Belegungskalender</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <Calendar size={18} />
            <span>Staffelpreise & Sonderkonditionen ({customPeriods.length})</span>
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
                  className={`desk-pill ${statusFilter === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('upcoming')}
                >
                  <span>📅 Alle anstehenden</span>
                  <span className="desk-pill-badge">{deskCounts.upcoming}</span>
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

                <button 
                  className={`desk-pill ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  <span>Alle ({deskCounts.all})</span>
                </button>

                {deskCounts.cancelled > 0 && (
                  <button 
                    className={`desk-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('cancelled')}
                  >
                    <span>✕ Storniert ({deskCounts.cancelled})</span>
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
                <div className="table-responsive">
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
                        return (
                          <tr key={b.id} className={`${isCancelled ? 'row-cancelled' : ''} ${isOpenHold ? 'row-hold' : ''}`}>
                            <td>
                              <div className="cell-id">
                                <strong>{b.bookingNumber}</strong>
                                <small className="text-muted">{b.invoiceNumber}</small>
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
                                    {r.count || 1}x {r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer'}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="cell-price">
                                <strong>{Number(b.totalPrice || 0).toFixed(2)} €</strong>
                                <small className="text-muted">
                                  {isOpenHold 
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
                                {!isOpenHold && (
                                  <button 
                                    className="btn-icon" 
                                    title="PDF-Rechnung herunterladen"
                                    onClick={() => downloadInvoicePDF(b)}
                                  >
                                    <Download size={16} />
                                  </button>
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
                                    title="Buchung stornieren (Zimmer sofort freigeben)"
                                    onClick={() => handleCancelBooking(b.id)}
                                  >
                                    <XCircle size={16} />
                                  </button>
                                )}
                                <button 
                                  className="btn-icon danger" 
                                  title={isOpenHold ? 'Hold abbrechen & Zimmer sofort freigeben' : 'Buchung dauerhaft aus dem System löschen'}
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
                      <h3>Wochen-Belegungskalender</h3>
                    </div>
                    <span className="week-current-range">{currentWeekRangeLabel}</span>
                  </div>

                  <div className="calendar-nav-controls">
                    <button className="btn-week-nav" onClick={handlePrevWeek} title="Vorherige Woche">
                      <ChevronLeft size={16} /> Vorherige Woche
                    </button>
                    <button className="btn-week-nav today-btn" onClick={handleCurrentWeek} title="Zur aktuellen Woche springen">
                      Aktuelle Woche
                    </button>
                    <button className="btn-week-nav" onClick={handleNextWeek} title="Nächste Woche">
                      Nächste Woche <ChevronRight size={16} />
                    </button>

                    <div className="date-jump-wrap">
                      <label htmlFor="jumpDateInput">Datum:</label>
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

                {/* 7 Days Grid */}
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
              </div>

              {/* Zimmerbestand & Überbuchungsschutz einstellen */}
              <div className="admin-card mt-4">
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
                <h2>Preise, Rabattstaffeln & Sonderkonditionen</h2>
                <p className="tab-subtitle">Passen Sie hier die regulären gestaffelten Übernachtungspreise an oder hinterlegen Sie Sonderkonditionen für Messen, Veranstaltungen oder Saisons.</p>
              </div>

              <button className="btn-admin-primary" onClick={() => setShowAddPeriodModal(true)}>
                <Plus size={16} /> Neue Sonderkondition
              </button>
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

                <div className="pricing-info-banner">
                  <div className="banner-icon">i</div>
                  <div>
                    <strong>Sonderkonditionen für Langzeitaufenthalte & Messezeiten:</strong>
                    <p>Auf der Website wird dezent darauf hingewiesen: <em>„Für längerfristige Aufenthalte gelten Sonderkonditionen → auf Anfrage“</em> und <em>„Zu Messezeiten gelten Sonderkonditionen“</em>. Eigene Datumsintervalle überschreiben in diesem Zeitraum die reguläre Staffel.</p>
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
                  <h3>Aktive Sonderkonditionen & Zeiträume ({customPeriods.length})</h3>
                  <small className="text-muted">Für Daten innerhalb dieser Intervalle überschreiben diese Preise die reguläre Staffel.</small>
                </div>
              </div>

              {customPeriods.length === 0 ? (
                <div className="admin-empty-state">
                  <Calendar size={36} className="empty-icon" />
                  <h4>Keine Sonderkonditionen hinterlegt</h4>
                  <p>Legen Sie Sonderzeiträume an, um zu bestimmten Terminen angepasste Raten festzulegen.</p>
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
                  <span className="modal-badge">{selectedBooking.bookingNumber}</span>
                  <h3>Buchungsdetails & Kundendaten</h3>
                </div>
                <button className="modal-close" onClick={() => setSelectedBooking(null)}>×</button>
              </div>

              <div className="modal-body">
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
                        <div key={i} className="modal-room-item">
                          <div>
                            <strong>{r.count || 1}x {roomName}</strong>
                            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                              {formatDateDE(rCin)} – {formatDateDE(rCout)} ({nights} {nights === 1 ? 'Nacht' : 'Nächte'})
                            </div>
                          </div>
                          <strong>{Number(price).toFixed(2)} €</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment & Invoice */}
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
              </div>

              <div className="modal-footer">
                {selectedBooking.status !== 'open' && (
                  <button 
                    className="btn-admin-primary" 
                    onClick={() => downloadInvoicePDF(selectedBooking)}
                  >
                    <Download size={16} /> PDF-Rechnung herunterladen
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button 
                    className="btn-admin-secondary" 
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    style={{ color: '#b45309', borderColor: '#fde68a' }}
                  >
                    <XCircle size={16} /> Buchung stornieren
                  </button>
                )}
                <button 
                  className="btn-admin-danger" 
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                >
                  <Trash2 size={16} /> {selectedBooking.status === 'open' ? 'Hold abbrechen & Zimmer freigeben' : 'Buchung endgültig löschen'}
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

                    <div className="form-grid-2-admin mt-3">
                      <div className="form-group-admin">
                        <label>Anzahl Einzelzimmer</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="20"
                          value={manualBooking.countEZ} 
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
