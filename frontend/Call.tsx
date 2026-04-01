import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { Voice } from '@twilio/voice-react-native-sdk';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const voice = new Voice();

const ActionButton = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionIconContainer}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const CallItem = ({ name, type, time, count, isMissed, avatarURI, appUserId, onCall }: any) => (
  <TouchableOpacity 
    style={styles.callItem} 
    activeOpacity={0.7}
    onPress={() => onCall(appUserId, name, avatarURI)}
  >
    <View style={styles.callAvatar}>
      {avatarURI ? (
         <Image source={{ uri: avatarURI }} style={{width: '100%', height: '100%', borderRadius: 25}} />
      ) : (
         <Text style={{color: '#fff', fontSize: 20, fontWeight: 'bold'}}>{name ? name.charAt(0) : '?'}</Text>
      )}
    </View>
    <View style={styles.callContent}>
      <Text style={[styles.callName, isMissed && styles.callNameMissed]} numberOfLines={1}>
        {name} {count ? `(${count})` : ''}
      </Text>
      <View style={styles.callTypeContainer}>
        <Text style={styles.callTypeIcon}>{isMissed ? '↙' : '↗'}</Text> 
        <Text style={styles.callTypeText}>{type}</Text>
      </View>
    </View>
    <View style={styles.callRightContainer}>
      <Text style={styles.callTime}>{time}</Text>
      <TouchableOpacity style={styles.infoButton}>
        <Text style={styles.infoIcon}>ⓘ</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const CallsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [twilioToken, setTwilioToken] = useState<string>('');

  const fetchCalls = async () => {
    try {
      const myPhone = await AsyncStorage.getItem('userToken');
      if (!myPhone) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://10.0.2.2:3000/api/calls/${encodeURIComponent(myPhone)}`); 
      const data = await response.json();
      
      if(data.success) {
        setCalls(data.calls);
      }
    } catch (error) {
      console.error("Failed to fetch calls:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh calls when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCalls();
    });
    fetchCalls();
    setupTwilio();

    voice.on(Voice.Event.CallInvite, async (callInvite: any) => {
      console.log("Incoming call from:", callInvite.from);
      
      // Fetch caller details from DB to show Name and Avatar
      try {
        const response = await fetch(`http://10.0.2.2:3000/api/user/profile?phone=${encodeURIComponent(callInvite.from)}`);
        const data = await response.json();
        if (data.success && data.user) {
          callInvite.customName = data.user.displayName;
          callInvite.customAvatar = data.user.avatarUrl;
        }
      } catch (err) { }

      setIncomingCall(callInvite);

      callInvite.on('canceled', () => {
        setIncomingCall(null);
        fetchCalls(); // refresh history to show missed call
      });
    });

    return () => {
      unsubscribe();
      voice.removeAllListeners();
    };
  }, [navigation]);

  const setupTwilio = async () => {
    try {
      const platform = Platform.OS;
      const response = await fetch(`http://10.0.2.2:3000/api/calls/token?identity=user_me&platform=${platform}`);
      const data = await response.json();
      if (data.success) {
        setTwilioToken(data.token);
        if (platform === 'ios') await voice.initializePushRegistry(); 
        await voice.register(data.token);
      }
    } catch (error) { }
  };

  const handleMakeCall = (appUserId: string, name?: string, avatarURI?: string) => {
    if (!appUserId || !twilioToken) return;
    navigation.navigate('MakeCallScreen', { appUserId, name: name || appUserId, avatarURI, twilioToken, isIncoming: false });
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      navigation.navigate('MakeCallScreen', {
        appUserId: incomingCall.from,
        name: incomingCall.customName || incomingCall.from,
        avatarURI: incomingCall.customAvatar,
        twilioToken,
        isIncoming: true
      });
      setIncomingCall(null);
    }
  };

  const handleRejectCall = async () => {
    if (incomingCall) {
      incomingCall.reject();
      setIncomingCall(null);
      
      // Manually log rejected call to DB
      try {
        const myPhone = await AsyncStorage.getItem('userToken');
        await fetch('http://10.0.2.2:3000/api/calls/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callerPhone: incomingCall.from, receiverPhone: myPhone, status: 'rejected', duration: 0 })
        });
        fetchCalls();
      } catch (err) {}
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {incomingCall && (
          <View style={styles.incomingCallBanner}>
            <Text style={styles.incomingCallTitle}>Incoming Call...</Text>
            
            {/* Center Profile Image */}
            <View style={styles.incomingAvatarWrapper}>
              {incomingCall.customAvatar ? (
                <Image source={{ uri: incomingCall.customAvatar }} style={styles.incomingAvatar} />
              ) : (
                <Text style={{ fontSize: 32, color: '#25D366', fontWeight: 'bold' }}>
                  {incomingCall.customName ? incomingCall.customName.charAt(0).toUpperCase() : '👤'}
                </Text>
              )}
            </View>

            {/* Show Name instead of Number */}
            <Text style={styles.incomingCallName}>{incomingCall.customName || incomingCall.from}</Text>
            
            <View style={styles.callActionRow}>
              <TouchableOpacity onPress={handleRejectCall} style={[styles.callActionButton, { backgroundColor: '#F15C6D' }]}>
                <Text style={styles.callActionText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAcceptCall} style={[styles.callActionButton, { backgroundColor: '#2e7d32' }]}>
                <Text style={styles.callActionText}>Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor="#8696a0" />
          </View>
        </View>

        <View style={styles.quickActions}>
          <ActionButton icon="📞" label="Call" onPress={() => navigation.navigate('Dialpad')} />
          <ActionButton icon="📅" label="Schedule" />
          <ActionButton icon="🔢" label="Keypad" onPress={() => navigation.navigate('Dialpad')} />
          <ActionButton icon="♡" label="Favorites" />
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent</Text>
          
          <View style={styles.callList}>
            {loading ? (
              <ActivityIndicator size="large" color="#d0ede6" style={{ marginTop: 20 }} />
            ) : (
              calls.map((call) => (
                <CallItem 
                  key={call.id}
                  name={call.name} 
                  type={call.type} 
                  time={call.time} 
                  count={call.count}
                  isMissed={call.isMissed}
                  avatarURI={call.avatarURI}
                  appUserId={call.appUserId} 
                  onCall={handleMakeCall}
                />
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d110f',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  container: {
    flex: 1,
    backgroundColor: '#0d110f',
  },
  incomingCallBanner: {
    backgroundColor: '#111816',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
    elevation: 10,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  incomingCallTitle: {
    color: '#8696a0',
    fontSize: 14,
    marginBottom: 12,
  },
  incomingAvatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a2e25',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  incomingAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  incomingCallName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  callActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  callActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  callActionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: { paddingHorizontal: 16, marginTop: 16, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2e25', height: 44, borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { fontSize: 18, color: '#8696a0', marginRight: 10 },
  searchInput: { flex: 1, color: '#d0ede6', fontSize: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  actionButton: { alignItems: 'center', flex: 1 },
  actionIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a2e25', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIcon: { fontSize: 24, color: '#d0ede6' },
  actionLabel: { color: '#a0c4b8', fontSize: 13, fontWeight: '500' },
  recentSection: { marginTop: 10 },
  recentTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', paddingHorizontal: 16, marginBottom: 16 },
  callList: { paddingHorizontal: 16 },
  callItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  callAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a2e25', justifyContent: 'center', alignItems: 'center' },
  callContent: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  callName: { fontSize: 16, fontWeight: '500', color: '#ffffff', marginBottom: 4 },
  callNameMissed: { color: '#F15C6D' },
  callTypeContainer: { flexDirection: 'row', alignItems: 'center' },
  callTypeIcon: { fontSize: 14, color: '#8696a0', marginRight: 6 },
  callTypeText: { fontSize: 13, color: '#8696a0' },
  callRightContainer: { flexDirection: 'row', alignItems: 'center' },
  callTime: { fontSize: 13, color: '#8696a0', marginRight: 12 },
  infoButton: { padding: 4 },
  infoIcon: { fontSize: 20, color: '#a0c4b8' },
});

export default CallsScreen;