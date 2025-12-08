import { useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../services/apifetch"

function ProcesarJornada() {
  const { compId } = useParams()
  const [numeroJornada, setNumeroJornada] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")

    try {
      const data = await api.post(`/api/competiciones/${compId}/procesar`, {
        numeroJornada,
      })

      setMensaje(data.mensaje || "Jornada procesada correctamente.")
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido procesar la jornada. Inténtalo de nuevo."
      )
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* CONTENEDOR AZUL */}
      <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">

        {/* CABECERA */}
        <h2 className="text-3xl font-extrabold text-[#003087] mb-6 text-center border-b-2 border-[#dc2626] pb-3">
          Procesar jornada
        </h2>

        {/* MENSAJES GLOBALES */}
        {mensaje && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-xl text-sm shadow-sm">
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
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-xl text-sm shadow-sm">
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

        {/* FORMULARIO (TARJETA BLANCA) */}
        <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-6 max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">

            <label className="block font-medium text-gray-700">
              Número de jornada:
            </label>

            <input
              type="number"
              min="1"
              value={numeroJornada}
              onChange={(e) => setNumeroJornada(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#003087] outline-none"
            />

            <button
              type="submit"
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-2.5 rounded-lg transition shadow-sm"
            >
              Procesar jornada
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}

export default ProcesarJornada
