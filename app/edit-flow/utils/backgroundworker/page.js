export const createBackgroundWorker = () => {
  // Create a blob containing the worker code
  const workerCode = `
    import { removeBackground } from '@imgly/background-removal';

    self.onmessage = async function(e) {
      try {
        const imageData = e.data.imageData;
        const resultBlob = await removeBackground(imageData, {
          publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/"
        });

        // Convert result Blob to data URL
        const reader = new FileReader();
        reader.onload = () => {
          self.postMessage({ type: "done", result: reader.result });
        };
        reader.onerror = () => {
          self.postMessage({ type: "error", error: "Failed to convert result to data URL" });
        };
        reader.readAsDataURL(resultBlob);
      } catch (error) {
        self.postMessage({ type: "error", error: error.message });
      }
    };
  `;

  // Create a Blob and URL for the worker
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const workerURL = URL.createObjectURL(blob);

  // Create and return the Web Worker with type: module
  const worker = new Worker(workerURL, { type: "module" });

  // Clean up the URL when the worker is terminated
  worker.onterminate = () => {
    URL.revokeObjectURL(workerURL);
  };

  return worker;
};