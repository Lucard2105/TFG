import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { api } from "../services/apifetch"
import { getTokenPayload } from "../services/apifetch"

function Dashboard() {
  const { compId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)
  const [jornadas, setJornadas] = useState([])
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null)
  const [puntosJornadaSeleccionada, setPuntosJornadaSeleccionada] = useState([])
  const [detallesAbiertos, setDetallesAbiertos] = useState({})
  const payload = getTokenPayload()

  useEffect(() => {
    api.get(`/api/dashboard/${compId}`)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))

    api.get(`/api/competiciones/${compId}/jornadas`)
      .then(setJornadas)
      .catch(err => console.error(err))
  }, [compId])

  const handleSeleccionJornada = async (num) => {
    setJornadaSeleccionada(num)
    setPuntosJornadaSeleccionada([])
    setDetallesAbiertos({})
    try {
      const data = await api.get(`/api/competiciones/${compId}/jornadas/${num}/puntos`)
      setPuntosJornadaSeleccionada(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleDetalle = (equipo) => {
    setDetallesAbiertos(prev => ({ ...prev, [equipo]: !prev[equipo] }))
  }

  if (cargando) return <p className="text-center text-gray-500">Cargando...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>
  if (!data) return <p className="text-center text-gray-600">No hay datos disponibles</p>

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-[#1e3a8a] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
        Dashboard de la Competición
      </h2>

      <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6">
        <h3 className="font-semibold text-[#1e3a8a] text-lg mb-2">Mi equipo</h3>
        {data.equipoActual ? (
          <p className="text-gray-700">
            {data.equipoActual.nombreEquipo} — {data.equipoActual.jugadoresSeleccionados.length} jugadores
          </p>
        ) : (
          <p className="text-gray-600">No tienes equipo en esta competición.</p>
        )}
      </div>

      <div className="mb-8 text-center">
        <h3 className="font-semibold text-[#1e3a8a] text-lg mb-2">Ranking general</h3>
        <div className="overflow-x-auto">
          <table className="mx-auto min-w-[80%] border border-gray-300 text-sm bg-white rounded-lg">
            <thead className="bg-[#1e3a8a] text-white">
              <tr>
                <th className="py-2 px-4 text-left">#</th>
                <th className="py-2 px-4 text-left">Usuario</th>
                <th className="py-2 px-4 text-left">Equipo</th>
                <th className="py-2 px-4 text-center">Puntos Totales</th>
              </tr>
            </thead>
            <tbody>
              {data.rankingLiga.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 border-b">
                  <td className="py-2 px-4">{i + 1}</td>
                  <td className="py-2 px-4">{r.usuario}</td>
                  <td className="py-2 px-4">{r.equipo}</td>
                  <td className="py-2 px-4 text-center font-semibold text-[#1e3a8a]">{r.puntosTotales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="text-center font-semibold text-[#1e3a8a] text-lg mb-4">Consultar puntos por jornada</h3>
      {jornadas.length > 0 ? (
        <>
          <div className="text-center mb-4">
            <select
              value={jornadaSeleccionada || ""}
              onChange={(e) => handleSeleccionJornada(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#1e3a8a] outline-none"
            >
              <option value="">Selecciona una jornada</option>
              {jornadas.map((j) => (
                <option key={j} value={j}>Jornada {j}</option>
              ))}
            </select>
          </div>

          {jornadaSeleccionada && puntosJornadaSeleccionada.length > 0 && (
            <div className="overflow-x-auto">
              <table className="mx-auto min-w-[80%] border border-gray-300 text-sm bg-white rounded-lg">
                <thead className="bg-[#1e3a8a] text-white">
                  <tr>
                    <th className="py-2 px-4">#</th>
                    <th className="py-2 px-4 text-left">Equipo</th>
                    <th className="py-2 px-4 text-left">Usuario</th>
                    <th className="py-2 px-4 text-center">Pts Jornada</th>
                    <th className="py-2 px-4 text-center">Total</th>
                    <th className="py-2 px-4 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {puntosJornadaSeleccionada.map((r, i) => (
                    <>
                      <tr key={i} className="hover:bg-gray-50 border-b">
                        <td className="py-2 px-4">{i + 1}</td>
                        <td className="py-2 px-4">{r.equipo}</td>
                        <td className="py-2 px-4">{r.usuario}</td>
                        <td className="py-2 px-4 text-center">{r.puntosJornada}</td>
                        <td className="py-2 px-4 text-center font-semibold text-[#1e3a8a]">{r.puntosTotales}</td>
                        <td className="text-center">
                          <button
                            onClick={() => toggleDetalle(r.equipo)}
                            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs py-1 px-3 rounded transition"
                          >
                            {detallesAbiertos[r.equipo] ? "Ocultar" : "Ver"}
                          </button>
                        </td>
                      </tr>

                      {detallesAbiertos[r.equipo] && r.jugadores && r.jugadores.length > 0 && (
                        <tr>
                          <td colSpan="6" className="bg-gray-50 p-2">
                            <table className="w-full text-xs border border-gray-200 rounded-lg">
                              <thead className="bg-[#1e3a8a] text-white">
                                <tr>
                                  <th className="py-1 px-2">Jugador</th>
                                  <th className="py-1 px-2">Posición</th>
                                  <th className="py-1 px-2">Puntos</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.jugadores.map((j, idx) => (
                                  <tr key={idx} className="border-t hover:bg-gray-100">
                                    <td className="py-1 px-2">{j.jugador}</td>
                                    <td className="py-1 px-2">{j.posicion}</td>
                                    <td className="py-1 px-2 text-center">{j.puntos}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500">No hay jornadas procesadas aún.</p>
      )}

      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <Link to={`/competiciones/${compId}/editar`}>
          <button className="bg-[#1e3a8a] hover:bg-[#132c70] text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Editar Competición
          </button>
        </Link>
        <Link to={`/competiciones/${compId}/procesar`}>
          <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Procesar Jornada
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard


