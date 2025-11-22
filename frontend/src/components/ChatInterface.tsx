import React from "react";
import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, ChevronUp, Code2 } from "lucide-react";
import { Agent, Message } from "../App";

interface ChatInterfaceProps {
  agent: Agent;
  messages: Message[];
  onSendMessage: (message: string) => void;
}

export function ChatInterface({
  agent,
  messages,
  onSendMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);

  const scrollToBottom = () => {
    // Scroll only the messages container, not the entire page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Only scroll if a new message was added (count increased)
    // Don't scroll if just updating existing messages (count stays same)
    const currentCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    if (currentCount > previousCount) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }

    previousMessageCountRef.current = currentCount;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(date);
  };

  const ChunkMessage = ({ message }: { message: Message }) => {
    const [showMetadata, setShowMetadata] = useState(false);
    const [showRawData, setShowRawData] = useState(false);
    const metadata = message.chunkMetadata;

    if (!metadata) {
      // Regular message without chunk metadata
      return (
        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-slate-800 text-slate-100 border border-slate-700">
          <p className="break-words">{message.content}</p>
          <p className="mt-1 text-slate-500 text-xs">
            {formatTime(message.timestamp)}
          </p>
        </div>
      );
    }

    const getStateColor = (state?: string) => {
      switch (state) {
        case "working":
          return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        case "complete":
          return "bg-green-500/20 text-green-400 border-green-500/30";
        case "error":
          return "bg-red-500/20 text-red-400 border-red-500/30";
        default:
          return "bg-slate-700 text-slate-300 border-slate-600";
      }
    };

    return (
      <div className="max-w-[90%] rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
        {/* Main content */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="break-words text-slate-100 flex-1">
              {message.content}
            </p>
            {metadata.state && (
              <span
                className={`px-2 py-1 rounded text-xs font-medium border ${getStateColor(
                  metadata.state
                )}`}
              >
                {metadata.state}
              </span>
            )}
          </div>

          {/* Metadata bar */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-400">
              {formatTimestamp(message.timestamp)}
            </span>
            {metadata.final !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  metadata.final
                    ? "bg-green-500/20 text-green-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {metadata.final ? "Final" : "Streaming"}
              </span>
            )}
            {metadata.kind && (
              <span className="text-xs text-slate-500">{metadata.kind}</span>
            )}
          </div>
        </div>

        {/* Collapsible metadata section */}
        {(metadata.messageId ||
          metadata.artifactId ||
          metadata.contextId ||
          metadata.taskId) && (
          <div className="border-t border-slate-700">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Metadata
              </span>
              {showMetadata ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showMetadata && (
              <div className="px-4 pb-3 space-y-2 text-xs">
                {metadata.messageId && (
                  <div className="flex gap-2">
                    <span className="text-slate-500 min-w-[80px]">
                      Message ID:
                    </span>
                    <span className="text-slate-300 font-mono break-all">
                      {metadata.messageId}
                    </span>
                  </div>
                )}
                {metadata.artifactId && (
                  <div className="flex gap-2">
                    <span className="text-slate-500 min-w-[80px]">
                      Artifact ID:
                    </span>
                    <span className="text-slate-300 font-mono break-all">
                      {metadata.artifactId}
                    </span>
                  </div>
                )}
                {metadata.contextId && (
                  <div className="flex gap-2">
                    <span className="text-slate-500 min-w-[80px]">
                      Context ID:
                    </span>
                    <span className="text-slate-300 font-mono break-all">
                      {metadata.contextId}
                    </span>
                  </div>
                )}
                {metadata.taskId && (
                  <div className="flex gap-2">
                    <span className="text-slate-500 min-w-[80px]">
                      Task ID:
                    </span>
                    <span className="text-slate-300 font-mono break-all">
                      {metadata.taskId}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsible raw data section */}
        {metadata.rawData && (
          <div className="border-t border-slate-700">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Raw JSON
              </span>
              {showRawData ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showRawData && (
              <div className="px-4 pb-3">
                <pre className="text-xs bg-slate-950 rounded p-3 overflow-x-auto border border-slate-700">
                  <code className="text-slate-300">
                    {JSON.stringify(metadata.rawData, null, 2)}
                  </code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800">
        <h3 className="text-slate-50">Chat with {agent.name}</h3>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.sender === "user" ? (
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-blue-600 text-white">
                <p className="break-words">{message.content}</p>
                <p className="mt-1 text-blue-200 text-xs">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            ) : (
              <ChunkMessage message={message} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-6 py-4 border-t border-slate-800 bg-slate-900"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>Send</span>
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
