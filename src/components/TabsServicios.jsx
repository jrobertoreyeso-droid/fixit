import { Inbox, Zap, CheckCircle2 } from 'lucide-react';
import './TabsServicios.css';

const TABS = [
  { key: 'pendientes', label: 'Pendientes', Icon: Inbox, color: 'amber' },
  { key: 'activos', label: 'Activos', Icon: Zap, color: 'blue' },
  { key: 'finalizados', label: 'Finalizados', Icon: CheckCircle2, color: 'green' },
];

export default function TabsServicios({ activo, onChange, contadores }) {
  return (
    <div className="tabs-servicios">
      {TABS.map((tab) => {
        const { key, label, Icon, color } = tab;
        return (
          <button
            key={key}
            className={`tab-btn ${activo === key ? 'active' : ''} tab-${color}`}
            onClick={() => onChange(key)}
          >
            <Icon size={16} strokeWidth={2.5} />
            <span className="tab-label">{label}</span>
            {contadores?.[key] > 0 && (
              <span className="tab-contador">{contadores[key]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}