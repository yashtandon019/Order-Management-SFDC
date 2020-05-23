public with sharing class OrderController {
    public OrderController() {

    }

    class ProductDetail{
        public String Id;
        public String Name;
        public String ProductCode;
        public String Brand;
        public String StockQuantity;
        public String Quantity;
        public String ListPrice;
        public String UnitPrice;
        public String Discount;
        public String PriceBookEntryId;
    }

    @AuraEnabled
    public static string getRecordId(){
        list<Order> recId = [SELECT Id FROM Order ORDER BY CreatedDate DESC LIMIT 1];
        String rId = '' + recId[0].Id;
        return rId;
    }

    @AuraEnabled
    public static String getProducts(String searchValue,String priceBookId,String searchDom,String lowlimit,String uplimit){
        map<Id,Product2> productList;
        map<Id,decimal> priceSearchMap = new map<Id,decimal>();
        list<PricebookEntry> priceSearchList;
        //system.debug(lowlimit);
        //system.debug(uplimit);
        //system.debug(ll);
       //system.debug(ul);

        if(searchDom =='Product Name'){
            productList = new map<Id,Product2>([select Id,ProductCode,Name,Brand__c,Stock_Quantity__c 
            from Product2 where Stock_Quantity__c>0 AND (Name LIKE :'%'+searchValue+'%')]);
}
        else if(searchDom =='Brand'){
            productList = new map<Id,Product2>([select Id,ProductCode,Name,Brand__c,Stock_Quantity__c 
            from Product2 where Brand__c LIKE :'%'+searchValue+'%' AND Stock_Quantity__c>0]);
        }
        else {
            Integer ll =Integer.valueOf(lowlimit);
            Integer ul=Integer.valueOf(uplimit);
            //system.debug(searchDom);
            //system.debug(lowlimit);
            //system.debug(ll);
            //system.debug(uplimit);
            priceSearchList = [select Product2Id,UnitPrice from PricebookEntry where UnitPrice >= :ll AND UnitPrice <= :ul];
            //system.debug(priceSearchList);
           // system.debug(priceSearchList[0].Product2Id);
           // system.debug(priceSearchList[0].UnitPrice);
           // system.debug(priceSearchList.size());
            for(PricebookEntry pbe : priceSearchList){
                priceSearchMap.put(pbe.Product2Id,pbe.UnitPrice);
            }
            system.debug(priceSearchMap);
            productList = new map<Id,Product2>([select Id,ProductCode,Name,Brand__c,Stock_Quantity__c from Product2 where Id IN : priceSearchMap.keySet() AND Stock_Quantity__c>0]);
            system.debug(productList);
        }

        list<PricebookEntry> priceBookEntriesList=[select Id,Product2Id,UnitPrice from PricebookEntry 
                                                   where Product2Id IN : productList.keySet() AND Pricebook2Id=:priceBookId];
        //list<PricebookEntry> priceBookEntriesList =[select Id,Product2Id,UnitPrice from PricebookEntry] ;                                     
        system.debug(productList.keySet());
        map<Id,decimal> unitPriceMap =new map<Id,decimal>();
        map<Id,String> priceBookList=new map<Id,String>();
        for(PricebookEntry pbe : priceBookEntriesList){
            unitPriceMap.put(pbe.Product2Id,pbe.UnitPrice);
            priceBookList.put(pbe.Product2Id,pbe.Id);
        }
        String str='[';
        for(Id key:productList.keySet()){
            str+='{"Id":"'+key+'",'+'"Name":"'+productList.get(key).Name+'",'+'"ProductCode":"'+productList.get(key).ProductCode+'",'+'"ListPrice":"'+unitPriceMap.get(key)+'","Quantity":"",'+'"Brand__c":"'+productList.get(key).Brand__c+'","'+'Stock_Quantity__c":"'+productList.get(key).Stock_Quantity__c+'","'+'PriceBookEntryId":"'+priceBookList.get(key)+'"}'+',';
        }
        str = str.substring(0, str.length()-1);
        str+=']';
        return str;
    }

    @AuraEnabled
    public static string createOrderProducts(String selectedProducts,String priceBookId, String ordId){
        system.debug(priceBookId);
        system.debug('-----------------in createorderProducts-----------------');
        list<ProductDetail> productList=new list<ProductDetail>();
        JSONParser parser = JSON.createParser(selectedProducts);
        system.debug('-------------------parser-------');
        system.debug(parser);
        while (parser.nextToken() != null) {
            if (parser.getCurrentToken() == JSONToken.START_ARRAY) {
                while (parser.nextToken() != null) {
                    if (parser.getCurrentToken() == JSONToken.START_OBJECT) {
                        ProductDetail acc = (ProductDetail)parser.readValueAs(ProductDetail.class);
                        system.debug('Id:' + acc.Id + ' Name:' + acc.Name);
                        productList.add(acc);
                    }
                }
            }
        }
        system.debug(productList);
        Order ord=[Select Stage__c,Pricebook2Id from Order where Id=:ordId];
        system.debug(ord);
        ord.Pricebook2Id = priceBookId;
        //ord.Stage__c = 'In process';
        update ord;


        list<OrderItem> orderItemList = new list<OrderItem>();
        for(ProductDetail product:productList){
            orderItemList.add(new OrderItem(OrderId=ordId,Product2Id=product.Id,Quantity=Decimal.valueOf(product.Quantity),UnitPrice=Decimal.valueOf(product.UnitPrice),PricebookEntryId=product.PriceBookEntryId));
        }
        insert orderItemList;
        list<Product2> prodList =new list<Product2>([select Id,Stock_Quantity__c from Product2]);
        Decimal temp;
        list<Id> flag = new list<Id>();
        for(ProductDetail product :productList){
            system.debug(flag);
            for(Product2 pro : prodList){
                if(pro.Id == product.Id){
                    if(flag.indexOf(product.Id) == -1){
                        system.debug(flag.indexOf(product.Id));
                        if(Decimal.valueOf(product.Quantity) > 10){
                            temp= Decimal.valueOf(product.StockQuantity);
                            temp-=(Decimal.valueOf(product.Quantity)+Decimal.valueOf('1'));
                            system.debug('if greaer than 10');
                            system.debug(temp);
                        }
                        else{
                            temp= Decimal.valueOf(product.StockQuantity);
                            temp-=Decimal.valueOf(product.Quantity);
                            system.debug('in less than 10');
                            system.debug(temp);
                            
                        }
                        system.debug(temp);
                        flag.add(product.Id);
                        
                    //pro.Stock_Quantity__c = Decimal.valueOf(product.StockQuantity) - Decimal.valueOf(product.Quantity);
                    pro.Stock_Quantity__c = temp;
                    }
                }
            }
        }
        update prodList;
        return 'Done Insertion Successfully';
    }
    
}