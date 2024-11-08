//------------ CODIGO PARA TRAER LOS DATOS DEL ARDUINO---------------

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const port = 3000;

// Middleware para procesar el cuerpo de las solicitudes POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Agrega esta línea para procesar JSON

// Habilitar CORS para todas las rutas
app.use(cors());

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: '127.0.0.1',  // Cambia 'localhost' por '127.0.0.1'
    user: 'root',
    password: 'root',   // Usa tu contraseña
    database: 'gps_data'
});

// Conectar a la base de datos
db.connect(err => {
    if (err) throw err;
    console.log('Conectado a MySQL');
});

// Ruta para recibir los datos del Arduino
app.post('/actualizar', (req, res) => {
    const latitud = req.body.lat; // Cambiar aquí
    const longitud = req.body.lng;  // Cambiar aquí

    if (latitud && longitud) {
        // Insertar los datos en la base de datos
        const query = 'INSERT INTO coordenadas (latitud, longitud) VALUES (?, ?)';
        db.query(query, [latitud, longitud], (err, result) => {
            if (err) {
                console.error('Error al insertar datos: ', err);
                return res.status(500).send('Error al insertar datos');
            }
            res.send('Datos insertados correctamente');
        });
    } else {
        res.status(400).send('Error: Faltan coordenadas');
    }
});

// Ruta para enviar las coordenadas al frontend
app.get('/coordenadas', (req, res) => {
    const query = 'SELECT latitud, longitud FROM coordenadas ORDER BY id DESC LIMIT 1'; // Cambia "id" si usas otro campo para ordenar
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).send('Error en la consulta');
        }
        // Enviar los últimos resultados en formato JSON
        if (results.length > 0) {
            res.json(results); // Esto enviará un arreglo de coordenadas
        } else {
            res.json([]); // Enviar un arreglo vacío si no hay coordenadas
        }
    });
});

// Ruta para obtener paradas
app.get('/paradas', (req, res) => {
    db.query('SELECT * FROM paradas', (error, results) => {
        if (error) {
            console.error('Error al obtener paradas:', error.message); // Mensaje más claro
            return res.status(500).json({ error: 'Error al obtener paradas' });
        }
        res.json(results);
    });
});

// En server.js
// Ruta para obtener coordenadas de un recorrido específico
app.get('/coordenadas_recorridos/:lineaId', (req, res) => {
    const { lineaId } = req.params; // Extraemos el ID de la línea de los parámetros de la solicitud
    db.query(
        'SELECT latitud, longitud, orden FROM coordenadas_recorridos WHERE linea_id = ? ORDER BY orden',
        [lineaId], // Usamos el ID de la línea como parámetro
        (error, results) => {
            if (error) {
                console.error('Error al obtener coordenadas:', error.message); // Mensaje más claro
                return res.status(500).json({ error: 'Error al obtener coordenadas' });
            }
            res.json(results); // Enviamos los resultados como respuesta
        }
    );
});

// Ruta para obtener las líneas
app.get('/lineas', (req, res) => {
    db.query('SELECT * FROM lineas', (error, results) => {
        if (error) {
            console.error('Error al obtener líneas:', error.message); // Mensaje más claro
            return res.status(500).json({ error: 'Error al obtener líneas' });
        }
        res.json(results); // Enviar los resultados como respuesta
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
