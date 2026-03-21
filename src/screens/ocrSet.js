import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Switch,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { OCRSettingsContext, defaultOcrSettings } from '../context/OCRSettingsContext';
import { PlusContext } from '../context/PlusContext';
import { useNavigation } from '@react-navigation/native';

const WHAT_TO_DETECT_OPTIONS = [
  { key: 'voltage', labelKey: 'ocr.voltage' },
  { key: 'current', labelKey: 'ocr.current' },
  { key: 'resistance', labelKey: 'ocr.resistance' },
];

const DISPLAY_TYPE_OPTIONS = [
  { key: 'light-on-dark', labelKey: 'ocr.display_light_on_dark' },
  { key: 'dark-on-light', labelKey: 'ocr.display_dark_on_light' },
  { key: 'auto', labelKey: 'ocr.display_auto' },
];

const OCR_LANGUAGE_OPTIONS = [
  { key: 'cs', labelKey: 'ocr.lang_cs' },
  { key: 'en', labelKey: 'ocr.lang_en' },
  { key: 'auto', labelKey: 'ocr.lang_auto' },
];

const METER_TYPE_OPTIONS = [
  { key: 'horizontal', labelKey: 'ocr.meter_horizontal' },
  { key: 'vertical', labelKey: 'ocr.meter_vertical' },
];

const LIGHT_MODE_OPTIONS = [
  { key: 'sun', labelKey: 'ocr.light_sun' },
  { key: 'shade', labelKey: 'ocr.light_shade' },
  { key: 'dark', labelKey: 'ocr.light_dark' },
  { key: 'auto', labelKey: 'ocr.light_auto' },
];

const BACKLIGHT_COLOR_OPTIONS = [
  { key: 'white', labelKey: 'ocr.backlight_white' },
  { key: 'red', labelKey: 'ocr.backlight_red' },
  { key: 'blue', labelKey: 'ocr.backlight_blue' },
  { key: 'green', labelKey: 'ocr.backlight_green' },
  { key: 'yellow', labelKey: 'ocr.backlight_yellow' },
  { key: 'custom', labelKey: 'ocr.backlight_custom' },
];

// Nové dropdowny:
const DECIMAL_SEPARATOR_OPTIONS = [
  { key: '.', labelKey: 'ocr.decimal_dot' },
  { key: ',', labelKey: 'ocr.decimal_comma' },
];

const OCR_ENGINE_OPTIONS = [
  { key: 'default', labelKey: 'ocr.engine_default' },
  { key: 'backup', labelKey: 'ocr.engine_backup' },
  { key: 'experimental', labelKey: 'ocr.engine_experimental' },
];

// Mapping veličin a pozic
const VALUE_LABELS = [
  { key: 'voltage', icon: '⚡', labelKey: 'ocr.voltage' },
  { key: 'current', icon: '🔌', labelKey: 'ocr.current' },
  { key: 'resistance', icon: '🛡️', labelKey: 'ocr.resistance' },
  { key: 'none', icon: '⛔', labelKey: 'ocr.none' },
];

const POSITION_LABELS = [
  { key: 'top', labelKey: 'ocr.position_top' },
  { key: 'middle', labelKey: 'ocr.position_middle' },
  { key: 'bottom', labelKey: 'ocr.position_bottom' },
];

const RESULT_ORDER_OPTIONS = [
  { key: 'position', labelKey: 'ocr.order_position' },
  { key: 'value', labelKey: 'ocr.order_value' },
  { key: 'appearance', labelKey: 'ocr.order_appearance' },
];

const VALUE_PRIORITY_OPTIONS = [
  { key: 'max', labelKey: 'ocr.priority_highest' },
  { key: 'min', labelKey: 'ocr.priority_lowest' },
  { key: 'first', labelKey: 'ocr.priority_first' },
];

const VALUE_PRIORITY_POSITIONS = [
  { key: 'max', labelKey: 'ocr.priority_highest' },
  { key: 'mid', labelKey: 'ocr.priority_middle' },
  { key: 'min', labelKey: 'ocr.priority_lowest' },
];

function TooltipModal({ visible, onClose, title, desc, tip }) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDesc}>{desc ? desc : t('ocr.noHelp', 'Nápověda není dostupná')}</Text>
          {tip ? <Text style={styles.modalTip}>💡 {tip}</Text> : null}
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseBtnText}>{t('ocr.modal_close', 'Zavřít')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sectionTitle = (icon, title, color) => (
  <Text style={[styles.sectionTitle, color ? { color } : null]}>{icon} {title}</Text>
);

function mappingToState(mapping, allLabels) {
  const state = {};
  for (const pos of Object.keys(mapping || {})) {
    state[pos] = allLabels.includes(mapping[pos]) ? mapping[pos] : 'none';
  }
  return state;
}

function stateToMapping(state, allLabels) {
  const mapping = {};
  for (const pos of Object.keys(state)) {
    mapping[pos] = allLabels.includes(state[pos]) ? state[pos] : 'none';
  }
  return mapping;
}

export default function OCRSettingsScreen() {
  const { t } = useTranslation();
  const ctx = useContext(OCRSettingsContext);
  const ocrSettings = ctx?.ocrSettings || defaultOcrSettings;
  const setOcrSettings = ctx?.setOcrSettings;

  const { plus } = useContext(PlusContext);
  const isFree = !plus;

  const [state, setState] = useState({
    ...defaultOcrSettings,
    manualCrop: defaultOcrSettings.manualCrop || { x: '', y: '', width: '', height: '' },
    resultOrderToggle: {},
    valuePriorityToggle: {},
    resultOrderMapping: defaultOcrSettings.resultOrderMapping || { top: 'voltage', middle: 'current', bottom: 'resistance' },
    valuePriorityMapping: defaultOcrSettings.valuePriorityMapping || { max: 'voltage', mid: 'current', min: 'resistance' },
    // Nové defaulty:
    autoDecimal: false,
    useBinarization: false,
    binarizationThreshold: '',
    useAdaptiveThreshold: false,
    decimalSeparator: '.',
    autoEqualizeHistogram: false,
    debugOverlay: false,
    autoRotateIfUnclear: false,
    valueFormat: '',
    fixCommonConfusions: false,
    smartDecimalFallback: false,
    ocrConfidenceThreshold: '',
    resampleWidth: '',
    filterNoise: false,
    ocrTestMode: false,
    ocrEngine: 'default',
    detectTypes: ['voltage', 'current', 'resistance'],
  });
  const [tooltip, setTooltip] = useState({ key: '', visible: false });

  useEffect(() => {
    if (ocrSettings) {
      setState(prev => ({
        ...defaultOcrSettings,
        ...ocrSettings,
        manualCrop: ocrSettings.manualCrop || { x: '', y: '', width: '', height: '' },
        resultOrderMapping: ocrSettings.resultOrderMapping
          ? mappingToState(ocrSettings.resultOrderMapping, VALUE_LABELS.map(x => x.key))
          : { top: 'voltage', middle: 'current', bottom: 'resistance' },
        valuePriorityMapping: ocrSettings.valuePriorityMapping
          ? mappingToState(ocrSettings.valuePriorityMapping, VALUE_LABELS.map(x => x.key))
          : { max: 'voltage', mid: 'current', min: 'resistance' },
        // Nové hodnoty
        autoDecimal: ocrSettings.autoDecimal ?? false,
        useBinarization: ocrSettings.useBinarization ?? false,
        binarizationThreshold: ocrSettings.binarizationThreshold ?? '',
        useAdaptiveThreshold: ocrSettings.useAdaptiveThreshold ?? false,
        decimalSeparator: ocrSettings.decimalSeparator ?? '.',
        autoEqualizeHistogram: ocrSettings.autoEqualizeHistogram ?? false,
        debugOverlay: ocrSettings.debugOverlay ?? false,
        autoRotateIfUnclear: ocrSettings.autoRotateIfUnclear ?? false,
        valueFormat: ocrSettings.valueFormat ?? '',
        fixCommonConfusions: ocrSettings.fixCommonConfusions ?? false,
        smartDecimalFallback: ocrSettings.smartDecimalFallback ?? false,
        ocrConfidenceThreshold: ocrSettings.ocrConfidenceThreshold ?? '',
        resampleWidth: ocrSettings.resampleWidth ?? '',
        filterNoise: ocrSettings.filterNoise ?? false,
        ocrTestMode: ocrSettings.ocrTestMode ?? false,
        ocrEngine: ocrSettings.ocrEngine ?? 'default',
        detectTypes: ocrSettings.detectTypes ?? ['voltage', 'current', 'resistance'],
      }));
    }
  }, [ocrSettings]);

  // Toggle-toggle skupiny helpery
  const toggleChip = (group, key) => {
    setState(s => ({
      ...s,
      [group]: {
        ...s[group],
        [key]: !s[group]?.[key],
      },
    }));
  };

  // Převod desetinné čárky na tečku pro numerická pole, povolí pouze jednu tečku
  const decimalInput = (value) => {
    let out = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const parts = out.split('.');
    if (parts.length > 2) {
      out = parts[0] + '.' + parts.slice(1).join('');
    }
    return out;
  };

  // Převod pouze integer
  const integerInput = (value) =>
    value.replace(/[^0-9]/g, '');

  // Tooltip otevřít/zavřít
  const openTooltip = key => setTooltip({ key, visible: true });
  const closeTooltip = () => setTooltip({ key: '', visible: false });

  // PEVNÉ BARVY
  const bg = '#ffffff';
  const text = '#111111';
  const input = '#ffffff';
  const border = '#d1d5db';

  const disabledStyle = isFree
    ? { opacity: 0.45, backgroundColor: '#ececec' }
    : {};

  // Handler pro mapping pozic <-> veličin
  const handleResultOrderMappingChange = (posKey, valueKey) => {
    setState(s => ({
      ...s,
      resultOrderMapping: { ...s.resultOrderMapping, [posKey]: valueKey },
    }));
  };
  const handleValuePriorityMappingChange = (priorityKey, valueKey) => {
    setState(s => ({
      ...s,
      valuePriorityMapping: { ...s.valuePriorityMapping, [priorityKey]: valueKey },
    }));
  };

  // Handler pro multi-checkbox "detectTypes"
  const handleDetectTypeToggle = (type) => {
    setState(s => {
      const arr = Array.isArray(s.detectTypes) ? [...s.detectTypes] : [];
      if (arr.includes(type)) {
        return { ...s, detectTypes: arr.filter(x => x !== type) };
      } else {
        return { ...s, detectTypes: [...arr, type] };
      }
    });
  };

  // Handler pro dropdown
  const renderDropdown = (options, selected, onSelect, disabled = false) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 7 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.chip,
            selected === opt.key && { backgroundColor: '#10b981' },
            disabled ? { opacity: 0.5 } : null,
            { marginRight: 7 },
          ]}
          onPress={() => !disabled && onSelect(opt.key)}
          disabled={disabled}
        >
          <Text style={{ color: selected === opt.key ? '#fff' : '#111111' }}>
            {t(opt.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render multi-checkbox group
  const renderCheckboxGroup = (options, selectedArr, onToggle, disabled = false) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 7 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.chip,
            selectedArr.includes(opt.key) && { backgroundColor: '#10b981' },
            disabled ? { opacity: 0.5 } : null,
            { marginRight: 7 }
          ]}
          onPress={() => !disabled && onToggle(opt.key)}
          disabled={disabled}
        >
          <Text style={{ color: selectedArr.includes(opt.key) ? '#fff' : '#111111' }}>
            {t(opt.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render chip button pro multi-toggle skupiny
  const renderToggleChips = (options, group) => (
    <View style={[styles.row, { flexWrap: 'nowrap', marginBottom: 10 }]}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.chip,
            state[group]?.[opt.key] && { backgroundColor: '#10b981' },
            disabledStyle,
          ]}
          onPress={() => !isFree && toggleChip(group, opt.key)}
          disabled={isFree}
        >
          <Text style={{ color: state[group]?.[opt.key] ? '#fff' : '#111111' }}>
            {t(opt.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render mapping výběrového řádku
  const renderMappingRow = (posKey, positionLabel, mapping, onChange) => (
    <View style={styles.mappingRow} key={posKey}>
      <Text style={{ flex: 1, color: '#111111', fontSize: 15 }}>{t(positionLabel)}</Text>
      {VALUE_LABELS.filter(vl => vl.key !== 'none').map(val => (
        <TouchableOpacity
          key={val.key}
          style={[
            styles.chip,
            mapping[posKey] === val.key && { backgroundColor: '#10b981' },
            { marginRight: 6 },
            disabledStyle,
          ]}
          onPress={() => !isFree && onChange(posKey, val.key)}
          disabled={isFree}
        >
          <Text style={{ color: mapping[posKey] === val.key ? '#fff' : '#111111', fontWeight: 'bold' }}>
            {val.icon} {t(val.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render mapping výběrového řádku pro valuePriority (max, mid, min)
  const renderPriorityMappingRow = (priorityKey, priorityLabel, mapping, onChange) => (
    <View style={styles.mappingRow} key={priorityKey}>
      <Text style={{ flex: 1, color: '#111111', fontSize: 15 }}>{t(priorityLabel)}</Text>
      {VALUE_LABELS.filter(vl => vl.key !== 'none').map(val => (
        <TouchableOpacity
          key={val.key}
          style={[
            styles.chip,
            mapping[priorityKey] === val.key && { backgroundColor: '#10b981' },
            { marginRight: 6 },
            disabledStyle,
          ]}
          onPress={() => !isFree && onChange(priorityKey, val.key)}
          disabled={isFree}
        >
          <Text style={{ color: mapping[priorityKey] === val.key ? '#fff' : '#111111', fontWeight: 'bold' }}>
            {val.icon} {t(val.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

	function getTooltipTexts(key) {
	    return {
	        title: t(`ocr.${key}_title`, ''),
	        desc: t(`ocr.${key}_desc`, ''),
	        tip: t(`ocr.${key}_tip`, ''),
	    };
	}

  const navigation = useNavigation();

  const handleSave = () => {
    if (isFree || !setOcrSettings) return;
    setOcrSettings({
      ...state,
      resultOrderMapping: stateToMapping(state.resultOrderMapping, VALUE_LABELS.map(x => x.key)),
      valuePriorityMapping: stateToMapping(state.valuePriorityMapping, VALUE_LABELS.map(x => x.key)),
    });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 80 }}>
        <Text style={[styles.topTitle, { color: text }]}>{t('ocr.title', 'Nastavení OCR')}</Text>

        {sectionTitle('🧩', t('ocr.section_basic', 'Základní nastavení'), text)}

        {/* Co detekovat (nový multi-checkbox detectTypes) */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.detectTypes', 'Detekovat veličiny')}</Text>
          <TouchableOpacity onPress={() => openTooltip('detectTypes')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        {renderCheckboxGroup(WHAT_TO_DETECT_OPTIONS, state.detectTypes || [], handleDetectTypeToggle, isFree)}

        {/* Typ displeje */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.displayType', 'Typ displeje')}</Text>
          <TouchableOpacity onPress={() => openTooltip('displayType')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        {renderToggleChips(DISPLAY_TYPE_OPTIONS, 'displayTypeToggle')}

        {/* Jazyk OCR */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.ocrLanguage', 'Jazyk OCR')}</Text>
          <TouchableOpacity onPress={() => openTooltip('ocrLanguage')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        {renderToggleChips(OCR_LANGUAGE_OPTIONS, 'ocrLanguageToggle')}

        {/* Další původní switche */}
        {[
          ['autoCrop', t('ocr.autoCrop', 'Automatické oříznutí')],
          ['perspectiveCorrection', t('ocr.perspectiveCorrection', 'Oprava perspektivy')],
          ['autoContrast', t('ocr.autoContrast', 'Zvýšení kontrastu (automaticky)')],
          ['denoise', t('ocr.denoise', 'Vyhlazení / odstranění šumu')],
        ].map(([k, label]) => (
          <View style={styles.row} key={k}>
            <Text style={[styles.label, { color: text }]}>{label}</Text>
            <TouchableOpacity onPress={() => openTooltip(k)}>
              <Ionicons name="help-circle-outline" size={22} color={text} />
            </TouchableOpacity>
            <Switch
              value={!!state[k]}
              onValueChange={v => !isFree && setState(s => ({ ...s, [k]: v }))}
              disabled={isFree}
            />
          </View>
        ))}

        {/* ******** NOVÝ BLOK: Pokročilá OCR nastavení ******** */}
        {sectionTitle('🛠️', t('ocr.section_ocr_advanced', 'Specifická OCR nastavení'), text)}

        {/* autoDecimal */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.autoDecimal', 'Automaticky doplnit desetinnou tečku')}</Text>
          <TouchableOpacity onPress={() => openTooltip('autoDecimal')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.autoDecimal}
            onValueChange={v => !isFree && setState(s => ({ ...s, autoDecimal: v }))}
            disabled={isFree}
          />
        </View>
        {/* useBinarization */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.useBinarization', 'Převést obraz na černobílý')}</Text>
          <TouchableOpacity onPress={() => openTooltip('useBinarization')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.useBinarization}
            onValueChange={v => !isFree && setState(s => ({ ...s, useBinarization: v }))}
            disabled={isFree}
          />
        </View>
        {/* binarizationThreshold */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.binarizationThreshold', 'Práh binarizace (0–255)')}</Text>
          <TouchableOpacity onPress={() => openTooltip('binarizationThreshold')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 70 },
              disabledStyle,
            ]}
            value={String(state.binarizationThreshold)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, binarizationThreshold: integerInput(v) }))}
          />
        </View>
        {/* useAdaptiveThreshold */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.useAdaptiveThreshold', 'Použít adaptivní thresholding')}</Text>
          <TouchableOpacity onPress={() => openTooltip('useAdaptiveThreshold')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.useAdaptiveThreshold}
            onValueChange={v => !isFree && setState(s => ({ ...s, useAdaptiveThreshold: v }))}
            disabled={isFree}
          />
        </View>
        {/* decimalSeparator */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.decimalSeparator', 'Desetinný oddělovač')}</Text>
          <TouchableOpacity onPress={() => openTooltip('decimalSeparator')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        {renderDropdown(DECIMAL_SEPARATOR_OPTIONS, state.decimalSeparator, v => setState(s => ({ ...s, decimalSeparator: v })), isFree)}

        {/* autoEqualizeHistogram */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.autoEqualizeHistogram', 'Automatické vyrovnání histogramu')}</Text>
          <TouchableOpacity onPress={() => openTooltip('autoEqualizeHistogram')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.autoEqualizeHistogram}
            onValueChange={v => !isFree && setState(s => ({ ...s, autoEqualizeHistogram: v }))}
            disabled={isFree}
          />
        </View>
        {/* debugOverlay */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.debugOverlay', 'Zobrazit vývojářské překryvy')}</Text>
          <TouchableOpacity onPress={() => openTooltip('debugOverlay')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.debugOverlay}
            onValueChange={v => !isFree && setState(s => ({ ...s, debugOverlay: v }))}
            disabled={isFree}
          />
        </View>
        {/* autoRotateIfUnclear */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.autoRotateIfUnclear', 'Automatické otočení obrázku při chybě OCR')}</Text>
          <TouchableOpacity onPress={() => openTooltip('autoRotateIfUnclear')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.autoRotateIfUnclear}
            onValueChange={v => !isFree && setState(s => ({ ...s, autoRotateIfUnclear: v }))}
            disabled={isFree}
          />
        </View>
        {/* valueFormat */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.valueFormat', 'Očekávané pořadí veličin')}</Text>
          <TouchableOpacity onPress={() => openTooltip('valueFormat')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, minWidth: 80 },
              disabledStyle,
            ]}
            value={state.valueFormat}
            placeholder={t('ocr.valueFormat_placeholder', 'Např. V-A-Ω')}
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, valueFormat: v }))}
          />
        </View>
        {/* fixCommonConfusions */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.fixCommonConfusions', 'Oprava běžných záměn')}</Text>
          <TouchableOpacity onPress={() => openTooltip('fixCommonConfusions')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.fixCommonConfusions}
            onValueChange={v => !isFree && setState(s => ({ ...s, fixCommonConfusions: v }))}
            disabled={isFree}
          />
        </View>
        {/* smartDecimalFallback */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.smartDecimalFallback', 'Automatické rozpoznání chybějící tečky')}</Text>
          <TouchableOpacity onPress={() => openTooltip('smartDecimalFallback')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.smartDecimalFallback}
            onValueChange={v => !isFree && setState(s => ({ ...s, smartDecimalFallback: v }))}
            disabled={isFree}
          />
        </View>
        {/* ocrConfidenceThreshold */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.ocrConfidenceThreshold', 'Minimální důvěra OCR (%)')}</Text>
          <TouchableOpacity onPress={() => openTooltip('ocrConfidenceThreshold')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 70 },
              disabledStyle,
            ]}
            value={String(state.ocrConfidenceThreshold)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, ocrConfidenceThreshold: integerInput(v) }))}
          />
        </View>
        {/* resampleWidth */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.resampleWidth', 'Převzorkování šířky obrázku')}</Text>
          <TouchableOpacity onPress={() => openTooltip('resampleWidth')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 70 },
              disabledStyle,
            ]}
            value={String(state.resampleWidth)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, resampleWidth: integerInput(v) }))}
          />
        </View>
        {/* filterNoise */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.filterNoise', 'Odstranit rušivé prvky')}</Text>
          <TouchableOpacity onPress={() => openTooltip('filterNoise')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.filterNoise}
            onValueChange={v => !isFree && setState(s => ({ ...s, filterNoise: v }))}
            disabled={isFree}
          />
        </View>
        {/* ocrTestMode */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.ocrTestMode', 'Testovací režim OCR')}</Text>
          <TouchableOpacity onPress={() => openTooltip('ocrTestMode')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.ocrTestMode}
            onValueChange={v => !isFree && setState(s => ({ ...s, ocrTestMode: v }))}
            disabled={isFree}
          />
        </View>
        {/* ocrEngine (dropdown) */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.ocrEngine', 'OCR engine')}</Text>
          <TouchableOpacity onPress={() => openTooltip('ocrEngine')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        {renderDropdown(OCR_ENGINE_OPTIONS, state.ocrEngine, v => setState(s => ({ ...s, ocrEngine: v })), isFree)}

        {/* ******** Původní pokročilá nastavení pokračují zde ... ******** */}

        {sectionTitle('⚙️', t('ocr.section_advanced', 'Pokročilé nastavení'), text)}
        <Text style={[styles.subsection, { color: text }]}>{t('ocr.preprocess_section', '📐 Předzpracování obrazu')}</Text>

        {/* Manuální kontrast */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.manualContrast', 'Manuální kontrast (0–100)')}</Text>
          <TouchableOpacity onPress={() => openTooltip('manualContrast')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 70 },
              disabledStyle,
            ]}
            value={String(state.manualContrast)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, manualContrast: integerInput(v) }))}
          />
        </View>
        {/* Manuální gamma */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.manualGamma', 'Gamma korekce (0.8–2.2)')}</Text>
          <TouchableOpacity onPress={() => openTooltip('manualGamma')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 70 },
              disabledStyle,
            ]}
            value={String(state.manualGamma)}
            keyboardType="decimal-pad"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, manualGamma: decimalInput(v) }))}
            inputMode="decimal"
          />
        </View>
        {/* Ostrost */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.sharpness', 'Ostrost')}</Text>
          <TouchableOpacity onPress={() => openTooltip('sharpness')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 70 },
              disabledStyle,
            ]}
            value={String(state.sharpness)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, sharpness: integerInput(v) }))}
          />
        </View>
        {/* Invertovat barvy */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.invertColors', 'Invertovat barvy')}</Text>
          <TouchableOpacity onPress={() => openTooltip('invertColors')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.invertColors}
            onValueChange={v => !isFree && setState(s => ({ ...s, invertColors: v }))}
            disabled={isFree}
          />
        </View>
        {/* Změna velikosti obrázku */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.resize', 'Změna velikosti obrázku')}</Text>
          <TouchableOpacity onPress={() => openTooltip('resize')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 100 },
              disabledStyle,
            ]}
            value={state.resize}
            placeholder={t('ocr.resize_placeholder', 'např. 800x600')}
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, resize: v }))}
          />
        </View>
        {/* Ruční ořez */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.manualCrop', 'Ruční ořez (x,y,w,h)')}</Text>
          <TouchableOpacity onPress={() => openTooltip('manualCrop')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 110 },
              disabledStyle,
            ]}
            value={`${state.manualCrop?.x || ''},${state.manualCrop?.y || ''},${state.manualCrop?.width || ''},${state.manualCrop?.height || ''}`}
            placeholder={t('ocr.manualCrop_placeholder', 'např. 10,20,200,60')}
            editable={!isFree}
            keyboardType="decimal-pad"
            onChangeText={v => {
              const vFixed = v.replace(/,/g, ',');
              const parts = vFixed.split(',');
              const [x, y, w, h] = parts.map(s => decimalInput(s.trim()));
              setState(s => ({
                ...s,
                manualCrop: { x: x || '', y: y || '', width: w || '', height: h || '' }
              }));
            }}
            inputMode="decimal"
          />
        </View>
        {/* Rotace obrázku */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.rotation', 'Rotace obrázku')}</Text>
          <TouchableOpacity onPress={() => openTooltip('rotation')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 60 },
              disabledStyle,
            ]}
            value={String(state.rotation)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, rotation: integerInput(v) }))}
          />
        </View>

        {/* Rozpoznání textu */}
        <Text style={[styles.subsection, { color: text }]}>{t('ocr.text_section', '🔍 Rozpoznání textu')}</Text>
        {/* Whitelist */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.whitelist', 'Whitelist znaků')}</Text>
          <TouchableOpacity onPress={() => openTooltip('whitelist')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 150 },
              disabledStyle,
            ]}
            value={state.whitelist}
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, whitelist: v }))}
          />
        </View>
        {/* Blacklist */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.blacklist', 'Blacklist znaků')}</Text>
          <TouchableOpacity onPress={() => openTooltip('blacklist')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 120 },
              disabledStyle,
            ]}
            value={state.blacklist}
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, blacklist: v }))}
          />
        </View>
        {/* Timeout OCR */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.ocrTimeout', 'Timeout OCR (ms)')}</Text>
          <TouchableOpacity onPress={() => openTooltip('ocrTimeout')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 80 },
              disabledStyle,
            ]}
            value={String(state.ocrTimeout)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, ocrTimeout: integerInput(v) }))}
          />
        </View>
        {/* Počet pokusů OCR */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.ocrAttempts', 'Počet pokusů OCR')}</Text>
          <TouchableOpacity onPress={() => openTooltip('ocrAttempts')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 60 },
              disabledStyle,
            ]}
            value={String(state.ocrAttempts)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, ocrAttempts: integerInput(v) }))}
          />
        </View>
        {/* Fallback OCR engine */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.fallbackEngine', 'Fallback OCR engine')}</Text>
          <TouchableOpacity onPress={() => openTooltip('fallbackEngine')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.fallbackEngine}
            onValueChange={v => !isFree && setState(s => ({ ...s, fallbackEngine: v }))}
            disabled={isFree}
          />
        </View>

        {/* Filtrování výsledků */}
        <Text style={[styles.subsection, { color: text }]}>{t('ocr.filter_section', '📊 Filtrování výsledků')}</Text>
        {/* Regulární výraz */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.regex', 'Regulární výraz pro hodnotu')}</Text>
          <TouchableOpacity onPress={() => openTooltip('regex')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 150 },
              disabledStyle,
            ]}
            value={state.regex}
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, regex: v }))}
          />
        </View>
        {/* Minimální délka textu */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.minTextLength', 'Minimální délka textu')}</Text>
          <TouchableOpacity onPress={() => openTooltip('minTextLength')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 60 },
              disabledStyle,
            ]}
            value={String(state.minTextLength)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, minTextLength: integerInput(v) }))}
          />
        </View>
        {/* Očekávaný počet hodnot */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.expectedValues', 'Očekávaný počet hodnot')}</Text>
          <TouchableOpacity onPress={() => openTooltip('expectedValues')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: input, borderColor: border, color: text, width: 60 },
              disabledStyle,
            ]}
            value={String(state.expectedValues)}
            keyboardType="numeric"
            editable={!isFree}
            onChangeText={v => setState(s => ({ ...s, expectedValues: integerInput(v) }))}
          />
        </View>
        {/* Ignorovat duplicity */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.ignoreDuplicates', 'Ignorovat duplicity')}</Text>
          <TouchableOpacity onPress={() => openTooltip('ignoreDuplicates')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.ignoreDuplicates}
            onValueChange={v => !isFree && setState(s => ({ ...s, ignoreDuplicates: v }))}
            disabled={isFree}
          />
        </View>

        {/* Interpretace a řazení výsledků */}
        <Text style={[styles.subsection, { color: text }]}>{t('ocr.interpret_section', '🧠 Interpretace a řazení výsledků')}</Text>

        {/* Řazení výsledků */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.resultOrder', 'Řazení výsledků')}</Text>
          <TouchableOpacity onPress={() => openTooltip('resultOrder')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.row, { flexWrap: 'nowrap', marginBottom: 10 }]}>
          {RESULT_ORDER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                state.resultOrder === opt.key && { backgroundColor: '#10b981' },
                disabledStyle,
              ]}
              onPress={() => !isFree && setState(s => ({ ...s, resultOrder: opt.key }))}
              disabled={isFree}
            >
              <Text style={{ color: state.resultOrder === opt.key ? '#fff' : '#111111' }}>
                {t(opt.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mapping - přiřazení veličin k pozicím */}
        <Text style={{ fontWeight: 'bold', marginTop: 6, color: text }}>
          {t('ocr.resultOrderMapping', 'Přiřazení veličin k pozicím (nahoře, uprostřed, dole)')}
        </Text>
        {POSITION_LABELS.map(pos =>
          renderMappingRow(pos.key, pos.labelKey, state.resultOrderMapping, handleResultOrderMappingChange)
        )}

        {/* Priorita výběru hodnot */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.valuePriority', 'Priorita výběru hodnot')}</Text>
          <TouchableOpacity onPress={() => openTooltip('valuePriority')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.row, { flexWrap: 'nowrap', marginBottom: 10 }]}>
          {VALUE_PRIORITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                state.valuePriority === opt.key && { backgroundColor: '#10b981' },
                disabledStyle,
              ]}
              onPress={() => !isFree && setState(s => ({ ...s, valuePriority: opt.key }))}
              disabled={isFree}
            >
              <Text style={{ color: state.valuePriority === opt.key ? '#fff' : '#111111' }}>
                {t(opt.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mapping - přiřazení veličin pro max, mid, min */}
        <Text style={{ fontWeight: 'bold', marginTop: 6, color: text }}>
          {t('ocr.valuePriorityMapping', 'Přiřazení veličin k hodnotám (nejvyšší, střední, nejnižší)')}
        </Text>
        {VALUE_PRIORITY_POSITIONS.map(pri =>
          renderPriorityMappingRow(pri.key, pri.labelKey, state.valuePriorityMapping, handleValuePriorityMappingChange)
        )}

        {/* Zohlednit okolní kontext */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.considerContext', 'Zohlednit okolní kontext')}</Text>
          <TouchableOpacity onPress={() => openTooltip('considerContext')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
          <Switch
            value={!!state.considerContext}
            onValueChange={v => !isFree && setState(s => ({ ...s, considerContext: v }))}
            disabled={isFree}
          />
        </View>
        {/* Přiřazení významu podle pořadí */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: text }]}>{t('ocr.valueMapping', 'Přiřazení významu podle pořadí')}</Text>
          <TouchableOpacity onPress={() => openTooltip('valueMapping')}>
            <Ionicons name="help-circle-outline" size={22} color={text} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: input, borderColor: border, color: text },
            disabledStyle,
          ]}
          value={state.customOrder}
          placeholder={t('ocr.customOrder_placeholder', 'Např. V-A-Ω')}
          editable={!isFree}
          onChangeText={v => setState(s => ({ ...s, customOrder: v }))}
        />

        {sectionTitle('❓', t('ocr.section_tips', 'Nápověda a tipy'), text)}
        <Text style={{ color: text, marginBottom: 13 }}>
          {t('ocr.tips_help', 'U každého nastavení stiskněte ')}
          <Ionicons name="help-circle-outline" size={18} color={text} />
          {t('ocr.tips_help2', ' pro podrobné vysvětlení a doporučení.')}
        </Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            isFree && { opacity: 0.5, backgroundColor: '#bbb' },
          ]}
          onPress={handleSave}
          disabled={isFree}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>
            {t('ocr.save', 'Uložit nastavení')}
          </Text>
        </TouchableOpacity>
        {isFree && (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 8 }}>
            {t(
              'ocr.free_disabled',
              'V bezplatné verzi není možné upravovat OCR nastavení. Odemkni úpravu v Plus verzi!'
            )}
          </Text>
        )}
      </ScrollView>
      {/* Tooltip modal */}
			{tooltip.visible && (
			    <TooltipModal
			        visible={tooltip.visible}
			        onClose={closeTooltip}
			        {...getTooltipTexts(tooltip.key)}
			    />
			)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  sectionTitle: { fontWeight: 'bold', fontSize: 19, marginTop: 18, marginBottom: 7 },
  subsection: { fontWeight: 'bold', fontSize: 15, marginTop: 8, marginBottom: 7 },
  label: { fontSize: 15, fontWeight: '500', flex: 1, color: '#111111' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 7, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginRight: 7,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    fontSize: 15,
    minWidth: 45,
    marginLeft: 8,
    backgroundColor: '#fff',
    color: '#111111'
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,28,30,0.70)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 340,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: { fontWeight: 'bold', fontSize: 17, marginBottom: 6, color: '#111111' },
  modalDesc: { fontSize: 15, marginBottom: 7, color: '#333', textAlign: 'center' },
  modalTip: { fontSize: 14, color: '#0b9444', fontStyle: 'italic', marginBottom: 13, textAlign: 'center' },
  modalCloseBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 9,
    marginTop: 7,
  },
  modalCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  mappingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, marginLeft: 8, gap: 5, flexWrap: 'wrap' },
});