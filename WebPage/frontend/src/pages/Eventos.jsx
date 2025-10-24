import { useEffect, useState } from "react"
import { api } from "../services/apifetch"

function Eventos() {
  const [eventos, setEventos] = useState([])
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get("/api/eventos", { auth: false })
      .then(setEventos)
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <p className="text-center text-gray-500">Cargando eventos...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
        Eventos Recientes
      </h2>

      {eventos.length === 0 ? (
        <p className="text-center text-gray-600">No hay eventos disponibles.</p>
      ) : (
        <div className="space-y-6">
          {eventos.map((e, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <h3 className="font-semibold text-lg text-[#1e3a8a]">
                {e.NombreEquipoLocal} {e.GolesLocal} - {e.GolesVisitante} {e.NombreEquipoVisitante}
              </h3>

              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Goleadores Local:</p>
                  <ul className="list-disc ml-5 text-gray-600">
                    {e.GoleadoresLocal?.length > 0 ? e.GoleadoresLocal.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    )) : <li>Ninguno</li>}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Goleadores Visitante:</p>
                  <ul className="list-disc ml-5 text-gray-600">
                    {e.GoleadoresVisitante?.length > 0 ? e.GoleadoresVisitante.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    )) : <li>Ninguno</li>}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Eventos
