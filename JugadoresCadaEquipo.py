import json
import time
import re

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.chrome.options import Options
from pymongo import MongoClient


def scriptcargarpagina():
    driver.execute_script("""
            const element = document.querySelector('div.bg-img-1.br-header.pt20');
            if (element) {
                element.remove();
            }
        """)


def ObtenerUrlEquipos():
    Equipos = driver.find_elements(By.CSS_SELECTOR, "ul.ta-c li.ib a.block")
    ArrayUrlEquipos = []
    for i in range(len(Equipos)):
        ArrayUrlEquipos.append(Equipos[i].get_attribute("href"))
    return ArrayUrlEquipos


def ObtenerUrlPlantilla(url):
    driver.get(url)
    scriptcargarpagina()
    urlplantilla = driver.find_elements(By.CSS_SELECTOR, "div.sm-wrapper ul.section-menu li a")[1].get_attribute("href")
    return urlplantilla


def PlantillaEquipo(url):
    driver.get(url)
    scriptcargarpagina()
    Datos = driver.find_elements(By.CSS_SELECTOR, "table.table-squad tr")
    Datos2 = driver.find_elements(By.CSS_SELECTOR, "table.table-squad tr td.name a")

    href = []
    for dato in Datos2:
        href_completo = dato.get_attribute("href")
        partes = href_completo.strip("/").split("/")
        if "jugador" in partes:
            idx = partes.index("jugador")
            if len(partes) > idx + 2:
                identificador = f"{partes[idx + 1]}/{partes[idx + 2]}"
            else:
                identificador = f"{partes[idx + 1]}/{partes[idx + 1].split('-')[-1]}"
            href.append(identificador)
        else:
            href.append(None)

    Jugadores = []
    Equipo = driver.find_element(By.CSS_SELECTOR, "div.bg2.detail-header h1.title.color-white.ib")

    for i in range(2, len(Datos) - 1, 1):
        primeradivision = Datos[i].text.split("\n")
        segundadivision = primeradivision[3].split(" ")
        if segundadivision[1] == "-":
            segundadivision[1] = "0"
        diccionario = {
            "Equipo": Equipo.text,
            "Dorsal": primeradivision[0],
            "NombreCompleto": primeradivision[1],
            "NombreCorto": primeradivision[2],
            "Identificador": href[i - 1],
            "Posicion": segundadivision[0],
            "Goles": segundadivision[1],
            "Goles en contra": segundadivision[2],
            "Tarjetas rojas": segundadivision[3],
            "Dobles amarillas": segundadivision[4],
            "Amarillas": segundadivision[5],
            "Partidos como titular": segundadivision[6],
            "Partidos como suplente": segundadivision[7]
        }
        Jugadores.append(diccionario)
    return Jugadores


def imprimirbonito(l):
    for i in l:
        print(i, "\n")


def ObtenerUrlResultados(url):
    driver.get(url)
    scriptcargarpagina()
    urlresultados = driver.find_elements(By.CSS_SELECTOR, "div.sm-wrapper ul.section-menu li a")[0].get_attribute("href")
    return urlresultados


def ObtenerResultados(url):
    driver.get(url)
    scriptcargarpagina()

    ListaResultadosPorJornada = []
    ListaEventosPorPartido = []
    ListaURLsPartido = []

    jornada_actual = int(driver.find_element(
        By.CSS_SELECTOR,
        "div.main-content div.row div.col-md-6 div.ib select#select_round_competition option[selected]"
    ).text.split(" ")[1])

    while jornada_actual > 0:
        scriptcargarpagina()
        bloques = driver.find_elements(By.CSS_SELECTOR, "#list_matches > *")
        fecha_actual = ""
        enfrentamientos = []

        for bloque in bloques:
            clase = bloque.get_attribute("class")

            if clase == "bg3 color-g p5":
                if enfrentamientos:
                    ListaResultadosPorJornada.append({
                        "Fecha": fecha_actual,
                        "Numero de Jornada": jornada_actual,
                        "Enfrentamientos": enfrentamientos
                    })
                    enfrentamientos = []
                fecha_actual = bloque.text.strip()

            elif clase == "match-row p5":
                equipo_local = bloque.find_element(By.CSS_SELECTOR, "div.ib.va-m.team.ta-r").text.strip()
                resultado = bloque.find_element(By.CSS_SELECTOR, "div.ib.va-m.marker a.block")
                resultado_texto = resultado.text.strip()
                url_partido = resultado.get_attribute("href")
                equipo_visitante = bloque.find_element(By.CSS_SELECTOR, "div.ib.va-m.team.ta-l").text.strip()

                goles_local, goles_visitante = map(int, resultado_texto.split("-"))

                enfrentamientos.append({
                    "Equipo Local": equipo_local,
                    "Equipo Visitante": equipo_visitante,
                    "Goles Local": goles_local,
                    "Goles Visitante": goles_visitante
                })

                ListaURLsPartido.append(url_partido)

        if enfrentamientos:
            ListaResultadosPorJornada.append({
                "Fecha": fecha_actual,
                "Numero de Jornada": jornada_actual,
                "Enfrentamientos": enfrentamientos
            })

        if jornada_actual > 1:
            boton_anterior = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "tables_ant"))
            )
            boton_anterior.click()
            time.sleep(2)

        jornada_actual -= 1

    for url in ListaURLsPartido:
        ListaEventosPorPartido.append(ObtenerEstadisticasPartido(url))

    return ListaResultadosPorJornada, ListaEventosPorPartido


def ObtenerEstadisticasPartido(url):
    driver.get(url)
    scriptcargarpagina()
    NombrePartido = driver.find_elements(By.CSS_SELECTOR, "div.content-match.bold.mb10")[0].text
    Eventos = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event img.ib.va-m.event-ico")
    Participantes = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content")
    ResultadosParciales = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event h5.ib.va-m.name b.block.color-main2")

    href = []
    for p in Participantes:
        try:
            enlace = p.find_element(By.CSS_SELECTOR, "a").get_attribute("href")
            if enlace == "javascript:;":
                href.append(None)
            else:
                partes = enlace.strip("/").split("/")
                href.append(f"{partes[-2]}/{partes[-1]}")
        except:
            href.append(None)

    Goles = []
    Amarillas = []
    Rojas = []
    GolesEnContra = []

    for i in range(len(Eventos)):
        identificador = href[i] if href[i] is not None else Participantes[i].text.split("\n")[0]
        src = Eventos[i].get_attribute("src")
        if src in ["https://lnfs.es/media/lnfs/img_web/events/accion1.png?v1",
                   "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1"]:
            Goles.append(identificador)
        if src == "https://lnfs.es/media/lnfs/img_web/events/accion5.png?v1":
            Amarillas.append(identificador)
        if src in ["https://lnfs.es/media/lnfs/img_web/events/accion4.png?v1",
                   "https://lnfs.es/media/lnfs/img_web/events/accion3.png?v1"]:
            Rojas.append(identificador)
        if src == "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1":
            GolesEnContra.append(identificador)

    patron = r"(.+?)\s(\d+)\s*-\s*(\d+)\s(.+)"
    division = re.match(patron, NombrePartido)

    Res = [i.text for i in ResultadosParciales]
    Goles.reverse()
    Res.reverse()

    GoleadoresLocal = []
    GoleadoresVisitante = []
    cont1 = 0
    cont2 = 0
    for i in range(len(Res)):
        goleslocalactual = int(Res[i].strip("[]").split("-")[0])
        golesvisitanteactual = int(Res[i].strip("[]").split("-")[1])
        if cont1 != goleslocalactual:
            GoleadoresLocal.append(Goles[i])
            cont1 += 1
        elif cont2 != golesvisitanteactual:
            GoleadoresVisitante.append(Goles[i])
            cont2 += 1

    GoleadoresencontraLocal = []
    GoleadoresencontraVisitante = []
    for gol in GolesEnContra:
        if gol in GoleadoresLocal:
            GoleadoresencontraVisitante.append(gol)
        elif gol in GoleadoresVisitante:
            GoleadoresencontraLocal.append(gol)

    DiccionarioResultado = {
        "NombreEquipoLocal": division.group(1),
        "NombreEquipoVisitante": division.group(4),
        "GolesLocal": division.group(2),
        "GolesVisitante": division.group(3),
        "GoleadoresLocal": GoleadoresLocal,
        "GoleadoresVisitante": GoleadoresVisitante,
        "Amarillas": Amarillas,
        "Rojas": Rojas,
        "GolesEnContraLocal": GoleadoresencontraLocal,
        "GolesEnContraVisitante": GoleadoresencontraVisitante
    }

    return DiccionarioResultado


def cargardatosenjson():
    with open("Jugadores.json", "w") as archivo:
        json.dump(ListaJugadores, archivo, indent=4)
    with open("Resultados.json", "w") as archivo:
        json.dump(ListaResultados, archivo, indent=4)
    with open("Eventos.json", "w") as archivo:
        json.dump(ListaEventos, archivo, indent=4)


def cargardatosenmongodb():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["FantasyLNFS"]

    with open("Jugadores.json", "r", encoding="utf-8") as f:
        jugadores = json.load(f)
        db["Jugadores"].delete_many({})
        db["Jugadores"].insert_many(jugadores)

    with open("Resultados.json", "r", encoding="utf-8") as f:
        resultados = json.load(f)
        db["Resultados"].delete_many({})
        db["Resultados"].insert_many(resultados)

    with open("Eventos.json", "r", encoding="utf-8") as f:
        eventos = json.load(f)
        db["Eventos"].delete_many({})
        db["Eventos"].insert_many(eventos)


# ------------------- EJECUCIÓN PRINCIPAL ------------------------

page_url = "https://www.lnfs.es/competicion/primera/2025/equipos"
options = Options()
options.page_load_strategy = "eager"
driver = webdriver.Chrome(options=options)
driver.get(page_url)
scriptcargarpagina()

UrlEquipos = ObtenerUrlEquipos()
ListaJugadoresv1 = []
for i in UrlEquipos:
    UrlPLantillaCadaEquipo = ObtenerUrlPlantilla(i)
    ListaJugadoresv1.append(PlantillaEquipo(UrlPLantillaCadaEquipo))

ListaJugadores = [jug for sublista in ListaJugadoresv1 for jug in sublista]

ListaResultados, ListaEventos = ObtenerResultados(ObtenerUrlResultados(page_url))
cargardatosenjson()
cargardatosenmongodb()
driver.close()