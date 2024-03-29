/* eslint-disable no-unused-vars */
import { LightningElement, api, track, wire } from "lwc";
import customLookupLWC from "c/customLookupLWC";
import getOfferData from "@salesforce/apex/DonationBatchController.getOfferData";
import getOfferingCount from "@salesforce/apex/DonationBatchController.getOfferingCount";
import getExistingBatch from "@salesforce/apex/DonationBatchController.getExistingBatch";
import getAccount from "@salesforce/apex/DonationBatchController.getAccount";
import createBatch from "@salesforce/apex/DonationBatchController.CreateBatch";
import getTransactionWrapper from "@salesforce/apex/DonationBatchController.getTransactionWrapper";
import deleteTransaction from "@salesforce/apex/DonationBatchController.deleteTransaction";
import completeBatch from "@salesforce/apex/DonationBatchController.completeBatch";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class Createbatchlwc extends LightningElement {
  @api recordId;
  rowIndex;
  title;
  currentTotalAmount;
  differrenceAmount;
  showCurrentTotalAmount = false;
  showDifferenceAmount = false;
  showError;
  deleteList = [];
  @track Transactions = [];
  @track accounts = [];
  numberOfRows;
  showMOTO = false;
  @track isModalOpen = false;
  deleteIdList = [];
  isMoto = false;
  motoLink;
  disbalePayment = false;
  batchIdval = "";
  BatchStatus = "";
  @track isBatchCompleted = false;
  get giftTypeOptions() {
    return [
      { label: "A", value: "A" },
      { label: "B", value: "B" },
      { label: "C", value: "C" }
    ];
  }
  get paymentOptions() {
    return [
      { label: "--Select--", value: "--Select--" },
      { label: "Coins", value: "Coins" },
      { label: "Notes", value: "Notes" },
      { label: "Card", value: "Card" },
      { label: "Cheque", value: "Cheque" }
    ];
  }
  @track Offerrecord = {};
  offeringCountRecord;
  selectedPaymentMethod;
  selectedAccountId;
  selectedAccountName;
  selectedDkid;

  connectedCallback() {
    console.log("this.recordId==>", this.recordId);
    this.loadOfferingCount();
    this.loadExistingBatch();
    this.loadTransaction();
  }
  loadTransaction() {}
  loadOfferingCount() {
    getOfferData({ recordId: this.recordId })
      .then((result) => {
        this.Offerrecord = result;
        if (this.Offerrecord.paymentMethod === "Card") {
          this.showMOTO = true;
        }
        console.log("Test-->", this.Offerrecord.paymentMethod);
        if (this.Offerrecord.paymentMethod !== "--Select--") {
          this.disbalePayment = true;
        }
        if (this.Offerrecord.batchStatus === "Complete") {
          this.BatchStatus = "Completed Batch";
        }
        if (this.Offerrecord.batchStatus === "Pending") {
          this.BatchStatus = "Pending Batch";
        }
        if (this.Offerrecord.batchStatus === "") {
          this.BatchStatus = "New Batch";
        }
        console.log("Offerrecord=>", result);
      })
      .catch((error) => {
        console.log(error);
      });
    getOfferingCount({ recordId: this.recordId })
      .then((result) => {
        this.offeringCountRecord = result[0];
      })
      .catch((error) => {
        console.log(error);
      });
    getTransactionWrapper({ recordId: this.recordId })
      .then((result) => {
        console.log("RESULT==>", result);
        let numberOfRows = 0;

        result.forEach((transactionData) => {
          if (transactionData.PaymentMethod === "Card") {
            console.log("This is Card");
            numberOfRows = transactionData.NumberOfEnvelopsCard;
            console.log("NUMBER OF ROWS==>", numberOfRows);

            for (let i = 0; i < numberOfRows; i++) {
              let transaction = {
                tranId: "",
                Index: this.Transactions.length + 1,
                Supporter: "",
                AccountName: "",
                Amount: "",
                GiftType: "A",
                DKID: "",
                MOTOCardPayment: "",
                Status: ""
              };
              this.Transactions.push(transaction);
            }
          } else if (transactionData.PaymentMethod === "Coins") {
            console.log("This is Coins");
            numberOfRows = transactionData.NumberOfEnvelopsCard;
            console.log("NUMBER OF ROWS==>", numberOfRows);

            for (let i = 0; i < numberOfRows; i++) {
              let transaction = {
                tranId: "",
                Index: this.Transactions.length + 1,
                Supporter: "",
                AccountName: "",
                Amount: "",
                GiftType: "A",
                DKID: "",
                MOTOCardPayment: "",
                Status: ""
              };
              this.Transactions.push(transaction);
            }
          } else if (transactionData.PaymentMethod === "Notes") {
            console.log("This is Notes");
          } else if (transactionData.PaymentMethod === "Cheque") {
            console.log("This is Cheque");
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  loadExistingBatch() {
    getExistingBatch({ recordId: this.recordId })
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  @wire(getAccount)
  wiredAccounts({ error, data }) {
    if (data) {
      this.accounts = data;
      console.log("this.accounts", this.accounts);
    } else if (error) {
      console.error("Error retrieving accounts: ", error);
    }
  }

  handlePaymentChange(event) {
    var voucher;
    var payingInSlipNumber;
    let Offerrecord;

    this.selectedPaymentMethod = event.detail.value;
    this.showMOTO = this.selectedPaymentMethod === "Card" ? true : false;

    if (this.selectedPaymentMethod === "--Select--") {
      this.Transactions = [];
      voucher = "";
      payingInSlipNumber = "";
      this.numberOfRows = "";
      //let Offerrecord;
      Offerrecord = {
        ...this.Offerrecord,
        paymentMethod: this.selectedPaymentMethod,
        slipNumber: payingInSlipNumber,
        voucher: voucher,
        totalAmount: 0
      };
      this.Offerrecord = Offerrecord;
    } else if (this.selectedPaymentMethod === "Coins") {
      this.Transactions = [];
      voucher = this.offeringCountRecord.Paying_in_Slip_Number_Coins__c;
      payingInSlipNumber = this.offeringCountRecord.Paying_in_Slip_Number_Coins__c;
      this.numberOfRows = this.offeringCountRecord.Number_of_Envelopes_Coins__c;
      //let Offerrecord;
      Offerrecord = {
        ...this.Offerrecord,
        paymentMethod: this.selectedPaymentMethod,
        slipNumber: payingInSlipNumber,
        voucher: voucher,
        totalAmount: this.offeringCountRecord.Coins_Total__c
      };
      this.Offerrecord = Offerrecord;
    } else if (this.selectedPaymentMethod === "Notes") {
      this.Transactions = [];
      voucher = this.offeringCountRecord.Paying_in_Slip_Number_Notes__c;
      payingInSlipNumber = this.offeringCountRecord.Paying_in_Slip_Number_Notes__c;
      this.numberOfRows = this.offeringCountRecord.Number_of_Envelopes_Notes__c;
      //let Offerrecord;
      Offerrecord = {
        ...this.Offerrecord,
        paymentMethod: this.selectedPaymentMethod,
        slipNumber: payingInSlipNumber,
        voucher: voucher,
        totalAmount: this.offeringCountRecord.Notes_Total__c
      };
      this.Offerrecord = Offerrecord;
    } else if (this.selectedPaymentMethod === "Cheque") {
      this.Transactions = [];
      voucher = this.offeringCountRecord.Paying_in_Slip_Number_Cheques__c;
      payingInSlipNumber = this.offeringCountRecord.Paying_in_Slip_Number_Cheques__c;
      this.numberOfRows = this.offeringCountRecord.Number_of_Envelopes_Cheques__c;
      //let Offerrecord;
      Offerrecord = {
        ...this.Offerrecord,
        paymentMethod: this.selectedPaymentMethod,
        slipNumber: payingInSlipNumber,
        voucher: voucher,
        totalAmount: this.offeringCountRecord.Cheque_Total__c
      };
      this.Offerrecord = Offerrecord;
    } else if (this.selectedPaymentMethod === "Card") {
      this.Transactions = [];
      voucher = "";
      payingInSlipNumber = "";
      this.numberOfRows = this.offeringCountRecord.Number_of_Envelopes_Card__c;
      this.showMOTO = true;
      //let Offerrecord;
      Offerrecord = {
        ...this.Offerrecord,
        paymentMethod: this.selectedPaymentMethod,
        slipNumber: payingInSlipNumber,
        voucher: voucher,
        totalAmount: this.offeringCountRecord.Credit_Card_Total__c
      };
      this.Offerrecord = Offerrecord;
    }
    console.log(this.numberOfRows);
    console.log("this.offeringCountRecord.Event_Date__c==>", this.offeringCountRecord.Event_Date__c);
    for (let i = 0; i < this.numberOfRows; i++) {
      let transaction = {
        tranId: "",
        Index: i + 1,
        Supporter: "",
        AccountName: "",
        Amount: this.currentTotalAmount,
        GiftType: "A",
        DKID: "",
        MOTOCardPayment: "",
        Status: ""
      };
      this.Transactions = [...this.Transactions, transaction];
      console.log("this.Transactions", JSON.stringify(this.Transactions));
    }
  }

  handleSupporterChange(event) {
    this.selectedAccount = "";
    let selectedAccountId = event.target.dataset.item;

    let index = event.target.dataset.index;
    console.log(event.target.value);
    this.Transactions[index].Supporter = selectedAccountId;
    console.log("Navya-->" + selectedAccountId);
    this.loadAccount(selectedAccountId, index)
      .then((accRec) => {
        console.log("acc==>", accRec);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  loadAccount(selectedAccountId, index) {
    getAccount({ accountId: selectedAccountId })
      .then((result) => {
        let accountData = result;
        console.log(result);
        console.log("accountData===>", accountData);
        this.Transactions[index].DKID = accountData;

        return accountData;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleAmountChange(event) {
    var amountValue = event.target.value;
    var index = event.target.dataset.item;
    console.log(typeof amountValue);
    console.log(event.target.value);
    this.Transactions[index].Amount = amountValue;

    this.calculateTotalAmount();
  }
  calculateTotalAmount() {
    let total = 0;
    this.showCurrentTotalAmount = true;
    this.showDifferenceAmount = true;

    this.Transactions.forEach((item) => {
      console.log("item.Amount==>", typeof item.Amount);
      console.log("parseInt(item.Amount, 10)==>", parseFloat(item.Amount));
      if (!isNaN(parseFloat(item.Amount))) {
        total += parseFloat(item.Amount);
      }
      console.log("total==>", total);
    });
    this.currentTotalAmount = total;
    if (this.selectedPaymentMethod === "Coins") {
      this.differrenceAmount = this.offeringCountRecord.Coins_Total__c - this.currentTotalAmount;
    } else if (this.selectedPaymentMethod === "Notes") {
      this.differrenceAmount = this.offeringCountRecord.Notes_Total__c - this.currentTotalAmount;
    } else if (this.selectedPaymentMethod === "Cheque") {
      this.differrenceAmount = this.offeringCountRecord.Cheque_Total__c - this.currentTotalAmount;
    } else if (this.selectedPaymentMethod === "Card") {
      this.differrenceAmount = this.offeringCountRecord.Credit_Card_Total__c - this.currentTotalAmount;
    }
    this.showError = this.differrenceAmount < 0 ? true : false;

    console.log("this.currentTotalAmount==>", this.currentTotalAmount);
  }

  handleGiftTypeChange(event) {
    var giftType = event.detail.value;
    var index = event.target.dataset.item;
    this.Transactions[index].GiftType = giftType;
    console.log(JSON.stringify(this.Transactions));
  }

  handleSaveDraft() {
    createBatch({ offerrecord: JSON.stringify(this.Offerrecord), transactions: JSON.stringify(this.Transactions), recordId: this.recordId })
      .then((result) => {
        if (result == null) {
          const evt = new ShowToastEvent({
            title: "Success",
            message: "Batch updated successfully",
            variant: "success"
          });
          this.dispatchEvent(evt);
        } else {
          this.batchIdval = result;
          window.open("/" + this.recordId, "_self");
        }
        // this.createIncomeRecords();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  createIncomeRecords() {
    console.log(this.Transactions);

    // createIncome({ transaction: JSON.stringify(this.Transactions) })
    //   .then((result) => {
    //     console.log("Income record created:", result);
    //   })
    //   .catch((error) => {
    //     console.error("Error creating income record:", error);
    //   });
  }

  addDonation() {
    var transaction = {
      tranId: "",
      Index: this.Transactions.length + 1,
      Supporter: "",
      AccountName: "",
      Amount: "",
      GiftType: "A",
      DKID: "",
      MOTOCardPayment: "",
      Status: ""
    };
    this.Transactions = [...this.Transactions, transaction];
  }

  handleLookupClick(event) {
    this.rowIndex = event.currentTarget.dataset.index;
    this.isModalOpen = true;
    console.log("this.isModalOpen==>", this.isModalOpen);
    console.log("rowIndex==>", this.rowIndex);

    /*var baseURL =  '/_ui/common/data/LookupPage?lkfm=j_id0%3AfmBatch&lknm=j_id0%3AfmBatch%3Aj_id132%3Aj_id133%3Atransactions%3AtransTable%3A0%3Aj_id147&lktp=001';
    var searchParam = this.selectedAccount;
    var modified = '1';
    var width= '670';
     var originalbaseURL = '/_ui/common/data/LookupPage?lkfm=j_id0%3AfmBatch&lknm=j_id0%3AfmBatch%3Aj_id132%3Aj_id133%3Atransactions%3AtransTable%3A0%3Aj_id147&lktp=001';
            var originalwidth = '670';
            var originalmodified = 1;
            var originalsearchParam =  this.selectedAccount;
       

            
            var lookupType = baseURL.substr(baseURL.length-3, 3);
            if (modified == '1') baseURL = baseURL + searchParam;
            
            var isCustomLookup = false;
            
            // Following "001" is the lookup type for Account object so change this as per your standard or custom object
            if(lookupType == "001"){
          
              var urlArr = baseURL.split("&");
              var txtId = '';
              if(urlArr.length > 2) {
              urlArr = urlArr[1].split('=');
               
               txtId = urlArr[1];
                //alert(txtId);
              }
              console.log('Chirag'+txtId);
              // Following is the url of Custom Lookup page. You need to change that accordingly
              baseURL = "/apex/CustomAccountLookup?txt=" + txtId ;
              
              // Following is the id of apex:form control "myForm". You need to change that accordingly
              baseURL = baseURL + "&frm=" + escapeUTF("{!$Component.myForm}");
              if (modified == '1') {
                baseURL = baseURL + "&lksearch=" + searchParam;
                //alert(abc);
              }
              
              // Following is the ID of inputField that is the lookup to be customized as custom lookup
              //if(txtId.indexOf('001') > -1 ){
                isCustomLookup = true;
              //}
            }  
          
            if(isCustomLookup == true){
              openPopup(baseURL, "lookup", 500, 480, "width=900,height=560,toolbar=no,status=no,directories=no,menubar=no,resizable=yes,scrollable=no", true);
            }
            else {
              if (modified == '1') originalbaseURL = originalbaseURL + originalsearchParam;
              openPopup(originalbaseURL, "lookup", 500, 480, "width=900,height=560,toolbar=no,status=no,directories=no,menubar=no,resizable=yes,scrollable=no", true);
            } */
  }

  handleModalClose() {
    this.isModalOpen = false;
  }
  handleSelectedData(event) {
    console.log(event.detail);
    this.isModalOpen = false;
    const index = event.detail.rowIndex;

    // Find the row in the Transactions array by matching the index
    let transaction = this.Transactions[index];

    // Assign values obtained from event to the respective row
    transaction.Supporter = event.detail.accountId;
    transaction.AccountName = event.detail.accountName;
    transaction.DKID = event.detail.dkid;

    console.log("transaction==>", transaction);
    // Update the Transactions array
    this.Transactions = [...this.Transactions];

    // this.selectedAccountId = event.detail.accountId;
    // this.selectedAccountName = event.detail.accountName;
    // this.selectedDkid = event.detail.dkid;

    console.log("Event==>", event);
    console.log("event.rowIndex==>", index);
    console.log("this.selectedAccountId==>", this.selectedAccountId);
    console.log("this.selectedAccountName==>", event.detail.accountName);
    console.log("this.selectedDkid==>", event.detail.dkid);
  }
  handleCheckboxChange(event) {
    var add = event.target.checked;
    var index = event.target.dataset.item;
    var selectedId = event.target.dataset.indexNumber;
    console.log(selectedId);
    console.log(add);
    console.log(index);
    if (add) {
      console.log(this.deleteList);
      this.deleteList.push(index);
      if (selectedId != null && selectedId !== undefined && selectedId !== "") {
        this.deleteIdList.push(selectedId);
      }
    } else {
      const index1 = this.deleteList.indexOf(index);

      if (index1 !== -1) {
        this.deleteList.splice(index1, 1);
      }
      if (selectedId != null && selectedId !== undefined && selectedId !== "") {
        const index2 = this.deleteIdList.indexOf(selectedId);
        if (index2 !== -1) {
          this.deleteIdList.splice(index2, 1);
        }
      }
    }
    console.log(this.deleteList);
    console.log(this.deleteIdList);
  }
  handleDelete(event) {
    for (let i = 0; i < this.deleteList.length; i++) {
      console.log(this.deleteList[i]);
      //const index1 = this.deleteList.indexOf(this.deleteList[i]);
      if (this.deleteList[i] !== -1) {
        console.log(this.deleteList[i]);
        this.Transactions.splice(this.deleteList[i], 1);
        console.log(this.Transactions);
      }
    }
    this.deleteList = [];
    if (this.deleteIdList.length > 0) {
      console.log(this.Transactions);

      deleteTransaction({ transList: this.deleteIdList })
        .then((result) => {
          console.log("Offerrecord=>", result);
        })
        .catch((error) => {
          console.log(error);
        });
      /*for(var i=0;i<this.deleteIdList.length;i++){
        console.log(this.deleteIdList[i]);
        const index1 = this.deleteIdList.indexOf(this.deleteIdList[i]);
        if (this.deleteIdList[i] !== -1) {
          this.deleteIdList.splice(index1,1);
        }
      }*/
    }
    this.deleteIdList = [];
  }
  handleselectMOTO(event) {
    var transactionId = event.target.dataset.item;
    console.log(transactionId);
    this.isMoto = true;
    this.motoLink = "https://ktlcc--dev2024--c.sandbox.vf.force.com/apex/PaymentPage?fundTransactionId=" + transactionId + "&fullScreen=1";
  }
  handleAmendBatchDetails(event) {
    window.open("/flow/Amend_Donation_Batch_Details?bId=" + this.recordId);
  }
  handleCompleteBatch(event) {
    completeBatch({ BatchId: this.recordId })
      .then((result) => {
        if (result === "Batch completed!") {
          const evt = new ShowToastEvent({
            title: "Success",
            message: result,
            variant: "success"
          });
          this.dispatchEvent(evt);
          // this.loadOfferingCount();
          getOfferData({ recordId: this.recordId })
            // eslint-disable-next-line no-shadow
            .then((result) => {
              this.Offerrecord = result;
              if (this.Offerrecord.paymentMethod === "Card") {
                this.showMOTO = true;
              }
              console.log("Test-->", this.Offerrecord.paymentMethod);
              if (this.Offerrecord.paymentMethod !== "--Select--") {
                this.disbalePayment = true;
              }
              if (this.Offerrecord.batchStatus === "Complete") {
                this.BatchStatus = "Completed Batch";
              }
              if (this.Offerrecord.batchStatus === "Pending") {
                this.BatchStatus = "Pending Batch";
              }
              if (this.Offerrecord.batchStatus === "") {
                this.BatchStatus = "New Batch";
              }
              console.log("Offerrecord=>", result);
            })
            .catch((error) => {
              console.log(error);
            });
        } else {
          const evt = new ShowToastEvent({
            title: "Error",
            message: result,
            variant: "error"
          });
          this.dispatchEvent(evt);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  handleVoucherChange(event) {
    var val = event.target.value;
    this.Offerrecord.voucher = val;
  }
}