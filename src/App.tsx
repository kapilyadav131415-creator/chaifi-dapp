import { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "./contract";
import { 
  Sun, Moon, Coffee, Wallet, Trophy, 
  Activity, MessageSquare, Send, Zap, Clock,
  TrendingUp, Users, DollarSign, Award,
  ShieldCheck, Globe, Gem, ArrowRight, Github, Twitter
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

declare global { interface Window { ethereum?: any; } }
interface Memo { name: string; message: string; timestamp: bigint; from: string; }

function App() {
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [modal, setModal] = useState({ show: false, type: "success", message: "" });

  const PRICE_PER_CHAI = "0.0001";
  const GOAL_ETH = 0.5; // Static milestone goal

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Logic Functions ---
  async function connectWallet() {
    if (!window.ethereum) return setModal({ show: true, type: "error", message: "Install MetaMask" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  }

  async function loadMemos() {
    try {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const fetchedMemos = [];
      let i = 0;
      let keepFetching = true;
      while (keepFetching && i < 100) {
        try {
          const memo = await contract.memos(i);
          fetchedMemos.push({ name: memo.name, message: memo.message, timestamp: memo.timestamp, from: memo.from });
          i++;
        } catch { keepFetching = false; }
      }
      setMemos(fetchedMemos.reverse());
    } finally {
      setTimeout(() => setInitialLoading(false), 800);
    }
  }

  async function buyChai() {
    if (!name || !message) return setModal({ show: true, type: "error", message: "Fields required" });
    try {
      setLoading(true);
      setModal({ show: true, type: "pending", message: "Awaiting Signature..." });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.buychai(name, message, { value: ethers.parseEther(PRICE_PER_CHAI) });
      await tx.wait();
      setModal({ show: true, type: "success", message: "Chai Brewed on Ethereum!" });
      setName(""); setMessage(""); loadMemos();
    } catch { setModal({ show: true, type: "error", message: "Transaction Failed" });
    } finally { setLoading(false); }
  }

  useEffect(() => { loadMemos(); }, []);

  // --- Computed Stats ---
  const totalEthNum = memos.length * parseFloat(PRICE_PER_CHAI);
  const totalEthStr = totalEthNum.toFixed(4);
  const goalPercent = Math.min((totalEthNum / GOAL_ETH) * 100, 100).toFixed(1);

  const leaderboard = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    memos.forEach((m) => {
      counts[m.from] = { name: m.name, count: (counts[m.from]?.count || 0) + 1 };
    });
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count).slice(0, 3);
  }, [memos]);

  const chartData = useMemo(() => {
    const dailyCounts: Record<string, number> = {};
    memos.slice(0, 10).forEach(m => {
      const date = new Date(Number(m.timestamp) * 1000).toLocaleDateString('en-US', { weekday: 'short' });
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
  }, [memos]);

  if (initialLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#050505]' : 'bg-white'}`}>
        <div className="relative">
          <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <Coffee className="absolute inset-0 m-auto text-amber-500 animate-pulse" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 relative ${isDarkMode ? 'bg-[#080808] text-zinc-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* Background Decor */}
      <div className={`fixed inset-0 pointer-events-none ${isDarkMode ? 'bg-[radial-gradient(circle_at_50%_-20%,#451a03_0%,transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_-20%,#fef3c7_0%,transparent_50%)]'}`} />

      {/* --- Navbar --- */}
      <nav className={`fixed top-0 w-full z-50 border-b backdrop-blur-xl ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white/40 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-amber-500 p-2 rounded-xl text-black transition-transform group-hover:rotate-12"><Coffee size={24} /></div>
            <span className="font-black text-2xl tracking-tighter uppercase italic">CHAIFI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            <button onClick={connectWallet} className="hidden sm:block bg-zinc-950 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
              {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
        
        {/* --- Hero Branding --- */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none uppercase italic">
            Fuel the <span className="text-amber-500">Decentralized</span> Code
          </h1>
          <p className={`text-lg max-w-2xl mx-auto opacity-60 font-medium`}>
            A transparent protocol for micro-tipping developers. 100% on-chain, 0% platform fees, infinitely permanent.
          </p>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Protocol Revenue", val: `${totalEthStr} ETH`, icon: <DollarSign size={20} />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Active Nodes", val: memos.length, icon: <Globe size={20} />, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Gas Efficiency", val: "High", icon: <Zap size={20} />, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Contract Status", val: "Verified", icon: <ShieldCheck size={20} />, color: "text-purple-500", bg: "bg-purple-500/10" },
          ].map((s, i) => (
            <div key={i} className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-4`}>{s.icon}</div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{s.label}</p>
              <h3 className="text-2xl font-black">{s.val}</h3>
            </div>
          ))}
        </div>

        {/* --- Main Dashboard Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Action Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-900/60 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 italic underline decoration-amber-500 decoration-4">Execute Tip</h2>
              <div className="space-y-4">
                <input 
                  placeholder="ENS or Nickname" value={name} onChange={(e) => setName(e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl outline-none border transition-all ${isDarkMode ? 'bg-black/40 border-white/10 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'}`}
                />
                <textarea 
                  placeholder="Your message to the chain..." value={message} onChange={(e) => setMessage(e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl outline-none border transition-all h-32 resize-none ${isDarkMode ? 'bg-black/40 border-white/10 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'}`}
                />
                <button onClick={buyChai} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50">
                  {loading ? "Brewing..." : "Send 0.0001 ETH"}
                </button>
              </div>
            </div>

            {/* Goal Progress Card */}
            <div className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-zinc-900/20 border-white/5' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Workstation Goal</h3>
                <span className="text-xs font-black text-amber-500">{goalPercent}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${goalPercent}%` }} />
              </div>
              <p className="text-[10px] opacity-60 leading-relaxed font-medium">
                Raising <b>{GOAL_ETH} ETH</b> to upgrade the open-source dev environment. 
              </p>
            </div>
          </div>

          {/* Analytics Column */}
          <div className="lg:col-span-8 space-y-8">
            <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-900/20 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black italic uppercase tracking-tighter text-lg">Network Activity</h3>
                <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest">7 Day Trend</div>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#111' : '#fff', border: 'none', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={4} fill="url(#chartGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Step Guide (Static Content) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "01", title: "Connect", desc: "Link your MetaMask wallet to the Ethereum network." },
                { step: "02", title: "Message", desc: "Write a permanent note stored in the Smart Contract." },
                { step: "03", title: "Confirm", desc: "Verify the transaction and join the hall of fame." },
              ].map((item, i) => (
                <div key={i} className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900/10 border-white/5' : 'bg-white border-slate-100'}`}>
                  <span className="text-3xl font-black text-amber-500/20 mb-2 block tracking-tighter">{item.step}</span>
                  <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-[11px] opacity-50 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- Ledger Section --- */}
        <div className="mt-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Chain Ledger</h2>
            <div className="h-px flex-1 bg-amber-500/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memos.map((memo, idx) => (
              <div key={idx} className={`p-6 rounded-[2rem] border transition-all hover:border-amber-500/50 ${isDarkMode ? 'bg-zinc-900/20 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-black text-black text-xs">{memo.name[0]}</div>
                  <div>
                    <p className="font-bold text-sm leading-none mb-1">{memo.name}</p>
                    <p className="text-[10px] font-mono opacity-40">{memo.from.slice(0,10)}...</p>
                  </div>
                </div>
                <p className={`text-sm italic mb-6 leading-relaxed opacity-70`}>"{memo.message}"</p>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-30">
                  <span className="flex items-center gap-1"><Clock size={10} /> {new Date(Number(memo.timestamp)*1000).toLocaleDateString()}</span>
                  <Gem size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- FAQ / Governance (Static Content) --- */}
        <div className={`mt-24 p-12 rounded-[3rem] text-center border ${isDarkMode ? 'bg-zinc-900/10 border-white/5' : 'bg-white border-slate-100'}`}>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Purely Decentralized</h3>
          <p className="max-w-2xl mx-auto opacity-50 text-sm mb-10 leading-relaxed font-medium">
            Unlike centralized platforms, ChaiFi doesn't take a cut. Your funds go directly from your wallet to the developer's contract address. No middlemen. No censorship.
          </p>
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase transition-all hover:bg-zinc-800"><Github size={16}/> View Source</button>
            <button className="flex items-center gap-2 px-6 py-3 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-black uppercase transition-all hover:bg-amber-500/10"><Twitter size={16}/> Protocol News</button>
          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className={`border-t py-12 ${isDarkMode ? 'border-white/5 bg-black' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
          <span className="text-xs font-black tracking-widest uppercase italic">© 2026 CHAIFI PROTOCOL</span>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-amber-500">Analytics</a>
            <a href="#" className="hover:text-amber-500">Governance</a>
            <a href="#" className="hover:text-amber-500">Security</a>
            <a href="#" className="hover:text-amber-500">Terms</a>
          </div>
        </div>
      </footer>

      {/* --- Global Modal --- */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
          <div className={`p-10 rounded-[3rem] w-full max-w-sm text-center border animate-in zoom-in duration-300 ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl ${
              modal.type === 'success' ? 'bg-green-500/20' : modal.type === 'error' ? 'bg-red-500/20' : 'bg-amber-500/20'
            }`}>
              {modal.type === 'success' ? '🍵' : modal.type === 'error' ? '✖' : <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            <h4 className="text-2xl font-black mb-3 italic tracking-tighter uppercase">{modal.type}</h4>
            <p className="opacity-60 text-sm mb-10 leading-relaxed font-medium">{modal.message}</p>
            {modal.type !== 'pending' && (
              <button onClick={() => setModal({ ...modal, show: false })} className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Dismiss</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;