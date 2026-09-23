import { useState } from 'react';
import { User, Wrench } from 'lucide-react';
import { login, register, logout } from '../db';
import '../styles/Login.css';

const TIPO_CLIENTE = 'cliente';
const TIPO_TECNICO = 'tecnico';

export default function Login({ setUserType, setUser }) {
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

        const user = await register({ email, password, nombre, telefono, tipo });
        if (setUser) setUser(user);
        setUserType(user.tipo);
      } else {
        const user = await login(email, password);

        if (user.tipo !== tipo) {
          logout();
          const rolRegistrado = user.tipo === 'cliente' ? 'Cliente' : 'Técnico';
          throw new Error(
            `Este correo está registrado como ${rolRegistrado}. Cambia a "${rolRegistrado}" para iniciar sesión.`
          );
        }

        if (setUser) setUser(user);
        setUserType(user.tipo);
      }
    } catch (err) {
      setError(err.message || 'Error desconocido');
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