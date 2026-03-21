import React from 'react';
import { ScrollView, Text, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

function GuideScreen({ navigation }) {
  const { t } = useTranslation();

  const steps = [
    t('GuideStep1', {
      defaultValue:
        '1. Saving a measurement. Enter the values and select “Next String”. The measurement is stored and a note or photo can be attached if needed.',
    }),
    t('GuideStep2', {
      defaultValue:
        '2. Scanning values (OCR). Use the scanner icon to take a photo of the multimeter display. Recognized values are filled in automatically.',
    }),
    t('GuideStep3', {
      defaultValue:
        '3. Taking a photo of the string. Use the camera icon to capture the string. The photo is stored together with a label (for example “2-B1”).',
    }),
    t('GuideStep4', {
      defaultValue:
        '4. Export to TXT. Use the document icon, enter a file name and export the measurements as a text file.',
    }),
    t('GuideStep5', {
      defaultValue:
        '5. Export to a spreadsheet (single column). Use the grid icon to export all data into a single column.',
    }),
    t('GuideStep6', {
      defaultValue:
        '6. Export to a spreadsheet (multiple columns). Use the statistics icon to export each value into its own column.',
    }),
    t('GuideStep7', {
      defaultValue:
        '7. Saved measurements. Use the folder icon to open existing measurements for editing values or notes, or for deletion. The “Recalculate Errors” button recalculates all errors.',
    }),
    t('GuideStep8', {
      defaultValue:
        '8. Settings. In Settings, limit values, labeling, number of cables, languages, measured quantities and photo labels can be configured.',
    }),
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text
        style={{
          marginBottom: 16,
          fontSize: 18,
          fontWeight: 'bold',
          color: '#111111',
        }}
      >
        {t('GuideTextTitle', {
          defaultValue: 'SmartSolarMeter – User Guide ANDROID DEBUG',
        })}
      </Text>

      {steps.map((step, index) => (
        <Text
          key={index}
          style={{
            marginBottom: 12,
            fontSize: 16,
            color: '#111111',
          }}
        >
          {step}
        </Text>
      ))}

      <TouchableOpacity
        onPress={() => Linking.openURL('https://smartsolarmeter.app/terms')}
        style={{ marginBottom: 12 }}
      >
        <Text style={{ color: '#0057e7', fontSize: 16 }}>
          {t('Terms of Use', { defaultValue: 'Terms of Use' })}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL('https://smartsolarmeter.app/privacy')}
        style={{ marginBottom: 24 }}
      >
        <Text style={{ color: '#0057e7', fontSize: 16 }}>
          {t('Privacy Policy', { defaultValue: 'Privacy Policy' })}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default GuideScreen;