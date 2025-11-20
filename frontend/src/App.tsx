import React from 'react'
import { useState } from 'react';
import { AgentCard } from './components/AgentCard';
import { ChatInterface } from './components/ChatInterface';
import { AgentInput } from './components/AgentInput';

export interface Agent {
  id: string;
  name: string;
  url: string;
  avatar?: string;
  metadata: Record<string, string>;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [agent, setAgent] = useState<any>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);

  const handleAgentSubmit = async (url: string, formMetadata: Record<string, string>) => {
    // Store metadata separately for different use
    setMetadata(formMetadata);
    try {
      const backendUrl = 'http://127.0.0.1:8000/agent-card';
      const encodedUrl = encodeURIComponent(url);
      const apiUrl = `${backendUrl}?url=${encodedUrl}`;
      
      console.log('Fetching agent card from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          status: response.status, 
          statusText: response.statusText 
        }));
        console.error('Error response JSON:', JSON.stringify(errorData, null, 2));
        throw new Error(JSON.stringify(errorData, null, 2));
      }
      
      const jsonData = await response.json();
      
      console.log('Agent card JSON response:', jsonData);
      console.log(JSON.stringify(jsonData, null, 2));
      
      setAgent(jsonData);
    } catch (error) {
      const errorJson = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : { error: String(error) };
      console.error('Error fetching agent card:', JSON.stringify(errorJson, null, 2));
    }
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        content: generateAgentResponse(content, agent),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    }, 1000);
  };

  const generateAgentResponse = (userMessage: string, agent: any): string => {
    if (!agent) return "I'm not sure how to respond to that.";

    const lowerMessage = userMessage.toLowerCase();
    const agentName = agent.name || 'Agent';

    return `As a ${agentName}, I'm processing your request about "${userMessage}". How else can I assist you?`;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-slate-50 mb-2">A2A Inspector</h1>
          <p className="text-slate-400">
            Configure and interact with agents in real-time
          </p>
        </header>

        {/* Top Section - Agent Configuration & Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AgentInput onSubmit={handleAgentSubmit} />
          {agent && <AgentCard agent={agent} metadata={metadata} />}
        </div>

        {/* Bottom Section - JSON Display & Chat Interface */}
        {agent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - JSON Display */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-slate-50 mb-4">Agent JSON</h3>
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 overflow-x-auto">
                <pre className="text-slate-300">
                  <code>{JSON.stringify(agent, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Right - Chat Interface */}
            <ChatInterface
              agent={agent}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}

      </div>
    </div>
  );
}
