import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

let gestureRecognizer: GestureRecognizer | null = null;
let initializationPromise: Promise<GestureRecognizer> | null = null;

export const initializeGestureRecognizer = async () => {
  if (gestureRecognizer) return gestureRecognizer;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      return gestureRecognizer;
    } catch (error) {
      initializationPromise = null; // Reset promise on failure so we can retry
      console.error("Failed to initialize gesture recognizer:", error);
      throw error;
    }
  })();

  return initializationPromise;
};

export const predictGesture = (video: HTMLVideoElement) => {
  if (!gestureRecognizer) return null;
  
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const nowInMs = Date.now();
  try {
    const results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    
    // 1. Priority Check: Manual Pinch Detection (Thumb Tip #4 to Index Tip #8)
    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      
      // Calculate Euclidean distance (ignoring Z for simplicity in 2D projection)
      // Coordinates are normalized [0,1], so 0.05 is very close
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );

      // Threshold found experimentally. 
      // If distance is small, they are pinching.
      if (distance < 0.05) {
        return 'Pinch'; 
      }
    }

    // 2. Fallback: Standard Categories
    if (results.gestures.length > 0) {
      return results.gestures[0][0].categoryName; 
    }
  } catch (error) {
    console.warn("Gesture recognition skipped frame due to error:", error);
  }
  
  return null;
};