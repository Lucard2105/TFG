import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../services/apifetch"

function Clasificacion() {
  const { compId } = useParams()
  const [clasificacion, setClasificacion] = useState([])
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api
      .get(`/api/competiciones/${compId}/clasificacion`)
      .then(setClasificacion)
      .catch((err) => {
        const msg = err?.response?.data?.error
        setError(
          msg ||
            "No se ha podido cargar la clasificación de esta competición. Inténtalo de nuevo."
        )
      })
      .finally(() => setCargando(false))
  }, [compId])

  if (cargando)
    return (
      <div className="flex flex-col items-center justify-center mt-10 text-gray-600">
        <div className="w-8 h-8 border-4 border-sky-300/60 border-t-sky-700 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">
          Cargando clasificación de la liga...
        </p>
      </div>
    )

  if (error)
    return (
      <p className="text-center text-red-600 font-medium mt-6 px-4">
        ⚠️ {error}
      </p>
    )

  if (clasificacion.length === 0)
    return (
      <p className="text-center text-gray-600 mt-6">
        Aún no hay jornadas procesadas en esta competición.
      </p>
    )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
        <h2 className="text-3xl font-extrabold text-[#003087] mb-4 text-center pb-3 border-b-2 border-[#dc2626]">
          Clasificación General
        </h2>

        <div className="mt-4 bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#003087] text-white">
                <tr>
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Equipo</th>
                  <th className="py-3 px-4 text-left">Usuario</th>
                  <th className="py-3 px-4 text-center">Jornada</th>
                  <th className="py-3 px-4 text-center">Pts Jornada</th>
                  <th className="py-3 px-4 text-center">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {clasificacion.map((c, i) => {
                  // color base de fila
                  const rowBgBase = "bg-slate-50 hover:bg-slate-100"

                  // barra lateral para el podio
                  let podiumBorder = "border-l-4 border-transparent"
                  if (i === 0) podiumBorder = "border-l-4 border-amber-400"
                  if (i === 1) podiumBorder = "border-l-4 border-sky-400"
                  if (i === 2) podiumBorder = "border-l-4 border-emerald-400"

                  return (
                    <tr
                      key={i}
                      className={`transition-colors ${rowBgBase} ${podiumBorder}`}
                    >
                      <td className="py-3 px-4 font-semibold">{i + 1}</td>

                      <td className="py-3 px-4 font-medium text-[#003087]">
                        {c.equipo}
                      </td>

                      <td className="py-3 px-4 text-gray-700">{c.usuario}</td>

                      <td className="py-3 px-4 text-center text-gray-600">
                        {c.jornada}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            c.puntosJornada >= 10
                              ? "bg-green-100 text-green-700"
                              : c.puntosJornada >= 3
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.puntosJornada}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-4 py-1 rounded-full bg-sky-100 text-[#003087] font-bold text-xs shadow-sm">
                          {c.puntosTotales}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Clasificacion
