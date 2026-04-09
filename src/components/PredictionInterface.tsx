import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Cpu, Info } from "lucide-react";
import { LogisticRegression } from '../lib/federated/model';

interface PredictionInterfaceProps {
  globalModel: LogisticRegression | null;
}

export function PredictionInterface({ globalModel }: PredictionInterfaceProps) {
  const [features, setFeatures] = useState<string>("5.1, 3.5, 1.4, 0.2");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!globalModel) return;
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const featureArray = features.split(',').map(f => parseFloat(f.trim()));
    if (featureArray.some(isNaN) || featureArray.length !== 4) {
      alert("Please enter 4 valid numeric features separated by commas.");
      setLoading(false);
      return;
    }

    const prob = globalModel.predict(featureArray);
    const pred = prob > 0.5 ? 1 : 0;
    
    setResult({
      prediction: pred,
      probability: prob,
      className: pred === 1 ? "Iris-Virginica (Simulated)" : "Iris-Setosa (Simulated)"
    });
    setLoading(false);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
      <CardHeader>
        <CardTitle className="text-sm font-mono flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-500" /> MODEL DEPLOYMENT
        </CardTitle>
        <CardDescription className="text-[10px]">Test the global model in real-time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Input Features (Sepal L/W, Petal L/W)</Label>
          <Input 
            value={features} 
            onChange={(e) => setFeatures(e.target.value)}
            className="bg-zinc-950 border-zinc-800 text-xs font-mono"
            placeholder="5.1, 3.5, 1.4, 0.2"
          />
        </div>
        
        <Button 
          onClick={handlePredict} 
          disabled={!globalModel || loading}
          className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
        >
          {loading ? "Processing..." : <><Send className="w-3 h-3 mr-2" /> Run Inference</>}
        </Button>

        {result && (
          <div className="p-3 bg-zinc-950 rounded border border-zinc-800 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-mono">PREDICTION</span>
              <Badge variant="secondary" className={result.prediction === 1 ? "bg-blue-500/10 text-blue-500" : "bg-blue-500/10 text-blue-500"}>
                {result.className}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-mono">CONFIDENCE</span>
              <span className="text-xs font-bold">
                {(result.prediction === 1 ? result.probability * 100 : (1 - result.probability) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000" 
                style={{ width: `${result.prediction === 1 ? result.probability * 100 : (1 - result.probability) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-2 bg-blue-500/5 rounded border border-blue-500/10">
          <Info className="w-3 h-3 text-blue-500 mt-0.5" />
          <p className="text-[9px] text-zinc-500 leading-tight">
            Mock API Endpoint: <code className="text-blue-400">POST /api/predict</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
