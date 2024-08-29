    "use client"

    import React, { useRef, useState } from 'react';
    import * as XLSX from 'xlsx'
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

    const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for the file input
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');

    const showSheetSelectionPopup = (data: any) => {
        Swal.fire({
          title: 'Select Row and Column',
          html: `
            <p>Select the row and column for the phone numbers:</p>
            <input id="col-input" type="text" placeholder="Column letter (e.g., A)" style="width: 100%; margin-top: 10px;" />
            <input id="row-input" type="number" placeholder="Starting Row number" min="1" style="width: 100%; margin-top: 10px;" />
          `,
          showCancelButton: true,
          confirmButtonText: 'Submit',
          preConfirm: () => {
            const row = (document.getElementById('row-input') as HTMLInputElement).value;
            const col = (document.getElementById('col-input') as HTMLInputElement).value.toUpperCase();
      
            // Validate inputs
            if (!row || !col || col.length !== 1 || !/^[A-Z]$/.test(col)) {
              Swal.showValidationMessage('Please enter valid row number and column letter.');
              return false;
            }
      
            return { row: parseInt(row), col: col };
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const { row, col } = result.value;
      
            // Convert column letter to numeric index (A=0, B=1, C=2, ...)
            const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);
      
            // Extract phone numbers from the specified column and starting from the selected row
            const phoneNumbers = data
              .map((r: any) => r[colIndex] ? r[colIndex].toString() : null) // Ensure values are strings
              .slice(row - 1) // Skip rows before the specified row
              .filter((val: any) => val) // Remove null/undefined values
              .map((num: string) => {
                // Transform phone numbers based on the rules
                if (num.startsWith('08')) {
                  return '62' + num.substring(1); // Replace '0' with '62'
                } else if (num.startsWith('8')) {
                  return '62' + num; // Prefix '62'
                }
                return num; // No change
              });
      
            if (phoneNumbers.length > 0) {
              setPhoneNumber(phoneNumbers.join(', ')); // Join phone numbers with commas
            } else {
              Swal.fire({
                title: 'Error!',
                text: 'No phone numbers found in the specified range.',
                icon: 'error',
                confirmButtonText: 'Ok',
              });
            }
          }
        });
      };
      
        
        

    // Validation function
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
            // Trigger popup for column and row selection
            showSheetSelectionPopup(jsonData);
            }
        };
        
        reader.readAsArrayBuffer(file);
        };
        
        const handleSubmit = async () => {
        if (!validateForm()) return;
        
        // Split the comma-separated phone numbers into an array
        const phoneNumbersArray = phoneNumber.split(',').map(num => num.trim());
        
        const promises = phoneNumbersArray.map(async (num) => {
            return await sendMessage({ recipient: num, message });
        });
        
        // Wait for all the requests to complete
        const results = await Promise.all(promises);
        
        // Check if all messages were sent successfully
        const allSuccess = results.every(r => r.error === "false");
        
        if (allSuccess) {
            setPhoneNumber('');
            setMessage('');
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
            // Handle error case if needed
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
        text: 'Apakah Yakin Untuk Mengirim Pesan ?',
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
    }).then((result) => {
        if (result.isConfirmed) {
        handleSubmit();  // Submit the form after confirmation
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
                ></CFormTextarea>
                </div>
                <CButton color="primary" type="submit">Send</CButton>
            </CForm>
            </CCardBody>
        </CCard>
        </CCol>
    </CRow>
    );
    };

    export default Message;
