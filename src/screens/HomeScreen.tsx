import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = '@solar_panel_data';
const INVERTER_NUMBER_KEY = '@inverter_number';
const CABLE_COUNT_KEY = '@cable_count';

const HomeScreen = () => {
  const { t } = useTranslation();
  const [inverterNumber, setInverterNumber] = useState('');
  const [voltage, setVoltage] = useState('');
  const [current, setCurrent] = useState('');
  const [resistance, setResistance] = useState('');
  const [cableIndex, setCableIndex] = useState(0);
  const [savedCables, setSavedCables] = useState([]);
  const [cableCount, setCableCount] = useState(6);
  const currentInput = useRef(null);

  const cableLabels = cableCount === 12 
    ? ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'F1', 'F2']
    : ['A', 'B', 'C', 'D', 'E', 'F'];

  useEffect(() => {
    loadData();
    loadInverterNumber();
  }, []);

  const handleNextCable = () => {
    if (!inverterNumber) {
      Alert.alert(t('Error'), t('Please enter the inverter number first.'));
      return;
    }
    saveCurrentCable();
    setCableIndex((cableIndex + 1) % cableLabels.length);
    setVoltage('');
    setCurrent('');
    setResistance('');
    if (currentInput.current) currentInput.current.focus();
  };

  const saveCurrentCable = async () => {
    try {
      const cableLabel = cableLabels[cableIndex];
      const newCable = {
        inverterNumber,
        cableLabel,
        voltage,
        current,
        resistance
      };
      const updatedCables = [...savedCables, newCable];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCables));
      setSavedCables(updatedCables);
      Alert.alert(t('save'), t('Data saved successfully!'));
    } catch (error) {
      Alert.alert(t('Error'), t('Failed to save data.'));
    }
  };

  const copyToClipboard = async () => {
    const textToCopy = savedCables.map(cable => 
      `${cable.inverterNumber}-${cable.cableLabel}-${cable.voltage}V-${cable.current}A-${cable.resistance}MΩ`
    ).join('\n');
    
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert(t('Copied'), t('Data has been copied to clipboard.'));
  };

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData)) setSavedCables(parsedData);
        else setSavedCables([]);
        Alert.alert(t('load'), t('Data loaded successfully!'));
      } else {
        setSavedCables([]);
      }
    } catch (error) {
      Alert.alert(t('Error'), t('Failed to load data.'));
    }
  };

  const loadInverterNumber = async () => {
    try {
      const savedInverter = await AsyncStorage.getItem(INVERTER_NUMBER_KEY);
      if (savedInverter) setInverterNumber(savedInverter);
    } catch (error) {
      Alert.alert(t('Error'), t('Failed to load inverter number.'));
    }
  };

  const clearData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSavedCables([]);
      setCableIndex(0);
      Alert.alert(t('clear'), t('All data has been cleared.'));
    } catch (error) {
      Alert.alert(t('Error'), t('Failed to clear data.'));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text>{t('title')}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={t('Inverter Number')}
          value={inverterNumber}
          onChangeText={setInverterNumber}
        />

        <TextInput
          style={styles.input}
          placeholder="Cable Count (6 or 12)"
          value={String(cableCount)}
          keyboardType="numeric"
          onChangeText={(value) => setCableCount(Number(value))}
        />

        <Text>{t('Cable Number')}: {cableLabels[cableIndex]}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={t('voltage')}
          value={voltage}
          onChangeText={setVoltage}
          keyboardType="numeric"
          ref={currentInput}
        />
        
        <TextInput
          style={styles.input}
          placeholder={t('current')}
          value={current}
          onChangeText={setCurrent}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder={t('resistance')}
          value={resistance}
          onChangeText={setResistance}
          keyboardType="numeric"
        />
        
        <Button title={t('next')} onPress={handleNextCable} />
        <Button title={t('save')} onPress={saveCurrentCable} />
        <Button title={t('load')} onPress={loadData} />
        <Button title={t('clear')} onPress={clearData} />
        <Button title={t('Copy to Clipboard')} onPress={copyToClipboard} />

        <Text>{t('Saved Cables')}:</Text>
        {savedCables.map((cable, index) => (
          <Text key={index}>
            {`${cable.inverterNumber}-${cable.cableLabel}-${cable.voltage}V-${cable.current}A-${cable.resistance}MΩ`}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  innerContainer: {
    padding: 20,
    marginBottom: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  }
});

export default HomeScreen;