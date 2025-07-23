// Buscar cliente por código (columna C = índice 2, nombre en columna D = índice 3)
function buscarCliente() {
  if (!baseCargada) {
    alert("⚠️ La base no está cargada.");
    return;
  }

  const codigo = document.getElementById("codigoCliente").value.trim();
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  const fila = datos.find(row => row[2] === codigo);
  if (fila) {
    document.getElementById("nombreCliente").value = fila[3] || "(sin nombre)";
  } else {
    document.getElementById("nombreCliente").value = "❌ No encontrado";
  }
}
