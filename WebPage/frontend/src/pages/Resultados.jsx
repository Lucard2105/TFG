import { useEffect, useState } from "react"
import { api } from "../services/apifetch"

function Resultados() {
  const [resultados, setResultados] = useState([])
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get("/api/resultados", { auth: false })
      .then(setResultados)
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <p className="text-center text-gray-500">Cargando resultados...</p>
  if (error) return <p className="text-center text-red-500">{error}</p>

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
        Resultados de Jornadas
      </h2>

      {resultados.length === 0 ? (
        <p className="text-center text-gray-600">No hay resultados disponibles.</p>
      ) : (
        resultados.map((r, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-[#1e3a8a] mb-2">
              Jornada {r["Numero de Jornada"]}
            </h3>
            <ul className="divide-y divide-gray-200 text-sm">
              {r.Enfrentamientos?.map((enf, j) => (
                <li
                  key={j}
                  className="py-2 grid grid-cols-3 items-center text-center border-b border-gray-100 last:border-0"
                >
                  <span className="text-left">{enf["Equipo Local"]}</span>
                  <span className="font-bold text-[#1e3a8a]">
                    {enf["Goles Local"]} - {enf["Goles Visitante"]}
                  </span>
                  <span className="text-right">{enf["Equipo Visitante"]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}

export default Resultados
