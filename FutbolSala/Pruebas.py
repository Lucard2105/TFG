import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

page_url = "https://www.lnfs.es/competicion/primera/2025/resultados"
driver = webdriver.Chrome()
driver.get(page_url)
numerodejornadas=driver.find_element(By.CSS_SELECTOR, "div.main-content div.row div.col-md-6 div.ib select#select_round_competition option[selected]")
jornada_actual=int(numerodejornadas.text.split(" ")[1])
ListaResultadosPorJornada=[]
i=1
while (jornada_actual>i):
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
    #Resultado = driver.find_elements(By.CSS_SELECTOR,
                                     #"div.bg-white div#list_matches div.match-row div.ib.va-m.marker a.block")
    #for k in Resultado:
        #print(k.get_attribute("href"))
    for j in range(len(EquipoLocal)):
        Diccionario = {
            "Numero de Jornada": jornada_actual -1,
            "Equipo Local": EquipoLocal[j].text,
            "Resultado": Resultado[j].text,
            "Equipo Visitante": EquiopoVisitante[j].text
        }
        ListaResultadosPorJornada.append(Diccionario)
        print(ListaResultadosPorJornada)
    jornada_actual=jornada_actual-1
print(ListaResultadosPorJornada)
driver.close()