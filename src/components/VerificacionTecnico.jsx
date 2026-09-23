import { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { actualizarUsuario } from '../db';
import './VerificacionTecnico.css';

export default function VerificacionTecnico({ user, perfil, onClose, onComplete }) {
  const [dpiFrontal, setDpiFrontal] = useState(null);
  const [dpiTrasero, setDpiTrasero] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [numeroDPI, setNumeroDPI] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState(0);

  const previewFrontal = dpiFrontal ? URL.createObjectURL(dpiFrontal) : null;
  const previewTrasero = dpiTrasero ? URL.createObjectURL(dpiTrasero) : null;
  const previewSelfie = selfie ? URL.createObjectURL(selfie) : null;

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    setError('');

    if (!dpiFrontal) {
      setError('Sube la foto frontal de tu DPI');
      return;
    }
    if (!dpiTrasero) {
      setError('Sube la foto trasera de tu DPI');
      return;
    }
    if (!selfie) {
      setError('Sube una selfie sosteniendo tu DPI');
      return;
    }
    if (!numeroDPI || numeroDPI.length < 13) {
      setError('Ingresa un número de DPI válido (13 dígitos)');
      return;
    }

    setSubiendo(true);
    setProgreso(0);

    try {
      const base64Frontal = await fileToBase64(dpiFrontal);
      setProgreso(33);

      const base64Trasero = await fileToBase64(dpiTrasero);
      setProgreso(66);

      const base64Selfie = await fileToBase64(selfie);
      setProgreso(100);

      actualizarUsuario(user.id, {
        verificacion: {
          dpiFrontal: base64Frontal,
          dpiTrasero: base64Trasero,
          selfie: base64Selfie,
          numeroDPI,
          enviado: new Date().toISOString(),
          aprobado: null,
          rechazado: false,
          motivoRechazo: '',
        },
        estado_verificacion: 'pendiente',
      });

      if (onComplete) onComplete();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError('Error al procesar las imágenes: ' + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const UploadBox = ({ label, preview, onChange, id }) => (
    <div className="verif-upload-wrapper">
      <label htmlFor={id} className={`verif-upload ${preview ? 'has-image' : ''}`}>
        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          disabled={subiendo}
          style={{ display: 'none' }}
        />
        {preview ? (
          <img src={preview} alt={label} />
        ) : (
          <>
            <ImageIcon size={24} strokeWidth={2} />
            <span>{label}</span>
          </>
        )}
      </label>
      {preview && (
        <button
          type="button"
          className="verif-upload-remove"
          onClick={(e) => {
            e.preventDefault();
            onChange(null);
          }}
          disabled={subiendo}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );

  return (
    <div className="verif-overlay">
      <div className="verif-modal">
        <div className="verif-header">
          <div className="verif-header-titulo">
            <ShieldCheck size={22} strokeWidth={2.5} />
            <h3>Verificación de identidad</h3>
          </div>
          <button className="verif-cerrar" onClick={onClose} disabled={subiendo}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <p className="verif-subtitulo">
          Sube fotos claras de tu DPI. Esto ayuda a que los clientes confíen en ti.
          Solo el equipo de FixIt podrá ver estas imágenes.
        </p>

        <div className="verif-form">
          <div className="verif-seccion">
            <label className="verif-label">
              Foto frontal del DPI <span className="verif-req">*</span>
            </label>
            <UploadBox
              id="dpi-frontal"
              label="Subir foto frontal"
              preview={previewFrontal}
              onChange={setDpiFrontal}
            />
            <p className="verif-hint">Asegúrate que se lean todos los datos</p>
          </div>

          <div className="verif-seccion">
            <label className="verif-label">
              Foto trasera del DPI <span className="verif-req">*</span>
            </label>
            <UploadBox
              id="dpi-trasero"
              label="Subir foto trasera"
              preview={previewTrasero}
              onChange={setDpiTrasero}
            />
          </div>

          <div className="verif-seccion">
            <label className="verif-label">
              Selfie con tu DPI <span className="verif-req">*</span>
            </label>
            <UploadBox
              id="selfie"
              label="Subir selfie"
              preview={previewSelfie}
              onChange={setSelfie}
            />
            <p className="verif-hint">
              Sostén tu DPI junto a tu rostro para que se vean ambos
            </p>
          </div>

          <div className="verif-seccion">
            <label className="verif-label">
              Número de DPI <span className="verif-req">*</span>
            </label>
            <input
              type="text"
              className="verif-input"
              placeholder="Ej: 1234567890101"
              value={numeroDPI}
              onChange={(e) => setNumeroDPI(e.target.value.replace(/\D/g, '').slice(0, 13))}
              disabled={subiendo}
              maxLength={13}
              inputMode="numeric"
            />
            <p className="verif-hint">{numeroDPI.length}/13 dígitos</p>
          </div>

          {subiendo && (
            <div className="verif-progreso">
              <div
                className="verif-progreso-bar"
                style={{ width: `${progreso}%` }}
              />
              <span>Procesando... {progreso}%</span>
            </div>
          )}

          {error && (
            <div className="verif-error">
              <AlertCircle size={14} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          <div className="verif-botones">
            <button
              className="verif-btn-cancelar"
              onClick={onClose}
              disabled={subiendo}
            >
              Cancelar
            </button>
            <button
              className="verif-btn-enviar"
              onClick={handleSubmit}
              disabled={subiendo}
            >
              {subiendo ? (
                <>
                  <Upload size={16} strokeWidth={2.5} />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  <span>Enviar verificación</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}