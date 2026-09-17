import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Camera,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { db, storage } from '../firebase';
import './EvidenciaTrabajo.css';

export default function EvidenciaTrabajo({ request, onClose, onComplete }) {
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [materiales, setMateriales] = useState('');
  const [precioFinal, setPrecioFinal] = useState(request.precioFinal || '');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState(0);

  const handleSeleccionarFotos = (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length > 5) {
      setError('Máximo 5 fotos');
      return;
    }
    setFotos(archivos);
    setPreviews(archivos.map(f => URL.createObjectURL(f)));
    setError('');
  };

  const quitarFoto = (idx) => {
    const nuevasFotos = fotos.filter((_, i) => i !== idx);
    const nuevosPreviews = previews.filter((_, i) => i !== idx);
    setFotos(nuevasFotos);
    setPreviews(nuevosPreviews);
  };

  const handleSubmit = async () => {
    setError('');

    if (fotos.length < 1) {
      setError('Sube al menos 1 foto del trabajo terminado');
      return;
    }
    if (!descripcion.trim()) {
      setError('Describe brevemente el trabajo realizado');
      return;
    }

    setSubiendo(true);
    setProgreso(0);

    try {
      const urlsFotos = [];

      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];
        const extension = foto.name.split('.').pop();
        const path = `evidencias/${request.id}/${Date.now()}-${i}.${extension}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, foto);
        const url = await getDownloadURL(storageRef);
        urlsFotos.push(url);

        setProgreso(Math.round(((i + 1) / fotos.length) * 100));
      }

      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, {
        status: 'trabajo_terminado',
        evidencia: {
          fotos: urlsFotos,
          descripcion,
          materiales,
          precioFinal: parseFloat(precioFinal) || request.precioFinal,
          timestamp: new Date(),
        },
        [`timeline.trabajo_terminado`]: new Date(),
      });

      if (onComplete) onComplete();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError('Error al subir: ' + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="evidencia-overlay">
      <div className="evidencia-modal">
        <div className="evidencia-header">
          <div className="evidencia-header-titulo">
            <Camera size={20} strokeWidth={2.5} />
            <h3>Evidencia del trabajo</h3>
          </div>
          <button className="evidencia-cerrar" onClick={onClose} disabled={subiendo}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <p className="evidencia-subtitulo">
          Sube fotos del trabajo terminado. El cliente deberá revisarlas antes de liberar el pago.
        </p>

        <div className="evidencia-form">
          <label className="evidencia-label">
            Fotos del trabajo <span className="evidencia-req">*</span>
          </label>

          <div className="evidencia-fotos-grid">
            {previews.map((url, idx) => (
              <div key={idx} className="evidencia-foto-item">
                <img src={url} alt={`Foto ${idx + 1}`} />
                <button
                  className="evidencia-foto-eliminar"
                  onClick={() => quitarFoto(idx)}
                  disabled={subiendo}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {fotos.length < 5 && (
              <label className="evidencia-foto-add">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSeleccionarFotos}
                  disabled={subiendo}
                  style={{ display: 'none' }}
                />
                <Plus size={22} strokeWidth={2.5} />
                <span className="evidencia-foto-add-texto">Agregar foto</span>
              </label>
            )}
          </div>

          <label className="evidencia-label">
            Descripción del trabajo <span className="evidencia-req">*</span>
          </label>
          <textarea
            className="evidencia-textarea"
            placeholder="Ej: Se instalaron 3 lámparas en la sala, comedor y cocina. Todo probado y funcionando."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows="3"
            disabled={subiendo}
          />

          <label className="evidencia-label">Materiales utilizados (opcional)</label>
          <input
            type="text"
            className="evidencia-input"
            placeholder="Ej: Cables 12 AWG, 3 sockets, cinta aislante"
            value={materiales}
            onChange={(e) => setMateriales(e.target.value)}
            disabled={subiendo}
          />

          <label className="evidencia-label">Precio final (Q)</label>
          <input
            type="number"
            className="evidencia-input"
            value={precioFinal}
            onChange={(e) => setPrecioFinal(e.target.value)}
            disabled={subiendo}
          />

          {subiendo && (
            <div className="evidencia-progreso">
              <div className="evidencia-progreso-bar" style={{ width: `${progreso}%` }} />
              <span>Subiendo... {progreso}%</span>
            </div>
          )}

          {error && (
            <div className="evidencia-error">
              <AlertCircle size={14} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          <div className="evidencia-botones">
            <button
              className="evidencia-btn-cancelar"
              onClick={onClose}
              disabled={subiendo}
            >
              Cancelar
            </button>
            <button
              className="evidencia-btn-subir"
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
                  <span>Enviar evidencia</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}