import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const StatusCard = ({ isAdd, name, imageURI, avatarURI, styles, onPress }: any) => {
  return (
    <TouchableOpacity style={styles.statusCard} activeOpacity={0.8} onPress={onPress}>
      {isAdd ? (
        <View style={[styles.statusBg, styles.addStatusBg]}>
          {imageURI ? (
            <Image source={{ uri: imageURI }} style={styles.statusBg} />
          ) : (
             <View style={styles.placeholderBg} />
          )}
          <View style={styles.addAvatarContainer}>
            <Image 
              source={{ uri: avatarURI || 'https://via.placeholder.com/100' }} 
              style={styles.statusAvatar} 
            />
            <View style={styles.addIconBadge}>
              <Text style={styles.addIconText}>+</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.statusBg}>
           {imageURI ? (
              <Image source={{ uri: imageURI }} style={styles.statusBg} />
           ) : (
              <View style={[styles.statusBg, { backgroundColor: '#005c4b', justifyContent: 'center', alignItems: 'center' }]}>
                 <Text style={{color: '#fff', padding: 10, textAlign: 'center'}} numberOfLines={3}>Text Status</Text>
              </View>
           )}
        </View>
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

const UpdatesScreen = () => {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const [myStatuses, setMyStatuses] = useState<any[]>([]);
  
  // Initialized with sample data so you can see it working immediately
  const [contactsStatuses, setContactsStatuses] = useState<any[]>([
    {
      name: "Alice Johnson",
      avatarURI: "https://randomuser.me/api/portraits/women/44.jpg",
      statuses: [
        { mediaUrl: "https://images.unsplash.com/photo-1506744626753-dba7d4154428?auto=format&fit=crop&w=800&q=80", content: "Beautiful sunset today!" }
      ]
    },
    {
      name: "Bob Smith",
      avatarURI: "https://randomuser.me/api/portraits/men/32.jpg",
      statuses: [
        { mediaUrl: null, content: "Just finished a great workout! 💪 Feeling amazing." }
      ]
    }
  ]);
  
  // Upload Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusImageURI, setStatusImageURI] = useState<string | null>(null);
  const [statusAsset, setStatusAsset] = useState<any>(null); 
  const [isUploading, setIsUploading] = useState(false);

  // View Status State
  const [viewingStatus, setViewingStatus] = useState<any>(null);

  // 10-Second Auto-Close Timer for Viewing Status
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (viewingStatus) {
      timer = setTimeout(() => {
        setViewingStatus(null);
      }, 10000); // 10 seconds
    }
    return () => clearTimeout(timer);
  }, [viewingStatus]);

  const fetchStatuses = async () => {
    try {
      const myPhone = await AsyncStorage.getItem('userToken');
      if (!myPhone) return;

      const response = await fetch(`http://10.0.2.2:3000/api/status/${encodeURIComponent(myPhone)}`);
      const data = await response.json();

      if (data.success) {
        setMyStatuses(data.myStatuses || []);
        // Only override sample data if real contacts data exists
        if (data.contactsStatuses && data.contactsStatuses.length > 0) {
            setContactsStatuses(data.contactsStatuses);
        }
      }
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed', 
      quality: 0.8,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setStatusImageURI(asset.uri || null);
      setStatusAsset(asset);
    }
  };

  const handleUploadStatus = async () => {
    if (!statusText.trim() && !statusImageURI) {
      Alert.alert("Error", "Please add text or pick an image for your status.");
      return;
    }

    setIsUploading(true);
    try {
      const myPhone = await AsyncStorage.getItem('userToken');
      
      const formData = new FormData();
      formData.append('phone', myPhone || '');
      formData.append('content', statusText);

      if (statusAsset && statusAsset.uri) {
        const fileUri = Platform.OS === 'android' ? statusAsset.uri : statusAsset.uri.replace('file://', '');
        formData.append('media', {
          uri: fileUri,
          type: statusAsset.type || 'image/jpeg',
          name: statusAsset.fileName || `status_${Date.now()}.jpg`
        } as any);
      }

      const response = await fetch(`http://10.0.2.2:3000/api/status/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        Alert.alert("Error", "Server returned an error. Check console.");
        setIsUploading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setModalVisible(false);
        setStatusText('');
        setStatusImageURI(null);
        setStatusAsset(null);
        fetchStatuses(); 
      } else {
        Alert.alert("Error", data.error || "Failed to upload status");
      }
    } catch (error) {
      console.error("Upload error", error);
      Alert.alert("Error", "Network error while uploading status");
    } finally {
      setIsUploading(false);
    }
  };

  const myLatestStatus = myStatuses.length > 0 ? myStatuses[myStatuses.length - 1] : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* STATUS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => { setStatusImageURI(null); setStatusAsset(null); setModalVisible(true); }}>
              <Text style={styles.iconText}>📷</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusList}
        >
          {/* MY STATUS CARD */}
          <StatusCard 
            isAdd={true} 
            name="Add status" 
            imageURI={myLatestStatus?.mediaUrl}
            avatarURI="https://via.placeholder.com/100"
            styles={styles} 
            onPress={() => setModalVisible(true)}
          />

          {/* DYNAMIC CONTACT STATUSES */}
          {contactsStatuses.map((contact, index) => {
            const statuses = contact.statuses || [];
            const latest = statuses.length > 0 ? statuses[statuses.length - 1] : null;
            
            if (!latest) return null;

            return (
              <StatusCard 
                key={index}
                name={contact.name}
                imageURI={latest.mediaUrl}
                avatarURI={contact.avatarURI || `https://ui-avatars.com/api/?name=${contact.name}&background=random`}
                styles={styles}
                onPress={() => setViewingStatus({
                  name: contact.name,
                  avatarURI: contact.avatarURI || `https://ui-avatars.com/api/?name=${contact.name}&background=random`,
                  status: latest
                })}
              />
            );
          })}
        </ScrollView>
        <View style={{ height: 100 }} /> 
      </ScrollView>

      {/* UPLOAD MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Status</Text>
            
            <TouchableOpacity style={styles.pickImageBtn} onPress={pickImage}>
               {statusImageURI ? (
                  <Image source={{ uri: statusImageURI }} style={{ width: '100%', height: 150, borderRadius: 10 }} />
               ) : (
                  <Text style={{ color: '#25D366', fontWeight: 'bold' }}>+ Pick Media from Gallery</Text>
               )}
            </TouchableOpacity>

            <Text style={styles.modalLabel}>TEXT CONTENT (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Add a caption..."
              placeholderTextColor="#3d6055"
              multiline
              value={statusText}
              onChangeText={setStatusText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#1a2e25' }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#7aada0', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#25D366' }]} 
                onPress={handleUploadStatus}
                disabled={isUploading}
              >
                {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW STATUS MODAL */}
      <Modal visible={!!viewingStatus} animationType="fade" transparent>
        <SafeAreaView style={styles.viewStatusContainer}>
          {/* Header Info */}
          <View style={styles.viewStatusHeader}>
            <View style={styles.viewStatusUserInfo}>
              <TouchableOpacity onPress={() => setViewingStatus(null)} style={styles.viewStatusBackBtn}>
                <Text style={styles.viewStatusBackIcon}>‹</Text>
              </TouchableOpacity>
              <Image source={{ uri: viewingStatus?.avatarURI }} style={styles.viewStatusAvatar} />
              <Text style={styles.viewStatusHeaderName}>{viewingStatus?.name}</Text>
            </View>
          </View>

          {/* Status Content */}
          <TouchableOpacity 
            style={styles.viewStatusContent} 
            activeOpacity={1} 
            onPress={() => setViewingStatus(null)} // Click anywhere to close early
          >
            {viewingStatus?.status?.mediaUrl ? (
              <Image 
                source={{ uri: viewingStatus.status.mediaUrl }} 
                style={styles.viewStatusImage} 
                resizeMode="contain" 
              />
            ) : (
              <View style={styles.viewStatusTextWrapper}>
                <Text style={styles.viewStatusLargeText}>
                  {viewingStatus?.status?.content}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption (if there is an image AND text) */}
          {viewingStatus?.status?.mediaUrl && viewingStatus?.status?.content && (
            <View style={styles.viewStatusCaptionContainer}>
              <Text style={styles.viewStatusCaptionText}>{viewingStatus.status.content}</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

function makeStyles(width: number, height: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d110f' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
    headerIcons: { flexDirection: 'row', gap: 16 },
    iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a2e25', justifyContent: 'center', alignItems: 'center' },
    iconText: { color: '#fff', fontSize: 16 },
    statusList: { paddingHorizontal: 16, paddingBottom: 8 },
    statusCard: { width: 104, height: 162, borderRadius: 16, overflow: 'hidden', position: 'relative', marginRight: 10, backgroundColor: '#1a2e25' },
    statusBg: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderBg: { width: '100%', height: '100%', backgroundColor: '#202c33' },
    addStatusBg: { backgroundColor: '#202c33' },
    addAvatarContainer: { position: 'absolute', top: 12, left: 10 },
    statusAvatar: { width: 44, height: 44, borderRadius: 22 },
    addIconBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#25D366', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#202c33' },
    addIconText: { color: '#111816', fontWeight: 'bold', fontSize: 16, lineHeight: 18 },
    statusAvatarOverlay: { position: 'absolute', top: 10, left: 10, padding: 2, backgroundColor: '#25D366', borderRadius: 22 },
    statusAvatarSmall: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#0d110f' },
    statusTextContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 10, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
    statusName: { color: '#fff', fontSize: 14, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#111816', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#1a2e25' },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
    pickImageBtn: { backgroundColor: '#1a2e25', borderWidth: 1, borderColor: '#25D366', borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 20 },
    modalLabel: { color: '#507a68', fontSize: 12, marginBottom: 8, fontWeight: '700' },
    modalInput: { backgroundColor: '#0a0f0d', borderWidth: 1, borderColor: '#1a2e25', borderRadius: 10, color: '#fff', padding: 12, marginBottom: 16 },
    modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },

    // View Status Modal Styles
    viewStatusContainer: { flex: 1, backgroundColor: '#000' },
    viewStatusHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, position: 'absolute', top: 0, width: '100%', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
    viewStatusUserInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    viewStatusBackBtn: { paddingRight: 10 },
    viewStatusBackIcon: { color: '#fff', fontSize: 36, lineHeight: 40 },
    viewStatusAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    viewStatusHeaderName: { color: '#fff', fontSize: 18, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
    viewStatusContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    viewStatusImage: { width: '100%', height: '100%' },
    viewStatusTextWrapper: { flex: 1, width: '100%', backgroundColor: '#005c4b', justifyContent: 'center', alignItems: 'center', padding: 20 },
    viewStatusLargeText: { color: '#fff', fontSize: 28, textAlign: 'center', fontWeight: '500' },
    viewStatusCaptionContainer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 15 },
    viewStatusCaptionText: { color: '#fff', fontSize: 16, textAlign: 'center' }
  });
}

export default UpdatesScreen;