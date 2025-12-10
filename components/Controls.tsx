import React, { useRef } from 'react';
import { AppState, ParticleMode, ParticleShape } from '../types';
import { 
  Maximize2, 
  Minimize2, 
  TreePine, 
  Snowflake, 
  Camera,
  ImagePlus,
  Trash2
} from 'lucide-react';

interface ControlsProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const Controls: React.FC<ControlsProps> = ({
  appState,
  setAppState,
  toggleFullscreen,
  isFullscreen,
  videoRef
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMode = () => {
    setAppState(prev => ({
      ...prev,
      mode: prev.mode === 'tree' ? 'snow' : 'tree'
    }));
  };

  const toggleWebcam = () => {
    setAppState(prev => ({
      ...prev,
      isWebcamActive: !prev.isWebcamActive
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPhotos: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newPhotos.push(event.target.result as string);
            // Update state when last file is processed
            if (newPhotos.length === files.length) {
              setAppState(prev => ({
                ...prev,
                uploadedPhotos: [...prev.uploadedPhotos, ...newPhotos]
              }));
            }
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleClearPhotos = () => {
    setAppState(prev => ({
      ...prev,
      uploadedPhotos: [],
      isGalleryOpen: false
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all text-white border border-white/10"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Main Control Panel (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl text-white">
          
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            
            {/* Mode Toggle Button (Big) */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleMode}
                className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                  appState.mode === 'tree' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-700 shadow-green-500/30' 
                    : 'bg-gradient-to-br from-blue-400 to-cyan-600 shadow-cyan-500/30'
                }`}
              >
                {appState.mode === 'tree' ? (
                  <TreePine size={40} className="animate-pulse" />
                ) : (
                  <Snowflake size={40} className="animate-spin-slow" />
                )}
              </button>
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                {appState.mode === 'tree' ? 'Christmas Tree' : 'Snowfall'}
              </span>
            </div>

            {/* Settings Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              
              {/* Webcam Toggle */}
               <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 flex items-center gap-1">
                  <Camera size={12} /> Gesture
                </label>
                <button
                  onClick={toggleWebcam}
                  className={`flex-1 rounded-lg border flex flex-col items-center justify-center py-2 transition-all ${
                    appState.isWebcamActive 
                      ? 'bg-red-500/20 border-red-500 text-red-200' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                   {appState.isWebcamActive ? 'Stop Cam' : 'Start Cam'}
                   {appState.isWebcamActive && appState.gestureStatus && (
                     <span className="text-[10px] mt-1 text-white bg-black/50 px-1 rounded truncate w-full text-center">
                       {appState.gestureStatus === 'Open_Palm' ? '🖐️ Open' : 
                        appState.gestureStatus === 'Closed_Fist' ? '✊ Closed' : 
                        appState.gestureStatus === 'Pinch' ? '👌 Pinch' : '...'}
                     </span>
                   )}
                </button>
              </div>

               {/* Upload Photos */}
               <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 flex items-center gap-1">
                  <ImagePlus size={12} /> Photos
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  multiple 
                  accept="image/*" 
                />
                <div className="flex flex-1 gap-1 w-full">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center py-2 transition-all relative overflow-hidden"
                  >
                    Upload
                    <span className="text-[10px] mt-1 opacity-60">
                      {appState.uploadedPhotos.length} loaded
                    </span>
                  </button>
                  {appState.uploadedPhotos.length > 0 && (
                    <button
                      onClick={handleClearPhotos}
                      className="w-8 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-200 transition-all"
                      title="Clear all photos"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Shape Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">Shape</label>
                <div className="flex bg-black/20 rounded-lg p-1 h-full items-center">
                  {(['snowflake', 'star', 'circle'] as ParticleShape[]).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setAppState(prev => ({ ...prev, particleShape: shape }))}
                      className={`flex-1 aspect-square rounded flex items-center justify-center transition-all ${
                        appState.particleShape === shape ? 'bg-white/20' : 'hover:bg-white/5'
                      }`}
                    >
                      {shape === 'snowflake' && <Snowflake size={14} />}
                      {shape === 'star' && <span className="text-lg leading-none">★</span>}
                      {shape === 'circle' && <div className="w-3 h-3 rounded-full bg-current" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">Color</label>
                <div className="flex items-center gap-2 h-full justify-center bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="color"
                    value={appState.particleColor}
                    onChange={(e) => setAppState(prev => ({ ...prev, particleColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Instructions Hint */}
        {appState.isWebcamActive && (
          <div className="mt-2 text-center text-xs text-white/50 animate-fade-in flex flex-col gap-1">
             <div><span className="font-bold text-white">Gestures:</span> 🖐️ Snow | ✊ Tree</div>
             {appState.uploadedPhotos.length > 0 && (
               <div className="text-yellow-300"><span className="font-bold">✨ New:</span> Pinch (👌) to show photo gallery!</div>
             )}
          </div>
        )}
      </div>

      {/* Hidden Video Element for MediaPipe */}
      <video
        ref={videoRef}
        className={`absolute top-4 left-4 w-32 h-24 object-cover rounded-lg border-2 border-white/20 transform scale-x-[-1] transition-opacity duration-500 ${appState.isWebcamActive ? 'opacity-80' : 'opacity-0 pointer-events-none'}`}
        autoPlay
        playsInline
        muted
      />
    </>
  );
};