import React, { useState, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ReportPage.css'; // ✅ استيراد تنسيقات الأزرار من ReportPage.css

function SalesReport() {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [report, setReport] = useState([]);
  const [totals, setTotals] = useState({});
  const reportRef = useRef();

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert("يرجى اختيار فترة زمنية أولاً");
      return;
    }

    try {
      const res = await axios.get('http://100.65.29.19:5000/sales-report', {
        params: {
          fdate: startDate.toISOString().split('T')[0],
          ldate: endDate.toISOString().split('T')[0],
        }
      });
      setReport(res.data.data);
      setTotals(res.data.totals);
    } catch (err) {
      alert('فشل في جلب البيانات');
    }
  };

  const handleSavePDF = () => {
    if (report.length === 0) {
      alert("لا يوجد بيانات للتصدير.");
      return;
    }

    const element = reportRef.current;
    const actionButtons = element.querySelectorAll('.no-print');
    actionButtons.forEach(btn => (btn.style.display = 'none'));

    const opt = {
      margin: 0.5,
      filename: `تقرير-المبيعات.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().finally(() => {
      actionButtons.forEach(btn => (btn.style.display = ''));
    });
  };

  return (
    <div className="report-container" ref={reportRef}>
      <h2 className="title">تقرير المبيعات</h2>

{/* تقويم اختيار الفترة الزمنية + زر عرض التقرير */}
<div className="controls no-print">
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <label><strong>الفترة:</strong></label>
    <DatePicker
      selectsRange
      startDate={startDate}
      endDate={endDate}
      onChange={(update) => setDateRange(update)}
      isClearable={true}
      withPortal
      dateFormat="yyyy-MM-dd"
      placeholderText="اختر الفترة"
    />
  </div>
  <button className="primary-btn" onClick={fetchReport}>
    عرض التقرير
  </button>
</div>




      {/* عرض فترة التقرير */}
      {startDate && endDate && (
        <p className="report-period">
          <strong>الفترة:</strong> من <strong>{startDate.toLocaleDateString()}</strong> إلى <strong>{endDate.toLocaleDateString()}</strong>
        </p>
      )}

      {/* جدول التقرير */}
      <div className="table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>إجمالي البيع</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row, index) => (
              <tr key={index}>
                <td>{row.item_name}</td>
                <td>{row.total_qty}</td>
                <td>{Number(row.total_sales).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>الجملة</th>
              <th>{Number(totals.total_qty ?? 0).toLocaleString()}</th>
              <th>{Number(totals.total_sales ?? 0).toLocaleString()}</th>

            </tr>
          </tfoot>
        </table>
      </div>

      {/* زر تصدير PDF */}
      {report.length > 0 && (
        <button className="export-btn no-print" onClick={handleSavePDF}>
          تصدير إلى PDF
        </button>
      )}
    </div>
  );
}

export default SalesReport;
