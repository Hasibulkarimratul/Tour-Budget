/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type MouseEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Users, 
  ReceiptText, 
  Scale, 
  ChevronLeft, 
  Download,
  Trash2,
  Calendar,
  Camera,
  Navigation as NavIcon,
  BarChart3,
  Moon,
  Sun,
  PieChart as PieIcon,
  TrendingUp,
  History
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend
} from 'recharts';
import { type Tour, type Member, type Expense, type MemberBalance, type Transaction } from './types';
import { calculateBalances, simplifyDebts, generateCSV, formatCurrency } from './lib/utils';

// --- Placeholder for Advanced Features ---
const GPS_TRACKING_PERMISSION = "geolocation";
const GALLERY_PERMISSION = "camera";

export default function App() {
  // --- State ---
  const [tours, setTours] = useState<Tour[]>(() => {
    const saved = localStorage.getItem('tourvault_tours');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'expenses' | 'balances' | 'insights'>('expenses');
  const [showAddTour, setShowAddTour] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState<Expense | 'new' | null>(null);

  const [commonEvents, setCommonEvents] = useState<string[]>(() => {
    const saved = localStorage.getItem('tourvault_common_events');
    return saved ? JSON.parse(saved) : ['Lunch', 'Dinner', 'Breakfast', 'Hotel', 'Fuel', 'Entry Fee', 'Snacks', 'Bus Fare', 'Train Fare'];
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tourvault_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  // --- Persistence & Theme ---
  useEffect(() => {
    localStorage.setItem('tourvault_tours', JSON.stringify(tours));
  }, [tours]);

  useEffect(() => {
    localStorage.setItem('tourvault_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tourvault_common_events', JSON.stringify(commonEvents));
  }, [commonEvents]);

  // --- Computed ---
  const activeTour = tours.find(t => t.id === activeTourId);
  const balances = activeTour ? calculateBalances(activeTour.members, activeTour.expenses) : [];
  const settlements: Transaction[] = activeTour ? simplifyDebts(balances) : [];

  // --- Handlers ---
  const handleAddTour = (name: string, date: string) => {
    const newTour: Tour = {
      id: crypto.randomUUID(),
      name,
      date,
      members: [],
      expenses: [],
    };
    setTours([...tours, newTour]);
    setShowAddTour(false);
    setActiveTourId(newTour.id);
  };

  const handleDeleteTour = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this tour and all its data?')) {
      setTours(tours.filter(t => t.id !== id));
      if (activeTourId === id) setActiveTourId(null);
    }
  };

  const updateActiveTour = (updated: Tour) => {
    setTours(tours.map(t => t.id === updated.id ? updated : t));
  };

  const handleExportCSV = () => {
    if (!activeTour) return;
    const csv = generateCSV(balances, settlements);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTour.name}_balances.csv`;
    a.click();
  };

  const handleAddMember = (name: string, phone: string, address?: string, occupation?: string, nid?: string) => {
    if (!activeTour) return;
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      phoneNumber: phone,
      address,
      occupation,
      nid,
    };
    updateActiveTour({
      ...activeTour,
      members: [...activeTour.members, newMember]
    });
  };

  const handleSaveExpense = (expense: Expense) => {
    if (!activeTour) return;
    const exists = activeTour.expenses.some(e => e.id === expense.id);
    const newExpenses = exists 
      ? activeTour.expenses.map(e => e.id === expense.id ? expense : e)
      : [...activeTour.expenses, expense];
    
    updateActiveTour({
      ...activeTour,
      expenses: newExpenses
    });
    setShowExpenseForm(null);
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen selection:bg-sky-500/30">
      <AnimatePresence mode="wait">
        {!activeTourId ? (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md mx-auto px-6 py-12"
          >
            <header className="mb-12 text-center md:text-left">
              <h1 className="text-5xl font-black tracking-tighter text-sky-500 mb-2">TourVault</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Precision Split. Zero Friction. Happy Travels.</p>
            </header>

            <div className="space-y-4">
              {tours.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                  <p className="text-slate-500 mb-4 font-medium">No tours created yet</p>
                  <button 
                    onClick={() => setShowAddTour(true)}
                    className="bg-slate-900 border border-slate-800 text-sky-400 px-6 py-2 rounded-full font-medium"
                    id="create-first-tour-btn"
                  >
                    Start a New Adventure
                  </button>
                </div>
              ) : (
                tours.map(tour => (
                  <div 
                    key={tour.id}
                    onClick={() => setActiveTourId(tour.id)}
                    className="p-6 item-card rounded-[32px] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group flex justify-between items-center"
                    id={`tour-card-${tour.id}`}
                  >
                    <div>
                      <h3 className="text-xl font-black group-hover:text-sky-500 transition-colors uppercase tracking-tight">{tour.name}</h3>
                      <div className="flex gap-4 mt-1 text-xs text-slate-500 font-bold">
                        <span className="flex items-center gap-1"><Users size={12}/> {tour.members.length} members</span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {tour.date || 'TBD'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteTour(tour.id, e)}
                      className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                      id={`delete-tour-${tour.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowAddTour(true)}
              className="fixed bottom-8 right-8 w-14 h-14 bg-sky-500 hover:bg-sky-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-sky-500/20 transition-all hover:scale-110 active:scale-95 z-40"
              id="fab-add-tour"
            >
              <Plus size={28} />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen flex flex-col max-w-2xl mx-auto"
          >
            {/* Header */}
            <header className="px-6 py-6 border-b border-slate-200 dark:border-slate-900 sticky top-0 bg-[var(--bg-main)] z-30">
              <div className="flex justify-between items-center mb-3">
                <button 
                  onClick={() => setActiveTourId(null)}
                  className="flex items-center gap-2 text-slate-500 hover:text-sky-400 text-sm transition-colors"
                  id="back-to-home"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-sky-400 transition-all"
                  id="theme-toggle"
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold uppercase tracking-tighter">{activeTour?.name}</h1>
                  <p className="text-slate-500 text-xs font-mono">{activeTour?.date}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportCSV} className="p-2 bg-slate-900 text-slate-400 rounded-xl hover:text-sky-400" title="Share as Sheet" id="export-btn">
                    <Download size={20} />
                  </button>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <nav className="flex px-4 py-3 bg-[var(--bg-surface)] sticky top-[105px] z-30 backdrop-blur-xl border-b border-[var(--border-color)]">
              {[
                { id: 'members', icon: Users, label: 'Members' },
                { id: 'expenses', icon: History, label: 'History' },
                { id: 'balances', icon: Scale, label: 'Settle' },
                { id: 'insights', icon: BarChart3, label: 'Insights' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 flex flex-col items-center gap-1.5 rounded-2xl transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-105' 
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                  }`}
                  id={`tab-${tab.id}`}
                >
                  <tab.icon size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Content */}
            <main className="flex-1 p-6 pb-32">
              {activeTab === 'members' && (
                <MemberView activeTour={activeTour!} onAdd={handleAddMember} onUpdate={updateActiveTour} />
              )}
              {activeTab === 'expenses' && (
                <ExpenseView 
                  activeTour={activeTour!} 
                  onAdd={() => setShowExpenseForm('new')} 
                  onEdit={(exp) => setShowExpenseForm(exp)}
                  onDelete={(id) => updateActiveTour({...activeTour!, expenses: activeTour!.expenses.filter(e => e.id !== id)})}
                />
              )}
              {activeTab === 'balances' && (
                <BalanceView balances={balances} settlements={settlements} />
              )}
              {activeTab === 'insights' && (
                <InsightsView activeTour={activeTour!} balances={balances} />
              )}
            </main>

            {/* Floating Action Buttons */}
            {activeTab === 'expenses' && (
              <button 
                onClick={() => setShowExpenseForm('new')}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-sky-500 hover:bg-sky-400 text-white px-8 py-4 rounded-full flex items-center gap-2 shadow-2xl shadow-sky-500/40 transition-all hover:scale-110 active:scale-95 z-40 font-black text-sm uppercase tracking-widest border-4 border-white dark:border-slate-900"
                id="fab-add-expense"
              >
                <Plus size={20} strokeWidth={3} />
                Log Expense
              </button>
            )}

            {/* Placeholders for Advanced Features */}
            <div className="fixed bottom-2 left-0 right-0 px-6 pointer-events-none z-30">
              <div className="max-w-2xl mx-auto flex gap-2">
                <button className="flex-1 py-2 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[9px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-60 pointer-events-auto flex items-center justify-center gap-1.5 shadow-sm">
                  <NavIcon size={12}/> GPS Track
                </button>
                <button className="flex-1 py-2 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[9px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-60 pointer-events-auto flex items-center justify-center gap-1.5 shadow-sm">
                  <Camera size={12}/> Gallery Sync
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAddTour && (
          <AddTourModal 
            onClose={() => setShowAddTour(false)} 
            onSave={handleAddTour} 
          />
        )}
            {showExpenseForm && (
          <ExpenseFormModal
            members={activeTour?.members || []}
            expense={showExpenseForm === 'new' ? null : showExpenseForm}
            commonEvents={commonEvents}
            setCommonEvents={setCommonEvents}
            onClose={() => setShowExpenseForm(null)}
            onSave={handleSaveExpense}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Calculator Component ---
function Calculator({ value, onValueChange, onClose }: { value: string, onValueChange: (v: string) => void, onClose: () => void }) {
  const [display, setDisplay] = useState(value || '0');
  
  const handleKey = (key: string) => {
    if (key === 'C') setDisplay('0');
    else if (key === '=') {
      try {
        // Simple safety: only allow numbers and basic math operators
        const sanitized = display.replace(/[^-^0-9+*/.]/g, '');
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        setDisplay(Number(result).toFixed(2).replace(/\.00$/, ''));
      } catch {
        setDisplay('Error');
      }
    } else {
      setDisplay(display === '0' || display === 'Error' ? key : display + key);
    }
  };

  const handleApply = () => {
    let final = display;
    if (display.includes('+') || display.includes('-') || display.includes('*') || display.includes('/')) {
      try {
        const sanitized = display.replace(/[^-^0-9+*/.]/g, '');
        // eslint-disable-next-line no-eval
        final = Number(eval(sanitized)).toFixed(2).replace(/\.00$/, '');
      } catch {
        return;
      }
    }
    onValueChange(final);
    onClose();
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-slate-800 p-4 rounded-3xl w-64 shadow-2xl absolute z-[110] top-20 right-4"
    >
      <div className="bg-slate-950 p-4 rounded-2xl mb-4 text-right overflow-hidden">
        <p className="text-sky-500 font-mono text-2xl truncate">{display}</p>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button onClick={() => handleKey('C')} className="col-span-4 bg-red-500/10 text-red-400 py-2 rounded-xl font-bold">CLEAR</button>
        {buttons.map(b => (
          <button 
            key={b} 
            onClick={() => handleKey(b)}
            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all active:scale-90"
          >
            {b === '*' ? '×' : b === '/' ? '÷' : b}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs">CLOSE</button>
        <button onClick={handleApply} className="flex-[2] py-3 bg-sky-500 text-white rounded-xl font-bold text-xs uppercase">APPLY VALUE</button>
      </div>
    </motion.div>
  );
}

// --- Sub-components (Simplified for now, will keep in this file for cohesion) ---

function AddTourModal({ onClose, onSave }: { onClose: () => void, onSave: (name: string, date: string) => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] w-full max-w-sm shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-6 tracking-tight">NEW TOUR</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1 mb-1 block">Place / Name</label>
            <input 
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-sky-500 transition-colors font-medium"
              placeholder="e.g. Switzerland 2024"
              value={name}
              onChange={e => setName(e.target.value)}
              id="new-tour-name"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1 mb-1 block">Start Date (Optional)</label>
            <input 
              type="date"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-sky-500 transition-colors text-slate-300"
              value={date}
              onChange={e => setDate(e.target.value)}
              id="new-tour-date"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-100 transition-colors"
              id="cancel-add-tour"
            >
              CANCEL
            </button>
            <button 
              onClick={() => name && onSave(name, date)}
              className="flex-[2] bg-sky-500 hover:bg-sky-400 py-4 rounded-2xl font-bold text-white shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
              id="save-new-tour"
            >
              CREATE TOUR
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MemberView({ activeTour, onAdd, onUpdate }: { activeTour: Tour, onAdd: (n: string, p: string, a?: string, o?: string, ni?: string) => void, onUpdate: (t: Tour) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [nid, setNid] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  
  const handleRegisterOrUpdate = () => {
    if (!name) return;
    
    if (editingMemberId) {
      onUpdate({
        ...activeTour,
        members: activeTour.members.map(m => m.id === editingMemberId ? {
          ...m, name, phoneNumber: phone, address, occupation, nid
        } : m)
      });
      setEditingMemberId(null);
    } else {
      onAdd(name, phone, address, occupation, nid);
    }
    
    setName('');
    setPhone('');
    setAddress('');
    setOccupation('');
    setNid('');
    setShowDetails(false);
  };

  const startEdit = (m: Member) => {
    setEditingMemberId(m.id);
    setName(m.name);
    setPhone(m.phoneNumber);
    setAddress(m.address || '');
    setOccupation(m.occupation || '');
    setNid(m.nid || '');
    setShowDetails(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeMember = (id: string) => {
    if (confirm('Delete member? This may invalidate existing expenses.')) {
      onUpdate({
        ...activeTour,
        members: activeTour.members.filter(m => m.id !== id)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="item-card rounded-[32px] p-6 shadow-xl border-sky-500/20">
        <h3 className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-4">
          {editingMemberId ? 'Edit Crew Details' : 'Register New Member'}
        </h3>
        <div className="flex flex-col gap-3">
          <input 
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-500 font-bold" 
            placeholder="Full Name" 
            value={name} 
            onChange={e => setName(e.target.value)}
          />
          <input 
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-500 font-mono text-sm" 
            placeholder="Phone Number" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
          />
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] font-bold text-slate-500 hover:text-sky-400 transition-colors self-start ml-2"
          >
            {showDetails ? '- HIDE MORE INFO' : '+ ADD MORE INFO (ADDRESS, NID...)'}
          </button>

          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-3 overflow-hidden"
            >
              <input 
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-500 text-sm" 
                placeholder="Address" 
                value={address} 
                onChange={e => setAddress(e.target.value)}
              />
              <input 
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-500 text-sm" 
                placeholder="Occupation" 
                value={occupation} 
                onChange={e => setOccupation(e.target.value)}
              />
              <input 
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-4 py-3 focus:outline-none focus:border-sky-500 text-sm font-mono" 
                placeholder="NID / ID Number" 
                value={nid} 
                onChange={e => setNid(e.target.value)}
              />
            </motion.div>
          )}

          <div className="flex gap-2">
            {editingMemberId && (
              <button 
                onClick={() => {
                  setEditingMemberId(null);
                  setName('');
                  setPhone('');
                  setAddress('');
                  setOccupation('');
                  setNid('');
                  setShowDetails(false);
                }}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold transition-all text-xs"
              >
                CANCEL
              </button>
            )}
            <button 
              onClick={handleRegisterOrUpdate}
              className="flex-[2] py-3 bg-slate-800 dark:bg-slate-700 text-sky-400 rounded-2xl font-bold transition-all active:scale-95 text-xs"
            >
              {editingMemberId ? 'SAVE CHANGES' : 'REGISTER MEMBER'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-4">Tour Crew ({activeTour.members.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activeTour.members.map(m => (
            <div key={m.id} className="item-card rounded-2xl p-4 flex justify-between items-center group hover:border-sky-500/30 transition-all">
              <div 
                className="flex-1 cursor-pointer truncate"
                onClick={() => startEdit(m)}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm truncate">{m.name}</p>
                  {(m.address || m.occupation || m.nid) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Profile Complete" />
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500">{m.phoneNumber}</p>
              </div>
              <div className="flex items-center">
                <button onClick={() => startEdit(m)} className="p-2 text-slate-400 hover:text-sky-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Plus size={14} className="rotate-45" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeMember(m.id); }} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpenseView({ activeTour, onAdd, onEdit, onDelete }: { activeTour: Tour, onAdd: () => void, onEdit: (e: Expense) => void, onDelete: (id: string) => void }) {
  const sortedExpenses = [...activeTour.expenses].sort((a, b) => {
    const dateA = new Date((a as any).dateTime || (a as any).date).getTime();
    const dateB = new Date((b as any).dateTime || (b as any).date).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Journey Log ({sortedExpenses.length})</h3>
        {/* FAB handles addition */}
      </div>

      {sortedExpenses.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] rounded-[32px] border border-dashed border-[var(--border-color)]">
          <ReceiptText className="mx-auto mb-3 text-slate-300" size={32} />
          <p className="text-[var(--text-muted)] font-medium">No expenses logged yet</p>
        </div>
      ) : (
        sortedExpenses.map(exp => (
          <div 
            key={exp.id} 
            className="item-card bg-[var(--bg-surface)] rounded-[32px] p-6 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group"
            onClick={() => onEdit(exp)}
            id={`expense-row-${exp.id}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-lg group-hover:text-sky-500 transition-colors uppercase tracking-tight line-clamp-1">{exp.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    {new Date((exp as any).dateTime || (exp as any).date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-sky-500">{formatCurrency(exp.totalAmount)}</p>
                <span className="text-[8px] font-bold text-slate-400 uppercase">{exp.splitMode} SPLIT</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]/30">
              <div className="flex -space-x-1.5">
                {Object.keys(exp.beneficiaries).slice(0, 4).map(mid => (
                  <div key={mid} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-[var(--bg-surface)] flex items-center justify-center text-[8px] font-black uppercase text-sky-500">
                    {activeTour.members.find(m => m.id === mid)?.name.charAt(0)}
                  </div>
                ))}
                {Object.keys(exp.beneficiaries).length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-[var(--bg-surface)] flex items-center justify-center text-[7px] font-black text-slate-500">
                    +{Object.keys(exp.beneficiaries).length - 4}
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); if(confirm('Delete expense?')) onDelete(exp.id); }}
                className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function InsightsView({ activeTour, balances }: { activeTour: Tour, balances: MemberBalance[] }) {
  const totalCost = activeTour.expenses.reduce((acc: number, e: Expense) => acc + e.totalAmount, 0);
  const avgPerMember = totalCost / (activeTour.members.length || 1);
  
  // Category Breakdown
  const categoryMap: { [key: string]: number } = {};
  activeTour.expenses.forEach(e => {
    const key = e.name.toLowerCase().split(' ')[0] || 'other'; // Simple categorization by first word
    categoryMap[key] = (categoryMap[key] || 0) + e.totalAmount;
  });
  
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ 
    name: name.toUpperCase(), 
    value: value as number
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const colors = ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

  const timelineData = activeTour.expenses.map(e => ({
    date: new Date((e as any).dateTime || (e as any).date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: e.totalAmount,
    name: e.name
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="item-card p-5 bg-sky-500 text-white">
          <TrendingUp className="mb-2 opacity-60" size={20} />
          <p className="text-[10px] font-bold uppercase opacity-80">Total Tour Cost</p>
          <h2 className="text-2xl font-black">{formatCurrency(totalCost)}</h2>
        </div>
        <div className="item-card p-5 bg-indigo-500 text-white">
          <Users className="mb-2 opacity-60" size={20} />
          <p className="text-[10px] font-bold uppercase opacity-80">Avg. Per Member</p>
          <h2 className="text-2xl font-black">{formatCurrency(avgPerMember)}</h2>
        </div>
      </div>

      <div className="item-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieIcon size={16} className="text-sky-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Cost Distribution</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="item-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={16} className="text-sky-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Spending Timeline</h3>
        </div>
        <div className="h-48 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData}>
              <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[8, 8, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="item-card p-6">
         <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Member Contributions</h3>
         <div className="space-y-4">
           {balances.sort((a,b) => b.totalPaid - a.totalPaid).map((b, i) => (
             <div key={b.member.id}>
               <div className="flex justify-between text-[11px] font-black mb-1 px-1">
                 <span>{b.member.name}</span>
                 <span className="text-sky-500">{formatCurrency(b.totalPaid)}</span>
               </div>
               <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(b.totalPaid / (totalCost || 1)) * 100}%` }}
                   className="h-full bg-sky-500 rounded-full"
                 />
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}

function BalanceView({ balances, settlements }: { balances: MemberBalance[], settlements: Transaction[] }) {
  const totalSpent = balances.reduce((acc, b) => acc + b.totalPaid, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Total Overview */}
      <div className="bg-sky-500 rounded-[32px] p-8 text-white shadow-2xl shadow-sky-500/30 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-sky-100 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp size={12} /> Total Expenditure</p>
          <h2 className="text-5xl font-black">{formatCurrency(totalSpent)}</h2>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[10px] font-bold text-sky-200 uppercase tracking-tight">Across {balances.length} Members</p>
            <PieIcon size={18} className="opacity-40" />
          </div>
        </div>
      </div>

      {/* Tables Side by Side or stacked */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 px-4">Individual Breakdown</h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-tighter">Member</th>
                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-tighter">Paid</th>
                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-tighter">Share</th>
                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-tighter text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {balances.map(b => (
                  <tr key={b.member.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-5 font-bold">{b.member.name}</td>
                    <td className="px-5 py-5 text-slate-400">{formatCurrency(b.totalPaid)}</td>
                    <td className="px-5 py-5 text-slate-400">{formatCurrency(b.totalShare)}</td>
                    <td className={`px-5 py-5 text-right font-black ${b.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {b.netBalance > 0 ? '+' : ''}{formatCurrency(b.netBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlements */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400">Optimal Payoff Strategy</h3>
            <span className="text-[8px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold uppercase">Debt Simplified</span>
          </div>
          <div className="space-y-2">
            {settlements.length === 0 ? (
              <div className="p-8 text-center text-slate-600 bg-slate-950 border border-slate-900 rounded-3xl font-medium">All balanced! No transactions needed.</div>
            ) : (
              settlements.map((s, idx) => {
                const from = balances.find(b => b.member.id === s.from)?.member.name;
                const to = balances.find(b => b.member.id === s.to)?.member.name;
                return (
                  <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-2xl p-4 group">
                    <div className="flex items-center gap-3">
                      <div className="text-left leading-tight">
                        <p className="font-bold text-red-400">{from}</p>
                        <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Owes</p>
                      </div>
                      <ChevronLeft size={16} className="rotate-180 text-slate-800 group-hover:text-slate-600 transition-colors" />
                      <div className="text-left leading-tight">
                        <p className="font-bold text-green-400">{to}</p>
                        <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Receives</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{formatCurrency(s.amount)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPLEX MODAL: Expense Form ---
function ExpenseFormModal({ 
  members, 
  expense, 
  commonEvents, 
  setCommonEvents, 
  onClose, 
  onSave 
}: { 
  members: Member[], 
  expense: Expense | null, 
  commonEvents: string[],
  setCommonEvents: (v: string[] | ((prev: string[]) => string[])) => void,
  onClose: () => void, 
  onSave: (e: Expense) => void 
}) {
  const [name, setName] = useState(expense?.name || '');
  const [amount, setAmount] = useState(expense?.totalAmount.toString() || '');
  const [dateTime, setDateTime] = useState(expense?.dateTime || new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16));
  const [notes, setNotes] = useState(expense?.notes || '');
  const [splitMode, setSplitMode] = useState<'equal' | 'amount' | 'percent'>(expense?.splitMode || 'equal');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showEventMgmt, setShowEventMgmt] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  
  const [payers, setPayers] = useState<{ [id: string]: number }>(expense?.payers || {});
  const [beneficiaries, setBeneficiaries] = useState<{ [id: string]: number }>(expense?.beneficiaries || {});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // --- Helpers ---
  const totalAmount = parseFloat(amount) || 0;
  const totalPaid = (Object.values(payers) as number[]).reduce((a, b) => a + (b || 0), 0);
  const paidDeficit = Number((totalAmount - totalPaid).toFixed(2));

  const totalSplitSum = (Object.values(beneficiaries) as number[]).reduce((a, b) => a + (b || 0), 0);
  const splitDeficit = splitMode === 'amount' 
    ? Number((totalAmount - totalSplitSum).toFixed(2))
    : splitMode === 'percent'
      ? Number((100 - totalSplitSum).toFixed(2))
      : 0;

  const distributeEquallyPaid = () => {
    const selectedPayers = Object.keys(payers).filter(id => payers[id] > 0);
    const targets = selectedPayers.length > 0 ? selectedPayers : members.map(m => m.id);
    if (targets.length === 0) return;
    const share = Number((totalAmount / targets.length).toFixed(2));
    const newPayers: { [id: string]: number } = {};
    targets.forEach(id => { newPayers[id] = share; });
    setPayers(newPayers);
  };

  const selectAllBeneficiaries = () => {
    const allSelected = Object.keys(beneficiaries).length === members.length;
    if (allSelected) {
      setBeneficiaries({});
    } else {
      const newBens: { [id: string]: number } = {};
      members.forEach(m => { newBens[m.id] = 0; });
      setBeneficiaries(newBens);
    }
  };

  const toggleBeneficiary = (id: string) => {
    const newBens = { ...beneficiaries };
    if (newBens[id] !== undefined) delete newBens[id];
    else newBens[id] = 0;
    setBeneficiaries(newBens);
  };

  // --- Splitting Logic ---
  useEffect(() => {
    if (splitMode === 'equal') {
      const selectedBens = Object.keys(beneficiaries);
      if (selectedBens.length > 0) {
        const share = Number((totalAmount / selectedBens.length).toFixed(2));
        const newBens: { [id: string]: number } = {};
        selectedBens.forEach(id => { newBens[id] = share; });
        const currentSum = (Object.values(beneficiaries) as number[]).reduce((a, b) => a + b, 0);
        if (Math.abs(currentSum - totalAmount) > 0.05) {
          setBeneficiaries(newBens);
        }
      }
    }
  }, [totalAmount, splitMode, Object.keys(beneficiaries).length]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    let finalBeneficiaries = { ...beneficiaries };
    if (splitMode === 'percent') {
      Object.keys(finalBeneficiaries).forEach(id => {
        const pct = beneficiaries[id] || 0;
        finalBeneficiaries[id] = Number(((pct / 100) * totalAmount).toFixed(2));
      });
    }
    onSave({
      id: expense?.id || crypto.randomUUID(),
      name,
      totalAmount,
      dateTime,
      payers,
      beneficiaries: finalBeneficiaries,
      notes,
      splitMode
    });
  };

  const isAllSelected = Object.keys(beneficiaries).length === members.length;

  if (showConfirmation) {
    return (
      <div className="modal-overlay z-[100] px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-main)] border border-[var(--border-color)] p-8 rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden relative">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-3"><ReceiptText className="text-sky-500" size={24} /></div>
            <h2 className="text-lg font-black uppercase tracking-tight">Review Entry</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total: {formatCurrency(totalAmount)}</p>
          </div>
          <div className="space-y-4 mb-8">
            <div className="bg-[var(--bg-surface)] rounded-2xl p-4 border border-[var(--border-color)]">
              <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Details</p>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-sm truncate pr-4">{name || 'General Expense'}</span>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">{new Date(dateTime).toLocaleDateString()}</span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">{notes || 'No extra notes.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--bg-surface)] rounded-2xl p-4 border border-[var(--border-color)]">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-2">Who Paid</p>
                <div className="space-y-1.5 overflow-y-auto max-h-[80px]">
                  {Object.entries(payers).map(([id, amt]) => (
                    <div key={id} className="flex justify-between text-[9px] font-bold">
                      <span className="truncate max-w-[50px]">{members.find(m => m.id === id)?.name}</span>
                      <span className="font-mono text-sky-500">{formatCurrency(amt as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-2xl p-4 border border-[var(--border-color)]">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-2">Split</p>
                <p className="text-[10px] font-black text-sky-500 truncate">{splitMode.toUpperCase()} SPLIT</p>
                <p className="text-[9px] text-slate-400 font-bold">{Object.keys(beneficiaries).length} Members Included</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirmation(false)} className="flex-1 py-4 font-bold text-slate-400 text-xs">GO BACK</button>
            <button onClick={handleSave} className="flex-[2] bg-sky-500 py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest">CONFIRM & SAVE</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="modal-overlay overflow-y-auto pb-12 pt-20">
      {showCalculator && <Calculator value={amount} onValueChange={setAmount} onClose={() => setShowCalculator(false)} />}
      
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-slate-800 my-auto rounded-[40px] w-full max-w-lg p-6 md:p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Expense Entry</h2>
          <button onClick={onClose} className="p-2 bg-slate-950 rounded-full text-slate-500 hover:text-white"><Plus className="rotate-45" /></button>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="bg-purple-500 rounded-[32px] p-8 text-white shadow-2xl shadow-purple-500/30 overflow-hidden relative mb-4">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative">
                <p className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><Scale size={12} /> Balance Sheet</p>
                <h2 className="text-4xl font-black">{formatCurrency(totalAmount)}</h2>
                
                {Math.abs(paidDeficit) > 0.01 && (
                  <div className="mt-4 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl inline-flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase">Unpaid:</span>
                    <span className="font-mono text-xs font-black">{formatCurrency(paidDeficit)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1">Expense Title</label>
                <button onClick={() => setShowEventMgmt(!showEventMgmt)} className="text-[9px] text-purple-500 font-bold hover:underline">Customize Quick List</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3 px-1">
                {commonEvents.map(ev => (
                  <button 
                    key={ev} 
                    onClick={() => setName(ev)}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${name === ev ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-purple-300'}`}
                  >
                    {ev}
                  </button>
                ))}
              </div>

              {showEventMgmt && (
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 mb-4 animate-in slide-in-from-top-1 px-4">
                  <div className="flex gap-2 mb-3">
                    <input 
                      value={newEventName} 
                      onChange={e => setNewEventName(e.target.value)} 
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-sky-500" 
                      placeholder="New Event Type..." 
                    />
                    <button 
                      onClick={() => { if(newEventName) { setCommonEvents([...commonEvents, newEventName]); setNewEventName(''); } }}
                      className="bg-sky-500 text-white px-4 rounded-xl text-xs font-bold"
                    >
                      ADD
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {commonEvents.map(ev => (
                      <div key={ev} className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg text-[9px] text-slate-400">
                        {ev}
                        <button onClick={() => setCommonEvents(commonEvents.filter(x => x !== ev))} className="text-red-500 hover:scale-110">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:border-sky-500 outline-none font-bold" placeholder="Give it a name..." value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 pr-1">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1">Amount (BDT)</label>
                <button onClick={() => setShowCalculator(true)} className="flex items-center gap-1 text-[9px] bg-slate-800 px-2 py-1 rounded-lg text-sky-400 font-bold hover:bg-slate-700">
                  <Scale size={10} /> Calculator
                </button>
              </div>
              <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 focus:border-sky-500 outline-none font-black text-sky-400 text-3xl" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] uppercase font-black text-sky-400 tracking-widest">Who Paid?</h3>
                {Math.abs(paidDeficit) > 0.05 && (
                  <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-black font-mono">-{paidDeficit}</span>
                )}
              </div>
              <button onClick={distributeEquallyPaid} className="text-[9px] bg-sky-500/10 text-sky-400 px-4 py-2 rounded-full font-black uppercase transition-all active:scale-95">Auto-Fill</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map(m => {
                const paying = payers[m.id] !== undefined;
                return (
                  <div key={m.id} className={`p-4 rounded-3xl border transition-all ${paying ? 'bg-sky-500/5 border-sky-500/40 shadow-inner' : 'bg-slate-950 border-slate-800 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <input type="checkbox" checked={paying} onChange={() => {
                        const next = {...payers};
                        if (paying) delete next[m.id];
                        else next[m.id] = (Object.keys(payers).length === 0 ? totalAmount : 0);
                        setPayers(next);
                      }} className="w-4 h-4 rounded-lg accent-sky-500" />
                      <span className="text-xs font-black truncate">{m.name.split(' ')[0]}</span>
                    </div>
                    {paying && (
                      <div className="relative">
                        <input type="number" className="w-full bg-slate-900 border-none pl-5 pr-2 py-2 rounded-xl font-mono text-xs focus:ring-1 ring-sky-500 outline-none text-sky-400 font-black" placeholder="0" value={payers[m.id]} onChange={e => setPayers({...payers, [m.id]: parseFloat(e.target.value) || 0})} />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-bold">৳</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] uppercase font-black text-sky-400 tracking-widest">Split Details</h3>
                {Math.abs(splitDeficit) > 0.05 && (
                  <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-black font-mono">-{splitDeficit}{splitMode === 'percent' ? '%' : ''}</span>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={isAllSelected} onChange={selectAllBeneficiaries} className="w-3 h-3 accent-sky-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase">All</span>
                </label>
              </div>
              <select className="bg-slate-950 text-[10px] font-black uppercase py-1.5 px-4 rounded-full border border-slate-800 focus:border-sky-500 outline-none" value={splitMode} onChange={e => setSplitMode(e.target.value as any)}>
                <option value="equal">Equal</option>
                <option value="amount">Exact</option>
                <option value="percent">% Percent</option>
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map(m => {
                const isBen = beneficiaries[m.id] !== undefined;
                return (
                  <div key={m.id} onClick={() => { if (splitMode === 'equal') toggleBeneficiary(m.id); }} className={`p-4 rounded-3xl border transition-all cursor-pointer ${isBen ? 'bg-sky-500/5 border-sky-500/40' : 'bg-slate-950 border-slate-800 opacity-30 shadow-none'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black truncate">{m.name.split(' ')[0]}</span>
                      <input type="checkbox" checked={isBen} onChange={(e) => { e.stopPropagation(); toggleBeneficiary(m.id); }} className="w-4 h-4 rounded accent-sky-500" />
                    </div>
                    {isBen && (
                      splitMode === 'equal' ? (
                        <p className="text-[11px] font-mono font-black text-sky-400 bg-slate-900 px-3 py-1.5 rounded-xl inline-block">{formatCurrency(beneficiaries[m.id] || 0)}</p>
                      ) : (
                        <div className="flex items-center gap-1 bg-slate-900 rounded-xl px-2 py-1.5 ring-1 ring-slate-800 focus-within:ring-sky-500 transition-all">
                          <input type="number" className="w-full bg-transparent text-[11px] outline-none text-sky-400 font-mono font-black" value={beneficiaries[m.id]} onClick={e => e.stopPropagation()} onChange={e => setBeneficiaries({...beneficiaries, [m.id]: parseFloat(e.target.value) || 0})} />
                          <span className="text-[9px] font-black text-slate-600">{splitMode === 'percent' ? '%' : '৳'}</span>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1 mb-2 block">Time</label>
                  <input type="datetime-local" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:border-sky-500 outline-none text-slate-300 font-mono text-xs" value={dateTime} onChange={e => setDateTime(e.target.value)} />
               </div>
               <div>
                 <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1 mb-2 block">Receipt Image</label>
                 <div className="relative h-[52px] border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 hover:border-sky-500 hover:bg-sky-500/5 transition-all cursor-pointer overflow-hidden group">
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                   {imagePreview ? (
                     <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Preview"/>
                   ) : (
                     <Camera size={18} className="group-hover:text-sky-400" />
                   )}
                   {!imagePreview && <span className="ml-2 text-[10px] font-black">TAP TO ADD</span>}
                 </div>
               </div>
            </div>
            
            <textarea className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 outline-none text-sm min-h-[100px] leading-relaxed resize-none focus:border-sky-500" placeholder="Any extra notes or memo?" value={notes} onChange={e => setNotes(e.target.value)} />

            <button 
              disabled={!name || !amount || Object.keys(payers).length === 0 || Object.keys(beneficiaries).length === 0 || Math.abs(paidDeficit) > 1}
              onClick={() => setShowConfirmation(true)}
              className="w-full py-6 bg-sky-500 hover:bg-sky-400 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-sky-500/30 disabled:opacity-30 active:scale-95 transition-all text-white"
            >
              FINALIZE EXPENSE
            </button>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
