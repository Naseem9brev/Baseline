import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Lazily-created singleton so the ~3.7MB model + wasm load only once, on first check-in.
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      // wasm + model are bundled locally under public/mediapipe — no CDN, works offline.
      const vision = await FilesetResolver.forVisionTasks(
        chrome.runtime.getURL('mediapipe/wasm'),
      );
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: chrome.runtime.getURL('mediapipe/face_landmarker.task'),
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    })();
  }
  return landmarkerPromise;
}

// Landmark indices we sample (MediaPipe Face Mesh / FaceLandmarker, 478 points).
// Iris centers:
export const IRIS = { right: 468, left: 473 } as const;
// Eyelid vertical pairs (top/bottom) + horizontal corners, per eye:
export const RIGHT_EYE = { top: 159, bottom: 145, inner: 133, outer: 33 } as const;
export const LEFT_EYE = { top: 386, bottom: 374, inner: 362, outer: 263 } as const;
