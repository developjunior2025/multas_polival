/* js/pdf.js - PDF generation using jsPDF */

function generarActaPDF(multa) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });

    const pageW = 215.9;
    const pageH = 279.4;
    const margin = 14;
    const contentW = pageW - (margin * 2);

    // Colors
    const navy = [13, 27, 62];
    const gold = [168, 130, 42];
    const lightBlue = [200, 215, 255];
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    const gray = [100, 100, 100];

    let y = margin;

    // ===== OUTER BORDER =====
    doc.setDrawColor(...navy);
    doc.setLineWidth(1.2);
    doc.rect(margin - 4, y - 2, contentW + 8, pageH - (margin * 2) + 4);

    // ===== HEADER =====
    // Shield placeholder (blue circle)
    doc.setFillColor(...navy);
    doc.circle(margin + 10, y + 14, 12, 'F');
    doc.setFillColor(...gold);
    doc.circle(margin + 10, y + 14, 9, 'F');
    doc.setFillColor(...navy);
    doc.circle(margin + 10, y + 14, 6, 'F');

    // Header text block
    doc.setFillColor(...navy);
    doc.rect(margin + 25, y, contentW - 25, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...white);
    doc.text('INSTITUTO AUTÓNOMO DE POLICÍA DEL MUNICIPIO LOS GUAYOS', pageW / 2 + 12, y + 6.5, { align: 'center' });

    y += 10;
    doc.setFillColor(240, 244, 255);
    doc.rect(margin + 25, y, contentW - 25, 7, 'F');
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.3);
    doc.rect(margin + 25, y, contentW - 25, 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...black);
    doc.text('G-20009676-4', pageW / 2 + 12, y + 4.5, { align: 'center' });

    y += 7;
    doc.setFillColor(240, 244, 255);
    doc.rect(margin + 25, y, contentW - 25, 7, 'F');
    doc.setDrawColor(...navy);
    doc.rect(margin + 25, y, contentW - 25, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ESTADO CARABOBO', pageW / 2 + 12, y + 4.5, { align: 'center' });

    y += 7;
    doc.setFillColor(...navy);
    doc.rect(margin + 25, y, contentW - 25, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...gold);
    doc.text('ACTA DE INFRACCIÓN', pageW / 2 + 12, y + 5.5, { align: 'center' });

    y += 10;
    doc.setTextColor(...black);

    // ===== ACTA INFO ROW =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Nº: ${multa.numero_acta || '000000'}`, margin, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.text('Valor TCMMV:', margin + 70, y + 4);
    doc.setDrawColor(...gray);
    doc.setLineWidth(0.3);
    doc.line(margin + 95, y + 4, margin + 135, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.text('Importe de la multa Bs.:', margin + 137, y + 4);
    doc.line(margin + 170, y + 4, margin + contentW, y + 4);

    if (multa.valor_tcmmv) {
        doc.text(String(multa.valor_tcmmv), margin + 97, y + 4);
    }
    if (multa.importe_multa_bs) {
        doc.text(formatCurrency(multa.importe_multa_bs), margin + 172, y + 4);
    }

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('UT:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    if (multa.valor_ut) doc.text(String(multa.valor_ut), margin + 8, y + 4);

    doc.text('Fecha:', margin + 70, y + 4);
    doc.line(margin + 82, y + 4, margin + 120, y + 4);
    if (multa.fecha) {
        doc.text(formatDate(multa.fecha), margin + 84, y + 4);
    }

    doc.text('Hora:', margin + 123, y + 4);
    doc.line(margin + 133, y + 4, margin + 155, y + 4);
    if (multa.hora) doc.text(multa.hora.substring(0, 5), margin + 135, y + 4);

    const turno = multa.turno || 'AM';
    doc.text(`AM`, margin + 158, y + 4);
    if (turno === 'AM') {
        doc.setDrawColor(...navy);
        doc.rect(margin + 156, y, 10, 5);
    }
    doc.text(`PM`, margin + 172, y + 4);
    if (turno === 'PM') {
        doc.setDrawColor(...navy);
        doc.rect(margin + 170, y, 10, 5);
    }

    y += 10;
    // ===== SECTION: LUGAR DE LA INFRACCION =====
    drawSectionTitle(doc, 'Lugar de la Infracción', margin, y, contentW, navy, gold);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...black);
    doc.text('Dirección:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setLineWidth(0.3);
    doc.setDrawColor(...gray);
    doc.line(margin + 22, y + 4, margin + contentW, y + 4);

    if (multa.direccion_infraccion) {
        const wrappedDir = doc.splitTextToSize(multa.direccion_infraccion, contentW - 24);
        doc.text(wrappedDir[0], margin + 23, y + 4);
    }

    y += 8;
    doc.line(margin, y + 4, margin + contentW, y + 4);

    y += 10;
    // ===== SECTION: DATOS DEL INFRACTOR =====
    drawSectionTitle(doc, 'Datos del Infractor', margin, y, contentW, navy, gold);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Nombres:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 22, y + 4, margin + 85, y + 4);
    if (multa.nombres) doc.text(multa.nombres, margin + 23, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Cédula:', margin + 88, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 102, y + 4, margin + contentW, y + 4);
    if (multa.cedula) doc.text(multa.cedula, margin + 103, y + 4);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Apellidos:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 22, y + 4, margin + 85, y + 4);
    if (multa.apellidos) doc.text(multa.apellidos, margin + 23, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', margin + 88, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 104, y + 4, margin + contentW, y + 4);
    if (multa.telefono) doc.text(multa.telefono, margin + 105, y + 4);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Dirección:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 22, y + 4, margin + contentW, y + 4);
    if (multa.direccion_infractor) doc.text(multa.direccion_infractor.substring(0, 90), margin + 23, y + 4);

    y += 10;
    // ===== SECTION: DATOS DEL VEHICULO =====
    drawSectionTitle(doc, 'Datos del Vehículo', margin, y, contentW, navy, gold);
    y += 8;

    // Vehicle table header
    const vCols = [
        { label: 'Marca', w: 30 },
        { label: 'Modelo', w: 30 },
        { label: 'Año', w: 20 },
        { label: 'Tipo', w: 30 },
        { label: 'Color', w: 30 },
        { label: 'Matrícula', w: contentW - 140 }
    ];

    doc.setFillColor(...navy);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...white);

    let colX = margin + 2;
    vCols.forEach(col => {
        doc.text(col.label, colX + col.w / 2, y + 4.5, { align: 'center' });
        colX += col.w;
    });

    y += 7;
    doc.setFillColor(248, 249, 252);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...black);
    doc.setFontSize(9);
    colX = margin + 2;
    const vData = [multa.marca, multa.modelo, multa.anio, multa.tipo, multa.color, multa.matricula];
    vCols.forEach((col, i) => {
        if (vData[i]) doc.text(vData[i], colX + col.w / 2, y + 5, { align: 'center' });
        if (i < vCols.length - 1) {
            doc.setDrawColor(...gray);
            doc.line(colX + col.w, y, colX + col.w, y + 8);
        }
        colX += col.w;
    });

    y += 12;
    // ===== SECTION: FUNDAMENTO LEGAL =====
    drawSectionTitle(doc, 'Fundamento Legal', margin, y, contentW, navy, gold);
    y += 8;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...gray);
    doc.text('ORDENANZA SOBRE CONVIVENCIA CIUDADANA DEL MUNICIPIO LOS GUAYOS GACETA MUNICIPAL Nº 2084', margin, y + 3);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...black);
    doc.text('Art.:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(...gray);
    doc.setLineWidth(0.3);
    doc.line(margin + 10, y + 4, margin + 25, y + 4);
    if (multa.articulo_numero) doc.text(multa.articulo_numero, margin + 11, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Descripción de la Infracción:', margin + 28, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 80, y + 4, margin + contentW, y + 4);
    const descText = multa.descripcion_infraccion || multa.articulo_descripcion || '';
    if (descText) doc.text(descText.substring(0, 70), margin + 81, y + 4);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Literal:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 16, y + 4, margin + 30, y + 4);
    if (multa.articulo_literal) doc.text(multa.articulo_literal, margin + 17, y + 4);

    y += 10;
    // ===== SIGNATURES =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Funcionario:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(...gray);
    doc.setLineWidth(0.3);
    doc.line(margin + 24, y + 4, margin + 85, y + 4);
    if (multa.funcionario) doc.text(multa.funcionario, margin + 25, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Ciudadano:', margin + 90, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 110, y + 4, margin + contentW, y + 4);
    doc.text(`${multa.nombres || ''} ${multa.apellidos || ''}`.trim().substring(0, 40), margin + 111, y + 4);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('C.I.:', margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 10, y + 4, margin + 45, y + 4);
    if (multa.ci_funcionario) doc.text(multa.ci_funcionario, margin + 11, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Firma:', margin + 48, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 60, y + 4, margin + 85, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('C.I.:', margin + 90, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 100, y + 4, margin + 135, y + 4);
    if (multa.cedula) doc.text(multa.cedula, margin + 101, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Firma:', margin + 138, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.line(margin + 150, y + 4, margin + contentW, y + 4);

    y += 10;
    // ===== FOOTER =====
    doc.setFillColor(230, 235, 250);
    doc.rect(margin - 4, y, contentW + 8, 24, 'F');
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.rect(margin - 4, y, contentW + 8, 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...navy);
    y += 5;
    doc.text('PAGO MÓVIL: BANCO DE VENEZUELA (0102)', margin, y);
    y += 5;
    doc.text('TITULAR: INSTITUTO AUTÓNOMO DE POLICÍA DEL MUNICIPIO LOS GUAYOS (IAPMLG)', margin, y);
    y += 5;
    doc.text('RIF: G-20009676-4', margin, y);
    y += 5;
    doc.text('TELÉFONO: 0412 6710163', margin, y);
    doc.text('NÚMERO DE CUENTA CORRIENTE BANCO VENEZUELA: 0102-0358-91-00-01262119', margin + 60, y);

    // Watermark
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    doc.setTextColor(200, 210, 240);
    doc.text('POLICÍA', pageW / 2, pageH / 2 + 20, { align: 'center', angle: -45 });

    doc.save(`Acta_${multa.numero_acta || 'nueva'}.pdf`);
    showToast('success', 'PDF generado', `Acta Nº ${multa.numero_acta} exportada correctamente`);
}

function drawSectionTitle(doc, title, x, y, width, navy, gold) {
    doc.setFillColor(...navy);
    doc.rect(x, y, width, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.text(title, x + width / 2, y + 4.8, { align: 'center' });
}
