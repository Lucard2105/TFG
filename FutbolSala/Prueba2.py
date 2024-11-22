import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

page_url = "https://www.lnfs.es/competicion/primera/2025/resultados"
driver = webdriver.Chrome()
driver.get(page_url)
Resultado = driver.find_elements(By.CSS_SELECTOR,
                                        "div.bg-white div#list_matches div.match-row div.ib.va-m.marker a.block")
match="https://www.lnfs.es/partido/servigroup-pe%C3%B1%C3%ADscola-fs/noia-portus-apostoli/59/2025"
driver.get(match)
NombrePartido= driver.find_elements(By.CSS_SELECTOR,"div.content-match.bold.mb10")[0].text
Eventos= driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event img.ib.va-m.event-ico")
Participantes= driver.find_elements(By.CSS_SELECTOR, "div.scrolltable div.event-content div.event h5.ib.va-m.name")
Goles=[]
Amarillas=[]
Rojas=[]
GolesEnContra=[]
for i in range(len(Eventos)):
    if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion1.png?v1":
        Goles.append(Participantes[i].text.split("\n")[0])
    if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion5.png?v1":
        Amarillas.append(Participantes[i].text)
    if Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion4.png?v1" or Eventos[i].get_attribute("src") == "https://lnfs.es/media/lnfs/img_web/events/accion3.png?v1":
        Rojas.append(Participantes[i].text)
    if Eventos[i].get_attribute("src")== "https://lnfs.es/media/lnfs/img_web/events/accion6.png?v1":
        GolesEnContra.append(Participantes[i].text.split("\n")[0])
DiccionarioResultado={
    "Partido": NombrePartido,
    "Goles" : Goles,
    "Amarrilas" : Amarillas,
    "Rojas": Rojas,
    "GolesEnContra": GolesEnContra
}
print(DiccionarioResultado)
driver.close()