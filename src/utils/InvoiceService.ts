import { jsPDF } from "jspdf";

export const generateInvoicePDF = (order: any) => {
    const doc = new jsPDF();
    
    // إضافة بيانات نجوم دلتا
    doc.setFont("helvetica", "bold");
    doc.text("Delta Stars Invoice", 10, 10);
    doc.text(`Order ID: ${order.id}`, 10, 20);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 30);
    
    // بيانات القيمة والضريبة (وفقاً للقانون السعودي)
    doc.text(`Total Amount: ${order.total} SAR`, 10, 40);
    doc.text(`VAT (15%): ${(order.total * 0.15).toFixed(2)} SAR`, 10, 50);
    
    // تنزيل الملف
    doc.save(`DeltaStars_Invoice_${order.id}.pdf`);
};
