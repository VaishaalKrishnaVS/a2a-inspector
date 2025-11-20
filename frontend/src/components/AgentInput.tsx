import React from 'react';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Agent } from '../App';

interface AgentInputProps {
  onSubmit: (agent: Agent) => void;
}

export function AgentInput({ onSubmit }: AgentInputProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');
  const [metadata, setMetadata] = useState<{ [key: string]: string }>({});

  const handleAddMetadata = () => {
    if (metadataKey.trim() && metadataValue.trim() && !metadata[metadataKey.trim()]) {
      setMetadata({ ...metadata, [metadataKey.trim()]: metadataValue.trim() });
      setMetadataKey('');
      setMetadataValue('');
    }
  };

  const handleRemoveMetadata = (key: string) => {
    const newMetadata = { ...metadata };
    delete newMetadata[key];
    setMetadata(newMetadata);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && url) {
      const agent: Agent = {
        id: Date.now().toString(),
        name,
        url,
        metadata,
      };
      onSubmit(agent);
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <h2 className="text-slate-50 mb-4">Configure Agent</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-slate-300 mb-2">
            Agent Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., DataProcessor-01"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            required
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-slate-300 mb-2">
            Agent URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g., http://localhost:3001"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 mb-2">
            Metadata
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={metadataKey}
                onChange={(e) => setMetadataKey(e.target.value)}
                placeholder="Key"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
              <input
                type="text"
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
                placeholder="Value"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMetadata();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddMetadata}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {Object.keys(metadata).length > 0 && (
              <div className="space-y-2 mt-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-slate-200">{value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMetadata(key)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Agent
        </button>
      </form>
    </div>
  );
}