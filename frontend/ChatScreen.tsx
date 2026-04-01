import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const API_BASE_URL = 'http://10.0.2.2:3000/api/messages';
const API_CALLS_URL = 'http://10.0.2.2:3000/api/calls';

interface ChatItem {
  _id: string; 
  type: 'message' | 'call';
  senderPhone: string;
  receiverPhone: string;
  content?: string;
  createdAt: string;
  isMissed?: boolean;
  callType?: 'Incoming' | 'Outgoing';
}

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const flatListRef = useRef<FlatList>(null);
  
  // Responsive dimensions
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const { chatId, name, phone, avatarInitial, avatarColor, isOnline } = route.params || {};
  const receiverPhone = phone || chatId || 'Unknown';

  const [myPhone, setMyPhone] = useState<string | null>(null);
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMyPhone();
  }, [receiverPhone]);

  const loadMyPhone = async () => {
    try {
      const storedPhone = await AsyncStorage.getItem('userToken');
      setMyPhone(storedPhone);
      if (storedPhone && receiverPhone) {
        fetchChatHistory(storedPhone, receiverPhone);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const fetchChatHistory = async (sender: string, receiver: string) => {
    try {
      // Fetch messages and calls at the same time
      const [msgRes, callRes] = await Promise.all([
        fetch(`${API_BASE_URL}/${encodeURIComponent(sender)}/${encodeURIComponent(receiver)}`),
        fetch(`${API_CALLS_URL}/${encodeURIComponent(sender)}`)
      ]);

      let allItems: ChatItem[] = [];

      // Parse Messages
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.success && msgData.messages) {
          const formattedMsgs = msgData.messages.map((m: any) => ({
            ...m,
            type: 'message'
          }));
          allItems = [...allItems, ...formattedMsgs];
        }
      }

      // Parse Calls
      if (callRes.ok) {
        const callData = await callRes.json();
        if (callData.success && callData.calls) {
          // Filter calls to only include the current receiver
          const relevantCalls = callData.calls
            .filter((c: any) => c.appUserId === receiver)
            .map((c: any) => ({
              _id: `call-${c.id}`,
              type: 'call',
              senderPhone: c.type === 'Outgoing' ? sender : receiver,
              receiverPhone: c.type === 'Outgoing' ? receiver : sender,
              createdAt: c.time,
              isMissed: c.isMissed,
              callType: c.type
            }));
          allItems = [...allItems, ...relevantCalls];
        }
      }

      // Sort all items chronologically by time
      allItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setChatItems(allItems);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !myPhone || !receiverPhone) return;

    const tempMessage: ChatItem = {
      _id: Date.now().toString() + Math.random().toString(),
      type: 'message',
      senderPhone: myPhone,
      receiverPhone: receiverPhone,
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setChatItems((prev) => [...prev, tempMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPhone: myPhone,
          receiverPhone,
          content: tempMessage.content
        })
      });
      const data = await response.json();
      
      if (!data.success) {
        console.warn('Message send failed', data.error);
      } else {
        fetchChatHistory(myPhone, receiverPhone);
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    const isMine = item.senderPhone === myPhone;
    
    let timeString = '';
    try {
      const date = new Date(item.createdAt);
      timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { timeString = item.createdAt || '' }

    // -- RENDER CALL BUBBLE --
    if (item.type === 'call') {
      const subtitleText = item.isMissed ? 'No answer' : 'Tap to call back';
      const arrowIcon = item.callType === 'Incoming' ? '↙' : '↗';
      const isMissedAndIncoming = item.isMissed && item.callType === 'Incoming';
      const iconColor = isMissedAndIncoming ? '#F15C6D' : (isMine ? '#d0ede6' : '#8696a0');

      return (
        <View style={[styles.messageBubble, isMine ? styles.messageMine : styles.messageTheirs, styles.callBubbleWrapper]}>
          <View style={styles.callBubbleContent}>
            <View style={[styles.callIconCircle, isMine ? styles.callIconCircleMine : styles.callIconCircleTheirs]}>
               <Text style={styles.callIconMain}>📞</Text>
               <View style={styles.callArrowContainer}>
                  <Text style={[styles.callIconSub, { color: iconColor }]}>{arrowIcon}</Text>
               </View>
            </View>
            <View style={styles.callTextCol}>
               <Text style={styles.callTitle}>Voice call</Text>
               <Text style={styles.callSubtitle}>{subtitleText}</Text>
            </View>
          </View>
          <Text style={styles.messageTime}>{timeString}</Text>
        </View>
      );
    }

    // -- RENDER TEXT MESSAGE --
    return (
      <View style={[styles.messageBubble, isMine ? styles.messageMine : styles.messageTheirs]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.messageTime}>{timeString}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#202c33" />
      
      <View style={styles.responsiveContainer}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <View style={[styles.avatar, { backgroundColor: avatarColor || '#128C7E' }]}>
            <Text style={styles.avatarText}>{avatarInitial || '?'}</Text>
            {isOnline && <View style={styles.onlineDot} />}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{name || receiverPhone}</Text>
            <Text style={styles.headerStatus}>{isOnline ? 'Online' : 'Loading...'}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('MakeCallScreen', { makeCallTo: receiverPhone })}>
              <Text style={styles.headerActionIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity><Text style={styles.headerActionIcon}>📹</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.headerActionIcon}>⋮</Text></TouchableOpacity>
          </View>
        </View>

        {/* CHAT LIST */}
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.chatBackground}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#25D366" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                ref={flatListRef}
                data={chatItems}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => chatItems.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => chatItems.length > 0 && flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyNotice}>This conversation is secured with end-to-end encryption. Your messages are private.</Text>
                  </View>
                }
              />
            )}
          </View>

          {/* INPUT BAR */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.inputIcon}>😊</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                placeholder="Message"
                placeholderTextColor="#8696a0"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.inputIcon}>📎</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={inputText.trim() ? handleSend : undefined}
              disabled={isSending}
            >
              {isSending ? (
                 <ActivityIndicator color="#fff" size="small" />
              ) : (
                 <Text style={styles.sendIcon}>{inputText.trim() ? '➤' : '🎤'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

function makeStyles(width: number, height: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0b141a',
      alignItems: 'center',
    },
    responsiveContainer: {
      flex: 1,
      width: '100%',
      maxWidth: 800, 
      backgroundColor: '#0b141a',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#202c33',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#111b21',
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10,
    },
    backBtn: {
      padding: 10,
      marginRight: 4,
    },
    backIcon: { color: '#fff', fontSize: 28, lineHeight: 28 },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#25D366', borderWidth: 1, borderColor: '#202c33' },
    headerInfo: { flex: 1 },
    headerName: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerStatus: { color: '#8696a0', fontSize: 12 },
    headerActions: { flexDirection: 'row', gap: 16, paddingRight: 10 },
    headerActionIcon: { color: '#fff', fontSize: 20 },
    chatBackground: { flex: 1, backgroundColor: '#0b141a' },
    listContent: { padding: 16, paddingBottom: 20 },
    emptyState: { alignItems: 'center', marginTop: 20, backgroundColor: '#182229', padding: 12, borderRadius: 8, alignSelf: 'center', maxWidth: '85%' },
    emptyNotice: { color: '#ffd279', fontSize: 12, textAlign: 'center' },
    messageBubble: {
      maxWidth: width > 600 ? 500 : width * 0.8,
      paddingTop: 8, paddingBottom: 4, paddingHorizontal: 12,
      borderRadius: 12, marginBottom: 8,
    },
    messageMine: { alignSelf: 'flex-end', backgroundColor: '#005c4b', borderTopRightRadius: 4 },
    messageTheirs: { alignSelf: 'flex-start', backgroundColor: '#202c33', borderTopLeftRadius: 4 },
    messageText: { color: '#e9edef', fontSize: 15, lineHeight: 20 },
    messageTime: { color: '#8696a0', fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
    
    // --- Call Bubble Styles ---
    callBubbleWrapper: {
      minWidth: 200,
    },
    callBubbleContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    callIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    callIconCircleMine: {
      backgroundColor: '#004a3c', // Darker green circle for my calls
    },
    callIconCircleTheirs: {
      backgroundColor: '#182229', // Dark gray circle for their calls
    },
    callIconMain: {
      fontSize: 18,
      color: '#fff',
    },
    callArrowContainer: {
      position: 'absolute',
      right: 8,
      top: 10,
    },
    callIconSub: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    callTextCol: {
      flex: 1,
    },
    callTitle: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    callSubtitle: {
      color: '#8696a0',
      fontSize: 14,
    },

    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: '#0b141a' },
    inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#202c33', borderRadius: 24, marginRight: 8, paddingHorizontal: 4, minHeight: 44 },
    iconButton: { padding: 10, paddingBottom: 12 },
    inputIcon: { color: '#8696a0', fontSize: 22 },
    textInput: { flex: 1, color: '#fff', fontSize: 16, maxHeight: 120, minHeight: 40, paddingTop: Platform.OS === 'ios' ? 12 : 10, paddingBottom: Platform.OS === 'ios' ? 12 : 10 },
    sendButton: { backgroundColor: '#00a884', width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    sendIcon: { color: '#fff', fontSize: 18, marginLeft: 2 },
  });
}

export default ChatScreen;