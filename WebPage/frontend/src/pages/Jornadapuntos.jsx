import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../services/apifetch"

function JornadaPuntos() {
  const { compId, num } = useParams()
  const [data, setData] = useState([])
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarPuntos = async () => {
      try {
        setCargando(true)
        setError("")
        setMensaje("")
        const res = await api.get(
          `/api/competiciones/${compId}/jornadas/${num}/puntos`
        )
        const lista = Array.isArray(res) ? res : []
        setData(lista)

        if (lista.length === 0) {
          setMensaje(
            `No hay puntuaciones registradas para la jornada ${num} de esta competición.`
          )
        }
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            `No se han podido cargar los puntos de la jornada ${num}. Inténtalo de nuevo en unos segundos.`
        )
      } finally {
        setCargando(false)
      }
    }

    if (compId && num) {
      cargarPuntos()
    }
  }, [compId, num])

  // Estado de carga con spinner
  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">
          Cargando puntuaciones de la jornada {num}...
        </p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            Jornada {num} — Clasificación
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Detalle de puntos por equipo y jugador en la jornada seleccionada.
          </p>
        </header>

        {/* MENSAJES GLOBALES */}
        {mensaje && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2 rounded-xl text-sm shadow-sm">
              <span className="text-lg">ℹ️</span>
              <span>{mensaje}</span>
              <button
                type="button"
                onClick={() => setMensaje("")}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 ml-1"
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
        {data.length === 0 && !error ? (
          <p className="text-center text-gray-600 text-sm mt-4">
            No hay datos de puntuación para esta jornada.
          </p>
        ) : (
          <div className="space-y-5">
            {data.map((equipo, idx) => (
              <div
                key={`${equipo.usuario}-${equipo.equipo}-${idx}`}
                className="bg-white border border-sky-100 rounded-2xl p-4 md:p-5 shadow-md"
              >
                <h3 className="text-lg font-semibold text-[#003087]">
                  {equipo.usuario}{" "}
                  <span className="text-gray-700 font-normal">
                    ({equipo.equipo})
                  </span>
                </h3>

                <p className="text-sm text-gray-700 mb-3 mt-1">
                  <span className="font-medium">Puntos jornada:</span>{" "}
                  <span className="font-semibold text-[#003087]">
                    {equipo.puntosJornada}
                  </span>{" "}
                  —{" "}
                  <span className="font-medium">Total acumulado:</span>{" "}
                  <span className="font-semibold text-[#003087]">
                    {equipo.puntosTotales}
                  </span>
                </p>

                <div className="mt-2 bg-slate-50 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#003087] text-white">
                        <tr>
                          <th className="py-2.5 px-4 text-left">Jugador</th>
                          <th className="py-2.5 px-4 text-left">Posición</th>
                          <th className="py-2.5 px-4 text-center">Puntos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {equipo.jugadores?.map((j, i) => (
                          <tr
                            key={`${j.jugador}-${i}`}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2.5 px-4">{j.jugador}</td>
                            <td className="py-2.5 px-4">{j.posicion}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="px-3 py-1 rounded-full bg-sky-100 text-[#003087] font-semibold text-xs shadow-sm">
                                {j.puntos}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!equipo.jugadores || equipo.jugadores.length === 0) && (
                          <tr>
                            <td
                              colSpan={3}
                              className="py-3 px-4 text-center text-gray-500 text-xs"
                            >
                              No hay detalle de jugadores para este equipo en
                              esta jornada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default JornadaPuntos

