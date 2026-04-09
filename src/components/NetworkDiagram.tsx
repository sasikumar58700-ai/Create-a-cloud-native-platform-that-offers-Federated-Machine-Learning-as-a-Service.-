import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Server, Smartphone } from "lucide-react";

interface NetworkDiagramProps {
  numClients: number;
  activeClientIds: string[];
  isTraining: boolean;
}

export function NetworkDiagram({ numClients, activeClientIds, isTraining }: NetworkDiagramProps) {
  const radius = 120;
  const centerX = 200;
  const centerY = 180;

  const clients = Array.from({ length: numClients }).map((_, i) => {
    const angle = (i / numClients) * 2 * Math.PI - Math.PI / 2;
    return {
      id: `Client-${i + 1}`,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 400 360" className="w-full h-full max-w-[500px]">
        {/* Connection Lines */}
        {clients.map((client) => {
          const isActive = activeClientIds.includes(client.id);
          return (
            <g key={`link-${client.id}`}>
              <line
                x1={centerX}
                y1={centerY}
                x2={client.x}
                y2={client.y}
                stroke={isActive ? "#3b82f6" : "#27272a"}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? "none" : "4 4"}
                className="transition-colors duration-500"
              />
              
              {/* Data Flow Animation */}
              <AnimatePresence>
                {isActive && isTraining && (
                  <>
                    {/* Weights to Client */}
                    <motion.circle
                      r="3"
                      fill="#3b82f6"
                      initial={{ cx: centerX, cy: centerY }}
                      animate={{ cx: client.x, cy: client.y }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Updates to Server */}
                    <motion.circle
                      r="2"
                      fill="#3b82f6"
                      initial={{ cx: client.x, cy: client.y }}
                      animate={{ cx: centerX, cy: centerY }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    />
                  </>
                )}
              </AnimatePresence>
            </g>
          );
        })}

        {/* Server Node */}
        <g transform={`translate(${centerX - 25}, ${centerY - 25})`}>
          <motion.rect
            width="50"
            height="50"
            rx="10"
            fill="#18181b"
            stroke="#3b82f6"
            strokeWidth="2"
            animate={{ 
              boxShadow: isTraining ? "0 0 20px rgba(59, 130, 246, 0.4)" : "none",
              scale: isTraining ? [1, 1.05, 1] : 1
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <foreignObject width="50" height="50">
            <div className="w-full h-full flex items-center justify-center">
              <Server className="text-blue-500 w-6 h-6" />
            </div>
          </foreignObject>
          <text x="25" y="65" textAnchor="middle" className="fill-zinc-400 text-[10px] font-mono">AGGREGATOR</text>
        </g>

        {/* Client Nodes */}
        {clients.map((client) => {
          const isActive = activeClientIds.includes(client.id);
          return (
            <g key={client.id} transform={`translate(${client.x - 20}, ${client.y - 20})`}>
              <motion.rect
                width="40"
                height="40"
                rx="8"
                fill="#18181b"
                stroke={isActive ? "#3b82f6" : "#27272a"}
                strokeWidth="2"
                animate={{ 
                  scale: isActive ? [1, 1.1, 1] : 1,
                  opacity: isActive ? 1 : 0.6
                }}
                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
              />
              <foreignObject width="40" height="40">
                <div className="w-full h-full flex items-center justify-center">
                  <Smartphone className={`${isActive ? 'text-blue-500' : 'text-zinc-600'} w-5 h-5 transition-colors`} />
                </div>
              </foreignObject>
              <text x="20" y="52" textAnchor="middle" className="fill-zinc-500 text-[8px] font-mono">{client.id}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
