from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import re
import json

driver = webdriver.Chrome()

def scriptcargarpagina():
    time.sleep(5)  # espera básica para que cargue el contenido dinámico

def ObtenerEstadisticasPartido(url):  # Función que dada una URL de un partido devuelve un Diccionario con los eventos de ese partido
    driver.get(url)
    scriptcargarpagina()
    NombrePartido = driver.find_elements(By.CSS_SELECTOR, "div.content-match.bold.mb10")[0].text
    Eventos = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event img.ib.va-m.event-ico")
    Participantes = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event h5.ib.va-m.name")
    Hrefs = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event a")

    ResultadosParciales = driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event h5.ib.va-m.name b.block.color-main2")

    Goles = []
    Amarillas = []
    Rojas = []
    GolesEnContra = []

    hrefs_limpios = []
    for href in Hrefs:
        link = href.get_attribute("href")
        if link != "javascript:;":
            hrefs_limpios.append(link.split("/")[-2] + "/" + link.split("/")[-1])
        else:
            hrefs_limpios.append(None)

    for i in range(len(Eventos)):
        identificador = hrefs_limpios[i]
        if identificador is None:
            continue  # ignorar si es entrenador o sin enlace

        if Eventos[i].get_attribute("src") in [
            "https://lnfs.es/media/lnfs/img_web/events/accion1.png?v1",
            "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1"
        ]:
            Goles.append(identificador)
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion5.png?v1":
            Amarillas.append(identificador)
        if Eventos[i].get_attribute("src") in [
            "https://lnfs.es/media/lnfs/img_web/events/accion4.png?v1",
            "https://lnfs.es/media/lnfs/img_web/events/accion3.png?v1"
        ]:
            Rojas.append(identificador)
        if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1":
            GolesEnContra.append(identificador)

    patron = r"(.+?)\s(\d*)\s*-\s*(\d*)\s*(.+)"
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
    for golencontra in GolesEnContra:
        if golencontra in GoleadoresLocal:
            GoleadoresencontraVisitante.append(golencontra)
        elif golencontra in GoleadoresVisitante:
            GoleadoresencontraLocal.append(golencontra)

    DiccionarioResultado = {
        "NombreEquipoLocal": division.group(1),
        "NombreEquipoVisitante": division.group(4),
        "GolesLocal": int(division.group(2)),
        "GolesVisitante": int(division.group(3)),
        "GoleadoresLocal": GoleadoresLocal,
        "GoleadoresVisitante": GoleadoresVisitante,
        "Amarillas": Amarillas,
        "Rojas": Rojas,
        "GolesEnContraLocal": GoleadoresencontraLocal,
        "GolesEnContraVisitante": GoleadoresencontraVisitante
    }
    return DiccionarioResultado


# Ejecutar prueba con un partido
url_partido = "https://www.lnfs.es/partido/jimbee-cartagena-costa-c%C3%A1lida/burela-fs/247/2025"
resultado = ObtenerEstadisticasPartido(url_partido)
print(json.dumps(resultado, indent=4, ensure_ascii=False))
driver.quit()

