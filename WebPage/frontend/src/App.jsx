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

function App() {
  // ===== Sesión =====
  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") || null

  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken())
  const navigate = useNavigate()

  useEffect(() => {
    const checkToken = () => setIsLoggedIn(!!getToken())
    checkToken()
    window.addEventListener("focus", checkToken)
    document.addEventListener("visibilitychange", checkToken)
    window.addEventListener("storage", checkToken)
    window.addEventListener("tokenChange", checkToken)
    const t = setInterval(() => { if (getToken()) { checkToken(); clearInterval(t) } }, 500)
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
  // mismo origen; si prefieres 8081, pon: const API_BASE = "http://localhost:8081"
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
    const base = "rounded-2xl p-5 shadow bg-white border hover:shadow-md transition flex flex-col justify-between"
    const primaryCls = primary ? "bg-[#1e3a8a] text-white border-[#1e3a8a] hover:brightness-110" : "border-gray-200"
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

    // jornada objetivo + resultados
    const [roundInfo, setRoundInfo] = useState({ numero: null })
    const [fixtures, setFixtures] = useState([])

    // mi equipo en la liga seleccionada
    const [myTeam, setMyTeam] = useState(null)
    const [myPlayers, setMyPlayers] = useState([])

    const [leaguesMsg, setLeaguesMsg] = useState("")

    // Utilidad para renderizar la tarjeta de resultados (evita ternarios largos)
    const renderResultados = () => {
      if (loadingData) return <SkeletonRow />

      if (fixtures && fixtures.length > 0) {
        return (
          <ul className="grid gap-2">
            {fixtures.map((m, i) => {
              const score = `${Number.isFinite(m.gl) ? m.gl : "-"} : ${Number.isFinite(m.gv) ? m.gv : "-"}`
              return (
                <li key={i} className="border rounded-xl p-3">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <span className="font-medium truncate">{m.local}</span>
                    <span className="text-lg font-semibold text-center min-w-[56px]">{score}</span>
                    <span className="font-medium text-right truncate">{m.visitante}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )
      }

      return (
        <EmptyState text={selectedId ? "No hay resultados para esta jornada." : "Selecciona una liga."} />
      )
    }


    // Cargar ligas
    useEffect(() => {
      if (!isLoggedIn) {
        setLeagues([]); setSelectedId(null); setLoadingLeagues(false); setLeaguesMsg(""); return
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
        const norm = list.map(c => ({ id: c.id || c._id, nombreCompeticion: c.nombreCompeticion }))
        setLeagues(norm)
        setSelectedId(norm[0]?.id ?? null)
        setLeaguesMsg(norm.length ? "" : "No estás en ninguna liga.")
        setLoadingLeagues(false)
      })()
      return () => ctrl.abort()
    }, [isLoggedIn])

    // Cargar datos de la liga + jornada + resultados
    useEffect(() => {
      if (!selectedId) {
        setStandings([]); setRoundInfo({ numero: null }); setFixtures([]); setMyTeam(null); setMyPlayers([]); return
      }
      const ctrl = new AbortController()
      ;(async () => {
        setLoadingData(true)

        // 1) clasificación
        try {
          const cls = await safeGet(`/api/competiciones/${selectedId}/clasificacion`, { signal: ctrl.signal })
          setStandings(Array.isArray(cls) ? cls : [])
        } catch (_) { setStandings([]) }
        // 2) determinar NÚMERO DE JORNADA objetivo (solo por ESTA competición)
        let numeroObjetivo = null
        try {
          const ji = await safeGet(`/api/competiciones/${selectedId}/jornada-actual`, { signal: ctrl.signal })
          if (ji && typeof ji.numero === "number") numeroObjetivo = ji.numero
        } catch (_) {}

        if (numeroObjetivo == null) {
          // si no hay jornada-actual, usamos las jornadas procesadas de esa competición
          try {
            const js = await safeGet(`/api/competiciones/${selectedId}/jornadas`, { signal: ctrl.signal })
            if (Array.isArray(js) && js.length) {
              numeroObjetivo = Math.max(...js.map(n => +n))
            }
          } catch (_) {}
        }

        // reflejarlo en UI
        setRoundInfo({ numero: numeroObjetivo })

        // 3) RESULTADOS: SOLO si hay jornadas procesadas en ESTA liga
        if (numeroObjetivo != null) {
          try {
            const all = await safeGet("/api/resultados", { auth: false, signal: ctrl.signal })
            const docs = Array.isArray(all) ? all : []

            const docsDeJornada = docs.filter(d => d["Numero de Jornada"] === numeroObjetivo)
            const enfTodos = docsDeJornada.flatMap(d =>
              Array.isArray(d.Enfrentamientos) ? d.Enfrentamientos : []
            )

            const normalizados = enfTodos.map(m => {
              const local = m["Equipo Local"] || m.local || m.Local || ""
              const visitante = m["Equipo Visitante"] || m.visitante || m.Visitante || ""
              const gl = m["Goles Local"] ?? m.golesLocal ?? m.GolesLocal ?? m.localGoles
              const gv = m["Goles Visitante"] ?? m.golesVisitante ?? m.GolesVisitante ?? m.visitanteGoles
              return { local, visitante, gl, gv }
            })

            const key = s => `${s.local}__${s.visitante}`
            const seen = new Set()
            const sinDup = normalizados.filter(s => (seen.has(key(s)) ? false : (seen.add(key(s)), true)))
            sinDup.sort((a, b) => a.local.localeCompare(b.local))

            setFixtures(sinDup)
          } catch (_) {
            setFixtures([])
          }
        } else {
          // liga nueva: sin jornadas procesadas => no mostramos nada
          setFixtures([])
        }

        // 4) mi equipo + jugadores
        try {
          const dash = await safeGet(`/api/dashboard/${selectedId}`, { signal: ctrl.signal })
          if (dash?.equipoActual) {
            setMyTeam(dash.equipoActual)
            const ids = new Set(dash.equipoActual.jugadoresSeleccionados || [])
            if (ids.size) {
              const allPlayers = await safeGet("/api/jugadores", { auth: false, signal: ctrl.signal })
              const players = Array.isArray(allPlayers)
                ? allPlayers
                    .filter(j => ids.has(j.Identificador))
                    .map(j => ({
                      id: j.Identificador,
                      nombre: j.NombreCompleto || j.NombreCorto || j.Identificador,
                      posicion: j.Posicion || "—",
                      equipoReal: j.Equipo || "—",
                    }))
                : []
              setMyPlayers(players)
            } else { setMyPlayers([]) }
          } else { setMyTeam(null); setMyPlayers([]) }
        } catch (_) { setMyTeam(null); setMyPlayers([]) }

        setLoadingData(false)
      })()
      return () => ctrl.abort()
    }, [selectedId])

    const hasLeagues = leagues.length > 0

    return (
      <div className="space-y-8">
        {/* Hero */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1e3a8a] mb-3">Bienvenido a Fantasy LNFS</h2>
          <p className="text-gray-600">Crea tu equipo, compite y demuestra que eres el mejor manager ⚽</p>
        </div>

        {/* Acciones rápidas */}
        {isLoggedIn ? (
          <div className="grid md:grid-cols-3 gap-4">
            <CardLink to="/misequipos" title="Mis equipos" desc="Gestiona alineaciones y fichajes" />
            <CardLink to="/competiciones" title="Competiciones" desc="Únete o crea nuevas ligas" />
            <CardLink to="/resultados" title="Resultados" desc="Consulta marcadores y jornadas" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <CardLink to="/login" title="Iniciar sesión" desc="Accede a tu cuenta" primary />
            <CardLink to="/register" title="Registrarse" desc="Crea tu cuenta en segundos" />
          </div>
        )}

        {/* Tus ligas */}
        <section className="bg-white rounded-2xl shadow p-5 space-y-6">
          <h3 className="text-xl font-semibold text-[#1e3a8a]">Tus ligas</h3>

          {!isLoggedIn && (
            <EmptyState text="Inicia sesión para ver tus ligas.">
              <Link to="/login" className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg">Iniciar sesión</Link>
            </EmptyState>
          )}

          {isLoggedIn && (
            <>
              {!!leaguesMsg && <div className="text-sm text-red-600 mb-2">{leaguesMsg}</div>}

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Liga:</label>
                {loadingLeagues ? (
                  <div className="w-56"><SkeletonRow /></div>
                ) : hasLeagues ? (
                  <select
                    value={selectedId || ""}
                    onChange={(e) => setSelectedId(e.target.value || null)}
                    className="w-56 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  >
                    {leagues.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nombreCompeticion || `Liga ${l.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-gray-500">No estás en ninguna liga.</span>
                )}
              </div>

              {/* Clasificación */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#1e3a8a]">Clasificación</h4>
                  {selectedId && (
                    <Link to={`/competiciones/${selectedId}/clasificacion`} className="text-sm text-[#1e3a8a] hover:underline">
                      Ver detalle →
                    </Link>
                  )}
                </div>

                {loadingData ? (
                  <SkeletonRow />
                ) : (standings.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-4 text-center">Pos</th>
                          <th className="py-2 pr-4">Equipo</th>
                          <th className="py-2 pr-4">Usuario</th>
                          <th className="py-2 pr-4 text-center">Pts totales</th>
                          <th className="py-2 pr-4 text-center">Pts jornada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((row, idx) => (
                          <tr key={`${row.equipo}-${idx}`} className="border-b last:border-0">
                            <td className="py-2 pr-4 text-center">{idx + 1}</td>
                            <td className="py-2 pr-4 font-medium">{row.equipo}</td>
                            <td className="py-2 pr-4">{row.usuario}</td>
                            <td className="py-2 pr-4 text-center">{row.puntosTotales ?? "-"}</td>
                            <td className="py-2 pr-4 text-center">{row.puntosJornada ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text={selectedId ? "Sin datos de clasificación." : "Selecciona una liga."} />
                ))}
              </div>

              {/* Dos columnas niveladas */}
              <div className="grid md:grid-cols-2 gap-4 items-start">
                {/* Izquierda: Mi equipo */}
                <div className="space-y-3 border rounded-2xl p-4 flex flex-col h-full max-h-[560px] overflow-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#1e3a8a]">Mi equipo</h4>
                    {myTeam?.equipoId && (
                      <Link
                        to={`/equipos/${myTeam.equipoId}/jugadores`}
                        className="text-sm text-[#1e3a8a] hover:underline"
                      >
                        Editar →
                      </Link>
                    )}
                  </div>

                  {loadingData ? (
                    <SkeletonRow />
                  ) : myTeam ? (
                    <>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{myTeam.nombreEquipo || "Sin nombre"}</span>
                      </div>
                      {myPlayers.length ? (
                        <ul className="divide-y">
                          {myPlayers.map(p => (
                            <li key={p.id} className="py-2">
                              <div className="font-medium">{p.nombre}</div>
                              <div className="text-xs text-gray-500">{p.posicion} · {p.equipoReal}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyState text="Aún no has asignado jugadores." />
                      )}
                    </>
                  ) : (
                    <EmptyState text="No tienes equipo en esta liga." />
                  )}
                </div>

                {/* Derecha: Resultados de la jornada en juego */}
                <div className="space-y-3 border rounded-2xl p-4 flex flex-col h-full max-h-[560px] overflow-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#1e3a8a]">
                      {`Resultados · Jornada ${roundInfo?.numero ?? "—"}`}
                    </h4>
                    <Link to="/resultados" className="text-sm text-[#1e3a8a] hover:underline">
                      Ver más →
                    </Link>
                  </div>

                  {renderResultados()}
                </div>
              </div>
            </>
          )}
        </section>
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
            <Link className="hover:text-[#dc2626]" to="/">Inicio</Link>
            <Link className="hover:text-[#dc2626]" to="/jugadores">Jugadores</Link>
            <Link className="hover:text-[#dc2626]" to="/competiciones">Competiciones</Link>

            {isLoggedIn && (
              <>
                <Link className="hover:text-[#dc2626]" to="/misequipos">Mis equipos</Link>
                <Link className="hover:text-[#dc2626]" to="/crearequipo">Crear equipo</Link>
              </>
            )}

            <Link className="hover:text-[#dc2626]" to="/eventos">Eventos</Link>
            <Link className="hover:text-[#dc2626]" to="/resultados">Resultados</Link>

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-1 px-3 rounded transition"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link to="/login" className="bg:white text-[#1e3a8a] font-semibold py-1 px-3 rounded hover:bg-gray-200 transition bg-white">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="bg-[#dc2626] text-white font-semibold py-1 px-3 rounded hover:bg-[#b91c1c] transition">
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
          <Route path="/competiciones" element={<PrivateRoute><Competiciones /></PrivateRoute>} />
          <Route path="/misequipos" element={<PrivateRoute><MisEquipos /></PrivateRoute>} />
          <Route path="/crearequipo" element={<PrivateRoute><CrearEquipo /></PrivateRoute>} />
          <Route path="/equipos/:equipoId/jugadores" element={<PrivateRoute><AsignarJugadores /></PrivateRoute>} />
          <Route path="/dashboard/:compId" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/competiciones/:compId/clasificacion" element={<PrivateRoute><Clasificacion /></PrivateRoute>} />
          <Route path="/competiciones/:compId/jornadas/:num/puntos" element={<PrivateRoute><JornadaPuntos /></PrivateRoute>} />
          <Route path="/competiciones/:compId/editar" element={<PrivateRoute><EditarCompeticion /></PrivateRoute>} />
          <Route path="/competiciones/:compId/procesar" element={<PrivateRoute><ProcesarJornada /></PrivateRoute>} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
