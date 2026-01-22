
import React from 'react';
import { Task } from '../types';
import { Icons } from '../constants';
import { isBefore, addHours, parseISO } from 'date-fns';

interface Props {
  tasks: Task[];
}

export const NotificationPanel: React.FC<Props> = ({ tasks }) => {
  const now = new Date();
  const upcomingTasks = tasks
    .filter(t => t.status === 'pending')
    .filter(t => {
      const deadline = new Date(t.deadline);
      const isSoon = isBefore(deadline, addHours(now, 24));
      return isSoon || t.isSerious;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div className="w-full h-full glass border-l border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icons.Notification className="text-indigo-500" size={20} />
          Pulse Notifications
        </h2>
        <p className="text-sm text-slate-500 mt-1">Focus on what matters most, Manish.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {upcomingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 p-4">
            <Icons.Check className="opacity-20 mb-3" size={48} />
            <p className="text-sm">You're all clear for the next 24 hours!</p>
          </div>
        ) : (
          upcomingTasks.map(task => (
            <div key={task.id} className={`p-4 rounded-xl border-l-4 transition-all ${task.isSerious ? 'bg-red-50 border-red-500' : 'bg-indigo-50 border-indigo-500'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${task.isSerious ? 'text-red-600' : 'text-indigo-600'}`}>
                  {task.isSerious ? 'Critical Task' : 'Starting Soon'}
                </span>
                {task.isSerious && <Icons.Urgent size={14} className="text-red-600 animate-bounce" />}
              </div>
              <h3 className="font-bold text-slate-900 leading-tight mb-2">{task.title}</h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Icons.Time size={12} />
                By: {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-900 text-white rounded-t-3xl mt-auto">
        <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Daily Mantra</h4>
        <p className="text-sm italic opacity-80">"Efficiency is doing things right; effectiveness is doing the right things."</p>
      </div>
    </div>
  );
};
