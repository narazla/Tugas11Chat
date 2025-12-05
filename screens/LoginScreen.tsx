// screens/LoginScreen.tsx
import React, {useState} from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const CURRENT_USER_KEY = 'currentUser';

// helper: ubah username jadi email palsu yang valid
const usernameToEmail = (username: string) =>
  `${username.toLowerCase()}@chatappnara.local`;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLoginPress = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      Alert.alert('Oops', 'Username dan password harus diisi');
      return;
    }

    // Validasi username tidak boleh ada spasi atau karakter khusus
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      Alert.alert(
        'Username Tidak Valid',
        'Username hanya boleh berisi huruf, angka, dan underscore',
      );
      return;
    }

    setLoading(true);

    try {
      const email = usernameToEmail(trimmedUsername);

      const cred = await signInWithEmailAndPassword(auth, email, password);

      const canonicalUsername =
        cred.user.displayName?.trim() || trimmedUsername;

      await AsyncStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify({username: canonicalUsername, uid: cred.user.uid}),
      );

      navigation.reset({
        index: 0,
        routes: [{name: 'Chat', params: {username: canonicalUsername}}],
      });
    } catch (e: any) {
      console.warn('Login error', e);
      let msg = 'Terjadi kesalahan saat login';

      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        msg = 'Akun tidak ditemukan atau password salah. Coba daftar dulu ya';
      } else if (e.code === 'auth/wrong-password') {
        msg = 'Password salah';
      } else if (e.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percobaan. Coba lagi nanti ya';
      } else if (e.code === 'auth/network-request-failed') {
        msg = 'Tidak ada koneksi internet. Cek koneksi Anda';
      } else if (e.code === 'auth/invalid-email') {
        msg = 'Format username tidak valid';
      }

      Alert.alert('Gagal login', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Masuk ke ChatAppNara</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && {opacity: 0.7}]}
          onPress={onLoginPress}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Masuk...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Belum punya akun?{' '}
          <Text
            style={styles.linkText}
            onPress={() => navigation.replace('Register')}>
            Daftar
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#ec4899',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#9ca3af',
  },
  input: {
    borderWidth: 1,
    borderColor: '#fce7f3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: '#1f2937',
    backgroundColor: '#fdf2f8',
  },
  button: {
    backgroundColor: '#ec4899',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9ca3af',
  },
  linkText: {
    color: '#ec4899',
    fontWeight: '600',
  },
});

export default LoginScreen;