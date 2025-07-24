let workbook;
let baseCargada = false;
let novedadesRegistradas = [];

// Mostrar/ocultar campo de login
function toggleAdmin() {
  const login = document.getElementById('adminLogin');
  login.style.display = login.style.display === 'none' ? 'block' : 'none';
}

// Verificar contraseña para acceso al panel
function verificarAcceso() {
  const pass = document.getElementById('password').value;
  if (pass === 'primeralinea#') {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminLogin').style.display = 'none';
  } else {
    alert('❌ Contraseña incorrecta');
  }
}

// Cargar archivo Excel
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('inputArchivo');
  if (input) {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      const data = await file.arrayBuffer();
      workbook = XLSX.read(data);
      baseCargada = true;
      novedadesRegistradas = []; // Reiniciamos novedades al cargar nueva base
      alert('📁 Base cargada con éxito');
    });
  }
});

// Buscar cliente en toda la columna C y mostrar nombre en columna D
function buscarCliente() {
  const codigo = document.getElementById('codigoCliente').value.trim();

  if (!baseCargada) {
    document.getElementById('nombreCliente').value = "(Base no cargada)";
    return;
  }

  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  let encontrado = false;
  for (let i = 0; i < datos.length; i++) {
    const fila = datos[i];
    if (String(fila[2]).trim() === codigo) {
      document.getElementById('nombreCliente').value = fila[3] || "(sin nombre)";
      encontrado = true;
      break;
    }
  }

  if (!encontrado) {
    document.getElementById('nombreCliente').value = "❌ No encontrado";
  }
}

// Registrar novedad (siempre permitido)
function registrarNovedad() {
  const codigo = document.getElementById('codigoCliente').value.trim();
  const novedad = document.getElementById('novedad').value;
  const obs = document.getElementById('observaciones').value;
  const nombre = document.getElementById('nombreCliente').value || "(sin nombre)";
  
  if (!codigo || !novedad) {
    alert('⚠️ Completa todos los campos obligatorios');
    return;
  }

  // Fecha y hora separados, con formato dd/mm/yyyy y hh:mm
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-ES'); // ej: 24/07/2025
  const hora = ahora.toTimeString().slice(0,5); // ej: 04:46

  // Guardamos novedades con codigo y fecha/hora para referencia
  novedadesRegistradas.push({ codigo, nombre, novedad, obs, fecha, hora });

  document.getElementById('mensaje').textContent = '✅ Novedad registrada correctamente';
  document.getElementById('codigoCliente').value = '';
  document.getElementById('nombreCliente').value = '';
  document.getElementById('novedad').value = '';
  document.getElementById('observaciones').value = '';

  setTimeout(() => {
    document.getElementById('mensaje').textContent = '';
  }, 3000);
}

// Descargar Excel con base + novedades añadidas
function descargarExcel() {
  if (!baseCargada) {
    alert("⚠️ Debes cargar primero una base para descargar.");
    return;
  }
  
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  // Añadimos encabezados para nuevas columnas, si no existen
  const header = datos[0];
  if (!header.includes('Novedad')) header.push('Novedad');
  if (!header.includes('Observaciones')) header.push('Observaciones');
  if (!header.includes('Fecha')) header.push('Fecha');
  if (!header.includes('Hora')) header.push('Hora');

  // Creamos un map de novedades para acceso rápido por código
  const novedadesMap = {};
  novedadesRegistradas.forEach(n => {
    novedadesMap[n.codigo] = n;
  });

  // Recorremos las filas para añadir novedades a cada cliente
  for (let i = 1; i < datos.length; i++) {
    const fila = datos[i];
    const codigoFila = String(fila[2]).trim();

    if (novedadesMap[codigoFila]) {
      // Si ya hay datos en columnas extra, actualizar, sino crear
      fila[header.indexOf('Novedad')] = novedadesMap[codigoFila].novedad;
      fila[header.indexOf('Observaciones')] = novedadesMap[codigoFila].obs;
      fila[header.indexOf('Fecha')] = novedadesMap[codigoFila].fecha;
      fila[header.indexOf('Hora')] = novedadesMap[codigoFila].hora;
    } else {
      // Si no hay novedad para ese código, limpiar esas columnas
      fila[header.indexOf('Novedad')] = "";
      fila[header.indexOf('Observaciones')] = "";
      fila[header.indexOf('Fecha')] = "";
      fila[header.indexOf('Hora')] = "";
    }
  }

  // Convertimos datos de vuelta a hoja
  const nuevaHoja = XLSX.utils.aoa_to_sheet(datos);
  const nuevoLibro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(nuevoLibro, nuevaHoja, "Base con Novedades");

  XLSX.writeFile(nuevoLibro, `base_actualizada_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.xlsx`);
}
