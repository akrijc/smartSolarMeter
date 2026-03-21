import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OCR_SETTINGS_KEY = '@ocr_settings';

export const defaultOcrSettings = {
  detectWhat: ['voltage', 'current', 'resistance'], // změna ze stringu na pole
  displayType: 'auto', // light-on-dark / dark-on-light / auto
  ocrLanguage: 'auto', // cs / en / auto
  autoCrop: true,
  perspectiveCorrection: true,
  contrastBoost: true,
  noiseReduction: true,
  gammaCorrection: 1.0,
  meterLayout: 'vertical', // horizontal / vertical
  backlightDetection: true,
  lightCondition: 'auto', // sun / shade / dark / auto
  backlightColor: 'white', // white / red / blue / green / yellow / custom

  // advanced – preprocessing
  manualContrast: 50,
  gamma: 1.0,
  sharpness: 1.0,
  invertColors: false,
  resizeTo: null,
  cropManual: null,
  rotation: 0,

  // advanced – recognition
  whitelist: '0123456789.,VAΩ',
  blacklist: 'IOl',
  ocrTimeout: 3000,
  retryCount: 1,
  fallbackEngine: false,

  // filtering
  regexPattern: '\\d+(\\.\\d{1,2})?\\s?[VAΩ]',
  minLength: 2,
  expectedValues: 3,
  ignoreDuplicates: true,

  // interpretation
  sortBy: 'position', // position / value / appearance
  valueMap: ['voltage', 'resistance', 'current'],
  valuePriority: 'highest', // highest / lowest / first
  useContextAwareness: true,
};

export const OCRSettingsContext = createContext({
  ocrSettings: defaultOcrSettings,
  setOcrSettings: () => {},
});

export function OCRSettingsProvider({ children }) {
  const [ocrSettings, setOcrSettingsState] = useState(defaultOcrSettings);

  useEffect(() => {
    AsyncStorage.getItem(OCR_SETTINGS_KEY).then((stored) => {
      if (stored) setOcrSettingsState(JSON.parse(stored));
    });
  }, []);

  const setOcrSettings = (newSettings) => {
    setOcrSettingsState(newSettings);
    AsyncStorage.setItem(OCR_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  return (
    <OCRSettingsContext.Provider value={{ ocrSettings, setOcrSettings }}>
      {children}
    </OCRSettingsContext.Provider>
  );
}