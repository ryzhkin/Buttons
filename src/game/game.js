var Game = cc.Scene.extend({
	onEnter:function () {
		this._super();
		this.baseLayer = new cc.Layer();
		this.back = new cc.TMXTiledMap('res/back0.tmx');
		this.baseLayer.addChild(this.back);
		
		
		this.start = cc.p(0, -(this.back.getContentSize().height - cc.view.getDesignResolutionSize().height));
		this.back.setPosition(this.start);

		this.addChild(this.baseLayer);
		
		this.drawLayer = new cc.Layer();
		this.back.addChild(this.drawLayer);
		
		// Прокрутка фона
		cc.eventManager.addListener({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,
			onTouchBegan: function (touch, event) { 
				return true;
			},
			onTouchMoved: function (touch, event) {   
				this.TouchMoved = true;
				this.moveBackDelta(touch.getDelta());
			}.bind(this),
			onTouchEnded: function (touch, event) {
				if (this.TouchMoved !== true) {
					var m = this.map.getPosition();
					var d = cc.p({
						x: this.start.x - m.x,
						y: this.start.y - m.y
					});
					var p = touch.getLocation();  
					var g = cc.p({
						x: p.x + d.x,
						y: p.y + d.y
					});
					
				}
				this.TouchMoved = false;
			}.bind(this),
		}, this);
		
		// Создаем физическое пространство
		this.world = new physicWorldCP(this.drawLayer, {
			debug       : true,
			gravity     : [0, 0]
		});
		
		
		new Button(this.world, 'res/buttons/0.png',	{
		  pos: {
			x: 113,
			y: 800/2
		  }	
		});	
		
		// Запуск физики
		this.scheduleUpdate();
	},
	update: function (dt) {
		if (this.world !== null) {
			this.world.step(dt);  
		}	
	},
	// Проверить границы фона для смещения
	checkBackBorder: function (pos, delta) {
		if ((pos.y + delta.y) < -(this.back.getContentSize().height - cc.view.getVisibleSize().height)) {
			delta.y = -(this.back.getContentSize().height - cc.view.getVisibleSize().height) - pos.y;
		}
		if ((pos.y + delta.y) > 0) {
			delta.y = (-1)*pos.y;
		}
		if ((pos.x + delta.x) < -(this.back.getContentSize().width - cc.view.getVisibleSize().width)) { 
			delta.x = -(this.back.getContentSize().width - cc.view.getVisibleSize().width) - pos.x;
		}
		if ((pos.x + delta.x) > 0) { 
			delta.x = (-1)*pos.x;
		}
		return delta;
	},
	// Сдвинуть фон на смещение delta
	moveBackDelta: function (delta, anim, speed) {
		delta = this.checkBackBorder(this.back.getPosition(), delta);
		if (anim == true) {
			var speed = (typeof(speed) == 'undefined')?600:speed;
			var d = help.getDistance(this.back.getPosition().x, this.back.getPosition().y, this.back.getPosition().x + delta.x, this.back.getPosition().y + delta.y);
			var t = d/speed;
			this.back.runAction(
					new cc.MoveTo(t, 
							cc.p(
									this.back.getPosition().x + delta.x,
									this.back.getPosition().y + delta.y
							)
					)
			);

			/*this.drawLayer.runAction(
					new cc.MoveTo(t, 
							cc.p(
									this.drawLayer.getPosition().x + delta.x,
									this.drawLayer.getPosition().y + delta.y
							)
					)
			);*/
		} else {
			this.back.setPosition(
					cc.p(
							this.back.getPosition().x + delta.x,
							this.back.getPosition().y + delta.y
					)
			);
			/*this.drawLayer.setPosition(
					cc.p(
							this.drawLayer.getPosition().x + delta.x,
							this.drawLayer.getPosition().y + delta.y
					)		
			);*/	
		}	
	}
});