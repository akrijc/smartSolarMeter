import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
  useCallback,
  useMemo,
  Component // ← tohle přidáš
} from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  Switch,
  Keyboard,
} from 'react-native';

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { NavigationContainer, useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TextRecognition from 'react-native-text-recognition';
import * as InAppPurchases from 'expo-in-app-purchases';
import GuideScreen from './src/screens/GuideScreen.js';


class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.log('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Text style={{ color: 'red', padding: 40 }}>
          Error: {this.state.error.message || String(this.state.error)}
        </Text>
      );
    }
    return this.props.children;
  }
}


import de from './src/assets/translation/de.json';
import es from './src/assets/translation/es.json';
import fr from './src/assets/translation/fr.json';

if (!i18n.hasResourceBundle('de', 'translation')) i18n.addResourceBundle('de', 'translation', de);
if (!i18n.hasResourceBundle('es', 'translation')) i18n.addResourceBundle('es', 'translation', es);
if (!i18n.hasResourceBundle('fr', 'translation')) i18n.addResourceBundle('fr', 'translation', fr);

const PLUS_VERSION_KEY = '@plus_version_active';

const PLUS_PRODUCT_ID = 'plus_subscription_monthly';

const ASYNC_LANG_KEY = '@app_language';
const STORAGE_KEY = '@solar_panel_data';
const CRITICAL_VALUES_KEY = '@critical_values';
const EXPORT_LANG_KEY = '@export_lang';
const PHOTO_PREVIEWS_KEY = '@photo_previews';

const MEASURED_FIELDS_KEY = '@measured_fields';

const SettingsContext = createContext();

const defaultCritical = {
  minVoltage: 700,
  maxVoltage: 1000,
  minCurrent: 0,
  maxCurrent: 15,
  minResistance: 1,
  maxResistance: 100,
};

const defaultMeasuredFields = {
  voltage: true,
  current: true,
  resistance: true,
};

const LANGUAGE_ICONS = {
  cs: '🇨🇿',
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  nl: '🇳🇱',
  zh: '🇨🇳',
};

const getLanguageIcon = (lang) => {
  return LANGUAGE_ICONS[lang] || lang.toUpperCase();
};

const getLanguageName = (lang) => {
  switch (lang) {
    case 'cs': return 'Čeština';
    case 'en': return 'English';
    case 'nl': return 'Nederlands';
    case 'zh': return '中文';
    case 'de': return 'Deutsch';
    case 'es': return 'Español';
    case 'fr': return 'Français';
    default: return lang.toUpperCase();
  }
};

const SettingsProvider = ({ children }) => {
  const [cableMode, setCableMode] = useState('A');
  const [numericRange, setNumericRange] = useState('');
  const [cableCount, setCableCount] = useState(6);
  const [customCableRange, setCustomCableRange] = useState('');
  const [exportLang, setExportLang] = useState('cs');
  const [photoSavePath, setPhotoSavePath] = useState(FileSystem.documentDirectory);
  const [critical, setCritical] = useState(defaultCritical);
  const [loading, setLoading] = useState(true);
  const [appLanguage, setAppLanguage] = useState('cs');
  const [measuredFields, setMeasuredFields] = useState(defaultMeasuredFields);
  const [photoLabelMode, setPhotoLabelMode] = useState('both');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const cm = await AsyncStorage.getItem('@cable_mode');
        if (cm) setCableMode(cm);
      } catch {}
      try {
        const cc = await AsyncStorage.getItem('@cable_count');
        if (cc) setCableCount(Number(cc));
      } catch {}
      try {
        const cr = await AsyncStorage.getItem('@custom_cable_range');
        if (cr !== null && cr !== undefined) setCustomCableRange(cr);
      } catch {}
      
      try {
        const nr = await AsyncStorage.getItem('@numeric_range');
        if (nr !== null && nr !== undefined) setNumericRange(nr);
      } catch {}
      try {
        const el = await AsyncStorage.getItem(EXPORT_LANG_KEY);
        if (el) setExportLang(el);
        else setExportLang('en');
      } catch {
        setExportLang('en');
      }
      try {
        const savedPath = await AsyncStorage.getItem('@photo_save_path');
        if (savedPath) setPhotoSavePath(savedPath);
      } catch {}
      try {
        const stored = await AsyncStorage.getItem(CRITICAL_VALUES_KEY);
        if (stored) {
          setCritical(JSON.parse(stored));
        }
      } catch {}
      try {
        const storedAppLang = await AsyncStorage.getItem(ASYNC_LANG_KEY);
        if (storedAppLang) {
          setAppLanguage(storedAppLang);
          if (i18n.language !== storedAppLang) {
            await i18n.changeLanguage(storedAppLang);
          }
        } else {
          setAppLanguage('en');
          await i18n.changeLanguage('en');
        }
      } catch {}
      try {
        const storedMeasured = await AsyncStorage.getItem(MEASURED_FIELDS_KEY);
        if (storedMeasured) {
          setMeasuredFields(JSON.parse(storedMeasured));
        }
      } catch {}
      try {
        const storedPhotoLabelMode = await AsyncStorage.getItem('@photo_label_mode');
        if (storedPhotoLabelMode) setPhotoLabelMode(storedPhotoLabelMode);
      } catch {}
      setLoading(false);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!loading) AsyncStorage.setItem('@cable_mode', cableMode).catch(() => {});
  }, [cableMode, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem('@cable_count', String(cableCount)).catch(() => {});
  }, [cableCount, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem('@numeric_range', numericRange).catch(() => {});
  }, [numericRange, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem(EXPORT_LANG_KEY, exportLang).catch(() => {});
  }, [exportLang, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem('@photo_save_path', photoSavePath).catch(() => {});
  }, [photoSavePath, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem('@photo_label_mode', photoLabelMode).catch(() => {});
  }, [photoLabelMode, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem(CRITICAL_VALUES_KEY, JSON.stringify(critical)).catch(() => {});
  }, [critical, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem(ASYNC_LANG_KEY, appLanguage).catch(() => {});
  }, [appLanguage, loading]);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem(MEASURED_FIELDS_KEY, JSON.stringify(measuredFields)).catch(() => {});
  }, [measuredFields, loading]);

  useEffect(() => {
    if (!loading && i18n.language !== appLanguage) {
      i18n.changeLanguage(appLanguage);
    }
  }, [appLanguage, loading]);

  const updateCritical = (vals) => {
    setCritical({ ...vals });
    AsyncStorage.setItem(CRITICAL_VALUES_KEY, JSON.stringify(vals)).catch(() => {});
  };

  const updateMeasuredFields = (fields) => {
    setMeasuredFields(fields);
    AsyncStorage.setItem(MEASURED_FIELDS_KEY, JSON.stringify(fields)).catch(() => {});
  };

  if (loading) return null;

  return (
    <SettingsContext.Provider
      value={{
        cableMode,
        setCableMode,
        cableCount,
        setCableCount,
        customCableRange,
        setCustomCableRange,
        numericRange,
        setNumericRange,
        exportLang,
        setExportLang,
        photoSavePath,
        setPhotoSavePath,
        critical,
        setCritical: updateCritical,
        appLanguage,
        setAppLanguage,
        measuredFields,
        setMeasuredFields: updateMeasuredFields,
        photoLabelMode,
        setPhotoLabelMode,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

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
    let manipResult = { uri };
    manipResult = await ImageManipulator.manipulateAsync(
      manipResult.uri,
      [
        { resize: { width: 800 } }
      ],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    manipResult = await ImageManipulator.manipulateAsync(
      manipResult.uri,
      [
        { grayscale: true }
      ],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    manipResult = await ImageManipulator.manipulateAsync(
      manipResult.uri,
      [
        { contrast: 1.4 },
        { brightness: -0.1 }
      ],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (e) {
    console.warn('Chyba při preprocessImage:', e);
    return uri;
  }
};

function smartFixDecimal(str, min = 0, max = 9999) {
  if (typeof str !== 'string' || str.length === 0) return str;
  let orig = str;
  if (/^\d+\.\d+$/.test(orig)) return orig;
  if (/^\d+,\d+$/.test(orig)) return orig.replace(',', '.');
  if (/^\d{1,4}$/.test(orig)) {
    const val = parseFloat(orig);
    if (val >= min && val <= max) return orig;
    if (orig.length === 3) {
      let v = parseFloat(orig[0] + '.' + orig.slice(1));
      if (v >= min && v <= max) return (v).toString();
      v = parseFloat(orig.slice(0,2) + '.' + orig.slice(2));
      if (v >= min && v <= max) return (v).toString();
    }
    if (orig.length === 4) {
      let v = parseFloat(orig.slice(0,2) + '.' + orig.slice(2));
      if (v >= min && v <= max) return (v).toString();
      v = parseFloat(orig[0] + '.' + orig.slice(1));
      if (v >= min && v <= max) return (v).toString();
    }
    return orig;
  }
  if (/^\d+\s+\d+$/.test(orig)) {
    let p = orig.replace(/\s+/, '.');
    const v = parseFloat(p);
    if (!isNaN(v) && v >= min && v <= max) return p;
  }
  if (/^\d{3}$/.test(orig)) {
    let v = parseFloat(orig[0] + '.' + orig.slice(1));
    if (v >= min && v <= max) return v.toString();
  }
  if (/^\d+\.\d+\.\d+$/.test(orig)) {
    let idx = orig.indexOf('.', orig.indexOf('.')+1);
    if (idx !== -1) return orig.slice(0, idx);
  }
  return orig;
}

const postprocessOcrText = (raw) => {
  if (!raw) return '';
  let text = raw;
  text = text.replace(/[\u00B0]/g, '');
  text = text.replace(/M0|MO|MOhm|Mohm|M0hm|M0Ω|MQ/gi, 'MΩ');
  text = text.replace(/([^\d])O([^\d])/g, '$10$2');
  text = text.replace(/([^\d])O(\d)/g, '$10$2');
  text = text.replace(/(\d)O([^\d])/g, '$10$2');
  text = text.replace(/\bO\b/g, '0');
  text = text.replace(/\bO(\d)/g, '0$1');
  text = text.replace(/\b([bB])(\d)/g, '8$2');
  text = text.replace(/([bB])/g, '8');
  text = text.replace(/([dD])/g, '0');
  text = text.replace(/(\d)[,](\d)/g, '$1.$2');
  text = text.replace(/(\d)[\s](\d)/g, '$1.$2');
  text = text.replace(/(\d)\s*V/gi, '$1V');
  text = text.replace(/(\d)\s*A/gi, '$1A');
  text = text.replace(/(\d)\s*MΩ/gi, '$1MΩ');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/[^0-9.MΩVA ]/g, '');
  text = text.replace(/(\d{2,4})V/gi, '$1V');
  text = text.replace(/M0|MO/gi, 'MΩ');
  return text.trim();
};

const Stack = createNativeStackNavigator();

const PlusContext = createContext();

const PlusProvider = ({ children }) => {
  const [plus, setPlus] = useState(false);
  const [checking, setChecking] = useState(true);
  

  const [purchaseError, setPurchaseError] = useState('');

  useEffect(() => {
    const checkPurchaseHistory = async () => {
      try {
        await InAppPurchases.connectAsync();
        const history = await InAppPurchases.getPurchaseHistoryAsync();
        const hasPlus = history.results.some(p => p.productId === PLUS_PRODUCT_ID);
        setPlus(hasPlus);
      } catch (e) {
        console.log('Error checking purchase history:', e);
      } finally {
        setChecking(false);
      }
    };
    checkPurchaseHistory();
  }, []);

  useEffect(() => {
    let subscription;
    const purchaseListener = async (result) => {
      if (!result) return;
      const { responseCode, results, errorCode } = result;
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        if (results && results.length > 0) {
          for (let purchase of results) {
            if (!purchase.acknowledged) {
              if (purchase.productId === PLUS_PRODUCT_ID) {
                setPlus(true);
                setPurchaseError('');
                await InAppPurchases.finishTransactionAsync(purchase, false);
              }
            }
          }
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        setPurchaseError('');
      } else {
        setPurchaseError('Purchase error');
      }
    };
    InAppPurchases.setPurchaseListener(purchaseListener);
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  

  const purchasePlus = async () => {
    setPurchaseError('');
    try {
      await InAppPurchases.connectAsync();
      const items = Platform.OS === 'ios'
        ? [PLUS_PRODUCT_ID]
        : [PLUS_PRODUCT_ID];
      await InAppPurchases.getProductsAsync(items);
      await InAppPurchases.purchaseItemAsync(PLUS_PRODUCT_ID);
    } catch (e) {
      setPurchaseError('Error purchasing subscription');
    }
  };

  const value = {
    plus,
    setPlus,
    checking,
    purchasePlus,
    purchaseError,
  };

  return <PlusContext.Provider value={value}>{children}</PlusContext.Provider>;
};

const PlusScreen = ({ navigation }) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const plusCtx = useContext(PlusContext);
 

  const benefits = [
    t('plusBenefit_export', { defaultValue: 'Export to multiple file types' }),
    t('plusBenefit_photos', { defaultValue: 'Save photos with string and inverter label' }),
    t('plusBenefit_critical', { defaultValue: 'Set critical values (auto detection)' }),
    t('plusBenefit_edit', { defaultValue: 'Edit saved strings' }),
    t('plusBenefit_noads', { defaultValue: 'No ads' }),
    t('plusBenefit_unlimited', { defaultValue: 'Unlimited number of strings' }),
    t('plusBenefit_lang', { defaultValue: 'Export language selection' }),
    t('plusBenefit_notes', { defaultValue: 'Add notes to each string' }),
    t('plusBenefit_ocr', { defaultValue: 'OCR scanning of meter values' }),
    t('plusBenefit_select', { defaultValue: 'Choose which values to measure' }),
    t('plusBenefit_bad', { defaultValue: 'Mark damaged connector' }),
    t('plusBenefit_label', { defaultValue: 'Custom string labeling' }),
  ];

  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={{ flex: 1, padding: 24, backgroundColor: '#fff' }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>
          {t('plusBenefitsTitle', { defaultValue: 'With Plus you get:' })}
        </Text>
  
        <View style={{ marginBottom: 20 }}>
          {benefits.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} style={{ marginRight: 7 }} />
              <Text style={{ fontSize: 15 }}>{b}</Text>
            </View>
          ))}
        </View>
  
        {!plusCtx.plus ? (
          <>
            <Text
              style={{
                textAlign: 'center',
                color: colors.text,
                marginBottom: 16,
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              {t('plusSubscriptionNote', {
                defaultValue:
                  'Plus verze je automaticky obnovované předplatné. Cena: 2,99 € / měsíc.',
              })}
            </Text>
            <TouchableOpacity
              style={[styles.badButton, { marginBottom: 20, backgroundColor: colors.primary }]}
              onPress={plusCtx.purchasePlus}
            >
              <Text style={styles.badButtonText}>
                {t('Koupit Plus verzi', { defaultValue: 'Buy Plus version' })}
              </Text>
            </TouchableOpacity>
           
            {plusCtx.purchaseError ? (
              <Text style={{ color: colors.danger, marginBottom: 5 }}>
                {t('Chyba při nákupu.', { defaultValue: 'Purchase error.' })}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ color: colors.accent, marginBottom: 10 }}>
            {t('Plus verze je aktivní!', { defaultValue: 'Plus version active!' })}
          </Text>
        )}
  
        <TouchableOpacity
          style={[styles.badButton, { marginTop: 24, backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.badButtonText}>{t('Back', { defaultValue: 'Back' })}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- EXPORT FUNCTIONS ---

// TXT Export (A)
const generateTXTExport = (data) => {
  const _export = (str) => data.exportLang === 'zh' ? str : removeDiacritics(str);

  let lines = [];
  for (const inv of Object.keys(data.byInverter)) {
    lines.push(_export(data.exportT('Inverter', { defaultValue: 'Inverter' }) + ' ' + inv));
    lines.push('');
    for (const c of data.byInverter[inv]) {
      let valueParts = [
        _export(c.inverterNumber),
        _export(c.cableLabel),
        (c.voltage !== undefined && c.voltage !== '') ? _export(c.voltage + data.exportT('V', { defaultValue: 'V' })) : '',
        (c.current !== undefined && c.current !== '') ? _export(c.current + data.exportT('A', { defaultValue: 'A' })) : '',
        (c.resistance !== undefined && c.resistance !== '') ? _export(c.resistance + data.exportT('MOhm', { defaultValue: 'MOhm' })) : '',
      ];
      let line = valueParts.filter(Boolean).join('-');

      let notes = [];
      if (c.note && c.note.trim()) {
        let note = c.note;
        note = note.replace(/low voltage/gi, data.exportT('low voltage', { defaultValue: 'low voltage' }));
        note = note.replace(/bad connector/gi, data.exportT('bad connector', { defaultValue: 'bad connector' }));
        note = note.replace(/nizke napeti/gi, data.exportT('low voltage', { defaultValue: 'low voltage' }));
        note = note.replace(/spatny konektor/gi, data.exportT('bad connector', { defaultValue: 'bad connector' }));
        notes.push(_export(note));
      }

      if (c.errors && c.errors.length > 0) {
        notes.push(
          _export(c.errors.map(err => data.exportT(err, { defaultValue: err })).join('; '))
        );
      }

      if (notes.length > 0) line += ' - ' + notes.join(' | ');

      lines.push(line);
    }
    lines.push('');
  }
  return lines.join('\n');
};


// CSV Export (B) - single column
const generateCSVExportSingleColumn = (data) => {
  const _export = (str) => data.exportLang === 'zh' ? str : removeDiacritics(str);

  let rows = [];
  for (const inv of Object.keys(data.byInverter)) {
    rows.push(`"${_export(data.exportT('Inverter', { defaultValue: 'Inverter' }) + ' ' + inv)}"`);
    rows.push('""');
    for (const c of data.byInverter[inv]) {
      let valueParts = [
        _export(c.inverterNumber),
        _export(c.cableLabel),
        (c.voltage !== undefined && c.voltage !== '') ? _export(c.voltage + data.exportT('V', { defaultValue: 'V' })) : '',
        (c.current !== undefined && c.current !== '') ? _export(c.current + data.exportT('A', { defaultValue: 'A' })) : '',
        (c.resistance !== undefined && c.resistance !== '') ? _export(c.resistance + data.exportT('MOhm', { defaultValue: 'MOhm' })) : '',
      ];
      let line = valueParts.filter(Boolean).join('-');

      let notes = [];
      if (c.note && c.note.trim()) {
        let note = c.note;
        note = note.replace(/low voltage/gi, data.exportT('low voltage', { defaultValue: 'low voltage' }));
        note = note.replace(/bad connector/gi, data.exportT('bad connector', { defaultValue: 'bad connector' }));
        note = note.replace(/nizke napeti/gi, data.exportT('low voltage', { defaultValue: 'low voltage' }));
        note = note.replace(/spatny konektor/gi, data.exportT('bad connector', { defaultValue: 'bad connector' }));
        notes.push(_export(note));
      }

      if (c.errors && c.errors.length > 0) {
        notes.push(
          _export(c.errors.map(err => data.exportT(err, { defaultValue: err })).join('; '))
        );
      }

      if (notes.length > 0) line += ' - ' + notes.join(' | ');

      rows.push(`"${line}"`);
    }
    rows.push('""');
  }
  return '\uFEFF' + rows.join('\r\n');
};


// CSV Export (C) - each value in separate column
const generateCSVExportMultipleColumns = (data) => {
  const _export = (str) => data.exportLang === 'zh' ? str : removeDiacritics(str);

  const colNames = [
    _export(data.exportT('Inverter', { defaultValue: 'Inverter' })),
    _export(data.exportT('Cable', { defaultValue: 'Cable' })),
    _export(data.exportT('Voltage', { defaultValue: 'Voltage' })),
    _export(data.exportT('Current', { defaultValue: 'Current' })),
    _export(data.exportT('Resistance', { defaultValue: 'Resistance' })),
    _export(data.exportT('Errors', { defaultValue: 'Errors' })),
  ];

  function escapeCsv(val) {
    if (val === undefined || val === null) return '';
    let v = String(val);
    if (v.includes('"')) v = v.replace(/"/g, '""');
    if (v.includes(',') || v.includes('"')) return `"${v}"`;
    return v;
  }

  let csvRows = [];
  csvRows.push(colNames.map(escapeCsv));

  const sortedInvs = Object.keys(data.byInverter)
    .sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });

  for (const inv of sortedInvs) {
    csvRows.push([
      escapeCsv(_export(data.exportT('Inverter', { defaultValue: 'Inverter' }) + ' ' + inv)),
      '', '', '', '', ''
    ]);

    for (const c of data.byInverter[inv]) {
      let errorArr = [];

      if (c.voltage !== undefined && c.voltage !== '') {
        const v = parseFloat(c.voltage);
        if (!isNaN(v)) {
          if (v < data.critical.minVoltage) errorArr.push(data.exportT('low voltage', { defaultValue: 'low voltage' }));
          if (v > data.critical.maxVoltage) errorArr.push(data.exportT('high voltage', { defaultValue: 'high voltage' }));
        }
      }

      if (c.current !== undefined && c.current !== '') {
        const a = parseFloat(c.current);
        if (!isNaN(a)) {
          if (a < data.critical.minCurrent) errorArr.push(data.exportT('low current', { defaultValue: 'low current' }));
          if (a > data.critical.maxCurrent) errorArr.push(data.exportT('high current', { defaultValue: 'high current' }));
        }
      }

      if (c.resistance !== undefined && c.resistance !== '') {
        let r = c.resistance;
        if (typeof r === 'string') {
          r = r.replace(/[^\d.]/g, '');
        }
        r = parseFloat(r);
        if (!isNaN(r)) {
          if (r < data.critical.minResistance) errorArr.push(data.exportT('low resistance', { defaultValue: 'low resistance' }));
          if (r > data.critical.maxResistance) errorArr.push(data.exportT('high resistance', { defaultValue: 'high resistance' }));
        }
      }

      if (c.note && typeof c.note === 'string') {
        let note = c.note.toLowerCase();
        if (note.includes('bad connector') || note.includes('spatny konektor')) {
          errorArr.push(data.exportT('bad connector', { defaultValue: 'bad connector' }));
        }
        if (note.includes('low voltage') || note.includes('nizke napeti')) {
          if (!errorArr.includes(data.exportT('low voltage', { defaultValue: 'low voltage' }))) {
            errorArr.push(data.exportT('low voltage', { defaultValue: 'low voltage' }));
          }
        }
      }

      errorArr = errorArr.map(e => _export(e));

      let row = [
        _export(c.inverterNumber ?? ''),
        _export(c.cableLabel ?? ''),
        (c.voltage !== undefined && c.voltage !== '') ? _export(`${c.voltage}${data.exportT('V', { defaultValue: 'V' })}`) : '',
        (c.current !== undefined && c.current !== '') ? _export(`${c.current}${data.exportT('A', { defaultValue: 'A' })}`) : '',
        (c.resistance !== undefined && c.resistance !== '') ? _export(`${c.resistance}${data.exportT('MOhm', { defaultValue: 'MOhm' })}`) : '',
        errorArr.join('; ')
      ];

      while (row.length < 6) row.push('');
      row = row.slice(0, 6);
      csvRows.push(row.map(escapeCsv));
    }

    csvRows.push(['', '', '', '', '', '']);
  }

  const delimiter = data.exportLang === 'zh' ? '\t' : ';';
  return '\uFEFF' + csvRows.map(r => r.join(delimiter)).join('\r\n');
};

function incrementLetterBlock(current) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let arr = current.split('');
  let i = arr.length - 1;
  while (i >= 0 && arr[i] === 'z') {
    arr[i] = 'a';
    i--;
  }
  if (i < 0) {
    arr.unshift('A');
  } else if (arr[i] === 'Z') {
    arr[i] = 'A';
    arr.push('a');
  } else {
    arr[i] = String.fromCharCode(arr[i].charCodeAt(0) + 1);
  }
  return arr.join('');
}
function getNextLetterBlock(label) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (/^[A-Z]+$/.test(label)) {
    if (label === 'Z') return 'Aa';
    let last = label[label.length - 1];
    if (last !== 'Z') {
      return label.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 1);
    } else {
      return label + 'a';
    }
  }
  let base = label.slice(0, -1);
  let last = label[label.length - 1];
  if (last !== 'z') {
    return base + String.fromCharCode(last.charCodeAt(0) + 1);
  } else {
    let before = getNextLetterBlock(base);
    return before + 'a';
  }
}

function incrementAlpha(alpha) {
  let carry = 1;
  let result = '';
  for (let i = alpha.length - 1; i >= 0; i--) {
    const code = alpha.charCodeAt(i) - 65 + carry;
    carry = Math.floor(code / 26);
    result = String.fromCharCode((code % 26) + 65) + result;
  }
  if (carry > 0) result = 'A' + result;
  return result;
}

function getCustomCableLabels(rangeStr) {
  const match = rangeStr.match(/^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/i);
  if (!match) return [];

  const startLetter = match[1].toUpperCase();
  const startNumber = parseInt(match[2]);
  const endLetter = match[3].toUpperCase();
  const endNumber = parseInt(match[4]);

  const labels = [];

  let currentLetter = startLetter;
  while (true) {
    for (let n = startNumber; n <= endNumber; n++) {
      labels.push(`${currentLetter}${n}`);
    }
    if (currentLetter === endLetter) break;
    currentLetter = incrementAlpha(currentLetter); // Tato funkce bude přidána později
    if (currentLetter.length > 4) break; // ochrana proti nekonečné smyčce
  }

  return labels;
}

function alphaLabel(index) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let label = '';
  let n = index;
  while (n >= 0) {
    label = letters[n % 26] + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

function getCableLabels(mode, count, customRange, numericRange) {
  const letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  if (mode === 'A') {
    let labels = [];
    for (let i = 0; i < count; i++) {
      let idx = i % 26;
      let round = Math.floor(i / 26);
      let label = letters[idx];
      if (round > 0) {
        label += String.fromCharCode(97 + (round - 1) % 26);
        if (round > 26) {
          let more = Math.floor((round-1)/26);
          for (let m = 0; m < more; m++) {
            label += String.fromCharCode(97 + m % 26);
          }
        }
      }
      labels.push(label);
    }
    return labels;
  } else if (mode === 'B') {
    let labels = [];
    for (let i = 0; labels.length < count; i++) {
      let label = alphaLabel(i);
      labels.push(label + '1');
      if (labels.length < count) labels.push(label + '2');
    }
    return labels.slice(0, count);
  } else if (mode === 'numeric' && numericRange) {
    return getNumericLabels(numericRange, count);
  } else if (mode === 'custom' && customRange) {
    let labels = getCustomCableLabels(customRange);
    return labels.slice(0, count);
  }
  return [];
}

function getNumericLabels(rangeStr, count) {
  if (!rangeStr) return [];
  let matchFlat = rangeStr.match(/^(\d+)\s*-\s*(\d+)$/);
  let matchSub = rangeStr.match(/^(\d+)\.(\d+)\s*-\s*(\d+)\.(\d+)$/);
  const result = [];

  if (matchFlat) {
    let start = parseInt(matchFlat[1]);
    let end = parseInt(matchFlat[2]);
    if (isNaN(start) || isNaN(end) || start > end) return [];
    for (let i = start; i <= end && result.length < count; i++) {
      result.push(i.toString());
    }
    return result;
  } else if (matchSub) {
    let majorStart = parseInt(matchSub[1]);
    let minorStart = parseInt(matchSub[2]);
    let majorEnd = parseInt(matchSub[3]);
    let minorEnd = parseInt(matchSub[4]);
    if (isNaN(majorStart) || isNaN(majorEnd) || isNaN(minorStart) || isNaN(minorEnd)) return [];
    let currentMajor = majorStart;
    let currentMinor = minorStart;
    while (
      (currentMajor < majorEnd) ||
      (currentMajor === majorEnd && currentMinor <= minorEnd)
    ) {
      result.push(`${currentMajor}.${currentMinor}`);
      currentMinor++;
      if (currentMinor > 99) {
        currentMinor = 1;
        currentMajor++;
      }
      if (result.length >= count) break;
    }
    return result;
  }

  return [];
}

function SettingsScreen({ navigation }) {
  const { t, i18n: i18nInstance } = useTranslation();
  const settings = useContext(SettingsContext);
  const plusCtx = useContext(PlusContext);
  console.log('settings', settings);
  console.log('plusCtx', plusCtx);
  

  const [minVoltage, setMinVoltage] = useState(settings.critical.minVoltage);
  const [maxVoltage, setMaxVoltage] = useState(settings.critical.maxVoltage);
  const [minCurrent, setMinCurrent] = useState(settings.critical.minCurrent);
  const [maxCurrent, setMaxCurrent] = useState(settings.critical.maxCurrent);
  const [minResistance, setMinResistance] = useState(settings.critical.minResistance);
  const [maxResistance, setMaxResistance] = useState(settings.critical.maxResistance);

  useEffect(() => {
    setMinVoltage(settings.critical.minVoltage);
    setMaxVoltage(settings.critical.maxVoltage);
    setMinCurrent(settings.critical.minCurrent);
    setMaxCurrent(settings.critical.maxCurrent);
    setMinResistance(settings.critical.minResistance);
    setMaxResistance(settings.critical.maxResistance);
  }, [settings.critical]);



  const cableLabelsPreview = getCableLabels(
    settings.cableMode,
    settings.cableCount,
    settings.customCableRange,
    settings.numericRange
  );
  
  const appLang = i18nInstance.language || 'en';

  const handleSaveCritical = () => {
    const newCritical = {
      minVoltage,
      maxVoltage,
      minCurrent,
      maxCurrent,
      minResistance,
      maxResistance,
    };
    settings.setCritical(newCritical);
    AsyncStorage.setItem(CRITICAL_VALUES_KEY, JSON.stringify(newCritical)).then(() => {
      Alert.alert(t('criticalValuesSaved', { defaultValue: 'Critical values saved!' }));
      navigation.goBack();
    });
  };

  const handleVoltageInput = (val, setter) => {
    let clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    setter(clean);
  };
  const handleCurrentInput = (val, setter) => {
    let clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    setter(clean);
  };
  const handleResistanceInput = (val, setter) => {
    let clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    setter(clean);
  };

  const handleAppLanguageChange = async (lang) => {
    settings.setAppLanguage(lang);
    await i18nInstance.changeLanguage(lang);
    await AsyncStorage.setItem(ASYNC_LANG_KEY, lang);
  };

  const cableModes = plusCtx.plus
  ? [
      { key: 'A', label: 'A' },
      { key: 'B', label: 'B' },
      { key: 'numeric', label: (<><Ionicons name="calculator" size={15} color={colors.primary} /> {t('Numeric', { defaultValue: 'Numeric' })}</>) },
      { key: 'custom', label: t('Custom', { defaultValue: 'Custom' }) },
    ]
  : [
      { key: 'A', label: 'A' }
    ];

  const measuredFields = settings.measuredFields || defaultMeasuredFields;

  useEffect(() => {
    if (!plusCtx.plus) {
      if (
        !measuredFields.voltage ||
        !measuredFields.current ||
        !measuredFields.resistance
      ) {
        settings.setMeasuredFields({
          voltage: true,
          current: true,
          resistance: true,
        });
      }
    }
  }, [plusCtx.plus, settings, measuredFields]);

  const toggleMeasuredField = (field) => {
    if (!plusCtx.plus) return;
    settings.setMeasuredFields({
      voltage: field === 'voltage' ? !measuredFields.voltage : measuredFields.voltage,
      current: field === 'current' ? !measuredFields.current : measuredFields.current,
      resistance: field === 'resistance' ? !measuredFields.resistance : measuredFields.resistance,
    });
  };
  

  const maxCableCount = plusCtx.plus ? 1000 : 8;

  const languageOptions = ['cs','en','nl','zh','de','es','fr'];

  // --- Custom Range validace ---
  const [customRangeError, setCustomRangeError] = useState('');
  useEffect(() => {
    if (settings.cableMode === 'custom' && plusCtx.plus) {
      if (settings.customCableRange && settings.customCableRange.length > 0) {
        const valid = /^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/i.test(settings.customCableRange);
        if (!valid) {
          setCustomRangeError(t('customRangeError', { defaultValue: 'Invalid format! Use e.g. A1-F6.' }));
        } else {
          setCustomRangeError('');
        }
      } else {
        setCustomRangeError('');
      }
    } else {
      setCustomRangeError('');
    }
  }, [settings.customCableRange, settings.cableMode, plusCtx.plus, t]);

  useEffect(() => {
    if (settings.cableMode !== 'numeric' && settings.numericRange !== '') {
      settings.setNumericRange('');
    }
  }, [settings.cableMode]);

  useEffect(() => {
    if (!plusCtx.plus && settings.exportLang !== 'en') {
      settings.setExportLang('en');
    }
  }, [plusCtx.plus]);

 

  // --- Kritické hodnoty - zabalit inputy do KeyboardAvoidingView & ScrollView kvůli klávesnici ---
  return (
    <>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.sectionTitle}>{t('Settings', { defaultValue: 'Settings' })}</Text>
        <Text style={{ color: '#666', marginBottom: 10 }}>{t('You can configure critical values and cable labeling here.', { defaultValue: 'You can configure critical values and cable labeling here.' })}</Text>
        <Text style={styles.label}>{t('Cable Mode', { defaultValue: 'Cable Mode' })}</Text>
        <View style={{ flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap' }}>
          {cableModes.map(mode => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.badButton,
                settings.cableMode === mode.key && { backgroundColor: colors.accent }
              ]}
              onPress={() => settings.setCableMode(mode.key)}
              disabled={mode.key === 'custom' && !plusCtx.plus}
            >
              <Text style={styles.badButtonText}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
          {!plusCtx.plus && (
            <>
              <TouchableOpacity style={[styles.badButton, { backgroundColor: '#bbb' }]} disabled={true}>
                <Text style={[styles.badButtonText, { color: '#fff', opacity: 0.5 }]}>{t('Custom', { defaultValue: 'Custom' })}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={styles.formGroup}>
          <Text>{t('Number of strings', { defaultValue: 'Number of strings' })}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={settings.cableCount === 0 ? '' : String(settings.cableCount)}
            onChangeText={v => {
              if (v === '') {
                settings.setCableCount(0);
              } else {
                let value = Number(v.replace(/[^0-9]/g, ''));
                if (isNaN(value)) value = 0;
                if (value < 0) value = 0;
                if (value > maxCableCount) value = maxCableCount;
                settings.setCableCount(value);
              }
            }}
            onBlur={() => {
              if (!settings.cableCount || isNaN(settings.cableCount) || settings.cableCount < 1) {
                settings.setCableCount(1);
              }
            }}
          />
          <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            {t('Max', { defaultValue: 'Max' })}: {maxCableCount}
          </Text>
          {!plusCtx.plus && (
            <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              {t('unlimitedPlus', { defaultValue: 'Ve verzi Plus neomezený počet.' })}
            </Text>
          )}
        </View>
        {settings.cableMode === 'custom' && plusCtx.plus ? (
          <View style={styles.formGroup}>
            <Text>{t('customRangeLabel', { defaultValue: 'custom range (např. A1-F6)' })}</Text>
            <TextInput
              style={styles.input}
              value={settings.customCableRange}
              onChangeText={v => {
                settings.setCustomCableRange(v);
              }}
              placeholder={t('customRangeLabel', { defaultValue: 'custom range (např. A1-F6)' })}
              autoCapitalize="characters"
            />
            {!!customRangeError && (
              <Text style={{ color: colors.danger, fontSize: 13 }}>{customRangeError}</Text>
            )}
          </View>
        ) : null}
        {settings.cableMode === 'numeric' && plusCtx.plus ? (
    <View style={styles.formGroup}>
      <Text>
        <Ionicons name="calculator" size={15} color={colors.primary} />{' '}
        {t('Numeric range (e.g. 1-500 or 1.1-1.20)', { defaultValue: 'Numeric range (e.g. 1-500 or 1.1-1.20)' })}
      </Text>
      <TextInput
        style={styles.input}
        value={settings.numericRange}
        onChangeText={v => {
          settings.setNumericRange(v);
        }}
        placeholder={t('Numeric range (e.g. 1-500 or 1.1-1.20)', { defaultValue: 'Numeric range (e.g. 1-500 or 1.1-1.20)' })}
        autoCapitalize="none"
      />
      {settings.numericRange !== '' && getNumericLabels(settings.numericRange, settings.cableCount).length === 0 && (
        <Text style={{ color: colors.danger, fontSize: 13 }}>
          {t('Invalid numeric range!', { defaultValue: 'Invalid numeric range!' })}
        </Text>
      )}
    </View>
  ) : null}
        <Text style={styles.label}>{t('Preview', { defaultValue: 'Preview' })}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {cableLabelsPreview.slice(0, 10).map((label, idx) => (
            <View key={label} style={{
              backgroundColor: '#e9ecef',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 3,
              marginRight: 6,
              marginBottom: 6,
            }}>
              <Text style={{ fontSize: 15, color: colors.text }}>{label}</Text>
            </View>
          ))}
          {cableLabelsPreview.length > 10 && (
            <View style={{
              backgroundColor: '#e9ecef',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 3,
              marginRight: 6,
              marginBottom: 6,
            }}>
              <Text style={{ fontSize: 15, color: colors.text }}>…</Text>
            </View>
          )}
        </View>
        
  
  {plusCtx.plus ? (
  <>
    <Text style={styles.label}>{t('Export Language', { defaultValue: 'Export Language' })}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {languageOptions.map(lang => (
          <TouchableOpacity
            key={lang}
            style={{
              alignItems: 'center',
              marginRight: 14,
              padding: 5,
              borderRadius: 8,
              borderWidth: settings.exportLang === lang ? 2 : 0,
              borderColor: colors.primary,
              backgroundColor: settings.exportLang === lang ? '#e0f7ef' : 'transparent',
              minWidth: 48,
              flexDirection: 'row',
            }}
            onPress={() => settings.setExportLang(lang)}
          >
            <Text style={{ fontSize: 20, marginRight: 6 }}>
              {getLanguageIcon(lang)}
            </Text>
            <Text style={{ fontSize: 13, color: colors.text }}>
              {getLanguageName(lang)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </>
) : (
  <>
    <Text style={styles.label}>{t('Export Language', { defaultValue: 'Export Language' })}</Text>
    <Text style={{ color: '#888', marginBottom: 12 }}>
      {t('Export language is fixed to English in Free version.', { defaultValue: 'Export language is fixed to English in Free version.' })}
    </Text>
  </>
)}

        <Text style={styles.label}>{t('Measured parameters', { defaultValue: 'Measured parameters' })}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
            onPress={() => toggleMeasuredField('voltage')}
            disabled={!plusCtx.plus}
          >
            <Ionicons name={measuredFields.voltage ? "checkbox-outline" : "square-outline"} size={24} color={colors.primary} />
            <Text style={{ marginLeft: 4 }}>{t('Voltage', { defaultValue: 'Voltage' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
            onPress={() => toggleMeasuredField('current')}
            disabled={!plusCtx.plus}
          >
            <Ionicons name={measuredFields.current ? "checkbox-outline" : "square-outline"} size={24} color={colors.primary} />
            <Text style={{ marginLeft: 4 }}>{t('Current', { defaultValue: 'Current' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => toggleMeasuredField('resistance')}
            disabled={!plusCtx.plus}
          >
            <Ionicons name={measuredFields.resistance ? "checkbox-outline" : "square-outline"} size={24} color={colors.primary} />
            <Text style={{ marginLeft: 4 }}>{t('Resistance', { defaultValue: 'Resistance' })}</Text>
          </TouchableOpacity>
        </View>
        {!plusCtx.plus && (
          <Text style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>
            {t('freeLimitedNotice', { defaultValue: 'In the free version, only voltage and current measurements are available.' })}
          </Text>
        )}
        <Text style={styles.label}>{t('Select language', { defaultValue: 'Select language' })}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {languageOptions.map(lang => (
              <TouchableOpacity
                key={lang}
                style={{
                  alignItems: 'center',
                  marginRight: 14,
                  padding: 5,
                  borderRadius: 8,
                  borderWidth: settings.appLanguage === lang ? 2 : 0,
                  borderColor: colors.accent,
                  backgroundColor: settings.appLanguage === lang ? '#e0f7ef' : 'transparent',
                  minWidth: 48,
                  flexDirection: 'row',
                }}
                onPress={() => handleAppLanguageChange(lang)}
              >
                <Text style={{ fontSize: 20, marginRight: 6 }}>
                  {getLanguageIcon(lang)}
                </Text>
                <Text style={{ fontSize: 13, color: colors.text }}>
                  {getLanguageName(lang)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

             

        {plusCtx.plus && (
          <>
            <Text style={styles.label}>{t('Critical Values', { defaultValue: 'Critical Values' })}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 10 }}>
              <View style={{ flex: 1, minWidth: 130 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>⚡ {t('Voltage', { defaultValue: 'Voltage' })}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: '#888', width: 22 }}>{t('Min', { defaultValue: 'Min' })}</Text>
                  <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={String(minVoltage)} onChangeText={v => handleVoltageInput(v, setMinVoltage)} />
                  <Text style={{ color: '#888', width: 22 }}>{t('Max', { defaultValue: 'Max' })}</Text>
                  <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={String(maxVoltage)} onChangeText={v => handleVoltageInput(v, setMaxVoltage)} />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 10 }}>
              <View style={{ flex: 1, minWidth: 130 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>🔌 {t('Current', { defaultValue: 'Current' })}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: '#888', width: 22 }}>{t('Min', { defaultValue: 'Min' })}</Text>
                  <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={String(minCurrent)} onChangeText={v => handleCurrentInput(v, setMinCurrent)} />
                  <Text style={{ color: '#888', width: 22 }}>{t('Max', { defaultValue: 'Max' })}</Text>
                  <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={String(maxCurrent)} onChangeText={v => handleCurrentInput(v, setMaxCurrent)} />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 10 }}>
              <View style={{ flex: 1, minWidth: 130 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>🛡️ {t('Resistance', { defaultValue: 'Resistance' })}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: '#888', width: 22 }}>{t('Min', { defaultValue: 'Min' })}</Text>
                  <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={String(minResistance)} onChangeText={v => handleResistanceInput(v, setMinResistance)} />
                  <Text style={{ color: '#888', width: 22 }}>{t('Max', { defaultValue: 'Max' })}</Text>
                  <TextInput style={[styles.input, { flex: 1 }]} keyboardType="decimal-pad" value={String(maxResistance)} onChangeText={v => handleResistanceInput(v, setMaxResistance)} />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.badButton, { backgroundColor: colors.accent, marginTop: 12, marginBottom: 16 }]}
              onPress={handleSaveCritical}
            >
              <Text style={styles.badButtonText}>{t('Save', { defaultValue: 'Save' })}</Text>
            </TouchableOpacity>
            <Text style={styles.label}>{t('Photo Save Location', { defaultValue: 'Photo Save Location' })}</Text>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <TouchableOpacity style={[styles.badButton, settings.photoSavePath === FileSystem.documentDirectory && { backgroundColor: colors.accent }]} onPress={() => settings.setPhotoSavePath(FileSystem.documentDirectory)}>
                <Text style={styles.badButtonText}>{t('App Storage', { defaultValue: 'App Storage' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.badButton, settings.photoSavePath !== FileSystem.documentDirectory && { backgroundColor: colors.accent }]} onPress={() => settings.setPhotoSavePath(FileSystem.cacheDirectory)}>
                <Text style={styles.badButtonText}>{t('Media / Downloads', { defaultValue: 'Media / Downloads' })}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>{t('Photo label mode', { defaultValue: 'Photo label mode' })}</Text>
<View style={{ flexDirection: 'row', marginBottom: 10 }}>
  <TouchableOpacity
    style={[
      styles.badButton,
      settings.photoLabelMode === 'both' && { backgroundColor: colors.accent }
    ]}
    onPress={() => settings.setPhotoLabelMode('both')}
  >
    <Text style={styles.badButtonText}>{t('Inverter-String', { defaultValue: 'Inverter-String' })}</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[
      styles.badButton,
      settings.photoLabelMode === 'string' && { backgroundColor: colors.accent }
    ]}
    onPress={() => settings.setPhotoLabelMode('string')}
  >
    <Text style={styles.badButtonText}>{t('Only String', { defaultValue: 'Only String' })}</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[
      styles.badButton,
      settings.photoLabelMode === 'inverter' && { backgroundColor: colors.accent }
    ]}
    onPress={() => settings.setPhotoLabelMode('inverter')}
  >
    <Text style={styles.badButtonText}>{t('Only Inverter', { defaultValue: 'Only Inverter' })}</Text>
  </TouchableOpacity>
</View>
<Text style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>
  {t('Choose what will be displayed as the label on the photo: inverter number, string name, or both.', { defaultValue: 'Choose what will be displayed as the label on the photo: inverter number, string name, or both.' })}
</Text>
          </>
        )}
        <TouchableOpacity style={[styles.badButton, { marginTop: 24 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.badButtonText}>{t('Back', { defaultValue: 'Back' })}</Text>
        </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>

    
  </>
);
}

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

const getTimestamp = () => {
  const now = new Date();
  const pad = (n) => n < 10 ? '0'+n : n;
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
};

const promptForFilename = async (defaultName, platformModal, t) => {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('Save', { defaultValue: 'Save' }),
        t('Enter file name (without .csv)', { defaultValue: 'Enter file name (without .csv)' }),
        [
          {
            text: t('Cancel', { defaultValue: 'Cancel' }),
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: t('Save', { defaultValue: 'Save' }),
            onPress: (text) => resolve((text || '').trim()),
          },
        ],
        'plain-text',
        defaultName
      );
    } else {
      platformModal(defaultName, resolve);
    }
  });
};

function removeDiacritics(str) {
  if (!str) return str;
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getExportTranslator(exportLang) {
  return (key, options = {}) => i18n.t(key, { lng: exportLang, ...options });
}

const exportDataToFile = async ({ content, fileBaseName, extension, dialogTitle, showFilenamePrompt, tExport }) => {
  try {
    if (content === undefined || content === null || (typeof content === 'string' && content.trim() === '')) {
      Alert.alert(
        tExport('Export Error', { defaultValue: 'Export Error' }),
        tExport('Nothing to export', { defaultValue: 'Nothing to export' })
      );
      return;
    }

    let filename = fileBaseName;
    let promptName = await promptForFilename(fileBaseName, showFilenamePrompt, tExport);
    if (promptName && promptName.trim().length > 0) {
      filename = removeDiacritics(promptName.trim());
    }

    let time = getTimestamp();
    let outputFilename = `${filename}_${time}${extension}`;
    const fileUri = FileSystem.cacheDirectory + outputFilename;
    await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      Alert.alert(
        tExport('Export Error', { defaultValue: 'Export Error' }),
        tExport('File was not created. Please try again.', { defaultValue: 'File was not created. Please try again.' })
      );
      return;
    }

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert(tExport('Error', { defaultValue: 'Error' }), tExport('Sharing is not available on this device.', { defaultValue: 'Sharing is not available on this device.' }));
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: extension === '.csv' ? 'text/csv' : 'text/plain',
      dialogTitle: `${dialogTitle} ${outputFilename}`,
      UTI: extension === '.csv' ? 'public.comma-separated-values-text' : 'public.plain-text',
    });
  } catch (e) {
    Alert.alert(
      tExport('Export Error', { defaultValue: 'Export Error' }),
      e.message || String(e)
    );
    return;
  }
};

const MainScreen = ({ navigation, route }) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const settings = useContext(SettingsContext);
  const plusCtx = useContext(PlusContext);
  const [ocrScanCount, setOcrScanCount] = useState(0);
  

  const [languageSelected, setLanguageSelected] = useState(false);
  const [stringNote, setStringNote] = useState('');
  const [viewSaved, setViewSaved] = useState(false);
  const [inverterNumber, setInverterNumber] = useState('');
  const [voltage, setVoltage] = useState('');
  const [current, setCurrent] = useState('');
  const [resistance, setResistance] = useState('');
  const [cableIndex, setCableIndex] = useState(0);
  const [savedCables, setSavedCables] = useState([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const currentInput = useRef(null);
  let resistanceInput = useRef(null);
  const [badConnector, setBadConnector] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [showSaveCriticalMsg, setShowSaveCriticalMsg] = useState(false);
  const [showOverlayModal, setShowOverlayModal] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [overlayLabel, setOverlayLabel] = useState('');
  const overlayShotRef = useRef(null);
  const overlayModalCallbackRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const languageAnim = useRef(new Animated.Value(0)).current;
  const [editCableIndex, setEditCableIndex] = useState(null);
  const [editCableData, setEditCableData] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [filenamePromptVisible, setFilenamePromptVisible] = useState(false);
  const [filenamePromptValue, setFilenamePromptValue] = useState('');
  const [filenamePromptCb, setFilenamePromptCb] = useState(() => ()=>{});

  const isFocused = useIsFocused();
  console.log('languageSelected', languageSelected);

  const exportLang = plusCtx.plus ? settings.exportLang : 'en';
  const exportT = useMemo(() => getExportTranslator(exportLang), [exportLang]);

  useEffect(() => {
    if (route.params && route.params.ocrResult) {
      const res = route.params.ocrResult;
      if (res.voltage) setVoltage(res.voltage);
      if (res.current) setCurrent(res.current);
      if (res.resistance) setResistance(res.resistance);
      if (res.inverterNumber) setInverterNumber(res.inverterNumber);
      if (res.cableLabel) {
        setCableIndex((labels) => {
          const cableLabels = getCableLabels(settings.cableMode, settings.cableCount, settings.customCableRange);
          const idx = cableLabels.indexOf(res.cableLabel);
          return idx !== -1 ? idx : 0;
        });
      }
      navigation.setParams({ ocrResult: undefined });
    }
  }, [route.params?.ocrResult]);

  useEffect(() => {
    if (
      route.params &&
      route.params.photoUri &&
      route.params.inverterNumber &&
      route.params.cableLabel
    ) {
      const photoUri = route.params.photoUri;
      const label = `${route.params.inverterNumber}-${route.params.cableLabel}`;
      (async () => {
        const fileUri = await savePhotoWithLabel(photoUri, label);
        if (fileUri) {
          setStringNote((prev) => {
            if (prev && prev.match(new RegExp(`foto ${label}(,|$)`))) return prev;
            return prev ? `${prev}, foto ${label}` : `foto ${label}`;
          });
          Alert.alert(t('Photo saved', { defaultValue: 'Photo saved' }), `${label}.jpg`);
        }
        navigation.setParams({
          photoUri: undefined,
          inverterNumber: undefined,
          cableLabel: undefined,
        });
      })();
    }
  }, [route.params?.photoUri, route.params?.inverterNumber, route.params?.cableLabel]);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(PHOTO_PREVIEWS_KEY);
        if (json) {
          setPhotoPreviews(JSON.parse(json));
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(PHOTO_PREVIEWS_KEY, JSON.stringify(photoPreviews)).catch(() => {});
  }, [photoPreviews]);

  const generateCableLabels = useCallback(() => {
    return getCableLabels(
      settings.cableMode,
      settings.cableCount,
      settings.customCableRange,
      settings.numericRange
    );
  }, [settings.cableMode, settings.cableCount, settings.customCableRange, settings.numericRange]);
  

  const cableLabels = useMemo(() => generateCableLabels(), [generateCableLabels]);

  const selectLanguage = async (lang) => {
    settings.setAppLanguage(lang);
    await i18nInstance.changeLanguage(lang);
    await AsyncStorage.setItem(ASYNC_LANG_KEY, lang);
    setLanguageSelected(true);
  };

  const minVoltage = settings.critical.minVoltage;
  const maxVoltage = settings.critical.maxVoltage;
  const minCurrent = settings.critical.minCurrent;
  const maxCurrent = settings.critical.maxCurrent;
  const minResistance = settings.critical.minResistance;
  const maxResistance = settings.critical.maxResistance;
  const cableMode = settings.cableMode;
  const cableCount = settings.cableCount;
  const customCableRange = settings.customCableRange;

  const photoSavePath = settings.photoSavePath;
  const measuredFields = settings.measuredFields || defaultMeasuredFields;

  useEffect(() => {
    if (!plusCtx.plus) {
      if (
        !measuredFields.voltage ||
        !measuredFields.current ||
        !measuredFields.resistance
      ) {
        settings.setMeasuredFields({
          voltage: true,
          current: true,
          resistance: true,
        });
      }
    }
  }, [plusCtx.plus, settings, measuredFields]);

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) setSavedCables(JSON.parse(data));
      } catch {}
      try {
        const json = await AsyncStorage.getItem(PHOTO_PREVIEWS_KEY);
        if (json) setPhotoPreviews(JSON.parse(json));
      } catch {}
    })();
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) setSavedCables(JSON.parse(data));
      } catch {}
    })();
  }, [
    settings.exportLang,
    settings.cableMode,
    settings.cableCount,
    settings.customCableRange,
    settings.measuredFields,
    settings.critical,
  ]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const permission = await MediaLibrary.requestPermissionsAsync();
        setMediaLibraryPermission(permission);
        if (permission.status !== 'granted') {
          Alert.alert(
            t('Permission needed', { defaultValue: 'Permission needed' }),
            t('Without permission, saving photos to gallery is not possible. You can still save photos to app storage.', { defaultValue: 'Without permission, saving photos to gallery is not possible. You can still save photos to app storage.' })
          );
        }
      } catch (e) {
        setMediaLibraryPermission({ status: 'denied' });
        Alert.alert(
          t('Permission needed', { defaultValue: 'Permission needed' }),
          t('Without permission, saving photos to gallery is not possible. You can still save photos to app storage.', { defaultValue: 'Without permission, saving photos to gallery is not possible. You can still save photos to app storage.' })
        );
      }
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

  const handleVoltageInput = (val) => {
    let clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    setVoltage(clean);
  };
  const handleCurrentInput = (val) => {
    let clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    setCurrent(clean);
  };
  const handleResistanceInput = (val) => {
    let clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    setResistance(clean);
  };

  const processImage = async (uri) => {
    try {
      let preUri = uri;
      if (usePreprocessing) {
        preUri = await preprocessImage(uri);
      }
      let resultLines = [];
      try {
        resultLines = await TextRecognition.recognize(preUri);
        if (!Array.isArray(resultLines)) resultLines = [];
      } catch (ocrErr) {
        resultLines = [];
      }
      if (!resultLines || resultLines.length === 0) {
        Alert.alert(t('OCR error', { defaultValue: 'OCR error' }), t('Unable to recognize values from image.', { defaultValue: 'Unable to recognize values from image.' }));
        setVoltage('');
        setCurrent('');
        setResistance('');
        return ["OCR failed"];
      }
      const cleanedLines = resultLines.map(line => postprocessOcrText(line)).filter(l => !!l && l.length > 0);

      let napeti = '';
      let proud = '';
      let odpor = '';

      let voltageFromUnit, currentFromUnit, resistanceFromUnit;
      for (let line of cleanedLines) {
        if (!voltageFromUnit) {
          let m = line.match(/([\d., ]{2,8})\s*V\b/i);
          if (m) voltageFromUnit = m[1];
        }
        if (!currentFromUnit) {
          let m = line.match(/([\d., ]{1,7})\s*A\b/i);
          if (m) currentFromUnit = m[1];
        }
        if (!resistanceFromUnit) {
          let m = line.match(/([\d., ]{1,8})\s*(MΩ|MOhm|MO|M0|M0hm|M0Ω|Mohm)/i);
          if (m) resistanceFromUnit = m[1];
        }
      }
      if (voltageFromUnit) napeti = smartFixDecimal(voltageFromUnit, 50, 1500);
      if (currentFromUnit) proud = smartFixDecimal(currentFromUnit, 0, 25);
      if (resistanceFromUnit) odpor = smartFixDecimal(resistanceFromUnit, 0, 2000);

      if (!napeti || !proud || !odpor) {
        let allNumsRaw = [];
        cleanedLines.forEach(l => {
          let matches = l.match(/\d+(?:[.,\s]\d+)?/g);
          if (matches) allNumsRaw.push(...matches);
        });
        let allNums = allNumsRaw.map((num, idx) => {
          if (num.match(/^\d+\s+\d+$/)) {
            let fix = num.replace(/\s+/, '.');
            return fix;
          }
          return num;
        });
        let numsFixed = allNums.map((num, idx) => {
          if (idx === 0) return smartFixDecimal(num, 50, 1500);
          if (idx === 1) return smartFixDecimal(num, 0, 25);
          if (idx === 2) return smartFixDecimal(num, 0, 2000);
          return num;
        });
        if (!napeti && numsFixed[0]) napeti = numsFixed[0];
        if (!proud && numsFixed[1]) proud = numsFixed[1];
        if (!odpor && numsFixed[2]) odpor = numsFixed[2];
      }

      if (!napeti || !proud || !odpor) {
        const allNums = cleanedLines.join(" ").match(/(\d{1,4}(?:\.\d+)?)/g);
        if (allNums && allNums.length > 0) {
          let max = '', min = '', mid = '';
          let nNums = allNums.map(x => parseFloat(x)).filter(x => !isNaN(x));
          if (nNums.length >= 3) {
            max = nNums[0], min = nNums[0];
            nNums.forEach(x => {
              if (x > max) max = x;
              if (x < min) min = x;
            });
            mid = nNums.find(x => x !== max && x !== min) || '';
            if (!napeti) napeti = String(max);
            if (!proud) proud = String(mid);
            if (!odpor) odpor = String(min);
          }
        }
      }

      [napeti, proud, odpor] = [napeti, proud, odpor].map((val, idx) => {
        if (!val) return '';
        let v = val.replace(/[OoDd]/g, '0').replace(/[bB]/g, '8').replace(/[,;]/g, '.');
        if (idx === 0) return smartFixDecimal(v, 50, 1500);
        if (idx === 1) return smartFixDecimal(v, 0, 25);
        if (idx === 2) return smartFixDecimal(v, 0, 2000);
        return v;
      });
      if (odpor && odpor.match(/^M0|MO$/i)) odpor = odpor.replace(/M0|MO/gi, 'MΩ');
      setVoltage(napeti);
      setCurrent(proud);
      setResistance(odpor);
      Alert.alert(
        t('Values recognized', { defaultValue: 'Values recognized' }),
        `🔌 ${t('Voltage', { defaultValue: 'Voltage' })}: ${napeti || t('not found', { defaultValue: 'not found' })} V\n⚡ ${t('Current', { defaultValue: 'Current' })}: ${proud || t('not found', { defaultValue: 'not found' })} A\n🛡️ ${t('Resistance', { defaultValue: 'Resistance' })}: ${odpor || t('not found', { defaultValue: 'not found' })} MΩ`
      );
      return cleanedLines;
    } catch (error) {
      Alert.alert(t('OCR error', { defaultValue: 'OCR error' }), t('Unable to recognize values from image.', { defaultValue: 'Unable to recognize values from image.' }));
      return ["OCR failed"];
    }
  };

  const scanValuesFromMeter = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('Permission denied', { defaultValue: 'Permission denied' }),
          t('Cannot access camera.', { defaultValue: 'Cannot access camera.' })
        );
        return;
      }
  
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: false,
      });
  
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await processImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert(
        t('OCR error', { defaultValue: 'OCR error' }),
        t('Unable to recognize values from image.', { defaultValue: 'Unable to recognize values from image.' })
      );
    }
  };
  

  const savePhotoWithLabel = async (photoUri, label) => {
    try {
      const fileName = `${label}.jpg`;
      const fileUri = `${photoSavePath}${fileName}`;
      let tempPhotoUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.copyAsync({ from: photoUri, to: tempPhotoUri });

      let allowSaveToGallery = false;
      let permission = mediaLibraryPermission;
      if (!permission || permission.status !== 'granted') {
        permission = await MediaLibrary.requestPermissionsAsync();
        setMediaLibraryPermission(permission);
      }
      if (permission.status === 'granted') {
        allowSaveToGallery = true;
      } else {
        allowSaveToGallery = false;
        Alert.alert(
          t('Permission denied', { defaultValue: 'Permission denied' }),
          t('Cannot save photo to gallery. Please allow photo access in settings.', { defaultValue: 'Cannot save photo to gallery. Please allow photo access in settings.' })
        );
      }
      if (allowSaveToGallery) {
        try {
          const manipulated = await ImageManipulator.manipulateAsync(tempPhotoUri, [], { format: ImageManipulator.SaveFormat.JPEG });
          const asset = await MediaLibrary.createAssetAsync(manipulated.uri);
          await MediaLibrary.createAlbumAsync("ScanMeter", asset, false);
        } catch (e) {
          Alert.alert(
            t('Photo not saved to gallery', { defaultValue: 'Photo not saved to gallery' }),
            t('There was a problem saving the photo to the gallery.', { defaultValue: 'There was a problem saving the photo to the gallery.' })
          );
        }
      }
      setPhotoPreviews(prev => {
        const updated = { ...prev, [label]: tempPhotoUri };
        AsyncStorage.setItem(PHOTO_PREVIEWS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      Alert.alert(t('Photo saved', { defaultValue: 'Photo saved' }), tempPhotoUri);
      return tempPhotoUri;
    } catch (e) {
      Alert.alert('Chyba při ukládání fotky', e.message || '');
      return null;
    }
  };

  const onTakePhoto = async () => {
    if (!plusCtx.plus) {
      navigation.navigate('PlusScreen');
      return;
    }
    const inverter = inverterNumber || '';
    const currentString = cableLabels[cableIndex] || '';
    let label = '';

    if (settings.photoLabelMode === 'string') {
    label = currentString;
    } else if (settings.photoLabelMode === 'inverter') {
    label = inverter;
    } else if (settings.photoLabelMode === 'both') {
    label = inverter && currentString ? `${inverter}-${currentString}` : inverter || currentString;
    } else {
    // fallback
    label = inverter && currentString ? `${inverter}-${currentString}` : inverter || currentString;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('Permission denied', { defaultValue: 'Permission denied' }), t('Cannot access camera.', { defaultValue: 'Cannot access camera.' }));
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: false,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      const photoUri = result.assets[0].uri;
      const manipulated = await ImageManipulator.manipulateAsync(
        photoUri,
        [
          {
            resize: {
              width: 1280,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPendingPhoto({
        uri: manipulated.uri,
        label,
      });
      setOverlayLabel(label);
      setShowOverlayModal(true);
      overlayModalCallbackRef.current = async (finalUri, finalLabel) => {
        setShowOverlayModal(false);
        setPendingPhoto(null);
        setOverlayLabel('');
        if (finalUri && finalLabel) {
          const fileUri = await savePhotoWithLabel(finalUri, finalLabel);
          if (fileUri) {
            setStringNote((prev) => {
              if (prev && prev.match(new RegExp(`foto ${finalLabel}(,|$)`))) return prev;
              return prev ? `${prev}, foto ${finalLabel}` : `foto ${finalLabel}`;
            });
            Alert.alert(t('Photo saved', { defaultValue: 'Photo saved' }), `${finalLabel}.jpg`);
          }
        }
      };
    }
  };

  function isCustomRangeValid(rangeStr) {
    return /^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/i.test(rangeStr);
  }

  const saveData = async () => {
    if (!inverterNumber) {
      Alert.alert(t('Error', { defaultValue: 'Error' }), t('Fill out all fields (Inverter, Voltage, Current, Resistance).', { defaultValue: 'Fill out all fields (Inverter, Voltage, Current, Resistance).' }));
      return false;
    }
    if (measuredFields.voltage && !voltage) {
      Alert.alert(t('Error', { defaultValue: 'Error' }), t('Please enter voltage value.', { defaultValue: 'Please enter voltage value.' }));
      return false;
    }
    if (measuredFields.current && !current) {
      Alert.alert(t('Error', { defaultValue: 'Error' }), t('Please enter current value.', { defaultValue: 'Please enter current value.' }));
      return false;
    }
    if (measuredFields.resistance && !resistance) {
      Alert.alert(t('Error', { defaultValue: 'Error' }), t('Please enter resistance value.', { defaultValue: 'Please enter resistance value.' }));
      return false;
    }

    let v = measuredFields.voltage ? parseFloat(voltage.replace(',', '.')) : '';
    let a = measuredFields.current ? parseFloat(current.replace(',', '.')) : '';
    let r = measuredFields.resistance ? parseFloat(resistance.replace(',', '.')) : '';
    v = (measuredFields.voltage && voltage !== '') ? v : '';
    a = (measuredFields.current && current !== '') ? a : '';
    r = (measuredFields.resistance && resistance !== '') ? r : '';

    let errorNotes = [];
    if (measuredFields.voltage && v !== '' && v < minVoltage) errorNotes.push('error voltage:low');
    if (measuredFields.voltage && v !== '' && v > maxVoltage) errorNotes.push('error voltage:high');
    if (measuredFields.current && a !== '' && a < minCurrent) errorNotes.push('error current:low');
    if (measuredFields.current && a !== '' && a > maxCurrent) errorNotes.push('error current:high');
    if (measuredFields.resistance && r !== '' && r < minResistance) errorNotes.push('error resistance:low');
    if (measuredFields.resistance && r !== '' && r > maxResistance) errorNotes.push('error resistance:high');
    if (badConnector) errorNotes.push('bad connector');
    const cableLabel = cableLabels[cableIndex];
    let note = stringNote;
    if (note && note.match(new RegExp(`foto ${inverterNumber}-${cableLabel}(,|$)`))) {
    } else if (photoPreviews[`${inverterNumber}-${cableLabel}`]) {
      note = note ? `${note}, foto ${inverterNumber}-${cableLabel}` : `foto ${inverterNumber}-${cableLabel}`;
    }
    const newCable = {
      inverterNumber,
      cableLabel,
      voltage: v !== '' ? v : '',
      current: a !== '' ? a : '',
      resistance: r !== '' ? r : '',
      note,
      errors: errorNotes,
    };
    const updated = [...savedCables, newCable];
    setSavedCables(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    Alert.alert(t('Data saved successfully!', { defaultValue: 'Data saved successfully!' }));
    return true;
  };

  const handleNextCable = async () => {
    if (settings.cableMode === 'custom' && plusCtx.plus) {
      if (!settings.customCableRange || !isCustomRangeValid(settings.customCableRange)) {
        Alert.alert(
          t('Invalid custom range', { defaultValue: 'Invalid custom range' }),
          t('customRangeError', { defaultValue: 'Invalid format! Use e.g. A1-F6.' })
        );
        return;
      }
    }
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
    try {
      const json = await AsyncStorage.getItem(PHOTO_PREVIEWS_KEY);
      if (json) setPhotoPreviews(JSON.parse(json));
    } catch {}
  };

  const clearAllData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSavedCables([]);
    Alert.alert(t('All data has been cleared.', { defaultValue: 'All data has been cleared.' }));
  };

  const saveFileToMediaLibrary = async (fileUri, filename, mimeType) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          t('Permission needed', { defaultValue: 'Permission needed' }),
          t('Without permission, saving files to public folders is not possible.', { defaultValue: 'Without permission, saving files to public folders is not possible.' })
        );
        return null;
      }
      const tempPath = FileSystem.cacheDirectory + filename;
      await FileSystem.copyAsync({ from: fileUri, to: tempPath });
      const asset = await MediaLibrary.createAssetAsync(tempPath);
      let album = await MediaLibrary.getAlbumAsync('Download');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      return asset.uri;
    } catch (e) {
      Alert.alert(t('Export Error', { defaultValue: 'Export Error' }), e.message || String(e));
      return null;
    }
  };

  const showFilenamePrompt = (defaultName, cb) => {
    setFilenamePromptValue(defaultName);
    setFilenamePromptCb(()=>cb);
    setFilenamePromptVisible(true);
  };

  const topBarIconButtonStyle = {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 50,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const handleExport = useCallback(
    async (type) => {
      if (!plusCtx.plus) {
        navigation.navigate('PlusScreen');
        return;
      }

      let minVoltage = settings.critical.minVoltage;
      let maxVoltage = settings.critical.maxVoltage;
      let minCurrent = settings.critical.minCurrent;
      let maxCurrent = settings.critical.maxCurrent;
      let minResistance = settings.critical.minResistance;
      let maxResistance = settings.critical.maxResistance;

      const byInverter = {};
      savedCables.forEach((c) => {
        if (!byInverter[c.inverterNumber]) byInverter[c.inverterNumber] = [];
        byInverter[c.inverterNumber].push(c);
      });

      let sortedInvs = Object.keys(byInverter)
        .sort((a, b) => {
          const na = Number(a);
          const nb = Number(b);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return String(a).localeCompare(String(b));
        });

      const byInvSorted = {};
      sortedInvs.forEach(inv => { byInvSorted[inv] = byInverter[inv]; });

      const exportData = {
        byInverter: byInvSorted,
        critical: settings.critical,
        exportT,
      };

      let content = '';

      if (type === 'A') {
        content = generateTXTExport(exportData);
        if (!content || content.trim().length === 0) {
          Alert.alert(exportT('Export Error', { defaultValue: 'Export Error' }), exportT('Nothing to export', { defaultValue: 'Nothing to export' }));
          return;
        }
        await exportDataToFile({
          content,
          fileBaseName: removeDiacritics('solar_data'),
          extension: '.txt',
          dialogTitle: exportT('Sdílení souboru:', { defaultValue: 'Sdílení souboru:' }),
          showFilenamePrompt,
          tExport: (key, def) => i18n.t(key, { lng: settings.appLanguage, defaultValue: def }),
        });
      } else if (type === 'B') {
        content = generateCSVExportSingleColumn(exportData);
        if (!content || content.trim().length === 0) {
          Alert.alert(exportT('Export Error', { defaultValue: 'Export Error' }), exportT('Nothing to export', { defaultValue: 'Nothing to export' }));
          return;
        }
        await exportDataToFile({
          content,
          fileBaseName: removeDiacritics('solar_data'),
          extension: '.csv',
          dialogTitle: exportT('Sdílení souboru:', { defaultValue: 'Sdílení souboru:' }),
          showFilenamePrompt,
          tExport: (key, def) => i18n.t(key, { lng: settings.appLanguage, defaultValue: def }),
        });
      } else if (type === 'C') {
        content = generateCSVExportMultipleColumns(exportData);
        if (!content || content.trim().length === 0) {
          Alert.alert(exportT('Export Error', { defaultValue: 'Export Error' }), exportT('Nothing to export', { defaultValue: 'Nothing to export' }));
          return;
        }
        await exportDataToFile({
          content,
          fileBaseName: removeDiacritics('solar_data'),
          extension: '.csv',
          dialogTitle: exportT('Sdílení souboru:', { defaultValue: 'Sdílení souboru:' }),
          showFilenamePrompt,
          tExport: (key, def) => i18n.t(key, { lng: settings.appLanguage, defaultValue: def }),
        });
      }
    },
    [plusCtx.plus, navigation, savedCables, settings.critical, exportT, showFilenamePrompt, settings.appLanguage]
  );

  function classifyErrors(c, minVoltage, maxVoltage, minCurrent, maxCurrent, minResistance, maxResistance) {
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
    return errors;
  }

  function formatResistanceExport(val, forCsv = false) {
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'string') {
      let v = val.trim();
      v = v.replace(/[,;]/g, '.');
      let numMatch = v.match(/([0-9]+(?:[.,][0-9]+)?)/);
      let num = numMatch ? numMatch[1].replace(',', '.') : '';
      if (!num) return '';
      return `${num}MOhm`;
    }
    if (typeof val === 'number') {
      return `${val}MOhm`;
    }
    return '';
  }

  const handleEditField = async (index, key, value) => {
    if (!plusCtx.plus) {
      return;
    }
    const updated = [...savedCables];
    const original = updated[index];
    const edited = {
      ...original,
      [key]: value,
    };

    edited.voltage = (key === 'voltage') ? value : original.voltage;
    edited.current = (key === 'current') ? value : original.current;
    edited.resistance = (key === 'resistance') ? value : original.resistance;

    edited.errors = classifyErrors(
      edited,
      minVoltage,
      maxVoltage,
      minCurrent,
      maxCurrent,
      minResistance,
      maxResistance
    );

    updated[index] = edited;
    setSavedCables(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteCable = async (index) => {
    const updated = savedCables.filter((_, i) => i !== index);
    setSavedCables(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const copyData = async () => {
    // Přelož nadpisy, poznámky a chyby podle exportLang, odstraň diakritiku všude
    const tPreview = getExportTranslator(settings.exportLang || 'en');
  
    const textToCopy = [
      [
        removeDiacritics(tPreview('Inverter', { defaultValue: 'Inverter' })),
        removeDiacritics(tPreview('Cable', { defaultValue: 'Cable' })),
        removeDiacritics(tPreview('Voltage', { defaultValue: 'Voltage' })),
        removeDiacritics(tPreview('Current', { defaultValue: 'Current' })),
        removeDiacritics(tPreview('Resistance', { defaultValue: 'Resistance' })),
        removeDiacritics(tPreview('Note', { defaultValue: 'Note' })),
        removeDiacritics(tPreview('Errors', { defaultValue: 'Errors' })),
      ].join(' | ')
    ]
      .concat(
        savedCables.map((c) => {
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
              ? removeDiacritics(errArr.map((err) => tPreview(err, { defaultValue: err })).join(', '))
              : '';
  
          let note = c.note;
          if (note) {
            note = note.replace(/low voltage/gi, tPreview('low voltage', { defaultValue: 'low voltage' }));
            note = note.replace(/bad connector/gi, tPreview('bad connector', { defaultValue: 'bad connector' }));
            note = note.replace(/nizke napeti/gi, tPreview('low voltage', { defaultValue: 'low voltage' }));
            note = note.replace(/spatny konektor/gi, tPreview('bad connector', { defaultValue: 'bad connector' }));
            note = removeDiacritics(note);
          }
  
          let voltageVal = (c.voltage !== undefined && c.voltage !== '') ? removeDiacritics(c.voltage + tPreview('V', { defaultValue: 'V' })) : '';
          let currentVal = (c.current !== undefined && c.current !== '') ? removeDiacritics(c.current + tPreview('A', { defaultValue: 'A' })) : '';
          let resistanceVal = (c.resistance !== undefined && c.resistance !== '') ? removeDiacritics(formatResistanceExport(c.resistance)) : '';
  
          return [
            removeDiacritics(c.inverterNumber || ''),
            removeDiacritics(c.cableLabel || ''),
            voltageVal,
            currentVal,
            resistanceVal,
            note || '',
            errorText,
          ].join(' | ');
        })
      )
      .join('\n');
  
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert(t('Data copied to clipboard.', { defaultValue: 'Data copied to clipboard.' }));
  };

  const renderCableErrorsAndNote = (cable) => {
    const tPreview = getExportTranslator(settings.exportLang || 'en');
    const errorsArr = cable.errors || [];
    const errorText =
      errorsArr.length > 0
        ? removeDiacritics(errorsArr.map((err) => tPreview(err, { defaultValue: err })).join(', '))
        : '';
    const hasPhotoNote = cable.note && cable.note.match(/foto ([\dA-Z\-]+)/);
    const cablePhotoLabel = hasPhotoNote ? cable.note.match(/foto ([\dA-Z\-]+)/)[1] : null;
    let note = cable.note;
    if (note) {
      note = note.replace(/low voltage/gi, tPreview('low voltage', { defaultValue: 'low voltage' }));
      note = note.replace(/bad connector/gi, tPreview('bad connector', { defaultValue: 'bad connector' }));
      note = note.replace(/nizke napeti/gi, tPreview('low voltage', { defaultValue: 'low voltage' }));
      note = note.replace(/spatny konektor/gi, tPreview('bad connector', { defaultValue: 'bad connector' }));
      note = removeDiacritics(note);
    }
    return (
      <View style={{ flex: 1 }}>
        <View style={{ marginTop: 2 }}>
          {errorText ? (
            <Text style={{ color: colors.danger, fontSize: 13 }}>{errorText}</Text>
          ) : null}
          {note ? (
            <Text style={{ color: colors.accent, fontSize: 13 }}>{note}</Text>
          ) : null}
          {cablePhotoLabel && photoPreviews[cablePhotoLabel] ? (
            <Image
              source={{ uri: photoPreviews[cablePhotoLabel] }}
              style={{
                marginTop: 5,
                marginBottom: 5,
                width: 100,
                height: 70,
                borderRadius: 7,
                borderWidth: 1,
                borderColor: '#eee',
              }}
              resizeMode="cover"
            />
          ) : null}
        </View>
    
      </View>
    );
  };  
  

  useEffect(() => {
    setCableIndex(0);
  }, [settings.cableMode, settings.cableCount, settings.customCableRange]);

  const handleRecalculateErrors = async () => {
    const crit = settings.critical;
    const updated = savedCables.map((c) => ({
      ...c,
      errors: classifyErrors(
        c,
        crit.minVoltage,
        crit.maxVoltage,
        crit.minCurrent,
        crit.maxCurrent,
        crit.minResistance,
        crit.maxResistance
      ),
    }));
    setSavedCables(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    Alert.alert(t('Chyby byly přepočítány.', { defaultValue: 'Errors recalculated.' }));
  };

  const isFree = !plusCtx.plus;

  const measuredFieldTogglesDisabled = !plusCtx.plus;

  const [cableInput, setCableInput] = useState('');
  useEffect(() => {
    setCableIndex(0);
    setCableInput(cableLabels[0] || '');
  }, [settings.cableMode, settings.cableCount, settings.customCableRange]);
  

  const handleCableInputChange = (val) => {
    setCableInput(val);
    const index = cableLabels.findIndex(lab => lab.toUpperCase() === val.toUpperCase());
    if (index !== -1) {
      setCableIndex(index);
    }
  };

  const handleNextCableWrapped = async () => {
    if (settings.cableMode === 'custom' && plusCtx.plus) {
      if (!settings.customCableRange || !isCustomRangeValid(settings.customCableRange)) {
        Alert.alert(
          t('Invalid custom range', { defaultValue: 'Invalid custom range' }),
          t('customRangeError', { defaultValue: 'Invalid format! Use e.g. A1-F6.' })
        );
        return;
      }
    }
    const success = await saveData();
    if (!success) return;
    setCableIndex((cableIndex + 1) % cableLabels.length);
    setCableInput(cableLabels[(cableIndex + 1) % cableLabels.length] || '');
    clearInputs();
  };

  const topBarButtons = [
    {
      key: 'plus',
      icon: 'diamond',
      color: '#FFD700',
      onPress: () => navigation.navigate('PlusScreen'),
      show: !plusCtx.plus,
    },
    {
      key: 'settings',
      icon: 'settings-sharp',
      color: '#007AFF',
      onPress: () => navigation.navigate('SettingsScreen'),
    },
    {
      key: 'saved',
      icon: 'folder-open',
      color: '#34C759',
      onPress: () => setViewSaved(true),
    },
    {
      key: 'language',
      icon: 'language',
      color: '#FF9500',
      onPress: () => setLanguageSelected(false),
    },
    {
      key: 'exportA',
      icon: 'document-text',
      color: '#007AFF',
      onPress: () => handleExport('A'),
    },
    {
      key: 'exportB',
      icon: 'grid',
      color: '#007AFF',
      onPress: () => handleExport('B'),
    },
    {
      key: 'exportC',
      icon: 'stats-chart',
      color: '#AF52DE',
      onPress: () => handleExport('C'),
    },
    {
      key: 'guide',
      icon: 'help-circle',
      color: '#0090ff',
      onPress: () => navigation.navigate('GuideScreen'),
    },
  ];

  return (
    <>
      <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}>{t('SmartSolarMeter', { defaultValue: 'SmartSolarMeter' })}</Text>
      </View>

      {!languageSelected && (
        <Modal transparent={true} animationType="slide" visible={!languageSelected}>
          <View style={[styles.languageContainer, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
            <Animated.View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%', transform: [{ scale: languageAnim }] }}>
              <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>{t('Select language', { defaultValue: 'Select language' })}</Text>
              {['cs', 'en', 'nl', 'zh','de','es','fr'].map(lang => (
                <TouchableOpacity key={lang} onPress={() => selectLanguage(lang)} style={[styles.badButton, {flexDirection:'row', alignItems:'center', justifyContent:'center'}]}>
                  <Text style={{ fontSize: 22, marginRight: 12 }}>
                    {getLanguageIcon(lang)}
                  </Text>
                  <Text style={{ fontSize: 20, color: '#fff', textAlign: 'center' }}>
                    {getLanguageName(lang)}
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
            <View>
              <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}
               style={{ marginBottom: 10 }}
              >
               {topBarButtons.map((btn, idx) => {
                  if (btn.show === false) return null;
                  let isExport = ['exportA', 'exportB', 'exportC'].includes(btn.key);
                  let disabled = false;
                  if (isExport && isFree) disabled = true;
                  return (
                    <TouchableOpacity
                      key={btn.key}
                      onPress={btn.onPress}
                      style={[
                        topBarIconButtonStyle,
                        { marginHorizontal: 6 },
                        disabled && { opacity: 0.5 }
                      ]}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={btn.icon}
                        size={24}
                        color={btn.color}
                        style={{ textAlign: 'center', alignSelf: 'center' }}
                      />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('Inverter Number', { defaultValue: 'Inverter Number' })}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Inverter Number', { defaultValue: 'Inverter Number' })}
                  value={inverterNumber}
                  onChangeText={setInverterNumber}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('Cable', { defaultValue: 'Cable' })}</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={t('Enter cable (e.g. C2)', { defaultValue: 'Enter cable (e.g. C2)' })}
                    value={cableInput}
                    onChangeText={handleCableInputChange}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                  />
                </View>
              </View>


              
              {measuredFields.voltage && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>⚡ {t('Voltage (V)', { defaultValue: 'Voltage (V)' })}</Text>
                  <TextInput style={styles.input} placeholder={t('Voltage (V)', { defaultValue: 'Voltage (V)' })} value={voltage} onChangeText={handleVoltageInput} keyboardType="decimal-pad" returnKeyType="next" onSubmitEditing={() => currentInput.current?.focus()} />
                </View>
              )}

              {measuredFields.current && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>🔌 {t('Current (A)', { defaultValue: 'Current (A)' })}</Text>
                  <TextInput style={styles.input} placeholder={t('Current (A)', { defaultValue: 'Current (A)' })} value={current} onChangeText={handleCurrentInput} keyboardType="decimal-pad" returnKeyType="next" onSubmitEditing={() => resistanceInput?.focus()} ref={currentInput} />
                </View>
              )}

              {measuredFields.resistance && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>🛡️ {t('Resistance (MΩ)', { defaultValue: 'Resistance (MΩ)' })}</Text>
                  <TextInput style={styles.input} placeholder={t('Resistance (MΩ)', { defaultValue: 'Resistance (MΩ)' })} value={resistance} onChangeText={handleResistanceInput} keyboardType="decimal-pad" returnKeyType="done" ref={(ref) => (resistanceInput = ref)} onSubmitEditing={() => handleNextCableWrapped()} />
                </View>
              )}

              {plusCtx.plus && (
                <>
                  <Text style={styles.label}>{t('String damage or issue (optional)', { defaultValue: 'String damage or issue (optional)' })}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('Describe any damage or issue', { defaultValue: 'Describe any damage or issue' })}
                    value={stringNote}
                    onChangeText={setStringNote}
                  />

                  <TouchableOpacity onPress={() => setBadConnector(!badConnector)} style={[styles.badButton, badConnector && { backgroundColor: '#c00' }]}>
                    <Text style={{ color: '#fff' }}>{badConnector ? `✓ ${t('Bad Connector', { defaultValue: 'Bad Connector' })}` : t('Mark as Bad Connector', { defaultValue: 'Mark as Bad Connector' })}</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.badButton} onPress={handleNextCableWrapped}>
                <Text style={styles.badButtonText}>{t('Next String', { defaultValue: 'Next String' })}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={scanValuesFromMeter}>
                <Ionicons name="scan" size={28} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconButton, isFree && { opacity: 0.5 }]}
                onPress={onTakePhoto}
                disabled={isFree}
              >
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

              {savedCables.length > 0 && (
                <View style={{ marginTop: 20, marginBottom: 15 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{t('Last saved', { defaultValue: 'Last saved' })}</Text>
                  {savedCables.slice(-3).reverse().map((c, i) =>
                    <View key={i}>
                      <Text style={{ fontStyle: 'italic', color: '#333' }}>
                        {`${c.inverterNumber}-${c.cableLabel}-${(c.voltage !== undefined && c.voltage !== '') ? c.voltage + 'V' : ''}-${(c.current !== undefined && c.current !== '') ? c.current + 'A' : ''}-${formatResistanceExport(c.resistance)}`}
                      </Text>
                      {renderCableErrorsAndNote(c)}
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      )}

      <Modal visible={viewSaved} animationType="slide">
        <View style={{flex:1, backgroundColor:'#fff', padding:12, paddingBottom:30}}>
          <Text style={{fontSize:22, fontWeight:'bold', marginBottom:8}}>{t('Saved Strings', { defaultValue: 'Saved Strings' })}</Text>
          <FlatList
            data={savedCables}
            extraData={{
              settings: {
                exportLang: settings.exportLang,
                cableMode: settings.cableMode,
                cableCount: settings.cableCount,
                customCableRange: settings.customCableRange,
                measuredFields: settings.measuredFields,
                critical: settings.critical,
              }
            }}
            keyExtractor={(item, idx) => idx.toString()}
            renderItem={({item, index}) => {
              const tPreview = exportT;
              return (
              <View style={{borderBottomWidth:1, borderColor:'#eee', marginBottom:10, paddingBottom:10}}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                  <Text>{t('Inverter Number', { defaultValue: 'Inverter Number' })}: </Text>
                  <TextInput
                    style={[styles.input, {flex:1, marginVertical:0, marginHorizontal:5, padding:4, fontSize:15}]}
                    value={item.inverterNumber?.toString() || ''}
                    keyboardType="numeric"
                    onChangeText={v=>handleEditField(index, 'inverterNumber', v)}
                    editable={plusCtx.plus}
                    returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                  />
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                  <Text>{t('Cable', { defaultValue: 'Cable' })}: </Text>
                  <TextInput
                    style={[styles.input, {flex:1, marginVertical:0, marginHorizontal:5, padding:4, fontSize:15}]}
                    value={item.cableLabel || ''}
                    onChangeText={v=>handleEditField(index, 'cableLabel', v)}
                    editable={plusCtx.plus}
                    returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                  />
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                  <Text>⚡ {t('Voltage', { defaultValue: 'Voltage' })}: </Text>
                  <TextInput
                    style={[styles.input, {flex:1, marginVertical:0, marginHorizontal:5, padding:4, fontSize:15}]}
                    value={item.voltage?.toString() || ''}
                    keyboardType="decimal-pad"
                    onChangeText={v=>handleEditField(index, 'voltage', v)}
                    editable={plusCtx.plus}
                    returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                  />
                  <Text>V</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                  <Text>🔌 {t('Current', { defaultValue: 'Current' })}: </Text>
                  <TextInput
                    style={[styles.input, {flex:1, marginVertical:0, marginHorizontal:5, padding:4, fontSize:15}]}
                    value={item.current?.toString() || ''}
                    keyboardType="decimal-pad"
                    onChangeText={v=>handleEditField(index, 'current', v)}
                    editable={plusCtx.plus}
                    returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                  />
                  <Text>A</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                  <Text>🛡️ {t('Resistance', { defaultValue: 'Resistance' })}: </Text>
                  <TextInput
                    style={[styles.input, {flex:1, marginVertical:0, marginHorizontal:5, padding:4, fontSize:15}]}
                    value={item.resistance?.toString() || ''}
                    keyboardType="decimal-pad"
                    onChangeText={v=>handleEditField(index, 'resistance', v)}
                    editable={plusCtx.plus}
                    returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                  />
                  <Text>MΩ</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:2}}>
                  <Text>{t('Note', { defaultValue: 'Note' })}: </Text>
                  <TextInput
                    style={[styles.input, {flex:1, marginVertical:0, marginHorizontal:5, padding:4, fontSize:15}]}
                    value={item.note || ''}
                    onChangeText={v=>handleEditField(index, 'note', v)}
                    editable={plusCtx.plus}
                    returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss && Keyboard.dismiss(); }}
                  />
                </View>
                {renderCableErrorsAndNote(item)}
                <View style={{flexDirection:'row', marginTop:5, gap:8}}>
                  <TouchableOpacity onPress={()=>deleteCable(index)} style={[styles.badButton, {backgroundColor:colors.danger}]}>
                    <Text style={styles.badButtonText}>{t('Delete', { defaultValue: 'Delete' })}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            }}
          />
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', gap:8, marginTop:15}}>
            <TouchableOpacity style={[styles.badButton, {backgroundColor:colors.primary, flex:1}]} onPress={handleRecalculateErrors}>
              <Text style={styles.badButtonText}>{t('Recalculate Errors', { defaultValue: 'Recalculate Errors' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.badButton, {backgroundColor:colors.danger, flex:1}]} onPress={clearAllData}>
              <Text style={styles.badButtonText}>{t('Clear All Data', { defaultValue: 'Clear All Data' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.badButton, {flex:1}]} onPress={()=>{
              setViewSaved(false);
            }}>
              <Text style={styles.badButtonText}>{t('Back', { defaultValue: 'Back' })}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.badButton, {marginTop:10, backgroundColor:colors.primary}]} onPress={copyData}>
            <Text style={styles.badButtonText}>{t('Copy to Clipboard', { defaultValue: 'Copy to Clipboard' })}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
              {t('Insert label into photo', { defaultValue: 'Insert label into photo' })}
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
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderBottomRightRadius: 10,
                  maxWidth: '100%',
                }}>
                  <Text style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 26,
                    textShadowColor: '#000',
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 3,
                    letterSpacing: 1,
                  }} numberOfLines={1} ellipsizeMode="tail">
                    {overlayLabel}
                  </Text>
                </View>
              </View>
            )}
          </ViewShot>

          <Text style={{ fontWeight: 'bold', fontSize: 15, marginTop: 8, marginBottom: 3 }}>
            {t('Edit label:', { defaultValue: 'Edit label:' })}
          </Text>
          <TextInput
            style={[styles.input, { width: '95%', marginBottom: 8, textAlign: 'center' }]}
            value={overlayLabel}
            onChangeText={setOverlayLabel}
            autoCapitalize="characters"
            maxLength={30}
          />

          <View style={{ flexDirection: 'row', marginTop: 5, gap: 12 }}>
            <TouchableOpacity
              style={[styles.badButton, { backgroundColor: colors.primary }]}
              onPress={async () => {
                if (overlayShotRef.current) {
                  const shotUri = await captureRef(overlayShotRef, {
                    format: 'jpg',
                    quality: 0.98,
                  });
                  if (overlayModalCallbackRef.current) {
                    overlayModalCallbackRef.current(shotUri, overlayLabel);
                  }
                }
              }}
            >
              <Text style={styles.badButtonText}>{t('Save', { defaultValue: 'Save' })}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.badButton, { backgroundColor: colors.danger }]}
              onPress={() => {
                setShowOverlayModal(false);
                setPendingPhoto(null);
                setOverlayLabel('');
                if (overlayModalCallbackRef.current) {
                  overlayModalCallbackRef.current(null, overlayLabel);
                }
              }}
            >
              <Text style={styles.badButtonText}>{t('Cancel', { defaultValue: 'Cancel' })}</Text>
            </TouchableOpacity>
          </View>

            <Text style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
              {pendingPhoto?.uri ? pendingPhoto.uri : ''}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 5, gap: 12 }}>
              <TouchableOpacity
                style={[styles.badButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  if (overlayShotRef.current) {
                    const shotUri = await captureRef(overlayShotRef, {
                      format: 'jpg',
                      quality: 0.98,
                    });
                    if (overlayModalCallbackRef.current) {
                      overlayModalCallbackRef.current(shotUri, overlayLabel);
                    }
                  }
                }}
              >
                <Text style={styles.badButtonText}>{t('Save', { defaultValue: 'Save' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.badButton, { backgroundColor: colors.danger }]}
                onPress={() => {
                  setShowOverlayModal(false);
                  setPendingPhoto(null);
                  if (overlayModalCallbackRef.current) {
                    overlayModalCallbackRef.current(null, overlayLabel);
                  }
                }}
              >
                <Text style={styles.badButtonText}>{t('Cancel', { defaultValue: 'Cancel' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={filenamePromptVisible} animationType="fade" transparent={true}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 18,
            width: '85%',
            maxWidth: 350,
            alignItems: 'center',
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 7 }}>
              {t('Save', { defaultValue: 'Save' })}
            </Text>
            <Text style={{ marginBottom: 10, color: '#555', fontSize: 14 }}>
              {t('Enter file name (without .csv)', { defaultValue: 'Enter file name (without .csv)' })}
            </Text>
            <TextInput
              style={[styles.input, { width: '95%', marginBottom: 12 }]}
              value={filenamePromptValue}
              autoFocus
              onChangeText={setFilenamePromptValue}
              placeholder={t('File name', { defaultValue: 'File name' })}
              onSubmitEditing={() => {
                setFilenamePromptVisible(false);
                filenamePromptCb(filenamePromptValue);
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.badButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => {
                  setFilenamePromptVisible(false);
                  filenamePromptCb(filenamePromptValue || 'solar_data');
                }}
              >
                <Text style={styles.badButtonText}>{t('Save', { defaultValue: 'Save' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.badButton, { backgroundColor: colors.danger, flex: 1 }]}
                onPress={() => {
                  setFilenamePromptVisible(false);
                  filenamePromptCb(null);
                }}
              >
                <Text style={styles.badButtonText}>{t('Cancel', { defaultValue: 'Cancel' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SettingsProvider>
        <PlusProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="MainScreen"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen
                name="MainScreen"
                component={(props) => (
                  <ErrorBoundary>
                    <MainScreen {...props} />
                  </ErrorBoundary>
                )}
              />
              <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
              <Stack.Screen name="PlusScreen" component={PlusScreen} />
              <Stack.Screen name="GuideScreen" component={GuideScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PlusProvider>
      </SettingsProvider>
    </I18nextProvider>
  );
}

export default App;