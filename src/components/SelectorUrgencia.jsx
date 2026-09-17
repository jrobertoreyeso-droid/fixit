import { CONFIG_NEGOCIO } from '../firebase';
import './SelectorUrgencia.css';

const OPCIONES = [
  {
    value: 'normal',
    label: 'Servicio normal',
    icon: '🟢',
    descripcion: 'Sin recargo',
    recargo: 0,
  },
  {
    value: 'programado',
    label: 'Programado',
    icon: '📅',
    descripcion: 'Fecha y hora a futuro',
    recargo: CONFIG_NEGOCIO.recargoProgramado,
  },
  {
    value: 'poco_urgente',
    label: 'Poco urgente',
    icon: '🟡',
    descripcion: 'Lo antes posible',
    recargo: CONFIG_NEGOCIO.recargoPocoUrgente,
  },
  {
    value: 'muy_urgente',
    label: 'Muy urgente',
    icon: '🔴',
    descripcion: 'Atención inmediata',
    recargo: CONFIG_NEGOCIO.recargoMuyUrgente,
  },
];

export default function SelectorUrgencia({ valor, onChange, precioBase = 0 }) {
  const opcionActual = OPCIONES.find(o => o.value === valor) || OPCIONES[0];
  const recargo = opcionActual.recargo;
  const total = precioBase + recargo;

  return (
    <div className="selector-urgencia">
      <h3>⚡ Nivel de urgencia</h3>
      <div className="urgencia-grid">
        {OPCIONES.map((op) => (
          <button
            key={op.value}
            type="button"
            className={`urgencia-btn ${valor === op.value ? 'selected' : ''}`}
            onClick={() => onChange(op.value)}
          >
            <span className="urgencia-icon">{op.icon}</span>
            <span className="urgencia-label">{op.label}</span>
            <span className="urgencia-desc">{op.descripcion}</span>
            {op.recargo > 0 && (
              <span className="urgencia-recargo">+Q{op.recargo}</span>
            )}
          </button>
        ))}
      </div>

      {precioBase > 0 && (
        <div className="urgencia-total">
          <span>Precio del servicio:</span>
          <span>Q{precioBase.toFixed(2)}</span>
          <span>Recargo por urgencia:</span>
          <span>+Q{recargo.toFixed(2)}</span>
          <span className="total-label">Total a pagar:</span>
          <span className="total-valor">Q{total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}