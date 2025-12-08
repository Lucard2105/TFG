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

      setMensaje(
        data.mensaje || "Tu contraseña se ha actualizado correctamente ✅"
      )
      setNueva("")
    } catch (err) {
      const msg = err?.response?.data?.error
      setError(
        msg ||
          err?.message ||
          "No se ha podido restablecer la contraseña. Inténtalo de nuevo."
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
              Restablecer contraseña
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Introduce tu nueva contraseña para completar el proceso.
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

          {/* TARJETA FORMULARIO / AVISO TOKEN */}
          <div className="bg-white rounded-2xl shadow-md border border-sky-100 p-6 md:p-8 max-w-md mx-auto">
            {!token ? (
              <p className="text-center text-sm text-red-700">
                ⚠️ Falta el token en la URL. Revisa el enlace de recuperación
                que has recibido o solicita uno nuevo.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Introduce la nueva contraseña"
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-[#003087] outline-none transition bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#003087] to-[#3b82f6] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition shadow-sm text-sm"
                >
                  Cambiar contraseña
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reset
