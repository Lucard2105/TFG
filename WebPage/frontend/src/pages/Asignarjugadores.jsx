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

  // 🔹 Cargar jugadores + equipo (para precargar los 5 jugadores ya elegidos)
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
      } catch (err) {
        setError(err.message || "Error al cargar datos")
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
        setError("Solo puedes elegir 5 jugadores")
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
      // Subimos arriba del todo para que se vea el aviso
      window.scrollTo({ top: 0, behavior: "smooth" })
      // Ocultamos el mensaje tras unos segundos
      setTimeout(() => setMensaje(""), 3000)
    } catch (err) {
      setMensaje("")
      setError(
        err.message ||
          "Ha ocurrido un error al guardar la alineación. Revisa los datos e inténtalo de nuevo."
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

  if (cargando)
    return (
      <p className="text-center text-gray-500 mt-6">
        Cargando jugadores...
      </p>
    )

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
        Asignar Jugadores al Equipo
      </h2>

      {/* 🔹 Mensajes globales de éxito / error */}
      {mensaje && (
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-lg text-sm shadow-sm">
            <span className="text-lg">✅</span>
            <span>{mensaje}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-lg text-sm shadow-sm">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 🔹 Panel con los jugadores actualmente seleccionados */}
      {seleccionadosDetallados.length > 0 && (
        <div className="mb-5 border rounded-lg p-3 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Jugadores actualmente seleccionados ({seleccionados.length}/5)
          </p>
          <div className="flex flex-wrap gap-2">
            {seleccionadosDetallados.map((j) => (
              <div
                key={j.Identificador}
                className="flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-xs shadow-sm"
              >
                <span className="font-semibold text-[#1e3a8a]">
                  {j.NombreCorto ||
                    j.NombreCompleto ||
                    j.Nombre ||
                    "Jugador"}
                </span>
                <span className="text-gray-500">
                  ({j.Posicion || "Sin posición"})
                </span>

                {/* Botón que filtra por la posición de este jugador */}
                <button
                  type="button"
                  onClick={() =>
                    setFiltroPosicion(j.Posicion || "todos")
                  }
                  className="text-[10px] uppercase tracking-wide font-semibold text-[#dc2626]"
                >
                  Ver {j.Posicion || "todos"}
                </button>

                {/* Quitar jugador directamente */}
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
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={filtroEquipo}
          onChange={(e) => setFiltroEquipo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
        >
          <option value="todos">Todos los equipos</option>
          {equipos.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {/* Grid de selección */}
      {jugadoresFiltrados.length === 0 ? (
        <p className="text-center text-gray-600">
          No se encontraron jugadores con esos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {jugadoresFiltrados.map((j) => {
            const seleccionado = seleccionados.includes(j.Identificador)
            return (
              <button
                key={j.Identificador}
                type="button"
                onClick={() => toggleJugador(j.Identificador)}
                className={`text-left border rounded-lg p-4 hover:shadow-md transition ${
                  seleccionado
                    ? "border-[#dc2626] bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold text-[#1e3a8a] mb-2">
                  {j.NombreCompleto ||
                    j.Nombre ||
                    "Jugador sin nombre"}
                </h3>
                <p className="text-gray-700 text-sm mb-1">
                  <span className="font-semibold">Equipo:</span>{" "}
                  {j.Equipo || "Desconocido"}
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold">Posición:</span>{" "}
                  {j.Posicion || "No definida"}
                </p>
                {seleccionado && (
                  <span className="inline-block mt-3 text-xs font-semibold text-[#dc2626]">
                    Seleccionado
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
          className="bg-[#1e3a8a] hover:bg-[#142860] text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Guardar alineación ({seleccionados.length}/5)
        </button>
      </div>
    </div>
  )
}

export default AsignarJugadores




