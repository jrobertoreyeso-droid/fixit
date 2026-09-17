import './TabsServicios.css';

export default function TabsServicios({ activo, onChange, contadores }) {
  const tabs = [
    { key: 'pendientes', label: 'Pendientes', icon: '🆕', color: 'amber' },
    { key: 'activos', label: 'Activos', icon: '⚡', color: 'blue' },
    { key: 'finalizados', label: 'Finalizados', icon: '✅', color: 'green' },
  ];

  return (
    <div className="tabs-servicios">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-btn ${activo === tab.key ? 'active' : ''} tab-${tab.color}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
          {contadores?.[tab.key] > 0 && (
            <span className="tab-contador">{contadores[tab.key]}</span>
          )}
        </button>
      ))}
    </div>
  );
}