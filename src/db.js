/**
 * Sistema de persistencia local para FixIt
 * Maneja el almacenamiento de datos en localStorage para eliminar la dependencia de backend.
 */

// Configuración de negocio para el cálculo de comisiones y recargos
export const CONFIG_NEGOCIO = {
  comisionFixit: 0.15,
  recargoProgramado: 15,
  recargoPocoUrgente: 20,
  recargoMuyUrgente: 25,
};

// Claves de localStorage
const KEYS = {
  USUARIOS: 'fixit_usuarios',
  SESION: 'fixit_sesion',
  SOLICITUDES: 'fixit_solicitudes',
  CHATS: 'fixit_chats',
};

// --- FUNCIONES DE PERSISTENCIA BÁSICA ---

export const getUsuarios = () => {
  const data = localStorage.getItem(KEYS.USUARIOS);
  return data ? JSON.parse(data) : [];
};

export const saveUsuarios = (usuarios) => {
  localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
};

export const getSesion = () => {
  const data = localStorage.getItem(KEYS.SESION);
  return data ? JSON.parse(data) : null;
};

export const saveSesion = (user) => {
  localStorage.setItem(KEYS.SESION, JSON.stringify(user));
};

export const clearSesion = () => {
  localStorage.removeItem(KEYS.SESION);
};

export const getSolicitudes = () => {
  const data = localStorage.getItem(KEYS.SOLICITUDES);
  return data ? JSON.parse(data) : [];
};

export const saveSolicitudes = (solicitudes) => {
  localStorage.setItem(KEYS.SOLICITUDES, JSON.stringify(solicitudes));
};

export const getChats = () => {
  const data = localStorage.getItem(KEYS.CHATS);
  return data ? JSON.parse(data) : [];
};

export const saveChats = (chats) => {
  localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
};

// --- LÓGICA DE AUTENTICACIÓN ---

export const login = (email, password) => {
  const usuarios = getUsuarios();
  const user = usuarios.find(u => u.email === email && u.password === password);

  if (!user) {
    throw new Error('El correo o la contraseña son incorrectos');
  }

  saveSesion(user);
  return user;
};

export const register = ({ email, password, nombre, telefono, tipo }) => {
  const usuarios = getUsuarios();

  if (usuarios.find(u => u.email === email)) {
    throw new Error('Este correo ya está registrado');
  }

  const nuevoUsuario = {
    id: `user-${Date.now()}`,
    email,
    password,
    nombre,
    telefono,
    tipo,
    verificado: tipo === 'cliente', // Clientes se consideran verificados por defecto
    estado_verificacion: tipo === 'cliente' ? 'aprobado' : 'sin_verificar',
    createdAt: new Date().toISOString(),
  };

  usuarios.push(nuevoUsuario);
  saveUsuarios(usuarios);
  saveSesion(nuevoUsuario);

  return nuevoUsuario;
};

export const logout = () => {
  clearSesion();
};

// --- GESTIÓN DE DATOS ---

export const crearSolicitud = (solicitud) => {
  const solicitudes = getSolicitudes();
  const nuevaSolicitud = {
    ...solicitud,
    id: `req-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: solicitud.status || 'pendiente',
    negotiation: solicitud.negotiation || [],
    timeline: solicitud.timeline || {},
    offers: solicitud.offers || [],
    messages: solicitud.messages || [],
  };

  solicitudes.push(nuevaSolicitud);
  saveSolicitudes(solicitudes);
  return nuevaSolicitud;
};

export const actualizarSolicitud = (id, cambios) => {
  const solicitudes = getSolicitudes();
  const index = solicitudes.findIndex(s => s.id === id);

  if (index === -1) {
    throw new Error('No se encontró la solicitud');
  }

  solicitudes[index] = { ...solicitudes[index], ...cambios };
  saveSolicitudes(solicitudes);
  return solicitudes[index];
};

export const actualizarUsuario = (id, cambios) => {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex(u => u.id === id);

  if (index === -1) {
    throw new Error('No se encontró el usuario');
  }

  usuarios[index] = { ...usuarios[index], ...cambios };
  saveUsuarios(usuarios);
  return usuarios[index];
};

export const crearChat = (chat) => {
  const chats = getChats();
  const nuevoChat = {
    ...chat,
    id: `chat-${Date.now()}`,
    createdAt: new Date().toISOString(),
    messages: chat.messages || [],
  };

  chats.push(nuevoChat);
  saveChats(chats);
  return nuevoChat;
};

export const actualizarChat = (id, cambios) => {
  const chats = getChats();
  const index = chats.findIndex(c => c.id === id);

  if (index === -1) {
    throw new Error('No se encontró el chat');
  }

  chats[index] = { ...chats[index], ...cambios };
  saveChats(chats);
  return chats[index];
};

// --- UTILIDADES DE NEGOCIO ---

export const calcularDesglose = (precioBase, tipoUrgencia = 'normal') => {
  const comisionBase = precioBase * CONFIG_NEGOCIO.comisionFixit;
  const tecnicoBase = precioBase - comisionBase;

  let recargo = 0;
  let fixitRecargo = 0;
  let tecnicoRecargo = 0;

  if (tipoUrgencia === 'programado') {
    recargo = CONFIG_NEGOCIO.recargoProgramado;
    fixitRecargo = 5;
    tecnicoRecargo = 10;
  } else if (tipoUrgencia === 'poco_urgente') {
    recargo = CONFIG_NEGOCIO.recargoPocoUrgente;
    fixitRecargo = 7;
    tecnicoRecargo = 13;
  } else if (tipoUrgencia === 'muy_urgente') {
    recargo = CONFIG_NEGOCIO.recargoMuyUrgente;
    fixitRecargo = 10;
    tecnicoRecargo = 15;
  }

  return {
    precioBase,
    recargo,
    totalCliente: precioBase + recargo,
    fixitTotal: comisionBase + fixitRecargo,
    tecnicoTotal: tecnicoBase + tecnicoRecargo,
    comisionBase,
    tecnicoBase,
    fixitRecargo,
    tecnicoRecargo,
  };
};
