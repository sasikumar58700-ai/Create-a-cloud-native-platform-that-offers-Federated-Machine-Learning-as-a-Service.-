import React, { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogsPanelProps {
  logs: string[];
}

export function LogsPanel({ logs }: LogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs]);

  return (
    <ScrollArea ref={scrollRef} className="h-[200px] w-full bg-zinc-950 font-mono text-[10px]">
      <div className="p-3 space-y-1">
        {logs.map((log, i) => {
          const isRound = log.includes("Starting Round") || log.includes("Round complete");
          const isError = log.toLowerCase().includes("error") || log.toLowerCase().includes("fail");
          
          return (
            <div 
              key={i} 
              className={`
                ${isRound ? 'text-blue-400 font-bold' : 'text-zinc-500'}
                ${isError ? 'text-red-400' : ''}
                border-l-2 pl-2 border-zinc-800
              `}
            >
              {log}
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="text-zinc-700 italic">Waiting for simulation...</div>
        )}
      </div>
    </ScrollArea>
  );
}
