import { useEffect, useState } from "react"
import { api } from "../services/apifetch"

function Resultados() {
  const [resultados, setResultados] = useState([])
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarResultados = async () => {
      try {
        setCargando(true)
        setError("")
        const data = await api.get("/api/resultados", { auth: false })
        setResultados(Array.isArray(data) ? data : [])
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            "No se han podido cargar los resultados. Inténtalo de nuevo en unos segundos."
        )
      } finally {
        setCargando(false)
      }
    }

    cargarResultados()
  }, [])

  // Estado de carga con spinner unificado
  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">Cargando resultados de las jornadas...</p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            Resultados de jornadas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Consulta los marcadores de cada jornada y los enfrentamientos disputados.
          </p>
        </header>

        {/* ERROR */}
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

        {/* LISTA DE RESULTADOS */}
        {(!resultados || resultados.length === 0) && !error ? (
          <p className="text-center text-gray-600 text-sm">
            No hay resultados disponibles todavía.
          </p>
        ) : (
          <div className="space-y-4">
            {resultados.map((r, i) => (
              <div
                key={i}
                className="border border-sky-100 rounded-2xl bg-white shadow-sm p-4 md:p-5"
              >
                <h3 className="text-lg md:text-xl font-semibold text-[#003087] mb-3">
                  Jornada {r["Numero de Jornada"]}
                </h3>

                {(!r.Enfrentamientos || r.Enfrentamientos.length === 0) ? (
                  <p className="text-sm text-gray-500">
                    No hay enfrentamientos registrados para esta jornada.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200 text-sm">
                    {r.Enfrentamientos.map((enf, j) => (
                      <li
                        key={j}
                        className="py-2.5 grid grid-cols-3 items-center text-center"
                      >
                        <span className="text-left text-gray-700">
                          {enf["Equipo Local"]}
                        </span>
                        <span className="font-bold text-[#003087]">
                          {enf["Goles Local"]} - {enf["Goles Visitante"]}
                        </span>
                        <span className="text-right text-gray-700">
                          {enf["Equipo Visitante"]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Resultados

