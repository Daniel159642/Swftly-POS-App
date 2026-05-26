'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { 
  ArrowUpRight, 
  Instagram, 
  Github, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown,
  Linkedin,
  Search,
  Command
} from 'lucide-react';
import ThreeLogo from '../components/ThreeLogo';
import { useTransition } from '../TransitionContext';

const DOCS_DATA = [
  {
    id: 'overview',
    title: 'Get Started',
    overview: "Swftly is a modern point-of-sale and business management platform for retail and hospitality. Use the sections below to get oriented, then explore the full documentation.",
    subsections: [
      { 
        id: 'what-is-swftly', 
        title: 'What is Swftly?', 
        content: "Swftly is a unified point-of-sale and business management platform built for retail and hospitality. It combines POS, inventory, accounting, employee management, and customer marketing into a single system—so you can run your business from one place.\n\nWhether you operate a single store or multiple locations, Swftly scales with you. The platform runs on desktop, tablet, and mobile, with native apps for iOS, Android, and Windows."
      },
      { 
        id: 'quickstart', 
        title: 'Quickstart', 
        content: "Get up and running in minutes.\n\n1. Sign up or log in to your Swftly account.\n2. Complete your business profile (name, address, tax settings).\n3. Add products or import your inventory via CSV.\n4. Configure your first register and payment methods.\n5. Invite your team and set permissions.\n\nOnce your basics are set, you can start ringing sales, receiving shipments, and generating reports. Use the documentation links below to dive deeper into any area."
      },
      { 
        id: 'navigating-interface', 
        title: 'Navigating the Interface', 
        content: "The main navigation is organized by function.\n\n• POS — Ring sales, process refunds, and manage orders.\n• Inventory — Products, categories, shipments, and stock levels.\n• Accounting — Chart of accounts, transactions, financial statements, and reports.\n• Employees — Scheduling, permissions, and payroll data.\n• Customers — Loyalty, marketing, and customer records.\n• Settings — Business profile, tax, payments, and integrations.\n\nUse the sidebar or top menu to switch between sections. Press ⌘K (or Ctrl+K) to search documentation from anywhere."
      }
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    overview: "Swftly's accounting engine uses standard double-entry bookkeeping. Every POS event—sales, refunds, voids, shipment receipts, cash drops, and inventory adjustments—automatically creates balanced journal entries. Your financial records stay audit-ready and tax-compliant without manual data entry.",
    subsections: [
      { 
        id: 'how-it-works', 
        title: 'How It Works', 
        content: "When you complete a sale, refund, or receive a shipment, Swftly uses configurable posting rules to create journal entries. Each posting rule maps the event to the correct debit and credit accounts.\n\nFor example, a cash sale debits Cash and credits Sales Revenue. Revenue is recorded at gross (before discounts), so discounts appear as contra-revenue on your P&L. The system supports different payment methods (cash, card, store credit, gift card) and handles tips, transaction fees, and COGS automatically."
      },
      { 
        id: 'directory', 
        title: 'Directory', 
        content: "The Directory tab is your central hub for saved reports and shipment documents.\n\nSaved reports include exported PDFs and CSVs of financial statements (Income Statement, Balance Sheet, Cash Flow, Trial Balance). Shipment documents are the vendor invoices and spreadsheets you uploaded during receiving.\n\nYou can view, download, rename, or delete any file from the directory. Use the search bar to quickly find reports by name or date."
      },
      { 
        id: 'settings', 
        title: 'Settings', 
        content: "Configure accounting and POS behavior that affects your books.\n\nSet default sales tax by state, transaction fee rates by payment processor, and employee hourly rates. Control POS transaction fee mode (additional, included, or none), whether refunds absorb transaction fees, and tip allocation (logged-in employee vs. split all). Configure tip suggestions, payment flow, and signature requirements for returns.\n\nThese settings drive how journal entries are built when sales and refunds occur."
      },
      { 
        id: 'chart-of-accounts', 
        title: 'Chart of Accounts', 
        content: "Your Chart of Accounts defines every account used in journal entries.\n\nCreate, edit, and archive accounts organized by type: Assets, Liabilities, Equity, Revenue, Cost of Goods Sold, and Expenses. Each account has a code, name, and type. Use filters to quickly find accounts. Click an account to view its ledger (all debits and credits for that account).\n\nSwftly ships with standard retail and hospitality templates; you can customize them to match your business."
      },
      { 
        id: 'transactions', 
        title: 'Transactions', 
        content: "The Transactions tab shows every journal entry in your system.\n\nEach transaction has a date, description, and one or more lines (debits and credits that must balance). Filter by date range, account, or search by description. Auto-generated entries from POS events are linked to their source (e.g., order ID).\n\nYou can also create manual journal entries for adjustments, accruals, or transfers. All entries are immutable once posted."
      },
      { 
        id: 'ledger', 
        title: 'General Ledger', 
        content: "The General Ledger displays all entries across all accounts in chronological order.\n\nFilter by date range to focus on a specific period. Each row shows the date, account, description, debit amount, credit amount, and running balance. Use the export button to download the ledger as a PDF for audit or sharing.\n\nYou can also drill into a single account from the Chart of Accounts to see its ledger in isolation."
      },
      { 
        id: 'statements', 
        title: 'Financial Statements', 
        content: "Generate standard financial reports: Trial Balance, Income Statement (P&L), Balance Sheet, and Cash Flow.\n\nSelect a report type from the dropdown, then choose a date range. For Income Statement, Balance Sheet, and Cash Flow you can compare two periods side by side. Export any report to PDF or Excel. Click an account line in a report to jump to that account's ledger.\n\nReports are built from your posted transactions and reflect real-time data."
      },
      { 
        id: 'invoices', 
        title: 'Invoices', 
        content: "Create and manage customer invoices.\n\nAdd line items with descriptions, quantities, and prices. Set invoice and due dates, payment terms, and assign a customer. Track status: draft, sent, partial, paid, or overdue. Record payments against invoices to update balances.\n\nInvoices post to Accounts Receivable and Revenue when finalized. Use filters to find invoices by status, customer, or date range."
      },
      { 
        id: 'vendors', 
        title: 'Vendors', 
        content: "Manage vendor records and bills.\n\nAdd vendors with contact details and payment terms. Create bills for purchases you receive and link them to vendors. Track amounts due and paid. Bills post to Accounts Payable and Expense or Inventory when recorded.\n\nThe Vendors tab helps you reconcile what you owe and what you've paid, and keeps vendor data in sync with your general ledger."
      },
      { 
        id: 'payroll', 
        title: 'Payroll', 
        content: "The Payroll tab summarizes labor costs by date range.\n\nUse the date picker to select a period (e.g., the current month). View total labor cost, total hours, total tips, and employee count. See per-employee breakdowns with hours worked and wages. Export payroll data for ADP, Gusto, JustWorks, or Paychex.\n\nThis data is pulled from employee clock-in records and hourly rates configured in Settings, so your P&L reflects real labor expenses."
      }
    ]
  },
  {
    id: 'employees',
    title: 'Employee Management',
    overview: "Manage your most valuable asset with integrated scheduling, performance tracking, and granular security controls. Swftly's employee module reduces labor waste and ensures accountability across every terminal.",
    subsections: [
      { 
        id: 'scheduling', 
        title: 'Scheduling', 
        content: "Create and distribute shifts in minutes. The scheduler tracks employee availability and seniority, helping you build optimal rotations while staying within labor budgets."
      },
      { 
        id: 'calendar', 
        title: 'Calendar Integrations', 
        content: "Sync schedules directly with Google Calendar, Apple iCal, and Outlook. Employees receive instant updates when shifts are published or changed."
      },
      { 
        id: 'payroll-sync', 
        title: 'Payroll Integrations', 
        content: "Export verified hours directly to major payroll providers like ADP, Gusto, and Paychex. Eliminate manual data entry and minimize errors in paychecks."
      },
      { 
        id: 'productivity', 
        title: 'Productivity Data', 
        content: "Measure performance with sales-per-hour and item-movement KPIs. Identify your top performers and optimize staff placement during peak hours."
      },
      { 
        id: 'security', 
        title: 'Security & Access', 
        content: "Set granular permissions for every role. Administer PIN-based access to sensitive operations like refunds, voids, and till openings."
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Customer & Marketing',
    overview: "Turn one-time shoppers into lifelong loyalists. Our customer module combines native loyalty programs with omni-channel marketing tools to drive repeat visits and increase average order value.",
    subsections: [
      { 
        id: 'loyalty', 
        title: 'Loyalty Program', 
        content: "Launch a custom points system. Reward customers for every dollar spent and allow them to redeem points for discounts or free items directly at the register."
      },
      { 
        id: 'passes', 
        title: 'Digital Passes', 
        content: "Issue loyalty cards directly to Apple Wallet and Google Pay. Customers can see their point balances and available rewards in real-time on their phones."
      },
      { 
        id: 'sms', 
        title: 'SMS Marketing', 
        content: "Send personalized text messages for holiday sales, birthday rewards, or back-in-stock alerts. High-deliverability routes ensure your messages are seen instantly."
      },
      { 
        id: 'email', 
        title: 'Email Marketing', 
        content: "Design beautiful, branded email campaigns. Use purchase history to segment lists and send relevant offers to specific customer groups."
      },
      { 
        id: 'promotions', 
        title: 'Promotions & Discounts', 
        content: "Create complex promotional rules (e.g., Buy One Get One half off) and scheduled discounts that apply automatically during checkout."
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    overview: "Total control over your supply chain. Swftly uses AI to automate the most tedious parts of inventory management, from receiving shipments to spotting discrepancies in stock levels.",
    subsections: [
      { 
        id: 'products', 
        title: 'Products', 
        content: "Manage thousands of SKUs with ease. Track variations, categories, and multiple tax rates from a single intuitive dashboard."
      },
      { 
        id: 'import-export', 
        title: 'Importing Products', 
        content: "Bulk import your existing inventory via CSV or Excel. Our intelligent mapper handles complex data structures and prevents duplicate entries."
      },
      { 
        id: 'ingredients', 
        title: 'Ingredients', 
        content: "Track raw materials and ingredients for manufacturing or food Establishment types. Deduct stock at the ingredient level every time a finished product is sold."
      },
      { 
        id: 'shipments', 
        title: 'Shipments & Automation', 
        content: "Automate shipment receiving. Our AI parses vendor invoices and automatically updates stock levels, cost prices, and margins."
      },
      { 
        id: 'shopify', 
        title: 'Shopify Sync', 
        content: "Keep your online and in-store inventory perfectly in sync. When an item sells on Shopify, your POS inventory updates instantly, and vice versa."
      }
    ]
  },
  {
    id: 'data',
    title: 'Data Analytics',
    overview: "Knowledge is power. Swftly transforms raw data into actionable insights, helping you identify trends, optimize operations, and grow your bottom line with confidence.",
    subsections: [
      { 
        id: 'tables', 
        title: 'Tables & Raw Data', 
        content: "Access your data in its rawest form. Export SQL-ready tables for sales, inventory history, and employee actions for custom reporting."
      },
      { 
        id: 'stats', 
        title: 'Statistics', 
        content: "Visual dashboards showing revenue, profit margins, and traffic patterns over any time period."
      },
      { 
        id: 'privacy', 
        title: 'Privacy & Security', 
        content: "We take data security seriously. All PII is hashed and anonymized, and our data handling practices are built on enterprise-grade security standards."
      }
    ]
  },
  {
    id: 'hardware',
    title: 'Hardware',
    overview: "Swftly runs on hardware of all sizes. From professional desktop registers to mobile tablets and smartphone apps, we've optimized every interface for speed and clarity.",
    subsections: [
      { 
        id: 'terminals', 
        title: 'Desktop & Mobile', 
        content: "Run Swftly on any device with a screen. Our native apps for iOS, Android, and Windows provide the best performance and device integration."
      },
      { 
        id: 'scanners', 
        title: 'Scanner Connection', 
        content: "Connect standard USB or Bluetooth barcode scanners. Swftly also supports built-in camera scanning for mobile devices."
      },
      { 
        id: 'payments', 
        title: 'Payment Terminals', 
        content: "Seamlessly connect Stripe terminals like the Verifone P400 or Wisepad. Native integration ensures error-free totals and fast processing."
      },
      { 
        id: 'register', 
        title: 'Register Drawers', 
        content: "Automatically open register drawers on cash sales. Compatible with standard RJ11/12 drawer connections through receipt printers."
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    overview: "Stay informed in real-time. Communicate with staff and customers across multiple channels, from in-app alerts to enterprise chat platforms.",
    subsections: [
      { 
        id: 'app-alerts', 
        title: 'In-App Notifications', 
        content: "Receive instant alerts on your terminal for low stock, shift requests, or administrative overrides."
      },
      { 
        id: 'email-sms', 
        title: 'Email & SMS', 
        content: "Send digital receipts, daily sales reports, and customer marketing messages via high-deliverability email and SMS gateways."
      },
      { 
        id: 'chat', 
        title: 'Chat Integrations', 
        content: "Directly integrate with Slack, WhatsApp, Discord, and Telegram. Receive critical business alerts where your team already communicates."
      }
    ]
  }
];

export default function DocsPage() {
  const { navigate } = useTransition();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileTabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo(0, 0);
    }
    // Auto-scroll active tab into view on mobile
    if (mobileTabsScrollRef.current) {
      const activeEl = mobileTabsScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab, activeSubTab]);

  const filteredDocs = DOCS_DATA.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.subsections.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeDoc = DOCS_DATA.find(d => d.id === activeTab) || DOCS_DATA[0];
  const activeSubDoc = activeDoc ? activeDoc.subsections.find(s => s.id === activeSubTab) : null;

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(0,0,0,0.08)]">{children}</span>
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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)',
        fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
      }}
    >
      <header
        className={`fixed top-4 left-4 right-4 z-[1001] transition-all duration-300 ${isScrolled ? 'bg-gradient-to-b from-white/60 to-white/10 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]' : 'bg-transparent border-transparent'}`}
      >
        <div className="w-full pl-0 pr-4 py-1.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 relative w-12 h-12">
            <button onClick={() => navigate('/')} className="flex items-center gap-4 relative w-full h-full group focus:outline-none">
              <span className="absolute left-[74px] sm:left-[86px] md:left-[100px] lg:left-[124px] text-[12px] md:text-sm font-bold text-black py-1 drop-shadow-[0_0_8px_rgba(0,0,0,0.08)] block whitespace-nowrap">
                Swftly
              </span>
            </button>
          </div>
          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex items-center gap-10">
              {['Docs', 'Pricing', 'Book A Demo'].map((item) => {
                const handleNav = () => {
                  if (item === 'Docs') {
                    setActiveTab('overview');
                    setActiveSubTab(null);
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

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[3000] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_22px_70px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <div className="p-4 border-b border-black/5 flex items-center gap-3">
                <Search className="w-5 h-5 text-black/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search documentation..."
                  className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-black placeholder:text-black/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/5 text-[10px] font-bold text-black/40">
                  <span className="text-[12px]">ESC</span>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                {filteredDocs.length > 0 ? (
                  <div className="space-y-1">
                    {filteredDocs.map((doc) => (
                      <div key={doc.id}>
                        <button
                          onClick={() => {
                            setActiveTab(doc.id);
                            setActiveSubTab(null);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-black/5 transition-colors group text-left"
                        >
                          <div>
                            <div className="text-[14px] font-semibold text-black">{doc.title}</div>
                            <div className="text-[11px] text-black/40 capitalize">Main Section Overview</div>
                          </div>
                        </button>
                        {doc.subsections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(sub => (
                           <button
                             key={sub.id}
                             onClick={() => {
                               setActiveTab(doc.id);
                               setActiveSubTab(sub.id);
                               setIsSearchOpen(false);
                               setSearchQuery('');
                             }}
                             className="w-full flex items-center gap-3 px-8 py-2 rounded-2xl hover:bg-black/5 transition-colors group text-left"
                           >
                             <div className="text-[13px] font-medium text-black/60">{sub.title}</div>
                             <div className="ml-auto text-[10px] font-bold text-black/20 uppercase tracking-widest">{doc.title}</div>
                           </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="text-[14px] font-medium text-black/60">No results found for "{searchQuery}"</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Nav Overlay */}
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
              className="absolute top-6 right-6 left-6 rounded-[24px] bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_22px_70px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 flex items-center justify-between border-b border-black/5 flex-shrink-0">
                <span className="text-[12px] font-bold text-black/40 uppercase tracking-widest">Menu</span>
                <button onClick={() => setIsMobileNavOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Global Nav */}
                <div className="space-y-1">
                   {['Pricing', 'Book A Demo', 'Get Started'].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-4 py-3 rounded-xl text-[16px] font-bold text-black hover:bg-black/5 transition-colors flex items-center justify-between"
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        if (item === 'Pricing') navigate('/pricing');
                        if (item === 'Book A Demo') navigate('/book-a-demo');
                        if (item === 'Get Started') navigate('/waitlist');
                      }}
                    >
                      {item}
                      <ArrowUpRight className="w-4 h-4 opacity-20" />
                    </button>
                  ))}
                </div>

                {/* Docs Nav */}
                <div className="space-y-3">
                   <div className="text-[11px] font-black text-black/20 uppercase tracking-[0.2em] px-4">Documentation</div>
                   <div className="space-y-1">
                      <button
                        className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-bold transition-colors flex items-center justify-between ${activeTab === 'overview' ? 'bg-black text-white' : 'text-black/60 hover:bg-black/5'}`}
                        onClick={() => {
                          setActiveTab('overview');
                          setActiveSubTab(null);
                          setIsMobileNavOpen(false);
                        }}
                      >
                        Get Started
                      </button>
                      {DOCS_DATA.filter(d => d.id !== 'overview').map((item) => (
                        <div key={item.id}>
                          <button
                            className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-bold transition-colors flex items-center justify-between ${activeTab === item.id ? 'bg-black text-white' : 'text-black/60 hover:bg-black/5'}`}
                            onClick={() => {
                              setActiveTab(item.id);
                              setActiveSubTab(null);
                              setIsMobileNavOpen(false);
                            }}
                          >
                            {item.title}
                            {activeTab === item.id && <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ThreeLogo forceDock={true} disableScrollSpin={true} />

      <main className="flex-1 flex flex-col md:flex-row pt-28 md:pt-32 px-4 md:px-8 pb-8 gap-8 max-w-7xl mx-auto w-full relative z-10 min-h-0">
        {/* Mobile Sections Scroller */}
        <div className="md:hidden -mx-4 px-4 pb-4 overflow-x-auto scrollbar-hide flex-shrink-0" ref={mobileTabsScrollRef}>
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              data-active={activeTab === 'overview'}
              onClick={() => { setActiveTab('overview'); setActiveSubTab(null); }}
              className={`px-4 py-2.5 rounded-full text-[13px] font-bold transition-all border whitespace-nowrap ${activeTab === 'overview' ? 'bg-white border-black/10 text-black shadow-sm' : 'bg-transparent border-transparent text-black/40'}`}
            >
              Get Started
            </button>
            {DOCS_DATA.filter(d => d.id !== 'overview').map((item) => (
              <button
                key={item.id}
                data-active={activeTab === item.id}
                onClick={() => { setActiveTab(item.id); setActiveSubTab(null); }}
                className={`px-4 py-2.5 rounded-full text-[13px] font-bold transition-all border whitespace-nowrap ${activeTab === item.id ? 'bg-white border-black/10 text-black shadow-sm' : 'bg-transparent border-transparent text-black/40'}`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block w-72 shrink-0 overflow-y-auto pr-4 scrollbar-hide py-4">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 mb-8 rounded-xl bg-white/40 border border-white/60 shadow-sm text-black/40 hover:text-black/60 transition-all group"
          >
            <Search className="w-4 h-4" />
            <span className="text-[13px] font-medium">Search documentation...</span>
            <div className="ml-auto flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
              <Command className="w-3 h-3" />
              <span className="text-[10px] font-bold">K</span>
            </div>
          </button>

          <div className="space-y-1">
            {/* Get Started - appears once above Documentation */}
            <div className="mb-4">
              <button
                onClick={() => { setActiveTab('overview'); if (activeTab !== 'overview') setActiveSubTab(null); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 group font-sans ${activeTab === 'overview' ? 'bg-white/60 shadow-sm ring-1 ring-black/5 text-black' : 'text-black/40 hover:text-black/60 hover:bg-white/30'}`}
              >
                Get Started
                <div className="ml-auto">
                  {activeTab === 'overview' ? (
                    <ChevronDown className="w-4 h-4 text-black/20" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-black/10 group-hover:text-black/20" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {activeTab === 'overview' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 ml-4"
                  >
                    <button
                      onClick={() => setActiveSubTab(null)}
                      className={`w-full text-left px-5 py-2 text-[12px] font-bold transition-colors rounded-lg font-sans ${activeSubTab === null ? 'text-black' : 'text-black/35 hover:text-black/50 hover:bg-white/20'}`}
                    >
                      Overview
                    </button>
                    {DOCS_DATA.find(d => d.id === 'overview')?.subsections.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id)}
                        className={`w-full text-left px-5 py-2 text-[12px] font-bold transition-colors rounded-lg mt-0.5 font-sans ${activeSubTab === sub.id ? 'text-black' : 'text-black/35 hover:text-black/50 hover:bg-white/20'}`}
                      >
                        {sub.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="text-[11px] font-bold text-black/60 uppercase tracking-widest px-4 mb-4 font-sans">Documentation</div>
            {DOCS_DATA.filter(d => d.id !== 'overview').map((item) => (
              <div key={item.id} className="mb-2">
                <button
                  onClick={() => { 
                    setActiveTab(item.id); 
                    if (activeTab !== item.id) setActiveSubTab(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 group font-sans ${activeTab === item.id ? 'bg-white/60 shadow-sm ring-1 ring-black/5 text-black' : 'text-black/40 hover:text-black/60 hover:bg-white/30'}`}
                >
                  {item.title}
                  <div className="ml-auto">
                    {activeTab === item.id ? (
                      <ChevronDown className="w-4 h-4 text-black/20" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-black/10 group-hover:text-black/20" />
                    )}
                  </div>
                </button>
                
                <AnimatePresence>
                  {activeTab === item.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-1 ml-4"
                    >
                      <button
                        onClick={() => setActiveSubTab(null)}
                        className={`w-full text-left px-5 py-2 text-[12px] font-bold transition-colors rounded-lg font-sans ${activeSubTab === null ? 'text-black' : 'text-black/35 hover:text-black/50 hover:bg-white/20'}`}
                      >
                        Overview
                      </button>
                      {item.subsections.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveSubTab(sub.id)}
                          className={`w-full text-left px-5 py-2 text-[12px] font-bold transition-colors rounded-lg mt-0.5 font-sans ${activeSubTab === sub.id ? 'text-black' : 'text-black/35 hover:text-black/50 hover:bg-white/20'}`}
                        >
                          {sub.title}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div 
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
        >
          <div ref={contentRef} className="flex-1 overflow-y-auto pt-4 pb-6 px-6 md:pt-10 md:pb-20 md:px-20 scrollbar-hide">
            {/* Mobile Subsections horizontal scroller */}
            {activeSubTab && (
              <button 
                onClick={() => setActiveSubTab(null)}
                className="md:hidden flex items-center gap-1.5 text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-6 bg-neutral-200/60 px-3 py-1.5 rounded-full w-fit"
              >
                <ChevronRight className="w-3 h-3 rotate-180" />
                Back to {activeTab === 'overview' ? 'Get Started' : 'Overview'}
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                  key={`${activeTab}-${activeSubTab}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-2xl"
                >
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                    <span>{activeSubTab ? activeDoc?.title : 'Overview'}</span>
                    {activeSubTab && (
                       <>
                          <ChevronRight className="w-3 h-3" />
                          <span>{activeSubDoc?.title}</span>
                       </>
                    )}
                  </div>

                  <h1 className="text-2xl md:text-4xl font-black text-neutral-600 mb-4 md:mb-6 tracking-tighter">
                    {activeSubTab ? activeSubDoc?.title : activeDoc?.title}
                  </h1>

                  <div className="prose prose-p:leading-relaxed prose-p:text-[14px] md:prose-p:text-[16px] max-w-none font-medium">
                     <p className="whitespace-pre-wrap text-neutral-600">
                        {activeSubTab ? activeSubDoc?.content : activeDoc?.overview}
                     </p>
                  </div>

                  {!activeSubTab && activeDoc && (
                     <div className="mt-8 pt-6 space-y-8">
                        <div className="rounded-2xl border border-neutral-200/60 bg-white/50 p-4 md:p-5">
                          <h3 className="text-[11px] md:text-[12px] font-bold text-neutral-500 tracking-wider mb-3">Explore Subsections</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {activeDoc.subsections.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => setActiveSubTab(sub.id)}
                                className="flex items-center justify-between px-4 py-3 md:py-2.5 rounded-xl bg-white border border-neutral-200/60 text-left group hover:shadow-sm hover:border-neutral-300 transition-all shadow-sm"
                              >
                                <span className="text-[12px] md:text-[13px] font-medium text-neutral-600 group-hover:text-neutral-700 tracking-tight">{sub.title}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                        {activeDoc.id === 'overview' && (
                          <div className="rounded-2xl border border-neutral-200/60 bg-white/50 p-4 md:p-5">
                            <h3 className="text-[11px] md:text-[12px] font-bold text-neutral-500 tracking-wider mb-3">Full Documentation</h3>
                            <div className="space-y-2">
                              {DOCS_DATA.filter(d => d.id !== 'overview').map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => { setActiveTab(item.id); setActiveSubTab(null); }}
                                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/40 border border-white/60 text-left group hover:bg-white/60 transition-all"
                                >
                                  <span className="text-[12px] md:text-[13px] font-medium text-neutral-600 group-hover:text-neutral-700 tracking-tight">{item.title}</span>
                                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                     </div>
                  )}
                </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex-shrink-0 px-6 md:px-20 py-5 md:py-6 border-t border-neutral-200/60 text-[9px] md:text-[11px] font-medium text-neutral-500 tracking-[0.2em] flex justify-between items-center">
            <span className="hidden sm:inline">Swftly Platform Docs</span>
            <span className="sm:hidden">Swftly Docs</span>
            <span>Updated March 2026</span>
          </div>
        </div>
      </main>

      <section
        className="w-full px-4 py-14 md:py-16 relative z-10 mt-auto"
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
        }}
      >
        <footer className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10 md:gap-8 pb-10 border-b border-black/5">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <img src="/Swftly.svg" alt="Swftly" className="w-5 h-5 object-contain brightness-0" />
                <span className="text-[14px] font-semibold text-black tracking-tight uppercase">Swftly</span>
              </div>

              <button type="button" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-black/5 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-black/40 uppercase tracking-widest">Network Operational</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-black text-black/80 uppercase tracking-wider">Resources</div>
              <div className="space-y-2">
                {[
                  { label: 'Mobile', onClick: () => navigate('/') },
                  { label: 'About Us', onClick: () => navigate('/') },
                  { label: 'Docs', onClick: () => navigate('/docs') }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="block text-[12px] font-bold text-black/40 hover:text-black transition-colors uppercase tracking-tight"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-black text-black/80 uppercase tracking-wider">Support</div>
              <div className="space-y-2">
                {[
                   { label: 'Waitlist', onClick: () => navigate('/waitlist') },
                  { label: 'Help Center', onClick: () => navigate('/docs') },
                  { label: 'Contact Us', onClick: () => navigate('/waitlist') }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="block text-[12px] font-bold text-black/40 hover:text-black transition-colors uppercase tracking-tight"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-black text-black/80 uppercase tracking-wider">Legal</div>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Data Processing Agreement'].map((t) => (
                  <button key={t} type="button" className="block text-[12px] font-bold text-black/40 hover:text-black transition-colors uppercase tracking-tight">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">
              © 2026 Swftly Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-black/30">
              <button type="button" onClick={() => window.open('https://instagram.com/getswftly', '_blank')} className="hover:text-black transition-colors">
                <Instagram size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://linkedin.com/company/swftly', '_blank')} className="hover:text-black transition-colors">
                <Linkedin size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://github.com', '_blank')} className="hover:text-black transition-colors">
                <Github size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://x.com', '_blank')} className="hover:text-black transition-colors">
                <img src="/x-logo.svg" alt="X" className="w-[18px] h-[18px] object-contain opacity-40 hover:opacity-100 transition-opacity brightness-0" />
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
