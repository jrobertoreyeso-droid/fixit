import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Clock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import './BannerVerificacion.css';

export default function BannerVerificacion({ perfil, onVerificar }) {
  const estado = perfil?.estadoVerificacion || (perfil?.verificado ? 'aprobado' : 'sin_verificar');
  const rechazado = perfil?.verificacion?.rechazado;

  // Ya está verificado → no mostrar nada
  if (estado === 'aprobado' || perfil?.verificado) {
    return null;
  }

  // Rechazado
  if (rechazado) {
    return (
      <div className="banner-verif banner-rechazado">
        <div className="banner-verif-info">
          <div className="banner-verif-icon">
            <ShieldX size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="banner-verif-titulo">Verificación rechazada</div>
            <div className="banner-verif-sub">
              {perfil?.verificacion?.motivoRechazo || 'Vuelve a intentarlo con fotos más claras'}
            </div>
          </div>
        </div>
        <button className="banner-verif-btn" onClick={onVerificar}>
          <span>Reintentar</span>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // Pendiente de aprobación
  if (estado === 'pendiente') {
    return (
      <div className="banner-verif banner-pendiente">
        <div className="banner-verif-info">
          <div className="banner-verif-icon">
            <Clock size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="banner-verif-titulo">Verificación en revisión</div>
            <div className="banner-verif-sub">
              Estamos revisando tu DPI. Puedes seguir recibiendo solicitudes.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sin verificar (por defecto)
  return (
    <div className="banner-verif banner-sin-verificar">
      <div className="banner-verif-info">
        <div className="banner-verif-icon">
          <ShieldAlert size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="banner-verif-titulo">Verifica tu identidad</div>
          <div className="banner-verif-sub">
            Los clientes confían más en técnicos verificados con DPI
          </div>
        </div>
      </div>
      <button className="banner-verif-btn" onClick={onVerificar}>
        <span>Verificar ahora</span>
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// Badge compacto para mostrar en ofertas
export function BadgeVerificacion({ perfil, size = 'small' }) {
  if (!perfil) return null;
  const verificado = perfil.verificado === true;
  const pendiente = perfil.estadoVerificacion === 'pendiente';

  if (verificado) {
    return (
      <span className={`badge-verif badge-verif-ok badge-verif-${size}`}>
        <ShieldCheck size={12} strokeWidth={2.5} />
        <span>Verificado</span>
      </span>
    );
  }

  if (pendiente) {
    return (
      <span className={`badge-verif badge-verif-pendiente badge-verif-${size}`}>
        <Clock size={12} strokeWidth={2.5} />
        <span>En revisión</span>
      </span>
    );
  }

  return (
    <span className={`badge-verif badge-verif-no badge-verif-${size}`}>
      <AlertTriangle size={12} strokeWidth={2.5} />
      <span>No verificado</span>
    </span>
  );
}