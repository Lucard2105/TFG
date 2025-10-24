import json
from bson import json_util
from pymongo import MongoClient

MododeJuego = ["Estandar", "Goles", "RendimientoComunitario", "FairPlay"]

def puntuacionPartido(jsonMatch, MododeJuego):
    nota = 0
    claves = ["goles", "autogoles", "amarillas", "doble_amarilla", "roja_directa", "goles_equipo", "goles_encajados"]
    match MododeJuego:
        case "Estandar":
            ponderaciones = {"goles": 5, "autogoles": -3, "amarillas": -1, "doble_amarilla": -3, "roja_directa": -5, "goles_equipo": 0.2, "goles_encajados": -0.2}
        case "Goles":
            ponderaciones = {"goles": 7, "autogoles": -2, "amarillas": -0.5, "doble_amarilla": -2, "roja_directa": -4, "goles_equipo": 0.1, "goles_encajados": -0.1}
        case "RendimientoComunitario":
            ponderaciones = {"goles": 3, "autogoles": -2, "amarillas": -1, "doble_amarilla": -3, "roja_directa": -4, "goles_equipo": 1.0, "goles_encajados": -1.0}
        case "FairPlay":
            ponderaciones = {"goles": 3, "autogoles": -2, "amarillas": -3, "doble_amarilla": -6, "roja_directa": -8, "goles_equipo": 0.1, "goles_encajados": -0.1}
    for clave in claves:
        nota += ponderaciones[clave] * jsonMatch[clave]
    return int(round(nota, 0))

def conectarMongo():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        client.server_info()
        db = client["FantasyLNFS"]
        eventos = db["Eventos"]
        jugadores = db["Jugadores"]
        resultados = db["Resultados"]
        return eventos, jugadores, resultados
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None, None, None

def obtenerEstadisticas(Partido, AjugadoresLocal, AjugadoresVisitante):
    for goleador in Partido["GoleadoresLocal"]:
        if goleador in AjugadoresLocal:
            AjugadoresLocal[goleador]["Estadísticas"]["goles"] += 1
    for goleador in Partido["GoleadoresVisitante"]:
        if goleador in AjugadoresVisitante:
            AjugadoresVisitante[goleador]["Estadísticas"]["goles"] += 1
    for autogol in Partido["GolesEnContraLocal"]:
        if autogol in AjugadoresLocal:
            AjugadoresLocal[autogol]["Estadísticas"]["autogoles"] += 1
    for autogol in Partido["GolesEnContraVisitante"]:
        if autogol in AjugadoresVisitante:
            AjugadoresVisitante[autogol]["Estadísticas"]["autogoles"] += 1
    for amarilla in Partido["Amarillas"]:
        if amarilla in AjugadoresVisitante:
            AjugadoresVisitante[amarilla]["Estadísticas"]["amarillas"] += 1
        elif amarilla in AjugadoresLocal:
            AjugadoresLocal[amarilla]["Estadísticas"]["amarillas"] += 1
    for roja in Partido["Rojas"]:
        if roja in AjugadoresVisitante:
            if roja in Partido["Amarillas"]:
                AjugadoresVisitante[roja]["Estadísticas"]["doble_amarilla"] += 1
            else:
                AjugadoresVisitante[roja]["Estadísticas"]["roja_directa"] += 1
        elif roja in AjugadoresLocal:
            if roja in Partido["Amarillas"]:
                AjugadoresLocal[roja]["Estadísticas"]["doble_amarilla"] += 1
            else:
                AjugadoresLocal[roja]["Estadísticas"]["roja_directa"] += 1
    return AjugadoresLocal, AjugadoresVisitante

def CalcularPuntuacionesPartido(equipolocal, equipovisitante, MododeJuego):
    (eventos, jugadores, resultados) = conectarMongo()
    if eventos is None or jugadores is None or resultados is None:
        return {
            "error": "No se pudo conectar a la base de datos o no se encontraron las colecciones necesarias."
        }

    try:
        Partido = eventos.find_one({"NombreEquipoLocal": equipolocal, "NombreEquipoVisitante": equipovisitante})
        if not Partido:
            return {
                "error": f"No se encontró el partido entre {equipolocal} y {equipovisitante}."
            }
    except Exception as e:
        return {
            "error": f"Error al buscar el partido: {e}"
        }

    try:
        Jjugadoreslocal = jugadores.find({"Equipo": equipolocal}, {"_id": 0, "Identificador": 1})
        Jjugadoresvisitante = jugadores.find({"Equipo": equipovisitante}, {"_id": 0, "Identificador": 1})
        AjugadoresLocal = {}
        for jl in Jjugadoreslocal:
            AjugadoresLocal[jl["Identificador"]] = {
                "Estadísticas": {
                    "goles": 0,
                    "autogoles": 0,
                    "amarillas": 0,
                    "doble_amarilla": 0,
                    "roja_directa": 0,
                    "goles_equipo": int(Partido["GolesLocal"]),
                    "goles_encajados": int(Partido["GolesVisitante"])
                }
            }
        AjugadoresVisitante = {}
        for jv in Jjugadoresvisitante:
            AjugadoresVisitante[jv["Identificador"]] = {
                "Estadísticas": {
                    "goles": 0,
                    "autogoles": 0,
                    "amarillas": 0,
                    "doble_amarilla": 0,
                    "roja_directa": 0,
                    "goles_equipo": int(Partido["GolesVisitante"]),
                    "goles_encajados": int(Partido["GolesLocal"])
                }
            }

        obtenerEstadisticas(Partido, AjugadoresLocal, AjugadoresVisitante)

        if Partido["GolesLocal"] > Partido["GolesVisitante"]:
            puntos_extra_local = 3
            puntos_extra_visitante = 0
        elif Partido["GolesLocal"] < Partido["GolesVisitante"]:
            puntos_extra_local = 0
            puntos_extra_visitante = 3
        else:
            puntos_extra_local = 1
            puntos_extra_visitante = 1

        for jugador in AjugadoresLocal:
            stats = AjugadoresLocal[jugador]["Estadísticas"]
            puntos = puntuacionPartido(stats, MododeJuego) + puntos_extra_local
            AjugadoresLocal[jugador] = puntos

        for jugador in AjugadoresVisitante:
            stats = AjugadoresVisitante[jugador]["Estadísticas"]
            puntos = puntuacionPartido(stats, MododeJuego) + puntos_extra_visitante
            AjugadoresVisitante[jugador] = puntos

        puntuaciones_totales = {**AjugadoresLocal, **AjugadoresVisitante}
        return puntuaciones_totales

    except Exception as e:
        return {
            "error": f"Error al buscar los equipos: {str(e)}"
        }

# EJEMPLO DE EJECUCIÓN
PuntosTotales = CalcularPuntuacionesPartido("Noia Portus Apostoli", "Barça", "FairPlay")
print(PuntosTotales)

#NOS DEVUELVE DOS JSON CON DICCIONARIOS CLAVE VALOR ID-PUNTOS FALTA METERLO EN UNICO JSON CON EL RESTO DE DATOS DEL PARTIDO Y MODIFICAR QUIZAS PUNTUACIONES COMO SI EL EQUIPO GANA SUMAR +3 Y SI PIERDEN 0 PARA HACERLO MAS DINAMICO