// Device fingerprinting utilities for authorization (with FingerprintJS)
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const FP_STORAGE_KEY = 'deviceFingerprintId';

// Lightweight fallback hash (in case FPJS visitorId not ready yet)
const computeFallbackFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  try { ctx?.fillText('Device fingerprint', 2, 2); } catch {}
  const raw = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset(),
    (() => { try { return canvas.toDataURL(); } catch { return 'no-canvas'; } })()
  ].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

// Load FPJS and cache visitorId
const loadAndCacheFingerprint = async (): Promise<string | null> => {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const id = result.visitorId;
    localStorage.setItem(FP_STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
};

// Ensure fingerprint is initialized in background
export const ensureFingerprintReady = (): void => {
  const existing = localStorage.getItem(FP_STORAGE_KEY);
  if (!existing) {
    // Fire and forget
    loadAndCacheFingerprint();
  }
};

export const getCurrentDeviceId = (): string => {
  const cached = localStorage.getItem(FP_STORAGE_KEY);
  if (cached) return cached;
  // Kick off async initialization and return fallback synchronously
  ensureFingerprintReady();
  return computeFallbackFingerprint();
};

export const setAuthorizedDevice = async (deviceId: string): Promise<boolean> => {
  try {
    localStorage.setItem('authorizedDeviceId', deviceId);
    return true;
  } catch (error) {
    console.error('Error setting authorized device:', error);
    return false;
  }
};

export const getDeviceInfo = async (): Promise<any> => {
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    touchSupport: 'ontouchstart' in window,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    visitorId: localStorage.getItem(FP_STORAGE_KEY) || null
  };
  
  const authorizedDeviceId = localStorage.getItem('authorizedDeviceId');
  
  return {
    fingerprint,
    authorizedDeviceId
  };
};

export const isAuthorizedDeviceForBilling = async (): Promise<boolean> => {
  try {
    const currentDeviceId = getCurrentDeviceId();
    const authorizedDeviceId = localStorage.getItem('authorizedDeviceId');
    
    return currentDeviceId === authorizedDeviceId;
  } catch (error) {
    console.error('Error checking device authorization:', error);
    return false;
  }
};
