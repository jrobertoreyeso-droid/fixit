import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../firebase';
import './MapaUbicacion.css';

const DEFAULT_CENTER = { lat: 14.6349, lng: -90.5069 }; // Guatemala City
const LIBRARIES = ['places'];

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#30363d' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#161b22' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#21262d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1117' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#161b22' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a0f' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
];

const mapContainerStyle = {
  width: '100%',
  height: '320px',
  borderRadius: '12px',
};

export default function MapaUbicacion({ onUbicacionChange, ubicacionInicial }) {
  const [ubicacion, setUbicacion] = useState(ubicacionInicial || DEFAULT_CENTER);
  const [direccion, setDireccion] = useState(ubicacionInicial?.direccion || '');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const actualizarUbicacion = useCallback((lat, lng, dir = '') => {
    const nueva = { lat, lng, direccion: dir };
    setUbicacion(nueva);
    setDireccion(dir);
    if (onUbicacionChange) onUbicacionChange(nueva);
  }, [onUbicacionChange]);

  const obtenerDireccion = useCallback(async (lat, lng) => {
    if (!window.google) return '';
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      if (result.results && result.results[0]) {
        return result.results[0].formatted_address;
      }
    } catch (err) {
      console.error('Error geocoding:', err);
    }
    return '';
  }, []);

  const onMapClick = useCallback(async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setBuscando(true);
    const dir = await obtenerDireccion(lat, lng);
    actualizarUbicacion(lat, lng, dir);
    setBuscando(false);
  }, [actualizarUbicacion, obtenerDireccion]);

  const onMarkerDragEnd = useCallback(async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setBuscando(true);
    const dir = await obtenerDireccion(lat, lng);
    actualizarUbicacion(lat, lng, dir);
    setBuscando(false);
  }, [actualizarUbicacion, obtenerDireccion]);

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    setBuscando(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const dir = await obtenerDireccion(latitude, longitude);
        actualizarUbicacion(latitude, longitude, dir);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: latitude, lng: longitude });
          mapRef.current.setZoom(17);
        }
        setBuscando(false);
      },
      () => {
        setError('No pudimos obtener tu ubicación. Verifica los permisos.');
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const dir = place.formatted_address || '';
        actualizarUbicacion(lat, lng, dir);
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(17);
        }
      }
    }
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  if (loadError) return <div className="mapa-error">Error cargando Google Maps. Verifica tu API Key.</div>;
  if (!isLoaded) return <div className="mapa-cargando">Cargando mapa...</div>;

  return (
    <div className="mapa-ubicacion">
      <div className="mapa-header">
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={onPlaceChanged}
          options={{ componentRestrictions: { country: 'gt' } }}
        >
          <input
            type="text"
            className="mapa-input"
            placeholder="🔍 Busca tu dirección..."
            defaultValue={direccion}
          />
        </Autocomplete>
        <button type="button" onClick={usarMiUbicacion} className="mapa-btn-ubicacion">
          📍 Usar mi ubicación
        </button>
      </div>

      {buscando && <div className="mapa-buscando">Buscando dirección...</div>}
      {error && <div className="mapa-error-msg">{error}</div>}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={ubicacion}
        zoom={15}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker
          position={ubicacion}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
        />
      </GoogleMap>

      {direccion && (
        <div className="mapa-direccion">
          <strong>📍 Dirección:</strong> {direccion}
        </div>
      )}

      <p className="mapa-hint">
        Arrastra el pin o haz clic en el mapa para ajustar la ubicación exacta
      </p>
    </div>
  );
}