import React, { useState, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import './ReportPage.css';

function AccountStatement() {
  const [subNo, setSubNo] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [data, setData] = useState([]);
  const reportRef = useRef();
  const [accountOptions, setAccountOptions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);


  const fetchAccounts = async (inputValue) => {
  if (!inputValue) return;

  try {
    const res = await axios.get('http://100.65.29.19:5000/accounts', {
      params: { search: inputValue }
    });

    const options = res.data.map(acc => ({
      value: acc.sub_no.toString(),
      label: acc.name 
    }));

    setAccountOptions(options);
  } catch (err) {
    console.error("فشل في جلب الحسابات:", err);
  }
};


  const fetchReport = async () => {
    if (!subNo || !startDate || !endDate) {
      alert("يرجى إدخال رقم الحساب وتحديد الفترة");
      return;
    }

    try {
      const res = await axios.get('http://100.65.29.19:5000/account-statement', {
        params: {
          sub_no: subNo,
          fdate: startDate.toISOString().split('T')[0],
          ldate: endDate.toISOString().split('T')[0]
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("فشل في جلب البيانات");
    }
  };

  const handleSavePDF = () => {
    if (data.length === 0) {
      alert("لا يوجد بيانات للتصدير.");
      return;
    }

    const element = reportRef.current;
    const actionButtons = element.querySelectorAll('.no-print');
    actionButtons.forEach(btn => (btn.style.display = 'none'));

    const opt = {
      margin: 0.5,
      filename: `كشف-الحساب.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().finally(() => {
      actionButtons.forEach(btn => (btn.style.display = ''));
    });
  };

  const getSum = (key) => data.reduce((sum, item) => sum + (item[key] || 0), 0);

  return (
    <div className="report-container" ref={reportRef}>
      <h2 className="title">تقرير كشف حساب</h2>

      {/* إدخال البيانات */}
     <div className="controls no-print">
 <div className="row-group">
  <label><strong>اسم الحساب:</strong></label>
  <Select
    placeholder="اكتب اسم الحساب..."
    value={selectedAccount}
   onInputChange={(inputValue) => {
  fetchAccounts(inputValue);
  return inputValue;
}}

    onChange={(option) => {
      setSelectedAccount(option);
      setSubNo(option?.value || '');
    }}
    options={accountOptions}
    isClearable
  />
</div>


  <div className="row-group">
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

  <div className="row-group">
    <button className="primary-btn" onClick={fetchReport}>
      عرض التقرير
    </button>
  </div>
</div>

      {/* عرض الفترة */}
      {startDate && endDate && (
        <p className="report-period">
          <strong>الفترة:</strong> من <strong>{startDate.toLocaleDateString()}</strong> إلى <strong>{endDate.toLocaleDateString()}</strong>
        </p>
      )}

      {/* جدول البيانات */}
      <div className="table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>رقم القيد</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>البيان</th>
              <th>نوع العملية</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
               
                <td>{row.journal_no}</td>
                <td>{Number(row.journal_dr).toLocaleString()}</td>
                <td>{Number(row.journal_cr).toLocaleString()}</td>

                <td>{row.journal_desc}</td>
                <td>{row.operation_type}</td>
                <td>{new Date(row.journal_date).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div>
          <p><strong>المجموع:</strong> {('')}</p>
          <p><strong>رصيد الفترة:</strong> {Number(data[0]?.period_balance ?? 0).toLocaleString()}</p>
          <p><strong>الرصيد الكلي:</strong> {Number(data[0]?.overall_balance ?? 0).toLocaleString()}</p>

        </div>
      )}

      {/* زر تصدير */}
      {data.length > 0 && (
        <button className="export-btn no-print" onClick={handleSavePDF}>
          تصدير إلى PDF
        </button>
      )}
    </div>
  );
}

export default AccountStatement;
