import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, calcularDesglose } from '../firebase';
import './NegociacionPanel.css';

export default function NegociacionPanel({
  request,
  currentUser,
  userType,
  onUpdate,
}) {
  const [monto, setMonto] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const negotiation = request.negotiation || [];
  const ultimaOferta = negotiation[negotiation.length - 1];
  const tieneOfertaPendiente = ultimaOferta?.status === 'pendiente';
  const esMiTurno = tieneOfertaPendiente && ultimaOferta.by !== userType;

  const getNombreCorto = (email) => email?.split('@')[0] || 'Usuario';

  const enviarContraoferta = async (aceptar = false) => {
    setError('');
    const montoNum = aceptar ? ultimaOferta.monto : parseFloat(monto);

    if (!aceptar && (!montoNum || montoNum <= 0)) {
      setError('Ingresa un monto válido');
      return;
    }

    setProcesando(true);
    try {
      const requestRef = doc(db, 'requests', request.id);

      const updatedNegotiation = negotiation.map((n, idx) => {
        if (idx === negotiation.length - 1) {
          return {
            ...n,
            status: aceptar ? 'aceptada' : 'rechazada',
          };
        }
        return n;
      });

      if (aceptar) {
        const desglose = calcularDesglose(ultimaOferta.monto, request.urgencia || 'normal');
        const tecnicoSeleccionado = negotiation.find(n => n.by === 'tecnico');

        await updateDoc(requestRef, {
          negotiation: updatedNegotiation,
          status: 'precio_acordado',
          precioFinal: ultimaOferta.monto,
          desglose,
          tecnicoSeleccionado: {
            uid: tecnicoSeleccionado?.byUid || '',
            email: tecnicoSeleccionado?.byEmail || '',
            nombre: tecnicoSeleccionado?.byName || '',
          },
        });
      } else {
        const nuevaOferta = {
          id: `msg-${Date.now()}`,
          by: userType,
          byUid: currentUser.uid,
          byEmail: currentUser.email,
          byName: currentUser.displayName || currentUser.email?.split('@')[0],
          type: 'contraoferta',
          monto: montoNum,
          status: 'pendiente',
          timestamp: new Date(),
        };

        await updateDoc(requestRef, {
          negotiation: [...updatedNegotiation, nuevaOferta],
        });
        setMonto('');
      }

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      setError('Error al procesar: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const rechazar = async () => {
    setError('');
    setProcesando(true);
    try {
      const requestRef = doc(db, 'requests', request.id);
      const updatedNegotiation = negotiation.map((n, idx) => {
        if (idx === negotiation.length - 1) {
          return { ...n, status: 'rechazada' };
        }
        return n;
      });

      await updateDoc(requestRef, {
        negotiation: updatedNegotiation,
        status: 'rechazado',
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      setError('Error al rechazar: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (!negotiation.length) {
    return (
      <div className="negociacion-panel">
        <p className="negociacion-vacio">Aún no hay ofertas</p>
      </div>
    );
  }

  return (
    <div className="negociacion-panel">
      <h4 className="negociacion-titulo">💬 Historial de negociación</h4>

      <div className="negociacion-historial">
        {negotiation.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`negociacion-msg negociacion-msg-${msg.by} ${msg.status}`}
          >
            <div className="negociacion-msg-header">
              <strong>
                {msg.by === 'tecnico' ? '🔧' : '👤'} {msg.byName || getNombreCorto(msg.byEmail)}
              </strong>
              <span className="negociacion-msg-hora">
                {msg.timestamp?.toDate
                  ? msg.timestamp.toDate().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
                  : new Date(msg.timestamp).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="negociacion-msg-monto">Q{msg.monto}</div>
            <div className="negociacion-msg-status">
              {msg.status === 'pendiente' && '⏳ Pendiente'}
              {msg.status === 'aceptada' && '✅ Aceptada'}
              {msg.status === 'rechazada' && '❌ Rechazada'}
            </div>
          </div>
        ))}
      </div>

      {request.status === 'precio_acordado' && (
        <div className="negociacion-acordado">
          <p>🎉 <strong>Precio acordado: Q{request.precioFinal}</strong></p>
          {request.desglose && (
            <div className="negociacion-desglose">
              <div><span>Cliente paga:</span><span>Q{request.desglose.totalCliente.toFixed(2)}</span></div>
              <div><span>FixIt comisión:</span><span>Q{request.desglose.fixitTotal.toFixed(2)}</span></div>
              <div><span>Técnico recibe:</span><span>Q{request.desglose.tecnicoTotal.toFixed(2)}</span></div>
            </div>
          )}
        </div>
      )}

      {esMiTurno && request.status !== 'precio_acordado' && (
        <div className="negociacion-acciones">
          <p className="negociacion-turno">👉 Es tu turno de responder</p>

          <div className="negociacion-btn-row">
            <button
              className="negociacion-btn-aceptar"
              onClick={() => enviarContraoferta(true)}
              disabled={procesando}
            >
              ✅ Aceptar Q{ultimaOferta.monto}
            </button>
            <button
              className="negociacion-btn-rechazar"
              onClick={rechazar}
              disabled={procesando}
            >
              ❌ Rechazar
            </button>
          </div>

          <div className="negociacion-contra">
            <input
              type="number"
              placeholder="Contraoferta (Q)"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="negociacion-input"
            />
            <button
              className="negociacion-btn-contra"
              onClick={() => enviarContraoferta(false)}
              disabled={procesando || !monto}
            >
              💬 Enviar contraoferta
            </button>
          </div>

          {error && <p className="negociacion-error">{error}</p>}
        </div>
      )}

      {!esMiTurno && request.status !== 'precio_acordado' && (
        <p className="negociacion-esperando">
          ⏳ Esperando respuesta del {ultimaOferta.by === 'tecnico' ? 'técnico' : 'cliente'}...
        </p>
      )}
    </div>
  );
}