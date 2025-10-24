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
    api
      .get("/api/jugadores", { auth: false })
      .then((data) => setJugadores(data))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
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

  if (cargando)
    return <p className="text-center text-gray-500 mt-6">Cargando jugadores...</p>
  if (error)
    return <p className="text-center text-red-500 mt-6">Error: {error}</p>

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
        Lista de Jugadores
      </h2>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
        <input
          type="text"
          placeholder="Buscar jugador..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
        />

        <select
          value={filtroPosicion}
          onChange={(e) => setFiltroPosicion(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
        >
          <option value="todos">Todas las posiciones</option>
          {posiciones.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filtroEquipo}
          onChange={(e) => setFiltroEquipo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
        >
          <option value="todos">Todos los equipos</option>
          {equipos.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtrados.length === 0 ? (
        <p className="text-center text-gray-600">
          No se encontraron jugadores con esos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtrados.map((jug) => (
            <div
              key={jug._id || jug.Identificador}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-[#1e3a8a] mb-2">
                {jug.NombreCompleto || jug.Nombre || "Jugador sin nombre"}
              </h3>
              <p className="text-gray-700 text-sm mb-1">
                <span className="font-semibold">Equipo:</span>{" "}
                {jug.Equipo || "Desconocido"}
              </p>
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">Posición:</span>{" "}
                {jug.Posicion || "No definida"}
              </p>
              {jug.PuntosTotales !== undefined && (
                <p className="text-gray-700 text-sm mt-1">
                  <span className="font-semibold">Puntos:</span>{" "}
                  {jug.PuntosTotales}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Jugadores

