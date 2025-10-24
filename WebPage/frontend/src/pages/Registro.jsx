import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/apifetch"

function Registro() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")
    try {
      const data = await api.post(
        "/api/usuarios/registro",
        { nombre, email, contraseña },
        { auth: false }
      )
      setMensaje(data.mensaje || "Usuario registrado correctamente")
      setNombre("")
      setEmail("")
      setContraseña("")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md border-t-4 border-[#1e3a8a]">
        <h1 className="text-3xl font-extrabold text-center text-[#1e3a8a] mb-2">
          Crea tu cuenta
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Únete al Fantasy LNFS y demuestra tu talento ⚽
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#1e3a8a] outline-none transition"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#1e3a8a] outline-none transition"
              placeholder="ejemplo@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-[#1e3a8a] outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition"
          >
            Registrarse
          </button>
        </form>

        {mensaje && <p className="text-green-600 text-center mt-4">{mensaje}</p>}
        {error && <p className="text-red-600 text-center mt-4">{error}</p>}

        <p className="text-center text-sm mt-6 text-gray-700">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="text-[#dc2626] hover:text-[#b91c1c] font-semibold"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Registro
