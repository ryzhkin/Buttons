var Button = function (world, img, options) {
  this.img = img;
  this.opt = help.extend({
	pos: {
		rotation : 0,
		x        : 113,
		y        : 800/2	
	}  
  }, options); 
  this.button = world.addObj({
	  physic: {density: 1, friction: 0.5, restitution: 0.2},
	  pos: this.opt.pos,
	  shape: {
		radius: 27
	  },
	  bitmap: this.img,
	  bitmapOptions: {
 	    scale      : 1,
 	    offsetRegX : 34,
 	    offsetRegY : 27
	  }
  });
 
  
 /* this.button = new cc.Sprite(this.img);
  layer.addChild(this.button);*/
  	
}