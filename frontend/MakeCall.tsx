import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Voice } from '@twilio/voice-react-native-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const voice = new Voice();

const MakeCallScreen = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { appUserId, makeCallTo, phone, name, avatarURI, twilioToken, isIncoming } = route.params || {};

  const targetUserId = appUserId || makeCallTo || phone;
  
  const [fetchedName, setFetchedName] = useState(name);
  const [fetchedAvatar, setFetchedAvatar] = useState(avatarURI);

  const displayTitle = fetchedName || targetUserId || 'Unknown Contact';

  const [activeCall, setActiveCall] = useState<any>(null);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'Incoming...' : 'Starting...');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  
  const startTimeRef = useRef<number | null>(null);

  // Safely attempt to disconnect an active call without throwing Promise UUID error
  const safeDisconnect = (callObject: any) => {
    if (!callObject) return;
    try {
      const p = callObject.disconnect();
      if (p && typeof p.catch === 'function') {
        p.catch((err: any) => console.log('Safely caught disconnect error:', err));
      }
    } catch (error) {
      console.log('Caught synchronous disconnect error:', error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (targetUserId && !name) {
        try {
          const response = await fetch(`http://10.0.2.2:3000/api/user/profile?phone=${encodeURIComponent(targetUserId)}`);
          const data = await response.json();
          if (data.success && data.user) {
             if (data.user.displayName) setFetchedName(data.user.displayName);
             if (data.user.avatarUrl) setFetchedAvatar(data.user.avatarUrl);
          }
        } catch(e) {}
      }
    };
    fetchProfile();
  }, [targetUserId, name]);

  const saveCallLog = async (status: string) => {
    try {
      const myPhone = await AsyncStorage.getItem('userToken');
      if (!myPhone || !targetUserId) return;

      const duration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
      const callerPhone = isIncoming ? targetUserId : myPhone;
      const receiverPhone = isIncoming ? myPhone : targetUserId;

      await fetch('http://10.0.2.2:3000/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerPhone,
          receiverPhone,
          status,
          duration
        })
      });
    } catch (error) {
      console.error("Failed to save call log", error);
    }
  };

  useEffect(() => {
    let currentCall: any = null;

    const startCall = async () => {
      if (!targetUserId && !isIncoming) {
        setCallStatus('Invalid Contact');
        setTimeout(() => navigation.goBack(), 1500);
        return;
      }

      let token = twilioToken;

      if (!token) {
        setCallStatus('Connecting securely...');
        try {
          const myPhone = await AsyncStorage.getItem('userToken');
          const platform = Platform.OS;
          const response = await fetch(`http://10.0.2.2:3000/api/calls/token?identity=${encodeURIComponent(myPhone || 'user_me')}&platform=${platform}`);
          const data = await response.json();
          
          if (data.success) { token = data.token; } 
          else {
            setCallStatus('Token Error');
            setTimeout(() => navigation.goBack(), 1500);
            return;
          }
        } catch (error) {
          setCallStatus('Network Error');
          setTimeout(() => navigation.goBack(), 1500);
          return;
        }
      }

      if (isIncoming) return;

      try {
        setCallStatus('Calling...');
        currentCall = await voice.connect(token, { params: { To: targetUserId } });
        setActiveCall(currentCall);

        currentCall.on('connected', () => {
          setCallStatus('Connected');
          startTimeRef.current = Date.now();
        });
        currentCall.on('disconnected', () => {
          setCallStatus('Disconnected');
          saveCallLog('completed');
          setTimeout(() => navigation.goBack(), 1000);
        });
        currentCall.on('rejected', () => {
          setCallStatus('Call Declined');
          saveCallLog('rejected');
          setTimeout(() => navigation.goBack(), 1500);
        });
      } catch (error) {
        setCallStatus('Failed to connect');
        saveCallLog('failed');
        setTimeout(() => navigation.goBack(), 1500);
      }
    };

    startCall();

    return () => {
      // --- FIX: Safely attempt disconnect avoiding UUID errors ---
      if (currentCall) safeDisconnect(currentCall);
    };
  }, [twilioToken, targetUserId, isIncoming, navigation]);

  const handleHangUp = () => {
    if (activeCall) {
       // --- FIX: Safely attempt disconnect avoiding UUID errors ---
       safeDisconnect(activeCall);
    }
    if (callStatus === 'Calling...' || callStatus === 'Incoming...') {
       saveCallLog('missed'); 
    }
    navigation.goBack();
  };

  const toggleMute = () => {
    if (activeCall) {
      const newMutedState = !isMuted;
      activeCall.mute(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const toggleSpeaker = () => setIsSpeaker(!isSpeaker);

  const avatarSize = Math.min(width * 0.45, 200);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <View style={styles.responsiveWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Text style={styles.iconText}>↙</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.nameText}>{displayTitle}</Text>
            <Text style={[styles.statusText, callStatus === 'Failed to connect' && {color: '#F15C6D'}]}>
              {callStatus}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>+👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            {fetchedAvatar ? (
              <Image source={{ uri: fetchedAvatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={{ fontSize: avatarSize * 0.4, color: '#25D366', fontWeight: 'bold' }}>
                {displayTitle !== 'Unknown Contact' ? displayTitle.charAt(0).toUpperCase() : '👤'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.bottomControlsContainer}>
          <View style={styles.controlsPill}>
            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.controlIconText}>•••</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.controlBtn, styles.disabledBtn]}>
              <Text style={[styles.controlIconText, styles.disabledIconText]}>📹</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.controlBtn, isSpeaker && styles.activeBtn]} onPress={toggleSpeaker}>
              <Text style={styles.controlIconText}>🔊</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.controlBtn, isMuted && styles.activeBtn]} onPress={toggleMute}>
              <Text style={styles.controlIconText}>{isMuted ? '🔇' : '🎤'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
              <Text style={styles.hangUpIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0e10',
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 50,
    zIndex: 10,
  },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconText: { color: '#fff', fontSize: 20 },
  headerTitleContainer: { alignItems: 'center', flex: 1 },
  nameText: { color: '#ffffff', fontSize: 20, fontWeight: '600', marginBottom: 4 },
  statusText: { color: '#8696a0', fontSize: 15 },
  avatarWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
    backgroundColor: '#1a2e25',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', 
  },
  bottomControlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 40 : 50, 
    alignItems: 'center',
  },
  controlsPill: {
    flexDirection: 'row',
    backgroundColor: '#1f2326',
    paddingVertical: 10, paddingHorizontal: 15,
    borderRadius: 40,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#303437',
    justifyContent: 'center', alignItems: 'center',
  },
  activeBtn: { backgroundColor: '#d0ede6' },
  disabledBtn: { backgroundColor: 'transparent', opacity: 0.4 },
  controlIconText: { color: '#fff', fontSize: 22 },
  disabledIconText: { color: '#8696a0' },
  hangUpBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F15C6D',
    justifyContent: 'center', alignItems: 'center',
    transform: [{ rotate: '135deg' }], 
  },
  hangUpIcon: { color: '#fff', fontSize: 28 }
});

export default MakeCallScreen;