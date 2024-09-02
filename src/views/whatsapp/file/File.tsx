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
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CInputGroup,
  CRow,
} from '@coreui/react-pro';
import { sendFile } from 'src/api/sendFile';

const fileUploader = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for the file input
  const fileInputRefPdf = useRef<HTMLInputElement | null>(null); // Ref for the file input
  const [phoneNumber, setPhoneNumber] = useState('');
  const [file, setFile] = useState<File | null>(null); // Handle the image file
  const [loading, setLoading] = useState(false); // Loading state
  const [message, setMessage] = useState('');
  const [parametersData, setParametersData] = useState<string[][]>([]);
  const [resetChecked, setResetChecked] = useState(false);
  // Validation function
  const validateForm = () => {
    if (phoneNumber.trim() === '' || !file) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Phone Number and Image cannot be empty!',
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
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the file input
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };
  const handleFileUploadPdf = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pdf')) {
        Swal.fire({
          title: 'Invalid File Type',
          text: 'Please upload a valid image file (.pdf).',
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        if (fileInputRefPdf.current) {
          fileInputRefPdf.current.value = ''; 
        }
        return;
      }
      setFile(file); // Set the selected image file
    } else {
      setFile(null); // Clear the state if no file is selected
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true); // Start loading
    // Split the comma-separated phone numbers into an array
    const phoneNumbersArray = phoneNumber.split(',').map(num => num.trim());
    // Iterate over each phone number and send the image
    const promises = phoneNumbersArray.map(async (num, index) => {
      // Create a new FormData instance for each recipient
      let personalizedMessage = message;
      if (parametersData[index]) {
        parametersData[index].forEach((param, i) => {
          personalizedMessage = personalizedMessage.replace(`{Parameter${i + 1}}`, param || '');
        });
      }
      const formData = new FormData();
      formData.append('message', personalizedMessage);
      formData.append('recipient', num);
      formData.append('file', file as File);
      return await sendFile(formData);
    });

    // Wait for all the requests to complete
    const results = await Promise.all(promises);

    // Check if all images were sent successfully
    const allSuccess = results.every((r: { error: string }) => r.error === "false");

    setLoading(false); // Stop loading

    if (allSuccess) {
      setPhoneNumber('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setParametersData([]);
      if(resetChecked){
        setFile(null);
        setMessage('');
        if (fileInputRefPdf.current) {
          fileInputRefPdf.current.value = ''; // Clear the image file input
        }
      }
      
      
      
      Swal.fire({
        title: 'Success!',
        text: 'All files sent successfully!',
        icon: 'success',
        confirmButtonText: 'Ok',
      });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Some files failed to send.',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
    }
  };

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

  const showAlert = () => {
    Swal.fire({
      title: 'Warning!',
      text: 'Are you sure you want to send the file?',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonText: 'No',
      confirmButtonText: 'Yes',
    }).then((result) => {
      if (result.isConfirmed) {
        handleSubmit(); // Submit the form after confirmation
      }
    });
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Upload File</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={(e) => { e.preventDefault(); showAlert(); }}>
              <div className="mb-3">
                <CFormCheck id="flexCheckDefault" label="Reset"/>
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
                <CFormLabel htmlFor="image">File</CFormLabel>
                <CFormInput
                  type="file"
                  id="fileInputPdf"
                  ref={fileInputRefPdf}
                  onChange={handleFileUploadPdf}
                />
                
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="message">Message</CFormLabel>
                <CFormTextarea
                    id="message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                ></CFormTextarea>
                </div>
              <CButton color="primary" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send File'}
              </CButton>
              {loading && <div className="loading-indicator">Sending...</div>}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default fileUploader;
