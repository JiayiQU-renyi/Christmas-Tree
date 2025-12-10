export type ParticleMode = 'tree' | 'snow';

export type ParticleShape = 'snowflake' | 'circle' | 'star';

export interface AppState {
  mode: ParticleMode;
  particleColor: string;
  particleShape: ParticleShape;
  particleSize: number;
  isWebcamActive: boolean;
  gestureStatus: string;
  uploadedPhotos: string[]; // List of base64 image strings
  isGalleryOpen: boolean; // Controls visibility of the photo gallery
}

export interface TreeParams {
  height: number;
  radius: number;
  turns: number;
  ribbonWidth: number;
  particleCount: number;
}