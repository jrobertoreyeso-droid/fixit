import { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  HardHat,
  TrendingUp,
} from 'lucide-react';
import { actualizarSolicitud, calcularDesglose } from '../db';
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
      // Marcamos la última oferta como aceptada o rechazada según la acción
      const historialActualizado = negotiation.map((n, idx) => {
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

        actualizarSolicitud(request.id, {
          negotiation: historialActualizado,
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
          byUid: currentUser.id,
          byEmail: currentUser.email,
          byName: currentUser.nombre || currentUser.email?.split('@')[0],
          type: 'contraoferta',
          monto: montoNum,
          status: 'pendiente',
          timestamp: new Date().toISOString(),
        };

        actualizarSolicitud(request.id, {
          negotiation: [...historialActualizado, nuevaOferta],
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
      const historialActualizado = negotiation.map((n, idx) => {
        if (idx === negotiation.length - 1) {
          return { ...n, status: 'rechazada' };
        }
        return n;
      });

      actualizarSolicitud(request.id, {
        negotiation: historialActualizado,
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
      <h4 className="negociacion-titulo">
        <MessageSquare size={16} strokeWidth={2.5} />
        <span>Historial de negociación</span>
      </h4>

      <div className="negociacion-historial">
        {negotiation.map((msg, idx) => {
          const esCliente = msg.by === 'cliente';
          const Icono = esCliente ? User : HardHat;
          return (
            <div
              key={msg.id || idx}
              className={`negociacion-msg negociacion-msg-${msg.by} ${msg.status}`}
            >
              <div className="negociacion-msg-header">
                <strong>
                  <Icono size={13} strokeWidth={2.5} />
                  <span>{msg.byName || getNombreCorto(msg.byEmail)}</span>
                </strong>
                <span className="negociacion-msg-hora">
                  {new Date(msg.timestamp).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="negociacion-msg-monto">Q{msg.monto}</div>
              <div className="negociacion-msg-status">
                {msg.status === 'pendiente' && (
                  <>
                    <Clock size={11} strokeWidth={2.5} />
                    <span>Pendiente</span>
                  </>
                )}
                {msg.status === 'aceptada' && (
                  <>
                    <CheckCircle2 size={11} strokeWidth={2.5} />
                    <span>Aceptada</span>
                  </>
                )}
                {msg.status === 'rechazada' && (
                  <>
                    <XCircle size={11} strokeWidth={2.5} />
                    <span>Rechazada</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {request.status === 'precio_acordado' && (
        <div className="negociacion-acordado">
          <p>
            <CheckCircle2 size={18} strokeWidth={2.5} />
            <strong>Precio acordado: Q{request.precioFinal || request.precio_final}</strong>
          </p>
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
          <p className="negociacion-turno">Es tu turno de responder</p>

          <div className="negociacion-btn-row">
            <button
              className="negociacion-btn-aceptar"
              onClick={() => enviarContraoferta(true)}
              disabled={procesando}
            >
              <CheckCircle2 size={16} strokeWidth={2.5} />
              <span>Aceptar Q{ultimaOferta.monto}</span>
            </button>
            <button
              className="negociacion-btn-rechazar"
              onClick={rechazar}
              disabled={procesando}
            >
              <XCircle size={16} strokeWidth={2.5} />
              <span>Rechazar</span>
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
              <TrendingUp size={14} strokeWidth={2.5} />
              <span>Enviar</span>
            </button>
          </div>

          {error && <p className="negociacion-error">{error}</p>}
        </div>
      )}

      {!esMiTurno && request.status !== 'precio_acordado' && (
        <div className="negociacion-esperando">
          <Clock size={14} strokeWidth={2.5} />
          <span>Esperando respuesta del {ultimaOferta.by === 'tecnico' ? 'técnico' : 'cliente'}...</span>
        </div>
      )}
    </div>
  );
}
