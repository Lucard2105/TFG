// src/pages/Dashboard.jsx
import { useEffect, useState, Fragment } from "react"
import { useParams, Link } from "react-router-dom"
import { api } from "../services/apifetch"
import futsalField from "/public/img/image.png"

/* ================== HELPERS ALINEACIÓN ================== */

function normalizarPosicion(posRaw = "") {
  const pos = (posRaw || "").toLowerCase()
  if (pos.includes("portero") || pos.includes("por")) return "Portero"
  if (pos.includes("cierre")) return "Cierre"
  if (pos.includes("piv")) return "Pívot"
  if (pos.includes("ala")) return "Ala"
  return "Jugador"
}

function construirAlineacion(jugadores = []) {
  const porteros = []
  const cierres = []
  const alas = []
  const pivots = []
  const otros = []

  for (const j of jugadores) {
    const posNorm = normalizarPosicion(j.posicion)
    const jugador = { ...j, posicion: posNorm }

    if (posNorm === "Portero") {
      porteros.push(jugador)
    } else if (posNorm === "Cierre") {
      cierres.push(jugador)
    } else if (posNorm === "Pívot") {
      pivots.push(jugador)
    } else if (posNorm === "Ala") {
      alas.push(jugador)
    } else {
      // “Jugador” genérico: si aún no hay pívot, lo usamos como Pívot
      if (pivots.length === 0) {
        pivots.push({ ...jugador, posicion: "Pívot" })
      } else {
        otros.push(jugador)
      }
    }
  }

  const resto = [
    ...alas.slice(2),
    ...cierres.slice(1),
    ...pivots.slice(1),
    ...porteros.slice(1),
    ...otros,
  ]

  const portero = porteros[0] || resto.shift() || null
  const cierre = cierres[0] || resto.shift() || null
  const alaIzq = alas[0] || resto.shift() || null
  const alaDcha = alas[1] || resto.shift() || null
  let pivot = pivots[0] || resto.shift() || null

  if (pivot) {
    pivot = {
      ...pivot,
      posicion:
        !pivot.posicion || pivot.posicion === "Jugador"
          ? "Pívot"
          : pivot.posicion,
    }
  }

  return { portero, cierre, alaIzq, alaDcha, pivot }
}

/** Fichita del jugador – mismo estilo redondo que en la home */
function PlayerToken({ nombre, posicion, dorsal, puntos }) {
  const displayName = nombre || "Jugador"
  const displayPos = posicion || "Jugador"
  const displayDorsal = dorsal ?? ""

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* sombra */}
        <div className="absolute inset-0 translate-y-1 rounded-full bg-black/40 blur-[3px]" />
        {/* ficha */}
        <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#dc2626] border-2 border-white/70 shadow-xl flex flex-col items-center justify-center text-center text-[8px] leading-tight px-1">
          <span
            className="text-[8px] font-semibold text-sky-100 truncate w-[3rem]"
            title={displayName}
          >
            {displayName}
          </span>
          {displayDorsal !== "" && (
            <span className="text-[13px] font-extrabold text-white leading-none mt-0.5 tracking-tight">
              {displayDorsal}
            </span>
          )}
          <span className="text-[7px] uppercase tracking-wide text-sky-100/90 mt-0.5">
            {displayPos}
          </span>
        </div>
      </div>

      {typeof puntos === "number" && (
        <span className="mt-1 text-[9px] font-semibold text-slate-800 bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
          {puntos} pt{puntos === 1 ? "" : "s"}
        </span>
      )}
    </div>
  )
}

function FutsalField({ jugadores }) {
  const { portero, cierre, alaIzq, alaDcha, pivot } = construirAlineacion(
    jugadores
  )

  return (
    <div className="w-full max-w-[250px] md:max-w-[260px] mx-auto">
      <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
        <img
          src={futsalField}
          alt="Campo de fútbol sala"
          className="w-full h-full object-contain rounded-3xl shadow-lg border border-slate-200 bg-slate-100"
        />

        {/* capa jugadores */}
        <div className="absolute inset-[10%] flex flex-col justify-between pointer-events-none">
          {/* Pívot */}
          <div className="flex justify-center">
            {pivot && (
              <div className="pointer-events-auto">
                <PlayerToken {...pivot} />
              </div>
            )}
          </div>

          {/* Alas */}
          <div className="flex justify-between items-center px-1.5">
            <div className="flex-1 flex justify-start">
              {alaIzq && (
                <div className="pointer-events-auto">
                  <PlayerToken {...alaIzq} />
                </div>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              {alaDcha && (
                <div className="pointer-events-auto">
                  <PlayerToken {...alaDcha} />
                </div>
              )}
            </div>
          </div>

          {/* Cierre */}
          <div className="flex justify-center">
            {cierre && (
              <div className="pointer-events-auto">
                <PlayerToken {...cierre} />
              </div>
            )}
          </div>

          {/* Portero */}
          <div className="flex justify-center mb-1">
            {portero && (
              <div className="pointer-events-auto">
                <PlayerToken {...portero} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================== DASHBOARD ================== */

function Dashboard() {
  const { compId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [cargando, setCargando] = useState(true)

  const [jornadas, setJornadas] = useState([])
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null)
  const [puntosJornadaSeleccionada, setPuntosJornadaSeleccionada] =
    useState([])
  const [detallesAbiertos, setDetallesAbiertos] = useState({})

  const [jugadoresEquipo, setJugadoresEquipo] = useState([])
  const [jugadoresMap, setJugadoresMap] = useState({})
  const [cargandoEquipo, setCargandoEquipo] = useState(false)

  // NUEVO: clasificación igual que en App.jsx (HomeLeagues)
  const [standings, setStandings] = useState([])

  // Cargar dashboard + jornadas + catálogo de jugadores + clasificación
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)
        setError("")
        setMensaje("")

        const dashboardData = await api.get(`/api/dashboard/${compId}`)
        setData(dashboardData || null)

        // catálogo de jugadores
        let listaJugadores = []
        try {
          const resp = await api.get("/api/jugadores")
          listaJugadores = Array.isArray(resp) ? resp : []
        } catch {
          listaJugadores = []
        }

        const index = {}
        for (const j of listaJugadores) {
          const id = j.Identificador || j.id || j._id
          if (!id) continue
          index[id] = {
            nombreCorto:
              j.NombreCorto ||
              j.NombreCompleto ||
              j.nombre ||
              j.Identificador ||
              "Jugador",
            posicion: j.Posicion || j.posicion || "",
            dorsal: j.Dorsal || j.dorsal || j.Numero || j.numero || null,
          }
        }
        setJugadoresMap(index)

        // alineación de "Mi equipo"
        if (
          dashboardData?.equipoActual?.jugadoresSeleccionados &&
          dashboardData.equipoActual.jugadoresSeleccionados.length
        ) {
          setCargandoEquipo(true)
          const ids = dashboardData.equipoActual.jugadoresSeleccionados

          let alineacion = ids
            .map((id, idx) => {
              const info = index[id] || {}
              return {
                id,
                nombre: info.nombreCorto || id,
                posicion: info.posicion || "",
                dorsal: info.dorsal || null,
                index: idx,
              }
            })
            .filter(Boolean)

          const sinPosiciones = alineacion.every((p) => !p.posicion)
          if (sinPosiciones && alineacion.length) {
            const pattern = ["Portero", "Cierre", "Ala", "Ala", "Pívot"]
            alineacion = alineacion.map((p, idx) => ({
              ...p,
              posicion: pattern[idx] || "Jugador",
            }))
          }

          setJugadoresEquipo(alineacion)
          setCargandoEquipo(false)
        } else {
          setJugadoresEquipo([])
        }

        // Jornadas
        const jornadasData = await api.get(
          `/api/competiciones/${compId}/jornadas`
        )
        setJornadas(Array.isArray(jornadasData) ? jornadasData : [])

        // CLASIFICACIÓN (igual que en HomeLeagues)
        try {
          const cls = await api.get(
            `/api/competiciones/${compId}/clasificacion`
          )
          setStandings(Array.isArray(cls) ? cls : [])
        } catch {
          setStandings([])
        }
      } catch (err) {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            err?.message ||
            "No se han podido cargar los datos de la competición. Inténtalo de nuevo en unos segundos."
        )
      } finally {
        setCargando(false)
      }
    }

    if (compId) {
      cargarDatos()
    }
  }, [compId])

  const handleSeleccionJornada = async (num) => {
    if (!num) {
      setJornadaSeleccionada(null)
      setPuntosJornadaSeleccionada([])
      setDetallesAbiertos({})
      return
    }

    setJornadaSeleccionada(num)
    setPuntosJornadaSeleccionada([])
    setDetallesAbiertos({})
    setMensaje("")
    setError("")

    try {
      const resp = await api.get(
        `/api/competiciones/${compId}/jornadas/${num}/puntos`
      )
      const lista = Array.isArray(resp) ? resp : []
      setPuntosJornadaSeleccionada(lista)
      setMensaje(
        lista.length
          ? `Se han cargado los puntos de la jornada ${num}.`
          : `No hay puntos registrados para la jornada ${num}.`
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se han podido cargar los puntos de la jornada seleccionada. Inténtalo de nuevo."
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const toggleDetalle = (equipo) => {
    setDetallesAbiertos((prev) => ({ ...prev, [equipo]: !prev[equipo] }))
  }

  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">
          Cargando información de la competición...
        </p>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087] mb-2 border-b-2 border-[#dc2626] pb-3 inline-block">
            Dashboard de la Competición
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Consulta tu equipo, el ranking general y los puntos por jornada.
          </p>
        </header>

        {/* MENSAJES */}
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

        {!data ? (
          <p className="text-center text-gray-600 mt-6">
            No hay datos disponibles para este dashboard en este momento.
          </p>
        ) : (
          <>
            {/* MI EQUIPO + RANKING */}
            <section className="mb-8">
              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* MI EQUIPO */}
                <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-5 md:p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#003087] text-lg">
                      Mi equipo
                    </h3>
                    {data.equipoActual?.equipoId && (
                      <Link
                        to={`/equipos/${data.equipoActual.equipoId}/jugadores`}
                        className="bg-[#1e3a8a] hover:bg-[#132c70] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        Editar equipo
                      </Link>
                    )}
                  </div>

                  {data.equipoActual ? (
                    <>
                      <p className="text-gray-700 text-sm md:text-base mb-4">
                        <span className="font-semibold">
                          {data.equipoActual.nombreEquipo}
                        </span>{" "}
                        —{" "}
                        {data.equipoActual.jugadoresSeleccionados
                          ? data.equipoActual.jugadoresSeleccionados.length
                          : 0}{" "}
                        jugadores en la alineación.
                      </p>

                      <div className="flex-1 flex items-center justify-center">
                        {cargandoEquipo ? (
                          <p className="text-sm text-gray-500">
                            Cargando alineación...
                          </p>
                        ) : jugadoresEquipo.length ? (
                          <FutsalField jugadores={jugadoresEquipo} />
                        ) : (
                          <p className="text-sm text-gray-500">
                            No se ha podido cargar la alineación.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600 text-sm md:text-base">
                      No tienes equipo en esta competición. Crea tu equipo desde
                      el menú de equipos.
                    </p>
                  )}
                </div>

                {/* RANKING GENERAL – MISMA LÓGICA QUE EN HomeLeagues */}
                <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-[#1e3a8a] border-b-2 border-[#dc2626] pb-1 mx-auto">
                      Ranking general
                    </h4>
                  </div>

                  {standings && standings.length ? (
                    <div className="mt-2 bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#003087] text-white">
                            <tr>
                              <th className="py-3 px-4 text-left">#</th>
                              <th className="py-3 px-4 text-left">Equipo</th>
                              <th className="py-3 px-4 text-left">Usuario</th>
                              <th className="py-3 px-4 text-center">
                                Jornada
                              </th>
                              <th className="py-3 px-4 text-center">
                                Pts Jornada
                              </th>
                              <th className="py-3 px-4 text-center">Total</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-200">
                            {standings.map((row, i) => {
                              const rowBgBase =
                                "bg-slate-50 hover:bg-slate-100"
                              let podiumBorder =
                                "border-l-4 border-transparent"
                              if (i === 0)
                                podiumBorder = "border-l-4 border-amber-400"
                              if (i === 1)
                                podiumBorder = "border-l-4 border-sky-400"
                              if (i === 2)
                                podiumBorder = "border-l-4 border-emerald-400"

                              const jornada =
                                row.jornada ??
                                row.numeroJornada ??
                                row.jornadaActual ??
                                "-"

                              const isNumber =
                                typeof row.puntosJornada === "number"
                              const pj = isNumber ? row.puntosJornada : null
                              const pjDisplay =
                                pj === null || Number.isNaN(pj) ? "-" : pj

                              let pjClass =
                                "bg-slate-100 text-slate-700"
                              if (pj !== null && !Number.isNaN(pj)) {
                                if (pj >= 10) {
                                  pjClass = "bg-green-100 text-green-700"
                                } else if (pj >= 3) {
                                  pjClass = "bg-yellow-100 text-yellow-700"
                                } else {
                                  pjClass = "bg-red-100 text-red-700"
                                }
                              }

                              const totalDisplay =
                                row.puntosTotales ?? row.total ?? "-"

                              return (
                                <tr
                                  key={i}
                                  className={`transition-colors ${rowBgBase} ${podiumBorder}`}
                                >
                                  <td className="py-3 px-4 font-semibold">
                                    {i + 1}
                                  </td>

                                  <td className="py-3 px-4 font-medium text-[#003087]">
                                    {row.equipo}
                                  </td>

                                  <td className="py-3 px-4 text-gray-700">
                                    {row.usuario}
                                  </td>

                                  <td className="py-3 px-4 text-center text-gray-600">
                                    {jornada}
                                  </td>

                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${pjClass}`}
                                    >
                                      {pjDisplay}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4 text-center">
                                    <span className="px-4 py-1 rounded-full bg-sky-100 text-[#003087] font-bold text-xs shadow-sm">
                                      {totalDisplay}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600 mt-3 text-sm">
                      Aún no hay clasificación disponible en esta competición.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* PUNTOS POR JORNADA */}
            <section className="bg-white rounded-2xl shadow-md border border-sky-100 p-5 md:p-6">
              <h3 className="text-center font-semibold text-[#003087] text-lg mb-4">
                Consultar puntos por jornada
              </h3>

              {jornadas.length > 0 ? (
                <>
                  <div className="text-center mb-4">
                    <select
                      value={jornadaSeleccionada || ""}
                      onChange={(e) => handleSeleccionJornada(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white"
                    >
                      <option value="">Selecciona una jornada</option>
                      {jornadas.map((j) => (
                        <option key={j} value={j}>
                          Jornada {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  {jornadaSeleccionada && (
                    <>
                      {puntosJornadaSeleccionada.length > 0 ? (
                        <div className="mt-2 bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-[#003087] text-white">
                                <tr>
                                  <th className="py-3 px-4">#</th>
                                  <th className="py-3 px-4 text-left">
                                    Equipo
                                  </th>
                                  <th className="py-3 px-4 text-left">
                                    Usuario
                                  </th>
                                  <th className="py-3 px-4 text-center">
                                    Pts jornada
                                  </th>
                                  <th className="py-3 px-4 text-center">
                                    Total
                                  </th>
                                  <th className="py-3 px-4 text-center">
                                    Detalle
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-slate-50">
                                {puntosJornadaSeleccionada.map((r, i) => (
                                  <Fragment
                                    key={`${r.equipo}-${r.usuario}-${i}`}
                                  >
                                    <tr className="hover:bg-slate-100 transition-colors">
                                      <td className="py-3 px-4">{i + 1}</td>
                                      <td className="py-3 px-4 text-[#003087] font-medium">
                                        {r.equipo}
                                      </td>
                                      <td className="py-3 px-4 text-gray-700">
                                        {r.usuario}
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            r.puntosJornada >= 10
                                              ? "bg-green-100 text-green-700"
                                              : r.puntosJornada >= 3
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-red-100 text-red-700"
                                          }`}
                                        >
                                          {r.puntosJornada}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span className="px-4 py-1 rounded-full bg-sky-100 text-[#003087] font-bold text-xs shadow-sm">
                                          {r.puntosTotales}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          onClick={() => toggleDetalle(r.equipo)}
                                          className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs py-1.5 px-3 rounded-lg transition shadow-sm"
                                        >
                                          {detallesAbiertos[r.equipo]
                                            ? "Ocultar"
                                            : "Ver"}
                                        </button>
                                      </td>
                                    </tr>

                                    {detallesAbiertos[r.equipo] &&
                                      r.jugadores &&
                                      r.jugadores.length > 0 && (
                                        <tr>
                                          <td
                                            colSpan={6}
                                            className="bg-slate-50 px-4 pb-4 pt-2"
                                          >
                                            <div className="mt-2 bg-white border border-gray-200 rounded-xl p-4 flex justify-center">
                                              <FutsalField
                                                jugadores={r.jugadores.map(
                                                  (j, idx) => {
                                                    const info =
                                                      jugadoresMap[
                                                        j.jugador
                                                      ] || {}
                                                    return {
                                                      id: `${j.jugador}-${idx}`,
                                                      nombre:
                                                        info.nombreCorto ||
                                                        j.jugador,
                                                      posicion:
                                                        info.posicion ||
                                                        j.posicion,
                                                      dorsal:
                                                        info.dorsal ||
                                                        j.dorsal ||
                                                        j.numero ||
                                                        null,
                                                      puntos: j.puntos,
                                                    }
                                                  }
                                                )}
                                              />
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                  </Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-600 mt-3 text-sm">
                          No hay puntuaciones disponibles para la jornada
                          seleccionada.
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 text-sm">
                  No hay jornadas procesadas aún en esta competición.
                </p>
              )}
            </section>
          </>
        )}

        {/* ACCIONES INFERIORES */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to={`/competiciones/${compId}/editar`}>
            <button className="bg-[#003087] hover:bg-[#002062] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm">
              Editar competición
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard


/*          
          <Link to={`/competiciones/${compId}/procesar`}>
            <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm">
              Procesar jornada
            </button>
          </Link>

*/