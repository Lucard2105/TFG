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
def ObtenerUrlEquipos(): #Funcion que dada la URL principal nos devuelve un array con las URL de cada uno de los equipos, PE: Pasa de esta URL https://www.lnfs.es/competicion/primera/2025/equipos a esta otra URL https://www.lnfs.es/equipo/atp-tudelano-ribera-navarra/17_25/2025/info
    Equipos = driver.find_elements(By.CSS_SELECTOR, "ul.ta-c li.ib a.block")
    ArrayUrlEquipos = []
    for i in range(len(Equipos)):
        ArrayUrlEquipos.append(Equipos[i].get_attribute("href"))
    return ArrayUrlEquipos
def ObtenerUrlPlantilla(url): #Funcion que dada una URl obtenida en el anterior metodo saca la URL de la plantilla, PE: Pasa de esta URL  https://www.lnfs.es/equipo/atp-tudelano-ribera-navarra/17_25/2025/info a esta otra URL https://www.lnfs.es/equipo/atp-tudelano-ribera-navarra/17_25/2025/plantilla
    driver.get(url)
    scriptcargarpagina()
    urlplantilla = driver.find_elements(By.CSS_SELECTOR, "div.sm-wrapper ul.section-menu li a")[1].get_attribute("href")
    return urlplantilla
def PlantillaEquipo(url): #Funcion que dada la URL con la plantilla devuelve una lista de diccionarios con cada uno de los jugadores
    driver.get(url)
    scriptcargarpagina()
    Datos = driver.find_elements(By.CSS_SELECTOR, "table.table-squad tr")
    Jugadores = []
    Equipo= driver.find_element(By.CSS_SELECTOR,"div.bg2.detail-header h1.title.color-white.ib")
    for i in range(2, len(Datos) - 1, 1):
        primeradivision = Datos[i].text.split("\n")
        segundadivision = primeradivision[3].split(" ")
        if segundadivision[1]=="-":
            segundadivision[1]="0"
        diccionario = {
            "Equipo" :Equipo.text,
            "Dorsal": primeradivision[0],
            "NombreCompleto":primeradivision[1],
            "NombreCorto": primeradivision[2],
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
        print(i,"\n")
def ObtenerUrlResultados(url): #Funcion que dada una URl principal obtiene la URL de los resultados , PE: Pasa de esta URL  https://www.lnfs.es/competicion/primera/2025/equipos a esta otra URL https://www.lnfs.es/competicion/primera/2025/resultados
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

    # Obtener número de jornada actual
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

    # Obtener eventos de cada partido
    for url in ListaURLsPartido:
        ListaEventosPorPartido.append(ObtenerEstadisticasPartido(url))

    return ListaResultadosPorJornada, ListaEventosPorPartido

def ObtenerEstadisticasPartido(url): #Funcion que dada una URL de un partido devuelve un Diccionario con los eventos de ese partido
    driver.get(url)
    scriptcargarpagina()
    NombrePartido = driver.find_elements(By.CSS_SELECTOR, "div.content-match.bold.mb10")[0].text
    Eventos = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event img.ib.va-m.event-ico")
    Participantes = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event h5.ib.va-m.name")
    ResultadosParciales= driver.find_elements(By.CSS_SELECTOR,"div.scrolltable div.event-content div.event h5.ib.va-m.name b.block.color-main2")
    Goles = []
    Amarillas = []
    Rojas = []
    GolesEnContra = []
    for i in range(len(Eventos)):
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion1.png?v1" or Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1":
            Goles.append(Participantes[i].text.split("\n")[0])
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion5.png?v1":
            Amarillas.append(Participantes[i].text)
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion4.png?v1" or Eventos[
            i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion3.png?v1":
            Rojas.append(Participantes[i].text)
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1":
            GolesEnContra.append(Participantes[i].text.split("\n")[0])
    #Codigo para separar el nombre local,nombre visitante, goles local, goles visitante (inicio)
    patron= r"(.+?)\s(\d*)\s*-\s*(\d*)\s*(.+)"
    division=re.match(patron,NombrePartido)
    #Codigo para separar el nombre local,nombre visitante, goles local, goles visitante (fin)
    #Codigo para dividir los goles en goleadoreslocal, goleadores visitante (inicio)
    Res=[]
    for i in ResultadosParciales:
        Res.append(i.text)
    Goles.reverse()
    Res.reverse()
    GoleadoresLocal=[]
    GoleadoresVisitante=[]
    cont1=0
    cont2=0
    for i in range(len(Res)):
        goleslocalactual = int(Res[i].strip("[]").split("-")[0])
        golesvisitanteactual = int(Res[i].strip("[]").split("-")[1])
        if cont1 != goleslocalactual:
            GoleadoresLocal.append(Goles[i])
            cont1 = cont1 + 1
        elif cont2 != golesvisitanteactual:
            GoleadoresVisitante.append(Goles[i])
            cont2 = cont2 + 1
    # Codigo para dividir los goles en goleadoreslocal, goleadores visitante (fin)
    #Codigo para dividr los golesencontra en goleadoresencontralocal,goleadoresencontravisitante(inicio)
    GoleadoresencontraLocal=[]
    GoleadoresencontraVisitante=[]
    if len(GolesEnContra)!=0:
        for golencontra in GolesEnContra:
            if golencontra in GoleadoresLocal:
                GoleadoresencontraVisitante.append(golencontra)
            elif golencontra in GoleadoresVisitante:
                GoleadoresencontraLocal.append(golencontra)
    #Codigo para dividr los golesencontra en goleadoresencontralocal,goleadoresencontravisitante(fin)
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

from pymongo import MongoClient
import json

def cargardatosenmongodb():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["FantasyLNFS"]

    # Jugadores
    with open("Jugadores.json", "r", encoding="utf-8") as f:
        jugadores = json.load(f)
        db["Jugadores"].delete_many({})
        db["Jugadores"].insert_many(jugadores)

    # Resultados
    with open("Resultados.json", "r", encoding="utf-8") as f:
        resultados = json.load(f)
        db["Resultados"].delete_many({})
        db["Resultados"].insert_many(resultados)

    # Eventos
    with open("Eventos.json", "r", encoding="utf-8") as f:
        eventos = json.load(f)
        db["Eventos"].delete_many({})
        db["Eventos"].insert_many(eventos)

page_url = "https://www.lnfs.es/competicion/primera/2025/equipos"
options=Options()
options.page_load_strategy = "eager"
driver = webdriver.Chrome(options=options)
driver.get(page_url)
scriptcargarpagina()
UrlEquipos=ObtenerUrlEquipos()
ListaJugadoresv1=[]
for i in UrlEquipos:
    UrlPLantillaCadaEquipo=ObtenerUrlPlantilla(i)
    ListaJugadoresv1.append(PlantillaEquipo(UrlPLantillaCadaEquipo))
ListaJugadores=[]
for sublista in ListaJugadoresv1:
    for diccionario in sublista:
        ListaJugadores.append(diccionario)
ListaResultados, ListaEventos = ObtenerResultados(ObtenerUrlResultados(page_url))
cargardatosenjson()
cargardatosenmongodb()
driver.close()