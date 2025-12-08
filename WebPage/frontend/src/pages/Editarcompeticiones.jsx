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

  useEffect(() => {
    const cargarCompeticion = async () => {
      try {
        setCargando(true)
        setError("")
        const data = await api.get(`/api/competiciones/${compId}`)

        setNombre(data.nombreCompeticion || "")
        setSistema(data.sistemaPuntuacion || "Estandar")
        setJornadaInicio(data.jornadaInicio || 1)
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

    if (compId) {
      cargarCompeticion()
    }
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

  // Estado de carga
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
        {/* CABECERA */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            Editar competición
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Modifica el nombre, el sistema de puntuación y la jornada de inicio
            de la liga.
          </p>
        </header>

        {/* MENSAJES GLOBALES */}
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

        {/* FORMULARIO */}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white"
                placeholder="Introduce el nombre de la competición"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sistema de puntuación
              </label>
              <select
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Indica desde qué jornada deben empezar a computar los puntos
                para la clasificación.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#003087] hover:bg-[#002062] text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditarCompeticion

