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
      alert('📁 Base cargada con éxito');
    });
  }
});

// Buscar cliente (opcional, no bloqueante)
function buscarCliente() {
  const codigo = document.getElementById('codigoCliente').value.trim();

  if (!baseCargada) {
    document.getElementById('nombreCliente').value = "(Base no cargada)";
    return;
  }

  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  // Buscar el código en la columna 2 (C) — convertir ambos a string y recortar espacios
  const fila = datos.find(row => String(row[2]).trim() === codigo);

  if (fila) {
    document.getElementById('nombreCliente').value = fila[3] || "(sin nombre)";
  } else {
    document.getElementById('nombreCliente').value = "❌ No encontrado";
  }
}

// Registrar novedad (siempre permitido)
function registrarNovedad() {
  const codigo = document.getElementById('codigoCliente').value.trim();
  const novedad = document.getElementById('novedad').value;
  const obs = document.getElementById('observaciones').value;
  const nombre = document.getElementById('nombreCliente').value || "(sin nombre)";
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  if (!codigo || !novedad) {
    alert('⚠️ Completa todos los campos obligatorios');
    return;
  }

  novedadesRegistradas.push([codigo, nombre, novedad, obs, now]);

  document.getElementById('mensaje').textContent = '✅ Novedad registrada correctamente';
  document.getElementById('codigoCliente').value = '';
  document.getElementById('nombreCliente').value = '';
  document.getElementById('novedad').value = '';
  document.getElementById('observaciones').value = '';

  setTimeout(() => {
    document.getElementById('mensaje').textContent = '';
  }, 3000);
}

// Descargar Excel con novedades
function descargarExcel() {
  if (novedadesRegistradas.length === 0) {
    alert("⚠️ No hay novedades registradas para descargar.");
    return;
  }

  const hoja = XLSX.utils.aoa_to_sheet([["Código", "Nombre", "Novedad", "Observaciones", "Fecha"], ...novedadesRegistradas]);
  const nuevoLibro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(nuevoLibro, hoja, "Novedades");
  XLSX.writeFile(nuevoLibro, "novedades_registradas.xlsx");
}
