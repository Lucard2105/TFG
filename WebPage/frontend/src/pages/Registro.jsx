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

      setMensaje(data.mensaje || "Usuario registrado correctamente ✅")
      setNombre("")
      setEmail("")
      setContraseña("")
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido completar el registro. Revisa los datos e inténtalo de nuevo."
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="max-w-6xl w-full">
        <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
          {/* CABECERA */}
          <header className="mb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#003087] mb-1">
              Crea tu cuenta
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Únete al Fantasy LNFS y demuestra tu talento como manager ⚽
            </p>
          </header>

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

          {/* TARJETA FORMULARIO */}
          <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-6 md:p-8 max-w-md mx-auto">
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
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-[#003087] outline-none transition bg-white"
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
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-[#003087] outline-none transition bg-white"
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
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-[#003087] outline-none transition bg-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#003087] to-[#3b82f6] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition shadow-sm text-sm"
              >
                Registrarse
              </button>
            </form>

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
      </div>
    </div>
  )
}

export default Registro
