/**
 * some Raphaeljs extension
 * 
 * <ul>
 * <li>Raphael.fn.vtext -- write the vertical text
 * <li>Raphael.fn.twinBox -- draw twin line text box 
 * <li>Raphael.fn.singleBox -- draw single line text box 
 * </ul>
 * 
 * @requires Raphael.js 2.1.0, jquery.js 1.5+
 * @author LiuLongbiao
 * 
 */
;(function(Raphael, $, undefined) {

	var _black = "#000000", _white = "#FFFFFF", _blue = "#0000FF";
	
	function isHalfEm(ch) {
		return (/^[0-9a-z\(\)\.]$/g).test(ch);
	}

	function countEm(str) {
		var halfs = 0, len = str.length, ch;
		for(var i = 0; i < len; i ++) {
			ch = str.charAt(i);
			if(isHalfEm(ch)) {
				halfs ++;
			}
		}
		return len - 0.5 * halfs;
	}
	
	function isVtextSupport(paper) {
		var result = paper._v_txt_spt;
		if(typeof result === "undefined") {
			var temp = paper.text(-1000, -1000, ""), s = temp.node.style;
			result = paper._v_txt_spt = s.writingMode !== undefined && s.glyphOrientationVertical !== undefined;
			temp.remove();
		}
		return result;
	}
	
	Raphael.fn.htext = function (options) {
		var ops = $.extend({}, Raphael.fn.htext.defaults, options || {});
		return this.text(ops.x, ops.y, ops.text).attr({"font-size": ops.fz, "fill": ops.color});
	};
	
	Raphael.fn.htext.defaults = {
			x : 0,
			y : 0,
			text : "",
			fz : 12,
			color : _black
	};
	
	Raphael.fn.vtext = function (options) {
		var ops = $.extend({}, Raphael.fn.htext.defaults, options || {}),
			text = ops.text, fz = ops.fz;
		var paper = this, _v_txt_spt = isVtextSupport(paper), el = null, nd, style;
		if(_v_txt_spt) {
			el = paper.htext(options);
			style = el.node.style;
			style.writingMode = "tb";
			style.glyphOrientationVertical = "auto";
		} else {
			el = paper.set();
			var sy = ops.y - 0.5 * countEm(text) * fz, idx = 0;
			
			var _text = function(str, rotate) {
				var em = countEm(str);
				var ty = sy + (idx + 0.5 * em) * ops.fz;
				var txt = paper.htext($.extend({}, ops, {
					y : ty,
					text : str
				}));
				if(rotate) {
					txt.rotate(90, ops.x, ty);
				}
				idx += em;
				return txt;
			};
			
			var ch, temp = [];
			for(var i = 0, len = text.length; i < len; i ++) {
				ch = text.charAt(i);
				if(text.charCodeAt(i) > 256) {
					if(temp && temp.length) {
						el.push(_text(temp.join(""), true));
					}
					el.push(_text(ch, false));
					temp = [];
				} else {
					temp.push(ch);
				}
			}
			if(temp && temp.length) {
				el.push(_text(temp.join(""), true));
			}
		}
		return el;
	};
	
	Raphael.fn.unitext = function(options) {
		var ops = $.extend({}, Raphael.fn.unitext.defaults, options || {}),
			paper = this, func = (ops.vertical) ? paper.vtext : paper.htext;
		return func.call(paper, ops);
	};
	
	Raphael.fn.unitext.defaults = {
			x : 0,
			y : 0,
			text : "",
			fz : 12,
			color : _black,
			vertical : false
	};
	
	Raphael.fn.unirect = function(options) {
		var ops = $.extend({}, Raphael.fn.unirect.defaults, options || {});
		var re = this.rect(ops.x, ops.y, ops.width, ops.height, ops.r);
		re.attr({fill : ops.color, "stroke-width" : 0.5});
		return re;
	};
	
	Raphael.fn.unirect.defaults = {
			x : 0,
			y : 0,
			width : 10,
			height : 10,
			r : 1,
			color : _white
	};

	Raphael.fn.twinBox = function(options) {
		var ops = $.extend({}, Raphael.fn.twinBox.defaults, options || {});
		var paper = this;
		var nm_rect, nm_txt, vl_rect, vl_txt;
		var cx = ops.cx, cy = ops.cy, fz = ops.fz, color = ops.color, lh = ops.lineHeight;
		var pref_len = Math.max(countEm(ops.text1), countEm(ops.text2)) + 1,
			rect_h, rect_w;
		if(ops.vertical) {
			rect_h = pref_len * fz;
			rect_w = lh * fz;
			nm_rect = paper.unirect({
				x : cx - rect_w,
				y : cy - 0.5 * rect_h,
				width : rect_w,
				height : rect_h,
				color : color
			});
			nm_txt = paper.unitext({
				x : cx - 0.5 * lh * fz,
				y : cy,
				text : ops.text1,
				fz : fz,
				color : _white,
				vertical : true
			});
			vl_rect = paper.unirect({
				x : cx,
				y : cy - 0.5 * rect_h,
				width : rect_w,
				height : rect_h
			});
			vl_txt = paper.unitext({
				x : cx + 0.5 * lh * fz,
				y : cy,
				text : ops.text2,
				fz : fz,
				color : color,
				vertical : true
			});
		} else {
			rect_w = pref_len * fz;
			rect_h = lh * fz;
			vl_rect = paper.unirect({
				x : cx - 0.5 * rect_w,
				y : cy - rect_h,
				width : rect_w,
				height : rect_h,
				color : color
			});
			nm_txt = paper.unitext({
				x : cx,
				y : cy - 0.5 * lh  * fz,
				text : ops.text1,
				fz : fz,
				color : _white,
				vertical : false
			});
			vl_rect = paper.unirect({
				x : cx - 0.5 * rect_w,
				y : cy,
				width : rect_w,
				height : rect_h
			});
			vl_txt = paper.unitext({
				x : cx,
				y : cy + 0.5 * lh  * fz,
				text : ops.text2,
				fz : fz,
				color : color,
				vertical : false
			});
		}
		var result = paper.set();
		result.push(nm_rect, nm_txt, vl_rect, vl_txt);
		return result;
	};
	
	Raphael.fn.twinBox.defaults = {
			cx : 0,
			cy : 0,
			text1 : "node",
			text2 : "",
			fz : 12,
			lineHeight : 1.5,
			color : _blue,
			vertical : false
	};
	
	Raphael.fn.singleBox = function(options) {
		var ops = $.extend({}, Raphael.fn.singleBox.defaults, options || {});
		var paper = this,  _rect, _txt;
		var cx = ops.cx, cy = ops.cy, fz = ops.fz, color = ops.color, lh = ops.lineHeight;
		var pref_len = countEm(ops.text) + 1, rect_h, rect_w, vert = ops.vertical;
		if(vert) {
			rect_w = lh * fz;
			rect_h = pref_len * fz;
		} else {
			rect_w = pref_len * fz;
			rect_h = lh * fz;
		}
		_rect = paper.unirect({
			x : cx - 0.5 * rect_w,
			y : cy - 0.5 * rect_h,
			width : rect_w,
			height : rect_h,
			color : color
		});
		
		_txt = paper.unitext({
			x : cx,
			y : cy,
			text : ops.text,
			fz : fz,
			color : _white,
			vertical : vert
		});
		var result = paper.set();
		result.push(_rect, _txt);
		return result;
	};
	
	Raphael.fn.singleBox.defaults = {
			cx : 0,
			cy : 0,
			text : "node",
			fz : 12,
			lineHeight : 2,
			color : _blue,
			vertical : false
	};
	
})(Raphael, jQuery);