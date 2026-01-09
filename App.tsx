
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Square, RefreshCw, Instagram, Youtube, Facebook, Share2, 
  AlertCircle, CheckCircle2, Clock, Calendar, Link as LinkIcon, 
  Smartphone, Check, Zap, ShieldCheck, X, Loader2
} from 'lucide-react';
import { TaskStatus, ContentLog, AutomationSettings } from './types';
import { generateNewCaption } from './geminiService';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.IDLE);
  const [logs, setLogs] = useState<ContentLog[]>([]);
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, {linked: boolean, handle: string}>>({
    tiktok: { linked: false, handle: '' },
    youtube: { linked: false, handle: '' },
    facebook: { linked: false, handle: '' },
    threads: { linked: false, handle: '' },
  });
  
  const [settings, setSettings] = useState<AutomationSettings>({
    instagramUsername: 'cristiano',
    customPrompt: 'Make it sound professional but hyped for a younger audience.',
    scheduleHours: [6, 9, 12],
    platforms: { tiktok: true, youtube: true, facebook: false, threads: true }
  });

  const timerRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  const handleLinkAccount = (platform: string) => {
    setIsLinking(true);
    setTimeout(() => {
      setConnectedAccounts(prev => ({
        ...prev,
        [platform]: { linked: true, handle: `@user_${Math.floor(Math.random() * 999)}` }
      }));
      setIsLinking(false);
      setShowLoginModal(null);
    }, 2500);
  };

  const calculateNextRun = useCallback(() => {
    const now = new Date();
    const slots = settings.scheduleHours.map(h => {
      const d = new Date();
      d.setHours(h, 0, 0, 0);
      return d;
    }).filter(d => d > now);

    if (slots.length > 0) return slots[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(Math.min(...settings.scheduleHours), 0, 0, 0);
    return tomorrow;
  }, [settings.scheduleHours]);

  const runAutomationCycle = useCallback(async () => {
    if (!isRunning) return;
    try {
      setStatus(TaskStatus.FETCHING);
      await new Promise(r => setTimeout(r, 2000));
      const newCaption = await generateNewCaption("Keep pushing boundaries. 🚀", settings.customPrompt);
      setStatus(TaskStatus.POSTING);
      
      const activePlatforms = Object.entries(settings.platforms)
        .filter(([name, active]) => active && connectedAccounts[name].linked)
        .map(([name]) => name);

      if (activePlatforms.length === 0) {
        setLogs(prev => [{
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          platform: 'System',
          originalUrl: 'N/A',
          newCaption: 'Error: No verified accounts linked. Daily loop suspended.',
          status: 'Failed'
        }, ...prev]);
      } else {
        for (const p of activePlatforms) {
          await new Promise(r => setTimeout(r, 1000));
          setLogs(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            platform: p,
            originalUrl: 'N/A',
            newCaption,
            status: 'Success'
          }, ...prev]);
        }
      }
      const next = calculateNextRun();
      setNextRunTime(next);
      setStatus(TaskStatus.WAITING_FOR_SCHEDULE);
      timerRef.current = setTimeout(runAutomationCycle, next.getTime() - Date.now());
    } catch (e) {
      setStatus(TaskStatus.ERROR);
      setIsRunning(false);
    }
  }, [isRunning, settings, connectedAccounts, calculateNextRun]);

  const toggleAutomation = () => {
    if (isRunning) {
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
      setIsRunning(false);
      setStatus(TaskStatus.IDLE);
    } else {
      setIsRunning(true);
      const next = calculateNextRun();
      setNextRunTime(next);
      setStatus(TaskStatus.WAITING_FOR_SCHEDULE);
      timerRef.current = setTimeout(runAutomationCycle, next.getTime() - Date.now());
    }
  };

  useEffect(() => {
    if (isRunning && nextRunTime) {
      countdownRef.current = setInterval(() => {
        const diff = nextRunTime.getTime() - Date.now();
        if (diff <= 0) return setTimeUntilNext('Starting...');
        const h = Math.floor(diff / 36e5), m = Math.floor((diff % 36e5) / 6e4), s = Math.floor((diff % 6e4) / 1e3);
        setTimeUntilNext(`${h}h ${m}m ${s}s`);
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [isRunning, nextRunTime]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* Login Modal Simulation */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <button onClick={() => setShowLoginModal(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Secure Link</h3>
              <p className="text-slate-500 text-sm mb-8">Grant SocialStream AI permission to post content to your <span className="font-bold capitalize">{showLoginModal}</span> account.</p>
              
              {!isLinking ? (
                <div className="space-y-3">
                  <button 
                    onClick={() => handleLinkAccount(showLoginModal)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Allow & Connect
                  </button>
                  <button onClick={() => setShowLoginModal(null)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-xs font-black text-indigo-500 uppercase tracking-widest animate-pulse">Establishing Secure Handshake...</p>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-4 border-t flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Verified OAuth 2.0 Environment</span>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 glass-panel border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
            <RefreshCw className={`w-6 h-6 ${isRunning && status !== TaskStatus.WAITING_FOR_SCHEDULE ? 'animate-spin' : ''}`} />
          </div>
          <h1 className="font-extrabold text-xl text-slate-900 leading-none">SocialStream AI</h1>
        </div>
        <button onClick={toggleAutomation} className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${isRunning ? 'bg-white text-red-600 border-2' : 'bg-indigo-600 text-white'}`}>
          {isRunning ? 'Stop Automator' : 'Start Forever Run'}
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h2 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6"><LinkIcon className="w-4 h-4" /> Account Manager</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Added explicit type to [platform, data] destructing */}
              {(Object.entries(connectedAccounts) as [string, {linked: boolean, handle: string}][]).map(([platform, data]) => (
                <button
                  key={platform}
                  onClick={() => !data.linked && setShowLoginModal(platform)}
                  className={`group flex items-center justify-between p-4 rounded-3xl border-2 transition-all duration-300 ${data.linked ? 'bg-emerald-50/50 border-emerald-500/30' : 'bg-slate-50 border-transparent hover:border-slate-200 opacity-60 hover:opacity-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platform === 'youtube' ? 'bg-red-500 text-white' : platform === 'facebook' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                      {platform === 'youtube' ? <Youtube className="w-5 h-5" /> : platform === 'facebook' ? <Facebook className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-black capitalize">{platform}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{data.linked ? data.handle : 'Disconnected'}</span>
                    </div>
                  </div>
                  {data.linked ? <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Check className="w-4 h-4" /></div> : <Zap className="w-4 h-4 text-slate-300" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Loop Health</h2>
            <div className={`text-3xl font-black tracking-tighter ${status === 'WAITING_FOR_SCHEDULE' ? 'text-emerald-500' : 'text-indigo-600'}`}>{status.replace('_', ' ')}</div>
            {isRunning && nextRunTime && (
              <div className="mt-4 p-5 bg-indigo-600 rounded-[2rem] text-white">
                <p className="text-[10px] font-black opacity-70 uppercase mb-1">Next Post: {nextRunTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                <div className="flex items-center gap-2 bg-white/20 p-2 rounded-xl text-sm font-black"><Clock className="w-4 h-4" /> {timeUntilNext}</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
          <div className="px-8 py-6 border-b bg-slate-50/30 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">Live Content Pipeline</h2>
            {/* Added explicit type to Object.values casting */}
            {(Object.values(connectedAccounts) as {linked: boolean, handle: string}[]).some(v => v.linked) ? (
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> System Armed</span>
            ) : (
              <span className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Not Linked</span>
            )}
          </div>

          <div className="divide-y divide-slate-50 max-h-[800px] overflow-y-auto p-8 space-y-4">
            {logs.length === 0 ? (
              <div className="py-40 text-center text-slate-300"><Share2 className="w-16 h-16 mx-auto mb-4" /><p className="font-bold">Waiting for 6AM, 9AM or 12PM trigger...</p></div>
            ) : logs.map(log => (
              <div key={log.id} className="p-6 rounded-3xl border-2 border-slate-50 hover:border-indigo-100 transition-all flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${log.platform === 'youtube' ? 'bg-red-500 text-white' : log.platform === 'facebook' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {log.platform === 'youtube' ? <Youtube className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-slate-900 capitalize">{log.platform}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-sm italic">"{log.newCaption}"</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
