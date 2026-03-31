import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform 
} from 'react-native';
import { Voice } from '@twilio/voice-react-native-sdk';
import { useNavigation, useRoute } from '@react-navigation/native'; // NEW IMPORT

const voice = new Voice();

const ActionButton = ({ icon, label, styles }: any) => (
  <TouchableOpacity style={styles.actionButton}>
    <View style={styles.actionIconContainer}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const CallItem = ({ name, type, time, count, isMissed, avatarURI, appUserId, styles, onCall }: any) => (
  <TouchableOpacity 
    style={styles.callItem} 
    activeOpacity={0.7}
    onPress={() => onCall(appUserId)}
  >
    <Image source={{ uri: avatarURI }} style={styles.callAvatar} />
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
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);
  
  // Navigation hooks
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCall, setActiveCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  const [twilioToken, setTwilioToken] = useState<string>('');

  useEffect(() => {
    fetchCalls();
    setupTwilio();

    voice.on(Voice.Event.CallInvite, (callInvite: any) => {
      console.log("Incoming call from:", callInvite.from);
      setIncomingCall(callInvite);

      callInvite.on('canceled', () => {
        setIncomingCall(null);
      });
    });

    return () => {
      voice.removeAllListeners();
    };
  }, []);

  const setupTwilio = async () => {
    try {
      const platform = Platform.OS;
      
      const response = await fetch(`http://10.0.2.2:3000/api/calls/token?identity=user_me&platform=${platform}`);
      const data = await response.json();
      
      if (data.success) {
        setTwilioToken(data.token);

        if (platform === 'ios') {
          await voice.initializePushRegistry(); 
        }
        
        await voice.register(data.token);
        console.log("Twilio Voice SDK Initialized successfully for background calls");
      }
    } catch (error) {
      console.error("Failed to setup Twilio:", error);
    }
  };

  const handleMakeCall = async (appUserId: string) => {
    if (!appUserId) {
      Alert.alert("Error", "No user ID provided for this contact.");
      return;
    }

    if (!twilioToken) {
      Alert.alert("Error", "Twilio token is not initialized yet. Please wait a moment.");
      return;
    }

    try {
      const call = await voice.connect(twilioToken, { params: { To: appUserId } });
      setActiveCall(call);

      call.on('disconnected', () => {
        setActiveCall(null);
      });

      call.on('rejected', () => {
        setActiveCall(null);
        Alert.alert("Call Rejected", "The user declined your call.");
      });
    } catch (error) {
      Alert.alert("Call Failed", "Could not connect.");
      console.error(error);
    }
  };

  // --- NEW: Auto-trigger call when navigated from ChatScreen ---
  useEffect(() => {
    const autoCallUserId = route.params?.makeCallTo;
    
    if (autoCallUserId && twilioToken) {
      // Trigger the call
      handleMakeCall(autoCallUserId);
      
      // Clear the parameter so it doesn't get called again on re-renders
      navigation.setParams({ makeCallTo: undefined });
    }
  }, [route.params?.makeCallTo, twilioToken]);
  // -------------------------------------------------------------

  const handleAcceptCall = async () => {
    if (incomingCall) {
      try {
        const call = await incomingCall.accept();
        setActiveCall(call);
        setIncomingCall(null);

        call.on('disconnected', () => {
          setActiveCall(null);
        });
      } catch (error) {
        Alert.alert("Error", "Failed to answer the call.");
      }
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      incomingCall.reject();
      setIncomingCall(null);
    }
  };

  const handleHangUp = () => {
    if (activeCall) {
      activeCall.disconnect();
      setActiveCall(null);
    }
  };

  const fetchCalls = async () => {
    try {
      const response = await fetch('http://10.0.2.2:3000/api/calls'); 
      const data = await response.json();
      if(data.success) {
        setCalls(data.calls);
      }
    } catch (error) {
      console.error("Failed to fetch calls:", error);
      Alert.alert("Error", "Could not load recent calls.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* --- INCOMING CALL UI --- */}
      {incomingCall && (
        <View style={styles.incomingCallBanner}>
          <Text style={styles.incomingCallTitle}>Incoming Call</Text>
          <Text style={styles.incomingCallName}>{incomingCall.from}</Text>
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

      {/* --- ACTIVE CALL UI --- */}
      {activeCall && !incomingCall && (
        <View style={styles.activeCallBanner}>
          <Text style={styles.activeCallTitle}>Call Connected</Text>
          <TouchableOpacity onPress={handleHangUp} style={styles.hangUpButton}>
            <Text style={styles.callActionText}>Hang Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#8696a0"
          />
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.quickActions}>
        <ActionButton icon="📞" label="Call" styles={styles} />
        <ActionButton icon="📅" label="Schedule" styles={styles} />
        <ActionButton icon="🔢" label="Keypad" styles={styles} />
        <ActionButton icon="♡" label="Favorites" styles={styles} />
      </View>

      {/* RECENT Section */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>Recent</Text>
        
        <View style={styles.callList}>
          {loading ? (
            <ActivityIndicator size="large" color="#d0ede6" />
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
                appUserId={call.appUserId || call.phoneNumber} 
                styles={styles} 
                onCall={handleMakeCall}
              />
            ))
          )}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

function makeStyles(width: number, height: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0d110f',
    },
    incomingCallBanner: {
      backgroundColor: '#1a2e25',
      margin: 16,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#2e7d32',
    },
    incomingCallTitle: {
      color: '#8696a0',
      fontSize: 14,
      marginBottom: 8,
    },
    incomingCallName: {
      color: '#ffffff',
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    callActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 20,
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
    activeCallBanner: {
      backgroundColor: '#2e7d32',
      margin: 16,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    activeCallTitle: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    hangUpButton: {
      backgroundColor: '#F15C6D',
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 20,
    },
    searchContainer: {
      paddingHorizontal: 16,
      marginTop: 10,
      marginBottom: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1a2e25',
      height: 40,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    searchIcon: {
      fontSize: 16,
      color: '#8696a0',
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: '#d0ede6',
      fontSize: 16,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginBottom: 10,
    },
    actionButton: {
      alignItems: 'center',
      gap: 10,
    },
    actionIconContainer: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: '#1a2e25',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionIcon: {
      fontSize: 24,
      color: '#d0ede6',
    },
    actionLabel: {
      color: '#a0c4b8',
      fontSize: 13,
      fontWeight: '500',
    },
    recentSection: {
      marginTop: 10,
    },
    recentTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    callList: {
      paddingHorizontal: 16,
    },
    callItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    callAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#1a2e25',
    },
    callContent: {
      flex: 1,
      marginLeft: 14,
      justifyContent: 'center',
    },
    callName: {
      fontSize: 17,
      fontWeight: '500',
      color: '#ffffff',
      marginBottom: 4,
    },
    callNameMissed: {
      color: '#F15C6D',
    },
    callTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    callTypeIcon: {
      fontSize: 16,
      color: '#8696a0',
      marginRight: 6,
    },
    callTypeText: {
      fontSize: 14,
      color: '#8696a0',
    },
    callRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    callTime: {
      fontSize: 14,
      color: '#8696a0',
      marginRight: 12,
    },
    infoButton: {
      padding: 0,
    },
    infoIcon: {
      fontSize: 22,
      color: '#a0c4b8',
    },
  });
}

export default CallsScreen;