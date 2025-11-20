import React from "react";
import { Activity } from "lucide-react";

interface AgentCardProps {
  agent: any;
  metadata?: Record<string, string>;
}

export function AgentCard({ agent, metadata = {} }: AgentCardProps) {
  const hasMetadata = Object.keys(metadata).length > 0;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-slate-50 truncate">
              {agent.name || "Unknown Agent"}
            </h3>
          </div>
        </div>
      </div>

      {hasMetadata && (
        <div className="overflow-hidden">
          <p className="text-slate-300 mb-2">Metadata</p>
          <div className="space-y-2">
            {Object.entries(metadata).map(([key, value]) => (
              <div
                key={key}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
              >
                <div className="flex items-start gap-2 min-w-0 w-full">
                  <span className="text-slate-400 flex-shrink-0 whitespace-nowrap">
                    {key}:
                  </span>
                  <span
                    className="text-slate-200 block flex-1 min-w-0 max-w-full break-all whitespace-pre-wrap"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {String(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {agent.url && (
        <div className="pt-3 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400">Agent URL</p>
              <p className="text-slate-200">{agent.url}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
