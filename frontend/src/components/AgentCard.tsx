import React from 'react';
import { Activity, Circle } from 'lucide-react';
import { Agent } from '../App';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    offline: 'bg-slate-400',
  };

  const statusTextColors = {
    active: 'text-green-700',
    idle: 'text-yellow-700',
    offline: 'text-slate-700',
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-slate-50">{agent.name}</h3>
          </div>
        </div>
      </div>


        {Object.keys(agent.metadata).length > 0 && (
          <div>
            <p className="text-slate-300 mb-2">Metadata</p>
            <div className="space-y-2">
              {Object.entries(agent.metadata).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <span className="text-slate-400">{key}</span>
                  <span className="text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400">Agent ID</p>
              <p className="text-slate-200">{agent.id}</p>
            </div>
          </div>
        </div>
      </div>
  );
}