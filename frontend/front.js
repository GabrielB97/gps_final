// Inicializar el mapa centrado en una ubicación específica
var map = L.map('map').setView([-31.4233, -62.0810], 13); // Coordenadas iniciales

// Cargar y mostrar los tiles del mapa de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Crear un ícono personalizado para el marcador
var colectivoIcon = L.icon({
    iconUrl: 'img/colectivo.png', // Ruta a tu imagen del ícono
    iconSize: [20, 20], // Tamaño del ícono (ajusta según tus necesidades)
    iconAnchor: [10, 10], // Punto del ícono que corresponderá a la ubicación del marcador
    popupAnchor: [0, -10] // Punto desde el que se abrirá el popup, en relación al ícono
});

var paradaIcon = L.icon({
    iconUrl: 'img/parada.png', // Ruta a tu imagen del ícono
    iconSize: [40, 40], // Tamaño del ícono (ajusta según tus necesidades)
    iconAnchor: [10, 30], // Punto del ícono que corresponderá a la ubicación del marcador
    popupAnchor: [0, -10] // Punto desde el que se abrirá el popup, en relación al ícono
});



// Crear un marcador en la ubicación inicial con el ícono personalizado
var marker = L.marker([-31.4233, -62.0810], { icon: colectivoIcon }).addTo(map);


// Función para obtener coordenadas del backend
async function getCoordinates() {
    try {
        let response = await fetch('http://localhost:3000/coordenadas'); // Cambia a la IP si es necesario
        if (!response.ok) {
            throw new Error('Error en la respuesta de la red: ' + response.statusText);
        }
        let data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener coordenadas:', error);
    }
}

// Función para obtener paradas del backend

let paradas = []; // Arreglo para almacenar las paradas
// Función para obtener paradas del backend
async function getParadas() {
    try {
        let response = await fetch('http://localhost:3000/paradas'); // Cambia a la IP si es necesario
        if (!response.ok) {
            throw new Error('Error en la respuesta de la red: ' + response.statusText);
        }
        paradas = await response.json(); // Almacenar las paradas
        mostrarParadas(); // Llamar a la función para mostrarlas en el mapa
    } catch (error) {
        console.error('Error al obtener paradas:', error);
    }
}


// Función para mostrar las paradas en el mapa
function mostrarParadas() {
    paradas.forEach(parada => {
        L.marker([parada.latitud, parada.longitud], {icon: paradaIcon})
            .addTo(map)
            .bindPopup(parada.nombre + "<br>" + (parada.descripcion || "Sin descripción")); // Mostrar nombre y descripción
    });
}

// Función para mover el marcador a las coordenadas obtenidas
async function moveMarker() {
    const coordenadas = await getCoordinates();

    if (coordenadas && coordenadas.length > 0) {
        const newLat = coordenadas[0].latitud;  // Cambia según la estructura del JSON
        const newLng = coordenadas[0].longitud; // Cambia según la estructura del JSON

        // Actualizar la posición del marcador
        marker.setLatLng([newLat, newLng]);
        map.setView([newLat, newLng], 16); // Mover el mapa

        // Crear un marcador en cada coordenada

        L.circleMarker([newLat, newLng], {
            radius: 3,  // Radio del círculo (más pequeño que el valor predeterminado)
            color: 'black',  // Color del borde
            fillColor: 'black',  // Color de relleno
            fillOpacity: 0.8  // Opacidad del relleno
        }).addTo(map);


        // Determinar si está en una parada
        let estado = "En movimiento"; // Por defecto
        for (const parada of paradas) {
            const distancia = calcularDistancia(newLat, newLng, parada.latitud, parada.longitud);
            if (distancia < 0.1) { // Por ejemplo, 100 metros
                estado = "Detenido en " + parada.nombre; // Actualiza el estado
                break; // Salir del bucle si encuentra una parada
            }
        }

        // Mostrar el estado en la interfaz
        document.getElementById('estadoColectivo').innerText = estado; // Actualiza el texto en la interfaz
    }
}

// Calcular la distancia entre dos puntos
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c; // Distancia en km
    return distancia;
}

// Llamar a las funciones
getParadas(); // Cargar las paradas al inicio
setInterval(moveMarker, 5000);  // Actualizar la ubicación del marcador cada 5 segundos

// Función para obtener y mostrar las coordenadas en el mapa
async function mostrarRuta(lineaId) {
    try {
        let response = await fetch(`http://localhost:3000/coordenadas_recorridos/${lineaId}`);
        if (!response.ok) {
            throw new Error('Error en la respuesta de la red: ' + response.statusText);
        }

        const coordenadas = await response.json();

        // Asegúrate de tener una referencia a tu mapa
        const rutaColectivo = coordenadas.map(coord => [coord.latitud, coord.longitud]);

        // Dibujar la ruta en el mapa
        const polyline = L.polyline(rutaColectivo, { color: 'blue' }).addTo(map);
        map.fitBounds(polyline.getBounds()); // Ajusta el mapa para ver toda la ruta
    } catch (error) {
        console.error('Error al obtener y mostrar la ruta:', error);
    }
}

// Llamada a la función con el ID de la línea que deseas mostrar


// Función para cargar líneas en el panel
async function cargarLineas() {
    try {
        let response = await fetch('http://localhost:3000/lineas'); // Cambia a la URL de tu API
        if (!response.ok) {
            throw new Error('Error al cargar líneas: ' + response.statusText);
        }
        const lineas = await response.json();

        const lineasList = document.getElementById('lineasList');
        lineasList.innerHTML = ''; // Limpiar la lista en caso de que ya haya elementos

        // Crear un elemento <li> por cada línea y añadirlo a la lista
        lineas.forEach(linea => {
            const listItem = document.createElement('li');
            listItem.textContent = linea.nombre; // Nombre de la línea
            listItem.dataset.lineaId = linea.id; // Guardar el ID de la línea en un atributo de datos

            // Agregar evento para que cuando se haga clic, se muestre la ruta en el mapa
            listItem.addEventListener('click', () => {
                mostrarRuta(linea.id); // Llama a mostrarRuta con el ID de la línea
            });

            lineasList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error al cargar líneas:', error);
    }
}

// Llama a cargarLineas para cargar las líneas al iniciar la página
cargarLineas();