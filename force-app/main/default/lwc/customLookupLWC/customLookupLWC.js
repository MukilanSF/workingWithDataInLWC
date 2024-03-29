import { LightningElement, wire, track, api } from "lwc";
import getAccount from "@salesforce/apex/DonationBatchController.getAccount";

export default class customLookupLWC extends LightningElement {
  recordData;
  @api rowIndex;
  @track accountData;
  @track searchTerm = " ";
  keyWord = "";

  selectedAccountId = null;
  selectedAccountName = null;
  selectedDKID = null;

  @wire(getAccount, { keyWord: "$keyWord" })
  wiredAccounts({ error, data }) {
    if (data) {
      this.accountData = data;
      console.log("this.accountData==>", JSON.stringify(this.accountData));
    } else if (error) {
      console.error("Error fetching accounts:", error);
    }
  }

  handleAccountClick(event) {
    const accountId = event.target.dataset.accountid;
    const accountName = event.target.dataset.accountname;
    const dkid = event.target.dataset.dkid;

    this.selectedAccountId = accountId;
    this.selectedAccountName = accountName;
    this.selectedDKID = dkid;

    console.log("this.selectedAccountId==>", this.selectedAccountId);
    console.log("this.selectedAccountName==>", this.selectedAccountName);
    console.log("this.selectedDKID==>", this.selectedDKID);
    console.log("this.rowIndex==>", this.rowIndex);

    const myEvent = new CustomEvent("accountselection", {
      detail: {
        rowIndex: this.rowIndex,
        accountId: this.selectedAccountId,
        accountName: this.selectedAccountName,
        dkid: this.selectedDKID
      }
    });
    this.dispatchEvent(myEvent);
    console.log("myEvent==>", myEvent);
    console.log("event.detail==>", myEvent.detail);
    console.log("event.detail.name==>", myEvent.detail.accountName);
  }

  searchAccount(account) {
    const searchTerm = this.searchTerm.toLowerCase();
    return Object.values(account).some((value) => {
      return value && typeof value === "string" && value.toLowerCase().includes(searchTerm);
    });
  }

  handleSearchChange(event) {
    this.keyWord = event.target.value;
    getAccount({ keyWord: this.keyWord })
      .then((result) => {
        this.accountData = result;
      })
      .catch((error) => {
        console.error("Error fetching accounts:", error);
      });
  }

  handleNewAccount(event) {
    this.recordData = event.detail.outputVariables[0].value;
    this.selectedAccountId = this.recordData[0];
    this.selectedAccountName = this.recordData[1];
    this.selectedDKID = this.recordData[2];

    console.log("Account ID==>", this.selectedAccountId);
    console.log("Account Name==>", this.selectedAccountName);
    console.log("DKID==>", this.selectedDKID);

    const myEvent = new CustomEvent("accountselection", {
      detail: {
        rowIndex: this.rowIndex,
        accountId: this.selectedAccountId,
        accountName: this.selectedAccountName,
        dkid: this.selectedDKID
      }
    });
    this.dispatchEvent(myEvent);
    console.log("myEvent==>", myEvent);
    console.log("event.detail==>", myEvent.detail);
    console.log("event.detail.name==>", myEvent.detail.accountName);
  }
}