import { getUsuarios, saveUsuarios } from '../db';

/**
 * Inicializa la base de datos local con usuarios de prueba
 * si el almacenamiento está vacío.
 */
export const seedInitialData = () => {
  const usuariosActuales = getUsuarios();

  // Si ya hay usuarios registrados, no hacemos nada para evitar duplicados
  if (usuariosActuales && usuariosActuales.length > 0) {
    return;
  }

  const usuariosPrueba = [
    {
      id: 'user-cliente-test',
      email: 'cliente@test.com',
      password: '123456',
      nombre: 'Cliente Test',
      telefono: '12345678',
      tipo: 'cliente',
      verificado: true,
      estado_verificacion: 'aprobado',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-tecnico-test',
      email: 'tecnico@test.com',
      password: '123456',
      nombre: 'Técnico Test',
      telefono: '12345678',
      tipo: 'tecnico',
      verificado: true,
      estado_verificacion: 'aprobado',
      createdAt: new Date().toISOString(),
    },
  ];

  saveUsuarios(usuariosPrueba);
  console.log('Datos de prueba inicializados correctamente');
};
