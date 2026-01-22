import React from 'react';
import { Task, TimeSavingPotential } from '../types';
import { Icons } from '../constants';
import { formatDistanceToNow, isBefore, addDays } from 'date-fns';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export const TaskCard: React.FC<Props> = ({ task, onToggle, onDelete, onEdit, onUpdate }) => {
  const isApproaching = isBefore(new Date(task.deadline), addDays(new Date(), 2));
  const isOverdue = isBefore(new Date(task.deadline), new Date()) && task.status === 'pending';

  const savingColor = {
    [TimeSavingPotential.VERY_MUCH]: 'text-green-600 bg-green-50',
    [TimeSavingPotential.NOT_MUCH]: 'text-amber-600 bg-amber-50',
    [TimeSavingPotential.MAY_NOT_SAVE]: 'text-slate-500 bg-slate-50',
  }[task.timeSaving];

  const formatEstTime = (t: Task['estimatedTime']) => {
    const parts = [];
    if (t.days > 0) parts.push(`${t.days}d`);
    if (t.hours > 0) parts.push(`${t.hours}h`);
    if (t.minutes > 0) parts.push(`${t.minutes}m`);
    return parts.length > 0 ? parts.join(' ') : '0m';
  };

  return (
    <div className={`group relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md ${task.isSerious && task.status === 'pending' ? 'ring-2 ring-red-400 serious-pulse' : ''}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
        >
          {task.status === 'completed' ? <Icons.Check size={24} /> : <Icons.Pending size={24} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">{task.category}</span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={() => onEdit(task)}
                className="text-slate-400 hover:text-indigo-500"
              >
                <Icons.Edit size={18} />
              </button>
               <button 
                onClick={() => onDelete(task.id)}
                className="text-slate-400 hover:text-red-500"
              >
                <Icons.Delete size={18} />
              </button>
            </div>
          </div>
          
          <h3 className={`text-lg font-semibold leading-snug truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </h3>

          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600">
              <Icons.Calendar size={12} />
              {new Date(task.deadline).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600">
              <Icons.Time size={12} />
              Est: {formatEstTime(task.estimatedTime)}
            </div>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium ${savingColor}`}>
              <Icons.Saving size={12} />
              {task.timeSaving}
            </div>
          </div>

          {task.status === 'pending' && (
            <div className={`mt-3 text-xs font-medium ${isOverdue ? 'text-red-500' : isApproaching ? 'text-amber-500' : 'text-slate-400'}`}>
              {isOverdue ? 'OVERDUE' : `Deadline in ${formatDistanceToNow(new Date(task.deadline))}`}
            </div>
          )}

          {task.status === 'completed' && (
            <div className="mt-4 pt-4 border-t border-slate-50">
               <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Actual Time Taken (hrs)</label>
               <input 
                type="number"
                placeholder="Actual hrs"
                defaultValue={task.actualTimeTaken}
                onBlur={(e) => onUpdate(task.id, { actualTimeTaken: parseFloat(e.target.value) })}
                className="w-24 px-2 py-1 text-sm border border-slate-200 rounded-md"
               />
            </div>
          )}
        </div>
      </div>
      <div className="absolute top-0 right-0 h-full w-1 rounded-r-2xl bg-gradient-to-b from-indigo-500 to-purple-500 opacity-20"></div>
    </div>
  );
};