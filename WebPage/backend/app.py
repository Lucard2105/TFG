from flask import Flask, jsonify, request, g
from pymongo import MongoClient
from bson import ObjectId
from SistemaPuntuacion import CalcularPuntuacionesPartido
import os
import bcrypt
import jwt
import datetime
import random, string
from functools import wraps

app = Flask(__name__)
# --- Clave secreta para firmar los JWT ---
SECRET_KEY = "clave_supersecreta_para_tfg"

# --- Conexión a MongoDB ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)

# BD jugadores reales (ya existente)
db = client["FantasyLNFS"]

# BD nueva para el sistema fantasy
db_system = client["FantasySystem"]

# --- Función para convertir _id ---
def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# --- Decorador para rutas protegidas ---
def login_requerido(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            return jsonify({"error": "Token requerido"}), 401
        try:
            token = auth_header.split(" ")[1]
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.user_id = data["user_id"]
        except Exception:
            return jsonify({"error": "Token inválido o caducado"}), 401
        return f(*args, **kwargs)
    return wrapper


# ============================
# ENDPOINTS NUEVOS: FantasySystem
# ============================

# --- USUARIOS ---
@app.route('/api/usuarios', methods=['GET'])
def get_usuarios():
    usuarios = list(db_system.Usuarios.find())
    return jsonify([serialize_doc(u) for u in usuarios])

@app.route('/api/usuarios', methods=['POST'])
def add_usuario():
    data = request.json
    result = db_system.Usuarios.insert_one(data)
    return jsonify({"inserted_id": str(result.inserted_id)}), 201

# -------- REGISTRO DE USUARIO --------
@app.route('/api/usuarios/registro', methods=['POST'])
def registrar_usuario():
    data = request.json
    nombre = data.get('nombre')
    email = data.get('email')
    contraseña = data.get('contraseña')

    if not nombre or not email or not contraseña:
        return jsonify({"error": "Faltan campos obligatorios"}), 400

    if db_system.Usuarios.find_one({"email": email}):
        return jsonify({"error": "El email ya está registrado"}), 400

    hashed = bcrypt.hashpw(contraseña.encode('utf-8'), bcrypt.gensalt())

    nuevo_usuario = {
        "nombre": nombre,
        "email": email,
        "contraseñaHash": hashed.decode('utf-8')
    }

    db_system.Usuarios.insert_one(nuevo_usuario)

    return jsonify({"mensaje": "Usuario registrado correctamente"}), 201

# -------- LOGIN DE USUARIO --------
@app.route('/api/usuarios/login', methods=['POST'])
def login_usuario():
    data = request.json
    email = data.get('email')
    contraseña = data.get('contraseña')

    if not email or not contraseña:
        return jsonify({"error": "Faltan campos"}), 400

    usuario = db_system.Usuarios.find_one({"email": email})
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if not bcrypt.checkpw(contraseña.encode('utf-8'), usuario['contraseñaHash'].encode('utf-8')):
        return jsonify({"error": "Contraseña incorrecta"}), 401

    token = jwt.encode({
        "user_id": str(usuario["_id"]),
        "nombre": usuario["nombre"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({"mensaje": f"Login correcto. Bienvenido {usuario['nombre']}!", "token": token})

import smtplib
from email.mime.text import MIMEText

# -------- RECUPERAR CONTRASEÑA --------
@app.route('/api/usuarios/recuperar', methods=['POST'])
def recuperar_contraseña():
    data = request.json
    email = data.get("email")

    usuario = db_system.Usuarios.find_one({"email": email})
    if not usuario:
        return jsonify({"error": "Email no encontrado"}), 404

    # Generar token temporal
    token_reset = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    expira = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)

    db_system.Usuarios.update_one(
        {"_id": usuario["_id"]},
        {"$set": {"resetToken": token_reset, "resetExpira": expira}}
    )

    # Simulación: devolver link en JSON (en producción enviar email)
    link = f"http://localhost:5173/reset?token={token_reset}"
    return jsonify({
    "mensaje": "Se ha enviado un correo con instrucciones",
    "link": link
    }), 200


# -------- RESET DE CONTRASEÑA --------
@app.route('/api/usuarios/reset', methods=['POST'])
def reset_contraseña():
    data = request.json
    token = data.get("token")
    nueva = data.get("nuevaContraseña")

    if not token or not nueva:
        return jsonify({"error": "Faltan campos"}), 400

    usuario = db_system.Usuarios.find_one({"resetToken": token})
    if not usuario:
        return jsonify({"error": "Token inválido"}), 400

    if usuario.get("resetExpira") < datetime.datetime.utcnow():
        return jsonify({"error": "Token caducado"}), 400

    hashed = bcrypt.hashpw(nueva.encode('utf-8'), bcrypt.gensalt())
    db_system.Usuarios.update_one(
        {"_id": usuario["_id"]},
        {"$set": {"contraseñaHash": hashed.decode('utf-8')}, "$unset": {"resetToken": "", "resetExpira": ""}}
    )

    return jsonify({"mensaje": "Contraseña actualizada correctamente"}), 200
@app.route('/api/competiciones/<comp_id>/abandonar', methods=['DELETE'])
@login_requerido
def abandonar_competicion(comp_id):
    try:
        oid = ObjectId(comp_id)
    except Exception:
        return jsonify({"error": "ID de competición inválido"}), 400

    comp = db_system.Competiciones.find_one({"_id": oid})
    if not comp:
        return jsonify({"error": "Competición no encontrada"}), 404

    participantes = [str(p) for p in comp.get("participantes", [])]
    if str(g.user_id) not in participantes:
        return jsonify({"error": "No formas parte de esta competición"}), 400

    # Elimina si estuviera guardado como string u ObjectId (compatibilidad)
    pull_vals = [str(g.user_id)]
    try:
        pull_vals.append(ObjectId(g.user_id))
    except Exception:
        pass

    db_system.Competiciones.update_one(
        {"_id": oid},
        {"$pull": {"participantes": {"$in": pull_vals}}}
    )

    # Mantengo tu limpieza de clasificaciones
    equipos_usuario = list(db_system.EquiposFantasy.find({"usuarioId": g.user_id}))
    for equipo in equipos_usuario:
        db_system.Clasificaciones.delete_many({
            "competicionId": str(comp["_id"]),
            "equipoId": str(equipo["_id"])
        })

    return jsonify({"mensaje": f"Has abandonado la competición '{comp['nombreCompeticion']}'"}), 200

@app.route('/api/usuarios/<user_id>/equipos', methods=['GET'])
@login_requerido
def get_equipos_usuario(user_id):
    equipos = list(db_system.EquiposFantasy.find({"usuarioId": user_id}))
    salida = []

    for e in equipos:
        jugadores_ids = e.get("jugadoresSeleccionados", [])

        # Buscar los jugadores en la colección principal por Identificador
        jugadores_docs = list(db.Jugadores.find({"Identificador": {"$in": jugadores_ids}}))
        jugadores_info = []

        for j in jugadores_docs:
            jugadores_info.append({
                # 🔹 Usamos el campo correcto para el nombre completo
                "nombre": j.get("NombreCompleto") or j.get("NombreCorto") or j.get("Identificador"),
                "posicion": j.get("Posicion", "—"),
                "equipoReal": j.get("Equipo", "—")
            })

        # En caso de que no haya coincidencias (por algún desajuste)
        if not jugadores_info and jugadores_ids:
            jugadores_info = [{"nombre": jid, "posicion": "—", "equipoReal": "—"} for jid in jugadores_ids]

        salida.append({
            "equipoId": str(e["_id"]),
            "nombreEquipo": e.get("nombreEquipo", "Sin nombre"),
            "jugadores": jugadores_info
        })

    return jsonify(salida), 200


# --- EQUIPOS FANTASY ---
@app.route('/api/equipos', methods=['GET'])
def get_equipos():
    equipos = list(db_system.EquiposFantasy.find())
    return jsonify([serialize_doc(e) for e in equipos])

@app.route('/api/equipos', methods=['POST'])
@login_requerido
def crear_equipo():
    data = request.json
    nombre_equipo = data.get("nombreEquipo")
    comp_id = data.get("competicionId")

    if not nombre_equipo or not comp_id:
        return jsonify({"error": "Faltan campos"}), 400

    # Validar que la competición existe
    comp = db_system.Competiciones.find_one({"_id": ObjectId(comp_id)})
    if not comp:
        return jsonify({"error": "Competición no encontrada"}), 404

    # Validar que el usuario pertenece a la competición
    if g.user_id not in comp.get("participantes", []):
        return jsonify({"error": "No perteneces a esta competición"}), 403

    # Comprobar si ya tiene equipo en esa competición
    existente = db_system.EquiposFantasy.find_one({"usuarioId": g.user_id, "competicionId": comp_id})
    if existente:
        return jsonify({"error": "Ya tienes un equipo en esta competición"}), 400

    equipo = {
        "nombreEquipo": nombre_equipo,
        "usuarioId": g.user_id,
        "competicionId": comp_id,
        "jugadoresSeleccionados": []
    }

    result = db_system.EquiposFantasy.insert_one(equipo)
    return jsonify({"mensaje": "Equipo creado", "equipoId": str(result.inserted_id)}), 201

@app.route('/api/equipos/<id>', methods=['GET'])
@login_requerido
def get_equipo(id):
    from bson import ObjectId

    try:
        oid = ObjectId(id)
    except Exception:
        return jsonify({"error": "ID de equipo inválido"}), 400

    equipo = db_system.EquiposFantasy.find_one({"_id": oid})
    if not equipo:
        return jsonify({"error": "Equipo no encontrado"}), 404

    # Solo el dueño del equipo puede verlo / editarlo
    if equipo.get("usuarioId") != g.user_id:
        return jsonify({"error": "No puedes ver un equipo que no es tuyo"}), 403

    return jsonify({
        "_id": str(equipo["_id"]),
        "nombreEquipo": equipo.get("nombreEquipo", "Sin nombre"),
        "competicionId": equipo.get("competicionId"),
        "jugadoresSeleccionados": equipo.get("jugadoresSeleccionados", []),
    }), 200


@app.route('/api/equipos/<id>/jugadores', methods=['PUT'])
@login_requerido
def asignar_jugadores(id):
    data = request.json
    jugadores = data.get("jugadores")

    if not isinstance(jugadores, list):
        return jsonify({"error": "El campo 'jugadores' debe ser una lista de IDs"}), 400

    # Verificar que el equipo pertenece al usuario logueado
    equipo = db_system.EquiposFantasy.find_one({"_id": ObjectId(id)})
    if not equipo:
        return jsonify({"error": "Equipo no encontrado"}), 404
    if equipo["usuarioId"] != g.user_id:
        return jsonify({"error": "No puedes modificar un equipo que no es tuyo"}), 403

    # Buscar jugadores seleccionados en la colección Jugadores usando Identificador
    jugadores_docs = list(db.Jugadores.find({"Identificador": {"$in": jugadores}}))

    if len(jugadores_docs) != len(jugadores):
        return jsonify({
            "error": "Alguno de los jugadores no existe en la base de datos",
            "recibidos": jugadores,
            "encontrados": [j["Identificador"] for j in jugadores_docs]
        }), 400

    # Validar restricción de posiciones
    conteo = {"Portero": 0, "Cierre": 0, "Ala": 0, "Pívot": 0}
    for j in jugadores_docs:
        pos = j.get("Posicion")
        if pos in conteo:
            conteo[pos] += 1

    if conteo["Portero"] != 1 or conteo["Cierre"] != 1 or conteo["Ala"] != 2 or conteo["Pívot"] != 1:
        return jsonify({
            "error": "La alineación debe ser exactamente: 1 Portero, 1 Cierre, 2 Alas y 1 Pívot",
            "conteo": conteo
        }), 400

    # Guardar si todo es correcto
    db_system.EquiposFantasy.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"jugadoresSeleccionados": jugadores}}
    )

    return jsonify({"mensaje": "Jugadores asignados correctamente"}), 200




# --- COMPETICIONES ---
@app.route('/api/competiciones', methods=['GET'])
def get_competiciones():
    competiciones = list(db_system.Competiciones.find())
    return jsonify([serialize_doc(c) for c in competiciones])

@app.route('/api/mis-competiciones', methods=['GET'])
@login_requerido
def get_mis_competiciones():
    # buscamos por ambas representaciones, sin modificar BD
    criterios = [g.user_id, str(g.user_id)]
    try:
        criterios.append(ObjectId(g.user_id))
    except Exception:
        pass

    comps = list(db_system.Competiciones.find({"participantes": {"$in": criterios}}))
    return jsonify([serialize_doc(c) for c in comps]), 200


@app.route('/api/competiciones', methods=['POST'])
@login_requerido
def crear_competicion():
    data = request.json
    nombre = data.get("nombreCompeticion")
    tipo = data.get("tipo")  # "publica" o "privada"
    sistema = data.get("sistemaPuntuacion", "Estandar")

    sistemas_validos = ["Estandar", "Goles", "RendimientoComunitario", "FairPlay"]
    if sistema not in sistemas_validos:
        return jsonify({"error": "Sistema de puntuación no válido"}), 400
    
    if not nombre or not tipo:
        return jsonify({"error": "Faltan campos"}), 400

    codigo = None
    if tipo == "privada":
        codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    nueva = {
        "nombreCompeticion": nombre,
        "tipo": tipo,
        "sistemaPuntuacion": sistema,
        "codigoInvitacion": codigo,
        "participantes": [g.user_id]
    }

    db_system.Competiciones.insert_one(nueva)
    return jsonify({"mensaje": "Competición creada", "codigoInvitacion": codigo, "sistema": sistema}), 201

@app.route('/api/competiciones/<comp_id>', methods=['PUT'])
@login_requerido
def modificar_competicion(comp_id):
    data = request.json

    comp = db_system.Competiciones.find_one({"_id": ObjectId(comp_id)})
    if not comp:
        return jsonify({"error": "Competición no encontrada"}), 404

    # Solo el creador (primer participante) puede modificar
    if comp["participantes"][0] != g.user_id:
        return jsonify({"error": "Solo el administrador puede modificar la liga"}), 403

    updates = {}

    if "nombreCompeticion" in data:
        updates["nombreCompeticion"] = data["nombreCompeticion"]

    if "sistemaPuntuacion" in data:
        sistema = data["sistemaPuntuacion"]
        sistemas_validos = ["Estandar", "Goles", "RendimientoComunitario", "FairPlay"]
        if sistema not in sistemas_validos:
            return jsonify({"error": "Sistema de puntuación no válido"}), 400
        updates["sistemaPuntuacion"] = sistema

    if "jornadaInicio" in data:
        updates["jornadaInicio"] = int(data["jornadaInicio"])

    if not updates:
        return jsonify({"error": "No se han enviado cambios válidos"}), 400

    db_system.Competiciones.update_one(
        {"_id": ObjectId(comp_id)},
        {"$set": updates}
    )

    return jsonify({
        "mensaje": "Competición actualizada correctamente",
        "cambios": updates
    }), 200



@app.route('/api/competiciones/unirse', methods=['POST'])
@login_requerido
def unirse_competicion():
    data = request.json or {}
    codigo = data.get("codigoInvitacion")
    comp_id = data.get("compId")

    comp = None

    if comp_id:
        # PÚBLICA por compId
        try:
            oid = ObjectId(comp_id)
        except Exception:
            return jsonify({"error": "compId inválido"}), 400
        comp = db_system.Competiciones.find_one({"_id": oid})
        if not comp:
            return jsonify({"error": "Competición no encontrada"}), 404
        if comp.get("tipo") != "publica":
            return jsonify({"error": "Para ligas privadas debes usar código de invitación"}), 400

    elif codigo is not None:
        # PRIVADA por código (evitar None)
        comp = db_system.Competiciones.find_one({"codigoInvitacion": codigo})
        if not comp:
            return jsonify({"error": "Competición no encontrada"}), 404
        if comp.get("tipo") != "privada":
            return jsonify({"error": "El código no corresponde a una liga privada"}), 400

    else:
        return jsonify({"error": "Debes enviar compId (pública) o codigoInvitacion (privada)"}), 400

    # --- normalizamos participantes a string para comparar ---
    participantes = [str(p) for p in comp.get("participantes", [])]

    # ⚠️ Cambio clave: si ya estás, NO devolvemos error; hacemos la operación idempotente
    if str(g.user_id) in participantes:
        return jsonify({"mensaje": f"Ya estabas en '{comp.get('nombreCompeticion','Liga')}'. Todo ok."}), 200

    # Alta segura (sin duplicados)
    db_system.Competiciones.update_one(
        {"_id": comp["_id"]},
        {"$addToSet": {"participantes": str(g.user_id)}}
    )

    return jsonify({"mensaje": f"Te has unido a '{comp.get('nombreCompeticion','Liga')}'"}), 200

@app.route('/api/competiciones/<comp_id>', methods=['GET'])
@login_requerido
def get_competicion(comp_id):
    comp = db_system.Competiciones.find_one({"_id": ObjectId(comp_id)})
    if not comp:
        return jsonify({"error": "Competición no encontrada"}), 404
    return jsonify(serialize_doc(comp)), 200

from collections import defaultdict

@app.route('/api/competiciones/<comp_id>/clasificacion', methods=['GET'])
@login_requerido
def get_clasificacion(comp_id):
    # Tomamos la ÚLTIMA jornada registrada por cada equipo
    clasif = list(db_system.Clasificaciones.find({"competicionId": comp_id}).sort([("equipoId", 1), ("jornada", -1)]))

    ult_por_equipo = {}
    for c in clasif:
        eq_id = c["equipoId"]
        # al estar ordenado por jornada desc, el primero que entre es el más reciente
        if eq_id not in ult_por_equipo:
            ult_por_equipo[eq_id] = {
                "jornada": c["jornada"],
                "puntosJornada": c.get("puntosJornada", 0),
                "puntosTotales": c.get("puntosTotales", 0),
            }

    salida = []
    for eq_id, datos in ult_por_equipo.items():
        equipo = db_system.EquiposFantasy.find_one({"_id": ObjectId(eq_id)})
        usuario = db_system.Usuarios.find_one({"_id": ObjectId(equipo["usuarioId"])}) if equipo else None
        salida.append({
            "equipo": equipo["nombreEquipo"] if equipo else "Equipo desconocido",
            "usuario": usuario["nombre"] if usuario else "Usuario desconocido",
            "jornada": datos["jornada"],
            "puntosJornada": datos["puntosJornada"],
            "puntosTotales": datos["puntosTotales"],
        })

    salida.sort(key=lambda x: x["puntosTotales"], reverse=True)
    return jsonify(salida), 200
# --- MIS COMPETICIONES DEL USUARIO AUTENTICADO ---
@app.route('/api/competiciones/mias', methods=['GET'])
@login_requerido
def mis_competiciones():
    # Devuelve las competiciones donde el usuario esté en 'participantes'
    comps = list(db_system.Competiciones.find(
        {"participantes": g.user_id},
        {"_id": 1, "nombreCompeticion": 1, "sistemaPuntuacion": 1}
    ))
    def serialize_comp(c):
        return {
            "id": str(c["_id"]),
            "nombreCompeticion": c.get("nombreCompeticion", "Competición"),
            "sistemaPuntuacion": c.get("sistemaPuntuacion", "Estandar"),
        }
    return jsonify([serialize_comp(c) for c in comps]), 200


# --- JORNADA ACTUAL + PUNTOS DE ESA JORNADA (por equipos de la liga) ---
@app.route('/api/competiciones/<comp_id>/jornada-actual', methods=['GET'])
@login_requerido
def get_jornada_actual_con_puntos(comp_id):
    # 1) detectar jornadas procesadas
    jornadas = db_system.Clasificaciones.distinct("jornada", {"competicionId": comp_id})
    if not jornadas:
        return jsonify({"numero": None, "resultados": []}), 200

    numero = max(jornadas)

    # 2) obtener puntos de esa jornada (mismo criterio que /jornadas/<numero>/puntos)
    clasif = list(db_system.Clasificaciones.find({
        "competicionId": comp_id,
        "jornada": int(numero)
    }))

    resultados = []
    for c in clasif:
        equipo = db_system.EquiposFantasy.find_one({"_id": ObjectId(c["equipoId"])})
        usuario = db_system.Usuarios.find_one({"_id": ObjectId(equipo["usuarioId"])}) if equipo else None
        resultados.append({
            "equipo":   equipo["nombreEquipo"] if equipo else "Equipo desconocido",
            "usuario":  usuario["nombre"] if usuario else "Usuario desconocido",
            "jornada":  c["jornada"],
            "puntosJornada": c.get("puntosJornada", 0),
            "puntosTotales": c.get("puntosTotales", 0),
        })

    # ordenar por puntos de la jornada
    resultados.sort(key=lambda x: x["puntosJornada"], reverse=True)

    return jsonify({"numero": int(numero), "resultados": resultados}), 200



# ============================
# ENDPOINTS EXISTENTES: FantasyLNFS
# ============================

@app.route('/api/jugadores', methods=['GET'])
def get_jugadores():
    jugadores = list(db.Jugadores.find())
    return jsonify([serialize_doc(j) for j in jugadores])

@app.route('/api/eventos', methods=['GET'])
def get_eventos():
    eventos = list(db.Eventos.find())
    return jsonify([serialize_doc(e) for e in eventos])

@app.route('/api/resultados', methods=['GET'])
def get_resultados():
    resultados = list(db.Resultados.find())
    return jsonify([serialize_doc(r) for r in resultados])

# --- JORNADAS / CLASIFICACIONES ---
@app.route('/api/competiciones/<comp_id>/procesar', methods=['POST'])
@login_requerido
def procesar_jornada(comp_id):
    data = request.json
    numero_jornada = int(data.get("numeroJornada"))

    if numero_jornada is None:
        return jsonify({"error": "Debes indicar 'numeroJornada'"}), 400

    # 1. Buscar competición
    comp = db_system.Competiciones.find_one({"_id": ObjectId(comp_id)})
    if not comp:
        return jsonify({"error": "Competición no encontrada"}), 404

    # 2. Validar que el usuario es admin (primer participante)
    if comp["participantes"][0] != g.user_id:
        return jsonify({"error": "Solo el administrador puede procesar jornadas"}), 403

    # 3. Buscar resultados de esa jornada
    jornada_docs = list(db.Resultados.find({"Numero de Jornada": numero_jornada}))
    if not jornada_docs:
        return jsonify({"error": f"No se encontró la jornada {numero_jornada}"}), 404

    # 4. Calcular puntos (igual que ya tenías)
    sistemas_validos = ["Estandar", "Goles", "RendimientoComunitario", "FairPlay"]
    puntos_por_sistema = {s: {} for s in sistemas_validos}

    for jornada_doc in jornada_docs:
        enfrentamientos = jornada_doc.get("Enfrentamientos", [])
        for enf in enfrentamientos:
            local = enf.get("Equipo Local")
            visit = enf.get("Equipo Visitante")
            if not local or not visit:
                continue

            for sistema in sistemas_validos:
                pts_partido = CalcularPuntuacionesPartido(db, local, visit, sistema)
                for ident, pts in pts_partido.items():
                    puntos_por_sistema[sistema][ident] = puntos_por_sistema[sistema].get(ident, 0) + pts

    # 4bis. Guardar estadísticas de jugadores para ESTA liga y ESTA jornada
    sistema_comp = comp.get("sistemaPuntuacion", "Estandar")
    puntos_jornada_comp = puntos_por_sistema.get(sistema_comp, {})

    for jugador_id, pts in puntos_jornada_comp.items():
        db_system.StatsJugadoresLiga.update_one(
            {
                "competicionId": comp_id,
                "jugadorId": jugador_id,
                "jornada": numero_jornada
            },
            {
                "$set": {
                    "sistemaPuntuacion": sistema_comp,
                    "puntosJornada": pts
                }
            },
            upsert=True
        )

    # 5. Repartir puntos a equipos en esa competición
    equipos = list(db_system.EquiposFantasy.find({"competicionId": comp_id}))
    for equipo in equipos:
        seleccion = equipo.get("jugadoresSeleccionados", [])
        sistema = comp.get("sistemaPuntuacion", "Estandar")
        puntos_jugadores = puntos_por_sistema.get(sistema, {})

        detalle_equipo = []
        puntos_equipo = 0

        for jugador_id in seleccion:
            jugador_doc = db.Jugadores.find_one({"Identificador": jugador_id})
            puntos = puntos_jugadores.get(jugador_id, 0)
            puntos_equipo += puntos

            detalle_equipo.append({
                "jugador": jugador_id,
                "posicion": jugador_doc.get("Posicion") if jugador_doc else "Desconocida",
                "puntos": puntos
            })

        eq_id = str(equipo["_id"])

        prev = db_system.Clasificaciones.find(
            {"competicionId": comp_id, "equipoId": eq_id, "jornada": {"$ne": numero_jornada}},
            {"puntosJornada": 1}
        )
        acumulado_prev = sum(doc.get("puntosJornada", 0) for doc in prev)
        total = acumulado_prev + puntos_equipo

        db_system.Clasificaciones.update_one(
            {"competicionId": comp_id, "equipoId": eq_id, "jornada": numero_jornada},
            {"$set": {
                "puntosJornada": puntos_equipo,
                "puntosTotales": total,
                "detalle": detalle_equipo
            }},
            upsert=True
        )

    return jsonify({"mensaje": f"Jornada {numero_jornada} procesada en {comp['nombreCompeticion']}"}), 200


# --- PUNTOS DE UNA JORNADA EN UNA COMPETICIÓN ---
@app.route('/api/competiciones/<comp_id>/jornadas/<numero>/puntos', methods=['GET'])
@login_requerido
def get_puntos_jornada(comp_id, numero):
    clasif = list(db_system.Clasificaciones.find({
        "competicionId": comp_id,
        "jornada": int(numero)
    }))
    salida = []
    for c in clasif:
        equipo = db_system.EquiposFantasy.find_one({"_id": ObjectId(c["equipoId"])})
        usuario = db_system.Usuarios.find_one({"_id": ObjectId(equipo["usuarioId"])}) if equipo else None
        salida.append({
            "equipo": equipo["nombreEquipo"] if equipo else "Equipo desconocido",
            "usuario": usuario["nombre"] if usuario else "Usuario desconocido",
            "jornada": c["jornada"],
            "puntosJornada": c.get("puntosJornada", 0),
            "puntosTotales": c.get("puntosTotales", 0),
            "jugadores": c.get("detalle", [])
        })
    salida.sort(key=lambda x: x["puntosJornada"], reverse=True)
    return jsonify(salida), 200

@app.route('/api/competiciones/<comp_id>/jornadas', methods=['GET'])
@login_requerido
def get_jornadas_procesadas(comp_id):
    # Buscar todas las jornadas procesadas (sin duplicados)
    jornadas = db_system.Clasificaciones.distinct("jornada", {"competicionId": comp_id})
    jornadas = sorted(jornadas)
    return jsonify(jornadas), 200

@app.route('/api/competiciones/<comp_id>/jugadores/stats', methods=['GET'])
@login_requerido
def stats_jugadores_liga(comp_id):
    """
    Devuelve estadísticas de jugadores para una competición concreta,
    sumando los puntos desde la jornada 1 hasta 'hastaJornada'.

    Si no se pasa ?hastaJornada=..., usa automáticamente la última jornada
    procesada de esa liga (según Clasificaciones).
    """

    # 1) Determinar hasta qué jornada sumar
    hasta = request.args.get("hastaJornada", None, type=int)

    if hasta is None:
        # usamos las jornadas que ya tienes en Clasificaciones para esta liga
        jornadas = db_system.Clasificaciones.distinct("jornada", {"competicionId": comp_id})
        if not jornadas:
            return jsonify({"hastaJornada": None, "jugadores": []}), 200
        hasta = max(jornadas)

    # 2) Agrupar puntos de StatsJugadoresLiga hasta esa jornada
    pipeline = [
        {"$match": {
            "competicionId": comp_id,
            "jornada": {"$lte": hasta}
        }},
        {"$group": {
            "_id": "$jugadorId",
            "puntosTotales": {"$sum": "$puntosJornada"}
        }},
        {"$sort": {"puntosTotales": -1}},
    ]

    agg = list(db_system.StatsJugadoresLiga.aggregate(pipeline))

    # 3) Enriquecer con datos del jugador real
    ids = [a["_id"] for a in agg]
    jugadores_docs = list(db.Jugadores.find({"Identificador": {"$in": ids}}))
    por_id = {j["Identificador"]: j for j in jugadores_docs}

    salida = []
    for a in agg:
        ident = a["_id"]
        j = por_id.get(ident, {})
        salida.append({
            "jugadorId": ident,
            "nombre": j.get("NombreCompleto") or j.get("Nombre") or ident,
            "equipoReal": j.get("Equipo", "—"),
            "posicion": j.get("Posicion", "—"),
            "puntosTotales": a["puntosTotales"]
        })

    return jsonify({
        "hastaJornada": hasta,
        "jugadores": salida
    }), 200


@app.route('/api/competiciones/<comp_id>/jugadores/stats-resumen', methods=['GET'])
@login_requerido
def stats_jugadores_liga_resumen(comp_id):
    """
    Devuelve, para cada jugador de una competición, los puntos de las
    últimas N jornadas (por defecto 5) procesadas en esa liga.
    """
    N = 5

    # 1) Jornadas disponibles en StatsJugadoresLiga para esa competicion
    jornadas = db_system.StatsJugadoresLiga.distinct("jornada", {"competicionId": comp_id})
    if not jornadas:
        return jsonify({"jornadas": [], "jugadores": []}), 200

    jornadas_ordenadas = sorted(jornadas)  # [1,2,3,4,5,6,7,...]
    ultimas = jornadas_ordenadas[-N:]      # últimas N

    # 2) Agrupar puntos por jugador y jornada
    pipeline = [
        {"$match": {
            "competicionId": comp_id,
            "jornada": {"$in": ultimas}
        }},
        {"$group": {
            "_id": {
                "jugadorId": "$jugadorId",
                "jornada": "$jornada"
            },
            "puntos": {"$sum": "$puntosJornada"}
        }}
    ]

    agg = list(db_system.StatsJugadoresLiga.aggregate(pipeline))

    # 3) Construir mapa {jugadorId: {jornada: puntos}}
    stats_por_jugador = {}
    for doc in agg:
        jid = doc["_id"]["jugadorId"]
        jor = doc["_id"]["jornada"]
        pts = doc["puntos"]

        if jid not in stats_por_jugador:
            stats_por_jugador[jid] = {}
        stats_por_jugador[jid][jor] = pts

    # 4) Cargar datos de jugadores reales
    ids = list(stats_por_jugador.keys())
    jugadores_docs = list(db.Jugadores.find({"Identificador": {"$in": ids}}))
    por_id = {j["Identificador"]: j for j in jugadores_docs}

    # 5) Preparar salida
    jugadores_salida = []
    for jid, mapa_jornadas in stats_por_jugador.items():
        j = por_id.get(jid, {})
        # puntos en el orden de las jornadas seleccionadas
        puntos_por_jornada = [mapa_jornadas.get(jor, 0) for jor in ultimas]
        media = sum(puntos_por_jornada) / len(puntos_por_jornada) if puntos_por_jornada else 0.0

        jugadores_salida.append({
            "jugadorId": jid,
            "nombre": j.get("NombreCompleto") or j.get("Nombre") or jid,
            "equipoReal": j.get("Equipo", "—"),
            "posicion": j.get("Posicion", "—"),
            "puntosPorJornada": puntos_por_jornada,
            "mediaUltimas": media
        })

    return jsonify({
        "jornadas": ultimas,
        "jugadores": jugadores_salida
    }), 200

@app.route('/api/dashboard/<comp_id>', methods=['GET'])
@login_requerido
def get_dashboard(comp_id):
    # 1) Mi equipo (filtrado por competición)
    equipo = db_system.EquiposFantasy.find_one({"usuarioId": g.user_id, "competicionId": comp_id})
    equipo_info = None
    if equipo:
        equipo_info = {
            "equipoId": str(equipo["_id"]),
            "nombreEquipo": equipo.get("nombreEquipo", "Sin nombre"),
            "jugadoresSeleccionados": equipo.get("jugadoresSeleccionados", []),
        }

    # 2) Ranking (una fila por equipo usando la última jornada)
    clasif = list(db_system.Clasificaciones.find({"competicionId": comp_id}).sort([("equipoId", 1), ("jornada", -1)]))
    ult_por_equipo = {}
    for c in clasif:
        eq_id = c["equipoId"]
        if eq_id not in ult_por_equipo:
            ult_por_equipo[eq_id] = c  # c es la más reciente por equipo

    ranking = []
    for eq_id, c in ult_por_equipo.items():
        eq = db_system.EquiposFantasy.find_one({"_id": ObjectId(eq_id)})
        usuario = db_system.Usuarios.find_one({"_id": ObjectId(eq["usuarioId"])}) if eq else None
        ranking.append({
            "equipo": eq["nombreEquipo"] if eq else "Equipo desconocido",
            "usuario": usuario["nombre"] if usuario else "Usuario desconocido",
            "puntosTotales": c.get("puntosTotales", 0),
        })
    ranking.sort(key=lambda x: x["puntosTotales"], reverse=True)

    # 3) Última jornada de la liga (igual que tenías, pero robusto)
    ultima = db_system.Clasificaciones.find_one({"competicionId": comp_id}, sort=[("jornada", -1)])
    puntos_jornada = []
    num_jornada = None
    if ultima:
        num_jornada = ultima["jornada"]
        clasif_jornada = list(db_system.Clasificaciones.find({"competicionId": comp_id, "jornada": num_jornada}))
        for c in clasif_jornada:
            eq = db_system.EquiposFantasy.find_one({"_id": ObjectId(c["equipoId"])})
            usuario = db_system.Usuarios.find_one({"_id": ObjectId(eq["usuarioId"])}) if eq else None
            puntos_jornada.append({
                "equipo": eq["nombreEquipo"] if eq else "Equipo desconocido",
                "usuario": usuario["nombre"] if usuario else "Usuario desconocido",
                "puntosJornada": c.get("puntosJornada", 0)
            })
        puntos_jornada.sort(key=lambda x: x["puntosJornada"], reverse=True)

    return jsonify({
        "equipoActual": equipo_info,
        "rankingLiga": ranking,
        "ultimaJornada": num_jornada,
        "puntosJornada": puntos_jornada
    }), 200


@app.route('/api/equipos/<equipo_id>/jornadas/<numero>/puntos', methods=['GET'])
@login_requerido
def get_puntos_equipo_jornada(equipo_id, numero):
    equipo = db_system.EquiposFantasy.find_one({"_id": ObjectId(equipo_id)})
    if not equipo:
        return jsonify({"error": "Equipo no encontrado"}), 404
    if equipo["usuarioId"] != g.user_id:
        return jsonify({"error": "No puedes consultar un equipo que no es tuyo"}), 403

    jugadores_ids = equipo.get("jugadoresSeleccionados", [])
    jugadores_docs = list(db.Jugadores.find({"Identificador": {"$in": jugadores_ids}}))

    clasif = db_system.Clasificaciones.find_one({
        "equipoId": str(equipo["_id"]),
        "jornada": int(numero)
    })

    puntos_totales = clasif.get("puntosJornada", 0) if clasif else 0

    # detalle guardado como lista -> lo normalizamos a diccionario {ident: puntos}
    detalle_dict = {}
    if clasif and isinstance(clasif.get("detalle"), list):
        for item in clasif["detalle"]:
            ident = item.get("jugador")
            pts = item.get("puntos", 0)
            if ident:
                detalle_dict[ident] = pts

    puntos_jugadores = []
    for j in jugadores_docs:
        ident = j["Identificador"]
        puntos = detalle_dict.get(ident, 0)
        puntos_jugadores.append({
            "jugador": j.get("Nombre", ident),
            "posicion": j.get("Posicion", "N/D"),
            "puntos": puntos
        })

    return jsonify({
        "equipo": equipo["nombreEquipo"],
        "jornada": int(numero),
        "puntosTotales": puntos_totales,
        "jugadores": puntos_jugadores
    }), 200

# --- ACTUALIZAR CLASIFICACIÓN DE UNA COMPETICIÓN ---
@app.route('/api/competiciones/<comp_id>/actualizar', methods=['POST'])
@login_requerido
def actualizar_clasificacion(comp_id):
    comp = db_system.Competiciones.find_one({"_id": ObjectId(comp_id)})
    if not comp:
        return jsonify({"error": "Competición no encontrada"}), 404

    # Obtener clasificaciones existentes de esa competición
    clasif_docs = list(db_system.Clasificaciones.find({"competicionId": comp_id}))
    if not clasif_docs:
        return jsonify({"error": "No hay clasificaciones para esta competición"}), 400

    # Calcular última jornada procesada
    ultima_jornada = max(c["jornada"] for c in clasif_docs)

    # Construir ranking
    ranking = []
    for c in clasif_docs:
        equipo = db_system.EquiposFantasy.find_one({"_id": ObjectId(c["equipoId"])})
        usuario = db_system.Usuarios.find_one({"_id": ObjectId(equipo["usuarioId"])}) if equipo else None

        ranking.append({
            "equipoId": str(equipo["_id"]) if equipo else None,
            "equipo": equipo["nombreEquipo"] if equipo else "Equipo desconocido",
            "usuario": usuario["nombre"] if usuario else "Usuario desconocido",
            "puntosTotales": c.get("puntosTotales", 0),
            "puntosJornada": c.get("puntosJornada", 0) if c["jornada"] == ultima_jornada else 0
        })

    # Ordenar con criterios de desempate
    ranking.sort(key=lambda x: (-x["puntosTotales"], -x["puntosJornada"], x["equipo"]))

    # Guardar posición en la clasificación
    for i, r in enumerate(ranking, start=1):
        db_system.Clasificaciones.update_many(
            {"competicionId": comp_id, "equipoId": r["equipoId"]},
            {"$set": {"ranking": i}}
        )
        r["ranking"] = i

    return jsonify({
        "mensaje": f"Clasificación de la competición '{comp['nombreCompeticion']}' actualizada",
        "ranking": ranking
    }), 200


if __name__ == '__main__':
    app.run(debug=True)
