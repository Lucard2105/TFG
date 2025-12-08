import { useState, useEffect } from "react"
import { api, getTokenPayload } from "../services/apifetch"

function CrearEquipo() {
  const [nombreEquipo, setNombreEquipo] = useState("")
  const [competiciones, setCompeticiones] = useState([])
  const [competicionId, setCompeticionId] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarCompeticiones = async () => {
      try {
        setError("")
        setCargando(true)
        const data = await api.get("/api/mis-competiciones")
        setCompeticiones(Array.isArray(data) ? data : [])
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            "No se han podido cargar tus competiciones. Revisa tu conexión e inténtalo de nuevo."
        )
      } finally {
        setCargando(false)
      }
    }

    cargarCompeticiones()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")

    const payload = getTokenPayload()
    if (!payload?.user_id) {
      setError(
        "Debes iniciar sesión para crear un equipo. Vuelve a identificarte e inténtalo de nuevo."
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (!competicionId) {
      setError("Selecciona una competición antes de crear el equipo.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      const data = await api.post("/api/equipos", {
        nombreEquipo,
        competicionId,
      })

      setMensaje(data.mensaje || "Equipo creado correctamente ✅")
      setNombreEquipo("")
      setCompeticionId("")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido crear el equipo. Revisa los datos e inténtalo de nuevo."
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            ⚽ Crear Equipo
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Crea tu equipo dentro de una de tus competiciones y empieza a
            competir.
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

        {/* CONTENIDO PRINCIPAL */}
        <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-5 md:p-6 max-w-xl mx-auto">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-600">
              <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-700">
                Cargando tus competiciones...
              </p>
            </div>
          ) : (
            <>
              {competiciones.length === 0 && (
                <div className="mb-4 text-xs sm:text-sm text-gray-600 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                  Actualmente no participas en ninguna competición. Crea o
                  únete a una competición para poder crear tu equipo.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del equipo
                  </label>
                  <input
                    type="text"
                    value={nombreEquipo}
                    onChange={(e) => setNombreEquipo(e.target.value)}
                    required
                    className="border border-gray-300 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                    placeholder="Introduce el nombre de tu equipo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competición
                  </label>
                  <select
                    value={competicionId}
                    onChange={(e) => setCompeticionId(e.target.value)}
                    required
                    className="border border-gray-300 rounded-lg p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                  >
                    <option value="">
                      -- Selecciona una de tus competiciones --
                    </option>
                    {competiciones.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.nombreCompeticion}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={competiciones.length === 0}
                  className={`w-full font-semibold py-2.5 rounded-lg text-sm shadow-sm transition ${
                    competiciones.length === 0
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-[#dc2626] hover:bg-[#b91c1c] text-white"
                  }`}
                >
                  Crear equipo
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CrearEquipo

