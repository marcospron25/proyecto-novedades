let workbook;
let baseCargada = false;

// Mostrar/ocultar panel de login admin
function toggleAdmin() {
  const login = document.getElementById('adminLogin');
  login.style.display = login.style.display === 'none' ? 'block' : 'none';
}

// Verificar contraseña
function verificarAcceso() {
  const pass = document.getElementById('password').value;
  if (pass === 'primeralinea#') {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminLogin').style.display = 'none';
  } else {
    alert('Contraseña incorrecta');
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

// Buscar cliente por código
function buscarCliente() {
  const codigo = document.getElementById('codigoCliente').value.trim();
  if (!baseCargada) {
    alert("⚠️ La base no está cargada");
    return;
  }

  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });
  const fila = datos.find(row => row[2] === codigo);
  
  if (fila) {
    document.getElementById('nombreCliente').value = fila[3] || "(sin nombre)";
  } else {
    document.getElementById('nombreCliente').value = "❌ No encontrado";
  }
}

// Registrar novedad
function registrarNovedad() {
  if (!baseCargada) {
    alert('⚠️ La base aún no está cargada');
    return;
  }

  const codigo = document.getElementById('codigoCliente').value.trim();
  const novedad = document.getElementById('novedad').value;
  const obs = document.getElementById('observaciones').value;
  const nombre = document.getElementById('nombreCliente').value;

  if (!codigo || !novedad) {
    alert('⚠️ Completa todos los campos obligatorios');
    return;
  }

  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  const existe = datos.some(row => row[2] === codigo);
  if (!existe) {
    alert('❌ Código no encontrado en la base');
    return;
  }

  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  datos.push([codigo, nombre, novedad, obs, now]);

  const nuevaHoja = XLSX.utils.aoa_to_sheet(datos);
  workbook.Sheets[workbook.SheetNames[0]] = nuevaHoja;

  document.getElementById('mensaje').textContent

