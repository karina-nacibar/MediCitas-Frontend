<script setup>
import { ref } from 'vue'
import api from './services/api'

// ==========================================
// DATOS DEL FORMULARIO DE INICIO DE SESIÓN
// ==========================================

const correo = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)
const recordar = ref(true)

// ==========================================
// DATOS DEL FORMULARIO DE REGISTRO
// ==========================================

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

// ==========================================
// ESTADO GENERAL DE LA APLICACIÓN
// ==========================================

const mensaje = ref('')
const tipoMensaje = ref('error')
const cargando = ref(false)
const vistaActual = ref('login')
const usuarioActual = ref(null)

// ==========================================
// ESTADO DE LA SECCIÓN DE MÉDICOS
// ==========================================

const medicos = ref([])
const cargandoMedicos = ref(false)
const errorMedicos = ref('')

// ==========================================
// ESTADO DE LA SECCIÓN DE CITAS
// ==========================================

const citas = ref([])
const cargandoCitas = ref(false)
const errorCitas = ref('')

// ==========================================
// INICIAR SESIÓN
// ==========================================

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
    vistaActual.value = 'inicio'

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

// ==========================================
// CERRAR SESIÓN
// ==========================================

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

// ==========================================
// ABRIR SECCIONES DE LA APLICACIÓN
// ==========================================

async function abrirSeccion(seccion) {
  mensaje.value = ''

  if (seccion === 'medicos') {
    vistaActual.value = 'medicos'
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

  if (seccion === 'perfil') {
    vistaActual.value = 'perfil'
  }
}

// ==========================================
// ABRIR PANTALLA DE REGISTRO
// ==========================================

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

// ==========================================
// REGISTRAR PACIENTE
// ==========================================

async function registrarPaciente() {
  mensaje.value = ''
  tipoMensaje.value = 'error'

  // Validar campos obligatorios
  if (
    !registro.value.nombres.trim() ||
    !registro.value.apellidos.trim() ||
    !registro.value.documento.trim() ||
    !registro.value.correo.trim() ||
    !registro.value.telefono.trim() ||
    !registro.value.contrasena ||
    !registro.value.confirmarContrasena
  ) {
    mensaje.value = 'Completa todos los campos.'
    return
  }

  // Validar correo electrónico
  const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!expresionCorreo.test(registro.value.correo.trim())) {
    mensaje.value = 'Ingresa un correo electrónico válido.'
    return
  }

  // Validar longitud de contraseña
  if (registro.value.contrasena.length < 8) {
    mensaje.value = 'La contraseña debe tener mínimo 8 caracteres.'
    return
  }

  // Validar coincidencia de contraseñas
  if (
    registro.value.contrasena !==
    registro.value.confirmarContrasena
  ) {
    mensaje.value = 'Las contraseñas no coinciden.'
    return
  }

  registroCargando.value = true

  try {
    const respuesta = await api.post('/auth/registro', {
      nombres: registro.value.nombres.trim(),
      apellidos: registro.value.apellidos.trim(),
      documento: registro.value.documento.trim(),
      correo: registro.value.correo.trim().toLowerCase(),
      telefono: `${registro.value.prefijo} ${registro.value.telefono.trim()}`,
      contrasena: registro.value.contrasena
    })

    // Guardar el correo para iniciar sesión
    correo.value = registro.value.correo.trim().toLowerCase()

    // Limpiar formulario
    registro.value = {
      nombres: '',
      apellidos: '',
      documento: '',
      correo: '',
      telefono: '',
      contrasena: '',
      confirmarContrasena: ''
    }

    // Regresar al inicio de sesión
    vistaActual.value = 'login'

    mensaje.value =
      respuesta.data.mensaje ||
      'Cuenta creada exitosamente.'

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

// ==========================================
// RECUPERAR CONTRASEÑA
// ==========================================

function recuperarContrasena() {
  mensaje.value =
    'La recuperación de contraseña está pendiente de implementar.'

  tipoMensaje.value = 'info'
}
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
              <strong>{{ citas[0].fecha }}</strong>
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
    <header class="encabezado-medicos">
      <button type="button" class="boton-volver" @click="vistaActual = 'inicio'">
        ← Volver al inicio
      </button>

      <p class="etiqueta-inicio">NUESTRO EQUIPO MÉDICO</p>
      <h1>Encuentra tu especialista</h1>
      <p>Consulta los profesionales disponibles en MediCitas.</p>
    </header>

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
      </article>
    </div>

    <p v-else>No hay médicos registrados actualmente.</p>
  </section>

<section v-if="vistaActual === 'citas'" class="seccion-medicos">
  <header class="encabezado-medicos">
    <button
      type="button"
      class="boton-volver"
      @click="vistaActual = 'inicio'"
    >
      ← Volver al inicio
    </button>

    <p class="etiqueta-inicio">MI ATENCIÓN MÉDICA</p>
    <h1>Mis citas médicas</h1>
    <p>Consulta las citas registradas en MediCitas.</p>
  </header>

  <div class="lista-medicos">
    <p v-if="cargandoCitas">Cargando citas...</p>

    <p v-else-if="errorCitas" class="error-medicos">
      {{ errorCitas }}
    </p>

    <article
      v-else-if="citas.length"
      v-for="cita in citas"
      :key="cita.id_cita"
      class="tarjeta-medico"
    >
      <div class="icono-medico">
        <span class="material-symbols-outlined">calendar_month</span>
      </div>

      <h2>Cita #{{ cita.id_cita }}</h2>

      <p>
        <strong>Fecha:</strong>
        {{ cita.fecha }}
      </p>

      <p>
        <strong>Hora:</strong>
        {{ cita.hora }}
      </p>

      <p v-if="cita.nombre_paciente || cita.paciente">
        <strong>Paciente:</strong>
        {{ cita.nombre_paciente || cita.paciente }}
      </p>

      <p v-if="cita.nombre_medico || cita.medico">
        <strong>Médico:</strong>
        {{ cita.nombre_medico || cita.medico }}
      </p>

      <p v-if="cita.especialidad">
        <strong>Especialidad:</strong>
        {{ cita.especialidad }}
      </p>

      <p v-if="cita.motivo">
        <strong>Motivo:</strong>
        {{ cita.motivo }}
      </p>

      <p>
        <strong>Estado:</strong>
        {{ cita.estado || 'Pendiente' }}
      </p>
    </article>

    <p v-else>No hay citas registradas.</p>
  </div>
</section>

<section v-if="vistaActual === 'perfil'" class="seccion-medicos">
  <header class="encabezado-medicos">
    <button
      type="button"
      class="boton-volver"
      @click="vistaActual = 'inicio'"
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

  
/* ========================================
   FORMULARIO DE REGISTRO
======================================== */

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

/* Permitir desplazamiento cuando el formulario sea largo */
.pagina:has(.formulario-registro) {
  overflow-y: auto;
  align-items: flex-start;
}

.pagina:has(.formulario-registro) .contenedor {
  margin-top: 10px;
  margin-bottom: 10px;
}

/* Adaptación para celulares */
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

/* =========================================
   REGISTRO DE PACIENTES - MEDICITAS
========================================= */

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

/* PANEL IZQUIERDO */

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

/* PANEL DERECHO */

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

/* MENSAJES */

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

/* FORMULARIO */

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

/* TÉRMINOS Y BOTÓN */

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

/* DISEÑO RESPONSIVE */

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


/* ==========================================
   CORRECCIÓN DEFINITIVA DE LOS CAMPOS
========================================== */

/* Contenedor de cada campo con icono */
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

/* Iconos dentro de los campos */
.registro-grupo .registro-input > .material-symbols-outlined {
  flex-shrink: 0;
  color: #8192a5;
  font-size: 20px;
}

/* El input debe ocupar el espacio restante */
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

/* Botón para mostrar contraseña */
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

/* Campos de teléfono */
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

/* Distribución de los campos */
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

/* Título blanco sobre el fondo azul */
.registro-presentacion h1 {
  color: #ffffff !important;
}

/* Ajustes para pantallas pequeñas */
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

/* =========================================
   PANEL DE INICIO - MEDICITAS
   ESTILOS ORGANIZADOS
========================================= */

/* Evitar que el diseño del login afecte al panel */
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

/* BARRA SUPERIOR */

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

/* CONTENIDO */

.contenido-inicio {
  width: min(1180px, 90%);
  margin: 0 auto;
  padding: 45px 0 55px;
}

/* BIENVENIDA */

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

/* TARJETAS PRINCIPALES */

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

/* TARJETA DE INFORMACIÓN DE CITAS */

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

/* ACCIONES RÁPIDAS */

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

/* MENSAJE INFORMATIVO */

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

/* TABLETS */

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

/* CELULARES */

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
  </style>
