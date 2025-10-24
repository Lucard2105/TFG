import { Routes, Route, Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Footer from "./components/footer"


import Jugadores from "./pages/Jugadores"
import Login from "./pages/Login"
import Registro from "./pages/Registro"
import MisEquipos from "./pages/Misequipos"
import CrearEquipo from "./pages/Crearequipo"
import PrivateRoute from "./components/Rutaprivada"
import Competiciones from "./pages/Competiciones"
import AsignarJugadores from "./pages/Asignarjugadores"
import Recuperar from "./pages/Recuperar"
import Reset from "./pages/Reset"
import Dashboard from "./pages/Dashboard"
import Clasificacion from "./pages/Clasificacion"
import JornadaPuntos from "./pages/Jornadapuntos"
import EditarCompeticion from "./pages/Editarcompeticiones"
import ProcesarJornada from "./pages/Procesarjornada"
import Eventos from "./pages/Eventos"
import Resultados from "./pages/Resultados"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"))
  const navigate = useNavigate()

  // 👇 Esta función permite que cualquier parte de la app notifique el login/logout
  useEffect(() => {
    const checkToken = () => setIsLoggedIn(!!localStorage.getItem("token"))
    checkToken()

    // Escuchar cambios globales (por ejemplo, cuando se hace login o logout en otra pestaña)
    window.addEventListener("storage", checkToken)

    // Escuchar evento personalizado de login/logout
    window.addEventListener("tokenChange", checkToken)

    return () => {
      window.removeEventListener("storage", checkToken)
      window.removeEventListener("tokenChange", checkToken)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsLoggedIn(false)
    // Emitir evento para que otros componentes también actualicen
    window.dispatchEvent(new Event("tokenChange"))
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col">
      {/* 🔹 Navbar */}
      <header className="bg-[#1e3a8a] shadow-md">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <h1 className="text-2xl font-bold text-white">
            Fantasy <span className="text-[#dc2626]">LNFS</span>
          </h1>

          <nav className="flex items-center space-x-4 text-sm font-medium text-white">
            <Link className="hover:text-[#dc2626]" to="/">Inicio</Link>
            <Link className="hover:text-[#dc2626]" to="/jugadores">Jugadores</Link>
            <Link className="hover:text-[#dc2626]" to="/competiciones">Competiciones</Link>

            {isLoggedIn && (
              <>
                <Link className="hover:text-[#dc2626]" to="/misequipos">Mis equipos</Link>
                <Link className="hover:text-[#dc2626]" to="/crearequipo">Crear equipo</Link>
              </>
            )}

            <Link className="hover:text-[#dc2626]" to="/eventos">Eventos</Link>
            <Link className="hover:text-[#dc2626]" to="/resultados">Resultados</Link>

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-1 px-3 rounded transition"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-white text-[#1e3a8a] font-semibold py-1 px-3 rounded hover:bg-gray-200 transition"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-[#dc2626] text-white font-semibold py-1 px-3 rounded hover:bg-[#b91c1c] transition"
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 🔹 Contenido principal */}
      <main className="container mx-auto px-6 py-8 flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                  Bienvenido a Fantasy LNFS
                </h2>
                <p className="text-gray-600">
                  Crea tu equipo, compite y demuestra que eres el mejor manager ⚽
                </p>
              </div>
            }
          />

          {/* Rutas públicas */}
          <Route path="/jugadores" element={<Jugadores />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/resultados" element={<Resultados />} />

          {/* Rutas protegidas */}
          <Route
            path="/competiciones"
            element={
              <PrivateRoute>
                <Competiciones />
              </PrivateRoute>
            }
          />
          <Route
            path="/misequipos"
            element={
              <PrivateRoute>
                <MisEquipos />
              </PrivateRoute>
            }
          />
          <Route
            path="/crearequipo"
            element={
              <PrivateRoute>
                <CrearEquipo />
              </PrivateRoute>
            }
          />
          <Route
            path="/equipos/:equipoId/jugadores"
            element={
              <PrivateRoute>
                <AsignarJugadores />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/:compId"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/clasificacion"
            element={
              <PrivateRoute>
                <Clasificacion />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/jornadas/:num/puntos"
            element={
              <PrivateRoute>
                <JornadaPuntos />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/editar"
            element={
              <PrivateRoute>
                <EditarCompeticion />
              </PrivateRoute>
            }
          />
          <Route
            path="/competiciones/:compId/procesar"
            element={
              <PrivateRoute>
                <ProcesarJornada />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>

      {/* 🔹 Footer */}
      <Footer />

    </div>
  )
}

export default App

