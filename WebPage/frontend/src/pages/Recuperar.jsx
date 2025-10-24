import { useState } from "react"
import { api } from "../services/apifetch"

function Recuperar() {
  const [email, setEmail] = useState("")
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje(null)
    setError("")
    try {
      const data = await api.post("/api/usuarios/recuperar", { email }, { auth: false })
      setMensaje({ texto: data.mensaje, link: data.link })
      setEmail("")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md border-t-4 border-[#1e3a8a]">
        <h2 className="text-2xl font-bold text-center text-[#1e3a8a] mb-4">
          Recuperar contraseña
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Introduce tu correo y te enviaremos un enlace para restablecerla.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#1e3a8a] outline-none transition"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition"
          >
            Enviar enlace
          </button>
        </form>

        {mensaje && (
          <p className="text-green-600 text-center mt-4">
            {mensaje.texto} <br />
            <a href={mensaje.link} className="text-[#1e3a8a] hover:text-[#3b82f6]">
              Haz clic aquí para resetear tu contraseña
            </a>
          </p>
        )}
        {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      </div>
    </div>
  )
}

export default Recuperar


