import { useEffect, useState } from "react"
import { api } from "../services/apifetch"
import { getTokenPayload } from "../services/apifetch"
import { Link } from "react-router-dom"

function MisEquipos() {
  const [equipos, setEquipos] = useState([])
  const [error, setError] = useState("")
  const [abiertos, setAbiertos] = useState({})
  const payload = getTokenPayload()
  const userId = payload?.user_id

  useEffect(() => {
    if (!userId) return
    api.get(`/api/usuarios/${userId}/equipos`)
      .then(setEquipos)
      .catch(err => setError(err.message))
  }, [userId])

  const toggleEquipo = (equipoId) => {
    setAbiertos(prev => ({ ...prev, [equipoId]: !prev[equipoId] }))
  }

  if (error) return <p className="text-red-600 text-center">{error}</p>

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-md rounded-xl p-6">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center">📋 Mis Equipos</h2>

      {equipos.length === 0 ? (
        <p className="text-center text-gray-600">No tienes equipos creados.</p>
      ) : (
        <ul className="space-y-4">
          {equipos.map(e => (
            <li
              key={e.equipoId}
              className="border border-gray-200 rounded-lg shadow-sm p-4 bg-gray-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <strong className="text-lg text-[#1e3a8a]">{e.nombreEquipo}</strong>
                <button
                  onClick={() => toggleEquipo(e.equipoId)}
                  className="mt-2 sm:mt-0 bg-[#1e3a8a] hover:bg-[#2e4fa8] text-white text-sm py-1 px-3 rounded transition"
                >
                  {abiertos[e.equipoId] ? "Ocultar jugadores" : "Ver jugadores"}
                </button>
              </div>

              {abiertos[e.equipoId] && e.jugadores && (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-sm bg-white rounded-lg">
                    <thead className="bg-[#1e3a8a] text-white">
                      <tr>
                        <th className="py-2 px-4 text-left">Jugador</th>
                        <th className="py-2 px-4 text-left">Posición</th>
                        <th className="py-2 px-4 text-left">Equipo Real</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.jugadores.map((j, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="py-2 px-4">{j.nombre}</td>
                          <td className="py-2 px-4">{j.posicion}</td>
                          <td className="py-2 px-4">{j.equipoReal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-3 text-right">
                <Link
                  to={`/equipos/${e.equipoId}/jugadores`}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm py-1.5 px-4 rounded transition"
                >
                  Editar equipo
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MisEquipos

