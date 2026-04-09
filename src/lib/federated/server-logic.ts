import { ModelWeights } from "./model";

export class FederatedServer {
  /**
   * Performs Federated Averaging (FedAvg)
   * @param clientUpdates List of weight updates from clients
   * @param clientDataSizes List of data sizes for weighted averaging
   */
  static aggregate(clientUpdates: ModelWeights[], clientDataSizes: number[]): ModelWeights {
    const numClients = clientUpdates.length;
    if (numClients === 0) throw new Error("No client updates to aggregate");

    const totalDataSize = clientDataSizes.reduce((a, b) => a + b, 0);
    const numFeatures = clientUpdates[0].weights.length;

    const aggregatedWeights: number[] = new Array(numFeatures).fill(0);
    let aggregatedBias = 0;

    for (let i = 0; i < numClients; i++) {
      const weight = clientDataSizes[i] / totalDataSize;
      const update = clientUpdates[i];

      for (let j = 0; j < numFeatures; j++) {
        aggregatedWeights[j] += update.weights[j] * weight;
      }
      aggregatedBias += update.bias * weight;
    }

    return {
      weights: aggregatedWeights,
      bias: aggregatedBias
    };
  }
}
