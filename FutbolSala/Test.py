import unittest
import json
class Test(unittest.TestCase):
    Eventos = "Eventos.json"
    Jugadores= "Jugadores.json"
    Resultados= "Resultados.json"

    def cargardatos(self,archivo):
        with open(archivo,"r") as f:
            return json.load(f)
    def test_mismosequiposenJugadoresyResultados(self):
        Jugadores=self.cargardatos(self.Jugadores)
        Resultados=self.cargardatos(self.Resultados)
        EquiposEnJugadores=[]
        EquiposenResultados=[]
        for equipo in Jugadores:
            for jugador in equipo:
                if jugador["Equipo"] not in EquiposEnJugadores:
                    EquiposEnJugadores.append(jugador["Equipo"])
        for partido in Resultados:
            if (partido["Equipo Local"] not in EquiposenResultados):
                EquiposenResultados.append(partido["Equipo Local"])
            elif (partido["Equipo Visitante"] not in EquiposenResultados):
                EquiposenResultados.append(partido["Equipo Visitante"])
        self.assertEqual(sorted(EquiposEnJugadores),sorted(EquiposenResultados))
    def test_mismosnombresenJugadoresyEventos(self):
        Jugadores=self.cargardatos(self.Jugadores)
        Eventos=self.cargardatos(self.Eventos)
        NombresEnJugadores=[]
        NombresEnEventos=[]
        for equipo in Jugadores:
            for jugador in equipo:
                if jugador["Nombre"] not in NombresEnJugadores:
                    NombresEnJugadores.append(jugador["Nombre"])
        categoriasarevisar=["Goles","Amarillas","Rojas","GolesEnContra"]
        for partido in Eventos:
            for categoria in categoriasarevisar:
                for jugador in partido.get(categoria,[]):
                    if jugador not in NombresEnEventos:
                        NombresEnEventos.append(jugador)
        self.assertTrue(set(NombresEnEventos) <=set(NombresEnJugadores))
if __name__ == "__main__":
    unittest.main()
