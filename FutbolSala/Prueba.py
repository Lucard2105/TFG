from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import json
import time

# Configuración del navegador
options = Options()
options.page_load_strategy = "eager"
driver = webdriver.Chrome(options=options)

# URL de la jornada que quieras scrapear
numero_jornada = 1
url = f"https://www.lnfs.es/competicion/primera/2025/resultados/{numero_jornada}"
driver.get(url)
time.sleep(2)
# Elimina banner superior
driver.execute_script("""
    const element = document.querySelector('div.bg-img-1.br-header.pt20');
    if (element) {
        element.remove();
    }
""")

# Extrae todos los bloques de #list_matches
bloques = driver.find_elements(By.CSS_SELECTOR, "#list_matches > *")

fecha_actual = ""
enfrentamientos = []

for bloque in bloques:
    clase = bloque.get_attribute("class")

    if clase == "bg3 color-g p5":
        fecha_actual = bloque.text.strip()

    elif clase == "match-row p5":
        equipo_local = bloque.find_element(By.CSS_SELECTOR, "div.ib.va-m.team.ta-r").text.strip()
        resultado = bloque.find_element(By.CSS_SELECTOR, "div.ib.va-m.marker a.block").text.strip()
        equipo_visitante = bloque.find_element(By.CSS_SELECTOR, "div.ib.va-m.team.ta-l").text.strip()

        # Separar los goles del resultado
        goles_local, goles_visitante = map(int, resultado.split("-"))

        enfrentamientos.append({
            "Equipo Local": equipo_local,
            "Equipo Visitante": equipo_visitante,
            "Goles Local": goles_local,
            "Goles Visitante": goles_visitante
        })

# Construimos la estructura final
jornada_estructurada = {
    "Fecha": fecha_actual,
    "Numero de Jornada": numero_jornada,
    "Enfrentamientos": enfrentamientos
}

# Imprimir resultado
print(json.dumps(jornada_estructurada, indent=4, ensure_ascii=False))

# Cerrar navegador
driver.quit()
