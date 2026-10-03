/**
 * Central Reactive Store for Hostel Neustadt
 * Handles:
 * - Cross-device synchronization via /api/store (Local JSON server & Cloudflare KV)
 * - Room inventory & real-time overbooking protection
 * - Dynamic tiered pricing (1-3 days, 4-6 days, 7+ days) & Sonderkonditionen / Messezeiten
 * - Strictly sequential invoice numbering per year (RE-YYYY-0001)
 * - Booking creation, cancellation & DIN 5008 invoice generation
 */

const STORAGE_KEYS = {
  INVENTORY: 'hostel_inventory_v2',
  PRICING: 'hostel_pricing_v2',
  CUSTOM_PERIODS: 'hostel_custom_periods_v2',
  BOOKINGS: 'hostel_bookings_v2',
  SETTINGS: 'hostel_settings_v2',
  HOLDS: 'hostel_holds_v2'
};

const DEFAULT_INVENTORY = {
  einzelzimmer: 10,
  doppelzimmer: 8
};

const DEFAULT_PRICING = {
  einzelzimmer: {
    tier1_3: 70,   // 1-3 Tage
    tier4_6: 65,   // 4-6 Tage
    tier7plus: 60  // ab 7 Tage
  },
  doppelzimmer: {
    tier1_3: 100,  // 1-3 Tage
    tier4_6: 90,   // 4-6 Tage
    tier7plus: 80  // ab 7 Tage
  }
};

const DEFAULT_CUSTOM_PERIODS = [
  {
    id: 'period-hannover-messe-2026',
    name: 'Hannover Messe 2026',
    startDate: '2026-04-20',
    endDate: '2026-04-24',
    priceEZ: 125,
    priceDZ: 165,
    active: true,
    note: 'Messe-Sonderkonditionen für Industrie- & Fachbesucher'
  },
  {
    id: 'period-iaa-2026',
    name: 'IAA Transportation 2026',
    startDate: '2026-09-15',
    endDate: '2026-09-20',
    priceEZ: 110,
    priceDZ: 145,
    active: true,
    note: 'Sonderzeitraum Messe Hannover'
  }
];

const DEFAULT_SETTINGS = {
  hostEmail: 'scholz.friese@gmail.com',
  hotelName: 'Hostel Neustadt',
  hotelAddress: 'Bahnhofstraße 10, 31535 Neustadt am Rübenberge',
  hotelPhone: '+49 123 4567890',
  hotelEmail: 'info@hostel-neustadt.de',
  taxRate: 7,
  mollieApiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MOLLIE_API_KEY) || '',
  currency: 'EUR'
};

const DEFAULT_BOOKINGS = [
  {
    id: 'b-1001',
    bookingNumber: 'HN-2026-0001',
    invoiceNumber: 'RE-2026-0001',
    createdAt: '2026-05-18T10:15:00Z',
    status: 'confirmed',
    checkin: '2026-06-12',
    checkout: '2026-06-16',
    nights: 4,
    rooms: [
      {
        typeId: 'einzelzimmer',
        count: 2,
        guests: 2,
        pricePerNight: 65,
        totalPrice: 520
      }
    ],
    totalPrice: 520,
    guest: {
      firstName: 'Michael',
      lastName: 'Schmidt',
      email: 'm.schmidt@bau-hannover.de',
      phone: '+49 171 2345678',
      company: 'Schmidt Bau GmbH',
      street: 'Industrieweg 4',
      zip: '30159',
      city: 'Hannover',
      notes: 'Monteurteam, späte Anreise ca. 19:30 Uhr'
    },
    payment: {
      method: 'mollie_creditcard',
      methodLabel: 'Kreditkarte',
      status: 'paid',
      transactionId: 'tr_72kX9fP2L1',
      paidAt: '2026-05-18T10:16:30Z',
      amount: 520
    }
  },
  {
    id: 'b-1002',
    bookingNumber: 'HN-2026-0002',
    invoiceNumber: 'RE-2026-0002',
    createdAt: '2026-05-19T14:30:00Z',
    status: 'confirmed',
    checkin: '2026-06-20',
    checkout: '2026-06-22',
    nights: 2,
    rooms: [
      {
        typeId: 'doppelzimmer',
        count: 1,
        guests: 2,
        pricePerNight: 100,
        totalPrice: 200
      }
    ],
    totalPrice: 200,
    guest: {
      firstName: 'Dr. Sarah',
      lastName: 'Kaufmann',
      email: 'sarah.kaufmann@web.de',
      phone: '+49 160 9876543',
      company: '',
      street: 'Gartenallee 12',
      zip: '28209',
      city: 'Bremen',
      notes: 'Ruhiges Zimmer gewünscht'
    },
    payment: {
      method: 'mollie_paypal',
      methodLabel: 'PayPal',
      status: 'paid',
      transactionId: 'tr_89qL4vN8W0',
      paidAt: '2026-05-19T14:32:10Z',
      amount: 200
    }
  }
];

function readStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    return defaultValue;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hostel_store_change', { detail: { key, value } }));
    }
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

let syncTimeout = null;

export const bookingStore = {
  // ---- Server & Cross-Device KV Sync ----
  async syncFromServer() {
    try {
      const res = await fetch('/api/store', { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data === 'object') {
        if (data.inventory) writeStorage(STORAGE_KEYS.INVENTORY, data.inventory);
        if (data.pricing) writeStorage(STORAGE_KEYS.PRICING, data.pricing);
        if (data.customPeriods) writeStorage(STORAGE_KEYS.CUSTOM_PERIODS, data.customPeriods);
        if (data.bookings) writeStorage(STORAGE_KEYS.BOOKINGS, data.bookings);
        if (data.holds) writeStorage(STORAGE_KEYS.HOLDS, data.holds);
        if (data.settings) writeStorage(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...data.settings });
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hostel_store_change', { detail: { synced: true } }));
        }
      }
    } catch (err) {
      // Offline or network unavailable; keep working with localStorage seamlessly
    }
  },

  async pushToServerImmediate() {
    if (syncTimeout) clearTimeout(syncTimeout);
    try {
      const payload = {
        inventory: this.getInventory(),
        pricing: this.getPricing(),
        customPeriods: this.getCustomPeriods(),
        bookings: this.getBookings(),
        holds: this.getHolds(),
        settings: this.getSettings()
      };
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (err) {
      // Offline or network unavailable
    }
  },

  async pushToServer() {
    return this.pushToServerImmediate();
  },

  // ---- Inventory ----
  getInventory() {
    return readStorage(STORAGE_KEYS.INVENTORY, DEFAULT_INVENTORY);
  },

  setInventory(inventory) {
    writeStorage(STORAGE_KEYS.INVENTORY, inventory);
    this.pushToServer();
  },

  // ---- Base Pricing ----
  getPricing() {
    return readStorage(STORAGE_KEYS.PRICING, DEFAULT_PRICING);
  },

  setPricing(pricing) {
    writeStorage(STORAGE_KEYS.PRICING, pricing);
    this.pushToServer();
  },

  // ---- Custom Periods (Sonderkonditionen / Messezeiten) ----
  getCustomPeriods() {
    return readStorage(STORAGE_KEYS.CUSTOM_PERIODS, DEFAULT_CUSTOM_PERIODS);
  },

  setCustomPeriods(periods) {
    writeStorage(STORAGE_KEYS.CUSTOM_PERIODS, periods);
    this.pushToServer();
  },

  addCustomPeriod(period) {
    const periods = this.getCustomPeriods();
    const newPeriod = {
      ...period,
      id: period.id || `period-${Date.now()}`
    };
    this.setCustomPeriods([...periods, newPeriod]);
    return newPeriod;
  },

  deleteCustomPeriod(id) {
    const periods = this.getCustomPeriods().filter(p => p.id !== id);
    this.setCustomPeriods(periods);
  },

  // ---- Settings ----
  getSettings() {
    return readStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  setSettings(settings) {
    writeStorage(STORAGE_KEYS.SETTINGS, settings);
    this.pushToServer();
  },

  // ---- Bookings ----
  getBookings() {
    const raw = readStorage(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS);
    const now = Date.now();
    // Auto-clean expired 'open' / 'hold' bookings that were not finalized
    const active = (raw || []).filter(b => {
      if (b.status === 'open' && b.expiresAt && b.expiresAt <= now) {
        return false;
      }
      return true;
    });
    if (active.length !== (raw || []).length) {
      writeStorage(STORAGE_KEYS.BOOKINGS, active);
    }
    return active;
  },

  setBookings(bookings) {
    writeStorage(STORAGE_KEYS.BOOKINGS, bookings);
    this.pushToServer();
  },

  async deleteBooking(bookingId) {
    const bookings = readStorage(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS);
    const target = bookings.find(b => b.id === bookingId || b.bookingNumber === bookingId);
    const targetToken = target?.holdToken;

    const updated = bookings.filter(b => b.id !== bookingId && b.bookingNumber !== bookingId);
    writeStorage(STORAGE_KEYS.BOOKINGS, updated);

    // Also remove from holds if it was a hold
    const holds = readStorage(STORAGE_KEYS.HOLDS, []);
    const updatedHolds = holds.filter(h => 
      h.id !== bookingId && 
      h.token !== bookingId && 
      (!targetToken || h.token !== targetToken)
    );
    writeStorage(STORAGE_KEYS.HOLDS, updatedHolds);

    await this.pushToServerImmediate();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hostel_store_change', { detail: { deleted: bookingId } }));
    }
    return true;
  },

  getBookingById(id) {
    return this.getBookings().find(b => b.id === id || b.bookingNumber === id);
  },

  // ---- Sequential Invoice Number Generator (Per Year: RE-YYYY-0001) ----
  getNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const prefix = `RE-${year}-`;
    const bookings = this.getBookings();

    let maxSeq = 0;
    bookings.forEach(b => {
      if (b.invoiceNumber && b.invoiceNumber.startsWith(prefix)) {
        const numPart = b.invoiceNumber.substring(prefix.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  },

  // ---- Sequential Booking Number Generator (Per Year: HN-YYYY-0001) ----
  getNextBookingNumber() {
    const year = new Date().getFullYear();
    const prefix = `HN-${year}-`;
    const bookings = this.getBookings();

    let maxSeq = 0;
    bookings.forEach(b => {
      if (b.bookingNumber && b.bookingNumber.startsWith(prefix)) {
        const numPart = b.bookingNumber.substring(prefix.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  },

  // ---- Price Calculation Engine ----
  calculateRoomPrice(typeId, checkin, checkout) {
    if (!checkin || !checkout) {
      const pricing = this.getPricing();
      const p = pricing[typeId] || DEFAULT_PRICING[typeId] || { tier1_3: 70, tier4_6: 65, tier7plus: 60 };
      return {
        total: p.tier1_3,
        avgPerNight: p.tier1_3,
        nights: 1,
        tieredRate: p.tier1_3,
        tierName: '1–3 Nächte',
        hasCustomPeriod: false,
        breakdown: []
      };
    }

    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const diffTime = d2 - d1;
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const pricing = this.getPricing();
    const customPeriods = this.getCustomPeriods().filter(p => p.active);
    const p = pricing[typeId] || DEFAULT_PRICING[typeId];

    let tieredRate = p.tier1_3;
    let tierName = '1–3 Nächte';
    if (nights >= 7) {
      tieredRate = p.tier7plus;
      tierName = 'ab 7 Nächte (Sparpreis)';
    } else if (nights >= 4) {
      tieredRate = p.tier4_6;
      tierName = '4–6 Nächte (Rabatt)';
    }

    let total = 0;
    let hasCustomPeriod = false;
    const breakdown = [];

    for (let i = 0; i < nights; i++) {
      const curDate = new Date(d1);
      curDate.setDate(curDate.getDate() + i);
      const dateStr = curDate.toISOString().split('T')[0];

      const matchingPeriod = customPeriods.find(cp => dateStr >= cp.startDate && dateStr < cp.endDate);

      let nightPrice = tieredRate;
      let periodNote = null;

      if (matchingPeriod) {
        hasCustomPeriod = true;
        periodNote = matchingPeriod.name;
        if (typeId === 'einzelzimmer' && matchingPeriod.priceEZ) {
          nightPrice = Number(matchingPeriod.priceEZ);
        } else if (typeId === 'doppelzimmer' && matchingPeriod.priceDZ) {
          nightPrice = Number(matchingPeriod.priceDZ);
        }
      }

      total += nightPrice;
      breakdown.push({
        date: dateStr,
        price: nightPrice,
        isCustomPeriod: !!matchingPeriod,
        periodName: periodNote
      });
    }

    const avgPerNight = Math.round(total / nights);

    return {
      total,
      avgPerNight,
      nights,
      tieredRate,
      tierName,
      hasCustomPeriod,
      breakdown
    };
  },

  // ---- 10-Minute Cart Hold & Overbooking Protection ----
  getHolds() {
    const raw = readStorage(STORAGE_KEYS.HOLDS, []);
    const now = Date.now();
    // Auto-clean expired holds
    const active = (raw || []).filter(h => h && h.expiresAt && h.expiresAt > now);
    if (active.length !== (raw || []).length) {
      writeStorage(STORAGE_KEYS.HOLDS, active);
    }
    return active;
  },

  setHolds(holds) {
    const now = Date.now();
    const active = (holds || []).filter(h => h && h.expiresAt && h.expiresAt > now);
    writeStorage(STORAGE_KEYS.HOLDS, active);
    this.pushToServer();
  },

  async releaseCartHold(holdToken, holdId = null) {
    if (!holdToken && !holdId) return;
    // 1. Filter holds array
    const holds = readStorage(STORAGE_KEYS.HOLDS, []);
    const filteredHolds = holds.filter(h => {
      if (holdId && h.id === holdId) return false;
      if (holdToken && h.token === holdToken) return false;
      return true;
    });
    writeStorage(STORAGE_KEYS.HOLDS, filteredHolds);

    // 2. Remove open booking from bookings list if customer goes back or cancels
    const bookings = readStorage(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS);
    const filteredBookings = bookings.filter(b => {
      if (b.status === 'open') {
        if (holdId && b.id === holdId) return false;
        if (holdToken && b.holdToken === holdToken) return false;
      }
      return true;
    });
    writeStorage(STORAGE_KEYS.BOOKINGS, filteredBookings);

    await this.pushToServerImmediate();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hostel_store_change', { detail: { released: true } }));
    }
  },

  async acquireCartHold({ cart, checkin, checkout, token, guestData = null, existingHoldId = null }) {
    if (!cart || cart.length === 0) {
      return { success: false, reason: 'empty_cart' };
    }

    // 1. Fetch latest server/KV data to catch concurrent bookings/holds
    await this.syncFromServer();

    // 2. Validate availability for every cart item against bookings and OTHER users' holds
    for (const item of cart) {
      const itemIn = item.checkin || checkin;
      const itemOut = item.checkout || checkout;
      const available = this.getAvailableRooms(itemIn, itemOut, { excludeHoldToken: token });

      const neededCount = cart.filter(c => 
        c.typeId === item.typeId && 
        (c.checkin || checkin) < itemOut && 
        (c.checkout || checkout) > itemIn
      ).length;

      const free = item.typeId === 'einzelzimmer' ? available.einzelzimmer : available.doppelzimmer;
      if (neededCount > free) {
        return {
          success: false,
          reason: 'insufficient_rooms',
          typeId: item.typeId,
          typeName: item.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer',
          needed: neededCount,
          available: free,
          dates: `${itemIn} bis ${itemOut}`
        };
      }
    }

    // 3. Create or refresh the 10-minute hold
    const holdId = existingHoldId || `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Prepare room items with price breakdown
    let grandTotal = 0;
    const roomItems = cart.map(item => {
      const itemIn = item.checkin || checkin;
      const itemOut = item.checkout || checkout;
      const calc = this.calculateRoomPrice(item.typeId, itemIn, itemOut);
      const itemPrice = item.totalPrice || calc.total;
      grandTotal += itemPrice;

      return {
        typeId: item.typeId,
        name: item.name || (item.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer'),
        checkin: itemIn,
        checkout: itemOut,
        nights: item.nights || calc.nights,
        guests: item.guests || 1,
        count: 1,
        pricePerNight: item.pricePerNight || calc.avgPerNight,
        totalPrice: itemPrice,
        tierName: item.tierName || calc.tierName,
        hasCustomPeriod: item.hasCustomPeriod ?? calc.hasCustomPeriod,
        periodName: item.periodName || (calc.hasCustomPeriod ? calc.breakdown?.find(b => b.isCustomPeriod)?.periodName : null)
      };
    });

    const allIns = roomItems.map(r => r.checkin).sort();
    const allOuts = roomItems.map(r => r.checkout).sort();
    const overallCheckin = allIns[0] || checkin;
    const overallCheckout = allOuts[allOuts.length - 1] || checkout;
    const totalNights = roomItems.reduce((sum, r) => sum + r.nights, 0);

    const mainGuest = (Array.isArray(guestData) ? guestData[0] : guestData) || {};
    const guestInfo = {
      firstName: mainGuest.firstName || 'Gast',
      lastName: mainGuest.lastName || '(im Buchungsprozess)',
      email: mainGuest.email || '',
      phone: mainGuest.phone || '',
      company: mainGuest.company || '',
      street: mainGuest.street || '',
      zip: mainGuest.zip || '',
      city: mainGuest.city || '',
      notes: mainGuest.notes || ''
    };

    // Open booking entry that appears in the admin dashboard immediately
    const openBooking = {
      id: holdId,
      holdToken: token,
      isHold: true,
      bookingNumber: `HOLD-${holdId.substring(holdId.length - 6).toUpperCase()}`,
      invoiceNumber: 'Zahlung ausstehend',
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'open', // 'open' | 'confirmed' | 'cancelled'
      paymentStatus: 'pending',
      checkin: overallCheckin,
      checkout: overallCheckout,
      nights: totalNights,
      rooms: roomItems,
      totalPrice: grandTotal,
      guest: guestInfo,
      payment: {
        method: 'online',
        methodLabel: 'Online-Zahlung ausstehend',
        status: 'pending',
        amount: grandTotal
      }
    };

    // Update raw holds array
    const currentHolds = this.getHolds().filter(h => h.token !== token && h.id !== holdId);
    const newHold = {
      id: holdId,
      token,
      createdAt: Date.now(),
      expiresAt,
      rooms: roomItems.map(r => ({
        typeId: r.typeId,
        checkin: r.checkin,
        checkout: r.checkout,
        count: 1
      }))
    };
    this.setHolds([...currentHolds, newHold]);

    // Upsert into bookings list so it shows up in Admin dashboard as an open booking
    const currentBookings = this.getBookings().filter(b => b.id !== holdId && b.holdToken !== token);
    this.setBookings([openBooking, ...currentBookings]);

    return {
      success: true,
      holdId,
      expiresAt,
      openBooking
    };
  },

  updateHoldGuest(token, guestData) {
    if (!token || !guestData) return;
    const bookings = this.getBookings();
    let updatedAny = false;
    const main = (Array.isArray(guestData) ? guestData[0] : guestData) || {};
    const updated = bookings.map(b => {
      if (b.holdToken === token && b.status === 'open') {
        updatedAny = true;
        return {
          ...b,
          guest: {
            ...b.guest,
            firstName: main.firstName || b.guest?.firstName || 'Gast',
            lastName: main.lastName || b.guest?.lastName || '(im Buchungsprozess)',
            email: main.email || b.guest?.email || '',
            phone: main.phone || b.guest?.phone || '',
            company: main.company || b.guest?.company || '',
            street: main.street || b.guest?.street || '',
            zip: main.zip || b.guest?.zip || '',
            city: main.city || b.guest?.city || '',
            notes: main.notes || b.guest?.notes || ''
          }
        };
      }
      return b;
    });
    if (updatedAny) {
      this.setBookings(updated);
    }
  },

  // ---- Availability Engine (Bookings + Active Temporary Holds) ----
  getAvailableRooms(checkin, checkout, options = {}) {
    const excludeBookingId = typeof options === 'string' ? options : options?.excludeBookingId;
    const excludeHoldToken = typeof options === 'object' ? options?.excludeHoldToken : null;

    const inventory = this.getInventory();
    const result = {
      einzelzimmer: inventory.einzelzimmer || 10,
      doppelzimmer: inventory.doppelzimmer || 8,
      isFullyBooked: false
    };

    if (!checkin || !checkout) {
      return result;
    }

    // Only count confirmed bookings here (active holds are deducted below to prevent double-counting)
    const confirmedBookings = this.getBookings().filter(b => 
      b.status === 'confirmed' && 
      b.id !== excludeBookingId && 
      (!excludeHoldToken || b.holdToken !== excludeHoldToken)
    );

    let bookedEZ = 0;
    let bookedDZ = 0;

    for (const b of confirmedBookings) {
      if (b.rooms && Array.isArray(b.rooms) && b.rooms.length > 0) {
        for (const roomItem of b.rooms) {
          const itemCheckin = roomItem.checkin || b.checkin;
          const itemCheckout = roomItem.checkout || b.checkout;
          const overlaps = itemCheckin < checkout && itemCheckout > checkin;
          if (overlaps) {
            if (roomItem.typeId === 'einzelzimmer') {
              bookedEZ += (roomItem.count || 1);
            } else if (roomItem.typeId === 'doppelzimmer') {
              bookedDZ += (roomItem.count || 1);
            }
          }
        }
      } else {
        const overlaps = b.checkin < checkout && b.checkout > checkin;
        if (overlaps) {
          bookedEZ += 1;
        }
      }
    }

    // Deduct rooms from active 10-minute holds belonging to other visitors
    const activeHolds = this.getHolds();
    for (const hold of activeHolds) {
      if (excludeHoldToken && hold.token === excludeHoldToken) {
        continue; // User's own hold is not counted against themselves
      }
      if (hold.rooms && Array.isArray(hold.rooms)) {
        for (const r of hold.rooms) {
          const rIn = r.checkin || hold.checkin;
          const rOut = r.checkout || hold.checkout;
          const overlaps = rIn < checkout && rOut > checkin;
          if (overlaps) {
            if (r.typeId === 'einzelzimmer') bookedEZ += (r.count || 1);
            if (r.typeId === 'doppelzimmer') bookedDZ += (r.count || 1);
          }
        }
      }
    }

    result.einzelzimmer = Math.max(0, (inventory.einzelzimmer || 10) - bookedEZ);
    result.doppelzimmer = Math.max(0, (inventory.doppelzimmer || 8) - bookedDZ);
    result.isFullyBooked = (result.einzelzimmer === 0 && result.doppelzimmer === 0);

    return result;
  },

  // ---- Create & Process New Booking ----
  createBooking({ checkin, checkout, nights, cart, guestData, paymentMethod = 'mollie_card', holdToken = null, holdId = null }) {
    if (!cart || cart.length === 0) {
      throw new Error('Der Warenkorb ist leer.');
    }

    // 1. Double check availability for each item's date range (excluding own hold)
    for (const item of cart) {
      const itemIn = item.checkin || checkin;
      const itemOut = item.checkout || checkout;
      const available = this.getAvailableRooms(itemIn, itemOut, { excludeHoldToken: holdToken });
      
      const neededCount = cart.filter(c => 
        c.typeId === item.typeId && 
        (c.checkin || checkin) < itemOut && 
        (c.checkout || checkout) > itemIn
      ).length;

      if (item.typeId === 'einzelzimmer' && neededCount > available.einzelzimmer) {
        throw new Error(`Für den Zeitraum ${itemIn} bis ${itemOut} sind nur ${available.einzelzimmer} Einzelzimmer verfügbar.`);
      }
      if (item.typeId === 'doppelzimmer' && neededCount > available.doppelzimmer) {
        throw new Error(`Für den Zeitraum ${itemIn} bis ${itemOut} sind nur ${available.doppelzimmer} Doppelzimmer verfügbar.`);
      }
    }

    // 2. Prepare detailed room items with individual date ranges
    let grandTotal = 0;
    const roomItems = cart.map(item => {
      const itemIn = item.checkin || checkin;
      const itemOut = item.checkout || checkout;
      const calc = this.calculateRoomPrice(item.typeId, itemIn, itemOut);
      const itemPrice = item.totalPrice || calc.total;
      grandTotal += itemPrice;

      return {
        typeId: item.typeId,
        name: item.name || (item.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer'),
        checkin: itemIn,
        checkout: itemOut,
        nights: item.nights || calc.nights,
        guests: item.guests || 1,
        count: 1,
        pricePerNight: item.pricePerNight || calc.avgPerNight,
        totalPrice: itemPrice,
        tierName: item.tierName || calc.tierName,
        hasCustomPeriod: item.hasCustomPeriod ?? calc.hasCustomPeriod,
        periodName: item.periodName || (calc.hasCustomPeriod ? calc.breakdown?.find(b => b.isCustomPeriod)?.periodName : null)
      };
    });

    // 3. Compute overall stay date range across all cart items
    const allIns = roomItems.map(r => r.checkin).sort();
    const allOuts = roomItems.map(r => r.checkout).sort();
    const overallCheckin = allIns[0] || checkin;
    const overallCheckout = allOuts[allOuts.length - 1] || checkout;
    const totalNights = roomItems.reduce((sum, r) => sum + r.nights, 0);

    // Strictly sequential invoice and booking numbers per year
    const bookingNumber = this.getNextBookingNumber();
    const invoiceNumber = this.getNextInvoiceNumber();
    const transactionId = `tr_mollie_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const mainGuest = guestData[0] || {};

    const methodLabels = {
      mollie_card: 'Kreditkarte',
      mollie_paypal: 'PayPal',
      mollie_klarna: 'Klarna / Sofortüberweisung',
      mollie_giropay: 'Giropay',
      mollie_applepay: 'Apple Pay'
    };

    const newBooking = {
      id: `b-${Date.now()}`,
      bookingNumber,
      invoiceNumber,
      createdAt: nowIso,
      status: 'confirmed',
      checkin: overallCheckin,
      checkout: overallCheckout,
      nights: totalNights,
      rooms: roomItems,
      totalPrice: grandTotal,
      guest: {
        firstName: mainGuest.firstName || '',
        lastName: mainGuest.lastName || '',
        email: mainGuest.email || '',
        phone: mainGuest.phone || '',
        company: mainGuest.company || '',
        street: mainGuest.street || '',
        zip: mainGuest.zip || '',
        city: mainGuest.city || '',
        notes: mainGuest.notes || '',
        additionalGuests: guestData.slice(1).map(g => `${g.firstName || ''} ${g.lastName || ''}`.trim()).filter(Boolean)
      },
      payment: {
        method: paymentMethod,
        methodLabel: methodLabels[paymentMethod] || 'Mollie Online-Zahlung',
        status: 'paid',
        transactionId,
        paidAt: nowIso,
        amount: grandTotal
      }
    };

    // Filter out any temporary open hold booking for this session so it cleanly converts
    const currentBookings = this.getBookings().filter(b => {
      if (holdId && b.id === holdId) return false;
      if (holdToken && b.holdToken === holdToken) return false;
      return true;
    });
    this.setBookings([newBooking, ...currentBookings]);

    // Release any temporary hold for this checkout session
    if (holdToken || holdId) {
      this.releaseCartHold(holdToken, holdId);
    }

    return newBooking;
  },

  // ---- Create Manual Booking (from Admin Hub or Weekly Calendar) ----
  createManualBooking({
    checkin,
    checkout,
    rooms, // [{ typeId: 'einzelzimmer', count: 1, guests: 1 }, { typeId: 'doppelzimmer', count: 1, guests: 2 }]
    guest, // { firstName, lastName, email, phone, company, street, zip, city, notes }
    paymentStatus = 'paid', // 'paid' | 'pending'
    paymentMethod = 'bar', // 'bar' | 'ec' | 'ueberweisung' | 'rechnung' | 'online'
    customPrice = null
  }) {
    if (!checkin || !checkout) {
      throw new Error('Bitte wählen Sie Anreise- und Abreisedatum aus.');
    }
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const nights = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));

    // Check availability
    const available = this.getAvailableRooms(checkin, checkout);
    const totalEZ = (rooms || []).filter(r => r.typeId === 'einzelzimmer').reduce((sum, r) => sum + (r.count || 1), 0);
    const totalDZ = (rooms || []).filter(r => r.typeId === 'doppelzimmer').reduce((sum, r) => sum + (r.count || 1), 0);

    if (totalEZ > available.einzelzimmer) {
      throw new Error(`Für den gewählten Zeitraum sind nur noch ${available.einzelzimmer} Einzelzimmer verfügbar.`);
    }
    if (totalDZ > available.doppelzimmer) {
      throw new Error(`Für den gewählten Zeitraum sind nur noch ${available.doppelzimmer} Doppelzimmer verfügbar.`);
    }

    const roomItems = [];
    let calculatedTotal = 0;

    for (const r of (rooms || [])) {
      const count = r.count || 1;
      for (let i = 0; i < count; i++) {
        const calc = this.calculateRoomPrice(r.typeId, checkin, checkout);
        calculatedTotal += calc.total;
        roomItems.push({
          typeId: r.typeId,
          name: r.typeId === 'einzelzimmer' ? 'Einzelzimmer' : 'Doppelzimmer',
          checkin,
          checkout,
          nights,
          guests: r.guests || (r.typeId === 'doppelzimmer' ? 2 : 1),
          count: 1,
          pricePerNight: calc.avgPerNight,
          totalPrice: calc.total,
          tierName: calc.tierName,
          hasCustomPeriod: calc.hasCustomPeriod,
          periodName: calc.hasCustomPeriod ? calc.breakdown?.find(b => b.isCustomPeriod)?.periodName : null
        });
      }
    }

    const finalTotal = (customPrice !== null && customPrice !== undefined && !isNaN(customPrice) && Number(customPrice) >= 0)
      ? Number(customPrice)
      : calculatedTotal;

    const bookingNumber = this.getNextBookingNumber();
    const invoiceNumber = this.getNextInvoiceNumber();
    const nowIso = new Date().toISOString();

    const isPaid = paymentStatus === 'paid';
    const methodLabels = {
      bar: 'Barzahlung vor Ort',
      ec: 'EC-Karte / Terminal vor Ort',
      ueberweisung: 'Banküberweisung',
      rechnung: 'Rechnung auf Ziel',
      online: 'Online bezahlt'
    };

    const newBooking = {
      id: `b-man-${Date.now()}`,
      bookingNumber,
      invoiceNumber,
      createdAt: nowIso,
      status: 'confirmed',
      checkin,
      checkout,
      nights,
      rooms: roomItems,
      totalPrice: finalTotal,
      paymentStatus: isPaid ? 'paid' : 'pending',
      guest: {
        firstName: guest.firstName || '',
        lastName: guest.lastName || '',
        email: guest.email || '',
        phone: guest.phone || '',
        company: guest.company || '',
        street: guest.street || '',
        zip: guest.zip || '',
        city: guest.city || '',
        notes: guest.notes || '',
        additionalGuests: []
      },
      payment: {
        method: isPaid ? paymentMethod : 'pending',
        methodLabel: isPaid ? (methodLabels[paymentMethod] || 'Vor Ort / Manuell') : 'Zahlung offen (bei Anreise)',
        status: isPaid ? 'paid' : 'pending',
        transactionId: isPaid ? `man_${Date.now().toString(36)}` : null,
        paidAt: isPaid ? nowIso : null,
        amount: finalTotal
      }
    };

    const currentBookings = this.getBookings();
    this.setBookings([newBooking, ...currentBookings]);

    return newBooking;
  },

  // ---- Mark Booking as Paid (Admin Desk / Check-in) ----
  markBookingAsPaid(bookingId, paymentMethod = 'bar') {
    const methodLabels = {
      bar: 'Barzahlung vor Ort',
      ec: 'EC-Karte / Terminal vor Ort',
      ueberweisung: 'Banküberweisung',
      rechnung: 'Rechnung auf Ziel',
      online: 'Online bezahlt'
    };
    const bookings = this.getBookings();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus: 'paid',
          payment: {
            ...b.payment,
            status: 'paid',
            method: paymentMethod,
            methodLabel: methodLabels[paymentMethod] || 'Barzahlung vor Ort',
            paidAt: new Date().toISOString(),
            transactionId: b.payment?.transactionId || `man_${Date.now().toString(36)}`
          }
        };
      }
      return b;
    });
    this.setBookings(updated);
  },

  // ---- Cancel Booking (Instantly Frees Up Inventory) ----
  cancelBooking(bookingId) {
    const bookings = this.getBookings();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        };
      }
      return b;
    });
    this.setBookings(updated);
  }
};

// Auto-sync on client load & when tab gets focus
if (typeof window !== 'undefined') {
  bookingStore.syncFromServer();
  window.addEventListener('focus', () => bookingStore.syncFromServer());
  window.addEventListener('online', () => bookingStore.syncFromServer());
}
