import { useEffect, useState } from "react"
import { api } from "../services/apifetch"

// Normaliza texto: minúsculas, sin acentos, sin espacios extra
const normalize = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

function Jugadores() {
  const [jugadores, setJugadores] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroPosicion, setFiltroPosicion] = useState("todos")
  const [filtroEquipo, setFiltroEquipo] = useState("todos")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarJugadores = async () => {
      try {
        setCargando(true)
        setError("")
        const data = await api.get("/api/jugadores", { auth: false })
        setJugadores(Array.isArray(data) ? data : [])
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            "No se han podido cargar los jugadores. Revisa tu conexión e inténtalo de nuevo."
        )
      } finally {
        setCargando(false)
      }
    }

    cargarJugadores()
  }, [])

  // Opciones únicas, preservando texto original pero deduplicando por versión normalizada
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

  const filtrados = jugadores.filter((j) => {
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

  // Estado de carga (mismo spinner que en AsignarJugadores)
  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">Cargando jugadores...</p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <h2 className="text-3xl font-extrabold text-[#003087] mb-4 text-center border-b-2 border-[#dc2626] pb-3">
          Lista de jugadores
        </h2>

        {/* MENSAJE DE ERROR GLOBAL */}
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

        {/* Filtros (idénticos estilos a AsignarJugadores) */}
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
        </div>

        {/* Grid de jugadores con cartas muy similares a AsignarJugadores */}
        {filtrados.length === 0 ? (
          <p className="text-center text-gray-600">
            No se encontraron jugadores con esos filtros.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtrados.map((jug) => (
              <div
                key={jug._id || jug.Identificador}
                className="text-left border rounded-2xl p-4 bg-white hover:shadow-md transition shadow-sm border-gray-200"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-base font-semibold text-[#003087]">
                    {jug.NombreCompleto || jug.Nombre || "Jugador sin nombre"}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wide bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">
                    {jug.Posicion || "Sin posición"}
                  </span>
                </div>

                <p className="text-gray-700 text-sm mb-1">
                  <span className="font-semibold">Equipo:</span>{" "}
                  {jug.Equipo || "Desconocido"}
                </p>

                {jug.PuntosTotales !== undefined && (
                  <p className="text-gray-700 text-sm mt-1">
                    <span className="font-semibold">Puntos totales:</span>{" "}
                    <span className="px-3 py-0.5 rounded-full bg-sky-100 text-[#003087] font-semibold text-xs shadow-sm">
                      {jug.PuntosTotales}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Jugadores

