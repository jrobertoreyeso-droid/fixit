import { Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { CONFIG_NEGOCIO } from '../firebase';
import './SelectorUrgencia.css';

const OPCIONES = [
  {
    value: 'normal',
    label: 'Normal',
    Icon: null,
    descripcion: 'Sin recargo',
    recargo: 0,
  },
  {
    value: 'programado',
    label: 'Programado',
    Icon: Calendar,
    descripcion: 'Fecha y hora a futuro',
    recargo: CONFIG_NEGOCIO.recargoProgramado,
  },
  {
    value: 'poco_urgente',
    label: 'Poco urgente',
    Icon: AlertCircle,
    descripcion: 'Lo antes posible',
    recargo: CONFIG_NEGOCIO.recargoPocoUrgente,
  },
  {
    value: 'muy_urgente',
    label: 'Muy urgente',
    Icon: AlertTriangle,
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
      <h3>Nivel de urgencia</h3>
      <div className="urgencia-grid">
        {OPCIONES.map((op) => {
          const { value, label, Icon, descripcion, recargo: opRecargo } = op;
          return (
            <button
              key={value}
              type="button"
              className={`urgencia-btn ${valor === value ? 'selected' : ''}`}
              onClick={() => onChange(value)}
            >
              {Icon && (
                <div className="urgencia-icon-wrapper">
                  <Icon size={20} strokeWidth={2.5} />
                </div>
              )}
              <span className="urgencia-label">{label}</span>
              <span className="urgencia-desc">{descripcion}</span>
              {opRecargo > 0 && (
                <span className="urgencia-recargo">+Q{opRecargo}</span>
              )}
            </button>
          );
        })}
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