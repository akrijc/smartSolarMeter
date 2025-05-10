import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

function GuideScreen({ navigation }) {
  const { t } = useTranslation();

  const guideLines = [
    t('GuideTextTitle', { defaultValue: 'SmartSolarMeter – Návod k použití' }),
    '',
    t('GuideStep1', { defaultValue: '1. Uložení měření\nZadej hodnoty a stiskni „Next String“. Hodnota se uloží. Můžeš přidat poznámku nebo fotku.' }),
    '',
    t('GuideStep2', { defaultValue: '2. Skenování hodnot (OCR)\nStiskni ikonu skeneru a vyfoť displej měřáku. Hodnoty se vyplní automaticky.' }),
    '',
    t('GuideStep3', { defaultValue: '3. Pořízení fotky stringu\nStiskni ikonu fotoaparátu. Fotka se uloží s popiskem (např. „2-B1“).' }),
    '',
    t('GuideStep4', { defaultValue: '4. Export do TXT\nIkona dokumentu → zadej název → exportuj do textu.' }),
    '',
    t('GuideStep5', { defaultValue: '5. Export do tabulky (1 sloupec)\nIkona gridu → všechny údaje v jednom sloupci.' }),
    '',
    t('GuideStep6', { defaultValue: '6. Export do tabulky (více sloupců)\nIkona statistiky → každý údaj ve vlastním sloupci.' }),
    '',
    t('GuideStep7', { defaultValue: '7. Uložená měření\nIkona složky → úprava hodnot, poznámky, mazání. Tlačítko „Recalculate Errors“ přepočítá chyby.' }),
    '',
    t('GuideStep8', { defaultValue: '8. Nastavení\nZde nastavíš kritické hodnoty, způsob značení, počet kabelů, jazyky, co měřit a jaký popisek fotek použít.' })
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
      <ScrollView>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 14 }}>
          {t('Guide', { defaultValue: 'Guide' })}
        </Text>
        {guideLines.map((line, index) => (
          <Text key={index} style={{ fontSize: 15, marginBottom: 6, color: '#222' }}>
            {line}
          </Text>
        ))}

        {/* 🔗 Právní odkazy */}
        <View style={{ marginTop: 30 }}>
          <TouchableOpacity onPress={() => Linking.openURL('https://akrijc.github.io/smartsolarmeter-privacy/terms-of-use.html')}>
            <Text style={{ color: '#007AFF', textDecorationLine: 'underline', marginBottom: 10 }}>
              {t('Podmínky použití', { defaultValue: 'Terms of Use' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL('https://akrijc.github.io/smartsolarmeter-privacy/privacy-policy.html')}>
            <Text style={{ color: '#007AFF', textDecorationLine: 'underline' }}>
              {t('Zásady ochrany soukromí', { defaultValue: 'Privacy Policy' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tlačítko Zpět */}
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 24,
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>
            ← {t('Back', { defaultValue: 'Back' })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default GuideScreen;