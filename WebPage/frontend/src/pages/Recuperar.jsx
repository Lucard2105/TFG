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
      const data = await api.post(
        "/api/usuarios/recuperar",
        { email },
        { auth: false }
      )

      setMensaje({
        texto: data.mensaje || "Te hemos enviado un enlace para restablecer tu contraseña.",
        link: data.link,
      })
      setEmail("")
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido procesar la solicitud de recuperación. Revisa el correo e inténtalo de nuevo."
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="max-w-6xl w-full">
        <div className="bg-sky-50 rounded-3xl shadow-xl border border-sky-100 p-6 md:p-8">
          {/* CABECERA */}
          <header className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold text-[#003087] mb-1">
              Recuperar contraseña
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Introduce tu correo y te enviaremos un enlace para restablecerla.
            </p>
          </header>

          {/* MENSAJES GLOBALES */}
          {mensaje && (
            <div className="mb-4 flex justify-center">
              <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-xl text-sm shadow-sm text-center sm:text-left">
                <span className="text-lg">✅</span>
                <div>
                  <p>{mensaje.texto}</p>
                  {mensaje.link && (
                    <a
                      href={mensaje.link}
                      className="text-[#003087] hover:text-[#3b82f6] font-semibold underline-offset-2"
                    >
                      Haz clic aquí para resetear tu contraseña
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMensaje(null)}
                  className="self-center sm:self-auto text-xs font-semibold text-green-700 hover:text-green-900 ml-1"
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-[#003087] outline-none bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#003087] to-[#3b82f6] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition shadow-sm text-sm"
              >
                Enviar enlace
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Recuperar


