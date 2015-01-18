var app = {
		debug: true,		
		init: function () {
		  cc.director.runScene(new Game());
		},

		localX: function (x) {
			return x  
		},

		localY: function (y) {
			return y  
		},
}