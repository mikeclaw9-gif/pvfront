import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Filtros {
  [key: string]: string | undefined;
}

export function generarPdf(
  titulo: string,
  columnas: { label: string; dataKey: string }[],
  datos: Record<string, unknown>[],
  nombreArchivo: string,
  filtros?: Filtros,
) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(titulo, 14, 22);

  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);

  let startY = 36;
  if (filtros) {
    const filtrosActivos = Object.entries(filtros).filter(([, v]) => v);
    if (filtrosActivos.length > 0) {
      doc.setFontSize(9);
      doc.text(
        'Filtros: ' + filtrosActivos.map(([k, v]) => `${k}: ${v}`).join(' | '),
        14,
        startY,
      );
      startY += 6;
    }
  }

  const headers = columnas.map((c) => c.label);
  const rows = datos.map((item) =>
    columnas.map((c) => {
      const val = item[c.dataKey];
      if (c.dataKey === 'precioCompra' || c.dataKey === 'precioVenta') {
        return `$ ${Number(val).toFixed(2)}`;
      }
      if (c.dataKey === 'activo') {
        return val ? 'Activo' : 'Inactivo';
      }
      if (c.dataKey === 'rol') {
        const roles: Record<string, string> = {
          ROLE_ADMIN: 'Admin',
          ROLE_USER: 'Usuario',
          ROLE_VENDEDOR: 'Vendedor',
        };
        return roles[String(val)] || String(val);
      }
      if (c.dataKey === 'nombreCompleto') {
        return `${item.nombre ?? ''} ${item.apellido ?? ''}`.trim();
      }
      return String(val ?? '');
    }),
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
  });

  window.open(doc.output('bloburl'));
}
