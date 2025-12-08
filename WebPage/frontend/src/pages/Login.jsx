import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { api } from "../services/apifetch"

function Login() {
  const [email, setEmail] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt")

  useEffect(() => {
    if (token) {
      navigate("/")
    }
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje("")
    setError("")
    try {
      const data = await api.post(
        "/api/usuarios/login",
        { email, contraseña },
        { auth: false }
      )
      localStorage.setItem("token", data.token)
      window.dispatchEvent(new Event("tokenChange"))
      setMensaje(data.mensaje || "Inicio de sesión correcto.")
      setTimeout(() => navigate("/"), 800)
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido iniciar sesión. Revisa tus datos e inténtalo de nuevo."
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold text-[#003087]">
              Fantasy <span className="text-[#dc2626]">LNFS</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Inicia sesión y compite como un verdadero manager ⚽
            </p>
          </header>

          {/* Mensajes globales */}
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

          {/* Card central del formulario */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-[#003087] mb-4 text-center border-b-2 border-[#dc2626] pb-2">
              Inicia sesión
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087] bg-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#003087] hover:bg-[#002062] text-white font-semibold py-2.5 rounded-lg text-sm shadow-md transition"
              >
                Entrar
              </button>
            </form>

            <div className="mt-6 space-y-2 text-center text-sm text-gray-700">
              <p>
                ¿Olvidaste tu contraseña?{" "}
                <Link
                  to="/recuperar"
                  className="text-[#003087] hover:text-[#3b82f6] font-semibold"
                >
                  Recupérala aquí
                </Link>
              </p>

              <p>
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="text-[#dc2626] hover:text-[#b91c1c] font-semibold"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
