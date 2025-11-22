import React from "react";
import { useState } from "react";
import { AgentCard } from "./components/AgentCard";
import { ChatInterface } from "./components/ChatInterface";
import { AgentInput } from "./components/AgentInput";

export interface Agent {
  id: string;
  name: string;
  url: string;
  avatar?: string;
  metadata: Record<string, string>;
}

export interface Message {
  id: string;
  sender: "user" | "agent";
  content: string;
  timestamp: Date;
  chunkMetadata?: {
    messageId?: string;
    artifactId?: string;
    contextId?: string;
    taskId?: string;
    state?: string;
    final?: boolean;
    kind?: string;
    rawData?: any;
  };
}

export default function App() {
  const [agent, setAgent] = useState<any>(null);
  const [agentUrl, setAgentUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);

  const handleAgentSubmit = async (
    url: string,
    formMetadata: Record<string, string>
  ) => {
    // Store metadata separately for different use
    setMetadata(formMetadata);
    setAgentUrl(url);
    try {
      const backendUrl = "http://127.0.0.1:8000/agent-card";
      const encodedUrl = encodeURIComponent(url);
      const apiUrl = `${backendUrl}?url=${encodedUrl}`;

      console.log("Fetching agent card from:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          status: response.status,
          statusText: response.statusText,
        }));
        console.error(
          "Error response JSON:",
          JSON.stringify(errorData, null, 2)
        );
        throw new Error(JSON.stringify(errorData, null, 2));
      }

      const jsonData = await response.json();

      console.log("Agent card JSON response:", jsonData);
      console.log(JSON.stringify(jsonData, null, 2));

      setAgent(jsonData);
    } catch (error) {
      const errorJson =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { error: String(error) };
      console.error(
        "Error fetching agent card:",
        JSON.stringify(errorJson, null, 2)
      );
    }
  };

  const extractMessageContent = (responseData: any): string => {
    // Try to extract message content from various possible response structures
    if (typeof responseData === "string") {
      return responseData;
    }

    // Check for message.parts array (A2A format)
    if (responseData?.message?.parts) {
      return responseData.message.parts
        .map((part: any) => part.text || "")
        .join("");
    }

    // Check for direct text field
    if (responseData?.text) {
      return responseData.text;
    }

    // Check for content field
    if (responseData?.content) {
      return responseData.content;
    }

    // Check for message field
    if (responseData?.message) {
      if (typeof responseData.message === "string") {
        return responseData.message;
      }
      if (responseData.message.text) {
        return responseData.message.text;
      }
    }

    // Fallback: stringify the response
    return JSON.stringify(responseData, null, 2);
  };

  const handleSendMessage = async (content: string) => {
    if (!agentUrl) {
      console.error("No agent URL set. Please fetch an agent card first.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const backendUrl = "http://127.0.0.1:8000/chat";

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: content,
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          status: response.status,
          statusText: response.statusText,
        }));
        throw new Error(JSON.stringify(errorData, null, 2));
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response - accumulate chunks by messageId
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        // Track messages by messageId to accumulate chunks
        const messageMap = new Map<string, Message>();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const result = data?.result;
                  const status = result?.status;
                  const message = status?.message;
                  const artifact = result?.artifact;

                  // Handle status-update chunks with message parts
                  if (message?.parts) {
                    const textParts = message.parts
                      .filter((part: any) => part.kind === "text" && part.text)
                      .map((part: any) => part.text);

                    if (textParts.length > 0) {
                      const chunkText = textParts.join("");
                      const messageId =
                        message.messageId || `${Date.now()}-${Math.random()}`;

                      // Get or create message for this messageId
                      let existingMessage = messageMap.get(messageId);

                      if (existingMessage) {
                        // Accumulate text for existing message and update state
                        const updatedMessage: Message = {
                          ...existingMessage,
                          content: existingMessage.content + chunkText,
                          chunkMetadata: {
                            ...existingMessage.chunkMetadata,
                            messageId: message.messageId,
                            contextId: result?.contextId || message.contextId,
                            taskId: result?.taskId || message.taskId,
                            state: status?.state,
                            final: result?.final,
                            kind: result?.kind,
                            rawData: data,
                          },
                          timestamp: status?.timestamp
                            ? new Date(status.timestamp)
                            : existingMessage.timestamp,
                        };
                        messageMap.set(messageId, updatedMessage);
                        // Update state to trigger re-render
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === messageId ? updatedMessage : msg
                          )
                        );
                      } else {
                        // Create new message
                        const chunkMetadata = {
                          messageId: message.messageId,
                          contextId: result?.contextId || message.contextId,
                          taskId: result?.taskId || message.taskId,
                          state: status?.state,
                          final: result?.final,
                          kind: result?.kind,
                          rawData: data,
                        };

                        const chunkTimestamp = status?.timestamp
                          ? new Date(status.timestamp)
                          : new Date();

                        existingMessage = {
                          id: messageId,
                          sender: "agent",
                          content: chunkText,
                          timestamp: chunkTimestamp,
                          chunkMetadata,
                        };
                        messageMap.set(messageId, existingMessage);
                        // Add to messages list
                        setMessages((prev) => [...prev, existingMessage!]);
                      }
                    }
                  }
                  // Handle artifact-update chunks
                  else if (artifact?.parts) {
                    const textParts = artifact.parts
                      .filter((part: any) => part.kind === "text" && part.text)
                      .map((part: any) => part.text);

                    if (textParts.length > 0) {
                      const artifactText = textParts.join("");
                      const artifactId =
                        artifact.artifactId || `artifact-${Date.now()}`;

                      // Get or create message for this artifact
                      let existingMessage = messageMap.get(artifactId);

                      if (existingMessage) {
                        // Update content (artifact updates might be cumulative) and update state
                        const updatedMessage: Message = {
                          ...existingMessage,
                          content: artifactText,
                          chunkMetadata: {
                            ...existingMessage.chunkMetadata,
                            artifactId: artifact.artifactId,
                            contextId: result?.contextId,
                            taskId: result?.taskId,
                            kind: result?.kind,
                            rawData: data,
                          },
                        };
                        messageMap.set(artifactId, updatedMessage);
                        // Update state to trigger re-render
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === artifactId ? updatedMessage : msg
                          )
                        );
                      } else {
                        const chunkMetadata = {
                          artifactId: artifact.artifactId,
                          contextId: result?.contextId,
                          taskId: result?.taskId,
                          kind: result?.kind,
                          rawData: data,
                        };

                        existingMessage = {
                          id: artifactId,
                          sender: "agent",
                          content: artifactText,
                          timestamp: new Date(),
                          chunkMetadata,
                        };
                        messageMap.set(artifactId, existingMessage);
                        setMessages((prev) => [...prev, existingMessage!]);
                      }
                    }
                  }
                  // Handle final status updates (completed state)
                  else if (
                    result?.kind === "status-update" &&
                    status?.state === "completed"
                  ) {
                    const taskId = result?.taskId;
                    if (taskId) {
                      // Find the last message for this task and mark it as final
                      setMessages((prev) =>
                        prev.map((msg) => {
                          if (
                            msg.chunkMetadata?.taskId === taskId &&
                            msg.sender === "agent"
                          ) {
                            return {
                              ...msg,
                              chunkMetadata: {
                                ...msg.chunkMetadata,
                                state: "completed",
                                final: true,
                                rawData: data,
                              },
                            };
                          }
                          return msg;
                        })
                      );
                    }
                  }
                } catch (e) {
                  console.error("Error parsing SSE data:", e, line);
                }
              }
            }
          }
        }
      } else {
        // Handle non-streaming response
        const jsonData = await response.json();
        const messageContent = extractMessageContent(jsonData);

        const agentMessage: Message = {
          id: Date.now().toString(),
          sender: "agent",
          content: messageContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Create an error message
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: "agent",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);

      console.error("Error sending message:", error);
    }
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
            <div className="bg-slate-900 rounded-lg border border-slate-800 flex flex-col h-[500px]">
              <div className="px-6 py-4 border-b border-slate-800">
                <h3 className="text-slate-50">Agent JSON</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 overflow-y-auto">
                  <pre className="text-slate-300 text-sm whitespace-pre overflow-x-auto">
                    <code>{JSON.stringify(agent, null, 2)}</code>
                  </pre>
                </div>
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
