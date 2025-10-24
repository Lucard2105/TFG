import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../services/apifetch"

function JornadaPuntos() {
  const { compId, num } = useParams()
  const [data, setData] = useState([])
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/api/competiciones/${compId}/jornadas/${num}/puntos`)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [compId, num])

  if (cargando) return <p className="text-center text-gray-500">Cargando jornada {num}...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
        Jornada {num} — Clasificación
      </h2>

      {data.map((equipo, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-[#1e3a8a]">
            {equipo.usuario} ({equipo.equipo})
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Puntos jornada: <b>{equipo.puntosJornada}</b> — Total:{" "}
            <b>{equipo.puntosTotales}</b>
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm bg-white rounded-lg">
              <thead className="bg-[#1e3a8a] text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Jugador</th>
                  <th className="py-2 px-4 text-left">Posición</th>
                  <th className="py-2 px-4 text-center">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {equipo.jugadores?.map((j, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{j.jugador}</td>
                    <td className="py-2 px-4">{j.posicion}</td>
                    <td className="py-2 px-4 text-center font-semibold text-[#1e3a8a]">{j.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

export default JornadaPuntos

