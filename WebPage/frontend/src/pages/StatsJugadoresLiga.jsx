import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../services/apifetch"

// Normaliza texto: minúsculas, sin acentos, sin espacios extra
const normalize = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

function StatsJugadoresLiga() {
  const { compId } = useParams()
  const [stats, setStats] = useState([])
  const [hastaJornada, setHastaJornada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [posicion, setPosicion] = useState("todas")

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true)
        setError("")
        const data = await api.get(
          `/api/competiciones/${compId}/jugadores/stats`
        )
        setStats(Array.isArray(data.jugadores) ? data.jugadores : [])
        setHastaJornada(data.hastaJornada ?? null)
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            "No se han podido cargar las estadísticas de los jugadores. Inténtalo de nuevo en unos segundos."
        )
      } finally {
        setCargando(false)
      }
    }

    if (compId) {
      cargar()
    }
  }, [compId])

  const q = normalize(busqueda)

  const statsFiltradas = stats.filter((j) => {
    const nombre = normalize(j.nombre)
    const pos = normalize(j.posicion)

    const matchNombre = q === "" || nombre.includes(q)
    const matchPos = posicion === "todas" || pos === normalize(posicion)

    return matchNombre && matchPos
  })

  // ESTADO DE CARGA
  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">
          Cargando estadísticas de jugadores...
        </p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-4 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            Estadísticas de jugadores
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Acumulado hasta la jornada{" "}
            <span className="font-semibold">
              {hastaJornada ?? "—"}
            </span>
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

        {/* FILTROS */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full md:w-1/3 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
          />

          <select
            value={posicion}
            onChange={(e) => setPosicion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
          >
            <option value="todas">Todas las posiciones</option>
            <option value="Portero">Portero</option>
            <option value="Cierre">Cierre</option>
            <option value="Ala">Ala</option>
            <option value="Pívot">Pívot</option>
          </select>
        </div>

        {/* TABLA DE STATS */}
        {(!statsFiltradas || statsFiltradas.length === 0) && !error ? (
          <p className="text-center text-gray-500 text-sm">
            No se encontraron resultados con los filtros aplicados.
          </p>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#003087] text-white">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Jugador</th>
                    <th className="py-2.5 px-4 text-left">Equipo</th>
                    <th className="py-2.5 px-4 text-left">Posición</th>
                    <th className="py-2.5 px-4 text-center">
                      Puntos totales
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statsFiltradas.map((j) => (
                    <tr
                      key={j.jugadorId}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 px-4">{j.nombre}</td>
                      <td className="py-2.5 px-4">{j.equipoReal}</td>
                      <td className="py-2.5 px-4">{j.posicion}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-[#dc2626]">
                        {j.puntosTotales}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsJugadoresLiga

