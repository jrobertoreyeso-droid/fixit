import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const CONFIG_NEGOCIO = {
  comisionFixit: parseFloat(import.meta.env.VITE_COMISION_FIXIT) || 0.15,
  recargoProgramado: parseFloat(import.meta.env.VITE_RECARGO_PROGRAMADO) || 15,
  recargoPocoUrgente: parseFloat(import.meta.env.VITE_RECARGO_POCO_URGENTE) || 20,
  recargoMuyUrgente: parseFloat(import.meta.env.VITE_RECARGO_MUY_URGENTE) || 25,
};

/**
 * Calcula el desglose del pago según el modelo de FixIt.
 * Modelo A (fijo):
 *   Programado (Q15):    FixIt Q5  / Técnico Q10
 *   Poco urgente (Q20):  FixIt Q7  / Técnico Q13
 *   Muy urgente (Q25):   FixIt Q10 / Técnico Q15
 */
export const calcularDesglose = (precioBase, tipoUrgencia = 'normal') => {
  const comisionBase = precioBase * CONFIG_NEGOCIO.comisionFixit;
  const tecnicoBase = precioBase - comisionBase;

  let recargo = 0;
  let fixitRecargo = 0;
  let tecnicoRecargo = 0;

  if (tipoUrgencia === 'programado') {
    recargo = CONFIG_NEGOCIO.recargoProgramado;
    fixitRecargo = 5;
    tecnicoRecargo = 10;
  } else if (tipoUrgencia === 'poco_urgente') {
    recargo = CONFIG_NEGOCIO.recargoPocoUrgente;
    fixitRecargo = 7;
    tecnicoRecargo = 13;
  } else if (tipoUrgencia === 'muy_urgente') {
    recargo = CONFIG_NEGOCIO.recargoMuyUrgente;
    fixitRecargo = 10;
    tecnicoRecargo = 15;
  }

  return {
    precioBase,
    recargo,
    totalCliente: precioBase + recargo,
    fixitTotal: comisionBase + fixitRecargo,
    tecnicoTotal: tecnicoBase + tecnicoRecargo,
    comisionBase,
    tecnicoBase,
    fixitRecargo,
    tecnicoRecargo,
  };
};