import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
} from 'react-native';

const ActionButton = ({ icon, label, styles }: any) => (
  <TouchableOpacity style={styles.actionButton}>
    <View style={styles.actionIconContainer}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const CallItem = ({ name, type, time, count, isMissed, avatarURI, styles }: any) => (
  <TouchableOpacity style={styles.callItem} activeOpacity={0.7}>
    <Image source={{ uri: avatarURI }} style={styles.callAvatar} />
    <View style={styles.callContent}>
      <Text style={[styles.callName, isMissed && styles.callNameMissed]} numberOfLines={1}>
        {name} {count ? `(${count})` : ''}
      </Text>
      <View style={styles.callTypeContainer}>
        <Text style={styles.callTypeIcon}>↗</Text> 
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          <CallItem 
            name="Uvindu" 
            type="Outgoing" 
            time="Yesterday" 
            avatarURI="https://i.pravatar.cc/100?img=11"
            styles={styles} 
          />
          <CallItem 
            name="Sasindu" 
            count="3"
            type="Outgoing" 
            time="Yesterday" 
            avatarURI="https://i.pravatar.cc/100?img=12"
            styles={styles} 
          />
          <CallItem 
            name="Gothira #A?" 
            type="Outgoing" 
            time="Yesterday" 
            avatarURI="https://i.pravatar.cc/100?img=13"
            styles={styles} 
          />
          <CallItem 
            name="Anjula Ayya Sliit" 
            count="3"
            type="Outgoing" 
            time="Yesterday" 
            avatarURI="https://i.pravatar.cc/100?img=14"
            styles={styles} 
          />
          <CallItem 
            name="Gothira #A?" 
            count="2"
            type="Outgoing" 
            time="Yesterday" 
            avatarURI="https://i.pravatar.cc/100?img=13"
            styles={styles} 
          />
          <CallItem 
            name="Pawan Ac" 
            count="4"
            type="Outgoing" 
            time="Yesterday" 
            avatarURI="https://i.pravatar.cc/100?img=15"
            styles={styles} 
          />
          <CallItem 
            name="Gothira #A?" 
            count="2"
            type="Outgoing" 
            time="Yesterday" 
            avatarURI="https://i.pravatar.cc/100?img=13"
            styles={styles} 
          />
          <CallItem 
            name="Kavindu(Kala) & Janiya" 
            type="Outgoing" 
            time="Yesterday" 
            isMissed={true}
            avatarURI="https://i.pravatar.cc/100?img=16"
            styles={styles} 
          />
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
