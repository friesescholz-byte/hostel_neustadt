import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, User, Users, Wifi, Coffee, ShowerHead, Tv, Lock,
  ChevronDown, ChevronRight, ChevronLeft, Check, ShieldCheck,
  Building2, MapPin, Phone, Mail, ArrowLeft, Bed, CreditCard, Star
} from 'lucide-react';
import './BookingPage.css';

/* ============ Room Data ============ */
const ROOMS = [
  {
    id: 'mehrbettzimmer',
    name: 'Mehrbettzimmer',
    desc: 'Ideal für Handwerker, Monteure & Gruppen. Gemütliche Betten in geselliger Atmosphäre.',
    price: 18,
    unit: 'pro Person / Nacht',
    img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    capacity: '4–6 Personen',
    features: ['WLAN', 'Schließfach', 'Gemeinschaftsbad', 'Bettwäsche']
  },
  {
    id: 'doppelzimmer',
    name: 'Doppelzimmer',
    desc: 'Privates Zimmer mit Doppelbett – perfekt für Paare oder Alleinreisende mit mehr Komfort.',
    price: 49,
    unit: 'pro Zimmer / Nacht',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    capacity: '2 Personen',
    features: ['WLAN', 'Eigenes Bad', 'TV', 'Bettwäsche']
  },
  {
    id: 'familienzimmer',
    name: 'Familienzimmer',
    desc: 'Geräumiges Zimmer für die ganze Familie – mit viel Platz und eigenem Badezimmer.',
    price: 79,
    unit: 'pro Zimmer / Nacht',
    img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    capacity: 'bis 4 Personen',
    features: ['WLAN', 'Eigenes Bad', 'TV', 'Bettwäsche', 'Kinderbett möglich']
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
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/* ============ BookingPage ============ */
const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(0);

  // Step 1 state – pre-filled from URL params
  const [selectedRoom, setSelectedRoom] = useState(searchParams.get('room') || '');
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '');
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '1');

  // Step 2 state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    street: '',
    zip: '',
    city: '',
    notes: ''
  });

  // Errors
  const [errors, setErrors] = useState({});

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Calculations
  const nights = useMemo(() => nightsBetween(checkin, checkout), [checkin, checkout]);
  const room = useMemo(() => ROOMS.find(r => r.id === selectedRoom), [selectedRoom]);
  const totalPrice = useMemo(() => (room ? room.price * nights : 0), [room, nights]);

  /* ---- Validation ---- */
  function validateStep1() {
    const e = {};
    if (!selectedRoom) e.room = 'Bitte wähle eine Zimmerkategorie';
    if (!checkin) e.checkin = 'Bitte Anreisedatum wählen';
    if (!checkout) e.checkout = 'Bitte Abreisedatum wählen';
    if (checkin && checkout && nights <= 0) e.checkout = 'Abreise muss nach Anreise liegen';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Pflichtfeld';
    if (!form.lastName.trim()) e.lastName = 'Pflichtfeld';
    if (!form.email.trim()) e.email = 'Pflichtfeld';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Ungültige E-Mail';
    if (!form.phone.trim()) e.phone = 'Pflichtfeld';
    if (!form.street.trim()) e.street = 'Pflichtfeld';
    if (!form.zip.trim()) e.zip = 'Pflichtfeld';
    if (!form.city.trim()) e.city = 'Pflichtfeld';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setStep(s => Math.min(s + 1, 2));
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 0));
  }

  function handleFormChange(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  function handleSubmit() {
    // Placeholder – later Mollie + Resend integration
    alert('Buchungsanfrage wurde gesendet! (Mollie-Integration kommt später)');
    navigate('/');
  }

  /* ============ RENDER ============ */
  return (
    <div className="booking-page">
      {/* Header */}
      <header className="booking-header">
        <div className="booking-header-inner">
          <Link to="/" className="booking-back-link">
            <ArrowLeft size={20} />
            <span>Zurück zur Startseite</span>
          </Link>
          <Link to="/" className="booking-logo">
            <img src="https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Logo_Hostel_Neustadt_transparent.png" alt="Hostel Neustadt" />
          </Link>
          <div className="booking-header-trust">
            <ShieldCheck size={18} />
            <span>Sichere Buchung</span>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="booking-stepper-wrap">
        <div className="booking-stepper">
          {STEPS.map((label, i) => (
            <div key={i} className={`stepper-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="stepper-circle">
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className="stepper-label">{label}</span>
              {i < STEPS.length - 1 && <div className="stepper-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="booking-content">
        <div className="booking-main">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {/* Step 1: Room & Dates */}
                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <Bed size={24} />
                    Zimmerkategorie wählen
                  </h2>
                  <div className="room-selection-grid">
                    {ROOMS.map(r => (
                      <div
                        key={r.id}
                        className={`room-select-card ${selectedRoom === r.id ? 'selected' : ''}`}
                        onClick={() => { setSelectedRoom(r.id); if (errors.room) setErrors(e => ({ ...e, room: undefined })); }}
                      >
                        {selectedRoom === r.id && <div className="room-selected-badge"><Check size={14} /> Ausgewählt</div>}
                        <div className="room-select-img" style={{ backgroundImage: `url(${r.img})` }} />
                        <div className="room-select-info">
                          <h3>{r.name}</h3>
                          <p className="room-select-desc">{r.desc}</p>
                          <div className="room-select-features">
                            {r.features.map((f, i) => (
                              <span key={i} className="room-feature-tag">
                                {FEATURE_ICONS[f] || null} {f}
                              </span>
                            ))}
                          </div>
                          <div className="room-select-bottom">
                            <span className="room-select-capacity"><Users size={16} /> {r.capacity}</span>
                            <div className="room-select-price">
                              <strong>ab {r.price} €</strong>
                              <small>{r.unit}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.room && <p className="field-error">{errors.room}</p>}
                </div>

                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <Calendar size={24} />
                    Reisedaten
                  </h2>
                  <div className="date-grid">
                    <div className="booking-field">
                      <label>Anreise</label>
                      <input type="date" value={checkin} min={todayStr()} onChange={e => { setCheckin(e.target.value); if (errors.checkin) setErrors(er => ({ ...er, checkin: undefined })); }} />
                      {errors.checkin && <p className="field-error">{errors.checkin}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Abreise</label>
                      <input type="date" value={checkout} min={checkin || todayStr()} onChange={e => { setCheckout(e.target.value); if (errors.checkout) setErrors(er => ({ ...er, checkout: undefined })); }} />
                      {errors.checkout && <p className="field-error">{errors.checkout}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Gäste</label>
                      <select value={guests} onChange={e => setGuests(e.target.value)}>
                        <option value="1">1 Gast</option>
                        <option value="2">2 Gäste</option>
                        <option value="3">3 Gäste</option>
                        <option value="4">4 Gäste</option>
                        <option value="5">5 Gäste</option>
                        <option value="6">6 Gäste</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {/* Step 2: Guest Details */}
                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <User size={24} />
                    Persönliche Daten
                  </h2>
                  <div className="form-grid-2">
                    <div className="booking-field">
                      <label>Vorname *</label>
                      <input type="text" value={form.firstName} onChange={e => handleFormChange('firstName', e.target.value)} placeholder="Max" />
                      {errors.firstName && <p className="field-error">{errors.firstName}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Nachname *</label>
                      <input type="text" value={form.lastName} onChange={e => handleFormChange('lastName', e.target.value)} placeholder="Mustermann" />
                      {errors.lastName && <p className="field-error">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="booking-field">
                      <label>E-Mail *</label>
                      <input type="email" value={form.email} onChange={e => handleFormChange('email', e.target.value)} placeholder="max@beispiel.de" />
                      {errors.email && <p className="field-error">{errors.email}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Telefon *</label>
                      <input type="tel" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} placeholder="+49 123 456789" />
                      {errors.phone && <p className="field-error">{errors.phone}</p>}
                    </div>
                  </div>
                  <div className="booking-field">
                    <label>Firma (optional)</label>
                    <input type="text" value={form.company} onChange={e => handleFormChange('company', e.target.value)} placeholder="Muster GmbH" />
                  </div>
                </div>

                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <MapPin size={24} />
                    Adresse
                  </h2>
                  <div className="booking-field">
                    <label>Straße & Hausnummer *</label>
                    <input type="text" value={form.street} onChange={e => handleFormChange('street', e.target.value)} placeholder="Musterstraße 1" />
                    {errors.street && <p className="field-error">{errors.street}</p>}
                  </div>
                  <div className="form-grid-2">
                    <div className="booking-field">
                      <label>PLZ *</label>
                      <input type="text" value={form.zip} onChange={e => handleFormChange('zip', e.target.value)} placeholder="31535" />
                      {errors.zip && <p className="field-error">{errors.zip}</p>}
                    </div>
                    <div className="booking-field">
                      <label>Stadt *</label>
                      <input type="text" value={form.city} onChange={e => handleFormChange('city', e.target.value)} placeholder="Neustadt am Rübenberge" />
                      {errors.city && <p className="field-error">{errors.city}</p>}
                    </div>
                  </div>
                  <div className="booking-field">
                    <label>Anmerkungen (optional)</label>
                    <textarea rows="3" value={form.notes} onChange={e => handleFormChange('notes', e.target.value)} placeholder="Besondere Wünsche, späte Anreise, etc." />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {/* Step 3: Overview */}
                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <Check size={24} />
                    Buchungsübersicht
                  </h2>

                  <div className="summary-card">
                    <div className="summary-row">
                      <span className="summary-label"><Bed size={18} /> Zimmer</span>
                      <span className="summary-value">{room?.name}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><Calendar size={18} /> Anreise</span>
                      <span className="summary-value">{formatDate(checkin)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><Calendar size={18} /> Abreise</span>
                      <span className="summary-value">{formatDate(checkout)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><Users size={18} /> Gäste</span>
                      <span className="summary-value">{guests}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Nächte</span>
                      <span className="summary-value">{nights}</span>
                    </div>
                    <div className="summary-divider" />
                    <div className="summary-row">
                      <span className="summary-label"><User size={18} /> Name</span>
                      <span className="summary-value">{form.firstName} {form.lastName}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><Mail size={18} /> E-Mail</span>
                      <span className="summary-value">{form.email}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><Phone size={18} /> Telefon</span>
                      <span className="summary-value">{form.phone}</span>
                    </div>
                    {form.company && (
                      <div className="summary-row">
                        <span className="summary-label"><Building2 size={18} /> Firma</span>
                        <span className="summary-value">{form.company}</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span className="summary-label"><MapPin size={18} /> Adresse</span>
                      <span className="summary-value">{form.street}, {form.zip} {form.city}</span>
                    </div>
                    {form.notes && (
                      <div className="summary-row">
                        <span className="summary-label">Anmerkungen</span>
                        <span className="summary-value">{form.notes}</span>
                      </div>
                    )}
                    <div className="summary-divider" />
                    <div className="summary-row summary-total">
                      <span className="summary-label">Gesamtpreis</span>
                      <span className="summary-value">{totalPrice.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="booking-nav-buttons">
            {step > 0 && (
              <button className="btn-booking-back" onClick={handleBack}>
                <ChevronLeft size={18} /> Zurück
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 2 ? (
              <button className="btn-booking-next" onClick={handleNext}>
                Weiter <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn-booking-pay" onClick={handleSubmit}>
                <CreditCard size={18} /> Jetzt bezahlen
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="booking-sidebar">
          <div className="sidebar-card">
            <h3>Deine Buchung</h3>
            {room ? (
              <>
                <div className="sidebar-room-preview">
                  <img src={room.img} alt={room.name} />
                  <div>
                    <strong>{room.name}</strong>
                    <small>{room.capacity}</small>
                  </div>
                </div>
                {checkin && checkout && nights > 0 && (
                  <div className="sidebar-details">
                    <div className="sidebar-row">
                      <span>Anreise</span>
                      <span>{formatDate(checkin)}</span>
                    </div>
                    <div className="sidebar-row">
                      <span>Abreise</span>
                      <span>{formatDate(checkout)}</span>
                    </div>
                    <div className="sidebar-row">
                      <span>Nächte</span>
                      <span>{nights}</span>
                    </div>
                    <div className="sidebar-row">
                      <span>Gäste</span>
                      <span>{guests}</span>
                    </div>
                    <div className="sidebar-divider" />
                    <div className="sidebar-row">
                      <span>{nights} × {room.price} €</span>
                      <span>{totalPrice.toFixed(2)} €</span>
                    </div>
                    <div className="sidebar-row sidebar-total">
                      <span>Gesamt</span>
                      <strong>{totalPrice.toFixed(2)} €</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="sidebar-placeholder">Wähle ein Zimmer und deine Reisedaten, um die Preisübersicht zu sehen.</p>
            )}
            <div className="sidebar-trust">
              <div className="sidebar-trust-item"><ShieldCheck size={16} /> Sichere Buchung</div>
              <div className="sidebar-trust-item"><Star size={16} /> Bester Preis garantiert</div>
              <div className="sidebar-trust-item"><Check size={16} /> Flexible Stornierung</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookingPage;
