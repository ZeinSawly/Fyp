import React, { useState, useEffect, useRef } from 'react';import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const LoginScreen = ({ navigation }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = () => {
    if (!id || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    api.post(`/api/login`, {
      id,
      password,
    })
    .then(async res => {
      setIsLoading(false);
      const { token, user } = res.data;

      await AsyncStorage.setItem('token', token);

      if (user.role === 'student') {
        navigation.navigate('StudentDashboard', { student: user });
      } else if (user.role === 'instructor') {
        navigation.navigate('InstructorDashboard', { instructor: user });
      } else if (user.role === 'admin') {
        navigation.navigate('AdminDashboard', { admin: user });
      }
    })
    .catch(err => {
      setIsLoading(false);
    
      console.log("LOGIN ERROR:", err);
    
      let message = 'Something went wrong';
    
      if (err.response && err.response.data) {
        message = err.response.data.message || 'Invalid ID or password';
      } else if (err.message) {
        message = err.message;
      }
    
      setError(message);
    });
  };

  return (
    <LinearGradient colors={['#edf2f7', '#f8fafc']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* HEADER */}
            <LinearGradient
              colors={['#1a365d', '#2b6cb0']}
              style={styles.heroHeader}
            >
              <View style={styles.logoCard}>
                <Image
                  source={require('../assets/ualog.jpg')}
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.heroUniversityName}>
                Antonine University
              </Text>
            </LinearGradient>

            {/* CONTENT */}
            <View style={styles.content}>

              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>Welcome Back</Text>
                <Text style={styles.welcomeSubtitle}>
                  Sign in to continue to your portal
                </Text>
              </View>

              <View style={styles.formContainer}>

                {/* ID INPUT */}
                <View style={styles.inputContainer}>
                  <Ionicons name="card-outline" size={20} color="#718096" />
                  <TextInput
                    style={styles.input}
                    placeholder="University ID"
                    placeholderTextColor="#a0aec0"
                    value={id}
                    onChangeText={(text) => {
                      setId(text);
                      setError('');
                    }}
                  />
                </View>

                {/* PASSWORD INPUT */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#718096" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#a0aec0"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#718096"
                    />
                  </TouchableOpacity>
                </View>

                {/* ERROR BOX */}
                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color="#e53e3e" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* FORGOT PASSWORD */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* LOGIN BUTTON */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

              </View>

              {/* FOOTER */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © {new Date().getFullYear()} Antonine University
                </Text>
                <Text style={styles.footerSubtext}>
                  IT Support - Ext. 1234
                </Text>
              </View>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  heroHeader: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 40,
  },
  logoCard: {
    backgroundColor: '#fff',
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  heroLogo: {
    width: 70,
    height: 70,
  },
  heroUniversityName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 24,
    marginTop: -20,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2b6cb0',
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#4a5568',
    textAlign: 'center',
    maxWidth: '85%',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#2d3748',
  },

  /* ERROR */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#e53e3e',
    marginLeft: 8,
    fontSize: 14,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#3182ce',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#2b6cb0',
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#718096',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#a0aec0',
  },
});

export default LoginScreen;