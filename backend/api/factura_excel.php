<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
requerirRol('usuario');

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$entrada = file_get_contents("php://input");
$datos = json_decode($entrada, true);
if (!$datos) {
    http_response_code(400);
    echo json_encode(['error' => 'No se recibieron datos']);
    exit;
}

$factura = $datos['factura'] ?? [];
$partidas = $datos['items'] ?? [];
$cliente = $datos['cliente'] ?? [];
$configuracion = $datos['config'] ?? [];
$formaPago = $datos['forma_pago'] ?? 'Transferencia bancaria';

$libro = new Spreadsheet();
$libro->getDefaultStyle()->getFont()->setName('Times New Roman');
$libro->getDefaultStyle()->getFont()->setSize(10);
$hoja = $libro->getActiveSheet();
$hoja->setTitle('Factura');

$estiloNegrita = ['font' => ['bold' => true]];
$estiloCentrado = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]];
$estiloDerecha = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
$estiloIzquierda = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]];
$estiloBordeFino = ['borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]];

$hoja->getColumnDimension('A')->setWidth(15);
$hoja->getColumnDimension('B')->setWidth(35);
$hoja->getColumnDimension('C')->setWidth(10);
$hoja->getColumnDimension('D')->setWidth(13);
$hoja->getColumnDimension('E')->setWidth(12);
$hoja->getColumnDimension('F')->setWidth(15);
$hoja->getColumnDimension('G')->setWidth(22);

// Bloque Cabecera (Filas 1-3)
$empresaNombre = trim(($configuracion['nombre_empresa'] ?? 'DECOREFORM.A.B.'));
$empresaEmail = $configuracion['email_empresa'] ?? '';
$numero = $factura['numero_factura'] ?? '000/00';
$fecha = $factura['fecha_factura'] ?? date('d/m/Y');

$hoja->mergeCells('A1:D2');
$hoja->getStyle('A1')->applyFromArray([
    'font' => ['color' => ['rgb' => '17365D'], 'bold' => true, 'size' => 22, 'underline' => true],
    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER]
]);

if (!empty($configuracion['logo_url'])) {
    // Es posible que sea base64
    $data = explode(',', $configuracion['logo_url']);
    if (count($data) > 1) {
        $base64 = $data[1];
        $tmpfile = sys_get_temp_dir() . '/' . uniqid() . '.png';
        file_put_contents($tmpfile, base64_decode($base64));
        
        $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
        $drawing->setName('Logo');
        $drawing->setDescription('Logo');
        $drawing->setPath($tmpfile);
        $drawing->setCoordinates('A1');
        $drawing->setHeight(50);
        $drawing->setWorksheet($hoja);
        
        // Limpiamos el texto debajo si hay logo
        $hoja->setCellValue('A1', '');
    }
} else {
    $hoja->setCellValue('A1', $empresaNombre);
}

$hoja->setCellValue('A3', 'Email: ' . $empresaEmail);
$hoja->mergeCells('A3:D3');
$hoja->getStyle('A3')->applyFromArray(['font' => ['color' => ['rgb' => '0000FF'], 'underline' => true]]);

$hoja->setCellValue('E1', 'FACTURA');
$hoja->mergeCells('E1:F1');
$hoja->getStyle('E1')->applyFromArray(array_merge($estiloNegrita, $estiloCentrado));

$hoja->setCellValueExplicit('E2', $numero, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
$hoja->mergeCells('E2:F2');
$hoja->getStyle('E2')->applyFromArray($estiloCentrado);

$hoja->setCellValue('E3', $fecha);
$hoja->mergeCells('E3:F3');
$hoja->getStyle('E3')->applyFromArray($estiloCentrado);

$hoja->setCellValue('G1', 'FACTURA');
$hoja->mergeCells('G1:G3');
$hoja->getStyle('G1:G3')->applyFromArray(array_merge($estiloNegrita, $estiloCentrado, $estiloBordeFino, ['font' => ['size' => 16], 'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EAEAEA']]]));
$hoja->getStyle('G1:G3')->getAlignment()->setShrinkToFit(true);
$hoja->getStyle('G1:G3')->getAlignment()->setWrapText(false);

// Bordes finos 
$hoja->getStyle('A1:F3')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);

// Datos del Cliente (Filas 5-7)
$filaC = 5;
$hoja->setCellValue('A'.$filaC, 'Cliente:  ' . ($cliente['nombre'] ?? ''));
$hoja->mergeCells('A'.$filaC.':C'.$filaC);
$hoja->setCellValue('D'.$filaC, 'C.I.F:/D.N.I:  ' . ($cliente['cif_dni'] ?? ''));
$hoja->mergeCells('D'.$filaC.':G'.$filaC);

$filaC++; // 6
$hoja->setCellValue('A'.$filaC, 'Dirección:  ' . ($cliente['direccion'] ?? ''));
$hoja->mergeCells('A'.$filaC.':C'.$filaC);
$hoja->setCellValue('D'.$filaC, 'Población:  ' . ($cliente['poblacion'] ?? ''));
$hoja->mergeCells('D'.$filaC.':E'.$filaC);
$hoja->setCellValue('F'.$filaC, 'Ciudad:  ' . ($cliente['ciudad'] ?? ''));
$hoja->mergeCells('F'.$filaC.':G'.$filaC);

$filaC++; // 7
$hoja->setCellValue('A'.$filaC, 'Email:  ' . ($cliente['email'] ?? ''));
$hoja->mergeCells('A'.$filaC.':B'.$filaC);
$hoja->setCellValue('C'.$filaC, 'C.P.:  ' . ($cliente['codigo_postal'] ?? ''));
$hoja->mergeCells('C'.$filaC.':D'.$filaC);
$hoja->setCellValue('E'.$filaC, 'Obra:  ' . ($factura['nombre_obra'] ?? ''));
$hoja->mergeCells('E'.$filaC.':G'.$filaC);

$hoja->getStyle("A5:G7")->applyFromArray([
    'font' => ['bold' => true, 'size' => 11]
]);

$hoja->getStyle('A5:C5')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
$hoja->getStyle('D5:G5')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
$hoja->getStyle('A6:C6')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
$hoja->getStyle('D6:E6')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
$hoja->getStyle('F6:G6')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
$hoja->getStyle('A7:B7')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
$hoja->getStyle('C7:D7')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);
$hoja->getStyle('E7:G7')->getBorders()->getOutline()->setBorderStyle(Border::BORDER_THIN);

// Cabecera Tabla (Fila 9)
$filaT = 9;
$hoja->setCellValue('A'.$filaT, 'Descripción');
$hoja->mergeCells("A$filaT:D$filaT");
$hoja->setCellValue('E'.$filaT, 'Ud/M2');
$hoja->setCellValue('F'.$filaT, 'Precio');
$hoja->setCellValue('G'.$filaT, 'Importe');

$hoja->getStyle("A$filaT:G$filaT")->applyFromArray(array_merge($estiloNegrita, $estiloCentrado, $estiloBordeFino, ['fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EAEAEA']]]));

$filaActual = 10;
$totalBruto = 0;
$sumFormulaParts = [];

foreach ($partidas as $item) {
    if (empty($item['descripcion']) && empty($item['cantidad']) && empty($item['precio_unitario'])) continue;
    
    $cantidad = floatval($item['cantidad'] ?? 0);
    $precio = floatval($item['precio_unitario'] ?? 0);
    $importe = $cantidad * $precio;
    
    // Excluir de la suma si es un campo de "subtotal" o "suma informativa"
    $descMayus = strtoupper($item['descripcion'] ?? '');
    $esSuma = false;
    foreach (['SUMA', 'RESTO', 'SUBTOTAL', 'TOTAL'] as $palabraClave) {
        if (strpos($descMayus, $palabraClave) === 0) {
            $esSuma = true;
            break;
        }
    }

    if (!$esSuma) {
        $totalBruto += $importe;
        if ($cantidad > 0 && $precio > 0) {
            $sumFormulaParts[] = "G$filaActual";
        }
    }

    $hoja->setCellValue('A'.$filaActual, $item['descripcion'] ?? '');
    $hoja->mergeCells("A$filaActual:D$filaActual");
    $hoja->setCellValue('E'.$filaActual, $cantidad > 0 ? $cantidad : '');
    $hoja->setCellValue('F'.$filaActual, $precio > 0 ? $precio : '');
    
    if ($cantidad > 0 && $precio > 0) {
        $hoja->setCellValue('G'.$filaActual, "=E$filaActual*F$filaActual");
    } else {
        $hoja->setCellValue('G'.$filaActual, $importe > 0 ? $importe : '');
    }

    $hoja->getStyle('F'.$filaActual.':G'.$filaActual)->getNumberFormat()->setFormatCode('#,##0.00 €');
    
    // Activa ajuste automático de texto
    $hoja->getStyle("A$filaActual:D$filaActual")->getAlignment()->setWrapText(true);
    
    $hoja->getStyle("A$filaActual:D$filaActual")->applyFromArray([
        'font' => ['size' => 11],
        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT]
    ]);
    $hoja->getStyle("E$filaActual:G$filaActual")->applyFromArray($estiloCentrado);
    $hoja->getRowDimension($filaActual)->setRowHeight(-1);

    $hoja->getStyle("A$filaActual:G$filaActual")->applyFromArray([
        'borders' => [
            'bottom' => [
                'borderStyle' => Border::BORDER_HAIR,
                'color' => ['rgb' => 'D0D0D0']
            ]
        ]
    ]);
    
    $hoja->getStyle("A$filaActual")->getBorders()->getLeft()->setBorderStyle(Border::BORDER_MEDIUM);
    $hoja->getStyle("G$filaActual")->getBorders()->getRight()->setBorderStyle(Border::BORDER_MEDIUM);

    // Fila separadora entre partidas
    $filaActual++;
    $hoja->mergeCells("A$filaActual:G$filaActual");
    $hoja->getRowDimension($filaActual)->setRowHeight(8);
    $hoja->getStyle("A$filaActual")->getBorders()->getLeft()->setBorderStyle(Border::BORDER_MEDIUM);
    $hoja->getStyle("G$filaActual")->getBorders()->getRight()->setBorderStyle(Border::BORDER_MEDIUM);
    $hoja->getStyle("A$filaActual:G$filaActual")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THIN);
    $hoja->getStyle("A$filaActual:G$filaActual")->getBorders()->getBottom()->getColor()->setRGB('EAEAEA');

    $filaActual++;
}

// Calcular totales
$ivaPorcentaje = floatval($factura['iva_porcentaje'] ?? 21);
$ivaImporte = $totalBruto * ($ivaPorcentaje / 100);
$totalGeneral = $totalBruto + $ivaImporte;
$cuentaBancaria = $configuracion['cuenta_bancaria'] ?? '';

$f1 = $configuracion['nombre_ceo'] ?? '';
$f2 = $configuracion['cif_dni'] ?? '';
$f3 = $configuracion['direccion'] ?? '';
$f4 = $configuracion['telefono'] ?? '';
$f5 = $configuracion['poblacion'] ?? '';
$textoPie = sprintf("%s %s   DIRECCIÓN %s %s   TELÉFONO %s", $f1, $f2, $f3, $f5, $f4);

$formato = $datos['format'] ?? 'excel';

if ($formato === 'pdf') {
    while (ob_get_level()) { ob_end_clean(); }
    error_reporting(0);
    $hoja->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_PORTRAIT);
    $hoja->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
    $writerHtml = new \PhpOffice\PhpSpreadsheet\Writer\Html($libro);
    $writerHtml->setUseInlineCss(true);
    ob_start();
    $writerHtml->save('php://output');
    $htmlBody = ob_get_clean();
    // CSS: tabla de contenido SIN border-bottom (queda abierta por abajo para unirse al footer)
    $cssExtra = '<style>table{border-collapse:collapse;width:100%;border-left:2px solid #000;border-right:2px solid #000;border-top:2px solid #000}td{border:1px solid #ccc;padding:3px}tr{border-bottom:1px solid #D0D0D0}</style>';
    $htmlBody = str_replace('</head>', $cssExtra.'</head>', $htmlBody);
    if (strpos($htmlBody,'</head>')===false) { $htmlBody = $cssExtra.$htmlBody; }

    // Footer de 3 filas ≈ 30mm, más margen
    $footerH = 32;
    $mpdf = new \Mpdf\Mpdf(['format'=>'A4','margin_top'=>10,'margin_right'=>10,'margin_bottom'=>10,'margin_left'=>10,'tempDir'=>sys_get_temp_dir()]);
    $mpdf->WriteHTML($htmlBody);

    // Calcular espacio libre hasta el fondo de la página
    $libre = ($mpdf->h - $mpdf->bMargin) - $mpdf->y;
    if ($libre < $footerH) {
        $mpdf->AddPage();
        $libre = ($mpdf->h - $mpdf->bMargin) - $mpdf->y;
    }
    $gap = $libre - $footerH;

    // Div espaciador: solo bordes LATERALES para cerrar el rectángulo visualmente
    if ($gap > 0) {
        $mpdf->WriteHTML('<div style="height:'.round($gap,2).'mm;border-left:2px solid #000;border-right:2px solid #000;margin:0;padding:0;font-size:0;line-height:0"> </div>');
    }

    $tb = number_format($totalBruto,2,',','.').' €';
    $iv = number_format($ivaImporte,2,',','.').' €';
    $tg = number_format($totalGeneral,2,',','.').' €';
    $ip = number_format($ivaPorcentaje,2).'%';

    // Footer: cierra el rectángulo por abajo (border completo)
    $mpdf->WriteHTML('
    <table width="100%" style="border-collapse:collapse;border-left:2px solid #000;border-right:2px solid #000;border-bottom:2px solid #000;border-top:1px solid #ccc;font-family:Times New Roman">
      <tr>
        <td style="background:#EAEAEA;border:1px solid #000;padding:4px;font-weight:bold;text-align:center;font-size:9pt">Total Bruto</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;font-size:9pt">'.$tb.'</td>
        <td style="background:#EAEAEA;border:1px solid #000;padding:4px;font-weight:bold;text-align:center;font-size:9pt">IVA: '.$ip.'</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;font-size:9pt">'.$iv.'</td>
        <td style="background:#EAEAEA;border:1px solid #000;padding:4px;font-weight:bold;text-align:center;font-size:9pt">Total</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;font-size:9pt">'.$tg.'</td>
      </tr>
      <tr>
        <td style="background:#EAEAEA;border:1px solid #000;padding:4px;font-weight:bold;text-align:center;font-size:9pt">Forma de Pago</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;font-size:9pt">'.htmlspecialchars($formaPago).'</td>
        <td colspan="2" style="background:#EAEAEA;border:1px solid #000;padding:4px;font-weight:bold;text-align:center;font-size:9pt">Numero de cuenta</td>
        <td colspan="2" style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;font-size:9pt">'.htmlspecialchars($cuentaBancaria).'</td>
      </tr>
      <tr>
        <td colspan="6" style="text-align:center;font-size:8pt;font-weight:bold;color:#333;background:#F2F2F2;padding:5px;border-left:2px solid #000;border-right:2px solid #000;border-bottom:2px solid #000;border-top:1px solid #A0A0A0">'.htmlspecialchars($textoPie).'</td>
      </tr>
    </table>');

    
    header('Content-Type: application/pdf');
    $nombreArchivoNum = $numero !== '000/00' ? str_replace('/', '-', $numero) : 'Borrador';
    header('Content-Disposition: attachment;filename="Factura_' . $nombreArchivoNum . '.pdf"');
    $mpdf->Output($nombreArchivoNum . '.pdf', 'D');
    exit;
} else {
    $hoja->getStyle("A$filaActual:G$filaActual")->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN);
    $hoja->getRowDimension($filaActual)->setRowHeight(20);
    $hoja->setCellValue('A'.$filaActual, 'Total Bruto');
    if (count($sumFormulaParts) > 0) { $hoja->setCellValue('B'.$filaActual, "=" . implode("+", $sumFormulaParts)); }
    else { $hoja->setCellValue('B'.$filaActual, 0); }
    $hoja->getStyle('B'.$filaActual)->getNumberFormat()->setFormatCode('#,##0.00 €');
    $hoja->setCellValue('C'.$filaActual, 'IVA');
    $hoja->setCellValue('D'.$filaActual, $ivaPorcentaje / 100);
    $hoja->getStyle('D'.$filaActual)->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_PERCENTAGE_00);
    $hoja->setCellValue('E'.$filaActual, "=B$filaActual*D$filaActual");
    $hoja->getStyle('E'.$filaActual)->getNumberFormat()->setFormatCode('#,##0.00 €');
    $hoja->setCellValue('F'.$filaActual, 'Total');
    $hoja->setCellValue('G'.$filaActual, "=B$filaActual+E$filaActual");
    $hoja->getStyle('G'.$filaActual)->getNumberFormat()->setFormatCode('#,##0.00 €');
    $hoja->getStyle("A$filaActual:G$filaActual")->applyFromArray(array_merge($estiloBordeFino, $estiloNegrita, $estiloCentrado));
    $fondoGris = ['fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EAEAEA']]];
    $hoja->getStyle('A'.$filaActual)->applyFromArray($fondoGris);
    $hoja->getStyle('C'.$filaActual)->applyFromArray($fondoGris);
    $hoja->getStyle('F'.$filaActual)->applyFromArray($fondoGris);
    $filaActual++;
    $hoja->getRowDimension($filaActual)->setRowHeight(20);
    $hoja->setCellValue('A'.$filaActual, 'Forma de Pago');
    $hoja->setCellValue('B'.$filaActual, $formaPago);
    $hoja->setCellValue('C'.$filaActual, 'Numero de cuenta');
    $hoja->mergeCells("C$filaActual:D$filaActual");
    $hoja->setCellValue('E'.$filaActual, $cuentaBancaria);
    $hoja->mergeCells("E$filaActual:G$filaActual");
    $hoja->getStyle("A$filaActual:G$filaActual")->applyFromArray(array_merge($estiloBordeFino, $estiloCentrado));
    $hoja->getStyle('A'.$filaActual)->applyFromArray($estiloNegrita);
    $hoja->getStyle('C'.$filaActual)->applyFromArray($estiloNegrita);
    $hoja->getStyle('E'.$filaActual)->applyFromArray($estiloNegrita);
    $hoja->getStyle('A'.$filaActual)->applyFromArray($fondoGris);
    $hoja->getStyle("C$filaActual:D$filaActual")->applyFromArray($fondoGris);
    $filaActual++;
    $hoja->setCellValue('A'.$filaActual, $textoPie);
    $hoja->mergeCells("A$filaActual:G$filaActual");
    $hoja->getStyle("A$filaActual")->applyFromArray([
        'font' => ['size' => 8, 'bold' => true, 'color' => ['rgb' => '333333']],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F2F2F2']],
        'borders' => ['top' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'A0A0A0']], 'bottom' => ['borderStyle' => Border::BORDER_MEDIUM], 'left' => ['borderStyle' => Border::BORDER_MEDIUM], 'right' => ['borderStyle' => Border::BORDER_MEDIUM]]
    ]);
    $hoja->getRowDimension($filaActual)->setRowHeight(20);
    $hoja->getStyle("A1:G$filaActual")->getBorders()->getOutline()->setBorderStyle(Border::BORDER_MEDIUM);
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    $nombreArchivoNum = $numero !== '000/00' ? str_replace('/', '-', $numero) : 'Borrador';
    header('Content-Disposition: attachment;filename="Factura_' . $nombreArchivoNum . '.xlsx"');
    $escritor = new Xlsx($libro);
    $escritor->save('php://output');
    exit;
}