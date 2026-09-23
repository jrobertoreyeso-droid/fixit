import { useState, useEffect } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import './MapaUbicacion.css';

export default function MapaUbicacion({ onUbicacionChange, ubicacionInicial }) {
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState(14.6349);
  const [lng, setLng] = useState(-90.5069);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ubicacionInicial) {
      setDireccion(ubicacionInicial.direccion || '');
      setLat(ubicacionInicial.lat || 14.6349);
      setLng(ubicacionInicial.lng || -90.5069);
    }
  }, [ubicacionInicial]);

  const handleDireccionChange = (e) => {
    const nuevaDireccion = e.target.value;
    setDireccion(nuevaDireccion);
    onUbicacionChange({ lat, lng, direccion: nuevaDireccion });
  };

  const handleLatChange = (e) => {
    const nuevoLat = parseFloat(e.target.value) || 0;
    setLat(nuevoLat);
    onUbicacionChange({ lat: nuevoLat, lng, direccion });
  };

  const handleLngChange = (e) => {
    const nuevoLng = parseFloat(e.target.value) || 0;
    setLng(nuevoLng);
    onUbicacionChange({ lat, lng: nuevoLng, direccion });
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setBuscando(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nuevaLat = pos.coords.latitude;
        const nuevoLng = pos.coords.longitude;
        setLat(nuevaLat);
        setLng(nuevoLng);
        onUbicacionChange({
          lat: nuevaLat,
          lng: nuevoLng,
          direccion: direccion || 'Ubicación detectada automáticamente'
        });
        setBuscando(false);
      },
      (err) => {
        console.error(err);
        setError('No pudimos obtener tu ubicación. Verifica los permisos del navegador.');
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="mapa-ubicacion">
      <h3>
        <MapPin size={18} strokeWidth={2.5} />
        <span>Ubicación del servicio</span>
      </h3>

      <div className="campo-direccion">
        <label>Dirección *</label>
        <div className="input-icon-wrapper">
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="mapa-input"
            placeholder="Ej: Zona 10, Guatemala"
            value={direccion}
            onChange={handleDireccionChange}
          />
        </div>
      </div>

      <div className="campo-coordenadas">
        <div>
          <label>Latitud</label>
          <input
            type="number"
            step="any"
            className="mapa-input"
            value={lat}
            onChange={handleLatChange}
          />
        </div>
        <div>
          <label>Longitud</label>
          <input
            type="number"
            step="any"
            className="mapa-input"
            value={lng}
            onChange={handleLngChange}
          />
        </div>
      </div>

      <p className="hint">Puedes ajustar las coordenadas manualmente</p>

      <button
        type="button"
        className="btn-ubicacion-actual"
        onClick={usarMiUbicacion}
        disabled={buscando}
      >
        <Navigation size={16} strokeWidth={2.5} />
        <span>{buscando ? 'Localizando...' : 'Usar mi ubicación actual'}</span>
      </button>

      {error && <p className="mapa-error">{error}</p>}
    </div>
  );
}
