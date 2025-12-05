// screens/ChatScreen.tsx
import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';

import {db} from '../firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type Message = {
  id: string;
  text?: string;
  imageBase64?: string;
  sender: string;
  createdAt: number;
};

const ROOM_ID = 'global-room';
const CHAT_STORAGE_KEY = 'chat_global';
const CURRENT_USER_KEY = 'currentUser';

const ChatScreen: React.FC<Props> = ({route, navigation}) => {
  const username = route.params.username;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // 👇 ini kuncinya: type FlatList<Message> saja, initial value di-cast
  const listRef = useRef<FlatList<Message>>(null as any);

  // 1️⃣ Load chat lokal dari AsyncStorage
  useEffect(() => {
    const loadLocalChat = async () => {
      try {
        const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          const parsed: Message[] = JSON.parse(raw);
          setMessages(parsed);
        }
      } catch (e) {
        console.warn('Gagal load chat local', e);
      }
    };

    loadLocalChat();
  }, []);

  // 2️⃣ Listener real-time Firestore untuk 1 global room
  useEffect(() => {
    const colRef = collection(db, 'rooms', ROOM_ID, 'messages');
    const q = query(colRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      async snapshot => {
        const data: Message[] = snapshot.docs.map(doc => {
          const d: any = doc.data();
          return {
            id: doc.id,
            text: d.text ?? undefined,
            imageBase64: d.imageBase64 ?? undefined,
            sender: d.sender ?? 'unknown',
            createdAt: d.createdAt?.toMillis
              ? d.createdAt.toMillis()
              : Date.now(),
          };
        });

        setMessages(data);

        try {
          await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn('Gagal simpan chat local', e);
        }
      },
      error => {
        console.warn(error);
        Alert.alert('Error', 'Gagal mengambil data chat dari server');
      },
    );

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.warn(e);
    }

    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  // 3️⃣ Kirim pesan teks
  const sendTextMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    try {
      await addDoc(collection(db, 'rooms', ROOM_ID, 'messages'), {
        text: trimmed,
        sender: username,
        createdAt: serverTimestamp(),
      });
      setInput('');
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Gagal mengirim pesan');
    }
  };

  // 4️⃣ Pilih foto → simpan base64 ke Firestore
  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
        selectionLimit: 1,
        includeBase64: true,
      },
      async response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Gagal memilih foto');
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.base64) {
          Alert.alert('Error', 'Gagal membaca gambar');
          return;
        }

        try {
          await addDoc(collection(db, 'rooms', ROOM_ID, 'messages'), {
            imageBase64: `data:${asset.type || 'image/jpeg'};base64,${
              asset.base64
            }`,
            sender: username,
            createdAt: serverTimestamp(),
          });

          setTimeout(
            () => listRef.current?.scrollToEnd({animated: true}),
            100,
          );
        } catch (e) {
          console.warn(e);
          Alert.alert('Error', 'Gagal mengirim gambar');
        }
      },
    );
  };

  const renderItem = ({item}: {item: Message}) => {
    const isMe = item.sender === username;

    return (
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleOther,
        ]}>
        {item.text ? (
          <Text style={[styles.bubbleText, !isMe && {color: '#ec4899'}]}>
            {item.text}
          </Text>
        ) : null}

        {item.imageBase64 ? (
          <Image source={{uri: item.imageBase64}} style={styles.image} />
        ) : null}

        <Text style={[styles.senderLabel, !isMe && {color: '#db2777'}]}>
          {isMe ? 'You' : item.sender}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ChatAppNara</Text>
          <Text style={styles.headerSubtitle}>Hai, {username}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Area Chat */}
      <View style={styles.chatContainer}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({animated: true})
          }
        />
      </View>

      {/* Input + tombol foto */}
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Text style={styles.photoButtonText}>+</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Tulis pesan..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendTextMessage}>
          <Text style={styles.sendText}>Kirim</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ec4899',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#fce7f3',
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logoutText: {
    color: '#ec4899',
    fontWeight: '600',
    fontSize: 12,
  },
  chatContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  chatContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  bubbleMe: {
    backgroundColor: '#ec4899',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fce7f3',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#ffffff',
    fontSize: 14,
  },
  image: {
    marginTop: 4,
    width: 160,
    height: 160,
    borderRadius: 12,
  },
  senderLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.8,
    alignSelf: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    paddingTop: 4,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#fce7f3',
  },
  photoButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  photoButtonText: {
    fontSize: 24,
    color: '#ec4899',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#fce7f3',
    color: '#1f2937',
    fontSize: 14,
    marginRight: 6,
  },
  sendButton: {
    backgroundColor: '#ec4899',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ChatScreen;