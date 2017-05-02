angular.module("EmmetBlue")

.controller('pharmacyInventoryController', function($scope, utils){
	$scope.ddtInstance = {};
	$scope.ddtOptions = utils.DT.optionsBuilder.newOptions()
	.withFnServerData(function(source, data, callback, settings){
		var draw = data[0].value;
        var order = data[2].value;
        var start = data[3].value;
        var length = data[4].value;

        var url = '/pharmacy/store-inventory/view?resourceId&paginate&from='+start+'&size='+length;
        if (typeof data[5] !== "undefined" && data[5].value.value != ""){
			url += "&keywordsearch="+data[5].value.value;
		}
		utils.serverRequest(url, 'GET')
		.then(function(response){
			var records = {
				data: response.data,
				draw: draw,
				recordsTotal: response.total,
				recordsFiltered: response.filtered
			};

			callback(records);
		}, function(error){
			utils.errorHandler(error);
		});
	})
	.withDataProp('data')
	.withOption('processing', true)
	.withOption('serverSide', true)
	.withOption('paging', true)
	.withPaginationType('full_numbers')
	.withDisplayLength(10)
	.withOption('createdRow', function(row, data, dataIndex){
		utils.compile(angular.element(row).contents())($scope);
	})
	.withOption('headerCallback', function(header) {
        if (!$scope.headerCompiled) {
            $scope.headerCompiled = true;
            utils.compile(angular.element(header).contents())($scope);
        }
    })
	.withButtons([
		{
			text: '<i class="icon-file-plus"></i> <u>N</u>ew Item',
			action: function(){
				$("#new_inventory_item").modal("show");
			},
			key: {
        		key: 'n',
        		ctrlKey: false,
        		altKey: true
        	}
		}
	]);	

	$scope.ddtColumns = [
		utils.DT.columnBuilder.newColumn('Item').withTitle("Item Code"),
		utils.DT.columnBuilder.newColumn(null).withTitle("Item Name").renderWith(function(data){
			var html = "<p><span class='text-black display-block'>"+data.BillingTypeItemName+
						"</span>";
			if (data.ItemBrand != null){
				html += "<span>"+data.ItemBrand;
				if (data.ItemManufacturer != null && data.ItemManufacturer != ""){
					html += ", <em>"+data.ItemManufacturer+"</em>";
				}
				
				html += "</span>";
			}
			else {
				html += "<span class='text-muted text-small'>No Brand information Available</span>";
			}

			html += "</p>";
						
			return html;
		}),
		utils.DT.columnBuilder.newColumn(null).withTitle("Item Tags").renderWith(function(data, type, full){
			var string = invisible = "";
			for (var i = 0; i < data.Tags.length; i++) {
				invisible += data.Tags[i].TagTitle+": "+data.Tags[i].TagName+" ";
				string += "<h6 class='display-block'><span class='label label-info text-muted pull-left' style='border-right:0px !important;'>"+data.Tags[i].TagTitle+"</span><span class='label label-warning pull-left' style='border-left:0px !important;'> "+data.Tags[i].TagName+"</span></h6><br/><br/>";
			}
			
			return string;
		}),
		utils.DT.columnBuilder.newColumn('_meta.totalQuantity').withTitle("Total Quantity Available"),
		utils.DT.columnBuilder.newColumn(null).withTitle("Manage").renderWith(function(data, type, full){
			var editButtonAction = "manageStore('edit', "+data.ItemID+")";
			var deleteButtonAction = "manageStore('delete', "+data.ItemID+")";
			var inventoryButtonAction = "manageStore('tags', "+data.ItemID+")";

			var tags = JSON.stringify(data.Tags);

			var dataOpt = "data-option-id='"+data.ItemID+"' data-option-name='"+data.BillingTypeItemName+"' data-option-brand='"+data.ItemBrand+"' data-option-manufacturer='"+data.ItemManufacturer+"' data-option-tags='"+tags+"'";

			var manageButton  = "<div class='btn-group'>"+
					                	"<button type='button' class='btn bg-active btn-labeled dropdown-toggle' data-toggle='dropdown'><b><i class='icon-cog3'></i></b> manage <span class='caret'></span></button>"+
					                	"<ul class='dropdown-menu dropdown-menu-right'>"+
										"	<li><a href='#' class='storeInventory-btn' ng-click=\""+editButtonAction+"\" "+dataOpt+"><i class='icon-pencil5'></i> Edit Brand Info</a></li>"+
										"	<li><a href='#' class='storeInventory-btn' ng-click=\""+inventoryButtonAction+"\" "+dataOpt+"><i class='fa fa-bar-chart'></i> Manage Thresholds</a></li>"+
										"	<li class='divider'></li>"+
										"	<li><a href='#' class='storeInventory-btn' ng-click=\""+deleteButtonAction+"\" "+dataOpt+"><i class='fa fa-trash-o'></i> Delete Item</a></li>"+
										"</ul>"+
									"</div>";
			
			var buttons = manageButton;
			return buttons;
		}).notSortable()
	];

	$scope.reloadInventoryTable = function(){
		$scope.ddtInstance.rerender();
	}

	if (typeof utils.storage.inventoryStoreID != "undefined"){
		$scope.storeID = utils.storage.inventoryStoreID;
	}

	$scope.$watch(function(){return utils.storage.inventoryStoreID}, function(newValue, oldValue){
		if (typeof newValue !== "undefined"){
			$scope.storeID = newValue;
			$scope.reloadInventoryTable();
		}
	});

	function loadInventoryItems(staff){
		var request = utils.serverRequest("/accounts-biller/billing-type-items/view-by-staff-uuid?resourceId=0&uuid="+staff, "GET");

		request.then(function(response){
			$scope.inventoryItems = response;
		}, function(error){
			utils.errorHandler(error);
		});
	}

	loadInventoryItems(utils.userSession.getUUID());

	$scope.newItem = {
		tags:[],
		quantity: 0
	}
	
	$scope.itemTag = {
	};

	$scope.addTagToList = function(){
		$scope.newItem.tags.push($scope.itemTag);
		$scope.itemTag = {};
	}

	$scope.removeTagFromList = function(index){
		$scope.newItem.tags.splice(index, 1);
	}

	$scope.deleteTag = function(id, index){
		if (id == 0){
			$scope.tempHolder.tags.splice(index, 1);
		}
		else {			
			var req = utils.serverRequest("/pharmacy/store-inventory/delete-store-inventory-tag?resourceId="+id, "DELETE");

			req.then(function(response){
				if (response){
					$scope.tempHolder.tags.splice(index, 1);
				}
				else {
					utils.notify("Temporarily unable to delete tag", "Please try again later or contact an administrator if this error persists", "warning");
				}
			}, function(error){
				utils.errorHandler(error);
			})
		}
	}

	$scope.addTagToTempHolder = function(){
		$scope.tempHolder.tags.push({"TagName":$scope.itemTag.name, "TagTitle":$scope.itemTag.title, "TagID":0});
		$scope.itemTag = {};
	}

	$scope.saveNewItem = function(){
		var store = {
			tags: $scope.newItem.tags,
			item: $scope.newItem.name,
			brand: $scope.newItem.brand,
			manufacturer: $scope.newItem.manufacturer,
			quantity: $scope.newItem.quantity
		};

		var request = utils.serverRequest("/pharmacy/store-inventory/new", "POST", store);
		request.then(function(response){
			utils.notify("Operation Successful", "New inventory item created successfully", "success");
			$("#new_inventory_item").modal("hide");
			$scope.reloadInventoryTable();
			$scope.newItem = {
				tags: [],
				quantity: 0
			};
		}, function(response){
			utils.errorHandler(response);
		})
	}

	$scope.manageStore = function(manageGroup, id){
		switch(manageGroup.toLowerCase()){
			case "edit":{
				$scope.tempHolder = {};
				$scope.tempHolder.resourceId = id;
				$scope.tempHolder.name = $(".storeInventory-btn[data-option-id='"+id+"']").attr('data-option-name');
				$scope.tempHolder.brand = $(".storeInventory-btn[data-option-id='"+id+"']").attr('data-option-brand');
				$scope.tempHolder.manufacturer = $(".storeInventory-btn[data-option-id='"+id+"']").attr('data-option-manufacturer');
				$scope.tempHolder.tags = JSON.parse($(".storeInventory-btn[data-option-id='"+id+"']").attr('data-option-tags'));

				$("#edit_inventory_item").modal("show");
				break;
			}
			case "delete":{
				functions.manageAccount.changeAccountType(id);
				break;
			}
			case "tags":{
				functions.manageAccount.toggleAccountStatus(id);
				break;
			}
		}
	}

	$scope.saveEditInventoryItem = function(){
		var edits = {
			ItemBrand: $scope.tempHolder.brand,
			ItemManufacturer: $scope.tempHolder.manufacturer,
			resourceId: $scope.tempHolder.resourceId
		}

		var tags = [];
		for (var i = 0; i < $scope.tempHolder.tags.length; i++){
			var tem = $scope.tempHolder.tags[i];
			if (tem.TagID == 0){
				tags.push({
					name: tem.TagName,
					title: tem.TagTitle
				});
			}
		}

		var req = utils.serverRequest("/pharmacy/store-inventory/edit", "PUT", edits);

		var reqTag = utils.serverRequest("/pharmacy/store-inventory/new-store-inventory-tags", "POST", {
			tags: tags,
			item: edits.resourceId
		});

		req.then(function(response){
			if (response){
				utils.notify("Operation Successful", $scope.tempHolder.name+"'s brand information has been updated successfully.", "success");
				$scope.reloadInventoryTable();
				$scope.tempHolder = {};
				$("#edit_inventory_item").modal("hide");
			}
			else {
				utils.alert("An error occurred", "Your updates have been rejected by the server. Please try again or contact an administrator if this error persists", "danger");
			}
		}, function(error){
			utils.errorHandler(error);
		})

		reqTag.then(function(response){
		}, function(error){
			utils.errorHandler(error);
		})
	}
});