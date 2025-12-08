import { useEffect, useState } from "react"
import { api } from "../services/apifetch"

function Eventos() {
  const [eventos, setEventos] = useState([])
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        setCargando(true)
        setError("")
        const data = await api.get("/api/eventos", { auth: false })
        setEventos(Array.isArray(data) ? data : [])
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            "No se han podido cargar los eventos recientes. Revisa tu conexión e inténtalo de nuevo."
        )
      } finally {
        setCargando(false)
      }
    }

    cargarEventos()
  }, [])

  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">Cargando eventos recientes...</p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            Eventos recientes
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Consulta los últimos partidos y sus goleadores.
          </p>
        </header>

        {/* MENSAJE DE ERROR */}
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
        <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-5 md:p-6">
          {eventos.length === 0 && !error ? (
            <p className="text-center text-gray-600 text-sm">
              No hay eventos disponibles en este momento.
            </p>
          ) : (
            <div className="space-y-6">
              {eventos.map((e, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl p-4 md:p-5 hover:shadow-md transition bg-slate-50"
                >
                  <h3 className="font-semibold text-lg text-[#003087]">
                    {e.NombreEquipoLocal} {e.GolesLocal} - {e.GolesVisitante}{" "}
                    {e.NombreEquipoVisitante}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        Goleadores local
                      </p>
                      <ul className="list-disc ml-5 text-gray-600 text-sm space-y-0.5">
                        {e.GoleadoresLocal?.length > 0 ? (
                          e.GoleadoresLocal.map((g, idx) => (
                            <li key={idx}>{g}</li>
                          ))
                        ) : (
                          <li>Ninguno</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        Goleadores visitante
                      </p>
                      <ul className="list-disc ml-5 text-gray-600 text-sm space-y-0.5">
                        {e.GoleadoresVisitante?.length > 0 ? (
                          e.GoleadoresVisitante.map((g, idx) => (
                            <li key={idx}>{g}</li>
                          ))
                        ) : (
                          <li>Ninguno</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {e.Fecha && (
                    <p className="mt-3 text-xs text-gray-500">
                      Fecha del partido: {e.Fecha}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Eventos

