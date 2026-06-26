import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (headers, dataRows, title, filename) => {
  const doc = new jsPDF();
  
  doc.text(title, 14, 15);
  
  autoTable(doc, {
    head: [headers],
    body: dataRows,
    startY: 20,
    theme: 'grid',
    headStyles: {
      fillColor: [107, 94, 174], // #6b5eae (Kuiklo Primary Dark)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
  });

  doc.save(`${filename}.pdf`);
};
