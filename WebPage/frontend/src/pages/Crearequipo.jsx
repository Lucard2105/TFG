import { useState, useEffect } from "react"
import { api, getTokenPayload } from "../services/apifetch"

function CrearEquipo() {
  const [nombreEquipo, setNombreEquipo] = useState("")
  const [competiciones, setCompeticiones] = useState([])
  const [competicionId, setCompeticionId] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    api.get("/api/mis-competiciones")
      .then(setCompeticiones)
      .catch(err => setError(err.message))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")

    const payload = getTokenPayload()
    if (!payload?.user_id) {
      setError("Debes iniciar sesión para crear un equipo")
      return
    }

    try {
      const data = await api.post("/api/equipos", { nombreEquipo, competicionId })
      setMensaje(data.mensaje || "Equipo creado correctamente")
      setNombreEquipo("")
      setCompeticionId("")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-4 text-center">⚽ Crear Equipo</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del equipo:</label>
          <input
            type="text"
            value={nombreEquipo}
            onChange={(e) => setNombreEquipo(e.target.value)}
            required
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Competición:</label>
          <select
            value={competicionId}
            onChange={(e) => setCompeticionId(e.target.value)}
            required
            className="border border-gray-300 rounded p-2 w-full"
          >
            <option value="">-- Selecciona una competición --</option>
            {competiciones.map(c => (
              <option key={c._id} value={c._id}>
                {c.nombreCompeticion}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-2 rounded"
        >
          Crear equipo
        </button>
      </form>

      {mensaje && <p className="text-green-600 text-center mt-3">{mensaje}</p>}
      {error && <p className="text-red-600 text-center mt-3">{error}</p>}
    </div>
  )
}

export default CrearEquipo
