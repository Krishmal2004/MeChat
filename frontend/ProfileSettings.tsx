import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, Modal, TextInput 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_BASE_URL = 'http://10.0.2.2:3000/api';

const ProfileSettings: React.FC =() => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const phone = await AsyncStorage.getItem('userToken');
      if (!phone) return;

      const response = await fetch(`${API_BASE_URL}/user/profile?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
        setEditName(data.user.displayName || '');
        setEditBio(data.user.bio || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      Alert.alert('Error', 'Could not load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile?phone=${encodeURIComponent(userData.phone)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editName, bio: editBio }),
      });
      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
        setEditModalVisible(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const phone = await AsyncStorage.getItem('userToken');
              await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
              });
              await AsyncStorage.removeItem('userToken');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
              });
            } catch (error) {
              console.error('Logout Error: ', error);
              Alert.alert('Error', 'Failed to log out. Try again.');
            }
          } 
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/user/account?phone=${encodeURIComponent(userData.phone)}`, {
                method: 'DELETE'
              });
              const data = await response.json();
              
              if (data.success) {
                await AsyncStorage.clear();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Landing' }],
                });
              } else {
                Alert.alert('Error', 'Failed to delete account.');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Try again.');
            }
          } 
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.innerContainer}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: userData?.avatarColor || '#128C7E' }]}>
            <Text style={styles.avatarText}>
              {userData?.displayName ? userData.displayName[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{userData?.displayName || 'User'}</Text>
            <Text style={styles.phone}>{userData?.phone}</Text>
            <Text style={styles.status}>{userData?.bio || 'Available'}</Text>
          </View>
        </View>

      {/* Options Group */}
      <View style={styles.optionsContainer}>
        {/* Edit Profile */}
        <TouchableOpacity style={styles.optionBtn} onPress={() => setEditModalVisible(true)} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: '#1e3d33' }]}>
            <Text style={styles.icon}>✏️</Text>
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Edit Profile</Text>
            <Text style={styles.optionSubtitle}>Change your name and bio</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionBtn} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: '#1e3d33' }]}>
            <Text style={styles.icon}>🔒</Text>
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Privacy</Text>
            <Text style={styles.optionSubtitle}>Block contacts, disappearing messages</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionBtn} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: '#1e3d33' }]}>
            <Text style={styles.icon}>🔔</Text>
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Notifications</Text>
            <Text style={styles.optionSubtitle}>Message, group & call tones</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Log Out */}
        <TouchableOpacity style={styles.optionBtn} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: '#3b2f1c' }]}>
            <Text style={styles.icon}>🚪</Text>
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.logoutTitle}>Log Out</Text>
            <Text style={styles.optionSubtitle}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={[styles.optionBtn, styles.deleteBtn]} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: '#3b1c1f' }]}>
            <Text style={styles.icon}>🗑️</Text>
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.deleteTitle}>Delete Account</Text>
            <Text style={styles.optionSubtitle}>Permanently remove your data</Text>
          </View>
        </TouchableOpacity>
      </View>
      </View>

      {/* ─── Edit Profile Modal ─── */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor="#507a68"
            />

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={editBio}
              onChangeText={setEditBio}
              placeholderTextColor="#507a68"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d110f', 
  },
  content: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100, 
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 600,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111816',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1a2e25',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: { flex: 1 },
  name: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  phone: {
    color: '#7aada0',
    fontSize: 14,
    marginBottom: 4,
  },
  status: {
    color: '#25D366',
    fontSize: 13,
    fontWeight: '600',
  },
  optionsContainer: {
    backgroundColor: '#111816',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a2e25',
    overflow: 'hidden',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2e25',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: { fontSize: 18 },
  optionTextContainer: { flex: 1 },
  optionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    color: '#7aada0',
    fontSize: 13,
  },
  chevron: {
    color: '#507a68',
    fontSize: 22,
    fontWeight: '300',
  },
  logoutTitle: {
    color: '#ffb34d',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  deleteBtn: { borderBottomWidth: 0 },
  deleteTitle: {
    color: '#ff4d4d',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111816',
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1a2e25',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#507a68',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#0a0f0d',
    borderWidth: 1,
    borderColor: '#1a2e25',
    borderRadius: 10,
    color: '#fff',
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#1a2e25',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#7aada0',
    fontWeight: '600',
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ProfileSettings;