import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface BubbleProps {
  size: number;
  startX: number;
  delay: number;
  duration: number;
  color: string;
}

const FloatingBubble: React.FC<BubbleProps> = ({
  size,
  startX,
  delay,
  duration,
  color,
}) => {
  const translateY = useRef(new Animated.Value(height + size)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height + size);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -size * 2,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: duration * 0.15,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.15,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startX,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

const LandingPage: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [loadingDone, setLoadingDone] = useState(false);

  // --- Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const loaderRotate = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.8)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnGlow = useRef(new Animated.Value(0.6)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Loading progress bar
  const progressInterpolate = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Rotate interpolation for spinner
  const spinInterpolate = loaderRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    // 1. Logo pop-in
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Title slide up
      Animated.parallel([
        Animated.timing(titleY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 3. Subtitle fade
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          // 4. Show loader
          Animated.timing(loaderOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            // Spin the loader
            Animated.loop(
              Animated.timing(loaderRotate, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
            ).start();

            // Progress bar fills over 2.5s
            Animated.timing(progressWidth, {
              toValue: 1,
              duration: 2500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }).start(() => {
              // Hide loader, show button
              Animated.timing(loaderOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                setLoadingDone(true);
                Animated.parallel([
                  Animated.spring(btnScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 80,
                    useNativeDriver: true,
                  }),
                  Animated.timing(btnOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  // Glowing pulse on button
                  Animated.loop(
                    Animated.sequence([
                      Animated.timing(btnGlow, {
                        toValue: 1,
                        duration: 900,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                      }),
                      Animated.timing(btnGlow, {
                        toValue: 0.6,
                        duration: 900,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                      }),
                    ]),
                  ).start();
                });
              });
            });
          });
        });
      });
    });
  }, []);

  const handleGetStarted = () => {
    if (navigation) {
      navigation.navigate('ProfileSetup');
    }
  };

  const bubbles = [
    { size: 18, startX: width * 0.08, delay: 0, duration: 7000, color: '#25D366' },
    { size: 12, startX: width * 0.2, delay: 1200, duration: 6000, color: '#128C7E' },
    { size: 24, startX: width * 0.35, delay: 400, duration: 8500, color: '#075E54' },
    { size: 10, startX: width * 0.5, delay: 2000, duration: 5800, color: '#25D366' },
    { size: 20, startX: width * 0.65, delay: 700, duration: 7800, color: '#128C7E' },
    { size: 14, startX: width * 0.8, delay: 1600, duration: 6500, color: '#25D366' },
    { size: 8, startX: width * 0.9, delay: 300, duration: 5200, color: '#075E54' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f0d" />

      {/* Background gradient layers */}
      <View style={[styles.gradientLayer, styles.gradientTop]} />
      <View style={[styles.gradientLayer, styles.gradientBottom]} />

      {/* Floating bubbles */}
      {bubbles.map((b, i) => (
        <FloatingBubble key={i} {...b} />
      ))}

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}>
          <View style={styles.logoIcon}>
            <View style={styles.chatBubble}>
              <View style={styles.chatDot} />
              <View style={[styles.chatDot, { marginHorizontal: 5 }]} />
              <View style={styles.chatDot} />
            </View>
            <View style={styles.chatTail} />
          </View>
        </Animated.View>

        {/* App Title */}
        <Animated.View style={{ alignItems: 'center' }}>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleY }],
              },
            ]}>
            Me<Text style={styles.titleAccent}>Chat</Text>
          </Animated.Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Connect. Share. Stay Close. 💬
        </Animated.Text>

        {/* Feature pills */}
        <Animated.View style={[styles.pillsRow, { opacity: subtitleOpacity }]}>
          {['🔒 Private', '⚡ Fast', '🌍 Global'].map(label => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Loading section */}
        <Animated.View style={[styles.loaderSection, { opacity: loaderOpacity }]}>
          <Animated.View
            style={[
              styles.spinner,
              { transform: [{ rotate: spinInterpolate }] },
            ]}>
            <View style={styles.spinnerArc} />
          </Animated.View>
          <Text style={styles.loadingText}>Setting things up…</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressInterpolate }]}
            />
          </View>
        </Animated.View>

        {/* Get Started Button */}
        {loadingDone && (
          <Animated.View
            style={{
              opacity: btnOpacity,
              transform: [{ scale: btnScale }],
              alignItems: 'center',
              marginTop: height * 0.06, // Moved marginTop to parent wrapper
            }}>
            
            {/* Added a relative wrapper to tightly bound the glow ring and the button together */}
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Animated.View
                style={[
                  styles.btnGlowRing,
                  { opacity: btnGlow },
                ]}
              />
              <TouchableOpacity
                style={styles.getStartedBtn}
                onPress={handleGetStarted}
                activeOpacity={0.85}>
                <Text style={styles.btnText}>Get Started</Text>
                <View style={styles.btnArrow}>
                  <Text style={styles.btnArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms & Privacy</Text>
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom wave decoration */}
      <View style={styles.bottomDecor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0d',
    overflow: 'hidden',
  },
  gradientLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: width,
  },
  gradientTop: {
    top: -width * 0.6,
    height: width * 1.2,
    backgroundColor: '#0d2b22',
    opacity: 0.7,
  },
  gradientBottom: {
    bottom: -width * 0.5,
    height: width,
    backgroundColor: '#062018',
    opacity: 0.5,
  },

  // Bubbles
  bubble: {
    position: 'absolute',
    bottom: 0,
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
  },

  // Logo
  logoContainer: {
    marginBottom: height * 0.03,
  },
  logoIcon: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: width * 0.07,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  chatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#128C7E',
  },
  chatTail: {
    alignSelf: 'flex-end',
    marginRight: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: 'transparent',
    borderRightWidth: 0,
    borderTopWidth: 10,
    borderTopColor: '#fff',
  },

  // Title
  title: {
    fontSize: Math.min(width * 0.14, 56),
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#25D366',
  },

  // Subtitle
  subtitle: {
    fontSize: Math.min(width * 0.042, 17),
    color: '#a0b8b0',
    marginTop: height * 0.012,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Feature pills
  pillsRow: {
    flexDirection: 'row',
    marginTop: height * 0.025,
    gap: 10,
  },
  pill: {
    backgroundColor: 'rgba(37,211,102,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillText: {
    color: '#25D366',
    fontSize: Math.min(width * 0.033, 13),
    fontWeight: '600',
  },

  // Loader
  loaderSection: {
    alignItems: 'center',
    marginTop: height * 0.06,
    width: '100%',
  },
  spinner: {
    width: 50,
    height: 50,
    marginBottom: 14,
  },
  spinnerArc: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#25D366',
    borderRightColor: '#128C7E',
  },
  loadingText: {
    color: '#5a8a76',
    fontSize: Math.min(width * 0.036, 14),
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: '70%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#25D366',
    borderRadius: 2,
  },

  // Get Started Button
  btnGlowRing: {
    position: 'absolute',
    top: 0, // Bound completely to the new wrapper bounds
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 30,
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 0,
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: width * 0.7,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  btnText: {
    color: '#fff',
    fontSize: Math.min(width * 0.046, 18),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnArrow: {
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    color: '#4a7060',
    fontSize: Math.min(width * 0.03, 12),
    textAlign: 'center',
    marginTop: 16,
  },
  termsLink: {
    color: '#25D366',
    fontWeight: '600',
  },

  // Bottom decoration
  bottomDecor: {
    position: 'absolute',
    bottom: -height * 0.06,
    left: -width * 0.1,
    right: -width * 0.1,
    height: height * 0.12,
    backgroundColor: '#128C7E',
    opacity: 0.07,
    borderRadius: width,
  },
});

export default LandingPage;