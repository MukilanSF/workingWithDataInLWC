import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getBookingRecord from "@salesforce/apex/CreatePaymentBatchController.getBookingRecord";
import CreatePaymentBatch from "@salesforce/apex/CreatePaymentBatchController.CreatePaymentBatch";
import getPaymentRecordData from "@salesforce/apex/CreatePaymentBatchController.getPaymentRecordData";
import { CurrentPageReference } from 'lightning/navigation';
export default class PaymentBatchLWC extends NavigationMixin(LightningElement) {
    selectedPaymentMethod = '';
    pisDate = '';
    pisNumber = 0;
    bankAcc = '';
    notes = '';
    event = '';
    totalAmt = 0;
    eventName;
    eventlink;
    differenceerror = false;
    errorMessage;
    errorthroughMessage;
    searchKeyword = '';

    @track batchTotalAmount = 0;
    @track TotalAmountEntered = 0;
    @track differenceAmount = 0;
    @track AmountDueError=false;
    @track inputAmountpaid;
    @track selectedRecordsCount = 0;


    get options() {
        return [
            { label: "--None--", value: "" },
            { label: 'BACS', value: 'BACS' },
            { label: "Cash", value: "Cash" },
            { label: 'Card', value: 'Card' },
            { label: 'Cheque', value: 'Cheque' },
            { label: 'Direct Debit', value: 'Direct Debit' },
            { label: 'Standing Order', value: 'Standing Order' },
            { label: 'Web', value: 'Web' },
            { label: 'Voucher', value: 'Voucher' },
        ];
    }

    @api recordId;
    // @api getPaymentRecordData;
    @track bookingRecords = [];
    @track PaymentBatchRecord = {
        paymentMethod: this.selectedPaymentMethod,
        PISDate: this.pisDate,
        PISNumber: this.pisNumber,
        BankAccount: this.bankAcc,
        Notes: this.notes,
        Event: this.recordId,
        TotalAmount: this.totalAmt
    };

    //@track TotalAmount;
    @api eventBookingRecords = [];

    //for pagination
    currentPage = 1;
    totalPages = 1;
    TotalRecord = 0;

    methodHandler(event) {
        this.selectedPaymentMethod = event.target.value;
        console.log('method=>', this.selectedPaymentMethod);
    }
    handleVoucherDate(event) {
        this.pisDate = event.target.value;
        console.log('date=>', this.pisDate);
    }
    // handleVoucherDateButton(event){
    //     console.log('event=>',event);
    //     clg
    // }
    handleVoucherNumber(event) {
        this.pisNumber = event.target.value;
        console.log('number=>', this.pisNumber);
    }
    handleBankAccChange(event) {
        this.bankAcc = event.target.value;
        console.log('acc=>', this.bankAcc);
    }
    textHandler(event) {
        this.notes = event.target.value;
        console.log('notes=>', this.notes);
    }

    @wire(CurrentPageReference)
    handleStateParameters(currentPageReference) {
        const state = currentPageReference.state;
        if (state && state.storedValues) {
            this.storedValues = JSON.parse(state.storedValues);
        }
    }

    connectedCallback() {
        const savedFormData = sessionStorage.getItem('formData');
    if (savedFormData) {
        const formData = JSON.parse(savedFormData);

        // Prepopulate the form fields with the saved values
        this.selectedPaymentMethod = formData.paymentMethod;
        this.pisDate = formData.pisDate;
        this.pisNumber = formData.pisNumber;
        this.bankAcc = formData.bankAccount;
        this.notes = formData.notes;
        this.batchTotalAmount = formData.batchTotalAmount;
        // Populate other form fields as needed
    }

        this.loadingBookingRecord();
    }
    loadingBookingRecord() {
        getBookingRecord({ recordId: this.recordId })
            .then((result) => {
                this.bookingRecords = result;

                this.eventName = this.bookingRecords[0].Event__r.Name;
                console.log('Name==>', this.bookingRecords[0].Event__r.Name);
                console.log('bookingrecord=>', result);
            })
        getPaymentRecordData({ recordId: this.recordId })
            .then(
                
                
                (result) => {
                this.eventBookingRecords = result;
                console.log('getPaymentRecordData=>', this.eventBookingRecords);
        
                // // Check if any record in currentPageData has errorMessage
                // this.Amountduetotal = this.currentPageData.some(item => !!item.errorMessage);

                this.eventName = this.eventBookingRecords[0].Event;
                console.log('Name==>', this.eventBookingRecords[0].Event);

                this.eventlink = this.eventBookingRecords[0].eventLink;
                console.log('Link=>', this.eventBookingRecords[0].eventLink);

                this.TotalRecord = this.eventBookingRecords.length;
                console.log('totalRecord=>', this.TotalRecord);

                //pagination
                //this.totalPages = Math.ceil(this.eventBookingRecords.length / pageSize);
                console.log('booking records length=>', this.eventBookingRecords.length);
                console.log('total Pages=>', this.totalPages);
                //this.applyPagination();

            }).catch((error) => {
                console.log('Wrapper=>', error);
            })
    }
  

    handleSaveDraft() {

        if (this.selectedRecordsCount === 0 || !this.selectedPaymentMethod || !this.pisDate || !this.pisNumber || !this.bankAcc || !this.batchTotalAmount || this.showZeroOrPositive === true) {
            this.errorMessage = true;
            this.errorthroughMessage = 'Please select at least one record/Required field missing';
        } else {
            this.errorMessage = false;
            console.log('Inside Save');
            // Construct the PaymentBatchRecord object
            this.PaymentBatchRecord = {
                paymentMethod: this.selectedPaymentMethod,
                PISDate: this.pisDate,
                PISNumber: this.pisNumber,
                BankAccount: this.bankAcc,
                Notes: this.notes,
                Event: this.recordId,
                TotalAmount: this.batchTotalAmount
            };
            console.log('PaymentBatchRecord=>', JSON.stringify(this.PaymentBatchRecord));
            // Call the Apex method to create the Payment Batch record
            CreatePaymentBatch({ paymentRecord: JSON.stringify(this.PaymentBatchRecord) })
                .then((result) => {
                    console.log('Payment Batch record Created;', result);
                    // Redirect to the Event page
                    window.open("/" + this.recordId, "_self");
                })
                .catch((error) => {
                    console.log('Payment Batch Record did not created', error);
                });
        }

    }

    handleReturnEvent() {
       window.open("/" + this.recordId, "_self");
    }

    // Handle search input change
    handleSearch(event) {
        this.searchKeyword = event.target.value.toLowerCase();
        console.log('searchKeyword',searchKeyword);
    }

    // Filter the records based on the search keyword
    get filteredRecords() {
        return this.eventBookingRecords.filter(item =>
            item.Name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
            item.bookedby.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
            item.formattedDate.includes(this.searchKeyword) ||
            item.TotalAmount.toString().includes(this.searchKeyword) ||
            item.PayTillDate.toString().includes(this.searchKeyword) ||
            item.AmountDue.toString().includes(this.searchKeyword)
        );
    }

    // Handle change in the number of entries to be shown
     @track selectedEntries=10;
    handleShowEntries(event) {
        this.selectedEntries = parseInt(event.target.value,10);
        this.totalPages = Math.ceil(this.filteredRecords.length / this.selectedEntries);
        this.currentPage = 1; // Reset to first page when changing the number of entries
        console.log('selectentries',selectedEntries);
    }

    // Get options for the Show Entries dropdown based on total records
    get showEntriesOptions() {
        let options = [];
        if (this.eventBookingRecords.length > 0) {
            // Calculate number of pages based on total records and selected entries
            this.totalPages = Math.ceil(this.filteredRecords.length / this.selectedEntries);
            // Generate options based on total pages
            for (let i = 1; i <= this.totalPages; i++) {
                options.push({ label: (i * this.selectedEntries).toString(), value: (i * this.selectedEntries).toString() });
            }
        }
        return options;
    }
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

     nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }
    get disabledPrevious() {
        return this.currentPage === 1;
    }

    get disabledNext() {
        return this.currentPage === this.totalPages;
    }

    // Get the data for the current page
    get currentPageData() {
        const startIndex = (this.currentPage - 1) * this.selectedEntries;
        const endIndex = startIndex + this.selectedEntries;
        return this.filteredRecords.slice(startIndex, endIndex);
    }

    batchtotalHandler(event) {
        this.batchTotalAmount = event.target.value;
        this.differenceAmount = this.batchTotalAmount - this.TotalAmountEntered;
        console.log('batch', differenceAmount);
    }
    
    handleAmountChange(event) {
       this.inputAmountpaid = parseFloat(event.target.value);
    
       this.eventBookingRecords.forEach((item) => {
        const totalAmountForRow = parseFloat(item.AmountDue);
        item.amountdueerror = (this.inputAmountpaid > totalAmountForRow) ? true : false ;
        this.AmountDueError=item.amountdueerror;
        //this.AmountDueError=true;
    });

        this.TotalAmountEntered = this.calculateTotalAmount();
        this.differenceAmount = this.batchTotalAmount - this.TotalAmountEntered;

     if(this.differenceAmount < 0){
        this.differenceerror=true;
       }else{
        this.differenceerror=false;
       }
    }

    calculateTotalAmount() {
        let total = 0;
        // Iterate through each row in the table and sum up the amounts
        const rows = this.template.querySelectorAll('.amount-input');
        rows.forEach(row => {
            total += parseFloat(row.value || 0);
        });
        return total;
    }
    
    handleTodaydateClick(event) {
        const inputField = this.template.querySelector('[data-id="dateInput"]');
        const today = new Date().toISOString().slice(0, 10); // Format: DD-MM-YYYY
        inputField.value = today;
        this.pisDate = today;
        console.log('date=>', this.pisDate);

    }
    handleSelectcheckbox(event) {
        if (event.target.checked) {
            this.selectedRecordsCount++;
        } else {
            this.selectedRecordsCount--;
        }
    }
    // sort ASC and Desc
    handleSort(event) {
        const fieldName = event.target.dataset.fieldName;
        let sortDirection = event.target.dataset.sortDirection;
        let sortedData = JSON.parse(JSON.stringify(this.eventBookingRecords));
        sortedData.sort((a, b) => {
            let fieldA = (typeof a[fieldName] === 'string') ? a[fieldName].toUpperCase() : a[fieldName];
            let fieldB = (typeof b[fieldName] === 'string') ? b[fieldName].toUpperCase() : b[fieldName];
            let comparison = 0;
            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }
            return (sortDirection === 'asc' ? comparison : -comparison);
        });
        sortDirection = (sortDirection === 'asc' ? 'desc' : 'asc');
        event.target.dataset.sortDirection = sortDirection;
        const otherButton = event.target.parentElement.querySelector('[data-sort-direction="' + (sortDirection === 'asc' ? 'desc' : 'asc') + '"]');
        otherButton.dataset.sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        const buttons = event.target.parentElement.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = false;
        });

        event.target.disabled = true;

        this.eventBookingRecords = sortedData;
    }
    //sortAmount
    handletextSort(event) {
        const fieldName = event.target.dataset.fieldName;
        let sortDirection = event.target.dataset.sortDirection;

        if (event.target.disabled) {
            return;
        }

        let sortedData = JSON.parse(JSON.stringify(this.eventBookingRecords));

        sortedData.sort((a, b) => {
            let fieldA = (typeof a.bookedby !== 'undefined') ? a.bookedby.toUpperCase() : '';
            let fieldB = (typeof b.bookedby !== 'undefined') ? b.bookedby.toUpperCase() : '';

            let comparison = 0;

            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return (sortDirection === 'asc' ? comparison : -comparison);
        });

        sortDirection = (sortDirection === 'asc' ? 'desc' : 'asc');
        event.target.dataset.sortDirection = sortDirection;

        const otherButton = event.target.parentElement.querySelector('[data-sort-direction="' + (sortDirection === 'asc' ? 'desc' : 'asc') + '"]');
        otherButton.dataset.sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

        event.target.disabled = true;
        otherButton.disabled = true;

        this.eventBookingRecords = sortedData;

        setTimeout(() => {
            event.target.disabled = false;
            otherButton.disabled = false;
        }, 100);
    }
    //totalamount
    handleTotalAmountSort(event) {
        const fieldName = event.target.dataset.fieldName;
        let sortDirection = event.target.dataset.sortDirection;

        if (event.target.disabled) {
            return;
        }

        let sortedData = JSON.parse(JSON.stringify(this.eventBookingRecords));

        sortedData.sort((a, b) => {
            let fieldA = a[fieldName];
            let fieldB = b[fieldName];

            let comparison = 0;

            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return (sortDirection === 'asc' ? comparison : -comparison);
        });

        sortDirection = (sortDirection === 'asc' ? 'desc' : 'asc');
        event.target.dataset.sortDirection = sortDirection;

        const otherButton = event.target.parentElement.querySelector('[data-sort-direction="' + (sortDirection === 'asc' ? 'desc' : 'asc') + '"]');
        otherButton.dataset.sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

        event.target.disabled = true;
        otherButton.disabled = true;

        this.eventBookingRecords = sortedData;

        setTimeout(() => {
            event.target.disabled = false;
            otherButton.disabled = false;
        }, 100);
    }
    handlePaidTillSort(event) {
        const fieldName = event.target.dataset.fieldName;
        let sortDirection = event.target.dataset.sortDirection;

        if (event.target.disabled) {
            return;
        }

        let sortedData = JSON.parse(JSON.stringify(this.eventBookingRecords));

        sortedData.sort((a, b) => {
            let fieldA = a[fieldName];
            let fieldB = b[fieldName];

            let comparison = 0;

            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return (sortDirection === 'asc' ? comparison : -comparison);
        });

        sortDirection = (sortDirection === 'asc' ? 'desc' : 'asc');
        event.target.dataset.sortDirection = sortDirection;

        const otherButton = event.target.parentElement.querySelector('[data-sort-direction="' + (sortDirection === 'asc' ? 'desc' : 'asc') + '"]');
        otherButton.dataset.sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

        event.target.disabled = true;
        otherButton.disabled = true;

        this.eventBookingRecords = sortedData;

        setTimeout(() => {
            event.target.disabled = false;
            otherButton.disabled = false;
        }, 100);
    }
    handleAmountDueSort(event) {
        const fieldName = event.target.dataset.fieldName;
        let sortDirection = event.target.dataset.sortDirection;

        if (event.target.disabled) {
            return;
        }

        let sortedData = JSON.parse(JSON.stringify(this.eventBookingRecords));

        sortedData.sort((a, b) => {
            let fieldA = a[fieldName];
            let fieldB = b[fieldName];

            let comparison = 0;

            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return (sortDirection === 'asc' ? comparison : -comparison);
        });

        sortDirection = (sortDirection === 'asc' ? 'desc' : 'asc');
        event.target.dataset.sortDirection = sortDirection;

        const otherButton = event.target.parentElement.querySelector('[data-sort-direction="' + (sortDirection === 'asc' ? 'desc' : 'asc') + '"]');
        otherButton.dataset.sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

        event.target.disabled = true;
        otherButton.disabled = true;

        this.eventBookingRecords = sortedData;

        setTimeout(() => {
            event.target.disabled = false;
            otherButton.disabled = false;
        }, 100);
    }
    handleDateSort(event) {
        const fieldName = event.target.dataset.fieldName;
        let sortDirection = event.target.dataset.sortDirection;

        if (event.target.disabled) {
            return;
        }

        let sortedData = [...this.eventBookingRecords]; // Create a copy of the array to avoid mutating the original data

        sortedData.sort((a, b) => {
            let fieldA = new Date(a[fieldName]);
            let fieldB = new Date(b[fieldName]);

            let comparison = 0;

            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return (sortDirection === 'asc' ? comparison : -comparison);
        });

        sortDirection = (sortDirection === 'asc' ? 'desc' : 'asc');
        event.target.dataset.sortDirection = sortDirection;

        const otherButton = event.target.parentElement.querySelector('[data-sort-direction="' + (sortDirection === 'asc' ? 'desc' : 'asc') + '"]');
        otherButton.dataset.sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

        event.target.disabled = true;
        otherButton.disabled = true;

        this.eventBookingRecords = sortedData;

        setTimeout(() => {
            event.target.disabled = false;
            otherButton.disabled = false;
        }, 100);
    }
}