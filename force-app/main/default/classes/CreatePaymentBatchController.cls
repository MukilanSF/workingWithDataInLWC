public with sharing class CreatePaymentBatchController {
    public Payments_Batch__c paymentBatchRecord {get; set;}
    public Map<Id,Fund_Transaction__c> mapofBookingIDToFundTransaction{get; set;}
    
    public CreatePaymentBatchController() {
    }

    @AuraEnabled(cacheable=true)
    public static List<Booking_Record__c> getBookingRecord(Id recordId) {
        try {
            return [SELECT Id, Name, Booked_By__r.Name, Booked_By__c, Event__r.Id, Event__r.Name, 
                            PIS_Date__c, PIS_Number__c, Payment_Method__c, Bank_Account__c, Notes__c, 
                            Event__c, Status__c, Amount_Due__c, Amount_Paid__c, Total_Amount__c, CreatedDate
                    FROM Booking_Record__c 
                    WHERE Event__r.Id = :recordId];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Id createPaymentBatch(String paymentRecord, String transactions) {
        PaymentBatchWrapper batchWrapper = (PaymentBatchWrapper)JSON.deserialize(paymentRecord, PaymentBatchWrapper.class);
        Payments_Batch__c pb = new Payments_Batch__c();
        pb.Payment_Method__c = batchWrapper.paymentMethod;
        pb.PIS_Date__c = batchWrapper.PISDate;
        pb.PIS_Number__c = batchWrapper.PISNumber;
        pb.Bank_Account__c = batchWrapper.BankAccount;
        pb.Notes__c = batchWrapper.Notes;
        pb.Total_Amount__c = batchWrapper.TotalAmount;
        pb.Status__c = 'Pending';

        insert pb;

        List<TransactionWrapper> transactionWrappers = (List<TransactionWrapper>)JSON.deserialize(transactions, List<TransactionWrapper>.class); 
        List<Fund_Transaction__c> fundTransactions = new List<Fund_Transaction__c>();

        for(TransactionWrapper tw : transactionWrappers) {
            if (!String.isBlank(tw.Supporter)) {
                Income__c income = new Income__c(
                    Amount__c = tw.Amount,
                    Status__c = 'Pending',
                    Booking_Record__c = tw.BookingRecordId,
                    Event__c = pb.Event__c,
                    Payment_method__c = pb.Payment_Method__c,
                    Income_related_to__c = tw.AccountId,
                    Type__c = 'Event/Course fee',
                    RecordTypeId = Schema.SObjectType.Income__c.getRecordTypeInfosByName().get('Income').getRecordTypeId(),
                    Fund__c = pb.Event__r.Generated_Income_Fund_Lookup__c
                );

                insert income;

                Fund_Transaction__c ft = new Fund_Transaction__c(
                    Income__c = income.Id,
                    Status__c = 'Paid',
                    Date__c = pb.PIS_Date__c,
                    Payment_method__c = pb.Payment_Method__c,
                    Fund__c = tw.FundId,
                    Payments_Batch__c = pb.Id,
                    Amount__c = tw.Amount,
                    Related_To__c = tw.Supporter,
                    Gift_Type__c = 'A',
                    Type__c = 'Event/Course fee'
                );

                fundTransactions.add(ft);
            }
        }

        insert fundTransactions;

        return pb.Id;
    }

    @AuraEnabled
    public static List<PaymentBatchWrapper> getPaymentRecordData(Id recordId) {
        List<Booking_Record__c> bookingRecords = [SELECT Id, Name, Booked_By__r.Name, Booked_By__c, 
                                                            Event__r.Id, Event__r.Generated_Income_Fund_Lookup__c, 
                                                            Event__r.Church_Lookup__r.Name, Event__r.Name, 
                                                            PIS_Date__c, PIS_Number__c, Payment_Method__c, 
                                                            Bank_Account__c, Notes__c, Event__c, Status__c, 
                                                            Amount_Due__c, Amount_Paid__c, Total_Amount__c, 
                                                            CreatedDate 
                                                    FROM Booking_Record__c 
                                                    WHERE Event__c = :recordId AND Status__c != 'Cancelled' 
                                                    AND Amount_Due__c != 0];

        List<PaymentBatchWrapper> batchWrappers = new List<PaymentBatchWrapper>();

        for (Booking_Record__c bookingRecord : bookingRecords) {
            String formattedDate = bookingRecord.CreatedDate.format('dd/MM/yyyy');
            PaymentBatchWrapper batchWrapper = new PaymentBatchWrapper();
            batchWrapper.paymentMethod = '';
            batchWrapper.PISDate = Date.today();
            batchWrapper.PISNumber = '';
            batchWrapper.BankAccount = bookingRecord.Bank_Account__c;
            batchWrapper.TotalAmountbr= bookingRecord.Total_Amount__c;
            batchWrapper.Notes = bookingRecord.Notes__c;
            batchWrapper.Event = bookingRecord.Event__r.Name;
            batchWrapper.eventLink = '/' + bookingRecord.Event__c;
            batchWrapper.formattedDate = formattedDate;
            batchWrapper.bookedbylink = '/' + bookingRecord.Booked_By__c;
            batchWrapper.fundId = bookingRecord.Event__r.Generated_Income_Fund_Lookup__c;
            batchWrapper.accountId = bookingRecord.Event__r.Church_Lookup__r.Name;
            batchWrapper.bookedby = bookingRecord.Booked_By__r.Name;
            batchWrapper.Name = bookingRecord.Name;
            batchWrapper.PayTillDate = bookingRecord.Amount_Paid__c;
            batchWrapper.AmountDue = bookingRecord.Amount_Due__c;
            batchWrappers.add(batchWrapper);
        }

        return batchWrappers;
    }

    public class PaymentBatchWrapper {
        @AuraEnabled public String paymentMethod;
        @AuraEnabled public Date PISDate;
        @AuraEnabled public String PISNumber;
        @AuraEnabled public String BankAccount;
        @AuraEnabled public String Notes;
        @AuraEnabled public String Event;
        @AuraEnabled public Decimal TotalAmountbr;
        @AuraEnabled public Decimal TotalAmount;
        @AuraEnabled public String eventLink;
        @AuraEnabled public String formattedDate;
        @AuraEnabled public String bookedbylink;
        @AuraEnabled public String bookedby;
        @AuraEnabled public String Name;
        @AuraEnabled public Decimal PayTillDate;
        @AuraEnabled public Decimal AmountDue;
        @AuraEnabled public String fundId;
        @AuraEnabled public String accountId;
    }
    
    public class TransactionWrapper {
        @AuraEnabled public Decimal Amount;
        @AuraEnabled public String Supporter;
        @AuraEnabled public String AccountId;
        @AuraEnabled public Id BookingRecordId;
        @AuraEnabled public String FundId;
    }
}