import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Handshake,
  CreditCard,
  Car,
  MapPin,
  Hammer,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react';
import { db } from '../firebase';
import EvidenciaTrabajo from './EvidenciaTrabajo';
import './EstadoServicio.css';

const ESTADOS_FLUJO = [
  {
    key: 'precio_acordado',
    label: 'Precio acordado',
    Icon: Handshake,
    descripcion: 'El precio del servicio fue negociado',
    // Sin "siguiente": el cliente debe pagar con el botón de pago
  },
  {
    key: 'pagado',
    label: 'Pago recibido',
    Icon: CreditCard,
    descripcion: 'El cliente realizó el pago del servicio',
    siguiente: 'en_camino',
    siguienteLabel: 'Marcar "En camino"',
    accionTecnico: true,
  },
  {
    key: 'en_camino',
    label: 'Técnico en camino',
    Icon: Car,
    descripcion: 'El técnico se dirige a tu domicilio',
    siguiente: 'llego',
    siguienteLabel: 'Marcar "Llegué al domicilio"',
    accionTecnico: true,
  },
  {
    key: 'llego',
    label: 'Técnico llegó',
    Icon: MapPin,
    descripcion: 'El técnico está en el domicilio',
    siguiente: 'en_proceso',
    siguienteLabel: 'Marcar "Trabajo en proceso"',
    accionTecnico: true,
  },
  {
    key: 'en_proceso',
    label: 'Trabajo en proceso',
    Icon: Hammer,
    descripcion: 'El técnico está realizando el trabajo',
    siguiente: 'trabajo_terminado',
    siguienteLabel: 'Subir evidencia y terminar',
    accionTecnico: true,
    requiereEvidencia: true,
  },
  {
    key: 'trabajo_terminado',
    label: 'Trabajo terminado',
    Icon: Camera,
    descripcion: 'Revisa la evidencia y confirma para liberar el pago',
    siguiente: 'completado',
    siguienteLabel: 'Confirmar y liberar pago',
    accionTecnico: false,
    accionCliente: true,
  },
  {
    key: 'completado',
    label: 'Servicio completado',
    Icon: PartyPopper,
    descripcion: 'El servicio se completó exitosamente',
    siguiente: null,
  },
];

export default function EstadoServicio({ request, userType, onUpdate }) {
  const [mostrarEvidencia, setMostrarEvidencia] = useState(false);

  const estadoActual = request.status || 'precio_acordado';
  const estadoIndex = ESTADOS_FLUJO.findIndex(e => e.key === estadoActual);
  const estadoInfo = ESTADOS_FLUJO[estadoIndex];

  const avanzarEstado = async () => {
    if (!estadoInfo?.siguiente) return;

    if (estadoInfo.requiereEvidencia) {
      setMostrarEvidencia(true);
      return;
    }

    try {
      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, {
        status: estadoInfo.siguiente,
        [`timeline.${estadoInfo.siguiente}`]: new Date(),
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error avanzando estado:', error);
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  const puedeAvanzar =
    estadoInfo?.siguiente &&
    ((userType === 'tecnico' && estadoInfo.accionTecnico) ||
     (userType === 'cliente' && estadoInfo.accionCliente));

  const mostrarTimeline = !['negociando', 'pendiente'].includes(estadoActual);

  if (!mostrarTimeline) return null;

  return (
    <>
      <div className="estado-servicio">
        <h4 className="estado-titulo">Estado del servicio</h4>

        <div className="estado-timeline">
          {ESTADOS_FLUJO.map((estado, idx) => {
            const { key, label, Icon, descripcion } = estado;
            const esFinal = estadoActual === 'completado';
            const estaCompletado = idx < estadoIndex || (idx === estadoIndex && esFinal);
            const esActual = idx === estadoIndex && !esFinal;
            const estaPendiente = idx > estadoIndex && !esFinal;
            const timestamp = request.timeline?.[key];

            return (
              <div
                key={key}
                className={`estado-step ${
                  estaCompletado ? 'completado' :
                  esActual ? 'actual' : 'pendiente'
                }`}
              >
                <div className="estado-step-icon">
                  {estaCompletado ? (
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  ) : (
                    <Icon size={18} strokeWidth={2.5} />
                  )}
                </div>

                <div className="estado-step-content">
                  <div className="estado-step-label">
                    {label}
                    {esActual && <span className="estado-step-actual-badge">EN CURSO</span>}
                  </div>
                  {esActual && <div className="estado-step-desc">{descripcion}</div>}
                  {timestamp && (
                    <div className="estado-step-hora">
                      {timestamp.toDate
                        ? timestamp.toDate().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
                        : new Date(timestamp).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {idx < ESTADOS_FLUJO.length - 1 && (
                  <div className={`estado-step-line ${estaCompletado ? 'completado' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {request.evidencia && (
          <div className="evidencia-mostrada">
            <h5>Evidencia del trabajo</h5>
            <div className="evidencia-mostrada-fotos">
              {request.evidencia.fotos?.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Evidencia ${i + 1}`} />
                </a>
              ))}
            </div>
            <p className="evidencia-mostrada-desc">
              <strong>Descripción:</strong> {request.evidencia.descripcion}
            </p>
            {request.evidencia.materiales && (
              <p className="evidencia-mostrada-desc">
                <strong>Materiales:</strong> {request.evidencia.materiales}
              </p>
            )}
          </div>
        )}

        {/* Botón de avanzar */}
        {puedeAvanzar && (
          <button className="estado-avanzar-btn" onClick={avanzarEstado}>
            {estadoInfo.siguienteLabel}
          </button>
        )}

        {/* Mensaje de espera — solo si NO es el último paso, NO está pagado y aún no terminó */}
        {!puedeAvanzar &&
         estadoActual !== 'completado' &&
         estadoActual !== 'precio_acordado' && (
          <div className="estado-esperando">
            <Clock size={16} strokeWidth={2.5} />
            <span>
              {userType === 'tecnico' ? 'Esperando al cliente...' : 'Esperando al técnico...'}
            </span>
          </div>
        )}

        {/* Mensaje especial si está en precio_acordado y el cliente no ha pagado */}
        {estadoActual === 'precio_acordado' && !request.paymentDate && (
          <div className="estado-esperando">
            <AlertTriangle size={16} strokeWidth={2.5} />
            <span>
              {userType === 'cliente'
                ? 'Realiza el pago para continuar con el servicio'
                : 'Esperando que el cliente realice el pago...'}
            </span>
          </div>
        )}

        {estadoActual === 'completado' && (
          <div className="estado-completado-msg">
            <PartyPopper size={18} strokeWidth={2.5} />
            <span>¡Servicio completado exitosamente!</span>
          </div>
        )}
      </div>

      {mostrarEvidencia && (
        <EvidenciaTrabajo
          request={request}
          onClose={() => setMostrarEvidencia(false)}
          onComplete={onUpdate}
        />
      )}
    </>
  );
}