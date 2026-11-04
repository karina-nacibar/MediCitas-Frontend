<script setup>
import { ref } from 'vue'
import api from './services/api'

const correo = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)
const recordar = ref(true)

const registro = ref({
  nombres: '',
  apellidos: '',
  documento: '',
  prefijo: '+57',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
  aceptaTerminos: false
})

const registroCargando = ref(false)
const mostrarContrasenaRegistro = ref(false)

const mensaje = ref('')
const tipoMensaje = ref('error')
const cargando = ref(false)
const vistaActual = ref('login')
const usuarioActual = ref(null)

const medicos = ref([])
const cargandoMedicos = ref(false)
const errorMedicos = ref('')

const procesandoEstadoMedico = ref(null)

async function cambiarEstadoMedico(medico) {
  const estaActivo = medico.estado === 'activo'

  const nuevoEstado = estaActivo ? 'inactivo' : 'activo'

  const accion = estaActivo ? 'desactivar' : 'activar'

  const confirmar = window.confirm(
    `¿Estás segura de que deseas ${accion} al médico ${medico.nombres} ${medico.apellidos}?`
  )

  if (!confirmar) return

  procesandoEstadoMedico.value = medico.id_medico

  try {
    const respuesta = await api.patch(
      `/medicos/${medico.id_medico}/estado`,
      { estado: nuevoEstado }
    )

    medico.estado = respuesta.data.medico?.estado || nuevoEstado

    mensajeMedicoAdmin.value =
      `El médico se ha ${accion === 'desactivar' ? 'desactivado' : 'activado'} correctamente.`

    errorMedicoAdmin.value = ''

  } catch (error) {
    errorMedicoAdmin.value =
      error.response?.data?.mensaje ||
      `No fue posible ${accion} al médico. Inténtalo nuevamente.`

    mensajeMedicoAdmin.value = ''

  } finally {
    procesandoEstadoMedico.value = null
  }
}

const especialidades = ref([])

const nuevoMedico = ref({
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  id_especialidad: '',
  contrasena: ''
})


const cargandoEspecialidades = ref(false)
const guardandoMedico = ref(false)
const mensajeMedicoAdmin = ref('')
const errorMedicoAdmin = ref('')

const horariosMedico = ref([])

const nuevoHorario = ref({
  id_medico: '',
  dias_semana: [],
  hora_inicio: '08:00',
  hora_fin: '12:00',
  duracion_cita: 30
})

const cargandoHorarios = ref(false)
const guardandoHorario = ref(false)
const mensajeHorario = ref('')
const errorHorario = ref('')

const horarioEditando = ref(null)

// Variables para la agenda personal del médico
const miAgenda = ref([])
const cargandoMiAgenda = ref(false)
const errorMiAgenda = ref('')

async function abrirHorariosAdmin() {
  vistaActual.value = 'horarios-admin'
  errorHorario.value = ''
  mensajeHorario.value = ''

  if (medicos.value.length === 0) {
    await abrirSeccion('medicos')

    vistaActual.value = 'horarios-admin'
  }
}

async function cargarHorariosMedico() {
  const idMedico = nuevoHorario.value.id_medico

  if (!idMedico) {
    horariosMedico.value = []
    return
  }

  cargandoHorarios.value = true
  errorHorario.value = ''
  mensajeHorario.value = ''

  try {
    const respuesta = await api.get(`/medicos/${idMedico}/horarios`)

    horariosMedico.value = respuesta.data

  } catch (error) {
    console.error('Error al cargar horarios:', error)

    errorHorario.value =
      error.response?.data?.mensaje ||
      'No fue posible cargar los horarios del médico.'

    } finally {
    cargandoHorarios.value = false
  }
}

// CARGAR LA AGENDA PERSONAL DEL MÉDICO
async function cargarMiAgenda() {
  cargandoMiAgenda.value = true
  errorMiAgenda.value = ''
  miAgenda.value = []

  try {
    const respuesta = await api.get('/medico/mi-agenda')

    console.log('RESPUESTA COMPLETA:', respuesta)
    console.log('DATOS RECIBIDOS:', respuesta.data)

    miAgenda.value = respuesta.data

    console.log('MI AGENDA GUARDADA:', miAgenda.value)
    console.log('CANTIDAD DE HORARIOS:', miAgenda.value.length)

  } catch (error) {
    console.error('Error al cargar mi agenda:', error)

    errorMiAgenda.value =
      error.response?.data?.mensaje ||
      'No fue posible consultar tu agenda médica.'

  } finally {
    cargandoMiAgenda.value = false
  }
}
async function registrarHorario() {
  const idMedico = nuevoHorario.value.id_medico

  if (!idMedico) {
    errorHorario.value = 'Debes seleccionar un médico.'
    return
  }

  if (nuevoHorario.value.dias_semana.length === 0) {
    errorHorario.value = 'Debes seleccionar al menos un día.'
    return
  }

  guardandoHorario.value = true
  errorHorario.value = ''
  mensajeHorario.value = ''

  try {
    for (const dia of nuevoHorario.value.dias_semana) {
      await api.post(`/medicos/${idMedico}/horarios`, {
        dia_semana: dia,
        hora_inicio: nuevoHorario.value.hora_inicio,
        hora_fin: nuevoHorario.value.hora_fin,
        duracion_cita: Number(nuevoHorario.value.duracion_cita)
      })
    }

    mensajeHorario.value = 'Los horarios se registraron correctamente.'

    await cargarHorariosMedico()

    nuevoHorario.value.dias_semana = []

  } catch (error) {
    console.error('Error al registrar horario:', error)

    errorHorario.value =
      error.response?.data?.mensaje ||
      'No fue posible registrar los horarios.'

    await cargarHorariosMedico()

  } finally {
    guardandoHorario.value = false
  }
}

function prepararEdicionHorario(horario) {
  horarioEditando.value = {
    id_horario: horario.id_horario,
    dia_semana: Number(horario.dia_semana),
    hora_inicio: String(horario.hora_inicio).slice(0, 5),
    hora_fin: String(horario.hora_fin).slice(0, 5),
    duracion_cita: Number(horario.duracion_cita),
    activo: horario.activo
  }

  errorHorario.value = ''
  mensajeHorario.value = ''
}

function cancelarEdicionHorario() {
  horarioEditando.value = null
}

async function actualizarHorario() {
  if (!horarioEditando.value) return

  guardandoEdicionHorario.value = true
  errorHorario.value = ''
  mensajeHorario.value = ''

  try {
    const idHorario = horarioEditando.value.id_horario

    await api.patch(`/horarios/${idHorario}`, {
      dia_semana: horarioEditando.value.dia_semana,
      hora_inicio: horarioEditando.value.hora_inicio,
      hora_fin: horarioEditando.value.hora_fin,
      duracion_cita: Number(horarioEditando.value.duracion_cita),
      activo: horarioEditando.value.activo
    })

    mensajeHorario.value = 'El horario se actualizó correctamente.'

    horarioEditando.value = null

    await cargarHorariosMedico()

  } catch (error) {
    console.error('Error al actualizar horario:', error)

    errorHorario.value =
      error.response?.data?.mensaje ||
      'No fue posible actualizar el horario.'

  } finally {
    guardandoEdicionHorario.value = false
  }
}

const disponibilidad = ref([])
const cargandoDisponibilidad = ref(false)
const errorDisponibilidad = ref('')

const citas = ref([])
const cargandoCitas = ref(false)
const errorCitas = ref('')

const nuevaCita = ref({
  id_paciente: '',
  id_medico: '',
  fecha: '',
  hora: '',
  motivo: ''
})

const mensajeCita = ref('');
const errorCita = ref('');
// GESTIÓN DE PACIENTES - RECEPCIONISTA

const pacientes = ref([])
const cargandoPacientes = ref(false)
const errorPacientes = ref('')
const mensajePacientes = ref('')

const terminoBusqueda = ref('')
const buscandoPacientes = ref(false)

const nuevoPaciente = ref({
  nombres: '',
  apellidos: '',
  documento: '',
  correo: '',
  telefono: ''
})

const guardandoPaciente = ref(false)
const mostrarFormularioPaciente = ref(false)
// FORMULARIO PARA REGISTRAR CITAS
const mostrarFormularioCita = ref(false)
const guardandoCita = ref(false)
const mensajeCitas = ref('')
const errorRegistroCita = ref('')

const medicosDisponibles = medicos
const pacientesDisponibles = pacientes
const horariosDisponibles = disponibilidad

const cargandoCita = ref(false);

async function iniciarSesion() {
  mensaje.value = ''
  tipoMensaje.value = 'error'

  if (!correo.value.trim() || !contrasena.value) {
    mensaje.value = 'Ingresa tu correo electrónico y contraseña.'
    return
  }

  cargando.value = true

  try {
    const respuesta = await api.post('/auth/login', {
      correo: correo.value.trim().toLowerCase(),
      contrasena: contrasena.value
    })

    const { token, usuario } = respuesta.data

    usuarioActual.value = usuario

    const almacenamiento = recordar.value
      ? localStorage
      : sessionStorage

    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')

    almacenamiento.setItem('token', token)
    almacenamiento.setItem('usuario', JSON.stringify(usuario))

    mensaje.value = `¡Bienvenido/a, ${usuario.nombre}! Tu inicio de sesión fue exitoso.`
    tipoMensaje.value = 'info'

    switch (usuario.rol) {
      case 'paciente':
        vistaActual.value = 'inicio'
        break

      case 'administrador':
        vistaActual.value = 'administrador'
        console.log('ROL DEL USUARIO:', usuario.rol)
        console.log('VISTA ACTUAL:', vistaActual.value)
        break
        
 
      case 'medico':
        vistaActual.value = 'medico'
        break

      case 'recepcionista':
        vistaActual.value = 'recepcionista'
        break

      default:
        mensaje.value = 'El rol de usuario no está reconocido.'
        tipoMensaje.value = 'error'
        cerrarSesion()
        return
    }

    contrasena.value = ''

  } catch (error) {
    if (error.response?.status === 401) {
      mensaje.value = 'El correo o la contraseña son incorrectos.'
    } else if (error.response?.status === 400) {
      mensaje.value =
        error.response.data?.mensaje ||
        'Verifica los datos ingresados.'
    } else {
      mensaje.value =
        error.response?.data?.mensaje ||
        'No se pudo conectar con el servidor. Verifica que el backend esté funcionando.'
    }

    tipoMensaje.value = 'error'

  } finally {
    cargando.value = false
  }
}

function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('usuario')

  usuarioActual.value = null
  vistaActual.value = 'login'
  mensaje.value = ''
  contrasena.value = ''
}

async function abrirSeccion(seccion) {
  mensaje.value = ''

  if (seccion === 'medicos') {
    const esAdministrador = usuarioActual.value?.rol === 'administrador'

    vistaActual.value = esAdministrador
      ? 'medicos-admin'
      : 'medicos'

    cargandoMedicos.value = true
    errorMedicos.value = ''

    try {
      const respuesta = await api.get('/medicos')

      medicos.value = Array.isArray(respuesta.data)
        ? respuesta.data
        : []

    } catch (error) {
      errorMedicos.value =
        error.response?.data?.mensaje ||
        'No fue posible cargar los médicos.'

    } finally {
      cargandoMedicos.value = false
    }

    if (esAdministrador) {
      await cargarEspecialidades()
    }

    return
  }

  if (seccion === 'citas') {
    vistaActual.value = 'citas'
    cargandoCitas.value = true
    errorCitas.value = ''

    try {
      const respuesta = await api.get('/citas')

      citas.value = Array.isArray(respuesta.data)
        ? respuesta.data
        : []

    } catch (error) {
      errorCitas.value =
        error.response?.data?.mensaje ||
        'No fue posible cargar las citas.'

    } finally {
      cargandoCitas.value = false
    }

    return
  }

  if (seccion === 'pacientes') {
  vistaActual.value = 'pacientes'
  terminoBusqueda.value = ''
  await cargarPacientes()
  return
}

if (seccion === 'perfil') {
  vistaActual.value = 'perfil'
}
}

// CONSULTAR TODOS LOS PACIENTES
async function cargarPacientes() {
  cargandoPacientes.value = true
  errorPacientes.value = ''

  try {
    const respuesta = await api.get('/pacientes')
    pacientes.value = respuesta.data.pacientes || respuesta.data
  } catch (error) {
    errorPacientes.value =
      error.response?.data?.mensaje || 'No fue posible cargar los pacientes.'
  } finally {
    cargandoPacientes.value = false
  }
}

const cargarMedicosParaCita = async () => {
    try {
        cargandoMedicos.value = true;
        errorMedicos.value = '';

        const respuesta = await api.get('/medicos');

        medicos.value = Array.isArray(respuesta.data)
            ? respuesta.data
            : [];

    } catch (error) {
        console.error('Error cargando médicos para la cita:', error);

        errorMedicos.value =
            error.response?.data?.mensaje ||
            'No fue posible cargar los médicos.';
    } finally {
        cargandoMedicos.value = false;
    }
};

async function buscarPacientes() {
  buscandoPacientes.value = true
  errorPacientes.value = ''

  try {
    const respuesta = await api.get('/pacientes/buscar', {
      params: {
        termino: terminoBusqueda.value
      }
    })

    pacientes.value = respuesta.data.pacientes || respuesta.data
  } catch (error) {
    errorPacientes.value =
      error.response?.data?.mensaje || 'No fue posible realizar la búsqueda.'
  } finally {
    buscandoPacientes.value = false
  }
}

// REGISTRAR UN PACIENTE DESDE RECEPCIÓN
async function registrarPacienteRecepcion() {
  guardandoPaciente.value = true
  mensajePacientes.value = ''
  errorPacientes.value = ''

  try {
    await api.post('/pacientes', nuevoPaciente.value)

    mensajePacientes.value = 'Paciente registrado correctamente.'

    nuevoPaciente.value = {
      nombres: '',
      apellidos: '',
      documento: '',
      correo: '',
      telefono: ''
    }

    mostrarFormularioPaciente.value = false

    await cargarPacientes()
  } catch (error) {
    errorPacientes.value =
      error.response?.data?.mensaje || 'No fue posible registrar el paciente.'
  } finally {
    guardandoPaciente.value = false
  }
}

async function cargarEspecialidades() {
  cargandoEspecialidades.value = true
  errorMedicoAdmin.value = ''

  try {
    const respuesta = await api.get('/especialidades')

    especialidades.value = Array.isArray(respuesta.data)
      ? respuesta.data
      : []

  } catch (error) {
    console.error('Error al cargar especialidades:', error)

    errorMedicoAdmin.value =
      error.response?.data?.mensaje ||
      'No fue posible cargar las especialidades.'

  } finally {
    cargandoEspecialidades.value = false
  }
}

async function registrarMedico() {
  guardandoMedico.value = true
  mensajeMedicoAdmin.value = ''
  errorMedicoAdmin.value = ''

  try {
    const respuesta = await api.post('/medicos', {
      nombres: nuevoMedico.value.nombres.trim(),
      apellidos: nuevoMedico.value.apellidos.trim(),
      correo: nuevoMedico.value.correo.trim(),
      telefono: nuevoMedico.value.telefono.trim(),
      id_especialidad: nuevoMedico.value.id_especialidad,
      contrasena: nuevoMedico.value.contrasena
    })

    mensajeMedicoAdmin.value =
      respuesta.data.mensaje || 'Médico registrado correctamente.'

    nuevoMedico.value = {
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      id_especialidad: '',
      contrasena: ''
    }

    const respuestaMedicos = await api.get('/medicos')

    medicos.value = Array.isArray(respuestaMedicos.data)
      ? respuestaMedicos.data
      : []

  } catch (error) {
    console.error('Error al registrar médico:', error)

    errorMedicoAdmin.value =
      error.response?.data?.mensaje ||
      'No fue posible registrar el médico. Inténtalo nuevamente.'
  } finally {
    guardandoMedico.value = false
  }
}

function crearCuenta() {
  mensaje.value = ''
  tipoMensaje.value = 'error'

  registro.value = {
  nombres: '',
  apellidos: '',
  documento: '',
  prefijo: '+57',
  correo: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
  aceptaTerminos: false
}

  mostrarContrasenaRegistro.value = false
  vistaActual.value = 'registro'
}

async function registrarPaciente() {
  mensaje.value = ''
  tipoMensaje.value = 'error'

  const datos = registro.value

  // 1. Validar campos obligatorios
  if (
    !datos.nombres.trim() ||
    !datos.apellidos.trim() ||
    !datos.documento.trim() ||
    !datos.correo.trim() ||
    !datos.telefono.trim() ||
    !datos.contrasena ||
    !datos.confirmarContrasena
  ) {
    mensaje.value = 'Todos los campos son obligatorios. Completa la información.'
    return
  }

  // 2. Validar nombres y apellidos
  const expresionNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

  if (!expresionNombre.test(datos.nombres.trim())) {
    mensaje.value = 'El nombre solo debe contener letras y espacios.'
    return
  }

  if (!expresionNombre.test(datos.apellidos.trim())) {
    mensaje.value = 'Los apellidos solo deben contener letras y espacios.'
    return
  }

  // 3. Validar documento
  if (!/^\d{6,15}$/.test(datos.documento.trim())) {
    mensaje.value = 'El documento debe contener entre 6 y 15 números.'
    return
  }

  // 4. Validar teléfono
  const telefono = datos.telefono.replace(/\s/g, '')

  if (!/^\d{7,15}$/.test(telefono)) {
    mensaje.value = 'Ingresa un teléfono válido de entre 7 y 15 números.'
    return
  }

  // 5. Validar correo
  const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!expresionCorreo.test(datos.correo.trim())) {
    mensaje.value = 'Ingresa un correo electrónico válido.'
    return
  }

  // 6. Validar contraseña
  if (datos.contrasena.length < 8) {
    mensaje.value = 'La contraseña debe tener mínimo 8 caracteres.'
    return
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(datos.contrasena)) {
    mensaje.value = 'La contraseña debe contener al menos un símbolo.'
    return
  }

  // 7. Confirmar contraseña
  if (datos.contrasena !== datos.confirmarContrasena) {
    mensaje.value = 'Las contraseñas no coinciden. Verifica la confirmación.'
    return
  }

  // 8. Aceptar términos
  if (!datos.aceptaTerminos) {
    mensaje.value = 'Debes aceptar los términos y condiciones para continuar.'
    return
  }

  registroCargando.value = true

  try {
    const correoRegistrado = datos.correo.trim().toLowerCase()

    const respuesta = await api.post('/auth/registro', {
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      documento: datos.documento.trim(),
      correo: correoRegistrado,
      telefono: `${datos.prefijo} ${telefono}`,
      contrasena: datos.contrasena
    })

    correo.value = correoRegistrado

    // Reiniciar todos los campos del formulario
    registro.value = {
      nombres: '',
      apellidos: '',
      documento: '',
      prefijo: '+57',
      correo: '',
      telefono: '',
      contrasena: '',
      confirmarContrasena: '',
      aceptaTerminos: false
    }

    mostrarContrasenaRegistro.value = false
    vistaActual.value = 'login'

    mensaje.value =
      respuesta.data.mensaje || 'Cuenta creada exitosamente.'

    tipoMensaje.value = 'info'

  } catch (error) {
    mensaje.value =
      error.response?.data?.mensaje ||
      'No fue posible crear la cuenta. Inténtalo nuevamente.'

    tipoMensaje.value = 'error'

  } finally {
    registroCargando.value = false
  }
}

function recuperarContrasena() {
  mensaje.value =
    'La recuperación de contraseña está pendiente de implementar.'

  tipoMensaje.value = 'info'
}

const cargarDisponibilidad = async () => {
    disponibilidad.value = [];
    nuevaCita.value.hora = '';
    errorDisponibilidad.value = '';

    const idMedico = nuevaCita.value.id_medico;
    const fecha = nuevaCita.value.fecha;

    if (!idMedico || !fecha) {
        return;
    }

    try {
        cargandoDisponibilidad.value = true;

        const respuesta = await api.get(
            `/medicos/${idMedico}/disponibilidad`,
            {
                params: { fecha }
            }
        );

        disponibilidad.value = (respuesta.data.disponibilidad || [])
            .map(item => {
                const hora = typeof item === 'string'
                    ? item
                    : item.hora || item.hora_inicio || item.hora_disponible;

                return hora ? hora.substring(0, 5) : null;
            })
            .filter(Boolean);

    } catch (error) {
        console.error('Error consultando disponibilidad:', error);

        errorDisponibilidad.value =
            error.response?.data?.mensaje ||
            'No fue posible consultar los horarios disponibles.';
    } finally {
        cargandoDisponibilidad.value = false;
    }
};

const abrirFormularioCita = async () => {
    mostrarFormularioCita.value = true;

    mensajeCita.value = '';
    errorCita.value = '';

    nuevaCita.value = {
        id_paciente: '',
        id_medico: '',
        fecha: '',
        hora: '',
        motivo: ''
    };

    disponibilidad.value = [];

    await Promise.all([
        cargarPacientes(),
        cargarMedicosParaCita()
    ]);
};

const cargarCitas = async () => {
    try {
        cargandoCitas.value = true;
        errorCitas.value = '';

        const respuesta = await api.get('/citas');

        citas.value = respuesta.data;

    } catch (error) {
        console.error('Error cargando citas:', error);

        errorCitas.value =
            error.response?.data?.mensaje ||
            'No fue posible cargar las citas.';
    } finally {
        cargandoCitas.value = false;
    }
};

// ACTUALIZAR ESTADO DE UNA CITA
const actualizarEstadoCita = async (idCita, estado) => {
    const accion = estado === 'Confirmada' ? 'confirmar' : 'cancelar';

    const mensajeConfirmacion = estado === 'Confirmada'
        ? '¿Deseas confirmar esta cita?'
        : '¿Estás segura de que deseas cancelar esta cita?';

    if (!window.confirm(mensajeConfirmacion)) {
        return;
    }

    try {
        const respuesta = await api.patch(
            `/citas/${idCita}/estado`,
            { estado }
        );

        alert(respuesta.data.mensaje);

        await cargarCitas();

    } catch (error) {
        console.error(`Error al ${accion} la cita:`, error);

        alert(
            error.response?.data?.mensaje ||
            `No fue posible ${accion} la cita.`
        );
    }
};

// CONFIRMAR CITA
const confirmarCita = (idCita) => {
    return actualizarEstadoCita(idCita, 'Confirmada');
};

// CANCELAR CITA
const cancelarCita = (idCita) => {
    return actualizarEstadoCita(idCita, 'Cancelada');
};

const agendarCita = async () => {
    mensajeCita.value = '';
    errorCita.value = '';

    const esRecepcionista = usuarioActual.value?.rol === 'recepcionista';

    if (
        (esRecepcionista && !nuevaCita.value.id_paciente) ||
        !nuevaCita.value.id_medico ||
        !nuevaCita.value.fecha ||
        !nuevaCita.value.hora ||
        !nuevaCita.value.motivo.trim()
    ) {
        errorCita.value = esRecepcionista
            ? 'Selecciona un paciente, un médico, una fecha, un horario y el motivo de la consulta.'
            : 'Completa todos los campos para agendar tu cita.';
        return;
    }

    try {
        cargandoCita.value = true;

        const datosCita = {
            id_medico: Number(nuevaCita.value.id_medico),
            fecha: nuevaCita.value.fecha,
            hora: nuevaCita.value.hora,
            motivo: nuevaCita.value.motivo.trim()
        };

        if (esRecepcionista) {
            datosCita.id_paciente = Number(nuevaCita.value.id_paciente);
        }

        const respuesta = await api.post('/citas', datosCita);

        mensajeCita.value = respuesta.data.mensaje;

        nuevaCita.value = {
            id_paciente: '',
            id_medico: '',
            fecha: '',
            hora: '',
            motivo: ''
        };

        await cargarCitas();

        if (esRecepcionista) {
            mostrarFormularioCita.value = false;
        }

    } catch (error) {
        console.error('Error registrando cita:', error);

        errorCita.value =
            error.response?.data?.mensaje ||
            'No fue posible agendar la cita. Inténtalo nuevamente.';
    } finally {
        cargandoCita.value = false;
    }
};

</script>


  <template>
    <main class="pagina">
      <div class="fondo fondo-uno"></div>
      <div class="fondo fondo-dos"></div>

      <template v-if="vistaActual === 'login'">
    <section class="contenedor">
        <!-- Panel del formulario -->
        <div class="panel-formulario">
          <div class="contenido-formulario">
            <header class="encabezado">

              <h1>Bienvenido a MediCitas</h1>
              <p>Gestiona tus citas médicas de forma sencilla y segura.</p>
            </header>

            <div
              v-if="mensaje"
              class="aviso"
              :class="{ 'aviso-info': tipoMensaje === 'info' }"
              role="status"
            >
              <span class="material-symbols-outlined">
                {{ tipoMensaje === 'info' ? 'info' : 'error' }}
              </span>

              <div class="aviso-contenido">
                <strong>
                  {{ tipoMensaje === 'info' ? 'Información' : 'Error de acceso' }}
                </strong>
                <p>{{ mensaje }}</p>
              </div>

              <button
                class="cerrar-aviso"
                type="button"
                aria-label="Cerrar aviso"
                @click="mensaje = ''"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form class="formulario" @submit.prevent="iniciarSesion">
              <div class="campo">
                <label for="correo">Correo electrónico</label>

                <div class="entrada">
                  <span class="material-symbols-outlined">mail</span>

                  <input
                    id="correo"
                    v-model.trim="correo"
                    type="email"
                    placeholder="ejemplo@paciente.com"
                    autocomplete="email"
                    required
                  />
                </div>
              </div>

              <div class="campo">
                <label for="contrasena">Contraseña</label>

                <div class="entrada">
                  <span class="material-symbols-outlined">lock</span>

                  <input
                    id="contrasena"
                    v-model="contrasena"
                    :type="mostrarContrasena ? 'text' : 'password'"
                    placeholder="Ingresa tu contraseña"
                    autocomplete="current-password"
                    required
                  />

                  <button
                    class="ver-contrasena"
                    type="button"
                    :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click="mostrarContrasena = !mostrarContrasena"
                  >
                    <span class="material-symbols-outlined">
                      {{ mostrarContrasena ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
              </div>

              <div class="opciones">
                <label class="recordar">
                  <input v-model="recordar" type="checkbox" />
                  <span>Recordarme</span>
                </label>

                <button
                  type="button"
                  class="enlace"
                  @click="recuperarContrasena"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button class="boton-principal"
    type="submit"
    :disabled="cargando"
  >
    <span>{{ cargando ? 'Verificando...' : 'Iniciar sesión' }}</span>

    <span class="material-symbols-outlined">
      {{ cargando ? 'progress_activity' : 'arrow_forward' }}
    </span>
            </button>
            </form>
          </div>

          <footer class="pie-formulario">
            <p>¿No tienes una cuenta?</p>

            <button
              class="boton-registro"
              type="button"
              @click="crearCuenta"
            >
              <span class="material-symbols-outlined">person_add</span>
              Crear cuenta paciente
            </button>
          </footer>
        </div>

        <!-- Panel institucional -->
        <aside class="panel-institucional">
          <div class="decoracion decoracion-uno"></div>
          <div class="decoracion decoracion-dos"></div>

          <div class="contenido-institucional">
            <div class="insignia">
              <span class="punto-verde"></span>
              PORTAL DE SALUD PRIVADA
            </div>

            <div class="presentacion">
              <h2>Excelencia y cuidado a tu alcance</h2>

              <p>
                Conectamos a pacientes y especialistas de primer nivel en un
                entorno hospitalario digital confidencial y eficiente.
              </p>
            </div>

            <div class="beneficios">
              <article class="beneficio">
                <div class="icono-beneficio">
                  <span class="material-symbols-outlined">speed</span>
                </div>

                <div>
                  <h3>Atención médica ágil</h3>
                  <p>
                    Agenda consultas presenciales o telemáticas en menos de
                    2 minutos.
                  </p>
                </div>
              </article>

              <article class="beneficio">
                <div class="icono-beneficio">
                  <span class="material-symbols-outlined">
                    notifications_active
                  </span>
                </div>

                <div>
                  <h3>Historial y recordatorios 24/7</h3>
                  <p>
                    Accede a tu información médica y consulta tus recordatorios.
                  </p>
                </div>
              </article>

              <article class="beneficio">
                <div class="icono-beneficio">
                  <span class="material-symbols-outlined">verified_user</span>
                </div>

                <div>
                  <h3>Atención especializada</h3>
                  <p>
                    Encuentra profesionales de distintas especialidades médicas.
                  </p>
                </div>
              </article>
            </div>
          </div>

          <div class="zona-inferior">
            <div class="tarjeta-doctora">
              <div class="datos-doctora">
                <div class="avatar">
                  <span class="material-symbols-outlined">medical_services</span>
                </div>

                <div>
                  <strong>Equipo MediCitas</strong>
                  <span>Coordinación médica</span>
                </div>
              </div>

              <div class="sello-seguridad">
                <span class="material-symbols-outlined">lock</span>
                Conexión segura
              </div>
            </div>

            <div class="pie-institucional">
              <span>© 2026 MediCitas</span>

              <div>
                <a href="#privacidad" @click.prevent="mensaje = 'Información de privacidad pendiente de integrar.'">
                  Privacidad
                </a>
                <span>·</span>
                <a href="#soporte" @click.prevent="mensaje = 'El módulo de soporte está pendiente de integrar.'">
                  Soporte
                </a>
              </div>
            </div>
          </div>
        </aside>
      </section>
      </template>
      

<template v-else-if="vistaActual === 'registro'">
  <section class="registro-pagina">

    <!-- Tarjeta principal -->
    <div class="registro-contenedor">

      <!-- PANEL IZQUIERDO -->
      <aside class="registro-panel-lateral">

        <div class="registro-marca">
          <div class="registro-logo">
            <span class="material-symbols-outlined">health_and_safety</span>
          </div>
          <div>
            <strong>MediCitas</strong>
            <span>CLINICAL SUITE</span>
          </div>
        </div>

        <div class="registro-presentacion">
          <span class="registro-insignia">
            <span></span>
            PORTAL UNIFICADO
          </span>

          <h1>Atención médica de alta precisión.</h1>

          <p>
            Únete a MediCitas y gestiona tu atención médica
            desde un espacio sencillo, organizado y accesible.
          </p>
        </div>

        <!-- Tarjeta informativa -->
        <div class="registro-tarjeta-info">
          <div class="registro-info-icono">
            <span class="material-symbols-outlined">calendar_month</span>
          </div>
          <div>
            <strong>Tu salud, mejor organizada</strong>
            <p>
              Administra tus citas y encuentra profesionales
              de diferentes especialidades.
            </p>
          </div>
        </div>

        <div class="registro-seguridad">
          <span class="material-symbols-outlined">verified_user</span>
          <div>
            <strong>Tu cuenta personal</strong>
            <p>Registra tus datos para comenzar a utilizar MediCitas.</p>
          </div>
        </div>

        <div class="registro-pie-lateral">
          © 2026 MediCitas
        </div>
      </aside>

      <!-- PANEL DERECHO: FORMULARIO -->
      <div class="registro-formulario-panel">

        <header class="registro-encabezado">
          <div>
            <span class="registro-paso">PASO 1 DE 2</span>
            <h2>Crear nueva cuenta</h2>
            <p>
              Completa tus datos para habilitar tu acceso
              al sistema MediCitas.
            </p>
          </div>
        </header>

        <!-- Mensajes -->
        <div
          v-if="mensaje"
          class="registro-aviso"
          :class="{ 'registro-aviso-info': tipoMensaje === 'info' }"
          role="status"
        >
          <span class="material-symbols-outlined">
            {{ tipoMensaje === 'info' ? 'check_circle' : 'error' }}
          </span>
          <p>{{ mensaje }}</p>
          <button type="button" @click="mensaje = ''">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form
          class="registro-formulario"
          @submit.prevent="registrarPaciente"
        >

          <!-- PERFIL -->
          <div class="registro-grupo">
            <label class="registro-label">
              Seleccione su perfil en la plataforma
            </label>

            <div class="registro-perfil-seleccionado">
              <div class="registro-perfil-icono">
                <span class="material-symbols-outlined">personal_injury</span>
              </div>

              <div>
                <strong>Paciente</strong>
                <p>
                  Agendamiento y gestión de tus citas médicas.
                </p>
              </div>

              <span class="material-symbols-outlined registro-check">
                check_circle
              </span>
            </div>
          </div>

          <!-- NOMBRES Y TELÉFONO -->
          <div class="registro-grid">

            <div class="registro-grupo">
              <label class="registro-label" for="reg-nombres">
                Nombres
              </label>
              <div class="registro-input">
                <span class="material-symbols-outlined">badge</span>
                <input
                  id="reg-nombres"
                  v-model.trim="registro.nombres"
                  type="text"
                  placeholder="Ej. Mariana"
                  autocomplete="given-name"
                  required
                />
              </div>
            </div>

            <div class="registro-grupo">
              <label class="registro-label" for="reg-apellidos">
                Apellidos
              </label>
              <div class="registro-input">
                <span class="material-symbols-outlined">person</span>
                <input
                  id="reg-apellidos"
                  v-model.trim="registro.apellidos"
                  type="text"
                  placeholder="Ej. Restrepo Gómez"
                  autocomplete="family-name"
                  required
                />
              </div>
            </div>

            <div class="registro-grupo">
              <label class="registro-label" for="reg-documento">
                Documento de identidad
              </label>
              <div class="registro-input">
                <span class="material-symbols-outlined">id_card</span>
                <input
                  id="reg-documento"
                  v-model.trim="registro.documento"
                  type="text"
                  placeholder="Número de documento"
                  required
                />
              </div>
            </div>

            <div class="registro-grupo">
              <label class="registro-label" for="reg-telefono">
                Teléfono móvil
              </label>
              <div class="registro-telefono">
                <select
                  v-model="registro.prefijo"
                  aria-label="Prefijo telefónico"
                >
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+52">🇲🇽 +52</option>
                </select>

                <input
                  id="reg-telefono"
                  v-model.trim="registro.telefono"
                  type="tel"
                  placeholder="300 123 4567"
                  autocomplete="tel-national"
                  required
                />
              </div>
            </div>

          </div>

          <!-- CORREO -->
          <div class="registro-grupo">
            <label class="registro-label" for="reg-correo">
              Correo electrónico
            </label>

            <div class="registro-input">
              <span class="material-symbols-outlined">alternate_email</span>
              <input
                id="reg-correo"
                v-model.trim="registro.correo"
                type="email"
                placeholder="ejemplo@correo.com"
                autocomplete="email"
                required
              />
            </div>
            <small class="registro-ayuda">
              Utiliza un correo electrónico al que tengas acceso.
            </small>
          </div>

          <!-- CONTRASEÑAS -->
          <div class="registro-grid">

            <div class="registro-grupo">
              <label class="registro-label" for="reg-contrasena">
                Contraseña
              </label>

              <div class="registro-input">
                <span class="material-symbols-outlined">lock</span>
                <input
                  id="reg-contrasena"
                  v-model="registro.contrasena"
                  :type="mostrarContrasenaRegistro ? 'text' : 'password'"
                  placeholder="Mínimo 8 caracteres"
                  autocomplete="new-password"
                  minlength="8"
                  required
                />
                <button
                  type="button"
                  class="registro-ver"
                  @click="mostrarContrasenaRegistro = !mostrarContrasenaRegistro"
                >
                  <span class="material-symbols-outlined">
                    {{ mostrarContrasenaRegistro ? 'visibility_off' : 'visibility' }}
                  </span>
                  Ver
                </button>
              </div>

              <small class="registro-ayuda">
                Mínimo 8 caracteres y un símbolo.
              </small>
            </div>

            <div class="registro-grupo">
              <label class="registro-label" for="reg-confirmar">
                Confirmar contraseña
              </label>

              <div class="registro-input">
                <span class="material-symbols-outlined">lock_reset</span>
                <input
                  id="reg-confirmar"
                  v-model="registro.confirmarContrasena"
                  type="password"
                  placeholder="Repite tu contraseña"
                  autocomplete="new-password"
                  required
                />
              </div>

              <small
                v-if="registro.confirmarContrasena"
                :class="registro.contrasena === registro.confirmarContrasena
                  ? 'registro-coincide'
                  : 'registro-no-coincide'"
              >
                {{
                  registro.contrasena === registro.confirmarContrasena
                    ? '✓ Las contraseñas coinciden'
                    : 'Las contraseñas no coinciden'
                }}
              </small>
            </div>

          </div>

          <!-- TÉRMINOS -->
          <label class="registro-terminos">
            <input
              v-model="registro.aceptaTerminos"
              type="checkbox"
              required
            />
            <span>
              Acepto los términos y condiciones y autorizo el
              tratamiento de mis datos personales conforme a la
              política de privacidad de MediCitas.
            </span>
          </label>

          <!-- BOTÓN -->
          <button
            class="registro-boton"
            type="submit"
            :disabled="registroCargando"
          >
            <span>
              {{ registroCargando ? 'Creando cuenta...' : 'Crear cuenta' }}
            </span>
            <span class="material-symbols-outlined">
              {{ registroCargando ? 'progress_activity' : 'arrow_forward' }}
            </span>
          </button>

          <!-- INICIAR SESIÓN -->
          <div class="registro-iniciar">
            ¿Ya tienes una cuenta registrada?
            <button
              type="button"
              @click="vistaActual = 'login'; mensaje = ''"
            >
              Iniciar sesión
            </button>
          </div>

        </form>
      </div>
    </div>


  </section>

</template>

<!-- GESTIÓN DE PACIENTES -->
<section
  v-else-if="vistaActual === 'pacientes'"
  class="contenedor-principal"
>
  <div class="encabezado-seccion">
    <div>
      <h1>Gestión de pacientes</h1>
      <p>Consulta, busca y registra pacientes en MediCitas.</p>
    </div>

    <button type="button" @click="vistaActual = usuarioActual.rol === 'administrador' ? 'administrador' : 'recepcionista'">
      Volver al panel
    </button>
  </div>

  <div class="acciones-pacientes">
    <input
      v-model="terminoBusqueda"
      type="text"
      placeholder="Buscar por nombre o documento"
      @keyup.enter="buscarPacientes"
    />

    <button
      type="button"
      @click="buscarPacientes"
      :disabled="buscandoPacientes"
    >
      {{ buscandoPacientes ? 'Buscando...' : 'Buscar' }}
    </button>

    <button type="button" @click="cargarPacientes">
      Mostrar todos
    </button>

    <button
      type="button"
      @click="mostrarFormularioPaciente = !mostrarFormularioPaciente"
    >
      {{ mostrarFormularioPaciente ? 'Cancelar' : 'Registrar paciente' }}
    </button>
  </div>

  <p v-if="mensajePacientes" class="mensaje-exito">
    {{ mensajePacientes }}
  </p>

  <p v-if="errorPacientes" class="mensaje-error">
    {{ errorPacientes }}
  </p>

  <!-- FORMULARIO -->
  <form
    v-if="mostrarFormularioPaciente"
    @submit.prevent="registrarPacienteRecepcion"
    class="formulario-paciente"
  >
    <h2>Registrar nuevo paciente</h2>

    <input v-model.trim="nuevoPaciente.nombres" type="text" placeholder="Nombres" required />
    <input v-model.trim="nuevoPaciente.apellidos" type="text" placeholder="Apellidos" required />
    <input v-model.trim="nuevoPaciente.documento" type="text" placeholder="Documento" required />
    <input v-model.trim="nuevoPaciente.correo" type="email" placeholder="Correo electrónico" required />
    <input v-model.trim="nuevoPaciente.telefono" type="tel" placeholder="Teléfono" required />

    <button type="submit" :disabled="guardandoPaciente">
      {{ guardandoPaciente ? 'Guardando...' : 'Guardar paciente' }}
    </button>
  </form>

  <!-- TABLA -->
  <div class="tabla-pacientes">
    <h2>Pacientes registrados</h2>

    <p v-if="cargandoPacientes">Cargando pacientes...</p>

    <p v-else-if="pacientes.length === 0">
      No se encontraron pacientes.
    </p>

    <table v-else>
      <thead>
        <tr>
          <th>Documento</th>
          <th>Nombres</th>
          <th>Apellidos</th>
          <th>Correo</th>
          <th>Teléfono</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="paciente in pacientes"
          :key="paciente.id_paciente"
        >
          <td>{{ paciente.documento }}</td>
          <td>{{ paciente.nombres }}</td>
          <td>{{ paciente.apellidos }}</td>
          <td>{{ paciente.correo }}</td>
          <td>{{ paciente.telefono }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<section v-else-if="vistaActual === 'inicio'" class="inicio-medicitas">

  <!-- BARRA SUPERIOR -->
  <header class="barra-inicio">
    <div class="marca-inicio">
      <span class="material-symbols-outlined">health_and_safety</span>
      <strong>MediCitas</strong>
      <span class="estado-portal">Portal activo</span>
    </div>

    <nav class="navegacion-inicio">
      <button class="nav-activo" type="button" @click="vistaActual = 'inicio'">
        Inicio
      </button>
      <button type="button" @click="abrirSeccion('medicos')">
        Buscar médico
      </button>
      <button type="button" @click="abrirSeccion('citas')">
        Mis citas
      </button>
    </nav>

    <div class="usuario-inicio">
      <span class="material-symbols-outlined">account_circle</span>
      <span>{{ usuarioActual?.nombre || 'Paciente' }}</span>
      <button type="button" @click="cerrarSesion" title="Cerrar sesión">
        <span class="material-symbols-outlined">logout</span>
      </button>
    </div>
  </header>

  <div class="contenido-inicio">

    <!-- BIENVENIDA -->
    <section class="bienvenida-inicio">
      <div class="bienvenida-texto">
        <span class="etiqueta-inicio">PORTAL DEL PACIENTE</span>
        <h1>Hola, {{ usuarioActual?.nombre || 'bienvenido/a' }}</h1>
        <p>¿Qué necesitas hacer hoy?</p>
      </div>

      <div class="bienvenida-icono">
        <span class="material-symbols-outlined">health_and_safety</span>
        <div>
          <strong>Tu salud es nuestra prioridad</strong>
          <p>Gestiona tu atención médica desde MediCitas.</p>
        </div>
      </div>
    </section>

    <!-- TARJETAS PRINCIPALES -->
    <section class="panel-tarjetas">

      <!-- BUSCAR MÉDICOS -->
      <article class="tarjeta-panel">
        <div class="tarjeta-panel-cabecera">
          <div class="icono-panel icono-azul">
            <span class="material-symbols-outlined">stethoscope</span>
          </div>
          <div>
            <h2>Buscar médico</h2>
            <span>{{ medicos.length }} profesionales registrados</span>
          </div>
        </div>

        <p>
          Encuentra profesionales de la salud y consulta
          las especialidades disponibles en MediCitas.
        </p>

        <button type="button" @click="abrirSeccion('medicos')">
          Buscar médicos
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </article>

      <!-- MIS CITAS -->
      <article class="tarjeta-panel">
        <div class="tarjeta-panel-cabecera">
          <div class="icono-panel icono-lila">
            <span class="material-symbols-outlined">calendar_month</span>
          </div>
          <div>
            <h2>Mis citas</h2>
            <span>{{ citas.length }} citas registradas</span>
          </div>
        </div>

        <p>
          Consulta la información y el estado de tus
          citas médicas registradas.
        </p>

        <button class="boton-secundario" type="button"
          @click="abrirSeccion('citas')">
          Ver mis citas
          <span class="material-symbols-outlined">event_note</span>
        </button>
      </article>

      <!-- PRÓXIMA CITA -->
      <article class="tarjeta-panel tarjeta-proxima">
        <div class="proxima-etiqueta">
          <span class="material-symbols-outlined">event_available</span>
          INFORMACIÓN DE CITAS
        </div>

        <template v-if="citas.length">
          <h2>Consulta registrada</h2>

          <div class="dato-proxima">
            <span class="material-symbols-outlined">calendar_month</span>
            <div>
              <small>Fecha</small>
              <strong>
  {{ new Date(citas[0].fecha).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  }) }}
</strong>
            </div>
          </div>

          <div class="dato-proxima">
            <span class="material-symbols-outlined">schedule</span>
            <div>
              <small>Hora</small>
              <strong>{{ citas[0].hora }}</strong>
            </div>
          </div>

          <div class="dato-proxima">
            <span class="material-symbols-outlined">info</span>
            <div>
              <small>Estado</small>
              <strong>{{ citas[0].estado || 'Pendiente' }}</strong>
            </div>
          </div>

          <button type="button" @click="abrirSeccion('citas')">
            Consultar todas las citas
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </template>

        <template v-else>
          <h2>Aún no tienes citas</h2>
          <p>Cuando tengas una cita registrada, podrás consultar aquí su información.</p>
          <button type="button" @click="abrirSeccion('medicos')">
            Buscar un médico
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </template>
      </article>

    </section>


    <!-- MENSAJE INFORMATIVO -->
    <section class="mensaje-inicio">
      <span class="material-symbols-outlined">verified_user</span>
      <div>
        <strong>Bienvenido/a a MediCitas</strong>
        <p>
          Organiza tus citas médicas y encuentra profesionales
          de la salud desde un solo lugar.
        </p>
      </div>
    </section>

  </div>
</section>

  
<section v-if="vistaActual === 'medicos'" class="seccion-medicos">

  <!-- ENCABEZADO -->
  <header class="encabezado-medicos">
    <button
  type="button"
  class="boton-volver"
  @click="vistaActual = usuarioActual?.rol === 'recepcionista'
    ? 'recepcionista'
    : usuarioActual?.rol === 'administrador'
      ? 'administrador'
      : usuarioActual?.rol === 'medico'
        ? 'medico'
        : 'inicio'"
>
  ← Volver al inicio
</button>

    <p class="etiqueta-inicio">NUESTRO EQUIPO MÉDICO</p>
    <h1>Encuentra tu especialista</h1>
    <p>Consulta nuestros profesionales y agenda tu próxima cita médica.</p>
  </header>

  <!-- LISTADO DE MÉDICOS -->
  <p v-if="cargandoMedicos">Cargando médicos...</p>

  <p v-else-if="errorMedicos" class="error-medicos">
    {{ errorMedicos }}
  </p>

  <div v-else-if="medicos.length" class="lista-medicos">
    <article
      v-for="medico in medicos"
      :key="medico.id_medico"
      class="tarjeta-medico"
    >
      <div class="icono-medico">
        <span class="material-symbols-outlined">medical_services</span>
      </div>

      <h2>Dr./Dra. {{ medico.nombres }} {{ medico.apellidos }}</h2>

      <p class="especialidad-medico">
        {{ medico.especialidad || medico.nombre_especialidad || 'Especialidad médica' }}
      </p>

      <p v-if="medico.correo">Correo: {{ medico.correo }}</p>
      <p v-if="medico.telefono">Teléfono: {{ medico.telefono }}</p>

      <button
        type="button"
        v-if="usuarioActual?.rol === 'paciente'"
        @click="nuevaCita.id_medico = String(medico.id_medico)"
      >
        Seleccionar médico
      </button>
    </article>
  </div>

  <p v-else>No hay médicos registrados actualmente.</p>

  <!-- FORMULARIO PARA AGENDAR -->
  <section
  v-if="usuarioActual?.rol === 'paciente'"
  class="formulario-agendar"
>

    <div class="encabezado-formulario">
      <span class="material-symbols-outlined">calendar_month</span>
      <div>
        <h2>Agenda tu cita médica</h2>
        <p>Completa los siguientes datos para solicitar tu consulta.</p>
      </div>
    </div>

    <form @submit.prevent="agendarCita">

 
<!-- MÉDICO -->
<div class="campo-cita">
  <label for="medico-cita">Selecciona el médico</label>

  <select
    id="medico-cita"
    v-model="nuevaCita.id_medico"
    @change="cargarDisponibilidad"
    required
  >
    <option value="" disabled>Selecciona un profesional</option>

    <option
      v-for="medico in medicos"
      :key="medico.id_medico"
      :value="String(medico.id_medico)"
    >
      Dr./Dra. {{ medico.nombres }} {{ medico.apellidos }}
      - {{ medico.especialidad || medico.nombre_especialidad || 'Especialista' }}
    </option>
  </select>
</div>

<!-- FECHA -->
<div class="campo-cita">
  <label for="fecha-cita">Fecha de la cita</label>

  <input
    id="fecha-cita"
    type="date"
    v-model="nuevaCita.fecha"
    @change="cargarDisponibilidad"
    :min="new Date().toISOString().split('T')[0]"
    required
  />
</div>

<!-- HORA DISPONIBLE -->
<div class="campo-cita">
  <label for="hora-cita">Hora de la cita</label>

  <select
    id="hora-cita"
    v-model="nuevaCita.hora"
    :disabled="cargandoDisponibilidad || !nuevaCita.id_medico || !nuevaCita.fecha || disponibilidad.length === 0"
    required
  >
    <option value="" disabled>
      {{ cargandoDisponibilidad
        ? 'Consultando horarios...'
        : disponibilidad.length > 0
          ? 'Selecciona una hora disponible'
          : 'No hay horarios disponibles' }}
    </option>

    <option
      v-for="hora in disponibilidad"
      :key="hora"
      :value="hora"
    >
      {{ hora }}
    </option>
  </select>

  <small v-if="cargandoDisponibilidad">
    Consultando disponibilidad del médico...
  </small>

  <small v-else-if="errorDisponibilidad">
    {{ errorDisponibilidad }}
  </small>

  <small v-else-if="disponibilidad.length === 0 && nuevaCita.id_medico && nuevaCita.fecha">
    No hay horarios disponibles para esta fecha. Intenta con otro día.
  </small>
</div>


      <!-- MOTIVO -->
      <div class="campo-cita">
        <label for="motivo-cita">Motivo de la consulta</label>

        <textarea
          id="motivo-cita"
          v-model="nuevaCita.motivo"
          placeholder="Describe brevemente el motivo de tu consulta..."
          rows="4"
          required
        ></textarea>
      </div>

      <!-- MENSAJES -->
      <p v-if="mensajeCita" class="mensaje-exito">
        {{ mensajeCita }}
      </p>

      <p v-if="errorCita" class="error-medicos">
        {{ errorCita }}
      </p>

      <!-- BOTÓN -->
      <button
        type="submit"
        class="boton-agendar"
        :disabled="cargandoCita"
      >
        <span class="material-symbols-outlined">event_available</span>

        {{ cargandoCita ? 'Agendando cita...' : 'Agendar cita' }}
      </button>

    </form>
  </section>

</section>


<!-- ADMINISTRACIÓN DE MÉDICOS -->
<section
  v-if="vistaActual === 'medicos-admin'"
  class="seccion-medicos"
>
  <header class="encabezado-medicos">
    <button
      type="button"
      class="boton-volver"
      @click="vistaActual = 'administrador'"
    >
      ← Volver al panel
    </button>

    <p class="etiqueta-inicio">GESTIÓN ADMINISTRATIVA</p>
    <h1>Administración de médicos</h1>
    <p>Consulta y gestiona los profesionales registrados en MediCitas.</p>
  </header>

  
<!-- FORMULARIO DE REGISTRO DE MÉDICOS -->
<div class="formulario-agendar formulario-medico-admin">

  <div class="encabezado-formulario">
    <span class="material-symbols-outlined">person_add</span>
    <div>
      <h2>Registrar nuevo médico</h2>
      <p>Ingresa los datos del profesional que deseas registrar.</p>
    </div>
  </div>

  <form @submit.prevent="registrarMedico">

    <div class="campo-cita">
      <label for="nuevo-medico-nombres">Nombres</label>
      <input
        id="nuevo-medico-nombres"
        v-model.trim="nuevoMedico.nombres"
        type="text"
        placeholder="Nombres del médico"
        required
      />
    </div>

    <div class="campo-cita">
      <label for="nuevo-medico-apellidos">Apellidos</label>
      <input
        id="nuevo-medico-apellidos"
        v-model.trim="nuevoMedico.apellidos"
        type="text"
        placeholder="Apellidos del médico"
        required
      />
    </div>

    <div class="campo-cita">
      <label for="nuevo-medico-correo">Correo electrónico</label>
      <input
        id="nuevo-medico-correo"
        v-model.trim="nuevoMedico.correo"
        type="email"
        placeholder="correo@ejemplo.com"
        required
      />
    </div>

    <div class="campo-cita">
      <label for="nuevo-medico-telefono">Teléfono</label>
      <input
        id="nuevo-medico-telefono"
        v-model.trim="nuevoMedico.telefono"
        type="tel"
        placeholder="Número de contacto"
        required
      />
    </div>

    <div class="campo-cita">
      <label for="nuevo-medico-especialidad">Especialidad</label>

      <select
        id="nuevo-medico-especialidad"
        v-model="nuevoMedico.id_especialidad"
        required
        :disabled="cargandoEspecialidades"
      >
        <option value="" disabled>
          {{ cargandoEspecialidades
            ? 'Cargando especialidades...'
            : 'Selecciona una especialidad' }}
        </option>

        <option
          v-for="especialidad in especialidades"
          :key="especialidad.id_especialidad"
          :value="String(especialidad.id_especialidad)"
        >
          {{ especialidad.nombre }}
        </option>
      </select>
    </div>

    <div class="campo-cita">
      <label for="nuevo-medico-contrasena">
        Contraseña inicial
      </label>

  <input
    id="nuevo-medico-contrasena"
    v-model="nuevoMedico.contrasena"
    type="password"
    placeholder="Mínimo 8 caracteres"
    minlength="8"
    required
  />
</div>

    <p v-if="mensajeMedicoAdmin" class="mensaje-exito">
      {{ mensajeMedicoAdmin }}
    </p>

    <p v-if="errorMedicoAdmin" class="error-medicos">
      {{ errorMedicoAdmin }}
    </p>

    <button
      type="submit"
      class="boton-agendar"
      :disabled="guardandoMedico || cargandoEspecialidades"
    >
      <span class="material-symbols-outlined">person_add</span>
      {{ guardandoMedico ? 'Registrando...' : 'Registrar médico' }}
    </button>

  </form>
</div>


  <div class="bienvenida-admin">
    <span class="material-symbols-outlined">medical_services</span>
    <div>
      <h2>Profesionales registrados</h2>
      <p>Listado de médicos de la clínica.</p>
    </div>
  </div>

  <p v-if="cargandoMedicos">Cargando médicos...</p>

  <p v-else-if="errorMedicos" class="error-medicos">
    {{ errorMedicos }}
  </p>

  <div v-else-if="medicos.length" class="lista-medicos">
    <article
      v-for="medico in medicos"
      :key="medico.id_medico"
      class="tarjeta-medico"
    >
      <div class="icono-medico">
        <span class="material-symbols-outlined">
          medical_services
        </span>
      </div>

      <h2>Dr./Dra. {{ medico.nombres }} {{ medico.apellidos }}</h2>

      <p>
        <strong>Especialidad:</strong>
        {{ medico.especialidad || medico.nombre_especialidad || 'No registrada' }}
      </p>

      <p v-if="medico.correo">
        <strong>Correo:</strong> {{ medico.correo }}
      </p>

      <p v-if="medico.telefono">
        <strong>Teléfono:</strong> {{ medico.telefono }}
      </p>

      <p>
  <strong>Estado:</strong>
  {{ medico.estado || 'Activo' }}
</p>

<div class="acciones-medico">
  <button
    type="button"
    @click="cambiarEstadoMedico(medico)"
    :disabled="procesandoEstadoMedico === medico.id_medico"
  >
    {{
      procesandoEstadoMedico === medico.id_medico
        ? 'Procesando...'
        : medico.estado === 'activo'
          ? 'Desactivar médico'
          : 'Activar médico'
    }}
  </button>
</div>
</article>
  </div>
  <p v-else>No hay médicos registrados.</p>
</section>

<!-- SECCIÓN DE CITAS MÉDICAS -->
<section v-if="vistaActual === 'citas'" class="seccion-citas">

  <header class="encabezado-citas">
    <button
      type="button"
      class="boton-volver"
      @click="vistaActual = usuarioActual?.rol === 'medico'
        ? 'medico'
        : usuarioActual?.rol === 'administrador'
          ? 'administrador'
          : usuarioActual?.rol === 'recepcionista'
            ? 'recepcionista'
            : 'inicio'"
    >
      ← Volver al inicio
    </button>

    <p class="etiqueta-inicio">
      {{ usuarioActual?.rol === 'medico'
        ? 'AGENDA PROFESIONAL'
        : 'MI ATENCIÓN MÉDICA' }}
    </p>

    <h1>
      {{ usuarioActual?.rol === 'medico'
        ? 'Citas asignadas'
        : 'Mis citas médicas' }}
    </h1>

        <p>
      {{ usuarioActual?.rol === 'medico'
        ? 'Consulta los pacientes y las citas programadas en tu agenda.'
        : usuarioActual?.rol === 'recepcionista'
          ? 'Gestiona las citas médicas y agenda nuevas consultas para los pacientes.'
          : 'Consulta las citas registradas en MediCitas.' }}
    </p>

    <button
      v-if="usuarioActual?.rol === 'recepcionista'"
      type="button"
      class="boton-registrar-cita"
      @click="abrirFormularioCita"
    >
      <span class="material-symbols-outlined">add</span>
      Registrar cita
    </button>
  </header>

  <!-- FORMULARIO PARA REGISTRAR UNA CITA -->
<div
  v-if="usuarioActual?.rol === 'recepcionista' && mostrarFormularioCita"
  class="formulario-registro-cita"
>
  <div class="encabezado-formulario-cita">
    <div>
      <h2>Agendar nueva cita</h2>
      <p>Completa los datos para programar una consulta médica.</p>
    </div>

    <button
      type="button"
      class="cerrar-formulario-cita"
      @click="mostrarFormularioCita = false"
    >
      ×
    </button>
  </div>

  <form @submit.prevent="agendarCita">
    <div class="campos-formulario-cita">

      <div class="campo-cita">
        <label>Paciente</label>
        <select v-model="nuevaCita.id_paciente" required>
          <option value="">Selecciona un paciente</option>
          <option
            v-for="paciente in pacientesDisponibles"
            :key="paciente.id_paciente"
            :value="paciente.id_paciente"
          >
            {{ paciente.nombres }} {{ paciente.apellidos }}
          </option>
        </select>
      </div>

      <div class="campo-cita">
  <label>Médico</label>
  <select
    v-model="nuevaCita.id_medico"
    @change="cargarDisponibilidad"
    required
  >
    <option value="">Selecciona un médico</option>

    <option v-for="medico in medicosDisponibles.filter(m => String(m.estado).toLowerCase() === 'activo')"
      :key="medico.id_medico"
      :value="medico.id_medico"
    >
      Dr. {{ medico.nombres }} {{ medico.apellidos }} - {{ medico.especialidad }}
    </option>
  </select>
</div>

      <div class="campo-cita">
        <label>Fecha</label>
        <input
          type="date"
          v-model="nuevaCita.fecha"
          :min="new Date().toISOString().split('T')[0]"
          @change="cargarDisponibilidad"
          required
        />
      </div>

      <div class="campo-cita">
        <label>Horario disponible</label>
        <select v-model="nuevaCita.hora" required>
          <option value="">Selecciona un horario</option>
          <option
  v-for="horario in horariosDisponibles"
  :key="horario"
  :value="horario"
>
  {{ horario }}
</option>
        </select>
      </div>

      <div class="campo-cita campo-cita-completo">
        <label>Motivo de la consulta</label>
        <textarea
          v-model="nuevaCita.motivo"
          placeholder="Describe brevemente el motivo de la consulta"
          rows="3"
          required
        ></textarea>
      </div>

    </div>

    <p v-if="errorCita" class="mensaje-error-cita">
      {{ errorCita }}
    </p>

    <p v-if="mensajeCita" class="mensaje-exito-cita">
      {{ mensajeCita }}
    </p>

    <div class="acciones-formulario-cita">
      <button
        type="button"
        class="boton-cancelar-cita"
        @click="mostrarFormularioCita = false"
      >
        Cancelar
      </button>

      <button
        type="submit"
        class="boton-guardar-cita"
        :disabled="cargandoCita"
      >
        {{ cargandoCita ? 'Registrando...' : 'Guardar cita' }}
      </button>
    </div>
  </form>
</div>

  <div class="resumen-citas">
    <div class="resumen-cita">
      <span class="material-symbols-outlined">calendar_month</span>
      <div>
        <strong>{{ citas.length }}</strong>
        <p>Citas registradas</p>
      </div>
    </div>

    <div class="resumen-cita">
      <span class="material-symbols-outlined">schedule</span>
      <div>
        <strong>{{ citas.filter(c => (c.estado || 'Pendiente').toLowerCase() === 'pendiente').length }}</strong>
        <p>Pendientes</p>
      </div>
    </div>

    <div class="resumen-cita">
      <span class="material-symbols-outlined">event_available</span>
      <div>
        <strong>{{ citas.filter(c => c.estado?.toLowerCase() === 'confirmada').length }}</strong>
        <p>Confirmadas</p>
      </div>
    </div>
  </div>

  <div class="lista-citas">

    <p v-if="cargandoCitas" class="estado-citas">
      Cargando citas médicas...
    </p>

    <p v-else-if="errorCitas" class="error-medicos">
      {{ errorCitas }}
    </p>

    <template v-else-if="citas.length">

      <article
        v-for="cita in citas"
        :key="cita.id_cita"
        class="tarjeta-cita"
      >
        <div class="tarjeta-cita-superior">
          <div class="icono-cita">
            <span class="material-symbols-outlined">calendar_month</span>
          </div>

          <div class="informacion-cita">
            <h2>Cita #{{ cita.id_cita }}</h2>
            <p>
              {{ new Date(cita.fecha).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
              }) }}
              · {{ cita.hora }}
            </p>
          </div>

          <span
            class="estado-cita"
            :class="`estado-${(cita.estado || 'Pendiente').toLowerCase()}`"
          >
            {{ cita.estado || 'Pendiente' }}
          </span>
        </div>

        <div class="detalles-cita">
          <div v-if="cita.nombres_paciente">
            <span class="material-symbols-outlined">person</span>
            <p>
              <strong>Paciente</strong>
              {{ cita.nombres_paciente }} {{ cita.apellidos_paciente }}
            </p>
          </div>

          <div v-if="cita.nombres_medico">
            <span class="material-symbols-outlined">medical_services</span>
            <p>
              <strong>Médico</strong>
              {{ cita.nombres_medico }} {{ cita.apellidos_medico }}
            </p>
          </div>

          <div v-if="cita.especialidad">
            <span class="material-symbols-outlined">health_and_safety</span>
            <p>
              <strong>Especialidad</strong>
              {{ cita.especialidad }}
            </p>
          </div>

          <div v-if="cita.motivo">
            <span class="material-symbols-outlined">description</span>
            <p>
              <strong>Motivo de consulta</strong>
              {{ cita.motivo }}
            </p>
          </div>
        </div>
                <!-- ACCIONES DE LA CITA -->
        <div
          v-if="usuarioActual?.rol === 'recepcionista'"
          class="acciones-tarjeta-cita"
        >
          <button
            v-if="(cita.estado || 'Pendiente').toLowerCase() === 'pendiente'"
            type="button"
            class="boton-confirmar-cita"
            @click="confirmarCita(cita.id_cita)"
          >
            <span class="material-symbols-outlined">check_circle</span>
            Confirmar
          </button>

          <button
            v-if="(cita.estado || 'Pendiente').toLowerCase() !== 'cancelada'"
            type="button"
            class="boton-cancelar-cita-listado"
            @click="cancelarCita(cita.id_cita)"
          >
            <span class="material-symbols-outlined">cancel</span>
            Cancelar
          </button>
        </div>
      </article>

    </template>

    <p v-else class="estado-citas">
      No hay citas registradas.
    </p>

  </div>
</section>

<!-- AGENDA PERSONAL DEL MÉDICO -->
<section
  v-if="vistaActual === 'mi-agenda'"
  class="seccion-medicos"
>
  <header class="encabezado-medicos">
    <button
      type="button"
      class="boton-volver"
      @click="vistaActual = 'medico'"
    >
      ← Volver al panel profesional
    </button>

    <div>
      <p class="etiqueta-inicio">AGENDA PROFESIONAL</p>
      <h1>Mi agenda</h1>
      <p>
        Consulta tus horarios de atención y disponibilidad médica.
      </p>
    </div>
  </header>

  <div v-if="cargandoMiAgenda" class="mensaje-carga">
    Consultando tus horarios...
  </div>

  <div v-else-if="errorMiAgenda" class="mensaje-error">
    {{ errorMiAgenda }}
    <button type="button" @click="cargarMiAgenda">
      Reintentar
    </button>
  </div>

  <div v-else-if="miAgenda.length === 0" class="mensaje-vacio">
    <span class="material-symbols-outlined">event_busy</span>
    <h2>No tienes horarios registrados</h2>
    <p>
      Actualmente no hay disponibilidad médica asociada a tu cuenta.
      Comunícate con el administrador para configurar tu agenda.
    </p>
  </div>

  <div v-else class="lista-medicos">
    <div class="encabezado-seccion">
      <h2>Mis horarios de atención</h2>
      <p>{{ miAgenda.length }} horarios registrados</p>
    </div>

    <article
      v-for="horario in miAgenda"
      :key="horario.id_horario"
      class="tarjeta-medico"
    >
      <div class="contenido-medico">
        <span class="material-symbols-outlined">
          calendar_month
        </span>

        <div>
          <h3>
            {{
              ['Lunes', 'Martes', 'Miércoles', 'Jueves',
               'Viernes', 'Sábado', 'Domingo'][horario.dia_semana - 1]
            }}
          </h3>

          <p>
            {{ String(horario.hora_inicio).slice(0, 5) }}
            -
            {{ String(horario.hora_fin).slice(0, 5) }}
          </p>

          <p>
            Duración de cada cita:
            {{ horario.duracion_cita }} minutos
          </p>
        </div>
      </div>

      <span
        :class="horario.activo ? 'estado-activo' : 'estado-inactivo'"
      >
        {{ horario.activo ? 'Disponible' : 'Inactivo' }}
      </span>
    </article>
  </div>
</section>

<section v-if="vistaActual === 'perfil'" class="seccion-medicos">
  <header class="encabezado-medicos">
    <button
  type="button"
  class="boton-volver"
  @click="vistaActual = usuarioActual?.rol === 'medico'
    ? 'medico'
    : usuarioActual?.rol === 'administrador'
      ? 'administrador'
      : usuarioActual?.rol === 'recepcionista'
        ? 'recepcionista'
        : 'inicio'"
>
  ← Volver al inicio
</button>

    <p class="etiqueta-inicio">MI CUENTA</p>
    <h1>Mi perfil</h1>
    <p>Consulta la información de tu cuenta en MediCitas.</p>
  </header>

  <article class="tarjeta-medico">
    <div class="icono-medico">
      <span class="material-symbols-outlined">person</span>
    </div>

    <h2>Datos personales</h2>

    <p>
      <strong>Nombre:</strong>
      {{ usuarioActual?.nombre || 'No disponible' }}
    </p>

    <p>
      <strong>Correo electrónico:</strong>
      {{ usuarioActual?.correo || 'No disponible' }}
    </p>

    <button
      type="button"
      class="boton-volver"
      @click="cerrarSesion"
    >
      Cerrar sesión
    </button>
  </article>
</section>


<!-- PANEL PRINCIPAL DEL MÉDICO -->
<section
  v-if="vistaActual === 'medico'"
  class="panel-administrador"
>
  <header class="encabezado-admin">
    <div class="bienvenida-admin">
      <span class="material-symbols-outlined">medical_services</span>
      <div>
        <p class="etiqueta-inicio">PANEL PROFESIONAL</p>
        <h1>Bienvenido(a), Dr./Dra. {{ usuarioActual?.nombre }}</h1>
        <p>Gestiona tu actividad médica en MediCitas.</p>
      </div>
    </div>

    <button
      type="button"
      class="boton-volver"
      @click="cerrarSesion"
    >
      <span class="material-symbols-outlined">logout</span>
      Cerrar sesión
    </button>
  </header>

  <div class="opciones-admin">
  <button
    type="button"
    class="opcion-admin"
    @click="abrirSeccion('citas')"
  >
    <span class="material-symbols-outlined">calendar_month</span>
    <h2>Mis citas</h2>
    <p>Consulta las citas asignadas a tu agenda.</p>
  </button>

  <button
  type="button"
  class="opcion-admin"
  @click="vistaActual = 'mi-agenda'; cargarMiAgenda()"
>
  <span class="material-symbols-outlined">event_available</span>
  <h2>Mi agenda</h2>
  <p>Consulta tus horarios y disponibilidad médica.</p>
</button>

  <button
    type="button"
    class="opcion-admin"
    @click="vistaActual = 'perfil'"
  >
    <span class="material-symbols-outlined">person</span>
    <h2>Mi perfil</h2>
    <p>Consulta tu información personal.</p>
  </button>
</div>
</section>

<!-- PANEL ADMINISTRATIVO -->
<section
  v-if="vistaActual === 'administrador'"
  class="panel-administrador"
>
  <header class="encabezado-admin">
    <div>
      <p class="etiqueta-inicio">PANEL DE CONTROL</p>
      <h1>Administración de MediCitas</h1>
      <p>Gestiona los médicos, pacientes, citas y horarios de la clínica.</p>
    </div>

    <button
      type="button"
      class="boton-volver"
      @click="cerrarSesion"
    >
      <span class="material-symbols-outlined">logout</span>
      Cerrar sesión
    </button>
  </header>

  <div class="bienvenida-admin">
    <span class="material-symbols-outlined">admin_panel_settings</span>
    <div>
      <h2>Bienvenido/a, {{ usuarioActual?.nombre || 'Administrador' }}</h2>
      <p>Desde aquí puedes administrar la información de MediCitas.</p>
    </div>
  </div>

  <div class="opciones-admin">
    <button
      type="button"
      class="opcion-admin"
      @click="abrirSeccion('medicos')"
    >
      <span class="material-symbols-outlined">medical_services</span>
      <h3>Médicos</h3>
      <p>Consultar profesionales registrados.</p>
    </button>

    <button
      type="button"
      class="opcion-admin"
      @click="abrirSeccion('pacientes')"
    >
      <span class="material-symbols-outlined">groups</span>
      <h3>Pacientes</h3>
      <p>Consultar pacientes registrados.</p>
    </button>

    <button
      type="button"
      class="opcion-admin"
      @click="abrirSeccion('citas')"
    >
      <span class="material-symbols-outlined">calendar_month</span>
      <h3>Citas médicas</h3>
      <p>Consultar las citas de la clínica.</p>
    </button>

    <button
  type="button"
  class="opcion-admin"
  @click="abrirHorariosAdmin"
>
  <span class="material-symbols-outlined">schedule</span>
  <h3>Horarios</h3>
  <p>Gestionar la disponibilidad médica.</p>
</button>
  </div>
</section>

<!-- PANEL DEL RECEPCIONISTA -->
<section
  v-else-if="vistaActual === 'recepcionista'"
  class="panel-administrador"
>
  <header class="encabezado-admin">
    <div>
      <p class="etiqueta-inicio">PANEL DE RECEPCIÓN</p>
      <h1>Recepción de MediCitas</h1>
      <p>Gestiona pacientes y consulta las citas médicas de la clínica.</p>
    </div>

    <button
      type="button"
      class="boton-volver"
      @click="cerrarSesion"
    >
      <span class="material-symbols-outlined">logout</span>
      Cerrar sesión
    </button>
  </header>

  <div class="bienvenida-admin">
    <span class="material-symbols-outlined">support_agent</span>
    <div>
      <h2>Bienvenido/a, {{ usuarioActual?.nombre || 'Recepcionista' }}</h2>
      <p>Desde aquí puedes atender a los pacientes y gestionar sus citas.</p>
    </div>
  </div>

  <div class="opciones-admin">
    <button
      type="button"
      class="opcion-admin"
      @click="abrirSeccion('pacientes')"
    >
      <span class="material-symbols-outlined">groups</span>
      <h3>Pacientes</h3>
      <p>Buscar, consultar y registrar pacientes.</p>
    </button>

    <button
      type="button"
      class="opcion-admin"
      @click="abrirSeccion('citas')"
    >
      <span class="material-symbols-outlined">calendar_month</span>
      <h3>Citas médicas</h3>
      <p>Consultar las citas médicas registradas.</p>
    </button>

    <button
      type="button"
      class="opcion-admin"
      @click="abrirSeccion('medicos')"
    >
      <span class="material-symbols-outlined">medical_services</span>
      <h3>Médicos</h3>
      <p>Consultar los profesionales registrados.</p>
    </button>
  </div>
</section>

<!-- ADMINISTRACIÓN DE HORARIOS MÉDICOS -->
<section
  v-if="vistaActual === 'horarios-admin'"
  class="seccion-medicos"
>
  <header class="encabezado-medicos">
    <button
      type="button"
      class="boton-volver"
      @click="vistaActual = 'administrador'"
    >
      ← Volver al panel
    </button>

    <p class="etiqueta-inicio">GESTIÓN ADMINISTRATIVA</p>
    <h1>Administración de horarios</h1>
    <p>Registra y consulta la disponibilidad de los médicos.</p>
  </header>

  <form
    class="formulario-agendar"
    @submit.prevent="registrarHorario"
  >
    <h2>Registrar disponibilidad</h2>

    <!-- SELECCIONAR MÉDICO -->
    <div class="campo-cita">
      <label for="medico-horario">Seleccionar médico</label>

      <select
        id="medico-horario"
        v-model="nuevoHorario.id_medico"
        @change="cargarHorariosMedico"
        required
      >
        <option value="" disabled>
          Selecciona un médico
        </option>

        <option
          v-for="medico in medicos"
          :key="medico.id_medico"
          :value="medico.id_medico"
        >
          Dr./Dra. {{ medico.nombres }} {{ medico.apellidos }}
        </option>
      </select>
    </div>

    <!-- DÍAS DE ATENCIÓN -->
    <div class="campo-cita">
      <label>Días de atención</label>

      <div class="dias-horario">
        <label>
          <input type="checkbox" v-model="nuevoHorario.dias_semana" :value="1">
          Lunes
        </label>

        <label>
          <input type="checkbox" v-model="nuevoHorario.dias_semana" :value="2">
          Martes
        </label>

        <label>
          <input type="checkbox" v-model="nuevoHorario.dias_semana" :value="3">
          Miércoles
        </label>

        <label>
          <input type="checkbox" v-model="nuevoHorario.dias_semana" :value="4">
          Jueves
        </label>

        <label>
          <input type="checkbox" v-model="nuevoHorario.dias_semana" :value="5">
          Viernes
        </label>

        <label>
          <input type="checkbox" v-model="nuevoHorario.dias_semana" :value="6">
          Sábado
        </label>

        <label>
          <input type="checkbox" v-model="nuevoHorario.dias_semana" :value="7">
          Domingo
        </label>
      </div>
    </div>

    <!-- HORAS -->
    <div class="campo-cita">
      <label for="hora-inicio">Hora de inicio</label>

      <input
        id="hora-inicio"
        type="time"
        v-model="nuevoHorario.hora_inicio"
        required
      />
    </div>

    <div class="campo-cita">
      <label for="hora-fin">Hora de finalización</label>

      <input
        id="hora-fin"
        type="time"
        v-model="nuevoHorario.hora_fin"
        required
      />
    </div>

    <!-- DURACIÓN -->
    <div class="campo-cita">
      <label for="duracion-cita">Duración de cada cita</label>

      <select
        id="duracion-cita"
        v-model="nuevoHorario.duracion_cita"
        required
      >
        <option :value="15">15 minutos</option>
        <option :value="20">20 minutos</option>
        <option :value="30">30 minutos</option>
        <option :value="45">45 minutos</option>
        <option :value="60">60 minutos</option>
      </select>
    </div>

    <!-- MENSAJES -->
    <p v-if="mensajeHorario" class="mensaje-exito">
      {{ mensajeHorario }}
    </p>

    <p v-if="errorHorario" class="error-medicos">
      {{ errorHorario }}
    </p>

    <!-- GUARDAR -->
    <button
      type="submit"
      class="boton-agendar"
      :disabled="guardandoHorario"
    >
      <span class="material-symbols-outlined">save</span>

      {{ guardandoHorario ? 'Guardando horarios...' : 'Registrar horarios' }}
    </button>
  </form>

  <!-- HORARIOS REGISTRADOS -->
  <section class="lista-medicos">
    <h2>Horarios registrados</h2>

    <p v-if="!nuevoHorario.id_medico">
      Selecciona un médico para consultar sus horarios.
    </p>

    <p v-else-if="cargandoHorarios">
      Consultando horarios...
    </p>

    <p v-else-if="horariosMedico.length === 0">
      Este médico todavía no tiene horarios registrados.
    </p>

    <article
      v-for="horario in horariosMedico"
      :key="horario.id_horario"
      class="tarjeta-medico"
    >
      <h3>
        {{
          ['',
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
          'Domingo'][Number(horario.dia_semana)]
        }}
      </h3>

      <!-- FORMULARIO PARA EDITAR HORARIO -->
<div
  v-if="horarioEditando?.id_horario === horario.id_horario"
  class="formulario-edicion-horario"
>
  <h4>Editar horario</h4>

  <div class="campo-cita">
    <label>Día de atención</label>

    <select v-model.number="horarioEditando.dia_semana">
      <option :value="1">Lunes</option>
      <option :value="2">Martes</option>
      <option :value="3">Miércoles</option>
      <option :value="4">Jueves</option>
      <option :value="5">Viernes</option>
      <option :value="6">Sábado</option>
      <option :value="7">Domingo</option>
    </select>
  </div>

  <div class="campo-cita">
    <label>Hora de inicio</label>

    <input
      type="time"
      v-model="horarioEditando.hora_inicio"
      required
    />
  </div>

  <div class="campo-cita">
    <label>Hora de finalización</label>

    <input
      type="time"
      v-model="horarioEditando.hora_fin"
      required
    />
  </div>

  <div class="campo-cita">
    <label>Duración de cada cita</label>

    <select v-model.number="horarioEditando.duracion_cita">
      <option :value="15">15 minutos</option>
      <option :value="20">20 minutos</option>
      <option :value="30">30 minutos</option>
      <option :value="45">45 minutos</option>
      <option :value="60">60 minutos</option>
    </select>
  </div>

  <div class="campo-cita">
    <label>
      <input
        type="checkbox"
        v-model="horarioEditando.activo"
      />
      Horario activo
    </label>
  </div>

  <div class="acciones-horario">
    <button
      type="button"
      class="boton-agendar"
      @click="actualizarHorario"
      :disabled="guardandoEdicionHorario"
    >
      {{ guardandoEdicionHorario ? 'Guardando...' : 'Guardar cambios' }}
    </button>

    <button
      type="button"
      class="boton-volver"
      @click="cancelarEdicionHorario"
    >
      Cancelar
    </button>
  </div>
</div>

      <p>
        <strong>Desde:</strong>
        {{ String(horario.hora_inicio).slice(0, 5) }}
      </p>

      <p>
        <strong>Hasta:</strong>
        {{ String(horario.hora_fin).slice(0, 5) }}
      </p>

      <p>
        <strong>Duración de la cita:</strong>
        {{ horario.duracion_cita }} minutos
      </p>

      <p>
        <strong>Estado:</strong>
        {{ horario.activo ? 'Activo' : 'Inactivo' }}
      </p>
      <div class="acciones-horario">
  <button
    type="button"
    class="boton-agendar"
    @click="prepararEdicionHorario(horario)"
    :disabled="horarioEditando !== null"
  >
    <span class="material-symbols-outlined">edit</span>
    Editar
  </button>
</div>
    </article>
  </section>
</section>
    </main>
  </template>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Public+Sans:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

  :root {
    font-family: 'Public Sans', sans-serif;
    color: #111c2d;
    background: #f9f9ff;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
  }

  button,
  input {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  .pagina {
    min-height: 100vh;
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36px 24px;
    overflow: hidden;
  }

  .fondo {
    position: fixed;
    z-index: -1;
    width: 390px;
    height: 390px;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
  }

  .fondo-uno {
    background: #dbe1ff;
    opacity: 0.7;
    top: -100px;
    left: -100px;
  }

  .fondo-dos {
    background: #dce1ff;
    opacity: 0.65;
    right: -100px;
    bottom: -100px;
  }

  .contenedor {
    display: grid;
    grid-template-columns: 7fr 5fr;
    width: 100%;
    max-width: 1180px;
    min-height: 650px;
    overflow: hidden;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 22px 65px rgba(21, 39, 85, 0.12);
  }

  .panel-formulario {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 46px 48px 0;
  }

  .contenido-formulario {
    width: 100%;
    max-width: 490px;
    margin: 0 auto;
  }

  .encabezado {
    margin-bottom: 34px;
  }

  .logo {
    height: 43px;
    display: flex;
    align-items: center;
    margin-bottom: 25px;
  }

  .logo img {
    max-width: 190px;
    max-height: 43px;
    object-fit: contain;
  }

  .encabezado h1 {
    margin: 0;
    font: 700 28px/1.3 'Manrope', sans-serif;
    letter-spacing: -0.7px;
  }

  .encabezado > p {
    margin: 9px 0 0;
    color: #757682;
    font-size: 14px;
    line-height: 1.7;
  }

  .formulario {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .campo {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .campo > label {
    font-size: 14px;
    font-weight: 600;
  }

  .entrada {
    height: 48px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 13px;
    border: 1px solid #e0e5f2;
    border-radius: 9px;
    background: #f7f8ff;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }

  .entrada:focus-within {
    background: #fff;
    border-color: #316bf3;
    box-shadow: 0 0 0 3px rgba(49, 107, 243, 0.11);
  }

  .entrada > .material-symbols-outlined {
    color: #757d92;
    font-size: 21px;
  }

  .entrada input {
    min-width: 0;
    flex: 1;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #111c2d;
    font-size: 14px;
  }

  .entrada input::placeholder {
    color: #969db0;
  }

  .ver-contrasena {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: 0;
    color: #757682;
    background: transparent;
  }

  .ver-contrasena:hover {
    color: #0051d5;
  }

  .opciones {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: -3px;
  }

  .recordar {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #444651;
    font-size: 12px;
    cursor: pointer;
  }

  .recordar input {
    width: 16px;
    height: 16px;
    accent-color: #0051d5;
  }

  .enlace {
    padding: 0;
    border: 0;
    background: transparent;
    color: #0051d5;
    font-size: 12px;
    font-weight: 700;
    text-align: right;
  }

  .enlace:hover {
    color: #00236f;
    text-decoration: underline;
  }

  .boton-principal {
    width: 100%;
    min-height: 49px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 0;
    border-radius: 9px;
    background: #0051d5;
    color: white;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 5px 12px rgba(0, 81, 213, 0.16);
    transition: background 0.2s, transform 0.2s;
  }

  .boton-principal:hover {
    background: #00236f;
  }

  .boton-principal:active {
    transform: scale(0.99);
  }

  .pie-formulario {
    margin: 35px -48px 0;
    padding: 21px 30px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 13px;
    background: #f4f6ff;
  }

  .pie-formulario p {
    margin: 0;
    color: #555e70;
    font-size: 13px;
  }

  .boton-registro {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 13px;
    border: 0;
    border-radius: 8px;
    background: #e7eeff;
    color: #00236f;
    font-size: 12px;
    font-weight: 700;
    transition: background 0.2s;
  }

  .boton-registro:hover {
    background: #d8e3fb;
  }

  .boton-registro .material-symbols-outlined {
    font-size: 18px;
  }

  .aviso {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    margin: -12px 0 22px;
    padding: 13px;
    border-radius: 9px;
    color: #93000a;
    background: #fff0ef;
    font-size: 13px;
  }

  .aviso-info {
    color: #17418d;
    background: #edf3ff;
  }

  .aviso > .material-symbols-outlined {
    font-size: 21px;
  }

  .aviso-contenido {
    flex: 1;
  }

  .aviso-contenido strong {
    display: block;
    margin-bottom: 4px;
  }

  .aviso-contenido p {
    margin: 0;
    line-height: 1.55;
  }

  .cerrar-aviso {
    display: flex;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
  }

  .panel-institucional {
    min-width: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    padding: 40px 35px 24px;
    background: linear-gradient(145deg, #00236f 0%, #1e3a8a 100%);
    color: #fff;
  }

  .decoracion {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .decoracion-uno {
    width: 270px;
    height: 270px;
    top: -115px;
    right: -95px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 0 0 35px rgba(255, 255, 255, 0.025);
  }

  .decoracion-dos {
    width: 220px;
    height: 220px;
    bottom: 90px;
    right: -100px;
    background: rgba(49, 107, 243, 0.2);
    filter: blur(35px);
  }

  .contenido-institucional,
  .zona-inferior {
    position: relative;
    z-index: 1;
  }

  .insignia {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 9px 12px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.1);
    color: #dce1ff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .punto-verde {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #62df7d;
    box-shadow: 0 0 10px rgba(98, 223, 125, 0.4);
  }

  .presentacion {
    margin-top: 28px;
  }

  .presentacion h2 {
    margin: 0;
    font: 700 29px/1.3 'Manrope', sans-serif;
    letter-spacing: -0.6px;
  }

  .presentacion p {
    margin: 12px 0 0;
    color: #d8e3fb;
    font-size: 13px;
    line-height: 1.8;
  }

  .beneficios {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 28px;
  }

  .beneficio {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    padding: 13px;
    border: 1px solid rgba(255, 255, 255, 0.045);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.085);
    transition: background 0.2s, transform 0.2s;
  }

  .beneficio:hover {
    background: rgba(255, 255, 255, 0.13);
    transform: translateX(3px);
  }

  .icono-beneficio {
    width: 39px;
    height: 39px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.13);
  }

  .icono-beneficio .material-symbols-outlined {
    font-size: 22px;
  }

  .beneficio h3 {
    margin: 1px 0 5px;
    font: 600 13px/1.4 'Manrope', sans-serif;
  }

  .beneficio p {
    margin: 0;
    color: #d8e3fb;
    font-size: 11px;
    line-height: 1.65;
  }

  .zona-inferior {
    margin-top: 28px;
  }

  .tarjeta-doctora {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.1);
  }

  .datos-doctora {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }

  .avatar {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 50%;
    background: #dce8ff;
    color: #17418d;
  }

  .avatar .material-symbols-outlined {
    font-size: 24px;
  }

  .datos-doctora strong,
  .datos-doctora > div:last-child > span {
    display: block;
  }

  .datos-doctora strong {
    font-size: 12px;
    line-height: 1.5;
  }

  .datos-doctora > div:last-child > span {
    margin-top: 3px;
    color: #d8e3fb;
    font-size: 10px;
  }

  .sello-seguridad {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 7px;
    border-radius: 6px;
    background: rgba(0, 50, 17, 0.45);
    color: #b4ffc4;
    font-size: 9px;
    font-weight: 600;
  }

  .sello-seguridad .material-symbols-outlined {
    font-size: 14px;
  }

  .pie-institucional {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
    color: #c6d4f3;
    font-size: 10px;
  }

  .pie-institucional > div {
    display: flex;
    gap: 9px;
    align-items: center;
  }

  .pie-institucional a {
    color: inherit;
    text-decoration: none;
  }

  .pie-institucional a:hover {
    color: white;
    text-decoration: underline;
  }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    direction: ltr;
    font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }

  @media (max-width: 900px) {
    .pagina {
      padding: 22px 16px;
    }

    .contenedor {
      grid-template-columns: 1fr;
      max-width: 600px;
    }

    .panel-formulario {
      padding: 35px 30px 0;
    }

    .pie-formulario {
      margin-right: -30px;
      margin-left: -30px;
    }

    .panel-institucional {
      padding: 34px 30px 22px;
    }

    .presentacion h2 {
      font-size: 26px;
    }
  }

  @media (max-width: 480px) {
    .pagina {
      padding: 12px;
    }

    .contenedor {
      border-radius: 13px;
    }

    .panel-formulario {
      padding: 28px 20px 0;
    }

    .encabezado h1 {
      font-size: 24px;
    }

    .opciones {
      align-items: flex-start;
    }

    .enlace {
      max-width: 155px;
      line-height: 1.5;
    }

    .pie-formulario {
      margin-right: -20px;
      margin-left: -20px;
      padding: 19px 14px;
    }

    .panel-institucional {
      padding: 27px 20px 20px;
    }

    .presentacion h2 {
      font-size: 25px;
    }

    .tarjeta-doctora {
      align-items: flex-start;
      flex-direction: column;
    }

    .pie-institucional {
      align-items: flex-start;
      flex-direction: column;
    }
  }
  .inicio-medicitas {
    min-height: 100vh;
    background: #f4f7fb;
    color: #183153;
  }

  .barra-inicio {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 18px 6%;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 4px 18px rgba(20, 45, 80, 0.04);
  }

  .marca-inicio,
  .usuario-inicio {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .marca-inicio {
    font-size: 24px;
    font-weight: 800;
    color: #173b69;
  }

  .marca-inicio img {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .usuario-inicio {
    color: #425675;
    font-weight: 600;
  }

  .usuario-inicio .material-symbols-outlined {
    font-size: 30px;
    color: #2868a8;
  }

  .usuario-inicio button {
    border: 1px solid #d5dfeb;
    background: white;
    color: #234c7c;
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
  }

  .contenido-inicio {
    width: min(1100px, 88%);
    margin: 0 auto;
    padding: 65px 0;
  }

  .etiqueta-inicio {
    color: #2476a9;
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 2px;
  }

  .contenido-inicio h1 {
    margin: 12px 0;
    font-size: clamp(30px, 4vw, 44px);
    color: #183153;
  }

  .descripcion-inicio {
    color: #667891;
    font-size: 17px;
    line-height: 1.7;
  }

  .tarjetas-inicio {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
    margin-top: 38px;
  }

  .tarjeta-inicio {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 28px;
    min-height: 190px;
    text-align: left;
    border: 1px solid #e1e9f2;
    border-radius: 18px;
    background: white;
    color: #183153;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(25, 57, 92, 0.04);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .tarjeta-inicio:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(25, 57, 92, 0.10);
  }

  .tarjeta-inicio .material-symbols-outlined {
    font-size: 34px;
    color: #2476a9;
  }

  .tarjeta-inicio strong {
    font-size: 19px;
  }

  .tarjeta-inicio > span:last-child {
    color: #6b7c93;
    line-height: 1.5;
  }

  .mensaje-inicio {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 32px;
    padding: 24px;
    border-radius: 16px;
    background: #e7f2fb;
  }

  .mensaje-inicio > .material-symbols-outlined {
    font-size: 34px;
    color: #2476a9;
  }

  .mensaje-inicio p {
    margin-bottom: 0;
    color: #536a84;
  }

  @media (max-width: 700px) {
    .barra-inicio {
      align-items: flex-start;
      flex-direction: column;
    }

    .usuario-inicio {
      flex-wrap: wrap;
    }

    .contenido-inicio {
      padding: 38px 0;
    }

    .tarjetas-inicio {
      grid-template-columns: 1fr;
    }
  }
  .seccion-medicos {
    min-height: 100vh;
    padding: 45px 6%;
    background: #f4f7fb;
    color: #183153;
  }

  .encabezado-medicos {
    max-width: 1100px;
    margin: 0 auto 32px;
  }

  .boton-volver {
    margin-bottom: 35px;
    padding: 10px 16px;
    border: 1px solid #d5dfeb;
    border-radius: 10px;
    background: white;
    color: #234c7c;
    cursor: pointer;
  }

  .encabezado-medicos h1 {
    margin: 10px 0;
    font-size: clamp(28px, 4vw, 40px);
  }

  .encabezado-medicos > p:last-child {
    color: #667891;
    line-height: 1.6;
  }

  .lista-medicos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 22px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .tarjeta-medico {
    padding: 26px;
    border: 1px solid #e1e9f2;
    border-radius: 18px;
    background: white;
    box-shadow: 0 8px 24px rgba(25, 57, 92, 0.05);
  }

  .icono-medico {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 16px;
    background: #e7f2fb;
    color: #2476a9;
  }

  .icono-medico .material-symbols-outlined {
    font-size: 32px;
  }

  .tarjeta-medico h2 {
    margin: 18px 0 8px;
    font-size: 19px;
  }

  .especialidad-medico {
    color: #2476a9;
    font-weight: 700;
  }

  .tarjeta-medico p {
    overflow-wrap: anywhere;
  }

  .error-medicos {
    color: #b42318;
  }

.formulario-registro {
  gap: 14px;
}

.campos-registro {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.formulario-registro .campo {
  min-width: 0;
}

.formulario-registro .boton-principal:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.pagina:has(.formulario-registro) {
  overflow-y: auto;
  align-items: flex-start;
}

.pagina:has(.formulario-registro) .contenedor {
  margin-top: 10px;
  margin-bottom: 10px;
}

@media (max-width: 900px) {
  .pagina:has(.formulario-registro) .contenedor {
    grid-template-columns: 1fr;
  }

  .pagina:has(.formulario-registro) .panel-institucional {
    display: none;
  }

  .pagina:has(.formulario-registro) .panel-formulario {
    padding: 35px 25px 0;
  }

  .pagina:has(.formulario-registro) .pie-formulario {
    margin-left: -25px;
    margin-right: -25px;
  }
}

@media (max-width: 480px) {
  .campos-registro {
    grid-template-columns: 1fr;
  }
}

.registro-pagina {
  min-height: 100vh;
  width: 100%;
  padding: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f6fb;
  font-family: 'Public Sans', Arial, sans-serif;
  color: #172b4d;
}

.registro-contenedor {
  width: 100%;
  max-width: 1200px;
  min-height: 720px;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  overflow: hidden;
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 18px 55px rgba(20, 45, 80, 0.10);
}

.registro-panel-lateral {
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(150deg, #102d50 0%, #174b78 100%);
  color: #ffffff;
}

.registro-marca {
  display: flex;
  align-items: center;
  gap: 12px;
}

.registro-logo {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: #ffffff;
  color: #17649a;
  font-size: 27px;
}

.registro-marca strong {
  display: block;
  font-size: 22px;
  letter-spacing: -0.5px;
}

.registro-marca span {
  display: block;
  margin-top: 3px;
  color: #c5d8eb;
  font-size: 12px;
}

.registro-presentacion {
  margin: 65px 0;
}

.registro-insignia {
  display: inline-block;
  padding: 9px 14px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 30px;
  background: rgba(255,255,255,0.10);
  color: #d9edff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

.registro-presentacion h1 {
  max-width: 430px;
  margin: 25px 0 18px;
  font-family: 'Manrope', Arial, sans-serif;
  font-size: clamp(32px, 3.4vw, 43px);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -1.5px;
}

.registro-presentacion p {
  max-width: 390px;
  color: #d0dfed;
  font-size: 15px;
  line-height: 1.8;
}

.registro-tarjeta-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 15px;
  background: rgba(255,255,255,0.09);
}

.registro-info-icono {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: rgba(255,255,255,0.16);
  font-size: 21px;
}

.registro-tarjeta-info strong {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.registro-tarjeta-info p {
  margin: 0;
  color: #d0dfed;
  font-size: 12px;
  line-height: 1.6;
}

.registro-seguridad {
  margin-top: 25px;
  color: #c5d8eb;
  font-size: 12px;
  line-height: 1.6;
}

.registro-pie-lateral {
  color: #b8cce0;
  font-size: 11px;
}

.registro-formulario-panel {
  padding: 48px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.registro-encabezado {
  margin-bottom: 27px;
}

.registro-paso {
  margin-bottom: 12px;
  color: #2474a8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.registro-encabezado h2 {
  margin: 0 0 9px;
  color: #173653;
  font-family: 'Manrope', Arial, sans-serif;
  font-size: 29px;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.registro-encabezado p {
  margin: 0;
  color: #78889a;
  font-size: 13px;
  line-height: 1.6;
}

.registro-aviso {
  margin-bottom: 20px;
  padding: 13px 15px;
  border-radius: 9px;
  font-size: 13px;
  line-height: 1.5;
}

.registro-aviso-info {
  border: 1px solid #cfe4f5;
  background: #f0f8ff;
  color: #245d83;
}

.registro-formulario {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.registro-grupo {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.registro-label {
  color: #344b61;
  font-size: 12px;
  font-weight: 700;
}

.registro-perfil-seleccionado {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 13px;
  border: 1px solid #dce6ef;
  border-radius: 9px;
  background: #f8fafc;
}

.registro-perfil-icono {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #e3f1fc;
  color: #216b9c;
}

.registro-perfil-seleccionado strong {
  color: #254966;
  font-size: 13px;
}

.registro-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.registro-input {
  width: 100%;
  min-width: 0;
  height: 46px;
  padding: 0 13px;
  outline: none;
  border: 1px solid #dce5ed;
  border-radius: 9px;
  background: #ffffff;
  color: #263e54;
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.registro-input::placeholder {
  color: #a5b1bd;
}

.registro-input:focus {
  border-color: #3487bd;
  box-shadow: 0 0 0 3px rgba(52,135,189,0.12);
}

.registro-telefono {
  display: grid;
  grid-template-columns: 115px minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.registro-telefono select,
.registro-telefono input {
  display: block;
  width: 100%;
  min-width: 0;
  height: 46px;
  padding: 0 12px;
  border: 1px solid #dce5ed;
  border-radius: 9px;
  background: #ffffff;
  color: #263e54;
  font-family: inherit;
  font-size: 13px;
  box-sizing: border-box;
}
.registro-ayuda {
  color: #8795a3;
  font-size: 11px;
  line-height: 1.5;
}

.registro-ver {
  position: relative;
  display: flex;
  align-items: center;
}

.registro-ver .registro-input {
  padding-right: 75px;
}

.registro-ver button {
  position: absolute;
  right: 12px;
  border: none;
  background: transparent;
  color: #2877a8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.registro-coincide {
  color: #16834d;
  font-size: 11px;
}

.registro-no-coincide {
  color: #c04444;
  font-size: 11px;
}

.registro-terminos {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #68798a;
  font-size: 11px;
  line-height: 1.6;
}

.registro-terminos input {
  margin-top: 2px;
  accent-color: #2478ad;
}

.registro-boton {
  width: 100%;
  min-height: 49px;
  border: none;
  border-radius: 9px;
  background: #176b9e;
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.registro-boton:hover {
  background: #10577f;
  transform: translateY(-1px);
}

.registro-boton:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.registro-iniciar {
  margin-top: 23px;
  text-align: center;
  color: #82909e;
  font-size: 12px;
}

.registro-iniciar button {
  border: none;
  background: transparent;
  color: #176b9e;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.registro-pie {
  margin-top: 30px;
  color: #a1acb7;
  font-size: 10px;
  text-align: center;
}

@media (max-width: 950px) {
  .registro-pagina {
    padding: 20px;
  }

  .registro-contenedor {
    grid-template-columns: 0.8fr 1.2fr;
  }

  .registro-panel-lateral {
    padding: 35px;
  }

  .registro-formulario-panel {
    padding: 40px 35px;
  }
}

@media (max-width: 700px) {
  .registro-pagina {
    padding: 0;
    align-items: flex-start;
  }

  .registro-contenedor {
    min-height: 100vh;
    grid-template-columns: 1fr;
    border-radius: 0;
  }

  .registro-panel-lateral {
    min-height: auto;
    padding: 28px;
  }

  .registro-presentacion {
    margin: 35px 0 20px;
  }

  .registro-presentacion h1 {
    font-size: 30px;
  }

  .registro-tarjeta-info,
  .registro-seguridad,
  .registro-pie-lateral {
    display: none;
  }

  .registro-formulario-panel {
    padding: 35px 25px;
  }
}

@media (max-width: 430px) {
  .registro-grid {
    grid-template-columns: 1fr;
  }

  .registro-formulario-panel {
    padding: 30px 20px;
  }

  .registro-encabezado h2 {
    font-size: 25px;
  }
}

.registro-grupo .registro-input {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 46px;
  min-width: 0;
  padding: 0 12px;
  border: 1px solid #dce5ed;
  border-radius: 9px;
  background: #ffffff;
  box-sizing: border-box;
}

.registro-grupo .registro-input:focus-within {
  border-color: #3487bd;
  box-shadow: 0 0 0 3px rgba(52, 135, 189, 0.12);
}

.registro-grupo .registro-input > .material-symbols-outlined {
  flex-shrink: 0;
  color: #8192a5;
  font-size: 20px;
}

.registro-grupo .registro-input > input {
  display: block;
  flex: 1;
  width: 0;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #263e54;
  font-family: inherit;
  font-size: 13px;
  box-sizing: border-box;
  box-shadow: none;
}

.registro-grupo .registro-input > input:focus {
  border: none;
  outline: none;
  box-shadow: none;
}

.registro-grupo .registro-input > button.registro-ver {
  position: static;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: auto;
  height: auto;
  padding: 5px;
  border: none;
  background: transparent;
  color: #2877a8;
  font-size: 11px;
  cursor: pointer;
}

.registro-ver .material-symbols-outlined {
  font-size: 18px;
}

.registro-telefono {
  display: grid;
  grid-template-columns: 105px minmax(0, 1fr);
  gap: 9px;
  width: 100%;
}

.registro-telefono select,
.registro-telefono input {
  width: 100%;
  min-width: 0;
  height: 46px;
  padding: 0 10px;
  border: 1px solid #dce5ed;
  border-radius: 9px;
  background: #ffffff;
  color: #263e54;
  font-family: inherit;
  font-size: 13px;
  box-sizing: border-box;
}

.registro-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.registro-grupo {
  width: 100%;
  min-width: 0;
}

.registro-formulario-panel {
  min-width: 0;
}

.registro-formulario {
  width: 100%;
}

.registro-presentacion h1 {
  color: #ffffff !important;
}

@media (max-width: 700px) {
  .registro-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 430px) {
  .registro-telefono {
    grid-template-columns: 90px minmax(0, 1fr);
  }
}
.registro-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}

.registro-telefono input {
  flex: 1;
}

.pagina:has(.inicio-medicitas) {
  display: block;
  min-height: 100vh;
  width: 100%;
  padding: 0;
  overflow: visible;
  background: #f4f7fc;
}

.pagina:has(.inicio-medicitas) > .fondo {
  display: none;
}

.inicio-medicitas {
  width: 100%;
  min-height: 100vh;
  background: #f4f7fc;
  color: #183153;
  font-family: 'Manrope', sans-serif;
}

.barra-inicio {
  width: 100%;
  min-height: 76px;
  padding: 0 5%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  background: #ffffff;
  border-bottom: 1px solid #e5ebf3;
  box-shadow: 0 3px 12px rgba(20, 45, 80, 0.04);
}

.marca-inicio {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  color: #173b69;
  font-size: 21px;
}

.marca-inicio > .material-symbols-outlined {
  color: #1769b1;
  font-size: 32px;
}

.estado-portal {
  padding: 6px 11px;
  border-radius: 20px;
  background: #e8f7ef;
  color: #168653;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.navegacion-inicio {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

.navegacion-inicio button {
  padding: 27px 0;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: #65748b;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.navegacion-inicio button:hover,
.navegacion-inicio button.nav-activo {
  color: #1769b1;
  border-bottom-color: #1769b1;
}

.usuario-inicio {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #405673;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.usuario-inicio > .material-symbols-outlined {
  color: #2868a8;
  font-size: 28px;
}

.usuario-inicio button {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  border: 1px solid #e1e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #536b86;
  cursor: pointer;
}

.usuario-inicio button:hover {
  background: #fff0f0;
  color: #c43d3d;
}

.contenido-inicio {
  width: min(1180px, 90%);
  margin: 0 auto;
  padding: 45px 0 55px;
}

.bienvenida-inicio {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  margin-bottom: 32px;
}

.bienvenida-texto {
  min-width: 0;
}

.etiqueta-inicio {
  display: inline-block;
  margin-bottom: 12px;
  padding: 7px 12px;
  border-radius: 20px;
  background: #e6f1ff;
  color: #1769b1;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.bienvenida-texto h1 {
  margin: 0 0 9px;
  color: #17365f;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(27px, 3.5vw, 36px);
  font-weight: 800;
  letter-spacing: -1px;
}

.bienvenida-texto p {
  margin: 0;
  color: #74849a;
  font-size: 14px;
}

.bienvenida-icono {
  width: auto;
  height: auto;
  min-width: 290px;
  max-width: 360px;
  padding: 17px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #dceaff;
  border-radius: 15px;
  background: #ffffff;
  color: #1769b1;
}

.bienvenida-icono > .material-symbols-outlined {
  flex-shrink: 0;
  font-size: 34px;
}

.bienvenida-icono strong {
  display: block;
  color: #24476e;
  font-size: 12px;
}

.bienvenida-icono p {
  margin: 5px 0 0;
  color: #7b899d;
  font-size: 11px;
  line-height: 1.5;
}

.panel-tarjetas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  gap: 20px;
  margin-bottom: 38px;
}

.tarjeta-panel {
  min-width: 0;
  min-height: 250px;
  padding: 23px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid #e5ebf3;
  border-radius: 17px;
  background: #ffffff;
  box-shadow: 0 5px 18px rgba(31, 61, 99, 0.045);
  transition: transform 0.2s, box-shadow 0.2s;
}

.tarjeta-panel:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(31, 61, 99, 0.09);
}

.tarjeta-panel-cabecera {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  margin-bottom: 19px;
}

.icono-panel {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 14px;
}

.icono-panel .material-symbols-outlined {
  font-size: 25px;
}

.icono-azul {
  background: #e8f2ff;
  color: #1769b1;
}

.icono-lila {
  background: #f0eaff;
  color: #7856c7;
}

.tarjeta-panel h2 {
  margin: 0 0 5px;
  color: #203b60;
  font-size: 16px;
  font-weight: 800;
}

.tarjeta-panel-cabecera span:not(.material-symbols-outlined) {
  color: #8290a3;
  font-size: 11px;
}

.tarjeta-panel > p {
  margin: 0 0 20px;
  color: #75849a;
  font-size: 12px;
  line-height: 1.7;
}

.tarjeta-panel > button {
  width: 100%;
  min-height: 42px;
  margin-top: auto;
  padding: 10px 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 0;
  border-radius: 9px;
  background: #1769b1;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tarjeta-panel > button:hover {
  background: #124e88;
}

.tarjeta-panel > button .material-symbols-outlined {
  font-size: 18px;
}

.tarjeta-panel > button.boton-secundario {
  background: #eeeaff;
  color: #7053bd;
}

.tarjeta-panel > button.boton-secundario:hover {
  background: #e2dcff;
}

.tarjeta-proxima {
  background: linear-gradient(145deg, #1769b1, #164b83);
  border: 0;
  color: #ffffff;
}

.tarjeta-proxima h2,
.tarjeta-proxima > p {
  color: #ffffff;
}

.proxima-etiqueta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #dcecff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
}

.proxima-etiqueta .material-symbols-outlined {
  font-size: 19px;
}

.dato-proxima {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 7px 0;
}

.dato-proxima > .material-symbols-outlined {
  color: #d6e9ff;
  font-size: 20px;
}

.dato-proxima small,
.dato-proxima strong {
  display: block;
}

.dato-proxima small {
  margin-bottom: 3px;
  color: #d6e9ff;
  font-size: 10px;
}

.dato-proxima strong {
  color: #ffffff;
  font-size: 12px;
}

.tarjeta-proxima > button {
  margin-top: auto;
  background: #ffffff;
  color: #1760a0;
}

.tarjeta-proxima > button:hover {
  background: #eaf3ff;
}

.acciones-inicio {
  margin-bottom: 30px;
}

.titulo-seccion-inicio {
  margin-bottom: 18px;
}

.titulo-seccion-inicio h2 {
  margin: 0 0 6px;
  color: #203b60;
  font-size: 21px;
  font-weight: 800;
}

.titulo-seccion-inicio p {
  margin: 0;
  color: #8290a3;
  font-size: 12px;
}

.acciones-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
}

.accion-rapida {
  min-width: 0;
  min-height: 155px;
  padding: 19px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 9px;
  text-align: left;
  border: 1px solid #e5ebf3;
  border-radius: 14px;
  background: #ffffff;
  color: #203b60;
  cursor: pointer;
  transition: all 0.2s;
}

.accion-rapida:hover {
  transform: translateY(-3px);
  border-color: #a9ccef;
  box-shadow: 0 8px 20px rgba(31, 61, 99, 0.07);
}

.accion-rapida > .material-symbols-outlined {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: #e8f2ff;
  color: #1769b1;
  font-size: 22px;
}

.accion-rapida strong {
  color: #244365;
  font-size: 12px;
  font-weight: 800;
}

.accion-rapida small {
  color: #8290a3;
  font-size: 10px;
  line-height: 1.5;
}

.mensaje-inicio {
  width: 100%;
  padding: 19px 22px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid #d9eaff;
  border-radius: 14px;
  background: #eaf4ff;
  color: #285b91;
}

.mensaje-inicio > .material-symbols-outlined {
  flex-shrink: 0;
  font-size: 29px;
}

.mensaje-inicio strong {
  font-size: 13px;
}

.mensaje-inicio p {
  margin: 5px 0 0;
  color: #587693;
  font-size: 11px;
  line-height: 1.6;
}

@media (max-width: 1000px) {
  .barra-inicio {
    flex-wrap: wrap;
    padding: 15px 4%;
  }

  .navegacion-inicio {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .navegacion-inicio button {
    padding: 12px 0;
  }

  .panel-tarjetas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .acciones-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bienvenida-icono {
    min-width: 250px;
  }
}

@media (max-width: 600px) {
  .barra-inicio {
    align-items: flex-start;
    gap: 14px;
  }

  .marca-inicio {
    font-size: 18px;
  }

  .estado-portal {
    font-size: 9px;
  }

  .usuario-inicio {
    margin-left: auto;
    font-size: 11px;
  }

  .navegacion-inicio {
    justify-content: space-between;
    gap: 10px;
  }

  .navegacion-inicio button {
    font-size: 11px;
  }

  .contenido-inicio {
    width: 91%;
    padding: 28px 0 40px;
  }

  .bienvenida-inicio {
    flex-direction: column;
    align-items: stretch;
  }

  .bienvenida-icono {
    width: 100%;
    min-width: 0;
    max-width: none;
  }

  .panel-tarjetas,
  .acciones-grid {
    grid-template-columns: 1fr;
  }

  .tarjeta-panel {
    min-height: 220px;
  }

  .accion-rapida {
    min-height: 125px;
  }
}

.seccion-medicos {
  min-height: 100vh;
  padding: 35px 6%;
  background: #f5f8fc;
  color: #26364a;
}

.encabezado-medicos {
  max-width: 1100px;
  margin: 0 auto 35px;
}

.boton-volver {
  border: none;
  background: transparent;
  color: #2878b8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 28px;
}

.boton-volver:hover {
  color: #155b91;
}

.encabezado-medicos h1 {
  margin: 8px 0;
  font-size: 34px;
  font-weight: 750;
  color: #173653;
}

.encabezado-medicos > p:last-child {
  color: #718096;
  font-size: 15px;
}

.etiqueta-inicio {
  color: #2784bd;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.lista-medicos {
  max-width: 1100px;
  margin: 0 auto 45px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px;
}

.tarjeta-medico {
  background: #ffffff;
  border: 1px solid #e5edf5;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 5px 18px rgba(34, 75, 110, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tarjeta-medico:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(34, 75, 110, 0.11);
}

.icono-medico {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f3fc;
  color: #287fba;
  border-radius: 14px;
  margin-bottom: 18px;
}

.icono-medico .material-symbols-outlined {
  font-size: 29px;
}

.tarjeta-medico h2 {
  color: #203c58;
  font-size: 18px;
  margin: 0 0 10px;
}

.tarjeta-medico p {
  color: #718096;
  font-size: 13px;
  margin: 8px 0;
}

.tarjeta-medico .especialidad-medico {
  color: #2784bd;
  font-weight: 700;
  font-size: 14px;
}

.tarjeta-medico button {
  width: 100%;
  margin-top: 18px;
  padding: 11px;
  border: 1px solid #287fba;
  border-radius: 9px;
  background: white;
  color: #287fba;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.tarjeta-medico button:hover {
  background: #287fba;
  color: white;
}

.formulario-agendar {
  max-width: 850px;
  margin: 0 auto 40px;
  padding: 32px;
  background: #ffffff;
  border: 1px solid #e4edf5;
  border-radius: 18px;
  box-shadow: 0 8px 28px rgba(34, 75, 110, 0.07);
}

.encabezado-formulario {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 24px;
  margin-bottom: 25px;
  border-bottom: 1px solid #edf1f5;
}

.encabezado-formulario > .material-symbols-outlined {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f3fc;
  color: #287fba;
  border-radius: 14px;
  font-size: 29px;
}

.encabezado-formulario h2 {
  margin: 0 0 6px;
  color: #173653;
  font-size: 22px;
}

.encabezado-formulario p {
  margin: 0;
  color: #8492a3;
  font-size: 13px;
}

.formulario-agendar form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.campo-cita {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.campo-cita:first-child,
.campo-cita:last-of-type {
  grid-column: 1 / -1;
}

.campo-cita label {
  color: #354b62;
  font-size: 13px;
  font-weight: 700;
}

.campo-cita input,
.campo-cita select,
.campo-cita textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 14px;
  border: 1px solid #dce5ee;
  border-radius: 9px;
  background: #fbfdff;
  color: #34495e;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.campo-cita input,
.campo-cita select {
  min-height: 46px;
}

.campo-cita textarea {
  resize: vertical;
  min-height: 105px;
}

.campo-cita input:focus,
.campo-cita select:focus,
.campo-cita textarea:focus {
  border-color: #328ac2;
  box-shadow: 0 0 0 3px rgba(50, 138, 194, 0.12);
}

.campo-cita input::placeholder,
.campo-cita textarea::placeholder {
  color: #a3afbd;
}

.boton-agendar {
  grid-column: 1 / -1;
  width: 100%;
  min-height: 49px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  border: none;
  border-radius: 10px;
  background: #287fba;
  color: white;
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.boton-agendar:hover:not(:disabled) {
  background: #19699f;
  transform: translateY(-1px);
}

.boton-agendar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mensaje-exito {
  grid-column: 1 / -1;
  padding: 13px 15px;
  border-radius: 9px;
  background: #e8f7ef;
  color: #247447;
  font-size: 14px;
  font-weight: 600;
}

.error-medicos {
  padding: 13px 15px;
  border-radius: 9px;
  background: #fff0f0;
  color: #b83232;
  font-size: 14px;
}

@media (max-width: 650px) {
  .seccion-medicos {
    padding: 25px 5%;
  }

  .encabezado-medicos h1 {
    font-size: 27px;
  }

  .formulario-agendar {
    padding: 22px 17px;
  }

  .formulario-agendar form {
    grid-template-columns: 1fr;
  }

  .campo-cita:first-child,
  .campo-cita:last-of-type {
    grid-column: auto;
  }

  .encabezado-formulario h2 {
    font-size: 19px;
  }
}

.seccion-medicos {
  width: 100%;
  box-sizing: border-box;
}

.seccion-medicos .lista-medicos {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 45px;
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}

.seccion-medicos .tarjeta-medico {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.seccion-medicos .formulario-agendar {
  width: 100%;
  max-width: 900px;
  margin: 0 auto 40px;
  box-sizing: border-box;
}

.seccion-medicos .formulario-agendar form {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.seccion-medicos .campo-cita:first-child,
.seccion-medicos .campo-cita:last-of-type,
.seccion-medicos .boton-agendar,
.seccion-medicos .mensaje-exito,
.seccion-medicos .error-medicos {
  grid-column: 1 / -1;
}

@media (max-width: 850px) {
  .seccion-medicos .lista-medicos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .seccion-medicos .lista-medicos {
    grid-template-columns: 1fr;
  }

  .seccion-medicos .formulario-agendar form {
    grid-template-columns: 1fr;
  }

  .seccion-medicos .campo-cita,
  .seccion-medicos .campo-cita:first-child,
  .seccion-medicos .campo-cita:last-of-type {
    grid-column: 1;
  }
}

.seccion-medicos {
  width: 100%;
  min-height: 100vh;
  padding: 40px 5%;
  box-sizing: border-box;
}

.seccion-medicos .encabezado-medicos {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 35px;
}

.seccion-medicos .lista-medicos {
  display: grid !important;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 45px;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 24px;
}

.seccion-medicos .tarjeta-medico {
  width: 100%;
  min-width: 0;
  height: 100%;
}

.seccion-medicos .formulario-agendar {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 40px;
}

.seccion-medicos .formulario-agendar form {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 22px;
}

.seccion-medicos .campo-cita:first-child,
.seccion-medicos .campo-cita:last-of-type,
.seccion-medicos .boton-agendar {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .seccion-medicos .lista-medicos {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 600px) {
  .seccion-medicos {
    padding: 25px 5%;
  }

  .seccion-medicos .lista-medicos {
    grid-template-columns: 1fr !important;
  }

  .seccion-medicos .formulario-agendar form {
    grid-template-columns: 1fr !important;
  }

  .seccion-medicos .campo-cita {
    grid-column: 1 !important;
  }
}

.panel-administrador {
  width: 100%;
  max-width: 1250px;
  margin: 0 auto;
  padding: 45px 35px;
  position: relative;
  z-index: 1;
}

.encabezado-admin {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 35px;
}

.encabezado-admin h1 {
  color: #173b4d;
  font-size: 32px;
  margin: 8px 0;
  font-weight: 800;
}

.encabezado-admin p {
  color: #718096;
  margin: 0;
}

.bienvenida-admin {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  margin-bottom: 35px;
  border-radius: 18px;
  background: linear-gradient(120deg, #e5f5f2, #eef5fc);
  border: 1px solid #d7eae7;
}

.bienvenida-admin > span {
  font-size: 42px;
  color: #168b80;
}

.bienvenida-admin h2 {
  color: #173b4d;
  margin: 0 0 7px;
  font-size: 21px;
}

.bienvenida-admin p {
  color: #64748b;
  margin: 0;
}

.opciones-admin {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}

.opcion-admin {
  min-height: 190px;
  padding: 25px;
  text-align: left;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.opcion-admin:hover {
  transform: translateY(-5px);
  border-color: #8acdc3;
  box-shadow: 0 12px 28px rgba(23, 59, 77, 0.10);
}

.opcion-admin > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 15px;
  border-radius: 14px;
  background: #e5f5f2;
  color: #168b80;
  font-size: 29px;
}

.opcion-admin h3 {
  color: #173b4d;
  font-size: 18px;
  margin: 0 0 8px;
}

.opcion-admin p {
  color: #718096;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 900px) {
  .opciones-admin {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .panel-administrador {
    padding: 25px 16px;
  }

  .encabezado-admin {
    align-items: flex-start;
    flex-direction: column;
  }

  .encabezado-admin h1 {
    font-size: 25px;
  }

  .opciones-admin {
    grid-template-columns: 1fr;
  }

  .bienvenida-admin {
    align-items: flex-start;
    padding: 18px;
  }
}

.dias-horario {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.dias-horario label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #dce5e7;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  font-size: 14px;
}

.dias-horario input[type="checkbox"] {
  width: 17px;
  height: 17px;
  accent-color: #168b83;
  cursor: pointer;
}

.dias-horario label:has(input:checked) {
  border-color: #168b83;
  background: #eaf7f5;
}

.formulario-agendar h2,
.lista-medicos h2 {
  margin-bottom: 18px;
}

.lista-medicos .tarjeta-medico {
  margin-bottom: 15px;
}

@media (max-width: 600px) {
  .dias-horario {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.formulario-edicion-horario {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid #dce5e7;
  border-radius: 12px;
  background: #f8fbfb;
}

.formulario-edicion-horario h4 {
  margin: 0 0 14px;
}

.acciones-horario {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

/* =====================================
   GESTIÓN DE PACIENTES - MEDICITAS
===================================== */

.contenedor-principal {
  width: 100%;
  max-width: 1250px;
  margin: 0 auto;
  padding: 45px 35px;
  position: relative;
  z-index: 1;
  color: #173b4d;
}

.encabezado-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.encabezado-seccion h1 {
  color: #173b4d;
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px;
}

.encabezado-seccion p {
  color: #718096;
  margin: 0;
}

.encabezado-seccion button,
.acciones-pacientes button,
.formulario-paciente button {
  border: none;
  border-radius: 10px;
  padding: 12px 20px;
  background: #176b68;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.encabezado-seccion button:hover,
.acciones-pacientes button:hover,
.formulario-paciente button:hover {
  background: #125451;
  transform: translateY(-2px);
}

.acciones-pacientes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 22px;
  margin-bottom: 25px;
  background: #ffffff;
  border: 1px solid #e3eceb;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(23, 59, 77, 0.06);
}

.acciones-pacientes input {
  flex: 1;
  min-width: 220px;
  padding: 12px 15px;
  border: 1px solid #d7e2e5;
  border-radius: 10px;
  outline: none;
  color: #173b4d;
  background: #fbfdfd;
  font-size: 14px;
}

.acciones-pacientes input:focus,
.formulario-paciente input:focus {
  border-color: #399b91;
  box-shadow: 0 0 0 3px rgba(57, 155, 145, 0.12);
}

.acciones-pacientes button:disabled,
.formulario-paciente button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.formulario-paciente {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
  padding: 25px;
  margin-bottom: 25px;
  background: linear-gradient(135deg, #ffffff, #f3faf8);
  border: 1px solid #dcece8;
  border-radius: 18px;
  box-shadow: 0 5px 18px rgba(23, 59, 77, 0.06);
}

.formulario-paciente h2 {
  grid-column: 1 / -1;
  margin: 0 0 8px;
  color: #173b4d;
  font-size: 21px;
}

.formulario-paciente input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 15px;
  border: 1px solid #d7e2e5;
  border-radius: 10px;
  outline: none;
  background: #ffffff;
  color: #173b4d;
  font-size: 14px;
}

.formulario-paciente button {
  grid-column: 1 / -1;
  justify-self: start;
  min-width: 180px;
}

.tabla-pacientes {
  padding: 25px;
  background: #ffffff;
  border: 1px solid #e3eceb;
  border-radius: 18px;
  box-shadow: 0 5px 18px rgba(23, 59, 77, 0.06);
  overflow-x: auto;
}

.tabla-pacientes h2 {
  margin: 0 0 22px;
  color: #173b4d;
  font-size: 21px;
}

.tabla-pacientes table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px;
}

.tabla-pacientes th {
  padding: 15px;
  text-align: left;
  background: #eaf5f3;
  color: #176b68;
  font-size: 13px;
  font-weight: 800;
  border-bottom: 1px solid #dcece8;
}

.tabla-pacientes td {
  padding: 15px;
  color: #526777;
  font-size: 14px;
  border-bottom: 1px solid #edf1f2;
}

.tabla-pacientes tbody tr:hover {
  background: #f6fbfa;
}

.tabla-pacientes tbody tr:last-child td {
  border-bottom: none;
}

.mensaje-exito,
.mensaje-error {
  padding: 13px 16px;
  margin: 0 0 18px;
  border-radius: 10px;
  font-size: 14px;
}

.mensaje-exito {
  color: #176b54;
  background: #e7f7ef;
  border: 1px solid #c8ead8;
}

.mensaje-error {
  color: #a83232;
  background: #fff0f0;
  border: 1px solid #f4d0d0;
}

/* Adaptación a celulares y pantallas pequeñas */
@media (max-width: 700px) {
  .contenedor-principal {
    padding: 25px 16px;
  }

  .encabezado-seccion {
    align-items: flex-start;
    flex-direction: column;
  }

  .encabezado-seccion h1 {
    font-size: 26px;
  }

  .acciones-pacientes {
    flex-direction: column;
  }

  .acciones-pacientes input,
  .acciones-pacientes button {
    width: 100%;
    box-sizing: border-box;
  }

  .formulario-paciente {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .formulario-paciente h2,
  .formulario-paciente button {
    grid-column: 1;
  }

  .tabla-pacientes {
    padding: 18px;
  }
}

.seccion-citas {
  width: 100%;
  max-width: 1250px;
  margin: 0 auto;
  padding: 45px 35px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.encabezado-citas {
  margin-bottom: 30px;
}

.encabezado-citas .boton-volver {
  margin-bottom: 25px;
}

.encabezado-citas h1 {
  color: #173b4d;
  font-size: 32px;
  font-weight: 800;
  margin: 8px 0;
}

.encabezado-citas > p:last-child {
  color: #718096;
  margin: 0;
}

.resumen-citas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

.resumen-cita {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e3eceb;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(23, 59, 77, 0.05);
}

.resumen-cita > span {
  font-size: 30px;
  color: #25877f;
  background: #e8f5f2;
  padding: 12px;
  border-radius: 12px;
}

.resumen-cita strong {
  color: #173b4d;
  font-size: 25px;
}

.resumen-cita p {
  margin: 3px 0 0;
  color: #718096;
  font-size: 13px;
}

.lista-citas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.tarjeta-cita {
  padding: 23px;
  background: #fff;
  border: 1px solid #e3eceb;
  border-radius: 17px;
  box-shadow: 0 5px 18px rgba(23, 59, 77, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tarjeta-cita:hover {
  transform: translateY(-3px);
  box-shadow: 0 9px 24px rgba(23, 59, 77, 0.09);
}

.tarjeta-cita-superior {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf1f2;
}

.icono-cita {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #176b68;
  background: #e8f5f2;
  border-radius: 13px;
}

.icono-cita span {
  font-size: 27px;
}

.informacion-cita {
  flex: 1;
  min-width: 0;
}

.informacion-cita h2 {
  margin: 0 0 5px;
  color: #173b4d;
  font-size: 18px;
}

.informacion-cita p {
  margin: 0;
  color: #718096;
  font-size: 13px;
}

.estado-cita {
  padding: 7px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  background: #fff3df;
  color: #a96508;
}

.estado-pendiente {
  background: #fff3df;
  color: #a96508;
}

.estado-confirmada {
  background: #e3f6eb;
  color: #187548;
}

.estado-cancelada {
  background: #fdeaea;
  color: #bd3737;
}

.detalles-cita {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding-top: 20px;
}

.detalles-cita > div {
  display: flex;
  align-items: flex-start;
  gap: 9px;
}

.detalles-cita > div > span {
  color: #399b91;
  font-size: 21px;
}

.detalles-cita p {
  margin: 0;
  color: #526777;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.detalles-cita strong {
  display: block;
  color: #173b4d;
  margin-bottom: 3px;
}

.estado-citas {
  grid-column: 1 / -1;
  padding: 35px;
  text-align: center;
  color: #718096;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e3eceb;
}

/* BOTONES DEL MÓDULO DE CITAS */

.seccion-citas button {
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
}

/* Botón volver */
.seccion-citas .boton-volver {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  color: #173b4d;
  background: #ffffff;
  border: 1px solid #dce7e9;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.seccion-citas .boton-volver:hover {
  background: #edf6f5;
  border-color: #25877f;
}

/* Botón registrar cita */
.seccion-citas .boton-registrar-cita {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 13px 22px;
  color: #ffffff;
  background: #25877f;
  border: none;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(37, 135, 127, 0.20);
}

.seccion-citas .boton-registrar-cita:hover {
  background: #176b68;
  transform: translateY(-2px);
  box-shadow: 0 7px 16px rgba(37, 135, 127, 0.25);
}

/* Estados de los botones */
.seccion-citas button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Adaptación a pantallas pequeñas */
@media (max-width: 650px) {
  .resumen-citas,
  .lista-citas {
    grid-template-columns: 1fr;
  }

  .seccion-citas {
    padding: 25px 16px;
  }

  .detalles-cita {
    grid-template-columns: 1fr;
  }
}

/* BOTONES DEL FORMULARIO DE CITAS */

.seccion-citas .boton-cancelar-cita,
.seccion-citas .boton-guardar-cita {
  min-width: 125px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

/* Cancelar */
.seccion-citas .boton-cancelar-cita {
  color: #526777;
  background: #ffffff;
  border: 1px solid #dce5eb;
}

.seccion-citas .boton-cancelar-cita:hover {
  background: #f1f5f7;
  border-color: #aabac3;
}

/* Guardar cita */
.seccion-citas .boton-guardar-cita {
  color: #ffffff;
  background: #25877f;
  border: 1px solid #25877f;
  box-shadow: 0 4px 10px rgba(37, 135, 127, 0.18);
}

.seccion-citas .boton-guardar-cita:hover {
  background: #176b68;
  border-color: #176b68;
  transform: translateY(-2px);
}

.seccion-citas .boton-guardar-cita:disabled {
  background: #9bbdb9;
  border-color: #9bbdb9;
  box-shadow: none;
}

@media (max-width: 800px) {
  .seccion-citas {
    padding: 25px 16px;
  }

  .lista-citas {
    grid-template-columns: 1fr;
  }

  .resumen-citas {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .tarjeta-cita-superior {
    flex-wrap: wrap;
  }

  .estado-cita {
    margin-left: auto;
  }

  .detalles-cita {
    grid-template-columns: 1fr;
  }

  .encabezado-citas h1 {
    font-size: 26px;
  }
}
/* Botón para registrar una nueva cita */
.boton-nueva-cita {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 22px;
  margin-top: 18px;
  background: #0f766e;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.18);
  transition: all 0.2s ease;
}

.boton-nueva-cita:hover {
  background: #115e59;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 118, 110, 0.25);
}

.boton-nueva-cita:active {
  transform: translateY(0);
}

.boton-nueva-cita .material-symbols-outlined {
  font-size: 21px;
  line-height: 1;
}
/* BOTÓN CERRAR FORMULARIO DE CITAS */

.seccion-citas .cerrar-formulario-cita {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #718096;
  background: #f4f7f8;
  border: 1px solid #e3eceb;
  border-radius: 10px;
  font-size: 25px;
  line-height: 1;
}

.seccion-citas .cerrar-formulario-cita:hover {
  color: #bd3737;
  background: #fdeaea;
  border-color: #f5caca;
  transform: rotate(90deg);
}

/* FORMULARIO DE REGISTRO DE CITAS */

.seccion-citas .formulario-registro-cita {
  width: 100%;
  margin-bottom: 30px;
  padding: 28px;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e3eceb;
  border-radius: 18px;
  box-shadow: 0 6px 22px rgba(23, 59, 77, 0.07);
}

/* ENCABEZADO DEL FORMULARIO */

.seccion-citas .encabezado-formulario-cita {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #edf1f2;
}

.seccion-citas .encabezado-formulario-cita h2 {
  margin: 0 0 7px;
  color: #173b4d;
  font-size: 22px;
  font-weight: 800;
}

.seccion-citas .encabezado-formulario-cita p {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

/* DISTRIBUCIÓN DE LOS CAMPOS */

.seccion-citas .campos-formulario-cita {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.seccion-citas .campo-cita {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seccion-citas .campo-cita-completo {
  grid-column: 1 / -1;
}

/* ETIQUETAS */

.seccion-citas .campo-cita label {
  color: #173b4d;
  font-size: 14px;
  font-weight: 700;
}

/* CAMPOS DE ENTRADA */

.seccion-citas .campo-cita input,
.seccion-citas .campo-cita select,
.seccion-citas .campo-cita textarea {
  width: 100%;
  min-height: 46px;
  padding: 12px 14px;
  box-sizing: border-box;
  color: #334e5c;
  background: #fbfdfd;
  border: 1px solid #dce7e9;
  border-radius: 10px;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.seccion-citas .campo-cita textarea {
  min-height: 100px;
  resize: vertical;
}

.seccion-citas .campo-cita input:focus,
.seccion-citas .campo-cita select:focus,
.seccion-citas .campo-cita textarea:focus {
  border-color: #25877f;
  box-shadow: 0 0 0 3px rgba(37, 135, 127, 0.12);
  background: #ffffff;
}

/* ACCIONES DEL FORMULARIO */

.seccion-citas .acciones-formulario-cita {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #edf1f2;
}

/* MENSAJES */

.seccion-citas .mensaje-error-cita,
.seccion-citas .mensaje-exito-cita {
  margin: 18px 0 0;
  padding: 12px 15px;
  border-radius: 9px;
  font-size: 13px;
}

.seccion-citas .mensaje-error-cita {
  color: #bd3737;
  background: #fdeaea;
  border: 1px solid #f5caca;
}

.seccion-citas .mensaje-exito-cita {
  color: #187548;
  background: #e3f6eb;
  border: 1px solid #c6ead5;
}

/* DISEÑO RESPONSIVE */

@media (max-width: 650px) {
  .seccion-citas .formulario-registro-cita {
    padding: 20px 16px;
  }

  .seccion-citas .campos-formulario-cita {
    grid-template-columns: 1fr;
  }

  .seccion-citas .campo-cita-completo {
    grid-column: auto;
  }

  .seccion-citas .acciones-formulario-cita {
    flex-direction: column-reverse;
  }

  .seccion-citas .acciones-formulario-cita button {
    width: 100%;
  }
}

/* ACCIONES DE LAS TARJETAS DE CITAS */

.seccion-citas .acciones-tarjeta-cita {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  padding-top: 17px;
  border-top: 1px solid #edf1f2;
}

.seccion-citas .boton-confirmar-cita,
.seccion-citas .boton-cancelar-cita-listado {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
}

.seccion-citas .boton-confirmar-cita {
  color: #187548;
  background: #e3f6eb;
  border: 1px solid #c6ead5;
}

.seccion-citas .boton-confirmar-cita:hover {
  color: #ffffff;
  background: #187548;
  transform: translateY(-2px);
}

.seccion-citas .boton-cancelar-cita-listado {
  color: #bd3737;
  background: #fdeaea;
  border: 1px solid #f5caca;
}

.seccion-citas .boton-cancelar-cita-listado:hover {
  color: #ffffff;
  background: #bd3737;
  transform: translateY(-2px);
}

.seccion-citas .acciones-tarjeta-cita .material-symbols-outlined {
  font-size: 18px;
}
  </style>