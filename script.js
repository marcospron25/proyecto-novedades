let workbook;
let baseCargada = false;

// ADMIN - VERIFICAR CONTRASEÑA
function verificarAcceso() {
  const pass = document.getElementById('password').value;
  if (pass === 'primeralinea#') {
    document.getElementById('adminPanel').style.display = 'block';
  } else {
    alert('Contraseña incorrecta');
  }
}

// ADMIN - CARGAR BASE DESDE ARCHIVO
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

// USUARIO - REGISTRAR NOVEDAD
function registrarNovedad() {
  if (!baseCargada) {
    alert('⚠️ La base aún no está cargada');
    return;
  }

  const codigo = document.getElementById('codigoCliente').value.trim();
  const novedad = document.getElementById('novedad').value;
  const obs = document.getElementById('observaciones').value;

  if (!codigo || !novedad) {
    alert('⚠️ Completa todos los campos');
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
  datos.push([codigo, '', codigo, '', novedad, obs, now]);

  const nuevaHoja = XLSX.utils.aoa_to_sheet(datos);
  workbook.Sheets[workbook.SheetNames[0]] = nuevaHoja;

  document.getElementById('mensaje').textContent = '✅ Novedad registrada con éxito';

  document.getElementById('codigoCliente').value = '';
  document.getElementById('novedad').value = '';
  document.getElementById('observaciones').value = '';
}

// ADMIN - DESCARGAR ARCHIVO MODIFICADO
function descargarExcel() {
  if (!baseCargada) {
    alert('⚠️ No hay base cargada');
    return;
  }
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `base_actualizada_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
}
