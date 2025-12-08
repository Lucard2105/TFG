// src/pages/MisEquipos.jsx
import { useEffect, useMemo, useState } from "react"
import { api } from "../services/apifetch"
import { Link } from "react-router-dom"
import imagen from "/public/img/image.png"

/* ========== HELPERS ========== */

const normalize = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

const getShortName = (nombre = "") => {
  if (!nombre) return "—"
  const parts = nombre.split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1]}`
}

function normalizarPosicion(posRaw = "") {
  const pos = (posRaw || "").toLowerCase()

  if (pos.includes("portero")) return "Portero"
  if (pos.includes("cierre")) return "Cierre"
  if (pos.includes("ala")) return "Ala"
  if (pos.includes("piv") || pos.includes("pív") || pos.includes("pivot"))
    return "Pívot"

  return "Jugador"
}

/* ========== COMPONENTES DE PRESENTACIÓN ========== */

// 0 Portero, 1 Cierre, 2 Ala izq, 3 Ala dcha, 4 Pívot
const playerSlots = [
  { cls: "top-[82%] left-1/2 -translate-x-1/2", rol: "Portero" },
  { cls: "top-[65%] left-1/2 -translate-x-1/2", rol: "Cierre" },
  { cls: "top-[45%] left-[24%] -translate-x-1/2", rol: "Ala" },
  { cls: "top-[45%] left-[76%] -translate-x-1/2", rol: "Ala" },
  { cls: "top-[20%] left-1/2 -translate-x-1/2", rol: "Pívot" },
]

function PlayerToken({ jugador, dorsal, onClick, onRemove }) {
  const nombreCompleto =
    jugador.NombreCorto ||
    jugador.NombreCompleto ||
    jugador.Nombre ||
    jugador.nombre ||
    "Jugador"
  const shortName = getShortName(nombreCompleto)
  const pos = normalizarPosicion(jugador.Posicion || jugador.posicion)

  return (
    <div className="relative" onClick={onClick}>
      {/* Sombra */}
      <div className="absolute inset-0 translate-y-1 rounded-full bg-black/40 blur-[3px]" />
      {/* Ficha */}
      <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#dc2626] border-2 border-white/70 shadow-xl flex flex-col items-center justify-center text-center text-[8px] leading-tight px-1 cursor-pointer">
        {/* Botón papelera (rojo) */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center shadow"
            title="Quitar jugador"
          >
            🗑
          </button>
        )}

        <span
          className="text-[8px] font-semibold text-sky-100 truncate w-[3rem]"
          title={nombreCompleto}
        >
          {shortName}
        </span>
        <span className="text-[13px] font-extrabold text-white leading-none mt-0.5 tracking-tight">
          {dorsal}
        </span>
        <span className="text-[7px] uppercase tracking-wide text-sky-100/90 mt-0.5">
          {pos}
        </span>
      </div>
    </div>
  )
}

function CampoEquipo({
  jugadoresSlots = [],
  onClickJugadorCampo,
  onRemoveJugadorCampo,
  onClickSlotVacio,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div
        className="relative w-full max-w-xs mx-auto aspect-[9/16] rounded-2xl shadow-xl overflow-hidden border border-sky-200 bg-cover bg-center"
        style={{ backgroundImage: `url(${imagen})` }}
      >
        <div className="relative z-10 w-full h-full">
          {playerSlots.map((slotDef, index) => {
            const jugador = jugadoresSlots[index]
            const posClass = slotDef.cls
            const rol = slotDef.rol

            if (!jugador) {
              return (
                <div
                  key={`slot-vacio-${index}`}
                  className={`absolute ${posClass} flex flex-col items-center`}
                >
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full border-2 border-dashed border-white/70 bg-white/10 flex items-center justify-center text-white text-xl font-bold shadow"
                    title={`Filtrar por ${rol} para rellenar este hueco`}
                    onClick={() => onClickSlotVacio?.(index, rol)}
                  >
                    +
                  </button>
                </div>
              )
            }

            const dorsal =
              jugador.dorsal ||
              jugador.numero ||
              jugador.Numero ||
              jugador.Camiseta ||
              jugador.camiseta ||
              index + 1

            return (
              <div
                key={`${jugador.Identificador || jugador.id || index}`}
                className={`absolute ${posClass} flex flex-col items-center`}
              >
                <PlayerToken
                  jugador={jugador}
                  dorsal={dorsal}
                  onClick={() => onClickJugadorCampo?.(jugador)}
                  onRemove={() =>
                    onRemoveJugadorCampo?.(jugador.Identificador)
                  }
                />
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">
        Esquema 3–1: Portero, Cierre, Alas y Pívot (máx. 5 jugadores).
      </p>
    </div>
  )
}

/* ========== PÁGINA MIS EQUIPOS ========== */

function MisEquipos() {
  // Ligas y selección
  const [ligas, setLigas] = useState([])
  const [selectedLigaId, setSelectedLigaId] = useState("")
  const [cargandoLigas, setCargandoLigas] = useState(true)

  // Equipo actual (uno por liga)
  const [equipoActual, setEquipoActual] = useState(null)

  // Datos detalle
  const [jugadores, setJugadores] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [statsMap, setStatsMap] = useState({})
  const [jornadasStats, setJornadasStats] = useState([])

  // Slots fijos en la pizarra (índices 0–4)
  const [slots, setSlots] = useState([null, null, null, null, null])

  // UI
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")

  // Filtros
  const [busqueda, setBusqueda] = useState("")
  const [filtroPosicion, setFiltroPosicion] = useState("todos")
  const [filtroEquipo, setFiltroEquipo] = useState("todos")
  const [ordenMedia, setOrdenMedia] = useState("ninguno")

  /* ---- 1) CARGAR LIGAS DEL USUARIO ---- */
  useEffect(() => {
    const cargarLigas = async () => {
      try {
        setCargandoLigas(true)
        setError("")
        let lista = await api.get("/api/competiciones/mias")

        if (!Array.isArray(lista) || lista.length === 0) {
          lista = await api.get("/api/mis-competiciones")
        }

        const norm = (lista || []).map((c) => ({
          id: c.id || c._id,
          nombreCompeticion: c.nombreCompeticion || "Competición",
        }))

        setLigas(norm)
        if (norm.length) {
          setSelectedLigaId(norm[0].id)
        } else {
          setSelectedLigaId("")
        }
      } catch (err) {
        const msg = err?.response?.data?.error || err.message
        setError(msg || "No se han podido cargar tus ligas.")
      } finally {
        setCargandoLigas(false)
      }
    }

    cargarLigas()
  }, [])

  /* ---- 2) CARGAR EQUIPO + JUGADORES + STATS DE LA LIGA SELECCIONADA ---- */
  useEffect(() => {
    const cargarDatosLiga = async () => {
      if (!selectedLigaId) {
        setEquipoActual(null)
        setJugadores([])
        setSeleccionados([])
        setStatsMap({})
        setJornadasStats([])
        setSlots([null, null, null, null, null])
        return
      }

      try {
        setCargandoDetalle(true)
        setError("")
        setMensaje("")

        const dash = await api.get(`/api/dashboard/${selectedLigaId}`)
        const eq = dash?.equipoActual

        if (!eq) {
          setEquipoActual(null)
          setJugadores([])
          setSeleccionados([])
          setStatsMap({})
          setJornadasStats([])
          setSlots([null, null, null, null, null])
          setMensaje(
            "No tienes equipo en esta liga. Crea uno desde 'Competiciones' → 'Crear equipo'."
          )
          return
        }

        setEquipoActual(eq)
        setSeleccionados(eq.jugadoresSeleccionados || [])
        setSlots([null, null, null, null, null])

        const [jugData, statsData] = await Promise.all([
          api.get("/api/jugadores"),
          api.get(
            `/api/competiciones/${selectedLigaId}/jugadores/stats-resumen`
          ),
        ])

        setJugadores(jugData || [])

        const jornadas = statsData?.jornadas || []
        setJornadasStats(jornadas)

        const map = {}
        for (const j of statsData?.jugadores || []) {
          map[j.jugadorId] = {
            puntosPorJornada: j.puntosPorJornada || [],
            mediaUltimas: j.mediaUltimas ?? 0,
          }
        }
        setStatsMap(map)
      } catch (err) {
        const msg = err?.response?.data?.error || err.message
        setError(
          msg ||
            "No se han podido cargar los datos del equipo en esta liga. Inténtalo de nuevo."
        )
        setEquipoActual(null)
        setJugadores([])
        setSeleccionados([])
        setStatsMap({})
        setJornadasStats([])
        setSlots([null, null, null, null, null])
      } finally {
        setCargandoDetalle(false)
      }
    }

    cargarDatosLiga()
  }, [selectedLigaId])

  /* ---- 2.b) INICIALIZAR SLOTS CON LA ALINEACIÓN DEL BACKEND ---- */
  useEffect(() => {
    if (!equipoActual || !jugadores.length) return

    setSlots((prev) => {
      if (prev.some((s) => s !== null)) return prev

      const idsIniciales = equipoActual.jugadoresSeleccionados || []
      const jugadoresIniciales = idsIniciales
        .map((id) => jugadores.find((j) => j.Identificador === id))
        .filter(Boolean)

      const nuevosSlots = [null, null, null, null, null]

      const tomarPorPos = (posDeseada, indicesSlots) => {
        for (const idxSlot of indicesSlots) {
          if (nuevosSlots[idxSlot] != null) continue
          const idx = jugadoresIniciales.findIndex(
            (j) => normalizarPosicion(j.Posicion) === posDeseada
          )
          if (idx !== -1) {
            const [jug] = jugadoresIniciales.splice(idx, 1)
            nuevosSlots[idxSlot] = jug.Identificador
          }
        }
      }

      tomarPorPos("Portero", [0])
      tomarPorPos("Cierre", [1])
      tomarPorPos("Ala", [2, 3])
      tomarPorPos("Pívot", [4])

      for (const jug of jugadoresIniciales) {
        const idxLibre = nuevosSlots.findIndex((s) => s == null)
        if (idxLibre === -1) break
        nuevosSlots[idxLibre] = jug.Identificador
      }

      return nuevosSlots
    })
  }, [equipoActual, jugadores])

  /* ---- 3) LÓGICA DE SELECCIÓN + SLOTS FIJOS ---- */

  const quitarIdDeSlots = (id) =>
    setSlots((prev) => prev.map((s) => (s === id ? null : s)))

  const añadirIdASlots = (id) =>
    setSlots((prev) => {
      const copia = [...prev]
      const idxLibre = copia.findIndex((s) => s === null)
      if (idxLibre !== -1) {
        copia[idxLibre] = id
        return copia
      }
      return copia
    })

  const toggleJugador = (id) => {
    if (seleccionados.includes(id)) {
      setSeleccionados((prev) => prev.filter((x) => x !== id))
      quitarIdDeSlots(id)
    } else {
      if (seleccionados.length >= 5) {
        setError("Solo puedes elegir 5 jugadores en tu alineación.")
        window.scrollTo({ top: 0, behavior: "smooth" })
        setTimeout(() => setError(""), 2500)
        return
      }
      setSeleccionados((prev) => [...prev, id])
      añadirIdASlots(id)
    }
  }

  const quitarDeAlineacion = (id) => {
    setSeleccionados((prev) => prev.filter((x) => x !== id))
    quitarIdDeSlots(id)
  }

  const guardar = async () => {
    if (!equipoActual?.equipoId) return
    try {
      setError("")
      setMensaje("")

      const data = await api.put(
        `/api/equipos/${equipoActual.equipoId}/jugadores`,
        { jugadores: seleccionados }
      )

      setMensaje(data.mensaje || "Alineación guardada correctamente ✅")
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => setMensaje(""), 3000)
    } catch (err) {
      const msg = err?.response?.data?.error || err.message
      setMensaje("")
      setError(
        msg ||
          "Ha ocurrido un error al guardar la alineación. Revisa los jugadores seleccionados e inténtalo de nuevo."
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => setError(""), 4000)
    }
  }

  const seleccionadosDetallados = useMemo(
    () =>
      seleccionados
        .map((id) => jugadores.find((j) => j.Identificador === id))
        .filter(Boolean),
    [seleccionados, jugadores]
  )

  const jugadoresEnSlots = useMemo(
    () =>
      slots.map((id) =>
        id ? jugadores.find((j) => j.Identificador === id) : null
      ),
    [slots, jugadores]
  )

  const posiciones = useMemo(
    () =>
      Array.from(
        new Map(
          jugadores
            .map((j) => j.Posicion)
            .filter(Boolean)
            .map((p) => [normalize(p), p])
        ).values()
      ).sort(),
    [jugadores]
  )

  const equiposReales = useMemo(
    () =>
      Array.from(
        new Map(
          jugadores
            .map((j) => j.Equipo)
            .filter(Boolean)
            .map((e) => [normalize(e), e])
        ).values()
      ).sort(),
    [jugadores]
  )

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

  const indiceLigaActual = ligas.findIndex((l) => l.id === selectedLigaId)
  const numeroLigaActual = indiceLigaActual >= 0 ? indiceLigaActual + 1 : 0

  /* ---- 4) RENDER ---- */

  if (cargandoLigas) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm">Cargando tus ligas...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {ligas.length > 0 && (
                <>
                  <span className="text-sm text-gray-700">Liga:</span>
                  <select
                    value={selectedLigaId}
                    onChange={(e) => setSelectedLigaId(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] bg-white min-w-[180px]"
                  >
                    {ligas.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombreCompeticion}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {ligas.length === 0 && (
                <span className="text-sm text-gray-600">
                  No estás en ninguna liga. Crea una desde el menú de
                  competiciones.
                </span>
              )}
            </div>

            {ligas.length > 0 && (
              <span className="text-sm text-gray-600">
                Equipo{" "}
                <span className="font-semibold">
                  {numeroLigaActual || 1}
                </span>{" "}
                de{" "}
                <span className="font-semibold">{ligas.length}</span>
              </span>
            )}
          </div>

          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 text-center border-b-2 border-[#dc2626] pb-3">
            📋 Mis equipos
          </h2>
          <p className="text-sm text-gray-600 text-center">
            Gestiona tu alineación con estadísticas de la liga y visualízala en
            la pizarra.
          </p>
        </header>

        {/* MENSAJES */}
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

        {!equipoActual ? (
          <p className="text-center text-gray-600 text-sm">
            {ligas.length === 0
              ? "No tienes ligas creadas."
              : "No tienes equipo en esta liga. Crea uno desde Competiciones → Crear equipo."}
          </p>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* COLUMNA IZQUIERDA (un poco más grande) */}
            <div className="md:w-3/5">
              <h3 className="text-xl font-semibold text-[#003087] mb-1">
                {equipoActual.nombreEquipo}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Selecciona hasta 5 jugadores para tu alineación.
              </p>

              {cargandoDetalle ? (
                <div className="flex flex-col items-center justify-center mt-6 text-gray-600">
                  <div className="w-6 h-6 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-2" />
                  <p className="text-xs">
                    Cargando jugadores y estadísticas de la liga...
                  </p>
                </div>
              ) : (
                <>
                  {/* Jugadores seleccionados */}
                  {seleccionadosDetallados.length > 0 && (
                    <div className="mb-4 border border-sky-100 rounded-2xl p-3 bg-white/80 shadow-sm">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Jugadores actualmente seleccionados (
                        {seleccionados.length}/5)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {seleccionadosDetallados.map((j) => (
                          <div
                            key={j.Identificador}
                            className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-full px-3 py-1 text-xs shadow-sm"
                          >
                            <span className="font-semibold text-[#003087]">
                              {getShortName(
                                j.NombreCorto ||
                                  j.NombreCompleto ||
                                  j.Nombre ||
                                  "Jugador"
                              )}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                              {normalizarPosicion(j.Posicion)}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setFiltroPosicion(j.Posicion || "todos")
                              }
                              className="text-[10px] font-semibold text-[#dc2626] hover:text-red-700"
                            >
                              Ver {j.Posicion || "todos"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                quitarDeAlineacion(j.Identificador)
                              }
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

                  {/* Filtros – UNA SOLA LÍNEA */}
                  <div className="flex gap-2 mb-4 items-center overflow-x-auto pb-2">
                    <input
                      type="text"
                      placeholder="Buscar jugador..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-[190px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white flex-shrink-0"
                    />

                    <select
                      value={filtroPosicion}
                      onChange={(e) => setFiltroPosicion(e.target.value)}
                      className="w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white flex-shrink-0"
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
                      className="w-[170px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white flex-shrink-0"
                    >
                      <option value="todos">Todos los equipos</option>
                      {equiposReales.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>

                    <select
                      value={ordenMedia}
                      onChange={(e) => setOrdenMedia(e.target.value)}
                      className="w-[190px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white flex-shrink-0"
                    >
                      <option value="ninguno">Sin ordenar por media</option>
                      <option value="mediaDesc">
                        Media (de mayor a menor)
                      </option>
                      <option value="mediaAsc">
                        Media (de menor a mayor)
                      </option>
                    </select>
                  </div>

                  {/* Info de jornadas */}
                  {jornadasStats && jornadasStats.length > 0 && (
                    <p className="text-[11px] text-gray-500 mb-2">
                      Estadísticas calculadas hasta la jornada{" "}
                      <span className="font-semibold">
                        {jornadasStats[jornadasStats.length - 1]}
                      </span>
                      .
                    </p>
                  )}

                  {/* Grid de jugadores */}
                  <div id="lista-jugadores">
                    {jugadoresOrdenados.length === 0 ? (
                      <p className="text-center text-gray-600 text-sm py-4 bg-white rounded-2xl border border-sky-100">
                        No se encontraron jugadores con esos filtros.
                      </p>
                    ) : (
                      <div className="bg-white rounded-2xl shadow-md border border-sky-100 max-h-[360px] overflow-y-auto pr-1 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3">
                          {jugadoresOrdenados.map((j) => {
                            const seleccionado = seleccionados.includes(
                              j.Identificador
                            )
                            const stats = statsMap[j.Identificador]
                            const posNorm = normalizarPosicion(j.Posicion)

                            return (
                              <button
                                key={j.Identificador}
                                type="button"
                                onClick={() => toggleJugador(j.Identificador)}
                                className={`text-left border rounded-2xl p-3 bg-white hover:shadow-md transition shadow-sm ${
                                  seleccionado
                                    ? "border-[#dc2626] ring-1 ring-[#dc2626]/60"
                                    : "border-gray-200"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-[#003087]">
                                    {j.NombreCompleto ||
                                      j.Nombre ||
                                      "Jugador sin nombre"}
                                  </h3>
                                  <span className="text-[10px] uppercase tracking-wide bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                    {posNorm}
                                  </span>
                                </div>

                                <p className="text-gray-700 text-xs mb-1">
                                  <span className="font-semibold">
                                    Equipo:
                                  </span>{" "}
                                  {j.Equipo || "Desconocido"}
                                </p>

                                {stats &&
                                  stats.puntosPorJornada &&
                                  stats.puntosPorJornada.length > 0 && (
                                    <div className="mt-2 bg-sky-50 border border-sky-100 rounded-lg px-2 py-1.5 text-[11px] text-gray-700">
                                      <p className="mb-0.5">
                                        <span className="font-semibold">
                                          Últimas{" "}
                                          {stats.puntosPorJornada.length}{" "}
                                          jornadas:
                                        </span>{" "}
                                        {stats.puntosPorJornada.join(", ")}
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Media:
                                        </span>{" "}
                                        {stats.mediaUltimas.toFixed(1)}
                                      </p>
                                    </div>
                                  )}

                                {seleccionado && (
                                  <span className="inline-block mt-2 text-[11px] font-semibold text-[#dc2626]">
                                    ✓ En tu alineación
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones abajo */}
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <button
                      onClick={guardar}
                      className="bg-[#003087] hover:bg-[#002062] text-white font-semibold py-2 px-5 rounded-lg text-sm transition shadow-md"
                    >
                      Guardar alineación ({seleccionados.length}/5)
                    </button>

                    <Link
                      to={`/equipos/${equipoActual.equipoId}/jugadores`}
                      className="text-xs text-[#dc2626] hover:text-[#b91c1c] underline"
                    >
                      Abrir editor avanzado de alineación
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* COLUMNA DERECHA: PIZARRA */}
            <div className="md:w-2/5 flex items-center justify-center">
              <CampoEquipo
                jugadoresSlots={jugadoresEnSlots}
                onClickJugadorCampo={(j) =>
                  setFiltroPosicion(j.Posicion || "todos")
                }
                onRemoveJugadorCampo={quitarDeAlineacion}
                onClickSlotVacio={(_, rol) => {
                  setBusqueda("")
                  setFiltroPosicion(rol || "todos")
                  // Llevar la vista a la lista de jugadores
                  setTimeout(() => {
                    document
                      .getElementById("lista-jugadores")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }, 50)
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MisEquipos
