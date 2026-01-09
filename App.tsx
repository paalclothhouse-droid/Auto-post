
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  History, 
  RefreshCw, 
  Instagram, 
  Youtube, 
  Facebook, 
  Share2, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Link as LinkIcon,
  Smartphone,
  Check,
  Zap
} from 'lucide-react';
import { TaskStatus, ContentLog, AutomationSettings } from './types';
import { generateNewCaption } from './geminiService';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.IDLE);
  const [logs, setLogs] = useState<ContentLog[]>([]);
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  
  // High-fidelity account connection state
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, boolean>>({
    tiktok: false,
    youtube: false,
    facebook: false,
    threads: false,
  });
  
  const [settings, setSettings] = useState<AutomationSettings>({
    instagramUsername: 'cristiano',
    customPrompt: 'Make it sound professional but hyped for a younger audience.',
    scheduleHours: [6, 9, 12],
    platforms: {
      tiktok: true,
      youtube: true,
      facebook: false,
      threads: true,
    }
  });

  const timerRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  const addLog = (platform: string, originalUrl: string, caption: string, status: 'Success' | 'Pending' | 'Failed') => {
    const newLog: ContentLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      platform,
      originalUrl,
      newCaption: caption,
      status
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const calculateNextRun = useCallback(() => {
    const now = new Date();
    const todaySlots = settings.scheduleHours
      .map(hour => {
        const d = new Date();
        d.setHours(hour, 0, 0, 0);
        return d;
      })
      .filter(d => d > now);

    if (todaySlots.length > 0) {
      return todaySlots[0];
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(Math.min(...settings.scheduleHours), 0, 0, 0);
      return tomorrow;
    }
  }, [settings.scheduleHours]);

  const runAutomationCycle = useCallback(async () => {
    if (!isRunning) return;

    try {
      setStatus(TaskStatus.FETCHING);
      await new Promise(r => setTimeout(r, 3000));
      
      const mockVideoUrl = `https://instagram.com/reels/vid_${Math.floor(Math.random() * 99999)}`;
      const mockOriginalCaption = "Keep pushing boundaries. 🚀 #workhard #reels";

      setStatus(TaskStatus.REWRITING);
      const newCaption = await generateNewCaption(mockOriginalCaption, settings.customPrompt);

      setStatus(TaskStatus.POSTING);
      
      // Filter platforms that are both selected in settings AND linked in the UI
      const activePlatforms = Object.entries(settings.platforms)
        .filter(([name, active]) => active && connectedAccounts[name])
        .map(([name]) => name);

      if (activePlatforms.length === 0) {
        addLog('System', 'N/A', 'Post skipped: No linked accounts found. Please link your socials in the left panel.', 'Failed');
      } else {
        for (const platform of activePlatforms) {
          await new Promise(r => setTimeout(r, 1500));
          addLog(platform, mockVideoUrl, newCaption, 'Success');
        }
      }

      const next = calculateNextRun();
      setNextRunTime(next);
      setStatus(TaskStatus.WAITING_FOR_SCHEDULE);
      
      const delay = next.getTime() - Date.now();
      timerRef.current = setTimeout(runAutomationCycle, delay);

    } catch (error) {
      console.error("Automation error:", error);
      setStatus(TaskStatus.ERROR);
      setIsRunning(false);
    }
  }, [isRunning, settings, connectedAccounts, calculateNextRun]);

  const toggleAutomation = () => {
    if (isRunning) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setIsRunning(false);
      setStatus(TaskStatus.IDLE);
      setNextRunTime(null);
      setTimeUntilNext('');
    } else {
      setIsRunning(true);
      const next = calculateNextRun();
      setNextRunTime(next);
      setStatus(TaskStatus.WAITING_FOR_SCHEDULE);
      const delay = next.getTime() - Date.now();
      timerRef.current = setTimeout(runAutomationCycle, delay);
    }
  };

  const toggleAccountConnection = (platform: string) => {
    setConnectedAccounts(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  useEffect(() => {
    if (isRunning && nextRunTime) {
      countdownRef.current = setInterval(() => {
        const diff = nextRunTime.getTime() - Date.now();
        if (diff <= 0) {
          setTimeUntilNext('Distributing...');
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeUntilNext(`${hours}h ${mins}m ${secs}s`);
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [isRunning, nextRunTime]);

  const getStatusColor = () => {
    switch(status) {
      case TaskStatus.IDLE: return 'text-slate-400';
      case TaskStatus.FETCHING: return 'text-blue-500';
      case TaskStatus.REWRITING: return 'text-purple-500';
      case TaskStatus.POSTING: return 'text-orange-500';
      case TaskStatus.WAITING_FOR_SCHEDULE: return 'text-emerald-500';
      case TaskStatus.ERROR: return 'text-red-500';
      default: return 'text-slate-900';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 selection:bg-indigo-100">
      <nav className="sticky top-0 z-50 glass-panel border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
            <RefreshCw className={`w-6 h-6 ${isRunning && status !== TaskStatus.WAITING_FOR_SCHEDULE ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">SocialStream AI</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mt-1">Automatic Content Lab</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleAutomation}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
              isRunning 
                ? 'bg-white text-red-600 border-2 border-red-100 hover:bg-red-50' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isRunning ? (
              <><Square className="w-4 h-4 fill-current" /> Stop Automator</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Start Forever Run</>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-8">
          {/* LINK ACCOUNTS SECTION */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                <LinkIcon className="w-4 h-4" /> Link Channels
              </h2>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(connectedAccounts).map((platform) => (
                <button
                  key={platform}
                  onClick={() => toggleAccountConnection(platform)}
                  className={`group flex items-center justify-between p-4 rounded-3xl border-2 transition-all duration-300 ${
                    connectedAccounts[platform] 
                    ? 'bg-emerald-50/50 border-emerald-500/30 ring-4 ring-emerald-500/5' 
                    : 'bg-slate-50 border-transparent hover:border-slate-200 grayscale opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                      platform === 'youtube' ? 'bg-red-500 text-white' : 
                      platform === 'facebook' ? 'bg-blue-600 text-white' : 
                      'bg-slate-900 text-white'
                    }`}>
                      {platform === 'youtube' ? <Youtube className="w-5 h-5" /> :
                       platform === 'facebook' ? <Facebook className="w-5 h-5" /> :
                       <Smartphone className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <span className={`block text-sm font-black capitalize ${connectedAccounts[platform] ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {platform}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {connectedAccounts[platform] ? 'Active Session' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  {connectedAccounts[platform] ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <Zap className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
              <Clock className="w-4 h-4" /> Loop Health
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className={`relative w-4 h-4 rounded-full bg-current ${isRunning ? 'pulse-active' : ''} ${getStatusColor()}`}></div>
              <span className={`text-3xl font-black tracking-tighter ${getStatusColor()}`}>
                {status === TaskStatus.WAITING_FOR_SCHEDULE ? 'WAITING' : status.replace('_', ' ')}
              </span>
            </div>
            {isRunning && nextRunTime && (
              <div className="mt-4 p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-1">Scheduled Event</p>
                <p className="text-2xl font-black">{nextRunTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <div className="flex items-center gap-2 mt-4 bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono font-black">{timeUntilNext}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
              <Calendar className="w-4 h-4" /> Engine Settings
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">Source Instagram</label>
                <div className="relative group">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text"
                    value={settings.instagramUsername}
                    onChange={(e) => setSettings({...settings, instagramUsername: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">Gemini Rewrite Model</label>
                <textarea 
                  value={settings.customPrompt}
                  onChange={(e) => setSettings({...settings, customPrompt: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all h-28 text-sm font-medium text-slate-600 leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-tighter">Distribution Windows</label>
                <div className="flex flex-wrap gap-2">
                  {[6, 9, 12, 18, 21].map(h => (
                    <button
                      key={h}
                      onClick={() => {
                        const newHours = settings.scheduleHours.includes(h)
                          ? settings.scheduleHours.filter(hr => hr !== h)
                          : [...settings.scheduleHours, h].sort((a,b) => a-b);
                        setSettings({...settings, scheduleHours: newHours});
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                        settings.scheduleHours.includes(h)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {h}:00
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-widest">
                <History className="w-4 h-4" /> Live Distribution Pipeline
              </h2>
              <div className="flex items-center gap-2">
                {Object.values(connectedAccounts).some(v => v) ? (
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Channels Armed
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No Channels Linked
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-50 max-h-[1000px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-40 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 ring-8 ring-slate-50/50">
                    <Share2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-slate-900 font-black text-xl mb-3 tracking-tight">System Standby</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">Link your channels and start the "Forever Run" to automate your reels.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`p-8 hover:bg-slate-50/50 transition-all duration-300 ${log.status === 'Failed' ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                          log.platform === 'youtube' ? 'bg-red-500 text-white' :
                          log.platform === 'facebook' ? 'bg-blue-600 text-white' :
                          log.platform === 'System' ? 'bg-amber-100 text-amber-600 shadow-none' :
                          'bg-slate-900 text-white'
                        }`}>
                          {log.platform === 'youtube' ? <Youtube className="w-7 h-7" /> :
                           log.platform === 'facebook' ? <Facebook className="w-7 h-7" /> :
                           log.platform === 'System' ? <AlertCircle className="w-7 h-7" /> :
                           <Smartphone className="w-7 h-7" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-black text-slate-900 capitalize text-lg tracking-tight">{log.platform}</span>
                            <span className="text-[10px] text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-lg uppercase font-black">{log.timestamp}</span>
                          </div>
                          <p className={`text-base font-medium leading-relaxed mb-4 ${log.status === 'Failed' ? 'text-red-600' : 'text-slate-600'}`}>
                            {log.newCaption}
                          </p>
                          {log.status === 'Success' && (
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1.5 uppercase">
                                  <Instagram className="w-3 h-3" /> Source: @{settings.instagramUsername}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                                  <LinkIcon className="w-3 h-3" /> Reel ID: {log.id}
                                </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                          log.status === 'Success' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {log.status === 'Success' ? <><Check className="w-3 h-3" /> Live</> : 'Critical'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-8 py-4 rounded-3xl shadow-2xl border-2 flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-indigo-500 animate-ping' : 'bg-slate-300'}`}></div>
        <p className="text-sm font-black text-slate-700 uppercase tracking-widest">
          {isRunning ? `Next Post Window: ${timeUntilNext}` : 'Automation Engine Offline'}
        </p>
      </div>
    </div>
  );
};

export default App;
