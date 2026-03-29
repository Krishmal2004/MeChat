/**
 * ProfileSetup.tsx — MeChat Onboarding
 *
 * Step 1 : Country picker  + phone number
 * Step 2 : OTP verification (6 digits, auto-advance)
 * Step 3 : Display name
 * Step 4 : Bio + profile picture
 */
import React, { useRef, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  FlatList,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';

// ──────────────────────────────────────────────────────────────────────────────
// API Configuration
// ──────────────────────────────────────────────────────────────────────────────
// If testing on Android Emulator, use 10.0.2.2. For iOS/Web use localhost.
// For physical device, use your computer's local IP address (e.g. 192.168.1.10)
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// ──────────────────────────────────────────────────────────────────────────────
// Country data
// ──────────────────────────────────────────────────────────────────────────────
interface Country {
  name: string;
  flag: string;
  code: string; // dial code
  iso: string;
}

const COUNTRIES: Country[] = [
  { name: 'Afghanistan', flag: '🇦🇫', code: '+93', iso: 'AF' },
  { name: 'Albania', flag: '🇦🇱', code: '+355', iso: 'AL' },
  { name: 'Algeria', flag: '🇩🇿', code: '+213', iso: 'DZ' },
  { name: 'Argentina', flag: '🇦🇷', code: '+54', iso: 'AR' },
  { name: 'Australia', flag: '🇦🇺', code: '+61', iso: 'AU' },
  { name: 'Austria', flag: '🇦🇹', code: '+43', iso: 'AT' },
  { name: 'Bangladesh', flag: '🇧🇩', code: '+880', iso: 'BD' },
  { name: 'Belgium', flag: '🇧🇪', code: '+32', iso: 'BE' },
  { name: 'Brazil', flag: '🇧🇷', code: '+55', iso: 'BR' },
  { name: 'Canada', flag: '🇨🇦', code: '+1', iso: 'CA' },
  { name: 'China', flag: '🇨🇳', code: '+86', iso: 'CN' },
  { name: 'Colombia', flag: '🇨🇴', code: '+57', iso: 'CO' },
  { name: 'Denmark', flag: '🇩🇰', code: '+45', iso: 'DK' },
  { name: 'Egypt', flag: '🇪🇬', code: '+20', iso: 'EG' },
  { name: 'Ethiopia', flag: '🇪🇹', code: '+251', iso: 'ET' },
  { name: 'Finland', flag: '🇫🇮', code: '+358', iso: 'FI' },
  { name: 'France', flag: '🇫🇷', code: '+33', iso: 'FR' },
  { name: 'Germany', flag: '🇩🇪', code: '+49', iso: 'DE' },
  { name: 'Ghana', flag: '🇬🇭', code: '+233', iso: 'GH' },
  { name: 'Greece', flag: '🇬🇷', code: '+30', iso: 'GR' },
  { name: 'India', flag: '🇮🇳', code: '+91', iso: 'IN' },
  { name: 'Indonesia', flag: '🇮🇩', code: '+62', iso: 'ID' },
  { name: 'Iran', flag: '🇮🇷', code: '+98', iso: 'IR' },
  { name: 'Iraq', flag: '🇮🇶', code: '+964', iso: 'IQ' },
  { name: 'Ireland', flag: '🇮🇪', code: '+353', iso: 'IE' },
  { name: 'Israel', flag: '🇮🇱', code: '+972', iso: 'IL' },
  { name: 'Italy', flag: '🇮🇹', code: '+39', iso: 'IT' },
  { name: 'Japan', flag: '🇯🇵', code: '+81', iso: 'JP' },
  { name: 'Jordan', flag: '🇯🇴', code: '+962', iso: 'JO' },
  { name: 'Kenya', flag: '🇰🇪', code: '+254', iso: 'KE' },
  { name: 'Kuwait', flag: '🇰🇼', code: '+965', iso: 'KW' },
  { name: 'Malaysia', flag: '🇲🇾', code: '+60', iso: 'MY' },
  { name: 'Mexico', flag: '🇲🇽', code: '+52', iso: 'MX' },
  { name: 'Morocco', flag: '🇲🇦', code: '+212', iso: 'MA' },
  { name: 'Netherlands', flag: '🇳🇱', code: '+31', iso: 'NL' },
  { name: 'New Zealand', flag: '🇳🇿', code: '+64', iso: 'NZ' },
  { name: 'Nigeria', flag: '🇳🇬', code: '+234', iso: 'NG' },
  { name: 'Norway', flag: '🇳🇴', code: '+47', iso: 'NO' },
  { name: 'Pakistan', flag: '🇵🇰', code: '+92', iso: 'PK' },
  { name: 'Philippines', flag: '🇵🇭', code: '+63', iso: 'PH' },
  { name: 'Poland', flag: '🇵🇱', code: '+48', iso: 'PL' },
  { name: 'Portugal', flag: '🇵🇹', code: '+351', iso: 'PT' },
  { name: 'Qatar', flag: '🇶🇦', code: '+974', iso: 'QA' },
  { name: 'Romania', flag: '🇷🇴', code: '+40', iso: 'RO' },
  { name: 'Russia', flag: '🇷🇺', code: '+7', iso: 'RU' },
  { name: 'Saudi Arabia', flag: '🇸🇦', code: '+966', iso: 'SA' },
  { name: 'South Africa', flag: '🇿🇦', code: '+27', iso: 'ZA' },
  { name: 'South Korea', flag: '🇰🇷', code: '+82', iso: 'KR' },
  { name: 'Spain', flag: '🇪🇸', code: '+34', iso: 'ES' },
  { name: 'Sri Lanka', flag: '🇱🇰', code: '+94', iso: 'LK' },
  { name: 'Sweden', flag: '🇸🇪', code: '+46', iso: 'SE' },
  { name: 'Switzerland', flag: '🇨🇭', code: '+41', iso: 'CH' },
  { name: 'Tanzania', flag: '🇹🇿', code: '+255', iso: 'TZ' },
  { name: 'Thailand', flag: '🇹🇭', code: '+66', iso: 'TH' },
  { name: 'Turkey', flag: '🇹🇷', code: '+90', iso: 'TR' },
  { name: 'Uganda', flag: '🇺🇬', code: '+256', iso: 'UG' },
  { name: 'Ukraine', flag: '🇺🇦', code: '+380', iso: 'UA' },
  { name: 'United Arab Emirates', flag: '🇦🇪', code: '+971', iso: 'AE' },
  { name: 'United Kingdom', flag: '🇬🇧', code: '+44', iso: 'GB' },
  { name: 'United States', flag: '🇺🇸', code: '+1', iso: 'US' },
  { name: 'Venezuela', flag: '🇻🇪', code: '+58', iso: 'VE' },
  { name: 'Vietnam', flag: '🇻🇳', code: '+84', iso: 'VN' },
  { name: 'Yemen', flag: '🇾🇪', code: '+967', iso: 'YE' },
  { name: 'Zimbabwe', flag: '🇿🇼', code: '+263', iso: 'ZW' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────
const ProfileSetup: React.FC<{ navigation?: any }> = ({ navigation }) => {
  // Use responsive dimensions hook
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(width, height), [width, height]);

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);

  const goToStep = (next: number) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -width, // Uses current dynamic width
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(next);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  // ── Step 1 state
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[60]); // USA
  const [phone, setPhone] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  // ── Step 2 state
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // ── Step 3 state
  const [displayName, setDisplayName] = useState('');

  // ── Step 4 state
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // ── filtered countries
  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch),
  );

  // Reusable Progress Dots inside component to access dynamic styles
  const ProgressDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <View style={styles.progressDots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // API Methods
  // ─────────────────────────────────────────────────────────────────────────��
  
  const handleSendOtp = async () => {
    setIsLoading(true);
    const fullPhone = `${selectedCountry.code}${phone}`;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await response.json();
      
      if (data.success) {
        goToStep(1);
      } else {
        Alert.alert('Error', data.error || 'Failed to send verification code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpApi = async (code: string) => {
    setIsLoading(true);
    const fullPhone = `${selectedCountry.code}${phone}`;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code }),
      });
      const data = await response.json();

      if (data.success) {
        setOtpVerified(true);
        setTimeout(() => goToStep(2), 600);
      } else {
        setOtpError(data.error || 'Invalid code. Please try again.');
      }
    } catch (error) {
      setOtpError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    const fullPhone = `${selectedCountry.code}${phone}`;
    try {
      const response = await fetch(`${API_BASE_URL}/user/setup-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          displayName,
          bio,
          avatarColor,
        }),
      });
      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('userToken', fullPhone);
        if (navigation) {
          navigation.reset ({
            index: 0,
            routes: [{ name: 'Home', params: { displayName, phone: fullPhone, bio } }],
          })
        } else {
          Alert.alert('🎉 Welcome to MeChat!', `Hello, ${displayName}!`);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to save profile.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render Steps
  // ──────────────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>📱</Text>
      <Text style={styles.stepTitle}>Your Phone Number</Text>
      <Text style={styles.stepSubtitle}>
        MeChat will send you a one-time verification code.
      </Text>

      <Text style={styles.inputLabel}>Country</Text>
      <TouchableOpacity
        style={styles.countrySelector}
        onPress={() => {
          setCountrySearch('');
          setCountryModalVisible(true);
        }}
        activeOpacity={0.8}>
        <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
        <Text style={styles.countryName}>{selectedCountry.name}</Text>
        <View style={styles.countryCodeBadge}>
          <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
        </View>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Phone Number</Text>
      <View style={styles.phoneRow}>
        <View style={styles.dialCodeBox}>
          <Text style={styles.dialCodeText}>{selectedCountry.code}</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="Enter phone number"
          placeholderTextColor="#3d6055"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={15}
        />
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, (!phone.trim() || isLoading) && styles.nextBtnDisabled]}
        disabled={!phone.trim() || isLoading}
        onPress={handleSendOtp}
        activeOpacity={0.85}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextBtnText}>Next →</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCountryModal = () => (
    <Modal
      visible={countryModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setCountryModalVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setCountryModalVisible(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Select Country</Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search country or dial code…"
            placeholderTextColor="#3d6055"
            value={countrySearch}
            onChangeText={setCountrySearch}
            autoFocus
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={item => item.iso}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.countryItem,
                item.iso === selectedCountry.iso && styles.countryItemActive,
              ]}
              onPress={() => {
                setSelectedCountry(item);
                setCountryModalVisible(false);
              }}>
              <Text style={styles.countryItemFlag}>{item.flag}</Text>
              <Text style={styles.countryItemName}>{item.name}</Text>
              <Text style={styles.countryItemCode}>{item.code}</Text>
              {item.iso === selectedCountry.iso && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  const handleOtpChange = (text: string, index: number) => {
    setOtpError('');
    const newOtp = [...otp];

    if (text.length > 1) {
      const chars = text.slice(0, OTP_LENGTH).split('');
      chars.forEach((ch, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = ch;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      otpRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < OTP_LENGTH - 1) {
        otpRefs.current[index + 1]?.focus();
      }
    }

    const filled = text.length > 1 ? newOtp : newOtp;
    if (filled.every(d => d !== '') && filled.join('').length === OTP_LENGTH) {
      handleVerifyOtpApi(filled.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🔑</Text>
      <Text style={styles.stepTitle}>Verify Your Number</Text>
      <Text style={styles.stepSubtitle}>
        Enter the 6-digit code sent to{'\n'}
        <Text style={styles.highlightText}>
          {selectedCountry.code} {phone}
        </Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={ref => { otpRefs.current[i] = ref; }}
            style={[
              styles.otpBox,
              digit ? styles.otpBoxFilled : {},
              otpVerified ? styles.otpBoxSuccess : {},
              otpError ? styles.otpBoxError : {},
            ]}
            value={digit}
            onChangeText={text => handleOtpChange(text, i)}
            onKeyPress={e => handleOtpKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>

      {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
      {otpVerified ? <Text style={styles.successText}>✓ Verified! Redirecting…</Text> : null}

      <TouchableOpacity onPress={handleSendOtp} style={styles.resendBtn}>
        <Text style={styles.resendText}>Didn't receive a code? <Text style={styles.resendLink}>Resend</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.nextBtn, (otp.some(d => !d) || isLoading) && styles.nextBtnDisabled]}
        disabled={otp.some(d => !d) || isLoading}
        onPress={() => handleVerifyOtpApi(otp.join(''))}
        activeOpacity={0.85}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextBtnText}>Verify →</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>👤</Text>
      <Text style={styles.stepTitle}>Your Name</Text>
      <Text style={styles.stepSubtitle}>
        This is how others will see you on MeChat.
      </Text>

      <Text style={styles.inputLabel}>Display Name</Text>
      <TextInput
        style={styles.textField}
        placeholder="e.g. Alex Johnson"
        placeholderTextColor="#3d6055"
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={30}
        autoFocus
      />
      <Text style={styles.charCount}>{displayName.length}/30</Text>

      <TouchableOpacity
        style={[styles.nextBtn, !displayName.trim() && styles.nextBtnDisabled]}
        disabled={!displayName.trim()}
        onPress={() => goToStep(3)}
        activeOpacity={0.85}>
        <Text style={styles.nextBtnText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );

  const AVATAR_COLORS = ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#9C27B0', '#FF5722'];
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const renderStep4 = () => (
    <ScrollView
      contentContainerStyle={styles.stepContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.stepEmoji}>🎨</Text>
      <Text style={styles.stepTitle}>Your Profile</Text>
      <Text style={styles.stepSubtitle}>
        Add a photo and a short bio so your friends can recognise you.
      </Text>

      <View style={styles.avatarWrapper}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarInitial}>
              {displayName ? displayName[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.avatarEditBtn}
          onPress={() =>
            Alert.alert('Profile Picture', 'In production, integrate react-native-image-picker here.')
          }>
          <Text style={styles.avatarEditIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Avatar Colour</Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setAvatarColor(c)}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              avatarColor === c && styles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      <Text style={styles.inputLabel}>Bio</Text>
      <TextInput
        style={[styles.textField, styles.bioField]}
        placeholder="A little about yourself…"
        placeholderTextColor="#3d6055"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={120}
        numberOfLines={3}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{bio.length}/120</Text>

      <TouchableOpacity 
        style={[styles.nextBtn, isLoading && styles.nextBtnDisabled]} 
        onPress={handleFinish} 
        disabled={isLoading}
        activeOpacity={0.85}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextBtnText}>🚀 Let's Go!</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => goToStep(2)} style={styles.backBtn} disabled={isLoading}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f0d" />

      {/* Background Shapes */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Responsive Wrapper for Tablets/Web */}
      <View style={styles.responsiveContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogoRow}>
            <Text style={styles.headerLogo}>Me<Text style={{ color: '#25D366' }}>Chat</Text></Text>
          </View>
          <ProgressDots total={4} current={step} />
          <Text style={styles.stepCounter}>Step {step + 1} of 4</Text>
        </View>

        {/* Animated step content */}
        <Animated.View style={[styles.animatedWrapper, { transform: [{ translateX: slideAnim }] }]}>
          {steps[step]()}
        </Animated.View>
      </View>

      {/* Country picker modal */}
      {renderCountryModal()}
    </KeyboardAvoidingView>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Dynamic Styles
// ──────────────────────────────────────────────────────────────────────────────
const makeStyles = (width: number, height: number) => {
  // Use max dimension to ensure background circles stay perfectly round upon rotation
  const maxDim = Math.max(width, height);

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0a0f0d',
    },
    // Centered max-width container to prevent UI stretching on tablets/iPads
    responsiveContainer: {
      flex: 1,
      width: '100%',
      maxWidth: 550,
      alignSelf: 'center',
    },

    // Background decorations (Scaling dynamically)
    bgCircle1: {
      position: 'absolute',
      top: -height * 0.15,
      right: -width * 0.25,
      width: maxDim * 0.7,
      height: maxDim * 0.7,
      borderRadius: maxDim * 0.35,
      backgroundColor: '#0d2b22',
    },
    bgCircle2: {
      position: 'absolute',
      bottom: -height * 0.08,
      left: -width * 0.2,
      width: maxDim * 0.5,
      height: maxDim * 0.5,
      borderRadius: maxDim * 0.25,
      backgroundColor: '#062018',
    },

    // Header
    header: {
      paddingTop: Platform.OS === 'ios' ? 56 : 32,
      paddingBottom: 16,
      alignItems: 'center',
    },
    headerLogoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerLogo: {
      fontSize: 26,
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: -0.5,
    },

    // Progress dots
    progressDots: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      width: 24,
      backgroundColor: '#25D366',
    },
    dotInactive: {
      width: 8,
      backgroundColor: '#1e3d33',
    },
    stepCounter: {
      color: '#507a68',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
    },

    animatedWrapper: {
      flex: 1,
    },

    // Step container
    stepContainer: {
      flexGrow: 1,
      paddingHorizontal: width > 550 ? 20 : width * 0.07, // Cap padding on larger devices
      paddingTop: 8,
      paddingBottom: 32,
    },

    stepEmoji: {
      fontSize: 46,
      textAlign: 'center',
      marginBottom: 10,
    },
    stepTitle: {
      fontSize: Math.min(width * 0.075, 30),
      fontWeight: '800',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    stepSubtitle: {
      fontSize: Math.min(width * 0.038, 15),
      color: '#7aada0',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    highlightText: {
      color: '#25D366',
      fontWeight: '700',
    },

    inputLabel: {
      color: '#507a68',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginTop: 4,
    },

    // Country selector
    countrySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#111f1a',
      borderWidth: 1.5,
      borderColor: '#1e3d33',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 18,
    },
    countryFlag: {
      fontSize: 22,
      marginRight: 10,
    },
    countryName: {
      flex: 1,
      color: '#d0ede6',
      fontSize: 15,
      fontWeight: '600',
    },
    countryCodeBadge: {
      backgroundColor: '#0d2b22',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginRight: 8,
    },
    countryCodeText: {
      color: '#25D366',
      fontWeight: '700',
      fontSize: 13,
    },
    chevron: {
      color: '#507a68',
      fontSize: 10,
    },

    // Phone input row
    phoneRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 32,
    },
    dialCodeBox: {
      backgroundColor: '#111f1a',
      borderWidth: 1.5,
      borderColor: '#1e3d33',
      borderRadius: 14,
      paddingHorizontal: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dialCodeText: {
      color: '#25D366',
      fontWeight: '700',
      fontSize: 15,
    },
    phoneInput: {
      flex: 1,
      backgroundColor: '#111f1a',
      borderWidth: 1.5,
      borderColor: '#1e3d33',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: '#d0ede6',
      fontSize: 16,
    },

    // Text field
    textField: {
      backgroundColor: '#111f1a',
      borderWidth: 1.5,
      borderColor: '#1e3d33',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: '#d0ede6',
      fontSize: 16,
      marginBottom: 4,
    },
    bioField: {
      minHeight: 90,
      paddingTop: 14,
    },
    charCount: {
      color: '#376050',
      fontSize: 11,
      textAlign: 'right',
      marginBottom: 28,
    },

    // Next button
    nextBtn: {
      backgroundColor: '#25D366',
      borderRadius: 30,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#25D366',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
      marginBottom: 16,
      height: 56, // Added fixed height to stop the button from shifting during the loading spinner
    },
    nextBtnDisabled: {
      backgroundColor: '#1a4033',
      shadowOpacity: 0,
      elevation: 0,
    },
    nextBtnText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 16,
      letterSpacing: 0.3,
    },

    // Back button
    backBtn: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    backText: {
      color: '#507a68',
      fontSize: 14,
      fontWeight: '600',
    },

    // OTP
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
      gap: 8,
    },
    otpBox: {
      flex: 1,
      aspectRatio: 0.85,
      backgroundColor: '#111f1a',
      borderWidth: 2,
      borderColor: '#1e3d33',
      borderRadius: 14,
      color: '#ffffff',
      fontSize: 22,
      fontWeight: '700',
      maxWidth: 60, // Ensure it doesn't stretch too much on tablets
    },
    otpBoxFilled: {
      borderColor: '#25D366',
      backgroundColor: '#0d2b22',
    },
    otpBoxSuccess: {
      borderColor: '#25D366',
      backgroundColor: '#0d3325',
    },
    otpBoxError: {
      borderColor: '#FF5252',
      backgroundColor: '#2a0f0f',
    },
    errorText: {
      color: '#FF5252',
      textAlign: 'center',
      fontSize: 13,
      marginBottom: 12,
    },
    successText: {
      color: '#25D366',
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 12,
    },
    resendBtn: {
      alignItems: 'center',
      marginBottom: 28,
    },
    resendText: {
      color: '#507a68',
      fontSize: 13,
    },
    resendLink: {
      color: '#25D366',
      fontWeight: '700',
    },

    // Avatar
    avatarWrapper: {
      alignSelf: 'center',
      marginBottom: 20,
      position: 'relative',
    },
    avatarImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      borderColor: '#25D366',
    },
    avatarPlaceholder: {
      width: 110,
      height: 110,
      borderRadius: 55,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: '#25D366',
    },
    avatarInitial: {
      color: '#fff',
      fontSize: 42,
      fontWeight: '900',
    },
    avatarEditBtn: {
      position: 'absolute',
      bottom: 4,
      right: 0,
      backgroundColor: '#128C7E',
      borderRadius: 18,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#0a0f0d',
    },
    avatarEditIcon: {
      fontSize: 18,
    },

    // Colour swatches
    colorRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    colorSwatch: {
      width: 34,
      height: 34,
      borderRadius: 17,
    },
    colorSwatchActive: {
      borderWidth: 3,
      borderColor: '#fff',
      transform: [{ scale: 1.15 }],
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalSheet: {
      position: 'absolute',
      bottom: 0,
      alignSelf: 'center',
      width: '100%',
      maxWidth: 600, // Look like a bottom sheet menu on tablet
      height: height * 0.75,
      backgroundColor: '#0f1e18',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: '#2a5040',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 14,
    },
    modalTitle: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 14,
      textAlign: 'center',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#111f1a',
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#1e3d33',
    },
    searchIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: '#d0ede6',
      fontSize: 14,
      paddingVertical: 11,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#0d1f18',
    },
    countryItemActive: {
      backgroundColor: '#0d2b22',
      borderRadius: 10,
      borderBottomColor: 'transparent',
    },
    countryItemFlag: {
      fontSize: 22,
      marginRight: 12,
    },
    countryItemName: {
      flex: 1,
      color: '#d0ede6',
      fontSize: 14,
      fontWeight: '500',
    },
    countryItemCode: {
      color: '#507a68',
      fontSize: 13,
      fontWeight: '600',
      marginRight: 6,
    },
    checkMark: {
      color: '#25D366',
      fontWeight: '800',
      fontSize: 16,
    },
  });
};

export default ProfileSetup;