import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, calcularDesglose } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import {
  Zap,
  Wrench,
  Snowflake,
  Key,
  Smartphone,
  Paintbrush,
  Hammer,
  Sparkles,
  MapPin,
  Mail,
  Lock,
  Clock,
  CheckCircle2,
  Inbox,
  MessageCircle,
  User,
  HardHat,
  Plus,
} from 'lucide-react';
import Login from './pages/Login';
import MapaUbicacion from './components/MapaUbicacion';
import SelectorUrgencia from './components/SelectorUrgencia';
import NegociacionPanel from './components/NegociacionPanel';
import EstadoServicio from './components/EstadoServicio';
import BarraUbicacionTecnico from './components/BarraUbicacionTecnico';
import TabsServicios from './components/TabsServicios';
import Logo from './components/Logo';
import { calcularDistancia, formatearDistancia } from './utils/distancia';
import './App.css';

const CATEGORIAS = [
  { id: 'electricistas', label: 'Electricistas', Icon: Zap },
  { id: 'plomeros', label: 'Plomeros', Icon: Wrench },
  { id: 'aire_acondicionado', label: 'Aire acondicionado', Icon: Snowflake },
  { id: 'cerrajeros', label: 'Cerrajeros', Icon: Key },
  { id: 'celulares', label: 'Celulares', Icon: Smartphone },
  { id: 'pintores', label: 'Pintores', Icon: Paintbrush },
  { id: 'carpinteros', label: 'Carpinteros', Icon: Hammer },
  { id: 'limpieza', label: 'Limpieza', Icon: Sparkles },
];

const RADIO_MAX_KM = 20;

const ESTADOS_PENDIENTES = ['pendiente', 'negociando'];
const ESTADOS_ACTIVOS = ['precio_acordado', 'pagado', 'en_camino', 'llego', 'en_proceso', 'trabajo_terminado'];
const ESTADOS_FINALIZADOS = ['completado', 'rechazado', 'cancelado'];

function getCategoriaInfo(categoryValue) {
  if (!categoryValue) return { label: 'Servicio', Icon: Wrench };

  const found = CATEGORIAS.find(c => c.id === categoryValue);
  if (found) return { label: found.label, Icon: found.Icon };

  const fallback = CATEGORIAS.find(c =>
    categoryValue.toLowerCase().includes(c.id.slice(0, 5))
  );
  if (fallback) {
    return { label: categoryValue.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || fallback.label, Icon: fallback.Icon };
  }

  return { label: categoryValue, Icon: Wrench };
}

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // ⭐ Se determina automáticamente
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [urgencia, setUrgencia] = useState('normal');
  const [tabActiva, setTabActiva] = useState('pendientes');
  const [ubicacionTecnico, setUbicacionTecnico] = useState(null);

  // Cargar usuario + perfil con su tipo
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'usuarios', currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const perfil = userDoc.data();
            setPerfilUsuario(perfil);
            setUserType(perfil.tipo);
          } else {
            // Sin perfil → asumir cliente por seguridad
            setUserType('cliente');
          }
        } catch (err) {
          console.error('Error cargando perfil:', err);
        }
      } else {
        setPerfilUsuario(null);
        setUserType(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Cargar datos según el tipo de usuario
  useEffect(() => {
    if (user && userType) {
      if (userType === 'cliente') loadMyRequests();
      if (userType === 'tecnico') loadAvailableRequests();
      loadChats();
    }
  }, [user, userType]);

  useEffect(() => {
    setTabActiva('pendientes');
  }, [userType]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const loadMyRequests = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'requests'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadAvailableRequests = async () => {
    if (!user) return;
    try {
      const q1 = query(
        collection(db, 'requests'),
        where('status', 'in', [
          'pendiente',
          'negociando',
          'precio_acordado',
          'pagado',
          'en_camino',
          'llego',
          'en_proceso',
          'trabajo_terminado'
        ])
      );
      const snap1 = await getDocs(q1);
      const activas = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const q2 = query(
        collection(db, 'requests'),
        where('tecnicoSeleccionado.uid', '==', user.uid)
      );
      const snap2 = await getDocs(q2);
      const mias = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const map = new Map();
      [...activas, ...mias].forEach(sol => map.set(sol.id, sol));
      setAllRequests(Array.from(map.values()));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadChats = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.email));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!description || !budget || !selectedCategory) {
      alert('Completa todos los campos');
      return;
    }
    if (!ubicacion || !ubicacion.lat) {
      alert('Selecciona una ubicación en el mapa');
      return;
    }

    const desglose = calcularDesglose(parseFloat(budget), urgencia);

    try {
      await addDoc(collection(db, 'requests'), {
        userId: user.uid,
        userEmail: user.email,
        userName: perfilUsuario?.nombre || user.displayName || '',
        category: selectedCategory,
        description,
        budget: parseFloat(budget),
        urgencia,
        ubicacion: {
          lat: ubicacion.lat,
          lng: ubicacion.lng,
          direccion: ubicacion.direccion || ''
        },
        desglose,
        createdAt: new Date(),
        status: 'pendiente',
        negotiation: [],
        timeline: {},
        offers: [],
        messages: []
      });
      showNotification('Solicitud creada exitosamente');
      setDescription('');
      setBudget('');
      setSelectedCategory(null);
      setUbicacion(null);
      setUrgencia('normal');
      setView('home');
      loadMyRequests();
    } catch (error) {
      showNotification('Error: ' + error.message);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice) {
      alert('Ingresa un precio');
      return;
    }
    try {
      const { doc: docFirestore } = await import('firebase/firestore');
      const requestRef = docFirestore(db, 'requests', selectedRequest.id);
      const nuevaOferta = {
        id: `msg-${Date.now()}`,
        by: 'tecnico',
        byUid: user.uid,
        byEmail: user.email,
        byName: perfilUsuario?.nombre || user.displayName || user.email?.split('@')[0],
        type: 'oferta_inicial',
        monto: parseFloat(offerPrice),
        status: 'pendiente',
        timestamp: new Date(),
      };

      const negotiationActual = selectedRequest.negotiation || [];

      await updateDoc(requestRef, {
        negotiation: [...negotiationActual, nuevaOferta],
        status: 'negociando',
        tecnicoSeleccionado: {
          uid: user.uid,
          email: user.email,
          nombre: perfilUsuario?.nombre || user.displayName || user.email?.split('@')[0],
        },
      });

      const chatId = `${selectedRequest.id}-${user.uid}`;
      await addDoc(collection(db, 'chats'), {
        chatId,
        requestId: selectedRequest.id,
        participants: [selectedRequest.userEmail, user.email],
        messages: [{
          sender: user.email,
          text: `He enviado una oferta por Q${offerPrice}`,
          timestamp: new Date()
        }],
        createdAt: new Date()
      });

      showNotification('Oferta enviada');
      setOfferPrice('');
      setSelectedRequest(null);
      loadAvailableRequests();
      loadChats();
    } catch (error) {
      showNotification('Error: ' + error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedChat) return;
    try {
      const requestRef = doc(db, 'chats', selectedChat.id);
      const newMessage = {
        sender: user.email,
        text: chatMessage,
        timestamp: new Date()
      };
      await updateDoc(requestRef, {
        messages: [...(selectedChat.messages || []), newMessage]
      });
      setChatMessage('');
      loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handlePayment = async (requestId) => {
    try {
      const requestRef = doc(db, 'requests', requestId);
      alert('Procesando pago simulado...\n\nPago completado exitosamente!\n\nNo se procesó dinero real (SIMULACIÓN)');
      await updateDoc(requestRef, {
        status: 'pagado',
        paymentDate: new Date(),
        'timeline.pagado': new Date()
      });
      showNotification('Pago registrado');
      loadMyRequests();
    } catch (error) {
      showNotification('Error: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('home');
    setUserType(null);
  };

  const clasificarSolicitudes = (lista) => {
    return {
      pendientes: lista.filter(r => ESTADOS_PENDIENTES.includes(r.status)),
      activos: lista.filter(r => ESTADOS_ACTIVOS.includes(r.status)),
      finalizados: lista.filter(r => ESTADOS_FINALIZADOS.includes(r.status)),
    };
  };

  const procesarSolicitudesTecnico = (lista) => {
    let procesadas = lista;

    if (ubicacionTecnico) {
      procesadas = procesadas
        .map(sol => ({
          ...sol,
          distancia: calcularDistancia(ubicacionTecnico, sol.ubicacion)
        }))
        .filter(sol => sol.distancia == null || sol.distancia <= RADIO_MAX_KM)
        .sort((a, b) => {
          if (a.distancia == null) return 1;
          if (b.distancia == null) return -1;
          return a.distancia - b.distancia;
        });
    }

    return procesadas;
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!user) return <Login setUserType={setUserType} />;

  const solicitudesCliente = clasificarSolicitudes(requests);
  const solicitudesTecnico = clasificarSolicitudes(procesarSolicitudesTecnico(allRequests));

  return (
    <div className="app-container">
      {notification && <div className="notification">{notification}</div>}

      <header className="header">
        <div className="header-logo">
          <Logo size={28} color="#232F72" />
          <span>FixIt</span>
        </div>
        <div className="user-section">
          <div className={`rol-badge rol-${userType}`}>
            {userType === 'cliente' ? (
              <>
                <User size={14} strokeWidth={2.5} />
                <span>Cliente</span>
              </>
            ) : (
              <>
                <HardHat size={14} strokeWidth={2.5} />
                <span>Técnico</span>
              </>
            )}
          </div>
          <span className="user-email">{user.email}</span>
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>
      </header>

      {/* VISTA CLIENTE */}
      {userType === 'cliente' && (
        <>
          {view === 'home' && (
            <div className="home-view">
              <TabsServicios
                activo={tabActiva}
                onChange={setTabActiva}
                contadores={{
                  pendientes: solicitudesCliente.pendientes.length,
                  activos: solicitudesCliente.activos.length,
                  finalizados: solicitudesCliente.finalizados.length,
                }}
              />

              <div className="section">
                {tabActiva === 'pendientes' && (
                  <>
                    <h2 className="seccion-titulo">
                      <Inbox size={20} strokeWidth={2.5} />
                      <span>Solicitudes Pendientes</span>
                    </h2>
                    {solicitudesCliente.pendientes.length === 0 ? (
                      <p className="tab-vacio">No tienes solicitudes pendientes</p>
                    ) : (
                      <div className="requests-list">
                        {solicitudesCliente.pendientes.map(req => (
                          <TarjetaCliente
                            key={req.id}
                            req={req}
                            user={user}
                            chats={chats}
                            onUpdate={loadMyRequests}
                            onPayment={handlePayment}
                            onOpenChat={(chat) => { setSelectedChat(chat); setView('chat'); }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="seccion-nueva">
                      <button onClick={() => setView('crear')} className="btn-new">
                        <Plus size={16} strokeWidth={2.5} />
                        <span>Crear nueva solicitud</span>
                      </button>
                    </div>
                  </>
                )}

                {tabActiva === 'activos' && (
                  <>
                    <h2 className="seccion-titulo">
                      <Zap size={20} strokeWidth={2.5} />
                      <span>Servicios en Curso</span>
                    </h2>
                    {solicitudesCliente.activos.length === 0 ? (
                      <p className="tab-vacio">No tienes servicios en curso</p>
                    ) : (
                      <div className="requests-list">
                        {solicitudesCliente.activos.map(req => (
                          <TarjetaCliente
                            key={req.id}
                            req={req}
                            user={user}
                            chats={chats}
                            onUpdate={loadMyRequests}
                            onPayment={handlePayment}
                            onOpenChat={(chat) => { setSelectedChat(chat); setView('chat'); }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {tabActiva === 'finalizados' && (
                  <>
                    <h2 className="seccion-titulo">
                      <CheckCircle2 size={20} strokeWidth={2.5} />
                      <span>Servicios Finalizados</span>
                    </h2>
                    {solicitudesCliente.finalizados.length === 0 ? (
                      <p className="tab-vacio">Aún no tienes servicios finalizados</p>
                    ) : (
                      <div className="requests-list">
                        {solicitudesCliente.finalizados.map(req => (
                          <TarjetaCliente
                            key={req.id}
                            req={req}
                            user={user}
                            chats={chats}
                            onUpdate={loadMyRequests}
                            onPayment={handlePayment}
                            onOpenChat={(chat) => { setSelectedChat(chat); setView('chat'); }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {view === 'crear' && (
            <div className="form-view">
              <h2>Selecciona una categoría</h2>
              <div className="categorias-grid">
                {CATEGORIAS.map((cat) => {
                  const { id, label, Icon } = cat;
                  return (
                    <button
                      key={id}
                      className={`categoria-btn ${selectedCategory === id ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(id)}
                    >
                      <Icon size={22} strokeWidth={2} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedCategory && (
                <div className="form-container">
                  <h3>{getCategoriaInfo(selectedCategory).label}</h3>
                  <textarea
                    placeholder="Describe el trabajo en detalle..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="5"
                  />
                  <input
                    type="number"
                    placeholder="Presupuesto estimado (Q)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />

                  <SelectorUrgencia
                    valor={urgencia}
                    onChange={setUrgencia}
                    precioBase={parseFloat(budget) || 0}
                  />

                  <MapaUbicacion
                    onUbicacionChange={setUbicacion}
                    ubicacionInicial={ubicacion}
                  />

                  <div className="form-buttons">
                    <button onClick={handleCreateRequest} className="submit-btn">
                      <CheckCircle2 size={16} strokeWidth={2.5} />
                      <span>Crear Solicitud</span>
                    </button>
                    <button onClick={() => { setView('home'); setSelectedCategory(null); }} className="cancel-btn">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'chat' && selectedChat && (
            <div className="chat-view">
              <button onClick={() => setView('home')} className="back-btn">Volver</button>
              <div className="chat-container">
                <h2>Chat — {selectedChat.participants.find(p => p !== user.email)}</h2>
                <div className="messages-list">
                  {selectedChat.messages?.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.sender === user.email ? 'mine' : 'other'}`}>
                      <p className="message-sender">{msg.sender}</p>
                      <p className="message-text">{msg.text}</p>
                    </div>
                  ))}
                </div>
                <div className="message-input">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={handleSendMessage}>Enviar</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VISTA TÉCNICO */}
      {userType === 'tecnico' && (
        <div className="provider-view">
          <BarraUbicacionTecnico onUbicacionChange={setUbicacionTecnico} />

          <TabsServicios
            activo={tabActiva}
            onChange={setTabActiva}
            contadores={{
              pendientes: solicitudesTecnico.pendientes.filter(r =>
                (r.negotiation || []).length === 0 ||
                r.tecnicoSeleccionado?.uid === user.uid ||
                (r.negotiation || []).some(n => n.byUid === user.uid)
              ).length,
              activos: solicitudesTecnico.activos.filter(r =>
                r.tecnicoSeleccionado?.uid === user.uid
              ).length,
              finalizados: solicitudesTecnico.finalizados.filter(r =>
                r.tecnicoSeleccionado?.uid === user.uid
              ).length,
            }}
          />

          {tabActiva === 'pendientes' && (
            <>
              <h2 className="seccion-titulo">
                <Inbox size={20} strokeWidth={2.5} />
                <span>Solicitudes Disponibles</span>
              </h2>
              {solicitudesTecnico.pendientes.length === 0 ? (
                <p className="tab-vacio">No hay solicitudes disponibles cerca de ti</p>
              ) : (
                <div className="requests-list">
                  {solicitudesTecnico.pendientes.map(req => (
                    <TarjetaTecnico
                      key={req.id}
                      req={req}
                      user={user}
                      selectedRequest={selectedRequest}
                      offerPrice={offerPrice}
                      setSelectedRequest={setSelectedRequest}
                      setOfferPrice={setOfferPrice}
                      onMakeOffer={handleMakeOffer}
                      onUpdate={loadAvailableRequests}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {tabActiva === 'activos' && (
            <>
              <h2 className="seccion-titulo">
                <Zap size={20} strokeWidth={2.5} />
                <span>Mis Servicios en Curso</span>
              </h2>
              {solicitudesTecnico.activos.filter(r => r.tecnicoSeleccionado?.uid === user.uid).length === 0 ? (
                <p className="tab-vacio">No tienes servicios activos</p>
              ) : (
                <div className="requests-list">
                  {solicitudesTecnico.activos
                    .filter(r => r.tecnicoSeleccionado?.uid === user.uid)
                    .map(req => (
                      <TarjetaTecnico
                        key={req.id}
                        req={req}
                        user={user}
                        selectedRequest={selectedRequest}
                        offerPrice={offerPrice}
                        setSelectedRequest={setSelectedRequest}
                        setOfferPrice={setOfferPrice}
                        onMakeOffer={handleMakeOffer}
                        onUpdate={loadAvailableRequests}
                      />
                    ))}
                </div>
              )}
            </>
          )}

          {tabActiva === 'finalizados' && (
            <>
              <h2 className="seccion-titulo">
                <CheckCircle2 size={20} strokeWidth={2.5} />
                <span>Servicios Finalizados</span>
              </h2>
              {solicitudesTecnico.finalizados.filter(r => r.tecnicoSeleccionado?.uid === user.uid).length === 0 ? (
                <p className="tab-vacio">Aún no has completado servicios</p>
              ) : (
                <div className="requests-list">
                  {solicitudesTecnico.finalizados
                    .filter(r => r.tecnicoSeleccionado?.uid === user.uid)
                    .map(req => (
                      <TarjetaTecnico
                        key={req.id}
                        req={req}
                        user={user}
                        selectedRequest={selectedRequest}
                        offerPrice={offerPrice}
                        setSelectedRequest={setSelectedRequest}
                        setOfferPrice={setOfferPrice}
                        onMakeOffer={handleMakeOffer}
                        onUpdate={loadAvailableRequests}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {userType === 'tecnico' && view === 'chat-provider' && selectedChat && (
        <div className="chat-view">
          <button onClick={() => setView('home')} className="back-btn">Volver</button>
          <div className="chat-container">
            <h2>Chat — {selectedChat.participants.find(p => p !== user.email)}</h2>
            <div className="messages-list">
              {selectedChat.messages?.map((msg, idx) => (
                <div key={idx} className={`message ${msg.sender === user.email ? 'mine' : 'other'}`}>
                  <p className="message-sender">{msg.sender}</p>
                  <p className="message-text">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================ */
/* COMPONENTES INTERNOS */
/* ============================================ */

function TarjetaCliente({ req, user, chats, onUpdate, onPayment, onOpenChat }) {
  const catInfo = getCategoriaInfo(req.category);

  const mostrarNegociacion = req.negotiation && req.negotiation.length > 0 &&
    !['precio_acordado', 'pagado', 'en_camino', 'llego', 'en_proceso', 'trabajo_terminado', 'completado'].includes(req.status);

  const mostrarPago = req.status === 'precio_acordado';
  const mostrarTimeline = ['pagado', 'en_camino', 'llego', 'en_proceso', 'trabajo_terminado', 'completado'].includes(req.status);

  return (
    <div className="request-card">
      <div className="request-card-header">
        <div className="categoria-titulo">
          <catInfo.Icon size={20} strokeWidth={2.5} />
          <h4>{catInfo.label}</h4>
        </div>
      </div>
      <p>{req.description}</p>
      <p className="budget">Q{req.budget}</p>
      <span className={`status status-${req.status}`}>{req.status}</span>

      {req.ubicacion && (
        <div className="solicitud-ubicacion">
          <p>
            <MapPin size={14} strokeWidth={2.5} />
            <span>{req.ubicacion.direccion || 'Ubicación en el mapa'}</span>
          </p>
          <a
            href={`https://www.google.com/maps?q=${req.ubicacion.lat},${req.ubicacion.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ver-mapa-link"
          >
            Ver en Google Maps
          </a>
        </div>
      )}

      {req.urgencia && req.urgencia !== 'normal' && (
        <p className="urgencia-badge">
          {req.urgencia === 'programado' && 'Programado'}
          {req.urgencia === 'poco_urgente' && 'Poco urgente'}
          {req.urgencia === 'muy_urgente' && 'Muy urgente'}
        </p>
      )}

      {mostrarNegociacion && (
        <NegociacionPanel
          request={req}
          currentUser={user}
          userType="cliente"
          onUpdate={onUpdate}
        />
      )}

      {mostrarPago && (
        <div className="action-buttons">
          <button onClick={() => onPayment(req.id)} className="pay-btn">
            Pagar Q{req.precioFinal}
          </button>
          <button onClick={() => onOpenChat(chats.find(c => c.requestId === req.id))} className="chat-btn">
            <MessageCircle size={16} strokeWidth={2.5} />
            <span>Chat</span>
          </button>
        </div>
      )}

      {mostrarTimeline && (
        <>
          <EstadoServicio
            request={req}
            userType="cliente"
            onUpdate={onUpdate}
          />
          {req.status !== 'completado' && (
            <div className="action-buttons">
              <button onClick={() => onOpenChat(chats.find(c => c.requestId === req.id))} className="chat-btn">
                <MessageCircle size={16} strokeWidth={2.5} />
                <span>Chat</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TarjetaTecnico({ req, user, selectedRequest, offerPrice, setSelectedRequest, setOfferPrice, onMakeOffer, onUpdate }) {
  const soyElTecnicoAsignado = req.tecnicoSeleccionado?.uid === user.uid;
  const yaHiceOferta = req.negotiation?.some(n => n.byUid === user.uid);
  const sinNegociacion = !req.negotiation || req.negotiation.length === 0;
  const catInfo = getCategoriaInfo(req.category);

  return (
    <div className="request-card">
      <div className="request-card-header">
        <div className="categoria-titulo">
          <catInfo.Icon size={20} strokeWidth={2.5} />
          <h4>{catInfo.label}</h4>
        </div>
        {req.distancia != null && (
          <span className="distancia-badge">
            <MapPin size={12} strokeWidth={2.5} />
            <span>A {formatearDistancia(req.distancia)}</span>
          </span>
        )}
      </div>

      <p>{req.description}</p>
      <p className="budget">Presupuesto: Q{req.budget}</p>
      <p className="client-email">
        <Mail size={12} strokeWidth={2.5} />
        <span>{req.userEmail}</span>
      </p>

      {req.ubicacion && (
        <div className="solicitud-ubicacion">
          <p>
            <MapPin size={14} strokeWidth={2.5} />
            <span>{req.ubicacion.direccion || 'Ubicación en el mapa'}</span>
          </p>
          <a
            href={`https://www.google.com/maps?q=${req.ubicacion.lat},${req.ubicacion.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ver-mapa-link"
          >
            Ver en Google Maps
          </a>
        </div>
      )}

      {req.urgencia && req.urgencia !== 'normal' && (
        <p className="urgencia-badge">
          {req.urgencia === 'programado' && 'Programado'}
          {req.urgencia === 'poco_urgente' && 'Poco urgente'}
          {req.urgencia === 'muy_urgente' && 'Muy urgente'}
        </p>
      )}

      {soyElTecnicoAsignado && ['pagado', 'en_camino', 'llego', 'en_proceso', 'trabajo_terminado', 'completado'].includes(req.status) && (
        <EstadoServicio
          request={req}
          userType="tecnico"
          onUpdate={onUpdate}
        />
      )}

      {soyElTecnicoAsignado && req.status === 'precio_acordado' && !req.paymentDate && (
        <div className="mensaje-esperando">
          <Clock size={14} strokeWidth={2.5} />
          <span>Esperando que el cliente realice el pago...</span>
        </div>
      )}

      {soyElTecnicoAsignado && req.status === 'negociando' && (
        <NegociacionPanel
          request={req}
          currentUser={user}
          userType="tecnico"
          onUpdate={onUpdate}
        />
      )}

      {sinNegociacion && req.status === 'pendiente' && (
        <>
          {selectedRequest?.id === req.id ? (
            <div className="offer-form">
              <input
                type="number"
                placeholder="Tu precio (Q)"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
              <button onClick={onMakeOffer} className="submit-btn">
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>Enviar Oferta</span>
              </button>
              <button onClick={() => setSelectedRequest(null)} className="cancel-btn">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setSelectedRequest(req)} className="offer-btn">
              Hacer Oferta
            </button>
          )}
        </>
      )}

      {!soyElTecnicoAsignado && yaHiceOferta && req.status === 'negociando' && (
        <div className="mensaje-esperando">
          <Clock size={14} strokeWidth={2.5} />
          <span>Esperando que se cierre con otro técnico...</span>
        </div>
      )}

      {!soyElTecnicoAsignado && !yaHiceOferta && req.negotiation?.length > 0 && req.status === 'negociando' && (
        <div className="mensaje-esperando">
          <Lock size={14} strokeWidth={2.5} />
          <span>Otro técnico está negociando...</span>
        </div>
      )}
    </div>
  );
}

export default App;