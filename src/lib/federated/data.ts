export interface Dataset {
  features: number[][];
  labels: number[];
}

/**
 * Generates a synthetic dataset for binary classification
 * Simulates a simplified Iris-like dataset (e.g., Setosa vs others)
 */
export function generateSyntheticData(numSamples: number, numFeatures: number = 4): Dataset {
  const features: number[][] = [];
  const labels: number[] = [];

  // Two centers for the two classes
  const center0 = [5.0, 3.4, 1.5, 0.2];
  const center1 = [6.5, 3.0, 5.5, 2.0];

  for (let i = 0; i < numSamples; i++) {
    const label = Math.random() > 0.5 ? 1 : 0;
    const center = label === 1 ? center1 : center0;
    
    const sampleFeatures = center.map(val => val + (Math.random() - 0.5) * 1.5);
    features.push(sampleFeatures);
    labels.push(label);
  }

  return { features, labels };
}

/**
 * Splits a dataset into N non-IID or IID parts for clients
 */
export function splitData(dataset: Dataset, numClients: number): Dataset[] {
  const clientDatasets: Dataset[] = [];
  const samplesPerClient = Math.floor(dataset.features.length / numClients);

  for (let i = 0; i < numClients; i++) {
    const start = i * samplesPerClient;
    const end = (i + 1) * samplesPerClient;
    
    clientDatasets.push({
      features: dataset.features.slice(start, end),
      labels: dataset.labels.slice(start, end)
    });
  }

  return clientDatasets;
}
