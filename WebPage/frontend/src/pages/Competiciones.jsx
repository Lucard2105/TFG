import { useEffect, useMemo, useState } from "react"
import { api } from "../services/apifetch"
import { Link } from "react-router-dom"

function Competiciones() {
  // ======= ESTADOS =======
  const [misCompeticiones, setMisCompeticiones] = useState([])
  const [todasCompeticiones, setTodasCompeticiones] = useState([])

  const [codigo, setCodigo] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  const [nombreCompeticion, setNombreCompeticion] = useState("")
  const [tipo, setTipo] = useState("publica")
  const [sistemaPuntuacion, setSistemaPuntuacion] = useState("Estandar")

  const [busqueda, setBusqueda] = useState("")

  // ======= CARGA =======
  const recargarListas = async () => {
    setCargando(true)
    setMensaje("")
    setError("")
    try {
      const [mias, todas] = await Promise.all([
        api.get("/api/mis-competiciones"),
        api.get("/api/competiciones"),
      ])
      setMisCompeticiones(Array.isArray(mias) ? mias : [])
      setTodasCompeticiones(Array.isArray(todas) ? todas : [])
    } catch (e) {
      setError(e?.message || "Error cargando competiciones")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    recargarListas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ======= DERIVADAS =======
  const idsMias = useMemo(
    () => new Set(misCompeticiones.map(c => c._id || c.id)),
    [misCompeticiones]
  )

  const publicasDisponibles = useMemo(() => {
    const lista = (todasCompeticiones || []).filter(c => c.tipo === "publica")
    return lista.filter(c => !idsMias.has(c._id || c.id))
  }, [todasCompeticiones, idsMias])

  const publicasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return publicasDisponibles
    return publicasDisponibles.filter(c =>
      (c.nombreCompeticion || "").toLowerCase().includes(q)
    )
  }, [publicasDisponibles, busqueda])

  // ======= ACCIONES =======
  const unirsePrivada = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")
    try {
      const data = await api.post("/api/competiciones/unirse", { codigoInvitacion: codigo })
      setMensaje(data.mensaje || "Te has unido a la competición")
      setCodigo("")
      await recargarListas()
    } catch (err) {
      setError(err.message)
    }
  }

  const unirsePublica = async (comp) => {
    setMensaje("")
    setError("")
    const compId = comp._id || comp.id
    if (idsMias.has(compId)) {
      setMensaje("Ya perteneces a esta competición.")
      return
    }
    try {
      await api.post("/api/competiciones/unirse", { compId })
      setMensaje(`Te has unido a '${comp.nombreCompeticion}'`)
      await recargarListas()
    } catch (err1) {
      const code = comp.codigoInvitacion
      if (code) {
        try {
          await api.post("/api/competiciones/unirse", { codigoInvitacion: code })
          setMensaje(`Te has unido a '${comp.nombreCompeticion}'`)
          await recargarListas()
          return
        } catch (err2) {
          setError(err2?.message || "No se pudo unir a la liga pública (código inválido).")
          return
        }
      }
      setError(err1?.message || "No se pudo unir a la liga pública.")
    }
  }

  const crearCompeticion = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")
    try {
      const data = await api.post("/api/competiciones", {
        nombreCompeticion,
        tipo,
        sistemaPuntuacion
      })
      let msg = data.mensaje || "Competición creada"
      if (data.codigoInvitacion) {
        msg += ` | Código invitación: ${data.codigoInvitacion}`
      }
      setMensaje(msg)
      setNombreCompeticion("")
      setTipo("publica")
      setSistemaPuntuacion("Estandar")
      await recargarListas()
    } catch (err) {
      setError(err.message)
    }
  }

  const abandonar = async (comp) => {
    setMensaje("")
    setError("")
    try {
      const compId = comp._id || comp.id
      const data = await api.del(`/api/competiciones/${compId}/abandonar`)
      setMensaje(data.mensaje || "Has abandonado la competición")
      await recargarListas()
    } catch (err) {
      setError(err.message)
    }
  }

  // ======= UI =======
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-[#1e3a8a]">🏆 Competiciones</h2>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {mensaje && <p className="text-green-600 mt-2">{mensaje}</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MIS COMPETICIONES */}
        <section className="relative bg-white shadow-md rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1e3a8a]">Mis competiciones</h3>
            <span className="inline-flex items-center justify-center text-xs font-medium bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
              {misCompeticiones.length}
            </span>
          </div>

          {cargando ? (
            <div className="animate-pulse space-y-2 mt-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-3/5" />
            </div>
          ) : misCompeticiones.length === 0 ? (
            <div className="mt-4 text-gray-600 border border-dashed rounded-lg p-4 text-center">
              No estás inscrito en ninguna liga.
            </div>
          ) : (
            <ul className="mt-3">
              {misCompeticiones.map((c, idx) => {
                const compId = c._id || c.id
                return (
                  <li
                    key={compId}
                    className={`py-3 ${idx !== 0 ? "border-t border-gray-200" : ""} flex flex-col sm:flex-row sm:justify-between sm:items-center`}
                  >
                    {/* Bloque izquierdo en dos líneas para no mover los botones */}
                    <div className="w-full sm:w-auto">
                      <div className="space-x-1">
                        <strong className="text-[#1e3a8a]">{c.nombreCompeticion}</strong>
                        <span className="text-sm text-gray-600">({c.tipo || "publica"})</span>
                      </div>
                      {c.tipo === "privada" && c.codigoInvitacion && (
                        <div className="mt-1">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Código: {c.codigoInvitacion}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-x-2 mt-2 sm:mt-0">
                      <Link
                        to={`/dashboard/${compId}`}
                        className="text-white bg-[#1e3a8a] hover:bg-[#2e4fa8] py-1 px-3 rounded text-sm"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={`/competiciones/${compId}/clasificacion`}
                        className="text-white bg-[#dc2626] hover:bg-[#b91c1c] py-1 px-3 rounded text-sm"
                      >
                        Clasificación
                      </Link>
                      <button
                        onClick={() => abandonar(c)}
                        className="text-gray-700 bg-gray-200 hover:bg-gray-300 py-1 px-3 rounded text-sm"
                      >
                        Abandonar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* UNIRSE A COMPETICIONES */}
        <section className="relative bg-white shadow-md rounded-xl p-5">

          {/* Título + buscador + badge arriba */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-[#1e3a8a] m-0">
              Unirse a competiciones públicas
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar liga…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-40 text-sm"
                aria-label="Buscar liga pública"
              />

              <span
                className="inline-flex items-center justify-center text-xs font-medium bg-gray-100 text-gray-700 rounded-full w-6 h-6"
              >
                {publicasDisponibles.length}
              </span>
            </div>
          </div>
          {/* Lista de públicas (sin rótulo intermedio) */}
          {cargando ? (
            <div className="animate-pulse space-y-2 mt-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-3/5" />
            </div>
          ) : publicasFiltradas.length === 0 ? (
            <div className="mt-4 text-gray-600 border border-dashed rounded-lg p-4 text-center">
              No hay ligas públicas disponibles.
            </div>
          ) : (
            <ul className="mt-3">
              {publicasFiltradas.map((c, idx) => {
                const compId = c._id || c.id
                const yaEstoy = idsMias.has(compId)
                return (
                  <li
                    key={compId}
                    className={`py-3 ${idx !== 0 ? "border-t border-gray-200" : ""} flex flex-col sm:flex-row sm:justify-between sm:items-center`}
                  >
                    <div>
                      <strong className="text-[#1e3a8a]">{c.nombreCompeticion}</strong>{" "}
                      <span className="text-sm text-gray-600">(pública)</span>
                    </div>

                    <div className="space-x-2 mt-2 sm:mt-0">
                      <Link
                        to={`/competiciones/${compId}/clasificacion`}
                        className="text-white bg-[#dc2626] hover:bg-[#b91c1c] py-1 px-3 rounded text-sm"
                      >
                        Clasificación
                      </Link>
                      {!yaEstoy && (
                        <button
                          onClick={() => unirsePublica(c)}
                          className="text-white bg-green-600 hover:bg-green-700 py-1 px-3 rounded text-sm"
                        >
                          Unirme
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Unirse por código */}
          <div className="border-t mt-6 pt-4">
            <h4 className="font-medium text-gray-800 mb-2">Unirse a liga privada por código</h4>
            <form onSubmit={unirsePrivada} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Código de invitación"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="border border-gray-300 rounded p-2 flex-1"
                aria-label="Código de invitación"
              />
              <button
                type="submit"
                className="bg-[#1e3a8a] hover:bg-[#2e4fa8] text-white font-semibold py-2 px-4 rounded"
              >
                Unirse
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* CREAR COMPETICIÓN */}
      <section className="bg-white shadow-md rounded-xl p-5 mt-6">
        <h3 className="text-lg font-semibold text-[#1e3a8a] mb-2">Crear nueva competición</h3>
        <form onSubmit={crearCompeticion} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de la competición"
            value={nombreCompeticion}
            onChange={(e) => setNombreCompeticion(e.target.value)}
            required
            className="border border-gray-300 rounded p-2 w-full"
          />
          <div className="flex gap-3">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="border border-gray-300 rounded p-2 flex-1"
            >
              <option value="publica">Pública</option>
              <option value="privada">Privada</option>
            </select>
            <select
              value={sistemaPuntuacion}
              onChange={(e) => setSistemaPuntuacion(e.target.value)}
              className="border border-gray-300 rounded p-2 flex-1"
            >
              <option value="Estandar">Estándar</option>
              <option value="Goles">Goles</option>
              <option value="RendimientoComunitario">Rendimiento Comunitario</option>
              <option value="FairPlay">Fair Play</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-2 rounded"
          >
            Crear competición
          </button>
        </form>
      </section>
    </div>
  )
}

export default Competiciones
