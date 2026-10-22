<script setup>
import { ref } from 'vue'
import api from './services/api'

// Datos del formulario de inicio de sesión
const correo = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)
const recordar = ref(true)

// Estado de la aplicación
const mensaje = ref('')
const tipoMensaje = ref('error')
const cargando = ref(false)
const vistaActual = ref('login')
const usuarioActual = ref(null)

// Estado de la sección de médicos
const medicos = ref([])
const cargandoMedicos = ref(false)
const errorMedicos = ref('')

const citas = ref([])
const cargandoCitas = ref(false)
const errorCitas = ref('')

// Iniciar sesión
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

    // Evitar que queden sesiones anteriores en el otro almacenamiento
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

// Cerrar sesión
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

// Abrir secciones de la aplicación
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
    return
  }
}
// Crear cuenta
function crearCuenta() {
  mensaje.value = 'La pantalla de registro se integrará en el siguiente paso.'
  tipoMensaje.value = 'info'
}

// Recuperar contraseña
function recuperarContrasena() {
  mensaje.value = 'La recuperación de contraseña está pendiente de implementar.'
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
              Crear cuenta médica
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
      <section v-else-if="vistaActual === 'inicio'" class="inicio-medicitas">
    <header class="barra-inicio">
      <div class="marca-inicio">
        <img
          src="https://lh3.googleusercontent.com/aida/AEtjO1UsAF413TDAIkrSO9ze6OWy7btgEYHmsbMHJNZ9WZEJ28BbhlOJQ8kws-OUIUypfijXr88YMarmB8dZKRk4ZomPL-QTIavu2eTfld7aLG9fOyBUu9BesgUA0pGX6dPH8l4qgPIXyYuQxtnyO7n_Gye2sCTIPmhA4EBLgXUrjSVn3LYaalMz2uSthFTl_jao0UO7ivERig_lJmuy7HztuqVqasr7mXXRoCzPv1eGlCfw9kmFjd0sevvpDLhh"
          alt="Logo MediCitas"
        />
        <span>MediCitas</span>
      </div>

      <div class="usuario-inicio">
        <span class="material-symbols-outlined">account_circle</span>
        <span>{{ usuarioActual?.nombre || 'Usuario' }}</span>
        <button type="button" @click="cerrarSesion">
          Cerrar sesión
        </button>
      </div>
    </header>

    <div class="contenido-inicio">
      <p class="etiqueta-inicio">PORTAL DE SALUD</p>

      <h1>¡Hola, {{ usuarioActual?.nombre || 'bienvenido/a' }}!</h1>

      <p class="descripcion-inicio">
        Bienvenido/a a MediCitas. Gestiona tus citas médicas
        de manera sencilla y segura.
      </p>

      <div class="tarjetas-inicio">
        <button
          type="button"
          class="tarjeta-inicio"
          @click="abrirSeccion('citas')"
        >
          <span class="material-symbols-outlined">calendar_month</span>
          <strong>Mis citas</strong>
          <span>Consulta tus citas médicas.</span>
        </button>

        <button
          type="button"
          class="tarjeta-inicio"
          @click="abrirSeccion('medicos')"
        >
          <span class="material-symbols-outlined">medical_services</span>
          <strong>Buscar médicos</strong>
          <span>Conoce a nuestros especialistas.</span>
        </button>

        <button
          type="button"
          class="tarjeta-inicio"
          @click="abrirSeccion('perfil')"
        >
          <span class="material-symbols-outlined">person</span>
          <strong>Mi perfil</strong>
          <span>Consulta tus datos de usuario.</span>
        </button>
      </div>

      <div class="mensaje-inicio">
        <span class="material-symbols-outlined">favorite</span>
        <div>
          <strong>Tu salud es nuestra prioridad</strong>
          <p>Estamos aquí para ayudarte a organizar tu atención médica.</p>
        </div>
      </div>
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
```
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
  </style>
