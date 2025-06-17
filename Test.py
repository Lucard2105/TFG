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
            if equipo["Equipo"] not in EquiposEnJugadores:
                EquiposEnJugadores.append(equipo["Equipo"])
        for partido in Resultados:
            for enfrentamiento in partido["Enfrentamientos"]:
                if (enfrentamiento["Equipo Local"] not in EquiposenResultados):
                    EquiposenResultados.append(enfrentamiento["Equipo Local"])
                elif (enfrentamiento["Equipo Visitante"] not in EquiposenResultados):
                    EquiposenResultados.append(enfrentamiento["Equipo Visitante"])
        self.assertEqual(sorted(EquiposEnJugadores),sorted(EquiposenResultados))
    def test_mismosnombresenJugadoresyEventos(self):
        Jugadores=self.cargardatos(self.Jugadores)
        Eventos=self.cargardatos(self.Eventos)
        NombresEnJugadores=[]
        NombresEnEventos=[]
        for equipo in Jugadores:
            if equipo["NombreCorto"] not in NombresEnJugadores:
                NombresEnJugadores.append(equipo["NombreCorto"])
        categoriasarevisar=["GoleadoresLocal", "GoleadoresVisitante","Amarillas","Rojas","GolesEnContra"]
        for partido in Eventos:
            for categoria in categoriasarevisar:
                for jugador in partido.get(categoria,[]):
                    if jugador not in NombresEnEventos:
                        NombresEnEventos.append(jugador)
        self.assertTrue(set(NombresEnEventos) <=set(NombresEnJugadores))
    #Comprobar que no existen jugadores repetidos con el NombreCompleto
    def test_mismosnombres(self):
        Jugadores=self.cargardatos(self.Jugadores)
        lista=[]
        mismonombre=False
        for jugador in Jugadores:
            if jugador["NombreCompleto"] not in lista:
                lista.append(jugador["NombreCompleto"])
            else:
                print(jugador["NombreCompleto"])
                mismonombre=True
        self.assertFalse(mismonombre)
    #Comprobar que el jugador que hace eventos pertenece a ese equipo en concreto y no a otro
    def test_jugadorperteneceaesequipo(self):
        Jugadores=self.cargardatos(self.Jugadores)
        Eventos=self.cargardatos(self.Eventos)
        DuplajugadorequipoenJugadores=[]
        DuplajugadorequipoEnEventos=[]
        for jugador in Jugadores:
            if (jugador["NombreCorto"],jugador["Equipo"]) not in DuplajugadorequipoenJugadores:
                DuplajugadorequipoenJugadores.append((jugador["NombreCorto"],jugador["Equipo"]))
        for partido in Eventos:
            for goleadoreslocal in partido["GoleadoresLocal"]:
                if (goleadoreslocal,partido["NombreEquipoLocal"]) not in DuplajugadorequipoEnEventos and goleadoreslocal not in partido["GolesEnContraVisitante"]:
                    DuplajugadorequipoEnEventos.append((goleadoreslocal,partido["NombreEquipoLocal"]))
            for goleadoresvisitante in partido["GoleadoresVisitante"]:
                if (goleadoresvisitante, partido["NombreEquipoVisitante"]) not in DuplajugadorequipoEnEventos and goleadoresvisitante not in partido["GolesEnContraLocal"]:
                    DuplajugadorequipoEnEventos.append((goleadoresvisitante, partido["NombreEquipoVisitante"]))
            for goleadoresencontralocal in partido["GolesEnContraLocal"]:
                if (goleadoresencontralocal,partido["NombreEquipoLocal"]) not in DuplajugadorequipoEnEventos:
                    DuplajugadorequipoEnEventos.append((goleadoresencontralocal,partido["NombreEquipoLocal"]))
            for goleadoresencontravisitante in partido["GolesEnContraVisitante"]:
                if (goleadoresencontravisitante,partido["NombreEquipoVisitante"]) not in DuplajugadorequipoEnEventos:
                    DuplajugadorequipoEnEventos.append((goleadoresencontravisitante,partido["NombreEquipoVisitante"]))

        for dupla in DuplajugadorequipoEnEventos:
            if dupla not in DuplajugadorequipoenJugadores:
                print(dupla)

if __name__ == "__main__":
    unittest.main()
