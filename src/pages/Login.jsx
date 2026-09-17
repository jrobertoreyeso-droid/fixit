import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { User, Wrench } from 'lucide-react';
import { auth, db } from '../firebase';
import '../styles/Login.css';

const TIPO_TECNICO = 'tecnico';
const TIPO_CLIENTE = 'cliente';

export default function Login({ setUserType }) {
  const [tipo, setTipo] = useState(TIPO_CLIENTE);
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const limpiar = () => {
    setEmail('');
    setPassword('');
    setNombre('');
    setTelefono('');
    setError('');
  };

  const guardarPerfilUsuario = async (user, tipoUsuario, datosExtra = {}) => {
    const userRef = doc(db, 'usuarios', user.uid);
    const existe = await getDoc(userRef);
    if (!existe.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        nombre: datosExtra.nombre || user.displayName || '',
        telefono: datosExtra.telefono || '',
        tipo: tipoUsuario,
        verificado: false,
        createdAt: serverTimestamp(),
      });
    }
    return existe.data() || { tipo: tipoUsuario };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (modo === 'registro') {
        if (!email || !password || !nombre || !telefono) {
          throw new Error('Completa todos los campos');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: nombre });
        await guardarPerfilUsuario(user, tipo, { nombre, telefono });

        setUserType(tipo);
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userRef);
        const tipoGuardado = userDoc.exists() ? userDoc.data().tipo : TIPO_CLIENTE;
        setUserType(tipoGuardado);
      }
    } catch (err) {
      console.error(err);
      const mensajes = {
        'auth/email-already-in-use': 'Este correo ya está registrado',
        'auth/invalid-email': 'Correo inválido',
        'auth/weak-password': 'Contraseña muy débil',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Credenciales incorrectas',
      };
      setError(mensajes[err.code] || err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setCargando(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      const perfil = await guardarPerfilUsuario(user, tipo, {
        nombre: user.displayName,
        telefono: '',
      });
      setUserType(perfil.tipo || tipo);
    } catch (err) {
      console.error(err);
      setError('Error al iniciar con Google');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>FixIt</h1>
          <p>Encuentra. Negocia. Soluciona.</p>
        </div>

        <div className="tipo-selector">
          <button
            type="button"
            className={`tipo-btn ${tipo === TIPO_CLIENTE ? 'active' : ''}`}
            onClick={() => { setTipo(TIPO_CLIENTE); limpiar(); }}
          >
            <User size={16} strokeWidth={2.5} />
            <span>Cliente</span>
          </button>
          <button
            type="button"
            className={`tipo-btn ${tipo === TIPO_TECNICO ? 'active' : ''}`}
            onClick={() => { setTipo(TIPO_TECNICO); limpiar(); }}
          >
            <Wrench size={16} strokeWidth={2.5} />
            <span>Técnico</span>
          </button>
        </div>

        <h2 className="login-title">
          {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          <span className="login-subtitle">
            {tipo === TIPO_CLIENTE ? ' como Cliente' : ' como Técnico'}
          </span>
        </h2>

        <form onSubmit={handleSubmit} className="login-form">
          {modo === 'registro' && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="login-input"
                autoComplete="name"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="login-input"
                autoComplete="tel"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn-primary" disabled={cargando}>
            {cargando ? 'Cargando...' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="login-divider">
          <span>o</span>
        </div>

        <button
          type="button"
          className="login-btn-google"
          onClick={handleGoogle}
          disabled={cargando}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuar con Google
        </button>

        <p className="login-toggle">
          {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button
            type="button"
            onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); limpiar(); }}
            className="login-toggle-btn"
          >
            {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}