/**
 * MainDashboard.tsx — MeChat
 *
 * WhatsApp-style chat list screen with:
 * - Header (menu, title, camera, new-chat)
 * - Search bar
 * - Filter chips (All / Unread / Favourites / Groups)
 * - Archived row
 * - Scrollable chat list (pinned, unread badges, avatars)
 * - Bottom tab bar (Updates • Calls • Communities • Chats • You)
 */
import React, { useState, useMemo } from 'react';
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

// ──────────────────────────────────────────────────────────────────────────────
// Types & sample data
// ──────────────────────────────────────────────────────────────────────────────
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
  senderName?: string; // for group chats
  hasMedia?: boolean;
  isOnline?: boolean;
  isMuted?: boolean;
  isRead?: boolean; // double-tick read indicator
}

const ALL_CHATS: ChatItem[] = [
  {
    id: '1',
    name: 'M Premium Entertainment |...',
    lastMessage: '21 photos',
    senderName: 'Gothira',
    time: '3/14/26',
    pinned: true,
    isGroup: true,
    avatarInitial: 'M',
    avatarColor: '#1a1a1a',
    hasMedia: true,
  },
  {
    id: '2',
    name: 'Uni Gang',
    lastMessage: 'Photo',
    senderName: 'Tisula',
    time: 'Yesterday',
    pinned: true,
    isGroup: true,
    avatarInitial: 'U',
    avatarColor: '#5C2D91',
    hasMedia: true,
  },
  {
    id: '3',
    name: 'PromeTheus',
    lastMessage: 'Me Saturday',
    senderName: 'Kavindu(Kala)',
    time: 'Yesterday',
    pinned: true,
    isGroup: true,
    avatarInitial: 'P',
    avatarColor: '#1a2a1a',
  },
  {
    id: '4',
    name: '+94 70 726 6707',
    lastMessage: 'tikak vitara',
    time: '12:09 AM',
    avatarInitial: '?',
    avatarColor: '#128C7E',
    isRead: true,
  },
  {
    id: '5',
    name: 'Sanda New',
    lastMessage: 'hawasa mn setiup karala UI eka hadanna gathta ekaii case eka',
    time: '12:06 AM',
    avatarInitial: 'S',
    avatarColor: '#C2185B',
    isRead: true,
  },
  {
    id: '6',
    name: 'Code Night OC',
    lastMessage: 'Tap to see more',
    time: '',
    isGroup: true,
    avatarInitial: 'C',
    avatarColor: '#0d0d0d',
    isMuted: true,
  },
  {
    id: '7',
    name: 'Alex Johnson',
    lastMessage: 'Hey! Are you free tonight? 🎉',
    time: '11:30 PM',
    avatarInitial: 'A',
    avatarColor: '#1565C0',
    unread: 3,
    isOnline: true,
  },
  {
    id: '8',
    name: 'Design Team',
    lastMessage: 'New mockup shared',
    senderName: 'Priya',
    time: '10:45 PM',
    isGroup: true,
    avatarInitial: 'D',
    avatarColor: '#4A148C',
    unread: 12,
  },
  {
    id: '9',
    name: 'Mom ❤️',
    lastMessage: 'Call me when you are free',
    time: '9:00 PM',
    avatarInitial: '❤',
    avatarColor: '#B71C1C',
    isOnline: false,
    unread: 1,
  },
  {
    id: '10',
    name: 'React Native Devs',
    lastMessage: 'Just pushed the fix',
    senderName: 'Kai',
    time: '8:22 PM',
    isGroup: true,
    avatarInitial: 'R',
    avatarColor: '#006064',
    unread: 47,
  },
  {
    id: '11',
    name: 'Sara K.',
    lastMessage: "Let's meet at 5pm ☕",
    time: '7:55 PM',
    avatarInitial: 'S',
    avatarColor: '#37474F',
    isOnline: true,
  },
  {
    id: '12',
    name: 'Gaming Squad 🎮',
    lastMessage: 'GGs last night!',
    senderName: 'Zane',
    time: '6:30 PM',
    isGroup: true,
    avatarInitial: 'G',
    avatarColor: '#1B5E20',
    unread: 5,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

// Avatar circle
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

// Double tick indicator
const ReadTick: React.FC<{ isRead?: boolean }> = ({ isRead }) => (
  <Text style={{ color: isRead ? '#34B7F1' : '#7aada0', fontSize: 13, marginRight: 3 }}>
    {isRead ? '✓✓' : '✓'}
  </Text>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────
const MainDashboard: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Favourites' | 'Groups'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Updates' | 'Calls' | 'Communities' | 'Chats' | 'You'>('Chats');

  // Filter chats
  const filteredChats = useMemo(() => {
    let list = ALL_CHATS;
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
  }, [activeFilter, searchQuery]);

  const totalUnread = ALL_CHATS.reduce((s, c) => s + (c.unread ?? 0), 0);

  // ── Chat row
  const renderChat = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.chatRow}
      activeOpacity={0.7}
      onPress={() => {}}>
      {/* Avatar */}
      <Avatar
        initial={item.avatarInitial}
        color={item.avatarColor ?? '#128C7E'}
        size={54}
        isOnline={item.isOnline}
      />

      {/* Content */}
      <View style={styles.chatContent}>
        {/* Row 1: name + time */}
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.isMuted ? '🔇 ' : ''}{item.name}
          </Text>
          <Text style={[styles.chatTime, item.unread ? styles.chatTimeUnread : {}]}>
            {item.time}
          </Text>
        </View>

        {/* Row 2: preview + badges */}
        <View style={styles.chatBottomRow}>
          <View style={styles.previewRow}>
            {/* sender name for groups */}
            {item.senderName && (
              <Text style={styles.senderName}>{item.senderName}: </Text>
            )}
            {/* read tick for sent messages */}
            {!item.senderName && !item.unread && item.isRead !== undefined && (
              <ReadTick isRead={item.isRead} />
            )}
            {/* media icon */}
            {item.hasMedia && <Text style={styles.mediaIcon}>📷 </Text>}
            <Text style={styles.lastMessage} numberOfLines={2}>
              {item.lastMessage}
            </Text>
          </View>

          {/* Right side: pin / unread badge */}
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

  // ── List header (search + filters + archived)
  const ListHeader = () => (
    <>
      {/* Search */}
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

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}>
        {(['All', 'Unread', 'Favourites', 'Groups'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
              {f === 'Unread' && totalUnread > 0 ? ` ${totalUnread}` : ''}
              {f === 'Groups' ? ` ${ALL_CHATS.filter(c => c.isGroup).length}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Archived */}
      <TouchableOpacity style={styles.archivedRow} activeOpacity={0.7}>
        <Text style={styles.archiveIcon}>🗂</Text>
        <Text style={styles.archivedLabel}>Archived</Text>
        <Text style={styles.archivedCount}>10</Text>
        <Text style={styles.archivedChevron}>›</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />
    </>
  );

  // ── Bottom tab item
  const TabItem: React.FC<{
    label: typeof activeTab;
    icon: string;
    badge?: number;
  }> = ({ label, icon, badge }) => {
    const active = activeTab === label;
    return (
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab(label)}
        activeOpacity={0.7}>
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

      {/* Responsive Wrapper to contain UI nicely on Tablets/Web */}
      <View style={styles.responsiveContainer}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerMenuBtn}>
            <Text style={styles.headerMenuDot}>•••</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Chats</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn}>
              <Text style={styles.headerActionIcon}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newChatBtn}>
              <Text style={styles.newChatIcon}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Chat List ── */}
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
              <Text style={styles.emptyText}>No chats found</Text>
              <Text style={styles.emptySubtext}>Try a different search or filter</Text>
            </View>
          }
        />

        {/* ── Bottom Tab Bar ── */}
        <View style={styles.tabBar}>
          <TabItem label="Updates" icon="🔔" />
          <TabItem label="Calls" icon="📞" />
          <TabItem label="Communities" icon="👥" />
          <TabItem label="Chats" icon="💬" badge={totalUnread} />
          <TabItem label="You" icon="🧑" />
        </View>
      </View>
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Dynamic Styles
// ──────────────────────────────────────────────────────────────────────────────
const makeStyles = (width: number, height: number) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0d110f',
      alignItems: 'center', // Centers the responsive wrapper on large screens
    },
    responsiveContainer: {
      flex: 1,
      width: '100%',
      maxWidth: 600, // Look and feel bounds for Web/Tablets
      backgroundColor: '#0d110f',
      position: 'relative',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 56 : 36,
      paddingBottom: 12,
      paddingHorizontal: 18,
      backgroundColor: '#111816',
      borderBottomWidth: 1,
      borderBottomColor: '#1a2e25',
    },
    headerMenuBtn: {
      padding: 4,
    },
    headerMenuDot: {
      color: '#a0c4b8',
      fontSize: 14,
      letterSpacing: 2,
      fontWeight: '700',
    },
    headerTitle: {
      color: '#ffffff',
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerActionBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#1a2e25',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActionIcon: {
      fontSize: 18,
    },
    newChatBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#25D366',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#25D366',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 6,
    },
    newChatIcon: {
      color: '#fff',
      fontSize: 22,
      fontWeight: '300',
      lineHeight: 24,
    },

    // List container
    listContent: {
      paddingBottom: 90,
    },

    // Search
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1a2922',
      borderRadius: 26,
      marginHorizontal: 14,
      marginTop: 12,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 10 : 4,
      borderWidth: 1,
      borderColor: '#1e3d33',
    },
    searchIconText: {
      fontSize: 16,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: '#d0ede6',
      fontSize: 15,
    },
    clearSearch: {
      color: '#507a68',
      fontSize: 16,
      paddingLeft: 6,
    },

    // Filter chips
    filtersRow: {
      paddingHorizontal: 14,
      paddingBottom: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: '#1a2922',
      borderWidth: 1,
      borderColor: '#1e3d33',
    },
    filterChipActive: {
      backgroundColor: '#25D366',
      borderColor: '#25D366',
    },
    filterText: {
      color: '#7aada0',
      fontSize: 13,
      fontWeight: '600',
    },
    filterTextActive: {
      color: '#fff',
    },

    // Archived row
    archivedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 12,
      backgroundColor: '#0d110f',
    },
    archiveIcon: {
      fontSize: 18,
      marginRight: 14,
    },
    archivedLabel: {
      flex: 1,
      color: '#d0ede6',
      fontSize: 16,
      fontWeight: '500',
    },
    archivedCount: {
      color: '#507a68',
      fontSize: 14,
      marginRight: 6,
    },
    archivedChevron: {
      color: '#507a68',
      fontSize: 20,
      fontWeight: '300',
    },

    divider: {
      height: 1,
      backgroundColor: '#151f1a',
      marginHorizontal: 0,
      marginBottom: 4,
    },

    // Chat row
    chatRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: '#0d110f',
    },
    chatContent: {
      flex: 1,
      marginLeft: 13,
    },
    chatTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatName: {
      flex: 1,
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.2,
      marginRight: 8,
    },
    chatTime: {
      color: '#507a68',
      fontSize: 12,
      flexShrink: 0,
    },
    chatTimeUnread: {
      color: '#25D366',
      fontWeight: '700',
    },
    chatBottomRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    previewRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginRight: 8,
    },
    senderName: {
      color: '#7aada0',
      fontSize: 13,
      fontWeight: '600',
    },
    mediaIcon: {
      fontSize: 13,
    },
    lastMessage: {
      color: '#507a68',
      fontSize: 13,
      flexShrink: 1,
      lineHeight: 19,
    },
    chatBadgeCol: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      minWidth: 28,
    },
    unreadBadge: {
      backgroundColor: '#25D366',
      borderRadius: 12,
      minWidth: 22,
      height: 22,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadBadgeMuted: {
      backgroundColor: '#2a4a3a',
    },
    unreadText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
    },
    pinIcon: {
      fontSize: 13,
      marginTop: 2,
    },

    separator: {
      height: 1,
      backgroundColor: '#13201a',
      marginLeft: 83,
    },

    // Empty
    emptyState: {
      alignItems: 'center',
      paddingTop: height * 0.12,
    },
    emptyEmoji: {
      fontSize: 52,
      marginBottom: 14,
    },
    emptyText: {
      color: '#d0ede6',
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptySubtext: {
      color: '#507a68',
      fontSize: 14,
    },

    // Bottom tab bar
    tabBar: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      flexDirection: 'row',
      backgroundColor: '#111816',
      borderTopWidth: 1,
      borderTopColor: '#1a2e25',
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 28 : 14,
      paddingHorizontal: 6,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    tabIcon: {
      fontSize: 22,
      opacity: 0.45,
    },
    tabIconActive: {
      opacity: 1,
    },
    tabLabel: {
      color: '#507a68',
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    tabLabelActive: {
      color: '#25D366',
    },
    tabBadge: {
      position: 'absolute',
      top: -4,
      right: -10,
      backgroundColor: '#25D366',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
    },
  });

export default MainDashboard;