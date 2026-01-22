import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Task, 
  Goal, 
  Vision,
  PersonalCategory,
  PersonalItem,
  PersonalSubItem,
  AppData, 
  GitHubConfig, 
  UrgencyLevel, 
  ImportanceLevel, 
  TimeSavingPotential 
} from './types.ts';
import { Icons, CATEGORIES } from './constants.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { NotificationPanel } from './components/NotificationPanel.tsx';
import { GitHubSettings } from './components/GitHubSettings.tsx';
import { saveToGitHub, fetchFromGitHub } from './services/githubService.ts';

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('manish_todo_data');
    return saved ? JSON.parse(saved) : { tasks: [], visions: [], goals: [], personalCategories: [] };
  });

  const [ghConfig, setGhConfig] = useState<GitHubConfig>(() => {
    const saved = localStorage.getItem('manish_gh_config');
    return saved ? JSON.parse(saved) : { token: '', repo: '', path: 'data.json', owner: '' };
  });

  const [activeTab, setActiveTab] = useState<'tasks' | 'vision' | 'goals' | 'personal'>('tasks');
  const [showGhSettings, setShowGhSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [showTaskForm, setShowTaskForm] = useState<Task | boolean>(false);
  const [showVisionForm, setShowVisionForm] = useState<Vision | boolean>(false);
  const [showGoalForm, setShowGoalForm] = useState<Goal | boolean>(false);
  const [showCategoryForm, setShowCategoryForm] = useState<PersonalCategory | boolean>(false);
  const [showItemForm, setShowItemForm] = useState<{catId: string, item?: PersonalItem} | null>(null);
  const [showSubItemForm, setShowSubItemForm] = useState<{catId: string, itemId: string, subItem?: PersonalSubItem} | null>(null);

  useEffect(() => {
    localStorage.setItem('manish_todo_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('manish_gh_config', JSON.stringify(ghConfig));
  }, [ghConfig]);

  const toggleTask = (id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === id ? { 
          ...t, 
          status: t.status === 'pending' ? 'completed' : 'pending',
          completedAt: t.status === 'pending' ? new Date().toISOString() : undefined
        } : t
      )
    }));
  };

  const handleSync = useCallback(async () => {
    if (!ghConfig.token || !ghConfig.repo || !ghConfig.owner) {
      setShowGhSettings(true);
      return;
    }
    setIsSyncing(true);
    const success = await saveToGitHub(ghConfig, data);
    if (success) {
      setData(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      alert("Success: Master Pulse data synced to private GitHub repo.");
    } else {
      alert("Sync Failed: Check token permissions or repo existence.");
    }
    setIsSyncing(false);
  }, [data, ghConfig]);

  const handleFetch = useCallback(async () => {
    if (!ghConfig.token || !ghConfig.repo || !ghConfig.owner) {
      setShowGhSettings(true);
      return;
    }
    setIsSyncing(true);
    const remoteData = await fetchFromGitHub(ghConfig);
    if (remoteData) {
      setData(remoteData);
      alert("Success: Remote data loaded.");
    } else {
      alert("Error: Could not retrieve data from GitHub.");
    }
    setIsSyncing(false);
  }, [ghConfig]);

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: typeof showTaskForm === 'object' ? showTaskForm.id : generateId(),
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      deadline: formData.get('deadline') as string,
      probableCompletion: formData.get('probableCompletion') as string || formData.get('deadline') as string,
      estimatedTime: {
        days: parseInt(formData.get('estDays') as string || '0'),
        hours: parseInt(formData.get('estHours') as string || '0'),
        minutes: parseInt(formData.get('estMins') as string || '0'),
      },
      urgency: parseInt(formData.get('urgency') as string || '1') as UrgencyLevel,
      importance: parseInt(formData.get('importance') as string || '1') as ImportanceLevel,
      timeSaving: (formData.get('timeSaving') as TimeSavingPotential) || TimeSavingPotential.NOT_MUCH,
      isSerious: formData.get('isSerious') === 'on',
      status: typeof showTaskForm === 'object' ? showTaskForm.status : 'pending',
      createdAt: typeof showTaskForm === 'object' ? showTaskForm.createdAt : new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      tasks: typeof showTaskForm === 'object' 
        ? prev.tasks.map(t => t.id === showTaskForm.id ? newTask : t)
        : [...prev.tasks, newTask]
    }));
    setShowTaskForm(false);
  };

  const handleVisionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVision: Vision = {
      id: typeof showVisionForm === 'object' ? showVisionForm.id : generateId(),
      text: formData.get('text') as string,
      timeline: formData.get('timeline') as string,
    };
    setData(prev => ({
      ...prev,
      visions: typeof showVisionForm === 'object'
        ? prev.visions.map(v => v.id === showVisionForm.id ? newVision : v)
        : [...prev.visions, newVision]
    }));
    setShowVisionForm(false);
  };

  const handleGoalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newGoal: Goal = {
      id: typeof showGoalForm === 'object' ? showGoalForm.id : generateId(),
      title: formData.get('title') as string,
      timeline: formData.get('timeline') as string,
      plans: (formData.get('plans') as string).split('\n').filter(p => p.trim() !== ''),
    };
    setData(prev => ({
      ...prev,
      goals: typeof showGoalForm === 'object'
        ? prev.goals.map(g => g.id === showGoalForm.id ? newGoal : g)
        : [...prev.goals, newGoal]
    }));
    setShowGoalForm(false);
  };

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name) return;
    setData(prev => ({
      ...prev,
      personalCategories: typeof showCategoryForm === 'object'
        ? prev.personalCategories.map(c => c.id === showCategoryForm.id ? { ...c, name } : c)
        : [...prev.personalCategories, { id: generateId(), name, items: [] }]
    }));
    setShowCategoryForm(false);
  };

  const handleItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showItemForm) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name) return;
    setData(prev => ({
      ...prev,
      personalCategories: prev.personalCategories.map(c => 
        c.id === showItemForm.catId ? {
          ...c,
          items: showItemForm.item
            ? c.items.map(i => i.id === showItemForm.item!.id ? { ...i, name } : i)
            : [...c.items, { id: generateId(), name, subItems: [] }]
        } : c
      )
    }));
    setShowItemForm(null);
  };

  const handleSubItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showSubItemForm) return;
    const formData = new FormData(e.currentTarget);
    const heading = formData.get('heading') as string;
    const value = formData.get('value') as string;
    if (!heading || !value) return;
    setData(prev => ({
      ...prev,
      personalCategories: prev.personalCategories.map(cat => 
        cat.id === showSubItemForm.catId ? {
          ...cat,
          items: cat.items.map(item => 
            item.id === showSubItemForm.itemId ? {
              ...item,
              subItems: showSubItemForm.subItem
                ? item.subItems.map(s => s.id === showSubItemForm.subItem!.id ? { ...s, heading, value } : s)
                : [...item.subItems, { id: generateId(), heading, value }]
            } : item
          )
        } : cat
      )
    }));
    setShowSubItemForm(null);
  };

  const sortedTasks = useMemo(() => {
    return [...data.tasks].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      if (a.isSerious !== b.isSerious) return a.isSerious ? -1 : 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [data.tasks]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <aside className="w-full md:w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col py-8 px-4 gap-8 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Icons.Zap size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tight hidden lg:block">PULSE</h1>
        </div>

        <nav className="flex flex-col gap-2 w-full">
          {[
            { id: 'tasks', label: 'Dashboard', icon: Icons.Layers },
            { id: 'vision', label: 'Vision', icon: Icons.Saving },
            { id: 'goals', label: 'Strategic Goals', icon: Icons.Goal },
            { id: 'personal', label: 'Dossier', icon: Icons.Settings },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <tab.icon size={22} />
              <span className="font-semibold hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 w-full">
          <button onClick={() => setShowGhSettings(true)} className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
            <Icons.GitHub size={22} />
            <span className="font-semibold hidden lg:block">GitHub Sync</span>
          </button>
          <button onClick={handleSync} disabled={isSyncing} className="flex items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50">
            <Icons.Save size={20} className={isSyncing ? 'animate-spin' : ''} />
            <span className="font-bold hidden lg:block uppercase tracking-widest text-xs">Save All</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-1 truncate max-w-xs md:max-w-none">Manish sri sai surya routhu</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              {activeTab === 'tasks' && 'Active Operations'}
              {activeTab === 'vision' && 'Life Vision'}
              {activeTab === 'goals' && 'Strategic Goals'}
              {activeTab === 'personal' && 'Personal Dossier'}
            </h2>
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'tasks') setShowTaskForm(true);
              if (activeTab === 'vision') setShowVisionForm(true);
              if (activeTab === 'goals') setShowGoalForm(true);
              if (activeTab === 'personal') setShowCategoryForm(true);
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Icons.Plus size={20} />
            ADD {activeTab === 'tasks' ? 'TASK' : activeTab === 'personal' ? 'CATEGORY' : activeTab.toUpperCase()}
          </button>
        </header>

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sortedTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onToggle={toggleTask} 
                onDelete={(id) => confirm("Delete task?") && setData(prev => ({...prev, tasks: prev.tasks.filter(t => t.id !== id)}))} 
                onEdit={setShowTaskForm} 
                onUpdate={(id, u) => setData(prev => ({...prev, tasks: prev.tasks.map(t => t.id === id ? {...t, ...u} : t)}))} 
              />
            ))}
            {data.tasks.length === 0 && <div className="col-span-full py-32 text-center text-slate-300"><Icons.Layers size={48} className="mx-auto mb-4 opacity-20" /><p className="font-bold">No operations deployed.</p></div>}
          </div>
        )}

        {activeTab === 'vision' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.visions.map(v => (
              <div key={v.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group hover:shadow-md transition-all">
                <span className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 block">{v.timeline}</span>
                <p className="text-xl font-medium text-slate-800 italic leading-relaxed">"{v.text}"</p>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setShowVisionForm(v)} className="p-2 text-slate-300 hover:text-indigo-600"><Icons.Edit size={18} /></button>
                  <button onClick={() => confirm("Delete vision?") && setData(prev => ({...prev, visions: prev.visions.filter(x => x.id !== v.id)}))} className="p-2 text-slate-300 hover:text-red-600"><Icons.Delete size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {data.goals.map(g => (
              <div key={g.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-slate-900">{g.title}</h3>
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold uppercase">{g.timeline}</span>
                </div>
                <ul className="space-y-3">
                  {g.plans.map((p, i) => <li key={i} className="flex gap-3 text-slate-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-purple-300 mt-2 shrink-0"></div>{p}</li>)}
                </ul>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setShowGoalForm(g)} className="p-2 text-slate-300 hover:text-indigo-600"><Icons.Edit size={18} /></button>
                  <button onClick={() => confirm("Delete goal?") && setData(prev => ({...prev, goals: prev.goals.filter(x => x.id !== g.id)}))} className="p-2 text-slate-300 hover:text-red-600"><Icons.Delete size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="space-y-12">
            {data.personalCategories.map(cat => (
              <div key={cat.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">{cat.name}</h3>
                  <div className="flex gap-3">
                    <button onClick={() => setShowItemForm({ catId: cat.id })} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase hover:bg-rose-100 transition-all">+ Item</button>
                    <button onClick={() => setShowCategoryForm(cat)} className="p-2 text-slate-300 hover:text-indigo-600"><Icons.Edit size={20} /></button>
                    <button onClick={() => confirm("Delete category?") && setData(prev => ({...prev, personalCategories: prev.personalCategories.filter(x => x.id !== cat.id)}))} className="p-2 text-slate-300 hover:text-red-600"><Icons.Delete size={20} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cat.items.map(item => (
                    <div key={item.id} className="p-6 bg-slate-50 rounded-3xl relative group">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setShowSubItemForm({ catId: cat.id, itemId: item.id })} className="text-[10px] font-black uppercase text-indigo-600 hover:underline tracking-widest">+ Detail</button>
                          <button onClick={() => setShowItemForm({ catId: cat.id, item: item })} className="text-slate-300 hover:text-indigo-600"><Icons.Edit size={14} /></button>
                          <button onClick={() => confirm("Delete item?") && setData(prev => ({...prev, personalCategories: prev.personalCategories.map(c => c.id === cat.id ? {...c, items: c.items.filter(i => i.id !== item.id)} : c)}))} className="text-slate-300 hover:text-red-600"><Icons.Delete size={14} /></button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {item.subItems.map(sub => (
                          <div key={sub.id} className="flex justify-between items-start text-sm group/sub">
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mt-1">{sub.heading}</span>
                            <div className="flex items-center gap-3 max-w-[70%]">
                              <span className="text-slate-900 font-bold break-all text-right">{sub.value}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <button onClick={() => setShowSubItemForm({ catId: cat.id, itemId: item.id, subItem: sub })} className="text-slate-300 hover:text-indigo-600"><Icons.Edit size={12}/></button>
                                <button onClick={() => setData(prev => ({...prev, personalCategories: prev.personalCategories.map(c => c.id === cat.id ? {...c, items: c.items.map(i => i.id === item.id ? {...i, subItems: i.subItems.filter(s => s.id !== sub.id)} : i)} : c)}))} className="text-slate-300 hover:text-red-600"><Icons.Delete size={12}/></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className="hidden xl:block w-80 h-screen sticky top-0 bg-white border-l border-slate-100 shrink-0 overflow-y-auto">
        <NotificationPanel tasks={data.tasks} />
      </aside>

      {/* --- MODALS --- */}
      {showGhSettings && <GitHubSettings config={ghConfig} onSave={(c) => { setGhConfig(c); setShowGhSettings(false); }} onClose={() => setShowGhSettings(false)} />}

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-600 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tighter">{typeof showTaskForm === 'object' ? 'Update Operation' : 'New Operation'}</h2>
              <button onClick={() => setShowTaskForm(false)} className="hover:rotate-90 transition-transform"><Icons.Plus className="rotate-45" size={32} /></button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-8 space-y-6 overflow-y-auto">
              <input name="title" required defaultValue={typeof showTaskForm === 'object' ? showTaskForm.title : ''} placeholder="Task Headline" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-lg focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select name="category" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.category : 'Work'} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input name="deadline" type="datetime-local" required defaultValue={typeof showTaskForm === 'object' ? showTaskForm.deadline : ''} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input name="estDays" type="number" placeholder="Days" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.estimatedTime.days : 0} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-center" />
                <input name="estHours" type="number" placeholder="Hrs" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.estimatedTime.hours : 0} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-center" />
                <input name="estMins" type="number" placeholder="Mins" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.estimatedTime.minutes : 0} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-center" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <select name="urgency" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.urgency : 3} className="p-4 bg-slate-50 rounded-2xl border-none font-bold">
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>Urg {v}</option>)}
                </select>
                <select name="importance" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.importance : 3} className="p-4 bg-slate-50 rounded-2xl border-none font-bold">
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>Imp {v}</option>)}
                </select>
                <select name="timeSaving" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.timeSaving : TimeSavingPotential.NOT_MUCH} className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-[10px]">
                  {Object.values(TimeSavingPotential).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl cursor-pointer">
                <input name="isSerious" type="checkbox" defaultChecked={typeof showTaskForm === 'object' ? showTaskForm.isSerious : false} className="w-6 h-6 rounded-lg text-red-600 border-none focus:ring-0 shadow-sm" />
                <span className="font-black text-red-700 uppercase text-xs tracking-widest">High Priority Operations Only</span>
              </label>
              <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 uppercase tracking-widest hover:bg-indigo-700">Commit Pulse</button>
            </form>
          </div>
        </div>
      )}

      {showVisionForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-widest">{typeof showVisionForm === 'object' ? 'Update Vision' : 'New Vision'}</h2>
              <button onClick={() => setShowVisionForm(false)}><Icons.Plus className="rotate-45" size={32} /></button>
            </div>
            <form onSubmit={handleVisionSubmit} className="p-8 space-y-6">
              <textarea name="text" required defaultValue={typeof showVisionForm === 'object' ? showVisionForm.text : ''} placeholder="Distant Vision Statement" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-medium h-32 focus:ring-2 focus:ring-blue-500" />
              <input name="timeline" required defaultValue={typeof showVisionForm === 'object' ? showVisionForm.timeline : ''} placeholder="Target Timeline (e.g. 2030)" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-500" />
              <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl uppercase tracking-widest">Update Vision</button>
            </form>
          </div>
        </div>
      )}

      {showGoalForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8 bg-purple-600 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-widest">{typeof showGoalForm === 'object' ? 'Update Goal' : 'New Goal'}</h2>
              <button onClick={() => setShowGoalForm(false)}><Icons.Plus className="rotate-45" size={32} /></button>
            </div>
            <form onSubmit={handleGoalSubmit} className="p-8 space-y-6">
              <input name="title" required defaultValue={typeof showGoalForm === 'object' ? showGoalForm.title : ''} placeholder="Goal Objective" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-lg focus:ring-2 focus:ring-purple-500" />
              <input name="timeline" required defaultValue={typeof showGoalForm === 'object' ? showGoalForm.timeline : ''} placeholder="Timeline" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-purple-500" />
              <textarea name="plans" required defaultValue={typeof showGoalForm === 'object' ? showGoalForm.plans.join('\n') : ''} placeholder="Actionable Plans (One per line)" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-medium h-48 focus:ring-2 focus:ring-purple-500" />
              <button className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-xl uppercase tracking-widest">Commit Goal</button>
            </form>
          </div>
        </div>
      )}

      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 bg-rose-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-widest">{typeof showCategoryForm === 'object' ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowCategoryForm(false)}><Icons.Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <input name="name" required autoFocus defaultValue={typeof showCategoryForm === 'object' ? showCategoryForm.name : ''} placeholder="e.g. Academic Records" className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold" />
              <button className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest">Update Dossier</button>
            </form>
          </div>
        </div>
      )}

      {showItemForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 bg-rose-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-widest">{showItemForm.item ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setShowItemForm(null)}><Icons.Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
              <input name="name" required autoFocus defaultValue={showItemForm.item ? showItemForm.item.name : ''} placeholder="Item Name (e.g. University)" className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold" />
              <button className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest">Confirm Item</button>
            </form>
          </div>
        </div>
      )}

      {showSubItemForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-widest">{showSubItemForm.subItem ? 'Edit Detail' : 'Add Detail'}</h2>
              <button onClick={() => setShowSubItemForm(null)}><Icons.Plus className="rotate-45" size={24} /></button>
            </div>
            <form onSubmit={handleSubItemSubmit} className="p-6 space-y-4">
              <input name="heading" required autoFocus defaultValue={showSubItemForm.subItem ? showSubItemForm.subItem.heading : ''} placeholder="Detail Header (e.g. CGPA)" className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold" />
              <textarea name="value" required defaultValue={showSubItemForm.subItem ? showSubItemForm.subItem.value : ''} placeholder="Detail Content" className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium h-24" />
              <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest">Confirm Detail</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;