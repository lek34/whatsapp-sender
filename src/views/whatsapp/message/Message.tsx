"use client"

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CInputGroup,
  CRow,
} from '@coreui/react-pro';
import { sendMessage } from 'src/api/sendMessage';

const Message = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [parametersData, setParametersData] = useState<string[][]>([]);

  const showSheetSelectionPopup = (data: any) => {
    Swal.fire({
      title: 'Select Rows and Columns',
      html: `
        <p>Select the row and columns for the phone numbers and Parameters 1-5:</p>
        <input id="col-input" type="text" placeholder="Column for phone numbers (e.g., A)" style="width: 100%; margin-top: 10px;" />
        <input id="param1-col-input" type="text" placeholder="Column for Parameter 1 (e.g., B)" style="width: 100%; margin-top: 10px;" />
        <input id="param2-col-input" type="text" placeholder="Column for Parameter 2 (e.g., C)" style="width: 100%; margin-top: 10px;" />
        <input id="param3-col-input" type="text" placeholder="Column for Parameter 3 (e.g., D)" style="width: 100%; margin-top: 10px;" />
        <input id="param4-col-input" type="text" placeholder="Column for Parameter 4 (e.g., E)" style="width: 100%; margin-top: 10px;" />
        <input id="param5-col-input" type="text" placeholder="Column for Parameter 5 (e.g., F)" style="width: 100%; margin-top: 10px;" />
        <input id="row-input" type="number" placeholder="Starting Row number" min="1" style="width: 100%; margin-top: 10px;" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      preConfirm: () => {
        const row = (document.getElementById('row-input') as HTMLInputElement).value;
        const col = (document.getElementById('col-input') as HTMLInputElement).value.toUpperCase();
        const paramCols = [
          (document.getElementById('param1-col-input') as HTMLInputElement).value.toUpperCase(),
          (document.getElementById('param2-col-input') as HTMLInputElement).value.toUpperCase(),
          (document.getElementById('param3-col-input') as HTMLInputElement).value.toUpperCase(),
          (document.getElementById('param4-col-input') as HTMLInputElement).value.toUpperCase(),
          (document.getElementById('param5-col-input') as HTMLInputElement).value.toUpperCase(),
        ];

        // Validate inputs
        if (!row || !col || col.length !== 1 || !/^[A-Z]$/.test(col) || paramCols.some(pc => pc && (pc.length !== 1 || !/^[A-Z]$/.test(pc)))) {
          Swal.showValidationMessage('Please enter valid row number and column letters.');
          return false;
        }

        return { row: parseInt(row), col, paramCols };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { row, col, paramCols } = result.value;

        const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);
        const paramColsIndexes = paramCols.map((col: string) => col ? col.charCodeAt(0) - 'A'.charCodeAt(0) : null);

        // Extract phone numbers and parameters data from the specified columns
        const phoneNumbers = data
          .map((r: any) => r[colIndex] ? r[colIndex].toString() : null)
          .slice(row - 1)
          .filter((val: any) => val)
          .map((num: string) => {
            if (num.startsWith('08')) {
              return '62' + num.substring(1);
            } else if (num.startsWith('8')) {
              return '62' + num;
            }
            return num;
          });

        const parametersData = data
          .slice(row - 1)
          .map((r: any) => paramColsIndexes.map((idx: string | number | null) => (idx !== null && r[idx]) ? r[idx].toString() : ''));

        if (phoneNumbers.length > 0 && parametersData.length > 0) {
          setPhoneNumber(phoneNumbers.join(', '));
          setParametersData(parametersData);
        } else {
          Swal.fire({
            title: 'Error!',
            text: 'No valid data found in the specified range.',
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        }
      }
    });
  };

  const validateForm = () => {
    if (phoneNumber.trim() === '' || message.trim() === '') {
      Swal.fire({
        title: 'Validation Error',
        text: 'Phone Number and Message cannot be empty!',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return false;
    }
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && typeof result === 'object') {
        const data = new Uint8Array(result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        showSheetSelectionPopup(jsonData);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const phoneNumbersArray = phoneNumber.split(',').map(num => num.trim());

    const promises = phoneNumbersArray.map(async (num, index) => {
      let personalizedMessage = message;
      parametersData[index].forEach((param, i) => {
        personalizedMessage = personalizedMessage.replace(`{Parameter${i + 1}}`, param || '');
      });
      return await sendMessage({ recipient: num, message: personalizedMessage });
    });

    const results = await Promise.all(promises);
    const allSuccess = results.every(r => r.error === "false");

    if (allSuccess) {
      setPhoneNumber('');
      setMessage('');
      setParametersData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      Swal.fire({
        title: 'Success!',
        text: 'All messages sent successfully!',
        icon: 'success',
        confirmButtonText: 'Ok',
      });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Some messages failed to send.',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
    }
  };

  const showAlert = () => {
    Swal.fire({
      title: 'Warning!',
      text: 'Apakah Yakin Untuk Mengirim Pesan?',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'No',
      confirmButtonText: 'Yes',
    }).then((result) => {
      if (result.isConfirmed) {
        handleSubmit();
      }
    });
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Send Message</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={(e) => { e.preventDefault(); showAlert(); }}>
              <div className="mb-3">
                <CFormLabel htmlFor="phoneNumber">Phone Number</CFormLabel>
                <CInputGroup className="mb-3">
                  <CFormInput type="file" id="fileInput" ref={fileInputRef} onChange={handleFileUpload} />
                  <CFormInput
                    type="text"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </CInputGroup>
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="message">Message</CFormLabel>
                <CFormTextarea
                  id="message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., Selamat pagi {Parameter1}, your appointment is on {Parameter2}."
                />
              </div>
              <CButton type="submit" color="primary">
                Send Message
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default Message;
