import { LightningElement,track } from 'lwc';
import getProducts from '@salesforce/apex/OrderController.getProducts';
import getRecordId from '@salesforce/apex/OrderController.getRecordId';
import createOrderProducts from '@salesforce/apex/OrderController.createOrderProducts';
import getAccOrd from '@salesforce/apex/OrderSummaryController.getAccOrd';
import updateOrder from '@salesforce/apex/OrderSummaryController.updateOrder';
import {ShowToastEvent } from 'lightning/platformShowToastEvent';
//import backImage from '@salesforce/resourceUrl/orderBack';

export default class orderManagementComponent extends LightningElement {
  
    
    @track searchDomainValue='';
    showSummary=false;
    showSummaryButton=false;
    @track accOrdDetail=[];
    selects;
    recordId ='';
    orderCreated = false;
    error;
    lowlim=''; 
    uplim='';
    searchText='';
    searchVal;
    priceBookId;
    productList;
    searchDom;
    showSearchBar=false;
    showFinalTable=false;
    selectedProductsTable = false;
    showSearchList = false;
    minmax=false;
    choosenProductsList=[];
    showSearchOption = false;

  
    get options(){
        return[
            {label:'Product Name',value :'Product Name'},
            {label:'Brand',value: 'Brand'},
            {label:'Price',value: 'Price'}
        ];
    }
    handleSuccess(event) {
        alert('Add your Products by below domains');
        this.orderCreated = true;
        if (this.orderCreated) {
            getRecordId()
                .then(result => {
                    this.recordId = result;
                    console.log(this.recordId);
                })
        }

        this.showSearchOption = true;
    }

    getmin(event){
        console.log(event.target.value);
        this.lowlim = event.target.value;
    }
    getmax(event){
        this.uplim=event.target.value;
    }
    handledomain(event){
        this.searchDomainValue = event.detail.value;
        console.log(this.searchDomainValue);
        if(this.searchDomainValue == 'Price'){
            console.log('')
            this.minmax=true ;
            this.showSearchBar=false;
        }
        else{
            this.showSearchBar=true;
            this.minmax=false;
        }
    }

    handleSearch(event){
        this.searchText = event.detail;
        console.log(event.target.name);
        if(event.target.name == 'sbp'){
           
            getProducts({searchValue: '', priceBookId:'01s2w000004pYDhAAM',searchDom : this.searchDomainValue, lowlimit : this.lowlim, uplimit : this.uplim})
            .then(result =>{
                this.productList=JSON.parse(result);
                console.log(this.productList);
            });
            this.showSearchList=true;
        }
       
        else if(event.detail.length != 0){
            console.log('in testing');
            getProducts({searchValue: event.target.value, priceBookId:'01s2w000004pYDhAAM',searchDom : this.searchDomainValue,lowlimit : this.lowlim, uplimit : this.uplim})
            .then(result =>{
                this.productList=JSON.parse(result);
                console.log(this.productList);
            });
            this.showSearchList=true;
        }
        else{
            this.showSearchList=false;
        }
    }

    addProduct(event){
        console.log("in addProduct");
        var addId = event.target.value;
        this.selectedProductsTable = false;
        var selects =new Object();
        for(var prod of this.productList){
            if(prod.Id==addId){
                console.log('to check listprice');
                console.log(prod.ListPrice);
                selects.Id = prod.Id;
                selects.ProductCode = prod.ProductCode;
                selects.Name = prod.Name;
                
                selects.Brand = prod.Brand__c;
                selects.StockQuantity = prod.Stock_Quantity__c;
                selects.Quantity = 1;
                selects.UnitPrice=0;
                selects.ListPrice = prod.ListPrice;
                selects.PriceBookEntryId = prod.PriceBookEntryId;
                console.log('to check selects unit price');
                console.log(selects.UnitPrice);
                console.log('pricebookentry id issue');
                console.log(selects.PriceBookEntryId);

            }
            console.log(selects);
            if(!this.choosenProductsList.some(item => item.Id === selects.Id)){
                this.choosenProductsList.push(selects);
                console.log(this.choosenProductsList);
            }
            //this.showSearchList=false;
            this.selectedProductsTable=true;
        }
        this.showFinalTable =false;
    }

    handleQuantity(event){
        var i= -1;
        
        for(var prod of this.choosenProductsList){
            i++;
            if(prod.Id == event.target.name){
           
                break;
            }
        }
        this.choosenProductsList[i].Quantity= event.target.value;
       
    }

    handleDiscount(event){
        var i= -1;
        for(var prod of this.choosenProductsList){
            i++;
            if(prod.Id == event.target.name){
                break;
            }
        }
        this.choosenProductsList[i].Discount = event.target.value;
    }

    removeItem(event){
        var i=-1;
        for(var prod of this.choosenProductsList){
            i++;
            if(prod.Id == event.target.value){
                break;

            }
        }
        this.choosenProductsList.splice(i,1);
        this.selectedProductsTable =false;
        this.selectedProductsTable = true;

    }

    saveItems(event){
        console.log('In saveItems----------');
        console.log('the event is ' + event);
        console.log('the choosen products are ' + this.choosenProductsList);
               for (var prod of this.choosenProductsList) {
                var selects = new Object();
                if (prod.Quantity > 10) {
                    selects.Id = prod.Id;
                    selects.Name = prod.Name;
                    selects.ProductCode = prod.ProductCode;
                    selects.Brand = prod.Brand;
                    selects.StockQuantity = prod.StockQuantity;
                    selects.Quantity = '1';
                    selects.ListPrice = 0;
                    selects.UnitPrice = 0;
                    selects.Discount = 100;
                    selects.PriceBookEntryId = prod.PriceBookEntryId;
                    this.choosenProductsList.push(selects);
                }
                if(prod.Discount>=0 && prod.Discount <= 100){
                    prod.UnitPrice = prod.ListPrice - (prod.ListPrice * prod.Discount / 100);
                }
                else{
                    prod.UnitPrice = prod.ListPrice;
                }
                
            }
            console.log(this.choosenProductsList);
            console.log(JSON.stringify(this.choosenProductsList));

            createOrderProducts({ selectedProducts: JSON.stringify(this.choosenProductsList), priceBookId:'01s2w000004pYDhAAM', ordId: this.recordId })
            .then(result => {
                console.log('Order Id : ' + result);
            })
            .catch(error => {
                console.log(error);
            });

            this.showFinalTable = false;
            this.selectedProductsTable =false;
            this.showSummaryButton =true;

    }
                       
    clearSearch(event){
        console.log('--------in clearSearch');
        this.searchText='';
    }
    getSummary(event){
        this.showSummary =true;
        console.log('in get Summary');
        console.log(this.recordId);
        getAccOrd({createdOrderId : this.recordId})
        .then(result => { 
            console.log(result);
            this.accOrdDetail = result;
            console.log(this.accOrdDetail);
        })
        .catch(error => {
            console.log(error);
        });
        this.showSearchList =false;
        this.showSearchBar =false;
    }

    handleConfirm(event){
        console.log('handleConfirm');
        console.log(this.recordId);

        const event1 = new ShowToastEvent({
            title: 'Order Created',
            message: 'Order Has Been Successfully Created',
        });
        this.dispatchEvent(event1);
        location.reload();
    }
    handleCancel(event){
        console.log(this.recordId);

        updateOrder({createdOrderId : this.recordId})
        .then(result => { 
            this.accOrdDetail = result;
            console.log(this.accOrdDetail);
        })
        .catch(error => {
            console.log(error);
        });

        console.log(this.recordId);
        const event2 = new ShowToastEvent({
            title: 'Order Cancelled',
            message: 'Order Has Been Cancelled',
        });
        this.dispatchEvent(event2);
        location.reload();
        
        /*
        console.log('Displaying Record');
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Order',
                actionName: 'view'
            }
        });
        console.log('Displayed Record');
        */
    }
}