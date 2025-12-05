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
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth';
import {auth} from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const CURRENT_USER_KEY = 'currentUser';

// helper kecil buat “mengubah” username jadi email valid
const usernameToEmail = (username: string) =>
  `${username.toLowerCase()}@chatappnara.local`;

const RegisterScreen: React.FC<Props> = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegisterPress = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password || !confirm) {
      Alert.alert('Oops', 'Semua field harus diisi');
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

    // Validasi panjang username
    if (trimmedUsername.length < 3) {
      Alert.alert('Oops', 'Username minimal 3 karakter');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Oops', 'Password minimal 6 karakter');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Oops', 'Password dan konfirmasi tidak sama');
      return;
    }

    setLoading(true);

    try {
      const email = usernameToEmail(trimmedUsername);

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // set displayName di Firebase User
      await updateProfile(cred.user, {displayName: trimmedUsername});

      // simpan user lokal untuk auto-login
      await AsyncStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify({username: trimmedUsername, uid: cred.user.uid}),
      );

      Alert.alert('Berhasil', 'Akun berhasil dibuat!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{name: 'Chat', params: {username: trimmedUsername}}],
            }),
        },
      ]);
    } catch (e: any) {
      console.error('Register error:', e);
      console.error('Error code:', e.code);
      console.error('Error message:', e.message);

      let msg = 'Terjadi kesalahan saat mendaftar';

      if (e.code === 'auth/email-already-in-use') {
        msg = 'Username ini sudah dipakai. Coba yang lain ya';
      } else if (e.code === 'auth/invalid-email') {
        msg = 'Format username tidak valid';
      } else if (e.code === 'auth/weak-password') {
        msg = 'Password terlalu lemah (minimal 6 karakter)';
      } else if (e.code === 'auth/network-request-failed') {
        msg = 'Tidak ada koneksi internet. Cek koneksi Anda';
      } else if (e.code === 'auth/operation-not-allowed') {
        msg = 'Pendaftaran tidak diaktifkan. Pastikan Email/Password authentication sudah aktif di Firebase Console';
      } else {
        // Tampilkan error detail untuk debugging
        msg = `Error: ${e.message || 'Unknown error'}`;
      }

      Alert.alert('Gagal daftar', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Daftar</Text>
        <Text style={styles.subtitle}>Buat akun baru ChatAppNara</Text>

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

        <TextInput
          style={styles.input}
          placeholder="Konfirmasi Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <TouchableOpacity
          style={[styles.button, loading && {opacity: 0.7}]}
          onPress={onRegisterPress}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Mendaftar...' : 'Daftar'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Sudah punya akun?{' '}
          <Text
            style={styles.linkText}
            onPress={() => navigation.replace('Login')}>
            Login
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

export default RegisterScreen;