import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import EvidenciaTrabajo from './EvidenciaTrabajo';
import './EstadoServicio.css';

const ESTADOS_FLUJO = [
  {
    key: 'precio_acordado',
    label: 'Precio acordado',
    icon: '✅',
    descripcion: 'El precio del servicio fue negociado',
    siguiente: 'en_camino',
    siguienteLabel: '🚗 Marcar "En camino"',
    accionTecnico: true,
  },
  {
    key: 'en_camino',
    label: 'Técnico en camino',
    icon: '🚗',
    descripcion: 'El técnico se dirige a tu domicilio',
    siguiente: 'llego',
    siguienteLabel: '📍 Marcar "Llegué al domicilio"',
    accionTecnico: true,
  },
  {
    key: 'llego',
    label: 'Técnico llegó',
    icon: '📍',
    descripcion: 'El técnico está en el domicilio',
    siguiente: 'en_proceso',
    siguienteLabel: '🔨 Marcar "Trabajo en proceso"',
    accionTecnico: true,
  },
  {
    key: 'en_proceso',
    label: 'Trabajo en proceso',
    icon: '🔨',
    descripcion: 'El técnico está realizando el trabajo',
    siguiente: 'trabajo_terminado',
    siguienteLabel: '📷 Subir evidencia y terminar',
    accionTecnico: true,
    requiereEvidencia: true,  // ⭐ Abre el modal de evidencia
  },
  {
    key: 'trabajo_terminado',
    label: 'Trabajo terminado',
    icon: '🎯',
    descripcion: 'El técnico finalizó el trabajo',
    siguiente: 'completado',
    siguienteLabel: '✅ Confirmar y liberar pago',
    accionTecnico: false,
    accionCliente: true,
  },
  {
    key: 'completado',
    label: 'Servicio completado',
    icon: '🎉',
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

    // Si requiere evidencia, abrir el modal en lugar de avanzar
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
        <h4 className="estado-titulo">📊 Estado del servicio</h4>

        <div className="estado-timeline">
          {ESTADOS_FLUJO.map((estado, idx) => {
            const estaCompletado = idx < estadoIndex;
            const esActual = idx === estadoIndex;
            const estaPendiente = idx > estadoIndex;
            const timestamp = request.timeline?.[estado.key];

            return (
              <div
                key={estado.key}
                className={`estado-step ${
                  estaCompletado ? 'completado' :
                  esActual ? 'actual' : 'pendiente'
                }`}
              >
                <div className="estado-step-icon">
                  {estaCompletado && '✓'}
                  {esActual && estado.icon}
                  {estaPendiente && idx + 1}
                </div>

                <div className="estado-step-content">
                  <div className="estado-step-label">
                    {estado.label}
                    {esActual && <span className="estado-step-actual-badge">EN CURSO</span>}
                  </div>
                  {esActual && <div className="estado-step-desc">{estado.descripcion}</div>}
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

        {/* Evidencia visible para el cliente cuando ya fue subida */}
        {request.evidencia && (userType === 'cliente' || estadoActual === 'completado') && (
          <div className="evidencia-mostrada">
            <h5>📷 Evidencia del trabajo</h5>
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

        {puedeAvanzar && (
          <button className="estado-avanzar-btn" onClick={avanzarEstado}>
            {estadoInfo.siguienteLabel}
          </button>
        )}

        {!puedeAvanzar && estadoActual !== 'completado' && (
          <p className="estado-esperando">
            {userType === 'tecnico'
              ? '⏳ Esperando al cliente...'
              : '⏳ Esperando al técnico...'}
          </p>
        )}

        {estadoActual === 'completado' && (
          <div className="estado-completado-msg">
            🎉 ¡Servicio completado exitosamente!
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