angular.module("EmmetBlue")

.controller('labPatientManagementController', function($scope, utils, $rootScope){
	var actions = function (data, type, full, meta){
		var editButtonAction = "managePatient('edit', "+data.PatientLabNumber+")";
		var deleteButtonAction = "managePatient('delete', "+data.PatientLabNumber+")";
		var viewButtonAction = "managePatient('paymentRequest', "+data.PatientLabNumber+")";

		var dataOpt = "data-option-id='"+data.PatientLabNumber+"' data-option-name='"+data.FullName+"'";

		var editButton = "<button class='btn btn-default billing-type-btn' ng-click=\""+editButtonAction+"\" "+dataOpt+"><i class='icon-pencil5'></i> </button>";
		var deleteButton = "<button class='btn btn-default billing-type-btn' ng-click=\""+deleteButtonAction+"\" "+dataOpt+"><i class='icon-bin'></i> </button>";
		var viewButton = "<button class='btn btn-xs btn-danger' ng-click=\""+viewButtonAction+"\" "+dataOpt+"><i class='icon-link'> </i> Generate Payment Request</button>";
		
		var buttons = "<div class='btn-group'>"+viewButton+"</button>";
		return buttons;
	}

	$scope.dtInstance = {};
	$scope.dtOptions = utils.DT.optionsBuilder
	.fromFnPromise(function(){
		var patients = utils.serverRequest('/lab/patient/view', 'GET');
		return patients;
	})
	.withPaginationType('full_numbers')
	.withDisplayLength(10)
	.withFixedHeader()
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
        	extend: 'print',
        	text: '<i class="icon-printer"></i> <u>P</u>rint this data page',
        	key: {
        		key: 'p',
        		ctrlKey: false,
        		altKey: true
        	}
        },
        {
        	extend: 'copy',
        	text: '<i class="icon-copy"></i> <u>C</u>opy this data',
        	key: {
        		key: 'c',
        		ctrlKey: false,
        		altKey: true
        	}
        }
	]);	

	$scope.dtColumns = [
		utils.DT.columnBuilder.newColumn('PatientLabNumber').withTitle("Lab Number"),
		utils.DT.columnBuilder.newColumn('LabName').withTitle("LabName"),
		utils.DT.columnBuilder.newColumn('FullName').withTitle("Name"),
		utils.DT.columnBuilder.newColumn('InvestigationTypeName').withTitle("Investigation Required"),
		utils.DT.columnBuilder.newColumn('RegistrationDate').withTitle("Registration Date"),
		utils.DT.columnBuilder.newColumn(null).withTitle("Action").renderWith(actions).withOption('width', '25%').notSortable()
	];

	$scope.reloadPatientsTable = function(){
		$scope.dtInstance.reloadData();
	}

	$rootScope.$on("reloadLabPatients", function(){
		$scope.reloadPatientsTable();
	})

	$scope.managePatient = function(type, id){
		switch(type){
			case "paymentRequest":{
				// utils.storage.fieldsLabID = id;
				utils.storage.currentPaymentRequest = id;
				$("#_payment_request").modal("show");
				break;
			}
		}
	}
});