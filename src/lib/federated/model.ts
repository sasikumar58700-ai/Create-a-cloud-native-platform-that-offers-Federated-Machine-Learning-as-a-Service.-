/**
 * Simple Logistic Regression Model for Federated Learning Simulation
 */

export interface ModelWeights {
  weights: number[];
  bias: number;
}

export class LogisticRegression {
  private weights: number[];
  private bias: number;
  private learningRate: number;

  constructor(numFeatures: number, learningRate: number = 0.01) {
    this.weights = new Array(numFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bias = 0;
    this.learningRate = learningRate;
  }

  getWeights(): ModelWeights {
    return { weights: [...this.weights], bias: this.bias };
  }

  setWeights(weights: ModelWeights) {
    this.weights = [...weights.weights];
    this.bias = weights.bias;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  predict(features: number[]): number {
    let z = this.bias;
    for (let i = 0; i < features.length; i++) {
      z += features[i] * this.weights[i];
    }
    return this.sigmoid(z);
  }

  train(data: number[][], labels: number[], epochs: number) {
    const n = data.length;
    for (let e = 0; e < epochs; e++) {
      for (let i = 0; i < n; i++) {
        const x = data[i];
        const y = labels[i];
        const prediction = this.predict(x);
        const error = prediction - y;

        // Gradient descent
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] -= this.learningRate * error * x[j];
        }
        this.bias -= this.learningRate * error;
      }
    }
  }

  evaluate(data: number[][], labels: number[]): { accuracy: number; loss: number } {
    let correct = 0;
    let totalLoss = 0;
    const n = data.length;

    for (let i = 0; i < n; i++) {
      const x = data[i];
      const y = labels[i];
      const prediction = this.predict(x);
      
      // Binary Cross Entropy Loss
      totalLoss += -(y * Math.log(prediction + 1e-15) + (1 - y) * Math.log(1 - prediction + 1e-15));
      
      const classPred = prediction > 0.5 ? 1 : 0;
      if (classPred === y) correct++;
    }

    return {
      accuracy: correct / n,
      loss: totalLoss / n
    };
  }
}
