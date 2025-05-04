import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import AudioProcessor from './src/AudioProcessor';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [reverbLevel, setReverbLevel] = useState(0.5);

  useEffect(() => {
    checkPermission();
    Sound.setCategory('Playback');
  }, []);

  const checkPermission = async () => {
    const permission = Platform.select({
      android: PERMISSIONS.ANDROID.RECORD_AUDIO,
      ios: PERMISSIONS.IOS.MICROPHONE,
    });

    if (!permission) return;

    const result = await check(permission);
    if (result === RESULTS.DENIED) {
      const permissionResult = await request(permission);
      if (permissionResult !== RESULTS.GRANTED) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice monitoring'
        );
      }
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    AudioProcessor.setVolume(value);
  };

  const handleReverbChange = (value: number) => {
    setReverbLevel(value);
    AudioProcessor.setReverbLevel(value);
  };

  const startRecording = async () => {
    try {
      await VoiceProcessor.instance.start(512, 16000);
      VoiceProcessor.instance.addFrameListener((frame) => {
        // Chuyển đổi Int16Array thành Float32Array
        const floatFrame = new Float32Array(frame.length);
        for (let i = 0; i < frame.length; i++) {
          floatFrame[i] = frame[i] / 32768.0; // Normalize to [-1, 1]
        }
        
        // Xử lý frame âm thanh
        const processedFrame = AudioProcessor.processAudioFrame(floatFrame);
        
        // Chuyển đổi lại thành Int16Array để phát
        const outputFrame = new Int16Array(processedFrame.length);
        for (let i = 0; i < processedFrame.length; i++) {
          outputFrame[i] = Math.max(-32768, Math.min(32767, processedFrame[i] * 32768.0));
        }
        
        // TODO: Phát lại âm thanh đã xử lý
        console.log('Processed audio frame:', outputFrame.length);
      });
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice processor:', error);
      Alert.alert('Error', 'Failed to start voice monitoring');
    }
  };

  const stopRecording = async () => {
    try {
      await VoiceProcessor.instance.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping voice processor:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Voice Monitoring App</Text>
        
        <View style={styles.controls}>
          <Text style={styles.label}>Volume</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={handleVolumeChange}
          />
          
          <Text style={styles.label}>Reverb</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={reverbLevel}
            onValueChange={handleReverbChange}
          />
          
          <TouchableOpacity
            style={[styles.button, isRecording && styles.buttonStop]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop Monitoring' : 'Start Monitoring'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  controls: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonStop: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App; 