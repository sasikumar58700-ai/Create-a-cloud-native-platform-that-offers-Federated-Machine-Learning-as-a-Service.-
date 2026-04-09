import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory storage for simulation state and models
  let simulationState = {
    isRunning: false,
    currentRound: 0,
    history: [] as any[],
    logs: [] as string[],
    config: null as any,
  };

  let modelVersions = [] as any[];

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/simulation/status", (req, res) => {
    res.json(simulationState);
  });

  app.post("/api/simulation/start", (req, res) => {
    const config = req.body;
    simulationState = {
      isRunning: true,
      currentRound: 0,
      history: [],
      logs: ["Simulation started with config: " + JSON.stringify(config)],
      config,
    };
    res.json({ status: "started" });
  });

  app.post("/api/simulation/update", (req, res) => {
    const { round, metrics, log, model } = req.body;
    simulationState.currentRound = round;
    simulationState.history.push(metrics);
    if (log) simulationState.logs.push(log);
    
    if (model) {
      modelVersions.push({
        version: `v${modelVersions.length + 1}`,
        round,
        accuracy: metrics.accuracy,
        weights: model.weights,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ status: "updated" });
  });

  app.post("/api/simulation/stop", (req, res) => {
    simulationState.isRunning = false;
    simulationState.logs.push("Simulation stopped.");
    res.json({ status: "stopped" });
  });

  app.get("/api/models", (req, res) => {
    res.json(modelVersions);
  });

  app.post("/api/predict", (req, res) => {
    const { features, version } = req.body;
    const model = version 
      ? modelVersions.find(v => v.version === version) 
      : modelVersions[modelVersions.length - 1];

    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }

    // Simple logistic regression prediction: sigmoid(w * x + b)
    // Assuming features is [x1, x2, x3, x4] and weights is [w1, w2, w3, w4, b]
    const weights = model.weights;
    let z = weights[weights.length - 1]; // bias
    for (let i = 0; i < features.length; i++) {
      z += features[i] * weights[i];
    }
    const probability = 1 / (1 + Math.exp(-z));
    const prediction = probability > 0.5 ? 1 : 0;

    res.json({ prediction, probability, version: model.version });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
