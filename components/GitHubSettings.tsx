
import React, { useState } from 'react';
import { GitHubConfig } from '../types';
import { Icons } from '../constants';

interface Props {
  config: GitHubConfig;
  onSave: (config: GitHubConfig) => void;
  onClose: () => void;
}

export const GitHubSettings: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icons.GitHub size={24} />
            GitHub Persistence Storage
          </h2>
          <p className="text-sm opacity-90 mt-1">Stored securely in your private repository.</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token</label>
            <input 
              type="password" 
              value={localConfig.token}
              onChange={e => setLocalConfig({...localConfig, token: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder="ghp_..."
            />
            <p className="text-[10px] text-slate-400 mt-1">Requires 'repo' scope.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GitHub Username</label>
              <input 
                type="text" 
                value={localConfig.owner}
                onChange={e => setLocalConfig({...localConfig, owner: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="manish-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Repo Name</label>
              <input 
                type="text" 
                value={localConfig.repo}
                onChange={e => setLocalConfig({...localConfig, repo: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="todo-storage"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Storage Path</label>
            <input 
              type="text" 
              value={localConfig.path}
              onChange={e => setLocalConfig({...localConfig, path: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder="data.json"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(localConfig)}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-100"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
