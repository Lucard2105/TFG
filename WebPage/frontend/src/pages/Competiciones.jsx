import { useEffect, useState } from "react"
import { api } from "../services/apifetch"
import { Link } from "react-router-dom"

function Competiciones() {
  const [competiciones, setCompeticiones] = useState([])
  const [codigo, setCodigo] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [nombreCompeticion, setNombreCompeticion] = useState("")
  const [tipo, setTipo] = useState("publica")
  const [sistemaPuntuacion, setSistemaPuntuacion] = useState("Estandar")

  useEffect(() => {
    api.get("/api/mis-competiciones")
      .then(setCompeticiones)
      .catch(err => setError(err.message))
  }, [])

  const unirsePrivada = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")
    try {
      const data = await api.post("/api/competiciones/unirse", { codigoInvitacion: codigo })
      setMensaje(data.mensaje)
      setCodigo("")
      const comps = await api.get("/api/mis-competiciones")
      setCompeticiones(comps)
    } catch (err) {
      setError(err.message)
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
      setMensaje(data.mensaje)
      if (data.codigoInvitacion) {
        setMensaje(prev => prev + ` | Código invitación: ${data.codigoInvitacion}`)
      }
      const comps = await api.get("/api/mis-competiciones")
      setCompeticiones(comps)
      setNombreCompeticion("")
      setTipo("publica")
      setSistemaPuntuacion("Estandar")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center">
        🏆 Competiciones Disponibles
      </h2>

      {error && <p className="text-red-600 text-center">{error}</p>}
      {mensaje && <p className="text-green-600 text-center">{mensaje}</p>}

      <ul className="divide-y divide-gray-200 my-6">
        {competiciones.map(c => (
          <li key={c._id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <strong className="text-[#1e3a8a]">{c.nombreCompeticion}</strong>{" "}
              <span className="text-sm text-gray-600">({c.tipo})</span>
              {c.tipo === "privada" && c.codigoInvitacion && (
                <span className="ml-3 text-sm text-blue-500">
                  Código: {c.codigoInvitacion}
                </span>
              )}
            </div>

            <div className="space-x-2 mt-2 sm:mt-0">
              <Link
                to={`/dashboard/${c._id}`}
                className="text-white bg-[#1e3a8a] hover:bg-[#2e4fa8] py-1 px-3 rounded text-sm"
              >
                Dashboard
              </Link>
              <Link
                to={`/competiciones/${c._id}/clasificacion`}
                className="text-white bg-[#dc2626] hover:bg-[#b91c1c] py-1 px-3 rounded text-sm"
              >
                Clasificación
              </Link>
              {c.tipo === "publica" && (
                <button
                  onClick={async () => {
                    try {
                      const data = await api.post("/api/competiciones/unirse", { codigoInvitacion: c.codigoInvitacion })
                      setMensaje(data.mensaje)
                    } catch (err) {
                      setError(err.message)
                    }
                  }}
                  className="text-white bg-green-600 hover:bg-green-700 py-1 px-3 rounded text-sm"
                >
                  Unirme
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    const data = await api.del(`/api/competiciones/${c._id}/abandonar`)
                    setMensaje(data.mensaje)
                    setCompeticiones(prev => prev.filter(x => x._id !== c._id))
                  } catch (err) {
                    setError(err.message)
                  }
                }}
                className="text-gray-700 bg-gray-200 hover:bg-gray-300 py-1 px-3 rounded text-sm"
              >
                Abandonar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t pt-4 mt-6">
        <h3 className="text-lg font-semibold text-[#1e3a8a] mb-2">Unirse a Liga Privada</h3>
        <form onSubmit={unirsePrivada} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Código de invitación"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="border border-gray-300 rounded p-2 flex-1"
          />
          <button
            type="submit"
            className="bg-[#1e3a8a] hover:bg-[#2e4fa8] text-white font-semibold py-2 px-4 rounded"
          >
            Unirse
          </button>
        </form>
      </div>

      <div className="border-t pt-4 mt-6">
        <h3 className="text-lg font-semibold text-[#1e3a8a] mb-2">Crear Nueva Competición</h3>
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
      </div>
    </div>
  )
}

export default Competiciones


