var help = {
		extend: function(target, source) {
			target = target || {};
			for (var prop in source) {
				if (typeof source[prop] === 'object') {
					target[prop] = this.extend(target[prop], source[prop]);
				} else {
					target[prop] = source[prop];
				}
			}
			return target;
		},
		hexToRgb: function (hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		},
		/**
		 * Вычисляет растояние между 2 точками с координатами.
		 * @param x1
		 * @param y1
		 * @param x2
		 * @param y2
		 * @return {Number}
		 */
		getDistance: function (x1, y1, x2, y2) {
			return (Math.pow((Math.pow((x2 - x1), 2) +  Math.pow((y2 - y1), 2)), 0.5));
		},
}