import { LogisticRegression, ModelWeights } from "./model";

export interface ClientData {
  features: number[][];
  labels: number[];
}

export class FederatedClient {
  public id: string;
  private data: ClientData;
  private model: LogisticRegression;

  constructor(id: string, data: ClientData, numFeatures: number) {
    this.id = id;
    this.data = data;
    this.model = new LogisticRegression(numFeatures);
  }

  /**
   * Local training step
   * @param globalWeights Weights received from the server
   * @param epochs Number of local epochs
   * @param noiseScale Scale of Gaussian noise for Differential Privacy simulation
   */
  async localTrain(globalWeights: ModelWeights, epochs: number, noiseScale: number): Promise<ModelWeights> {
    // 1. Set local model to global weights
    this.model.setWeights(globalWeights);

    // 2. Train locally
    this.model.train(this.data.features, this.data.labels, epochs);

    // 3. Get updated weights
    const updatedWeights = this.model.getWeights();

    // 4. Add noise (Privacy Simulation)
    if (noiseScale > 0) {
      updatedWeights.weights = updatedWeights.weights.map(w => w + this.generateNoise(noiseScale));
      updatedWeights.bias += this.generateNoise(noiseScale);
    }

    return updatedWeights;
  }

  private generateNoise(scale: number): number {
    // Simple Box-Muller transform for Gaussian noise
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    return scale * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  getEvaluation(): { accuracy: number; loss: number } {
    return this.model.evaluate(this.data.features, this.data.labels);
  }

  getDataSize(): number {
    return this.data.features.length;
  }
}
