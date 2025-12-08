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
      const msg = e?.response?.data?.error
      setError(
        msg ||
          e?.message ||
          "No se han podido cargar las competiciones. Inténtalo de nuevo en unos segundos."
      )
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
    () => new Set(misCompeticiones.map((c) => c._id || c.id)),
    [misCompeticiones]
  )

  const publicasDisponibles = useMemo(() => {
    const lista = (todasCompeticiones || []).filter((c) => c.tipo === "publica")
    return lista.filter((c) => !idsMias.has(c._id || c.id))
  }, [todasCompeticiones, idsMias])

  const publicasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return publicasDisponibles
    return publicasDisponibles.filter((c) =>
      (c.nombreCompeticion || "").toLowerCase().includes(q)
    )
  }, [publicasDisponibles, busqueda])

  // ======= ACCIONES =======
  const unirsePrivada = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")
    try {
      const data = await api.post("/api/competiciones/unirse", {
        codigoInvitacion: codigo,
      })
      setMensaje(
        data.mensaje || "Te has unido a la competición privada correctamente."
      )
      setCodigo("")
      await recargarListas()
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido unir a la liga privada. Revisa el código e inténtalo de nuevo."
      )
    }
  }

  const unirsePublica = async (comp) => {
    setMensaje("")
    setError("")
    const compId = comp._id || comp.id
    if (idsMias.has(compId)) {
      setMensaje("Ya formas parte de esta competición.")
      return
    }
    try {
      await api.post("/api/competiciones/unirse", { compId })
      setMensaje(`Te has unido a '${comp.nombreCompeticion}'.`)
      await recargarListas()
    } catch (err1) {
      const code = comp.codigoInvitacion
      if (code) {
        try {
          await api.post("/api/competiciones/unirse", { codigoInvitacion: code })
          setMensaje(`Te has unido a '${comp.nombreCompeticion}'.`)
          await recargarListas()
          return
        } catch (err2) {
          const msg2 = err2?.response?.data?.error
          setError(
            msg2 ||
              err2?.message ||
              "No se ha podido unir a la liga pública utilizando el código de invitación."
          )
          return
        }
      }
      const msg1 = err1?.response?.data?.error
      setError(
        msg1 ||
          err1?.message ||
          "No se ha podido unir a la liga pública. Inténtalo de nuevo más tarde."
      )
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
        sistemaPuntuacion,
      })
      let msg = data.mensaje || "Competición creada correctamente."
      if (data.codigoInvitacion) {
        msg += ` Código de invitación: ${data.codigoInvitacion}`
      }
      setMensaje(msg)
      setNombreCompeticion("")
      setTipo("publica")
      setSistemaPuntuacion("Estandar")
      await recargarListas()
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido crear la competición. Revisa los datos e inténtalo de nuevo."
      )
    }
  }

  const abandonar = async (comp) => {
    setMensaje("")
    setError("")
    try {
      const compId = comp._id || comp.id
      const data = await api.del(`/api/competiciones/${compId}/abandonar`)
      setMensaje(data.mensaje || "Has abandonado la competición correctamente.")
      await recargarListas()
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido abandonar la competición. Vuelve a intentarlo en unos segundos."
      )
    }
  }

  // ======= UI =======
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        {/* CABECERA */}
        <header className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#003087]">
            🏆 Competiciones
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona tus ligas, únete a nuevas competiciones o crea una propia.
          </p>
        </header>

        {/* MENSAJES GLOBALES */}
        {mensaje && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-xl text-sm shadow-sm">
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
            <div className="inline-flex items-center gap-3 bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-xl text-sm shadow-sm">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MIS COMPETICIONES */}
          <section className="relative bg-white shadow-md rounded-2xl p-5 border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#003087]">
                Mis competiciones
              </h3>
              <span className="inline-flex items-center justify-center text-xs font-medium bg-sky-100 text-gray-700 rounded-full px-2 py-0.5 shadow-sm">
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
              <div className="mt-4 text-gray-600 border border-dashed border-gray-300 bg-slate-50 rounded-lg p-4 text-center text-sm">
                Todavía no participas en ninguna liga. Únete a una pública o
                crea la tuya.
              </div>
            ) : (
              <ul className="mt-2 space-y-3">
                {misCompeticiones.map((c) => {
                  const compId = c._id || c.id
                  return (
                    <li
                      key={compId}
                      className="py-3 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-sm border border-sky-100"
                    >
                      <div className="w-full sm:w-auto">
                        <div className="space-x-1">
                          <strong className="text-[#003087]">
                            {c.nombreCompeticion}
                          </strong>
                          <span className="text-sm text-gray-600">
                            ({c.tipo || "publica"})
                          </span>
                        </div>
                        {c.tipo === "privada" && c.codigoInvitacion && (
                          <div className="mt-1">
                            <span className="text-xs text-sky-800 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                              Código: {c.codigoInvitacion}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                        <Link
                          to={`/dashboard/${compId}`}
                          className="text-white bg-[#003087] hover:bg-[#002062] py-1.5 px-3 rounded text-xs sm:text-sm shadow-sm"
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={() => abandonar(c)}
                          className="text-gray-800 bg-gray-200 hover:bg-gray-300 py-1.5 px-3 rounded text-xs sm:text-sm shadow-sm"
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
          <section className="relative bg-white shadow-md rounded-2xl p-5 border border-sky-100 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-[#003087] m-0">
                Unirse a competiciones públicas
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar liga…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 w-40 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                  aria-label="Buscar liga pública"
                />

                <span className="inline-flex items-center justify-center text-xs font-medium bg-sky-100 text-gray-700 rounded-full w-7 h-7 shadow-sm">
                  {publicasDisponibles.length}
                </span>
              </div>
            </div>

            {cargando ? (
              <div className="animate-pulse space-y-2 mt-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-3/5" />
              </div>
            ) : publicasFiltradas.length === 0 ? (
              <div className="mt-2 text-gray-600 border border-dashed border-gray-300 bg-slate-50 rounded-lg p-4 text-center text-sm">
                No hay ligas públicas disponibles con los filtros actuales.
              </div>
            ) : (
              <ul className="mt-2 space-y-3">
                {publicasFiltradas.map((c) => {
                  const compId = c._id || c.id
                  const yaEstoy = idsMias.has(compId)

                  return (
                    <li
                      key={compId}
                      className="py-3 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-sm border border-sky-100"
                    >
                      <div>
                        <strong className="text-[#003087]">
                          {c.nombreCompeticion}
                        </strong>{" "}
                        <span className="text-sm text-gray-600">(pública)</span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {yaEstoy ? (
                          <span className="px-3 py-1.5 rounded text-xs sm:text-sm font-semibold text-sky-900 bg-sky-200 border border-sky-300">
                            Ya estás en esta liga
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => unirsePublica(c)}
                            className="px-3 py-1.5 rounded text-xs sm:text-sm font-semibold text-white bg-[#003087] hover:bg-[#002062] shadow-sm"
                          >
                            Unirse
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Unirse por código */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-800 mb-2 text-sm">
                Unirse a liga privada por código
              </h4>
              <form
                onSubmit={unirsePrivada}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  placeholder="Código de invitación"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                  aria-label="Código de invitación"
                />
                <button
                  type="submit"
                  className="bg-[#003087] hover:bg-[#002062] text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-sm"
                >
                  Unirse
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* CREAR COMPETICIÓN */}
        <section className="bg-white shadow-md rounded-2xl p-5 mt-6 border border-sky-100">
          <h3 className="text-lg font-semibold text-[#003087] mb-2">
            Crear nueva competición
          </h3>
          <form onSubmit={crearCompeticion} className="space-y-3">
            <input
              type="text"
              placeholder="Nombre de la competición"
              value={nombreCompeticion}
              onChange={(e) => setNombreCompeticion(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
              >
                <option value="publica">Pública</option>
                <option value="privada">Privada</option>
              </select>
              <select
                value={sistemaPuntuacion}
                onChange={(e) => setSistemaPuntuacion(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
              >
                <option value="Estandar">Estándar</option>
                <option value="Goles">Goles</option>
                <option value="RendimientoComunitario">
                  Rendimiento comunitario
                </option>
                <option value="FairPlay">Fair Play</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm"
            >
              Crear competición
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Competiciones

