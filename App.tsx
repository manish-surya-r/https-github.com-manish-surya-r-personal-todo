
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
} from './types';
import { Icons, CATEGORIES } from './constants';
import { TaskCard } from './components/TaskCard';
import { NotificationPanel } from './components/NotificationPanel';
import { GitHubSettings } from './components/GitHubSettings';
import { saveToGitHub, fetchFromGitHub } from './services/githubService';
import { v4 as uuidv4 } from 'uuid';

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
  
  // Modals for Personal Info
  const [showCategoryForm, setShowCategoryForm] = useState<PersonalCategory | boolean>(false);
  const [showItemForm, setShowItemForm] = useState<{catId: string, item?: PersonalItem} | null>(null);
  const [showSubItemForm, setShowSubItemForm] = useState<{catId: string, itemId: string, subItem?: PersonalSubItem} | null>(null);

  useEffect(() => {
    localStorage.setItem('manish_todo_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('manish_gh_config', JSON.stringify(ghConfig));
  }, [ghConfig]);

  const handleSync = useCallback(async () => {
    if (!ghConfig.token) {
      setShowGhSettings(true);
      return;
    }
    setIsSyncing(true);
    const success = await saveToGitHub(ghConfig, data);
    if (success) {
      setData(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      alert("All data saved to GitHub successfully!");
    } else {
      alert("Sync failed. Check your token and repository details.");
    }
    setIsSyncing(false);
  }, [data, ghConfig]);

  const handleFetch = useCallback(async () => {
    setIsSyncing(true);
    const remoteData = await fetchFromGitHub(ghConfig);
    if (remoteData) {
      setData(remoteData);
      alert("Data fetched from GitHub.");
    }
    setIsSyncing(false);
  }, [ghConfig]);

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: typeof showTaskForm === 'object' ? showTaskForm.id : uuidv4(),
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      deadline: formData.get('deadline') as string,
      probableCompletion: formData.get('probableCompletion') as string,
      estimatedTime: {
        days: parseInt(formData.get('estDays') as string || '0'),
        hours: parseInt(formData.get('estHours') as string || '0'),
        minutes: parseInt(formData.get('estMins') as string || '0'),
      },
      urgency: parseInt(formData.get('urgency') as string) as UrgencyLevel,
      importance: parseInt(formData.get('importance') as string) as ImportanceLevel,
      timeSaving: formData.get('timeSaving') as TimeSavingPotential,
      isSerious: formData.get('isSerious') === 'on',
      status: typeof showTaskForm === 'object' ? showTaskForm.status : 'pending',
      createdAt: typeof showTaskForm === 'object' ? showTaskForm.createdAt : new Date().toISOString(),
    };

    if (typeof showTaskForm === 'object') {
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === showTaskForm.id ? newTask : t)
      }));
    } else {
      setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    }
    setShowTaskForm(false);
  };

  const toggleTask = (id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === id ? { 
          ...t, 
          status: t.status === 'completed' ? 'pending' : 'completed',
          completedAt: t.status === 'pending' ? new Date().toISOString() : undefined
        } : t
      )
    }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteTask = (id: string) => {
    if (window.confirm("Remove this task?")) {
      setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    }
  };

  const sortedTasks = useMemo(() => {
    return [...data.tasks].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      const scoreA = (a.urgency * 1.5) + (a.importance * 2) + (a.isSerious ? 10 : 0);
      const scoreB = (b.urgency * 1.5) + (b.importance * 2) + (b.isSerious ? 10 : 0);
      return scoreB - scoreA;
    });
  }, [data.tasks]);

  const handleVisionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVision: Vision = {
      id: typeof showVisionForm === 'object' ? showVisionForm.id : uuidv4(),
      text: formData.get('text') as string,
      timeline: formData.get('timeline') as string,
    };

    if (typeof showVisionForm === 'object') {
      setData(prev => ({
        ...prev,
        visions: prev.visions.map(v => v.id === showVisionForm.id ? newVision : v)
      }));
    } else {
      setData(prev => ({ ...prev, visions: [...prev.visions, newVision] }));
    }
    setShowVisionForm(false);
  };

  const handleGoalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newGoal: Goal = {
      id: typeof showGoalForm === 'object' ? showGoalForm.id : uuidv4(),
      title: formData.get('title') as string,
      timeline: formData.get('timeline') as string,
      plans: (formData.get('plans') as string).split('\n').filter(p => p.trim() !== ''),
    };

    if (typeof showGoalForm === 'object') {
      setData(prev => ({
        ...prev,
        goals: prev.goals.map(g => g.id === showGoalForm.id ? newGoal : g)
      }));
    } else {
      setData(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    }
    setShowGoalForm(false);
  };

  // --- Personal Info Handlers ---

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name) return;

    if (typeof showCategoryForm === 'object') {
      setData(prev => ({
        ...prev,
        personalCategories: prev.personalCategories.map(c => c.id === showCategoryForm.id ? { ...c, name } : c)
      }));
    } else {
      const newCat: PersonalCategory = { id: uuidv4(), name, items: [] };
      setData(prev => ({ ...prev, personalCategories: [...prev.personalCategories, newCat] }));
    }
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
            : [...c.items, { id: uuidv4(), name, subItems: [] }]
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
                : [...item.subItems, { id: uuidv4(), heading, value }]
            } : item
          )
        } : cat
      )
    }));
    setShowSubItemForm(null);
  };

  const deleteCategory = (id: string) => {
    if (confirm("Delete this category?")) {
      setData(prev => ({ ...prev, personalCategories: prev.personalCategories.filter(c => c.id !== id) }));
    }
  };

  const deleteItem = (catId: string, itemId: string) => {
    if (confirm("Delete this item?")) {
      setData(prev => ({
        ...prev,
        personalCategories: prev.personalCategories.map(c => 
          c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
        )
      }));
    }
  };

  const deleteSubItem = (catId: string, itemId: string, subId: string) => {
    setData(prev => ({
      ...prev,
      personalCategories: prev.personalCategories.map(cat => 
        cat.id === catId ? {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? {
              ...item,
              subItems: item.subItems.filter(s => s.id !== subId)
            } : item
          )
        } : cat
      )
    }));
  };

  const copyPersonalInfo = () => {
    const text = data.personalCategories.map(cat => {
      const itemsText = cat.items.map(item => {
        const subItemsText = item.subItems.map(sub => `  ${sub.heading}: ${sub.value}`).join('\n');
        return `[Item] ${item.name}\n${subItemsText}`;
      }).join('\n\n');
      return `### CATEGORY: ${cat.name.toUpperCase()} ###\n${itemsText}\n`;
    }).join('\n========================\n\n');
    
    navigator.clipboard.writeText(text);
    alert("Personal information copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row max-w-[1600px] mx-auto bg-slate-50">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 glass lg:h-screen border-r border-slate-200 flex flex-col p-6 sticky top-0 z-20">
        <div className="mb-10">
          <h1 className="text-sm font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">Master Suite</h1>
          <div className="text-2xl font-black gradient-text leading-tight">
            Manish sri sai surya routhu
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icons.Check size={20} /> <span className="font-semibold">Tasks</span>
          </button>
          <button onClick={() => setActiveTab('vision')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'vision' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icons.Layers size={20} /> <span className="font-semibold">Vision</span>
          </button>
          <button onClick={() => setActiveTab('goals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'goals' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icons.Goal size={20} /> <span className="font-semibold">Goals</span>
          </button>
          <button onClick={() => setActiveTab('personal')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'personal' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icons.Menu size={20} /> <span className="font-semibold">Personal Info</span>
          </button>
        </nav>

        <div className="mt-auto space-y-3">
          <button onClick={handleSync} disabled={isSyncing} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            <Icons.Save size={18} /> {isSyncing ? 'Saving...' : 'Save All to GitHub'}
          </button>
          <div className="p-4 bg-slate-100 rounded-2xl">
             <div className="flex items-center gap-2">
                <button onClick={handleFetch} className="p-2 bg-white rounded-lg border border-slate-200" title="Fetch Remote Data"><Icons.Arrow size={18} className="rotate-90"/></button>
                <button onClick={() => setShowGhSettings(true)} className="p-2 bg-white rounded-lg border border-slate-200"><Icons.Settings size={18} /></button>
             </div>
             {data.lastSync && <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-tighter">Sync: {new Date(data.lastSync).toLocaleTimeString()}</p>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {activeTab === 'tasks' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
              <div><h2 className="text-3xl font-extrabold text-slate-900">Task Control</h2><p className="text-slate-500">Sorted by PriorityScore.</p></div>
              <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                <Icons.Plus size={20} /> New Task
              </button>
            </header>
            <div className="grid gap-4">
              {sortedTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={setShowTaskForm} onUpdate={updateTask} />)}
            </div>
          </div>
        )}

        {activeTab === 'vision' && (
          <div className="max-w-4xl mx-auto space-y-8">
             <header className="flex justify-between items-center">
               <h2 className="text-3xl font-extrabold text-slate-900">Future Visions</h2>
               <button onClick={() => setShowVisionForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-bold">
                 <Icons.Plus size={20} /> New Vision
               </button>
             </header>
             <div className="grid gap-6">
               {data.visions.map(v => (
                 <div key={v.id} className="bg-white p-6 rounded-3xl border-l-8 border-blue-500 shadow-lg relative group transition-all hover:scale-[1.01]">
                   <p className="text-xl font-medium text-slate-800 italic">"{v.text}"</p>
                   <p className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-widest">{v.timeline}</p>
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => setShowVisionForm(v)} className="text-slate-300 hover:text-indigo-500 transition-all">
                       <Icons.Edit size={18} />
                     </button>
                     <button onClick={() => setData(prev => ({...prev, visions: prev.visions.filter(x => x.id !== v.id)}))} className="text-slate-300 hover:text-red-500 transition-all">
                       <Icons.Delete size={18} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-extrabold text-slate-900">Strategic Goals</h2>
              <button onClick={() => setShowGoalForm(true)} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 font-bold">
                 <Icons.Plus size={20} /> Register Goal
              </button>
            </header>
            <div className="space-y-6">
               {data.goals.map(g => (
                 <div key={g.id} className="bg-white p-8 rounded-3xl border-l-8 border-purple-500 shadow-lg relative group transition-all hover:scale-[1.01]">
                   <h3 className="text-2xl font-bold text-slate-800">{g.title}</h3>
                   <p className="text-purple-600 font-bold text-xs uppercase mb-4">{g.timeline}</p>
                   <ul className="space-y-2">
                     {g.plans.map((p, i) => <li key={i} className="flex gap-2 text-slate-600">
                       <span className="text-purple-300 font-bold">{i+1}.</span> {p}
                     </li>)}
                   </ul>
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => setShowGoalForm(g)} className="text-slate-300 hover:text-indigo-500 transition-all">
                       <Icons.Edit size={18} />
                     </button>
                     <button onClick={() => setData(prev => ({...prev, goals: prev.goals.filter(x => x.id !== g.id)}))} className="text-slate-300 hover:text-red-500 transition-all">
                       <Icons.Delete size={18} />
                     </button>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-3xl font-extrabold text-slate-900">Personal Information</h2>
              <div className="flex gap-2">
                <button onClick={copyPersonalInfo} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all"><Icons.Save size={18} /> Copy All</button>
                <button onClick={() => setShowCategoryForm(true)} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all font-bold"><Icons.Plus size={18} /> New Category</button>
              </div>
            </header>

            <div className="space-y-10">
              {data.personalCategories.map(cat => (
                <div key={cat.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                   <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                     <div className="flex items-center gap-3">
                       <div className="w-2 h-8 bg-rose-500 rounded-full"></div>
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-wider">{cat.name}</h3>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => setShowItemForm({catId: cat.id})} className="text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all">+ Add Item</button>
                       <button onClick={() => setShowCategoryForm(cat)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"><Icons.Edit size={20} /></button>
                       <button onClick={() => deleteCategory(cat.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Icons.Delete size={20} /></button>
                     </div>
                   </div>

                   <div className="space-y-8">
                     {cat.items.map(item => (
                       <div key={item.id} className="p-6 bg-slate-50 rounded-3xl relative group border border-slate-100">
                         <div className="flex justify-between items-center mb-4">
                           <h4 className="text-lg font-bold text-slate-800">{item.name}</h4>
                           <div className="flex gap-2">
                              <button onClick={() => setShowSubItemForm({catId: cat.id, itemId: item.id})} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-all">+ Add Detail</button>
                              <button onClick={() => setShowItemForm({catId: cat.id, item: item})} className="p-1 text-slate-300 hover:text-indigo-500 transition-colors"><Icons.Edit size={16} /></button>
                              <button onClick={() => deleteItem(cat.id, item.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Icons.Delete size={16} /></button>
                           </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {item.subItems.map(sub => (
                             <div key={sub.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 relative group/sub">
                               <div className="flex justify-between items-start mb-1">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.heading}</span>
                                 <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-all">
                                   <button onClick={() => setShowSubItemForm({catId: cat.id, itemId: item.id, subItem: sub})} className="text-slate-200 hover:text-indigo-400"><Icons.Edit size={12}/></button>
                                   <button onClick={() => deleteSubItem(cat.id, item.id, sub.id)} className="text-slate-200 hover:text-red-400 transition-all"><Icons.Delete size={12}/></button>
                                 </div>
                               </div>
                               <div className="mt-1 font-semibold text-sm">
                                  <span className="text-slate-800 break-words">{sub.value}</span>
                               </div>
                             </div>
                           ))}
                           {item.subItems.length === 0 && (
                             <div className="col-span-full py-4 text-center text-slate-400 text-sm italic">No details added.</div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Notifications Sidebar */}
      <aside className="w-full lg:w-80 sticky top-0 h-screen hidden lg:block">
        <NotificationPanel tasks={data.tasks} />
      </aside>

      {/* --- MODALS --- */}
      
      {/* Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in duration-200">
             <div className="bg-indigo-600 p-6 text-white flex justify-between">
               <h2 className="text-xl font-bold uppercase tracking-widest">{typeof showTaskForm === 'object' ? 'Update Task' : 'Deploy New Priority'}</h2>
               <button onClick={() => setShowTaskForm(false)} className="hover:scale-110 transition-transform"><Icons.Delete size={20}/></button>
             </div>
             <form onSubmit={handleTaskSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Task Heading</label>
                  <input name="title" required defaultValue={typeof showTaskForm === 'object' ? showTaskForm.title : ''} placeholder="Main objective of this task..." className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Category Classification</label>
                    <select name="category" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.category : 'Work'} className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Hard Deadline Date</label>
                    <input type="datetime-local" name="deadline" required defaultValue={typeof showTaskForm === 'object' ? showTaskForm.deadline : ''} className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-1">
                     <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 ml-1 tracking-widest">Estimated Duration (Days/Hours/Mins)</label>
                     <div className="flex gap-2">
                        <input type="number" name="estDays" placeholder="D" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.estimatedTime.days : 0} className="w-full p-3 rounded-lg border border-slate-200 text-center" />
                        <input type="number" name="estHours" placeholder="H" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.estimatedTime.hours : 0} className="w-full p-3 rounded-lg border border-slate-200 text-center" />
                        <input type="number" name="estMins" placeholder="M" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.estimatedTime.minutes : 0} className="w-full p-3 rounded-lg border border-slate-200 text-center" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Probable Completion</label>
                     <input type="datetime-local" name="probableCompletion" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.probableCompletion : ''} className="w-full p-4 rounded-xl border border-slate-200" required />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <select name="urgency" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.urgency : 3} className="w-full p-3 border border-slate-200 rounded-xl">
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>Urg {v}</option>)}
                  </select>
                  <select name="importance" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.importance : 3} className="w-full p-3 border border-slate-200 rounded-xl">
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>Imp {v}</option>)}
                  </select>
                  <select name="timeSaving" defaultValue={typeof showTaskForm === 'object' ? showTaskForm.timeSaving : TimeSavingPotential.NOT_MUCH} className="w-full p-3 border border-slate-200 rounded-xl text-[10px]">
                    {Object.values(TimeSavingPotential).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <label className="flex items-center gap-3 p-4 bg-red-50 rounded-xl cursor-pointer">
                  <input type="checkbox" name="isSerious" defaultChecked={typeof showTaskForm === 'object' ? showTaskForm.isSerious : false} className="w-5 h-5 text-red-600" />
                  <span className="block text-xs font-bold text-red-700 uppercase tracking-widest">Mark as Critical</span>
                </label>

                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest">SUBMIT TASK</button>
             </form>
          </div>
        </div>
      )}

      {/* Vision Modal */}
      {showVisionForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in duration-200">
             <div className="bg-blue-600 p-6 text-white flex justify-between">
               <h2 className="text-xl font-bold uppercase tracking-widest">{typeof showVisionForm === 'object' ? 'Edit Vision' : 'New Vision'}</h2>
               <button onClick={() => setShowVisionForm(false)}><Icons.Delete size={20}/></button>
             </div>
             <form onSubmit={handleVisionSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Vision Statement</label>
                  <textarea name="text" required defaultValue={typeof showVisionForm === 'object' ? showVisionForm.text : ''} placeholder="What is the grand vision?" className="w-full p-4 rounded-xl border border-slate-200 h-24" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Target Timeline</label>
                  <input type="text" name="timeline" required defaultValue={typeof showVisionForm === 'object' ? showVisionForm.timeline : ''} placeholder="e.g., Q4 2025" className="w-full p-4 rounded-xl border border-slate-200" />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest">SUBMIT VISION</button>
             </form>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in duration-200">
             <div className="bg-purple-600 p-6 text-white flex justify-between">
               <h2 className="text-xl font-bold uppercase tracking-widest">{typeof showGoalForm === 'object' ? 'Edit Goal' : 'New Goal'}</h2>
               <button onClick={() => setShowGoalForm(false)}><Icons.Delete size={20}/></button>
             </div>
             <form onSubmit={handleGoalSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Goal Heading</label>
                  <input name="title" required defaultValue={typeof showGoalForm === 'object' ? showGoalForm.title : ''} placeholder="Goal title" className="w-full p-4 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Timeline</label>
                  <input name="timeline" required defaultValue={typeof showGoalForm === 'object' ? showGoalForm.timeline : ''} placeholder="Target timeline" className="w-full p-4 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Action Plan</label>
                  <textarea name="plans" required defaultValue={typeof showGoalForm === 'object' ? showGoalForm.plans.join('\n') : ''} placeholder="Steps (one per line)" className="w-full p-4 rounded-xl border border-slate-200 h-32" />
                </div>
                <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold uppercase tracking-widest">SUBMIT GOAL</button>
             </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150">
             <div className="bg-rose-600 p-6 text-white flex justify-between">
               <h2 className="text-xl font-bold uppercase tracking-widest">{typeof showCategoryForm === 'object' ? 'Edit Category' : 'New Category'}</h2>
               <button onClick={() => setShowCategoryForm(false)}><Icons.Delete size={20}/></button>
             </div>
             <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
               <input name="name" required autoFocus defaultValue={typeof showCategoryForm === 'object' ? showCategoryForm.name : ''} placeholder="e.g. Education, Experience" className="w-full p-4 rounded-xl border border-slate-200" />
               <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold uppercase tracking-widest">SUBMIT CATEGORY</button>
             </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150">
             <div className="bg-rose-600 p-6 text-white flex justify-between">
               <h2 className="text-xl font-bold uppercase tracking-widest">{showItemForm.item ? 'Edit Item' : 'New Item'}</h2>
               <button onClick={() => setShowItemForm(null)}><Icons.Delete size={20}/></button>
             </div>
             <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
               <input name="name" required autoFocus defaultValue={showItemForm.item ? showItemForm.item.name : ''} placeholder="e.g. Master of Science" className="w-full p-4 rounded-xl border border-slate-200" />
               <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold uppercase tracking-widest">SUBMIT ITEM</button>
             </form>
          </div>
        </div>
      )}

      {/* Sub-Item Modal */}
      {showSubItemForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
             <div className="bg-indigo-600 p-6 text-white flex justify-between">
               <h2 className="text-xl font-bold uppercase tracking-widest">{showSubItemForm.subItem ? 'Edit Detail' : 'Add Detail'}</h2>
               <button onClick={() => setShowSubItemForm(null)}><Icons.Delete size={20}/></button>
             </div>
             <form onSubmit={handleSubItemSubmit} className="p-6 space-y-4">
               <input name="heading" required autoFocus defaultValue={showSubItemForm.subItem ? showSubItemForm.subItem.heading : ''} placeholder="Heading (e.g. CGPA)" className="w-full p-4 rounded-xl border border-slate-200" />
               <textarea name="value" required defaultValue={showSubItemForm.subItem ? showSubItemForm.subItem.value : ''} placeholder="The actual information..." className="w-full p-4 rounded-xl border border-slate-200 h-24" />
               <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest">SUBMIT DETAIL</button>
             </form>
          </div>
        </div>
      )}

      {showGhSettings && (
        <GitHubSettings config={ghConfig} onSave={(c) => { setGhConfig(c); setShowGhSettings(false); }} onClose={() => setShowGhSettings(false)} />
      )}
    </div>
  );
};

export default App;
