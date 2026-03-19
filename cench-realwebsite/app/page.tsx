'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}
import BlurText from './components/BlurText';
import LogoLoop from './components/LogoLoop';
import { ArrowUpRight, Settings, User, LogOut, Bell, Camera, CreditCard, Search, Check, ChevronRight, ChevronDown, Upload, Scan, FileSearch, Store, FileText, FileImage, FileSpreadsheet, Package, RefreshCw, Building2, AlertCircle, TriangleAlert, Mail, Send, MousePointer2,
  Linkedin,
  LayoutDashboard, 
FolderOpen, BookOpen, ArrowLeftRight, Library, FileBarChart, Truck, TrendingUp, DollarSign, Users, Activity, ClipboardList, SquareArrowOutUpRight, Plus, Gift, Ticket, UserPlus, Shirt, Watch, Smartphone, ShoppingBag, Monitor, ScanLine, Utensils, Database, BarChart3, MessageCircle, Instagram, Github, Menu, X } from 'lucide-react';
import Link from 'next/link';
import ThreeLogo, { StaticLogo } from "./components/ThreeLogo";
import GradualBlur from './components/GradualBlur';

import Grainient from './components/Grainient';
import ScrollReveal from './components/ScrollReveal';

const NotificationCard = ({
  icon,
  title,
  subtitle,
  accentColor,
  accentRgb,
  className = ""
}: {
  icon: string,
  title: string,
  subtitle: string,
  accentColor: string,
  accentRgb: string,
  className?: string
}) => (
  <div className={`flex items-center gap-4 p-3.5 rounded-[22px] border border-white/60 backdrop-blur-[32px] shadow-[0_15px_35px_rgba(0,0,0,0.1),0_5px_15px_rgba(0,0,0,0.05)] ${className}`}
    style={{
      background: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(${accentRgb},0.15) 100%)`,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif'
    }}
  >
    {/* Inner Highlight for Glass Effect */}
    <div className="absolute inset-0 rounded-[22px] border border-white/50 pointer-events-none" />

    <div className="relative z-10 flex items-center gap-3 w-full">
      <img src={icon} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div className="text-[14px] font-bold text-[#111] leading-tight tracking-[-0.03em] whitespace-nowrap overflow-hidden text-ellipsis uppercase">{title}</div>
        <div className="text-[11px] font-medium text-gray-500/80 leading-tight tracking-tight">{subtitle}</div>
      </div>
    </div>
  </div>
);







const UploadMockup = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
      <motion.div
        className="w-52 h-44 border-2 border-dashed border-white/40 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-white/40 backdrop-blur-md shadow-[0_8px_32px_0_rgba(255,255,255,0.18)]"
        animate={{
          borderColor: isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
          backgroundColor: isHovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.4)',
        }}
      >
        {/* Inner Gradient Border Effect */}
        <div className="absolute inset-0 rounded-[10px] border border-white/50 pointer-events-none px-[1.5px] py-[1.5px] m-[1px]">
          <div className="w-full h-full rounded-[8px] border border-white/20" />
        </div>

        <div className="flex flex-col items-center relative z-10">
          <img src="/upload-icon.svg" className="w-12 h-12 mb-1.5 opacity-60 invert" alt="Upload" />
          <span className="text-white/80 font-black text-[10px] tracking-[0.2em] uppercase font-sans mb-3">Drop files</span>

          <div className="flex gap-1.5">
            {[
              { icon: FileSpreadsheet, label: "XLS", color: "text-green-400" },
              { icon: FileText, label: "PDF", color: "text-red-400" },
              { icon: FileImage, label: "IMG", color: "text-blue-400" }
            ].map((file, i) => (
              <div key={i} className="px-2 py-1.5 rounded-md bg-white/10 border border-white/20 backdrop-blur-sm flex items-center gap-1.5 shadow-sm">
                <file.icon size={10} className={file.color} />
                <span className="text-[9px] font-black text-white/90">{file.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating cursor dragging files - moved outside overflow-hidden to start from "outside" */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            key="drag-animation"
            initial={{ x: 200, y: 200, opacity: 0 }}
            animate={{ x: 0, y: 25, opacity: 1 }}
            exit={{ opacity: 0, x: 200, y: 200, transition: { duration: 0.4 } }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-50 pointer-events-none"
          >
            <div className="relative">
              {/* Stacked Mock Files attached to cursor */}
              <div className="absolute -top-20 -left-14 flex flex-col opacity-100 scale-90">
                <motion.div
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-fit h-9 bg-white rounded-md shadow-lg border border-gray-100 px-3 flex items-center gap-3 -rotate-[2deg] relative z-10"
                >
                  <FileSpreadsheet size={18} className="text-green-600" />
                  <span className="text-[12px] font-extrabold text-[#111] whitespace-nowrap">inventory.xls</span>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 5, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-fit h-9 bg-white rounded-md shadow-lg border border-gray-100 px-3 flex items-center gap-3 translate-y-[-12px] rotate-[1deg] relative z-20"
                >
                  <FileText size={18} className="text-red-500" />
                  <span className="text-[12px] font-extrabold text-[#111] whitespace-nowrap">invoice.pdf</span>
                </motion.div>

                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 10, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-fit h-9 bg-white rounded-md shadow-lg border border-gray-100 px-3 flex items-center gap-3 translate-y-[-24px] -rotate-[1deg] relative z-30"
                >
                  <FileImage size={18} className="text-blue-500" />
                  <span className="text-[12px] font-extrabold text-[#111] whitespace-nowrap">photo.jpg</span>
                </motion.div>
              </div>
              <MousePointer2 size={36} className="text-white fill-black drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AIExtractionMockup = ({ isHovered }: { isHovered: boolean }) => {
  const [isExtracted, setIsExtracted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isHovered) {
      // Always reset and start fresh on a new hover
      setIsExtracted(false);
      setIsScanning(true);
      setKey(prev => prev + 1);

      // Stop scanning and show chips after 1 cycle (approx 1.2s)
      timeout = setTimeout(() => {
        setIsScanning(false);
        setIsExtracted(true);
      }, 1200);
    } else {
      // If we leave while scanning, stop it
      if (isScanning) {
        setIsScanning(false);
      }
      // Note: isExtracted STAYS true if it was already finished (sticky popouts)
    }

    return () => clearTimeout(timeout);
  }, [isHovered]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-20 overflow-hidden">
      <div className="relative w-52 h-44 bg-white/40 backdrop-blur-md rounded-xl shadow-[0_8px_32px_0_rgba(255,255,255,0.18)] border border-white/40 flex flex-col p-3 overflow-hidden">
        {/* Inner Gradient Border Effect */}
        <div className="absolute inset-0 rounded-xl border border-blue-700/30 pointer-events-none px-[1.5px] py-[1.5px]">
          <div className="w-full h-full rounded-[10px] border border-blue-600/10" />
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-700/20 via-transparent to-blue-800/10 pointer-events-none" />

        {/* Document Header lines */}
        <div className="w-10 h-2 bg-blue-700/60 rounded-full mb-4" />
        <div className="w-full space-y-2 px-0.5">
          <div className="w-full h-1 bg-blue-600/40 rounded-full" />
          <div className="w-[85%] h-1 bg-blue-600/40 rounded-full" />
        </div>

        {/* Document Body lines */}
        <div className="mt-5 space-y-4 px-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="w-14 h-1 bg-blue-700/60 rounded-full" />
              <div className="w-6 h-1 bg-blue-700/60 rounded-full" />
            </div>
          ))}
        </div>

        {/* Scanning Bar Animation */}
        <AnimatePresence mode="wait">
          {isScanning && (
            <motion.div
              key={`scan-bar-${key}`}
              initial={{ top: -10 }}
              animate={{ top: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "linear" }}
              className="absolute left-0 right-0 h-1 z-30 bg-gradient-to-r from-transparent via-[#0055ff]/40 to-transparent shadow-[0_0_15px_rgba(44,25,252,0.6)]"
            />
          )}
        </AnimatePresence>

        {/* Shine Overlay when scanning */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0055ff]/10 z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Extracted Data Chips */}
      <AnimatePresence>
        {isExtracted && (
          <div className="absolute inset-0 pointer-events-none z-40">
            {[
              { label: '$142.50', x: -50, y: -35, delay: 0.1, color: 'text-blue-600' },
              { label: 'Vendor X', x: 55, y: -15, delay: 0.2, color: 'text-indigo-600' },
              { label: '6 Items', x: -45, y: 30, delay: 0.3, color: 'text-emerald-600' },
              { label: 'Processed', x: 50, y: 55, delay: 0.4, color: 'text-green-600' }
            ].map((chip, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: chip.x, y: chip.y }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: chip.delay, type: 'spring', stiffness: 200, damping: 15 }}
                className="absolute left-1/2 top-1/2 -ml-12 -mt-4 bg-white/30 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white/60 flex items-center gap-2.5"
              >
                <div className={`w-2 h-2 rounded-full bg-current ${chip.color}`} />
                <span className={`text-[11px] font-black uppercase tracking-tight ${chip.color}`}>{chip.label}</span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PrecisionProofingMockup = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-20 overflow-hidden">
      {/* Mock Document */}
      <div className="relative w-52 h-44 bg-white/40 backdrop-blur-md rounded-xl shadow-[0_8px_32px_0_rgba(239,68,68,0.3)] border border-red-500/40 flex flex-col p-3 overflow-hidden">
        {/* Inner Gradient Border Effect */}
        <div className="absolute inset-0 rounded-xl border border-red-500/50 pointer-events-none px-[1.5px] py-[1.5px]">
          <div className="w-full h-full rounded-[10px] border border-red-400/20" />
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/20 via-transparent to-red-600/10 pointer-events-none" />

        {/* Document Header lines */}
        <div className="w-10 h-2 bg-white/40 rounded-full mb-4" />
        <div className="w-full space-y-2">
          <div className="w-full h-1 bg-white/20 rounded-full" />
          <div className="w-[85%] h-1 bg-white/20 rounded-full" />
        </div>

        {/* Document Body lines */}
        <div className="mt-5 space-y-4 px-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="w-16 h-1 bg-white/30 rounded-full" />
              <div className="w-8 h-1 bg-white/30 rounded-full" />
            </div>
          ))}
        </div>

        {/* Red Error Symbol on Document - Static initially */}
        <div className="absolute right-3 bottom-12">
          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center border border-white/20 shadow-lg" style={{ pointerEvents: 'none' }}>
            <TriangleAlert className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Red Highlight Line on Document - Static initially */}
        <div className="absolute top-[108px] left-0 h-4 w-full bg-red-500/10 pointer-events-none" />
      </div>

      {/* Pop-out Red Container */}
      <AnimatePresence>
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
            {/* Pop-out Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 0 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative bg-gradient-to-br from-red-500 to-red-700 px-4 py-2 rounded-xl shadow-[0_15px_45px_rgba(220,38,38,0.4)] flex items-center gap-4 overflow-hidden"
            >
              {/* Glossy Outline / Rim */}
              <div className="absolute inset-0 rounded-xl border border-white/40 pointer-events-none" />
              <div className="absolute inset-[1px] rounded-[11px] border border-white/10 pointer-events-none" />

              <Mail className="w-6 h-6 text-white relative z-10" />
              <div className="flex flex-col relative z-10">
                <span className="text-white text-[12px] font-black uppercase tracking-tight">Email Sent</span>
                <span className="text-white/80 text-[10px] font-bold">Query: Price Mismatch</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LiveInventoryMockup = ({ isHovered }: { isHovered: boolean }) => {
  const rows = [
    { initial: 0.8, target: 1.0, icon: Shirt },
    { initial: 0.1, target: 0.8, icon: Watch },
    { initial: 0.4, target: 0.95, icon: ShoppingBag },
    { initial: 0.2, target: 1.0, icon: Package }
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-20 overflow-hidden">
      <div className="relative w-52 h-44 bg-white/40 backdrop-blur-md rounded-lg border border-white/40 shadow-[0_8px_32px_0_rgba(255,255,255,0.18),inset_0_0_0_1px_rgba(255,255,255,0.2)] flex flex-col p-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center mb-2">
          <span className="text-[12px] font-black text-white/90 tracking-[0.2em] uppercase">Inventory</span>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-white/10 mb-2" />

        {/* List of Bars */}
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-4">
              {/* Dynamic Icon on left */}
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                <row.icon size={18} className="text-white/70" />
              </div>

              {/* Progress Bar Container */}
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative">
                {/* Internal Fill Bar */}
                <motion.div
                  initial={{ width: `${row.initial * 100}%` }}
                  animate={{ width: isHovered ? `${row.target * 100}%` : `${row.initial * 100}%` }}
                  transition={{
                    delay: isHovered ? idx * 0.1 : 0,
                    duration: 0.6,
                    ease: "circOut"
                  }}
                  className="absolute inset-y-0 left-0 bg-blue-700 shadow-[0_0_8px_rgba(29,78,216,0.6)] rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Counter = ({ targetValue, delay }: { targetValue: number; delay: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const duration = 1200; // slower count-up duration

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const currentCount = Math.min(
        Math.floor((progress / duration) * targetValue),
        targetValue
      );

      setCount(currentCount);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [targetValue, delay]);

  return <>{count}</>;
};

const AppSidebar = ({ className = "" }: { className?: string }) => (

  <div className={`w-[240px] border-r border-[#e5e7eb] bg-white flex flex-col py-6 shrink-0 font-sans ${className}`}>
    <div className="px-5 mb-6 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0055ff]">
        <LayoutDashboard size={18} />
      </div>
      <span className="font-bold text-[15px] text-[#111827]">Accounting</span>
    </div>

    {[
      { icon: FolderOpen, label: 'Directory', active: true },
      { icon: BookOpen, label: 'Chart of Accounts' },
      { icon: ArrowLeftRight, label: 'Transactions' },
      { icon: Library, label: 'Ledger' },
      { icon: FileBarChart, label: 'Statements' },
      { icon: FileText, label: 'Invoices' },
      { icon: Truck, label: 'Vendors' },
      { icon: Settings, label: 'Settings', isBottom: true },
    ].map((item, i) => (
      <div key={item.label} className={`px-5 py-2.5 flex items-center gap-3 transition-colors font-sans ${item.isBottom ? 'mt-auto' : ''} ${item.active ? 'bg-gray-50 text-[#111827] font-semibold' : 'text-[#6b7280] font-medium'}`}>
        <item.icon size={18} strokeWidth={item.active ? 2.5 : 2} />
        <span className="text-[14px]">{item.label}</span>
      </div>
    ))}
  </div>
);

const AppDashboard = () => (
  <div className="flex-1 pt-3 px-8 pb-8 overflow-hidden bg-white custom-scrollbar font-sans">
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Pill Row Containers */}
      <div className="flex gap-4 items-start relative z-[100] px-4">
        <div className="button-24 pointer-events-none">
          Statements
        </div>

        <div className="relative group">
          <div className="button-24 button-24--blue pointer-events-none">
            Payroll
          </div>

          {/* Floating Pop-out Overlay - White Glassy Style */}
          <div
            className="absolute top-[calc(100%+6px)] left-0 w-[90%] rounded-[20px] border border-white/60 backdrop-blur-[24px] p-1.5 pr-0 flex flex-col gap-2.5 transition-all duration-300 z-50 text-[#111]"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(44, 25, 252, 0.12) 100%)',
              boxShadow: 'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
              fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif'
            }}
          >
            {[
              { name: 'ADP', icon: '/adp.svg' },
              { name: 'JustWorks', icon: '/justworks.svg' },
              { name: 'Gusto', icon: '/gusto.svg' },
            ].map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Plus size={10} strokeWidth={4} className="text-gray-300 shrink-0" />
                <img
                  src={opt.icon}
                  alt=""
                  className={`${opt.name === 'JustWorks' ? 'h-2.5' : 'h-3'} w-auto object-contain max-w-[70px]`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="button-24 pointer-events-none">
          Vendors
        </div>
      </div>

      {/* Main Row: Cash Flow Chart & Ledger Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cash Flow</h3>
              <p className="text-sm text-gray-500">Revenue vs Expenditures</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold font-sans">
                Revenue
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-gray-400 text-xs font-extrabold font-sans">
                Expense
              </div>
            </div>
          </div>

          <div className="relative h-[240px] w-full bg-[#fcfcff] rounded-xl border border-gray-50/50 flex items-end p-4">
            <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(44, 25, 252, 0.2)" />
                  <stop offset="100%" stopColor="rgba(44, 25, 252, 0)" />
                </linearGradient>
              </defs>
              <path d="M0,35 Q10,32 20,28 T40,22 T60,25 T80,15 T100,5 V40 H0 Z" fill="url(#chartGradient)" />
              <path d="M0,35 Q10,32 20,28 T40,22 T60,25 T80,15 T100,5" fill="none" stroke="#0055ff" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="100" cy="5" r="1.5" fill="#0055ff" />
            </svg>
            <div className="absolute inset-x-4 bottom-4 flex justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </div>
        </div>

        {/* Ledger & Journal Reports */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">Ledger Reports</h3>
          <div className="space-y-3">
            {[
              'General Ledger Summary 2026',
              'Accounts Payable & Journal',
              'Accounts Receivable Ledger',
              'Cash Flow Statement Journal',
              'Employee Payroll Report'
            ].map((report, i) => (
              <div key={i} className="flex justify-between items-center px-1 py-3.5 rounded-xl border border-transparent transition-all">
                <div className="min-w-0 flex-1 pr-4 relative">
                  <div className="text-sm font-bold text-gray-800 tracking-tight whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,black_80%,transparent_100%)]">
                    {report}
                  </div>
                </div>
                <div className="text-gray-400 shrink-0">
                  <SquareArrowOutUpRight size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
const BrandIcon = ({ name }: { name: string }) => {
  const cn = "inline-block h-5 w-auto mx-1.5 align-middle mb-0.5 filter drop-shadow-sm";
  switch (name) {
    case 'Google': return <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" className={cn} alt="Google" />;
    case 'Apple': return <img src="https://www.vectorlogo.zone/logos/apple/apple-icon.svg" className={cn + " relative -top-0.5"} alt="Apple" style={{ filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />;
    case 'Calendly': return <img src="/calendly.svg" className={cn} alt="Calendly" style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.1))' }} />;
    case 'Outlook': return <img src="/outlook.svg" className={cn} alt="Outlook" style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.1))' }} />;
    case 'Stripe': return <img src="/stripe.svg" className="inline-block h-5 w-auto mx-0.5 align-middle mb-0.5 filter drop-shadow-sm" alt="Stripe" style={{ filter: 'brightness(1.1)' }} />;
    case 'Shopify': return <img src="/shopify.svg" className={cn} alt="Shopify" style={{ filter: 'brightness(1.1)' }} />;
    case 'DoorDash': return <img src="/doordash.svg" className={cn} alt="DoorDash" style={{ filter: 'brightness(1.1)' }} />;
    case 'UberEats': return <img src="/ubereats.svg" className={cn} alt="Uber Eats" style={{ filter: 'brightness(1.1)' }} />;
    case 'ApplePay': return <img src="/apple-pay.svg" className={cn.replace('h-5', 'h-7')} alt="Apple Pay" style={{ filter: 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />;
    case 'GooglePay': return <img src="/google-pay.svg" className={cn.replace('h-5', 'h-7')} alt="Google Pay" style={{ filter: 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />;
    case 'QuickBooks': return <img src="/quickbooks.svg" className={cn} alt="QuickBooks" style={{ filter: 'brightness(1.1)' }} />;
    case 'Camera': return <Camera size={16} className="inline-block mx-1.5 align-middle mb-0.5 text-[#0055ff] drop-shadow-[0_0_8px_rgba(44,25,252,0.4)]" />;
    case 'Wallet': return <CreditCard size={16} className="inline-block mx-1.5 align-middle mb-0.5 text-[#0055ff] drop-shadow-[0_0_8px_rgba(44,25,252,0.4)]" />;
    default: return null;
  }
};

const PointText = ({ text }: { text: string }) => {
  const parts = text.split(/(\[(?:Google|Apple|Calendly|Outlook|Stripe|Shopify|DoorDash|UberEats|ApplePay|GooglePay|Camera|Wallet|QuickBooks)\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          return <BrandIcon key={i} name={part.slice(1, -1)} />;
        }
        return part;
      })}
    </>
  );
};

import { useTransition } from './TransitionContext';


export default function Home() {
  const { navigate } = useTransition();
  const NavButton = ({ children, className, isBold = false, onClick }: { children: React.ReactNode; className?: string; isBold?: boolean; onClick?: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [entrySide, setEntrySide] = useState<'left' | 'right'>('left');

    return (
      <motion.button
        className={`relative group py-1 text-[11px] md:text-sm ${isBold ? 'font-semibold' : 'font-medium'} text-black overflow-hidden flex items-center gap-1 ${className || ''}`}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          setEntrySide(x < rect.width / 2 ? 'left' : 'right');
          setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(44,25,252,0.15)]">{children}</span>
        <motion.span
          className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black"
          initial={false}
          animate={{
            x: isHovered ? "0%" : (entrySide === 'left' ? "-105%" : "105%"),
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.button>
    );
  };

  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('Agent');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Auto');
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isThirdSectionInView, setIsThirdSectionInView] = useState(false);
  const [mockupScale, setMockupScale] = useState(1);
  const agentDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const contextDropdownRef = useRef<HTMLDivElement>(null);
  const thirdSectionRef = useRef<HTMLElement>(null);
  const swftlyTextRef = useRef<HTMLSpanElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideoPlayed = useRef(false);
  const hasMobileVideoPlayed = useRef(false);
  const hasHitTargetTime = useRef(false);
  const [showVideoInfo, setShowVideoInfo] = useState(false);
  const [videoInfoStep, setVideoInfoStep] = useState(4);
  const [videoTime, setVideoTime] = useState(0);
  const [hasDismissedCTA, setHasDismissedCTA] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        setIsMobile(width < 768);
        const containerWidth = Math.min(width - 48, 960);
        const baseWidth = 960;
        const newScale = containerWidth / baseWidth;
        setMockupScale(newScale);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [stickyStep, setStickyStep] = useState(0);
  const stickySectionRef = useRef<HTMLElement>(null);
  const scrollingContentRef = useRef<HTMLDivElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const finalGetRef = useRef<HTMLHeadingElement>(null);
  const [showHeavyAssets, setShowHeavyAssets] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredInventoryCard, setHoveredInventoryCard] = useState<number | null>(null);
  const inventoryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [uploadAnimKey, setUploadAnimKey] = useState(0);
  const [parseAnimKey, setParseAnimKey] = useState(0);
  const [proofAnimKey, setProofAnimKey] = useState(0);
  const [stockAnimKey, setStockAnimKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Auto-advance loop for the 4 process animations
  useEffect(() => {
    if (activeStep > 3) return;

    const durations = [5000, 6500, 8000, 9500];
    const timer = setTimeout(() => {
      const nextStep = (activeStep + 1) % 4;
      setActiveStep(nextStep);
      if (nextStep === 0) setUploadAnimKey(prev => prev + 1);
      if (nextStep === 1) setParseAnimKey(prev => prev + 1);
      if (nextStep === 2) setProofAnimKey(prev => prev + 1);
      if (nextStep === 3) setStockAnimKey(prev => prev + 1);
    }, durations[activeStep]);

    return () => clearTimeout(timer);
  }, [activeStep]);

  useEffect(() => {
    // Show background/bags almost immediately for a complete initial scene
    const timer = setTimeout(() => setShowHeavyAssets(true), 100);
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowHeavyAssets(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleHashJump = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) {
          // Instant jump
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
          // Ensure it sticks (sometimes hydration can reset scroll)
          setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 50);
        }
      }
    };

    // Run on mount and after a short delay for reliability
    handleHashJump();
    const timer = setTimeout(() => {
      handleHashJump();
      ScrollTrigger.refresh();
    }, 200);

    window.addEventListener('hashchange', handleHashJump);
    return () => {
      window.removeEventListener('hashchange', handleHashJump);
      clearTimeout(timer);
    };
  }, []);

  // GSAP ScrollTrigger for Inventory section on mobile
  useEffect(() => {
    if (!isMobile) return;

    const ctx = gsap.context(() => {
      inventoryRefs.current.forEach((ref, i) => {
        if (!ref) return;

        ScrollTrigger.create({
          trigger: ref,
          start: "top 40%",
          end: "bottom 40%",
          onEnter: () => setActiveStep(i),
          onEnterBack: () => setActiveStep(i),
        });
      });
    });

    return () => ctx.revert();
  }, [isMobile]);

  const videoHotspots = [
    {
      title: "Notifications",
      points: [
        "Receive in-app notifications regarding stock, orders, and scheduling.",
        "Receive via SMS or email alerts."
      ],
      top: "4%", left: "68.4%", width: "2.5%", height: "4%"
    },
    {
      title: "Settings",
      points: [
        "Full control over transaction fees, tips, and taxes.",
        "Integrate third-party apps and manage store info.",
        "Manage employees and their access levels.",
        "Open and close register seamlessly."
      ],
      top: "4%", left: "71.6%", width: "7.5%", height: "4%"
    },
    {
      title: "Profile",
      points: [
        "Clock in with optional location tracking and Face ID to log hours.",
        "Integrate with ADP and HCM platforms.",
        "View your shifts and personal settings."
      ],
      top: "4%", left: "79.5%", width: "5.3%", height: "4%"
    },
    {
      title: "Logout",
      points: ["Securely end the current terminal session."],
      top: "4%", left: "85.0%", width: "7.8%", height: "4%"
    },
    {
      title: "Statistics",
      points: [
        "Key insights on product restock and popular products.",
        "Product lifespan and sales analytics comparisons.",
        "Seasonal trends and employee efficiency tracking.",
        "Detect sales returns and neglected products.",
        "AI-driven statistics and automated reports."
      ],
      top: "11.5%", left: "8.5%", width: "41%", height: "54.5%"
    },
    {
      title: "Calendar",
      points: [
        "Syncs with [Google], [Apple], [Calendly], [Outlook], and more.",
        "Automate schedule and shift generation.",
        "Save hours designing schedules based on availability and seniority."
      ],
      top: "11%", left: "50%", width: "21%", height: "27%"
    },
    {
      title: "POS",
      points: [
        "Barcode and image recognition scanner [Camera] built-in (all you need is a camera on your device).",
        "Intelligent search and easy-to-use checkout UI.",
        "Integrates with [Stripe] and native merchant terminals.",
        "Supports all credit card processing and merchant types."
      ],
      top: "11%", left: "71%", width: "20.5%", height: "27%"
    },
    {
      title: "Orders",
      points: [
        "View recent orders from in-house or 3rd party apps like [Shopify], [DoorDash], and [UberEats].",
        "Manage order status and fulfillment workflow.",
        "Process returns, exchanges, and refunds."
      ],
      top: "40%", left: "50%", width: "21%", height: "26.5%"
    },
    {
      title: "Customers",
      points: [
        "Built-in rewards program with points, coupons, and discounts.",
        "Integrated SMS and Email CRM.",
        "Create passes [Wallet] for [ApplePay] and [GooglePay] Wallet.",
        "Track detailed customer purchase history."
      ],
      top: "40%", left: "71%", width: "21%", height: "26.5%"
    },
    {
      title: "Shipments",
      points: [
        "Upload vendor documents for automatic parsing and inventory updates.",
        "Check-in products and auto-flag discrepancies to vendors via email.",
        "Track shipment progress and performance."
      ],
      top: "68%", left: "8%", width: "21%", height: "27%"
    },
    {
      title: "Accounting",
      points: [
        "Chart of accounts, ledger transactions, and invoices.",
        "Generate income sheets and tax forms automatically synced to your business type.",
        "Syncs with cash flow from all parts of the app; smoothly migrate from [QuickBooks]."
      ],
      top: "68%", left: "29.5%", width: "20.5%", height: "27%"
    },
    {
      title: "Inventory",
      points: [
        "Edit and manage all items, print barcodes, and create categories.",
        "Real-time stock levels and key inventory insights."
      ],
      top: "68%", left: "50%", width: "21%", height: "27%"
    },
    {
      title: "Tables",
      points: [
        "Direct database access where all software data is stored.",
        "Edit mistakes, see and export all information collected.",
        "Completely private and and secure database."
      ],
      top: "68%", left: "71%", width: "21%", height: "27%"
    }
  ];

  const getModelOptions = () => {
    if (selectedAgent === 'Create') {
      return ['Veo3', 'Heygen', 'GPT-Image 1', 'DALLE 3', 'SORA', 'Imagen 4', 'Kling', 'Lyra'];
    } else {
      return ['Auto', 'GPT 5', 'Gemini 3', 'Claude 4.5'];
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setIsAgentDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (contextDropdownRef.current && !contextDropdownRef.current.contains(event.target as Node)) {
        setIsContextDropdownOpen(false);
      }
    };

    if (isAgentDropdownOpen || isModelDropdownOpen || isContextDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAgentDropdownOpen, isModelDropdownOpen, isContextDropdownOpen]);

  useEffect(() => {
    // Reset model to first option when agent changes
    const options = getModelOptions();
    if (!options.includes(selectedModel)) {
      setSelectedModel(options[0]);
    }
  }, [selectedAgent, selectedModel]);

  useEffect(() => {
    const fullText = selectedAgent === 'Create'
      ? "make a skyline shot of nyc for the outro"
      : selectedAgent === 'Plan'
        ? "Lets make a plan for my last to leave the circle video like Mr Beast"
        : "Create a title that says Swftly to the Moon\nin blue";
    let currentIndex = 0;
    setTypedText('');
    let typingInterval: NodeJS.Timeout | null = null;

    // Start typing immediately
    typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        if (typingInterval) clearInterval(typingInterval);
      }
    }, 30); // 30ms per character

    return () => {
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [selectedAgent]);



  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Set initial position for Swftly text to accommodate 3D logo in header
    if (swftlyTextRef.current) {
      gsap.set(swftlyTextRef.current, { x: 90 });
    }
  }, []);

  useEffect(() => {
    // Fade out hero text on scroll
    if (!heroTextRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(heroTextRef.current, {
        opacity: 0,
        y: -30,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: "body",
          start: "10px top",
          end: () => window.innerHeight * 0.4,
          scrub: 0.2
        }
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!stickySectionRef.current || !scrollingContentRef.current) return;

    const mm = gsap.matchMedia();
    const content = scrollingContentRef.current;
    const items = content.querySelectorAll('.story-item');
    if (items.length === 0) return;

    mm.add("(min-width: 768px)", () => {
      // MASTER SCROLL TRIGGER: Handles Snapping and Hotspot State
      ScrollTrigger.create({
        trigger: stickySectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 2.5,
        onUpdate: (self) => {
          const progress = self.progress;

          // Video Speed/Scrub Logic
          if (videoRef.current && !hasHitTargetTime.current) {
            const firstStepEnd = 1 / items.length;
            const scrollTargetTime = (progress / firstStepEnd) * 3;

            if (videoRef.current.currentTime < 3) {
              if (scrollTargetTime > videoRef.current.currentTime) {
                videoRef.current.currentTime = Math.min(scrollTargetTime, 3);
              }
            }

            if (videoRef.current.currentTime >= 3) {
              videoRef.current.pause();
              videoRef.current.currentTime = 3;
              hasHitTargetTime.current = true;
            }
          }

          const step = Math.min(Math.floor(progress * items.length), items.length - 1);
          setStickyStep(step);

          const hotspotIndices = [4, 4, 6, 7, 8, 5, 10, 9, 11, 12, 1, 2];
          setVideoInfoStep(hotspotIndices[step] || 4);
        }
      });

      // MOVEMENT: Pull the content UP as the user scrolls DOWN
      const firstItem = items[0] as HTMLElement;
      const lastItem = items[items.length - 1] as HTMLElement;
      const startY = (window.innerHeight * 0.55) - (firstItem.offsetTop + firstItem.offsetHeight / 2);
      const endY = (window.innerHeight * 0.55) - (lastItem.offsetTop + lastItem.offsetHeight / 2);

      gsap.fromTo(content,
        { y: startY },
        {
          y: endY,
          ease: "none",
          scrollTrigger: {
            trigger: stickySectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1
          }
        }
      );

      // REVEAL TIMELINE
      const revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: stickySectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1
        }
      });

      items.forEach((item, i) => {
        const snapPoint = i / (items.length - 1);
        if (i === 0) {
          gsap.set(item, { opacity: 1, filter: 'blur(0px)', y: 0 });
          revealTl.to(item, { opacity: 0, filter: 'blur(20px)', y: -50, duration: 0.1, ease: "none" }, 0.15);
        } else if (i === items.length - 1) {
          gsap.set(item, { opacity: 0, filter: 'blur(20px)', y: 50 });
          revealTl.to(item, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.1, ease: "none" }, 0.85);
        } else {
          gsap.set(item, { opacity: 0, filter: 'blur(20px)', y: 50 });
          revealTl.to(item, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.1, ease: "none" }, snapPoint - 0.1)
            .to(item, { opacity: 0, filter: 'blur(20px)', y: -50, duration: 0.1, ease: "none" }, snapPoint + 0.1);
        }
      });
    });

    return () => mm.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#final-cta",
          start: "top 30%",
          end: "center center",
          scrub: 1,
        }
      });

      tl.fromTo(finalGetRef.current,
        { y: 60, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', ease: "power3.out" },
        0
      );
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const video = entry.target as HTMLVideoElement;
            const isMobile = video === mobileVideoRef.current;
            const hasPlayed = isMobile ? hasMobileVideoPlayed.current : hasVideoPlayed.current;

            if (!hasPlayed) {
              if (isMobile) {
                // Keep mobile video frozen
                hasMobileVideoPlayed.current = true;
              } else {
                video.play().catch(e => console.log("Video play failed:", e));
                hasVideoPlayed.current = true;
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      videoRef.current.load();
      observer.observe(videoRef.current);
    }
    if (mobileVideoRef.current) {
      mobileVideoRef.current.load();
      observer.observe(mobileVideoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Detect when third section is in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsThirdSectionInView(true);
        }
      },
      { threshold: 0.3 }
    );

    if (thirdSectionRef.current) {
      observer.observe(thirdSectionRef.current);
    }

    return () => {
      if (thirdSectionRef.current) {
        observer.unobserve(thirdSectionRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <GradualBlur
        target="page"
        position="bottom"
        height="4rem"
        strength={5}
        divCount={15}
        curve="bezier"
        exponential={true}
        opacity={0.85}
      />
      {/* Header */}
      {/* Header */}
      <header
        className={`fixed top-4 left-4 right-4 z-[1001] transition-all duration-300 ${isScrolled ? 'bg-gradient-to-b from-white/60 to-white/10 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]' : 'bg-transparent border-transparent'}`}
      >
        <div className="w-full pl-0 pr-4 py-1.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 relative w-12 h-12">
            <button onClick={() => navigate('/')} className="flex items-center gap-4 relative w-full h-full group focus:outline-none">
              <span className="absolute left-[74px] sm:left-[86px] md:left-[100px] lg:left-[124px] text-[12px] md:text-sm font-bold text-black py-1 drop-shadow-[0_0_8px_rgba(44,25,252,0.15)] block whitespace-nowrap">
                Swftly
              </span>
            </button>
          </div>
          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex items-center gap-10">
              {['Docs', 'Pricing', 'Book A Demo'].map((item) => {
                const handleNav = () => {
                  if (item === 'Docs') {
                    navigate('/docs');
                  } else if (item === 'Pricing') {
                    navigate('/pricing');
                  } else if (item === 'Book A Demo') {
                    navigate('/book-a-demo');
                  }
                };

                return (
                  <div key={item}>
                    <NavButton onClick={handleNav}>
                      {item}
                    </NavButton>
                  </div>
                );
              })}
              <NavButton isBold onClick={() => navigate('/waitlist')}>
                Get Started
                <ArrowUpRight className="w-4 h-4 relative z-10" />
              </NavButton>
            </div>

            <button
              type="button"
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-black/70 hover:text-black transition-colors"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-[2000] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/10 backdrop-blur-sm"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-6 right-6 left-6 rounded-[24px] bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_22px_70px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-black/5">
                <span className="text-[12px] font-bold text-black/40 uppercase tracking-widest">Menu</span>
                <button onClick={() => setIsMobileNavOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {['Docs', 'Pricing', 'Book A Demo', 'Get Started'].map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-bold text-black hover:bg-black/5 transition-colors"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      if (item === 'Docs') navigate('/docs');
                      if (item === 'Pricing') navigate('/pricing');
                      if (item === 'Book A Demo') navigate('/book-a-demo');
                      if (item === 'Get Started') navigate('/waitlist');
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ThreeLogo forceDock={true} disableScrollSpin={true} />

      {/* Hero Section */}
      <section className="relative w-full min-h-screen md:min-h-[170vh] bg-white overflow-hidden pb-12 md:pb-32">
        {/* Main Hero White Content Area */}
        <div className="relative w-full z-20">
          <div ref={heroTextRef} className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-[15vh] px-2 md:px-12 relative z-10 md:mt-4">
          </div>
          {/* Tagline, Button & SWFTLY Title */}
          <div className="flex flex-col items-center mt-24 mb-20">
            <div className="flex flex-col items-center mb-16 md:mb-24">
              <p className="text-4xl md:text-7xl text-black font-medium tracking-tight text-center mb-10" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
                "Finally. A true all-in-one POS."
              </p>

              <div className="flex flex-row items-center gap-3 md:gap-6">
                <button
                  onClick={() => navigate('/waitlist')}
                  className="button-24 button-24--blue button-24--hero !px-6 md:!px-10"
                  role="button"
                >
                  <span className="text">Waitlist</span>
                </button>
                <button
                  onClick={() => navigate('/book-a-demo')}
                  className="button-24 button-24--hero !px-6 md:!px-10"
                  role="button"
                >
                  <span className="text">Book a Demo</span>
                </button>
              </div>
            </div>


          </div>
        </div>

        {/* Mobile Bottom Fade - Pushed lower into the transition area */}
        <div className="absolute bottom-[-40px] left-0 w-full h-52 bg-gradient-to-t from-white to-transparent pointer-events-none md:hidden z-20" />



          {/* Floating Bags Scattered Across the Entire Background */}
          <div className="relative z-[50] w-full max-w-6xl mx-auto px-6 mb-20 -mt-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full min-h-[420px] rounded-[32px] relative overflow-hidden flex flex-col group border border-white/70"
              style={{
                background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)',
                boxShadow: '0 2px 40px rgba(160,180,220,0.18)'
              }}
            >
              {/* Radial highlight top-right */}
              <div className="pointer-events-none absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full"
                   style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }} />
              {/* Radial tint bottom-left */}
              <div className="pointer-events-none absolute -bottom-20 -left-16 w-[260px] h-[260px] rounded-full"
                   style={{ background: 'radial-gradient(circle, rgba(200,215,240,0.3) 0%, transparent 70%)' }} />
              {/* Inner gradient for depth (same blue as waitlist button) */}
              <div className="absolute inset-0 rounded-[24px] pointer-events-none bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-80" />
              {/* Table Header Row */}
              <div className="w-full h-12 border-b border-white/40 flex items-center justify-between px-6 bg-white/70 backdrop-blur-sm">
                <div className="h-full flex items-center gap-3">
                  <img src="/Swftly.svg" alt="Swftly" className="w-6 h-6 object-contain brightness-0" />
                  <span className="text-black text-[11px] font-semibold tracking-wide">
                    Automated features
                  </span>
                </div>
                <div className="h-full flex items-center">
                  <Settings size={16} className="text-gray-500" />
                </div>
              </div>

              {/* Table Content */}
              <div className="flex flex-1">
                <div className="w-full flex flex-col">
                  {[
                    { 
                      name: "POS", 
                      desc: "Next-gen checkout with integrated payments and lightning-fast product search.",
                      icons: ["stripe", "visa", "mastercard", "amex", "/tap-to-pay.svg"]
                    },
                    { 
                      name: "Shipments", 
                      desc: "Auto-parse PDFs, spreadsheets, and images from vendors and flag inventory discrepancies via email.",
                      icons: ["file-pdf", "file-excel", "file-image"]
                    },
                    { 
                      name: "Marketing", 
                      desc: "Built-in rewards, SMS, and email marketing to keep customers coming back.",
                      icons: ["/apple-wallet.svg", "/google-wallet.svg", "sms", "mail"]
                    },
                    {
                      name: "Scheduling & Employees", 
                      desc: "Generate optimized shifts and track real-time employee productivity and check-ins.",
                      icons: ["/google-calendar.svg", "/apple-calendar.png", "/outlook.svg", "/calendly.svg"]
                    },
                    { 
                      name: "Accounting", 
                      desc: "Automatically sync orders, payroll, and generate tax forms on autopilot.",
                      icons: ["/justworks.svg", "/adp.svg", "/gusto.svg"]
                    },
                    {
                      name: "Orders", 
                      desc: "View and manage orders from in-house and third-party apps in one place.",
                      icons: ["/shopify.svg", "/doordash.svg", "/ubereats.svg"]
                    },
                    { 
                      name: "Data & Analytics", 
                      desc: "Completely private, secure data warehouse with smart insights into sales, inventory, and performance.",
                      icons: ["database", "chart-bar"]
                    }
                  ].map((item, i) => (
                    <div key={item.name} className="border-b border-white/50 cursor-default">
                      {/* Mobile layout: name + icons on one row, description below */}
                      <div className="md:hidden px-5 py-3 bg-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-black text-[13px] font-semibold tracking-tight">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.icons?.map((icon, idx) => {
                            let content;
                            const isAppleCalendar = icon === '/apple-calendar.png';
                            const isFilePdf = icon === 'file-pdf';
                            const isFileExcel = icon === 'file-excel';
                            const isFileImage = icon === 'file-image';
                            const isFileType = isFilePdf || isFileExcel || isFileImage;

                            if (icon.startsWith('/')) {
                              content = <img src={icon} alt="" className={`w-auto object-contain ${isAppleCalendar ? 'h-[40px] max-w-[48px]' : 'h-5 max-w-[32px]'}`} />;
                            } else if (isFilePdf) {
                              content = (
                                <div className="flex items-center gap-1.5">
                                  <FileText size={14} className="text-red-500" />
                                  <span className="text-[10px] font-semibold text-red-300 tracking-wide">PDF</span>
                                </div>
                              );
                            } else if (isFileExcel) {
                              content = (
                                <div className="flex items-center gap-1.5">
                                  <FileSpreadsheet size={14} className="text-emerald-400" />
                                  <span className="text-[10px] font-semibold text-emerald-300 tracking-wide">XLSX</span>
                                </div>
                              );
                            } else if (isFileImage) {
                              content = (
                                <div className="flex items-center gap-1.5">
                                  <FileImage size={14} className="text-sky-400" />
                                  <span className="text-[10px] font-semibold text-sky-300 tracking-wide">IMG</span>
                                </div>
                              );
                            } else if (icon === 'database') {
                              content = <Database size={16} className="text-[#0055ff]" />;
                            } else if (icon === 'chart-bar') {
                              content = <BarChart3 size={16} className="text-[#0055ff]" />;
                            } else if (icon === 'stripe') {
                              content = <span className="text-[8px] font-black text-[#635BFF] tracking-tighter uppercase">STRIPE</span>;
                            } else if (icon === 'visa') {
                              content = <span className="text-[10px] font-black italic text-[#1A1F71]">VISA</span>;
                            } else if (icon === 'mastercard') {
                              content = <div className="flex gap-0.5"><div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]" /><div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1.5 opacity-80" /></div>;
                            } else if (icon === 'amex') {
                              content = <img src="/amex.svg" alt="Amex" className="h-5 w-auto object-contain max-w-[32px]" />;
                            } else if (icon === 'sms') {
                              content = <MessageCircle size={14} className="text-emerald-400" />;
                            } else if (icon === 'mail') {
                              content = <Mail size={14} className="text-sky-400" />;
                            }

                              if (isAppleCalendar) {
                                return <span key={idx} className="h-[40px] min-w-[42px] flex items-center justify-center -mx-1.5">{content}</span>;
                              }
                              return (
                                <div
                                  key={idx}
                                  className="h-8 min-w-[34px] px-1.5 bg-white rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-white/20"
                                >
                                  {content}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-2 text-black/70 text-[13px] font-medium leading-relaxed">
                          {item.desc}
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:flex h-[64px]">
                        <div className="w-1/4 border-r border-white/70 flex items-center px-8 bg-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.8),0_1px_4px_rgba(15,23,42,0.08)]">
                          <span className="text-black text-sm font-medium tracking-tight transition-colors">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-between px-8 gap-4 bg-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(15,23,42,0.06)]">
                          <span className="text-black/80 text-[13px] font-medium leading-relaxed">
                            {item.desc}
                          </span>

                          {/* Integration Symbols Container */}
                          <div className="flex items-center gap-2 shrink-0">
                            {item.icons?.map((icon, idx) => {
                              let content;
                              const isAppleCalendar = icon === '/apple-calendar.png';
                              const isFilePdf = icon === 'file-pdf';
                              const isFileExcel = icon === 'file-excel';
                              const isFileImage = icon === 'file-image';
                              const isFileType = isFilePdf || isFileExcel || isFileImage;

                              if (icon.startsWith('/')) {
                                content = <img src={icon} alt="" className={`w-auto object-contain ${isAppleCalendar ? 'h-[40px] max-w-[48px]' : 'h-5 max-w-[32px]'}`} />;
                              } else if (isFilePdf) {
                                content = (
                                  <div className="flex items-center gap-1.5">
                                    <FileText size={14} className="text-red-500" />
                                    <span className="text-[10px] font-semibold text-red-300 tracking-wide">PDF</span>
                                  </div>
                                );
                              } else if (isFileExcel) {
                                content = (
                                  <div className="flex items-center gap-1.5">
                                    <FileSpreadsheet size={14} className="text-emerald-400" />
                                    <span className="text-[10px] font-semibold text-emerald-300 tracking-wide">XLSX</span>
                                  </div>
                                );
                              } else if (isFileImage) {
                                content = (
                                  <div className="flex items-center gap-1.5">
                                    <FileImage size={14} className="text-sky-400" />
                                    <span className="text-[10px] font-semibold text-sky-300 tracking-wide">IMG</span>
                                  </div>
                                );
                              } else if (icon === 'database') {
                                content = <Database size={16} className="text-[#0055ff]" />;
                              } else if (icon === 'chart-bar') {
                                content = <BarChart3 size={16} className="text-[#0055ff]" />;
                              } else if (icon === 'stripe') {
                                content = <span className="text-[8px] font-black text-[#635BFF] tracking-tighter uppercase">STRIPE</span>;
                              } else if (icon === 'visa') {
                                content = <span className="text-[10px] font-black italic text-[#1A1F71]">VISA</span>;
                              } else if (icon === 'mastercard') {
                                content = <div className="flex gap-0.5"><div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]" /><div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1.5 opacity-80" /></div>;
                              } else if (icon === 'amex') {
                                content = <img src="/amex.svg" alt="Amex" className="h-5 w-auto object-contain max-w-[32px]" />;
                              } else if (icon === 'sms') {
                                content = <MessageCircle size={14} className="text-emerald-400" />;
                              } else if (icon === 'mail') {
                                content = <Mail size={14} className="text-sky-400" />;
                              }

                              if (isAppleCalendar) {
                                return <span key={idx} className="h-[40px] min-w-[42px] flex items-center justify-center -mx-1.5">{content}</span>;
                              }
                              return (
                                <div
                                  key={idx}
                                  className="h-8 min-w-[34px] px-1.5 bg-white rounded-lg flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-white/20"
                                >
                                  {content}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Glassmorphic inner shine */}
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_0_100px_rgba(255,255,255,0.06)] pointer-events-none" />

              {/* Enhanced light sweep */}
              <div className="absolute -inset-x-full top-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] ease-in-out pointer-events-none" />
            </motion.div>
          </div>



          {/* Absolute Fade to white at the section end */}
          <div className="absolute bottom-0 left-0 w-full h-[80vh] flex flex-col pointer-events-none z-[30]">
            <div className="flex-1 bg-gradient-to-t from-white via-white/40 to-transparent" />
            <div className="h-[20vh] bg-white" />
          </div>
      </section>

      {/* Blue Gradient Feature Squares Section */}
      <section className="relative w-full py-24 bg-white z-20 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          {/* Section Title */}
          <div
            className="mb-16 md:mb-20 text-center"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif' }}
          >
            <h2 className="text-[44px] md:text-[72px] font-semibold tracking-tight text-black leading-[1.05]">
              Automate inventory in 4 steps
            </h2>
            <p className="mt-5 text-[18px] md:text-[26px] text-gray-400 leading-snug max-w-3xl mx-auto">
              Auto-import shipments, catch issues, and flag vendor mismatches instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 lg:gap-8 xl:gap-14">
            {[
              { title: "Upload a shipment", desc: "Upload any document type (PDFs, spreadsheets, images).", x: -0.15, y: -0.2, zoom: 0.7 },
              { title: "AI Extracts & Formats", desc: "Smart parsing for products, pricing, images, and SKUs.", x: 0.25, y: 0.15, zoom: 1.2 },
              { title: "Detects Issues", desc: "Identifies issues and resolves issues with vendors.", x: -0.2, y: 0.25, zoom: 0.9 },
              { title: "Restocks Inventory", desc: "Sync stock, create products, and update accounting.", x: 0.1, y: -0.3, zoom: 1.1 }
            ].map((item, i) => {
              const isActive = isMobile ? (activeStep === i) : (hoveredInventoryCard === i);

              return (
                <div
                  key={i}
                  ref={(el) => { inventoryRefs.current[i] = el; }}
                  className="flex flex-col items-center"
                  onMouseEnter={() => !isMobile && setHoveredInventoryCard(i)}
                  onMouseLeave={() => !isMobile && setHoveredInventoryCard(null)}
                >
                  <div
                    className="aspect-[4/3.5] w-[90%] mx-auto rounded-[32px] relative overflow-hidden border border-white/70"
                    style={{
                      background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)',
                      boxShadow: '0 2px 40px rgba(160,180,220,0.18)'
                    }}
                  >
                    {/* Radial highlight top-right */}
                    <div
                      className="pointer-events-none absolute -top-24 -right-24 w-[260px] h-[260px] rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}
                    />
                    {/* Radial tint bottom-left */}
                    <div
                      className="pointer-events-none absolute -bottom-20 -left-16 w-[200px] h-[200px] rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(200,215,240,0.3) 0%, transparent 70%)' }}
                    />

                    {/* Inner soft glow */}
                    <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/28 via-transparent to-transparent pointer-events-none" />

                    {/* Custom Mockups */}
                    {i === 0 && <UploadMockup isHovered={isActive} />}
                    {i === 1 && <AIExtractionMockup isHovered={isActive} />}
                    {i === 2 && <PrecisionProofingMockup isHovered={isActive} />}
                    {i === 3 && <LiveInventoryMockup isHovered={isActive} />}
                  </div>

                  <div
                    className="mt-4 w-full px-4 text-left"
                    style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-gray-300 text-[14px] md:text-[15px] font-medium leading-none mt-[3px]">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-[17px] md:text-[18px] font-semibold text-black tracking-tight mb-1">
                          {item.title}
                        </h3>
                        <p className="text-[13px] md:text-[14px] text-gray-500 leading-snug max-w-[260px]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accounting Section */}
      <section className="relative w-full bg-white z-20 overflow-hidden flex items-center justify-center py-32">
        <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center w-full">
          <div
            className="text-left w-full max-w-5xl mx-auto mb-8 flex flex-col gap-4"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-[40px] md:text-[64px] font-semibold tracking-tight leading-[1.05]"
            >
              <span className="text-black">Accounting on autopilot</span>{' '}
              <span className="text-gray-400">that stays in sync.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-gray-400 text-[18px] md:text-[22px] font-medium leading-snug max-w-3xl"
            >
              Sync orders, connect payroll, and Swftly generates reports and statements automatically.
            </motion.p>
          </div>

          {/* Outer shell container (outer_container_shell.html) */}
          <div
            className="w-full rounded-[32px] relative overflow-hidden border border-white/70"
            style={{
              background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)',
              boxShadow: '0 2px 40px rgba(160,180,220,0.18)'
            }}
          >
            <div
              className="pointer-events-none absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 w-[260px] h-[260px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(200,215,240,0.3) 0%, transparent 70%)' }}
            />

            {/* Software App Window Mockup - Proportional Scaling Wrapper */}
            <div
              className="w-full relative flex justify-center px-4 py-6 md:px-8 md:py-8"
              style={{ height: `${mockupScale * 540 + 20}px` }}
            >
              <div
                className="w-[960px] h-[540px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.10)] overflow-hidden flex flex-col border border-black/5 origin-top shrink-0 relative select-none"
                style={{ transform: `scale(${mockupScale})` }}
              >
              {/* App Window Header */}
              <div className="w-full bg-white border-b border-[#eee] px-5 py-1 flex justify-between items-center z-10 relative">
                <div className="flex items-center flex-1 min-w-0 select-none">
                  <div className="px-3 py-1 text-[22px] font-bold tracking-[0.5px] text-[#0055ff] leading-tight select-none font-sans">
                    SWFTLY
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="p-1 flex items-center justify-center relative cursor-pointer group translate-y-[2px]">
                    <Bell size={28} className="text-[#888] transition-colors group-hover:text-gray-600" />
                    <div className="absolute top-0 right-0 min-w-[20px] h-5 bg-[#ef4444] rounded-full flex items-center justify-center text-white text-[12px] font-bold px-1 select-none">
                      3
                    </div>
                  </div>

                  <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-[#4a90e2] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      DR
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-gray-700">Derek Rose</span>
                      <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {/* App Mockup Content Area */}
              <div className="flex-1 w-full bg-white flex overflow-hidden font-sans">
                <AppSidebar />

                <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                  <AppDashboard />

                  {/* Floating Notification Stack */}
                  <div className="absolute right-6 top-4 flex flex-col gap-2.5 z-20 w-[240px] pointer-events-none">
                    <NotificationCard
                      icon="/shopify.svg"
                      title="New Shopify Order"
                      subtitle="#SP-3301 · Today · 6:58 PM"
                      accentColor="#5A863E"
                      accentRgb="100,148,62"
                      className="translate-x-3"
                    />
                    <NotificationCard
                      icon="/doordash.svg"
                      title="New DoorDash Order"
                      subtitle="#DD-4821 · Today · 7:14 PM"
                      accentColor="#FF3008"
                      accentRgb="255,48,8"
                      className="translate-x-3"
                    />
                    <NotificationCard
                      icon="/ubereats.svg"
                      title="New Uber Eats Order"
                      subtitle="#UE-9174 · Today · 7:02 PM"
                      accentColor="#06c167"
                      accentRgb="6,193,103"
                      className="translate-x-14"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Automate Growth Section */}






      {/* Choose Your Hardware Section */}
      <section className="relative w-full py-28 md:py-32 bg-white z-20">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left: image inside outer_container_shell */}
            <div>
              <div
                className="rounded-[32px] relative overflow-hidden border border-white/70 min-h-[440px] md:min-h-[520px]"
                style={{
                  background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)',
                  boxShadow: '0 2px 40px rgba(160,180,220,0.18)'
                }}
              >
                <div
                  className="pointer-events-none absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}
                />
                <div
                  className="pointer-events-none absolute -bottom-20 -left-16 w-[260px] h-[260px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(200,215,240,0.3) 0%, transparent 70%)' }}
                />

                <div className="p-6 md:p-8 h-full flex flex-col">
                  <div
                    className="mb-5"
                    style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif' }}
                  >
                    <h2 className="text-[34px] md:text-[40px] font-semibold tracking-tight text-black leading-[1.05]">
                      Choose your hardware
                    </h2>
                    <p className="mt-3 text-[14px] md:text-[16px] text-gray-500 leading-snug max-w-[520px]">
                      Run Swftly on any device, keep your existing peripherals, and connect your processor seamlessly.
                    </p>
                  </div>

                  <div className="mt-auto rounded-[24px] bg-white/70 border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.10)] overflow-hidden w-full">
                    <img
                      src="/hardware-hero.png"
                      alt="Hardware Ecosystem"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right: title + stacked rows (screenshot style) */}
            <div
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif' }}
            >
              <div className="mt-10">
                {[
                  { title: 'Mobile & Desktop', desc: 'Use iOS, Android, Chrome, Windows, or macOS.' },
                  { title: 'Use existing hardware', desc: 'Scanners, printers, cash drawers, and terminals. Stripe built-in, or connect your current provider.' }
                ].map((row, idx) => (
                  <div key={idx} className="py-8 border-b border-gray-100">
                    <div>
                      <div className="text-black text-[22px] md:text-[26px] font-semibold tracking-tight">
                        {row.title}
                      </div>
                      <div className="mt-2 text-gray-400 text-[14px] md:text-[16px] leading-relaxed max-w-xl">
                        {row.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-10 text-gray-400 text-sm md:text-base leading-relaxed max-w-xl tracking-tight">
                <span className="font-semibold text-gray-900">*Swftly does not take a percentage of your transactions.</span>{' '}
                Default processor is Stripe: online 2.9% + 30¢, in-person 2.7% + 5¢ (Stripe Terminal).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section className="relative w-full py-24 md:py-28 bg-white z-20">
        <div
          className="max-w-5xl mx-auto px-4 md:px-8"
          style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif' }}
        >
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-black mb-10">
            Frequently asked questions
          </h2>

          {[
            {
              q: 'How do shipments get imported?',
              a: 'Upload PDFs, spreadsheets, or images. Swftly extracts products, pricing, and SKUs, then prepares inventory updates for approval.'
            },
            {
              q: 'How does mismatch detection work?',
              a: 'Swftly compares the vendor document against expected items and pricing, then flags discrepancies before you publish inventory.'
            },
            {
              q: 'Can Swftly notify vendors automatically?',
              a: 'Yes. Swftly can draft and send discrepancy emails so vendors can correct invoices or issue credits quickly.'
            },
            {
              q: 'What hardware can I use?',
              a: 'Run Swftly on mobile or desktop. Keep your existing scanners, printers, cash drawers, and terminals.'
            },
            {
              q: 'Do you take a percentage of transactions?',
              a: 'No. Swftly does not take a percentage of your transactions.'
            }
          ].map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={item.q} className="border-t border-gray-200 last:border-b last:border-gray-200">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full py-5 md:py-6 flex items-center justify-between gap-6 text-left"
                >
                  <span className="text-[15px] md:text-[16px] font-semibold text-black">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pb-6 text-[14px] md:text-[15px] text-gray-500 leading-relaxed max-w-3xl">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA + Footer (shared background) */}
      <div style={{ background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)' }}>
      {/* Final CTA Section */}
      <section
        id="final-cta"
        className="relative w-full h-screen flex flex-col overflow-hidden bg-transparent"
      >
        {/* Fade from white into the shared gradient */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-56 bg-gradient-to-b from-white via-white/70 to-transparent z-[1]" />

        {/* Subtle blurred background logos */}
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <img
            src="/Swftly.svg"
            alt=""
            aria-hidden="true"
            className="absolute -top-10 -left-24 w-[520px] opacity-[0.16] blur-[2px] rotate-[-12deg] mix-blend-soft-light"
          />
          <img
            src="/Swftly.svg"
            alt=""
            aria-hidden="true"
            className="absolute top-[18%] -right-28 w-[640px] opacity-[0.14] blur-[2.5px] rotate-[18deg] mix-blend-soft-light"
          />
          <img
            src="/Swftly.svg"
            alt=""
            aria-hidden="true"
            className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 w-[760px] opacity-[0.12] blur-[3px] rotate-[2deg] mix-blend-soft-light"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 mt-20 relative z-[2] flex flex-col items-center">
            <h2
              ref={finalGetRef}
              className="text-[10vw] md:text-[120px] font-bold text-black tracking-tight text-center"
              style={{ fontFamily: 'Zodiak, serif' }}
            >
              Get Swftly
            </h2>
            <div className="mt-8">
              <button className="button-29" role="button" onClick={() => navigate('/waitlist')}>
                <span className="text">Join The Waitlist</span>
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Footer (Cluely-style) */}
      <section
        className="w-full px-4 py-14 md:py-16 relative z-10"
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
        }}
      >
        <footer className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10 md:gap-8 pb-10 border-b border-black/5">
            {/* Left: brand + status */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <img src="/Swftly.svg" alt="Swftly" className="w-5 h-5 object-contain brightness-0" />
                <span className="text-[14px] font-semibold text-black tracking-tight">Swftly</span>
              </div>

              <button type="button" className="button-42">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text text-[12px] font-medium text-black/70">All systems operational</span>
              </button>

            </div>

            {/* Columns */}
            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Resources</div>
              <div className="space-y-2">
                {[
                  { label: 'Mobile', onClick: () => navigate('/') },
                  { label: 'About Us', onClick: () => navigate('/') },
                  { label: 'Docs', onClick: () => navigate('/docs') }
                ].map((item) => (
                  <button 
                    key={item.label} 
                    type="button" 
                    className="block text-[13px] text-black/55 hover:text-black/75 transition-colors"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Support</div>
              <div className="space-y-2">
                {[
                  { label: 'Help Center', onClick: () => navigate('/docs') },
                  { label: 'Contact Us', onClick: () => navigate('/waitlist') }
                ].map((item) => (
                  <button 
                    key={item.label} 
                    type="button" 
                    className="block text-[13px] text-black/55 hover:text-black/75 transition-colors"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Legal</div>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Data Processing Agreement'].map((t) => (
                  <button key={t} type="button" className="block text-[13px] text-black/55 hover:text-black/75 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="text-[12px] text-black/45">
              © 2026 Swftly. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-black/55">
              <button type="button" onClick={() => window.open('https://instagram.com/getswftly', '_blank')} className="hover:text-black/75 transition-colors">
                <Instagram size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://linkedin.com/company/swftly', '_blank')} className="hover:text-black/75 transition-colors">
                <Linkedin size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://github.com', '_blank')} className="hover:text-black/75 transition-colors">
                <Github size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://x.com', '_blank')} className="hover:text-black/75 transition-colors">
                <img src="/x-logo.svg" alt="X" className="w-[18px] h-[18px] object-contain opacity-70 hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </footer>
      </section>
      </div>

    </div>
  );
}
