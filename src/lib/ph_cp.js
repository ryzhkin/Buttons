var physicWorldCP = function (layer, options) {


	// Начальные настройки physicWorld
	this.options = help.extend({
		gravity     : [0, -9.8], // Вектор гравитации. По-умолчанию задается ускорение свободного падения, равное 9.8 виртуальным метрам в секунду по оси Y.
		scaleFactor : 1,     // Кооэфициент масштаба
		frameRate   : 30,    // Частота обновления рендринга esealJS
		// Задали предельное количество обрабатываемых событий изменения скорости объектов и их положения на 1 такт работы
		// При увеличении этих параметров общая скорость реакции будет увеличиваться,
		// но с увеличением количества объектов мы можем уткнуться в системные ресурсы,
		// при уменьшении — получим неправильную обработку объектов от такта к такту. 10 — вполне вменяемое среднее значение.
		velocityIterations: 10, //8, // Предельное изминение скорости на одну итерацию
		positionIterations: 10, //1, // Предельное изминение позиции на одну итерацию

		showEmptyEsealObjects: true, // Показывать пустые объекты Eseal
		debug                : false // По-умолчанию использовать рендринг в режиме отладки
	}, options);


	// Создаем наш мир.
	this.world = new cp.Space();
	// Вектор гравитации. Задается ускорение свободного падения, равное 10 виртуальным метрам в секунду по оси Y.
	this.world.gravity = cp.v(30*this.options.gravity[0], 30*this.options.gravity[1]); 	
	
	
	if (this.options.debug == true) {
	  this.debugNode = new cc.PhysicsDebugNode(this.world);
	  this.debugNode.visible = true;
	  
	 /* var l2 = new cc.Layer();
	  layer.addChild(l2);*/
	  layer.addChild(this.debugNode, 1);
	  //layer = l2;
	}
	
	// Типы обьектов физического мира
	this.objType = {
			Static    : 1, // статический - не подвижный, монолитный объект, но он влияет на динамический объекты
			Kinematic : 2, // киниматический - объект, который движется по заданной траиктории и на него не действуют дргуие силы, но он влияет на динамический объекты
			Dynamic   : 3  // динамический - объект на него влияют все физические факторы миры, он взаимодейсвует со всеми типами объектов
	};//*/
	
	/**
	 * Вычисляет центр масс полигона
	 * vertics[] - массив координат вершин
	 */
	this.calcPolygonCenter = function (vertics) {
	  var xc = 0;
	  var yc = 0;
	  for (var i = 0; i < vertics.length-2; i+=2) {
		xc += vertics[i];
		yc += vertics[i+1];
	  }
	  xc = xc/(vertics.length/2);
	  yc = yc/(vertics.length/2);
	  return {
		x: xc,
		y: yc
	  }
	}
	
	/**
	 * Меняет порядок координат вершин на обратный
	 * vertics[] - массив координат вершин
	 */
	this.revercePolygon = function (vertics) {
		var vertics2 = [];
		for (var i = vertics.length-1; i >= 0; i-=2) {
			vertics2.push(vertics[i-1]);
			vertics2.push(vertics[i]);
		}
		return vertics2;
	}
	
	/**
	 * Вычисляет площадь произвольного полигона
	 * vertics[] - массив координат вершин (обход по часовой стрелке)
	 */
	this.calcPolygonArea = function (vertics) {
		// Обход точек против часовой + добавить копию первой точки в конец
		var points = [];
		points.push(vertics[0]);
		points.push(vertics[1]);
		for (var i = vertics.length-1; i >= 0; i-=2) {
			points.push(vertics[i-1]);
			points.push(vertics[i]);
		}
		var sum1 = 0;
		for (var i = 0; i < points.length-2; i+=2) {
			sum1 += points[i]*points[i+3];
		} 
		var sum2 = 0;
		for (var i = 0; i < points.length-2; i+=2) {
			sum2 += points[i+1]*points[i+2];
		} 
		var s = (sum1 - sum2)/2;
		return (s);
	}

	
	this.vector = function(x, y) {
		return cp.v(x, y);
	};
	
	/**
	 * Добавить новый физический объект в физический мир
	 * @param objOptions
	 * @return {Object}
	 */
	this.addObj = function (objOptions) {
		var objOptions = help.extend({
			// Тип создоваемого объекта:
			// this.objType.Static     - статический - не подвижный, монолитный объект, но он влияет на динамический объекты
			// this.objType.Kinematic  - киниматический - объект, который движется по заданной траиктории и на него не действуют дргуие силы, но он влияет на динамический объекты
			// this.objType.Dynamic    - динамический - объект на него влияют все физические факторы миры, он взаимодейсвует со всеми типами объектов
			type: this.objType.Dynamic,
			// Координаты объекта в пикселях, относительно левого верхнего угла canvas:
			// по-умолчанию средина canvas
			pos: {
				x: 0,
				y: 0,
				rotation: 0
			},
			// Физичиеские параметры объекта
			physic: {
				density: 1.0,    // кооэфициент плотности объекта
				friction: 0.5,   // кооэфициент трения объектов мира: 0 - нет трения у объекта, 1 - максимальное трение у объекта
				restitution: 0.5 // кооэфициент упругости объектов мира: 0 - очень жесткие объект, 1 - максимально упругий объект
			},
			// Геометрическая форма объекта
			shape: {
				radius  : 100,    // Если указан радиус  в пикселях - это круг
				box     : [],     // Если размеры прямоугольника не пустые и > 0 будет построен прямоугольник
				polygon : []      // Если координаты полигона не пустые - будет построен полигон
			}
		}, objOptions);
		
		
		var objectEseal = null;
		var body        = null;
		var shape = null; 
		if (objOptions.type == this.objType.Static) {
		  body = new cp.Body(Infinity, Infinity);
		  // Круг ...
		  if ((objOptions.shape.radius > 0) && (objOptions.shape.box.length == 0) && (objOptions.shape.polygon.length == 0)) {
			shape = new cp.CircleShape(body, objOptions.shape.radius, cp.v(objOptions.pos.x, objOptions.pos.y));
		  }	else {
		    // Прямоугольник ...
			if (objOptions.shape.box.length == 2) {
				body.setPos(cp.v(objOptions.pos.x, objOptions.pos.y));
				shape = new cp.BoxShape(body, objOptions.shape.box[0], objOptions.shape.box[1]);
			} else {
			  objOptions.shape.polygon = this.revercePolygon(objOptions.shape.polygon);	
			  // Полигон .... по часовой стрелке
			  if (objOptions.shape.polygon.length >= 6) {
				  var sX = objOptions.shape.polygon[0];
				  var sY = objOptions.shape.polygon[1];
				  for (var i = 0; i < objOptions.shape.polygon.length; i +=2) {
					  objOptions.shape.polygon[i]     = objOptions.shape.polygon[i] - sX;
					  objOptions.shape.polygon[i + 1] = objOptions.shape.polygon[i + 1] - sY;
				  }
				  shape = new cp.PolyShape(body, objOptions.shape.polygon, cp.v(objOptions.pos.x, objOptions.pos.y) );
			  }	  
			} 
		  }
		  // Если определина тексутра спрайта - добавляем его
		  if (typeof(objOptions.bitmap) == 'string') {
			  /*cc.log('try add bitmap > ' + objOptions.bitmap);
			  objectEseal = new cc.PhysicsSprite(objOptions.bitmap);
			  objectEseal.setBody(body);*/
		  }	  
		  
		  
		  if (shape !== null) {
			this.world.addStaticShape(shape);
			//body = shape;  
		  }
        }
		if (objOptions.type == this.objType.Dynamic) {
			// Круг ...
			if ((objOptions.shape.radius > 0) && (objOptions.shape.box.length == 0) && (objOptions.shape.polygon.length == 0)) {
				var mass = (Math.PI*objOptions.shape.radius*objOptions.shape.radius)*objOptions.physic.density;
				body = new cp.Body(mass, cp.momentForCircle(mass, 0, objOptions.shape.radius, cp.v(0, 0)));
				this.world.addBody(body);
				body.setPos(cp.v(objOptions.pos.x, objOptions.pos.y));
				shape = new cp.CircleShape(body, objOptions.shape.radius, cp.v(0, 0));
			} else {
				// Прямоугольник ...
				if (objOptions.shape.box.length == 2) {
				   var mass = (objOptions.shape.box[0]*objOptions.shape.box[1])*objOptions.physic.density;	
				   body = new cp.Body(mass, cp.momentForBox(mass, objOptions.shape.box[0], objOptions.shape.box[1]));
				   this.world.addBody(body);
				   body.setPos(cp.v(objOptions.pos.x, objOptions.pos.y));
				   shape = new cp.BoxShape(body, objOptions.shape.box[0], objOptions.shape.box[1]);
				} else {
					objOptions.shape.polygon = this.revercePolygon(objOptions.shape.polygon);
					// Полигон .... по часовой стрелке
					if (objOptions.shape.polygon.length >= 6) {
						var sX = objOptions.shape.polygon[0];
						var sY = objOptions.shape.polygon[1];
						for (var i = 0; i < objOptions.shape.polygon.length; i +=2) {
							objOptions.shape.polygon[i]     = objOptions.shape.polygon[i] - sX;
							objOptions.shape.polygon[i + 1] = objOptions.shape.polygon[i + 1] - sY;
						}
						// Находим площадь полигона
						var area = this.calcPolygonArea(objOptions.shape.polygon);
						// Находим центр масс полигона
						//var c = this.calcPolygonCenter(objOptions.shape.polygon);
						
						var mass = area*objOptions.physic.density;	
						body = new cp.Body(mass, cp.momentForPoly(mass, objOptions.shape.polygon, cp.v(0, 0) ));
						this.world.addBody(body);
						
						body.setPos(cp.v(objOptions.pos.x, objOptions.pos.y));
						shape = new cp.PolyShape(body, objOptions.shape.polygon, cp.v(0, 0) );
					}	  	
				}
			}
			
			if (shape !== null) {
				this.world.addShape(shape);
				shape.setElasticity(objOptions.physic.restitution);
				shape.setFriction(objOptions.physic.friction);
			}
			
			
			// Если определина текстура спрайта - добавляем его
			if (typeof(objOptions.bitmap) == 'string') {
				var bitmapOptions = {
						scale      : 1,
						rotation   : 0,
						x          : objOptions.pos.x,
						y          : objOptions.pos.y,
						rotation   : objOptions.pos.rotation,
						anchorX    : 0.5, // смещение центра тяжести - используется в том случае когда текстура спрайта не совпадает с физической геометрией
						anchorY    : 0.5  // смещение центра тяжести - используется в том случае когда текстура спрайта не совпадает с физической геометрией
				};
				bitmapOptions = help.extend(bitmapOptions, objOptions.bitmapOptions); 
				
				//objectEseal = new cc.PhysicsSprite(objOptions.bitmap);
				
				objectEseal = new cc.Sprite(objOptions.bitmap);
				if (typeof(bitmapOptions.offsetRegY) !== 'undefined') {
					bitmapOptions.anchorY = (objectEseal.getContentSize().height - bitmapOptions.offsetRegY)/objectEseal.getContentSize().height;
				}

				if (typeof(bitmapOptions.offsetRegX) !== 'undefined') {
					bitmapOptions.anchorX = (objectEseal.getContentSize().width - bitmapOptions.offsetRegX)/objectEseal.getContentSize().width;
				}
				objectEseal.attr({
					scale    : bitmapOptions.scale,
					anchorX  : bitmapOptions.anchorX,
					anchorY  : bitmapOptions.anchorY,
					x        : bitmapOptions.x,
					y        : bitmapOptions.y,
					rotation : bitmapOptions.rotation
				});
				
				layer.addChild(objectEseal);
				objectEseal.body = body;
				this.esealObjects.push(objectEseal);
				//objectEseal.setBody(body);
				
			}	  
			
			
			
			
		}
		
		// Добавляем синонимы для обратной совместимости с Box2D
        if (body !== null) {
          body.GetPosition  = body.getPos;
          body.ApplyImpulse = body.applyImpulse;
        }
		
		return ({
		  body        : body,
		  objectEseal : objectEseal
		});
	}
	
	this.esealObjects = [];
	/**
	 * Синхронизируем объекты движка рендринга eseal и текущие состояние объектов физического движка box2D
	 */
	this.updateEsealObjects = function () {
		for (var i = 0; i < this.esealObjects.length; i++) {
			/*
			this.esealObjects[i].x = this.esealObjects[i].body.GetPosition().x * BOX2D_METER_TO_PIXELS;
			this.esealObjects[i].y = this.esealObjects[i].body.GetPosition().y * BOX2D_METER_TO_PIXELS;
			this.esealObjects[i].rotation = -this.esealObjects[i].body.GetAngle() * (180 / Math.PI);
			*/
			this.esealObjects[i].x = this.esealObjects[i].body.GetPosition().x;
			this.esealObjects[i].y = this.esealObjects[i].body.GetPosition().y;
			this.esealObjects[i].rotation = -this.esealObjects[i].body.a * (180 / Math.PI);
		}
	},

	this.step = function (dt) {
		this.world.step(dt);
		this.updateEsealObjects();
	}
}	