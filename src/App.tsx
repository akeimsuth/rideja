import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin, Navigation, Car, Shield, ShieldCheck, AlertTriangle, CheckCircle2,
  Clock, CreditCard, Banknote, Star, User, Phone, MessageSquare, Share2,
  ChevronRight, ChevronLeft, X, Search, Menu, ArrowRight, ArrowLeft,
  DollarSign, FileText, UploadCloud, Eye, Check, Sliders, Settings,
  HelpCircle, LogOut, Bell, Smartphone, Laptop, TrendingUp, Users,
  Activity, Lock, Send, RefreshCw, AlertOctagon, Receipt, Plus,
  Filter, Sparkles, Home, Briefcase, ChevronDown, CheckCheck,
  Building, Map as MapIcon, AlertCircle, FileSpreadsheet, ExternalLink, QrCode, Compass,
  Wifi, Battery, Signal, ArrowUpRight, ChevronUp, ArrowUpDown, Minus
} from 'lucide-react';

/* ==========================================================================
   RIDEJA BRAND CONSTANTS & DESIGN SYSTEM
   Palette:
   - Primary Green: #00A651
   - Golden Yellow: #FFD600
   - Near Black: #101418
   - Secondary Grey: #F3F5F7
   - Muted Text: #667085
   - Success: #16803C
   - Warning: #E9A23B
   - Error: #D92D20
   ========================================================================== */

// Audio synth alerts using Web Audio API
const playChime = (type: 'dispatch' | 'arrival' | 'complete' | 'sos') => {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'dispatch') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'arrival') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(783.99, now + 0.24);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'complete') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === 'sos') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(700, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {
    // Audio autoplay restrictions
  }
};

/* ==========================================================================
   DATA SCHEMAS & TYPES
   ========================================================================== */

export type AppRole = 'passenger' | 'driver' | 'admin';

export type RideStatus =
  | 'IDLE'
  | 'REQUESTED'
  | 'SEARCHING'
  | 'ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_PASSENGER'
  | 'CANCELLED_BY_DRIVER'
  | 'NO_DRIVER_AVAILABLE';

export type RideCategoryKey = 'economy' | 'comfort' | 'xl' | 'premium' | 'airport';

export interface LocationPoint {
  id: string;
  name: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
}

export interface RideCategoryConfig {
  id: RideCategoryKey;
  name: string;
  tagline: string;
  capacity: number;
  baseFareJMD: number;
  perKmJMD: number;
  perMinJMD: number;
  minimumFareJMD: number;
  bookingFeeJMD: number;
  multiplier: number;
  image: string;
  etaMinutes: number;
}

export interface DriverDocument {
  id: string;
  type: 'national_id' | 'driver_license' | 'police_record' | 'ppv_badge' | 'vehicle_registration' | 'commercial_insurance' | 'certificate_of_fitness' | 'inspection_photos';
  name: string;
  category: 'driver' | 'vehicle';
  authority: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  fileUrl: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface DriverProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  photo: string;
  operatingZone: string;
  rating: number;
  totalTrips: number;
  acceptanceRate: number;
  completionRate: number;
  status: 'onboarding' | 'pending_approval' | 'active' | 'suspended';
  isOnline: boolean;
  currentVehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    seatingCapacity: number;
    category: RideCategoryKey;
  };
  payoutAccount: {
    bank: string;
    accountNumber: string;
    branch: string;
  };
  earnings: {
    todayJMD: number;
    weekJMD: number;
    monthJMD: number;
    pendingPayoutJMD: number;
    cashCollectedJMD: number;
  };
  documents: DriverDocument[];
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  category: RideCategoryKey;
  categoryName: string;
  pickupPin: string;
  status: RideStatus;
  fareEstimateJMD: number;
  finalFareJMD: number;
  distanceKm: number;
  durationMins: number;
  paymentMethod: 'cash' | 'visa' | 'mastercard';
  paymentStatus: 'pending' | 'authorized' | 'completed' | 'refunded';
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  driverRating?: number;
  vehicleDesc?: string;
  vehiclePlate?: string;
  createdAt: string;
  assignedAt?: string;
  pickupEtaMins?: number;
  tripEtaMins?: number;
  driverPosition?: { lat: number; lng: number; bearing?: number };
  passengerRating?: number;
  passengerFeedback?: string;
  driverTipJMD?: number;
}

export interface FinancialLedgerEntry {
  id: string;
  tripId: string;
  timestamp: string;
  description: string;
  grossAmountJMD: number;
  platformCommissionJMD: number; // 15%
  driverNetJMD: number;
  paymentType: 'cash' | 'card';
  status: 'settled' | 'reconciled';
}

export interface SafetyIncident {
  id: string;
  tripId: string;
  reportedBy: 'passenger' | 'driver';
  reporterName: string;
  type: 'emergency_sos' | 'unsafe_driving' | 'vehicle_mismatch' | 'lost_item' | 'fare_dispute';
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
  notes: string;
  resolution?: string;
}

/* ==========================================================================
   AUTHENTIC REAL-WORLD JAMAICAN DESTINATIONS & COORDINATES
   ========================================================================== */

export const JAMAICA_PRESETS: LocationPoint[] = [
  { id: 'loc-1', name: 'Half Way Tree Clock Tower', address: 'Half Way Tree Rd, Kingston 10', area: 'Kingston', lat: 18.0125, lng: -76.7989 },
  { id: 'loc-2', name: 'New Kingston Business District', address: 'Knutsford Boulevard, New Kingston', area: 'Kingston', lat: 18.0065, lng: -76.7865 },
  { id: 'loc-3', name: 'Norman Manley International Airport', address: 'Palisadoes, Kingston (KIN)', area: 'Kingston', lat: 17.9356, lng: -76.7875 },
  { id: 'loc-4', name: 'Devon House Historic Mansion', address: '26 Hope Road, Kingston 10', area: 'Kingston', lat: 18.0163, lng: -76.7925 },
  { id: 'loc-5', name: 'Bob Marley Museum', address: '56 Hope Road, Kingston 6', area: 'Kingston', lat: 18.0205, lng: -76.7794 },
  { id: 'loc-6', name: 'Portmore Sovereign Centre', address: 'Portmore Parkway, St Catherine', area: 'Portmore', lat: 17.9658, lng: -76.8795 },
  { id: 'loc-7', name: 'Spanish Town Historic Square', address: 'King Street, Spanish Town', area: 'Spanish Town', lat: 17.9942, lng: -76.9538 },
  { id: 'loc-8', name: 'Sangster International Airport', address: 'Montego Bay, St James (MBJ)', area: 'Montego Bay', lat: 18.5037, lng: -77.9134 },
  { id: 'loc-9', name: 'Montego Bay Hip Strip', address: 'Jimmy Cliff Blvd, Montego Bay', area: 'Montego Bay', lat: 18.4841, lng: -77.9254 },
  { id: 'loc-10', name: 'Dunn\'s River Falls & Beach', address: 'Main Street, Ocho Rios, St Ann', area: 'Ocho Rios', lat: 18.4162, lng: -77.1384 },
  { id: 'loc-11', name: 'Mandeville Town Centre', address: 'Manchester Road, Mandeville', area: 'Mandeville', lat: 18.0419, lng: -77.5071 },
  { id: 'loc-12', name: 'Rick\'s Cafe & Cliffs', address: 'West End Road, Negril', area: 'Negril', lat: 18.2505, lng: -78.3667 },
];

export const INITIAL_CATEGORIES: RideCategoryConfig[] = [
  {
    id: 'economy',
    name: 'Economy',
    tagline: 'Affordable, everyday rides',
    capacity: 4,
    baseFareJMD: 500,
    perKmJMD: 120,
    perMinJMD: 25,
    minimumFareJMD: 800,
    bookingFeeJMD: 150,
    multiplier: 1.0,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=240&auto=format&fit=crop&q=80',
    etaMinutes: 4,
  },
  {
    id: 'comfort',
    name: 'Comfort',
    tagline: 'More space, extra comfort',
    capacity: 4,
    baseFareJMD: 700,
    perKmJMD: 160,
    perMinJMD: 35,
    minimumFareJMD: 1200,
    bookingFeeJMD: 180,
    multiplier: 1.33,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=240&auto=format&fit=crop&q=80',
    etaMinutes: 6,
  },
  {
    id: 'xl',
    name: 'XL',
    tagline: 'For groups and extra luggage',
    capacity: 6,
    baseFareJMD: 1100,
    perKmJMD: 220,
    perMinJMD: 45,
    minimumFareJMD: 1800,
    bookingFeeJMD: 250,
    multiplier: 1.83,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=240&auto=format&fit=crop&q=80',
    etaMinutes: 8,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Premium executive experience',
    capacity: 4,
    baseFareJMD: 1800,
    perKmJMD: 320,
    perMinJMD: 65,
    minimumFareJMD: 2800,
    bookingFeeJMD: 350,
    multiplier: 2.9,
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=240&auto=format&fit=crop&q=80',
    etaMinutes: 8,
  },
  {
    id: 'airport',
    name: 'Airport Transfer',
    tagline: 'Fixed rates for KIN & MBJ airports',
    capacity: 4,
    baseFareJMD: 2500,
    perKmJMD: 200,
    perMinJMD: 40,
    minimumFareJMD: 4000,
    bookingFeeJMD: 400,
    multiplier: 2.4,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=240&auto=format&fit=crop&q=80',
    etaMinutes: 10,
  },
];

export const INITIAL_DRIVER_DOCUMENTS: DriverDocument[] = [
  {
    id: 'doc-1',
    type: 'national_id',
    name: 'Government National Identification / Passport',
    category: 'driver',
    authority: 'Registrar General\'s Department, Jamaica',
    documentNumber: 'JA-9821-4820',
    issueDate: '2024-04-10',
    expiryDate: '2034-04-10',
    status: 'approved',
    fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    reviewedBy: 'Compliance Admin (Sarah)',
    reviewedAt: '2026-10-15',
  },
  {
    id: 'doc-2',
    type: 'driver_license',
    name: 'Island Traffic Authority Driver\'s Licence (General PPV)',
    category: 'driver',
    authority: 'Island Traffic Authority, Jamaica',
    documentNumber: 'DL-876-004921',
    issueDate: '2024-08-14',
    expiryDate: '2029-08-14',
    status: 'approved',
    fileUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80',
    reviewedBy: 'Compliance Admin (Sarah)',
    reviewedAt: '2026-10-15',
  },
  {
    id: 'doc-3',
    type: 'police_record',
    name: 'Criminal Records Office Certificate (Police Record)',
    category: 'driver',
    authority: 'Ministry of National Security, Kingston, Jamaica',
    documentNumber: 'CRO-2026-7832',
    issueDate: '2026-03-20',
    expiryDate: '2027-03-20',
    status: 'approved',
    fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    reviewedBy: 'Super Admin (Marcus)',
    reviewedAt: '2026-10-15',
  },
  {
    id: 'doc-4',
    type: 'ppv_badge',
    name: 'Transport Authority Driver Identification Badge',
    category: 'driver',
    authority: 'Transport Authority of Jamaica',
    documentNumber: 'TA-KGN-4819',
    issueDate: '2025-02-01',
    expiryDate: '2028-02-01',
    status: 'approved',
    fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    reviewedBy: 'Compliance Admin (Sarah)',
    reviewedAt: '2026-10-15',
  },
  {
    id: 'doc-5',
    type: 'vehicle_registration',
    name: 'Tax Administration Jamaica (TAJ) Certificate of Registration',
    category: 'vehicle',
    authority: 'Tax Administration Jamaica',
    documentNumber: 'RC-9912401',
    issueDate: '2025-05-10',
    expiryDate: '2028-05-10',
    status: 'approved',
    fileUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    reviewedBy: 'Fleet Officer (Ken)',
    reviewedAt: '2026-10-15',
  },
  {
    id: 'doc-6',
    type: 'commercial_insurance',
    name: 'Commercial Public Passenger Vehicle (PPV) Insurance Certificate',
    category: 'vehicle',
    authority: 'Guardian General Insurance Jamaica Ltd',
    documentNumber: 'GGJ-PPV-2026-998',
    issueDate: '2026-06-01',
    expiryDate: '2027-06-01',
    status: 'approved',
    fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    reviewedBy: 'Fleet Officer (Ken)',
    reviewedAt: '2026-10-15',
  },
  {
    id: 'doc-7',
    type: 'certificate_of_fitness',
    name: 'Island Traffic Authority Certificate of Fitness',
    category: 'vehicle',
    authority: 'Island Traffic Authority (Swallowfield Depot, Kingston)',
    documentNumber: 'COF-KGN-2026-412',
    issueDate: '2026-09-12',
    expiryDate: '2027-09-12',
    status: 'approved',
    fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    reviewedBy: 'Fleet Officer (Ken)',
    reviewedAt: '2026-10-15',
  },
];

export const INITIAL_DRIVER: DriverProfile = {
  id: 'drv-876',
  fullName: 'Dwayne Williams',
  phone: '+1 (876) 555-7890',
  email: 'dwayne.williams@rideja.jm',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  operatingZone: 'Kingston & St. Andrew Corporate Area',
  rating: 4.9,
  totalTrips: 1420,
  acceptanceRate: 97,
  completionRate: 99,
  status: 'active',
  isOnline: true,
  currentVehicle: {
    make: 'Toyota',
    model: 'Corolla Hybrid',
    year: 2021,
    color: 'Silver Metallic',
    plate: '876-JAM-1',
    seatingCapacity: 4,
    category: 'economy',
  },
  payoutAccount: {
    bank: 'National Commercial Bank (NCB) Jamaica',
    accountNumber: '••••••••4810',
    branch: 'Knutsford Boulevard, New Kingston',
  },
  earnings: {
    todayJMD: 8400,
    weekJMD: 46200,
    monthJMD: 184500,
    pendingPayoutJMD: 28400,
    cashCollectedJMD: 1200,
  },
  documents: INITIAL_DRIVER_DOCUMENTS,
};

export const INITIAL_DRIVERS_LIST: DriverProfile[] = [
  INITIAL_DRIVER,
  {
    id: 'drv-877',
    fullName: 'Marcus Campbell',
    phone: '+1 (876) 555-3312',
    email: 'm.campbell@rideja.jm',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    operatingZone: 'Montego Bay & Western Jamaica',
    rating: 4.8,
    totalTrips: 830,
    acceptanceRate: 94,
    completionRate: 96,
    status: 'pending_approval',
    isOnline: false,
    currentVehicle: {
      make: 'Nissan',
      model: 'Note e-Power',
      year: 2020,
      color: 'Pearl White',
      plate: '876-MBJ-4',
      seatingCapacity: 4,
      category: 'comfort',
    },
    payoutAccount: {
      bank: 'Scotiabank Jamaica',
      accountNumber: '••••••••1192',
      branch: 'Sam Sharpe Square, Montego Bay',
    },
    earnings: {
      todayJMD: 0,
      weekJMD: 12000,
      monthJMD: 68000,
      pendingPayoutJMD: 12000,
      cashCollectedJMD: 0,
    },
    documents: [
      { ...INITIAL_DRIVER_DOCUMENTS[0], status: 'approved' },
      { ...INITIAL_DRIVER_DOCUMENTS[1], status: 'approved' },
      { ...INITIAL_DRIVER_DOCUMENTS[2], status: 'under_review', documentNumber: 'CRO-2026-1102' },
      { ...INITIAL_DRIVER_DOCUMENTS[3], status: 'approved' },
      { ...INITIAL_DRIVER_DOCUMENTS[4], status: 'approved' },
      { ...INITIAL_DRIVER_DOCUMENTS[5], status: 'approved' },
      { ...INITIAL_DRIVER_DOCUMENTS[6], status: 'pending' },
    ],
  },
];

export const INITIAL_LEDGER: FinancialLedgerEntry[] = [
  {
    id: 'led-101',
    tripId: 'RJ-901',
    timestamp: '2026-10-14 09:20',
    description: 'Trip: Half Way Tree to New Kingston',
    grossAmountJMD: 1200,
    platformCommissionJMD: 180,
    driverNetJMD: 1020,
    paymentType: 'cash',
    status: 'settled',
  },
  {
    id: 'led-102',
    tripId: 'RJ-902',
    timestamp: '2026-10-14 10:15',
    description: 'Trip: New Kingston to Norman Manley Airport',
    grossAmountJMD: 4000,
    platformCommissionJMD: 600,
    driverNetJMD: 3400,
    paymentType: 'card',
    status: 'settled',
  },
];

export const INITIAL_INCIDENTS: SafetyIncident[] = [
  {
    id: 'inc-401',
    tripId: 'RJ-889',
    reportedBy: 'passenger',
    reporterName: 'Kareem Forbes',
    type: 'lost_item',
    severity: 'low',
    timestamp: '2026-10-14 08:30',
    status: 'investigating',
    notes: 'Passenger left black Samsung phone on back seat after arriving at Devon House.',
    resolution: 'Driver contacted; confirmed item safely retrieved and returning to passenger.',
  },
];

/* ==========================================================================
   ELIGIBILITY RULES ENGINE
   ========================================================================== */

export function evaluateDriverEligibility(driver: DriverProfile) {
  const reasons: string[] = [];
  const passedChecks: string[] = [];

  if (driver.status === 'suspended') {
    reasons.push('Driver account is currently suspended by operations.');
  } else if (driver.status === 'onboarding' || driver.status === 'pending_approval') {
    reasons.push('Driver onboarding verification is not yet fully approved.');
  } else {
    passedChecks.push('Account status active and approved');
  }

  const reqDocTypes = [
    { type: 'national_id', label: 'Government Identification' },
    { type: 'driver_license', label: 'Island Traffic Authority Driver\'s Licence' },
    { type: 'police_record', label: 'Ministry of National Security Police Record' },
    { type: 'ppv_badge', label: 'Transport Authority PPV Driver Badge' },
    { type: 'vehicle_registration', label: 'Certificate of Vehicle Registration' },
    { type: 'commercial_insurance', label: 'Commercial PPV Passenger Insurance' },
    { type: 'certificate_of_fitness', label: 'Island Traffic Authority Certificate of Fitness' },
  ];

  const now = new Date('2026-10-14T11:37:19-07:00').getTime();

  for (const req of reqDocTypes) {
    const doc = driver.documents.find(d => d.type === req.type);
    if (!doc) {
      reasons.push(`Missing mandatory document: ${req.label}`);
    } else if (doc.status !== 'approved') {
      reasons.push(`${req.label} status is "${doc.status.toUpperCase()}" (must be Approved).`);
    } else {
      const exp = new Date(doc.expiryDate).getTime();
      if (exp < now) {
        reasons.push(`${req.label} has expired on ${doc.expiryDate}.`);
      } else {
        passedChecks.push(`${req.label} verified & valid until ${doc.expiryDate}`);
      }
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
    passedChecks,
  };
}

/* ==========================================================================
   REAL INTERACTIVE MAP COMPONENT (LEAFLET + CARTODB TILES)
   Displays high-resolution real street map of Jamaica with street names,
   landmarks, animated car markers with rotation, pickup/destination pins, and live routes.
   ========================================================================== */

export interface GeoPoint {
  lat: number;
  lng: number;
  bearing?: number;
}

export function calculateBearing(start: GeoPoint, end: GeoPoint): number {
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function distanceBetween(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371; // km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function interpolatePath(
  points: GeoPoint[],
  progress: number
): { point: GeoPoint; bearing: number; remainingKm: number } {
  if (points.length === 0) return { point: { lat: 0, lng: 0 }, bearing: 0, remainingKm: 0 };
  if (points.length === 1) return { point: points[0], bearing: 0, remainingKm: 0 };

  const clamped = Math.max(0, Math.min(1, progress));
  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = distanceBetween(points[i], points[i + 1]);
    segmentLengths.push(d);
    totalLength += d;
  }

  const targetDistance = clamped * totalLength;
  const remainingKm = Math.max(0, totalLength - targetDistance);

  let accumulated = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDistance || i === segmentLengths.length - 1) {
      const segProgress = segLen > 0 ? (targetDistance - accumulated) / segLen : 0;
      const p1 = points[i];
      const p2 = points[i + 1];
      const lat = p1.lat + (p2.lat - p1.lat) * segProgress;
      const lng = p1.lng + (p2.lng - p1.lng) * segProgress;
      const bearing = calculateBearing(p1, p2);
      return { point: { lat, lng }, bearing, remainingKm };
    }
    accumulated += segLen;
  }

  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  return { point: last, bearing: calculateBearing(secondLast, last), remainingKm: 0 };
}

// Street-aligned realistic waypoints generator for Kingston
export const generateApproachWaypoints = (pickup: LocationPoint): GeoPoint[] => [
  { lat: pickup.lat - 0.0075, lng: pickup.lng + 0.0055 }, // Starts on Knutsford / Trafalgar corridor
  { lat: pickup.lat - 0.0050, lng: pickup.lng + 0.0042 },
  { lat: pickup.lat - 0.0030, lng: pickup.lng + 0.0020 },
  { lat: pickup.lat - 0.0012, lng: pickup.lng + 0.0006 },
  { lat: pickup.lat, lng: pickup.lng }, // Arrived at pickup
];

export const generateTripWaypoints = (pickup: LocationPoint, dropoff: LocationPoint): GeoPoint[] => {
  const dLat = dropoff.lat - pickup.lat;
  const dLng = dropoff.lng - pickup.lng;
  return [
    { lat: pickup.lat, lng: pickup.lng },
    { lat: pickup.lat + dLat * 0.22, lng: pickup.lng + dLng * 0.05 },
    { lat: pickup.lat + dLat * 0.25, lng: pickup.lng + dLng * 0.45 },
    { lat: pickup.lat + dLat * 0.65, lng: pickup.lng + dLng * 0.48 },
    { lat: pickup.lat + dLat * 0.72, lng: dropoff.lng },
    { lat: dropoff.lat, lng: dropoff.lng },
  ];
};

const createCarIcon = (bearing: number = 0, vehicleTitle: string = 'Toyota Corolla') => {
  const html = `
    <div class="relative car-marker-container" style="width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
      <!-- Subtle Pulsing Proximity Radar beneath Car -->
      <div style="position: absolute; inset: 4px; border-radius: 9999px; background: rgba(0, 166, 81, 0.25); animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      
      <!-- Smoothly Rotating Car Chassis & Headlights -->
      <div class="car-rotation-wrapper" style="transform: rotate(${Math.round(bearing)}deg); transition: transform 0.35s ease-out; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; position: relative;">
        <!-- Forward Headlight Illuminating Beam -->
        <div style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); width: 24px; height: 20px; background: linear-gradient(to top, rgba(254, 240, 138, 0.55), rgba(254, 240, 138, 0)); clip-path: polygon(20% 100%, 80% 100%, 100% 0%, 0% 0%); pointer-events: none; filter: blur(0.8px);"></div>
        
        <!-- Authentic Top-Down Modern Sedan SVG -->
        <svg width="22" height="40" viewBox="0 0 22 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 5px 6px rgba(0,0,0,0.45));">
          <!-- Metallic Silver Body Shell -->
          <rect x="2" y="3" width="18" height="34" rx="4.5" fill="#F1F5F9" stroke="#0F172A" stroke-width="1.2"/>
          <!-- Jamaican Green Accent / Roof -->
          <rect x="5" y="15" width="12" height="11" rx="2" fill="#00A651"/>
          <!-- Front Windshield -->
          <path d="M4 11 C6 8.5, 16 8.5, 18 11 L17 14 C15 13.5, 7 13.5, 5 14 Z" fill="#0F172A"/>
          <!-- Rear Windshield -->
          <path d="M5 28 C7 29, 15 29, 17 28 L17.5 31 C16 31.8, 6 31.8, 4.5 31 Z" fill="#0F172A"/>
          <!-- Side Mirrors -->
          <rect x="0.5" y="11" width="1.8" height="3.5" rx="0.8" fill="#0F172A"/>
          <rect x="19.7" y="11" width="1.8" height="3.5" rx="0.8" fill="#0F172A"/>
          <!-- Headlights -->
          <ellipse cx="4.5" cy="4" rx="1.5" ry="1" fill="#FEF08A"/>
          <ellipse cx="17.5" cy="4" rx="1.5" ry="1" fill="#FEF08A"/>
          <!-- Red Taillights -->
          <ellipse cx="4.5" cy="36.5" rx="1.5" ry="0.8" fill="#EF4444"/>
          <ellipse cx="17.5" cy="36.5" rx="1.5" ry="0.8" fill="#EF4444"/>
        </svg>
      </div>

      <!-- Live Floating Driver Badge above the Car -->
      <div style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); color: #FFD600; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; border: 1px solid rgba(255, 214, 0, 0.45); white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.5); pointer-events: auto;">
        ${vehicleTitle}
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-moving-car-pin',
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

interface LeafletMapProps {
  pickup: LocationPoint;
  destination: LocationPoint;
  isDark?: boolean;
  driverPosition?: { lat: number; lng: number; bearing?: number };
  showRoute?: boolean;
  onSelectPreset?: (loc: LocationPoint) => void;
  activeStatus?: RideStatus;
}

const JamaicaLeafletMap: React.FC<LeafletMapProps> = ({
  pickup,
  destination,
  isDark = false,
  driverPosition,
  showRoute = true,
  onSelectPreset,
  activeStatus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const lastFittedStatusRef = useRef<string>('');

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    // Center on Kingston, Jamaica [18.0125, -76.7989]
    const map = L.map(containerRef.current, {
      center: [pickup.lat, pickup.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Initial resize trigger
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      driverMarkerRef.current = null;
    };
  }, []);

  // Update Tile Layer when Dark/Light changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const cartoKey = 'cb1_4kq7_1_cdef43338f3cb85d9245d692';
    const tileUrl = isDark
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoKey}`
      : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`;

    const layer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      crossOrigin: true,
    });

    layer.on('tileerror', (error) => {
      console.warn('Tile error, falling back to OSM:', error);
    });

    layer.addTo(map);
  }, [isDark]);

  // Update Static Pins, Route Polyline, and Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    // Clear existing markers except we handle driver separately
    layerGroup.clearLayers();
    driverMarkerRef.current = null;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // 1. Pickup Marker (Green Pulse Ring Pin)
    const pickupHtml = `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(0, 166, 81, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 20px; height: 20px; border-radius: 9999px; background: #00A651; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <div style="width: 5px; height: 5px; border-radius: 9999px; background: #ffffff;"></div>
        </div>
      </div>
    `;
    const pickupIcon = L.divIcon({
      html: pickupHtml,
      className: 'custom-pickup-pin',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
      .bindPopup(`<b>Pickup:</b> ${pickup.name}`)
      .addTo(layerGroup);

    // 2. Destination Marker (Red Pin with Square Head)
    const dropoffHtml = `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 20px; height: 20px; border-radius: 4px; background: #D92D20; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <div style="width: 5px; height: 5px; border-radius: 1px; background: #ffffff;"></div>
        </div>
      </div>
    `;
    const dropoffIcon = L.divIcon({
      html: dropoffHtml,
      className: 'custom-dropoff-pin',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    L.marker([destination.lat, destination.lng], { icon: dropoffIcon })
      .bindPopup(`<b>Destination:</b> ${destination.name}`)
      .addTo(layerGroup);

    // 3. Nearby Idle Fleet in Jamaica (when searching or idle)
    if (!activeStatus || activeStatus === 'SEARCHING') {
      const nearbyFleet = [
        { lat: pickup.lat + 0.0035, lng: pickup.lng - 0.0040 },
        { lat: pickup.lat - 0.0030, lng: pickup.lng + 0.0045 },
        { lat: pickup.lat + 0.0050, lng: pickup.lng + 0.0030 },
      ];
      nearbyFleet.forEach(pos => {
        const idleCarHtml = `
          <div style="width: 24px; height: 24px; border-radius: 9999px; background: #0f172a; border: 2px solid #00A651; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 9999px; background: #FFD600;"></div>
          </div>
        `;
        const idleIcon = L.divIcon({
          html: idleCarHtml,
          className: 'idle-car-pin',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([pos.lat, pos.lng], { icon: idleIcon }).addTo(layerGroup);
      });
    }

    // 4. Draw Appropriate Street Route Polyline
    let routeCoords: L.LatLngExpression[] = [];
    let polylineColor = '#00A651';

    if (activeStatus === 'DRIVER_ARRIVING') {
      // Approach route from driver start to pickup
      const approachWaypoints = generateApproachWaypoints(pickup);
      routeCoords = approachWaypoints.map(p => [p.lat, p.lng]);
      polylineColor = '#FFD600'; // Jamaican Gold for driver arriving
    } else if (activeStatus === 'IN_PROGRESS' || showRoute) {
      // Full trip route from pickup to destination
      const tripWaypoints = generateTripWaypoints(pickup, destination);
      routeCoords = tripWaypoints.map(p => [p.lat, p.lng]);
      polylineColor = '#00A651'; // Jamaican Green for active trip
    }

    if (routeCoords.length > 0) {
      const polyline = L.polyline(routeCoords, {
        color: polylineColor,
        weight: 6,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      routeLayerRef.current = polyline;
    }

    // Fit bounds once for this pickup/destination/status combo
    const statusKey = `${pickup.id}_${destination.id}_${activeStatus || 'default'}`;
    if (lastFittedStatusRef.current !== statusKey) {
      lastFittedStatusRef.current = statusKey;
      if (activeStatus === 'DRIVER_ARRIVING') {
        const approachWaypoints = generateApproachWaypoints(pickup);
        const bounds = L.latLngBounds(approachWaypoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 16 });
      } else if (showRoute || activeStatus === 'IN_PROGRESS') {
        const bounds = L.latLngBounds([
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ]);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 16 });
      } else {
        map.setView([pickup.lat, pickup.lng], 15);
      }
    }
  }, [pickup, destination, showRoute, activeStatus]);

  // 5. Dedicated Smooth Driver Marker Movement & Rotation
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    const currentPos = driverPosition || (activeStatus === 'DRIVER_ARRIVING'
      ? generateApproachWaypoints(pickup)[0]
      : { lat: pickup.lat - 0.005, lng: pickup.lng + 0.004, bearing: 45 });

    if (driverMarkerRef.current) {
      // Smoothly reposition marker
      driverMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng]);

      // Smoothly rotate the car chassis via DOM
      const markerEl = driverMarkerRef.current.getElement();
      if (markerEl) {
        const wrapper = markerEl.querySelector('.car-rotation-wrapper') as HTMLElement;
        if (wrapper && typeof currentPos.bearing === 'number') {
          wrapper.style.transform = `rotate(${Math.round(currentPos.bearing)}deg)`;
        }
      }
    } else {
      // Create driver marker
      const initialBearing = currentPos.bearing ?? 45;
      const icon = createCarIcon(initialBearing, 'Dwayne (Toyota Corolla)');
      const marker = L.marker([currentPos.lat, currentPos.lng], {
        icon,
        zIndexOffset: 1000, // Keep car on top of all pins
      })
        .bindPopup(`<b>Driver Dwayne Williams</b><br>Silver Toyota Corolla (PPV-4820)`)
        .addTo(layerGroup);

      driverMarkerRef.current = marker;
    }
  }, [driverPosition, activeStatus, pickup]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Recenter & Zoom Controls */}
      <div className="absolute top-14 right-3 z-[400] flex flex-col gap-2">
        <button
          onClick={() => {
            const map = mapInstanceRef.current;
            if (map) {
              if (driverPosition) {
                map.setView([driverPosition.lat, driverPosition.lng], 16, { animate: true });
              } else {
                map.setView([pickup.lat, pickup.lng], 15, { animate: true });
              }
            }
          }}
          title="Recenter to Live Car / Pickup"
          className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <Navigation className="w-5 h-5 text-[#00A651]" />
        </button>

        <div className="flex flex-col rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-10 h-9 flex items-center justify-center text-slate-700 font-extrabold text-base hover:bg-slate-50"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-10 h-9 flex items-center justify-center text-slate-700 font-extrabold text-base hover:bg-slate-50"
          >
            -
          </button>
        </div>
      </div>

      {/* Map Watermark Banner */}
      <div className="absolute bottom-2 left-2 z-[400] px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200 text-[9px] font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]"></span>
        <span>Live Navigation • CARTO / OpenStreetMap</span>
      </div>
    </div>
  );
};

/* ==========================================================================
   MAIN RIDEJA APPLICATION COMPONENT
   ========================================================================== */

export default function App() {
  // Helper to determine role from URL pathname (/driver, /admin, /passenger)
  const getRoleFromPath = (): AppRole => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/driver')) return 'driver';
    if (path.startsWith('/admin')) return 'admin';
    return 'passenger';
  };

  const [currentRole, setCurrentRole] = useState<AppRole>(getRoleFromPath);

  // Passenger Navigation Screen - Default is splashscreen per user request
  type PassengerScreen =
    | 'splash'
    | 'auth'
    | 'home'
    | 'choose_ride'
    | 'finding_driver'
    | 'driver_approaching'
    | 'in_trip'
    | 'trip_completed'
    | 'activity'
    | 'wallet'
    | 'account'
    | 'safety'
    | 'explore';

  const [passengerScreen, setPassengerScreen] = useState<PassengerScreen>('splash');

  // Driver Navigation Screen
  type DriverScreen =
    | 'dashboard'
    | 'onboarding'
    | 'active_job'
    | 'earnings'
    | 'compliance';

  const [driverScreen, setDriverScreen] = useState<DriverScreen>('dashboard');

  // Admin Navigation Screen
  type AdminScreen =
    | 'overview'
    | 'drivers'
    | 'verification_queue'
    | 'live_dispatch'
    | 'fares'
    | 'safety_incidents'
    | 'ledger';

  const [adminScreen, setAdminScreen] = useState<AdminScreen>('overview');
  const [mobileAdminMenuOpen, setMobileAdminMenuOpen] = useState<boolean>(false);
  const [demoBarMinimized, setDemoBarMinimized] = useState<boolean>(false);
  const [demoBarPosition, setDemoBarPosition] = useState<'bottom' | 'top'>('bottom');

  // Direct Route Navigation Helper (/driver, /admin, /passenger)
  const navigateTo = (role: AppRole, screen?: PassengerScreen) => {
    setCurrentRole(role);
    if (screen) setPassengerScreen(screen);
    const targetPath = role === 'driver' ? '/driver' : role === 'admin' ? '/admin' : '/passenger';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Synchronize on browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/driver')) {
        setCurrentRole('driver');
      } else if (path.startsWith('/admin')) {
        setCurrentRole('admin');
      } else {
        setCurrentRole('passenger');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Shared Master Data State
  const [categories, setCategories] = useState<RideCategoryConfig[]>(() => {
    const saved = localStorage.getItem('rideja_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [driver, setDriver] = useState<DriverProfile>(() => {
    const saved = localStorage.getItem('rideja_driver');
    if (saved) {
      try {
        const parsed: DriverProfile = JSON.parse(saved);
        // Ensure all 7 mandatory documents are present, up to date with future expiries, and approved
        const syncedDocs = INITIAL_DRIVER_DOCUMENTS.map(initDoc => {
          const match = parsed.documents?.find(d => d.type === initDoc.type);
          if (!match) return initDoc;
          const isExpired = new Date(match.expiryDate).getTime() < new Date('2026-10-14T11:37:19-07:00').getTime();
          if (isExpired || match.status !== 'approved') {
            return {
              ...match,
              issueDate: initDoc.issueDate,
              expiryDate: initDoc.expiryDate,
              status: 'approved' as const,
              reviewedBy: 'Compliance Admin (Sarah)',
              reviewedAt: '2026-10-15',
            };
          }
          return match;
        });
        return {
          ...parsed,
          status: 'active' as const,
          isOnline: true,
          documents: syncedDocs,
        };
      } catch {
        return INITIAL_DRIVER;
      }
    }
    return INITIAL_DRIVER;
  });

  const [driversList, setDriversList] = useState<DriverProfile[]>(() => {
    const saved = localStorage.getItem('rideja_drivers_list');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS_LIST;
  });

  const [ledger, setLedger] = useState<FinancialLedgerEntry[]>(() => {
    const saved = localStorage.getItem('rideja_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [incidents, setIncidents] = useState<SafetyIncident[]>(() => {
    const saved = localStorage.getItem('rideja_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  // Current Active Ride State
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(() => {
    const saved = localStorage.getItem('rideja_active_ride');
    return saved ? JSON.parse(saved) : null;
  });

  // Passenger Booking Workflow State
  const [pickupLoc, setPickupLoc] = useState<LocationPoint>(JAMAICA_PRESETS[0]); // Half Way Tree
  const [dropoffLoc, setDropoffLoc] = useState<LocationPoint>(JAMAICA_PRESETS[1]); // New Kingston
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<RideCategoryKey>('economy');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa' | 'mastercard'>('visa');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscountJMD, setPromoDiscountJMD] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearchField, setActiveSearchField] = useState<'pickup' | 'dropoff'>('dropoff');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);

  // Live Simulation State
  const [simProgress, setSimProgress] = useState<number>(0);
  const [driverOfferTimer, setDriverOfferTimer] = useState<number>(15);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'passenger' | 'driver'; text: string; time: string }>>([
    { sender: 'driver', text: "Hello! I'm on the way in the silver Toyota Corolla.", time: '11:45' },
  ]);
  const [newChatInput, setNewChatInput] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [sosModalOpen, setSosModalOpen] = useState<boolean>(false);
  const [adminInspectionDoc, setAdminInspectionDoc] = useState<DriverDocument | null>(null);
  const [resolvingIncident, setResolvingIncident] = useState<SafetyIncident | null>(null);
  const [incidentResolutionNote, setIncidentResolutionNote] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Real-time Cross-Tab & Cross-Device Broadcast Sync Helper
  const broadcastSync = (type: string, payload: unknown) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('rideja_sync_channel');
        bc.postMessage({ type, payload });
        bc.close();
      }
    } catch {
      // Ignore broadcast error
    }
  };

  // Listen to BroadcastChannel and window storage events for real-time multi-window sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('rideja_sync_channel');
        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'SYNC_RIDE') {
            setCurrentRide(payload);
            if (payload?.status === 'SEARCHING' && currentRole === 'driver') {
              playChime('dispatch');
            } else if (payload?.status === 'DRIVER_ARRIVING' && currentRole === 'passenger') {
              setPassengerScreen('driver_approaching');
            } else if (payload?.status === 'IN_PROGRESS' && currentRole === 'passenger') {
              setPassengerScreen('in_trip');
            } else if (payload?.status === 'COMPLETED' && currentRole === 'passenger') {
              setPassengerScreen('trip_completed');
            }
          } else if (type === 'SYNC_CHAT') {
            setChatMessages(prev => [...prev, payload]);
          } else if (type === 'SYNC_INCIDENT') {
            setIncidents(prev => [payload, ...prev]);
            playChime('sos');
          } else if (type === 'SYNC_LEDGER') {
            setLedger(prev => [payload, ...prev]);
          }
        };
      }
    } catch {
      // Ignore error
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'rideja_active_ride' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setCurrentRide(updated);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      bc?.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [currentRole]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('rideja_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('rideja_driver', JSON.stringify(driver));
  }, [driver]);

  useEffect(() => {
    localStorage.setItem('rideja_drivers_list', JSON.stringify(driversList));
  }, [driversList]);

  useEffect(() => {
    localStorage.setItem('rideja_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('rideja_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('rideja_active_ride', JSON.stringify(currentRide));
  }, [currentRide]);

  // Authoritative Fare Calculation Engine
  const calculateFare = (
    catKey: RideCategoryKey,
    pickup: LocationPoint,
    dropoff: LocationPoint,
    discount = 0
  ) => {
    const cat = categories.find(c => c.id === catKey) || categories[0];
    // Haversine formula calculation in KM
    const R = 6371; // Earth radius in km
    const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
    const dLon = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickup.lat * Math.PI) / 180) *
        Math.cos((dropoff.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const rawKm = R * c;
    const approxKm = Math.max(1.8, Math.round(rawKm * 10) / 10);
    const approxMins = Math.max(4, Math.round(approxKm * 2.5));

    const distanceCharge = Math.round(approxKm * cat.perKmJMD);
    const timeCharge = Math.round(approxMins * cat.perMinJMD);
    const rawFare = cat.baseFareJMD + distanceCharge + timeCharge + cat.bookingFeeJMD;
    const baseWithMultiplier = Math.round(rawFare * cat.multiplier);
    const calculatedFare = Math.max(cat.minimumFareJMD, baseWithMultiplier);
    const finalFare = Math.max(0, calculatedFare - discount);

    return {
      distanceKm: approxKm,
      durationMins: approxMins,
      rawFare,
      calculatedFare,
      finalFare,
      cat,
    };
  };

  const selectedFareInfo = useMemo(() => {
    return calculateFare(selectedCategoryKey, pickupLoc, dropoffLoc, promoDiscountJMD);
  }, [selectedCategoryKey, pickupLoc, dropoffLoc, promoDiscountJMD, categories]);

  const driverEligibility = useMemo(() => {
    return evaluateDriverEligibility(driver);
  }, [driver]);

  // Dispatch & Ride Lifecycle State Machine (Live Animated Vehicle Simulation)
  useEffect(() => {
    if (!currentRide) return;

    if (currentRide.status === 'SEARCHING') {
      const timer = setInterval(() => {
        setDriverOfferTimer(prev => {
          if (prev <= 1) {
            handleDriverAcceptTrip();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    if (currentRide.status === 'DRIVER_ARRIVING') {
      const approachWaypoints = generateApproachWaypoints(currentRide.pickup);
      const interval = setInterval(() => {
        setSimProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(interval);
            playChime('arrival');
            const endPoint = approachWaypoints[approachWaypoints.length - 1];
            const prevPoint = approachWaypoints[approachWaypoints.length - 2];
            const finalBearing = calculateBearing(prevPoint, endPoint);
            setCurrentRide(r => {
              if (!r) return null;
              const arrived: RideRequest = {
                ...r,
                status: 'DRIVER_ARRIVED',
                pickupEtaMins: 0,
                driverPosition: { lat: endPoint.lat, lng: endPoint.lng, bearing: finalBearing },
              };
              broadcastSync('SYNC_RIDE', arrived);
              return arrived;
            });
            showToast('📍 Driver Dwayne has arrived at the pickup location!');
            return 100;
          }

          const { point, bearing } = interpolatePath(approachWaypoints, next / 100);
          const etaMins = Math.max(1, Math.ceil((1 - next / 100) * 3));

          setCurrentRide(r => {
            if (!r || r.status !== 'DRIVER_ARRIVING') return r;
            const updated: RideRequest = {
              ...r,
              pickupEtaMins: etaMins,
              driverPosition: { lat: point.lat, lng: point.lng, bearing },
            };
            broadcastSync('SYNC_RIDE', updated);
            return updated;
          });
          return next;
        });
      }, 650);
      return () => clearInterval(interval);
    }

    if (currentRide.status === 'IN_PROGRESS') {
      const tripWaypoints = generateTripWaypoints(currentRide.pickup, currentRide.destination);
      const interval = setInterval(() => {
        setSimProgress(prev => {
          const next = prev + 4.5;
          if (next >= 100) {
            clearInterval(interval);
            handleCompleteTrip();
            return 100;
          }

          const { point, bearing } = interpolatePath(tripWaypoints, next / 100);
          const totalDuration = currentRide.durationMins || 8;
          const etaMins = Math.max(1, Math.ceil((1 - next / 100) * totalDuration));

          setCurrentRide(r => {
            if (!r || r.status !== 'IN_PROGRESS') return r;
            const updated: RideRequest = {
              ...r,
              tripEtaMins: etaMins,
              driverPosition: { lat: point.lat, lng: point.lng, bearing },
            };
            broadcastSync('SYNC_RIDE', updated);
            return updated;
          });
          return next;
        });
      }, 750);
      return () => clearInterval(interval);
    }
  }, [currentRide?.status]);

  // Fast-Forward Helpers for Presentations
  const handleFastForwardArrival = () => {
    if (!currentRide || currentRide.status !== 'DRIVER_ARRIVING') return;
    const approachWaypoints = generateApproachWaypoints(currentRide.pickup);
    const endPoint = approachWaypoints[approachWaypoints.length - 1];
    setSimProgress(100);
    playChime('arrival');
    const arrived: RideRequest = {
      ...currentRide,
      status: 'DRIVER_ARRIVED',
      pickupEtaMins: 0,
      driverPosition: { lat: endPoint.lat, lng: endPoint.lng, bearing: 0 },
    };
    setCurrentRide(arrived);
    broadcastSync('SYNC_RIDE', arrived);
    showToast('⚡ Fast-forward: Driver Dwayne has arrived at pickup!');
  };

  const handleFastForwardTrip = () => {
    if (!currentRide || currentRide.status !== 'IN_PROGRESS') return;
    setSimProgress(100);
    handleCompleteTrip();
    showToast('⚡ Fast-forward: Trip completed at destination!');
  };

  // Handlers for Ride Booking
  const handleRequestRide = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const approachStart = generateApproachWaypoints(pickupLoc)[0];
    const newRide: RideRequest = {
      id: `RJ-${Math.floor(100 + Math.random() * 900)}`,
      passengerId: 'pax-901',
      passengerName: 'Akeim Sutherland',
      passengerPhone: '+1 (876) 555-0123',
      pickup: pickupLoc,
      destination: dropoffLoc,
      category: selectedCategoryKey,
      categoryName: selectedFareInfo.cat.name,
      pickupPin: pin,
      status: 'SEARCHING',
      fareEstimateJMD: selectedFareInfo.finalFare,
      finalFareJMD: selectedFareInfo.finalFare,
      distanceKm: selectedFareInfo.distanceKm,
      durationMins: selectedFareInfo.durationMins,
      paymentMethod,
      paymentStatus: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      driverPosition: { lat: approachStart.lat, lng: approachStart.lng, bearing: 45 },
      pickupEtaMins: 3,
      tripEtaMins: selectedFareInfo.durationMins,
    };

    setSimProgress(0);
    setCurrentRide(newRide);
    broadcastSync('SYNC_RIDE', newRide);
    setPassengerScreen('finding_driver');
    setDriverOfferTimer(15);
    playChime('dispatch');
  };

  const handleDriverAcceptTrip = () => {
    if (!currentRide) return;
    playChime('dispatch');
    const approachStart = generateApproachWaypoints(currentRide.pickup)[0];
    const approachSecond = generateApproachWaypoints(currentRide.pickup)[1];
    const initialBearing = calculateBearing(approachStart, approachSecond);

    const updatedRide: RideRequest = {
      ...currentRide,
      status: 'DRIVER_ARRIVING',
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      driverPhoto: driver.photo,
      driverRating: driver.rating,
      vehicleDesc: `${driver.currentVehicle.year} ${driver.currentVehicle.color} ${driver.currentVehicle.make} ${driver.currentVehicle.model}`,
      vehiclePlate: driver.currentVehicle.plate,
      assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pickupEtaMins: 3,
      driverPosition: { lat: approachStart.lat, lng: approachStart.lng, bearing: initialBearing },
    };
    setSimProgress(0);
    setCurrentRide(updatedRide);
    broadcastSync('SYNC_RIDE', updatedRide);
    setPassengerScreen('driver_approaching');
  };

  const handleDriverArrived = () => {
    if (!currentRide) return;
    playChime('arrival');
    const updated: RideRequest = {
      ...currentRide,
      status: 'DRIVER_ARRIVED',
      pickupEtaMins: 0,
      driverPosition: { lat: currentRide.pickup.lat, lng: currentRide.pickup.lng, bearing: 0 },
    };
    setCurrentRide(updated);
    broadcastSync('SYNC_RIDE', updated);
  };

  const handleVerifyPinAndStartTrip = () => {
    if (!currentRide) return;
    if (enteredPin.trim() === currentRide.pickupPin) {
      setPinError('');
      setEnteredPin('');
      const tripWaypoints = generateTripWaypoints(currentRide.pickup, currentRide.destination);
      const initialBearing = calculateBearing(tripWaypoints[0], tripWaypoints[1]);
      const updated: RideRequest = {
        ...currentRide,
        status: 'IN_PROGRESS',
        driverPosition: { lat: tripWaypoints[0].lat, lng: tripWaypoints[0].lng, bearing: initialBearing },
        tripEtaMins: currentRide.durationMins || 8,
      };
      setSimProgress(0);
      setCurrentRide(updated);
      broadcastSync('SYNC_RIDE', updated);
      setPassengerScreen('in_trip');
      playChime('dispatch');
      showToast('🚖 PIN verified! Trip in progress to destination.');
    } else {
      setPinError('Incorrect 4-digit PIN. Please verify with passenger.');
    }
  };

  const handleCompleteTrip = () => {
    if (!currentRide) return;
    playChime('complete');
    const finalFare = currentRide.finalFareJMD;
    const commission = Math.round(finalFare * 0.15);
    const driverNet = finalFare - commission;

    const newLedgerEntry: FinancialLedgerEntry = {
      id: `led-${Date.now().toString().slice(-4)}`,
      tripId: currentRide.id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      description: `Trip: ${currentRide.pickup.name} to ${currentRide.destination.name}`,
      grossAmountJMD: finalFare,
      platformCommissionJMD: commission,
      driverNetJMD: driverNet,
      paymentType: currentRide.paymentMethod === 'cash' ? 'cash' : 'card',
      status: 'settled',
    };

    setLedger(prev => [newLedgerEntry, ...prev]);
    broadcastSync('SYNC_LEDGER', newLedgerEntry);

    // Update driver balance
    setDriver(prev => ({
      ...prev,
      totalTrips: prev.totalTrips + 1,
      earnings: {
        ...prev.earnings,
        todayJMD: prev.earnings.todayJMD + driverNet,
        weekJMD: prev.earnings.weekJMD + driverNet,
        monthJMD: prev.earnings.monthJMD + driverNet,
        pendingPayoutJMD: prev.earnings.pendingPayoutJMD + (currentRide.paymentMethod !== 'cash' ? driverNet : 0),
        cashCollectedJMD: prev.earnings.cashCollectedJMD + (currentRide.paymentMethod === 'cash' ? finalFare : 0),
      },
    }));

    const updated: RideRequest = { ...currentRide, status: 'COMPLETED', paymentStatus: 'completed' };
    setCurrentRide(updated);
    broadcastSync('SYNC_RIDE', updated);
    setPassengerScreen('trip_completed');
  };

  const handleCancelRide = (reason = 'Cancelled by user') => {
    if (!currentRide) return;
    const updated: RideRequest = { ...currentRide, status: 'CANCELLED_BY_PASSENGER' };
    setCurrentRide(updated);
    broadcastSync('SYNC_RIDE', updated);
    setPassengerScreen('home');
  };

  const handleSendChatMessage = () => {
    if (!newChatInput.trim()) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: { sender: 'driver' | 'passenger'; text: string; time: string } = {
      sender: currentRole === 'driver' ? 'driver' : 'passenger',
      text: newChatInput.trim(),
      time: nowStr,
    };
    setChatMessages(prev => [...prev, newMsg]);
    broadcastSync('SYNC_CHAT', newMsg);
    setNewChatInput('');
  };

  const handleTriggerSos = (type: 'emergency_sos' | 'unsafe_driving' | 'vehicle_mismatch') => {
    playChime('sos');
    const newInc: SafetyIncident = {
      id: `inc-${Date.now().toString().slice(-4)}`,
      tripId: currentRide ? currentRide.id : 'N/A',
      reportedBy: currentRole === 'driver' ? 'driver' : 'passenger',
      reporterName: currentRole === 'driver' ? driver.fullName : 'Akeim Sutherland',
      type,
      severity: 'high',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'open',
      notes: `Urgent safety report dispatched from ${pickupLoc.area}. Emergency services notified.`,
    };
    setIncidents(prev => [newInc, ...prev]);
    broadcastSync('SYNC_INCIDENT', newInc);
    setSosModalOpen(false);
    showToast('RideJa Safety Team Alerted. Jamaica Constabulary Force (119) & Emergency Response dispatch activated.');
  };

  /* ==========================================================================
     PASSENGER SUB-SCREENS
     ========================================================================== */

  // 1. Splash & Onboarding Screen (Matches Collage Phone 1 - Default Screen)
  const renderPassengerSplash = () => (
    <div className="relative w-full h-full flex flex-col justify-between bg-black text-white overflow-hidden">
      {/* Background Hero Image - Modern Ride-Hailing Car Aligned with RideJa */}
      <div className="absolute inset-0 z-0 opacity-85">
        <img
          src="/rideja_splash.jpg"
          alt="RideJa Vehicle on Scenic Road"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-700"
          onError={(e) => {
            // High-resolution CDN fallback
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1080&auto=format&fit=crop&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/35" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 p-6 pt-4 flex flex-col">
        <div className="flex items-center gap-2 mt-4">
          <div className="w-10 h-10 rounded-2xl bg-[#00A651] flex items-center justify-center shadow-lg border-2 border-[#FFD600]">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight">
            Ride<span className="text-[#FFD600]">Ja</span>
          </span>
        </div>
        <p className="mt-3 text-lg font-medium text-slate-200">
          Safe Rides. Everywhere.<br />Across Jamaica.
        </p>
      </div>

      {/* Bottom CTA Block */}
      <div className="relative z-10 p-6 pb-8 space-y-3">
        <div className="w-full h-1 bg-gradient-to-r from-[#00A651] via-[#FFD600] to-[#00A651] rounded-full mb-3" />
        <button
          onClick={() => {
            setPassengerScreen('home');
            if (window.location.pathname !== '/passenger') {
              window.history.pushState(null, '', '/passenger');
            }
          }}
          className="w-full py-4 rounded-2xl bg-[#FFD600] text-[#101418] font-bold text-base hover:bg-yellow-400 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setPassengerScreen('auth');
            if (window.location.pathname !== '/passenger') {
              window.history.pushState(null, '', '/passenger');
            }
          }}
          className="w-full py-3.5 rounded-2xl bg-white/10 backdrop-blur-md text-white font-semibold text-sm hover:bg-white/20 active:scale-[0.98] transition-all border border-white/20"
        >
          Sign In
        </button>

        {/* Direct Route Links (/driver, /admin, /passenger) */}
        <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-300 pt-2">
          <button
            onClick={() => navigateTo('driver')}
            className="hover:text-[#FFD600] transition-colors flex items-center gap-1 underline underline-offset-4"
          >
            <Car className="w-3.5 h-3.5" />
            Driver App (/driver)
          </button>
          <span>•</span>
          <button
            onClick={() => navigateTo('admin')}
            className="hover:text-[#00A651] transition-colors flex items-center gap-1 underline underline-offset-4"
          >
            <Building className="w-3.5 h-3.5" />
            Admin Portal (/admin)
          </button>
        </div>

        <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-3" />
      </div>
    </div>
  );

  // 2. Authentication Screen (Phone + SMS OTP Simulation)
  const renderPassengerAuth = () => (
    <div className="w-full h-full bg-white flex flex-col justify-between">
      <div>
        <div className="p-6">
          <button
            onClick={() => setPassengerScreen('splash')}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h1 className="mt-6 text-2xl font-extrabold text-[#101418]">
            Enter your mobile number
          </h1>
          <p className="mt-2 text-sm text-[#667085]">
            We will send a 4-digit verification code to your Jamaican phone number.
          </p>

          <div className="mt-6 flex items-center gap-3 p-3.5 rounded-2xl border-2 border-slate-200 focus-within:border-[#00A651] transition-colors">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 border-r pr-3 border-slate-200">
              <span className="text-lg">🇯🇲</span>
              <span>+1 (876)</span>
            </div>
            <input
              type="tel"
              defaultValue="555-0123"
              placeholder="555-0123"
              className="flex-1 text-lg font-semibold text-slate-900 outline-none bg-transparent"
            />
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00A651] shrink-0" />
            <span>Demo Account: Akeim Sutherland (+1 876 555-0123) is pre-configured.</span>
          </div>
        </div>
      </div>

      <div className="p-6 pb-8 space-y-3">
        <button
          onClick={() => setPassengerScreen('home')}
          className="w-full py-4 rounded-2xl bg-[#101418] text-white font-bold text-base hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5 text-[#FFD600]" />
        </button>
        <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto" />
      </div>
    </div>
  );

  // 3. Main Home & Map Screen (Matches Collage Phone 2)
  const renderPassengerHome = () => (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Real Interactive Leaflet Street Map Container */}
      <div className="flex-1 relative">
        <JamaicaLeafletMap
          pickup={pickupLoc}
          destination={dropoffLoc}
          showRoute={false}
          driverPosition={currentRide?.driverPosition}
        />

        {/* Top Native Header & Search Overlays */}
        <div className="absolute top-0 left-0 right-0 z-[400]">

          {/* Top Bar Actions & RideJa Brand (Clean Native Header) */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-xl border border-slate-200">
              <div className="w-5 h-5 rounded-lg bg-[#00A651] flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-sm tracking-tight text-slate-900">
                Ride<span className="text-[#00A651]">Ja</span>
              </span>
            </div>

            <button
              onClick={() => setPassengerScreen('safety')}
              className="w-10 h-10 rounded-2xl bg-white shadow-xl border border-slate-200 flex items-center justify-center text-[#00A651] hover:bg-green-50 active:scale-95 transition-all"
              title="Safety & Emergency"
            >
              <Shield className="w-5 h-5" />
            </button>
          </div>

          {/* Pickup and Destination Card (Matches Phone 2 in Collage) */}
          <div className="mx-4 mt-1 p-3 bg-white rounded-2xl shadow-2xl border border-slate-200/90 space-y-2">
            <button
              onClick={() => {
                setActiveSearchField('pickup');
                setIsSearchingLocation(true);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-3 h-3 rounded-full bg-[#00A651] ring-4 ring-green-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pickup location</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{pickupLoc.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <div className="h-px bg-slate-100 mx-2" />

            <button
              onClick={() => {
                setActiveSearchField('dropoff');
                setIsSearchingLocation(true);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left border border-slate-100"
            >
              <div className="w-3 h-3 rounded-full bg-[#D92D20] ring-4 ring-red-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Where to?</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{dropoffLoc.name}</p>
              </div>
              <Search className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Location Search Modal Overlay */}
        {isSearchingLocation && (
          <div className="absolute inset-0 z-[500] bg-white flex flex-col p-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 pt-2">
              <button
                onClick={() => setIsSearchingLocation(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#00A651] uppercase">
                  Select {activeSearchField === 'pickup' ? 'Pickup' : 'Destination'}
                </p>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Kingston, Portmore, Mobay..."
                  className="w-full text-base font-semibold text-slate-900 outline-none"
                />
              </div>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Jamaican Preset Locations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">
                Popular Locations in Jamaica
              </p>
              {JAMAICA_PRESETS.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.area.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(loc => (
                <button
                  key={loc.id}
                  onClick={() => {
                    if (activeSearchField === 'pickup') {
                      setPickupLoc(loc);
                    } else {
                      setDropoffLoc(loc);
                    }
                    setIsSearchingLocation(false);
                    setSearchQuery('');
                  }}
                  className="w-full py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <MapPin className="w-4 h-4 text-[#00A651]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{loc.name}</p>
                    <p className="text-xs text-slate-500 truncate">{loc.address}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100">
                    {loc.area}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Ride Category Sheet (Matches Phone 2 in Collage) */}
      <div className="p-4 bg-white border-t border-slate-100 rounded-t-3xl shadow-2xl space-y-3 z-10">
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto" />
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Available Rides</p>
          <span className="text-xs font-semibold text-[#00A651]">Estimated in JMD</span>
        </div>

        {/* Horizontal Category Cards */}
        <div className="grid grid-cols-4 gap-2">
          {categories.slice(0, 4).map(cat => {
            const isSelected = selectedCategoryKey === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryKey(cat.id);
                  setPassengerScreen('choose_ride');
                }}
                className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all text-center ${
                  isSelected
                    ? 'border-[#00A651] bg-green-50/50 ring-2 ring-[#00A651]/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-10 h-7 flex items-center justify-center">
                  <Car className={`w-6 h-6 ${isSelected ? 'text-[#00A651]' : 'text-slate-700'}`} />
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1">{cat.name}</span>
                <span className="text-[10px] text-slate-500">{cat.etaMinutes} min</span>
              </button>
            );
          })}
        </div>

        {/* Choose Ride Action Button */}
        <button
          onClick={() => setPassengerScreen('choose_ride')}
          className="w-full py-3.5 rounded-2xl bg-[#101418] text-white font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          Choose a ride • From JMD ${(selectedFareInfo.finalFare).toLocaleString()}
          <ArrowRight className="w-4 h-4 text-[#FFD600]" />
        </button>
      </div>

      {/* Bottom Global Passenger Navigation Bar */}
      {renderPassengerBottomNav('home')}
    </div>
  );

  // 4. Choose a Ride Screen (Matches Collage Phone 3)
  const renderPassengerChooseRide = () => (
    <div className="w-full h-full bg-white flex flex-col justify-between overflow-hidden">
      <div>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setPassengerScreen('home')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-extrabold text-slate-900">Choose a ride</h2>
          <button
            onClick={() => setPassengerScreen('explore')}
            className="text-xs font-bold text-[#00A651] hover:underline"
          >
            Explore
          </button>
        </div>
      </div>

      {/* Ride Categories Scrollable List (Matches Phone 3 in Collage) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {categories.map(cat => {
          const fare = calculateFare(cat.id, pickupLoc, dropoffLoc, promoDiscountJMD);
          const isSelected = selectedCategoryKey === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategoryKey(cat.id)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                isSelected
                  ? 'border-[#00A651] bg-[#F7FDF9] shadow-md ring-2 ring-[#00A651]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Vehicle Photo/Thumbnail */}
              <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>

              {/* Ride Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">{cat.name}</h3>
                  <div className="flex items-center text-[11px] text-slate-500 font-medium">
                    <User className="w-3 h-3 ml-0.5" />
                    <span>{cat.capacity}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate">{cat.tagline}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-600 font-medium">
                  <span>{cat.etaMinutes} min away</span>
                  <span>•</span>
                  <span>{fare.distanceKm} km</span>
                </div>
              </div>

              {/* Price in JMD */}
              <div className="text-right">
                <p className="font-extrabold text-slate-900 text-base">
                  JMD ${fare.finalFare.toLocaleString()}
                </p>
                {promoDiscountJMD > 0 && (
                  <p className="text-[10px] text-[#00A651] font-semibold">Promo Applied</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Route Summary Pill */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Est. travel time: {selectedFareInfo.durationMins} mins</span>
          </div>
          <span className="font-bold text-slate-800">{selectedFareInfo.distanceKm} km total</span>
        </div>
      </div>

      {/* Bottom Payment, Promo & Request Button Block */}
      <div className="p-4 border-t border-slate-100 bg-white space-y-3 pb-6">
        {/* Payment Method Selector */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <button
            onClick={() => setPassengerScreen('wallet')}
            className="flex items-center gap-2 text-xs font-bold text-slate-800"
          >
            {paymentMethod === 'cash' ? (
              <Banknote className="w-4 h-4 text-[#00A651]" />
            ) : (
              <CreditCard className="w-4 h-4 text-blue-600" />
            )}
            <span>
              {paymentMethod === 'cash'
                ? 'Cash on arrival'
                : paymentMethod === 'visa'
                ? 'Visa •••• 4242'
                : 'Mastercard •••• 0897'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Promo Code Trigger */}
          <button
            onClick={() => {
              const code = prompt('Enter promo code (e.g. WELCOMEJA):', promoCode);
              if (code !== null) {
                setPromoCode(code);
                if (code.trim().toUpperCase() === 'WELCOMEJA') {
                  setPromoDiscountJMD(500);
                  showToast('JMD 500 discount applied!');
                }
              }
            }}
            className="text-xs font-bold text-[#00A651] hover:underline"
          >
            {promoDiscountJMD > 0 ? 'Promo Applied (-$500)' : 'Apply promo code >'}
          </button>
        </div>

        {/* Authoritative Request Ride Action */}
        <button
          onClick={handleRequestRide}
          className="w-full py-4 rounded-2xl bg-[#101418] text-white font-extrabold text-base hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl"
        >
          Request {selectedFareInfo.cat.name}
        </button>
        <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );

  // 5. Finding a Driver Screen (Radar Pulse & Dispatch Timer)
  const renderPassengerFindingDriver = () => (
    <div className="w-full h-full bg-white flex flex-col justify-between p-6">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00A651] flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-900">RideJa Dispatch</span>
          </div>
          <button
            onClick={() => handleCancelRide()}
            className="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Animated Radar Pulse Searching Graphic */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#00A651]/20 animate-ping" />
          <div className="absolute inset-4 rounded-full border-2 border-[#FFD600]/30 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-slate-200" />
          <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex flex-col items-center justify-center shadow-2xl border-4 border-white">
            <Car className="w-8 h-8 text-[#FFD600] animate-bounce" />
          </div>
        </div>

        <h2 className="mt-6 text-xl font-extrabold text-slate-900 text-center">
          Searching for nearby drivers...
        </h2>
        <p className="mt-1 text-sm text-slate-500 text-center max-w-xs">
          Connecting with verified Jamaican drivers in {pickupLoc.area}.
        </p>

        {/* Live Countdown & Simulation Switch */}
        <div className="mt-6 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00A651]" />
          <span>Dispatch Offer Active: {driverOfferTimer}s</span>
        </div>

        <button
          onClick={handleDriverAcceptTrip}
          className="mt-4 text-xs font-bold text-[#00A651] bg-green-50 px-3.5 py-1.5 rounded-full hover:bg-green-100 transition-colors border border-green-200"
        >
          Simulate Instant Driver Acceptance ⚡
        </button>
      </div>

      {/* Ride Details Summary Card */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 pb-6">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">Pickup</span>
          <span className="font-bold text-slate-900">{pickupLoc.name}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">Destination</span>
          <span className="font-bold text-slate-900">{dropoffLoc.name}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
          <span className="font-bold text-slate-700">Estimated Fare</span>
          <span className="font-extrabold text-slate-900">JMD ${currentRide?.fareEstimateJMD.toLocaleString()}</span>
        </div>
        <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );

  // 6. Driver Assigned & Approaching Screen (Matches Collage Phone 4)
  const renderPassengerDriverApproaching = () => (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Real Leaflet Map showing approaching driver */}
      <div className="flex-1 relative">
        <JamaicaLeafletMap
          pickup={pickupLoc}
          destination={dropoffLoc}
          showRoute={true}
          driverPosition={currentRide?.driverPosition}
          activeStatus={currentRide?.status || 'DRIVER_ARRIVING'}
        />

        {/* Top Floating ETA Card (Matches Phone 4 in Collage) */}
        <div className="absolute top-0 left-0 right-0 z-[400]">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="px-4 py-2.5 rounded-2xl bg-white shadow-xl border border-slate-200">
              <p className="text-xs font-extrabold text-slate-900">
                {currentRide?.status === 'DRIVER_ARRIVED' ? 'Driver has arrived!' : 'Driver is on the way'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentRide?.status === 'DRIVER_ARRIVED' ? 'Meet at pickup location' : `Arriving in ${currentRide?.pickupEtaMins ?? 3} min`}
              </p>
            </div>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'My RideJa Trip', text: `Tracking my ride with ${driver.fullName}` });
                } else {
                  showToast(`Trip share link copied! Driver: ${driver.fullName} (${driver.currentVehicle.plate})`);
                }
              }}
              className="w-10 h-10 rounded-2xl bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* 4-Digit Pickup PIN Banner & Live Movement Status */}
          <div className="flex flex-col items-center gap-1.5 mt-1 px-4">
            <div className="px-4 py-1 rounded-full bg-[#101418] text-white text-xs font-bold shadow-lg flex items-center gap-2 border border-slate-700">
              <span className="text-[#FFD600]">Pickup PIN:</span>
              <span className="tracking-widest text-sm font-extrabold">{currentRide?.pickupPin}</span>
            </div>

            {currentRide?.status === 'DRIVER_ARRIVING' && (
              <div className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold shadow-lg flex items-center gap-2 border border-[#FFD600]/40">
                <span className="w-2 h-2 rounded-full bg-[#00A651] animate-ping" />
                <span className="text-[#FFD600]">Car En Route:</span>
                <span>{Math.round(simProgress)}%</span>
                <span className="text-slate-400">•</span>
                <button
                  onClick={handleFastForwardArrival}
                  className="text-xs text-[#00A651] hover:text-green-300 underline font-extrabold"
                >
                  Skip to Arrived ⚡
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Driver Card Sheet (Matches Phone 4 in Collage) */}
      <div className="p-4 bg-white border-t border-slate-100 rounded-t-3xl shadow-2xl space-y-4 z-10 pb-6">
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto" />

        {/* Driver Profile & Vehicle Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={driver.photo}
              alt={driver.fullName}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#00A651]"
            />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
              <CheckCircle2 className="w-4 h-4 text-[#00A651]" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-900 text-base truncate">{driver.fullName}</h3>
              <span className="flex items-center text-xs font-bold text-slate-800">
                <Star className="w-3.5 h-3.5 fill-[#FFD600] text-[#FFD600] mr-0.5" />
                {driver.rating}
              </span>
            </div>
            <p className="text-xs text-slate-600 truncate">
              {driver.currentVehicle.color} {driver.currentVehicle.make} {driver.currentVehicle.model}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold text-slate-800 border border-slate-300">
                {driver.currentVehicle.plate}
              </span>
              <span className="text-xs font-extrabold text-[#00A651]">
                JMD ${currentRide?.fareEstimateJMD.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Call, Message, Share, Cancel (Matches Collage) */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => showToast(`Calling driver Dwayne Williams at ${driver.phone}...`)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Call</span>
          </button>

          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 relative">
              <MessageSquare className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-[#00A651] absolute top-1 right-1" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Message</span>
          </button>

          <button
            onClick={() => setSosModalOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#D92D20]">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#D92D20]">Safety</span>
          </button>

          <button
            onClick={() => handleCancelRide()}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
              <X className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Cancel</span>
          </button>
        </div>

        {/* Quick Driver Action Switch for Testing */}
        <div className="pt-2 flex gap-2">
          {currentRide?.status === 'DRIVER_ARRIVING' ? (
            <button
              onClick={handleDriverArrived}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
            >
              Simulate: Driver Has Arrived 📍
            </button>
          ) : (
            <button
              onClick={() => {
                setCurrentRide(r => (r ? { ...r, status: 'IN_PROGRESS' } : null));
                setPassengerScreen('in_trip');
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#00A651] text-white text-xs font-bold hover:bg-green-600 transition-colors shadow-md"
            >
              Simulate: Start Trip Now (PIN Verified) 🚀
            </button>
          )}
        </div>
        <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );

  // 7. In-Trip Experience Screen (Matches Collage Phone 5 - Dark Mode Navigation)
  const renderPassengerInTrip = () => (
    <div className="relative w-full h-full flex flex-col bg-[#0f172a] text-white overflow-hidden">
      {/* Dark Theme Real Leaflet Map Viewport */}
      <div className="flex-1 relative">
        <JamaicaLeafletMap
          pickup={pickupLoc}
          destination={dropoffLoc}
          isDark={true}
          showRoute={true}
          driverPosition={currentRide?.driverPosition}
          activeStatus="IN_PROGRESS"
        />

        {/* Top Dark Badge: "On trip • Enjoy your ride" (Matches Phone 5 in Collage) */}
        <div className="absolute top-0 left-0 right-0 z-[400]">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-slate-700 shadow-xl">
              <div className="w-3 h-3 rounded-full bg-[#00A651] animate-ping" />
              <div>
                <p className="text-xs font-extrabold text-white">On trip</p>
                <p className="text-[10px] text-slate-400">Enjoy your ride with RideJa</p>
              </div>
            </div>

            <button
              onClick={() => setSosModalOpen(true)}
              className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Dark Sheet: Arriving in dynamic min */}
      <div className="p-4 bg-[#101418] border-t border-slate-800 rounded-t-3xl shadow-2xl space-y-4 z-10 pb-6">
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

        {/* Trip ETA & Destination */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400">Arriving in</p>
            <h2 className="text-2xl font-extrabold text-white">
              {currentRide?.tripEtaMins ?? Math.max(1, Math.ceil((1 - simProgress / 100) * (currentRide?.durationMins || 6)))} min
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Destination</p>
            <p className="text-sm font-extrabold text-slate-200 truncate max-w-[160px]">
              {dropoffLoc.name}
            </p>
          </div>
        </div>

        {/* Live Trip Waypoint Progress Bar & Fast Forward Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#00A651] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00A651] animate-ping" />
              Car Moving on Route ({Math.round(simProgress)}%)
            </span>
            <button
              onClick={handleFastForwardTrip}
              className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] text-yellow-400 font-extrabold border border-yellow-500/40"
            >
              Skip to Destination 🏁
            </button>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#00A651] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(6, simProgress))}%` }}
            />
          </div>
        </div>

        {/* Driver Snapshot */}
        <div className="flex items-center gap-3 pt-1">
          <img
            src={driver.photo}
            alt={driver.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#00A651]"
          />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-sm text-white truncate">{driver.fullName}</p>
            <p className="text-xs text-slate-400">
              {driver.currentVehicle.make} {driver.currentVehicle.model} • JMD ${currentRide?.finalFareJMD.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => showToast(`Calling driver Dwayne at ${driver.phone}...`)}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>

          <button
            onClick={() => setIsChatOpen(true)}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>

          <button
            onClick={handleCompleteTrip}
            className="py-2.5 rounded-xl bg-[#00A651] hover:bg-green-600 text-xs font-extrabold text-white flex items-center justify-center gap-1 shadow-md"
          >
            <span>Arrive 🏁</span>
          </button>
        </div>
        <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );

  // 8. You've Arrived! (Trip Completion & Rating Screen - Matches Collage Phone 6)
  const renderPassengerTripCompleted = () => (
    <div className="w-full h-full bg-white flex flex-col justify-between p-6 overflow-y-auto">
      <div className="space-y-6 pt-2 text-center">
        {/* Green Checkmark Circle */}
        <div className="w-16 h-16 rounded-full bg-[#00A651] text-white flex items-center justify-center mx-auto shadow-xl">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">You've arrived!</h1>
          <p className="text-sm text-slate-500 mt-1">Thanks for riding with RideJa</p>
        </div>

        {/* Trip Route Details Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00A651]" />
            <span className="text-sm font-semibold text-slate-800 truncate">{pickupLoc.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D92D20]" />
            <span className="text-sm font-semibold text-slate-800 truncate">{dropoffLoc.name}</span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="text-xl font-extrabold text-slate-900">
                JMD ${currentRide?.finalFareJMD.toLocaleString()}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              Paid • {currentRide?.paymentMethod === 'cash' ? 'Cash' : 'Card'}
            </span>
          </div>
        </div>

        {/* Star Rating System */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-400">Rate Dwayne Williams</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => {
                  showToast(`Thank you for rating ${star} stars!`);
                }}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star className="w-8 h-8 fill-[#FFD600] text-[#FFD600]" />
              </button>
            ))}
          </div>
        </div>

        {/* Tip Selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Add a tip for great service</p>
          <div className="flex items-center justify-center gap-2">
            {[100, 200, 500].map(amt => (
              <button
                key={amt}
                onClick={() => showToast(`JMD $${amt} tip added to Dwayne!`)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                +JMD ${amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-3 pt-6 pb-4">
        <button
          onClick={() => {
            setCurrentRide(null);
            setPassengerScreen('home');
          }}
          className="w-full py-4 rounded-2xl bg-[#101418] text-white font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg"
        >
          Book Another Ride
        </button>

        <button
          onClick={() => {
            showToast(`Receipt for ${currentRide?.id} sent to akeimsuth@gmail.com (JMD $${currentRide?.finalFareJMD})`);
          }}
          className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
        >
          View Itemized Receipt
        </button>
        <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );

  // 9. Account & Settings Screen (Matches Collage Phone 7)
  const renderPassengerAccount = () => (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="p-4 space-y-4">
          {/* User Profile Card Header */}
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-xl">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-extrabold text-slate-900">Akeim Sutherland</h2>
              <p className="text-xs text-slate-500 font-medium">+1 (876) 555-0123</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-bold text-[#00A651] border border-green-200">
                Verified Passenger
              </span>
            </div>
          </div>

          {/* Switch to Driver Mode Banner */}
          <div
            onClick={() => {
              setCurrentRole('driver');
              setDriverScreen('dashboard');
            }}
            className="p-3.5 rounded-2xl bg-[#00A651] text-white flex items-center justify-between shadow-md cursor-pointer hover:bg-green-600 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#00A651]">
                <Car className="w-4 h-4 text-[#00A651]" />
              </div>
              <div>
                <p className="text-xs font-extrabold">Switch to Driver Mode</p>
                <p className="text-[10px] text-green-100">Dwayne Williams • Toyota Corolla</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white" />
          </div>

          {/* RideJa Pro Banner */}
          <div className="p-3.5 rounded-2xl bg-[#101418] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFD600] flex items-center justify-center text-slate-900">
                <Sparkles className="w-4 h-4 fill-slate-900" />
              </div>
              <div>
                <p className="text-xs font-bold">RideJa Pro</p>
                <p className="text-[10px] text-slate-400">Unlock priority pickup & 5% back</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Settings Navigation Menu List */}
          <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {[
              { icon: Clock, label: 'Your trips', action: () => setPassengerScreen('activity') },
              { icon: CreditCard, label: 'Payment methods', action: () => setPassengerScreen('wallet') },
              { icon: Sparkles, label: 'Promotions', badge: 'New', action: () => setPassengerScreen('wallet') },
              { icon: Shield, label: 'Safety & Emergency', action: () => setPassengerScreen('safety') },
              { icon: Compass, label: 'Explore Jamaica', action: () => setPassengerScreen('explore') },
              {
                icon: Building,
                label: 'Operations Admin Portal',
                action: () => {
                  setCurrentRole('admin');
                  setAdminScreen('overview');
                },
              },
              { icon: HelpCircle, label: 'Help Centre & 24/7 Support', action: () => showToast('Contact RideJa 24/7 Support: support@rideja.jm / +1 (876) 900-RIDE') },
              { icon: Settings, label: 'Settings & Privacy (Jamaica DPA)', action: () => showToast('Jamaican Data Protection Act 2020 Compliance enabled.') },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 text-slate-800">
                  <item.icon className="w-5 h-5 text-slate-600" />
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#00A651] text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>

          {/* Invite Friends Referral Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-900">Invite friends</p>
              <p className="text-[11px] text-slate-600">Get JMD $500 off your next trip</p>
            </div>
            <button
              onClick={() => showToast('Referral link: https://rideja.jm/invite/AKEIM500')}
              className="px-3 py-1.5 rounded-xl bg-[#00A651] text-white text-xs font-bold hover:bg-green-600 shadow-sm"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {renderPassengerBottomNav('account')}
    </div>
  );

  // 10. Payment Methods Screen (Matches Collage Phone 8)
  const renderPassengerWallet = () => (
    <div className="w-full h-full bg-white flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={() => setPassengerScreen('home')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-extrabold text-slate-900">Payment methods</h2>
        </div>

        <div className="p-4 space-y-3">
          {/* Cash Option */}
          <div
            onClick={() => setPaymentMethod('cash')}
            className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
              paymentMethod === 'cash'
                ? 'border-[#00A651] bg-green-50/40 ring-2 ring-[#00A651]/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-[#00A651]">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">Cash</p>
                <p className="text-xs text-slate-500">Pay directly with Jamaican Dollars (JMD)</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'cash' ? 'border-[#00A651] bg-[#00A651]' : 'border-slate-300'
              }`}
            >
              {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          {/* Visa Card */}
          <div
            onClick={() => setPaymentMethod('visa')}
            className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
              paymentMethod === 'visa'
                ? 'border-[#00A651] bg-green-50/40 ring-2 ring-[#00A651]/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-extrabold text-xs">
                VISA
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">Visa Debit/Credit</p>
                <p className="text-xs text-slate-500">•••• 4242 (NCB / Scotiabank)</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'visa' ? 'border-[#00A651] bg-[#00A651]' : 'border-slate-300'
              }`}
            >
              {paymentMethod === 'visa' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          {/* Mastercard Card */}
          <div
            onClick={() => setPaymentMethod('mastercard')}
            className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
              paymentMethod === 'mastercard'
                ? 'border-[#00A651] bg-green-50/40 ring-2 ring-[#00A651]/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-extrabold text-xs">
                MC
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">Mastercard</p>
                <p className="text-xs text-slate-500">•••• 0897</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'mastercard' ? 'border-[#00A651] bg-[#00A651]' : 'border-slate-300'
              }`}
            >
              {paymentMethod === 'mastercard' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>

          {/* Add Payment Method Button */}
          <button
            onClick={() => showToast('Powertranz Payment Gateway opened for card tokenization')}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-300 text-slate-700 font-bold text-xs hover:border-[#00A651] hover:text-[#00A651] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add payment method
          </button>
        </div>
      </div>

      {renderPassengerBottomNav('wallet')}
    </div>
  );

  // 11. Safety Center Screen (Matches Collage Phone 9)
  const renderPassengerSafety = () => (
    <div className="w-full h-full bg-[#101418] text-white flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPassengerScreen('home')}
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-400">RIDEJA SAFETY</span>
            <div className="w-9" />
          </div>

          {/* Shield Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#00A651] flex items-center justify-center mx-auto shadow-xl">
              <Shield className="w-8 h-8 text-white fill-white/20" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Safety is our priority</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              We are committed to keeping you safe across every parish in Jamaica.
            </p>
          </div>

          {/* Feature Cards (Matches Phone 9 in Collage) */}
          <div className="rounded-2xl bg-white text-slate-900 p-4 space-y-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-[#00A651] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Verified drivers</h3>
                <p className="text-xs text-slate-500">
                  100% police record checks, Transport Authority badges & background verification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Real-time GPS tracking</h3>
                <p className="text-xs text-slate-500">
                  Share your live route and trip ETA with family and trusted contacts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-[#D92D20] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Emergency SOS button</h3>
                <p className="text-xs text-slate-500">
                  Direct one-touch connection to Jamaican Police (119) and emergency dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">24/7 dedicated support</h3>
                <p className="text-xs text-slate-500">
                  Local Jamaican incident response team active 24 hours a day, 7 days a week.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Trigger Button */}
          <button
            onClick={() => setSosModalOpen(true)}
            className="w-full py-4 rounded-2xl bg-red-600 text-white font-extrabold text-sm hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl"
          >
            <AlertOctagon className="w-5 h-5" />
            Activate Emergency Assistance (119)
          </button>
        </div>
      </div>

      <div className="w-full h-3 bg-gradient-to-r from-[#00A651] via-[#FFD600] to-[#00A651]" />
    </div>
  );

  // 12. Explore Jamaica Screen (Matches Collage Phone 10)
  const renderPassengerExplore = () => (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00A651] flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900">Explore Jamaica</h1>
          </div>
          <span className="text-xs font-semibold text-slate-500">Rides for every occasion</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Airport Transfers */}
          <div
            onClick={() => {
              setDropoffLoc(JAMAICA_PRESETS[2]); // Norman Manley
              setSelectedCategoryKey('airport');
              setPassengerScreen('choose_ride');
            }}
            className="group relative rounded-3xl overflow-hidden h-36 cursor-pointer shadow-md"
          >
            <img
              src="https://images.unsplash.com/photo-1542296332-2e4473faf563?w=800&auto=format&fit=crop&q=80"
              alt="Airport"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-5 flex flex-col justify-end text-white">
              <span className="px-2.5 py-1 rounded-full bg-[#00A651] text-[10px] font-extrabold w-max mb-1">
                AIRPORT TRANSFERS
              </span>
              <h3 className="font-extrabold text-base">Start your trip stress-free</h3>
              <p className="text-xs text-slate-300">Norman Manley (KIN) & Sangster (MBJ)</p>
            </div>
          </div>

          {/* City Rides */}
          <div
            onClick={() => {
              setDropoffLoc(JAMAICA_PRESETS[1]); // New Kingston
              setSelectedCategoryKey('economy');
              setPassengerScreen('choose_ride');
            }}
            className="group relative rounded-3xl overflow-hidden h-36 cursor-pointer shadow-md"
          >
            <img
              src="https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80"
              alt="Kingston City"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-5 flex flex-col justify-end text-white">
              <span className="px-2.5 py-1 rounded-full bg-[#FFD600] text-slate-950 text-[10px] font-extrabold w-max mb-1">
                CITY RIDES
              </span>
              <h3 className="font-extrabold text-base">Get around town quickly</h3>
              <p className="text-xs text-slate-300">Kingston, Half Way Tree, Portmore</p>
            </div>
          </div>

          {/* Tourist Destinations */}
          <div
            onClick={() => {
              setDropoffLoc(JAMAICA_PRESETS[9]); // Dunn's River Falls
              setSelectedCategoryKey('comfort');
              setPassengerScreen('choose_ride');
            }}
            className="group relative rounded-3xl overflow-hidden h-36 cursor-pointer shadow-md"
          >
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80"
              alt="Dunn's River Falls"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-5 flex flex-col justify-end text-white">
              <span className="px-2.5 py-1 rounded-full bg-blue-600 text-[10px] font-extrabold w-max mb-1">
                ISLAND EXCURSIONS
              </span>
              <h3 className="font-extrabold text-base">Explore Jamaica's wonders</h3>
              <p className="text-xs text-slate-300">Ocho Rios, Dunn's River, Negril Cliffs</p>
            </div>
          </div>
        </div>
      </div>

      {renderPassengerBottomNav('home')}
    </div>
  );

  // 13. Activity & Trip History Screen
  const renderPassengerActivity = () => (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <button
            onClick={() => setPassengerScreen('home')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-extrabold text-slate-900">Your Activity</h2>
          <div className="w-9" />
        </div>

        <div className="p-4 space-y-3">
          {ledger.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{item.tripId}</span>
                <span className="text-xs text-slate-500">{item.timestamp}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">{item.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-500">Method: {item.paymentType.toUpperCase()}</span>
                <span className="font-extrabold text-slate-900">JMD ${item.grossAmountJMD.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderPassengerBottomNav('activity')}
    </div>
  );

  // Shared Bottom Navigation Bar for Passenger Screens
  function renderPassengerBottomNav(activeTab: 'home' | 'activity' | 'wallet' | 'account') {
    return (
      <div className="bg-white border-t border-slate-200 px-6 pt-2 pb-5 flex flex-col shadow-lg z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPassengerScreen('home')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#00A651]' : 'text-slate-400'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          <button
            onClick={() => setPassengerScreen('activity')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'activity' ? 'text-[#00A651]' : 'text-slate-400'}`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold">Activity</span>
          </button>

          <button
            onClick={() => setPassengerScreen('wallet')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-[#00A651]' : 'text-slate-400'}`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Wallet</span>
          </button>

          <button
            onClick={() => setPassengerScreen('account')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'account' ? 'text-[#00A651]' : 'text-slate-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Account</span>
          </button>
        </div>
        {/* Bottom Native Home Indicator Bar */}
        <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-3" />
      </div>
    );
  }

  /* ==========================================================================
     DRIVER APPLICATION EXPERIENCE (NATIVE MOBILE FEEL)
     ========================================================================== */

  const renderDriverApp = () => {
    return (
      <div className="w-full h-full bg-[#0f172a] text-white flex flex-col justify-between overflow-hidden">

        {/* Top Driver Header & Online Toggle */}
        <div className="px-4 py-2 bg-[#101418] border-b border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigateTo('passenger', 'home')}
              className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1"
              title="Return to Passenger App (/passenger)"
            >
              <User className="w-3.5 h-3.5 text-[#00A651]" />
              <span>Rider</span>
            </button>
            <img
              src={driver.photo}
              alt={driver.fullName}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#00A651]"
            />
            <div>
              <p className="font-extrabold text-xs text-white">{driver.fullName}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Star className="w-3 h-3 fill-[#FFD600] text-[#FFD600]" />
                <span>{driver.rating} ({driver.totalTrips} trips)</span>
              </div>
            </div>
          </div>

          {/* Online/Offline Availability Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${driver.isOnline ? 'text-[#00A651]' : 'text-slate-400'}`}>
              {driver.isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <button
              onClick={() => {
                if (!driver.isOnline && !driverEligibility.isEligible) {
                  showToast(`Cannot go online: ${driverEligibility.reasons[0] || "Compliance check failed"}`);
                  return;
                }
                setDriver(prev => ({ ...prev, isOnline: !prev.isOnline }));
              }}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                driver.isOnline ? 'bg-[#00A651]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  driver.isOnline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Driver Main Content View */}
        <div className="flex-1 relative overflow-y-auto">
          {driverScreen === 'dashboard' && (
            <div className="w-full h-full flex flex-col justify-between">
              {/* Real Leaflet Dark Map */}
              <div className="flex-1 relative min-h-[220px]">
                <JamaicaLeafletMap
                  pickup={pickupLoc}
                  destination={dropoffLoc}
                  isDark={true}
                  showRoute={currentRide?.status === 'DRIVER_ARRIVING' || currentRide?.status === 'IN_PROGRESS'}
                  driverPosition={currentRide?.driverPosition}
                  activeStatus={currentRide?.status}
                />

                {/* Status Indicator Banner */}
                <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between">
                  <div className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-slate-700 text-xs font-semibold flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${driver.isOnline ? 'bg-[#00A651] animate-ping' : 'bg-slate-500'}`} />
                    <span>Zone: Kingston & Corporate Area</span>
                  </div>

                  {!driverEligibility.isEligible && (
                    <button
                      onClick={() => setDriverScreen('compliance')}
                      className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Verification
                    </button>
                  )}
                </div>

                {/* Incoming Trip Request Modal (Active Dispatch) */}
                {currentRide && currentRide.status === 'SEARCHING' && (
                  <div className="absolute inset-4 z-[500] bg-slate-900/95 backdrop-blur-lg border-2 border-[#00A651] rounded-3xl p-5 shadow-2xl flex flex-col justify-between animate-in zoom-in-95">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-[#00A651] text-white text-xs font-extrabold animate-pulse">
                          NEW RIDE REQUEST • {driverOfferTimer}s
                        </span>
                        <span className="text-xl font-extrabold text-[#FFD600]">
                          JMD ${(currentRide.fareEstimateJMD * 0.85).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-lg font-extrabold text-white">{currentRide.categoryName} Ride</h2>
                        <p className="text-xs text-slate-400">Passenger: {currentRide.passengerName} (4.9★)</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#00A651]" />
                          <span className="font-semibold text-slate-300 truncate">Pickup: {currentRide.pickup.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D92D20]" />
                          <span className="font-semibold text-slate-300 truncate">Dest: {currentRide.destination.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button
                        onClick={() => handleCancelRide('Driver declined request')}
                        className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
                      >
                        Decline
                      </button>
                      <button
                        onClick={handleDriverAcceptTrip}
                        className="py-3 rounded-2xl bg-[#00A651] hover:bg-green-600 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-1"
                      >
                        Accept Trip ({driverOfferTimer}s)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Trip Workflow Panel for Driver */}
              {currentRide && (currentRide.status === 'DRIVER_ARRIVING' || currentRide.status === 'DRIVER_ARRIVED' || currentRide.status === 'IN_PROGRESS') && (
                <div className="p-4 bg-[#101418] border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#FFD600]">
                        {currentRide.status === 'DRIVER_ARRIVING'
                          ? 'En route to pickup'
                          : currentRide.status === 'DRIVER_ARRIVED'
                          ? 'At pickup location'
                          : 'Trip in progress'}
                      </span>
                      <h3 className="text-sm font-extrabold text-white">{currentRide.passengerName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Trip Earnings</span>
                      <p className="text-sm font-extrabold text-[#00A651]">
                        JMD ${(currentRide.fareEstimateJMD * 0.85).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Driver En Route: Tap to Confirm Arrival at Pickup */}
                  {currentRide.status === 'DRIVER_ARRIVING' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Pickup: <strong className="text-white">{currentRide.pickup.name}</strong></span>
                        <span className="font-bold text-[#FFD600]">ETA {currentRide.pickupEtaMins ?? 3} min</span>
                      </div>
                      <button
                        onClick={handleDriverArrived}
                        className="w-full py-3.5 rounded-2xl bg-[#00A651] hover:bg-green-600 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <MapPin className="w-4 h-4" />
                        Tap to Confirm Arrival at Pickup 📍
                      </button>
                    </div>
                  )}

                  {/* 4-Digit PIN Entry Box when Driver Arrives */}
                  {currentRide.status === 'DRIVER_ARRIVED' && (
                    <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-300">
                          Ask passenger for 4-digit PIN:
                        </p>
                        <button
                          onClick={() => {
                            setEnteredPin(currentRide.pickupPin);
                            showToast(`PIN ${currentRide.pickupPin} filled`);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-[#FFD600] text-[11px] font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                        >
                          Auto-Fill PIN ({currentRide.pickupPin})
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={enteredPin}
                          onChange={e => setEnteredPin(e.target.value)}
                          placeholder="Enter PIN"
                          className="flex-1 px-3 py-2 bg-black border border-slate-700 rounded-xl text-center font-mono font-bold tracking-widest text-white outline-none focus:border-[#00A651]"
                        />
                        <button
                          onClick={handleVerifyPinAndStartTrip}
                          className="px-4 py-2 rounded-xl bg-[#00A651] text-white font-bold text-xs hover:bg-green-600 active:scale-[0.98] transition-all"
                        >
                          Verify & Start Trip
                        </button>
                      </div>
                      {pinError && <p className="text-xs text-red-400 font-semibold">{pinError}</p>}
                    </div>
                  )}

                  {/* Complete Trip Action Button */}
                  {currentRide.status === 'IN_PROGRESS' && (
                    <button
                      onClick={handleCompleteTrip}
                      className="w-full py-3.5 rounded-2xl bg-[#00A651] hover:bg-green-600 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Complete Trip & Collect JMD ${(currentRide.fareEstimateJMD).toLocaleString()}
                    </button>
                  )}
                </div>
              )}

              {/* Earnings & Activity Quick Bar */}
              <div className="p-3 bg-[#101418] border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">Today's Net</p>
                  <p className="text-sm font-extrabold text-[#00A651]">JMD ${driver.earnings.todayJMD.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">Trips Done</p>
                  <p className="text-sm font-extrabold text-white">{driver.totalTrips}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold">Pending Payout</p>
                  <p className="text-sm font-extrabold text-[#FFD600]">JMD ${driver.earnings.pendingPayoutJMD.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Compliance & Verification Checklist Screen */}
          {driverScreen === 'compliance' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Compliance & Documents</h2>
                  <p className="text-xs text-slate-400">Mandatory Jamaican regulatory authorisations</p>
                </div>
                <button
                  onClick={() => setDriverScreen('dashboard')}
                  className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Done
                </button>
              </div>

              {/* Overall Eligibility Status Banner */}
              <div className={`p-4 rounded-2xl border ${
                driverEligibility.isEligible
                  ? 'bg-green-950/40 border-green-800 text-green-300'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {driverEligibility.isEligible ? (
                    <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <span>{driverEligibility.isEligible ? 'Driver Fully Eligible For Dispatch' : 'Eligibility Incomplete'}</span>
                </div>
                <ul className="mt-2 text-xs space-y-1 text-slate-300 list-disc list-inside">
                  {driverEligibility.isEligible ? (
                    <li>All 7 statutory credentials approved and within legal validity period.</li>
                  ) : (
                    driverEligibility.reasons.map((r, i) => <li key={i}>{r}</li>)
                  )}
                </ul>
              </div>

              {/* One-Tap Demo Document Refresh & Validation */}
              <button
                onClick={() => {
                  setDriver(prev => ({
                    ...prev,
                    status: 'active',
                    isOnline: true,
                    documents: INITIAL_DRIVER_DOCUMENTS.map(d => ({
                      ...d,
                      status: 'approved',
                      reviewedBy: 'Compliance Admin (Sarah)',
                      reviewedAt: '2026-10-15',
                    })),
                  }));
                  showToast('All 7 statutory documents verified & up to date with Transport Authority standards!');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <CheckCheck className="w-4 h-4 text-[#00A651]" />
                Update & Re-verify All Documents (Demo Ready)
              </button>

              {/* 7 Required Statutory Documents List */}
              <div className="space-y-2.5">
                {driver.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <h4 className="font-bold text-xs text-white truncate">{doc.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ref: {doc.documentNumber} • Exp: {doc.expiryDate}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        doc.status === 'approved'
                          ? 'bg-green-900/60 text-green-300 border border-green-700'
                          : doc.status === 'under_review'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                          : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earnings & Payouts Screen */}
          {driverScreen === 'earnings' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white">Earnings & Bank Payouts</h2>
                <button
                  onClick={() => setDriverScreen('dashboard')}
                  className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300"
                >
                  Close
                </button>
              </div>

              {/* Balance Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-black border border-slate-800 space-y-3">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Available for Payout</p>
                <h1 className="text-3xl font-extrabold text-[#00A651]">
                  JMD ${driver.earnings.pendingPayoutJMD.toLocaleString()}
                </h1>
                <p className="text-xs text-slate-400">
                  Bank Account: {driver.payoutAccount.bank} ({driver.payoutAccount.accountNumber})
                </p>
                <button
                  onClick={() => showToast(`ACH Payout of JMD $${driver.earnings.pendingPayoutJMD} dispatched to ${driver.payoutAccount.bank}`)}
                  className="w-full py-3 rounded-2xl bg-[#FFD600] text-slate-950 font-extrabold text-xs hover:bg-yellow-400 transition-colors shadow-lg"
                >
                  Request Direct Bank Transfer (NCB)
                </button>
              </div>

              {/* Commission & Ledger Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Weekly Gross Ride Volume</span>
                  <span className="font-bold text-white">JMD ${driver.earnings.weekJMD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>RideJa Platform Commission (15%)</span>
                  <span className="font-bold text-slate-300">
                    -JMD ${Math.round(driver.earnings.weekJMD * 0.15).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cash Rides Collected in Hand</span>
                  <span className="font-bold text-[#FFD600]">JMD ${driver.earnings.cashCollectedJMD.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Net Payout Balance</span>
                  <span className="text-[#00A651]">JMD ${driver.earnings.pendingPayoutJMD.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Driver Bottom Nav */}
        <div className="p-3 bg-[#101418] border-t border-slate-800 flex flex-col">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setDriverScreen('dashboard')}
              className={`flex flex-col items-center gap-1 ${driverScreen === 'dashboard' ? 'text-[#00A651]' : 'text-slate-400'}`}
            >
              <Navigation className="w-5 h-5" />
              <span className="text-[10px] font-bold">Drive</span>
            </button>
            <button
              onClick={() => setDriverScreen('compliance')}
              className={`flex flex-col items-center gap-1 ${driverScreen === 'compliance' ? 'text-[#00A651]' : 'text-slate-400'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-bold">Verification</span>
            </button>
            <button
              onClick={() => setDriverScreen('earnings')}
              className={`flex flex-col items-center gap-1 ${driverScreen === 'earnings' ? 'text-[#00A651]' : 'text-slate-400'}`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-[10px] font-bold">Earnings</span>
            </button>
          </div>
          <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
        </div>
      </div>
    );
  };

  /* ==========================================================================
     ADMINISTRATION & OPERATIONS PORTAL
     ========================================================================== */

  const renderAdminPortal = () => {
    interface AdminNavItem {
      id: AdminScreen;
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      fullLabel: string;
      badge?: number;
    }

    const adminNavItems: AdminNavItem[] = [
      { id: 'overview', icon: Activity, label: 'Overview', fullLabel: 'Overview Dashboard' },
      { id: 'verification_queue', icon: ShieldCheck, label: 'Verification', fullLabel: 'Driver Verification Queue', badge: driver.documents.filter(d => d.status !== 'approved').length },
      { id: 'drivers', icon: Users, label: 'Drivers', fullLabel: 'Fleet & Driver Records', badge: driversList.length },
      { id: 'live_dispatch', icon: Navigation, label: 'Dispatch', fullLabel: 'Live Dispatch Operations', badge: currentRide ? 1 : 0 },
      { id: 'fares', icon: Sliders, label: 'Fares', fullLabel: 'Fare & Market Engine' },
      { id: 'safety_incidents', icon: AlertOctagon, label: 'Safety', fullLabel: 'Safety & Incident Queue', badge: incidents.filter(i => i.status === 'open').length },
      { id: 'ledger', icon: Receipt, label: 'Ledger', fullLabel: 'Financial Audit Ledger' },
    ];

    return (
      <div className="w-full h-full bg-[#0b0f14] text-slate-100 flex flex-col md:flex-row overflow-hidden relative">
        {/* Mobile Top Navigation App Bar (Visible on mobile screens) */}
        <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-[#10161f] border-b border-slate-800 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileAdminMenuOpen(!mobileAdminMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
              aria-label="Toggle navigation drawer"
            >
              {mobileAdminMenuOpen ? <X className="w-5 h-5 text-[#FFD600]" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#00A651] flex items-center justify-center font-black text-white text-xs shadow-sm">
                RJ
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight block">
                  Ride<span className="text-[#FFD600]">Ja</span> Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-green-950/90 text-green-300 border border-green-800/80 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-ping" />
              Live
            </span>
            <button
              onClick={() => {
                setCurrentRole('passenger');
                setPassengerScreen('home');
              }}
              title="Switch to Passenger App"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <Smartphone className="w-4 h-4 text-[#00A651]" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick-Nav Scroll Bar */}
        <div className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-[#0c1017] border-b border-slate-800/80 overflow-x-auto no-scrollbar shrink-0 z-20">
          {adminNavItems.map(item => {
            const isActive = adminScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setAdminScreen(item.id as AdminScreen);
                  setMobileAdminMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#00A651] text-white shadow-sm'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-yellow-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Slide-In Navigation Drawer Overlay */}
        {mobileAdminMenuOpen && (
          <>
            <div
              onClick={() => setMobileAdminMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40 animate-in fade-in"
            />
            <div className="md:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-[#10161f] border-r border-slate-800 z-50 p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#00A651] flex items-center justify-center font-black text-white text-xs shadow-md">
                      RJ
                    </div>
                    <div>
                      <span className="font-extrabold text-base tracking-tight text-white">
                        Ride<span className="text-[#FFD600]">Ja</span>
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">Command Center</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileAdminMenuOpen(false)}
                    className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {adminNavItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAdminScreen(item.id as AdminScreen);
                        setMobileAdminMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        adminScreen === item.id
                          ? 'bg-[#00A651] text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.fullLabel}</span>
                      </div>
                      {Boolean(item.badge && item.badge > 0) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-yellow-400 border border-slate-700">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Operator Profile */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      HQ
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">Marcus (Super Admin)</p>
                      <p className="text-[10px] text-[#00A651] font-semibold">Kingston Operations</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileAdminMenuOpen(false);
                    setCurrentRole('passenger');
                    setPassengerScreen('home');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#00A651]" />
                  <span>Exit to Passenger App</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Desktop Sidebar (hidden on mobile, visible md+) */}
        <div className="hidden md:flex md:w-64 bg-[#10161f] border-r border-slate-800 flex-col justify-between p-4 shrink-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00A651] flex items-center justify-center font-black text-white shadow-md">
                  RJ
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white">
                    Ride<span className="text-[#FFD600]">Ja</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold">Command Center</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentRole('passenger');
                  setPassengerScreen('home');
                }}
                title="Switch back to Passenger App"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Navigation */}
            <div className="space-y-1">
              {adminNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setAdminScreen(item.id as AdminScreen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    adminScreen === item.id
                      ? 'bg-[#00A651] text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.fullLabel}</span>
                  </div>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-yellow-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RBAC Operator Profile */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                HQ
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">Marcus (Super Admin)</p>
                <p className="text-[10px] text-[#00A651] font-semibold">Kingston Operations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Admin Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white capitalize flex items-center gap-2">
                {adminScreen.replace('_', ' ')}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                Authorized Regulatory & Dispatch Portal for Jamaica Transportation Authority
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => {
                  setCurrentRole('passenger');
                  setPassengerScreen('home');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#00A651]" />
                <span>Passenger App</span>
              </button>
              <span className="hidden sm:flex px-3 py-1 rounded-full bg-green-950 text-green-300 border border-green-800 text-xs font-bold items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00A651] animate-ping" />
                Live Network Active
              </span>
            </div>
          </div>

          {/* 1. Overview Dashboard */}
          {adminScreen === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Top KPI Cards (Responsive 2 cols on mobile, 4 on desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#121924] border border-slate-800 space-y-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 line-clamp-1">Registered Drivers</p>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white">{driversList.length} Drivers</h3>
                  <p className="text-[10px] sm:text-[11px] text-[#00A651] line-clamp-1">2 Active • 1 Pending</p>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#121924] border border-slate-800 space-y-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 line-clamp-1">Active Rides</p>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-[#FFD600]">{currentRide ? 1 : 0} Live</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1">Corporate Area & Hwy 2000</p>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#121924] border border-slate-800 space-y-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 line-clamp-1">Platform Volume</p>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white">
                    JMD ${ledger.reduce((acc, l) => acc + l.grossAmountJMD, 0).toLocaleString()}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#00A651] line-clamp-1">+18.4% this week</p>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#121924] border border-slate-800 space-y-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 line-clamp-1">Safety Reports</p>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-red-400">
                    {incidents.filter(i => i.status === 'open').length} Urgent
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1">SLA &lt; 5 mins</p>
                </div>
              </div>

              {/* Split View: Live Map & Incident Feed (Stacks on mobile, side-by-side on lg) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 rounded-2xl bg-[#121924] border border-slate-800 p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white">Island Operations Map</h3>
                    <span className="text-[10px] sm:text-xs text-slate-400">Kingston, Montego Bay & Ocho Rios</span>
                  </div>
                  <div className="h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden border border-slate-700/80">
                    <JamaicaLeafletMap
                      pickup={pickupLoc}
                      destination={dropoffLoc}
                      isDark={true}
                      showRoute={true}
                      driverPosition={currentRide?.driverPosition}
                      activeStatus={currentRide?.status}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#121924] border border-slate-800 p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white">Recent Security Logs</h3>
                    <span className="text-[10px] text-slate-400">{incidents.length} Logged</span>
                  </div>
                  <div className="space-y-2 sm:space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {incidents.map(inc => (
                      <div key={inc.id} className="p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold text-[10px] uppercase ${inc.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>
                            {inc.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">{inc.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">{inc.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Driver Verification Queue */}
          {adminScreen === 'verification_queue' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <p className="text-xs text-slate-400">
                  Review statutory documentation for Jamaican drivers and commercial passenger vehicles.
                </p>
                <span className="text-xs font-bold text-[#FFD600] shrink-0">
                  {driver.documents.filter(d => d.status === 'under_review' || d.status === 'pending').length} Pending Inspection
                </span>
              </div>

              <div className="rounded-2xl bg-[#121924] border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3 sm:p-3.5">Document Name</th>
                        <th className="p-3 sm:p-3.5">Driver</th>
                        <th className="p-3 sm:p-3.5">Issuing Authority</th>
                        <th className="p-3 sm:p-3.5">Expiry Date</th>
                        <th className="p-3 sm:p-3.5">Status</th>
                        <th className="p-3 sm:p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {driver.documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-900/50">
                          <td className="p-3 sm:p-3.5 font-bold text-white">{doc.name}</td>
                          <td className="p-3 sm:p-3.5 text-slate-300">{driver.fullName}</td>
                          <td className="p-3 sm:p-3.5 text-slate-400">{doc.authority}</td>
                          <td className="p-3 sm:p-3.5 font-mono text-slate-300">{doc.expiryDate}</td>
                          <td className="p-3 sm:p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              doc.status === 'approved'
                                ? 'bg-green-950 text-green-300 border border-green-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-3 sm:p-3.5 text-right">
                            <button
                              onClick={() => setAdminInspectionDoc(doc)}
                              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap"
                            >
                              Inspect & Verify
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="sm:hidden text-[10px] text-slate-500 italic text-center">↔ Swipe horizontally to inspect documents</p>
            </div>
          )}

          {/* 3. Fare & Market Engine */}
          {adminScreen === 'fares' && (
            <div className="space-y-4 sm:space-y-6">
              <p className="text-xs text-slate-400">
                Configure base rates, per-kilometer fees, and commission percentages for all Jamaican operating zones.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 sm:p-5 rounded-2xl bg-[#121924] border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-[#00A651]" />
                        <h3 className="font-extrabold text-sm sm:text-base text-white">{cat.name} Tier</h3>
                      </div>
                      <span className="text-xs font-bold text-[#FFD600]">Commission: 15%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Base Fare (JMD)</label>
                        <input
                          type="number"
                          value={cat.baseFareJMD}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setCategories(prev =>
                              prev.map(c => (c.id === cat.id ? { ...c, baseFareJMD: val } : c))
                            );
                          }}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Per Km Rate (JMD)</label>
                        <input
                          type="number"
                          value={cat.perKmJMD}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setCategories(prev =>
                              prev.map(c => (c.id === cat.id ? { ...c, perKmJMD: val } : c))
                            );
                          }}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Per Min Rate (JMD)</label>
                        <input
                          type="number"
                          value={cat.perMinJMD}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setCategories(prev =>
                              prev.map(c => (c.id === cat.id ? { ...c, perMinJMD: val } : c))
                            );
                          }}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Minimum Fare (JMD)</label>
                        <input
                          type="number"
                          value={cat.minimumFareJMD}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setCategories(prev =>
                              prev.map(c => (c.id === cat.id ? { ...c, minimumFareJMD: val } : c))
                            );
                          }}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Financial Audit Ledger */}
          {adminScreen === 'ledger' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  Double-entry immutable audit ledger of trip charges, cash reconciliations, and driver earnings.
                </p>
                <button
                  onClick={() => showToast('Ledger exported as CSV for Tax Administration Jamaica (TAJ) audit.')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#00A651]" />
                  <span>Export TAJ Audit Sheet</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#121924] border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3 sm:p-3.5">Entry ID</th>
                        <th className="p-3 sm:p-3.5">Timestamp</th>
                        <th className="p-3 sm:p-3.5">Description</th>
                        <th className="p-3 sm:p-3.5">Gross (JMD)</th>
                        <th className="p-3 sm:p-3.5">Commission (15%)</th>
                        <th className="p-3 sm:p-3.5">Driver Net</th>
                        <th className="p-3 sm:p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {ledger.map(row => (
                        <tr key={row.id} className="hover:bg-slate-900/50">
                          <td className="p-3 sm:p-3.5 font-mono text-slate-400">{row.id}</td>
                          <td className="p-3 sm:p-3.5 text-slate-300">{row.timestamp}</td>
                          <td className="p-3 sm:p-3.5 font-bold text-white">{row.description}</td>
                          <td className="p-3 sm:p-3.5 font-bold text-white">${row.grossAmountJMD.toLocaleString()}</td>
                          <td className="p-3 sm:p-3.5 text-[#FFD600]">${row.platformCommissionJMD.toLocaleString()}</td>
                          <td className="p-3 sm:p-3.5 text-[#00A651] font-bold">${row.driverNetJMD.toLocaleString()}</td>
                          <td className="p-3 sm:p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-green-950 text-green-300 text-[10px] font-bold uppercase">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="sm:hidden text-[10px] text-slate-500 italic text-center">↔ Swipe horizontally to view full ledger figures</p>
            </div>
          )}

          {/* 5. Live Dispatch Operations Screen */}
          {adminScreen === 'live_dispatch' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  Real-time monitor of dispatch requests, driver location beacons, and trip states.
                </p>
                <button
                  onClick={() => handleRequestRide()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#00A651] text-white text-xs font-bold hover:bg-green-600 shadow-md self-start sm:self-auto"
                >
                  Inject Synthetic Test Ride 🚀
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 rounded-2xl bg-[#121924] border border-slate-800 p-3 sm:p-4 space-y-3">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white">Live Real-time Dispatch Map</h3>
                  <div className="h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden border border-slate-700/80">
                    <JamaicaLeafletMap
                      pickup={pickupLoc}
                      destination={dropoffLoc}
                      isDark={true}
                      showRoute={true}
                      driverPosition={currentRide?.driverPosition}
                      activeStatus={currentRide?.status}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#121924] border border-slate-800 p-3 sm:p-4 space-y-3">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white">Active Dispatch State</h3>
                  {currentRide ? (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#00A651] text-white text-[10px] font-extrabold">
                          {currentRide.status}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{currentRide.id}</span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-300">
                        <p><span className="text-slate-500">Passenger:</span> {currentRide.passengerName}</p>
                        <p><span className="text-slate-500">From:</span> {currentRide.pickup.name}</p>
                        <p><span className="text-slate-500">To:</span> {currentRide.destination.name}</p>
                        <p><span className="text-slate-500">Fare:</span> JMD ${currentRide.finalFareJMD.toLocaleString()}</p>
                        <p><span className="text-slate-500">PIN:</span> {currentRide.pickupPin}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleCompleteTrip}
                          className="flex-1 py-1.5 rounded-lg bg-[#00A651] text-white text-xs font-bold hover:bg-green-600"
                        >
                          Force Complete
                        </button>
                        <button
                          onClick={() => handleCancelRide()}
                          className="flex-1 py-1.5 rounded-lg bg-red-900/60 text-red-300 text-xs font-bold hover:bg-red-800/80"
                        >
                          Abort
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 sm:py-12 text-slate-500 text-xs">
                      No active rides in dispatch queue.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. Fleet & Driver Records */}
          {adminScreen === 'drivers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {driversList.map(d => (
                  <div key={d.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#121924] border border-slate-800 space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={d.photo} alt={d.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-[#00A651] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-sm text-white truncate">{d.fullName}</h4>
                        <p className="text-xs text-slate-400 truncate">{d.phone} • {d.operatingZone}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {d.currentVehicle.make} {d.currentVehicle.model} ({d.currentVehicle.plate})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.status === 'active' ? 'bg-green-950 text-green-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {d.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] sm:text-xs text-slate-400">
                      <span>Rating: {d.rating}★</span>
                      <span>Trips: {d.totalTrips}</span>
                      <span className="truncate max-w-[120px]">Bank: {d.payoutAccount.bank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Safety Incidents Queue */}
          {adminScreen === 'safety_incidents' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#121924] border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3 sm:p-3.5">ID</th>
                        <th className="p-3 sm:p-3.5">Severity</th>
                        <th className="p-3 sm:p-3.5">Category</th>
                        <th className="p-3 sm:p-3.5">Reporter</th>
                        <th className="p-3 sm:p-3.5">Timestamp</th>
                        <th className="p-3 sm:p-3.5">Status</th>
                        <th className="p-3 sm:p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {incidents.map(inc => (
                        <tr key={inc.id} className="hover:bg-slate-900/50">
                          <td className="p-3 sm:p-3.5 font-mono text-slate-400">{inc.id}</td>
                          <td className="p-3 sm:p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inc.severity === 'high' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {inc.severity}
                            </span>
                          </td>
                          <td className="p-3 sm:p-3.5 font-bold text-white capitalize">{inc.type.replace('_', ' ')}</td>
                          <td className="p-3 sm:p-3.5 text-slate-300">{inc.reporterName}</td>
                          <td className="p-3 sm:p-3.5 text-slate-400">{inc.timestamp}</td>
                          <td className="p-3 sm:p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inc.status === 'resolved' ? 'bg-green-950 text-green-300' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {inc.status}
                            </span>
                          </td>
                          <td className="p-3 sm:p-3.5 text-right">
                            {inc.status === 'open' || inc.status === 'investigating' ? (
                              <button
                                onClick={() => {
                                  setResolvingIncident(inc);
                                  setIncidentResolutionNote(inc.resolution || '');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-semibold">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="sm:hidden text-[10px] text-slate-500 italic text-center">↔ Swipe horizontally to view incident records</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ==========================================================================
     GLOBAL MODALS (Chat, SOS, Document Inspection)
     ========================================================================== */

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#070a0e] select-none text-slate-900 overflow-hidden font-sans">
      {/* Sleek Enterprise Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] max-w-md px-5 py-3 rounded-2xl bg-[#101418] text-white text-xs font-semibold shadow-2xl border border-white/20 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#00A651] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 
        NO WEBSITE HEADER ROLE SWITCHER! 
        The entire screen is either the clean full-fidelity mobile app or 
        the desktop admin portal.
      */}

      {currentRole === 'admin' ? (
        <div className="w-full h-full">
          {renderAdminPortal()}
        </div>
      ) : (
        /* Authentic Native App Viewport */
        <div className="w-full h-full max-w-[430px] max-h-[920px] bg-white sm:rounded-[44px] shadow-2xl sm:border-[8px] border-slate-900 relative overflow-hidden flex flex-col">
          {currentRole === 'passenger' ? (
            <>
              {passengerScreen === 'splash' && renderPassengerSplash()}
              {passengerScreen === 'auth' && renderPassengerAuth()}
              {passengerScreen === 'home' && renderPassengerHome()}
              {passengerScreen === 'choose_ride' && renderPassengerChooseRide()}
              {passengerScreen === 'finding_driver' && renderPassengerFindingDriver()}
              {passengerScreen === 'driver_approaching' && renderPassengerDriverApproaching()}
              {passengerScreen === 'in_trip' && renderPassengerInTrip()}
              {passengerScreen === 'trip_completed' && renderPassengerTripCompleted()}
              {passengerScreen === 'account' && renderPassengerAccount()}
              {passengerScreen === 'wallet' && renderPassengerWallet()}
              {passengerScreen === 'safety' && renderPassengerSafety()}
              {passengerScreen === 'explore' && renderPassengerExplore()}
              {passengerScreen === 'activity' && renderPassengerActivity()}
            </>
          ) : (
            renderDriverApp()
          )}
        </div>
      )}

      {/* Sleek Floating Demo Quick-Switch Bar for Client Presentations */}
      {(() => {
        const isBottomNavScreen = currentRole !== 'admin' && (
          currentRole === 'driver' || 
          passengerScreen === 'home' || 
          passengerScreen === 'activity' || 
          passengerScreen === 'wallet' || 
          passengerScreen === 'account' ||
          passengerScreen === 'choose_ride' ||
          passengerScreen === 'finding_driver' ||
          passengerScreen === 'driver_approaching' ||
          passengerScreen === 'in_trip' ||
          passengerScreen === 'trip_completed'
        );

        if (demoBarMinimized) {
          return (
            <button
              onClick={() => setDemoBarMinimized(false)}
              title="Expand Demo Switcher Bar"
              className={`fixed ${
                demoBarPosition === 'top'
                  ? 'top-3'
                  : isBottomNavScreen
                    ? 'bottom-[76px]'
                    : 'bottom-4'
              } right-3 z-[850] bg-slate-900/95 hover:bg-slate-800 text-white px-3 py-1.5 rounded-full border border-slate-700/90 shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md active:scale-95 transition-all`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD600]" />
              <span className="hidden sm:inline text-slate-300">Demo Role:</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-[#00A651] font-black uppercase tracking-wider">
                {currentRole}
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          );
        }

        return (
          <aside
            aria-label="Demo Role Switcher"
            className={`fixed ${
              demoBarPosition === 'top'
                ? 'top-3 sm:top-4'
                : isBottomNavScreen
                  ? 'bottom-[76px] sm:bottom-[76px]'
                  : 'bottom-4'
            } left-1/2 -translate-x-1/2 z-[850] max-w-[calc(100vw-20px)] bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700/90 shadow-2xl flex items-center gap-1.5 text-xs font-semibold overflow-x-auto no-scrollbar animate-in fade-in duration-200`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1 hidden md:inline shrink-0">Role:</span>
            
            <button
              onClick={() => navigateTo('passenger')}
              className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 shrink-0 ${
                currentRole === 'passenger' ? 'bg-[#00A651] text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              onClick={() => {
                setDriver(prev => ({
                  ...prev,
                  status: 'active',
                  isOnline: true,
                  documents: INITIAL_DRIVER_DOCUMENTS.map(d => ({
                    ...d,
                    status: 'approved',
                    reviewedBy: 'Compliance Admin (Sarah)',
                    reviewedAt: '2026-10-15',
                  })),
                }));
                navigateTo('driver');
              }}
              className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 shrink-0 ${
                currentRole === 'driver' ? 'bg-[#00A651] text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Driver</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-pulse" />
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 shrink-0 ${
                currentRole === 'admin' ? 'bg-slate-700 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-0.5 shrink-0" />

            {/* Live Simulation Tracking Pill */}
            {currentRide?.status === 'DRIVER_ARRIVING' && (
              <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 px-2.5 py-0.5 rounded-full text-yellow-300 text-[11px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                <span className="hidden sm:inline">Car Arriving: {Math.round(simProgress)}%</span>
                <button
                  onClick={handleFastForwardArrival}
                  className="text-[#00A651] font-extrabold hover:text-white underline ml-1 text-[10px]"
                  title="Skip animation directly to pickup arrival"
                >
                  Arrive Now ⚡
                </button>
              </div>
            )}

            {currentRide?.status === 'IN_PROGRESS' && (
              <div className="flex items-center gap-1.5 bg-[#00A651]/10 border border-[#00A651]/30 px-2.5 py-0.5 rounded-full text-green-300 text-[11px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-ping" />
                <span className="hidden sm:inline">In Trip: {Math.round(simProgress)}%</span>
                <button
                  onClick={handleFastForwardTrip}
                  className="text-yellow-400 font-extrabold hover:text-white underline ml-1 text-[10px]"
                  title="Skip animation directly to dropoff completion"
                >
                  Complete 🏁
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setCurrentRide(null);
                localStorage.removeItem('rideja_active_ride');
                broadcastSync('SYNC_RIDE', null);
                setDriver(prev => ({
                  ...prev,
                  status: 'active',
                  isOnline: true,
                  documents: INITIAL_DRIVER_DOCUMENTS.map(d => ({
                    ...d,
                    status: 'approved',
                    reviewedBy: 'Compliance Admin (Sarah)',
                    reviewedAt: '2026-10-15',
                  })),
                }));
                setPassengerScreen('home');
                showToast('Demo reset: All 7 documents up to date, Driver Online & ready');
              }}
              title="Reset ride & ensure driver documents are valid"
              className="px-2 py-1 rounded-full text-slate-400 hover:text-[#FFD600] transition-colors flex items-center gap-1 text-[11px] shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-0.5 shrink-0" />

            {/* Position Flip Button (Top ⬍ Bottom) */}
            <button
              onClick={() => setDemoBarPosition(prev => prev === 'bottom' ? 'top' : 'bottom')}
              title={demoBarPosition === 'bottom' ? 'Dock demo bar to Top' : 'Dock demo bar to Bottom'}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Toggle demo bar position"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {/* Minimize Button */}
            <button
              onClick={() => setDemoBarMinimized(true)}
              title="Minimize demo switcher bar (unblock view)"
              className="p-1 rounded-full text-slate-400 hover:text-[#FFD600] hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Minimize demo switcher bar"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </aside>
        );
      })()}



      {/* In-App Live Messaging Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
            {/* Chat Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={driver.photo}
                  alt={driver.fullName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#00A651]"
                />
                <div>
                  <h3 className="font-extrabold text-sm">{driver.fullName}</h3>
                  <p className="text-[11px] text-slate-300">
                    {driver.currentVehicle.make} {driver.currentVehicle.model} ({driver.currentVehicle.plate})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === (currentRole === 'driver' ? 'driver' : 'passenger')
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs font-medium shadow-sm ${
                      msg.sender === (currentRole === 'driver' ? 'driver' : 'passenger')
                        ? 'bg-[#00A651] text-white rounded-br-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={newChatInput}
                onChange={e => setNewChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Type a message to your driver..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#00A651]"
              />
              <button
                onClick={handleSendChatMessage}
                className="w-10 h-10 rounded-xl bg-[#00A651] text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jamaican Emergency SOS Dialog */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-100 text-[#D92D20] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Emergency Assistance</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your live GPS coordinates will be shared with the Jamaica Constabulary Force (119) and RideJa Safety Operations.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleTriggerSos('emergency_sos')}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Police 119 & Broadcast SOS
              </button>

              <button
                onClick={() => handleTriggerSos('vehicle_mismatch')}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Report Vehicle or Driver Mismatch
              </button>

              <button
                onClick={() => setSosModalOpen(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Document Verification Inspector Modal */}
      {adminInspectionDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base">{adminInspectionDoc.name}</h3>
                <p className="text-xs text-slate-400">Driver: {driver.fullName} • Ref: {adminInspectionDoc.documentNumber}</p>
              </div>
              <button onClick={() => setAdminInspectionDoc(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Image Preview */}
            <div className="h-64 rounded-2xl overflow-hidden bg-black border border-slate-800 relative flex items-center justify-center">
              <img
                src={adminInspectionDoc.fileUrl}
                alt="Document Certificate"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/80 text-[10px] text-green-400 font-mono">
                Encrypted Private Vault (Jamaica DPA Protected)
              </div>
            </div>

            {/* Document Metadata Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500">Issuing Authority:</span>
                <p className="font-semibold text-slate-200">{adminInspectionDoc.authority}</p>
              </div>
              <div>
                <span className="text-slate-500">Document Expiry:</span>
                <p className="font-semibold text-slate-200 font-mono">{adminInspectionDoc.expiryDate}</p>
              </div>
            </div>

            {/* Action Buttons: Approve or Reject */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setDriver(prev => ({
                    ...prev,
                    documents: prev.documents.map(d =>
                      d.id === adminInspectionDoc.id
                        ? { ...d, status: 'approved', reviewedBy: 'Compliance Admin', reviewedAt: '2026-10-14' }
                        : d
                    ),
                  }));
                  const docName = adminInspectionDoc.name;
                  setAdminInspectionDoc(null);
                  showToast(`Document approved: ${docName}`);
                }}
                className="flex-1 py-3 rounded-2xl bg-[#00A651] hover:bg-green-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                Approve & Grant Compliance
              </button>
              <button
                onClick={() => {
                  const defaultReason = 'Document requires renewed stamp or higher-resolution scan';
                  setDriver(prev => ({
                    ...prev,
                    documents: prev.documents.map(d =>
                      d.id === adminInspectionDoc.id
                        ? { ...d, status: 'rejected', rejectionReason: defaultReason, reviewedBy: 'Compliance Admin' }
                        : d
                    ),
                  }));
                  setAdminInspectionDoc(null);
                  showToast(`Document rejected: ${defaultReason}`);
                }}
                className="flex-1 py-3 rounded-2xl bg-red-900/60 hover:bg-red-800 text-red-200 font-extrabold text-xs transition-all active:scale-[0.98]"
              >
                Reject / Request Resubmission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Safety Incident Resolution Modal */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${resolvingIncident.severity === 'high' ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
                <h3 className="font-extrabold text-base">Resolve Incident #{resolvingIncident.id}</h3>
              </div>
              <button onClick={() => setResolvingIncident(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="font-semibold text-slate-200 capitalize">{resolvingIncident.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reporter:</span>
                <span className="font-medium text-slate-200">{resolvingIncident.reporterName} ({resolvingIncident.reportedBy})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trip Ref:</span>
                <span className="font-mono text-slate-300">{resolvingIncident.tripId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reported At:</span>
                <span className="font-mono text-slate-300">{resolvingIncident.timestamp}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Resolution & Dispatch Notes</label>
              <textarea
                value={incidentResolutionNote}
                onChange={e => setIncidentResolutionNote(e.target.value)}
                placeholder="Enter actions taken, officer unit badge #, or reason for closure..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00A651]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setResolvingIncident(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIncidents(prev =>
                    prev.map(i =>
                      i.id === resolvingIncident.id
                        ? {
                            ...i,
                            status: 'resolved',
                            notes: incidentResolutionNote.trim() || 'Resolved by super admin Marcus',
                          }
                        : i
                    )
                  );
                  showToast(`Incident #${resolvingIncident.id} closed & logged.`);
                  setResolvingIncident(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#00A651] hover:bg-green-600 text-white font-extrabold text-xs transition-colors shadow-md"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
