"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
// import FirebaseTest from "../components/FirebaseTest"
import CsvUploader from "../components/CsvUploader"
import FirebaseDataToggle from "../components/FirebaseDataToggle"
import {
  User,
  Briefcase,
  DollarSign,
  Shield,
  Home,
  Settings,
  TrendingUp,
  Users,
  FileDown,
  ChevronDown,
  CheckCircle,
  Filter,
  Calendar,
  Sparkles,
  X,
  AlertTriangle,
  GitMerge,
  Activity,
  FileCheck,
  Globe,
  Landmark,
  Scale,
  Coins,
  Search,
  Edit,
  Clock,
  ArrowRight,
  Send,
  Mail,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Loader2,
  MoreHorizontal,
  Phone,
  MailIcon,
  PlusCircle,
  ArrowUpDown,
  Database,
  Save,
} from "lucide-react"
import WorkflowCsvUploader from "../components/WorkflowCsvUploader"
import { Button } from "../components/ui/button"
import { useWorkflowCollateralData } from "../hooks/useWorkflowCollateralData"
import { doc, updateDoc, setDoc, writeBatch, collection, getDocs, getDoc } from "firebase/firestore"
import EditableCell from "../components/EditableCell"
import { db } from "../lib/firebase"
import ClientInfoCsvUploader from '../components/ClientInfoCsvUploader'
import { useRealtimeCollection } from '../hooks/useFirestore'
import DailyActivityCsvUploader from '../components/DailyActivityCsvUploader'
import ReconciliationCsvUploader from '../components/ReconciliationCsvUploader'
import RealtimeEditableTable from '../components/RealtimeEditableTable'

// --- Helper Functions ---
const downloadFile = ({ data, fileName, fileType }) => {
  const blob = new Blob([data], { type: fileType })
  const a = document.createElement("a")
  a.download = fileName
  a.href = window.URL.createObjectURL(blob)
  const clickEvt = new MouseEvent("click", { view: window, bubbles: true, cancelable: true })
  a.dispatchEvent(clickEvt)
  a.remove()
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0)
}

const formatCurrencyForScorecard = (value) => {
  if (!value && value !== 0) return "$0"
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

const formatCurrencyDetailed = (value, currency = "USD") => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value)
}

const formatNumber = (value) => (value || 0).toLocaleString()

const formatDate = (date) => {
  if (!date) return ""
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// --- MOCK DATABASE ---
const clientIds = [
  "CID5962",
  "CID2693",
  "CID5299",
  "CID4233",
  "CID7506",
  "CID1598",
  "CID8072",
  "CID7079",
  "CID8079",
  "CID3450",
]
const fixedTodayForDashboard = new Date("2025-07-18T12:00:00Z")
const generateRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

const clientDetailsData = [
  {
    clientId: "CID5962",
    accountName: "Pinnacle Global Fund",
    accountNumber: "US-ACCT-5962",
    domicile: "USA",
    lei: "54930001B3S1S8B3S1S8A",
    mta: { amount: 500000, currency: "USD" },
    currencies: ["USD", "EUR"],
    assets: ["US Treasuries"],
    holidays: ["US", "UK"],
    proposedAssets: [{ name: "Emerging Market Debt", reason: "Exceeds risk threshold" }],
    threshold: 1000000,
    reportingCurrency: "USD",
    contact: { phone: "+1-202-555-0149", email: "ops@pinnacleglobal.com" },
    notificationTime: "10:00 AM New York",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank PLC London",
  },
  {
    clientId: "CID2693",
    accountName: "Sterling Capital",
    accountNumber: "UK-ACCT-2693",
    domicile: "UK",
    lei: "54930002B3S1S8B3S1S8B",
    mta: { amount: 250000, currency: "GBP" },
    currencies: ["GBP", "USD", "EUR"],
    assets: ["UK Gilts"],
    holidays: ["UK"],
    proposedAssets: [],
    threshold: 0,
    reportingCurrency: "GBP",
    contact: { phone: "+44-20-7946-0958", email: "contact@sterlingcap.co.uk" },
    notificationTime: "10:00 AM London",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank PLC London",
  },
  {
    clientId: "CID5299",
    accountName: "EuroPrime Investors",
    accountNumber: "DE-ACCT-5299",
    domicile: "Germany",
    lei: "54930003B3S1S8B3S1S8C",
    mta: { amount: 500000, currency: "EUR" },
    currencies: ["EUR"],
    assets: ["German Bunds"],
    holidays: ["TARGET2"],
    proposedAssets: [{ name: "Municipal Bonds", reason: "Liquidity concerns" }],
    threshold: 2000000,
    reportingCurrency: "EUR",
    contact: { phone: "+49-30-567-95-123", email: "invest@europrime.de" },
    notificationTime: "11:00 AM Frankfurt",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank Ireland",
  },
  {
    clientId: "CID4233",
    accountName: "Nikkei Growth Partners",
    accountNumber: "JP-ACCT-4233",
    domicile: "Japan",
    lei: "54930004B3S1S8B3S1S8D",
    mta: { amount: 10000000, currency: "JPY" },
    currencies: ["JPY", "USD"],
    assets: ["JGBs"],
    holidays: ["Japan"],
    proposedAssets: [],
    threshold: 0,
    reportingCurrency: "JPY",
    contact: { phone: "+81-3-4567-8901", email: "support@nikkeigrowth.jp" },
    notificationTime: "11:00 AM Tokyo",
    settlementPeriod: "T+1",
    principalEntity: "Barclays Bank PLC London",
  },
  {
    clientId: "CID7506",
    accountName: "Societe Generale Alpha",
    accountNumber: "FR-ACCT-7506",
    domicile: "France",
    lei: "54930005B3S1S8B3S1S8E",
    mta: { amount: 400000, currency: "EUR" },
    currencies: ["EUR", "USD"],
    assets: ["French OATs"],
    holidays: ["TARGET2"],
    proposedAssets: [],
    threshold: 1000000,
    reportingCurrency: "EUR",
    contact: { phone: "+33-1-23-45-67-89", email: "alpha@socgen.fr" },
    notificationTime: "11:00 AM Paris",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank Ireland",
  },
  {
    clientId: "CID1598",
    accountName: "Maple Leaf Holdings",
    accountNumber: "CA-ACCT-1598",
    domicile: "Canada",
    lei: "54930006B3S1S8B3S1S8F",
    mta: { amount: 300000, currency: "CAD" },
    currencies: ["CAD", "USD"],
    assets: ["Canadian Gov Bonds"],
    holidays: ["Canada", "US"],
    proposedAssets: [],
    threshold: 1000000,
    reportingCurrency: "CAD",
    contact: { phone: "+1-416-555-0199", email: "accounts@mapleleaf.ca" },
    notificationTime: "10:00 AM Toronto",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank PLC London",
  },
  {
    clientId: "CID8072",
    accountName: "Down Under Capital",
    accountNumber: "AU-ACCT-8072",
    domicile: "Australia",
    lei: "54930007B3S1S8B3S1S8G",
    mta: { amount: 500000, currency: "AUD" },
    currencies: ["AUD", "USD"],
    assets: ["Australian Gov Bonds"],
    holidays: ["Australia"],
    proposedAssets: [{ name: "Convertible Bonds", reason: "Below required credit rating" }],
    threshold: 2000000,
    reportingCurrency: "AUD",
    contact: { phone: "+61-2-9876-5432", email: "info@downundercap.com.au" },
    notificationTime: "11:00 AM Sydney",
    settlementPeriod: "T+1",
    principalEntity: "Barclays Bank PLC London",
  },
  {
    clientId: "CID7079",
    accountName: "Helvetia Wealth Mgmt",
    accountNumber: "CH-ACCT-7079",
    domicile: "Switzerland",
    lei: "54930008B3S1S8B3S1S8H",
    mta: { amount: 500000, currency: "CHF" },
    currencies: ["CHF", "EUR"],
    assets: ["Swiss Gov Bonds"],
    holidays: ["Switzerland"],
    proposedAssets: [],
    threshold: 0,
    reportingCurrency: "CHF",
    contact: { phone: "+41-44-212-3456", email: "ops@helvetia.ch" },
    notificationTime: "11:00 AM Zurich",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank Ireland",
  },
  {
    clientId: "CID8079",
    accountName: "Britannia Investments",
    accountNumber: "UK-ACCT-8079",
    domicile: "UK",
    lei: "54930009B3S1S8B3S1S8I",
    mta: { amount: 1000000, currency: "GBP" },
    currencies: ["GBP", "USD"],
    assets: ["UK Gilts"],
    holidays: ["UK", "US"],
    proposedAssets: [],
    threshold: 2000000,
    reportingCurrency: "GBP",
    contact: { phone: "+44-20-8123-4567", email: "admin@britannia-inv.co.uk" },
    notificationTime: "10:00 AM London",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank PLC London",
  },
  {
    clientId: "CID3450",
    accountName: "Liberty Capital Group",
    accountNumber: "US-ACCT-3450",
    domicile: "USA",
    lei: "54930010B3S1S8B3S1S8J",
    mta: { amount: 750000, currency: "USD" },
    currencies: ["USD"],
    assets: ["US Treasuries"],
    holidays: ["US"],
    proposedAssets: [{ name: "High-Yield Bonds", reason: "Below required credit rating" }],
    threshold: 1000000,
    reportingCurrency: "USD",
    contact: { phone: "+1-312-555-0178", email: "trading@libertycg.com" },
    notificationTime: "10:00 AM Chicago",
    settlementPeriod: "T+0",
    principalEntity: "Barclays Bank PLC London",
  },
]

const allMarginCalls = Array.from({ length: 500 }, (_, i) => {
  const statusOptions = ["Settled", "Settled", "Settled", "Settled", "Disputed", "Failed"]
  const failReasons = ["Incorrect SSI", "Insufficient Funds/Securities", "Late Matching", "Market Holiday", "Other"]
  const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]
  return {
    id: `MC-${1000 + i}`,
    clientId: clientIds[Math.floor(Math.random() * clientIds.length)],
    date: generateRandomDate(
      new Date(fixedTodayForDashboard.getFullYear(), fixedTodayForDashboard.getMonth() - 3, 1),
      fixedTodayForDashboard,
    ),
    value: Math.floor(Math.random() * 5000000) + 10000,
    type: Math.random() > 0.3 ? "Electronic" : "Manual",
    direction: Math.random() > 0.5 ? "Barclays Call" : "Client Call",
    status: status,
    assetType: Math.random() > 0.4 ? "Cash" : "Bond",
    failReason: status === "Failed" ? failReasons[Math.floor(Math.random() * failReasons.length)] : null,
  }
})

// Margin Call Workflow Data
const marginCallData = [
  {
    id: "MC-9501",
    direction: "inbound",
    clientId: "CID5962",
    counterparty: "Citibank",
    callAmount: 1200000,
    currency: "USD",
    exposure: 15500000,
    bookingStatus: "Fully Booked",
    disputeAmount: 0,
    priceMovement: 0.25,
    bookingType: "Acadia-Electronic",
    portfolio: [
      { tradeId: "FX0001", pnl: 5000, priceChange: 0.3 },
      { tradeId: "FX0002", pnl: -2000, priceChange: -0.1 },
      { tradeId: "IR0012", pnl: 15000, priceChange: 0.15 },
      { tradeId: "EQ0034", pnl: -8000, priceChange: -0.05 },
    ],
  },
  {
    id: "MC-9502",
    direction: "inbound",
    clientId: "CID2693",
    counterparty: "Goldman Sachs",
    callAmount: 850000,
    currency: "GBP",
    exposure: 11000000,
    bookingStatus: "Fully Booked",
    disputeAmount: 0,
    priceMovement: 0.15,
    bookingType: "Acadia-Electronic",
    portfolio: [
      { tradeId: "FX0003", pnl: 12000, priceChange: 0.2 },
      { tradeId: "FX0004", pnl: -4500, priceChange: -0.05 },
      { tradeId: "CD0008", pnl: 25000, priceChange: 0.35 },
      { tradeId: "FI0019", pnl: -11000, priceChange: -0.12 },
    ],
  },
  {
    id: "MC-9506",
    direction: "inbound",
    clientId: "CID1598",
    counterparty: "Citibank",
    callAmount: 900000,
    currency: "CAD",
    exposure: 12000000,
    bookingStatus: "Partially Disputed",
    disputeAmount: 200000,
    priceMovement: -0.2,
    bookingType: "Manual",
    disputeReason: "MTM Mismatch",
    portfolio: [
      { tradeId: "FX0005", pnl: -15000, priceChange: -0.5 },
      { tradeId: "FX0006", pnl: 5000, priceChange: 0.1 },
      { tradeId: "FX0025", pnl: -200000, priceChange: -1.5, dispute: true },
    ],
  },
  {
    id: "MC-9509",
    direction: "inbound",
    clientId: "CID8079",
    counterparty: "JPMorgan",
    callAmount: 2500000,
    currency: "GBP",
    exposure: 30000000,
    bookingStatus: "Fully Disputed",
    disputeAmount: 2500000,
    priceMovement: 0.6,
    bookingType: "Manual",
    disputeReason: "MTM Mismatch",
    portfolio: [
      { tradeId: "FX00010", pnl: -50000, priceChange: -1.2 },
      { tradeId: "FX00011", pnl: -30000, priceChange: -0.8 },
      { tradeId: "MTM-DISPUTE-01", pnl: 2500000, priceChange: 2.5, dispute: true },
    ],
  },
  {
    id: "MC-9511",
    direction: "outbound",
    clientId: "CID5962",
    counterparty: "Goldman Sachs",
    callAmount: 700000,
    currency: "USD",
    exposure: 9000000,
    bookingStatus: "Fully Booked",
    disputeAmount: 0,
    priceMovement: -0.15,
    bookingType: "Acadia-Electronic",
    portfolio: [
      { tradeId: "FX00019", pnl: -7500, priceChange: -0.18 },
      { tradeId: "IR0088", pnl: -12000, priceChange: -0.11 },
    ],
  },
  {
    id: "MC-9513",
    direction: "outbound",
    clientId: "CID5299",
    counterparty: "Citibank",
    callAmount: 400000,
    currency: "EUR",
    exposure: 6000000,
    bookingStatus: "Fully Booked",
    disputeAmount: 0,
    priceMovement: -0.1,
    bookingType: "Manual",
    portfolio: [
      { tradeId: "FX00021", pnl: -3000, priceChange: -0.07 },
      { tradeId: "FI0022", pnl: -9000, priceChange: -0.09 },
    ],
  },
]

// --- Reusable Components ---
const KpiCard = ({ title, value, subValue, icon }) => (
  <div className="bg-card p-5 rounded-xl shadow-lg border border-border flex items-center space-x-4">
    <div className="p-3 bg-muted rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{subValue}</p>
    </div>
  </div>
)

const RectangleStatCard = ({ title, value, trend, trendDirection, icon }) => (
  <div className="bg-card p-4 rounded-xl shadow-lg border border-border flex items-center justify-between">
    <div className="flex items-center">
      <div className="p-3 bg-muted rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground ml-4">{title}</p>
        <p className="text-xl font-bold text-foreground ml-4">{value}</p>
      </div>
    </div>
    {trend && (
      <div
        className={`flex items-center text-xs font-semibold ${trendDirection === "up" ? "text-green-600" : "text-red-600"}`}
      >
        {trendDirection === "up" ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
        {trend}
      </div>
    )}
  </div>
)

const BreakdownItem = ({ label, value, isAlert = false }) => (
  <div className={`p-3 rounded-lg ${isAlert ? "bg-red-100" : "bg-muted"}`}>
    <p className={`text-sm ${isAlert ? "text-red-700" : "text-muted-foreground"}`}>{label}</p>
    <p className="font-semibold text-lg text-foreground">{value}</p>
  </div>
)

const InfoCard = ({ title, value, valueClass = "text-foreground" }) => (
  <div className="bg-muted p-4 rounded-lg">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
  </div>
)

const FailReasonItem = ({ reason, count }) => (
  <div className="flex justify-between items-center text-sm bg-muted px-3 py-1.5 rounded">
    <p className="text-foreground">{reason}</p>
    <p className="font-mono text-red-600 bg-red-100 px-2 rounded-sm">{count}</p>
  </div>
)

const DownloadDropdown = ({ onExport }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])
  const handleExport = (type) => {
    onExport(type)
    setIsOpen(false)
  }
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
      >
        <FileDown size={14} className="mr-2" /> Download{" "}
        <ChevronDown size={16} className={`ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-lg shadow-xl z-10">
          <button
            onClick={() => handleExport("csv")}
            className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            PDF
          </button>
        </div>
      )}
    </div>
  )
}

const SidebarButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-foreground ${active ? "bg-primary-foreground/20 text-primary-foreground shadow-inner" : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"}`}
  >
    {icon} <span className="ml-4 font-medium">{label}</span>
  </button>
)

const PlaceholderComponent = ({ title }) => (
  <div>
    <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
    <p className="text-muted-foreground">This section is under construction.</p>
    <div className="mt-8 bg-card p-12 rounded-xl shadow-lg border border-border flex items-center justify-center">
      <p className="text-muted-foreground">Content for {title} will appear here.</p>
    </div>
  </div>
)

const InfoField = ({ label, value, valueClass = "text-foreground" }) => (
  <div>
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    <p className={`font-medium ${valueClass}`}>{value}</p>
  </div>
)

const Tag = ({ text }) => (
  <span className="bg-muted text-foreground text-xs font-medium mr-2 mb-2 px-2.5 py-1 rounded-full">{text}</span>
)

const EditableTag = ({ text, onRemove }) => (
  <span className="bg-muted text-foreground text-xs font-medium mr-2 mb-2 px-2.5 py-1 rounded-full flex items-center">
    {text}
    <button onClick={onRemove} className="ml-2 text-muted-foreground hover:text-foreground focus:outline-none">
      <X size={12} />
    </button>
  </span>
)

// Form Input Component
const FormInput = ({ name, label, placeholder, value, onChange, type = "text", required = true }) => (
  <div>
    <label htmlFor={name} className="block mb-2 text-sm font-medium text-foreground">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="bg-background border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
    />
  </div>
)

// --- Modal Components ---
const CreateAccountModal = ({ isOpen, onClose, onCreate }) => {
  const initialFormState = {
    accountName: "",
    accountNumber: "",
    domicile: "",
    lei: "",
    mtaAmount: "",
    mtaCurrency: "",
    assets: "",
    currencies: "",
    holidays: "",
    threshold: "",
    reportingCurrency: "",
    contactPhone: "",
    contactEmail: "",
    notificationTime: "",
    settlementPeriod: "",
    principalEntity: "",
  }
  const [formData, setFormData] = useState(initialFormState)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newClient = {
      clientId: `CID${Math.floor(1000 + Math.random() * 9000)}`,
      accountName: formData.accountName,
      accountNumber: formData.accountNumber,
      domicile: formData.domicile,
      lei: formData.lei,
      mta: {
        amount: Number.parseInt(formData.mtaAmount, 10) || 0,
        currency: formData.mtaCurrency.toUpperCase(),
      },
      assets: formData.assets
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      currencies: formData.currencies
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      holidays: formData.holidays
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      proposedAssets: [],
      threshold: Number.parseInt(formData.threshold, 10) || 0,
      reportingCurrency: formData.reportingCurrency.toUpperCase(),
      contact: {
        phone: formData.contactPhone,
        email: formData.contactEmail,
      },
      notificationTime: formData.notificationTime,
      settlementPeriod: formData.settlementPeriod,
      principalEntity: formData.principalEntity,
    }
    onCreate(newClient)
    setFormData(initialFormState)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">Create New Client Account</h3>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <FormInput
              name="accountName"
              label="Account Name"
              placeholder="e.g., Quantum Fund LP"
              value={formData.accountName}
              onChange={handleChange}
            />
            <FormInput
              name="accountNumber"
              label="Account Number"
              placeholder="e.g., US-ACCT-1234"
              value={formData.accountNumber}
              onChange={handleChange}
            />
            <FormInput
              name="lei"
              label="LEI"
              placeholder="Legal Entity Identifier"
              value={formData.lei}
              onChange={handleChange}
            />
            <FormInput
              name="domicile"
              label="Domicile"
              placeholder="e.g., USA"
              value={formData.domicile}
              onChange={handleChange}
            />
            <FormInput
              name="principalEntity"
              label="Principal Entity"
              placeholder="e.g., Barclays Bank PLC London"
              value={formData.principalEntity}
              onChange={handleChange}
            />
            <FormInput
              name="reportingCurrency"
              label="Reporting Currency"
              placeholder="e.g., USD"
              value={formData.reportingCurrency}
              onChange={handleChange}
            />
            <FormInput
              name="settlementPeriod"
              label="Settlement Period"
              placeholder="e.g., T+0 or T+1"
              value={formData.settlementPeriod}
              onChange={handleChange}
            />

            <div>
              <label className="block mb-2 text-sm font-medium text-foreground">Minimum Transfer Amount (MTA)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="mtaAmount"
                  value={formData.mtaAmount}
                  onChange={handleChange}
                  placeholder="Amount"
                  className="bg-background border border-input text-foreground rounded-lg w-2/3 p-2.5"
                />
                <input
                  type="text"
                  name="mtaCurrency"
                  value={formData.mtaCurrency}
                  onChange={handleChange}
                  placeholder="USD"
                  className="bg-background border border-input text-foreground rounded-lg w-1/3 p-2.5"
                />
              </div>
            </div>

            <FormInput
              name="threshold"
              label="Threshold"
              placeholder="e.g., 1000000"
              type="number"
              value={formData.threshold}
              onChange={handleChange}
            />
            <FormInput
              name="notificationTime"
              label="Notification Time"
              placeholder="e.g., 10:00 AM London"
              value={formData.notificationTime}
              onChange={handleChange}
            />
            <FormInput
              name="contactPhone"
              label="Contact Phone"
              placeholder="+1-202-555-0149"
              value={formData.contactPhone}
              onChange={handleChange}
            />
            <FormInput
              name="contactEmail"
              label="Contact Email"
              placeholder="ops@quantum.com"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
            />

            <div className="lg:col-span-3">
              <FormInput
                name="assets"
                label="Eligible Collateral"
                placeholder="Comma-separated, e.g., US Treasuries, UK Gilts"
                value={formData.assets}
                onChange={handleChange}
              />
            </div>
            <div className="lg:col-span-3">
              <FormInput
                name="currencies"
                label="Acceptable Currencies"
                placeholder="Comma-separated, e.g., USD, EUR, GBP"
                value={formData.currencies}
                onChange={handleChange}
              />
            </div>
            <div className="lg:col-span-3">
              <FormInput
                name="holidays"
                label="Holiday Calendars"
                placeholder="Comma-separated, e.g., US, UK, TARGET2"
                value={formData.holidays}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        <div className="p-6 bg-muted border-t border-border flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">
            Create Account
          </button>
        </div>
      </form>
    </div>
  )
}

const EditClientModal = ({ isOpen, onClose, client, onSave }) => {
  const [editableClient, setEditableClient] = useState(null)
  const [newItem, setNewItem] = useState({ currencies: "", assets: "", holidays: "" })

  useEffect(() => {
    if (client) {
      const draft = JSON.parse(JSON.stringify(client));
      if (!draft.contact) {
        draft.contact = {
          phone: draft["contact.phone"] ?? "",
          email: draft["contact.email"] ?? ""
        };
      }
      setEditableClient(draft);
    } else {
      setEditableClient(null);
    }
  }, [client]);

  if (!isOpen || !editableClient) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    const numericFields = ["threshold"]
    if (numericFields.includes(name)) {
      setEditableClient((prev) => ({ ...prev, [name]: Number.parseInt(value.replace(/,/g, ""), 10) || 0 }))
    } else {
      setEditableClient((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleMtaChange = (e) => {
    const { name, value } = e.target
    const parsedValue = name === "amount" ? Number.parseInt(value.replace(/,/g, ""), 10) || 0 : value
    setEditableClient((prev) => ({
      ...prev,
      mta: { ...prev.mta, [name]: parsedValue },
    }))
  }

  const handleContactChange = (e) => {
    const { name, value } = e.target
    setEditableClient((prev) => ({
      ...prev,
      contact: { ...prev.contact, [name]: value },
    }))
  }

  const handleNewItemChange = (e) => {
    const { name, value } = e.target
    setNewItem((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddItem = (type) => {
    const value = newItem[type].trim()
    if (value && !editableClient[type].includes(value)) {
      setEditableClient((prev) => ({
        ...prev,
        [type]: [...prev[type], value],
      }))
      setNewItem((prev) => ({ ...prev, [type]: "" }))
    }
  }

  const handleRemoveItem = (type, index) => {
    setEditableClient((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  const handleSave = () => {
    onSave(editableClient)
    onClose()
  }

  const renderEditableList = (type, label) => (
    <div className="col-span-3">
      <label className="block mb-2 text-sm font-medium text-gray-300">{label}</label>
      <div className="flex flex-wrap gap-1 mb-2">
        {(Array.isArray(editableClient[type]) ? editableClient[type] : typeof editableClient[type] === 'string' ? editableClient[type].split(',').map(s => s.trim()).filter(Boolean) : []).map((item, index) => (
          <EditableTag key={index} text={item} onRemove={() => handleRemoveItem(type, index)} />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          name={type}
          value={newItem[type]}
          onChange={handleNewItemChange}
          placeholder={`Add new ${label.slice(0, -1).toLowerCase()}...`}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        <button
          onClick={() => handleAddItem(type)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg"
        >
          Add
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">
            Edit Arrangements for {client.accountName} ({client.clientId})
          </h3>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <FormInput
              name="accountName"
              label="Account Name"
              value={editableClient.accountName}
              onChange={handleChange}
            />
            <FormInput
              name="accountNumber"
              label="Account Number"
              value={editableClient.accountNumber}
              onChange={handleChange}
            />
            <FormInput name="lei" label="LEI" value={editableClient.lei} onChange={handleChange} />

            <FormInput name="domicile" label="Domicile" value={editableClient.domicile} onChange={handleChange} />
            <FormInput
              name="principalEntity"
              label="Principal Entity"
              value={editableClient.principalEntity}
              onChange={handleChange}
            />
            <FormInput
              name="reportingCurrency"
              label="Reporting Currency"
              value={editableClient.reportingCurrency}
              onChange={handleChange}
            />

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-foreground">Minimum Transfer Amount (MTA)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="amount"
                  value={formatNumber(editableClient.mta?.amount)}
                  onChange={handleMtaChange}
                  className="bg-background border border-input text-foreground rounded-lg w-2/3 p-2.5"
                />
                <input
                  type="text"
                  name="currency"
                  value={editableClient.mta?.currency}
                  onChange={handleMtaChange}
                  className="bg-background border border-input text-foreground rounded-lg w-1/3 p-2.5"
                  placeholder="e.g. USD"
                />
              </div>
            </div>
            <div>
              <label htmlFor="threshold" className="block mb-2 text-sm font-medium text-foreground">
                Threshold
              </label>
              <input
                type="text"
                id="threshold"
                name="threshold"
                value={formatNumber(editableClient.threshold)}
                onChange={handleChange}
                className="bg-background border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
              />
            </div>

            <FormInput
              name="notificationTime"
              label="Notification Time"
              value={editableClient.notificationTime}
              onChange={handleChange}
            />
            <FormInput
              name="phone"
              label="Contact Phone"
              value={editableClient.contact.phone}
              onChange={handleContactChange}
            />
            <FormInput
              name="email"
              label="Contact Email"
              type="email"
              value={editableClient.contact.email}
              onChange={handleContactChange}
            />

            <div className="md:col-span-3">
              <FormInput
                name="settlementPeriod"
                label="Settlement Period"
                value={editableClient.settlementPeriod}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-3">{renderEditableList("assets", "Eligible Collateral")}</div>
            <div className="md:col-span-3">{renderEditableList("currencies", "Currencies")}</div>
            <div className="md:col-span-3">{renderEditableList("holidays", "Holiday Calendars")}</div>
          </div>
        </div>
        <div className="p-6 bg-muted border-t border-border flex justify-end gap-4">
          <button onClick={onClose} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

const InsightModal = ({ isOpen, onClose, topic, data }) => {
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState({ target: "", reason: "", suggestion: "" })

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setTimeout(() => {
        let newInsight = { target: "", reason: "", suggestion: "" }
        switch (topic) {
          case "Performance Metrics":
            newInsight.target = "Maintain daily average calls below 35."
            newInsight.reason = "High averages can result from market volatility, new complex trades, or deteriorating credit quality of certain clients."
            newInsight.suggestion = "1. Identify clients with consistently high call frequencies for portfolio review.\n2. Enhance pre-trade risk analysis to anticipate margin impacts.\n3. Increase automation for standard call processing to free up operational capacity."
            break
          case "Margin Call Breakdown":
            newInsight.target = "Achieve >85% Electronic (Automated) calls. Reduce Disputed calls to <5% of total."
            newInsight.reason = "High manual calls suggest process gaps for certain products or agreements. Disputes often stem from valuation differences or data lags."
            newInsight.suggestion = "1. Analyze the top 5 reasons for manual calls and scope automation projects.\n2. Implement a valuation tolerance threshold with key counterparties to pre-empt disputes.\n3. Introduce a dashboard to track dispute resolution times and identify bottlenecks."
            break
        }
        setInsight(newInsight)
        setLoading(false)
      }, 1500)
    }
  }, [isOpen, topic, data])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            <Sparkles className="mr-3 text-primary" /> AI Insight: {topic}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        {loading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Analyzing data...</p>
          </div>
        ) : (
          <div className="bg-muted p-6 rounded-xl">
            <div className="mb-4">
              <h4 className="font-semibold text-primary mb-2">Target</h4>
              <p className="text-foreground">{insight.target}</p>
            </div>
            <div className="mb-4">
              <h4 className="font-semibold text-primary mb-2">Possible Reasons</h4>
              <p className="text-foreground">{insight.reason}</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-600 mb-2">Actionable Points</h4>
              <p className="text-foreground whitespace-pre-line">{insight.suggestion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ViewAgreementModal = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null

  const agreementTitle = "ISDA Master Agreement"
  const partyADetails = { name: "Barclays", address: "5 The North Colonnade", city: "Canary Wharf, London E14 4BB" }
  const partyBDetails = { name: client.accountName, address: client.principalEntity || "N/A", city: client.domicile || "N/A" }

  const AgreementSection = ({ title, children }) => (
    <div className="mb-6">
      <h4 className="text-lg font-semibold text-primary mb-3">{title}</h4>
      <div className="text-sm text-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-foreground">{agreementTitle}</h3>
            <p className="text-muted-foreground">Agreement between {partyADetails.name} and {partyBDetails.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            <AgreementSection title="1. Parties">
              <p><span className="font-semibold text-foreground">Party A:</span> {partyADetails.name}, {partyADetails.address}, {partyADetails.city}</p>
              <p><span className="font-semibold text-foreground">Party B:</span> {partyBDetails.name}, {partyBDetails.address}, {partyBDetails.city}</p>
            </AgreementSection>

            <AgreementSection title="2. Scope and Application">
              <p>This Agreement governs all Transactions between the parties. Each Transaction shall be a separate agreement binding on the parties.</p>
            </AgreementSection>

            <AgreementSection title="3. Netting of Payments">
              <p>On each date on which a payment obligation is due to be performed under Section 2(a)(i) in respect of a Transaction, the amount payable shall be the net amount calculated in accordance with the provisions of Section 2(c) of this Agreement.</p>
            </AgreementSection>

            <AgreementSection title="4. Credit Support">
              <p><span className="font-semibold text-gray-200">4(a) Delivery Amount.</span> Subject to Paragraphs 3 and 4, upon a demand made by the Secured Party on or promptly following a Valuation Date, if the Delivery Amount for that Valuation Date equals or exceeds the Minimum Transfer Amount, then the Pledgor will Transfer to the Secured Party Eligible Credit Support having a Value as of the date of Transfer at least equal to the applicable Delivery Amount.</p>
              <p><span className="font-semibold text-gray-200">4(b) Return Amount.</span> Subject to Paragraphs 3 and 4, upon a demand made by the Pledgor on or promptly following a Valuation Date, if the Return Amount for that Valuation Date equals or exceeds the Minimum Transfer Amount, then the Secured Party will Transfer to the Pledgor Eligible Credit Support having a Value as of the date of Transfer at least equal to the applicable Return Amount.</p>
            </AgreementSection>

            <AgreementSection title="5. Events of Default and Termination Events">
              <p><span className="font-semibold text-gray-200">5(a) Events of Default.</span> The occurrence at any time with respect to a party or, if applicable, any Credit Support Provider of such party of any of the following events constitutes an event of default: Failure to Pay or Deliver, Breach of Agreement, Credit Support Default, Misrepresentation, etc.</p>
              <p><span className="font-semibold text-gray-200">5(b) Termination Events.</span> The occurrence at any time with respect to a party of any of the following events constitutes a Termination Event: Illegality, Tax Event, Tax Event Upon Merger, Credit Event Upon Merger.</p>
            </AgreementSection>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const ViewAccountModal = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null

  const AccountInfoField = ({ icon, label, value }) => (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex items-center text-muted-foreground text-sm mb-1">
        {icon}
        <span className="ml-2">{label}</span>
      </div>
      <p className="text-foreground font-semibold text-base">{value}</p>
    </div>
  )

  const InfoListSection = ({ label, items }) => (
    <div className="md:col-span-3 bg-muted p-4 rounded-lg">
      <p className="text-muted-foreground text-sm mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(items) ? items : typeof items === 'string' ? items.split(',').map(s => s.trim()).filter(Boolean) : []).map((item, index) => <Tag key={index} text={item} />)}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-foreground">Comprehensive Account View</h3>
            <p className="text-muted-foreground">
              {client.accountName} ({client.clientId})
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-3">Core Identifiers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AccountInfoField icon={<Briefcase size={16} />} label="Account Name" value={client.accountName} />
                <AccountInfoField icon={<User size={16} />} label="Account Number" value={client.accountNumber} />
                <AccountInfoField
                  icon={<Landmark size={16} />}
                  label="Principal Entity"
                  value={client.principalEntity}
                />
                <AccountInfoField icon={<FileCheck size={16} />} label="LEI" value={client.lei} />
                <AccountInfoField icon={<Globe size={16} />} label="Domicile" value={client.domicile} />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-3">Financial Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AccountInfoField
                  icon={<Scale size={16} />}
                  label="Threshold"
                  value={formatCurrencyDetailed(client.threshold, client.reportingCurrency)}
                />
                <AccountInfoField
                  icon={<DollarSign size={16} />}
                  label="Minimum Transfer Amount"
                  value={client.mta ? `${formatNumber(client.mta.amount)} ${client.mta.currency}` : "N/A"}
                />
                <AccountInfoField
                  icon={<Coins size={16} />}
                  label="Reporting Currency"
                  value={client.reportingCurrency}
                />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-3">Operational Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AccountInfoField
                  icon={<Phone size={16} />}
                  label="Contact Phone"
                  value={client.contact?.phone ?? client["contact.phone"] ?? "N/A"}
                />
                <AccountInfoField
                  icon={<MailIcon size={16} />}
                  label="Contact Email"
                  value={client.contact?.email ?? client["contact.email"] ?? "N/A"}
                />
                <AccountInfoField
                  icon={<Clock size={16} />}
                  label="Notification Time"
                  value={client.notificationTime}
                />
                <AccountInfoField
                  icon={<Calendar size={16} />}
                  label="Settlement Period"
                  value={client.settlementPeriod}
                />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-3">Arrangements</h4>
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
                <InfoListSection label="Eligible Collateral" items={client.assets} />
                <InfoListSection label="Accepted Currencies" items={client.currencies} />
                <InfoListSection label="Holiday Calendars" items={client.holidays} />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const BookingWindowModal = ({ isOpen, onClose, call, onBook }) => {
  const [bookedAmount, setBookedAmount] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const clientQuotedAmount = useMemo(() => {
    if (!call) return 0
    if (call.id === "MC-9506") return 700000
    if (call.id === "MC-9509") return 0
    if (call.id === "MC-9513") return 390000
    return call.callAmount
  }, [call])

  const emailBody = useMemo(() => {
    if (!call) return ""
    const clientContact =
      clientDetailsData.find((c) => c.clientId === call.clientId)?.contact?.email || "operations@client.com"
    const isDiscrepancy = clientQuotedAmount !== call.callAmount

    let body
    if (isDiscrepancy) {
      body = `We acknowledge receipt of the referenced margin call. However, we are showing a different MTM and will be paying the amount of **${formatCurrencyDetailed(clientQuotedAmount, call.currency)}**.\n\nPlease see our attached MTM report for details. We can schedule a call to resolve the difference.\n\n`
    } else {
      body = `We acknowledge receipt of the referenced margin call and agree with the calculated amount.\n\nWe will instruct payment for the full **${formatCurrencyDetailed(clientQuotedAmount, call.currency)}** today. Value date will be ${formatDate(new Date())}.\n\n`
    }

    return `**From:** ${clientContact}\n**Subject:** Re: Margin Call ${call.id} - Our Ref: ${call.clientId.substring(3)}-XYZ\n\nHi Barclays Team,\n\n${body}Regards,\n${call.clientId} Operations`
  }, [call, clientQuotedAmount])

  useEffect(() => {
    if (call) {
      setBookedAmount(clientQuotedAmount.toString())
    }
    setErrorMessage("")
  }, [call, clientQuotedAmount])

  if (!isOpen || !call) return null

  const handleBook = () => {
    const amount = Number.parseFloat(bookedAmount)
    if (isNaN(amount) || amount < 0) {
      setErrorMessage("Please enter a valid, non-negative amount.")
      return
    }

    const difference = call.callAmount - amount

    let bookingStatus
    let disputeAmount
    let disputeReason = null

    if (difference > 0.01) {
      bookingStatus = "Partially Disputed"
      disputeAmount = difference
      disputeReason = "Partial booking based on client communication."
    } else {
      bookingStatus = "Fully Booked"
      disputeAmount = 0
    }

    onBook({
      callId: call.id,
      bookedAmount: amount,
      bookingStatus,
      disputeAmount,
      disputeReason,
    })
    onClose()
  }

  const BookingScorecard = ({ title, value, currency, className }) => (
    <div className={`p-4 rounded-xl text-center ${className}`}>
      <p className="text-sm text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-white mt-2">{formatCurrencyDetailed(value, currency)}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">
            Manual Booking for {call.clientId} ({call.id})
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 max-h-[75vh] overflow-y-auto">
          <div className="md:col-span-3 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <BookingScorecard
                title="Required Margin"
                value={call.callAmount}
                currency={call.currency}
                className="bg-blue-900/40"
              />
              <BookingScorecard
                title="Client Quoted"
                value={clientQuotedAmount}
                currency={call.currency}
                className="bg-purple-900/40"
              />
            </div>
            <div className="bg-gray-800/70 p-4 rounded-xl border border-gray-700/50">
              <h4 className="font-semibold text-gray-300 mb-3 flex items-center">
                <Mail size={18} className="mr-2" /> Client Communication
              </h4>
              <div
                className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-400 space-y-2 whitespace-pre-wrap font-mono"
                dangerouslySetInnerHTML={{
                  __html: emailBody.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>'),
                }}
              ></div>
            </div>
          </div>
          <div className="md:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 flex flex-col justify-center">
            <h4 className="font-semibold text-white text-lg mb-4">Enter Booking Amount</h4>
            <p className="text-sm text-gray-400 mb-2">Enter the amount to book based on the client's agreement.</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{call.currency}</span>
              <input
                type="number"
                value={bookedAmount}
                onChange={(e) => setBookedAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-900/50 border border-gray-600 text-white text-xl font-semibold rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 pl-14 text-right"
              />
            </div>
            {errorMessage && <p className="text-red-400 text-xs mt-2">{errorMessage}</p>}

            <div className="mt-4 pt-4 border-t border-gray-700">
              {Number.parseFloat(bookedAmount) < call.callAmount && (
                <div className="p-3 mb-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-center">
                  <p className="text-yellow-300 text-sm font-semibold">
                    This will create a dispute of{" "}
                    {formatCurrencyDetailed(call.callAmount - (Number.parseFloat(bookedAmount) || 0), call.currency)}.
                  </p>
                </div>
              )}
              <button
                onClick={handleBook}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Book Margin
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Dashboard Component ---
const getISODate = (date) => date.toISOString().split("T")[0]
const DEFAULT_END_DATE = getISODate(fixedTodayForDashboard)
const defaultStartDateObj = new Date(fixedTodayForDashboard)
defaultStartDateObj.setDate(defaultStartDateObj.getDate() - 30)
const DEFAULT_START_DATE = getISODate(defaultStartDateObj)

const CollateralDashboard = () => {
  const [filters, setFilters] = useState({
    clientId: "all",
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  })
  const [displayData, setDisplayData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insightModal, setInsightModal] = useState({ isOpen: false, topic: "", data: null })
  const [dataSource, setDataSource] = useState<'mock' | 'firebase'>('mock')
  const [showFirebaseTools, setShowFirebaseTools] = useState(false)

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
  }

  const applyFilters = () => {
    setLoading(true)
    setTimeout(() => {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)

      const dateDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))

      const isDefaultView =
        filters.clientId === "all" && filters.startDate === DEFAULT_START_DATE && filters.endDate === DEFAULT_END_DATE

      if (isDefaultView) {
        const totalClients = 500
        const dailyAvgCalls = 563
        const processedCalls = dailyAvgCalls * 30
        const dailyAvgValue = 8000000
        const totalValue = dailyAvgValue * 30
        const settlementRate = 95.2
        const collateralTotal = 8800000000
        const cashTotal = collateralTotal * 0.6
        const bondTotal = collateralTotal * 0.4

        const specialCaseCalls = Array.from({ length: processedCalls }, (_, i) => {
          const isSettled = Math.random() < settlementRate / 100
          const status = isSettled ? "Settled" : Math.random() > 0.5 ? "Failed" : "Disputed"
          const failReasons = [
            "Incorrect SSI",
            "Insufficient Funds/Securities",
            "Late Matching",
            "Market Holiday",
            "Other",
          ]

          return {
            id: `MC-SPEC-${1000 + i}`,
            clientId: clientIds[Math.floor(Math.random() * clientIds.length)],
            date: generateRandomDate(startDate, endDate),
            value: totalValue / processedCalls,
            type: Math.random() > 0.2 ? "Electronic" : "Manual",
            direction: Math.random() > 0.5 ? "Barclays Call" : "Client Call",
            status: status,
            assetType: Math.random() > 0.4 ? "Cash" : "Bond",
            failReason: status === "Failed" ? failReasons[Math.floor(Math.random() * failReasons.length)] : null,
          }
        })

        const getBreakdown = (key) =>
          specialCaseCalls.reduce((acc, call) => {
            acc[call[key]] = (acc[call[key]] || 0) + 1
            return acc
          }, {})
        const failReasons = specialCaseCalls
          .filter((c) => c.status === "Failed")
          .reduce((acc, call) => {
            acc[call.failReason] = (acc[call.failReason] || 0) + 1
            return acc
          }, {})
        const cashFails = specialCaseCalls.filter((c) => c.status === "Failed" && c.assetType === "Cash").length
        const bondFails = specialCaseCalls.filter((c) => c.status === "Failed" && c.assetType === "Bond").length
        const barclaysDisputes = specialCaseCalls.filter(
          (c) => c.status === "Disputed" && c.direction === "Barclays Call",
        ).length
        const clientDisputes = specialCaseCalls.filter(
          (c) => c.status === "Disputed" && c.direction === "Client Call",
        ).length

        setDisplayData({
          processedCalls,
          totalValue,
          settlementRate: settlementRate.toFixed(1),
          breakdowns: {
            type: getBreakdown("type"),
            direction: getBreakdown("direction"),
            status: getBreakdown("status"),
            failReasons,
            cashFails,
            bondFails,
            barclaysDisputes,
            clientDisputes,
          },
          performance: {
            dailyAvgCalls: dailyAvgCalls.toFixed(0),
            dailyAvgValue,
          },
          collateral: {
            total: collateralTotal,
            cash: cashTotal,
            bonds: bondTotal,
            cashBreakdown: { USD: cashTotal * 0.6, EUR: cashTotal * 0.25, GBP: cashTotal * 0.15 },
            bondBreakdown: {
              "Government Bonds": bondTotal * 0.65,
              "Corporate Bonds": bondTotal * 0.25,
              "Other Securities": bondTotal * 0.1,
            },
          },
          newClients: Math.floor(processedCalls / 1000),
          totalClients,
        })
      } else {
        const filteredCalls = allMarginCalls.filter((call) => {
          const callDate = new Date(call.date)
          const clientMatch = filters.clientId === "all" || call.clientId === filters.clientId
          const dateMatch = callDate >= startDate && callDate <= endDate
          return clientMatch && dateMatch
        })
        const totalValue = filteredCalls.reduce((acc, call) => acc + call.value, 0)
        const settledCalls = filteredCalls.filter((c) => c.status === "Settled").length
        const failedCalls = filteredCalls.filter((c) => c.status === "Failed").length
        const settlementRate =
          settledCalls + failedCalls > 0 ? (settledCalls / (settledCalls + failedCalls)) * 100 : 100

        const getBreakdown = (key) =>
          filteredCalls.reduce((acc, call) => {
            acc[call[key]] = (acc[call[key]] || 0) + 1
            return acc
          }, {})

        const failReasons = filteredCalls
          .filter((c) => c.status === "Failed")
          .reduce((acc, call) => {
            acc[call.failReason] = (acc[call.failReason] || 0) + 1
            return acc
          }, {})
        const cashFails = filteredCalls.filter((c) => c.status === "Failed" && c.assetType === "Cash").length
        const bondFails = filteredCalls.filter((c) => c.status === "Failed" && c.assetType === "Bond").length
        const barclaysDisputes = filteredCalls.filter(
          (c) => c.status === "Disputed" && c.direction === "Barclays Call",
        ).length
        const clientDisputes = filteredCalls.filter(
          (c) => c.status === "Disputed" && c.direction === "Client Call",
        ).length

        const effectiveDateDiff = Math.max(1, dateDiff)
        const dailyAvgCalls = filteredCalls.length / effectiveDateDiff
        const dailyAvgValue = totalValue / effectiveDateDiff
        const collateralTotal = totalValue * 25 * (filters.clientId === "all" ? 1 : 0.1)
        const cashTotal = collateralTotal * 0.6
        const bondTotal = collateralTotal * 0.4
        const totalClientsOnboard = clientDetailsData.filter((c) => c.accountNumber).length

        setDisplayData({
          processedCalls: filteredCalls.length,
          totalValue,
          settlementRate: settlementRate.toFixed(1),
          breakdowns: {
            type: getBreakdown("type"),
            direction: getBreakdown("direction"),
            status: getBreakdown("status"),
            failReasons,
            cashFails,
            bondFails,
            barclaysDisputes,
            clientDisputes,
          },
          performance: { dailyAvgCalls: dailyAvgCalls.toFixed(1), dailyAvgValue },
          collateral: {
            total: collateralTotal,
            cash: cashTotal,
            bonds: bondTotal,
            cashBreakdown: { USD: cashTotal * 0.6, EUR: cashTotal * 0.25, GBP: cashTotal * 0.15 },
            bondBreakdown: {
              "Government Bonds": bondTotal * 0.65,
              "Corporate Bonds": bondTotal * 0.25,
              "Other Securities": bondTotal * 0.1,
            },
          },
          newClients: filters.clientId === "all" ? Math.floor(filteredCalls.length / 20) : 0,
          totalClients: totalClientsOnboard,
        })
      }
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    applyFilters()
  }, [])

  const exportFailsToCsv = () => {
    const headers = [
      "Call ID",
      "Client ID",
      "Date",
      "Value",
      "Type",
      "Direction",
      "Status",
      "Asset Type",
      "Fail Reason",
    ]
    const failsData = allMarginCalls.filter((c) => c.status === "Failed")

    const csvRows = failsData.map((call) => {
      const row = [
        call.id,
        call.clientId,
        formatDate(call.date),
        call.value,
        call.type,
        call.direction,
        call.status,
        call.assetType,
        call.failReason || "N/A",
      ]
      return row.join(",")
    })

    const csvString = [headers.join(","), ...csvRows].join("\n")

    downloadFile({
      data: csvString,
      fileName: "settlement_fails.csv",
      fileType: "text/csv",
    })
  }

  const downloadSampleCsv = (type) => {
    const timestamp = new Date().toISOString().split('T')[0]
    
    if (type === 'all') {
      // Generate sample margin call data
      const headers = [
        "Call ID",
        "Client ID",
        "Date",
        "Value",
        "Currency",
        "Type",
        "Direction",
        "Status",
        "Asset Type",
        "Fail Reason",
        "Notes"
      ]
      
      const sampleData = [
        {
          id: "MC-SAMPLE-001",
          clientId: "CID5962",
          date: "2025-07-15",
          value: 2500000,
          currency: "USD",
          type: "Electronic",
          direction: "Barclays Call",
          status: "Settled",
          assetType: "Cash",
          failReason: "",
          notes: "Standard margin call processed successfully"
        },
        {
          id: "MC-SAMPLE-002",
          clientId: "CID2693",
          date: "2025-07-16",
          value: 1800000,
          currency: "EUR",
          type: "Manual",
          direction: "Client Call",
          status: "Disputed",
          assetType: "Bond",
          failReason: "",
          notes: "Client disputed bond valuation"
        },
        {
          id: "MC-SAMPLE-003",
          clientId: "CID5299",
          date: "2025-07-17",
          value: 3200000,
          currency: "USD",
          type: "Electronic",
          direction: "Barclays Call",
          status: "Failed",
          assetType: "Cash",
          failReason: "Insufficient Funds",
          notes: "Client account had insufficient funds"
        },
        {
          id: "MC-SAMPLE-004",
          clientId: "CID4233",
          date: "2025-07-18",
          value: 950000,
          currency: "GBP",
          type: "Electronic",
          direction: "Client Call",
          status: "Settled",
          assetType: "Cash",
          failReason: "",
          notes: "Standard settlement completed"
        },
        {
          id: "MC-SAMPLE-005",
          clientId: "CID7506",
          date: "2025-07-19",
          value: 4100000,
          currency: "USD",
          type: "Manual",
          direction: "Barclays Call",
          status: "Pending",
          assetType: "Bond",
          failReason: "",
          notes: "Awaiting client confirmation"
        }
      ]

      const csvRows = sampleData.map((call) => {
        const row = [
          call.id,
          call.clientId,
          call.date,
          call.value,
          call.currency,
          call.type,
          call.direction,
          call.status,
          call.assetType,
          call.failReason || "N/A",
          call.notes
        ]
        return row.join(",")
      })

      const csvString = [headers.join(","), ...csvRows].join("\n")

      downloadFile({
        data: csvString,
        fileName: `sample_margin_calls_${timestamp}.csv`,
        fileType: "text/csv",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Collateral Dashboard</h2>
          <p className="text-muted-foreground">High-level overview of collateral management activities.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-8 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <User size={18} className="text-muted-foreground" />
          <select
            value={filters.clientId}
            onChange={(e) => handleFilterChange("clientId", e.target.value)}
            className="bg-background border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
          >
            <option value="all">All Client IDs</option>
            {clientIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar size={18} className="text-muted-foreground" />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="bg-background border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="bg-background border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2"
          />
        </div>
        <button
          onClick={applyFilters}
          disabled={loading}
          className="flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 text-sm rounded-lg transition-all duration-200 disabled:bg-primary/50 disabled:cursor-not-allowed"
        >
          {loading ? (
            "Loading..."
          ) : (
            <>
              <Filter size={16} className="mr-2" /> Apply Filters
            </>
          )}
        </button>
        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={() => setShowFirebaseTools(!showFirebaseTools)}
            className="flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 text-sm rounded-lg transition-all duration-200"
          >
            <Database size={16} className="mr-2" />
            {showFirebaseTools ? 'Hide' : 'Show'} Firebase Tools
          </button>
          <button
            onClick={() => downloadSampleCsv('all')}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2.5 text-sm rounded-lg transition-all duration-200"
          >
            <FileDown size={16} className="mr-2" />
            Download Sample CSV
        </button>
        </div>
      </div>

      {/* Firebase Tools Section */}
      {showFirebaseTools && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FirebaseDataToggle
            currentSource={dataSource}
            onDataSourceChange={setDataSource}
          />
          <CsvUploader />
        </div>
      )}

      <div className={`transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <KpiCard
            title="Margin Calls Processed"
            value={displayData ? formatNumber(displayData.processedCalls) : "..."}
            subValue={displayData ? `${formatCurrencyForScorecard(displayData.totalValue)} USD` : "..."}
            icon={<TrendingUp className="text-green-400" />}
          />
          <KpiCard
            title="Collateral Holding Value"
            value={displayData ? formatCurrencyForScorecard(displayData.collateral.total) : "..."}
            subValue={`Cash/Bonds`}
            icon={<Shield className="text-blue-400" />}
          />
          <KpiCard
            title="New Clients Onboarded"
            value={displayData ? displayData.newClients : "..."}
            subValue="In selected period"
            icon={<Users className="text-indigo-400" />}
          />
          <KpiCard
            title="On-Time Settlement Rate"
            value={displayData ? `${displayData.settlementRate}%` : "..."}
            subValue="Target: >95%"
            icon={<CheckCircle className="text-green-400" />}
          />
          <KpiCard
            title="Total Clients Onboard"
            value={displayData ? formatNumber(displayData.totalClients) : "..."}
            subValue="All active clients"
            icon={<Briefcase className="text-purple-400" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <RectangleStatCard
            title="Barclays Dispute"
            value={displayData ? formatNumber(displayData.breakdowns.barclaysDisputes) : "..."}
            icon={<AlertTriangle size={24} className="text-yellow-400" />}
          />
          <RectangleStatCard
            title="Client Dispute"
            value={displayData ? formatNumber(displayData.breakdowns.clientDisputes) : "..."}
            icon={<AlertTriangle size={24} className="text-orange-400" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Margin Call Breakdown</h3>
              <button 
                onClick={() => setInsightModal({ isOpen: true, topic: "Margin Call Breakdown", data: displayData?.breakdowns })}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <Sparkles size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <BreakdownItem
                label="Electronic (Automated)"
                value={displayData ? formatNumber(displayData.breakdowns.type?.Electronic) : "..."}
              />
              <BreakdownItem
                label="Manual"
                value={displayData ? formatNumber(displayData.breakdowns.type?.Manual) : "..."}
              />
              <BreakdownItem
                label="Barclays Calls"
                value={displayData ? formatNumber(displayData.breakdowns.direction["Barclays Call"]) : "..."}
              />
              <BreakdownItem
                label="Client Calls"
                value={displayData ? formatNumber(displayData.breakdowns.direction["Client Call"]) : "..."}
              />
              <BreakdownItem
                label="Disputed Calls"
                value={displayData ? formatNumber(displayData.breakdowns.status.Disputed) : "..."}
                isAlert
              />
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-foreground mb-4">Collateral Holdings Breakdown</h3>
              <div className="flex items-center space-x-4">
                <DownloadDropdown
                  onExport={(type) => {
                    if (!displayData) return
                    
                    let data = ""
                    const timestamp = new Date().toISOString().split('T')[0]
                    
                    if (type === "csv") {
                      // CSV format
                      data = "Category,Type,Amount,Currency\n"
                      data += `Cash Holdings,Total,${displayData.collateral.cash.toLocaleString()},USD\n`
                      Object.entries(displayData.collateral.cashBreakdown).forEach(([currency, amount]) => {
                        data += `Cash Holdings,${currency},${amount.toLocaleString()},USD\n`
                      })
                      data += `Bond Holdings,Total,${displayData.collateral.bonds.toLocaleString()},USD\n`
                      Object.entries(displayData.collateral.bondBreakdown).forEach(([type, amount]) => {
                        data += `Bond Holdings,${type},${amount.toLocaleString()},USD\n`
                      })
                      
                      downloadFile({ 
                        data, 
                        fileName: `collateral_holdings_${timestamp}.csv`, 
                        fileType: "text/csv" 
                      })
                    } else if (type === "pdf") {
                      // Generate proper PDF using jsPDF
                      const { jsPDF } = require('jspdf')
                      const doc = new jsPDF()
                      
                      // Add title
                      doc.setFontSize(20)
                      doc.setFont('helvetica', 'bold')
                      doc.text('Collateral Holdings Breakdown Report', 20, 30)
                      
                      // Add timestamp
                      doc.setFontSize(12)
                      doc.setFont('helvetica', 'normal')
                      doc.text(`Generated: ${timestamp}`, 20, 45)
                      
                      // Add Cash Holdings section
                      doc.setFontSize(16)
                      doc.setFont('helvetica', 'bold')
                      doc.text('Cash Holdings', 20, 65)
                      doc.setFontSize(12)
                      doc.setFont('helvetica', 'normal')
                      doc.text(`Total: ${formatCurrency(displayData.collateral.cash)}`, 30, 80)
                      
                      let yPos = 95
                      Object.entries(displayData.collateral.cashBreakdown).forEach(([currency, amount]) => {
                        doc.text(`${currency}: ${formatCurrency(amount)}`, 40, yPos)
                        yPos += 10
                      })
                      
                      // Add Bond Holdings section
                      yPos += 10
                      doc.setFontSize(16)
                      doc.setFont('helvetica', 'bold')
                      doc.text('Bond Holdings', 20, yPos)
                      doc.setFontSize(12)
                      doc.setFont('helvetica', 'normal')
                      yPos += 15
                      doc.text(`Total: ${formatCurrency(displayData.collateral.bonds)}`, 30, yPos)
                      
                      yPos += 15
                      Object.entries(displayData.collateral.bondBreakdown).forEach(([type, amount]) => {
                        doc.text(`${type}: ${formatCurrency(amount)}`, 40, yPos)
                        yPos += 10
                      })
                      
                      // Add total
                      yPos += 10
                      doc.setFontSize(14)
                      doc.setFont('helvetica', 'bold')
                      doc.text(`Total Collateral: ${formatCurrency(displayData.collateral.total)}`, 20, yPos)
                      
                      // Save the PDF
                      doc.save(`collateral_holdings_${timestamp}.pdf`)
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-semibold mb-2">
                  Cash Holdings ({displayData ? formatCurrency(displayData.collateral.cash) : "..."})
                </p>
                {displayData &&
                  Object.entries(displayData.collateral.cashBreakdown).map(([k, v]) => (
                    <BreakdownItem key={k} label={k} value={formatCurrency(v)} />
                  ))}
              </div>
              <div>
                <p className="text-green-600 font-semibold mb-2">
                  Bond Holdings ({displayData ? formatCurrency(displayData.collateral.bonds) : "..."})
                </p>
                {displayData &&
                  Object.entries(displayData.collateral.bondBreakdown).map(([k, v]) => (
                    <BreakdownItem key={k} label={k} value={formatCurrency(v)} />
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
              <button 
                onClick={() => setInsightModal({ isOpen: true, topic: "Performance Metrics", data: displayData?.performance })}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <Sparkles size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <InfoCard
                title={`Daily Avg. Calls (Selected Period)`}
                value={displayData ? displayData.performance.dailyAvgCalls : "..."}
              />
              <InfoCard
                title={`Daily Avg. Value (Selected Period)`}
                value={displayData ? formatCurrency(displayData.performance.dailyAvgValue) : "..."}
              />
            </div>
          </div>
          <div className="lg:col-span-3 bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-red-600">Settlement Fails Breakdown</h3>
              <button
                onClick={exportFailsToCsv}
                className="flex items-center justify-center bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
              >
                <FileDown size={16} className="mr-2" />
                Review All Fails
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <InfoCard
                  title="Total Fails"
                  value={displayData ? formatNumber(displayData.breakdowns.status.Failed) : "..."}
                  valueClass="text-red-600"
                />
                <InfoCard
                  title="Cash Fails"
                  value={displayData ? formatNumber(displayData.breakdowns.cashFails) : "..."}
                  valueClass="text-red-600"
                />
                <InfoCard
                  title="Bond Fails"
                  value={displayData ? formatNumber(displayData.breakdowns.bondFails) : "..."}
                  valueClass="text-red-600"
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Top Fail Reasons</h4>
                <div className="space-y-2">
                  {displayData &&
                    Object.entries(displayData.breakdowns.failReasons)
                      .sort(([, a], [, b]) => b - a)
                      .map(([reason, count]) => <FailReasonItem key={reason} reason={reason} count={count} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InsightModal
        isOpen={insightModal.isOpen}
        onClose={() => setInsightModal({ isOpen: false, topic: "", data: null })}
        topic={insightModal.topic}
        data={insightModal.data}
      />
    </div>
  )
}

// --- Client Information Component ---
const ClientActionsDropdown = ({ client, onEdit, onViewAccount, onViewAgreement, onSendToChecker }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <MoreHorizontal size={18} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-10">
          <button
            onClick={() => {
              onViewAccount(client)
              setIsOpen(false)
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <Briefcase size={14} /> View Account
          </button>
          <button
            onClick={() => {
              onEdit(client)
              setIsOpen(false)
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <Edit size={14} /> Edit Parameters
          </button>
          <button
            onClick={() => {
              onViewAgreement(client)
              setIsOpen(false)
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <FileCheck size={14} /> View Agreement
          </button>
          <div className="border-t border-border my-1"></div>
          <button
            onClick={() => {
              onSendToChecker(client)
              setIsOpen(false)
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            <ArrowRight size={14} /> Send to Checker
          </button>
        </div>
      )}
    </div>
  )
}

// Helper to robustly display array or CSV string fields
function displayArrayField(field) {
  if (Array.isArray(field)) return field.join(", ");
  if (typeof field === "string") return field.split(",").map(s => s.trim()).filter(Boolean).join(", ");
  return "";
}

const ClientInformation = () => {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [agreementModalOpen, setAgreementModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [clients, setClients] = useState(clientDetailsData.filter((c) => c.accountNumber))
  const [activeClient, setActiveClient] = useState(clients[0])
  const [confirmation, setConfirmation] = useState({ show: false, message: "" })
  const [showUpload, setShowUpload] = useState(false)
  const [showFirebaseTable, setShowFirebaseTable] = useState(false)
  const { data: firebaseClients, loading: firebaseLoading, error: firebaseError } = useRealtimeCollection<any>('unified_data')

  const initialFilters = {
    searchQuery: "",
    domicile: "all",
    currency: "all",
  }
  const [filters, setFilters] = useState(initialFilters)

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const uniqueDomiciles = useMemo(() => [...new Set(clients.map((c) => c.domicile).filter(Boolean))], [clients])
  const uniqueCurrencies = useMemo(() => [...new Set(clients.flatMap((c) => c.currencies).filter(Boolean))], [clients])

  // Use firebaseClients as the data source if showFirebaseTable is true, else use mock data
  const displayClients = showFirebaseTable ? firebaseClients : clients

  // Update filteredClients to use displayClients
  const filteredClients = useMemo(() => {
    return displayClients.filter((client) => {
      const searchMatch =
        filters.searchQuery === "" ||
        client.accountName?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        client.accountNumber?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        client.clientId?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        client.lei?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      const domicileMatch = filters.domicile === "all" || client.domicile === filters.domicile
      const currencyMatch =
        filters.currency === "all" || (client.currencies && client.currencies.includes(filters.currency))
      return searchMatch && domicileMatch && currencyMatch
    })
  }, [displayClients, filters])

  const handleEditClick = (client) => {
    setActiveClient(client)
    setEditModalOpen(true)
  }

  const handleViewAccountClick = (client) => {
    setActiveClient(client)
    setAccountModalOpen(true)
  }

  const handleViewAgreementClick = (client) => {
    setActiveClient(client)
    setAgreementModalOpen(true)
  }

  const handleSendToChecker = (client) => {
    setConfirmation({ show: true, message: `Account ${client.accountName} sent to checker.` })
    setTimeout(() => {
      setConfirmation({ show: false, message: "" })
    }, 3000)
  }

  const handleCreateClient = (newClient) => {
    setClients((prevClients) => [newClient, ...prevClients])
    setConfirmation({ show: true, message: `Account ${newClient.accountName} created successfully.` })
    setTimeout(() => {
      setConfirmation({ show: false, message: "" })
    }, 3000)
  }

  // Update handleSaveClient to update Firestore if in Firebase mode
  const handleSaveClient = async (updatedClient) => {
    if (showFirebaseTable && updatedClient.id) {
              // Update Firestore
        const { id, ...rest } = updatedClient
        const ref = doc(db, 'unified_data', id)
        await updateDoc(ref, rest)
    } else {
      // Update local state
    const newClients = clients.map((c) => (c.clientId === updatedClient.clientId ? updatedClient : c))
    setClients(newClients)
    if (activeClient && activeClient.clientId === updatedClient.clientId) {
      setActiveClient(updatedClient)
      }
    }
  }

  const handleSaveToUnifiedData = async () => {
    if (!firebaseClients || firebaseClients.length === 0) {
      setConfirmation({ show: true, message: "No data to save. Please load data from Firebase first." })
      setTimeout(() => setConfirmation({ show: false, message: "" }), 3000)
      return
    }

    try {
      const batch = writeBatch(db)
      firebaseClients.forEach((client) => {
        const { id, ...clientDataWithoutId } = client
        const docRef = doc(collection(db, 'unified_data'))
        batch.set(docRef, clientDataWithoutId)
      })
      
      await batch.commit()
      setConfirmation({ show: true, message: `Successfully saved ${firebaseClients.length} records to unified_data collection.` })
      setTimeout(() => setConfirmation({ show: false, message: "" }), 3000)
    } catch (error) {
      console.error('Error saving to unified_data:', error)
      setConfirmation({ show: true, message: "Error saving data. Please try again." })
      setTimeout(() => setConfirmation({ show: false, message: "" }), 3000)
    }
  }

  const handleExport = (type) => {
    const data = filteredClients
    if (type === "csv") {
      const headers = [
        "Client ID",
        "Account Name",
        "Account Number",
        "LEI",
        "Domicile",
        "MTA",
        "Eligible Collateral",
        "Currencies",
        "Holiday Calendar",
      ]
      const csvData = data
        .map((client) =>
          [
            `"${client.clientId}"`,
            `"${client.accountName}"`,
            `"${client.accountNumber}"`,
            `"${client.lei}"`,
            `"${client.domicile}"`,
            `"${client.mta.amount} ${client.mta.currency}"`,
            `"${client.assets.join(", ")}"`,
            `"${client.currencies.join(", ")}"`,
            `"${client.holidays.join(", ")}"`,
          ].join(","),
        )
        .join("\n")
      downloadFile({
        data: `${headers.join(",")}\n${csvData}`,
        fileName: "client_arrangements.csv",
        fileType: "text/csv",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Client Module</h2>
          <p className="text-gray-400 mt-1">Create, edit, and view client collateral arrangements.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <PlusCircle size={14} className="mr-2" /> Create Account
          </button>
          <button
            onClick={handleSaveToUnifiedData}
            disabled={!showFirebaseTable || !firebaseClients || firebaseClients.length === 0}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:bg-muted disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <Save size={14} className="mr-2" /> Save to Unified Data
          </button>
          <button
            onClick={() => setShowUpload((prev) => !prev)}
            className="flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <FileDown size={14} className="mr-2" /> Data Upload
          </button>
          <button
            onClick={() => setShowFirebaseTable((prev) => !prev)}
            className="flex items-center justify-center bg-orange-600 hover:bg-orange-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <Database size={14} className="mr-2" /> Source Data from Firebase
          </button>
          <DownloadDropdown onExport={handleExport} />
        </div>
      </div>
              {showUpload && (
          <div className="mb-6">
            <ClientInfoCsvUploader collectionName="unified_data" onUploadComplete={() => setShowUpload(false)} />
          </div>
        )}
      {showFirebaseTable && (
        <div className="mb-6">
          {firebaseLoading ? (
            <div className="text-center text-gray-400">Loading data from Firebase...</div>
          ) : firebaseError ? (
            <div className="text-center text-red-500">Error: {firebaseError}</div>
          ) : firebaseClients.length === 0 ? (
            <div className="text-center text-gray-400">No data found in Firebase. Upload a CSV to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {["id", ...Object.keys(firebaseClients[0] || {}).filter(col => col !== "id")].map((col) => (
                      <th key={col} className="px-6 py-3 text-left font-semibold text-gray-300 bg-gray-900/50 min-w-[180px] whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {firebaseClients.map((row, i) => (
                    <tr key={row.id || `firebase-row-${i}`} className="border-b border-gray-700 hover:bg-gray-800/60">
                      {["id", ...Object.keys(firebaseClients[0] || {}).filter(col => col !== "id")].map((col) => (
                        <td key={col} className="px-6 py-3 whitespace-nowrap min-w-[180px]">
                          <EditableCell
                            rowId={row.id}
                            field={col}
                            value={row[col]}
                                                          onSave={async (id, field, newValue) => {
                                const ref = doc(db, 'unified_data', id)
                                await updateDoc(ref, { [field]: newValue })
                              }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <div className="bg-card border border-border rounded-xl p-4 mb-8 flex flex-wrap items-center gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            name="searchQuery"
            placeholder="Search by name, ID, LEI..."
            value={filters.searchQuery}
            onChange={handleFilterChange}
            className="bg-background border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full pl-10 p-2.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-muted-foreground" />
          <select
            name="domicile"
            value={filters.domicile}
            onChange={handleFilterChange}
            className="bg-background border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
          >
            <option value="all">All Domiciles</option>
            {uniqueDomiciles.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-muted-foreground" />
          <select
            name="currency"
            value={filters.currency}
            onChange={handleFilterChange}
            className="bg-background border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
          >
            <option value="all">All Currencies</option>
            {uniqueCurrencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setFilters(initialFilters)}
          className="bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-2.5 text-sm rounded-lg"
        >
          Reset
        </button>
      </div>

      <div className="mt-8">
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-foreground uppercase bg-muted">
                <tr>
                  <th scope="col" className="px-3 py-2">
                    Account Name
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Principal Entity
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Account Number
                  </th>
                  <th scope="col" className="px-3 py-2">
                    LEI
                  </th>
                  <th scope="col" className="px-3 py-2">
                    MTA
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Eligible Collateral
                  </th>
                  <th scope="col" className="px-3 py-2 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredClients.map((client) => (
                  <tr key={client.clientId} className="border-b border-border hover:bg-muted/60">
                    <td scope="row" className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                      {client.accountName}
                    </td>
                    <td className="px-3 py-2">{client.principalEntity || "N/A"}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{client.accountNumber || "N/A"}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{client.lei || "N/A"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(() => {
                        // Handle different possible MTA structures
                        let mtaAmount, mtaCurrency;
                        
                        if (client.mta && typeof client.mta === 'object') {
                          mtaAmount = client.mta.amount;
                          mtaCurrency = client.mta.currency;
                        } else if (client["mta.amount"] && client["mta.currency"]) {
                          mtaAmount = client["mta.amount"];
                          mtaCurrency = client["mta.currency"];
                        } else if (typeof client.mta === 'string' && client.mta.includes(' ')) {
                          const parts = client.mta.split(' ');
                          mtaAmount = parseFloat(parts[0]);
                          mtaCurrency = parts[1];
                        }
                        
                        return mtaAmount ? `${formatNumber(mtaAmount)} ${mtaCurrency || ""}` : "N/A";
                      })()}
                    </td>
                    <td className="px-3 py-2">{displayArrayField(client.assets)}</td>
                    <td className="px-3 py-2 text-center">
                      <ClientActionsDropdown
                        client={client}
                        onEdit={handleEditClick}
                        onViewAccount={handleViewAccountClick}
                        onViewAgreement={handleViewAgreementClick}
                        onSendToChecker={handleSendToChecker}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirmation.show && (
        <div className="fixed bottom-5 right-5 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm shadow-lg z-50 transition-opacity duration-300">
          {confirmation.message}
        </div>
      )}

      <EditClientModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        client={activeClient}
        onSave={handleSaveClient}
      />
      <ViewAccountModal isOpen={accountModalOpen} onClose={() => setAccountModalOpen(false)} client={activeClient} />
      <ViewAgreementModal isOpen={agreementModalOpen} onClose={() => setAgreementModalOpen(false)} client={activeClient} />
      <CreateAccountModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateClient}
      />
    </div>
  )
}

// --- Workflow Management Component ---
const ClientContextualSummary = ({ clientId, clientSummaryData }) => {
  const clientData = clientSummaryData.find((c) => c.clientId === clientId)
  if (!clientData) return null

  const getSettlementStatusClass = (status) => {
    switch (status) {
      case "Settled":
        return "text-green-600"
      case "Partially Settled":
        return "text-yellow-600"
      case "In Progress":
        return "text-blue-600"
      default:
        return "text-muted-foreground"
    }
  }
  const getDisputeStatusClass = (status) => (status === "Yes" ? "text-red-600" : "text-green-600")

  const disputeText =
    clientData.disputeStatus === "Yes" ? `Yes (${formatCurrencyDetailed(clientData.disputedAmount, "USD")})` : "No"

  return (
    <div className="bg-card p-4 rounded-lg mt-4 border border-border">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Client-wide Summary (Today)</h4>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
        <InfoField label="Total Exposure" value={formatCurrency(clientData.exposure)} />
        <InfoField label="MTA" value={formatCurrencyDetailed(clientData.mta.amount, clientData.mta.currency)} />
        <InfoField label="Agreed Amt" value={formatCurrency(clientData.agreedAmount)} valueClass="text-green-600" />
        <InfoField label="Value Date" value={clientData.valueDate} />
        <InfoField label="Disputed?" value={disputeText} valueClass={getDisputeStatusClass(clientData.disputeStatus)} />
        <InfoField
          label="Settlement"
          value={clientData.settlementStatus}
          valueClass={getSettlementStatusClass(clientData.settlementStatus)}
        />
      </div>
    </div>
  )
}

const MarginCallWorkflow = () => {
  const [collectionName, setCollectionName] = useState('unified_data')
  const { data: firebaseData, loading: firebaseLoading, error: firebaseError, getUniqueFields } = useWorkflowCollateralData(collectionName)
  const [calls, setCalls] = useState(marginCallData)
  const [activeTab, setActiveTab] = useState("All")
  const [selectedCall, setSelectedCall] = useState(calls[0])
  const [modals, setModals] = useState({ recalculate: false, email: false, booking: false })
  const [recalcStatus, setRecalcStatus] = useState("idle")
  const [isPortfolioVisible, setIsPortfolioVisible] = useState(false)
  const [confirmation, setConfirmation] = useState({ show: false, message: "" })
  const [showFirebaseTable, setShowFirebaseTable] = useState(false)
  const [showReconciliationUpload, setShowReconciliationUpload] = useState(false)

  // When showFirebaseTable is true, use Firebase data for the main UI if available
  useEffect(() => {
    if (showFirebaseTable && firebaseData.length > 0) {
      const mapped = firebaseData.map((row) => ({
        id: row.id,
        direction: row.direction || 'inbound',
        clientId: row.clientId || row.client_id || '',
        counterparty: row.counterparty || '',
        callAmount: row.callAmount || row.call_amount || 0,
        currency: row.currency || 'USD',
        exposure: row.exposure || 0,
        bookingStatus: row.bookingStatus || row.booking_status || 'Fully Booked',
        disputeAmount: row.disputeAmount || row.dispute_amount || 0,
        priceMovement: row.priceMovement || row.price_movement || 0,
        bookingType: row.bookingType || row.booking_type || 'Manual',
        disputeReason: row.disputeReason || row.dispute_reason || '',
        portfolio: row.portfolio || [],
      }))
      setCalls(mapped)
    } else {
      setCalls(marginCallData)
    }
  }, [showFirebaseTable, firebaseData])

  const clientSummaryData = useMemo(() => {
    const uniqueClientIds = [...new Set(calls.map((call) => call.clientId))]

    return uniqueClientIds.map((clientId) => {
      const clientCalls = calls.filter((call) => call.clientId === clientId)
      const clientInfo = clientDetailsData.find((c) => c.clientId === clientId) || {
        accountName: clientId,
        mta: { amount: 0, currency: "USD" },
      }

      const totalExposure = clientCalls.reduce((sum, call) => sum + call.exposure, 0)
      const totalCallAmount = clientCalls.reduce((sum, call) => sum + call.callAmount, 0)
      const totalDisputeAmount = clientCalls.reduce((sum, call) => sum + call.disputeAmount, 0)

      const numCalls = clientCalls.length
      const numSettled = clientCalls.filter((c) => c.bookingStatus === "Fully Booked").length

      let settlementStatus = "In Progress"
      if (numSettled === numCalls) settlementStatus = "Settled"
      else if (numSettled > 0) settlementStatus = "Partially Settled"

      return {
        clientId: clientId,
        clientName: clientInfo.accountName,
        exposure: totalExposure,
        mta: clientInfo.mta,
        callAmount: totalCallAmount,
        agreedAmount: totalCallAmount - totalDisputeAmount,
        disputedAmount: totalDisputeAmount,
        disputeStatus: totalDisputeAmount > 0 ? "Yes" : "No",
        valueDate: formatDate(new Date()),
        settlementStatus: settlementStatus,
      }
    })
  }, [calls])

  const handleModalOpen = (modal) => setModals((prev) => ({ ...prev, [modal]: true }))
  const handleModalClose = (modal) => setModals((prev) => ({ ...prev, [modal]: false }))

  const handleSelectCall = (call) => {
    setSelectedCall(call)
    setIsPortfolioVisible(false)
  }

  const handleRecalculate = () => {
    setRecalcStatus("processing")
    setTimeout(() => {
      setRecalcStatus("done")
      setTimeout(() => {
        handleModalClose("recalculate")
        setRecalcStatus("idle")
      }, 1500)
    }, 2000)
  }

  const handleBookMargin = (bookingDetails) => {
    setCalls((prevCalls) =>
      prevCalls.map((call) => {
        if (call.id === bookingDetails.callId) {
          return {
            ...call,
            bookingStatus: bookingDetails.bookingStatus,
            disputeAmount: bookingDetails.disputeAmount,
            disputeReason: bookingDetails.disputeReason,
          }
        }
        return call
      }),
    )
    setSelectedCall((prev) => ({
      ...prev,
      bookingStatus: bookingDetails.bookingStatus,
      disputeAmount: bookingDetails.disputeAmount,
      disputeReason: bookingDetails.disputeReason,
    }))
    setConfirmation({ show: true, message: `Margin call ${bookingDetails.callId} booked and sent to checker.` })
    setTimeout(() => setConfirmation({ show: false, message: "" }), 3000)
  }

  const getFilteredCalls = () => {
    if (activeTab === "All") return calls
    if (activeTab === "Inbound") return calls.filter((c) => c.direction === "inbound")
    if (activeTab === "Outbound") return calls.filter((c) => c.direction === "outbound")
    return calls
  }

  const filteredCalls = getFilteredCalls()

  const summary = useMemo(
    () =>
      calls.reduce(
        (acc, call) => {
          acc.totalCalls += 1
          acc.booked += call.callAmount - call.disputeAmount
          acc.disputed += call.disputeAmount
          if (call.direction === "inbound") acc.inboundCount++
          else acc.outboundCount++
          return acc
        },
        { totalCalls: 0, booked: 0, disputed: 0, inboundCount: 0, outboundCount: 0 },
      ),
    [calls],
  )

  const countByStatus = (status) => {
    if (status === "All") return summary.totalCalls
    if (status === "Inbound") return summary.inboundCount
    if (status === "Outbound") return summary.outboundCount
    return calls.filter((item) => item.bookingStatus === status).length
  }

  const BookingStatusTag = ({ status }) => {
    const statusStyles = {
      "Fully Booked": "bg-green-600 text-green-100",
      "Partially Disputed": "bg-yellow-600 text-yellow-100",
      "Fully Disputed": "bg-red-600 text-red-100",
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || "bg-gray-600 text-gray-100"}`}>
        {status}
      </span>
    )
  }

  const CallListItem = ({ call, onSelect, isSelected }) => (
    <button
      onClick={() => onSelect(call)}
      className={`w-full text-left p-4 border-b border-border hover:bg-muted transition-colors duration-150 ${isSelected ? "bg-primary/10" : ""}`}
    >
      <div className="flex justify-between items-center mb-1">
        <p className="font-bold text-foreground">{call.clientId}</p>
        <BookingStatusTag status={call.bookingStatus} />
      </div>
      <p className="text-xs text-muted-foreground mb-2">vs {call.counterparty}</p>
      <div className="flex justify-start items-baseline text-sm">
        <p className="text-primary font-semibold">
          {call.currency} {formatNumber(call.callAmount)}
        </p>
      </div>
    </button>
  )

  const InvestigationActions = () => (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-yellow-600 mb-3">Investigation Actions</h4>
      <div className="flex space-x-3">
        <button
          onClick={() => handleModalOpen("recalculate")}
          className="flex-1 flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground font-semibold px-3 py-2 text-sm rounded-lg transition-all duration-200"
        >
          <RefreshCw size={14} className="mr-2" />
          Recalculate
        </button>
        <button
          onClick={() => handleModalOpen("email")}
          className="flex-1 flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground font-semibold px-3 py-2 text-sm rounded-lg transition-all duration-200"
        >
          <Mail size={14} className="mr-2" />
          Email Client
        </button>
      </div>
    </div>
  )

  const PortfolioTable = ({ portfolio, currency, isDisputed, direction }) => {
    const netPnl = portfolio.reduce((acc, trade) => acc + trade.pnl, 0)
    const payableBy = direction === "inbound" ? "BARCLAYS" : "CLIENT"

    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <div />
                      <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Green PnL:</span> Payable by {direction === "inbound" ? "BARCLAYS" : "CLIENT"} |{" "}
              <span className="text-red-600">Red PnL:</span> Payable by {direction === "inbound" ? "BARCLAYS" : "CLIENT"}
            </p>
        </div>
        <div
          className={`bg-muted rounded-lg overflow-hidden ${isDisputed ? "border-2 border-yellow-500/50" : ""}`}
        >
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground uppercase">
              <tr>
                <th className="p-3">Trade ID</th>
                <th className="p-3 text-right">PnL</th>
                <th className="p-3 text-right">Price Change</th>
                <th className="p-3 text-right">Payable By</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((trade) => (
                <tr key={trade.tradeId} className="border-b border-border">
                  <td className="p-3 font-mono">{trade.tradeId}</td>
                  <td className={`p-3 text-right font-mono ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrencyDetailed(trade.pnl, currency)}
                  </td>
                  <td
                    className={`p-3 text-right font-mono ${trade.priceChange >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {trade.priceChange.toFixed(2)}%
                  </td>
                  <td className={`p-3 text-right font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {direction === "inbound" ? "BARCLAYS" : "CLIENT"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted font-bold">
              <tr className="border-t-2 border-border">
                <td className="p-3 text-foreground text-right" colSpan="1">
                  Net Difference:
                </td>
                <td className={`p-3 text-right font-mono ${netPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrencyDetailed(netPnl, currency)}
                </td>
                <td className="p-3 text-foreground text-right">Net Payable By:</td>
                <td className={`p-3 text-right font-medium ${netPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {payableBy}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  const TABS = ["All", "Inbound", "Outbound"]

  const TabButton = ({ name, count, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all duration-200 border-b-2 whitespace-nowrap ${isActive ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"}`}
    >
      {name}{" "}
      <span
        className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {count}
      </span>
    </button>
  )

  const DisputeInfo = ({ reason }) => (
    <div className="mt-4 p-4 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-r-lg">
      <h4 className="font-semibold text-yellow-300 flex items-center">
        <AlertTriangle size={16} className="mr-2" />
        Dispute Reason
      </h4>
      <p className="text-sm text-yellow-200 mt-1">{reason}</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-foreground">Workflow</h2>
        <div className="flex gap-2">
          <Button
            variant={showFirebaseTable ? 'default' : 'outline'}
            onClick={() => setShowFirebaseTable((prev) => !prev)}
            size="sm"
          >
            Source Data from Firebase
          </Button>
        </div>
      </div>
      
      {showFirebaseTable && (
        <div className="mb-6">
          {firebaseLoading ? (
            <div className="text-center text-muted-foreground">Loading data from Firebase...</div>
          ) : firebaseError ? (
            <div className="text-center text-red-500">Error: {firebaseError}</div>
          ) : firebaseData.length === 0 ? (
            <div className="text-center text-muted-foreground">No data found in Firebase. Upload a CSV to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {["id", ...Object.keys(firebaseData[0] || {}).filter(col => col !== "id")].map((col) => (
                      <th key={col} className="px-6 py-3 text-left font-semibold text-foreground bg-muted min-w-[180px] whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {firebaseData.map((row, i) => (
                    <tr key={row.id || i} className="border-b border-border hover:bg-muted/60">
                      {["id", ...Object.keys(firebaseData[0] || {}).filter(col => col !== "id")].map((col) => (
                        <td key={col} className="px-6 py-3 whitespace-nowrap min-w-[180px]">
                          <EditableCell
                            rowId={row.id}
                            field={col}
                            value={row[col]}
                            onSave={async (id, field, newValue) => {
                              const ref = doc(db, collectionName, id)
                              await updateDoc(ref, { [field]: newValue })
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Mock data UI always visible */}
      <h2 className="text-3xl font-bold text-foreground mb-2">Workflow Management</h2>
      <p className="text-muted-foreground mb-6">Live margin call activity for {formatDate(new Date())}.</p>
      <div className="flex items-start">
        <div className="w-1/3 bg-card rounded-l-xl border border-r-0 border-border flex flex-col h-[80vh]">
          <div className="border-b border-border flex flex-wrap justify-start p-1">
            {TABS.map((tab) => (
              <TabButton
                key={tab}
                name={tab === "All" ? `Margin Calls` : tab}
                count={countByStatus(tab)}
                isActive={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </div>
          <div className="flex-grow overflow-y-auto">
            {filteredCalls.map((call) => (
              <CallListItem
                key={call.id}
                call={call}
                onSelect={handleSelectCall}
                isSelected={selectedCall?.id === call.id}
              />
            ))}
          </div>
        </div>
        <div className="w-2/3 bg-card rounded-r-xl border border-border flex flex-col h-[80vh]">
          {selectedCall ? (
            <>
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{selectedCall.clientId}</h3>
                        <p className="text-muted-foreground font-mono">{selectedCall.id}</p>
                      </div>
                    {selectedCall.bookingType === "Manual" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleModalOpen("booking")}
                          className="flex items-center gap-2 bg-orange-600/20 text-orange-300 font-semibold px-3 py-1.5 text-xs rounded-lg border border-orange-500/50 hover:bg-orange-600/40 transition-colors"
                        >
                          <Clock size={14} />
                          Booking Window
                        </button>
                      </div>
                    )}
                  </div>
                  <BookingStatusTag status={selectedCall.bookingStatus} />
                </div>
                <ClientContextualSummary clientId={selectedCall.clientId} clientSummaryData={clientSummaryData} />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mt-4">
                  <InfoField label="Counterparty" value={selectedCall.counterparty} />
                  <InfoField label="Booking" value={selectedCall.bookingType} />
                  <InfoField
                    label="Total Exposure"
                    value={`${selectedCall.currency} ${formatNumber(selectedCall.exposure)}`}
                  />
                  <InfoField
                    label="Call Amount"
                    value={`${selectedCall.currency} ${formatNumber(selectedCall.callAmount)}`}
                    valueClass="text-blue-300"
                  />
                  {selectedCall.disputeAmount > 0 && (
                    <>
                      <InfoField
                        label="Disputed Amount"
                        value={`${selectedCall.currency} ${formatNumber(selectedCall.disputeAmount)}`}
                        valueClass="text-red-400"
                      />
                      <InfoField
                        label="Agreed Amount"
                        value={`${selectedCall.currency} ${formatNumber(selectedCall.callAmount - selectedCall.disputeAmount)}`}
                        valueClass="text-green-400"
                      />
                    </>
                  )}
                </div>
                {selectedCall.disputeReason && <DisputeInfo reason={selectedCall.disputeReason} />}
              </div>
              <div className="p-6 overflow-y-auto">
                {selectedCall.disputeAmount > 0 && <InvestigationActions />}
                {selectedCall.portfolio && selectedCall.portfolio.length > 0 ? (
                  <div className="mt-6">
                    <button
                      onClick={() => setIsPortfolioVisible(!isPortfolioVisible)}
                      className="w-full flex justify-between items-center p-3 bg-muted hover:bg-muted/80 rounded-lg text-left text-lg font-semibold text-foreground transition-colors"
                    >
                      <span>Portfolio Details</span>
                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-200 ${isPortfolioVisible ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isPortfolioVisible && (
                      <div className="mt-2 p-4 bg-muted/50 rounded-b-lg">
                                                  <PortfolioTable
                            portfolio={selectedCall.portfolio}
                            currency={selectedCall.currency}
                            isDisputed={selectedCall.disputeAmount > 0}
                            direction={selectedCall.direction}
                          />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground pt-10">
                    No portfolio details available for this margin call.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a margin call to view details</p>
            </div>
          )}
        </div>
      </div>
      {/* Firebase table appears below when requested */}
      {showFirebaseTable && (
        <div className="mt-10">
          <div className="mb-6 flex items-center gap-4">
            <label className="text-gray-300 text-sm font-medium">Collection:</label>
            <select
              className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
              value={collectionName}
              onChange={e => setCollectionName(e.target.value)}
            >
              <option value="workflow_collateraldata">workflow_collateraldata</option>
              <option value="collateral_dashboard">collateral_dashboard</option>
              <option value="equityClients">equityClients</option>
            </select>
            <WorkflowCsvUploader collectionName={collectionName} onUploadComplete={() => {}} />
          </div>
          {firebaseLoading ? (
            <div className="text-center text-gray-400">Loading workflow data from Firebase...</div>
          ) : firebaseError ? (
            <div className="text-center text-red-500">Error: {firebaseError}</div>
          ) : firebaseData.length === 0 ? (
            <div className="text-center text-gray-400">No workflow data found in Firebase. Upload a CSV to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {["id", ...getUniqueFields().filter(col => col !== "id")].map((col) => (
                      <th key={col} className="px-6 py-3 text-left font-semibold text-gray-300 bg-gray-900/50 min-w-[180px] whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {firebaseData.map((row, i) => (
                    <tr key={row.id || i} className="border-b border-gray-700 hover:bg-gray-800/60">
                      {["id", ...getUniqueFields().filter(col => col !== "id")].map((col) => (
                        <td key={col} className="px-6 py-3 whitespace-nowrap min-w-[180px]">
                          <EditableCell
                            rowId={row.id}
                            field={col}
                            value={row[col]}
                            onSave={async (id, field, newValue) => {
                              const ref = doc(db, collectionName, id)
                              await updateDoc(ref, { [field]: newValue })
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
        </div>
      )}
            </div>
      )}
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setShowReconciliationUpload((prev) => !prev)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
              >
          <FileDown size={14} className="mr-2" /> Data Upload
        </Button>
            </div>
      {showReconciliationUpload && (
        <div className="mb-6">
          <ReconciliationCsvUploader collectionName="reconciliation" onUploadComplete={() => setShowReconciliationUpload(false)} />
        </div>
      )}

      {/* Modals */}
      <BookingWindowModal
        isOpen={modals.booking}
        onClose={() => handleModalClose("booking")}
        call={selectedCall}
        onBook={handleBookMargin}
      />

      {/* Recalculate Modal */}
      {modals.recalculate && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-8 m-4 text-center">
            {recalcStatus === 'idle' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recalculate Exposure</h3>
                <p className="text-gray-400 mb-6">This will recalculate the exposure for {selectedCall?.clientId}</p>
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={handleRecalculate} 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg"
                  >
                    Start Recalculation
                  </button>
                  <button 
                    onClick={() => handleModalClose("recalculate")} 
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {recalcStatus === 'processing' && (
              <div>
                <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-white">Recalculating exposure...</p>
              </div>
            )}
            {recalcStatus === 'done' && (
              <div>
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-white">Recalculation complete. Values updated.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Client Modal */}
      {modals.email && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl p-8 m-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Email Client</h3>
              <button 
                onClick={() => handleModalClose("email")} 
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">To:</label>
                <input
                  type="email"
                  value={clientDetailsData.find((c) => c.clientId === selectedCall?.clientId)?.contact?.email || "operations@client.com"}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject:</label>
                <input
                  type="text"
                  value={`Margin Call Inquiry - ${selectedCall?.clientId} - ${selectedCall?.id}`}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message:</label>
                <textarea
                  rows={6}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  defaultValue={`Dear ${selectedCall?.clientId} Team,

We are writing regarding margin call ${selectedCall?.id} for ${selectedCall?.currency} ${formatNumber(selectedCall?.callAmount || 0)}.

${selectedCall?.disputeAmount > 0 ? 
  `There is currently a dispute of ${selectedCall?.currency} ${formatNumber(selectedCall?.disputeAmount)} regarding this margin call. We would like to discuss the valuation differences and work towards a resolution.` :
  `We would like to follow up on the status of this margin call and confirm receipt of the required collateral.`
}

Please contact us at your earliest convenience to discuss this matter.

Best regards,
Barclays Collateral Operations`}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => handleModalClose("email")} 
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleModalClose("email");
                    setConfirmation({ show: true, message: `Email sent to ${selectedCall?.clientId}` });
                    setTimeout(() => setConfirmation({ show: false, message: "" }), 3000);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2"
                >
                  <Send size={16} />
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Daily Activity Log Component ---
const DailyActivityLog = () => {
  const getISODateString = (date) => {
    const d = new Date(date)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString().split("T")[0]
  }

  const [activeRowId, setActiveRowId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [emailContent, setEmailContent] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  const [selectedDate, setSelectedDate] = useState(getISODateString(new Date()))
  const [filters, setFilters] = useState({ searchQuery: "", status: "all", direction: "all" })
  const [showUpload, setShowUpload] = useState(false)
  const [showFirebaseTable, setShowFirebaseTable] = useState(false)
  const { data: firebaseActivities, loading: firebaseLoading, error: firebaseError } = useRealtimeCollection<any>('unified_data')

  const formatMarginInMillions = (value) => {
    if (!value && value !== 0) return "$0.00M"
    const millions = value / 1000000
    return `$${millions.toFixed(2)}M`
  }

  const { currentDayStats, previousDayStats, displayData, uniqueStatuses } = useMemo(() => {
    const realTodayForCalc = new Date()
    realTodayForCalc.setHours(0, 0, 0, 0)

    const baseData = [
      { id: "TDR446", client: "Citibank", currency: "USD", dir: "Receivable", acct: "CITI-US-3456" },
      { id: "TDR983", client: "Goldman Sachs", currency: "USD", dir: "Receivable", acct: "GS-NY-9876" },
      { id: "TDR347", client: "Morgan Stanley", currency: "EUR", dir: "Receivable", acct: "MS-LN-1122" },
      { id: "TDR264", client: "Citibank", currency: "USD", dir: "Payable", acct: "BARC-LN-PAY-01" },
      { id: "TDR180", client: "Citibank", currency: "USD", dir: "Receivable", acct: "CITI-US-3456" },
      { id: "TDR604", client: "Citibank", currency: "GBP", dir: "Payable", acct: "BARC-LN-PAY-01" },
      { id: "TDR994", client: "Morgan Stanley", currency: "EUR", dir: "Receivable", acct: "MS-LN-1122" },
      { id: "TDR997", client: "JPMorgan", currency: "USD", dir: "Receivable", acct: "JPM-NY-5566" },
    ]

    const generateDailyData = (dateStr, daysAgo) => {
      if (daysAgo < 0) return []
      const data = baseData.map((item, index) => {
        const seed = (item.id.charCodeAt(5) + new Date(dateStr).getUTCDate() + index) % 10
        let status, pmtStatus, notes, req

        req = 3000000 + seed * 100000 + item.id.charCodeAt(4) * 1000 - daysAgo * 50000
        if (req < 500000) req = 500000 + seed * 100000

        if (daysAgo === 0) {
          if (seed < 3) {
            status = "Pending"
            pmtStatus = "Awaited client responses"
            notes = "Call issued. Awaiting client acknowledgement."
          } else if (seed < 6) {
            status = "Agreed"
            pmtStatus = "Payment in progress"
            notes = "Client agreed. Payment is being processed."
          } else if (seed < 8) {
            status = "Settled"
            pmtStatus = "Money Received"
            notes = "Collateral received and booked."
          } else {
            status = "Disputed"
            pmtStatus = "Dispute Investigation"
            notes = "Client disputing MTM valuation. Under review."
          }
        } else {
          if (seed < 2) {
            status = "Pending"
            pmtStatus = "Awaited client responses"
            notes = "Call issued late yesterday, pending acknowledgement."
          } else if (seed < 4) {
            status = "Agreed"
            pmtStatus = "Payment in queue"
            notes = "Client agreed late yesterday."
          } else if (seed < 6) {
            status = "Disputed"
            pmtStatus = "Awaiting resolution"
            notes = "Dispute raised by client yesterday."
          } else {
            status = "Settled"
            pmtStatus = "Money Received/Sent"
            notes = "Collateral settled on T+0."
          }
        }

        const history = []
        const d = new Date(dateStr)
        if (daysAgo <= 2) {
          const dMinus2 = new Date(d)
          dMinus2.setUTCDate(d.getUTCDate() - 2)
          history.push({ date: getISODateString(dMinus2), status: "Settled (T+0, 10:15 GMT)" })
        }
        if (daysAgo <= 1) {
          const dMinus1 = new Date(d)
          dMinus1.setUTCDate(d.getUTCDate() - 1)
          history.push({ date: getISODateString(dMinus1), status: "Agreed (11:00 GMT)" })
        }

        return { ...item, id: `${item.id.split("-")[0]}-${daysAgo}`, req, status, pmtStatus, notes, history }
      })

      const hasSettled = data.some((call) => call.status === "Settled")
      if (!hasSettled && data.length > 0) {
        data[0].status = "Settled"
        data[0].pmtStatus = "Money Received"
        data[0].notes = "Collateral received and booked."
      }
      return data
    }

    const calculateStats = (data) => {
      if (!data || data.length === 0) return { callsIssued: 0, marginRequired: 0, disputedCalls: 0, callsSettled: 0 }
      const marginRequired = data.reduce((sum, call) => {
        if (call.currency === "EUR") return sum + call.req * 1.08
        if (call.currency === "GBP") return sum + call.req * 1.25
        return sum + call.req
      }, 0)
      return {
        callsIssued: data.length,
        marginRequired,
        disputedCalls: data.filter((call) => call.status === "Disputed").length,
        callsSettled: data.filter((call) => call.status === "Settled").length,
      }
    }

    const currentDateObj = new Date(selectedDate)
    currentDateObj.setUTCHours(0, 0, 0, 0)

    const daysAgoCurrent = Math.round((realTodayForCalc.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24))
    const currentData = generateDailyData(selectedDate, daysAgoCurrent)

    const previousDate = new Date(selectedDate)
    previousDate.setDate(previousDate.getDate() - 1)
    const daysAgoPrevious = daysAgoCurrent + 1
    const previousData = generateDailyData(getISODateString(previousDate), daysAgoPrevious)

    const displayActivities = showFirebaseTable ? firebaseActivities : currentData;

    // Filtering and stats logic for displayActivities
    const filtered = displayActivities.filter((item) => {
      const searchMatch =
        filters.searchQuery === "" ||
        (item.client?.toLowerCase?.().includes(filters.searchQuery.toLowerCase())) ||
        (item.id?.toLowerCase?.().includes(filters.searchQuery.toLowerCase()))
      const statusMatch = filters.status === "all" || item.status === filters.status
      const directionMatch = filters.direction === "all" || item.dir === filters.direction
      return searchMatch && statusMatch && directionMatch
    })

    const uniqueStatusesForDay = [...new Set(displayActivities.map((c) => c.status))]

    return {
      currentDayStats: calculateStats(displayActivities),
      previousDayStats: calculateStats(previousData),
      displayData: filtered,
      uniqueStatuses: uniqueStatusesForDay,
    }
  }, [selectedDate, filters, showFirebaseTable, firebaseActivities])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "Settled":
        return "bg-green-600 text-green-100"
      case "Disputed":
        return "bg-yellow-600 text-yellow-100"
      case "Pending":
        return "bg-blue-600 text-blue-100"
      case "Agreed":
        return "bg-cyan-600 text-cyan-100"
      case "Overdue":
        return "bg-red-600 text-red-100"
      default:
        return "bg-gray-600 text-gray-100"
    }
  }

  const handleToggleDetails = (rowId) => {
    setActiveRowId(activeRowId === rowId ? null : rowId)
  }

  const handleOpenEmailModal = (callData) => {
    setSelectedCall(callData)
    setIsModalOpen(true)
    setIsSending(true)

    setTimeout(() => {
      let draft = ""
      if (callData.dir === "Payable") {
        draft = `Subject: Update on Margin Call Payment - ${callData.id}\n\nDear ${callData.client} team,\n\nThis is an update regarding the margin call with ID ${callData.id} for ${formatCurrencyDetailed(callData.req, callData.currency)}.\n\nWe apologize for the delay in payment. The collateral is being processed and you can expect to receive it shortly.\n\nWe appreciate your patience.\n\nBest regards,\nBarclays Collateral Operations`
      } else {
        draft = `Subject: Urgent: Outstanding Margin Call - ${callData.id}\n\nDear ${callData.client} team,\n\nThis is a follow-up regarding the outstanding margin call with ID ${callData.id} for ${formatCurrencyDetailed(callData.req, callData.currency)}.\n\nThe current status is "${callData.status}", with our records showing: "${callData.notes}".\n\nCould you please provide an immediate update on the status of this payment?\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nBarclays Collateral Operations`
      }
      setEmailContent(draft)
      setIsSending(false)
    }, 1500)
  }

  const handleSendEmail = () => {
    setIsModalOpen(false)
    setShowConfirmation(true)
    setTimeout(() => setShowConfirmation(false), 3000)
  }

  const realToday = new Date()
  const previousDay = new Date()
  previousDay.setDate(realToday.getDate() - 1)
  const dayBefore = new Date()
  dayBefore.setDate(realToday.getDate() - 2)

  const DateButton = ({ date, label }) => {
    const dateStr = getISODateString(date)
    const isActive = selectedDate === dateStr
    return (
      <button
        onClick={() => setSelectedDate(dateStr)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-white border border-input text-foreground hover:bg-muted"}`}
      >
        {label}
      </button>
    )
  }

  const StatCard = ({ title, today, yesterday, note, mainClass = "text-foreground", noteClass = "text-muted-foreground" }) => (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="flex flex-col sm:flex-row sm:items-baseline mt-2">
        <p className={`text-2xl font-bold ${mainClass}`}>{today}</p>
        <p className="sm:ml-2 text-xs text-muted-foreground">/ {yesterday}</p>
      </div>
      <p className={`text-xs mt-1 ${noteClass}`}>{note}</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center space-x-3 mb-2 justify-between">
        <div className="flex items-center space-x-3">
        <Activity className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Live Margin Call Log</h1>
      </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload((prev) => !prev)}
            className="flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <FileDown size={14} className="mr-2" /> Data Upload
          </button>
          <button
            onClick={() => setShowFirebaseTable((prev) => !prev)}
            className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <Database size={14} className="mr-2" /> Source Data from Firebase
          </button>
        </div>
      </div>
      {showUpload && (
        <div className="mb-6">
          <DailyActivityCsvUploader collectionName="unified_data" onUploadComplete={() => setShowUpload(false)} />
        </div>
      )}
      {showFirebaseTable && (
        <div className="mb-6">
          {firebaseLoading ? (
            <div className="text-center text-gray-400">Loading data from Firebase...</div>
          ) : firebaseError ? (
            <div className="text-center text-red-500">Error: {firebaseError}</div>
          ) : firebaseActivities.length === 0 ? (
            <div className="text-center text-muted-foreground">No data found in Firebase. Upload a CSV to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {["id", ...Object.keys(firebaseActivities[0] || {}).filter(col => col !== "id")].map((col) => (
                      <th key={col} className="px-6 py-3 text-left font-semibold text-muted-foreground bg-muted min-w-[140px] whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {firebaseActivities.map((row, i) => (
                    <tr key={row.id || i} className="border-b border-border hover:bg-muted/60">
                      {["id", ...Object.keys(firebaseActivities[0] || {}).filter(col => col !== "id")].map((col) => (
                        <td key={col} className="px-6 py-3 whitespace-nowrap min-w-[140px]">
                          <EditableCell
                            rowId={row.id}
                            field={col}
                            value={row[col]}
                            onSave={async (id, field, newValue) => {
                              const ref = doc(db, 'unified_data', id)
                              await updateDoc(ref, { [field]: newValue })
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <DateButton date={realToday} label="Today" />
          <DateButton date={previousDay} label="Previous Day" />
          <DateButton date={dayBefore} label="Day Before" />
          <div className="relative flex items-center gap-2 bg-muted hover:bg-muted/80 p-1 rounded-md">
            <label htmlFor="activity-date" className="text-sm font-medium text-muted-foreground pl-2 cursor-pointer">
              <Calendar size={18} />
            </label>
            <input
              type="date"
              id="activity-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none text-foreground text-sm focus:ring-0 border-0"
            />
          </div>
        </div>
        <p className="text-lg font-semibold text-foreground">{formatDate(selectedDate)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Calls Issued"
          today={currentDayStats.callsIssued.toString()}
          yesterday={previousDayStats.callsIssued.toString()}
          note="vs Previous Day"
        />
        <StatCard
          title="Margin Required"
          today={formatMarginInMillions(currentDayStats.marginRequired)}
          yesterday={formatMarginInMillions(previousDayStats.marginRequired)}
          note="vs Previous Day"
        />
        <StatCard
          title="Disputed Calls"
          today={currentDayStats.disputedCalls.toString()}
          yesterday={previousDayStats.disputedCalls.toString()}
          note="vs Previous Day"
          mainClass="text-orange-600"
        />
        <StatCard
          title="Calls Settled"
          today={currentDayStats.callsSettled.toString()}
          yesterday={previousDayStats.callsSettled.toString()}
          note="vs Previous Day"
          mainClass="text-green-600"
        />
      </div>

      <div className="bg-white border border-border rounded-xl p-6 mt-8 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Margin Call Log for {formatDate(selectedDate)}</h2>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              name="searchQuery"
              placeholder="Search by Client or Trader ID..."
              value={filters.searchQuery}
              onChange={handleFilterChange}
              className="bg-white border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full pl-10 p-2.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-white border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={18} className="text-muted-foreground" />
            <select
              name="direction"
              value={filters.direction}
              onChange={handleFilterChange}
              className="bg-white border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
            >
              <option value="all">All Directions</option>
              <option value="Receivable">Client Payable</option>
              <option value="Payable">Barclays Payable</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({ searchQuery: "", status: "all", direction: "all" })}
            className="bg-white border border-input text-foreground hover:bg-muted font-semibold px-4 py-2.5 text-sm rounded-lg"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-foreground">
            <thead className="text-xs text-muted-foreground uppercase bg-muted">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Trader ID</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Margin Requirement</th>
                <th className="py-3 px-4">Call Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-mono text-muted-foreground">{item.id}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{item.traderId || item.trader_id || item.id}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{item.client}</td>
                    <td
                      className={`py-3 px-4 font-medium ${item.dir === "Payable" ? "text-red-600" : "text-green-600"}`}
                    >
                      {item.dir === "Payable" ? "Barclays Payable" : "Client Payable"}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {formatCurrencyDetailed(Number(item.marginRequirement ?? 0), item.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`${getStatusClass(item.status)} text-xs font-medium px-2.5 py-1 rounded-full`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleDetails(item.id)}
                        className="text-primary hover:text-primary/80 text-xs font-semibold"
                      >
                        {activeRowId === item.id ? "Hide Details" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {activeRowId === item.id && (
                    <tr className="bg-muted">
                      <td colSpan="7" className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-foreground mb-2">Payment Details</h4>
                            <div className="text-xs space-y-2 text-muted-foreground">
                              <p>
                                <span className="font-semibold text-muted-foreground">Flow:</span>{" "}
                                {item.dir === "Payable" ? `Barclays -> ${item.client}` : `${item.client} -> Barclays`}
                              </p>
                              <p>
                                <span className="font-semibold text-muted-foreground">Account:</span>{" "}
                                <span className="font-mono">{item.acct || item.account || "N/A"}</span>
                              </p>
                              <p>
                                <span className="font-semibold text-muted-foreground">Status:</span>{" "}
                                <span className="font-medium">{item.status || item.pmtStatus || "N/A"}</span>
                              </p>
                              <p>
                                <span className="font-semibold text-muted-foreground">Ops Team Notes:</span> {item.notes}
                              </p>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={() => handleOpenEmailModal(item)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-1.5 px-3 rounded-lg text-xs"
                              >
                                Compose AI Email
                              </button>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Recent Client History</h4>
                            <ul className="text-xs space-y-1">
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">20 Jul 2025:</span>
                                <span className="text-green-600">Settled (T+0, 10:15 GMT)</span>
                                </li>
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">21 Jul 2025:</span>
                                <span className="text-orange-600">Agreed (11:00 GMT)</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Compose AI-Generated Email</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={24} />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="w-full h-80 bg-background border border-input rounded-lg p-3 text-sm text-foreground"
                placeholder="Generating AI-powered draft..."
                disabled={isSending}
              ></textarea>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 px-4 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg text-sm flex items-center disabled:opacity-50"
              >
                {isSending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg text-sm shadow-lg">
          Email sent successfully!
        </div>
      )}
    </div>
  )
}

// --- Reconciliation Component ---
const Reconciliation = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [showFirebaseTable, setShowFirebaseTable] = useState(false);
  const initialRecData = useMemo(() => {
    const data = [
      {
        marginCallId: "MC-9501",
        clientId: "CID5962",
        agreedAmount: 1200000,
        receivedAmount: 1200000.01,
        settlementDate: "2025-07-10",
        reason: "Minor rounding difference.",
        direction: "Receivable",
      },
      {
        marginCallId: "MC-9502",
        clientId: "CID2693",
        agreedAmount: 850000,
        receivedAmount: 850000,
        settlementDate: "2025-07-10",
        reason: null,
        direction: "Receivable",
      },
      {
        marginCallId: "MC-9503",
        clientId: "CID5299",
        agreedAmount: 2000000,
        receivedAmount: 1999500,
        settlementDate: "2025-07-10",
        reason: "Shortfall in payment.",
        direction: "Receivable",
      },
      {
        marginCallId: "MC-9504",
        clientId: "CID4233",
        agreedAmount: 500000,
        receivedAmount: 500000,
        settlementDate: "2025-07-09",
        reason: null,
        direction: "Receivable",
      },
      {
        marginCallId: "MC-9506",
        clientId: "CID1598",
        agreedAmount: 700000,
        receivedAmount: 690000,
        settlementDate: "2025-07-09",
        reason: "Partial payment received.",
        direction: "Receivable",
      },
      {
        marginCallId: "MC-9507",
        clientId: "CID8072",
        agreedAmount: 800000,
        receivedAmount: null,
        settlementDate: "2025-07-11",
        reason: "Payment not yet received.",
        direction: "Receivable",
      },
      {
        marginCallId: "MC-9508",
        clientId: "CID7079",
        agreedAmount: 500000,
        receivedAmount: null,
        settlementDate: "2025-07-11",
        reason: "Payment not yet received.",
        direction: "Receivable",
      },
      {
        marginCallId: "MC-9511",
        clientId: "CID5962",
        agreedAmount: 700000,
        receivedAmount: 699999.99,
        settlementDate: "2025-07-08",
        reason: "Minor rounding difference.",
        direction: "Payable",
      },
      {
        marginCallId: "MC-9515",
        clientId: "CID7506",
        agreedAmount: 900000,
        receivedAmount: 899500,
        settlementDate: "2025-07-08",
        reason: "Shortfall in payment.",
        direction: "Payable",
      },
    ]

    return data.map((item) => {
      let status = "Failed"
      let difference = null
      if (item.receivedAmount !== null) {
        difference = item.receivedAmount - item.agreedAmount
        status = Math.abs(difference) < 1 ? "Matched" : "Break"
      }
      return { ...item, difference, status }
    })
  }, [])

  const [recData, setRecData] = useState(initialRecData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  const [confirmation, setConfirmation] = useState({ show: false, message: "", type: "" })
  const [aiEmail, setAiEmail] = useState("")
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)

  const initialFilters = { searchQuery: "", status: "all", direction: "all" }
  const [filters, setFilters] = useState(initialFilters)

  const uniqueStatuses = useMemo(() => [...new Set(initialRecData.map((c) => c.status))], [initialRecData])

  // Fetch Firebase data in real time
  const firebaseRecData = useRealtimeCollection('unified_data');
  
  // Debug logging for reconciliation data
  React.useEffect(() => {
    if (showFirebaseTable && firebaseRecData.data) {
      console.log('[DEBUG] Reconciliation Firebase data:', {
        totalRecords: firebaseRecData.data.length,
        records: firebaseRecData.data.map(record => ({
          id: record.id,
          fields: Object.keys(record),
          hasReconciliationFields: !!(record.marginCallId || record.clientId || record.agreedAmount)
        }))
      });
    }
  }, [firebaseRecData.data, showFirebaseTable]);
  
  // Use Firebase data if toggled on, always as array
  const displayRecData = showFirebaseTable ? (firebaseRecData.data || []) : recData;

  const filteredRecData = useMemo(() => {
    return displayRecData.filter((item) => {
      const searchMatch =
        filters.searchQuery === "" ||
        item.marginCallId?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.clientId?.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const statusMatch = filters.status === "all" || item.status === filters.status;
      const directionMatch = filters.direction === "all" || item.direction === filters.direction;
      return searchMatch && statusMatch && directionMatch;
    });
  }, [displayRecData, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleInvestigate = (call) => {
    setSelectedCall(call)
    setAiEmail("")
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCall(null)
  }

  const showConfirmation = (message, type) => {
    setConfirmation({ show: true, message, type })
    setTimeout(() => {
      setConfirmation({ show: false, message: "", type: "" })
    }, 3000)
  }

  const handleGenerateEmail = () => {
    if (!selectedCall) return
    setIsGeneratingEmail(true)
    const { clientId, marginCallId, agreedAmount, receivedAmount, difference, reason, direction } = selectedCall

    setTimeout(() => {
      let draft = ""

      if (direction === "Payable" && difference !== 0) {
        if (difference < 0) {
          draft = `Subject: Urgent Action: Discrepancy in Payment for Margin Call ${marginCallId}\n\nDear ${clientId} Team,\n\nWe are writing to address a payment discrepancy related to margin call ${marginCallId}.\n\nOur records show an agreed payment of ${formatCurrency(agreedAmount)} from Barclays was due. We understand the amount received on your end was ${formatCurrency(receivedAmount)}, leaving a shortfall of ${formatCurrency(Math.abs(difference))}.\n\nWe sincerely apologize for this error. We are taking immediate action to remit the outstanding balance of ${formatCurrency(Math.abs(difference))} and will ensure it is paid as soon as possible.\n\nWe appreciate your understanding and will confirm once the corrective payment has been sent.\n\nBest regards,\nBarclays Collateral Operations`
        } else {
          draft = `Subject: Notice of Overpayment on Margin Call ${marginCallId}\n\nDear ${clientId} Team,\n\nThis email is to inform you of an overpayment from our side regarding margin call ${marginCallId}.\n\nThe agreed settlement amount was ${formatCurrency(agreedAmount)}, but our records show a payment of ${formatCurrency(receivedAmount)} was made, resulting in a surplus of ${formatCurrency(difference)}.\n\nCould you please confirm receipt of the surplus amount and advise on the process for its return?\n\nThank you,\nBarclays Collateral Operations`
        }
      } else if (direction === "Receivable" && difference !== 0) {
        if (difference < 0) {
          draft = `Subject: Urgent: Payment Shortfall on Margin Call ${marginCallId}\n\nDear ${clientId} Team,\n\nWe are writing to follow up on a payment discrepancy for margin call ${marginCallId}.\n\nThe agreed settlement amount was ${formatCurrency(agreedAmount)}. However, our records show we have only received ${formatCurrency(receivedAmount)}, resulting in a shortfall of ${formatCurrency(Math.abs(difference))}.\n\nWe have confirmed our account details and have not received the full amount. Could you please check with your bank to trace the payment and arrange for the remittance of the outstanding balance at your earliest convenience?\n\nPlease revert with an update.\n\nBest regards,\nBarclays Collateral Operations`
        } else {
          draft = `Subject: Notice of Overpayment Received for Margin Call ${marginCallId}\n\nDear ${clientId} Team,\n\nThis is to confirm that we have received an overpayment for margin call ${marginCallId}.\n\nThe agreed amount was ${formatCurrency(agreedAmount)}, and we have received ${formatCurrency(receivedAmount)}, which is a surplus of ${formatCurrency(difference)}.\n\nPlease advise if you would like this amount returned or credited against future margin calls.\n\nThank you,\nBarclays Collateral Operations`
        }
      } else {
        draft = `Subject: Payment Discrepancy for Margin Call ${marginCallId}\n\nDear ${clientId} Team,\n\nWe are writing to inform you of a payment discrepancy regarding margin call ${marginCallId}.\n\nThe agreed settlement amount was ${formatCurrency(agreedAmount)}, however, our records show a received amount of ${formatCurrency(receivedAmount)}, resulting in a difference of ${formatCurrency(difference)}.\n\nCould you please investigate and advise?\n\nBest regards,\nBarclays Collateral Operations`
      }

      setAiEmail(draft)
      setIsGeneratingEmail(false)
    }, 1500)
  }

  const handleSendEmail = () => {
    handleCloseModal()
    showConfirmation(`Email regarding ${selectedCall.marginCallId} sent to client.`, "success")
  }

  const stats = displayRecData.reduce(
    (acc, item) => {
      acc.total++
      if (item.status === "Matched") acc.matched++
      else if (item.status === "Break") acc.breaks++
      else if (item.status === "Failed") acc.failed++
      return acc
    },
    { total: 0, matched: 0, breaks: 0, failed: 0 },
  )

  const RecStatCard = ({ title, value, valueClass = "text-foreground" }) => (
    <div className="bg-card border border-border rounded-xl p-6 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold text-foreground">Cash Reconciliation</h1>
      <p className="text-muted-foreground mt-1">Verify agreed margin call amounts against received cash payments.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload((prev) => !prev)}
            className="flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <FileDown size={14} className="mr-2" /> Data Upload
          </button>
          <button
            onClick={() => setShowFirebaseTable((prev) => !prev)}
            className="flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
          >
            <Database size={14} className="mr-2" /> Source Data from Firebase
          </button>
        </div>
      </div>
      {showUpload && (
        <div className="mb-6">
          <ReconciliationCsvUploader collectionName="reconciliation" onUploadComplete={() => setShowUpload(false)} />
        </div>
      )}
      {showFirebaseTable && (
        <div className="mb-6">
          <RealtimeEditableTable collectionName="unified_data" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <RecStatCard title="Total Items" value={stats.total} />
        <RecStatCard title="Matched" value={stats.matched} valueClass="text-green-600" />
        <RecStatCard title="Breaks" value={stats.breaks} valueClass="text-yellow-600" />
        <RecStatCard title="Failed" value={stats.failed} valueClass="text-red-600" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Reconciliation Log</h2>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              name="searchQuery"
              placeholder="Search by Margin Call or Client ID..."
              value={filters.searchQuery}
              onChange={handleFilterChange}
              className="bg-background border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full pl-10 p-2.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-background border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={18} className="text-muted-foreground" />
            <select
              name="direction"
              value={filters.direction}
              onChange={handleFilterChange}
              className="bg-background border border-input text-foreground text-sm rounded-lg focus:ring-ring focus:border-ring block w-full p-2.5"
            >
              <option value="all">All Directions</option>
              <option value="Receivable">Client Payable</option>
              <option value="Payable">Barclays Payable</option>
            </select>
          </div>
          <button
            onClick={() => setFilters(initialFilters)}
            className="bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-2.5 text-sm rounded-lg"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-foreground">
            <thead className="text-xs text-muted-foreground uppercase bg-muted">
              <tr>
                <th className="py-2 px-4">Margin Call ID</th>
                <th className="py-2 px-4">Client ID</th>
                <th className="py-2 px-4">Direction</th>
                <th className="py-2 px-4">Agreed Amount</th>
                <th className="py-2 px-4">Received/Payable Amount</th>
                <th className="py-2 px-4">Difference</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Settlement Date</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecData.map((item) => {
                const diffClass = item.status === "Break" ? "text-yellow-600" : "text-muted-foreground"
                const statusClass =
                  item.status === "Matched"
                    ? "bg-green-100 text-green-700"
                    : item.status === "Break"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                return (
                  <tr key={item.marginCallId} className="border-b border-border text-xs leading-tight">
                    <td className="py-2 px-4 font-mono text-muted-foreground">{item.marginCallId}</td>
                    <td className="py-2 px-4">{item.clientId}</td>
                    <td
                      className={`py-2 px-4 font-medium ${item.direction === "Payable" ? "text-red-600" : "text-green-600"}`}
                    >
                      {item.direction === "Payable" ? "Barclays Payable" : "Client Payable"}
                    </td>
                    <td className="py-2 px-4">{formatCurrency(item.agreedAmount)}</td>
                    <td className="py-2 px-4">
                      {item.receivedAmount !== null ? (
                        formatCurrency(item.receivedAmount)
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className={`py-2 px-4 font-medium ${diffClass}`}>
                      {item.difference !== null ? (
                        formatCurrency(item.difference)
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`${statusClass} text-xs font-medium px-2.5 py-1 rounded-full`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-4">{item.settlementDate}</td>
                    <td className="py-2 px-4 text-center">
                      {item.status === "Break" ? (
                        <button
                          onClick={() => handleInvestigate(item)}
                          className="text-primary hover:text-primary/80 text-xs font-semibold"
                        >
                          Investigate
                        </button>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Investigate Payment Break</h3>
              <button onClick={handleCloseModal}>
                <X size={20} className="text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="p-6 flex-grow overflow-y-auto text-sm space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Break Details</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted p-3 rounded-md">
                  <p className="font-semibold text-muted-foreground">Margin Call ID:</p>
                  <p className="font-mono">{selectedCall.marginCallId}</p>
                  <p className="font-semibold text-muted-foreground">Client ID:</p>
                  <p>{selectedCall.clientId}</p>
                  <p className="font-semibold text-muted-foreground">Agreed Amount:</p>
                  <p className="text-green-600">{formatCurrency(selectedCall.agreedAmount)}</p>
                  <p className="font-semibold text-muted-foreground">Received Amount:</p>
                  <p className="text-red-600">{formatCurrency(selectedCall.receivedAmount)}</p>
                  <p className="font-semibold text-muted-foreground">Difference:</p>
                  <p className="font-bold text-red-600">{formatCurrency(selectedCall.difference)}</p>
                  <p className="font-semibold text-muted-foreground">Reason:</p>
                  <p>{selectedCall.reason}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold text-foreground mb-2">AI-Powered Communication</h4>
                {!aiEmail && (
                  <button
                    onClick={handleGenerateEmail}
                    disabled={isGeneratingEmail}
                    className="w-full flex items-center justify-center gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-3 rounded-lg disabled:opacity-50"
                  >
                    {isGeneratingEmail ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Generate Client Email
                      </>
                    )}
                  </button>
                )}
                {aiEmail && (
                  <div>
                    <textarea
                      value={aiEmail}
                      onChange={(e) => setAiEmail(e.target.value)}
                      rows="8"
                      className="w-full bg-background border border-input rounded-lg p-3 text-sm text-foreground"
                    ></textarea>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSendEmail}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg"
                      >
                        <Send size={16} /> Send to Client
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-muted border-t border-border flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 px-4 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmation.show && (
        <div
          className={`fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg text-sm shadow-lg ${confirmation.type === "success" ? "bg-green-500" : "bg-blue-500"}`}
        >
          {confirmation.message}
        </div>
      )}
    </div>
  )
}

// --- Main App Component ---
const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard")

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <CollateralDashboard />
      case "clientInfo":
        return <ClientInformation />
      case "workflow":
        return <MarginCallWorkflow />
      case "dailyActivity":
        return <DailyActivityLog />
      case "reconciliation":
        return <Reconciliation />
      case "consolidatedData":
        return <ConsolidatedDataTab />
      case "settings":
        return <PlaceholderComponent title="Settings" />
      case "firebase-test":
        return <FirebaseTest />
      default:
        return <CollateralDashboard />
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen font-sans">
      <div className="flex">
        <aside className="w-64 bg-primary p-6 flex flex-col justify-between min-h-screen shadow-2xl">
          <div>
            <div className="flex items-center mb-10">
              <Shield className="h-10 w-10 text-primary-foreground mr-3" />
              <h1 className="text-xl font-bold tracking-wider text-primary-foreground">
                Barclays <span className="font-light text-primary-foreground/80">CMS</span>
              </h1>
            </div>
            <nav className="flex flex-col space-y-2">
              <SidebarButton
                icon={<Home size={20} />}
                label="Dashboard"
                active={activeTab === "dashboard"}
                onClick={() => setActiveTab("dashboard")}
              />
              <SidebarButton
                icon={<User size={20} />}
                label="Client Information"
                active={activeTab === "clientInfo"}
                onClick={() => setActiveTab("clientInfo")}
              />
              <SidebarButton
                icon={<GitMerge size={20} />}
                label="Workflow"
                active={activeTab === "workflow"}
                onClick={() => setActiveTab("workflow")}
              />
              <SidebarButton
                icon={<Activity size={20} />}
                label="Daily Activity Log"
                active={activeTab === "dailyActivity"}
                onClick={() => setActiveTab("dailyActivity")}
              />
              <SidebarButton
                icon={<FileCheck size={20} />}
                label="Reconciliation"
                active={activeTab === "reconciliation"}
                onClick={() => setActiveTab("reconciliation")}
              />
              {/* New Consolidated Data tab */}
              <SidebarButton
                icon={<Database size={20} />}
                label="Consolidated Data"
                active={activeTab === "consolidatedData"}
                onClick={() => setActiveTab("consolidatedData")}
              />
            </nav>
          </div>
          <div>
            <SidebarButton
              icon={<Settings size={20} />}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  )
}

export default App

// Add this new component at the bottom of the file before export default App
function ConsolidatedDataTab() {
  const [showTable, setShowTable] = React.useState(false);
  const [showUnifiedTable, setShowUnifiedTable] = React.useState(false);
  const [unifiedIds, setUnifiedIds] = React.useState<string[]>([]);
  const [assignedIdMap, setAssignedIdMap] = React.useState<Record<string, string>>({});
  const { data: reconciliationData } = useRealtimeCollection<Record<string, any>>('reconciliation');
  const { data: unifiedData } = useRealtimeCollection<Record<string, any>>('unified_data');
  
  // Extract IDs from unified_data collection for assignment
  React.useEffect(() => {
    if (unifiedData && unifiedData.length > 0) {
      const ids = unifiedData.map(item => item.id).filter(Boolean);
      setUnifiedIds(ids);
    }
  }, [unifiedData]);

  const handleAssignIds = async () => {
    console.log('Starting ID assignment...');
    console.log('Available unified_data IDs:', unifiedIds);
    
    if (unifiedIds.length === 0) {
      alert('No IDs available from unified_data collection. Please load the unified data first.');
      return;
    }

          try {
        const clientData = await getDocs(collection(db, 'workflow_collateraldata'));
      
      console.log('Found workflow collateral documents:', clientData.docs.length);
      
      let assignedCount = 0;
      const newAssignedIdMap: Record<string, string> = {};
      
      clientData.docs.forEach((docSnapshot, index) => {
        if (index < unifiedIds.length) {
          newAssignedIdMap[docSnapshot.id] = unifiedIds[index];
          assignedCount++;
          console.log(`Assigning ID ${unifiedIds[index]} to document ${docSnapshot.id}`);
        }
      });
      
      if (assignedCount > 0) {
        setAssignedIdMap(newAssignedIdMap);
        alert(`Successfully assigned ${assignedCount} IDs to client records (in memory only)`);
        console.log('ID assignment completed in memory');
      } else {
        alert('No assignments were made. Please check if you have data in both collections.');
      }
    } catch (error) {
      console.error('Error assigning IDs:', error);
      alert(`Error assigning IDs: ${error.message}`);
    }
  };

  const handleSaveToUnified = async () => {
    console.log('Starting save to unified_data...');
    
    try {
      const batch = writeBatch(db);
      const workflowData = await getDocs(collection(db, 'workflow_collateraldata'));
      
      console.log('Found workflow collateral documents:', workflowData.docs.length);
      
      let savedCount = 0;
      let skippedCount = 0;
      
      for (const docSnapshot of workflowData.docs) {
        const workflowDocData = docSnapshot.data();
        const assignedId = assignedIdMap[docSnapshot.id];
        
        if (!assignedId) {
          console.log(`Skipping document ${docSnapshot.id} - no assignedId in memory`);
          skippedCount++;
          continue;
        }
        
        // Create data object without id field
        const dataToSave = { ...workflowDocData };
        delete dataToSave.id;
        
        // Check if document already exists in unified_data
        const unifiedDocRef = doc(db, 'unified_data', assignedId);
        const unifiedDoc = await getDoc(unifiedDocRef);
        
        if (unifiedDoc.exists()) {
          // Document exists - merge new fields without overwriting existing ones
          const existingData = unifiedDoc.data();
          const mergedData = { ...existingData };
          
          // Only add fields that don't already exist
          Object.keys(dataToSave).forEach(key => {
            if (!(key in existingData)) {
              mergedData[key] = dataToSave[key];
            }
          });
          
          batch.update(unifiedDocRef, mergedData);
          console.log(`Updated existing document ${assignedId} in unified_data with new fields`);
        } else {
          // Document doesn't exist - create new one
          batch.set(unifiedDocRef, dataToSave);
          console.log(`Created new document ${assignedId} in unified_data`);
        }
        
        savedCount++;
      }
      
      if (savedCount > 0) {
        await batch.commit();
        alert(`Successfully saved ${savedCount} records to unified_data${skippedCount > 0 ? ` (${skippedCount} skipped - no assignedId)` : ''}`);
        console.log('Batch commit completed successfully');
      } else {
        alert('No records were saved. Please ensure client records have assigned IDs.');
      }
    } catch (error) {
      console.error('Error saving to unified_data:', error);
      alert(`Error saving to unified_data: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg"
          onClick={() => setShowTable(true)}
        >
          Source Client Data from Firebase
        </button>
        <button
          className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg"
          onClick={() => setShowUnifiedTable(true)}
        >
          Source Unified Data from Firebase
        </button>
        <button
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg"
          onClick={handleAssignIds}
        >
          Assign Unified IDs to Client Data
        </button>
      </div>
      

      
      {showTable && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Workflow Collateral Data</h3>
            <button
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg"
              onClick={handleSaveToUnified}
            >
              Save to Unified Data
            </button>
          </div>
                      <RealtimeEditableTable 
              collectionName="workflow_collateraldata" 
              assignedIdMap={assignedIdMap}
            />
        </div>
      )}
      
      {showUnifiedTable && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Unified Data</h3>
          <RealtimeEditableTable collectionName="unified_data" />
        </div>
      )}
    </div>
  );
}
