import { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, FileText, Sparkles, Loader2, Download, LayoutDashboard, Cpu, Target,
  ArrowRight, LogOut, User, Lock, Mail, History, Trash2, ExternalLink, Plus, MessageSquare,
  UsersRound, Table2
} from 'lucide-react';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Subtle floating particles background
const FloatingParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create a small number of particles
    const particles = Array.from({ length: 22 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3 + 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, color = "blue" }) => (
  <div className="flex flex-col gap-2 mb-10">
    <div className="flex items-center gap-3">
      <div className={`bg-white/[0.03] border border-white/[0.08] p-2.5 rounded-xl`}>
        <Icon className={`w-5 h-5 text-${color}-400/80`} />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-white/90">{title}</h2>
    </div>
    <p className="text-[15px] font-medium text-slate-500 leading-relaxed max-w-lg">{subtitle}</p>
  </div>
);

const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    <div className="relative">
      <input 
        {...props} 
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] placeholder-slate-600 focus:bg-white/[0.05] focus:border-blue-500/30 transition-all outline-none" 
      />
    </div>
  </div>
);

export default function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Placement Predictor State
  const [tenthMarks, setTenthMarks] = useState('');
  const [twelfthMarks, setTwelfthMarks] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [internships, setInternships] = useState('0');
  const [projects, setProjects] = useState('1');
  
  const [placementProbability, setPlacementProbability] = useState(null);
  const [salaryTier, setSalaryTier] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [salaryLoading, setSalaryLoading] = useState(false);

  // Resume Upload State
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Roadmap State
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Mock Interview State
  const [jobRole, setJobRole] = useState('Backend Engineer');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Chat Session Persistence State
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatSessionsLoading, setChatSessionsLoading] = useState(false);

  // Batch Processing State
  const [batchFile, setBatchFile] = useState(null);
  const [batchData, setBatchData] = useState(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState(null);
  const [batchHistory, setBatchHistory] = useState([]);
  const [batchHistoryLoading, setBatchHistoryLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Persistence Effects
  useEffect(() => {
    if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', userEmail);
        fetchHistory();
        fetchChatSessions();
        fetchBatchHistory();
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        setHistory([]);
        setChatSessions([]);
        setBatchHistory([]);
    }
  }, [token, userEmail]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        if (authMode === 'login') {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/login`, formData);
            setToken(res.data.access_token);
            setUserEmail(email);
        } else {
            await axios.post(`${import.meta.env.VITE_API_URL}/register`, { email, password });
            setAuthMode('login');
            setAuthError("Account created! Please login.");
        }
    } catch (err) {
        setAuthError(err.response?.data?.detail || "Authentication failed");
    } finally {
        setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    setRoadmap(null);
    setAnalysis(null);
    setChatHistory([]);
  };

  // Logic Handlers
  const fetchHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/my-history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
    } catch (err) { console.error("History fetch failed"); }
    finally { setHistoryLoading(false); }
  };

  const fetchBatchHistory = async () => {
    if (!token) return;
    setBatchHistoryLoading(true);
    try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/my-batch-reports`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setBatchHistory(res.data);
    } catch (err) { console.error("Batch history fetch failed"); }
    finally { setBatchHistoryLoading(false); }
  };

  const handleAPI = async (endpoint, payload, setState, setLoadingState, errMsg) => {
    try {
      setLoadingState(true);
      setError(null);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/${endpoint}`, payload);
      setState(res.data);
    } catch (err) {
      console.error(err);
      setError(errMsg);
    } finally {
      setLoadingState(false);
    }
  };

  const handlePredictPlacement = (e) => {
    e.preventDefault();
    setPlacementProbability(null);
    handleAPI('predict-placement', {
        tenth_marks: parseFloat(tenthMarks) || 0,
        twelfth_marks: parseFloat(twelfthMarks) || 0,
        cgpa: parseFloat(cgpa) || 0,
        internships: parseInt(internships) || 0
    }, (d) => setPlacementProbability(d.placement_probability), setPredictLoading, 'Prediction failed.');
  };

  const handlePredictSalary = (e) => {
    e.preventDefault();
    setSalaryTier(null);
    handleAPI('predict-salary', {
        cgpa: parseFloat(cgpa) || 0,
        internships: parseInt(internships) || 0,
        projects: parseInt(projects) || 0
    }, (d) => setSalaryTier(d.salary_tier), setSalaryLoading, 'Salary prediction failed.');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setError(null); setAnalysis(null); setRoadmap(null); setSaveStatus(null);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/analyze-resume`, fd);
      setAnalysis(res.data);
    } catch (err) { setError('Resume parsing failed.'); } 
    finally { setLoading(false); }
  };

  const handleGenerateRoadmap = () => {
    if (!analysis?.missing_skills) return;
    setSaveStatus(null);
    handleAPI('generate-roadmap', { skills: analysis.missing_skills }, setRoadmap, setRoadmapLoading, 'Roadmap generation failed.');
  };

  const handleSaveRoadmap = async () => {
    if (!token) return;
    setSaveStatus({ loading: true });
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/save-roadmap`, {
        score: analysis.overall_score, strengths: analysis.strengths,
        missing_skills: analysis.missing_skills, roadmap_plan: roadmap
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveStatus({ success: true, text: 'Roadmap Saved' });
      fetchHistory(); // Refresh history
    } catch (err) { setSaveStatus({ error: true, text: 'Save failed' }); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    const prev = [...chatHistory];
    const msg = { role: 'user', text: currentMessage };
    setChatHistory([...prev, msg]);
    setCurrentMessage('');
    setIsChatLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/mock-interview`, { job_role: jobRole, history: prev, message: msg.text });
      const updatedHistory = [...prev, msg, { role: 'model', text: res.data.reply }];
      setChatHistory(updatedHistory);
      // Auto-save after each AI response
      if (token) {
        try {
          const saveRes = await axios.post(`${import.meta.env.VITE_API_URL}/save-chat`, {
            job_role: jobRole,
            messages: updatedHistory,
            session_id: activeChatId || undefined
          }, { headers: { Authorization: `Bearer ${token}` } });
          if (!activeChatId) setActiveChatId(saveRes.data.id);
          fetchChatSessions();
        } catch (saveErr) { console.error('Auto-save failed:', saveErr); }
      }
    } catch (err) { setError('Connection lost.'); } 
    finally { setIsChatLoading(false); }
  };

  // Chat Session Handlers
  const fetchChatSessions = async () => {
    if (!token) return;
    setChatSessionsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/my-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatSessions(res.data);
    } catch (err) { console.error('Failed to fetch chat sessions'); }
    finally { setChatSessionsLoading(false); }
  };

  const loadChatSession = (session) => {
    setChatHistory(session.messages || []);
    setJobRole(session.job_role || 'Backend Engineer');
    setActiveChatId(session.id);
  };

  const startNewChat = () => {
    setChatHistory([]);
    setActiveChatId(null);
    setJobRole('Backend Engineer');
    setCurrentMessage('');
  };

  const deleteChatSession = async (sessionId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/delete-chat/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activeChatId === sessionId) startNewChat();
      fetchChatSessions();
    } catch (err) { console.error('Failed to delete chat'); }
  };

  // Batch Processing Handlers
  const handleBatchUpload = async () => {
    if (!batchFile || !token) return;
    setIsBatchLoading(true);
    setBatchData(null);
    setBatchError(null);
    const fd = new FormData();
    fd.append('file', batchFile);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/batch-process`, fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatchData(res.data.results);
      fetchBatchHistory();
    } catch (err) {
      setBatchError(err.response?.data?.detail || 'Batch processing failed.');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const downloadBatchCSV = () => {
    if (!batchData || batchData.length === 0) return;
    const headers = Object.keys(batchData[0]);
    const csvRows = [
      headers.join(','),
      ...batchData.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `batch_report_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stepCardProps = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6, type: 'spring', bounce: 0.3 },
    whileHover: { scale: 1.01 }
  };

  // Auth Overlay Component
  if (!token) {
    return (
        <div className="min-h-screen bg-black text-slate-200 font-sans flex items-center justify-center p-6 relative overflow-hidden">
            <FloatingParticles />
            <div className="bg-noise absolute inset-0 z-0 opacity-5 pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-mesh"></div>
            <div className="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-mesh animation-delay-2000"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[450px] glass-card rounded-[2.5rem] p-10 md:p-14 border border-white/[0.08] relative z-10 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center gap-6 mb-10">
                    <div className="bg-blue-500/[0.08] border border-blue-500/20 p-4 rounded-3xl">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">Placement Copilot</h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Data-driven outcomes for engineers.</p>
                    </div>
                </div>

                <div className="flex p-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl mb-8">
                    <button 
                        onClick={() => setAuthMode('login')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${authMode === 'login' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}
                    > Login </button>
                    <button 
                        onClick={() => setAuthMode('register')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${authMode === 'register' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}
                    > Sign Up </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <InputField name="email" label="Neural Address" placeholder="test@mit.edu" icon={Mail} required />
                    <InputField name="password" label="Security Key" type="password" placeholder="••••••••" icon={Lock} required />
                    
                    {authError && (
                        <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-red-500 text-xs font-bold text-center">
                            {authError}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={authLoading}
                        className="w-full h-14 bg-white text-black font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? "Access Cloud" : "Initialize Agent")}
                    </button>
                </form>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white relative">
      <FloatingParticles />
      <div className="bg-noise fixed inset-0 z-50 pointer-events-none opacity-5"></div>
      
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-mesh"></div>
        <div className="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-mesh animation-delay-2000"></div>
      </div>

      {/* Navigation Header */}
      <div className="fixed top-0 left-0 right-0 h-20 z-50 px-6 flex items-center justify-center pointer-events-none">
        <div className="max-w-[1200px] w-full flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] px-4 py-2 rounded-2xl outline-none">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Node: {userEmail}</span>
            </div>
            <button 
                onClick={handleLogout}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-3 rounded-2xl hover:bg-red-500/10 hover:border-red-500/20 group transition-all"
            >
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
            </button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1200px] mx-auto px-6 py-20 relative z-10 space-y-24"
      >
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6 pt-10"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
            Placement <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-600 underline decoration-white/10 underline-offset-8 decoration-4">
              Copilot.
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-500 font-medium tracking-tight">
            Data-driven outcomes powered by neural analysis for the modern engineering career.
          </p>
        </motion.header>

        {/* Grid Container */}
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* Main Card: Predictor */}
          <motion.section 
            {...stepCardProps}
            className="col-span-12 lg:col-span-8 glass-card rounded-[2.5rem] p-10 md:p-14 border border-white/[0.08]"
          >
            <SectionHeader 
               icon={Cpu}
               title="01. Placement Telemetry"
               subtitle="Advanced binary classification of career outcomes using your academic and technical footprint."
            />

            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="X Marks (%)" placeholder="92" value={tenthMarks} onChange={e=>setTenthMarks(e.target.value)} />
              <InputField label="XII Marks (%)" placeholder="88" value={twelfthMarks} onChange={e=>setTwelfthMarks(e.target.value)} />
              <InputField label="CGPA" placeholder="9.1" value={cgpa} onChange={e=>setCgpa(e.target.value)} />
              <InputField label="Internships" value={internships} onChange={e=>setInternships(e.target.value)} />
              <div className="md:col-span-2">
                <InputField label="Projects" value={projects} onChange={e=>setProjects(e.target.value)} />
              </div>
              
              <div className="md:col-span-2 flex gap-4 pt-4">
                <button 
                  onClick={handlePredictPlacement}
                  disabled={predictLoading}
                  className="flex-1 h-14 bg-white text-black font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {predictLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run Placement Logic"}
                </button>
                <button 
                  onClick={handlePredictSalary}
                  disabled={salaryLoading}
                  className="flex-1 h-14 bg-white/[0.05] border border-white/[0.1] text-white font-bold rounded-2xl hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {salaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Estimate Salary"}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {(placementProbability !== null || salaryTier !== null) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/[0.05]">
                  {placementProbability !== null && (
                    <div className="bg-white/[0.01] border border-white/[0.06] p-8 rounded-3xl text-center">
                      <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase mb-2 block">Placement Probability</span>
                      <p className="text-6xl font-black text-white">{placementProbability}%</p>
                    </div>
                  )}
                  {salaryTier !== null && (
                    <div className="bg-white/[0.01] border border-white/[0.06] p-8 rounded-3xl text-center">
                      <span className="text-[10px] font-black tracking-[0.2em] text-purple-500 uppercase mb-2 block">Expected Tier</span>
                      <p className="text-4xl font-black text-white py-2">{salaryTier}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Sidebox: Resume Analysis */}
          <motion.div 
            {...stepCardProps}
            className="col-span-12 lg:col-span-4 space-y-8"
          >
            <div className="glass-card rounded-[2.5rem] p-10 border border-white/[0.08]">
              <SectionHeader 
                icon={FileText}
                title="02. Resume Logic"
                subtitle="Parsing latent skills and semantic structural depth."
                color="purple"
              />
              
              <div className="space-y-6">
                <div className="relative group">
                  <div className="w-full bg-white/[0.02] border border-dashed border-white/[0.1] rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/[0.04]">
                    <Download className="w-6 h-6 text-slate-500" />
                    <p className="text-[13px] font-medium text-slate-500">{file ? file.name : "Select PDF Resume"}</p>
                    <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
                
                <button 
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="w-full h-14 bg-white text-black font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run Engine"}
                </button>
              </div>

              {analysis && (
                <div className="mt-10 pt-10 border-t border-white/[0.05] space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Neural Score</span>
                    <span className="text-4xl font-black text-white">{analysis.overall_score}<span className="text-lg text-slate-600">/10</span></span>
                  </div>
                  <button onClick={handleGenerateRoadmap} className="w-full h-12 bg-white/[0.05] text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/[0.08]">
                    Sync Roadmap
                  </button>
                </div>
              )}
            </div>

            {/* Strategic Archive (History) */}
            <div className="glass-card rounded-[2.5rem] p-10 border border-white/[0.08]">
                <SectionHeader 
                    icon={History}
                    title="04. Strategic Archive"
                    subtitle="Retrieve your generated developmental protocols."
                    color="emerald"
                />
                
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Individual Roadmaps */}
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Roadmap Pulses</span>
                    <div className="space-y-3">
                      {historyLoading ? (
                          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-emerald-500/50" /></div>
                      ) : history.length === 0 ? (
                          <p className="text-[10px] text-slate-600 text-center py-2 font-bold uppercase tracking-widest">Empty Buffer</p>
                      ) : history.map((h, i) => (
                          <motion.div 
                              key={i} 
                              onClick={() => { setRoadmap(h.roadmap_plan); setAnalysis({ overall_score: h.score, strengths: h.strengths, missing_skills: h.missing_skills }); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                              className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all"
                          >
                              <div className="min-w-0">
                                  <p className="text-xs font-black text-white/90 truncate">Query #{h.id}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Score: {h.score}/10</p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-all shrink-0" />
                          </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Batch Analytics Reports */}
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 border-t border-white/[0.05] pt-6">Batch Protocols</span>
                    <div className="space-y-3">
                      {batchHistoryLoading ? (
                          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-amber-500/50" /></div>
                      ) : batchHistory.length === 0 ? (
                          <p className="text-[10px] text-slate-600 text-center py-2 font-bold uppercase tracking-widest">Empty Buffer</p>
                      ) : batchHistory.map((b, i) => (
                          <motion.div 
                              key={i} 
                              onClick={() => { setBatchData(b.results); setBatchFile({ name: b.filename }); window.scrollTo({top: 2000, behavior: 'smooth'}); }}
                              className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/20 transition-all"
                          >
                              <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Table2 className="w-3 h-3 text-amber-400/60" />
                                    <p className="text-xs font-black text-white/90 truncate">{b.filename}</p>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{b.results?.length || 0} Records</p>
                              </div>
                              <History className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-all shrink-0" />
                          </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          </motion.div>

          {/* Full Width: Roadmap */}
          {roadmap && (
            <motion.div {...stepCardProps} className="col-span-12 glass-card rounded-[2.5rem] p-10 md:p-14 border border-white/[0.08]">
              <div className="flex flex-wrap items-center justify-between mb-12 gap-4">
                <div className="flex items-center gap-4">
                   <Target className="w-6 h-6 text-emerald-400" />
                   <h2 className="text-2xl font-bold tracking-tight text-white/90">Curriculum Protocal</h2>
                </div>
                <button onClick={handleSaveRoadmap} className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-xs uppercase hover:bg-slate-200">
                  {saveStatus?.loading ? "Syncing..." : saveStatus?.success ? "Saved OK" : "Export Plan"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roadmap.map((week, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ y: -5 }}
                    className="bg-white/[0.01] border border-white/[0.06] p-8 rounded-[2rem] hover:bg-white/[0.03] transition-all"
                  >
                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 block text-blue-400">{week.week}</span>
                    <h3 className="text-lg font-bold text-white mb-6 leading-tight h-12 line-clamp-2">{week.focus}</h3>
                    <ul className="space-y-3">
                       {week.action_items?.map((item, ai) => (
                         <li key={ai} className="flex gap-3 text-[13px] text-slate-500 leading-relaxed font-medium">
                           <span className="text-blue-500 mt-1">•</span>{item}
                         </li>
                       ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat Component */}
          <motion.section 
            {...stepCardProps}
            className="col-span-12 glass-card rounded-[2.5rem] p-10 md:p-14 border border-white/[0.08]"
          >
            <SectionHeader 
               icon={Bot}
               title="03. Neural Simulation"
               subtitle="High-fidelity behavioral simulation engine for technical role assessment."
               color="indigo"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-6">
                 <InputField label="Simulation Role" value={jobRole} onChange={e=>setJobRole(e.target.value)} />
                 <p className="text-[13px] text-slate-500 leading-relaxed font-medium">The agent will assess your behavioral and technical signals in real-time according to this system role.</p>
                 
                 {/* New Chat Button */}
                 <button 
                   onClick={startNewChat}
                   className="w-full h-12 bg-white/[0.05] border border-white/[0.1] text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2"
                 >
                   <Plus className="w-4 h-4" /> New Session
                 </button>

                 {/* Past Sessions */}
                 <div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Past Sessions</span>
                   <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                     {chatSessionsLoading ? (
                       <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
                     ) : chatSessions.length === 0 ? (
                       <p className="text-[11px] text-slate-600 text-center py-3 font-bold">No saved sessions</p>
                     ) : chatSessions.map((s) => (
                       <div 
                         key={s.id}
                         className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                           activeChatId === s.id 
                             ? 'bg-indigo-500/10 border-indigo-500/20' 
                             : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                         }`}
                       >
                         <div className="flex-1 min-w-0" onClick={() => loadChatSession(s)}>
                           <div className="flex items-center gap-2">
                             <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0" />
                             <p className="text-[11px] font-bold text-white/80 truncate">{s.job_role}</p>
                           </div>
                           <p className="text-[10px] text-slate-600 mt-1 truncate">{s.message_count} messages</p>
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); deleteChatSession(s.id); }}
                           className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                         >
                           <Trash2 className="w-3 h-3 text-slate-600 hover:text-red-400" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
              <div className="lg:col-span-8 h-96 border border-white/[0.08] bg-[#050505] rounded-3xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between text-[11px] font-black text-slate-600 uppercase tracking-widest bg-white/[0.01]">
                   <span>Secure Instance Status: Connected</span>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto scroll-smooth p-8 flex flex-col gap-6 custom-scrollbar pr-4">
                  {chatHistory.length === 0 ? (
                    <div className="m-auto opacity-20 flex flex-col items-center gap-4">
                       <LayoutDashboard className="w-10 h-10" />
                       <p className="text-sm font-black uppercase tracking-widest">Awaiting Input Signal</p>
                    </div>
                  ) : chatHistory.map((msg, i) => (
                    <motion.div 
                       key={i} 
                       className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                       initial={{ opacity: 0, scale: 0.9, originY: 1 }} 
                       animate={{ opacity: 1, scale: 1 }} 
                       transition={{ duration: 0.3 }}
                    >
                      <div className={`max-w-[85%] px-6 py-4 rounded-2xl text-[14px] leading-relaxed font-medium ${
                        msg.role === 'user' ? 'bg-white text-black' : 'bg-white/[0.04] border border-white/[0.06] text-white'
                      }`}>
                         {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                       <div className="bg-white/[0.02] border border-white/[0.06] px-6 py-4 rounded-2xl flex gap-1.5">
                          <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                       </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-6 border-t border-white/[0.08] bg-white/[0.01] flex gap-4">
                  <input 
                    type="text" 
                    value={currentMessage} 
                    onChange={e=>setCurrentMessage(e.target.value)} 
                    placeholder="Input message stream..." 
                    className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-full px-8 h-14 text-[14px] text-white outline-none focus:border-white/[0.2] transition-all" 
                  />
                  <button type="submit" className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.section>

        </div>

          {/* Step 5: Batch Career Analytics */}
          <motion.section
            {...stepCardProps}
            className="col-span-12 glass-card rounded-[2.5rem] p-10 md:p-14 border border-white/[0.08]"
          >
            <SectionHeader 
              icon={UsersRound}
              title="05. Batch Career Analytics"
              subtitle="Upload a student dataset (CSV) to run placement and salary predictions across the entire cohort."
              color="amber"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Upload Panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="relative group">
                  <div className="w-full bg-white/[0.02] border border-dashed border-white/[0.1] rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/[0.04]">
                    <Table2 className="w-6 h-6 text-amber-400/60" />
                    <p className="text-[13px] font-medium text-slate-500">{batchFile ? batchFile.name : "Select CSV Dataset"}</p>
                    <p className="text-[10px] text-slate-600">Columns: name, tenth_marks, twelfth_marks, cgpa, internships, projects</p>
                    <input type="file" accept=".csv" onChange={e => { if (e.target.files?.[0]) { setBatchFile(e.target.files[0]); setBatchData(null); setBatchError(null); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>

                <button
                  onClick={handleBatchUpload}
                  disabled={isBatchLoading || !batchFile}
                  className="w-full h-14 bg-white text-black font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  {isBatchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Cohort"}
                </button>

                {batchError && (
                  <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-red-400 text-xs font-bold text-center">
                    {batchError}
                  </div>
                )}
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  {isBatchLoading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20 gap-6"
                    >
                      <div className="relative w-full max-w-xs h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                      <motion.p
                        className="text-[11px] font-black text-amber-400/60 uppercase tracking-[0.3em]"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Analyzing Batch Dataset...
                      </motion.p>
                    </motion.div>
                  )}

                  {!isBatchLoading && batchData && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {batchData.length} Students Processed
                        </span>
                        <button
                          onClick={downloadBatchCSV}
                          className="px-5 py-2.5 bg-white text-black rounded-full font-bold text-xs uppercase hover:bg-slate-200 flex items-center gap-2 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Report
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                              {["Name", "10th", "12th", "CGPA", "Intern.", "Proj.", "Placement %", "Salary Tier"].map(h => (
                                <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {batchData.map((row, i) => (
                              <motion.tr
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-all"
                              >
                                <td className="px-5 py-3.5 text-[13px] font-semibold text-white/90 whitespace-nowrap">{row.name}</td>
                                <td className="px-5 py-3.5 text-[13px] text-slate-400">{row.tenth_marks}</td>
                                <td className="px-5 py-3.5 text-[13px] text-slate-400">{row.twelfth_marks}</td>
                                <td className="px-5 py-3.5 text-[13px] text-slate-400">{row.cgpa}</td>
                                <td className="px-5 py-3.5 text-[13px] text-slate-400">{row.internships}</td>
                                <td className="px-5 py-3.5 text-[13px] text-slate-400">{row.projects}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`text-[13px] font-bold ${
                                    row.Placement_Probability >= 70 ? 'text-emerald-400' : 
                                    row.Placement_Probability >= 40 ? 'text-amber-400' : 'text-red-400'
                                  }`}>
                                    {row.Placement_Probability}%
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${
                                    row.Predicted_Salary_Tier === 'High Tier'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                  }`}>
                                    {row.Predicted_Salary_Tier}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {!isBatchLoading && !batchData && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 opacity-20"
                    >
                      <UsersRound className="w-10 h-10 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Upload Dataset to Begin</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>

        {/* Footer */}
        <footer className="text-center pt-20 border-t border-white/[0.05] opacity-20">
           <p className="text-[11px] font-black uppercase tracking-[0.4em]">Powered by Gemini-3 Neural Architecture</p>
        </footer>
      </motion.div>
    </div>
  );
}
