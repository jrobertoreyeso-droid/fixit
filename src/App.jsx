import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, calcularDesglose } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import Login from './pages/Login';
import MapaUbicacion from './components/MapaUbicacion';
import SelectorUrgencia from './components/SelectorUrgencia';
import NegociacionPanel from './components/NegociacionPanel';
import EstadoServicio from './components/EstadoServicio';
import './App.css';

const CATEGORIAS = ['⚡ Electricistas', '🔧 Plomeros', '❄️ Aire acondicionado', '🔑 Cerrajeros', '📱 Celulares', '🎨 Pintores', '🪚 Carpinteros', '🧹 Limpieza'];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [userType, setUserType] = useState('cliente');
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

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      if (userType === 'cliente') loadMyRequests();
      if (userType === 'proveedor') loadAvailableRequests();
      loadChats();
    }
  }, [user, userType]);

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
    try {
      const q = query(
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
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRequests(data);
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
      showNotification('✅ Solicitud creada');
      setDescription('');
      setBudget('');
      setSelectedCategory(null);
      setUbicacion(null);
      setUrgencia('normal');
      setView('home');
      loadMyRequests();
    } catch (error) {
      showNotification('❌ Error: ' + error.message);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice) {
      alert('Ingresa un precio');
      return;
    }
    try {
      const requestRef = doc(db, 'requests', selectedRequest.id);
      const nuevaOferta = {
        id: `msg-${Date.now()}`,
        by: 'tecnico',
        byUid: user.uid,
        byEmail: user.email,
        byName: user.displayName || user.email?.split('@')[0],
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
          nombre: user.displayName || user.email?.split('@')[0],
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

      showNotification('✅ Oferta enviada');
      setOfferPrice('');
      setSelectedRequest(null);
      loadAvailableRequests();
      loadChats();
    } catch (error) {
      showNotification('❌ Error: ' + error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedChat) return;

    try {
      const chatRef = doc(db, 'chats', selectedChat.id);
      const newMessage = {
        sender: user.email,
        text: chatMessage,
        timestamp: new Date()
      };

      await updateDoc(chatRef, {
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
      alert('💳 Procesando pago simulado...\n\n✅ Pago completado exitosamente!\n\nNo se procesó dinero real (SIMULACIÓN)');
      await updateDoc(requestRef, {
        status: 'pagado',
        paymentDate: new Date(),
        'timeline.pagado': new Date()
      });
      showNotification('✅ Pago registrado');
      loadMyRequests();
    } catch (error) {
      showNotification('❌ Error: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('home');
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!user) return <Login setUserType={setUserType} />;

  return (
    <div className="app-container">
      {notification && <div className="notification">{notification}</div>}

      <header className="header">
        <h1>🔧 FixIt PRO</h1>
        <div className="user-section">
          <div className="user-type-toggle">
            <button className={userType === 'cliente' ? 'active' : ''} onClick={() => { setUserType('cliente'); setView('home'); }}>👤 Cliente</button>
            <button className={userType === 'proveedor' ? 'active' : ''} onClick={() => { setUserType('proveedor'); setView('home'); }}>🔧 Técnico</button>
          </div>
          <span>{user.email}</span>
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>
      </header>

      {userType === 'cliente' && (
        <>
          {view === 'home' && (
            <div className="home-view">
              <div className="sections">
                <div className="section">
                  <h2>📋 Mis Solicitudes</h2>
                  {requests.length === 0 ? (
                    <p>No tienes solicitudes aún</p>
                  ) : (
                    <div className="requests-list">
                      {requests.map(req => (
                        <div key={req.id} className="request-card">
                          <h4>{req.category}</h4>
                          <p>{req.description}</p>
                          <p className="budget">💰 Q{req.budget}</p>
                          <span className={`status status-${req.status}`}>{req.status}</span>

                          {req.ubicacion && (
                            <div className="solicitud-ubicacion">
                              <p>📍 {req.ubicacion.direccion || 'Ubicación en el mapa'}</p>
                              <a
                                href={`https://www.google.com/maps?q=${req.ubicacion.lat},${req.ubicacion.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ver-mapa-link"
                              >
                                Ver en Google Maps →
                              </a>
                            </div>
                          )}

                          {req.urgencia && req.urgencia !== 'normal' && (
                            <p className="urgencia-badge">
                              {req.urgencia === 'programado' && '📅 Programado'}
                              {req.urgencia === 'poco_urgente' && '🟡 Poco urgente'}
                              {req.urgencia === 'muy_urgente' && '🔴 Muy urgente'}
                            </p>
                          )}

                          {/* Si está en negociación, muestra el panel */}
                          {req.negotiation && req.negotiation.length > 0 &&
                           !['precio_acordado', 'pagado', 'en_camino', 'llego', 'en_proceso', 'trabajo_terminado', 'completado'].includes(req.status) && (
                            <NegociacionPanel
                              request={req}
                              currentUser={user}
                              userType="cliente"
                              onUpdate={loadMyRequests}
                            />
                          )}

                          {/* Si ya se acordó precio, muestra el botón de pago */}
                          {req.status === 'precio_acordado' && (
                            <div className="action-buttons">
                              <button onClick={() => handlePayment(req.id)} className="pay-btn">💳 Pagar Q{req.precioFinal}</button>
                              <button onClick={() => { setSelectedChat(chats.find(c => c.requestId === req.id)); setView('chat'); }} className="chat-btn">💬 Chat</button>
                            </div>
                          )}

                          {/* Estados posteriores al pago: mostrar timeline */}
                          {['pagado', 'en_camino', 'llego', 'en_proceso', 'trabajo_terminado', 'completado'].includes(req.status) && (
                            <>
                              <EstadoServicio
                                request={req}
                                userType="cliente"
                                onUpdate={loadMyRequests}
                              />
                              {req.status !== 'completado' && (
                                <div className="action-buttons">
                                  <button onClick={() => { setSelectedChat(chats.find(c => c.requestId === req.id)); setView('chat'); }} className="chat-btn">💬 Chat</button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="section">
                  <h2>🆕 Nueva Solicitud</h2>
                  <button onClick={() => setView('crear')} className="btn-new">+ Crear Solicitud</button>
                </div>
              </div>
            </div>
          )}

          {view === 'crear' && (
            <div className="form-view">
              <h2>Selecciona una categoría</h2>
              <div className="categorias-grid">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    className={`categoria-btn ${selectedCategory === cat ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="form-container">
                  <h3>📝 {selectedCategory}</h3>
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
                    <button onClick={handleCreateRequest} className="submit-btn">✅ Crear Solicitud</button>
                    <button onClick={() => { setView('home'); setSelectedCategory(null); }} className="cancel-btn">❌ Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'chat' && selectedChat && (
            <div className="chat-view">
              <button onClick={() => setView('home')} className="back-btn">← Volver</button>
              <div className="chat-container">
                <h2>💬 Chat - {selectedChat.participants.find(p => p !== user.email)}</h2>
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
                  <button onClick={handleSendMessage}>📤 Enviar</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {userType === 'proveedor' && (
        <div className="provider-view">
          <div className="requests-available">
            <h2>📌 Solicitudes Disponibles</h2>
            {allRequests.length === 0 ? (
              <p>No hay solicitudes disponibles</p>
            ) : (
              <div className="requests-list">
                {allRequests.map(req => {
                  // ¿Este técnico es el que está asignado a esta solicitud?
                  const soyElTecnicoAsignado = req.tecnicoSeleccionado?.uid === user.uid;
                  const yaHiceOferta = req.negotiation?.some(n => n.byUid === user.uid);

                  return (
                    <div key={req.id} className="request-card">
                      <h4>{req.category}</h4>
                      <p>{req.description}</p>
                      <p className="budget">💰 Presupuesto: Q{req.budget}</p>
                      <p className="client-email">📧 {req.userEmail}</p>

                      {req.ubicacion && (
                        <div className="solicitud-ubicacion">
                          <p>📍 {req.ubicacion.direccion || 'Ubicación en el mapa'}</p>
                          <a
                            href={`https://www.google.com/maps?q=${req.ubicacion.lat},${req.ubicacion.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ver-mapa-link"
                          >
                            Ver en Google Maps →
                          </a>
                        </div>
                      )}

                      {req.urgencia && req.urgencia !== 'normal' && (
                        <p className="urgencia-badge">
                          {req.urgencia === 'programado' && '📅 Programado'}
                          {req.urgencia === 'poco_urgente' && '🟡 Poco urgente'}
                          {req.urgencia === 'muy_urgente' && '🔴 Muy urgente'}
                        </p>
                      )}

                      {/* Si YO soy el técnico asignado → mostrar timeline */}
                      {soyElTecnicoAsignado && ['precio_acordado', 'pagado', 'en_camino', 'llego', 'en_proceso', 'trabajo_terminado', 'completado'].includes(req.status) && (
                        <EstadoServicio
                          request={req}
                          userType="tecnico"
                          onUpdate={loadAvailableRequests}
                        />
                      )}

                      {/* Si NO soy el asignado pero la solicitud ya tiene negociación → mostrar panel */}
                      {!soyElTecnicoAsignado && req.negotiation && req.negotiation.length > 0 &&
                       ['negociando'].includes(req.status) && (
                        <NegociacionPanel
                          request={req}
                          currentUser={user}
                          userType="tecnico"
                          onUpdate={loadAvailableRequests}
                        />
                      )}

                      {/* Si soy el asignado pero aún no acepté precio → mostrar panel */}
                      {soyElTecnicoAsignado && req.status === 'negociando' && (
                        <NegociacionPanel
                          request={req}
                          currentUser={user}
                          userType="tecnico"
                          onUpdate={loadAvailableRequests}
                        />
                      )}

                      {/* Si la solicitud es nueva (sin negociación) → botón de hacer oferta */}
                      {(!req.negotiation || req.negotiation.length === 0) && req.status === 'pendiente' && (
                        <>
                          {selectedRequest?.id === req.id ? (
                            <div className="offer-form">
                              <input
                                type="number"
                                placeholder="Tu precio (Q)"
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                              />
                              <button onClick={handleMakeOffer} className="submit-btn">📤 Enviar Oferta</button>
                              <button onClick={() => setSelectedRequest(null)} className="cancel-btn">Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => setSelectedRequest(req)} className="offer-btn">💰 Hacer Oferta</button>
                          )}
                        </>
                      )}

                      {/* Si ya hay negociación en curso y no soy el asignado, pero ya hice oferta */}
                      {!soyElTecnicoAsignado && yaHiceOferta && req.status === 'negociando' && (
                        <p style={{marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)'}}>
                          ⏳ Esperando que se cierre la negociación con otro técnico...
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {userType === 'proveedor' && view === 'chat-provider' && selectedChat && (
        <div className="chat-view">
          <button onClick={() => setView('home')} className="back-btn">← Volver</button>
          <div className="chat-container">
            <h2>💬 Chat - {selectedChat.participants.find(p => p !== user.email)}</h2>
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
              <button onClick={handleSendMessage}>📤 Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;