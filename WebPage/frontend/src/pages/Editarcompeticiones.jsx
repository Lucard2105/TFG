import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../services/apifetch"

function EditarCompeticion() {
  const { compId } = useParams()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState("")
  const [sistema, setSistema] = useState("Estandar")
  const [jornadaInicio, setJornadaInicio] = useState(1)

  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  const [esAdmin, setEsAdmin] = useState(false)
  const [procesandoBorrado, setProcesandoBorrado] = useState(false)

  // Helper para extraer userId del token (sin librerías)
  const getUserIdFromToken = () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token")
      if (!token) return null
      const payload = token.split(".")[1]
      const json = JSON.parse(atob(payload))
      return json?.user_id || null
    } catch {
      return null
    }
  }

  useEffect(() => {
    const cargarCompeticion = async () => {
      try {
        setCargando(true)
        setError("")
        const data = await api.get(`/api/competiciones/${compId}`)

        setNombre(data.nombreCompeticion || "")
        setSistema(data.sistemaPuntuacion || "Estandar")
        setJornadaInicio(data.jornadaInicio || 1)

        // Determinar si soy admin (primer participante)
        const miUserId = getUserIdFromToken()
        const participantes = Array.isArray(data.participantes)
          ? data.participantes.map((p) => String(p))
          : []

        setEsAdmin(
          participantes.length > 0 &&
            miUserId != null &&
            String(participantes[0]) === String(miUserId)
        )
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            "No se han podido cargar los datos de la competición. Inténtalo de nuevo en unos segundos."
        )
      } finally {
        setCargando(false)
      }
    }

    if (compId) cargarCompeticion()
  }, [compId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")

    try {
      const data = await api.put(`/api/competiciones/${compId}`, {
        nombreCompeticion: nombre,
        sistemaPuntuacion: sistema,
        jornadaInicio: Number(jornadaInicio) || 1,
      })

      setMensaje(data.mensaje || "Competición actualizada correctamente ✅")
      window.scrollTo({ top: 0, behavior: "smooth" })

      setTimeout(() => {
        navigate(`/dashboard/${compId}`)
      }, 1500)
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se han podido guardar los cambios. Revisa los datos e inténtalo de nuevo."
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleEliminarOAbandonar = async () => {
    setMensaje("")
    setError("")

    const accion = esAdmin ? "eliminar" : "abandonar"
    const confirmText = esAdmin
      ? "¿Seguro que quieres ELIMINAR esta competición?\n\nSe borrarán los datos asociados (equipos, clasificaciones, etc.). Esta acción no se puede deshacer."
      : "¿Seguro que quieres ABANDONAR esta competición?\n\nDejarás de aparecer en la liga y se eliminarán tus datos de clasificación asociados."

    const ok = window.confirm(confirmText)
    if (!ok) return

    try {
      setProcesandoBorrado(true)

      if (esAdmin) {
        const resp = await api.del(`/api/competiciones/${compId}`)
        setMensaje(resp?.mensaje || "Competición eliminada correctamente ✅")
      } else {
        const resp = await api.del(`/api/competiciones/${compId}/abandonar`)
        setMensaje(resp?.mensaje || "Has abandonado la competición ✅")
      }

      window.scrollTo({ top: 0, behavior: "smooth" })

      // Redirige a listado de competiciones (ajusta si tu ruta es otra)
      setTimeout(() => {
        navigate("/competiciones")
      }, 1200)
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido completar la operación. Inténtalo de nuevo."
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setProcesandoBorrado(false)
    }
  }

  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">
          Cargando datos de la competición...
        </p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            Editar competición
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Modifica el nombre, el sistema de puntuación y la jornada de inicio
            de la liga.
          </p>

          <div className="mt-3 text-xs text-gray-600">
            {esAdmin ? (
              <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-full">
                🛡️ Eres administrador de esta liga
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1 rounded-full">
                👤 Participante (sin permisos de administración)
              </span>
            )}
          </div>
        </header>

        {mensaje && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-xl text-sm shadow-sm">
              <span className="text-lg">✅</span>
              <span>{mensaje}</span>
              <button
                type="button"
                onClick={() => setMensaje("")}
                className="text-xs font-semibold text-green-700 hover:text-green-900 ml-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-xl text-sm shadow-sm">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-xs font-semibold text-red-700 hover:text-red-900 ml-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-5 md:p-6 max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la competición
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={!esAdmin}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white disabled:bg-gray-100"
                placeholder="Introduce el nombre de la competición"
              />
              {!esAdmin && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Solo el administrador puede modificar los datos de la liga.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sistema de puntuación
              </label>
              <select
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                disabled={!esAdmin}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white disabled:bg-gray-100"
              >
                <option value="Estandar">Estándar</option>
                <option value="Goles">Goles</option>
                <option value="RendimientoComunitario">
                  Rendimiento comunitario
                </option>
                <option value="FairPlay">Fair Play</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jornada de inicio
              </label>
              <input
                type="number"
                min="1"
                value={jornadaInicio}
                onChange={(e) => setJornadaInicio(e.target.value)}
                disabled={!esAdmin}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white disabled:bg-gray-100"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Indica desde qué jornada deben empezar a computar los puntos para
                la clasificación.
              </p>
            </div>

            {esAdmin && (
              <button
                type="submit"
                className="w-full bg-[#003087] hover:bg-[#002062] text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition"
              >
                Guardar cambios
              </button>
            )}
          </form>

          {/* Zona de peligro */}
          <div className="mt-6 border-t pt-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-800">
                {esAdmin ? "Zona de administración" : "Opciones de la liga"}
              </p>
              <p className="text-xs text-gray-600">
                {esAdmin
                  ? "Puedes eliminar la competición de forma permanente."
                  : "Puedes abandonar la competición si ya no deseas participar."}
              </p>

              <button
                type="button"
                onClick={handleEliminarOAbandonar}
                disabled={procesandoBorrado}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition"
              >
                {procesandoBorrado
                  ? "Procesando..."
                  : esAdmin
                  ? "Eliminar competición"
                  : "Abandonar competición"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditarCompeticion
