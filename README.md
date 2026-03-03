# 🏗️ DECOREFORM.A.B - Sistema de Gestión de Obras y Reformas

Aplicación web para la gestión integral de obras, presupuestos, facturas, trabajadores y clientes en empresas de reformas. Desarrollada con **React + PHP + MySQL**.

## ✨ Funcionalidades

- **Presupuestos** — Creación, seguimiento y exportación a PDF/Excel
- **Facturas** — Facturación con exportación a PDF/Excel  
- **Obras** — Control de gastos, mano de obra y estado de proyectos
- **Clientes y Proveedores** — Gestión de contactos
- **Trabajadores** — Registro de jornadas y tarifas
- **Calendario** — Planificación visual de obras
- **Dashboard** — Resumen financiero en tiempo real
- **Configuración** — Datos empresa, logo, cuenta bancaria

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | Bootstrap 5 + CSS personalizado |
| Backend | PHP 7.4+ |
| Base de datos | MySQL 8 |
| PDF/Excel | mPDF + PhpSpreadsheet |
| Dev local | Docker + Docker Compose |

---

## 🚀 Instalación en Local (Docker)

### Requisitos
- Docker Desktop
- Node.js 18+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/decoreforMAB.git
cd decoreforMAB

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar servicios Docker
docker-compose up -d

# 4. Instalar dependencias del frontend
cd frontend
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`
La API en `http://localhost:8083/api`

---

## 🌐 Despliegue en Producción (Hostinger)

1. **Build del frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Subir al servidor:**
   - `frontend/dist/` → raíz pública del hosting
   - `backend/` → carpeta `backend/` del servidor

3. **Configurar BD (solo 1ª vez):**  
   Crear `backend/config/db.production.php` en el servidor (ver `.env.example` para referencia).  
   ⚠️ Este archivo **nunca se sube al repositorio** (incluido en `.gitignore`).

4. La app detecta automáticamente si está en local o producción.

---

## 📁 Estructura del Proyecto

```
decoreforMAB/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── pages/          # Páginas principales
│   │   ├── components/     # Componentes reutilizables
│   │   ├── services/       # API client (api.js)
│   │   └── styles/         # CSS global
│   ├── .env                # API URL local
│   └── .env.production     # API URL producción (/api)
│
├── backend/                # PHP API REST
│   ├── api/                # Endpoints PHP
│   ├── config/             # DB, CORS, Auth
│   └── vendor/             # Dependencias Composer (no en repo)
│
├── init.sql                # Schema inicial de la BD
├── docker-compose.yml      # Docker para desarrollo local
└── .env                    # Variables de entorno locales
```

---

## 🔒 Seguridad

- Autenticación por sesión PHP con cookies `HttpOnly` + `Secure`
- Rate limiting en login (5 intentos / 5 min)
- Prepared statements en todas las consultas SQL (PDO)
- Credenciales de producción en archivo separado excluido del repo

---

## 📄 Licencia

Uso privado — Todos los derechos reservados.
