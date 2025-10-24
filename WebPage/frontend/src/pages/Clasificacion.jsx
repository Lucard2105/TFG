import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../services/apifetch"

function Clasificacion() {
  const { compId } = useParams()
  const [clasificacion, setClasificacion] = useState([])
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/api/competiciones/${compId}/clasificacion`)
      .then(setClasificacion)
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [compId])

  if (cargando) return <p className="text-center text-gray-500">Cargando clasificación...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>
  if (clasificacion.length === 0) return <p className="text-center text-gray-600">No hay clasificación disponible.</p>

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
        Clasificación General
      </h2>

      <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
        <thead className="bg-[#1e3a8a] text-white">
          <tr>
            <th className="py-3 px-4 text-left">#</th>
            <th className="py-3 px-4 text-left">Equipo</th>
            <th className="py-3 px-4 text-left">Usuario</th>
            <th className="py-3 px-4 text-center">Jornada</th>
            <th className="py-3 px-4 text-center">Pts Jornada</th>
            <th className="py-3 px-4 text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {clasificacion.map((c, i) => (
            <tr key={i} className="hover:bg-gray-100 border-b">
              <td className="py-2 px-4">{i + 1}</td>
              <td className="py-2 px-4 font-medium">{c.equipo}</td>
              <td className="py-2 px-4">{c.usuario}</td>
              <td className="py-2 px-4 text-center">{c.jornada}</td>
              <td className="py-2 px-4 text-center">{c.puntosJornada}</td>
              <td className="py-2 px-4 text-center font-semibold text-[#1e3a8a]">{c.puntosTotales}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Clasificacion
