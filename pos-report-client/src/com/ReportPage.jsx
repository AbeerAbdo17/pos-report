import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import './ReportPage.css';

function ReportPage() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [batches, setBatches] = useState([]);
  const reportRef = useRef(null);

  
  useEffect(() => {
    axios.get('http://100.70.131.12:5000/stores')
      .then(res => setStores(res.data))
      .catch(err => console.error(err));
  }, []);

  const fetchBatches = () => {
    if (!selectedStoreId) {
    alert("يرجى اختيار المخزن أولاً.");
    return;
  }
    if (selectedStoreId) {
      axios.get(`http://100.70.131.12:5000/batches/${selectedStoreId}`)
        .then(res => setBatches(res.data))
        .catch(err => console.error(err));
    }
  };

  const handleSavePDF = () => {
    if (batches.length === 0) {
      alert("لا يوجد بيانات للتصدير.");
      return;
    }

    const element = reportRef.current;

    const actionButtons = element.querySelectorAll('.no-print');
    actionButtons.forEach(btn => (btn.style.display = 'none'));

    const opt = {
      margin: 0.5,
      filename: `تقرير-المخزن.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().finally(() => {
      actionButtons.forEach(btn => (btn.style.display = ''));
    });
  };

  const selectedStoreName = stores.find(s => s.id === selectedStoreId)?.name;

  return (
    <div className="report-container" ref={reportRef}>
      <h2 className="title"> تقرير المخزن</h2>

      {/* تحديد المخزن */}
     <div className="controls no-print">
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <label htmlFor="storeSelect"><strong>اختر مخزن:</strong></label>
    <select
      id="storeSelect"
      onChange={e => setSelectedStoreId(e.target.value)}
      value={selectedStoreId}
    >
      <option value="" disabled>اختر من القائمة </option>
      {stores.map(store => (
        <option key={store.id} value={store.id}>{store.name}</option>
      ))}
    </select>
  </div>

  <button className="primary-btn" onClick={fetchBatches}>
    عرض التقرير
  </button>
</div>


      {/* اسم المخزن المعروض */}
      {selectedStoreName && (
        <p className="store-name">المخزن: <strong>{selectedStoreName}</strong></p>
      )}

      {/* جدول التقرير */}
      <div className="table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch, index) => (
              <tr key={index}>
                <td>{batch.item}</td>
                <td>{Number(batch.quantity ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* زر التصدير */}
      {batches.length > 0 && (
        <button className="export-btn no-print" onClick={handleSavePDF}> تصدير إلى PDF</button>
      )}
    </div>
  );
}

export default ReportPage;
