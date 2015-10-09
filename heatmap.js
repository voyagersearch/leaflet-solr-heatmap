if(typeof(L) !== 'undefined' && typeof(L.CanvasLayer) != 'undefined') {

  /**
   * Creates an interpolation function.
   *
   * @param  {number} min The low number.
   * @param  {number} max The high number.
   * @param  {string} method The interpolation method, one of 'linear', 'exp', or 'log'.
   *
   * @return {function} An interpolation function that returns an interpolated value given an
   *  input in the range [0-1].
   */
  function interpolate(min, max, method) {
    var delta = max - min;
    var fx;
    if (method === 'linear' || method == 'lin') {
      fx = function(x) {
        return delta*x;
      };
    }
    else if (method === 'exp') {
      fx = function(x) {
        return Math.exp(x * Math.log(1+delta))-1;
      };
    }
    else if (method === 'log') {
      fx = function(x) {
        return delta * Math.log((x+1))/Math.log(2);
      };
    }
    else {
      throw 'not supported: ' + method;
    }

    return function(x) {
      return min + fx(x);
    };
  }

  /**
   * Converts an integer to a hex string.
   *
   * @param  {number} c The integer.
   * @return {string} The hex string, zero-padded if required.
   */
  function toHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  /**
   * RGB constructor.
   *
   * @param {number} r The red value [0-255].
   * @param {number} g The green value [0-255].
   * @param {number} b The blue value [0-255].
   * @param {number} a The alpha value [0-1], defaults to 1.
   *
   */
  function RGB(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = typeof a != 'undefined' ? a : 1;
    this.push(r, g, b, this.a);
  }
  RGB.prototype = new Array; // jshint ignore:line

  /**
   * Static method to create RGB instance from hex string.
   *
   * @param {string} hex 6 or 8 digit hex color string with optional '#'.
   *
   * @return {object} RGB instance.
   */
   RGB.fromHex = function(hex) {
    var res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    return new RGB(
      parseInt(res[1], 16),
      parseInt(res[2], 16),
      parseInt(res[3], 16),
      typeof res[4] !== 'undefined' ? parseInt(res[4], 16)/255.0 : undefined
    );
  };

  /**
   * Returns the color as HSL.
   *
   * @return {object} HSL instance.
   */
   RGB.prototype.hsl = function() {
    var r = this.r/255;
    var g = this.g/255;
    var b = this.b/255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max === min){
      h = s = 0; // achromatic
    }
    else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
        case g:
        h = (b - r) / d + 2;
        break;
        case b:
        h = (r - g) / d + 4;
        break;
      }
      h /= 6;
    }

    return new HSL(h,s,l);
  };

  /**
   * Returns the color as a 6 digit hex string with '#'.
   *
   * @return {string} Hex color string.
   */
  RGB.prototype.hex = function() {
    return "#" + toHex(this.r) + toHex(this.g) + toHex(this.b);
  };

  /**
   * Returns the color as an rgba tuple.
   *
   * @return {string} Rgba color tuple.
   */
  RGB.prototype.rgba = function() {
    return 'rgba(' + this.join(',') + ')';
  };

  /**
   * Returns a new color with the specified opacity.
   *
   * @param {number} a Opacity value, [0-1].
   *
   * @return {object} RGB instance.
   */
  RGB.prototype.opacity = function(a) {
    return new RGB(this.r, this.g, this.b, a);
  };

  /**
   * Returns a new color with the specified opacity multiplied by the 
   * current opacity value.
   *
   * @param {number} a Opacity value, [0-1].
   *
   * @return {object} RGB instance.
   */
  RGB.prototype.opacify = function(a) {
    return new RGB(this.r, this.g, this.b, this.a * a);
  };

  /**
   * Interpolates between two color values.
   *
   * @param {object} rgb The RGB color to interpolate to.
   * @param {number} val Value in range [0,1] specifying interpolation position.
   *
   * @return {object} Interpolated RGB color.
   */
  RGB.prototype.interpolate = function(rgb, val) {
    var hsl1 = this.hsl();
    var hsl2 = rgb.hsl();

    var hsl = hsl1.map(function(start, index) {
        return start + (val * (hsl2[index] - start));
    });
    var alpha = this.a + val*(rgb.a-this.a);
    return new HSL(hsl[0], hsl[1], hsl[2]).rgb().opacity(alpha);
  }

  /**
   * HSL constructor.
   *
   * @param {number} h The hue value as a fraction of 360 degrees [0-1].
   * @param {number} s The saturation value as a percentage [0-1].
   * @param {number} l The lightness value as a percentage [0-1].
   */
  function HSL(h,s,l) {
    this.h = h;
    this.s = s;
    this.l = l;
    this.push(h,s,l);
  }
  HSL.prototype = new Array; // jshint ignore:line

  /**
   * Returns the color as RGB.
   *
   * @return {object} RGB instance.
   */
  HSL.prototype.rgb = function() {
    var h = this.h;
    var s = this.s;
    var l = this.l;
    var r, g, b;

    if(s === 0){
      r = g = b = l; // achromatic
    }
    else{
      var hue2rgb = function hue2rgb(p, q, t){
        if(t < 0) {
          t += 1;
        }
        if(t > 1) {
          t -= 1;
        }
        if(t < 1/6) {
          return p + (q - p) * 6 * t;
        }
        if(t < 1/2) {
          return q;
        }
        if(t < 2/3) {
          return p + (q - p) * (2/3 - t) * 6;
        }
        return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return new RGB(Math.round(r*255), Math.round(g*255), Math.round(b*255));
  };

  L.SolrHeatmapLayer = L.CanvasLayer.extend({
    options: {
      field: 'geo',
      query: {q: '*:*'},
      blur: 10,
      opacity: 0.5,
      colors: ['00ff00', 'ff0000'],
      interp: 'linear'
    },

    initialize: function(url, options) {
      L.CanvasLayer.prototype.initialize.apply(this, [options]);

      this.url = url;
    },

    onAdd: function(map) {
      L.CanvasLayer.prototype.onAdd.apply(this, [map]);

      var self = this;
      map.on('zoomstart', function() {
        self.clear();
      });
    },

    /**
     * Calls to solr to generate the heatmap for a specified bounding box.
     *
     * @param {object} bbox A L.LatLngBounds instance.
     * @param {function} Callback to be run on completion.
     */
    fetch: function(bbox, then) {
      var self = this;

      // build up the heatmap request url
      var req = this.url + '/select?';

      // add all of the query params from options
      var query = this.options.query;
      for (var key in query) {
        req += key + "=" + query[key] + "&";
      }

      // add the heatmap params
      req += 'rows=0' +
        '&facet=true' +
        '&facet.heatmap=' + this.options.field +
        '&facet.heatmap.geom=[' +
           Math.max(-180, bbox.getWest())+' '+Math.max(-90, bbox.getSouth()) +
           ' TO ' +
           Math.min(180, bbox.getEast())+' '+Math.min(90, bbox.getNorth()) +
         ']' +
        '&facet.heatmap.format=ints2D' +
        '&wt=json';

      // make the call
      var xhr = new XMLHttpRequest();
      xhr.open('GET', encodeURI(req));
      xhr.onload = function() {
        if (xhr.status == 200) {
          var rsp = JSON.parse(xhr.responseText);
          var values = rsp.facet_counts.facet_heatmaps[self.options.field];

          // turn the array into an object
          hm = {};
          for (var i = 0; i < values.length-1; i+=2) {
            hm[values[i]] = values[i+1];
          }

          hm['data'] = hm.counts_ints2D;
          then.apply(self, [hm]);
        }
        else {
          throw "heatmap call failed";
        }
      };
      xhr.send();

    },

    /**
     * Clears the canvas.
     */
    clear: function(g) {
      var can = this.getCanvas();
      var g = can.getContext('2d');
      g.clearRect(0, 0, can.width, can.height);
    },

    /**
     * Renders the heatmap gridlines on the map. Used for debugging.
     *
     * @param  {object} hm The solr heatmap object.
     */
    renderGrid: function(hm) {
      var map = this._map;
      var hmRect = {
        ul: map.latLngToContainerPoint({lng:hm.minX, lat:hm.maxY}),
        lr: map.latLngToContainerPoint({lng:hm.maxX, lat:hm.minY}),
      };
      hmRect.width = hmRect.lr.x - hmRect.ul.x;
      hmRect.height = hmRect.lr.y - hmRect.ul.y;

      var can = this.getCanvas();
      var ctx = can.getContext('2d');
      ctx.strokeStyle = 'rgb(0,255,0)';
      ctx.strokeRect(hmRect.ul.x, hmRect.ul.y, hmRect.width, hmRect.height);
    },

    render: function() {
      var canvas = this.getCanvas();
      var g = canvas.getContext('2d');

      if (this.throttle !== null) {
        clearTimeout(this.throttle);
      }

      this.clear();

      var self = this;
      this.throttle = setTimeout(function() {
        var map = self._map;
        self.fetch(map.getBounds(), function(hm) {
          self.clear();

          if (hm.data === null) {
              return;
          }

          // get values and compute min max
          self.computeStats(hm);

          // get the interpolation function
          var interp = interpolate(0, 1, self.options.interp);

          // width/height of each grid cell in lng/lat
          var dx = (hm.maxX - hm.minX) / hm.columns;
          var dy = (hm.maxY - hm.minY) / hm.rows;

          // apply the blur filter
          canvas.style.webkitFilter = 'blur('+self.options.blur+'px)';

          // prepare the color ramp
          var opacity = self.options.opacity;
          var rgb1 = RGB.fromHex(self.options.colors[0]);
          var rgb2 = RGB.fromHex(self.options.colors[1]);

          // walk through the heatmap values and render each grid cell
          var y = hm.maxY;
          for (var i = 0; i < hm.rows; i++) {
              var row = hm.data[i];
              if (row != null) {
                  var x = hm.minX;
                  for (var j = 0; j < hm.columns; j++) {
                      var p1 = map.latLngToContainerPoint({lng:x, lat:y});
                      var p2 = map.latLngToContainerPoint({lng:x+dx, lat:y-dy});

                      var val = interp(hm.data[i][j]/hm.max);
                      if (val > 0) {
                          var rgb = rgb1.interpolate(rgb2,val);
                          rgb = rgb.opacify(opacity);
                          g.fillStyle = rgb.rgba();
                          g.fillRect(p1.x, p1.y, p2.x-p1.x, p2.y-p1.y);
                      }
                      x += dx;
                  }
              }
              y -= dy;
          }

          //fire('render', hm);
        });
      }, 200);
    },

    /**
     * Computes the min and max values in the heatmap.
     *
     * @param  {object} hm The solr heatmap object.
     */
    computeStats: function(hm) {
      var max = -Number.MIN_VALUE;
      var min = Number.MAX_VALUE;

      for (var i = 0; i < hm.data.length; i++) {
        var x = hm.data[i];
        if (x == null) {
          continue;
        }

        max = Math.max(max, Math.max.apply(null, x));
        min = Math.min(min, Math.min.apply(null, x));
      }

      hm.max = max;
      hm.min = min;
    }
  });
}
