import { Routes, Route, Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Footer from "./components/footer"

import Jugadores from "./pages/Jugadores"
import Login from "./pages/Login"
import Registro from "./pages/Registro"
import MisEquipos from "./pages/Misequipos"
import CrearEquipo from "./pages/Crearequipo"
import PrivateRoute from "./components/Rutaprivada"
import Competiciones from "./pages/Competiciones"
import AsignarJugadores from "./pages/Asignarjugadores"
import Recuperar from "./pages/Recuperar"
import Reset from "./pages/Reset"
import Dashboard from "./pages/Dashboard"
import Clasificacion from "./pages/Clasificacion"
import JornadaPuntos from "./pages/Jornadapuntos"
import EditarCompeticion from "./pages/Editarcompeticiones"
import ProcesarJornada from "./pages/Procesarjornada"
import Eventos from "./pages/Eventos"
import Resultados from "./pages/Resultados"
import StatsJugadoresLiga from "./pages/StatsJugadoresLiga"

function App() {
  // ===== Sesión =====
  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    null

  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken())
  const navigate = useNavigate()

  useEffect(() => {
    const checkToken = () => setIsLoggedIn(!!getToken())
    checkToken()

    window.addEventListener("focus", checkToken)
    document.addEventListener("visibilitychange", checkToken)
    window.addEventListener("storage", checkToken)
    window.addEventListener("tokenChange", checkToken)

    const t = setInterval(() => {
      if (getToken()) {
        checkToken()
        clearInterval(t)
      }
    }, 500)

    return () => {
      window.removeEventListener("focus", checkToken)
      document.removeEventListener("visibilitychange", checkToken)
      window.removeEventListener("storage", checkToken)
      window.removeEventListener("tokenChange", checkToken)
      clearInterval(t)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("authToken")
    localStorage.removeItem("jwt")
    setIsLoggedIn(false)
    window.dispatchEvent(new Event("tokenChange"))
    navigate("/login")
  }

  // ===== Helpers =====
  const API_BASE = ""

  async function safeGet(path, { auth = true, signal } = {}) {
    const headers = { "Content-Type": "application/json" }
    const tok = getToken()
    if (auth && tok) headers.Authorization = `Bearer ${tok}`

    const res = await fetch(`${API_BASE}${path}`, { headers, signal })
    if (!res.ok) {
      const txt = await res.text().catch(() => "")
      const err = new Error(`HTTP ${res.status}`)
      err.status = res.status
      err.body = txt
      throw err
    }
    return res.json()
  }

  function EmptyState({ text, children }) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>{text}</p>
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    )
  }

  function SkeletonRow() {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-3/5" />
      </div>
    )
  }

  function CardLink({ to, title, desc, primary = false }) {
    const base =
      "rounded-2xl p-5 shadow bg-white border hover:shadow-md transition flex flex-col justify-between"
    const primaryCls = primary
      ? "bg-[#1e3a8a] text-white border-[#1e3a8a] hover:brightness-110"
      : "border-gray-200"
    return (
      <Link to={to} className={`${base} ${primaryCls}`}>
        <div>
          <h4 className="text-lg font-semibold">{title}</h4>
          <p className="text-gray-600 mt-1">{desc}</p>
        </div>
        <span className="mt-4 inline-block text-sm opacity-80">Ir →</span>
      </Link>
    )
  }

  // ===== Home + Tus ligas =====
  function HomeLeagues() {
    const [loadingLeagues, setLoadingLeagues] = useState(true)
    const [leagues, setLeagues] = useState([])
    const [selectedId, setSelectedId] = useState(null)

    const [loadingData, setLoadingData] = useState(false)
    const [standings, setStandings] = useState([])

    const [roundInfo, setRoundInfo] = useState({ numero: null })
    const [fixtures, setFixtures] = useState([])

    const [myTeam, setMyTeam] = useState(null)
    const [myPlayers, setMyPlayers] = useState([])

    const [leaguesMsg, setLeaguesMsg] = useState("")

    const [availableRounds, setAvailableRounds] = useState([])
    const [currentRound, setCurrentRound] = useState(null)

    const minRound = availableRounds.length ? availableRounds[0] : null
    const maxRound = availableRounds.length
      ? availableRounds[availableRounds.length - 1]
      : null

    // ===== Posiciones sobre el campo (rombo 3–1) =====
    // 0 Portero, 1 Cierre, 2 Ala izq, 3 Ala dcha, 4 Pívot
    const playerSlots = [
      { cls: "top-[82%] left-1/2 -translate-x-1/2", rol: "Portero" },
      { cls: "top-[65%] left-1/2 -translate-x-1/2", rol: "Cierre" },
      { cls: "top-[45%] left-[24%] -translate-x-1/2", rol: "Ala" },
      { cls: "top-[45%] left-[76%] -translate-x-1/2", rol: "Ala" },
      { cls: "top-[20%] left-1/2 -translate-x-1/2", rol: "Pívot" },
    ]

    // Normaliza “Pívot/pivot/PIVOT” etc
    const normPos = (s) =>
      String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()

    const makePlayerObj = (j, fallbackIdx = 0) => {
      const nombreCompleto =
        j?.NombreCompleto || j?.NombreCorto || j?.Identificador || "—"
      const shortName =
        j?.NombreCorto ||
        (typeof nombreCompleto === "string"
          ? nombreCompleto.split(" ")[0]
          : nombreCompleto)

      const dorsal =
        j?.Dorsal ??
        j?.dorsal ??
        j?.Numero ??
        j?.numero ??
        j?.Camiseta ??
        j?.camiseta ??
        fallbackIdx + 1

      return {
        id: j?.Identificador,
        nombre: nombreCompleto,
        shortName,
        posicion: j?.Posicion || "—",
        equipoReal: j?.Equipo || "—",
        dorsal,
      }
    }

    // Coloca los jugadores por la posición real (Portero/Cierre/Ala/Ala/Pívot)
    const orderBySlots = (players) => {
      const used = new Set()
      const want = ["portero", "cierre", "ala", "ala", "pivot"]

      const pick = (target) => {
        const idx = players.findIndex((p) => !used.has(p.id) && normPos(p.posicion) === target)
        if (idx === -1) return null
        const p = players[idx]
        used.add(p.id)
        return p
      }

      const out = []
      for (const target of want) {
        const found = pick(target)
        if (found) out.push(found)
      }

      // Si faltase alguna posición (datos raros), rellena con los restantes (sin romper UI)
      if (out.length < 5) {
        for (const p of players) {
          if (out.length >= 5) break
          if (!used.has(p.id)) {
            used.add(p.id)
            out.push(p)
          }
        }
      }

      return out
    }

    const loadFixturesForRound = async (roundNumber, signal) => {
      if (roundNumber == null) {
        setFixtures([])
        return
      }
      try {
        const all = await safeGet("/api/resultados", { auth: false, signal })
        const docs = Array.isArray(all) ? all : []

        const docsDeJornada = docs.filter((d) => d["Numero de Jornada"] === roundNumber)
        const enfTodos = docsDeJornada.flatMap((d) =>
          Array.isArray(d.Enfrentamientos) ? d.Enfrentamientos : []
        )

        const normalizados = enfTodos.map((m) => {
          const local = m["Equipo Local"] || m.local || m.Local || ""
          const visitante = m["Equipo Visitante"] || m.visitante || m.Visitante || ""
          const gl =
            m["Goles Local"] ??
            m.golesLocal ??
            m.GolesLocal ??
            m.localGoles
          const gv =
            m["Goles Visitante"] ??
            m.golesVisitante ??
            m.GolesVisitante ??
            m.visitanteGoles
          return { local, visitante, gl, gv }
        })

        const key = (s) => `${s.local}__${s.visitante}`
        const seen = new Set()
        const sinDup = normalizados.filter((s) =>
          seen.has(key(s)) ? false : (seen.add(key(s)), true)
        )
        sinDup.sort((a, b) => a.local.localeCompare(b.local))

        setFixtures(sinDup)
      } catch (_) {
        setFixtures([])
      }
    }

    const changeRound = async (direction) => {
      if (!currentRound || !availableRounds.length) return
      const sorted = [...availableRounds].sort((a, b) => a - b)
      const idx = sorted.indexOf(currentRound)
      if (idx === -1) return

      const newIdx = direction === "prev" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= sorted.length) return

      const newRound = sorted[newIdx]
      setCurrentRound(newRound)
      setRoundInfo((prev) => ({ ...prev, numero: newRound }))
      setLoadingData(true)
      try {
        await loadFixturesForRound(newRound)
      } finally {
        setLoadingData(false)
      }
    }

    const renderResultados = () => {
      if (loadingData) return <SkeletonRow />

      if (fixtures && fixtures.length > 0) {
        return (
          <ul className="grid gap-2">
            {fixtures.map((m, i) => {
              const score = `${Number.isFinite(m.gl) ? m.gl : "-"} : ${
                Number.isFinite(m.gv) ? m.gv : "-"
              }`
              return (
                <li key={i} className="border rounded-xl p-3 bg-white">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <span className="font-medium truncate text-gray-800">{m.local}</span>
                    <span className="text-lg font-semibold text-center min-w-[56px] text-[#003087]">
                      {score}
                    </span>
                    <span className="font-medium text-right truncate text-gray-800">
                      {m.visitante}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )
      }

      return (
        <EmptyState
          text={
            selectedId ? "No hay resultados para esta jornada." : "Selecciona una liga."
          }
        />
      )
    }

    // Cargar ligas
    useEffect(() => {
      if (!isLoggedIn) {
        setLeagues([])
        setSelectedId(null)
        setLoadingLeagues(false)
        setLeaguesMsg("")
        return
      }
      const ctrl = new AbortController()
      ;(async () => {
        setLoadingLeagues(true)
        let list = []
        try {
          list = await safeGet("/api/competiciones/mias", { signal: ctrl.signal })
          if (!Array.isArray(list) || list.length === 0) {
            list = await safeGet("/api/mis-competiciones", { signal: ctrl.signal })
          }
        } catch (_) {}
        list = Array.isArray(list) ? list : []
        const norm = list.map((c) => ({
          id: c.id || c._id,
          nombreCompeticion: c.nombreCompeticion,
        }))
        setLeagues(norm)
        setSelectedId(norm[0]?.id ?? null)
        setLeaguesMsg(norm.length ? "" : "No estás en ninguna liga.")
        setLoadingLeagues(false)
      })()
      return () => ctrl.abort()
    }, [isLoggedIn])

    // Cargar datos de la liga + jornadas + resultados
    useEffect(() => {
      if (!selectedId) {
        setStandings([])
        setRoundInfo({ numero: null })
        setFixtures([])
        setMyTeam(null)
        setMyPlayers([])
        setAvailableRounds([])
        setCurrentRound(null)
        return
      }
      const ctrl = new AbortController()
      ;(async () => {
        setLoadingData(true)

        // 1) clasificación
        try {
          const cls = await safeGet(`/api/competiciones/${selectedId}/clasificacion`, {
            signal: ctrl.signal,
          })
          setStandings(Array.isArray(cls) ? cls : [])
        } catch (_) {
          setStandings([])
        }

        // 2) jornadas procesadas
        let jornadasProcesadas = []
        try {
          const js = await safeGet(`/api/competiciones/${selectedId}/jornadas`, {
            signal: ctrl.signal,
          })
          if (Array.isArray(js) && js.length) {
            jornadasProcesadas = js.map((n) => +n).filter((n) => !Number.isNaN(n))
          }
        } catch (_) {
          jornadasProcesadas = []
        }

        const sortedRounds = [...jornadasProcesadas].sort((a, b) => a - b)
        setAvailableRounds(sortedRounds)

        // 3) determinar NÚMERO DE JORNADA objetivo
        let numeroObjetivo = null
        try {
          const ji = await safeGet(`/api/competiciones/${selectedId}/jornada-actual`, {
            signal: ctrl.signal,
          })
          if (ji && typeof ji.numero === "number") numeroObjetivo = ji.numero
        } catch (_) {}

        if (numeroObjetivo == null && sortedRounds.length) {
          numeroObjetivo = sortedRounds[sortedRounds.length - 1]
        }

        setRoundInfo({ numero: numeroObjetivo })
        setCurrentRound(numeroObjetivo)

        // 4) RESULTADOS de esa jornada
        if (numeroObjetivo != null) {
          await loadFixturesForRound(numeroObjetivo, ctrl.signal)
        } else {
          setFixtures([])
        }

        // 5) mi equipo + jugadores (ordenados por posición REAL)
        try {
          const dash = await safeGet(`/api/dashboard/${selectedId}`, {
            signal: ctrl.signal,
          })

          if (dash?.equipoActual) {
            setMyTeam(dash.equipoActual)

            const selectedIds = Array.isArray(dash.equipoActual.jugadoresSeleccionados)
              ? dash.equipoActual.jugadoresSeleccionados
              : []

            if (selectedIds.length) {
              const allPlayers = await safeGet("/api/jugadores", {
                auth: false,
                signal: ctrl.signal,
              })

              const byId = new Map(
                (Array.isArray(allPlayers) ? allPlayers : []).map((j) => [
                  j.Identificador,
                  j,
                ])
              )

              // 1) construimos lista base siguiendo el orden del equipo
              const base = selectedIds
                .map((id, idx) => {
                  const j = byId.get(id)
                  return j ? makePlayerObj(j, idx) : null
                })
                .filter(Boolean)

              // 2) reordenamos por slots (portero/cierre/ala/ala/pivot)
              const ordered = orderBySlots(base)

              setMyPlayers(ordered)
            } else {
              setMyPlayers([])
            }
          } else {
            setMyTeam(null)
            setMyPlayers([])
          }
        } catch (_) {
          setMyTeam(null)
          setMyPlayers([])
        }

        setLoadingData(false)
      })()
      return () => ctrl.abort()
    }, [selectedId])

    const hasLeagues = leagues.length > 0

    return (
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8 space-y-8">
          {/* Hero */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1e3a8a] mb-2">
              Bienvenido a Fantasy <span className="text-[#dc2626]">LNFS</span>
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Crea tu equipo, compite y demuestra que eres el mejor manager ⚽
            </p>
          </div>

          {/* Acciones rápidas (QUITAMOS la tarjeta naranja de Resultados) */}
          {isLoggedIn ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                to="/misequipos"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 text-white p-5 shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl">
                    🧩
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Mis equipos</h3>
                    <p className="text-xs text-sky-100">
                      Gestiona plantillas, fichajes y capitanes.
                    </p>
                  </div>
                </div>
                <span className="mt-4 text-xs font-semibold text-sky-100 group-hover:text-white">
                  Entrar →
                </span>
              </Link>

              <Link
                to="/competiciones"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Competiciones</h3>
                    <p className="text-xs text-emerald-100">
                      Únete a ligas o crea nuevas competiciones.
                    </p>
                  </div>
                </div>
                <span className="mt-4 text-xs font-semibold text-emerald-100 group-hover:text-white">
                  Ver ligas →
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <CardLink to="/login" title="Iniciar sesión" desc="Accede a tu cuenta" primary />
              <CardLink to="/register" title="Registrarse" desc="Crea tu cuenta en segundos" />
            </div>
          )}

          {/* Tus ligas */}
          <section className="bg-white rounded-2xl shadow-md p-5 space-y-6 border border-sky-100">
            <h3 className="text-xl font-semibold text-[#1e3a8a]">Tus ligas</h3>

            {!isLoggedIn && (
              <EmptyState text="Inicia sesión para ver tus ligas.">
                <Link
                  to="/login"
                  className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#132c70] transition"
                >
                  Iniciar sesión
                </Link>
              </EmptyState>
            )}

            {isLoggedIn && (
              <>
                {!!leaguesMsg && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>{leaguesMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm text-gray-600">Liga:</label>
                  {loadingLeagues ? (
                    <div className="w-56">
                      <SkeletonRow />
                    </div>
                  ) : hasLeagues ? (
                    <select
                      value={selectedId || ""}
                      onChange={(e) => setSelectedId(e.target.value || null)}
                      className="w-56 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] bg-white"
                    >
                      {leagues.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nombreCompeticion || `Liga ${l.id}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-500 text-sm">No estás en ninguna liga.</span>
                  )}
                </div>

                {/* Clasificación */}
                <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-[#1e3a8a] border-b-2 border-[#dc2626] pb-1">
                      Clasificación general
                    </h4>
                    {selectedId && (
                      <Link
                        to={`/competiciones/${selectedId}/clasificacion`}
                        className="bg-[#1e3a8a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#132c70] transition"
                      >
                        Ver detalle →
                      </Link>
                    )}
                  </div>

                  {loadingData ? (
                    <SkeletonRow />
                  ) : standings.length ? (
                    <div className="mt-2 bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#003087] text-white">
                            <tr>
                              <th className="py-3 px-4 text-left">#</th>
                              <th className="py-3 px-4 text-left">Equipo</th>
                              <th className="py-3 px-4 text-left">Usuario</th>
                              <th className="py-3 px-4 text-center">Jornada</th>
                              <th className="py-3 px-4 text-center">Pts Jornada</th>
                              <th className="py-3 px-4 text-center">Total</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-200">
                            {standings.map((row, i) => {
                              const rowBgBase = "bg-slate-50 hover:bg-slate-100"
                              let podiumBorder = "border-l-4 border-transparent"
                              if (i === 0) podiumBorder = "border-l-4 border-amber-400"
                              if (i === 1) podiumBorder = "border-l-4 border-sky-400"
                              if (i === 2) podiumBorder = "border-l-4 border-emerald-400"

                              const jornada =
                                row.jornada ?? row.numeroJornada ?? row.jornadaActual ?? "-"

                              const isNumber = typeof row.puntosJornada === "number"
                              const pj = isNumber ? row.puntosJornada : null
                              const pjDisplay = pj === null || Number.isNaN(pj) ? "-" : pj

                              let pjClass = "bg-slate-100 text-slate-700"
                              if (pj !== null && !Number.isNaN(pj)) {
                                if (pj >= 10) pjClass = "bg-green-100 text-green-700"
                                else if (pj >= 3) pjClass = "bg-yellow-100 text-yellow-700"
                                else pjClass = "bg-red-100 text-red-700"
                              }

                              const totalDisplay = row.puntosTotales ?? row.total ?? "-"

                              return (
                                <tr
                                  key={i}
                                  className={`transition-colors ${rowBgBase} ${podiumBorder}`}
                                >
                                  <td className="py-3 px-4 font-semibold">{i + 1}</td>
                                  <td className="py-3 px-4 font-medium text-[#003087]">
                                    {row.equipo}
                                  </td>
                                  <td className="py-3 px-4 text-gray-700">{row.usuario}</td>
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
                    <EmptyState
                      text={selectedId ? "Sin datos de clasificación." : "Selecciona una liga."}
                    />
                  )}
                </div>

                {/* Dos columnas: Mi equipo + Resultados */}
                <div className="grid md:grid-cols-2 gap-4 items-stretch">
                  {/* Mi equipo */}
                  <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-lg font-semibold text-[#1e3a8a] border-b-2 border-[#dc2626] pb-1">
                        Mi equipo
                      </h4>

                      {/* EDITAR: ahora va a /misequipos */}
                      {myTeam?.equipoId && (
                        <Link
                          to="/misequipos"
                          className="bg-[#1e3a8a] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow hover:bg-[#132c70] transition"
                        >
                          Editar →
                        </Link>
                      )}
                    </div>

                    {loadingData ? (
                      <SkeletonRow />
                    ) : myTeam ? (
                      <>
                        <div className="text-sm text-gray-700 mb-3">
                          <span className="font-medium">
                            {myTeam.nombreEquipo || "Sin nombre"}
                          </span>
                          {myTeam.nombreLiga && (
                            <span className="ml-2 text-xs text-gray-500">· {myTeam.nombreLiga}</span>
                          )}
                        </div>

                        {myPlayers.length ? (
                          <div className="flex-1 flex flex-col justify-center">
                            <div
                              className="relative w-full max-w-xs mx-auto aspect-[9/16] rounded-2xl shadow-inner overflow-hidden border border-sky-200 bg-slate-900"
                              style={{
                                backgroundImage: "url('public/img/image.png')",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            >
                              <div className="absolute inset-0 bg-slate-900/10" />
                              <div className="relative z-10 w-full h-full">
                                {myPlayers.slice(0, playerSlots.length).map((p, index) => {
                                  const slot = playerSlots[index]
                                  if (!slot) return null

                                  const dorsal =
                                    p.dorsal != null && p.dorsal !== "" ? p.dorsal : index + 1

                                  return (
                                    <div
                                      key={p.id || index}
                                      className={`absolute ${slot.cls} flex flex-col items-center`}
                                    >
                                      <div className="relative">
                                        <div className="absolute inset-0 translate-y-1 rounded-full bg-black/40 blur-[3px]" />
                                        <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#dc2626] border-2 border-white/70 shadow-xl flex flex-col items-center justify-center text-center text-[8px] leading-tight px-1">
                                          <span className="text-[8px] font-semibold text-sky-100 truncate w-[3rem]">
                                            {p.shortName}
                                          </span>
                                          <span className="text-[13px] font-extrabold text-white leading-none mt-0.5 tracking-tight">
                                            {dorsal}
                                          </span>
                                          <span className="text-[7px] uppercase tracking-wide text-sky-100/90 mt-0.5">
                                            {slot.rol}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500 text-center">
                              Esquema 3–1: Portero, Cierre, Alas y Pívot (se muestran hasta 5
                              jugadores).
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <EmptyState text="Aún no has asignado jugadores." />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <EmptyState text="No tienes equipo en esta liga." />
                      </div>
                    )}
                  </div>

                  {/* Resultados jornada */}
                  <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-lg font-semibold text-[#1e3a8a] flex items-center gap-3 border-b-2 border-[#dc2626] pb-1">
                        <span>Resultados · Jornada {roundInfo?.numero ?? "—"}</span>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => changeRound("prev")}
                            disabled={!currentRound || !minRound || currentRound === minRound}
                            className="px-2 py-1 text-xs rounded-full border border-gray-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => changeRound("next")}
                            disabled={!currentRound || !maxRound || currentRound === maxRound}
                            className="px-2 py-1 text-xs rounded-full border border-gray-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            →
                          </button>
                        </div>
                      </h4>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">{renderResultados()}</div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    )
  }

  // ===== Render App =====
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col">
      <header className="bg-[#1e3a8a] shadow-md">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <h1 className="text-2xl font-bold text-white">
            Fantasy <span className="text-[#dc2626]">LNFS</span>
          </h1>

          <nav className="flex items-center space-x-4 text-sm font-medium text-white">
            <Link className="hover:text-[#dc2626]" to="/">
              Inicio
            </Link>
            <Link className="hover:text-[#dc2626]" to="/jugadores">
              Jugadores
            </Link>
            <Link className="hover:text-[#dc2626]" to="/competiciones">
              Competiciones
            </Link>

            {isLoggedIn && (
              <>
                <Link className="hover:text-[#dc2626]" to="/misequipos">
                  Mis equipos
                </Link>
                <Link className="hover:text-[#dc2626]" to="/crearequipo">
                  Crear equipo
                </Link>
              </>
            )}
            {/* <Link className="hover:text-[#dc2626]" to="/eventos">
              Eventos
            </Link>
            <Link className="hover:text-[#dc2626]" to="/resultados">
              Resultados
            </Link>
            */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-1 px-3 rounded transition"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-white text-[#1e3a8a] font-semibold py-1 px-3 rounded hover:bg-gray-200 transition"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-[#dc2626] text-white font-semibold py-1 px-3 rounded hover:bg-[#b91c1c] transition"
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-grow">
        <Routes>
          <Route path="/" element={<HomeLeagues />} />
          <Route path="/jugadores" element={<Jugadores />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route
            path="/competiciones"
            element={
              <PrivateRoute>
                <Competiciones />
              </PrivateRoute>
            }
          />
          <Route
            path="/misequipos"
            element={
              <PrivateRoute>
                <MisEquipos />
              </PrivateRoute>
            }
          />
          <Route
            path="/crearequipo"
            element={
              <PrivateRoute>
                <CrearEquipo />
              </PrivateRoute>
            }
          />
          <Route
            path="/equipos/:equipoId/jugadores"
            element={
              <PrivateRoute>
                <AsignarJugadores />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/:compId"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/clasificacion"
            element={
              <PrivateRoute>
                <Clasificacion />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/jornadas/:num/puntos"
            element={
              <PrivateRoute>
                <JornadaPuntos />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/editar"
            element={
              <PrivateRoute>
                <EditarCompeticion />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/procesar"
            element={
              <PrivateRoute>
                <ProcesarJornada />
              </PrivateRoute>
            }
          />
          <Route path="/competiciones/:compId/stats" element={<StatsJugadoresLiga />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
