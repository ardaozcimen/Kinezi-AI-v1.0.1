import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { setGlobalUserId } from './storage';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

export async function initMockUsers() {
  // Artık yerel mock kullanıcılara gerek yok, Firebase uzak sunucusunu kullanıyoruz.
}

export async function register(username: string, password?: string): Promise<User> {
  // Firebase email istediği için kullanıcı adını email formatına çeviriyoruz
  const email = username.includes('@') ? username : `${username}@kinezi.com`;
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password || '123456');
  const fbUser = userCredential.user;

  const newUser: User = {
    id: fbUser.uid,
    username,
    email: fbUser.email || email,
    createdAt: Date.now(),
  };

  setGlobalUserId(fbUser.uid);
  
  // Yeni kullanıcıya otomatik olarak İtiş & Çekiş programını yükle
  const { seedUserWorkout } = require('./storage');
  await seedUserWorkout();

  return newUser;
}

export async function login(username: string, password?: string): Promise<User> {
  const email = username.includes('@') ? username : `${username}@kinezi.com`;
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password || '123456');
  const fbUser = userCredential.user;

  const user: User = {
    id: fbUser.uid,
    username,
    email: fbUser.email || email,
    createdAt: Date.now(),
  };

  setGlobalUserId(fbUser.uid);
  return user;
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
  setGlobalUserId(null);
}

export async function getCurrentSession(): Promise<User | null> {
  // onAuthStateChanged ile Firebase oturumunu bekle
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      unsubscribe();
      if (fbUser) {
        setGlobalUserId(fbUser.uid);
        resolve({
          id: fbUser.uid,
          username: fbUser.email?.split('@')[0] || 'user',
          email: fbUser.email || '',
          createdAt: Date.now(),
        });
      } else {
        setGlobalUserId(null);
        resolve(null);
      }
    });
  });
}
