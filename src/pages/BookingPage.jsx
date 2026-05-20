import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, User, Users, Wifi, ShowerHead, Tv, Lock,
  ChevronRight, ChevronLeft, Check, ShieldCheck,
  Building2, MapPin, Phone, Mail, ArrowLeft, Bed, CreditCard, Star,
  Plus, Minus, Trash2
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
    isPerPerson: true,
    img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    maxCapacity: 6,
    features: ['WLAN', 'Schließfach', 'Gemeinschaftsbad', 'Bettwäsche']
  },
  {
    id: 'doppelzimmer',
    name: 'Doppelzimmer',
    desc: 'Privates Zimmer mit Doppelbett – perfekt für Paare oder Alleinreisende mit mehr Komfort.',
    price: 49,
    unit: 'pro Zimmer / Nacht',
    isPerPerson: false,
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    maxCapacity: 2,
    features: ['WLAN', 'Eigenes Bad', 'TV', 'Bettwäsche']
  },
  {
    id: 'familienzimmer',
    name: 'Familienzimmer',
    desc: 'Geräumiges Zimmer für die ganze Familie – mit viel Platz und eigenem Badezimmer.',
    price: 79,
    unit: 'pro Zimmer / Nacht',
    isPerPerson: false,
    img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    maxCapacity: 4,
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

/* ============ BookingPage ============ */
const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // Reisedaten
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '');
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '');

  // Ausgewählte Zimmer (Warenkorb)
  // Array of { instanceId: number, typeId: string, guests: number }
  const [cart, setCart] = useState([]);
  const [nextInstanceId, setNextInstanceId] = useState(1);

  // Initialize from URL params if available
  useEffect(() => {
    const initialRoom = searchParams.get('room');
    const initialGuests = parseInt(searchParams.get('guests')) || 1;
    
    if (initialRoom && cart.length === 0) {
      const roomDef = ROOMS.find(r => r.id === initialRoom);
      if (roomDef) {
        setCart([{
          instanceId: 0,
          typeId: initialRoom,
          guests: Math.min(initialGuests, roomDef.maxCapacity)
        }]);
      }
    }
  }, [searchParams, cart.length]);

  // Gästedaten
  // Index 0 ist der Hauptbucher, die restlichen sind Mitreisende
  const [guestData, setGuestData] = useState([
    { isMain: true, firstName: '', lastName: '', email: '', phone: '', company: '', street: '', zip: '', city: '', notes: '' }
  ]);

  const [errors, setErrors] = useState({});

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Berechnungen
  const nights = useMemo(() => nightsBetween(checkin, checkout), [checkin, checkout]);
  
  const totalGuests = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.guests, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    if (nights <= 0) return 0;
    return cart.reduce((sum, item) => {
      const roomDef = ROOMS.find(r => r.id === item.typeId);
      if (!roomDef) return sum;
      // Mehrbettzimmer: Preis pro Person. Andere: Preis pro Zimmer
      const itemPrice = roomDef.isPerPerson ? (roomDef.price * item.guests) : roomDef.price;
      return sum + (itemPrice * nights);
    }, 0);
  }, [cart, nights]);

  // Gast-Array anpassen, wenn sich die Gesamtgästezahl ändert
  useEffect(() => {
    setGuestData(prev => {
      const newArr = [...prev];
      // Hinzufügen, wenn zu wenig
      while(newArr.length < totalGuests) {
        newArr.push({ isMain: false, firstName: '', lastName: '' });
      }
      // Entfernen, wenn zu viele (aber Hauptbucher behalten)
      while(newArr.length > totalGuests && newArr.length > 1) {
        newArr.pop();
      }
      return newArr;
    });
  }, [totalGuests]);

  /* ---- Handlers für Warenkorb ---- */
  const addRoom = (typeId) => {
    setCart(prev => [...prev, { instanceId: nextInstanceId, typeId, guests: 1 }]);
    setNextInstanceId(id => id + 1);
    if (errors.cart) setErrors(e => ({ ...e, cart: undefined }));
  };

  const removeRoom = (instanceId) => {
    setCart(prev => prev.filter(item => item.instanceId !== instanceId));
  };

  const updateRoomGuests = (instanceId, newGuests) => {
    setCart(prev => prev.map(item => 
      item.instanceId === instanceId ? { ...item, guests: parseInt(newGuests) } : item
    ));
  };

  /* ---- Validation ---- */
  function validateStep1() {
    const e = {};
    if (cart.length === 0) e.cart = 'Bitte wähle mindestens ein Zimmer aus.';
    if (!checkin) e.checkin = 'Bitte Anreisedatum wählen';
    if (!checkout) e.checkout = 'Bitte Abreisedatum wählen';
    if (checkin && checkout && nights <= 0) e.checkout = 'Abreise muss nach Anreise liegen';
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

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setStep(s => Math.min(s + 1, 2));
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 0));
  }

  function handleMainFormChange(field, value) {
    setGuestData(prev => {
      const newArr = [...prev];
      newArr[0] = { ...newArr[0], [field]: value };
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

  function handleSubmit() {
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
                
                {/* Reisedaten */}
                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <Calendar size={24} />
                    Reisedaten
                  </h2>
                  <div className="date-grid-2">
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
                  </div>
                </div>

                {/* Zimmerauswahl */}
                <div className="booking-section">
                  <h2 className="booking-section-title">
                    <Bed size={24} />
                    Zimmerauswahl
                  </h2>
                  
                  <div className="room-selection-list">
                    {ROOMS.map(r => {
                      const instancesOfThisType = cart.filter(item => item.typeId === r.id);
                      const count = instancesOfThisType.length;

                      return (
                        <div key={r.id} className={`room-select-card ${count > 0 ? 'has-selection' : ''}`}>
                          <div className="room-select-main">
                            <div className="room-select-img" style={{ backgroundImage: `url(${r.img})` }} />
                            <div className="room-select-info">
                              <div className="room-select-header-flex">
                                <h3>{r.name}</h3>
                                <div className="room-select-price">
                                  <strong>{r.price} €</strong>
                                  <small>{r.unit}</small>
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
                              <div className="room-select-bottom">
                                <span className="room-select-capacity"><Users size={16} /> Max. {r.maxCapacity} {r.maxCapacity === 1 ? 'Person' : 'Personen'}</span>
                                <div className="room-quantity-controls">
                                  {count > 0 && (
                                    <button className="qty-btn" onClick={() => removeRoom(instancesOfThisType[instancesOfThisType.length - 1].instanceId)}>
                                      <Minus size={16} />
                                    </button>
                                  )}
                                  <span className="qty-count">{count} {count === 1 ? 'Zimmer' : 'Zimmer'}</span>
                                  <button className="qty-btn qty-add" onClick={() => addRoom(r.id)}>
                                    <Plus size={16} /> Hinzufügen
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sub-UI für jedes hinzugefügte Zimmer dieses Typs */}
                          {count > 0 && (
                            <div className="room-instances-wrapper">
                              {instancesOfThisType.map((instance, idx) => (
                                <div key={instance.instanceId} className="room-instance-row">
                                  <span>{r.name} {count > 1 ? `#${idx + 1}` : ''}</span>
                                  <div className="room-instance-guests">
                                    <label>Gäste in diesem Zimmer:</label>
                                    <select 
                                      value={instance.guests} 
                                      onChange={(e) => updateRoomGuests(instance.instanceId, e.target.value)}
                                    >
                                      {Array.from({ length: r.maxCapacity }, (_, i) => i + 1).map(num => (
                                        <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'Personen'}</option>
                                      ))}
                                    </select>
                                    <button className="btn-icon-danger" onClick={() => removeRoom(instance.instanceId)} title="Zimmer entfernen">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {errors.cart && <p className="field-error mt-2">{errors.cart}</p>}
                </div>
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
                      <label>E-Mail *</label>
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
                    <label>Firma (optional)</label>
                    <input type="text" value={guestData[0].company} onChange={e => handleMainFormChange('company', e.target.value)} placeholder="Muster GmbH" />
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
                    <textarea rows="3" value={guestData[0].notes} onChange={e => handleMainFormChange('notes', e.target.value)} placeholder="Besondere Wünsche, späte Anreise, etc." />
                  </div>
                </div>

                {/* Mitreisende (Optional) */}
                {totalGuests > 1 && (
                  <div className="booking-section">
                    <h2 className="booking-section-title">
                      <Users size={24} />
                      Weitere Gäste (Optional)
                    </h2>
                    <p className="text-muted mb-4">Namen der Mitreisenden können hier hinterlegt werden.</p>
                    
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
                    <div className="summary-row">
                      <span className="summary-label"><Calendar size={18} /> Reisedaten</span>
                      <span className="summary-value">{formatDate(checkin)} – {formatDate(checkout)} ({nights} {nights === 1 ? 'Nacht' : 'Nächte'})</span>
                    </div>
                    
                    <div className="summary-divider" />
                    <h4 className="summary-subtitle">Gewählte Zimmer</h4>
                    
                    {cart.map((item, idx) => {
                      const roomDef = ROOMS.find(r => r.id === item.typeId);
                      return (
                        <div key={idx} className="summary-row">
                          <span className="summary-label"><Bed size={18} /> {roomDef.name}</span>
                          <span className="summary-value">{item.guests} {item.guests === 1 ? 'Person' : 'Personen'}</span>
                        </div>
                      );
                    })}

                    <div className="summary-divider" />
                    <h4 className="summary-subtitle">Ihre Daten</h4>

                    <div className="summary-row">
                      <span className="summary-label"><User size={18} /> Hauptbucher</span>
                      <span className="summary-value">{guestData[0].firstName} {guestData[0].lastName}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><Mail size={18} /> E-Mail</span>
                      <span className="summary-value">{guestData[0].email}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label"><MapPin size={18} /> Adresse</span>
                      <span className="summary-value">{guestData[0].street}, {guestData[0].zip} {guestData[0].city}</span>
                    </div>

                    {totalGuests > 1 && guestData.slice(1).some(g => g.firstName || g.lastName) && (
                      <div className="summary-row">
                        <span className="summary-label"><Users size={18} /> Mitreisende</span>
                        <span className="summary-value">
                          {guestData.slice(1)
                            .filter(g => g.firstName || g.lastName)
                            .map(g => `${g.firstName} ${g.lastName}`.trim())
                            .join(', ')}
                        </span>
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
                <CreditCard size={18} /> Zahlungspflichtig buchen
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="booking-sidebar">
          <div className="sidebar-card">
            <h3>Ihre Buchung</h3>
            
            {checkin && checkout && nights > 0 ? (
              <div className="sidebar-dates">
                <div className="sidebar-date-col">
                  <small>Anreise</small>
                  <strong>{formatDate(checkin)}</strong>
                </div>
                <div className="sidebar-date-col">
                  <small>Abreise</small>
                  <strong>{formatDate(checkout)}</strong>
                </div>
              </div>
            ) : (
              <p className="sidebar-placeholder mb-4">Bitte wählen Sie ein Reisedatum.</p>
            )}

            {cart.length > 0 ? (
              <div className="sidebar-details">
                {cart.map((item, idx) => {
                  const roomDef = ROOMS.find(r => r.id === item.typeId);
                  const itemPrice = roomDef.isPerPerson ? (roomDef.price * item.guests * nights) : (roomDef.price * nights);
                  return (
                    <div key={idx} className="sidebar-cart-item">
                      <div className="sidebar-cart-item-header">
                        <strong>{roomDef.name}</strong>
                        <span>{itemPrice.toFixed(2)} €</span>
                      </div>
                      <small>{item.guests} {item.guests === 1 ? 'Person' : 'Personen'}</small>
                    </div>
                  );
                })}
                
                <div className="sidebar-divider" />
                <div className="sidebar-row sidebar-total">
                  <span>Gesamt ({nights} Nächte)</span>
                  <strong>{totalPrice.toFixed(2)} €</strong>
                </div>
              </div>
            ) : (
              <p className="sidebar-placeholder">Ihr Warenkorb ist leer. Fügen Sie Zimmer hinzu.</p>
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
