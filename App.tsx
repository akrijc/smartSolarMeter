import {
  View,
  TextInput,
  Text,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import TextRecognition from 'react-native-text-recognition';
import { KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot, { captureRef } from 'react-native-view-shot';

const STORAGE_KEY = '@solar_panel_data';
const CRITICAL_VALUES_KEY = '@critical_values';
const EXPORT_LANG_KEY = '@export_lang';

const colors = {
  primary: '#007AFF',
  background: '#F9FAFB',
  text: '#1F2937',
  accent: '#10B981',
  danger: '#EF4444',
  inputBorder: '#E5E7EB',
};

const usePreprocessing = true;

const preprocessImage = async (uri) => {
  if (!usePreprocessing) return uri;
  try {
    const contrasted = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          contrast: 2.0,
          brightness: 0.05,
        },
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return contrasted.uri;
  } catch (e) {
    console.warn('Chyba při preprocessImage:', e);
    return uri;
  }
};

const postprocessOcrText = (raw) => {
  if (!raw) return '';
  let text = raw;
  text = text.replace(/MO|M0|MQ/gi, 'MΩ');
  text = text.replace(/([^\d])O([^\d])/g, '$10$2');
  text = text.replace(/([^\d])O(\d)/g, '$10$2');
  text = text.replace(/(\d)O([^\d])/g, '$10$2');
  text = text.replace(/\bO\b/g, '0');
  text = text.replace(/\bO(\d)/g, '0$1');
  text = text.replace(/\b([bB])(\d)/g, '8$2');
  text = text.replace(/([bB])/g, '8');
  text = text.replace(/(\d)[\s,](\d)/g, '$1.$2');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/[^0-9.MΩVA ]/g, '');
  return text.trim();
};

const ExportLangDict = {
  cs: {
    inverter: 'Měnič',
    additionalNotes: 'Další chyby',
    lowVoltage: 'Nízké napětí',
    highVoltage: 'Vysoké napětí',
    lowCurrent: 'Nízký proud',
    highCurrent: 'Vysoký proud',
    lowResistance: 'Nízký odpor',
    highResistance: 'Vysoký odpor',
    badConnector: 'Špatný konektor',
    string: 'String',
    note: 'Poznámka',
    cable: 'String',
    voltage: 'Napětí (V)',
    current: 'Proud (A)',
    resistance: 'Odpor (MΩ)',
    criticalValuesSaved: 'Kritické hodnoty byly uloženy!',
    exportLanguage: 'Jazyk exportu',
    'Copy to Clipboard': 'Kopírovat do schránky',
  },
  en: {
    inverter: 'Inverter',
    additionalNotes: 'Additional Notes',
    lowVoltage: 'Low voltage',
    highVoltage: 'High voltage',
    lowCurrent: 'Low current',
    highCurrent: 'High current',
    lowResistance: 'Low resistance',
    highResistance: 'High resistance',
    badConnector: 'Bad connector',
    string: 'String',
    note: 'Note',
    cable: 'String',
    voltage: 'Voltage (V)',
    current: 'Current (A)',
    resistance: 'Resistance (MΩ)',
    criticalValuesSaved: 'Critical values saved!',
    exportLanguage: 'Export Language',
    'Copy to Clipboard': 'Copy to Clipboard',
  },
  nl: {
    inverter: 'Omvormer',
    additionalNotes: 'Overige fouten',
    lowVoltage: 'Lage spanning',
    highVoltage: 'Hoge spanning',
    lowCurrent: 'Lage stroom',
    highCurrent: 'Hoge stroom',
    lowResistance: 'Lage weerstand',
    highResistance: 'Hoge weerstand',
    badConnector: 'Slechte connector',
    string: 'String',
    note: 'Notitie',
    cable: 'String',
    voltage: 'Spanning (V)',
    current: 'Stroom (A)',
    resistance: 'Weerstand (MΩ)',
    criticalValuesSaved: 'Kritieke waarden zijn opgeslagen!',
    exportLanguage: 'Exporteer Taal',
    'Copy to Clipboard': 'Kopiëren naar klembord',
  },
  zh: {
    inverter: '逆变器',
    additionalNotes: '附加问题',
    lowVoltage: '电压过低',
    highVoltage: '电压过高',
    lowCurrent: '电流过低',
    highCurrent: '电流过高',
    lowResistance: '电阻过低',
    highResistance: '电阻过高',
    badConnector: '接头不良',
    string: '组串',
    note: '备注',
    cable: '组串',
    voltage: '电压 (V)',
    current: '电流 (A)',
    resistance: '电阻 (MΩ)',
    criticalValuesSaved: '临界值已保存！',
    exportLanguage: '导出语言',
    'Copy to Clipboard': '复制到剪贴板',
  },
};

const getExportLangStrings = (lang) => ExportLangDict[lang] || ExportLangDict['en'];

const getErrorText = (err, exportLangDict) => {
  switch (err) {
    case 'error voltage:low':
      return exportLangDict.lowVoltage;
    case 'error voltage:high':
      return exportLangDict.highVoltage;
    case 'error current:low':
      return exportLangDict.lowCurrent;
    case 'error current:high':
      return exportLangDict.highCurrent;
    case 'error resistance:low':
      return exportLangDict.lowResistance;
    case 'error resistance:high':
      return exportLangDict.highResistance;
    case 'bad connector':
      return exportLangDict.badConnector;
    default:
      return err;
  }
};

const classifyErrors = (c, minVoltage, maxVoltage, minCurrent, maxCurrent, minResistance, maxResistance) => {
  const errors = [];
  if (c.voltage !== undefined && c.voltage !== '') {
    const v = parseFloat(c.voltage);
    if (!isNaN(v)) {
      if (v < minVoltage) errors.push('error voltage:low');
      if (v > maxVoltage) errors.push('error voltage:high');
    }
  }
  if (c.current !== undefined && c.current !== '') {
    const a = parseFloat(c.current);
    if (!isNaN(a)) {
      if (a < minCurrent) errors.push('error current:low');
      if (a > maxCurrent) errors.push('error current:high');
    }
  }
  if (c.resistance !== undefined && c.resistance !== '') {
    let r = c.resistance;
    if (typeof r === 'string') {
      r = r.replace(/[^\d.]/g, '');
    }
    r = parseFloat(r);
    if (!isNaN(r)) {
      if (r < minResistance) errors.push('error resistance:low');
      if (r > maxResistance) errors.push('error resistance:high');
    }
  }
  if (c.note && typeof c.note === 'string' && c.note.toLowerCase().includes('bad connector')) {
    errors.push('bad connector');
  }
  if (c.errors && Array.isArray(c.errors)) {
    c.errors.forEach(e => {
      if (!errors.includes(e)) errors.push(e);
    });
  }
  return errors;
};

function formatResistanceExport(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') {
    let v = val.trim();
    v = v.replace(/[,;]/g, '.');
    let numMatch = v.match(/([0-9]+(?:[.,][0-9]+)?)/);
    let num = numMatch ? numMatch[1].replace(',', '.') : '';
    if (!num) return '';
    return `${num} Mohm`;
  }
  if (typeof val === 'number') {
    return `${val} Mohm`;
  }
  return '';
}

function removeDiacritics(str) {
  if (!str || typeof str !== 'string') return str;
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, '');
}

const App = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [languageSelected, setLanguageSelected] = useState(false);
  const [stringNote, setStringNote] = useState('');
  const [viewSaved, setViewSaved] = useState(false);
  const [inverterNumber, setInverterNumber] = useState('');
  const [photoSavePath, setPhotoSavePath] = useState(FileSystem.documentDirectory);
  const [voltage, setVoltage] = useState('');
  const [current, setCurrent] = useState('');
  const [resistance, setResistance] = useState('');
  const [cableIndex, setCableIndex] = useState(0);
  const [savedCables, setSavedCables] = useState([]);
  const [cableCount, setCableCount] = useState(6);
  const [cameraPermission, setCameraPermission] = useState(null);
  const currentInput = useRef(null);
  let resistanceInput = useRef(null);
  const [badConnector, setBadConnector] = useState(false);
  const [minVoltage, setMinVoltage] = useState(700);
  const [maxVoltage, setMaxVoltage] = useState(1000);
  const [minCurrent, setMinCurrent] = useState(0);
  const [maxCurrent, setMaxCurrent] = useState(15);
  const [minResistance, setMinResistance] = useState(1);
  const [maxResistance, setMaxResistance] = useState(100);
  const [cableMode, setCableMode] = useState('A');
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState('');
  const [customCableRange, setCustomCableRange] = useState('');
  const [exportLang, setExportLang] = useState('cs');
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [showSaveCriticalMsg, setShowSaveCriticalMsg] = useState(false);

  const overlayShotRef = useRef(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [showOverlayModal, setShowOverlayModal] = useState(false);

  const generateCableLabels = () => {
    if (cableMode === 'custom' && customCableRange) {
      return generateCustomCableLabels(customCableRange);
    }
    let labels = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (cableMode === 'A') {
      labels = letters.slice(0, cableCount);
    } else if (cableMode === 'B') {
      for (let i = 0; i < cableCount; i++) {
        const letter = letters[Math.floor(i / 2)];
        const suffix = (i % 2) + 1;
        labels.push(`${letter}${suffix}`);
      }
    } else if (cableMode === 'C') {
      for (let i = 0; i < cableCount; i++) {
        const letter = letters[Math.floor(i / 3)];
        const suffix = (i % 3) + 1;
        labels.push(`${letter}${suffix}`);
      }
    }
    return labels;
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const languageAnim = useRef(new Animated.Value(0)).current;

  const generateCustomCableLabels = (range) => {
    const match = range.match(/^([A-Z])(\d+)-([A-Z])(\d+)$/i);
    if (!match) return [];
    const startLetter = match[1].toUpperCase();
    const startNumber = parseInt(match[2]);
    const endLetter = match[3].toUpperCase();
    const endNumber = parseInt(match[4]);
    const letters = [];
    for (let i = startLetter.charCodeAt(0); i <= endLetter.charCodeAt(0); i++) {
      letters.push(String.fromCharCode(i));
    }
    const numbers = [];
    for (let i = startNumber; i <= endNumber; i++) {
      numbers.push(i);
    }
    const labels = [];
    letters.forEach((l) => {
      numbers.forEach((n) => {
        labels.push(`${l}${n}`);
      });
    });
    return labels;
  };

  const cableLabels = generateCableLabels();

  const selectLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    setLanguageSelected(true);
  };

  const saveCriticalValues = async () => {
    const values = {
      minVoltage,
      maxVoltage,
      minCurrent,
      maxCurrent,
      minResistance,
      maxResistance,
    };
    try {
      await AsyncStorage.setItem(CRITICAL_VALUES_KEY, JSON.stringify(values));
      Alert.alert(t('Critical values saved!'));
      setShowSaveCriticalMsg(true);
      setTimeout(() => setShowSaveCriticalMsg(false), 2500);
    } catch (err) {
      Alert.alert(t('Error saving values'));
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
      await loadData();

      try {
        const stored = await AsyncStorage.getItem(CRITICAL_VALUES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.minVoltage !== undefined) setMinVoltage(parsed.minVoltage);
          if (parsed.maxVoltage !== undefined) setMaxVoltage(parsed.maxVoltage);
          if (parsed.minCurrent !== undefined) setMinCurrent(parsed.minCurrent);
          if (parsed.maxCurrent !== undefined) setMaxCurrent(parsed.maxCurrent);
          if (parsed.minResistance !== undefined) setMinResistance(parsed.minResistance);
          if (parsed.maxResistance !== undefined) setMaxResistance(parsed.maxResistance);
        }
      } catch { }

      try {
        const savedPath = await AsyncStorage.getItem('@photo_save_path');
        if (savedPath) setPhotoSavePath(savedPath);
      } catch { }

      try {
        const storedExportLang = await AsyncStorage.getItem(EXPORT_LANG_KEY);
        if (storedExportLang) {
          setExportLang(storedExportLang);
        }
      } catch { }
    };

    initialize();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!languageSelected) {
      Animated.spring(languageAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      languageAnim.setValue(0);
    }
  }, [languageSelected]);

  const processImage = async (uri) => {
    try {
      let preUri = uri;
      if (usePreprocessing) {
        preUri = await preprocessImage(uri);
      }
      const result = await TextRecognition.recognize(preUri);
      const fullText = result.join(' ').replace(/\s+/g, ' ').trim();
      const cleanedText = postprocessOcrText(fullText);

      let voltage = '';
      let current = '';
      let resistance = '';
      const voltageMatch = cleanedText.match(/(\d{2,4}(?:\.\d+)?)\s*V/);
      const currentMatch = cleanedText.match(/(\d{1,3}(?:\.\d+)?)\s*A/);
      const resistanceMatch = cleanedText.match(/(\d{1,3}(?:\.\d+)?)\s*MΩ/i);

      if (voltageMatch && currentMatch && resistanceMatch) {
        voltage = voltageMatch[1];
        current = currentMatch[1];
        resistance = resistanceMatch[1];
      } else {
        const numberOnly = cleanedText.match(/\d{1,4}(?:\.\d+)?/g);
        if (numberOnly && numberOnly.length >= 3) {
          voltage = numberOnly[0];
          current = numberOnly[1];
          resistance = numberOnly[2];
        }
      }

      setVoltage(voltage);
      setCurrent(current);
      setResistance(resistance);

      Alert.alert(
        t('Values recognized'),
        `🔌 ${t('Voltage')}: ${voltage || t('not found')} V\n⚡ ${t('Current')}: ${current || t('not found')} A\n🛡️ ${t('Resistance')}: ${resistance || t('not found')} MΩ`
      );
    } catch (error) {
      Alert.alert(t('OCR error'), t('Unable to recognize values from image.'));
    }
  };

  // DEBUGGED scanValuesFromMeter with log & safe checks
  const scanValuesFromMeter = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
      });
      console.log('ImagePicker.launchCameraAsync result:', result);

      if (!result || !result.assets || result.assets.length === 0) {
        Alert.alert(t('No photo taken'));
        return;
      }
      await processImage(result.assets[0].uri);
    } catch (e) {
      Alert.alert(t('No photo taken'));
      console.log('scanValuesFromMeter error:', e);
    }
  };

  // === OPRAVENÁ FUNKCE pro správné ukládání fotek v iOS buildu ===
  const savePhotoWithLabel = async (photoUri, label) => {
    return new Promise(async (resolve, reject) => {
      setPendingPhoto({ uri: photoUri, label });
      setShowOverlayModal(true);

      const onOverlaySave = async (capturedUri) => {
        try {
          const fileName = `${label}.jpg`;
          const fileUri = `${photoSavePath}${fileName}`;
          // Zkopírujeme fotku do app storage
          await FileSystem.copyAsync({
            from: capturedUri,
            to: fileUri,
          });

          // Pokud je uživatel nastaven na ukládání do galerie, požádáme o oprávnění a pokusíme se uložit do MediaLibrary
          if (photoSavePath !== FileSystem.documentDirectory) {
            let mediaPermission = await MediaLibrary.getPermissionsAsync();
            if (mediaPermission.status !== 'granted') {
              mediaPermission = await MediaLibrary.requestPermissionsAsync();
            }

            if (mediaPermission.status === 'granted') {
              await MediaLibrary.saveToLibraryAsync(capturedUri);
            } else {
              Alert.alert(
                t('Permission denied'),
                t('Cannot save photo to gallery. Please allow photo access in settings.')
              );
            }
          }

          setPhotoPreviews(prev => ({ ...prev, [label]: capturedUri }));
          resolve(fileUri);
        } catch (e) {
          Alert.alert(t('Error saving photo'), e.message || '');
          resolve(null);
        }
      };

      overlayModalCallbackRef.current = onOverlaySave;
    });
  };

  const overlayModalCallbackRef = useRef(null);

  // DEBUGGED capturePhotoOnly with log & safe checks
  const capturePhotoOnly = async () => {
    try {
      const label = `${inverterNumber}-${cableLabels[cableIndex]}`;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      console.log('ImagePicker.launchCameraAsync result:', result);

      if (!result || !result.assets || result.assets.length === 0) {
        Alert.alert(t('No photo taken'));
        return;
      }
      const fileUri = await savePhotoWithLabel(result.assets[0].uri, label);
      if (fileUri) {
        setStringNote((prev) => {
          if (prev.includes(`foto ${label}`)) return prev;
          return prev ? `${prev}, foto ${label}` : `foto ${label}`;
        });
        Alert.alert(t('Photo saved'), `${label}.jpg`);
      }
    } catch (e) {
      Alert.alert(t('No photo taken'));
      console.log('capturePhotoOnly error:', e);
    }
  };

  const handleOverlaySave = async () => {
    if (overlayShotRef.current && pendingPhoto) {
      try {
        const uri = await captureRef(overlayShotRef, {
          format: 'jpg',
          quality: 0.98,
        });
        setShowOverlayModal(false);
        setPendingPhoto(null);
        if (overlayModalCallbackRef.current) {
          overlayModalCallbackRef.current(uri);
          overlayModalCallbackRef.current = null;
        }
      } catch (e) {
        Alert.alert(t('Error'), t('Unable to save image.'));
        setShowOverlayModal(false);
        setPendingPhoto(null);
        if (overlayModalCallbackRef.current) {
          overlayModalCallbackRef.current(null);
          overlayModalCallbackRef.current = null;
        }
      }
    }
  };

  const handleOverlayCancel = () => {
    setShowOverlayModal(false);
    setPendingPhoto(null);
    if (overlayModalCallbackRef.current) {
      overlayModalCallbackRef.current(null);
      overlayModalCallbackRef.current = null;
    }
  };

  const saveData = async () => {
    if (!inverterNumber || !voltage || !current || !resistance) {
      Alert.alert(t('Error'), t('Fill out all fields (Inverter, Voltage, Current, Resistance).'));
      return false;
    }

    const v = parseFloat(voltage);
    const a = parseFloat(current);
    const r = parseFloat(resistance);

    let errorNotes = [];
    if (v < minVoltage) errorNotes.push('error voltage:low');
    if (v > maxVoltage) errorNotes.push('error voltage:high');
    if (a < minCurrent) errorNotes.push('error current:low');
    if (a > maxCurrent) errorNotes.push('error current:high');
    if (r < minResistance) errorNotes.push('error resistance:low');
    if (r > maxResistance) errorNotes.push('error resistance:high');
    if (badConnector) errorNotes.push('bad connector');

    const cableLabel = cableLabels[cableIndex];
    const note = stringNote;

    const newCable = {
      inverterNumber,
      cableLabel,
      voltage,
      current,
      resistance,
      note,
      errors: errorNotes,
    };

    const updated = [...savedCables, newCable];
    setSavedCables(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    Alert.alert(t('Data saved successfully!'));
    return true;
  };

  const handleNextCable = async () => {
    const success = await saveData();
    if (!success) return;
    setCableIndex((cableIndex + 1) % cableLabels.length);
    clearInputs();
  };

  const clearInputs = () => {
    setVoltage('');
    setCurrent('');
    setResistance('');
    setStringNote('');
    setBadConnector(false);
    currentInput.current?.focus();
  };

  const loadData = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) setSavedCables(JSON.parse(data));
  };

  const clearAllData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSavedCables([]);
    Alert.alert(t('All data has been cleared.'));
  };

  const exportToText = async (mode = 'A') => {
    const exportDictOrig = getExportLangStrings(exportLang);
    const exportDict = Object.fromEntries(
      Object.entries(exportDictOrig).map(([k, v]) => [k, removeDiacritics(v)])
    );
    let content = '';
    const byInverter = {};
    savedCables.forEach((c) => {
      if (!byInverter[c.inverterNumber]) byInverter[c.inverterNumber] = [];
      byInverter[c.inverterNumber].push(c);
    });

    if (mode === 'A') {
      let lines = [];
      let inverterIndex = 1;
      for (const [inv, group] of Object.entries(byInverter)) {
        lines.push(
          removeDiacritics(`${exportDict.inverter} ${inverterIndex}`)
        );
        for (const c of group) {
          let errArr = classifyErrors(
            c,
            minVoltage,
            maxVoltage,
            minCurrent,
            maxCurrent,
            minResistance,
            maxResistance
          );
          const errorText =
            errArr.length > 0
              ? errArr.map((err) => removeDiacritics(getErrorText(err, exportDict))).join(', ')
              : '';
          let resistanceVal = (c.resistance !== undefined && c.resistance !== '') ? removeDiacritics(formatResistanceExport(c.resistance)) : '';
          const noteText = c.note ? ` (${removeDiacritics(c.note)})` : '';
          let line = `${removeDiacritics(c.inverterNumber)}-${removeDiacritics(c.cableLabel)}-${removeDiacritics(c.voltage)}V-${removeDiacritics(c.current)}A-${resistanceVal}${noteText}`;
          if (errorText) {
            line += ` | ${exportDict.additionalNotes}: ${errorText}`;
          }
          lines.push(line);
        }
        inverterIndex++;
        lines.push('');
      }
      content = lines.join('\n');
      let fileName = 'solar_data_strings.txt';
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
    }
    else if (mode === 'B') {
      const header =
        `${exportDict.inverter};${exportDict.cable};${exportDict.voltage};${exportDict.current};${exportDict.resistance};${exportDict.additionalNotes};${exportDict.note}`;
      let rows = [];
      let inverterIndex = 1;
      for (const [inv, group] of Object.entries(byInverter)) {
        rows.push(removeDiacritics(`${exportDict.inverter} ${inverterIndex}`));
        for (const c of group) {
          let errArr = classifyErrors(
            c,
            minVoltage,
            maxVoltage,
            minCurrent,
            maxCurrent,
            minResistance,
            maxResistance
          );
          const errorText =
            errArr.length > 0
              ? errArr.map((err) => removeDiacritics(getErrorText(err, exportDict))).join(', ')
              : '';
          let resistanceVal = (c.resistance !== undefined && c.resistance !== '') ? removeDiacritics(formatResistanceExport(c.resistance)) : '';
          const row = `${removeDiacritics(c.inverterNumber)};${removeDiacritics(c.cableLabel)};${removeDiacritics(c.voltage)}V;${removeDiacritics(c.current)}A;${resistanceVal};${errorText};${c.note ? removeDiacritics(c.note) : ''}`;
          rows.push(row);
        }
        inverterIndex++;
        rows.push('');
      }
      content = [header, ...rows].join('\n');
      let fileName = 'solar_data_table.csv';
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
    }
    else if (mode === 'C') {
      try {
        let csvRows = [];
        const sortedInvs = Object.keys(byInverter)
          .sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return String(a).localeCompare(String(b));
          });
        let inverterDisplayIndex = 1;
        for (const inv of sortedInvs) {
          const invHeader = removeDiacritics(`${exportDict.inverter} ${inverterDisplayIndex}`);
          csvRows.push(`"${invHeader}"`);
          for (const c of byInverter[inv]) {
            let resistanceVal = (c.resistance !== undefined && c.resistance !== '') ? removeDiacritics(formatResistanceExport(c.resistance)) : '';
            let valuePart = `${removeDiacritics(c.inverterNumber)}-${removeDiacritics(c.cableLabel)}-${removeDiacritics(c.voltage)}V-${removeDiacritics(c.current)}A-${resistanceVal}`;
            let noteText = '';
            if (c.note && c.note.trim().length > 0) {
              noteText = ` (${removeDiacritics(c.note.trim())})`;
            }
            let errArr = classifyErrors(
              c,
              minVoltage,
              maxVoltage,
              minCurrent,
              maxCurrent,
              minResistance,
              maxResistance
            );
            let errorText = '';
            if (errArr.length > 0) {
              errorText = errArr.map((err) => removeDiacritics(getErrorText(err, exportDict))).join(', ');
            }
            let line = valuePart;
            if (noteText) line += noteText;
            if (errorText) line += ` | ${exportDict.additionalNotes}: ${errorText}`;
            csvRows.push(`"${line}"`);
          }
          inverterDisplayIndex++;
          csvRows.push('""');
        }
        const csvContent = csvRows.join('\r\n');
        const fileName = 'solar_data_excel_compatible.csv';
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
      } catch (e) {
        Alert.alert(t('Export Error'), e.message || String(e));
      }
    }
  };

  const editCable = async (index, key, value) => {
    const updated = [...savedCables];
    updated[index][key] = value;
    setSavedCables(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteCable = async (index) => {
    const updated = savedCables.filter((_, i) => i !== index);
    setSavedCables(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const copyData = async () => {
    const textToCopy = savedCables
      .map(
        (c) =>
          `${c.inverterNumber}-${c.cableLabel}-${c.voltage ? c.voltage + 'V' : ''}-${c.current ? c.current + 'A' : ''}-${formatResistanceExport(c.resistance) || ''}${c.note ? ' (' + c.note + ')' : ''}`
      )
      .join('\n');
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert(t('Data copied to clipboard.'));
  };

  const renderCableErrorsAndNote = (cable, exportLangDict) => {
    const errorsArr = classifyErrors(
      cable,
      minVoltage,
      maxVoltage,
      minCurrent,
      maxCurrent,
      minResistance,
      maxResistance
    );
    const errorText =
      errorsArr.length > 0
        ? errorsArr.map((err) => getErrorText(err, exportLangDict)).join(', ')
        : '';
    const hasPhotoNote = cable.note && cable.note.match(/foto [\dA-Z\-]+/);
    const cablePhotoLabel = hasPhotoNote ? cable.note.match(/foto ([\dA-Z\-]+)/)[1] : null;
    return (
      <View style={{ marginTop: 2 }}>
        {errorText ? (
          <Text style={{ color: colors.danger, fontSize: 13 }}>{errorText}</Text>
        ) : null}
        {cable.note ? (
          <Text style={{ color: colors.accent, fontSize: 13 }}>{cable.note}</Text>
        ) : null}
        {cablePhotoLabel && photoPreviews[cablePhotoLabel] ? (
          <Image
            source={{ uri: photoPreviews[cablePhotoLabel] }}
            style={{ marginTop: 5, marginBottom: 5, width: 100, height: 70, borderRadius: 7, borderWidth: 1, borderColor: '#eee' }}
            resizeMode="cover"
          />
        ) : null}
      </View>
    );
  };

  const renderCableSummary = (cable, exportLangDict, idx = null) => (
    <View key={idx} style={{ marginBottom: 7 }}>
      <Text style={{ fontStyle: 'italic', color: '#333' }}>
        {`${cable.inverterNumber}-${cable.cableLabel}-${cable.voltage}V-${cable.current}A-${formatResistanceExport(cable.resistance)}`}
      </Text>
      {renderCableErrorsAndNote(cable, exportLangDict)}
    </View>
  );

  return (
    <>
      <Modal visible={showOverlayModal} animationType="fade" transparent={true}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            width: '90%',
            maxWidth: 340,
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
              {t('Insert label into photo')}
            </Text>
            <ViewShot ref={overlayShotRef} options={{ format: 'jpg', quality: 0.98 }} style={{
              width: 280,
              height: 200,
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: '#000',
              marginBottom: 12,
            }}>
              {pendingPhoto && (
                <View style={{ flex: 1 }}>
                  <Image
                    source={{ uri: pendingPhoto.uri }}
                    style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 10 }}
                    resizeMode="cover"
                  />
                  <View style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    padding: 7,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    borderBottomRightRadius: 10,
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: 26,
                      textShadowColor: '#000',
                      textShadowOffset: { width: 2, height: 2 },
                      textShadowRadius: 3,
                      letterSpacing: 1,
                    }}>
                      {pendingPhoto.label}
                    </Text>
                  </View>
                </View>
              )}
            </ViewShot>
            <View style={{ flexDirection: 'row', marginTop: 5, gap: 12 }}>
              <TouchableOpacity
                style={[styles.badButton, { backgroundColor: colors.primary }]}
                onPress={handleOverlaySave}
              >
                <Text style={styles.badButtonText}>{t('Save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.badButton, { backgroundColor: colors.danger }]}
                onPress={handleOverlayCancel}
              >
                <Text style={styles.badButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}>{t('Solar Measurement')}</Text>
      </View>

      {!languageSelected && (
        <Modal transparent={true} animationType="slide" visible={!languageSelected}>
          <View style={[styles.languageContainer, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
            <Animated.View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%', transform: [{ scale: languageAnim }] }}>
              <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>{t('Select language')}</Text>
              {['cs', 'en', 'nl', 'zh'].map(lang => (
                <TouchableOpacity key={lang} onPress={() => selectLanguage(lang)} style={styles.badButton}>
                  <Text style={{ fontSize: 20, color: '#fff', textAlign: 'center' }}>
                    {lang === 'cs'
                      ? 'Čeština'
                      : lang === 'en'
                        ? 'English'
                        : lang === 'nl'
                          ? 'Nederlands'
                          : lang === 'zh'
                            ? '中文'
                            : lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </Modal>
      )}

      {languageSelected && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={60}
        >
          <Animated.ScrollView
            style={[styles.container, { opacity: fadeAnim }]}
            contentContainerStyle={styles.innerContainer}
            keyboardShouldPersistTaps="handled"
          >
            {showSaveCriticalMsg && (
              <View style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 8, marginBottom: 10 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                  {t('Critical values saved!')}
                </Text>
              </View>
            )}

            {!viewSaved && !showSettings && (
              <View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconButton}>
                    <Ionicons name="settings-sharp" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setViewSaved(true)} style={styles.iconButton}>
                    <Ionicons name="folder-open" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLanguageSelected(false)} style={styles.iconButton}>
                    <Ionicons name="language" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => exportToText('A')} style={styles.iconButton}>
                    <Ionicons name="download" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => exportToText('B')} style={styles.iconButton}>
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => exportToText('C')} style={styles.iconButton}>
                    <Ionicons name="document-attach" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('Inverter Number')}</Text>
                  <TextInput style={styles.input} placeholder={t('Inverter Number')} value={inverterNumber} onChangeText={setInverterNumber} keyboardType="numeric" />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('Cable')}</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={t('Enter cable (e.g. C2)')}
                      value={cableLabels[cableIndex]}
                      onFocus={() => setCableIndex(-1)}
                      onChangeText={(val) => {
                        const index = cableLabels.indexOf(val.toUpperCase());
                        if (index !== -1) setCableIndex(index);
                      }}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('Voltage (V)')}</Text>
                  <TextInput style={styles.input} placeholder={t('Voltage (V)')} value={voltage} onChangeText={setVoltage} keyboardType="numeric" returnKeyType="next" onSubmitEditing={() => currentInput.current?.focus()} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('Current (A)')}</Text>
                  <TextInput style={styles.input} placeholder={t('Current (A)')} value={current} onChangeText={setCurrent} keyboardType="numeric" returnKeyType="next" onSubmitEditing={() => resistanceInput?.focus()} ref={currentInput} />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('Resistance (MΩ)')}</Text>
                  <TextInput style={styles.input} placeholder={t('Resistance (MΩ)')} value={resistance} onChangeText={setResistance} keyboardType="numeric" returnKeyType="done" ref={(ref) => (resistanceInput = ref)} onSubmitEditing={() => handleNextCable()} />
                </View>

                <Text style={styles.label}>{t('String damage or issue (optional)')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Describe any damage or issue')}
                  value={stringNote}
                  onChangeText={setStringNote}
                />

                <TouchableOpacity style={styles.badButton} onPress={handleNextCable}>
                  <Text style={styles.badButtonText}>{t('Next String')}</Text>
                </TouchableOpacity>

                {/* OCR: pouze ikona skeneru */}
                <TouchableOpacity style={styles.iconButton} onPress={scanValuesFromMeter}>
                  <Ionicons name="scan" size={28} color={colors.primary} />
                </TouchableOpacity>

                {/* Attach Photo: pouze ikona fotoaparátu s pluskem */}
                <TouchableOpacity style={styles.iconButton} onPress={capturePhotoOnly}>
                  <Ionicons name="camera-outline" size={28} color={colors.primary} />
                  <View style={{
                    position: 'absolute',
                    right: 6,
                    top: 4,
                    backgroundColor: colors.accent,
                    width: 16, height: 16,
                    borderRadius: 8,
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 'bold',
                      marginTop: -1,
                    }}>+</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setBadConnector(!badConnector)} style={[styles.badButton, badConnector && { backgroundColor: '#c00' }]}>
                  <Text style={{ color: '#fff' }}>{badConnector ? `✓ ${t('Bad Connector')}` : t('Mark as Bad Connector')}</Text>
                </TouchableOpacity>

                {savedCables.length > 0 && (
                  <View style={{ marginTop: 20, marginBottom: 15 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{t('Last saved')}</Text>
                    {savedCables.slice(-3).reverse().map((c, i) =>
                      renderCableSummary(
                        c,
                        getExportLangStrings(exportLang),
                        i
                      )
                    )}
                  </View>
                )}
              </View>
            )}

            {showSettings && (
              <View>
                <Text style={styles.sectionTitle}>{t('Settings')}</Text>
                <Text style={{ marginVertical: 10 }}>{t('You can configure critical values and cable labeling here.')}</Text>

                <Text style={styles.label}>{t('Number of strings')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('e.g. 6 or 12')}
                  value={String(cableCount)}
                  onChangeText={v => {
                    const num = Number(v.replace(',', '.'));
                    if (!isNaN(num)) setCableCount(num);
                  }}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>{t('Cable Mode')}</Text>
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  {['A', 'B', 'C', 'custom'].map(mode => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setCableMode(mode)}
                      style={[styles.badButton, cableMode === mode && { backgroundColor: '#333' }]}
                    >
                      <Text style={{ color: '#fff' }}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {cableMode === 'custom' && (
                  <TextInput
                    style={styles.input}
                    placeholder={t('e.g. A1-F6')}
                    value={customCableRange}
                    onChangeText={setCustomCableRange}
                  />
                )}

                <Text style={styles.label}>{t('Cable Preview')}</Text>
                <Text style={{ marginBottom: 10, fontStyle: 'italic', color: '#666' }}>
                  {(cableMode !== 'custom'
                    ? generateCableLabels()
                    : generateCustomCableLabels(customCableRange)
                  ).join(', ')}
                </Text>

                <Text style={styles.sectionTitle}>{t('Critical Values')}</Text>

                <Text style={styles.label}>🔌 {t('Voltage (V)')}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('Min')} value={String(minVoltage)} onChangeText={v => setMinVoltage(Number(v.replace(',', '.')))} keyboardType="numeric" />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('Max')} value={String(maxVoltage)} onChangeText={v => setMaxVoltage(Number(v.replace(',', '.')))} keyboardType="numeric" />
                </View>

                <Text style={styles.label}>⚡ {t('Current (A)')}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('Min')} value={String(minCurrent)} onChangeText={v => setMinCurrent(Number(v.replace(',', '.')))} keyboardType="numeric" />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('Max')} value={String(maxCurrent)} onChangeText={v => setMaxCurrent(Number(v.replace(',', '.')))} keyboardType="numeric" />
                </View>

                <Text style={styles.label}>🛡️ {t('Resistance (MΩ)')}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('Min')} value={String(minResistance)} onChangeText={v => setMinResistance(Number(v.replace(',', '.')))} keyboardType="numeric" />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('Max')} value={String(maxResistance)} onChangeText={v => setMaxResistance(Number(v.replace(',', '.')))} keyboardType="numeric" />
                </View>

                <Text style={styles.sectionTitle}>{t('Photo Save Location')}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      const path = FileSystem.documentDirectory;
                      setPhotoSavePath(path);
                      await AsyncStorage.setItem('@photo_save_path', path);
                    }}
                    style={[styles.badButton, photoSavePath === FileSystem.documentDirectory && { backgroundColor: '#333' }]}
                  >
                    <Text style={{ color: '#fff' }}>{t('App Storage')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      // Oprava: Získání oprávnění bez parametrů pro MediaLibrary
                      const permission = await MediaLibrary.requestPermissionsAsync();
                      if (permission.status === 'granted') {
                        const path = FileSystem.cacheDirectory || FileSystem.documentDirectory;
                        setPhotoSavePath(path);
                        await AsyncStorage.setItem('@photo_save_path', path);
                      } else {
                        Alert.alert(t('Permission denied'), t('Cannot access media library.'));
                      }
                    }}
                    style={[styles.badButton, photoSavePath !== FileSystem.documentDirectory && { backgroundColor: '#333' }]}
                  >
                    <Text style={{ color: '#fff' }}>{t('Media / Downloads')}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>{ExportLangDict[exportLang]?.exportLanguage || t('Export Language')}</Text>
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  {['cs', 'en', 'nl', 'zh'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={async () => {
                        setExportLang(lang);
                        await AsyncStorage.setItem(EXPORT_LANG_KEY, lang);
                      }}
                      style={[styles.badButton, exportLang === lang && { backgroundColor: '#333' }]}
                    >
                      <Text style={{ color: '#fff', fontWeight: exportLang === lang ? 'bold' : 'normal' }}>
                        {lang === 'cs'
                          ? 'Čeština'
                          : lang === 'en'
                          ? 'English'
                          : lang === 'nl'
                          ? 'Nederlands'
                          : lang === 'zh'
                          ? '中文'
                          : lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={saveCriticalValues} style={[styles.iconButton, { alignSelf: 'center', marginTop: 10 }]}>
                  <Ionicons name="save" size={28} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.badButton} onPress={() => setShowSettings(false)}>
                  <Text style={styles.badButtonText}>{t('Back')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {viewSaved && (
              <>
                <Text style={styles.sectionTitle}>{t('Saved Strings')}</Text>

                {savedCables.map((cable, index) => (
                  <View key={index} style={styles.editBlock}>
                    <Text style={styles.editBlockTitle}>{`${t('String')} ${index + 1}`}</Text>

                    <Text style={styles.label}>{t('Inverter Number')}</Text>
                    <TextInput
                      style={styles.input}
                      value={cable.inverterNumber}
                      onChangeText={(v) => editCable(index, 'inverterNumber', v)}
                      placeholder={t('e.g. 5')}
                      keyboardType="numeric"
                    />

                    <Text style={styles.label}>{t('Cable')}</Text>
                    <TextInput
                      style={styles.input}
                      value={cable.cableLabel}
                      onChangeText={(v) => editCable(index, 'cableLabel', v)}
                      placeholder={t('e.g. C2')}
                    />

                    <Text style={styles.label}>{t('Voltage (V)')}</Text>
                    <TextInput
                      style={styles.input}
                      value={cable.voltage}
                      onChangeText={(v) => editCable(index, 'voltage', v)}
                      placeholder={t('e.g. 789')}
                      keyboardType="numeric"
                    />

                    <Text style={styles.label}>{t('Current (A)')}</Text>
                    <TextInput
                      style={styles.input}
                      value={cable.current}
                      onChangeText={(v) => editCable(index, 'current', v)}
                      placeholder={t('e.g. 5.2')}
                      keyboardType="numeric"
                    />

                    <Text style={styles.label}>{t('Resistance (MΩ)')}</Text>
                    <TextInput
                      style={styles.input}
                      value={cable.resistance}
                      onChangeText={(v) => editCable(index, 'resistance', v)}
                      placeholder={t('e.g. 65')}
                      keyboardType="numeric"
                    />

                    <Text style={styles.label}>{t('Note')}</Text>
                    <TextInput
                      style={styles.input}
                      value={cable.note || ''}
                      onChangeText={(v) => editCable(index, 'note', v)}
                      placeholder={t('e.g. bad connector')}
                    />

                    {renderCableErrorsAndNote(cable, getExportLangStrings(exportLang))}

                    <TouchableOpacity
                      style={[styles.badButton, { marginTop: 10 }]}
                      onPress={() => deleteCable(index)}
                    >
                      <Text style={styles.badButtonText}>{t('Delete')}</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={{ marginVertical: 20 }}>
                  <TouchableOpacity style={styles.badButton} onPress={copyData}>
                    <Text style={styles.badButtonText}>{t('Copy to Clipboard')}</Text>
                  </TouchableOpacity>
                  <View style={{ height: 10 }} />
                  <TouchableOpacity style={styles.badButton} onPress={clearAllData}>
                    <Text style={styles.badButtonText}>{t('Clear All Data')}</Text>
                  </TouchableOpacity>
                  <View style={{ height: 10 }} />
                  <TouchableOpacity style={styles.badButton} onPress={() => setViewSaved(false)}>
                    <Text style={styles.badButtonText}>{t('Back')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </Animated.ScrollView>
        </KeyboardAvoidingView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 20,
    color: colors.text,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
    color: colors.text,
  },
  badButton: {
    marginVertical: 5,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  badButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
    position: 'relative'
  },
  languageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  lang: {
    fontSize: 30,
    marginVertical: 10,
    color: colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  editBlock: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editBlockTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    color: colors.primary,
  },
});

export default App;