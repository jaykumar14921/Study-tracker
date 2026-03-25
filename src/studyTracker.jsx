import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qstuzhetbvtfvurepsaq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdHV6aGV0YnZ0ZnZ1cmVwc2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjY1NTIsImV4cCI6MjA4OTg0MjU1Mn0.3neppPLJ9c6_49hWmu1BErmi1ZVCF6xN8Urdne5zXzE";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const RENDER_URL = "https://study-tracker-mt4a.onrender.com";

const C = {
  prelims: "#c084fc",
  mains:   "#38bdf8",
  ga:      "#22d3ee",
  speed:   "#fbbf24",
  pink:    "#f472b6",
  bg:      "#0d1117",
  card:    "#161b22",
  card2:   "#1c2333",
  border:  "#21262d",
  text:    "#e6edf3",
  muted:   "#8b949e",
  dim:     "#30363d",
  green:   "#34d399",
  orange:  "#f97316",
  yellow:  "#fbbf24",
};

// New weights: Quants P=10% M=10%, Reasoning P=10% M=10%, English P=10% M=10%, GA=20%, Speed=20%
// const WEIGHT = {
//   quants_prelims:10, quants_mains:10,
//   reasoning_prelims:10, reasoning_mains:10,
//   english_prelims:10, english_mains:10,
//   ga_done:20,
//   speed_done:20,
// };

const SUBJECTS = [
  { id:"quants",    label:"Quantitative Aptitude", short:"Quants",    icon:"📐", color:"#f97316", isGA:false, isSpeed:false },
  { id:"reasoning", label:"Logical Reasoning",      short:"Reasoning", icon:"🧩", color:"#c084fc", isGA:false, isSpeed:false },
  { id:"english",   label:"English Language",       short:"English",   icon:"📝", color:"#f472b6", isGA:false, isSpeed:false },
  { id:"ga",        label:"General Awareness",      short:"GA",        icon:"🌐", color:C.ga,      isGA:true,  isSpeed:false },
  { id:"speed",     label:"Speed Test",              short:"Speed",     icon:"⚡", color:C.speed,   isGA:false, isSpeed:true  },
];

const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function toStr(d=new Date()){ return d.toISOString().slice(0,10); }
function todayStr(){ return toStr(); }
function weekStart(d=new Date()){
  const x=new Date(d); const day=x.getDay();
  x.setDate(x.getDate()-(day===0?6:day-1)); return toStr(x);
}
function weekDates(ws){ return Array.from({length:7},(_,i)=>{ const d=new Date(ws+"T12:00:00"); d.setDate(d.getDate()+i); return toStr(d); }); }
function monthKey(d=new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function monthDays(mk){
  const [y,m]=mk.split("-").map(Number);
  return Array.from({length:new Date(y,m,0).getDate()},(_,i)=>toStr(new Date(y,m-1,i+1)));
}
function fmtDate(iso){ if(!iso)return""; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }
function daysLeft(iso){ return Math.ceil((new Date(iso)-new Date(todayStr()))/86400000); }
function autoRemark(score){
  const s=parseFloat(score);
  if(isNaN(s))return"";
  if(s>=90)return"Excellent";
  if(s>=80)return"Good";
  if(s>=70)return"Average";
  if(s>=60)return"Need Practice";
  return"Below Average";
}
function remarkColor(r){
  if(r==="Excellent")return"#34d399";
  if(r==="Good")return"#60a5fa";
  if(r==="Average")return"#fbbf24";
  if(r==="Need Practice")return"#f97316";
  return"#f87171";
}
function streakColor(hasPrelims,hasMains){
  if(hasPrelims&&hasMains) return"#38bdf8";
  if(hasPrelims) return"#f472b6";
  if(hasMains)   return"#c084fc";
  return null;
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function Donut({value,total,color,size=80,label,sub}){
  const pct=total>0?Math.round((value/total)*100):0;
  const r=14; const circ=2*Math.PI*r;
  const dash=(pct/100)*circ;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{position:"relative",width:size,height:size}}>
        <svg viewBox="0 0 36 36" width={size} height={size} style={{transform:"rotate(-90deg)"}}>
          <circle cx="18" cy="18" r={r} fill="none" stroke={C.dim} strokeWidth="3.5"/>
          <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:size>70?14:11,fontWeight:800,color,lineHeight:1}}>{pct}%</div>
          {size>70&&<div style={{fontSize:9,color:C.muted,marginTop:1}}>{value}/{total}</div>}
        </div>
      </div>
      {label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textAlign:"center"}}>{label}</div>}
      {sub&&<div style={{fontSize:10,color:C.dim,textAlign:"center"}}>{sub}</div>}
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login(){
  const [loading,setLoading]=useState(false);
  const go=async()=>{ setLoading(true); await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:RENDER_URL}}); };
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Cambria,Georgia,serif"}}>
      <div style={{background:"linear-gradient(145deg,#0f172a,#161b22)",border:`1px solid ${C.border}`,borderRadius:24,padding:"52px 44px",width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:12}}>🏦</div>
        <h1 style={{fontSize:28,fontWeight:800,color:"#fff",margin:"0 0 6px"}}>SBI PO Study Codex</h1>
        <p style={{fontSize:14,color:C.muted,margin:"0 0 36px"}}>Your personal exam preparation tracker.</p>
        <button onClick={go} disabled={loading} style={{width:"100%",padding:"14px 20px",background:loading?"#1e293b":"#fff",border:"none",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:15,fontWeight:700,color:"#1a1a1a",fontFamily:"Cambria,Georgia,serif"}}>
          {loading?"Connecting...":<><svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Continue with Google</>}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const today=todayStr();
  const ws=weekStart(); const wd=weekDates(ws);

  const [session,setSession]=useState(null);
  const [authLoad,setAuthLoad]=useState(true);
  const [syncing,setSyncing]=useState(false);

  const [checks,setChecksRaw]=useState({});
  const [exams,setExamsRaw]=useState([]);
  const [mocks,setMocksRaw]=useState([]);
  const [view,setView]=useState("daily");
  const [selMonth,setSelMonth]=useState(monthKey());

  // auth
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); setAuthLoad(false); });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>{ setSession(s); setAuthLoad(false); });
    return ()=>subscription.unsubscribe();
  },[]);

  const load=useCallback(async uid=>{
    setSyncing(true);
    const {data,error}=await supabase.from("study_data").select("*").eq("user_id",uid).single();
    if(data&&!error){
      if(data.checks) setChecksRaw(data.checks);
      if(data.exams)  setExamsRaw(data.exams);
      if(data.mocks)  setMocksRaw(data.mocks);
    }
    setSyncing(false);
  },[]);
  useEffect(()=>{ if(session?.user?.id) load(session.user.id); },[session,load]);

  const saveRef=useRef({checks,exams,mocks});
  useEffect(()=>{ saveRef.current={checks,exams,mocks}; },[checks,exams,mocks]);

  const save=useCallback(async(overrides={})=>{
    if(!session?.user?.id) return;
    setSyncing(true);
    const payload={...saveRef.current,...overrides};
    await supabase.from("study_data").upsert({user_id:session.user.id,...payload,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    setSyncing(false);
  },[session]);

  const setChecks=v=>{ setChecksRaw(v); save({checks:v}); };
  const setExams =v=>{ setExamsRaw(v);  save({exams:v});  };
  const setMocks =v=>{ setMocksRaw(v);  save({mocks:v});  };

  // check helpers
  const getCheck=(date,sid,type)=>checks[date]?.[sid]?.[type]||false;
  const toggleCheck=(sid,type)=>{
    const next=JSON.parse(JSON.stringify(checks));
    if(!next[today]) next[today]={};
    if(!next[today][sid]) next[today][sid]={};
    next[today][sid][type]=!next[today][sid][type];
    setChecks(next);
  };

  // daily progress
  const todayPct=()=>{
    let total=0;
    SUBJECTS.forEach(s=>{
      if(s.isGA)    { if(getCheck(today,s.id,"done")) total+=20; }
      else if(s.isSpeed){ if(getCheck(today,s.id,"done")) total+=20; }
      else{
        if(getCheck(today,s.id,"prelims")) total+=10;
        if(getCheck(today,s.id,"mains"))   total+=10;
      }
    });
    return Math.round(total);
  };
  const subjectPct=(sid)=>{
    const s=SUBJECTS.find(x=>x.id===sid);
    if(!s) return {prelims:0,mains:0,done:0};
    if(s.isGA)     return {done:getCheck(today,sid,"done")?20:0};
    if(s.isSpeed)  return {done:getCheck(today,sid,"done")?20:0};
    return {
      prelims: getCheck(today,sid,"prelims")?10:0,
      mains:   getCheck(today,sid,"mains")?10:0,
    };
  };

  // streak helpers
  const currentStreak=useCallback(()=>{
    let streak=0; const d=new Date(today);
    while(true){
      const ds=toStr(d);
      const has=SUBJECTS.some(s=>checks[ds]?.[s.id]?.prelims||checks[ds]?.[s.id]?.mains||checks[ds]?.[s.id]?.done);
      if(has){streak++;d.setDate(d.getDate()-1);}else break;
    }
    return streak;
  },[checks,today]);

  const bestStreak=useCallback(()=>{
    let best=0,cur=0;
    Object.keys(checks).sort().forEach(d=>{
      const has=SUBJECTS.some(s=>checks[d]?.[s.id]?.prelims||checks[d]?.[s.id]?.mains||checks[d]?.[s.id]?.done);
      if(has){cur++;if(cur>best)best=cur;}else cur=0;
    });
    return best;
  },[checks]);

  const totalStudyDays=useCallback(()=>
    Object.keys(checks).filter(d=>SUBJECTS.some(s=>checks[d]?.[s.id]?.prelims||checks[d]?.[s.id]?.mains||checks[d]?.[s.id]?.done)).length
  ,[checks]);

  const countDays=(sid,type)=>Object.keys(checks).filter(d=>type==="done"?checks[d]?.[sid]?.done:checks[d]?.[sid]?.[type]).length;

  // exam helpers
  const upcomingExams=[...exams].filter(e=>daysLeft(e.date)>=0).sort((a,b)=>new Date(a.date)-new Date(b.date));

  // mock helpers
  const prelims_mocks=mocks.filter(m=>m.mtype==="prelims");
  const mains_mocks  =mocks.filter(m=>m.mtype==="mains");
  const sect_mocks   =mocks.filter(m=>m.mtype==="sectional");
  const speed_mocks  =mocks.filter(m=>m.mtype==="speed");
  const avgScore=arr=>{ const v=arr.filter(m=>m.score); if(!v.length)return 0; return Math.round(v.reduce((s,m)=>s+parseFloat(m.score),0)/v.length); };

  const inp={background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"Cambria,Georgia,serif",width:"100%"};

  if(authLoad) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"Cambria,Georgia,serif"}}>Loading...</div>;
  if(!session) return <Login/>;
  const user=session.user;

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Cambria,Georgia,serif"}}>
      {/* HEADER */}
      <div style={{background:"linear-gradient(90deg,#0d1117,#161b22)",borderBottom:`1px solid ${C.border}`,padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#f97316,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏦</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#fff"}}>SBI PO Study Codex</div>
            <div style={{fontSize:11,color:C.muted}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {["daily","weekly","monthly","mocks","exams","stats"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 13px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,textTransform:"capitalize",background:view===v?"linear-gradient(135deg,#f97316,#ec4899)":"#161b22",color:view===v?"#fff":C.muted,fontFamily:"Cambria,Georgia,serif"}}>{v}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {syncing&&<span style={{fontSize:11,color:"#f97316"}}>● Saving...</span>}
          {user.user_metadata?.avatar_url&&<img src={user.user_metadata.avatar_url} alt="" style={{width:28,height:28,borderRadius:"50%",border:"2px solid #f97316"}}/>}
          <span style={{fontSize:12,color:C.muted}}>{user.user_metadata?.full_name||user.email}</span>
          <button onClick={()=>supabase.auth.signOut()} style={{background:C.card,border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,fontFamily:"Cambria,Georgia,serif"}}>Sign out</button>
        </div>
      </div>

      {/* TOP STATS BAR */}
      <div style={{padding:"16px 24px 0",maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[
            {label:"Today's Progress",value:`${todayPct()}%`,sub:"of 100%",color:"#6366f1"},
            {label:"Total Study Days",value:totalStudyDays(),sub:"all time",color:"#f97316"},
            {label:"Current Streak",value:`${currentStreak()}d`,sub:"days in a row",color:"#f59e0b"},
            {label:"Best Streak",value:`${bestStreak()}d`,sub:"all time",color:"#f472b6"},
          ].map((s,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.color}}/>
              <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:2}}>{s.label}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"0 24px 32px",maxWidth:1200,margin:"0 auto"}}>

        {/* ── DAILY ── */}
        {view==="daily"&&(
          <DailyView
            today={today} checks={checks} toggleCheck={toggleCheck}
            getCheck={getCheck} subjectPct={subjectPct} todayPct={todayPct}
            upcomingExams={upcomingExams} daysLeft={daysLeft} countDays={countDays}
            currentStreak={currentStreak} inp={inp}
          />
        )}

        {/* ── WEEKLY ── */}
        {view==="weekly"&&<WeeklyView wd={wd} today={today} checks={checks}/>}

        {/* ── MONTHLY ── */}
        {view==="monthly"&&<MonthlyView selMonth={selMonth} setSelMonth={setSelMonth} today={today} checks={checks}/>}

        {/* ── MOCKS ── */}
        {view==="mocks"&&<MocksView mocks={mocks} setMocks={setMocks} today={today} inp={inp} prelims_mocks={prelims_mocks} mains_mocks={mains_mocks} sect_mocks={sect_mocks} speed_mocks={speed_mocks} avgScore={avgScore}/>}

        {/* ── EXAMS ── */}
        {view==="exams"&&<ExamsView exams={exams} setExams={setExams} upcomingExams={upcomingExams} daysLeft={daysLeft} fmtDate={fmtDate} inp={inp} today={today}/>}

        {/* ── STATS ── */}
        {view==="stats"&&<StatsView checks={checks} mocks={mocks} today={today} totalStudyDays={totalStudyDays} currentStreak={currentStreak} bestStreak={bestStreak} countDays={countDays} wd={wd} avgScore={avgScore} prelims_mocks={prelims_mocks} mains_mocks={mains_mocks} sect_mocks={sect_mocks}/>}

      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} input:focus,select:focus,textarea:focus{outline:none;border-color:#f97316 !important;}`}</style>
    </div>
  );
}

// ── DAILY VIEW ────────────────────────────────────────────────────────────────
function DailyView({today,checks,toggleCheck,getCheck,subjectPct,todayPct,upcomingExams,daysLeft,countDays,currentStreak,inp}){
  const pct=todayPct();
  const r=54; const circ=2*Math.PI*r;
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:18}}>
      <div>
        {SUBJECTS.map(sub=>{
          const sp=subjectPct(sub.id);
          const pDone  = !sub.isGA&&!sub.isSpeed&&getCheck(today,sub.id,"prelims");
          const mDone  = !sub.isGA&&!sub.isSpeed&&getCheck(today,sub.id,"mains");
          const doneDone = (sub.isGA||sub.isSpeed)&&getCheck(today,sub.id,"done");
          const isDoneType = sub.isGA||sub.isSpeed;
          const doneColor  = sub.isSpeed?C.speed:C.ga;
          const donePct    = sub.isSpeed?20:20;
          return(
            <div key={sub.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:12,padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{width:40,height:40,borderRadius:12,background:sub.color+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{sub.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:C.text}}>{sub.label}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                    {isDoneType
                      ? `${countDays(sub.id,"done")} days done all-time`
                      : `Prelims: ${countDays(sub.id,"prelims")}d · Mains: ${countDays(sub.id,"mains")}d`}
                  </div>
                </div>
                {isDoneType?(
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:800,color:sp.done>0?doneColor:C.dim}}>{sp.done}%</div>
                    <div style={{fontSize:10,color:C.muted}}>of {donePct}%</div>
                  </div>
                ):(
                  <div style={{display:"flex",gap:16,textAlign:"center"}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:800,color:pDone?C.prelims:C.dim}}>{sp.prelims}%</div>
                      <div style={{fontSize:10,color:C.muted}}>Prelims</div>
                    </div>
                    <div>
                      <div style={{fontSize:18,fontWeight:800,color:mDone?C.mains:C.dim}}>{sp.mains}%</div>
                      <div style={{fontSize:10,color:C.muted}}>Mains</div>
                    </div>
                  </div>
                )}
              </div>
              {isDoneType?(
                <Checkbox checked={doneDone} onChange={()=>toggleCheck(sub.id,"done")} label="Done for today" color={doneColor}/>
              ):(
                <div style={{display:"flex",gap:10}}>
                  <Checkbox checked={pDone} onChange={()=>toggleCheck(sub.id,"prelims")} label="Prelims (10%)" color={C.prelims}/>
                  <Checkbox checked={mDone} onChange={()=>toggleCheck(sub.id,"mains")}   label="Mains (10%)"   color={C.mains}/>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar */}
      <div>
        {/* Today's Progress donut */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:14,color:"#fff",marginBottom:16}}>📊 Today's Progress</div>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <div style={{position:"relative",width:120,height:120}}>
              <svg viewBox="0 0 140 140" width="120" height="120" style={{transform:"rotate(-90deg)"}}>
                <circle cx="70" cy="70" r={r} fill="none" stroke={C.dim} strokeWidth="8"/>
                <circle cx="70" cy="70" r={r} fill="none" stroke="#6366f1" strokeWidth="8"
                  strokeDasharray={`${(pct/100)*circ} ${circ-(pct/100)*circ}`} strokeLinecap="round"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:24,fontWeight:800,color:"#6366f1"}}>{pct}%</div>
                <div style={{fontSize:10,color:C.muted}}>complete</div>
              </div>
            </div>
          </div>
          {SUBJECTS.map(sub=>{
            const sp=subjectPct(sub.id);
            const isDoneType=sub.isGA||sub.isSpeed;
            const doneColor=sub.isSpeed?C.speed:C.ga;
            return(
              <div key={sub.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:14}}>{sub.icon}</span>
                <span style={{fontSize:12,color:C.text,flex:1}}>{sub.short}</span>
                {isDoneType?(
                  <span style={{fontSize:11,fontWeight:700,color:sp.done>0?doneColor:C.dim}}>{sp.done}%</span>
                ):(
                  <div style={{display:"flex",gap:6}}>
                    <span style={{fontSize:10,padding:"2px 6px",borderRadius:8,background:getCheck(today,sub.id,"prelims")?C.prelims+"30":C.border,color:getCheck(today,sub.id,"prelims")?C.prelims:C.dim,fontWeight:700}}>P {sp.prelims}%</span>
                    <span style={{fontSize:10,padding:"2px 6px",borderRadius:8,background:getCheck(today,sub.id,"mains")?C.mains+"30":C.border,color:getCheck(today,sub.id,"mains")?C.mains:C.dim,fontWeight:700}}>M {sp.mains}%</span>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{borderTop:`1px solid ${C.border}`,marginTop:12,paddingTop:10,display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
            <span>Current streak</span>
            <span style={{fontWeight:800,color:"#f59e0b"}}>🔥 {currentStreak()} days</span>
          </div>
        </div>

        {/* Upcoming exams read-only */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,color:"#fff",marginBottom:12}}>📅 Upcoming Exams</div>
          {upcomingExams.length===0&&<div style={{textAlign:"center",color:C.dim,fontSize:12,padding:"12px 0"}}>No upcoming exams · add in Exams tab</div>}
          {upcomingExams.slice(0,4).map(exam=>{
            // const sub=SUBJECTS.find(s=>s.id===exam.subject);
            const dl=daysLeft(exam.date);
            const tColor=exam.type==="prelims"?C.prelims:C.mains;
            return(
              <div key={exam.id} style={{background:C.bg,borderRadius:10,padding:"10px 12px",marginBottom:8,border:`1px solid ${dl<=7?"#f97316":C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:C.text}}>{exam.title}</div>
                    <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:10,padding:"2px 7px",borderRadius:8,background:tColor+"20",color:tColor,fontWeight:700,textTransform:"capitalize"}}>{exam.type}</span>
                      <span style={{fontSize:10,color:C.muted}}>📅 {fmtDate(exam.date)}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:18,fontWeight:800,color:dl<=7?"#f97316":dl<=30?"#f59e0b":"#34d399"}}>{dl}d</div>
                    <div style={{fontSize:9,color:C.muted}}>left</div>
                  </div>
                </div>
              </div>
            );
          })}
          {upcomingExams.length>4&&<div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:4}}>+{upcomingExams.length-4} more in Exams tab</div>}
        </div>
      </div>
    </div>
  );
}

// ── WEEKLY VIEW ───────────────────────────────────────────────────────────────
function WeeklyView({wd,today,checks}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
      <div style={{fontWeight:700,fontSize:15,color:"#fff",marginBottom:18}}>Weekly Streak</div>
      <div style={{display:"grid",gridTemplateColumns:"160px repeat(7,1fr)",gap:6,marginBottom:10}}>
        <div style={{fontSize:11,color:C.muted}}>Subject</div>
        {wd.map((date,i)=>(
          <div key={date} style={{textAlign:"center",fontSize:11,fontWeight:700,color:date===today?"#f97316":C.muted}}>
            <div>{DAYS[i]}</div>
            <div style={{fontWeight:400,fontSize:10}}>{new Date(date+"T12:00:00").getDate()}</div>
          </div>
        ))}
      </div>
      {SUBJECTS.map(sub=>(
        <div key={sub.id} style={{display:"grid",gridTemplateColumns:"160px repeat(7,1fr)",gap:6,alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:600,color:sub.color,display:"flex",alignItems:"center",gap:6}}><span>{sub.icon}</span><span>{sub.short}</span></div>
          {wd.map(date=>{
            const isDoneType=sub.isGA||sub.isSpeed;
            const p  = !isDoneType&&!!(checks[date]?.[sub.id]?.prelims);
            const m  = !isDoneType&&!!(checks[date]?.[sub.id]?.mains);
            const done = isDoneType&&!!(checks[date]?.[sub.id]?.done);
            const bg = isDoneType?(done?sub.color:null):streakColor(p,m);
            const isFuture=date>today;
            return(
              <div key={date} style={{display:"flex",justifyContent:"center"}}>
                <div style={{width:34,height:34,borderRadius:8,background:bg||C.dim,border:date===today?`2px solid ${sub.color}`:`1px solid ${C.bg}`,opacity:isFuture?0.3:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:bg?"#0d1117":C.bg}}>
                  {bg?"✓":""}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <Legend/>
    </div>
  );
}

// ── MONTHLY VIEW ──────────────────────────────────────────────────────────────
function MonthlyView({selMonth,setSelMonth,today,checks}){
  const md=monthDays(selMonth);
  const [y,m]=selMonth.split("-").map(Number);

  // Build a 7-row × N-col grid (LeetCode style)
  // Row 0 = Mon, Row 1 = Tue … Row 6 = Sun
  // Each column = one calendar week
  const firstDayJS=new Date(y,m-1,1).getDay(); // 0=Sun,1=Mon…
  const startOffset=firstDayJS===0?6:firstDayJS-1; // offset from Mon

  // Total cells = pad + days in month, rounded up to full weeks
  const totalCells=startOffset+md.length;
  const numCols=Math.ceil(totalCells/7);

  // grid[col][row] = date string or null
  const grid=Array.from({length:numCols},(_,col)=>
    Array.from({length:7},(_,row)=>{
      const idx=col*7+row-startOffset;
      return (idx>=0&&idx<md.length)?md[idx]:null;
    })
  );

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontWeight:700,fontSize:15,color:"#fff"}}>Monthly Streak — LeetCode Style</span>
        <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"7px 12px",fontSize:13,outline:"none",fontFamily:"Cambria,Georgia,serif"}}>
          {Array.from({length:12},(_,i)=>{ const d=new Date(new Date().getFullYear(),i,1); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; return <option key={k} value={k}>{MONTHS[i]} {d.getFullYear()}</option>; })}
        </select>
      </div>

      {SUBJECTS.map(sub=>{
        const studiedDays=md.filter(d=>(sub.isGA||sub.isSpeed)?checks[d]?.[sub.id]?.done:(checks[d]?.[sub.id]?.prelims||checks[d]?.[sub.id]?.mains)).length;
        return(
          <div key={sub.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <span style={{fontSize:18}}>{sub.icon}</span>
              <span style={{fontWeight:700,fontSize:14,color:sub.color}}>{sub.label}</span>
              <span style={{fontSize:11,color:C.muted}}>{studiedDays} days studied this month</span>
            </div>

            {/* LeetCode grid: rows = Mon–Sun, columns = weeks left→right */}
            <div style={{display:"flex",gap:4,overflowX:"auto"}}>
              {/* Day-of-week labels */}
              <div style={{display:"flex",flexDirection:"column",gap:4,marginRight:4,flexShrink:0}}>
                {DAYS.map(d=>(
                  <div key={d} style={{height:28,fontSize:9,color:C.muted,display:"flex",alignItems:"center",width:22,fontWeight:600}}>{d}</div>
                ))}
              </div>

              {/* Week columns */}
              {grid.map((col,ci)=>(
                <div key={ci} style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                  {col.map((date,ri)=>{
                    if(!date) return <div key={ri} style={{width:28,height:28}}/>;
                    const isDoneType=sub.isGA||sub.isSpeed;
                    const p  = !isDoneType&&!!(checks[date]?.[sub.id]?.prelims);
                    const mn = !isDoneType&&!!(checks[date]?.[sub.id]?.mains);
                    const done = isDoneType&&!!(checks[date]?.[sub.id]?.done);
                    const bg = isDoneType?(done?sub.color:null):streakColor(p,mn);
                    const isFuture=date>today;
                    const dayNum=new Date(date+"T12:00:00").getDate();
                    return(
                      <div key={ri} title={`${date}${bg?" ✓":""}`} style={{
                        width:28,height:28,borderRadius:5,
                        background:bg||"#21262d",
                        border:date===today?`2px solid ${sub.color}`:`1px solid #0d1117`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:9,fontWeight:700,
                        color:bg?"#0d1117":C.dim,
                        opacity:isFuture?0.3:1,
                        transition:"background 0.2s",
                      }}>
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Legend/>
    </div>
  );
}

// ── MOCKS VIEW ────────────────────────────────────────────────────────────────
function MocksView({mocks,setMocks,today,inp,prelims_mocks,mains_mocks,sect_mocks,speed_mocks,avgScore}){
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const blank={name:"",mtype:"prelims",subject:"quants",score:"",date:today,remark:""};
  const [form,setForm]=useState(blank);

  const formRef=useRef(form);
  useEffect(()=>{ formRef.current=form; },[form]);

  const updateForm=(k,v)=>{
    setForm(prev=>{
      const next={...prev,[k]:v};
      if(k==="score") next.remark=autoRemark(v);
      if(k==="mtype"){
        // subject enabled only for sectional; all others lock it
        if(v!=="sectional") next.subject="quants";
      }
      return next;
    });
  };

  const submit=()=>{
    if(!form.score||!form.date||!form.name.trim()) return;
    if(editId){
      setMocks(mocks.map(m=>m.id===editId?{...form,id:editId}:m));
      setEditId(null);
    } else {
      setMocks([...mocks,{...form,id:Date.now()}]);
    }
    setForm(blank); setShowForm(false);
  };

  const startEdit=(mock)=>{ setForm({name:mock.name||"",...mock}); setEditId(mock.id); setShowForm(true); };
  const deleteMock=(id)=>setMocks(mocks.filter(m=>m.id!==id));

  const pAvg=avgScore(prelims_mocks);
  const mAvg=avgScore(mains_mocks);
  const sAvg=avgScore(sect_mocks);
  const spAvg=avgScore(speed_mocks);

  const sectColors={"quants":"#f97316","reasoning":"#c084fc","english":"#f472b6","ga":C.ga,"speed":C.speed};
  const sectBySubj=sid=>sect_mocks.filter(m=>m.subject===sid);

  // subject disabled for everything except sectional
  const subjectDisabled=form.mtype!=="sectional";

  // helper to render a mock card (reused across all lists)
  const MockCard=({mock,color,showSubject})=>{
    const sub=SUBJECTS.find(s=>s.id===mock.subject);
    const pct=mock.score?parseFloat(mock.score):0;
    const scoreColor=pct>=80?"#34d399":pct>=70?"#60a5fa":pct>=60?"#fbbf24":"#f97316";
    return(
      <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            {mock.name&&<div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{mock.name}</div>}
            <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
              {sub&&showSubject&&<span style={{fontSize:10,color:sub.color,fontWeight:700}}>{sub.icon} {sub.short}</span>}
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:8,background:color+"20",color,fontWeight:700,textTransform:"capitalize"}}>{mock.mtype}</span>
              <span style={{fontSize:10,color:C.muted}}>📅 {fmtDate(mock.date)}</span>
            </div>
            {mock.remark&&<div style={{fontSize:11,fontWeight:700,color:remarkColor(mock.remark)}}>{mock.remark}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0,marginLeft:10}}>
            <div style={{fontSize:20,fontWeight:800,color:scoreColor}}>{pct}%</div>
            <div style={{display:"flex",gap:5}}>
              <button onClick={()=>startEdit(mock)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:11,borderRadius:6,padding:"2px 8px",fontFamily:"Cambria,Georgia,serif"}}>Edit</button>
              <button onClick={()=>deleteMock(mock.id)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:13,padding:0}}>✕</button>
            </div>
          </div>
        </div>
        <div style={{background:C.dim,borderRadius:3,height:4,marginTop:8,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",background:scoreColor,borderRadius:3}}/>
        </div>
      </div>
    );
  };

  return(
    <div>
      {/* ── Add / Edit form ── */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showForm?18:0}}>
          <span style={{fontWeight:700,fontSize:15,color:"#fff"}}>Mock Tests</span>
          <button onClick={()=>{ setShowForm(s=>!s); setEditId(null); setForm(blank); }}
            style={{background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Cambria,Georgia,serif"}}>
            {showForm?"Cancel":"+ Add Mock"}
          </button>
        </div>
        {showForm&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div>
              <Label>Mock Name</Label>
              <input placeholder="e.g. SBI PO Part 1" value={form.name} onChange={e=>updateForm("name",e.target.value)} style={inp}/>
            </div>
            <div>
              <Label>Type</Label>
              <select value={form.mtype} onChange={e=>updateForm("mtype",e.target.value)} style={inp}>
                <option value="prelims">Prelims</option>
                <option value="mains">Mains</option>
                <option value="sectional">Sectional</option>
                <option value="speed">Speed Test</option>
              </select>
            </div>
            <div>
              <Label>Subject <span style={{color:C.dim,fontWeight:400,fontSize:10}}>{subjectDisabled?"(Sectional only)":""}</span></Label>
              <select value={form.subject} onChange={e=>updateForm("subject",e.target.value)}
                disabled={subjectDisabled}
                style={{...inp,opacity:subjectDisabled?0.38:1,cursor:subjectDisabled?"not-allowed":"pointer"}}>
                {SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Score (out of 100)</Label>
              <input type="number" min="0" max="100" placeholder="e.g. 78" value={form.score} onChange={e=>updateForm("score",e.target.value)} style={inp}/>
            </div>
            <div>
              <Label>Date</Label>
              <input type="date" value={form.date} onChange={e=>updateForm("date",e.target.value)} style={inp}/>
            </div>
            <div>
              <Label>Remark (auto)</Label>
              <div style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,fontSize:13,color:form.remark?remarkColor(form.remark):C.muted,fontWeight:600,minHeight:38,display:"flex",alignItems:"center"}}>
                {form.remark||<span style={{fontWeight:400,fontSize:12}}>Enter score to auto-fill</span>}
              </div>
            </div>
            <div style={{gridColumn:"span 3",marginTop:4}}>
              <button onClick={submit}
                style={{width:"100%",background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"Cambria,Georgia,serif"}}>
                {editId?"Update Mock":"Save Mock"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Charts: 2×2 grid (Prelims, Mains, Sectional, Speed) ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>

        {/* Prelims */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,color:C.prelims,marginBottom:16}}>💜 Prelims Mocks</div>
          <div style={{display:"flex",justifyContent:"center",gap:24}}>
            <Donut value={pAvg} total={100} color={C.prelims} size={90} label="Avg Score" sub={`${pAvg}/100`}/>
            <Donut value={prelims_mocks.length} total={Math.max(prelims_mocks.length,10)} color="#c084fc" size={90} label="Total Mocks" sub={`${prelims_mocks.length} tests`}/>
          </div>
        </div>

        {/* Mains */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,color:C.mains,marginBottom:16}}>💙 Mains Mocks</div>
          <div style={{display:"flex",justifyContent:"center",gap:24}}>
            <Donut value={mAvg} total={100} color={C.mains} size={90} label="Avg Score" sub={`${mAvg}/100`}/>
            <Donut value={mains_mocks.length} total={Math.max(mains_mocks.length,10)} color="#38bdf8" size={90} label="Total Mocks" sub={`${mains_mocks.length} tests`}/>
          </div>
        </div>

        {/* Sectional */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,color:"#fbbf24",marginBottom:14}}>📊 Sectional Mocks</div>
          <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:14}}>
            <Donut value={sAvg} total={100} color="#fbbf24" size={86} label="Avg Score" sub={`${sAvg}/100`}/>
            <Donut value={sect_mocks.length} total={Math.max(sect_mocks.length,10)} color="#f59e0b" size={86} label="Total Mocks" sub={`${sect_mocks.length} tests`}/>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,marginBottom:12}}/>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.4px"}}>By Subject</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {SUBJECTS.map(s=>{
              const sm=sectBySubj(s.id);
              const avg=avgScore(sm);
              const col=sectColors[s.id]||s.color;
              return(
                <div key={s.id} style={{background:C.bg,borderRadius:10,padding:"10px 8px",border:`1px solid ${C.border}`,textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,color:col,marginBottom:8}}>{s.icon} {s.short}</div>
                  <div style={{display:"flex",justifyContent:"center",gap:8}}>
                    <Donut value={avg} total={100} color={col} size={52} label="Avg" sub={`${avg}%`}/>
                    <Donut value={sm.length} total={Math.max(sm.length,5)} color={col} size={52} label="Tests" sub={`${sm.length}t`}/>
                  </div>
                  {sm.length===0&&<div style={{fontSize:10,color:C.dim,marginTop:4}}>No mocks yet</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Speed Test */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
          <div style={{fontWeight:700,fontSize:14,color:C.speed,marginBottom:16}}>⚡ Speed Test Mocks</div>
          <div style={{display:"flex",justifyContent:"center",gap:24}}>
            <Donut value={spAvg} total={100} color={C.speed} size={90} label="Avg Score" sub={`${spAvg}/100`}/>
            <Donut value={speed_mocks.length} total={Math.max(speed_mocks.length,10)} color="#f59e0b" size={90} label="Total Mocks" sub={`${speed_mocks.length} tests`}/>
          </div>
        </div>
      </div>

      {/* ── Mock lists ── */}
      {[
        {label:"💜 Prelims Mock List",    arr:prelims_mocks, color:C.prelims,  showSub:false},
        {label:"💙 Mains Mock List",      arr:mains_mocks,   color:C.mains,    showSub:false},
        {label:"📋 Sectional Mock List",  arr:sect_mocks,    color:"#fbbf24",  showSub:true },
        {label:"⚡ Speed Test Mock List", arr:speed_mocks,   color:C.speed,    showSub:false},
      ].map(({label,arr,color,showSub})=>(
        <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:14,color,marginBottom:12}}>
            {label} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>({arr.length} tests)</span>
          </div>
          {arr.length===0&&<div style={{textAlign:"center",color:C.dim,fontSize:12,padding:"12px 0"}}>No mocks logged yet</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:10}}>
            {[...arr].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(mock=>(
              <MockCard key={mock.id} mock={mock} color={color} showSubject={showSub}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── EXAMS VIEW ────────────────────────────────────────────────────────────────
function ExamsView({exams,setExams,upcomingExams,daysLeft,fmtDate,inp,today}){
  const blank={title:"",subject:"quants",type:"prelims",date:"",targetScore:""};
  const [form,setForm]=useState(blank);
  const [editId,setEditId]=useState(null);
  const [showForm,setShowForm]=useState(false);

  const submit=()=>{
    if(!form.title||!form.date) return;
    if(editId){
      setExams(exams.map(e=>e.id===editId?{...form,id:editId}:e));
      setEditId(null);
    } else {
      setExams([...exams,{...form,id:Date.now()}]);
    }
    setForm(blank); setShowForm(false);
  };
  const startEdit=(exam)=>{ setForm({...exam}); setEditId(exam.id); setShowForm(true); };
  const deleteExam=(id)=>setExams(exams.filter(e=>e.id!==id));
  const allSorted=[...exams].sort((a,b)=>new Date(a.date)-new Date(b.date));

  return(
    <div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showForm?16:0}}>
          <span style={{fontWeight:700,fontSize:15,color:"#fff"}}>📅 Exam Schedule</span>
          <button onClick={()=>{ setShowForm(!showForm); setEditId(null); setForm(blank); }} style={{background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Cambria,Georgia,serif"}}>
            {showForm?"Cancel":"+ Add Exam"}
          </button>
        </div>
        {showForm&&(
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:10,alignItems:"end"}}>
            <div><Label>Exam Name</Label><input placeholder="e.g. SBI PO Prelims 2025" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp}/></div>
            <div><Label>Subject</Label>
              <select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} style={inp}>
                {SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.short}</option>)}
              </select>
            </div>
            <div><Label>Type</Label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inp}>
                <option value="prelims">Prelims</option><option value="mains">Mains</option>
              </select>
            </div>
            <div><Label>Date</Label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inp}/></div>
            <button onClick={submit} style={{background:"linear-gradient(135deg,#f97316,#ec4899)",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"Cambria,Georgia,serif",marginTop:18}}>
              {editId?"Update":"Save"}
            </button>
          </div>
        )}
      </div>

      {/* Sorted exam list */}
      {allSorted.length===0&&<div style={{textAlign:"center",color:C.dim,fontSize:14,padding:"40px 0"}}>No exams added yet.</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {allSorted.map(exam=>{
          const sub=SUBJECTS.find(s=>s.id===exam.subject);
          const dl=daysLeft(exam.date);
          const isPast=dl<0;
          const tColor=exam.type==="prelims"?C.prelims:C.mains;
          return(
            <div key={exam.id} style={{background:C.card,borderRadius:14,padding:18,border:`1px solid ${dl<=7&&!isPast?"#f97316":C.border}`,opacity:isPast?0.55:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:6}}>{exam.title}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:11,color:sub?.color,fontWeight:700}}>{sub?.icon} {sub?.label}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:tColor+"20",color:tColor,fontWeight:700,textTransform:"capitalize"}}>{exam.type}</span>
                  </div>
                  <div style={{fontSize:11,color:C.muted}}>📅 {fmtDate(exam.date)}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                  <div style={{fontSize:22,fontWeight:800,color:isPast?"#484f58":dl<=7?"#f97316":dl<=30?"#f59e0b":"#34d399"}}>{isPast?"Past":`${dl}d`}</div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>startEdit(exam)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:11,borderRadius:6,padding:"3px 8px",fontFamily:"Cambria,Georgia,serif"}}>Edit</button>
                    <button onClick={()=>deleteExam(exam.id)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:13}}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── STATS VIEW ────────────────────────────────────────────────────────────────
function StatsView({checks,mocks,today,totalStudyDays,currentStreak,bestStreak,countDays,wd,avgScore,prelims_mocks,mains_mocks,sect_mocks}){
  const allDates=Object.keys(checks).filter(d=>d<=today);
  const totalPossible=allDates.length*100;
  const totalEarned=allDates.reduce((sum,d)=>{
    let pts=0;
    SUBJECTS.forEach(s=>{
      if(s.isGA)    { if(checks[d]?.[s.id]?.done) pts+=20; }
      else if(s.isSpeed){ if(checks[d]?.[s.id]?.done) pts+=20; }
      else{ if(checks[d]?.[s.id]?.prelims) pts+=10; if(checks[d]?.[s.id]?.mains) pts+=10; }
    });
    return sum+pts;
  },0);
  const overallPct=totalPossible>0?Math.round((totalEarned/totalPossible)*100):0;

  return(
    <div>
      {/* Overall donut */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,marginBottom:18}}>
        <div style={{fontWeight:700,fontSize:15,color:"#fff",marginBottom:20}}>Overall Progress</div>
        <div style={{display:"flex",gap:32,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{position:"relative",width:160,height:160}}>
            <svg viewBox="0 0 140 140" width="160" height="160" style={{transform:"rotate(-90deg)"}}>
              <circle cx="70" cy="70" r="54" fill="none" stroke={C.dim} strokeWidth="10"/>
              <circle cx="70" cy="70" r="54" fill="none" stroke="#6366f1" strokeWidth="10"
                strokeDasharray={`${(overallPct/100)*(2*Math.PI*54)} ${(2*Math.PI*54)}`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:32,fontWeight:800,color:"#6366f1"}}>{overallPct}%</div>
              <div style={{fontSize:11,color:C.muted}}>overall</div>
            </div>
          </div>
          <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
            {[
              {label:"Study Days",   value:totalStudyDays(),                                          color:"#f97316"},
              {label:"Current Streak",value:`${currentStreak()}d`,                                    color:"#f59e0b"},
              {label:"Best Streak",  value:`${bestStreak()}d`,                                        color:"#f472b6"},
              {label:"Total Mocks",  value:mocks.length,                                              color:"#a78bfa"},
              {label:"Prelims Avg",  value:avgScore(prelims_mocks)?`${avgScore(prelims_mocks)}%`:"—", color:C.prelims},
              {label:"Mains Avg",    value:avgScore(mains_mocks)?`${avgScore(mains_mocks)}%`:"—",     color:C.mains},
            ].map((s,i)=>(
              <div key={i} style={{background:C.bg,borderRadius:12,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per subject stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:18}}>
        {SUBJECTS.map(sub=>{
          const isDoneType=sub.isGA||sub.isSpeed;
          const doneColor=sub.isSpeed?C.speed:C.ga;
          const pDays  = isDoneType?0:countDays(sub.id,"prelims");
          const mDays  = isDoneType?0:countDays(sub.id,"mains");
          const doneDays = isDoneType?countDays(sub.id,"done"):0;
          const pM  = mocks.filter(m=>m.subject===sub.id&&m.mtype==="prelims");
          const mM  = mocks.filter(m=>m.subject===sub.id&&m.mtype==="mains");
          const allM= mocks.filter(m=>m.subject===sub.id);
          const pAvg=avgScore(pM); const mAvg=avgScore(mM); const allAvg=avgScore(allM);

          return(
            <div key={sub.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:18}}>{sub.icon}</span>
                <span style={{fontWeight:700,fontSize:14,color:sub.color}}>{sub.label}</span>
              </div>
              {isDoneType?(
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <Donut value={doneDays} total={Math.max(doneDays,30)} color={doneColor} size={80} label="Days Done"  sub={`${doneDays} days`}/>
                  <Donut value={allAvg}   total={100}                    color={doneColor} size={80} label="Mock Avg"   sub={`${allAvg}%`}/>
                  <Donut value={allM.length} total={Math.max(allM.length,10)} color={doneColor} size={80} label="Total Mocks" sub={`${allM.length}t`}/>
                </div>
              ):(
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <Donut value={pDays} total={Math.max(pDays,30)} color={C.prelims} size={75} label="Prelims Days" sub={`${pDays}d`}/>
                  <Donut value={mDays} total={Math.max(mDays,30)} color={C.mains}   size={75} label="Mains Days"   sub={`${mDays}d`}/>
                  <Donut value={pAvg}  total={100}                 color={C.prelims} size={75} label="P Mock Avg"   sub={`${pAvg}%`}/>
                  <Donut value={mAvg}  total={100}                 color={C.mains}   size={75} label="M Mock Avg"   sub={`${mAvg}%`}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared small components ───────────────────────────────────────────────────
function Checkbox({checked,onChange,label,color}){
  return(
    <button onClick={onChange} style={{display:"flex",alignItems:"center",gap:8,background:checked?color+"22":"transparent",border:`2px solid ${checked?color:"#374151"}`,borderRadius:10,padding:"9px 16px",cursor:"pointer",transition:"all 0.15s",fontFamily:"Cambria,Georgia,serif",flex:1,minWidth:0}}>
      <div style={{width:20,height:20,borderRadius:5,background:checked?color:"transparent",border:`2.5px solid ${checked?color:"#6b7280"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
        {checked&&<span style={{color:"#0d1117",fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
      </div>
      <span style={{fontSize:13,fontWeight:700,color:checked?color:"#9ca3af"}}>{label}</span>
    </button>
  );
}

function Label({children}){
  return <div style={{fontSize:11,color:C.muted,marginBottom:5,fontWeight:600,letterSpacing:"0.3px"}}>{children}</div>;
}

function Legend(){
  return(
    <div style={{display:"flex",gap:20,marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
      {[
        ["#f472b6","Prelims only"],
        ["#c084fc","Mains only"],
        ["#38bdf8","Both P + M"],
        [C.ga,    "GA done"],
        [C.speed, "Speed Test done"],
      ].map(([col,label])=>(
        <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:16,height:16,borderRadius:4,background:col}}/>
          <span style={{fontSize:11,color:C.muted}}>{label}</span>
        </div>
      ))}
    </div>
  );
}
