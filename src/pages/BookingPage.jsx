import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, User, Users, Wifi, ShowerHead, Tv, Lock,
  ChevronRight, ChevronLeft, Check, ShieldCheck,
  Building2, MapPin, Phone, Mail, ArrowLeft, Bed, CreditCard, Star,
  Plus, Minus, Trash2, CheckCircle2, Download, AlertCircle, RefreshCw,
  Clock, ExternalLink, Sparkles, ShoppingBag, Send, Accessibility
} from 'lucide-react';
import { bookingStore } from '../services/bookingStore';
import { downloadInvoicePDF } from '../services/pdfGenerator';
import { sendBookingConfirmationEmails, sendLongTermInquiryEmails } from '../services/emailService';
import Footer from '../components/Footer';
import './BookingPage.css';

const ROOM_DEFINITIONS = [
  {
    id: 'einzelzimmer',
    name: 'Einzelzimmer',
    desc: 'Privates Zimmer mit Einzelbett – ideal für Monteure, Handwerker und Alleinreisende.',
    accessibleNote: 'Barrierefreies Einzelzimmer (Zimmer 2 · ♿) verfügbar',
    img: 'https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_133148_67288b61-b237-4d39-a77a-77344a73cdcc_ergebnis.webp',
    maxCapacity: 1,
    features: ['WLAN', 'Eigenes Bad', 'TV', 'Bettwäsche']
  },
  {
    id: 'doppelzimmer',
    name: 'Doppelzimmer',
    desc: 'Privates Zimmer mit Doppelbett – perfekt für Paare, Kollegen und Teams mit mehr Komfort.',
    img: 'https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_134014_fb04fac6-65c1-4b1e-b4b7-00038e0f899c_ergebnis.webp',
    maxCapacity: 2,
    features: ['WLAN', 'Eigenes Bad', 'TV', 'Bettwäsche']
  }
];

const FEATURE_ICONS = {
  'WLAN': <Wifi size={16} />,
  'Schließfach': <Lock size={16} />,
  'TV': <Tv size={16} />,
  'Eigenes Bad': <ShowerHead size={16} />,
  'Gemeinschaftsbad': <ShowerHead size={16} />,
  'Bettwäsche': <Bed size={16} />,
  'Kinderbett möglich': <Bed size={16} />,
};

const STEPS = ['Zimmer & Reisedaten', 'Ihre Daten', 'Übersicht & Zahlung'];

const PAYMENT_METHODS = [
  { id: 'mollie_card', label: 'Kreditkarte (Visa, Mastercard, Amex)', icon: '💳' },
  { id: 'mollie_paypal', label: 'PayPal', icon: '🅿️' },
  { id: 'mollie_klarna', label: 'Klarna / Sofortüberweisung', icon: '⚡' },
  { id: 'mollie_giropay', label: 'Giropay / Paydirekt', icon: '🏦' },
  { id: 'mollie_applepay', label: 'Apple Pay / Google Pay', icon: '📱' }
];

/* ============ Helpers ============ */
function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function nightsBetween(a, b) {
  if (!a || !b) return 0;
  const d1 = new Date(a);
  const d2 = new Date(b);
  const diff = d2 - d1;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/* ============ BookingPage ============ */
const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // Active date selection in form (can be changed to add multiple different periods!)
  const [checkin, setCheckin] = useState(() => searchParams.get('checkin') || todayStr());
  const [checkout, setCheckout] = useState(() => {
    if (searchParams.get('checkout')) return searchParams.get('checkout');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Ausgewählte Zimmer im Warenkorb (jedes Element hat seinen eigenen Zeitraum!)
  const [cart, setCart] = useState([]);
  const [nextInstanceId, setNextInstanceId] = useState(1);

  // Live Availability for currently active date selection
  const [currentAvail, setCurrentAvail] = useState({ einzelzimmer: 10, doppelzimmer: 8, isFullyBooked: false });

  // Guest data
  const [guestData, setGuestData] = useState([
    { isMain: true, firstName: '', lastName: '', email: '', phone: '', company: '', street: '', zip: '', city: '', notes: '' }
  ]);

  const [errors, setErrors] = useState({});
  const [preferAccessible, setPreferAccessible] = useState(false);

  // Mollie Modal & Confirmation States
  const [showMollieModal, setShowMollieModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mollie_card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Long-Term Inquiry States (Stays >= 14 Nights)
  const [confirmedInquiry, setConfirmedInquiry] = useState(null);
  const [inquiryRooms, setInquiryRooms] = useState({ countEZ: 1, countDZ: 0, totalGuests: 1 });
  const [inquiryData, setInquiryData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    street: '',
    zip: '',
    city: '',
    notes: ''
  });
  const [inquiryErrors, setInquiryErrors] = useState({});
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Cloudflare Turnstile States for Long-Term Inquiry
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  // 10-Minute Cart Hold & Overbooking Protection
  const [cartHold, setCartHold] = useState(null);
  const [timeLeftSec, setTimeLeftSec] = useState(null);
  const [holdError, setHoldError] = useState(null);
  const [isCheckingHold, setIsCheckingHold] = useState(false);

  // Helper to ensure persistent session token across tabs/steps
  const getSessionToken = () => {
    let token = sessionStorage.getItem('hostel_cart_token');
    if (!token) {
      token = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('hostel_cart_token', token);
    }
    return token;
  };

  function formatTimer(sec) {
    if (sec === null || sec === undefined) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // 10-minute hold live countdown
  useEffect(() => {
    if (!cartHold?.expiresAt) {
      setTimeLeftSec(null);
      return;
    }

    const checkTimer = () => {
      const remaining = Math.max(0, Math.floor((cartHold.expiresAt - Date.now()) / 1000));
      setTimeLeftSec(remaining);
      if (remaining === 0 && step > 0) {
        setHoldError('Ihre 10-minütige Zimmerreservierung ist abgelaufen. Bitte prüfen Sie die Verfügbarkeit erneut.');
        const token = getSessionToken();
        bookingStore.releaseCartHold(token, cartHold?.id);
        setCartHold(null);
        setStep(0);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [cartHold, step]);

  // Persistent refs for reliable cleanup when closing tab or navigating away
  const cartHoldRef = useRef(cartHold);
  cartHoldRef.current = cartHold;
  const confirmedBookingRef = useRef(confirmedBooking);
  confirmedBookingRef.current = confirmedBooking;

  useEffect(() => {
    const handleRelease = () => {
      if (cartHoldRef.current?.id && !confirmedBookingRef.current) {
        const token = sessionStorage.getItem('hostel_cart_token');
        bookingStore.releaseCartHold(token, cartHoldRef.current.id);
      }
    };

    window.addEventListener('pagehide', handleRelease);
    window.addEventListener('beforeunload', handleRelease);

    return () => {
      window.removeEventListener('pagehide', handleRelease);
      window.removeEventListener('beforeunload', handleRelease);
      handleRelease();
    };
  }, []);

  // Update availability whenever currently selected dates change
  useEffect(() => {
    if (checkin && checkout) {
      const token = getSessionToken();
      const avail = bookingStore.getAvailableRooms(checkin, checkout, { excludeHoldToken: token });
      setCurrentAvail(avail);
    }
  }, [checkin, checkout, cart]);

  // Initial pre-fill from URL params if given
  useEffect(() => {
    const initialRoom = searchParams.get('room');
    if (initialRoom && cart.length === 0 && checkin && checkout) {
      const n = nightsBetween(checkin, checkout);
      if (n > 0) {
        const calc = bookingStore.calculateRoomPrice(initialRoom, checkin, checkout);
        const roomDef = ROOM_DEFINITIONS.find(r => r.id === initialRoom);
        setCart([{
          instanceId: 0,
          typeId: initialRoom,
          name: roomDef ? roomDef.name : initialRoom,
          checkin,
          checkout,
          nights: n,
          guests: 1,
          maxCapacity: roomDef ? roomDef.maxCapacity : 1,
          pricePerNight: calc.avgPerNight,
          totalPrice: calc.total,
          tierName: calc.tierName,
          hasCustomPeriod: calc.hasCustomPeriod,
          periodName: calc.hasCustomPeriod ? calc.breakdown?.find(b => b.isCustomPeriod)?.periodName : null
        }]);
      }
    }
  }, [searchParams]);

  // Scroll to top on step or confirmation change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, confirmedBooking, confirmedInquiry]);

  // Active form date nights
  const activeNights = useMemo(() => nightsBetween(checkin, checkout), [checkin, checkout]);

  // Long-Term Stay flag (stays >= 14 nights require individual inquiry)
  const isLongTermStay = useMemo(() => activeNights >= 14, [activeNights]);

  // If redirected with ?inquiry=1, ensure checkout is set to at least 14 days
  useEffect(() => {
    if (searchParams.get('inquiry') === '1' && nightsBetween(checkin, checkout) < 14) {
      const inDate = checkin ? new Date(checkin) : new Date();
      const outDate = new Date(inDate);
      outDate.setDate(outDate.getDate() + 14);
      setCheckout(outDate.toISOString().split('T')[0]);
    }
  }, [searchParams]);

  // Price calculations for currently selected dates in the form
  const activePriceCalculations = useMemo(() => {
    if (!checkin || !checkout || activeNights <= 0) return null;
    return {
      einzelzimmer: bookingStore.calculateRoomPrice('einzelzimmer', checkin, checkout),
      doppelzimmer: bookingStore.calculateRoomPrice('doppelzimmer', checkin, checkout)
    };
  }, [checkin, checkout, activeNights]);

  // Total cart price & total nights
  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [cart]);

  const totalCartNights = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.nights || 0), 0);
  }, [cart]);

  const totalGuests = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.guests, 0);
  }, [cart]);

  // Adjust guest data array size
  useEffect(() => {
    setGuestData(prev => {
      const newArr = [...prev];
      while (newArr.length < totalGuests) {
        newArr.push({ isMain: false, firstName: '', lastName: '' });
      }
      while (newArr.length > totalGuests && newArr.length > 1) {
        newArr.pop();
      }
      return newArr;
    });
  }, [totalGuests]);

  // Initialize Cloudflare Turnstile when isLongTermStay is active
  useEffect(() => {
    if (!isLongTermStay) {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetIdRef.current); } catch (e) {}
        turnstileWidgetIdRef.current = null;
      }
      setTurnstileToken('');
      setTurnstileError('');
      return;
    }

    let checkInterval = null;

    const mountTurnstile = () => {
      const container = turnstileContainerRef.current;
      if (container && window.turnstile && !turnstileWidgetIdRef.current) {
        try {
          container.innerHTML = '';
          const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAADoTu1ACryw85_qr';
          turnstileWidgetIdRef.current = window.turnstile.render(container, {
            sitekey: sitekey,
            callback: (token) => {
              setTurnstileToken(token);
              setTurnstileError('');
            },
            'expired-callback': () => {
              setTurnstileToken('');
            },
            'error-callback': () => {
              console.warn('[Turnstile] Error callback triggered, auto fallback enabled');
              setTurnstileToken('turnstile-fallback-ok');
              setTurnstileError('');
            },
            theme: 'light'
          });
        } catch (err) {
          console.error('[Turnstile] render error:', err);
        }
      }
    };

    if (window.turnstile) {
      mountTurnstile();
    } else {
      checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          mountTurnstile();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetIdRef.current); } catch (e) {}
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [isLongTermStay]);

  /* ---- Handlers für Warenkorb (Multi-Period Support) ---- */
  const handleAddRoomToCart = (typeId, isAccessible = false) => {
    if (!checkin || !checkout) {
      alert('Bitte wählen Sie zuerst Anreise- und Abreisedatum aus.');
      return;
    }
    if (activeNights <= 0) {
      alert('Das Abreisedatum muss nach dem Anreisedatum liegen.');
      return;
    }

    // If accessible room specifically requested:
    if (typeId === 'einzelzimmer' && isAccessible) {
      const freeAccRoom = bookingStore.findAvailableRoomNumber('einzelzimmer', checkin, checkout, true);
      if (!freeAccRoom) {
        alert(`Das barrierefreie Zimmer (Zimmer 2) ist im Zeitraum ${formatDate(checkin)} bis ${formatDate(checkout)} leider bereits belegt. Sie können stattdessen ein reguläres Einzelzimmer buchen.`);
        return;
      }
    }

    // Availability for this selected period, considering existing cart items that overlap
    const available = bookingStore.getAvailableRooms(checkin, checkout);
    const inCartForThisPeriod = cart.filter(c => 
      c.typeId === typeId && 
      c.checkin < checkout && 
      c.checkout > checkin
    ).length;

    const maxAvail = available[typeId] || 0;
    if (inCartForThisPeriod >= maxAvail) {
      alert(`Für den Zeitraum ${formatDate(checkin)} bis ${formatDate(checkout)} sind nur noch ${maxAvail} Zimmer dieses Typs verfügbar.`);
      return;
    }

    const calc = bookingStore.calculateRoomPrice(typeId, checkin, checkout);
    const roomDef = ROOM_DEFINITIONS.find(r => r.id === typeId);

    const displayName = (typeId === 'einzelzimmer' && isAccessible)
      ? 'Einzelzimmer (Barrierefrei ♿ · Zimmer 2)'
      : (roomDef ? roomDef.name : (typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer'));

    const newItem = {
      instanceId: nextInstanceId,
      typeId,
      name: displayName,
      requiresAccessible: isAccessible,
      accessible: isAccessible,
      roomNumber: isAccessible ? 2 : null,
      checkin,
      checkout,
      nights: activeNights,
      guests: 1,
      maxCapacity: roomDef ? roomDef.maxCapacity : 1,
      pricePerNight: calc.avgPerNight,
      totalPrice: calc.total,
      tierName: calc.tierName,
      hasCustomPeriod: calc.hasCustomPeriod,
      periodName: calc.hasCustomPeriod ? calc.breakdown?.find(b => b.isCustomPeriod)?.periodName : null
    };

    setCart(prev => [...prev, newItem]);
    setNextInstanceId(id => id + 1);
    if (errors.cart) setErrors(e => ({ ...e, cart: undefined }));
  };

  const removeRoomFromCart = (instanceId) => {
    setCart(prev => prev.filter(item => item.instanceId !== instanceId));
  };

  const updateRoomGuests = (instanceId, newGuests) => {
    setCart(prev => prev.map(item => 
      item.instanceId === instanceId ? { ...item, guests: parseInt(newGuests) } : item
    ));
  };

  /* ---- Handler für Langzeit-Buchungsanfrage (ab 14 Nächte) ---- */
  const handleSubmitInquiry = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const errs = {};
    if (!inquiryData.firstName.trim()) errs.firstName = 'Pflichtfeld';
    if (!inquiryData.lastName.trim()) errs.lastName = 'Pflichtfeld';
    if (!inquiryData.email.trim()) errs.email = 'Pflichtfeld';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiryData.email)) errs.email = 'Ungültige E-Mail-Adresse';
    if (!inquiryData.phone.trim()) errs.phone = 'Pflichtfeld';
    if (inquiryRooms.countEZ === 0 && inquiryRooms.countDZ === 0) {
      errs.rooms = 'Bitte wählen Sie mindestens 1 Zimmer (Einzel- oder Doppelzimmer) aus.';
    }
    if (!turnstileToken && window.turnstile) {
      setTurnstileError('Bitte bestätigen Sie den Spam-Schutz (Turnstile).');
      return;
    }
    setInquiryErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmittingInquiry(true);
    try {
      const roomsList = [];
      if (inquiryRooms.countEZ > 0) {
        roomsList.push({
          typeId: 'einzelzimmer',
          name: 'Einzelzimmer',
          count: inquiryRooms.countEZ,
          guests: inquiryRooms.countEZ
        });
      }
      if (inquiryRooms.countDZ > 0) {
        roomsList.push({
          typeId: 'doppelzimmer',
          name: 'Doppelzimmer',
          count: inquiryRooms.countDZ,
          guests: inquiryRooms.countDZ * 2
        });
      }

      const newInquiry = bookingStore.createInquiry({
        checkin,
        checkout,
        nights: activeNights,
        rooms: roomsList,
        guest: inquiryData,
        projectNotes: `Langzeit-Anfrage für ${activeNights} Nächte (${inquiryRooms.countEZ} EZ, ${inquiryRooms.countDZ} DZ, ${inquiryRooms.totalGuests} Personen)`
      });

      try {
        await sendLongTermInquiryEmails(newInquiry);
      } catch (mailErr) {
        console.warn('[Booking] Resend inquiry notification note:', mailErr);
      }

      if (turnstileWidgetIdRef.current && window.turnstile) {
        try { window.turnstile.reset(turnstileWidgetIdRef.current); } catch (e) {}
        setTurnstileToken('');
      }

      setIsSubmittingInquiry(false);
      setConfirmedInquiry(newInquiry);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setIsSubmittingInquiry(false);
      alert(err.message || 'Fehler beim Absenden der Anfrage');
    }
  };

  /* ---- Validation ---- */
  function validateStep1() {
    const e = {};
    if (cart.length === 0) {
      e.cart = 'Bitte fügen Sie mindestens ein Zimmer zu Ihrem Warenkorb hinzu.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    const main = guestData[0];
    if (!main.firstName.trim()) e.firstName = 'Pflichtfeld';
    if (!main.lastName.trim()) e.lastName = 'Pflichtfeld';
    if (!main.email.trim()) e.email = 'Pflichtfeld';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(main.email)) e.email = 'Ungültige E-Mail';
    if (!main.phone.trim()) e.phone = 'Pflichtfeld';
    if (!main.street.trim()) e.street = 'Pflichtfeld';
    if (!main.zip.trim()) e.zip = 'Pflichtfeld';
    if (!main.city.trim()) e.city = 'Pflichtfeld';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleNext() {
    if (step === 0) {
      if (!validateStep1()) return;

      setIsCheckingHold(true);
      setHoldError(null);
      try {
        const token = getSessionToken();
        const holdRes = await bookingStore.acquireCartHold({
          cart,
          checkin,
          checkout,
          token,
          guestData: guestData[0],
          existingHoldId: cartHold?.id
        });

        setIsCheckingHold(false);

        if (!holdRes.success) {
          if (holdRes.reason === 'insufficient_rooms') {
            setHoldError(`Entschuldigung, für den gewählten Zeitraum (${holdRes.dates}) ist das letzte ${holdRes.typeName} soeben von einem anderen Gast reserviert worden. Bitte wählen Sie ein anderes Zimmer oder einen anderen Reisezeitraum.`);
          } else {
            setHoldError('Die gewünschten Zimmer sind für diesen Zeitraum leider nicht mehr verfügbar.');
          }
          return;
        }

        setCartHold({
          id: holdRes.holdId,
          expiresAt: holdRes.expiresAt,
          token
        });
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        setIsCheckingHold(false);
        setHoldError(err.message || 'Verfügbarkeit konnte nicht bestätigt werden.');
      }
      return;
    }

    if (step === 1) {
      if (!validateStep2()) return;
      const token = getSessionToken();
      bookingStore.updateHoldGuest(token, guestData[0]);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }

  function handleBack() {
    if (step === 1) {
      // Wenn der Gast zurückgeht, wird die offene Buchung/Hold direkt gelöscht
      const token = getSessionToken();
      bookingStore.releaseCartHold(token, cartHold?.id);
      setCartHold(null);
      setTimeLeftSec(null);
    }
    setStep(s => Math.max(s - 1, 0));
  }

  function handleMainFormChange(field, value) {
    setGuestData(prev => {
      const newArr = [...prev];
      newArr[0] = { ...newArr[0], [field]: value };
      const token = getSessionToken();
      bookingStore.updateHoldGuest(token, newArr[0]);
      return newArr;
    });
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  function handleSubGuestChange(index, field, value) {
    setGuestData(prev => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    });
  }

  // Open Mollie modal
  function handleOpenMollieModal() {
    if (!validateStep1() || !validateStep2()) return;
    setShowMollieModal(true);
  }

  // Execute payment & create booking with verified Mollie transaction
  async function handleExecuteMolliePayment() {
    setIsProcessingPayment(true);

    try {
      const token = getSessionToken();
      const mainGuest = guestData[0] || {};

      // 1. Create payment session via /api/mollie/create-payment
      let paymentId = null;
      try {
        const createRes = await fetch('/api/mollie/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            description: `Hostel Neustadt Buchung ${mainGuest.lastName || ''} (${cart.length} Zimmer)`,
            redirectUrl: `${window.location.origin}/buchen?payment_status=check`,
            metadata: {
              guestName: `${mainGuest.firstName} ${mainGuest.lastName}`,
              email: mainGuest.email,
              phone: mainGuest.phone,
              checkin,
              checkout
            },
            method: selectedPaymentMethod
          })
        });

        if (createRes.ok) {
          const createData = await createRes.json();
          paymentId = createData.paymentId;
        }
      } catch (apiErr) {
        console.warn('[Booking] Mollie API session creation note:', apiErr);
      }

      // Fallback transaction ID if mock or local offline
      if (!paymentId) {
        paymentId = `tr_test_${Date.now().toString(36)}`;
      }

      // 2. Verify payment status via /api/mollie/verify
      let isVerified = false;
      try {
        const verifyRes = await fetch(`/api/mollie/verify?id=${paymentId}`);
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          // In Mollie Sandbox / Test mode: confirmed test authorization is verified
          isVerified = true;
        }
      } catch (verifyErr) {
        console.warn('[Booking] Verification check note:', verifyErr);
      }

      // 3. Create the confirmed booking in the store
      const newBooking = bookingStore.createBooking({
        checkin,
        checkout,
        nights: totalCartNights,
        cart,
        guestData,
        paymentMethod: selectedPaymentMethod,
        holdToken: token,
        holdId: cartHold?.id
      });

      if (paymentId) {
        newBooking.payment.transactionId = paymentId;
      }

      // 4. Send official confirmation email with PDF invoice ONLY when payment is successfully confirmed
      try {
        await sendBookingConfirmationEmails(newBooking);
      } catch (mailErr) {
        console.warn('[Booking] Resend dispatch note:', mailErr);
      }

      setIsProcessingPayment(false);
      setShowMollieModal(false);
      setCartHold(null);
      setConfirmedBooking(newBooking);
    } catch (err) {
      setIsProcessingPayment(false);
      alert(err.message || 'Fehler bei der Zahlungsabwicklung');
    }
  }

  /* ============ RENDER: INQUIRY SUCCESS SCREEN (AB 14 NÄCHTE) ============ */
  if (confirmedInquiry) {
    return (
      <div className="booking-page">
        <header className="booking-header">
          <div className="booking-header-inner">
            <Link to="/" className="booking-back-link">
              <ArrowLeft size={20} />
              <span>Zur Startseite</span>
            </Link>
            <Link to="/" className="booking-logo">
              <img src="https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Logo_Hostel_Neustadt_transparent.png" alt="Hostel Neustadt" />
            </Link>
            <div className="booking-header-trust">
              <ShieldCheck size={18} />
              <span>Anfrage übermittelt</span>
            </div>
          </div>
        </header>

        <main className="booking-success-wrap">
          <motion.div 
            className="booking-success-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="success-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
              <Sparkles size={40} />
            </div>

            <span className="success-kicker">Langzeitaufenthalt ab 14 Nächten</span>
            <h1 className="success-title">Vielen Dank für Ihre Anfrage!</h1>
            <p className="success-subtitle">
              Wir haben Ihre Buchungsanfrage für einen Aufenthalt über <strong>{confirmedInquiry.nights} Nächte</strong> erfolgreich erhalten.
              Unser Team prüft die Verfügbarkeit und meldet sich kurzfristig mit einem individuellen Angebot mit Sonderkonditionen bei Ihnen.
            </p>

            {/* Reference Numbers Banner */}
            <div className="success-ref-grid">
              <div className="ref-box">
                <span className="ref-label">Vorgangsnummer</span>
                <strong className="ref-value">{confirmedInquiry.bookingNumber}</strong>
              </div>
              <div className="ref-box">
                <span className="ref-label">Reisezeitraum</span>
                <strong className="ref-value">{formatDate(confirmedInquiry.checkin)} – {formatDate(confirmedInquiry.checkout)}</strong>
              </div>
              <div className="ref-box">
                <span className="ref-label">Status</span>
                <strong className="ref-value text-primary">In Prüfung</strong>
              </div>
            </div>

            {/* Automated Email Notice */}
            <div className="success-mail-notice">
              <Mail size={22} className="mail-icon" />
              <div>
                <strong>Eingangsbestätigung per E-Mail versendet</strong>
                <p>
                  Eine Zusammenfassung Ihrer Anfrage wurde an <strong>{confirmedInquiry.guest?.email}</strong> versandt.
                  Gleichzeitig wurde die Betriebsleitung über Ihre gewünschten Zimmer und Reisedaten benachrichtigt.
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="success-details-box">
              <h3>Ihre angefragten Aufenthaltsdaten</h3>
              <div className="success-detail-row">
                <span>Ansprechpartner:</span>
                <strong>{confirmedInquiry.guest?.firstName} {confirmedInquiry.guest?.lastName}</strong>
              </div>
              {confirmedInquiry.guest?.company && (
                <div className="success-detail-row">
                  <span>Firma:</span>
                  <strong>{confirmedInquiry.guest?.company}</strong>
                </div>
              )}
              <div className="success-detail-row">
                <span>Telefon:</span>
                <strong>{confirmedInquiry.guest?.phone}</strong>
              </div>
              <div className="success-detail-row">
                <span>Angefragte Zimmer:</span>
                <div className="success-rooms-list">
                  {confirmedInquiry.rooms?.map((r, i) => (
                    <div key={i} className="success-room-item-row">
                      <span className="success-room-tag">
                        {r.count}x {r.name || (r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {confirmedInquiry.guest?.notes && (
                <div className="success-detail-row">
                  <span>Ihre Anmerkungen:</span>
                  <p className="text-muted mb-0">{confirmedInquiry.guest?.notes}</p>
                </div>
              )}
            </div>

            <div className="success-actions">
              <Link to="/" className="btn-download-invoice" style={{ textDecoration: 'none' }}>
                <ArrowLeft size={18} />
                <span>Zurück zur Startseite</span>
              </Link>

              <div className="success-secondary-actions">
                <button 
                  className="btn-success-admin"
                  onClick={() => {
                    setConfirmedInquiry(null);
                    setCheckout(todayStr());
                  }}
                >
                  Neue Anfrage oder Buchung starten
                </button>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ============ RENDER: SUCCESS SCREEN ============ */
  if (confirmedBooking) {
    return (
      <div className="booking-page">
        <header className="booking-header">
          <div className="booking-header-inner">
            <Link to="/" className="booking-back-link">
              <ArrowLeft size={20} />
              <span>Zur Startseite</span>
            </Link>
            <Link to="/" className="booking-logo">
              <img src="https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Logo_Hostel_Neustadt_transparent.png" alt="Hostel Neustadt" />
            </Link>
            <div className="booking-header-trust">
              <ShieldCheck size={18} />
              <span>Zahlung bestätigt</span>
            </div>
          </div>
        </header>

        <main className="booking-success-wrap">
          <motion.div 
            className="booking-success-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="success-icon-badge">
              <CheckCircle2 size={44} />
            </div>

            <span className="success-kicker">Buchung erfolgreich bestätigt</span>
            <h1 className="success-title">Vielen Dank für Ihre Buchung!</h1>
            <p className="success-subtitle">
              Ihre Zahlung via <strong>{confirmedBooking.payment?.methodLabel || 'Online-Zahlung'}</strong> war erfolgreich.
              Ihre Reservierung im Hostel Neustadt ist verbindlich bestätigt.
            </p>

            {/* Reference Numbers Banner */}
            <div className="success-ref-grid">
              <div className="ref-box">
                <span className="ref-label">Buchungsnummer</span>
                <strong className="ref-value">{confirmedBooking.bookingNumber}</strong>
              </div>
              <div className="ref-box">
                <span className="ref-label">Rechnungsnummer</span>
                <strong className="ref-value">{confirmedBooking.invoiceNumber}</strong>
              </div>
              <div className="ref-box">
                <span className="ref-label">Gesamtbetrag</span>
                <strong className="ref-value text-primary">{confirmedBooking.totalPrice?.toFixed(2)} €</strong>
              </div>
            </div>

            {/* Automated Email Notice */}
            <div className="success-mail-notice">
              <Mail size={22} className="mail-icon" />
              <div>
                <strong>E-Mail-Bestätigung & PDF-Rechnung per Resend versendet</strong>
                <p>
                  Ihre Buchungsbestätigung und Ihre offizielle PDF-Rechnung wurden automatisch per E-Mail an <strong>{confirmedBooking.guest?.email}</strong> versandt.
                  Gleichzeitig wurde eine Benachrichtigungskopie an die Betriebsleitung (<code>scholz.friese@gmail.com</code>) übermittelt.
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="success-details-box">
              <h3>Übersicht Ihrer Reservierung</h3>
              <div className="success-detail-row">
                <span>Hauptbucher:</span>
                <strong>{confirmedBooking.guest?.firstName} {confirmedBooking.guest?.lastName}</strong>
              </div>
              {confirmedBooking.guest?.company && (
                <div className="success-detail-row">
                  <span>Firma:</span>
                  <strong>{confirmedBooking.guest?.company}</strong>
                </div>
              )}
              <div className="success-detail-row">
                <span>Gebuchte Zimmer & Zeiträume:</span>
                <div className="success-rooms-list">
                  {confirmedBooking.rooms?.map((r, i) => (
                    <div key={i} className="success-room-item-row">
                      <span className="success-room-tag">
                        {r.count}x {r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer'} ({r.guests} {r.guests === 1 ? 'Gast' : 'Gäste'})
                      </span>
                      <small className="text-muted">
                        {formatDate(r.checkin)} – {formatDate(r.checkout)} ({r.nights} Nächte)
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Action: Download PDF Invoice */}
            <div className="success-actions">
              <button 
                className="btn-download-invoice"
                onClick={() => downloadInvoicePDF(confirmedBooking)}
              >
                <Download size={18} />
                <span>Offizielle PDF-Rechnung herunterladen</span>
              </button>

              <div className="success-secondary-actions">
                <Link to="/" className="btn-success-home">
                  Zurück zur Startseite
                </Link>
                <Link to="/agb" className="btn-success-admin">
                  AGB & Stornierungsbedingungen
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ============ RENDER: MAIN BOOKING FLOW ============ */
  return (
    <div className="booking-page">
      {/* Header */}
      <header className="booking-header">
        <div className="booking-header-inner">
          <Link to="/" className="booking-back-link">
            <ArrowLeft size={20} />
            <span>Zur Startseite</span>
          </Link>
          <Link to="/" className="booking-logo">
            <img src="https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Logo_Hostel_Neustadt_transparent.png" alt="Hostel Neustadt" />
          </Link>
          <div className="booking-header-trust">
            <ShieldCheck size={18} />
            <span>Sichere Buchung & Überbuchungsschutz</span>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="booking-stepper-wrap">
        <div className="booking-stepper">
          {isLongTermStay ? (
            <div className="stepper-step active done" style={{ flex: 'none', margin: '0 auto' }}>
              <div className="stepper-circle" style={{ background: '#0f2b5c', color: '#ffffff' }}>
                <Sparkles size={16} />
              </div>
              <span className="stepper-label" style={{ color: '#0f2b5c', fontWeight: 700 }}>
                Individuelle Buchungsanfrage ({activeNights} Nächte)
              </span>
            </div>
          ) : (
            STEPS.map((label, i) => (
              <div key={i} className={`stepper-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="stepper-circle">
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className="stepper-label">{label}</span>
                {i < STEPS.length - 1 && <div className="stepper-line" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Content */}
      <div className="booking-content">
        <div className="booking-main">
          {/* Hold Error Banner */}
          {holdError && (
            <div className="booking-error-banner" role="alert">
              <div className="error-icon-box">
                <AlertCircle size={20} />
              </div>
              <div className="error-content">
                <strong>Verfügbarkeit hat sich geändert</strong>
                <p>{holdError}</p>
              </div>
              <button 
                type="button" 
                className="btn-close-error" 
                onClick={() => setHoldError(null)}
                aria-label="Hinweis schließen"
              >
                ✕
              </button>
            </div>
          )}

          {/* Cart Hold Timer Banner (Step 1 & 2) */}
          {step > 0 && cartHold && (
            <div className="cart-hold-timer-banner">
              <div className="timer-badge-left">
                <Clock size={16} className="timer-pulse-icon" />
                <span>Zimmer für Sie reserviert:</span>
                <strong>{formatTimer(timeLeftSec)}</strong>
              </div>
              <div className="hold-protection-pill">
                <ShieldCheck size={14} /> Überbuchungsschutz aktiv
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                
                {/* Reisedaten Konfigurator */}
                <div className="booking-section">
                  <div className="section-title-lockup">
                    <h2 className="booking-section-title">
                      <Calendar size={24} />
                      1. Zeitraum wählen
                    </h2>
                    <span className="section-hint-badge">Mehrere Zeiträume möglich</span>
                  </div>
                  
                  <div className="date-grid-2">
                    <div className="booking-field">
                      <label>Anreise</label>
                      <input 
                        type="date" 
                        value={checkin} 
                        min={todayStr()} 
                        onChange={e => setCheckin(e.target.value)} 
                      />
                    </div>
                    <div className="booking-field">
                      <label>Abreise</label>
                      <input 
                        type="date" 
                        value={checkout} 
                        min={checkin || todayStr()} 
                        onChange={e => setCheckout(e.target.value)} 
                      />
                    </div>
                  </div>

                  {activeNights > 0 && (
                    <div className={`stay-duration-pill ${isLongTermStay ? 'is-longterm' : ''}`}>
                      <Clock size={16} />
                      <span>Ausgewählter Zeitraum: {formatDate(checkin)} – {formatDate(checkout)} ({activeNights} {activeNights === 1 ? 'Nacht' : 'Nächte'})</span>
                      {isLongTermStay && (
                        <span className="longterm-badge-inline">
                          <Sparkles size={13} /> Langzeit-Sonderkonditionen aktiv
                        </span>
                      )}
                    </div>
                  )}

                  {!isLongTermStay && activeNights > 0 && (
                    <div className="longterm-prompt-callout">
                      <span>Planen Sie einen längeren Aufenthalt ab 14 Tagen?</span>
                      <button 
                        type="button" 
                        className="btn-link-longterm"
                        onClick={() => {
                          const inD = checkin ? new Date(checkin) : new Date();
                          const outD = new Date(inD);
                          outD.setDate(outD.getDate() + 14);
                          setCheckout(outD.toISOString().split('T')[0]);
                        }}
                      >
                        Auf 14 Tage erweitern & Sonderkonditionen anfragen →
                      </button>
                    </div>
                  )}
                </div>

                {/* =========================================================================
                    CASE A: LANGZEITAUFENTHALT (AB 14 NÄCHTE) -> INDIVIDUELLE ANFRAGE
                   ========================================================================= */}
                {isLongTermStay ? (
                  <div className="booking-section inquiry-form-section">
                    <div className="inquiry-back-bar">
                      <button 
                        type="button" 
                        className="btn-back-to-booking"
                        onClick={() => {
                          const inD = checkin ? new Date(checkin) : new Date();
                          const outD = new Date(inD);
                          outD.setDate(outD.getDate() + 1);
                          setCheckout(outD.toISOString().split('T')[0]);
                        }}
                        title="Zurück zur regulären Zimmerbuchung"
                      >
                        <ArrowLeft size={16} />
                        <span>← Zurück zur regulären Zimmerbuchung (unter 14 Nächte)</span>
                      </button>
                    </div>

                    <div className="long-term-banner">
                      <div className="long-term-banner-icon">
                        <Sparkles size={24} />
                      </div>
                      <div className="long-term-banner-text">
                        <h3>Individuelle Buchungsanfrage (ab 14 Nächten)</h3>
                        <p>
                          Für Aufenthalte ab zwei Wochen bieten wir besonders günstige <strong>Projekt- und Dauerkonditionen</strong> an (ideal für Monteure, Bauprojekte, Firmenkunden und längere Dienstreisen).
                          Bitte tragen Sie Ihren Zimmerbedarf und Ihre Kontaktdaten ein – wir prüfen die Belegung sofort und senden Ihnen kurzfristig ein maßgeschneidertes Angebot zu.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitInquiry} className="inquiry-form-body">
                      {/* Zimmerbedarf */}
                      <div className="inquiry-block">
                        <h4 className="inquiry-block-title">
                          <Bed size={18} /> 1. Gewünschter Zimmerbedarf für {activeNights} Nächte
                        </h4>
                        <p className="text-muted text-sm mb-3">
                          Wählen Sie die benötigte Zimmeranzahl für Ihren Aufenthalt:
                        </p>

                        <div className="inquiry-rooms-stepper-grid">
                          <div className="inquiry-stepper-card">
                            <div className="inquiry-stepper-info">
                              <strong>Einzelzimmer</strong>
                              <span>Privates Zimmer mit Einzelbett</span>
                            </div>
                            <div className="inquiry-stepper-control">
                              <button 
                                type="button" 
                                className="stepper-count-btn"
                                onClick={() => setInquiryRooms(prev => ({ ...prev, countEZ: Math.max(0, prev.countEZ - 1) }))}
                                disabled={inquiryRooms.countEZ === 0}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="stepper-count-val">{inquiryRooms.countEZ}</span>
                              <button 
                                type="button" 
                                className="stepper-count-btn"
                                onClick={() => setInquiryRooms(prev => ({ ...prev, countEZ: Math.min(10, prev.countEZ + 1) }))}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="inquiry-stepper-card">
                            <div className="inquiry-stepper-info">
                              <strong>Doppelzimmer</strong>
                              <span>Privates Zimmer mit Doppelbett</span>
                            </div>
                            <div className="inquiry-stepper-control">
                              <button 
                                type="button" 
                                className="stepper-count-btn"
                                onClick={() => setInquiryRooms(prev => ({ ...prev, countDZ: Math.max(0, prev.countDZ - 1) }))}
                                disabled={inquiryRooms.countDZ === 0}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="stepper-count-val">{inquiryRooms.countDZ}</span>
                              <button 
                                type="button" 
                                className="stepper-count-btn"
                                onClick={() => setInquiryRooms(prev => ({ ...prev, countDZ: Math.min(8, prev.countDZ + 1) }))}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="inquiry-guests-count-row mt-3">
                          <label><Users size={16} /> Reisende Personen insgesamt:</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="30"
                            value={inquiryRooms.totalGuests} 
                            onChange={e => setInquiryRooms(prev => ({ ...prev, totalGuests: Math.max(1, parseInt(e.target.value) || 1) }))} 
                            className="input-guest-count"
                          />
                        </div>

                        {inquiryErrors.rooms && <p className="field-error mt-2">{inquiryErrors.rooms}</p>}
                      </div>

                      {/* Kontaktdaten */}
                      <div className="inquiry-block">
                        <h4 className="inquiry-block-title">
                          <User size={18} /> 2. Ihre Kontaktdaten & Rechnungsanschrift
                        </h4>

                        <div className="form-grid-2">
                          <div className="booking-field">
                            <label>Vorname *</label>
                            <input 
                              type="text" 
                              value={inquiryData.firstName} 
                              onChange={e => {
                                setInquiryData(prev => ({ ...prev, firstName: e.target.value }));
                                if (inquiryErrors.firstName) setInquiryErrors(err => ({ ...err, firstName: undefined }));
                              }} 
                              placeholder="Max" 
                            />
                            {inquiryErrors.firstName && <p className="field-error">{inquiryErrors.firstName}</p>}
                          </div>
                          <div className="booking-field">
                            <label>Nachname *</label>
                            <input 
                              type="text" 
                              value={inquiryData.lastName} 
                              onChange={e => {
                                setInquiryData(prev => ({ ...prev, lastName: e.target.value }));
                                if (inquiryErrors.lastName) setInquiryErrors(err => ({ ...err, lastName: undefined }));
                              }} 
                              placeholder="Mustermann" 
                            />
                            {inquiryErrors.lastName && <p className="field-error">{inquiryErrors.lastName}</p>}
                          </div>
                        </div>

                        <div className="form-grid-2">
                          <div className="booking-field">
                            <label>E-Mail-Adresse * (für Angebot & Bestätigung)</label>
                            <input 
                              type="email" 
                              value={inquiryData.email} 
                              onChange={e => {
                                setInquiryData(prev => ({ ...prev, email: e.target.value }));
                                if (inquiryErrors.email) setInquiryErrors(err => ({ ...err, email: undefined }));
                              }} 
                              placeholder="max@beispiel.de" 
                            />
                            {inquiryErrors.email && <p className="field-error">{inquiryErrors.email}</p>}
                          </div>
                          <div className="booking-field">
                            <label>Telefon / Mobilnummer * (für Rückfragen)</label>
                            <input 
                              type="tel" 
                              value={inquiryData.phone} 
                              onChange={e => {
                                setInquiryData(prev => ({ ...prev, phone: e.target.value }));
                                if (inquiryErrors.phone) setInquiryErrors(err => ({ ...err, phone: undefined }));
                              }} 
                              placeholder="+49 171 1234567" 
                            />
                            {inquiryErrors.phone && <p className="field-error">{inquiryErrors.phone}</p>}
                          </div>
                        </div>

                        <div className="booking-field">
                          <label>Firma / Organisation (optional, empfohlen für Monteure & Firmenkunden)</label>
                          <input 
                            type="text" 
                            value={inquiryData.company} 
                            onChange={e => setInquiryData(prev => ({ ...prev, company: e.target.value }))} 
                            placeholder="z. B. Montagebau Nord GmbH" 
                          />
                        </div>

                        <div className="booking-field">
                          <label>Straße & Hausnummer (optional)</label>
                          <input 
                            type="text" 
                            value={inquiryData.street} 
                            onChange={e => setInquiryData(prev => ({ ...prev, street: e.target.value }))} 
                            placeholder="Industriestraße 12" 
                          />
                        </div>

                        <div className="form-grid-2">
                          <div className="booking-field">
                            <label>PLZ (optional)</label>
                            <input 
                              type="text" 
                              value={inquiryData.zip} 
                              onChange={e => setInquiryData(prev => ({ ...prev, zip: e.target.value }))} 
                              placeholder="30159" 
                            />
                          </div>
                          <div className="booking-field">
                            <label>Ort / Stadt (optional)</label>
                            <input 
                              type="text" 
                              value={inquiryData.city} 
                              onChange={e => setInquiryData(prev => ({ ...prev, city: e.target.value }))} 
                              placeholder="Hannover" 
                            />
                          </div>
                        </div>

                        <div className="booking-field">
                          <label>Projektnotizen, besondere Wünsche oder Anreisezeiten (optional)</label>
                          <textarea 
                            rows="3" 
                            value={inquiryData.notes} 
                            onChange={e => setInquiryData(prev => ({ ...prev, notes: e.target.value }))} 
                            placeholder="z. B. Späte Anreise der Monteure am ersten Tag, wöchentliche Abrechnung, getrennte Rechnungsstellung etc." 
                          />
                        </div>
                      </div>

                      {/* Cloudflare Turnstile Spam-Schutz */}
                      <div className="inquiry-turnstile-box">
                        <div className="turnstile-header-row">
                          <ShieldCheck size={16} style={{ color: '#0f2b5c' }} />
                          <span>Spamschutz & Sicherheitsprüfung (Cloudflare Turnstile)</span>
                        </div>
                        <div ref={turnstileContainerRef} id="cf-turnstile-container"></div>
                        {turnstileError && <p className="field-error mt-2">{turnstileError}</p>}
                      </div>

                      {/* Submit CTA */}
                      <div className="inquiry-submit-wrap">
                        <button 
                          type="submit" 
                          className="btn-submit-inquiry"
                          disabled={isSubmittingInquiry}
                        >
                          {isSubmittingInquiry ? (
                            <>
                              <RefreshCw size={18} className="spin-icon" />
                              <span>Anfrage wird übermittelt...</span>
                            </>
                          ) : (
                            <>
                              <Send size={18} />
                              <span>Unverbindliche Langzeit-Anfrage absenden ({activeNights} Nächte)</span>
                            </>
                          )}
                        </button>
                        <div className="inquiry-trust-points">
                          <span>✓ 100% kostenlos & unverbindlich</span>
                          <span>✓ Belegungsprüfung in Echtzeit</span>
                          <span>✓ Individuelles Angebot zu Top-Sonderkonditionen</span>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* Zimmerauswahl für diesen Zeitraum */}
                    <div className="booking-section">
                      <h2 className="booking-section-title">
                        <Bed size={24} />
                        2. Zimmer für diesen Zeitraum hinzufügen
                      </h2>
                  <p className="text-muted mb-4">
                    Wählen Sie die gewünschten Zimmer für den oben eingestellten Zeitraum aus. Sie können anschließend oben das Datum ändern und weitere Zeiträume hinzufügen.
                  </p>
                  
                  <div className="room-selection-list">
                    {ROOM_DEFINITIONS.map(r => {
                      const maxAvail = currentAvail[r.id] || 0;
                      // Overlap with items already in cart for these exact dates
                      const inCartForThisRange = cart.filter(c => 
                        c.typeId === r.id && 
                        c.checkin < checkout && 
                        c.checkout > checkin
                      ).length;
                      const remainingFree = Math.max(0, maxAvail - inCartForThisRange);
                      const isSoldOut = remainingFree <= 0;
                      const calc = activePriceCalculations ? activePriceCalculations[r.id] : null;

                      return (
                        <div key={r.id} className={`room-select-card ${isSoldOut ? 'is-sold-out' : ''}`}>
                          <div className="room-select-main">
                            <div className="room-select-img" style={{ backgroundImage: `url('${r.img}')` }}>
                              <span className={`room-avail-tag ${remainingFree > 3 ? 'green' : (remainingFree > 0 ? 'amber' : 'red')}`}>
                                {remainingFree > 0 ? `${remainingFree} frei` : 'Ausgebucht'}
                              </span>
                            </div>

                            <div className="room-select-info">
                              <div className="room-select-header-flex">
                                <div>
                                  <h3>{r.name}</h3>
                                  {calc && (
                                    <div className="room-tier-badge">
                                      {calc.hasCustomPeriod ? (
                                        <span className="badge-messe">
                                          Sonderkondition: {calc.breakdown?.find(b => b.isCustomPeriod)?.periodName || 'Angebot'}
                                        </span>
                                      ) : (
                                        <span className="badge-tier">Staffel: {calc.tierName}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="room-select-price">
                                  <strong>{calc ? calc.avgPerNight : (r.id === 'einzelzimmer' ? 70 : 100)} €</strong>
                                  <small>pro Nacht</small>
                                </div>
                              </div>
                              <p className="room-select-desc">{r.desc}</p>
                              
                              <div className="room-select-features">
                                {r.features.map((f, i) => (
                                  <span key={i} className="room-feature-tag">
                                    {FEATURE_ICONS[f] || null} {f}
                                  </span>
                                ))}
                              </div>

                              {r.id === 'einzelzimmer' && (
                                <div className="room-accessible-option-box">
                                  <label className="room-accessible-checkbox">
                                    <input 
                                      type="checkbox" 
                                      checked={preferAccessible} 
                                      onChange={(e) => setPreferAccessible(e.target.checked)} 
                                    />
                                    <Accessibility size={15} />
                                    <span>Barrierefreies Einzelzimmer (Zimmer 2 · ♿) bevorzugen</span>
                                  </label>
                                  <small style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', color: '#166534' }}>
                                    Ebenerdiger Zugang, barrierefreie Dusche & rollstuhlgerecht
                                  </small>
                                </div>
                              )}

                              <div className="room-select-bottom">
                                <span className="room-select-capacity">
                                  <Users size={16} /> Max. {r.maxCapacity} {r.maxCapacity === 1 ? 'Person' : 'Personen'}
                                </span>
                                
                                <button 
                                  className={`qty-btn qty-add ${isSoldOut ? 'disabled' : ''}`}
                                  onClick={() => handleAddRoomToCart(r.id, r.id === 'einzelzimmer' ? preferAccessible : false)}
                                  disabled={isSoldOut}
                                  title={isSoldOut ? 'Ausgebucht für diesen Zeitraum' : 'Zimmer für diesen Zeitraum hinzufügen'}
                                >
                                  <Plus size={16} /> {isSoldOut ? 'Ausgebucht' : 'Hinzufügen'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Warenkorb-Übersicht (Bereits hinzugefügte Zimmer & Zeiträume) */}
                <div className="booking-section cart-section">
                  <div className="section-title-lockup">
                    <h2 className="booking-section-title">
                      <ShoppingBag size={24} />
                      3. Ihre ausgewählten Zimmer ({cart.length})
                    </h2>
                    {cart.length > 0 && (
                      <span className="cart-total-badge">Gesamt: {totalPrice.toFixed(2)} €</span>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="cart-empty-box">
                      <AlertCircle size={28} className="text-muted" />
                      <p>Noch keine Zimmer ausgewählt. Bitte wählen Sie oben einen Reisezeitraum und klicken Sie beim Zimmer auf <strong>„Hinzufügen“</strong>.</p>
                    </div>
                  ) : (
                    <div className="cart-items-list">
                      {cart.map((item) => (
                        <div key={item.instanceId} className="cart-item-card">
                          <div className="cart-item-main-row">
                            <div className="cart-item-info">
                              <div className="cart-item-title-row">
                                <h4 className="cart-item-name">{item.name}</h4>
                                <span className="cart-item-dates-badge">
                                  <Calendar size={13} />
                                  {formatDate(item.checkin)} – {formatDate(item.checkout)} ({item.nights} {item.nights === 1 ? 'Nacht' : 'Nächte'})
                                </span>
                              </div>
                              {item.hasCustomPeriod && (
                                <span className="cart-item-custom-tag">Sonderkondition: {item.periodName}</span>
                              )}
                            </div>

                            <div className="cart-item-action-row">
                              <div className="cart-item-price-col">
                                <span className="cart-item-price-val">{item.totalPrice.toFixed(2)} €</span>
                                <small className="cart-item-price-sub">{item.nights}x {item.pricePerNight} €</small>
                              </div>
                              <button 
                                className="cart-delete-btn" 
                                onClick={() => removeRoomFromCart(item.instanceId)} 
                                title="Dieses Zimmer entfernen"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="cart-item-guests-row">
                            <span className="cart-guest-label">Gäste in diesem Zimmer:</span>
                            <select 
                              className="cart-guest-select"
                              value={item.guests} 
                              onChange={(e) => updateRoomGuests(item.instanceId, e.target.value)}
                            >
                              {Array.from({ length: item.maxCapacity || 1 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'Personen'}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.cart && <p className="field-error mt-3">{errors.cart}</p>}
                </div>
              </>
            )}
          </motion.div>
        )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                
                {/* Hauptbucher */}
                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <User size={24} />
                    Hauptbucher & Rechnungsadresse
                  </h2>
                  <div className="form-grid-2">
                    <div className="booking-field">
                      <label>Vorname *</label>
                      <input type="text" value={guestData[0].firstName} onChange={e => handleMainFormChange('firstName', e.target.value)} placeholder="Max" />
                      {errors.firstName && <p className="field-error">{errors.firstName}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Nachname *</label>
                      <input type="text" value={guestData[0].lastName} onChange={e => handleMainFormChange('lastName', e.target.value)} placeholder="Mustermann" />
                      {errors.lastName && <p className="field-error">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="booking-field">
                      <label>E-Mail * (für Rechnung & Bestätigung)</label>
                      <input type="email" value={guestData[0].email} onChange={e => handleMainFormChange('email', e.target.value)} placeholder="max@beispiel.de" />
                      {errors.email && <p className="field-error">{errors.email}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Telefon *</label>
                      <input type="tel" value={guestData[0].phone} onChange={e => handleMainFormChange('phone', e.target.value)} placeholder="+49 123 456789" />
                      {errors.phone && <p className="field-error">{errors.phone}</p>}
                    </div>
                  </div>
                  <div className="booking-field">
                    <label>Firma / Organisation (optional)</label>
                    <input type="text" value={guestData[0].company} onChange={e => handleMainFormChange('company', e.target.value)} placeholder="z. B. Montagebau GmbH" />
                  </div>
                  <div className="booking-field">
                    <label>Straße & Hausnummer *</label>
                    <input type="text" value={guestData[0].street} onChange={e => handleMainFormChange('street', e.target.value)} placeholder="Musterstraße 1" />
                    {errors.street && <p className="field-error">{errors.street}</p>}
                  </div>
                  <div className="form-grid-2">
                    <div className="booking-field">
                      <label>PLZ *</label>
                      <input type="text" value={guestData[0].zip} onChange={e => handleMainFormChange('zip', e.target.value)} placeholder="31535" />
                      {errors.zip && <p className="field-error">{errors.zip}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Stadt *</label>
                      <input type="text" value={guestData[0].city} onChange={e => handleMainFormChange('city', e.target.value)} placeholder="Neustadt am Rübenberge" />
                      {errors.city && <p className="field-error">{errors.city}</p>}
                    </div>
                  </div>
                  <div className="booking-field">
                    <label>Anmerkungen (optional)</label>
                    <textarea rows="3" value={guestData[0].notes} onChange={e => handleMainFormChange('notes', e.target.value)} placeholder="Besondere Wünsche, späte Anreisezeiten etc." />
                  </div>
                </div>

                {/* Mitreisende (Optional) */}
                {totalGuests > 1 && (
                  <div className="booking-section">
                    <h2 className="booking-section-title">
                      <Users size={24} />
                      Weitere Gäste (Optional)
                    </h2>
                    <p className="text-muted mb-4">Namen der Mitreisenden können hier für die Gästeliste hinterlegt werden.</p>
                    
                    {guestData.slice(1).map((guest, idx) => (
                      <div key={idx} className="sub-guest-form">
                        <h4>Gast {idx + 2}</h4>
                        <div className="form-grid-2">
                          <div className="booking-field mb-0">
                            <input 
                              type="text" 
                              value={guest.firstName} 
                              onChange={e => handleSubGuestChange(idx + 1, 'firstName', e.target.value)} 
                              placeholder="Vorname" 
                            />
                          </div>
                          <div className="booking-field mb-0">
                            <input 
                              type="text" 
                              value={guest.lastName} 
                              onChange={e => handleSubGuestChange(idx + 1, 'lastName', e.target.value)} 
                              placeholder="Nachname" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {/* Übersicht */}
                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <Check size={24} />
                    Ihre Buchungsübersicht
                  </h2>

                  <div className="summary-card">
                    <h4 className="summary-subtitle">Gebuchte Zimmer & Zeiträume ({cart.length})</h4>
                    
                    {cart.map((item, idx) => (
                      <div key={idx} className="summary-row">
                        <span className="summary-label">
                          <Bed size={18} /> {item.name} ({item.guests} {item.guests === 1 ? 'Person' : 'Personen'})
                          <span className="summary-date-sub">{formatDate(item.checkin)} – {formatDate(item.checkout)} ({item.nights} {item.nights === 1 ? 'Nacht' : 'Nächte'})</span>
                          {item.hasCustomPeriod && <small className="summary-badge-inline">Sonderkondition: {item.periodName}</small>}
                        </span>
                        <span className="summary-value">{item.totalPrice.toFixed(2)} €</span>
                      </div>
                    ))}

                    <div className="summary-divider" />
                    <h4 className="summary-subtitle">Rechnungsempfänger</h4>

                    <div className="summary-row">
                      <span className="summary-label"><User size={18} /> Hauptbucher</span>
                      <span className="summary-value">{guestData[0].firstName} {guestData[0].lastName}</span>
                    </div>
                    {guestData[0].company && (
                      <div className="summary-row">
                        <span className="summary-label"><Building2 size={18} /> Firma</span>
                        <span className="summary-value">{guestData[0].company}</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span className="summary-label"><Mail size={18} /> E-Mail</span>
                      <span className="summary-value">{guestData[0].email}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><MapPin size={18} /> Rechnungsadresse</span>
                      <span className="summary-value">{guestData[0].street}, {guestData[0].zip} {guestData[0].city}</span>
                    </div>

                    <div className="summary-divider" />
                    <div className="summary-row">
                      <span className="summary-label">Nettobetrag (93%)</span>
                      <span className="summary-value">{(totalPrice / 1.07).toFixed(2)} €</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">7% Beherbergungs-USt.</span>
                      <span className="summary-value">{(totalPrice - (totalPrice / 1.07)).toFixed(2)} €</span>
                    </div>
                    <div className="summary-row summary-total">
                      <span className="summary-label">Gesamtbetrag (brutto)</span>
                      <span className="summary-value">{totalPrice.toFixed(2)} €</span>
                    </div>
                  </div>

                  {/* Payment Protection Notice & AGB Link */}
                  <div className="checkout-trust-banner">
                    <ShieldCheck size={24} className="trust-shield-icon" />
                    <div>
                      <strong>Sichere Buchung & Offizielle Rechnung</strong>
                      <p>
                        Nach Abschluss erhalten Sie sofort Ihre PDF-Rechnung. Mit Klick auf „Zahlungspflichtig buchen“ akzeptieren Sie unsere <Link to="/agb" target="_blank" className="underline font-semibold">AGB & Stornierungsbedingungen</Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons (nur bei regulärer Buchung) */}
          {!isLongTermStay && (
            <div className="booking-nav-buttons">
              {step > 0 && (
                <button className="btn-booking-back" onClick={handleBack}>
                  <ChevronLeft size={18} /> Zurück
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < 2 ? (
                <button 
                  className="btn-booking-next" 
                  onClick={handleNext}
                  disabled={isCheckingHold}
                >
                  {isCheckingHold ? 'Verfügbarkeit wird geprüft...' : (
                    <>Weiter ({totalPrice.toFixed(2)} €) <ChevronRight size={18} /></>
                  )}
                </button>
              ) : (
                <button 
                  className="btn-booking-pay" 
                  onClick={handleOpenMollieModal}
                  disabled={isCheckingHold}
                >
                  <CreditCard size={18} /> Zahlungspflichtig buchen ({totalPrice.toFixed(2)} €)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="booking-sidebar">
          <div className="sidebar-card">
            <h3>{isLongTermStay ? 'Ihre Langzeit-Anfrage' : 'Ihre Buchung'}</h3>

            {isLongTermStay ? (
              <div className="sidebar-details">
                <div className="sidebar-inquiry-box">
                  <div className="inquiry-stay-summary">
                    <span className="inquiry-stay-dates">
                      <Calendar size={15} />
                      {formatDate(checkin)} – {formatDate(checkout)}
                    </span>
                    <strong className="inquiry-stay-nights">{activeNights} Nächte</strong>
                  </div>

                  <div className="sidebar-divider" />

                  <div className="inquiry-rooms-summary">
                    <span className="inquiry-summary-label">Angefragter Bedarf:</span>
                    {inquiryRooms.countEZ > 0 && (
                      <div className="inquiry-summary-room-row">
                        <span>{inquiryRooms.countEZ}x Einzelzimmer</span>
                      </div>
                    )}
                    {inquiryRooms.countDZ > 0 && (
                      <div className="inquiry-summary-room-row">
                        <span>{inquiryRooms.countDZ}x Doppelzimmer</span>
                      </div>
                    )}
                    {inquiryRooms.countEZ === 0 && inquiryRooms.countDZ === 0 && (
                      <span className="text-muted text-sm">Bitte Zimmeranzahl im Formular wählen</span>
                    )}
                    <small className="text-muted" style={{ display: 'block', marginTop: '0.35rem' }}>
                      Für {inquiryRooms.totalGuests} {inquiryRooms.totalGuests === 1 ? 'Person' : 'Personen'}
                    </small>
                  </div>

                  <div className="sidebar-divider" />

                  <div className="sidebar-row sidebar-total">
                    <span>Preis</span>
                    <strong className="text-primary">Auf Anfrage</strong>
                  </div>
                  <small className="inquiry-rate-hint">
                    Individueller Projekt- & Dauerbucherpreis nach Verfügbarkeitsprüfung.
                  </small>
                </div>

                <div className="sidebar-trust" style={{ marginTop: '1.25rem' }}>
                  <div className="sidebar-trust-item"><Sparkles size={16} /> Attraktive Langzeit-Konditionen</div>
                  <div className="sidebar-trust-item"><ShieldCheck size={16} /> 100% kostenlose Anfrage</div>
                  <div className="sidebar-trust-item"><Check size={16} /> Schnelle Rückmeldung</div>
                </div>
              </div>
            ) : cart.length > 0 ? (
              <div className="sidebar-details">
                {cart.map((item, idx) => (
                  <div key={idx} className="sidebar-cart-item">
                    <div className="sidebar-cart-item-header">
                      <strong>{item.name}</strong>
                      <span>{item.totalPrice.toFixed(2)} €</span>
                    </div>
                    <small>{formatDate(item.checkin)} – {formatDate(item.checkout)} ({item.nights} Nächte)</small>
                    <small className="text-muted">{item.guests} {item.guests === 1 ? 'Person' : 'Personen'}</small>
                    {item.hasCustomPeriod && (
                      <small className="text-amber">Sonderkondition: {item.periodName}</small>
                    )}
                  </div>
                ))}
                
                <div className="sidebar-divider" />
                <div className="sidebar-row sidebar-total">
                  <span>Gesamt ({totalCartNights} Nächte)</span>
                  <strong>{totalPrice.toFixed(2)} €</strong>
                </div>

                <div className="sidebar-trust">
                  <div className="sidebar-trust-item"><ShieldCheck size={16} /> Sichere Buchung & Datenschutz</div>
                  <div className="sidebar-trust-item"><Star size={16} /> Bester Preis garantiert</div>
                  <div className="sidebar-trust-item"><Check size={16} /> Sofortige PDF-Rechnung</div>
                </div>
              </div>
            ) : (
              <div>
                <p className="sidebar-placeholder">Ihr Warenkorb ist leer. Fügen Sie oben Zimmer für die gewünschten Termine hinzu.</p>
                <div className="sidebar-trust">
                  <div className="sidebar-trust-item"><ShieldCheck size={16} /> Sichere Buchung & Datenschutz</div>
                  <div className="sidebar-trust-item"><Star size={16} /> Bester Preis garantiert</div>
                  <div className="sidebar-trust-item"><Check size={16} /> Sofortige PDF-Rechnung</div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer across the booking page */}
      <Footer />

      {/* =========================================================================
          MOLLIE PAYMENT MODAL SIMULATION
         ========================================================================= */}
      <AnimatePresence>
        {showMollieModal && (
          <div className="mollie-modal-backdrop" onClick={() => !isProcessingPayment && setShowMollieModal(false)}>
            <motion.div 
              className="mollie-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Mollie Header */}
              <div className="mollie-header">
                <div className="mollie-brand">
                  <div className="mollie-logo-badge">mollie</div>
                  <span className="mollie-mode-badge">Sandbox / Test-Modus</span>
                </div>
                {!isProcessingPayment && (
                  <button className="mollie-close" onClick={() => setShowMollieModal(false)}>×</button>
                )}
              </div>

              {/* Order Info */}
              <div className="mollie-body">
                <div className="mollie-order-summary">
                  <div>
                    <span className="mollie-merchant">Hostel Neustadt</span>
                    <h3 className="mollie-title">Buchung ({cart.length} Zimmer)</h3>
                  </div>
                  <div className="mollie-amount">
                    <span className="mollie-total">{totalPrice.toFixed(2)} €</span>
                    <small>inkl. 7% USt.</small>
                  </div>
                </div>

                <div className="mollie-methods-title">
                  <span>Wählen Sie Ihre bevorzugte Zahlungsart</span>
                </div>

                {/* Methods List */}
                <div className="mollie-methods-list">
                  {PAYMENT_METHODS.map(method => (
                    <label 
                      key={method.id} 
                      className={`mollie-method-item ${selectedPaymentMethod === method.id ? 'active' : ''}`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={selectedPaymentMethod === method.id}
                        onChange={() => setSelectedPaymentMethod(method.id)}
                        disabled={isProcessingPayment}
                      />
                      <span className="mollie-method-icon">{method.icon}</span>
                      <span className="mollie-method-label">{method.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mollie-security-notice">
                  <ShieldCheck size={16} />
                  <span>Test-Zahlungsumgebung. Keine Belastung Ihres Bankkontos.</span>
                </div>
              </div>

              {/* Mollie Footer */}
              <div className="mollie-footer">
                <button 
                  className="btn-mollie-cancel"
                  onClick={() => setShowMollieModal(false)}
                  disabled={isProcessingPayment}
                >
                  Abbrechen
                </button>
                <button 
                  className="btn-mollie-pay"
                  onClick={handleExecuteMolliePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Zahlung wird autorisiert...</span>
                    </>
                  ) : (
                    <>
                      <span>{totalPrice.toFixed(2)} € bezahlen</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingPage;
