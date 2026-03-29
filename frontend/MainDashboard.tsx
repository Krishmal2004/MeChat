import React, { useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, ActivityIndicator, Alert } from 'react-native';
import {
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ScrollView,
} from 'react-native';

import ProfileSettings from './ProfileSettings';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  pinned?: boolean;
  isGroup?: boolean;
  avatarColor?: string;
  avatarInitial: string;
  senderName?: string; 
  hasMedia?: boolean;
  isOnline?: boolean;
  isMuted?: boolean;
  isRead?: boolean; 
}

const Avatar: React.FC<{
  initial: string;
  color: string;
  size: number;
  isOnline?: boolean;
}> = ({ initial, color, size, isOnline }) => (
  <View style={{ width: size, height: size }}>
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#1a2e25',
      }}>
      <Text
        style={{
          color: '#fff',
          fontSize: size * 0.38,
          fontWeight: '700',
        }}>
        {initial}
      </Text>
    </View>
    {isOnline && (
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: 13,
          height: 13,
          borderRadius: 7,
          backgroundColor: '#25D366',
          borderWidth: 2,
          borderColor: '#111816',
        }}
      />
    )}
  </View>
);

const ReadTick: React.FC<{ isRead?: boolean }> = ({ isRead }) => (
  <Text style={{ color: isRead ? '#34B7F1' : '#7aada0', fontSize: 13, marginRight: 3 }}>
    {isRead ? '✓✓' : '✓'}
  </Text>
);

const MainDashboard: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Favourites' | 'Groups'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Updates' | 'Calls' | 'Communities' | 'Chats' | 'You'>('Chats');

  // ── NEW: Real Chat Data State ──
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Modal State for Sending Messages
  const [isNewChatModalVisible, setNewChatModalVisible] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchChats = async () => {
    try {
      const myPhone = await AsyncStorage.getItem('userToken');
      if (!myPhone) return;

      const response = await fetch(`http://10.0.2.2:3000/api/messages/chats/${encodeURIComponent(myPhone)}`);
      const data = await response.json();

      if (data.success) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Fetch chats on initial load
  useEffect(() => {
    fetchChats();
  }, []);

  const handleSendMessage = async () => {
    if (!newChatPhone.trim() || !newChatMessage.trim()) {
      Alert.alert('Error', 'Please enter both a phone number and a message.');
      return;
    }

    setIsSending(true);
    try {
        const myPhone = await AsyncStorage.getItem('userToken'); 
        
        const response = await fetch(`http://10.0.2.2:3000/api/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderPhone: myPhone,
                receiverPhone: newChatPhone, 
                content: newChatMessage
            })
        });

        const data = await response.json();

        if (data.success) {
            setNewChatModalVisible(false);
            setNewChatPhone('');
            setNewChatMessage('');
            fetchChats(); 
        } else {
            Alert.alert('Error', data.error || 'Failed to send message.');
        }
    } catch (error) {
        console.error('Send message error:', error);
        Alert.alert('Error', 'Network error. Please try again.');
    } finally {
        setIsSending(false);
    }
  };

  const filteredChats = useMemo(() => {
    let list = chats; 
    if (searchQuery.trim()) {
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (activeFilter === 'Unread') { list = list.filter(c => c.unread && c.unread > 0); }
    else if (activeFilter === 'Groups') { list = list.filter(c => c.isGroup); }
    else if (activeFilter === 'Favourites') { list = list.filter(c => c.pinned); }
    return list;
  }, [activeFilter, searchQuery, chats]);

  const totalUnread = chats.reduce((s, c) => s + (c.unread ?? 0), 0);

  const renderChat = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.chatRow}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ChatScreen', {
        chatId: item.id,
        name: item.name,
        phone: item.id, 
        avatarInitial: item.avatarInitial,
        avatarColor: item.avatarColor,
        isOnline: item.isOnline
      })}>
      <Avatar
        initial={item.avatarInitial}
        color={item.avatarColor ?? '#128C7E'}
        size={54}
        isOnline={item.isOnline}
      />
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.isMuted ? '🔇 ' : ''}{item.name}
          </Text>
          <Text style={[styles.chatTime, item.unread ? styles.chatTimeUnread : {}]}>
            {item.time}
          </Text>
        </View>

        <View style={styles.chatBottomRow}>
          <View style={styles.previewRow}>
            {item.senderName && (
              <Text style={styles.senderName}>{item.senderName}: </Text>
            )}
            {!item.senderName && !item.unread && item.isRead !== undefined && (
              <ReadTick isRead={item.isRead} />
            )}
            {item.hasMedia && <Text style={styles.mediaIcon}>📷 </Text>}
            <Text style={styles.lastMessage} numberOfLines={2}>
              {item.lastMessage}
            </Text>
          </View>

          <View style={styles.chatBadgeCol}>
            {item.unread && item.unread > 0 ? (
              <View style={[styles.unreadBadge, item.isMuted && styles.unreadBadgeMuted]}>
                <Text style={styles.unreadText}>
                  {item.unread > 99 ? '99+' : item.unread}
                </Text>
              </View>
            ) : item.pinned ? (
              <Text style={styles.pinIcon}>📌</Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIconText}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Ask MeChat AI or Search"
          placeholderTextColor="#3d6055"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {(['All', 'Unread', 'Favourites', 'Groups'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
              {f === 'Unread' && totalUnread > 0 ? ` ${totalUnread}` : ''}
              {f === 'Groups' ? ` ${chats.filter(c => c.isGroup).length}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.archivedRow} activeOpacity={0.7}>
        <Text style={styles.archiveIcon}>🗂</Text>
        <Text style={styles.archivedLabel}>Archived</Text>
        <Text style={styles.archivedCount}>0</Text>
        <Text style={styles.archivedChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
    </>
  );

  const TabItem: React.FC<{ label: typeof activeTab; icon: string; badge?: number; }> = ({ label, icon, badge }) => {
    const active = activeTab === label;
    return (
      <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab(label)} activeOpacity={0.7}>
        <View>
          <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
          {badge && badge > 0 ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111816" />

      <View style={styles.responsiveContainer}>
        <View style={styles.header}>
          <View style={{ width: 86, alignItems: 'flex-start' }}>
            <TouchableOpacity style={styles.headerMenuBtn}>
              <Text style={styles.headerMenuDot}>•••</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>
            {activeTab === 'You' ? 'Profile' : activeTab}
          </Text>

          {activeTab === 'Chats' ? (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionBtn}>
                <Text style={styles.headerActionIcon}>📷</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.newChatBtn} onPress={() => setNewChatModalVisible(true)}>
                <Text style={styles.newChatIcon}>＋</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: 86 }} />
          )}
        </View>

        {activeTab === 'Chats' && (
          isLoadingChats ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#25D366" />
            </View>
          ) : (
            <FlatList
              data={filteredChats}
              keyExtractor={item => item.id}
              renderItem={renderChat}
              ListHeaderComponent={ListHeader}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>💬</Text>
                  <Text style={styles.emptyText}>No chats yet</Text>
                  <Text style={styles.emptySubtext}>Tap the + button to start a conversation</Text>
                </View>
              }
            />
          )
        )}
        
        {activeTab === 'You' && (
          <View style={{ flex: 1 }}>
            <ProfileSettings />
          </View>
        )}

        {activeTab !== 'Chats' && activeTab !== 'You' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#d0ede6', fontSize: 18, fontWeight: '600' }}>{activeTab} coming soon...</Text>
          </View>
        )}

        <View style={styles.tabBar}>
          <TabItem label="Updates" icon="🔔" />
          <TabItem label="Calls" icon="📞" />
          <TabItem label="Communities" icon="👥" />
          <TabItem label="Chats" icon="💬" badge={totalUnread} />
          <TabItem label="You" icon="🧑" />
        </View>

        <Modal visible={isNewChatModalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#111816', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#1a2e25' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 }}>New Message</Text>
              
              <Text style={{ color: '#507a68', fontSize: 12, marginBottom: 8, fontWeight: '700' }}>PHONE NUMBER</Text>
              <TextInput
                style={{ backgroundColor: '#0a0f0d', borderWidth: 1, borderColor: '#1a2e25', borderRadius: 10, color: '#fff', padding: 12, marginBottom: 16 }}
                placeholder="+94 77 123 4567"
                placeholderTextColor="#3d6055"
                keyboardType="phone-pad"
                value={newChatPhone}
                onChangeText={setNewChatPhone}
              />

              <Text style={{ color: '#507a68', fontSize: 12, marginBottom: 8, fontWeight: '700' }}>MESSAGE</Text>
              <TextInput
                style={{ backgroundColor: '#0a0f0d', borderWidth: 1, borderColor: '#1a2e25', borderRadius: 10, color: '#fff', padding: 12, marginBottom: 24, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="Say hello..."
                placeholderTextColor="#3d6055"
                multiline
                value={newChatMessage}
                onChangeText={setNewChatMessage}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#1a2e25', alignItems: 'center' }} 
                  onPress={() => setNewChatModalVisible(false)}
                >
                  <Text style={{ color: '#7aada0', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#25D366', alignItems: 'center' }} 
                  onPress={handleSendMessage}
                  disabled={isSending}
                >
                  {isSending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Send</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
};

const makeStyles = (width: number, height: number) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0d110f',
      alignItems: 'center', 
    },
    responsiveContainer: {
      flex: 1,
      width: '100%',
      maxWidth: 600, 
      backgroundColor: '#0d110f',
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'web' ? 20 : Platform.OS === 'ios' ? 56 : 36,
      paddingBottom: 12,
      paddingHorizontal: 18,
      backgroundColor: '#111816',
      borderBottomWidth: 1,
      borderBottomColor: '#1a2e25',
    },
    headerMenuBtn: { padding: 4 },
    headerMenuDot: { color: '#a0c4b8', fontSize: 14, letterSpacing: 2, fontWeight: '700' },
    headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerActionBtn: {
      width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a2e25',
      alignItems: 'center', justifyContent: 'center',
    },
    headerActionIcon: { fontSize: 18 },
    newChatBtn: {
      width: 38, height: 38, borderRadius: 19, backgroundColor: '#25D366',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#25D366', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
    },
    newChatIcon: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 24 },
    listContent: { paddingBottom: 90 },
    searchWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2922',
      borderRadius: 26, marginHorizontal: 14, marginTop: 12, marginBottom: 12,
      paddingHorizontal: 14, paddingVertical: Platform.OS === 'android' ? 4 : 10,
      borderWidth: 1, borderColor: '#1e3d33',
    },
    searchIconText: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, color: '#d0ede6', fontSize: 15 },
    clearSearch: { color: '#507a68', fontSize: 16, paddingLeft: 6 },
    filtersRow: { paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
    filterChip: {
      paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
      backgroundColor: '#1a2922', borderWidth: 1, borderColor: '#1e3d33',
    },
    filterChipActive: { backgroundColor: '#25D366', borderColor: '#25D366' },
    filterText: { color: '#7aada0', fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: '#fff' },
    archivedRow: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18,
      paddingVertical: 12, backgroundColor: '#0d110f',
    },
    archiveIcon: { fontSize: 18, marginRight: 14 },
    archivedLabel: { flex: 1, color: '#d0ede6', fontSize: 16, fontWeight: '500' },
    archivedCount: { color: '#507a68', fontSize: 14, marginRight: 6 },
    archivedChevron: { color: '#507a68', fontSize: 20, fontWeight: '300' },
    divider: { height: 1, backgroundColor: '#151f1a', marginHorizontal: 0, marginBottom: 4 },
    chatRow: {
      flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16,
      paddingVertical: 11, backgroundColor: '#0d110f',
    },
    chatContent: { flex: 1, marginLeft: 13 },
    chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chatName: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginRight: 8 },
    chatTime: { color: '#507a68', fontSize: 12, flexShrink: 0 },
    chatTimeUnread: { color: '#25D366', fontWeight: '700' },
    chatBottomRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    previewRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginRight: 8 },
    senderName: { color: '#7aada0', fontSize: 13, fontWeight: '600' },
    mediaIcon: { fontSize: 13 },
    lastMessage: { color: '#507a68', fontSize: 13, flexShrink: 1, lineHeight: 19 },
    chatBadgeCol: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 28 },
    unreadBadge: {
      backgroundColor: '#25D366', borderRadius: 12, minWidth: 22, height: 22,
      paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center',
    },
    unreadBadgeMuted: { backgroundColor: '#2a4a3a' },
    unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    pinIcon: { fontSize: 13, marginTop: 2 },
    separator: { height: 1, backgroundColor: '#13201a', marginLeft: 83 },
    emptyState: { alignItems: 'center', paddingTop: height * 0.12 },
    emptyEmoji: { fontSize: 52, marginBottom: 14 },
    emptyText: { color: '#d0ede6', fontSize: 18, fontWeight: '700', marginBottom: 6 },
    emptySubtext: { color: '#507a68', fontSize: 14 },
    tabBar: {
      position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row',
      backgroundColor: '#111816', borderTopWidth: 1, borderTopColor: '#1a2e25',
      paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 14, paddingHorizontal: 6,
    },
    tabItem: { flex: 1, alignItems: 'center', gap: 3 },
    tabIcon: { fontSize: 22, opacity: 0.45 },
    tabIconActive: { opacity: 1 },
    tabLabel: { color: '#507a68', fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
    tabLabelActive: { color: '#25D366' },
    tabBadge: {
      position: 'absolute', top: -4, right: -10, backgroundColor: '#25D366',
      borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 4,
      alignItems: 'center', justifyContent: 'center',
    },
    tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  });

export default MainDashboard;