import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { Controls } from './components/Controls';
import { AppState } from './types';
import { COLORS } from './constants';
import { initializeGestureRecognizer, predictGesture } from './services/gestureService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    mode: 'tree',
    particleColor: COLORS.TREE_GREEN,
    particleShape: 'snowflake',
    particleSize: 5,
    isWebcamActive: false,
    gestureStatus: '',
    uploadedPhotos: [],
    isGalleryOpen: false,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>();
  
  // Timers for debouncing and cooldown
  const lastGestureTime = useRef<number>(0);
  const lastPinchTime = useRef<number>(0);
  const actionCooldown = useRef<number>(0); // 2s lock
  
  // Refs for loop access to avoid closure staleness
  const modeRef = useRef(appState.mode);
  const galleryOpenRef = useRef(appState.isGalleryOpen);

  // Sync refs
  useEffect(() => {
    modeRef.current = appState.mode;
    galleryOpenRef.current = appState.isGalleryOpen;
  }, [appState.mode, appState.isGalleryOpen]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Webcam & Gesture Logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true; // Cleanup flag

    const startWebcam = async () => {
      try {
        await initializeGestureRecognizer();
        
        if (!isActive) return;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 320, 
              height: 240, 
              frameRate: { ideal: 30 } 
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = () => {
              if (isActive) predictWebcam();
            };
          }
        }
      } catch (err) {
        console.error("Error enabling webcam:", err);
        setAppState(prev => ({ ...prev, isWebcamActive: false }));
        alert("Could not access webcam. Please check permissions.");
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !isActive) return;

      const gesture = predictGesture(videoRef.current);
      const now = Date.now();

      if (gesture) {
          let newMode = modeRef.current;
          let newGalleryOpen = galleryOpenRef.current;
          let newGestureStatus = gesture;

          // --- 1. Mode Switching Logic (Debounced) ---
          if (now - lastGestureTime.current > 300) {
            if (gesture === 'Open_Palm') {
              newMode = 'snow';
              newGalleryOpen = false; // Close gallery when scattering
              lastPinchTime.current = 0; 
            } else if (gesture === 'Closed_Fist') {
              newMode = 'tree';
            }
          }

          // --- 2. Gallery Logic (Pinch) with Hysteresis ---
          if (gesture === 'Pinch') {
            lastPinchTime.current = now;
          }

          const isPinching = (now - lastPinchTime.current) < 500;

          if (isPinching) {
             newGalleryOpen = true; // Open gallery on pinch
             newGestureStatus = 'Pinch'; 
          } else {
             newGalleryOpen = false; // Close gallery on release (after buffer)
          }

          // --- 3. Update State with Cooldown ---
          setAppState(prev => {
            const modeChanged = prev.mode !== newMode;
            const galleryChanged = prev.isGalleryOpen !== newGalleryOpen;

            // If we are attempting a significant change
            if (modeChanged || galleryChanged) {
               // Check Cooldown
               if (now < actionCooldown.current) {
                 return prev;
               }
               
               // Apply change and set 2s cooldown
               actionCooldown.current = now + 2000;
               if (modeChanged) lastGestureTime.current = now; 
               
               return { 
                 ...prev, 
                 mode: newMode, 
                 gestureStatus: newGestureStatus, 
                 isGalleryOpen: newGalleryOpen 
               };
            }
            
            if (prev.gestureStatus !== newGestureStatus) {
               return { ...prev, gestureStatus: newGestureStatus };
            }
            
            return prev;
          });
      } else {
        // No gesture detected
        // Check pinch hysteresis
        const isPinching = (now - lastPinchTime.current) < 500;
        
        if (!isPinching && galleryOpenRef.current) {
           // Should close gallery
           setAppState(prev => {
              if (prev.isGalleryOpen) {
                  if (now < actionCooldown.current) return prev;
                  actionCooldown.current = now + 2000;
                  return { ...prev, isGalleryOpen: false, gestureStatus: '' };
              }
              return prev;
           });
        } else if (isPinching) {
           // Waiting
        } else {
           if (appState.gestureStatus !== '') {
             setAppState(prev => ({ ...prev, gestureStatus: '' }));
           }
        }
      }
      
      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    if (appState.isWebcamActive) {
      startWebcam();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
         videoRef.current.srcObject = null;
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [appState.isWebcamActive]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      <Experience {...appState} />
      <Controls 
        appState={appState}
        setAppState={setAppState}
        toggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        videoRef={videoRef}
      />
    </div>
  );
};

export default App;