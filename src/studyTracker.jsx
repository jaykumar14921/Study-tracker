import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qstuzhetbvtfvurepsaq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdHV6aGV0YnZ0ZnZ1cmVwc2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjY1NTIsImV4cCI6MjA4OTg0MjU1Mn0.3neppPLJ9c6_49hWmu1BErmi1ZVCF6xN8Urdne5zXzE";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RENDER_URL = "https://studytracker-neon.vercel.app";

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECT_COLORS = ["#f97316","#22d3ee","#a78bfa","#34d399","#f472b6","#fbbf24","#60a5fa","#e879f9"];
const SUBJECT_ICONS = ["📐","🧩","📝","🌐","📊","🔬","📚","🎯","💡","🧮"];
const TOPIC_COLORS = { 0:"#f97316", 1:"#a78bfa", 2:"#22d3ee", 3:"#34d399", 4:"#f472b6", 5:"#fbbf24" };

const DEFAULT_SUBJECTS = [
  {
    id: "quants", label: "Quantitative Aptitude", short: "Quants", color: "#f97316", icon: "📐",
    topics: [
      { id: "prelims", label: "Prelims", subtopics: ["Number System","Simplification","Percentage","Profit & Loss","SI & CI","Ratio & Proportion","Average","Time & Work","Time Speed Distance","DI (Basic)"] },
      { id: "mains", label: "Mains", subtopics: ["DI (Advanced)","Quadratic Equations","Mensuration","Permutation & Combination","Probability","Mixture & Alligation","Caselet DI","Data Sufficiency"] },
      { id: "speed", label: "Speed Tests", subtopics: ["Arithmetic Sprint","DI Speed Drill","Simplification Blitz","Mixed Topic Speed Test","Full Quants Mock"] },
    ]
  },
  {
    id: "reasoning", label: "Logical Reasoning", short: "Reasoning", color: "#22d3ee", icon: "🧩",
    topics: [
      { id: "prelims", label: "Prelims", subtopics: ["Syllogism","Inequality","Coding-Decoding","Blood Relations","Direction Sense","Alphanumeric Series","Puzzle (Linear)","Seating Arrangement"] },
      { id: "mains", label: "Mains", subtopics: ["Complex Puzzles","Double Row Seating","Floor & Flat Based","Input-Output","Data Sufficiency","Critical Reasoning","Statement & Assumption"] },
    ]
  },
  {
    id: "english", label: "English Language", short: "English", color: "#a78bfa", icon: "📝",
    topics: [
      { id: "prelims", label: "Prelims", subtopics: ["Reading Comprehension","Cloze Test","Para Jumbles","Fill in the Blanks","Error Spotting","Phrase Replacement"] },
      { id: "mains", label: "Mains", subtopics: ["RC (Advanced)","Vocabulary Based RC","Column Based FIB","Paragraph Completion","Inference Based Questions","Idioms & Phrases"] },
    ]
  },
  {
    id: "ga", label: "General Awareness", short: "GA", color: "#34d399", icon: "🌐",
    topics: [
      { id: "daily", label: "Daily", subtopics: ["Current Affairs Today","Banking News","Economy Updates","Government Schemes","Appointments & Resignations","Sports News"] },
      { id: "weekly", label: "Weekly", subtopics: ["Weekly Current Affairs Revision","Weekly Banking Digest","Weekly Quiz","Important Dates This Week","International News Summary"] },
      { id: "monthly", label: "Monthly", subtopics: ["Monthly Current Affairs PDF","Monthly Banking Awareness","Monthly Static GK Revision","Monthly Economy Review","Monthly Mock on GA"] },
    ]
  },
];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getTodayStr() { return new Date().toISOString().slice(0,10); }
function getWeekStart(date = new Date()) {
  const d = new Date(date); const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0,10);
}
function getWeekDates(weekStart) {
  return Array.from({length:7},(_,i) => {
    const d = new Date(weekStart+"T12:00:00"); d.setDate(d.getDate()+i); return d.toISOString().slice(0,10);
  });
}
function getMonthKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`; }
function getMonthDays(monthKey) {
  const [y,m] = monthKey.split("-").map(Number);
  return Array.from({length: new Date(y,m,0).getDate()},(_,i) => new Date(y,m-1,i+1).toISOString().slice(0,10));
}
function uid() { return Math.random().toString(36).slice(2,9); }

// ── Inline Editable ───────────────────────────────────────────────────────────
function Editable({ value, onSave, style={}, placeholder="Edit..." }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef();
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  if (editing) return (
    <input ref={ref} value={val} onChange={e=>setVal(e.target.value)}
      onBlur={()=>{ onSave(val); setEditing(false); }}
      onKeyDown={e=>{ if(e.key==="Enter"){onSave(val);setEditing(false);} if(e.key==="Escape"){setVal(value);setEditing(false);} }}
      style={{ background:"#0d1117", border:"1px solid #f97316", borderRadius:6, color:"#e6edf3", padding:"2px 8px", fontSize:"inherit", fontWeight:"inherit", outline:"none", fontFamily:"'Cambria','Georgia',serif", ...style }}
    />
  );
  return <span onClick={()=>setEditing(true)} title="Click to rename" style={{ cursor:"text", borderBottom:"1px dashed #30363d", ...style }}>{value||<span style={{color:"#484f58"}}>{placeholder}</span>}</span>;
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: RENDER_URL },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0d1117", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cambria','Georgia',serif" }}>
      <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"10%", left:"15%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#f9731615,transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:"15%", right:"10%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,#22d3ee15,transparent 70%)" }} />
        <div style={{ position:"absolute", top:"50%", left:"50%", width:500, height:500, transform:"translate(-50%,-50%)", borderRadius:"50%", background:"radial-gradient(circle,#a78bfa08,transparent 70%)" }} />
      </div>
      <div style={{ background:"linear-gradient(145deg,#0f172a,#161b22)", border:"1px solid #21262d", borderRadius:24, padding:"52px 44px", width:"100%", maxWidth:420, textAlign:"center", boxShadow:"0 25px 60px rgba(0,0,0,0.5)", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🏦</div>
        <h1 style={{ fontSize:30, fontWeight:800, color:"#fff", margin:"0 0 6px", letterSpacing:"-1px" }}>SBI PO Study Codex</h1>
        <p style={{ fontSize:14, color:"#484f58", margin:"0 0 40px" }}>Your personal exam preparation tracker.</p>
        <button onClick={handleGoogle} disabled={loading} style={{ width:"100%", padding:"14px 20px", background:loading?"#1e293b":"#fff", border:"none", borderRadius:12, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:12, fontSize:15, fontWeight:700, color:"#1a1a1a", transition:"all 0.2s", boxShadow:"0 4px 14px rgba(0,0,0,0.3)", fontFamily:"'Cambria','Georgia',serif" }}>
          {loading ? <span style={{color:"#64748b"}}>Connecting...</span> : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
        {error && <p style={{color:"#f87171",fontSize:13,marginTop:16}}>{error}</p>}
        <p style={{fontSize:12,color:"#30363d",marginTop:28,lineHeight:1.6}}>Your study data is securely stored in the cloud and synced across all devices.</p>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function SBIPOTracker() {
  const today = getTodayStr();
  const weekStart = getWeekStart();
  const weekDates = getWeekDates(weekStart);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [view, setView] = useState("daily");
  const [subjects, setSubjectsState] = useState(DEFAULT_SUBJECTS);
  const [hours, setHoursState] = useState({});
  const [subtopics, setSubtopicsState] = useState({});
  const [tasks, setTasksState] = useState([]);
  const [exams, setExamsState] = useState([]);
  const [mocks, setMocksState] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);
  const [manageMode, setManageMode] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title:"", subject:"quants", topic:"prelims", date:today, priority:"medium" });
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExam, setNewExam] = useState({ title:"", subject:"quants", date:"", targetScore:"" });
  const [showAddMock, setShowAddMock] = useState(false);
  const [newMock, setNewMock] = useState({ title:"", type:"prelims", date:today, score:"", total:"100", remarks:"" });
  const [addSubjectForm, setAddSubjectForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ label:"", short:"", color:SUBJECT_COLORS[0], icon:SUBJECT_ICONS[0] });
  const [addingTopicFor, setAddingTopicFor] = useState(null);
  const [newTopicLabel, setNewTopicLabel] = useState("");
  const [addingSubtopicFor, setAddingSubtopicFor] = useState(null);
  const [newSubtopicLabel, setNewSubtopicLabel] = useState("");

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load from Supabase ──
  const loadData = useCallback(async (userId) => {
    setSyncing(true);
    const { data, error } = await supabase.from("study_data").select("*").eq("user_id", userId).single();
    if (data && !error) {
      if (data.subjects?.length) setSubjectsState(data.subjects);
      if (data.hours) setHoursState(data.hours);
      if (data.subtopics) setSubtopicsState(data.subtopics);
      if (data.tasks) setTasksState(data.tasks);
      if (data.exams) setExamsState(data.exams);
      if (data.mocks) setMocksState(data.mocks);
    }
    setSyncing(false);
  }, []);

  useEffect(() => { if (session?.user?.id) loadData(session.user.id); }, [session, loadData]);

  // ── Save to Supabase ──
  const saveAll = useCallback(async (overrides = {}) => {
    if (!session?.user?.id) return;
    setSyncing(true);
    await supabase.from("study_data").upsert({
      user_id: session.user.id,
      subjects: overrides.subjects ?? subjects,
      hours: overrides.hours ?? hours,
      subtopics: overrides.subtopics ?? subtopics,
      tasks: overrides.tasks ?? tasks,
      exams: overrides.exams ?? exams,
      mocks: overrides.mocks ?? mocks,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSyncing(false);
  }, [session, subjects, hours, subtopics, tasks, exams, mocks]);

  const setSubjects = (v) => { setSubjectsState(v); saveAll({ subjects: v }); };
  const setHours = (v) => { setHoursState(v); saveAll({ hours: v }); };
  const setSubtopics = (v) => { setSubtopicsState(v); saveAll({ subtopics: v }); };
  const setTasks = (v) => { setTasksState(v); saveAll({ tasks: v }); };
  const setExams = (v) => { setExamsState(v); saveAll({ exams: v }); };
  const setMocks = (v) => { setMocksState(v); saveAll({ mocks: v }); };

  // ── Timer ──
  useEffect(() => {
    if (timerRunning) { timerRef.current = setInterval(() => setTimerSeconds(s => s+1), 1000); }
    else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const startTimer = (subjectId) => {
    if (timerRunning && timerSubject === subjectId) {
      setTimerRunning(false);
      const mins = Math.round(timerSeconds/60);
      if (mins > 0) {
        const newHours = JSON.parse(JSON.stringify(hours));
        if (!newHours[today]) newHours[today] = {};
        newHours[today][subjectId] = (newHours[today][subjectId]||0) + mins;
        setHours(newHours);
      }
      setTimerSeconds(0); setTimerSubject(null);
    } else {
      if (timerRunning) {
        const mins = Math.round(timerSeconds/60);
        if (mins > 0) {
          const newHours = JSON.parse(JSON.stringify(hours));
          if (!newHours[today]) newHours[today] = {};
          newHours[today][timerSubject] = (newHours[today][timerSubject]||0) + mins;
          setHours(newHours);
        }
        setTimerSeconds(0);
      }
      setTimerSubject(subjectId); setTimerRunning(true);
    }
  };

  const fmtTime = (secs) => {
    const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;
    return h>0?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const getHours = (subjectId, date) => (hours[date]||{})[subjectId]||0;
  const getTotalHours = (date) => subjects.reduce((s,sub) => s+getHours(sub.id,date), 0);
  const getWeekMins = (subjectId) => weekDates.reduce((s,d) => s+getHours(subjectId,d), 0);
  const getAllTimeMins = (subjectId) => Object.values(hours).reduce((s,day) => s+(day[subjectId]||0), 0);
  const getTotalAllTimeMins = () => subjects.reduce((s,sub) => s+getAllTimeMins(sub.id), 0);

  const toggleSubtopic = (subjectId, topicId, subtopic) => {
    const key = `${subjectId}_${topicId}_${subtopic}`;
    const newSubs = { ...subtopics, [key]: !subtopics[key] };
    setSubtopics(newSubs);
  };
  const isSubtopicDone = (subjectId, topicId, subtopic) => !!(subtopics[`${subjectId}_${topicId}_${subtopic}`]);

  const getTopicProgress = (subjectId, topicId) => {
    const sub = subjects.find(s=>s.id===subjectId);
    const topic = sub?.topics.find(t=>t.id===topicId);
    if (!topic) return {done:0,total:0};
    return { done: topic.subtopics.filter(st=>isSubtopicDone(subjectId,topicId,st)).length, total: topic.subtopics.length };
  };
  const getSubjectProgress = (subjectId) => {
    const sub = subjects.find(s=>s.id===subjectId);
    let done=0, total=0;
    sub?.topics.forEach(t => { const p=getTopicProgress(subjectId,t.id); done+=p.done; total+=p.total; });
    return {done,total};
  };

  // ── Subject CRUD ──
  const addSubject = () => {
    if (!newSubject.label.trim()) return;
    const s = { ...newSubject, id:uid(), topics:[] };
    setSubjects([...subjects, s]);
    setNewSubject({ label:"", short:"", color:SUBJECT_COLORS[subjects.length%SUBJECT_COLORS.length], icon:SUBJECT_ICONS[subjects.length%SUBJECT_ICONS.length] });
    setAddSubjectForm(false);
  };
  const deleteSubject = (id) => setSubjects(subjects.filter(s=>s.id!==id));
  const updateSubject = (id, changes) => setSubjects(subjects.map(s=>s.id===id?{...s,...changes}:s));
  const addTopic = (subjectId) => {
    if (!newTopicLabel.trim()) return;
    setSubjects(subjects.map(s=>s.id===subjectId?{...s,topics:[...s.topics,{id:uid(),label:newTopicLabel,subtopics:[]}]}:s));
    setNewTopicLabel(""); setAddingTopicFor(null);
  };
  const deleteTopic = (subjectId, topicId) => setSubjects(subjects.map(s=>s.id===subjectId?{...s,topics:s.topics.filter(t=>t.id!==topicId)}:s));
  const updateTopic = (subjectId, topicId, label) => setSubjects(subjects.map(s=>s.id===subjectId?{...s,topics:s.topics.map(t=>t.id===topicId?{...t,label}:t)}:s));
  const addSubtopic = (subjectId, topicId) => {
    if (!newSubtopicLabel.trim()) return;
    setSubjects(subjects.map(s=>s.id===subjectId?{...s,topics:s.topics.map(t=>t.id===topicId?{...t,subtopics:[...t.subtopics,newSubtopicLabel]}:t)}:s));
    setNewSubtopicLabel(""); setAddingSubtopicFor(null);
  };
  const deleteSubtopic = (subjectId, topicId, subtopic) => setSubjects(subjects.map(s=>s.id===subjectId?{...s,topics:s.topics.map(t=>t.id===topicId?{...t,subtopics:t.subtopics.filter(st=>st!==subtopic)}:t)}:s));
  const renameSubtopic = (subjectId, topicId, oldName, newName) => setSubjects(subjects.map(s=>s.id===subjectId?{...s,topics:s.topics.map(t=>t.id===topicId?{...t,subtopics:t.subtopics.map(st=>st===oldName?newName:st)}:t)}:s));

  // ── Tasks ──
  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks([...tasks, {...newTask, id:Date.now(), done:false}]);
    setNewTask({title:"",subject:subjects[0]?.id||"",topic:subjects[0]?.topics[0]?.id||"",date:today,priority:"medium"});
    setShowAddTask(false);
  };
  const toggleTask = (id) => setTasks(tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
  const deleteTask = (id) => setTasks(tasks.filter(t=>t.id!==id));

  // ── Exams ──
  const addExam = () => {
    if (!newExam.title.trim()||!newExam.date) return;
    setExams([...exams, {...newExam, id:Date.now()}]);
    setNewExam({title:"",subject:subjects[0]?.id||"",date:"",targetScore:""}); setShowAddExam(false);
  };
  const deleteExam = (id) => setExams(exams.filter(e=>e.id!==id));
  const getDaysLeft = (dateStr) => Math.ceil((new Date(dateStr)-new Date(today))/86400000);

  // ── Mocks ──
  const addMock = () => {
    if (!newMock.title.trim()) return;
    setMocks([...mocks, {...newMock, id:Date.now()}]);
    setNewMock({title:"",type:"prelims",date:today,score:"",total:"100",remarks:""}); setShowAddMock(false);
  };
  const deleteMock = (id) => setMocks(mocks.filter(m=>m.id!==id));

  // ── Derived stats ──
  const todayTotal = getTotalHours(today);
  const weekTotal = weekDates.reduce((s,d)=>s+getTotalHours(d),0);
  const allTimeMins = getTotalAllTimeMins();
  const upcomingExams = exams.filter(e=>getDaysLeft(e.date)>=0).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const monthDays = getMonthDays(selectedMonth);
  const getTopicColor = (idx) => TOPIC_COLORS[idx%Object.keys(TOPIC_COLORS).length];

  const inp = { background:"#0d1117", border:"1px solid #21262d", borderRadius:8, color:"#e6edf3", padding:"8px 12px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"'Cambria','Georgia',serif" };

  const signOut = async () => { await supabase.auth.signOut(); };

  // ── Manage Panel ──
  const ManagePanel = () => (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:420, background:"#0d1117", borderLeft:"1px solid #21262d", zIndex:200, overflowY:"auto", padding:24, fontFamily:"'Cambria','Georgia',serif" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <span style={{ fontWeight:800, fontSize:16, color:"#fff" }}>⚙️ Manage Structure</span>
        <button onClick={()=>setManageMode(false)} style={{ background:"#21262d", border:"none", color:"#8b949e", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13, fontFamily:"'Cambria','Georgia',serif" }}>✕ Close</button>
      </div>
      <div style={{ fontSize:12, color:"#484f58", marginBottom:14, background:"#161b22", borderRadius:8, padding:"10px 12px", border:"1px solid #21262d" }}>
        💡 Click any name to rename. Use + to add, ✕ to delete.
      </div>
      {subjects.map((sub,si) => (
        <div key={sub.id} style={{ background:"#161b22", border:"1px solid #21262d", borderRadius:14, marginBottom:12, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <select value={sub.icon} onChange={e=>updateSubject(sub.id,{icon:e.target.value})} style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:6, color:"#e6edf3", padding:"4px 6px", fontSize:18, cursor:"pointer" }}>
              {SUBJECT_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}
            </select>
            <div style={{ flex:1 }}>
              <Editable value={sub.label} onSave={v=>updateSubject(sub.id,{label:v})} style={{ fontSize:14, fontWeight:700, color:sub.color }} />
              <div style={{ marginTop:3 }}><Editable value={sub.short} onSave={v=>updateSubject(sub.id,{short:v})} style={{ fontSize:11, color:"#484f58" }} /></div>
            </div>
            <input type="color" value={sub.color} onChange={e=>updateSubject(sub.id,{color:e.target.value})} style={{ width:28,height:28,borderRadius:6,border:"1px solid #30363d",padding:2,background:"none",cursor:"pointer" }} />
            <button onClick={()=>deleteSubject(sub.id)} style={{ background:"#21262d",border:"none",color:"#ef4444",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12 }}>✕</button>
          </div>
          <div style={{ padding:"0 16px 14px" }}>
            {sub.topics.map((topic,ti) => (
              <div key={topic.id} style={{ background:"#0d1117",borderRadius:10,padding:"10px 12px",marginBottom:8,border:"1px solid #21262d" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                  <span style={{ fontSize:13,color:getTopicColor(ti) }}>●</span>
                  <Editable value={topic.label} onSave={v=>updateTopic(sub.id,topic.id,v)} style={{ fontSize:13,fontWeight:700,color:getTopicColor(ti),flex:1 }} />
                  <button onClick={()=>deleteTopic(sub.id,topic.id)} style={{ background:"none",border:"none",color:"#484f58",cursor:"pointer",fontSize:12,padding:0 }}>✕</button>
                </div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                  {topic.subtopics.map((st,sti) => (
                    <div key={sti} style={{ display:"flex",alignItems:"center",background:"#161b22",borderRadius:16,padding:"3px 8px 3px 10px",border:`1px solid ${getTopicColor(ti)}30` }}>
                      <Editable value={st} onSave={v=>renameSubtopic(sub.id,topic.id,st,v)} style={{ fontSize:11,color:"#8b949e" }} />
                      <button onClick={()=>deleteSubtopic(sub.id,topic.id,st)} style={{ background:"none",border:"none",color:"#30363d",cursor:"pointer",fontSize:11,padding:"0 0 0 4px" }}>✕</button>
                    </div>
                  ))}
                  {addingSubtopicFor===`${sub.id}_${topic.id}` ? (
                    <div style={{ display:"flex",gap:5,alignItems:"center" }}>
                      <input autoFocus placeholder="Subtopic..." value={newSubtopicLabel} onChange={e=>setNewSubtopicLabel(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter")addSubtopic(sub.id,topic.id); if(e.key==="Escape")setAddingSubtopicFor(null); }}
                        style={{ ...inp,width:130,padding:"4px 8px",fontSize:11,borderRadius:16 }} />
                      <button onClick={()=>addSubtopic(sub.id,topic.id)} style={{ background:getTopicColor(ti),border:"none",color:"#0d1117",borderRadius:12,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700 }}>Add</button>
                      <button onClick={()=>setAddingSubtopicFor(null)} style={{ background:"#21262d",border:"none",color:"#8b949e",borderRadius:12,padding:"4px 8px",cursor:"pointer",fontSize:11 }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={()=>{ setAddingSubtopicFor(`${sub.id}_${topic.id}`); setNewSubtopicLabel(""); }} style={{ background:"transparent",border:`1px dashed ${getTopicColor(ti)}50`,color:getTopicColor(ti),borderRadius:16,padding:"3px 10px",cursor:"pointer",fontSize:11,fontWeight:600 }}>+ subtopic</button>
                  )}
                </div>
              </div>
            ))}
            {addingTopicFor===sub.id ? (
              <div style={{ display:"flex",gap:8,alignItems:"center",marginTop:4 }}>
                <input autoFocus placeholder="Topic name..." value={newTopicLabel} onChange={e=>setNewTopicLabel(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter")addTopic(sub.id); if(e.key==="Escape")setAddingTopicFor(null); }}
                  style={{ ...inp,flex:1,padding:"6px 10px",fontSize:12 }} />
                <button onClick={()=>addTopic(sub.id)} style={{ background:sub.color,border:"none",color:"#0d1117",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700 }}>Add</button>
                <button onClick={()=>setAddingTopicFor(null)} style={{ background:"#21262d",border:"none",color:"#8b949e",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12 }}>✕</button>
              </div>
            ) : (
              <button onClick={()=>{ setAddingTopicFor(sub.id); setNewTopicLabel(""); }} style={{ background:"transparent",border:`1px dashed ${sub.color}50`,color:sub.color,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600,width:"100%",marginTop:4 }}>+ Add Topic</button>
            )}
          </div>
        </div>
      ))}
      {addSubjectForm ? (
        <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:14,padding:16,marginBottom:14 }}>
          <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:12 }}>New Subject</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <input placeholder="Full name..." value={newSubject.label} onChange={e=>setNewSubject({...newSubject,label:e.target.value})} style={inp} />
            <input placeholder="Short name..." value={newSubject.short} onChange={e=>setNewSubject({...newSubject,short:e.target.value})} style={inp} />
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <select value={newSubject.icon} onChange={e=>setNewSubject({...newSubject,icon:e.target.value})} style={{ ...inp,fontSize:18 }}>{SUBJECT_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}</select>
              <input type="color" value={newSubject.color} onChange={e=>setNewSubject({...newSubject,color:e.target.value})} style={{ ...inp,height:38,padding:4,cursor:"pointer" }} />
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={addSubject} style={{ flex:1,background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"9px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"'Cambria','Georgia',serif" }}>Add Subject</button>
              <button onClick={()=>setAddSubjectForm(false)} style={{ flex:1,background:"#21262d",color:"#8b949e",border:"none",borderRadius:8,padding:"9px",cursor:"pointer",fontSize:13,fontFamily:"'Cambria','Georgia',serif" }}>Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAddSubjectForm(true)} style={{ background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:12,padding:"11px",cursor:"pointer",fontWeight:700,fontSize:14,width:"100%",fontFamily:"'Cambria','Georgia',serif" }}>+ Add New Subject</button>
      )}
    </div>
  );

  if (authLoading) return (
    <div style={{ minHeight:"100vh",background:"#0d1117",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ color:"#f97316",fontSize:16,fontFamily:"'Cambria','Georgia',serif" }}>Loading...</div>
    </div>
  );
  if (!session) return <LoginScreen />;

  const user = session.user;

  return (
    <div style={{ minHeight:"100vh", background:"#0d1117", color:"#e6edf3", fontFamily:"'Cambria','Georgia',serif" }}>
      {manageMode && <ManagePanel />}
      {manageMode && <div onClick={()=>setManageMode(false)} style={{ position:"fixed",inset:0,background:"#00000070",zIndex:199 }} />}

      {/* HEADER */}
      <div style={{ background:"linear-gradient(90deg,#0d1117,#161b22)", borderBottom:"1px solid #21262d", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#f97316,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🏦</div>
          <div>
            <div style={{ fontWeight:800,fontSize:17,color:"#fff",letterSpacing:"-0.5px" }}>Study Tracker For LilaWati Kumari</div>
            <div style={{ fontSize:11,color:"#484f58" }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
        </div>
        {timerRunning && (
          <div style={{ background:"#161b22",border:"1px solid #f97316",borderRadius:20,padding:"5px 14px",display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:"#f97316",animation:"pulse 1s infinite" }} />
            <span style={{ fontSize:12,fontWeight:700,color:"#f97316" }}>{subjects.find(s=>s.id===timerSubject)?.short} — {fmtTime(timerSeconds)}</span>
          </div>
        )}
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          {["daily","weekly","monthly","mocks","exams","stats"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{ padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,textTransform:"capitalize",background:view===v?"linear-gradient(135deg,#f97316,#ec4899)":"#161b22",color:view===v?"#fff":"#484f58",transition:"all 0.2s",fontFamily:"'Cambria','Georgia',serif" }}>{v}</button>
          ))}
          <button onClick={()=>setManageMode(true)} style={{ padding:"6px 12px",borderRadius:8,border:"1px solid #30363d",background:"#161b22",color:"#8b949e",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'Cambria','Georgia',serif" }}>⚙️ Manage</button>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {syncing && <span style={{ fontSize:11,color:"#f97316",animation:"pulse 1s infinite" }}>● Saving...</span>}
          {user.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width:28,height:28,borderRadius:"50%",border:"2px solid #f97316" }} />}
          <span style={{ fontSize:12,color:"#8b949e" }}>{user.user_metadata?.full_name||user.email}</span>
          <button onClick={signOut} style={{ background:"#161b22",border:"1px solid #21262d",color:"#484f58",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,fontFamily:"'Cambria','Georgia',serif" }}>Sign out</button>
        </div>
      </div>

      <div style={{ padding:"18px 24px", maxWidth:1150, margin:"0 auto" }}>
        {/* STAT CARDS */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18 }}>
          {[
            { label:"Today's Study", value:`${todayTotal}m`, sub:`${(todayTotal/60).toFixed(1)} hrs`, color:"#f97316" },
            { label:"This Week", value:`${weekTotal}m`, sub:`${(weekTotal/60).toFixed(1)} hrs`, color:"#22d3ee" },
            { label:"All-Time Study", value:`${Math.round(allTimeMins/60)}h`, sub:`${allTimeMins} total mins`, color:"#a78bfa" },
            { label:"Days to Exam", value:upcomingExams[0]?`${getDaysLeft(upcomingExams[0].date)}d`:"—", sub:upcomingExams[0]?.title||"No exam set", color:"#f472b6" },
          ].map((s,i)=>(
            <div key={i} style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:s.color }} />
              <div style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10,fontWeight:700,color:"#484f58",textTransform:"uppercase",letterSpacing:"0.5px",marginTop:2 }}>{s.label}</div>
              <div style={{ fontSize:11,color:"#30363d",marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* DAILY VIEW */}
        {view==="daily" && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 290px",gap:16 }}>
            <div>
              {subjects.length===0 && (
                <div style={{ textAlign:"center",padding:"60px 0",color:"#484f58" }}>
                  <div style={{ fontSize:32,marginBottom:12 }}>📭</div>
                  <div style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>No subjects yet</div>
                  <div style={{ fontSize:13 }}>Click <strong style={{color:"#f97316"}}>⚙️ Manage</strong> to add subjects</div>
                </div>
              )}
              {subjects.map(sub => {
                const isActive = timerRunning&&timerSubject===sub.id;
                const subProg = getSubjectProgress(sub.id);
                const isExpSub = expandedSubject===sub.id;
                return (
                  <div key={sub.id} style={{ background:"#161b22",border:`1px solid ${isActive?sub.color:"#21262d"}`,borderRadius:14,marginBottom:10,overflow:"hidden",boxShadow:isActive?`0 0 20px ${sub.color}25`:"none",transition:"all 0.3s" }}>
                    <div style={{ padding:"13px 16px",display:"flex",alignItems:"center",gap:12 }}>
                      <div style={{ width:40,height:40,borderRadius:12,background:sub.color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{sub.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:14,color:"#e6edf3" }}>{sub.label}</div>
                        <div style={{ fontSize:11,color:"#484f58",marginTop:1 }}>{getHours(sub.id,today)}m today · {subProg.done}/{subProg.total} subtopics · {getAllTimeMins(sub.id)}m all-time</div>
                        <div style={{ background:"#0d1117",borderRadius:4,height:4,marginTop:5 }}>
                          <div style={{ width:`${subProg.total?(subProg.done/subProg.total)*100:0}%`,height:"100%",background:sub.color,borderRadius:4,transition:"width 0.5s" }} />
                        </div>
                      </div>
                      <div style={{ display:"flex",gap:7 }}>
                        <button onClick={()=>setExpandedSubject(isExpSub?null:sub.id)} style={{ background:isExpSub?sub.color+"25":"#21262d",border:`1px solid ${isExpSub?sub.color:"#30363d"}`,color:isExpSub?sub.color:"#8b949e",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'Cambria','Georgia',serif" }}>
                          {isExpSub?"▲ Hide":"▼ Topics"}
                        </button>
                        <button onClick={()=>startTimer(sub.id)} style={{ background:isActive?sub.color:"#21262d",border:`1px solid ${isActive?sub.color:"#30363d"}`,color:isActive?"#0d1117":sub.color,borderRadius:8,padding:"5px 13px",cursor:"pointer",fontSize:12,fontWeight:700,minWidth:90,fontFamily:"'Cambria','Georgia',serif" }}>
                          {isActive?`⏹ ${fmtTime(timerSeconds)}`:"▶ Study"}
                        </button>
                      </div>
                    </div>
                    {isExpSub && (
                      <div style={{ borderTop:"1px solid #21262d",background:"#0d1117",padding:"12px 16px" }}>
                        {sub.topics.length===0 && <div style={{ textAlign:"center",padding:"14px 0",color:"#484f58",fontSize:12 }}>No topics — add via ⚙️ Manage</div>}
                        {sub.topics.map((topic,ti) => {
                          const tProg = getTopicProgress(sub.id,topic.id);
                          const isExpTopic = expandedTopic===`${sub.id}_${topic.id}`;
                          const tColor = getTopicColor(ti);
                          return (
                            <div key={topic.id} style={{ marginBottom:9 }}>
                              <div onClick={()=>setExpandedTopic(isExpTopic?null:`${sub.id}_${topic.id}`)} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#161b22",borderRadius:10,cursor:"pointer",border:`1px solid ${isExpTopic?tColor:"#21262d"}`,transition:"all 0.2s" }}>
                                <span style={{ fontSize:14 }}>📌</span>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:13,fontWeight:700,color:tColor }}>{topic.label}</div>
                                  <div style={{ fontSize:11,color:"#484f58",marginTop:1 }}>{tProg.done}/{tProg.total} subtopics</div>
                                </div>
                                <div style={{ width:70,background:"#21262d",borderRadius:4,height:5,overflow:"hidden" }}>
                                  <div style={{ width:`${tProg.total?(tProg.done/tProg.total)*100:0}%`,height:"100%",background:tColor,borderRadius:4 }} />
                                </div>
                                <span style={{ fontSize:12,fontWeight:700,color:tColor,minWidth:30,textAlign:"right" }}>{tProg.total?Math.round((tProg.done/tProg.total)*100):0}%</span>
                                <span style={{ color:"#484f58",fontSize:11 }}>{isExpTopic?"▲":"▼"}</span>
                              </div>
                              {isExpTopic && (
                                <div style={{ display:"flex",flexWrap:"wrap",gap:6,padding:"10px 12px 4px",background:"#0a0e16",borderRadius:"0 0 10px 10px",border:`1px solid ${tColor}25`,borderTop:"none" }}>
                                  {topic.subtopics.length===0 && <span style={{ fontSize:11,color:"#484f58",fontStyle:"italic" }}>No subtopics — add via ⚙️ Manage</span>}
                                  {topic.subtopics.map(st => {
                                    const done = isSubtopicDone(sub.id,topic.id,st);
                                    return (
                                      <button key={st} onClick={()=>toggleSubtopic(sub.id,topic.id,st)} style={{ padding:"5px 11px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:done?tColor:"#161b22",color:done?"#0d1117":"#8b949e",border:`1px solid ${done?tColor:"#30363d"}`,transition:"all 0.15s",fontFamily:"'Cambria','Georgia',serif" }}>
                                        {done?"✓ ":""}{st}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar */}
            <div>
              <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:14,padding:16,marginBottom:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                  <span style={{ fontWeight:700,fontSize:14,color:"#fff" }}>Today's Tasks</span>
                  <button onClick={()=>setShowAddTask(!showAddTask)} style={{ background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Cambria','Georgia',serif" }}>+ Add</button>
                </div>
                {showAddTask && (
                  <div style={{ background:"#0d1117",borderRadius:10,padding:12,marginBottom:12,display:"flex",flexDirection:"column",gap:7 }}>
                    <input placeholder="Task title..." value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} style={inp} />
                    <select value={newTask.subject} onChange={e=>{ const sub=subjects.find(s=>s.id===e.target.value); setNewTask({...newTask,subject:e.target.value,topic:sub?.topics[0]?.id||""}); }} style={inp}>
                      {subjects.map(s=><option key={s.id} value={s.id}>{s.short}</option>)}
                    </select>
                    <select value={newTask.topic} onChange={e=>setNewTask({...newTask,topic:e.target.value})} style={inp}>
                      {(subjects.find(s=>s.id===newTask.subject)?.topics||[]).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})} style={inp}>
                      <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                    </select>
                    <input type="date" value={newTask.date} onChange={e=>setNewTask({...newTask,date:e.target.value})} style={inp} />
                    <div style={{ display:"flex",gap:7 }}>
                      <button onClick={addTask} style={{ flex:1,background:"#f97316",color:"#fff",border:"none",borderRadius:8,padding:7,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"'Cambria','Georgia',serif" }}>Save</button>
                      <button onClick={()=>setShowAddTask(false)} style={{ flex:1,background:"#21262d",color:"#8b949e",border:"none",borderRadius:8,padding:7,cursor:"pointer",fontSize:12,fontFamily:"'Cambria','Georgia',serif" }}>Cancel</button>
                    </div>
                  </div>
                )}
                {tasks.filter(t=>t.date===today).length===0&&!showAddTask&&<div style={{ textAlign:"center",color:"#30363d",fontSize:12,padding:"14px 0" }}>No tasks for today</div>}
                {tasks.filter(t=>t.date===today).map(task => {
                  const sub=subjects.find(s=>s.id===task.subject); const topic=sub?.topics.find(t=>t.id===task.topic); const pColor={high:"#f97316",medium:"#f59e0b",low:"#34d399"}[task.priority];
                  return (
                    <div key={task.id} style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"8px 0",borderBottom:"1px solid #21262d",opacity:task.done?0.45:1 }}>
                      <button onClick={()=>toggleTask(task.id)} style={{ width:20,height:20,marginTop:1,borderRadius:5,flexShrink:0,background:task.done?(sub?.color||"#f97316"):"transparent",border:`2px solid ${task.done?(sub?.color||"#f97316"):"#30363d"}`,cursor:"pointer",color:"#0d1117",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>{task.done?"✓":""}</button>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,color:"#e6edf3",textDecoration:task.done?"line-through":"none" }}>{task.title}</div>
                        <div style={{ fontSize:10,color:"#484f58",marginTop:2 }}><span style={{color:sub?.color||"#f97316"}}>{sub?.short||"?"}</span>{topic&&<span style={{color:"#64748b"}}> · {topic.label}</span>}</div>
                      </div>
                      <div style={{ width:7,height:7,borderRadius:"50%",background:pColor,flexShrink:0,marginTop:5 }} />
                      <button onClick={()=>deleteTask(task.id)} style={{ background:"none",border:"none",color:"#30363d",cursor:"pointer",fontSize:12,padding:0 }}>✕</button>
                    </div>
                  );
                })}
              </div>
              {upcomingExams.slice(0,3).map(exam => {
                const sub=subjects.find(s=>s.id===exam.subject); const days=getDaysLeft(exam.date);
                return (
                  <div key={exam.id} style={{ background:"#161b22",border:`1px solid ${days<=7?"#f97316":"#21262d"}`,borderRadius:12,padding:"11px 14px",marginBottom:9,display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontSize:20 }}>{sub?.icon||"📅"}</span>
                    <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#e6edf3" }}>{exam.title}</div><div style={{ fontSize:10,color:sub?.color||"#f97316" }}>{sub?.short}</div></div>
                    <div style={{ textAlign:"right" }}><div style={{ fontSize:18,fontWeight:800,color:days<=7?"#f97316":days<=30?"#f59e0b":"#a78bfa" }}>{days}d</div><div style={{ fontSize:10,color:"#484f58" }}>left</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEKLY VIEW */}
        {view==="weekly" && (
          <div>
            {subjects.map(sub => (
              <div key={sub.id} style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:14,padding:18,marginBottom:12 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                  <span style={{ fontSize:20 }}>{sub.icon}</span>
                  <span style={{ fontWeight:700,fontSize:14,color:sub.color }}>{sub.label}</span>
                  <span style={{ fontSize:11,color:"#484f58" }}>{getWeekMins(sub.id)}m this week · {getAllTimeMins(sub.id)}m all-time</span>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"130px repeat(7,1fr) 70px",gap:5,marginBottom:8 }}>
                  <div style={{ fontSize:11,color:"#484f58" }}>Topic</div>
                  {weekDates.map((date,i)=>(
                    <div key={date} style={{ textAlign:"center",fontSize:11,fontWeight:700,color:date===today?sub.color:"#484f58" }}>
                      <div>{DAYS[i]}</div><div style={{ fontWeight:400,fontSize:10 }}>{new Date(date+"T12:00:00").getDate()}</div>
                    </div>
                  ))}
                  <div style={{ fontSize:11,color:"#484f58",textAlign:"center" }}>Progress</div>
                </div>
                {sub.topics.map((topic,ti) => {
                  const tProg=getTopicProgress(sub.id,topic.id); const tColor=getTopicColor(ti);
                  return (
                    <div key={topic.id} style={{ display:"grid",gridTemplateColumns:"130px repeat(7,1fr) 70px",gap:5,alignItems:"center",marginBottom:7 }}>
                      <div style={{ fontSize:12,fontWeight:600,color:tColor }}>{topic.label}</div>
                      {weekDates.map(date => {
                        const mins=getHours(sub.id,date);
                        return <div key={date} style={{ display:"flex",justifyContent:"center" }}><div style={{ width:30,height:30,borderRadius:7,background:mins>0?tColor+"30":"#21262d",border:date===today?`2px solid ${tColor}`:"1px solid #21262d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:mins>0?tColor:"#30363d",fontWeight:700 }}>{mins>0?"✓":"–"}</div></div>;
                      })}
                      <div style={{ textAlign:"center" }}><div style={{ fontSize:12,fontWeight:800,color:tColor }}>{tProg.total?Math.round((tProg.done/tProg.total)*100):0}%</div><div style={{ fontSize:10,color:"#484f58" }}>{tProg.done}/{tProg.total}</div></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* MONTHLY VIEW */}
        {view==="monthly" && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <span style={{ fontWeight:700,fontSize:15,color:"#fff" }}>Monthly Heatmap</span>
              <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{ ...inp,width:"auto" }}>
                {Array.from({length:12},(_,i)=>{ const d=new Date(new Date().getFullYear(),i,1); const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; return <option key={key} value={key}>{MONTHS[i]} {d.getFullYear()}</option>; })}
              </select>
            </div>
            {subjects.map(sub => (
              <div key={sub.id} style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:14,padding:18,marginBottom:12 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>{sub.icon}</span>
                  <span style={{ fontWeight:700,fontSize:14,color:sub.color }}>{sub.label}</span>
                  <span style={{ fontSize:11,color:"#484f58" }}>{monthDays.filter(d=>getHours(sub.id,d)>0).length} days studied this month</span>
                </div>
                {sub.topics.map((topic,ti) => {
                  const tColor=getTopicColor(ti);
                  return (
                    <div key={topic.id} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
                        <span style={{ fontSize:12,fontWeight:700,color:tColor }}>{topic.label}</span>
                      </div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                        {monthDays.map(date => {
                          const mins=getHours(sub.id,date); const isFuture=date>today; const intensity=Math.min(mins/120,1);
                          return <div key={date} title={`${date}: ${mins}m`} style={{ width:28,height:28,borderRadius:6,background:mins>0?tColor+Math.round(40+intensity*215).toString(16).padStart(2,"0"):"#21262d",border:date===today?`2px solid ${tColor}`:"1px solid #0d1117",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:mins>0?"#0d1117":"#30363d",fontWeight:600,opacity:isFuture?0.3:1 }}>{new Date(date+"T12:00:00").getDate()}</div>;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* MOCKS VIEW */}
        {view==="mocks" && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:16,padding:20 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <span style={{ fontWeight:700,fontSize:14,color:"#fff" }}>Mock Test Log</span>
                <button onClick={()=>setShowAddMock(!showAddMock)} style={{ background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Cambria','Georgia',serif" }}>+ Add Mock</button>
              </div>
              {showAddMock && (
                <div style={{ background:"#0d1117",borderRadius:10,padding:13,marginBottom:13,display:"flex",flexDirection:"column",gap:7 }}>
                  <input placeholder="Mock title..." value={newMock.title} onChange={e=>setNewMock({...newMock,title:e.target.value})} style={inp} />
                  <select value={newMock.type} onChange={e=>setNewMock({...newMock,type:e.target.value})} style={inp}>
                    <option value="prelims">Prelims</option><option value="mains">Mains</option><option value="speed">Speed Test</option><option value="sectional">Sectional</option>
                  </select>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7 }}>
                    <input placeholder="Score" value={newMock.score} onChange={e=>setNewMock({...newMock,score:e.target.value})} style={inp} />
                    <input placeholder="Total" value={newMock.total} onChange={e=>setNewMock({...newMock,total:e.target.value})} style={inp} />
                  </div>
                  <input type="date" value={newMock.date} onChange={e=>setNewMock({...newMock,date:e.target.value})} style={inp} />
                  <input placeholder="Remarks..." value={newMock.remarks} onChange={e=>setNewMock({...newMock,remarks:e.target.value})} style={inp} />
                  <div style={{ display:"flex",gap:7 }}>
                    <button onClick={addMock} style={{ flex:1,background:"#f97316",color:"#fff",border:"none",borderRadius:8,padding:7,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"'Cambria','Georgia',serif" }}>Save</button>
                    <button onClick={()=>setShowAddMock(false)} style={{ flex:1,background:"#21262d",color:"#8b949e",border:"none",borderRadius:8,padding:7,cursor:"pointer",fontSize:12,fontFamily:"'Cambria','Georgia',serif" }}>Cancel</button>
                  </div>
                </div>
              )}
              {mocks.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(mock => {
                const pct=mock.score&&mock.total?Math.round((parseFloat(mock.score)/parseFloat(mock.total))*100):null;
                const tColor={prelims:"#f97316",mains:"#a78bfa",speed:"#22d3ee",sectional:"#34d399"}[mock.type]||"#f97316";
                return (
                  <div key={mock.id} style={{ background:"#0d1117",borderRadius:12,padding:13,marginBottom:9,border:"1px solid #21262d" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:13,color:"#e6edf3" }}>{mock.title}</div>
                        <div style={{ display:"flex",gap:7,marginTop:4,alignItems:"center" }}>
                          <span style={{ fontSize:10,fontWeight:700,color:tColor,background:tColor+"20",padding:"2px 8px",borderRadius:10,textTransform:"capitalize" }}>{mock.type}</span>
                          <span style={{ fontSize:10,color:"#484f58" }}>📅 {mock.date}</span>
                        </div>
                        {mock.remarks&&<div style={{ fontSize:11,color:"#484f58",marginTop:4,fontStyle:"italic" }}>{mock.remarks}</div>}
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                        {pct!==null&&<div style={{ fontSize:20,fontWeight:800,color:pct>=70?"#34d399":pct>=50?"#f59e0b":"#f97316" }}>{pct}%</div>}
                        <div style={{ fontSize:11,color:"#484f58" }}>{mock.score}/{mock.total}</div>
                        <button onClick={()=>deleteMock(mock.id)} style={{ background:"none",border:"none",color:"#30363d",cursor:"pointer",fontSize:11 }}>✕</button>
                      </div>
                    </div>
                    {pct!==null&&<div style={{ background:"#21262d",borderRadius:4,height:5,marginTop:9,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:pct>=70?"#34d399":pct>=50?"#f59e0b":"#f97316",borderRadius:4 }} /></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:16,padding:20 }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:14 }}>Performance Trend</div>
              {mocks.length>0?(
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mocks.slice(-8).map(m=>({ name:m.title.slice(0,10), pct:m.score&&m.total?Math.round((parseFloat(m.score)/parseFloat(m.total))*100):0 }))}>
                      <XAxis dataKey="name" stroke="#30363d" fontSize={10} /><YAxis stroke="#30363d" fontSize={11} domain={[0,100]} />
                      <Tooltip contentStyle={{ background:"#21262d",border:"none",borderRadius:8,color:"#e6edf3",fontFamily:"'Cambria','Georgia',serif" }} formatter={v=>[`${v}%`]} />
                      <Bar dataKey="pct" radius={[6,6,0,0]}>{mocks.slice(-8).map((m,i)=>{ const pct=m.score&&m.total?Math.round((parseFloat(m.score)/parseFloat(m.total))*100):0; return <Cell key={i} fill={pct>=70?"#34d399":pct>=50?"#f59e0b":"#f97316"} />; })}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop:14 }}>
                    {["prelims","mains","speed","sectional"].map(type=>{ const tm=mocks.filter(m=>m.type===type&&m.score&&m.total); if(!tm.length)return null; const avg=Math.round(tm.reduce((s,m)=>s+(parseFloat(m.score)/parseFloat(m.total))*100,0)/tm.length); const tColor={prelims:"#f97316",mains:"#a78bfa",speed:"#22d3ee",sectional:"#34d399"}[type]; return <div key={type} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #21262d" }}><span style={{ fontSize:12,fontWeight:600,color:tColor,textTransform:"capitalize" }}>{type}</span><span style={{ fontSize:11,color:"#484f58" }}>{tm.length} tests</span><span style={{ fontSize:15,fontWeight:800,color:avg>=70?"#34d399":avg>=50?"#f59e0b":"#f97316" }}>Avg {avg}%</span></div>; })}
                  </div>
                </>
              ):<div style={{ textAlign:"center",color:"#30363d",fontSize:13,padding:"40px 0" }}>Add mocks to see trend</div>}
            </div>
          </div>
        )}

        {/* EXAMS VIEW */}
        {view==="exams" && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:16,padding:20 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <span style={{ fontWeight:700,fontSize:14,color:"#fff" }}>Exam Schedule</span>
                <button onClick={()=>setShowAddExam(!showAddExam)} style={{ background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Cambria','Georgia',serif" }}>+ Add</button>
              </div>
              {showAddExam&&(
                <div style={{ background:"#0d1117",borderRadius:10,padding:13,marginBottom:13,display:"flex",flexDirection:"column",gap:7 }}>
                  <input placeholder="Exam name..." value={newExam.title} onChange={e=>setNewExam({...newExam,title:e.target.value})} style={inp} />
                  <select value={newExam.subject} onChange={e=>setNewExam({...newExam,subject:e.target.value})} style={inp}>{subjects.map(s=><option key={s.id} value={s.id}>{s.short}</option>)}</select>
                  <input type="date" value={newExam.date} onChange={e=>setNewExam({...newExam,date:e.target.value})} style={inp} />
                  <input placeholder="Target score (optional)" value={newExam.targetScore} onChange={e=>setNewExam({...newExam,targetScore:e.target.value})} style={inp} />
                  <div style={{ display:"flex",gap:7 }}><button onClick={addExam} style={{ flex:1,background:"#f97316",color:"#fff",border:"none",borderRadius:8,padding:7,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"'Cambria','Georgia',serif" }}>Save</button><button onClick={()=>setShowAddExam(false)} style={{ flex:1,background:"#21262d",color:"#8b949e",border:"none",borderRadius:8,padding:7,cursor:"pointer",fontSize:12,fontFamily:"'Cambria','Georgia',serif" }}>Cancel</button></div>
                </div>
              )}
              {exams.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(exam=>{ const sub=subjects.find(s=>s.id===exam.subject); const days=getDaysLeft(exam.date); const isPast=days<0; return <div key={exam.id} style={{ background:"#0d1117",borderRadius:12,padding:14,marginBottom:9,border:`1px solid ${days<=7&&!isPast?"#f97316":"#21262d"}`,opacity:isPast?0.5:1 }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}><div><div style={{ fontWeight:700,fontSize:13,color:"#e6edf3" }}>{exam.title}</div><div style={{ fontSize:11,color:sub?.color||"#f97316",marginTop:2 }}>{sub?.icon} {sub?.label}</div><div style={{ fontSize:10,color:"#484f58",marginTop:3 }}>📅 {new Date(exam.date+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}{exam.targetScore&&<span style={{ marginLeft:10 }}>🎯 {exam.targetScore}</span>}</div></div><div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}><div style={{ fontSize:20,fontWeight:800,color:isPast?"#484f58":days<=7?"#f97316":days<=30?"#f59e0b":"#34d399" }}>{isPast?"Done":`${days}d`}</div><button onClick={()=>deleteExam(exam.id)} style={{ background:"none",border:"none",color:"#30363d",cursor:"pointer",fontSize:12 }}>✕</button></div></div></div>; })}
            </div>
            <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:16,padding:20 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <span style={{ fontWeight:700,fontSize:14,color:"#fff" }}>All Tasks</span>
                <button onClick={()=>setShowAddTask(!showAddTask)} style={{ background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Cambria','Georgia',serif" }}>+ Add</button>
              </div>
              <div style={{ maxHeight:500,overflowY:"auto" }}>
                {tasks.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(task=>{ const sub=subjects.find(s=>s.id===task.subject); const topic=sub?.topics.find(t=>t.id===task.topic); const pColor={high:"#f97316",medium:"#f59e0b",low:"#34d399"}[task.priority]; return <div key={task.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #21262d",opacity:task.done?0.4:1 }}><button onClick={()=>toggleTask(task.id)} style={{ width:20,height:20,borderRadius:5,flexShrink:0,background:task.done?(sub?.color||"#f97316"):"transparent",border:`2px solid ${task.done?(sub?.color||"#f97316"):"#30363d"}`,cursor:"pointer",color:"#0d1117",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>{task.done?"✓":""}</button><div style={{ flex:1 }}><div style={{ fontSize:12,color:"#e6edf3",textDecoration:task.done?"line-through":"none" }}>{task.title}</div><div style={{ fontSize:10,color:"#484f58",marginTop:1 }}><span style={{color:sub?.color||"#f97316"}}>{sub?.short||"?"}</span>{topic&&<span style={{color:"#64748b"}}> · {topic.label}</span>}<span> · {task.date}</span></div></div><div style={{ width:7,height:7,borderRadius:"50%",background:pColor,flexShrink:0 }} /><button onClick={()=>deleteTask(task.id)} style={{ background:"none",border:"none",color:"#30363d",cursor:"pointer",fontSize:12 }}>✕</button></div>; })}
              </div>
            </div>
          </div>
        )}

        {/* STATS VIEW */}
        {view==="stats" && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:16,padding:20 }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:14 }}>Weekly Study (mins/day)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekDates.map((date,i)=>({ day:DAYS[i], ...Object.fromEntries(subjects.map(s=>[s.short,getHours(s.id,date)])) }))}>
                  <XAxis dataKey="day" stroke="#30363d" fontSize={12} /><YAxis stroke="#30363d" fontSize={11} />
                  <Tooltip contentStyle={{ background:"#21262d",border:"none",borderRadius:8,color:"#e6edf3",fontFamily:"'Cambria','Georgia',serif" }} />
                  {subjects.map(s=><Bar key={s.id} dataKey={s.short} stackId="a" fill={s.color} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:16,padding:20 }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:14 }}>Subtopic Coverage</div>
              {subjects.map(sub=>{ const prog=getSubjectProgress(sub.id); return (
                <div key={sub.id} style={{ marginBottom:13 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}><span style={{ color:"#e6edf3",fontWeight:600 }}>{sub.icon} {sub.short}</span><span style={{ color:sub.color,fontWeight:700 }}>{prog.done}/{prog.total}</span></div>
                  <div style={{ background:"#21262d",borderRadius:4,height:7,overflow:"hidden" }}><div style={{ width:`${prog.total?(prog.done/prog.total)*100:0}%`,height:"100%",background:sub.color,borderRadius:4,transition:"width 0.5s" }} /></div>
                  <div style={{ display:"flex",gap:5,marginTop:5,flexWrap:"wrap" }}>
                    {sub.topics.map((t,ti)=>{ const tp=getTopicProgress(sub.id,t.id); const tColor=getTopicColor(ti); return <div key={t.id} style={{ background:"#0d1117",borderRadius:6,padding:"4px 8px",textAlign:"center" }}><div style={{ fontSize:10,color:tColor,fontWeight:700 }}>{t.label}</div><div style={{ fontSize:12,fontWeight:800,color:tColor,marginTop:1 }}>{tp.total?Math.round((tp.done/tp.total)*100):0}%</div></div>; })}
                  </div>
                </div>
              ); })}
            </div>
            <div style={{ background:"#161b22",border:"1px solid #21262d",borderRadius:16,padding:20,gridColumn:"span 2" }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:14 }}>All-Time Study Distribution</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={subjects.map(s=>({name:s.short,value:getAllTimeMins(s.id),color:s.color})).filter(s=>s.value>0)} cx="50%" cy="50%" outerRadius={75} dataKey="value">{subjects.map((s,i)=><Cell key={i} fill={s.color} />)}</Pie><Tooltip contentStyle={{ background:"#21262d",border:"none",borderRadius:8,color:"#e6edf3",fontFamily:"'Cambria','Georgia',serif" }} formatter={v=>[`${v} mins`]} /></PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex",flexDirection:"column",justifyContent:"center",gap:9 }}>
                  {subjects.map(sub=><div key={sub.id} style={{ display:"flex",alignItems:"center",gap:9 }}><div style={{ width:11,height:11,borderRadius:3,background:sub.color,flexShrink:0 }} /><span style={{ fontSize:12,color:"#e6edf3",flex:1 }}>{sub.short}</span><span style={{ fontSize:13,fontWeight:700,color:sub.color }}>{getAllTimeMins(sub.id)}m</span></div>)}
                  <div style={{ marginTop:8,paddingTop:8,borderTop:"1px solid #21262d",display:"flex",justifyContent:"space-between" }}>
                    <span style={{ fontSize:12,color:"#484f58" }}>Total all-time</span>
                    <span style={{ fontSize:14,fontWeight:800,color:"#f97316" }}>{Math.round(allTimeMins/60)}h {allTimeMins%60}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
