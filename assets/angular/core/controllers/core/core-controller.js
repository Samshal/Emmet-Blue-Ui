angular.module("EmmetBlue")

.controller('coreController', function($scope, $location, $routeParams, CONSTANTS, utils){
	$scope.loadImage = utils.loadImage;
	$scope.$on('$routeChangeSuccess', function(event, current, previous){
		var path = ($location.path()).split('/');
		var userDashboard = utils.userSession.getDashboard();
		if (path[1] !== "" && userDashboard.split("/")[0] !== path[1]){
			if (path[1] != "user"){
				// console.log(userDashboard, path);
				utils.alert("Accessed Denied", "You tried to access a department page and was redirected back here. please request for the appropriate permissions to do that next time", "info");
				$location.path('user/home');
			}
		}

		delete path[path.length - 1];

		var moduleMenu = CONSTANTS.TEMPLATE_DIR +
						 path.join('/')+
						 CONSTANTS.MODULE_MENU_LOCATION;
		var moduleHeader = CONSTANTS.TEMPLATE_DIR +
						 path.join('/')+
						 CONSTANTS.MODULE_HEADER_LOCATION;

		$scope.moduleMenu = moduleMenu;
		$scope.moduleHeader = moduleHeader;
	});

	var checkLogin = function(){
		if ($location.path() != '/user/login'){
			utils.userSession.cookie();
		}
	}

	$scope.isAuthPage = function(){
		if ($location.path() == '/user/login'){
			return true;
		}

		return false;
	}

	$scope.logout = function(){
		utils.userSession.clear();
	}

	var loadUserProfile = function(){
		if ($location.path() != '/user/login'){
			var req = utils.serverRequest("/human-resources/staff/view-staff-with-department-and-role?uuid="+utils.userSession.getUUID(), "GET");

			req.then(function(response){
				$scope.currentStaffDepartmentInfo = response[0];
				console.log(response[0]);
			}, function(error){
				utils.errorHandler(error);
			})

			var req2 = utils.serverRequest("/human-resources/staff/view-staff-profile?resourceId="+utils.userSession.getID(), "GET");

			req2.then(function(response){
				$scope.currentStaffInfo = response[0];
			}, function(error){
				utils.errorHandler(error);
			})
		}
	}


	checkLogin();
	loadUserProfile();	
});