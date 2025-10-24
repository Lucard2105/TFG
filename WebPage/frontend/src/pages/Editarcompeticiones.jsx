import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../services/apifetch"

function EditarCompeticion() {
  const { compId } = useParams()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState("")
  const [sistema, setSistema] = useState("Estandar")
  const [jornadaInicio, setJornadaInicio] = useState(1)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/api/competiciones/${compId}`)
      .then(data => {
        setNombre(data.nombreCompeticion)
        setSistema(data.sistemaPuntuacion || "Estandar")
        setJornadaInicio(data.jornadaInicio || 1)
      })
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [compId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await api.put(`/api/competiciones/${compId}`, {
        nombreCompeticion: nombre,
        sistemaPuntuacion: sistema,
        jornadaInicio
      })
      setMensaje(data.mensaje)
      setTimeout(() => navigate(`/dashboard/${compId}`), 1500)
    } catch (err) {
      setError(err.message)
    }
  }

  if (cargando) return <p className="text-center text-gray-500">Cargando datos...</p>

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-[#1e3a8a] mb-6 text-center border-b-2 border-[#dc2626] pb-2">
        Editar Competición
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700">Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1e3a8a] outline-none"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Sistema de puntuación:</label>
          <select
            value={sistema}
            onChange={(e) => setSistema(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1e3a8a] outline-none"
          >
            <option value="Estandar">Estandar</option>
            <option value="Goles">Goles</option>
            <option value="RendimientoComunitario">Rendimiento Comunitario</option>
            <option value="FairPlay">Fair Play</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Jornada inicio:</label>
          <input
            type="number"
            min="1"
            value={jornadaInicio}
            onChange={(e) => setJornadaInicio(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1e3a8a] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#1e3a8a] hover:bg-[#132c70] text-white font-semibold py-2 rounded-lg transition"
        >
          Guardar cambios
        </button>
      </form>

      {mensaje && <p className="text-green-600 mt-4 text-center">{mensaje}</p>}
      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
    </div>
  )
}

export default EditarCompeticion

