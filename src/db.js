// Configuraciones de negocio fijas
export const CONFIG_NEGOCIO = {
  recargoProgramado: 5.0,
  recargoPocoUrgente: 10.0,
  recargoMuyUrgente: 25.0,
};

export function calcularDesglose(presupuesto, urgencia) {
  const recargo = CONFIG_NEGOCIO[urgencia === 'normal' ? 'recargoProgramado' : `recargo${urgencia.charAt(0).toUpperCase() + urgencia.slice(1)}`] || 0;
  const subtotal = presupuesto;
  const impuesto = subtotal * 0.12;
  const total = subtotal + impuesto + recargo;
  return { subtotal, impuesto, recargo, total };
}

// Gestión de sesión local (localStorage)
export function getSesion() {
  const data = localStorage.getItem('fixit_sesion');
  return data ? JSON.parse(data) : null;
}

export function saveSesion(user) {
  localStorage.setItem('fixit_sesion', JSON.stringify(user));
}

export function clearSesion() {
  localStorage.removeItem('fixit_sesion');
}

// Helper para llamadas API
async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error de red');
  return data;
}

// Operaciones de Usuarios
export async function getUsuarios() {
  return await apiCall('/api/usuarios');
}

export async function getUsuario(id) {
  return await apiCall(`/api/usuarios/${id}`);
}

export async function register(userData) {
  const user = await apiCall('/api/register', {
    method: 'POST',
    body: userData,
  });
  saveSesion(user);
  return user;
}

export async function login(email, password) {
  const user = await apiCall('/api/login', {
    method: 'POST',
    body: { email, password },
  });
  saveSesion(user);
  return user;
}

export async function actualizarUsuario(id, updates) {
  return await apiCall(`/api/usuarios/${id}`, {
    method: 'PUT',
    body: updates,
  });
}

export function logout() {
  clearSesion();
}

// Operaciones de Solicitudes
export async function getSolicitudes() {
  return await apiCall('/api/solicitudes');
}

export async function getMisSolicitudes(userId) {
  return await apiCall(`/api/solicitudes/mias/${userId}`);
}

export async function crearSolicitud(requestData) {
  return await apiCall('/api/solicitudes', {
    method: 'POST',
    body: requestData,
  });
}

export async function actualizarSolicitud(id, updates) {
  return await apiCall(`/api/solicitudes/${id}`, {
    method: 'PUT',
    body: updates,
  });
}

// Operaciones de Chats
export async function getChats() {
  return await apiCall('/api/chats');
}

export async function getChatsDeUsuario(email) {
  return await apiCall(`/api/chats/participante/${email}`);
}

export async function crearChat(chatData) {
  return await apiCall('/api/chats', {
    method: 'POST',
    body: chatData,
  });
}

export async function actualizarChat(id, updates) {
  return await apiCall(`/api/chats/${id}`, {
    method: 'PUT',
    body: updates,
  });
}
