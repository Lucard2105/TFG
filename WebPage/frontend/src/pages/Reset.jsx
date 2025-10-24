import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { api } from "../services/apifetch"

function Reset() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [nueva, setNueva] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")
    try {
      const data = await api.post(
        "/api/usuarios/reset",
        { token, nuevaContraseña: nueva },
        { auth: false }
      )
      setMensaje(data.mensaje)
      setNueva("")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md border-t-4 border-[#1e3a8a]">
        <h2 className="text-2xl font-bold text-center text-[#1e3a8a] mb-4">
          Restablecer contraseña
        </h2>

        {!token ? (
          <p className="text-red-600 text-center">Falta el token en la URL.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#1e3a8a] outline-none transition"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition"
            >
              Cambiar contraseña
            </button>
          </form>
        )}

        {mensaje && <p className="text-green-600 text-center mt-4">{mensaje}</p>}
        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      </div>
    </div>
  )
}

export default Reset
