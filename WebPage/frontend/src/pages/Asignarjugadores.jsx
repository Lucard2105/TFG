import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../services/apifetch"

const normalize = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

function AsignarJugadores() {
  const { equipoId } = useParams()
  const [jugadores, setJugadores] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroPosicion, setFiltroPosicion] = useState("todos")
  const [filtroEquipo, setFiltroEquipo] = useState("todos")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  // 🔹 Stats por jugador en la liga (últimas 5 jornadas)
  const [statsMap, setStatsMap] = useState({})
  const [jornadasStats, setJornadasStats] = useState([])

  // 🔹 Ordenación por media de últimos partidos
  const [ordenMedia, setOrdenMedia] = useState("ninguno") // 'ninguno' | 'mediaDesc' | 'mediaAsc'

  // 🔹 Cargar jugadores + equipo + stats de la competición
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)
        setError("")

        const [jugData, equipoData] = await Promise.all([
          api.get("/api/jugadores"),
          api.get(`/api/equipos/${equipoId}`),
        ])

        setJugadores(jugData)
        setSeleccionados(equipoData.jugadoresSeleccionados || [])

        if (equipoData.competicionId) {
          const statsData = await api.get(
            `/api/competiciones/${equipoData.competicionId}/jugadores/stats-resumen`
          )

          setJornadasStats(statsData.jornadas || [])

          const map = {}
          for (const j of statsData.jugadores || []) {
            map[j.jugadorId] = {
              puntosPorJornada: j.puntosPorJornada || [],
              mediaUltimas: j.mediaUltimas ?? 0,
            }
          }
          setStatsMap(map)
        }
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            "No se han podido cargar los jugadores. Revisa tu conexión e inténtalo de nuevo."
        )
      } finally {
        setCargando(false)
      }
    }

    if (equipoId) {
      cargarDatos()
    }
  }, [equipoId])

  const toggleJugador = (id) => {
    if (seleccionados.includes(id)) {
      setSeleccionados((prev) => prev.filter((x) => x !== id))
    } else {
      if (seleccionados.length < 5) {
        setSeleccionados((prev) => [...prev, id])
      } else {
        setError("Solo puedes elegir 5 jugadores en tu alineación.")
        window.scrollTo({ top: 0, behavior: "smooth" })
        setTimeout(() => setError(""), 2500)
      }
    }
  }

  const guardar = async () => {
    try {
      setError("")
      setMensaje("")
      const data = await api.put(`/api/equipos/${equipoId}/jugadores`, {
        jugadores: seleccionados,
      })

      setMensaje(data.mensaje || "Alineación guardada correctamente ✅")
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => setMensaje(""), 3000)
    } catch (err) {
      const msg = err?.response?.data?.error
      setMensaje("")
      setError(
        msg ||
          "Ha ocurrido un error al guardar la alineación. Revisa los jugadores seleccionados e inténtalo de nuevo."
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => setError(""), 4000)
    }
  }

  // 🔹 Jugadores seleccionados con info completa (para mostrarlos arriba)
  const seleccionadosDetallados = seleccionados
    .map((id) => jugadores.find((j) => j.Identificador === id))
    .filter(Boolean)

  const posiciones = Array.from(
    new Map(
      jugadores
        .map((j) => j.Posicion)
        .filter(Boolean)
        .map((p) => [normalize(p), p])
    ).values()
  ).sort()

  const equipos = Array.from(
    new Map(
      jugadores
        .map((j) => j.Equipo)
        .filter(Boolean)
        .map((e) => [normalize(e), e])
    ).values()
  ).sort()

  const q = normalize(busqueda)

  const jugadoresFiltrados = jugadores.filter((j) => {
    const nombre = normalize(j.NombreCompleto || j.Nombre)
    const posicion = normalize(j.Posicion)
    const equipo = normalize(j.Equipo)

    const nombreMatch =
      q === "" ||
      nombre.includes(q) ||
      posicion.includes(q) ||
      equipo.includes(q)

    const posicionMatch =
      filtroPosicion === "todos" || posicion === normalize(filtroPosicion)

    const equipoMatch =
      filtroEquipo === "todos" || equipo === normalize(filtroEquipo)

    return nombreMatch && posicionMatch && equipoMatch
  })

  // 🔹 Ordenación por media de últimas jornadas
  const jugadoresOrdenados = [...jugadoresFiltrados].sort((a, b) => {
    if (ordenMedia === "ninguno") return 0

    const mediaA = statsMap[a.Identificador]?.mediaUltimas ?? -99999
    const mediaB = statsMap[b.Identificador]?.mediaUltimas ?? -99999

    if (ordenMedia === "mediaDesc") {
      return mediaB - mediaA
    } else {
      return mediaA - mediaB
    }
  })

  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">
          Cargando jugadores y estadísticas de la liga...
        </p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        <h2 className="text-3xl font-extrabold text-[#003087] mb-4 text-center border-b-2 border-[#dc2626] pb-3">
          Asignar Jugadores al Equipo
        </h2>

        {/* Avisos globales */}
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

        {/* Panel con jugadores seleccionados */}
        {seleccionadosDetallados.length > 0 && (
          <div className="mb-5 border border-sky-100 rounded-2xl p-3 bg-white/80 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Jugadores actualmente seleccionados ({seleccionados.length}/5)
            </p>
            <div className="flex flex-wrap gap-2">
              {seleccionadosDetallados.map((j) => (
                <div
                  key={j.Identificador}
                  className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-full px-3 py-1 text-xs shadow-sm"
                >
                  <span className="font-semibold text-[#003087]">
                    {j.NombreCorto ||
                      j.NombreCompleto ||
                      j.Nombre ||
                      "Jugador"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    {j.Posicion || "Sin posición"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setFiltroPosicion(j.Posicion || "todos")}
                    className="text-[10px] font-semibold text-[#dc2626] hover:text-red-700"
                  >
                    Ver {j.Posicion || "todos"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleJugador(j.Identificador)}
                    className="text-[10px] text-gray-400 hover:text-gray-700"
                    title="Quitar de la alineación"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros generales */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
          <input
            type="text"
            placeholder="Buscar jugador, equipo o posición..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full md:w-1/3 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
          />

          <select
            value={filtroPosicion}
            onChange={(e) => setFiltroPosicion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
          >
            <option value="todos">Todas las posiciones</option>
            {posiciones.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filtroEquipo}
            onChange={(e) => setFiltroEquipo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
          >
            <option value="todos">Todos los equipos</option>
            {equipos.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <select
            value={ordenMedia}
            onChange={(e) => setOrdenMedia(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
          >
            <option value="ninguno">Sin ordenar por media</option>
            <option value="mediaDesc">Media (de mayor a menor)</option>
            <option value="mediaAsc">Media (de menor a mayor)</option>
          </select>
        </div>

        {/* Grid de jugadores */}
        {jugadoresOrdenados.length === 0 ? (
          <p className="text-center text-gray-600">
            No se encontraron jugadores con esos filtros.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jugadoresOrdenados.map((j) => {
              const seleccionado = seleccionados.includes(j.Identificador)
              const stats = statsMap[j.Identificador]

              return (
                <button
                  key={j.Identificador}
                  type="button"
                  onClick={() => toggleJugador(j.Identificador)}
                  className={`text-left border rounded-2xl p-4 bg-white hover:shadow-md transition shadow-sm ${
                    seleccionado
                      ? "border-[#dc2626] ring-1 ring-[#dc2626]/60"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-semibold text-[#003087]">
                      {j.NombreCompleto || j.Nombre || "Jugador sin nombre"}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wide bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">
                      {j.Posicion || "Sin posición"}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Equipo:</span>{" "}
                    {j.Equipo || "Desconocido"}
                  </p>

                  {/* 🔹 Stats últimas jornadas si existen */}
                  {stats &&
                    stats.puntosPorJornada &&
                    stats.puntosPorJornada.length > 0 && (
                      <div className="mt-3 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 text-xs text-gray-700">
                        <p className="mb-1">
                          <span className="font-semibold">
                            Últimas {stats.puntosPorJornada.length} jornadas:
                          </span>{" "}
                          {stats.puntosPorJornada.join(", ")}
                        </p>
                        <p>
                          <span className="font-semibold">Media:</span>{" "}
                          {stats.mediaUltimas.toFixed(1)}
                        </p>
                      </div>
                    )}

                  {seleccionado && (
                    <span className="inline-block mt-3 text-xs font-semibold text-[#dc2626]">
                      ✓ En tu alineación
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Botón guardar */}
        <div className="flex justify-center mt-8">
          <button
            onClick={guardar}
            className="bg-[#003087] hover:bg-[#002062] text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-md"
          >
            Guardar alineación ({seleccionados.length}/5)
          </button>
        </div>
      </div>
    </div>
  )
}

export default AsignarJugadores
