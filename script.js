let workbook;
let baseCargada = false;
let novedadesRegistradas = [];

// Mostrar/ocultar campo de login admin
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
      alert('📁 Base cargada con éxito');
    });
  }
});

// Buscar cliente en columna C (índice 2)
function buscarCliente() {
  const codigo = document.getElementById('codigoCliente').value.trim();

  if (!baseCargada) {
    document.getElementById('nombreCliente').value = "(Base no cargada)";
    return;
  }

  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });
  const fila = datos.find(row => String(row[2]).trim() === codigo);

  if (fila) {
    document.getElementById('nombreCliente').value = fila[3] || "(sin nombre)";
  } else {
    document.getElementById('nombreCliente').value = "❌ No encontrado";
  }
}

// Registrar novedad
function registrarNovedad() {
  const codigo = document.getElementById('codigoCliente').value.trim();
  const novedad = document.getElementById('novedad').value;
  const obs = document.getElementById('observaciones').value;
  const nombre = document.getElementById('nombreCliente').value || "(sin nombre)";

  if (!codigo || !novedad) {
    alert('⚠️ Completa todos los campos obligatorios');
    return;
  }

  // Obtener fecha y hora actual separados
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-ES');  // dd/mm/yyyy con /
  const hora = ahora.toLocaleTimeString('es-ES', { hour12: false }); // hh:mm:ss 24h

  // Guardamos novedad en un objeto para mapear por código
  // Si ya existe, actualizamos
  const idxExistente = novedadesRegistradas.findIndex(n => n.codigo === codigo);
  const novedadObjeto = { codigo, nombre, novedad, obs, fecha, hora };

  if (idxExistente >= 0) {
    novedadesRegistradas[idxExistente] = novedadObjeto;
  } else {
    novedadesRegistradas.push(novedadObjeto);
  }

  document.getElementById('mensaje').textContent = '✅ Novedad registrada correctamente';

  // Limpiar campos para nuevo registro
  document.getElementById('codigoCliente').value = '';
  document.getElementById('nombreCliente').value = '';
  document.getElementById('novedad').value = '';
  document.getElementById('observaciones').value = '';

  setTimeout(() => {
    document.getElementById('mensaje').textContent = '';
  }, 3000);
}

// Descargar Excel con novedades integradas en base original
function descargarExcel() {
  if (!baseCargada) {
    alert("⚠️ Debes cargar primero una base para descargar.");
    return;
  }
  if (novedadesRegistradas.length === 0) {
    alert("⚠️ No hay novedades registradas para descargar.");
    return;
  }

  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  const header = datos[0];

  // Columnas nuevas para agregar si no existen
  const nuevasColumnas = ['Novedad', 'Observaciones', 'Fecha', 'Hora'];
  nuevasColumnas.forEach(col => {
    if (!header.includes(col)) header.push(col);
  });

  // Índices de columnas nuevas
  const idxNovedad = header.indexOf('Novedad');
  const idxObs = header.indexOf('Observaciones');
  const idxFecha = header.indexOf('Fecha');
  const idxHora = header.indexOf('Hora');

  // Map para novedades rápido por código
  const novedadesMap = {};
  novedadesRegistradas.forEach(n => {
    novedadesMap[n.codigo] = n;
  });

  // Recorremos filas para agregar novedades en la base
  for (let i = 1; i < datos.length; i++) {
    const fila = datos[i];

    while (fila.length < header.length) {
      fila.push("");
    }

    const codigoFila = String(fila[2]).trim();

    if (novedadesMap[codigoFila]) {
      fila[idxNovedad] = novedadesMap[codigoFila].novedad;
      fila[idxObs] = novedadesMap[codigoFila].obs;
      fila[idxFecha] = novedadesMap[codigoFila].fecha;
      fila[idxHora] = novedadesMap[codigoFila].hora;
    } else {
      fila[idxNovedad] = "";
      fila[idxObs] = "";
      fila[idxFecha] = "";
      fila[idxHora] = "";
    }
  }

  // Convertimos a hoja y libro XLSX
  const nuevaHoja = XLSX.utils.aoa_to_sheet(datos);
  const nuevoLibro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(nuevoLibro, nuevaHoja, "Base con Novedades");

  const fechaArchivo = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
  XLSX.writeFile(nuevoLibro, `base_actualizada_${fechaArchivo}.xlsx`);
}

