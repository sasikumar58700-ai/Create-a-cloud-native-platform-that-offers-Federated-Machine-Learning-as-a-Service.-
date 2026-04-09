import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Server, Users, Shield, Play, RotateCcw, Database, Cpu, History, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { ConfigPanel } from './components/ConfigPanel';
import { MetricsCharts } from './components/MetricsCharts';
import { NetworkDiagram } from './components/NetworkDiagram';
import { PredictionInterface } from './components/PredictionInterface';
import { LogsPanel } from './components/LogsPanel';

import { LogisticRegression, ModelWeights } from './lib/federated/model';
import { FederatedClient } from './lib/federated/client';
import { FederatedServer } from './lib/federated/server-logic';
import { generateSyntheticData, splitData } from './lib/federated/data';

export default function App() {
  // Simulation Config
  const [config, setConfig] = useState({
    numRounds: 10,
    clientFraction: 0.8,
    noiseScale: 0.01,
    localEpochs: 5,
    numClients: 5,
  });

  // Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [globalModel, setGlobalModel] = useState<LogisticRegression | null>(null);
  const [clients, setClients] = useState<FederatedClient[]>([]);
  const [activeClientIds, setActiveClientIds] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  // Refs for simulation loop
  const simulationRef = useRef<boolean>(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const initSimulation = () => {
    const numFeatures = 4;
    const dataset = generateSyntheticData(1000, numFeatures);
    const clientDatasets = splitData(dataset, config.numClients);
    
    const newClients = clientDatasets.map((data, i) => new FederatedClient(`Client-${i+1}`, data, numFeatures));
    const serverModel = new LogisticRegression(numFeatures);
    
    setClients(newClients);
    setGlobalModel(serverModel);
    setCurrentRound(0);
    setHistory([]);
    setLogs([]);
    addLog("Simulation initialized.");
    
    // Initial evaluation
    const evalResult = serverModel.evaluate(dataset.features, dataset.labels);
    setHistory([{ round: 0, ...evalResult }]);
  };

  useEffect(() => {
    initSimulation();
  }, []);

  const runRound = async (round: number, currentWeights: ModelWeights) => {
    if (!globalModel) return currentWeights;

    setIsTraining(true);
    addLog(`Starting Round ${round}...`);

    // 1. Select subset of clients
    const numToSelect = Math.max(1, Math.floor(config.numClients * config.clientFraction));
    const selectedClients = [...clients]
      .sort(() => Math.random() - 0.5)
      .slice(0, numToSelect);
    
    setActiveClientIds(selectedClients.map(c => c.id));
    addLog(`Selected ${selectedClients.length} clients for training.`);

    // 2. Local training on each selected client
    const clientUpdates: ModelWeights[] = [];
    const clientDataSizes: number[] = [];

    for (const client of selectedClients) {
      addLog(`${client.id} is training locally...`);
      const update = await client.localTrain(currentWeights, config.localEpochs, config.noiseScale);
      clientUpdates.push(update);
      clientDataSizes.push(client.getDataSize());
    }

    // 3. Server Aggregation
    addLog("Server aggregating client updates (FedAvg)...");
    const newGlobalWeights = FederatedServer.aggregate(clientUpdates, clientDataSizes);
    globalModel.setWeights(newGlobalWeights);

    // 4. Global Evaluation
    // For simulation purposes, we evaluate on the whole dataset
    const dataset = generateSyntheticData(500, 4); // New test data
    const evalResult = globalModel.evaluate(dataset.features, dataset.labels);
    
    setHistory(prev => [...prev, { round, ...evalResult }]);
    setCurrentRound(round);
    addLog(`Round ${round} complete. Accuracy: ${(evalResult.accuracy * 100).toFixed(2)}%, Loss: ${evalResult.loss.toFixed(4)}`);

    // Sync with backend
    try {
      await fetch('/api/simulation/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round,
          metrics: evalResult,
          log: `Round ${round} complete.`,
          model: { weights: [...newGlobalWeights.weights, newGlobalWeights.bias] }
        })
      });
    } catch (e) {
      console.error("Failed to sync with backend", e);
    }

    setIsTraining(false);
    setActiveClientIds([]);
    return newGlobalWeights;
  };

  const startSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    simulationRef.current = true;

    try {
      await fetch('/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch (e) {}

    let currentWeights = globalModel!.getWeights();
    for (let r = currentRound + 1; r <= config.numRounds; r++) {
      if (!simulationRef.current) break;
      currentWeights = await runRound(r, currentWeights);
      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
    simulationRef.current = false;
    addLog("Simulation finished.");
  };

  const stopSimulation = () => {
    simulationRef.current = false;
    setIsRunning(false);
    addLog("Simulation stopping...");
  };

  const resetSimulation = () => {
    stopSimulation();
    initSimulation();
  };

  const latestMetrics = history[history.length - 1] || { accuracy: 0, loss: 0 };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Fed ML</h1>
              <p className="text-xs text-zinc-500 font-mono">v1.0.4 // CLOUD-NATIVE SIMULATOR</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono">
              {isRunning ? "● SIMULATING" : "○ IDLE"}
            </Badge>
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <Button 
                  onClick={startSimulation} 
                  className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20"
                >
                  <Play className="w-4 h-4 mr-2" /> Start Simulation
                </Button>
              ) : (
                <Button 
                  onClick={stopSimulation} 
                  variant="destructive"
                  className="shadow-lg shadow-red-900/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Stop
                </Button>
              )}
              <Button onClick={resetSimulation} variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        {/* Left Column: Config & Status */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <ConfigPanel config={config} setConfig={setConfig} disabled={isRunning} />
          
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> PRIVACY PROTOCOL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Data never leaves the client. Only model updates (weights/gradients) are shared with the central server.
              </p>
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                  <span>NOISE SCALE</span>
                  <span>{config.noiseScale.toFixed(3)}</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${config.noiseScale * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-500" /> SYSTEM LOGS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <LogsPanel logs={logs} />
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Visualizer & Charts */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard 
              title="Accuracy" 
              value={`${(latestMetrics.accuracy * 100).toFixed(1)}%`} 
              icon={<Activity className="w-4 h-4" />}
              trend={history.length > 1 ? latestMetrics.accuracy - history[history.length-2].accuracy : 0}
            />
            <MetricCard 
              title="Loss" 
              value={latestMetrics.loss.toFixed(3)} 
              icon={<Database className="w-4 h-4" />}
              trend={history.length > 1 ? history[history.length-2].loss - latestMetrics.loss : 0}
            />
            <MetricCard 
              title="Round" 
              value={`${currentRound}/${config.numRounds}`} 
              icon={<Server className="w-4 h-4" />}
            />
          </div>

          <Card className="bg-zinc-900 border-zinc-800 shadow-xl min-h-[400px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Network Topology</CardTitle>
                <CardDescription>Real-time data flow visualization</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                  {config.numClients} Clients
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 relative">
              <NetworkDiagram 
                numClients={config.numClients} 
                activeClientIds={activeClientIds} 
                isTraining={isTraining}
              />
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Training Performance</CardTitle>
              <CardDescription>Accuracy and Loss over rounds</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsCharts data={history} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Deployment & History */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Tabs defaultValue="predict" className="w-full">
            <TabsList className="w-full bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="predict" className="flex-1">Predict</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">Versions</TabsTrigger>
            </TabsList>
            <TabsContent value="predict">
              <PredictionInterface globalModel={globalModel} />
            </TabsContent>
            <TabsContent value="history">
              <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-500" /> VERSION HISTORY
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-3">
                      {history.slice().reverse().map((h, i) => (
                        <div key={i} className="p-3 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold">v1.0.{history.length - i}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">ROUND {h.round}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-blue-500 font-bold">{(h.accuracy * 100).toFixed(1)}%</div>
                            <div className="text-[10px] text-zinc-500">ACCURACY</div>
                          </div>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <div className="text-center py-8 text-zinc-600 text-sm italic">
                          No models trained yet.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> CLIENT STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clients.map((client, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${activeClientIds.includes(client.id) ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`} />
                    <span className="text-xs font-medium">{client.id}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">
                    {client.getDataSize()} samples
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: number }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/20 group-hover:bg-blue-500/50 transition-colors" />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{title}</span>
          <div className="text-blue-500/30 group-hover:text-blue-500/60 transition-colors">{icon}</div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold tracking-tight font-mono">{value}</div>
          {trend !== undefined && trend !== 0 && (
            <div className={`text-[10px] font-bold font-mono flex items-center gap-0.5 ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend > 0 ? <Activity className="w-3 h-3" /> : <Activity className="w-3 h-3 rotate-180" />}
              {Math.abs(trend * 100).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-2 h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500/20"
            initial={{ width: "30%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
