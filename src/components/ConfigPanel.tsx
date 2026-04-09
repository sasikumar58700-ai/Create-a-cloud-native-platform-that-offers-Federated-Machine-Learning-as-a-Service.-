import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Settings2, 
  Repeat, 
  Users, 
  Zap, 
  Waves, 
  Info,
  ZapOff,
  ShieldCheck,
  Activity
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConfigPanelProps {
  config: any;
  setConfig: (config: any) => void;
  disabled: boolean;
}

const PRESETS = [
  {
    name: "Balanced",
    icon: <Activity className="w-3 h-3" />,
    values: { numRounds: 10, clientFraction: 0.8, localEpochs: 5, noiseScale: 0.01 }
  },
  {
    name: "High Privacy",
    icon: <ShieldCheck className="w-3 h-3" />,
    values: { numRounds: 20, clientFraction: 0.5, localEpochs: 3, noiseScale: 0.05 }
  },
  {
    name: "Fast Train",
    icon: <Zap className="w-3 h-3" />,
    values: { numRounds: 5, clientFraction: 1.0, localEpochs: 10, noiseScale: 0.001 }
  }
];

export function ConfigPanel({ config, setConfig, disabled }: ConfigPanelProps) {
  const updateConfig = (key: string, value: number | number[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    setConfig({ ...config, [key]: val });
  };

  const applyPreset = (presetValues: any) => {
    setConfig({ ...config, ...presetValues });
  };

  return (
    <TooltipProvider>
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-t-blue-500/50 border-t-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-500" /> SIMULATION CONFIG
            </CardTitle>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Manual Override
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => applyPreset(preset.values)}
                  className={`h-7 text-[10px] px-2 border-zinc-800 hover:bg-zinc-800 hover:text-blue-400 transition-all ${
                    Object.entries(preset.values).every(([k, v]) => config[k] === v)
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                      : 'bg-zinc-950'
                  }`}
                >
                  {preset.icon}
                  <span className="ml-1 hidden sm:inline">{preset.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="h-px bg-zinc-800/50" />

          {/* Rounds */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Repeat className="w-3 h-3 text-zinc-500" />
                <Label className="text-xs text-zinc-300">Total Rounds</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-zinc-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-950 border-zinc-800 text-[10px] max-w-[200px]">
                    Number of global aggregation cycles. More rounds usually lead to better convergence.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{config.numRounds}</span>
            </div>
            <Slider 
              value={[config.numRounds]} 
              onValueChange={(v: number[]) => updateConfig('numRounds', v)}
              min={1} max={50} step={1}
              disabled={disabled}
              className="[&_[role=slider]]:bg-blue-500"
            />
          </div>

          {/* Client Fraction */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-zinc-500" />
                <Label className="text-xs text-zinc-300">Client Fraction</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-zinc-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-950 border-zinc-800 text-[10px] max-w-[200px]">
                    Percentage of clients participating in each round. Higher values speed up learning but increase server load.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{Math.round(config.clientFraction * 100)}%</span>
            </div>
            <Slider 
              value={[config.clientFraction]} 
              onValueChange={(v: number[]) => updateConfig('clientFraction', v)}
              min={0.1} max={1} step={0.1}
              disabled={disabled}
            />
          </div>

          {/* Local Epochs */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-zinc-500" />
                <Label className="text-xs text-zinc-300">Local Epochs</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-zinc-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-950 border-zinc-800 text-[10px] max-w-[200px]">
                    Number of training passes each client performs locally before sending updates.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{config.localEpochs}</span>
            </div>
            <Slider 
              value={[config.localEpochs]} 
              onValueChange={(v: number[]) => updateConfig('localEpochs', v)}
              min={1} max={20} step={1}
              disabled={disabled}
            />
          </div>

          {/* Noise Scale */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Waves className="w-3 h-3 text-zinc-500" />
                <Label className="text-xs text-zinc-300">Noise Scale (DP)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-zinc-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-950 border-zinc-800 text-[10px] max-w-[200px]">
                    Differential Privacy noise added to updates. Higher values protect privacy but reduce accuracy.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{config.noiseScale.toFixed(3)}</span>
            </div>
            <Slider 
              value={[config.noiseScale]} 
              onValueChange={(v: number[]) => updateConfig('noiseScale', v)}
              min={0} max={0.1} step={0.001}
              disabled={disabled}
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 p-2 bg-blue-500/5 rounded border border-blue-500/10">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <p className="text-[9px] text-zinc-500 leading-tight">
                Settings are locked during active simulation to ensure protocol consistency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
