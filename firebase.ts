// firebase.ts
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDsDtvDB3JcJfomDMY4UZ3RhdKMztvAkSQ',
  authDomain: 'chatappnara.firebaseapp.com',
  projectId: 'chatappnara',
  storageBucket: 'chatappnara.appspot.com',
  messagingSenderId: '442709962056',
  appId: '1:442709962056:web:78eb895851a3814131577d',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


