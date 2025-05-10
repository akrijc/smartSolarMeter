// CameraTestScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function CameraTestScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted' && mediaStatus.status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        Alert.alert('✅ Fotka uložena', photo.uri);
      } catch (error) {
        Alert.alert('❌ Chyba při focení', error.message || String(error));
      }
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>⏳ Načítání oprávnění...</Text></View>;
  }

  if (!hasPermission) {
    return <View style={styles.center}><Text>📵 Není povolen přístup ke kameře nebo galerii.</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={Camera.Constants.Type.back} ref={cameraRef} />
      <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
        <Text style={styles.buttonText}>📷 Vyfotit</Text>
      </TouchableOpacity>
      {photoUri && (
        <View style={styles.preview}>
          <Text>Náhled fotky:</Text>
          <Image source={{ uri: photoUri }} style={styles.image} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  captureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    zIndex: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  preview: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
  },
  image: {
    marginTop: 6,
    width: 200,
    height: 140,
    borderRadius: 8,
  },
});