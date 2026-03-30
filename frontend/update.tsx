import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

const StatusCard = ({ isAdd, name, imageURI, avatarURI, styles }: any) => {
  return (
    <TouchableOpacity style={styles.statusCard} activeOpacity={0.8}>
      {isAdd ? (
        <View style={[styles.statusBg, styles.addStatusBg]}>
          <View style={styles.addAvatarContainer}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/100?img=68' }} 
              style={styles.statusAvatar} 
            />
            <View style={styles.addIconBadge}>
              <Text style={styles.addIconText}>+</Text>
            </View>
          </View>
        </View>
      ) : (
        <Image source={{ uri: imageURI }} style={styles.statusBg} />
      )}
      {!isAdd && (
        <View style={styles.statusAvatarOverlay}>
          <Image source={{ uri: avatarURI }} style={styles.statusAvatarSmall} />
        </View>
      )}
      <View style={styles.statusTextContainer}>
        <Text style={styles.statusName} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ChannelItem = ({ name, message, time, badge, logoURI, styles }: any) => {
  return (
    <TouchableOpacity style={styles.channelItem} activeOpacity={0.7}>
      <Image source={{ uri: logoURI }} style={styles.channelLogo} />
      <View style={styles.channelContent}>
        {/* Left Column for Text */}
        <View style={styles.channelTextCol}>
          <Text style={styles.channelName} numberOfLines={1}>{name}</Text>
          <Text style={styles.channelMessage} numberOfLines={2}>{message}</Text>
        </View>
        
        {/* Right Column for Time & Badge */}
        <View style={styles.channelRightCol}>
          <Text style={[styles.channelTime, badge ? styles.channelTimeUnread : null]}>{time}</Text>
          {badge ? (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const UpdatesScreen = () => {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* STATUS SECTION */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusList}
      >
        <StatusCard isAdd={true} name="Add status" styles={styles} />
        <StatusCard 
          name="Pinhena Mis&#10;Puja Badu..."
          imageURI="https://picsum.photos/200/300?random=1"
          avatarURI="https://i.pravatar.cc/100?img=33"
          styles={styles}
        />
        <StatusCard 
          name="Sumudunii&#10;SP"
          imageURI="https://picsum.photos/200/300?random=2"
          avatarURI="https://i.pravatar.cc/100?img=47"
          styles={styles}
        />
        <StatusCard 
          name="Malith S"
          imageURI="https://picsum.photos/200/300?random=3"
          avatarURI="https://i.pravatar.cc/100?img=11"
          styles={styles}
        />
      </ScrollView>

      {/* CHANNELS SECTION */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Channels</Text>
        <TouchableOpacity style={styles.exploreButton}>
          <Text style={styles.exploreText}>Explore</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.channelsList}>
        <ChannelItem 
          name="CNN"
          message="📷 Paintings by Pierre-Auguste Renoir, Paul Cezanne and Henri M..."
          time="Yesterday"
          badge="666"
          logoURI="https://logo.clearbit.com/cnn.com"
          styles={styles}
        />
        <ChannelItem 
          name="Netflix"
          message="HIIIIII MY SWEET LOYAL CUBS 🥰🥰 G'MORNING G'AFTERNOON..."
          time="Yesterday"
          badge="80"
          logoURI="https://logo.clearbit.com/netflix.com"
          styles={styles}
        />
        <ChannelItem 
          name="TechRadar"
          message="💬 Would you buy a camera without a viewfinder? 📸"
          time="Yesterday"
          badge="18"
          logoURI="https://logo.clearbit.com/techradar.com"
          styles={styles}
        />
        <ChannelItem 
          name="WhatsApp"
          message="📷 Add to the conversation Share an Add Yours sticker to your Statu..."
          time="Yesterday"
          badge="134"
          logoURI="https://logo.clearbit.com/whatsapp.com"
          styles={styles}
        />
      </View>
      
      {/* Bottom padding to clear tab bar if needed */}
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
    },
    headerIcons: {
      flexDirection: 'row',
      gap: 16, // Use gap for flex containers instead of margins
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#1a2e25',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconText: {
      color: '#fff',
      fontSize: 16,
    },
    exploreButton: {
      backgroundColor: '#1a2e25',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 18,
    },
    exploreText: {
      color: '#d0ede6',
      fontSize: 14,
      fontWeight: '600',
    },
    statusList: {
      paddingHorizontal: 16, // Better layout padding at edges
      paddingBottom: 8,
    },
    statusCard: {
      width: 104,
      height: 162,
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
      marginRight: 10, // Switched to marginRight to avoid ScrollView gap bugs on Android
      backgroundColor: '#1a2e25',
    },
    statusBg: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    addStatusBg: {
      backgroundColor: '#202c33',
    },
    addAvatarContainer: {
      position: 'absolute',
      top: 12,
      left: 10,
    },
    statusAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    addIconBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: '#25D366',
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#202c33',
    },
    addIconText: {
      color: '#111816',
      fontWeight: 'bold',
      fontSize: 16,
      lineHeight: 18,
    },
    statusAvatarOverlay: {
      position: 'absolute',
      top: 10,
      left: 10,
      padding: 2,
      backgroundColor: '#25D366',
      borderRadius: 22,
    },
    statusAvatarSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: '#0d110f',
    },
    statusTextContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      padding: 10,
      paddingTop: 20,
      backgroundColor: 'rgba(0,0,0,0.2)', // Darker background to make text pop
    },
    statusName: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      textShadowColor: 'rgba(0,0,0,0.9)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    channelsList: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    channelItem: {
      flexDirection: 'row',
      alignItems: 'flex-start', // Top alignment prevents shifting for multiline text
      marginBottom: 24,
    },
    channelLogo: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#1a2e25',
    },
    channelContent: {
      flex: 1,
      flexDirection: 'row', // Splits text and unread indicators strictly left/right
      marginLeft: 14,
    },
    channelTextCol: {
      flex: 1, // Will strictly consume remaining width without pushing time off screen
      paddingRight: 10,
    },
    channelRightCol: {
      alignItems: 'flex-end',
      minWidth: 40,
    },
    channelName: {
      fontSize: 17,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
      lineHeight: 22,
    },
    channelTime: {
      fontSize: 12,
      color: '#507a68',
      lineHeight: 22, // Matches name line height for perfect top row alignment
      marginBottom: 6,
    },
    channelTimeUnread: {
      color: '#25D366',
      fontWeight: '600',
    },
    channelMessage: {
      fontSize: 15,
      color: '#a0c4b8',
      lineHeight: 20,
    },
    badgeContainer: {
      backgroundColor: '#25D366',
      borderRadius: 12,
      paddingHorizontal: 7,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: 'center',
    },
    badgeText: {
      color: '#0d110f',
      fontSize: 12,
      fontWeight: '800',
    },
  });
}

export default UpdatesScreen;