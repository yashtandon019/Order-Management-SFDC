public with sharing class OrderSummaryController {
    public OrderSummaryController() {

    }
    @AuraEnabled
    public static list<Order> getAccOrd(String createdOrderId){
        system.debug('-------------in getAccOrd-----------');
        system.debug(createdOrderId);
        list<Order> accOrdList= new list<Order>([Select OrderNumber,TotalAmount,AccountId from Order where Id=:createdOrderId ]);
        system.debug('the details off accrdDetails');
        system.debug(accOrdList);
        return accOrdList;
    }


    @AuraEnabled
    public static list<Order> updateOrder(String createdOrderId){
        system.debug('-------------in updateOrder-----------');
        system.debug(createdOrderId);
        list<Order> accOrdList= new list<Order>([Select Id, Stage__c, Remarks__c from Order where Id=:createdOrderId limit 1]);
        accOrdList[0].Stage__c = 'Cancelled';
        accOrdList[0].Remarks__c = 'Cancelled before Confirmation';
        update accOrdList;
        system.debug('the details off accrdDetails');
        system.debug(accOrdList);
        return accOrdList;
    }


}