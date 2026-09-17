import { useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import './BarraUbicacionTecnico.css';

export default function BarraUbicacionTecnico({ onUbicacionChange }) {
  const [ubicacion, setUbicacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const guardada = sessionStorage.getItem('tecnico_ubicacion');
    if (guardada) {
      try {
        const parsed = JSON.parse(guardada);
        setUbicacion(parsed);
        if (onUbicacionChange) onUbicacionChange(parsed);
      } catch (e) {
        console.error('Error parsing ubicacion guardada:', e);
      }
    }
  }, []);

  const activarUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setCargando(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nuevaUbicacion = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        };
        setUbicacion(nuevaUbicacion);
        sessionStorage.setItem('tecnico_ubicacion', JSON.stringify(nuevaUbicacion));
        if (onUbicacionChange) onUbicacionChange(nuevaUbicacion);
        setCargando(false);
      },
      (err) => {
        console.error(err);
        if (err.code === 1) {
          setError('Permiso denegado. Habilita la ubicación en tu navegador.');
        } else {
          setError('No pudimos obtener tu ubicación. Intenta de nuevo.');
        }
        setCargando(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const tiempoDesde = (ts) => {
    if (!ts) return '';
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return 'hace unos segundos';
    if (min < 60) return `hace ${min} min`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return 'hace más de un día';
  };

  return (
    <div className={`barra-ubicacion ${ubicacion ? 'activa' : 'inactiva'}`}>
      {!ubicacion ? (
        <>
          <div className="barra-ubicacion-info">
            <div className="barra-ubicacion-icon">
              <MapPin size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="barra-ubicacion-titulo">Activa tu ubicación</div>
              <div className="barra-ubicacion-sub">Para ver solicitudes cercanas a ti</div>
            </div>
          </div>
          <button
            className="barra-ubicacion-btn"
            onClick={activarUbicacion}
            disabled={cargando}
          >
            <Navigation size={16} strokeWidth={2.5} />
            <span>{cargando ? 'Localizando...' : 'Activar'}</span>
          </button>
        </>
      ) : (
        <>
          <div className="barra-ubicacion-info">
            <div className="barra-ubicacion-icon activo">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="barra-ubicacion-titulo">Ubicación activa</div>
              <div className="barra-ubicacion-sub">
                Actualizada {tiempoDesde(ubicacion.timestamp)}
              </div>
            </div>
          </div>
          <button
            className="barra-ubicacion-btn-secundario"
            onClick={activarUbicacion}
            disabled={cargando}
          >
            <RefreshCw size={14} strokeWidth={2.5} />
            <span>{cargando ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </>
      )}
      {error && (
        <div className="barra-ubicacion-error">
          <AlertCircle size={14} strokeWidth={2.5} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}