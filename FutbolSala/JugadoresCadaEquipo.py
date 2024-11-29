import json
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
def ObtenerUrlEquipos(): #Funcion que dada la URL principal nos devuelve un array con las URL de cada uno de los equipos, PE: Pasa de esta URL https://www.lnfs.es/competicion/primera/2025/equipos a esta otra URL https://www.lnfs.es/equipo/atp-tudelano-ribera-navarra/17_25/2025/info
    Equipos = driver.find_elements(By.CSS_SELECTOR, "ul.ta-c li.ib a.block")
    ArrayUrlEquipos = []
    for i in range(len(Equipos)):
        ArrayUrlEquipos.append(Equipos[i].get_attribute("href"))
    return ArrayUrlEquipos
def ObtenerUrlPlantilla(url): #Funcion que dada una URl obtenida en el anterior metodo saca la URL de la plantilla, PE: Pasa de esta URL  https://www.lnfs.es/equipo/atp-tudelano-ribera-navarra/17_25/2025/info a esta otra URL https://www.lnfs.es/equipo/atp-tudelano-ribera-navarra/17_25/2025/plantilla
    driver.get(url)
    urlplantilla = driver.find_elements(By.CSS_SELECTOR, "div.sm-wrapper ul.section-menu li a")[1].get_attribute("href")
    return urlplantilla
def PlantillaEquipo(url): #Funcion que dada la URL con la plantilla devuelve una lista de diccionarios con cada uno de los jugadores
    driver.get(url)
    Datos = driver.find_elements(By.CSS_SELECTOR, "table.table-squad tr")
    Jugadores = []
    Equipo= driver.find_element(By.CSS_SELECTOR,"div.bg2.detail-header h1.title.color-white.ib")
    for i in range(2, len(Datos) - 1, 1):
        primeradivision = Datos[i].text.split("\n")
        segundadivision = primeradivision[3].split(" ")
        diccionario = {
            "Equipo" :Equipo.text,
            "Dorsal": primeradivision[0],
            "Nombre": primeradivision[2],
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
    urlresultados = driver.find_elements(By.CSS_SELECTOR, "div.sm-wrapper ul.section-menu li a")[0].get_attribute("href")
    return urlresultados
def ObtenerResultados(url): #Funcion que saca todos los resultados de todas las jornadas en una lista de diccionarios, ademas de
    driver.get(url)
    numerodejornadas = driver.find_element(By.CSS_SELECTOR,
                                           "div.main-content div.row div.col-md-6 div.ib select#select_round_competition option[selected]")
    jornada_actual = int(numerodejornadas.text.split(" ")[1])
    ListaResultadosPorJornada = []
    ListaURLCadaPartido=[]
    ListaEventosPorPartido=[]
    i = 1
    while (jornada_actual > i):
        boton_anterior = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "tables_ant"))
        )
        boton_anterior.click()
        time.sleep(2)
        EquipoLocal = driver.find_elements(By.CSS_SELECTOR,
                                           "div.bg-white div#list_matches div.match-row div.ib.va-m.team.ta-r")
        Resultado = driver.find_elements(By.CSS_SELECTOR,
                                         "div.bg-white div#list_matches div.match-row div.ib.va-m.marker a.block")
        EquiopoVisitante = driver.find_elements(By.CSS_SELECTOR,
                                                "div.bg-white div#list_matches div.match-row div.ib.va-m.team.ta-l")
        for j in range(len(EquipoLocal)):
            Diccionario = {
                "Numero de Jornada": jornada_actual - 1,
                "Equipo Local": EquipoLocal[j].text,
                "Resultado": Resultado[j].text,
                "Equipo Visitante": EquiopoVisitante[j].text
            }
            ListaResultadosPorJornada.append(Diccionario)
        jornada_actual = jornada_actual - 1
        for k in Resultado:
            ListaURLCadaPartido.append(k.get_attribute("href"))
    for s in ListaURLCadaPartido:
        ListaEventosPorPartido.append(ObtenerEstadisticasPartido(s))
    #print(ListaEventosPorPartido) #Resultado del 3 apartado
    return ListaResultadosPorJornada,ListaEventosPorPartido
def ObtenerEstadisticasPartido(url): #Funcion que dada una URL de un partido devuelve un Diccionario con los eventos de ese partido
    driver.get(url)
    NombrePartido = driver.find_elements(By.CSS_SELECTOR, "div.content-match.bold.mb10")[0].text
    Eventos = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event img.ib.va-m.event-ico")
    Participantes = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event h5.ib.va-m.name")
    Goles = []
    Amarillas = []
    Rojas = []
    GolesEnContra = []
    for i in range(len(Eventos)):
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion1.png?v1":
            Goles.append(Participantes[i].text.split("\n")[0])
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion5.png?v1":
            Amarillas.append(Participantes[i].text)
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion4.png?v1" or Eventos[
            i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion3.png?v1":
            Rojas.append(Participantes[i].text)
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1":
            GolesEnContra.append(Participantes[i].text.split("\n")[0])
    DiccionarioResultado = {
        "Partido": NombrePartido,
        "Goles": Goles,
        "Amarillas": Amarillas,
        "Rojas": Rojas,
        "GolesEnContra": GolesEnContra
    }
    return DiccionarioResultado
def cargardatosenjson():
    with open("Jugadores.json", "w") as archivo:
        json.dump(ListaJugadores, archivo, indent=4)
    with open("Resultados.json", "w") as archivo:
        json.dump(ListaResultados, archivo, indent=4)
    with open("Eventos.json", "w") as archivo:
        json.dump(ListaEventos, archivo, indent=4)
page_url = "https://www.lnfs.es/competicion/primera/2025/equipos"
driver = webdriver.Chrome()
driver.get(page_url)
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
driver.close()
#"Desarrollo de un Sistema de Fantasy de Fútbol Sala: Extracción de Datos, Gestión de Información y Plataforma Web"
#El trabajo desarrolla una solución integral que abarca la automatización de la recolección de datos deportivos,
#su organización en una base de datos no relacional, y la implementación de una plataforma web para gestionar competiciones
#de Fantasy en fútbol sala