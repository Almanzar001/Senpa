import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Configuración de Firebase para Dashboard SENPA
// IMPORTANTE: Completa los valores faltantes desde Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDn4LeL6ufHDhh5CCl-n7riiiyE7jyhtbc",
  authDomain: "project-285098333071.firebaseapp.com",
  projectId: "project-285098333071",
  storageBucket: "project-285098333071.appspot.com", 
  messagingSenderId: "285098333071",
  appId: "1:285098333071:web:2466acdadaaad4898771fa"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configurar proveedor de Google
googleProvider.setCustomParameters({
  prompt: 'select_account',
  redirect_uri: 'http://localhost:5173'
});

export default app;