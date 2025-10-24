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
      const data = await api.post(`/api/competiciones/${compId}/procesar`, { numeroJornada })
      setMensaje(data.mensaje)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-6 text-center border-b-2 border-[#dc2626] pb-2">
        Procesar Jornada
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block font-medium text-gray-700">Número de jornada:</label>
        <input
          type="number"
          min="1"
          value={numeroJornada}
          onChange={(e) => setNumeroJornada(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1e3a8a] outline-none"
        />

        <button
          type="submit"
          className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-2 rounded-lg transition"
        >
          Procesar
        </button>
      </form>

      {mensaje && <p className="text-green-600 mt-4 text-center">{mensaje}</p>}
      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
    </div>
  )
}

export default ProcesarJornada
