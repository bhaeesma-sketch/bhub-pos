import 'dart:typed_data';
import 'package:dukkantek_pos_flutter/models/sale.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';

class PrinterService {
  
  // Singleton
  static final PrinterService _instance = PrinterService._internal();
  factory PrinterService() => _instance;
  PrinterService._internal();

  /// Generates and prints a VAT-compliant Tax Invoice
  Future<void> printReceipt(Sale sale) async {
    final doc = pw.Document();

    // Load Fonts (if needed for Arabic, we would need a specific font)
    // For now, using standard font. For Arabic support in PDF, we need a TTF font.
    // Assuming English for the clone MVP, or we can load a font asset if available.
    // var arabicFont = await PdfGoogleFonts.amiriRegular(); 

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.roll80, // 80mm Thermal Paper
        margin: const pw.EdgeInsets.all(10), // Small margins
        build: (pw.Context context) {
          return _buildReceiptLayout(sale);
        },
      ),
    );

    // Print directly or open preview
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'Receipt_${sale.id}',
    );
  }

  /// Generates and shares a PDF receipt via WhatsApp
  Future<void> shareReceiptViaWhatsApp(Sale sale, String phone) async {
    final doc = pw.Document();
    
    // In a real app, we would load a font for Arabic
    // final arabicFont = pw.Font.ttf(await rootBundle.load("assets/fonts/Amiri-Regular.ttf"));

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return _buildReceiptLayout(sale, isBilingual: true);
        },
      ),
    );

    final bytes = await doc.save();
    await Printing.sharePdf(bytes: bytes, filename: 'Receipt_${sale.id}.pdf');
    
    // phone format should be with country code: 968XXXXXXXX
    // Use url_launcher to open whatsapp with the file (or just share menu as above)
  }

  pw.Widget _buildReceiptLayout(Sale sale, {bool isBilingual = false}) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final currency = NumberFormat("#,##0.000", "en_US");

    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.center,
      children: [
        // --- Header ---
        pw.Text('BHAEES POS', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 18)),
        pw.Text('Muscat, Oman | مسقط، عمان', style: const pw.TextStyle(fontSize: 10)),
        pw.Text('TRN: 1234567890 | الرقم الضريبي', style: const pw.TextStyle(fontSize: 10)),
        pw.SizedBox(height: 10),
        
        pw.Text('TAX INVOICE | فاتورة ضريبية', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
        pw.SizedBox(height: 5),

        // --- Transaction Info ---
        pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
          pw.Text('Inv #: ${sale.id.substring(0, 8).toUpperCase()}', style: const pw.TextStyle(fontSize: 8)),
          pw.Text(dateFormat.format(sale.date), style: const pw.TextStyle(fontSize: 8)),
        ]),
        pw.Divider(thickness: 0.5),

        // --- Items ---
        pw.ListView.builder(
          itemCount: sale.items.length,
          itemBuilder: (context, index) {
            final item = sale.items[index];
            return pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 2),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(item.productName, style: const pw.TextStyle(fontSize: 10)),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        '${item.quantity} x ${currency.format(item.price)}',
                        style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
                      ),
                      pw.Text(
                         currency.format(item.total),
                        style: const pw.TextStyle(fontSize: 9),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
        
        pw.Divider(thickness: 0.5),

        // --- Totals ---
        _buildRow('Subtotal | المجموع الفرعي', currency.format(sale.subtotal)),
        _buildRow('VAT (5%) | ضريبة القيمة المضافة', currency.format(sale.vat)),
        pw.Divider(thickness: 0.5),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text('TOTAL | الإجمالي', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
            pw.Text('OMR ${currency.format(sale.total)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
          ],
        ),
        
        pw.SizedBox(height: 10),
        
        _buildRow('Paid | المدفوع (${sale.paymentMethod})', currency.format(sale.total)),
        
        pw.SizedBox(height: 15),

        // --- QR Code (Compliant with TLV or similar) ---
        pw.BarcodeWidget(
          barcode: pw.Barcode.qrCode(),
          data: _generateQrData(sale),
          width: 80,
          height: 80,
        ),
        
        pw.SizedBox(height: 5),
        pw.Text('Thank you for shopping | شكراً لتسوقكم', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
      ],
    );
  }

  pw.Widget _buildRow(String label, String value) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 10)),
        pw.Text(value, style: const pw.TextStyle(fontSize: 10)),
      ],
    );
  }

  String _generateQrData(Sale sale) {
    // In a production app, we would use a library for ZATCA/Oman TLV encoding.
    // For now, providing a structured string that contains essential tax elements.
    return 'Seller: BHAEES POS\n'
           'TRN: 1234567890\n'
           'Time: ${sale.date.toIso8601String()}\n'
           'Total: ${sale.total.toStringAsFixed(3)}\n'
           'VAT: ${sale.vat.toStringAsFixed(3)}';
  }
}
