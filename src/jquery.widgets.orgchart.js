/**
 * organization chart jQuery plugin
 * 
 * <p>A jQuery ui widget that draw organization chart.</p>
 * 
 * <p>组织结构图插件</p>
 * 
 * @requires jquery.ui.widget.js:1.8+, Raphael.js 2.1.0, raphael.orgbox.js
 * @author LiuLongbiao
 * @email liulongbiao@gmail.com
 */
;(function($, Raphael, Math, undefined){
	
	var _max = Math.max, _min = Math.min, _floor = Math.floor;
	
	function isHalfEm(ch) {
		return (/^[0-9a-z\(\)\.]$/g).test(ch);
	}
	
	function _sum(arr, j) {
		if(j === undefined) {
			j = arr.length;
		} else if(j < 0) {
			j = arr.length - j;
		}
		var sum = 0;
		for(var i = 0; i < j; i ++) {
			sum += arr[i];
		}
		return sum;
	}
	
	function _randomHex2() {
		var result = (Math.floor(0xFF * Math.random())).toString(16);
		if(result.length === 1) {
			result = "0" + result;
		}
		return result;
	}
	
	function OrgNode(info, children) {
		this.info = info;
		this.children = (children && children.length) ? children : [];
	}
	
	OrgNode.prototype = {
			addChild : function(child) {
				this.children.push(child);
			},
			isLeaf : function() {
				return this.children.length === 0;
			},
			isRoot : function() {
				return this._level === 1;
			}
	};
	
	function OrgBox(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	
	OrgBox.prototype = {
			point : function(rowdir, coldir) {
				var slf = this, bx = slf.x, by = slf.y, bw = slf.width, bh = slf.height;
				rowdir = rowdir || "center";
				coldir = coldir || "center";
				var y_offset = (rowdir === "top") ? 0 : (rowdir === "bottom") ? 1 : 0.5;
				var x_offset = (coldir === "left") ? 0 : (coldir === "right") ? 1 : 0.5;
				return {
					x : bx + bw * x_offset,
					y : by + bh * y_offset
				};
			},
			center : function(rowdir) {
				return this.point(rowdir, "center");
			}
	};
	
	$.widget("widgets.orgchart", {
		version : "1.0.0",
		options : {
			idKey : "id",
			pIdKey : "pid",
			maxFz : 14,
			minHgap : 2,
			minVgap : 4,
			width : 960,
			height : 480,
			isVert : function(level, info, node) {
				return level > 3;
			},
			cellem : function(info) {
				return 3;
			},
			wordem : function(info) {
				var slf = this, ops = slf.options;
				var nmEm = slf._countEm(info.name);
				var valEm = slf._countEm(info.value);
				return _max(nmEm, valEm) + 1;
			},
			paintNode : function(info, level, cbox, node, pnode) {
				var slf = this, ops = slf.options;
				var center = cbox.center("center");
				var vert = ops.isVert.call(slf, level, info, node);
				var color;
				if(vert && pnode._color) {
					color = pnode._color;
				} else {
					color = slf._randomColor();
				}
				node._color = color;
				var cell = slf._paper.twinBox({
					cx : center.x,
					cy : center.y,
					text1 : info.name,
					text2 : info.value,
					fz : slf._fz,
					color : color,
					vertical : vert
				});
				cell.click(function() {
					slf._trigger("nodeclick", null, info, node);
				});
			}
		},
		
		_create: function () {
			var slf = this, dom = slf.element.get(0), ops = slf.options;
			slf._paper = Raphael(dom, ops.width, ops.height);
		},
		
		_init : function() {
			var slf = this, $el = slf.element, ops = slf.options, w = ops.width, h = ops.height;
			$el.css({
				"width" : w,
				"height" : h
			});
			slf._paper.setSize(w, h);
			slf.draw([]);
		},
		
		draw : function(datas, rootid) {
			var slf = this;
			slf.clear();
			var root = slf._buildTree(datas, rootid);
			if(!root) {
				slf._drawEmpty();
				return false;
			}
			
			slf.rows = 0;
			slf.vgroup = {};
			slf.vems = {};
			slf._preRows(root, 1);
			
			slf.columns = 0;
			slf._preColumns(root);
			
			slf._vpos = {};
			slf._calcFontSize(root);
			
			slf._preBox(root);
			
			slf._draw(root);
		},
		
		_buildTree : function(rawdatas, rootid) {
			var slf = this, ops = slf.options, idKey = ops.idKey, pIdKey = ops.pIdKey;
			var _pool = {}, _group = {};
			if(!rawdatas || rawdatas.length === 0) {
				return null;
			}
			$.each(rawdatas, function(i, nd) {
				var pid = nd[pIdKey], gid;
				_pool[nd[idKey]] = nd;
				gid = pid || "__free__";
				_group[gid] = _group[gid] || [];
				_group[gid].push(nd);
			});
			if(!rootid) {
				if(_group.__free__.length === 1) {
					rootid = _group.__free__[0][idKey];
				} else {
					var _free = {name:"根节点",value:""};
					rootid = _free[idKey] = "__free__";
					_free[pIdKey] = null;
					
					_pool.__free__ = _free;
				}
			}
			var root = slf._assemble(_pool, _group, rootid);
			return root;
		},
		
		_assemble : function(pool, group, rootid) {
			var slf = this, idKey = slf.options.idKey;
			var result = null, info = pool[rootid], children = group[rootid];
			if(info) {
				result = new OrgNode(info);

				if(children && children.length) {
					$.each(children, function(i, chd) {
						var nd = slf._assemble(pool, group, chd[idKey]);
						result.addChild(nd);
					});
				}
			}
			return result;
		},
		
		_preRows : function(node, level) {
			var slf = this, children = node.children, vgroup = slf.vgroup, vems = slf.vems;
			var ops = slf.options;
			
			node._level = level;
			slf.rows = _max(slf.rows, level);
			
			vgroup[level] = vgroup[level] || [];
			vgroup[level].push(node);
			
			var vem = node._vem = slf._calcEm(node, true);
			vems[level] = _max(vems[level] || 0, vem);
			
			if(children && children.length) {
				$.each(children, function(i, nd) {
					slf._preRows(nd, level + 1);
				});
			}
		},
		
		_calcEm : function(node, isv) {
			var slf = this, ops = slf.options, info = node.info;
			var vert = ops.isVert.call(slf, node._level, info, node);
			var func = (vert != isv) ? ops.cellem : ops.wordem;
			return func.call(slf, info);
		},
		
		_preColumns : function(node, parent) {
			var slf = this, ops = slf.options, children = node.children;
			var hem = node._hem = slf._calcEm(node, false);

			node._hem_clds = [];
			
			var start = slf.columns;
			if(node.isLeaf()) {
				slf.columns += 1;
			} else {
				$.each(children, function(i, nd) {
					slf._preColumns(nd, node);
				});
			}
			var end = slf.columns;
			
			node._colSpan = end - start;
			
			var _hem_cld = _sum(node._hem_clds);
			var _hem_box = node._hem_box = _max(hem, _hem_cld);
			node._hem_margin = (_hem_box - _hem_cld) / 2;

			if(parent) {
				parent._hem_clds = parent._hem_clds || [];
				parent._hem_clds.push(_hem_box);
			}
		},
		
		_calcFontSize : function(root) {
			var slf = this, ops = slf.options;
			var width = ops.width, height = ops.height;
			var rows = slf.rows, mustVems = 0, vems = slf.vems;
			for(var i = 1; i <= rows; i ++) {
				mustVems += vems[i];
			}
			var minVfz = (height - ops.minVgap * rows) / mustVems;
			var mustHems = root._hem_box, columns = root._colSpan;
			var minHfz = (width - ops.minHgap * columns) / mustHems;
			var fz = _min(minVfz, minHfz, ops.maxFz);
			slf._fz = fz;
			
			var vgap = slf._vgap = (height - mustVems * fz) / rows;
			var vpos = slf._vpos, vstart = 0, vh = 0;
			for(var j = 1; j <= rows; j ++) {
				vh = vems[j] * fz + vgap;
				vpos[j] = {
					y : vstart,
					height : vh
				};
				vstart += vh;
			}
			
			slf._hgap = (width - mustHems * fz) / columns;
		},
		
		_preBox : function(node, parent, i) {
			var slf = this, ops = slf.options, level = node._level, children = node.children;
			var _vpos = slf._vpos[level], _hgap = slf._hgap, fz = slf._fz;
			var x, width;
			if(!parent) {
				x = 0;
				width = ops.width;
			} else {
				var pbox = parent._bbox, pwidth = pbox.width;
				var pchildren = parent.children;
				var p_hem_clds = parent._hem_clds;
				var pre_hems = _sum(p_hem_clds, i);
				var gaps = 0;
				for(var j = 0; j < i; j ++) {
					gaps += pchildren[j]._colSpan;
				}
				x = pbox.x + gaps * _hgap + (parent._hem_margin + pre_hems) * fz;
				width = node._colSpan * _hgap + node._hem_box * fz;
			}
			
			var bbox = node._bbox = new OrgBox(x, _vpos.y, width, _vpos.height);
			
			var cellx, celly, cellw = node._hem * fz, cellh = node._vem * fz;
			var vert = ops.isVert.call(slf, level, node.info, node);
			if(vert) {
				var top = bbox.center("top");
				cellx = top.x  - cellw / 2;
				celly = top.y + slf._vgap / 2;
			} else {
				var center = bbox.center("center");
				cellx = center.x - cellw / 2 ;
				celly = center.y - cellh / 2;
			}
			node._cbox = new OrgBox(cellx, celly, cellw, cellh);
			
			if(children && children.length) {
				$.each(children, function(j, nd) {
					slf._preBox(nd, node, j);
				});
			}
		},
		
		_draw : function(node, parent) {
			var slf = this;
			var bbox = node._bbox, cbox = node._cbox, children = node.children, clen = children.length;
			if(!node.isRoot()) {
				slf._drawLine(bbox.center("top"), cbox.center("top"));
			}
			if(clen > 0) {
				slf._drawLine(cbox.center("bottom"), bbox.center("bottom"));
				if(clen === 1) {
					slf._drawLine(children[0]._bbox.center("top"), 
						bbox.center("bottom"));
				} else {
					slf._drawLine(children[0]._bbox.center("top"), 
						children[clen - 1]._bbox.center("top"));
				}
			}

			var paintNode = slf.options.paintNode;
			if($.isFunction(paintNode)) {
				paintNode.call(slf, node.info, node._level, cbox, node, parent);
			}
			
			if(children && children.length) {
				$.each(children, function(i, nd) {
					slf._draw(nd, node);
				});
			}
		},
		
		_drawLine : function(p1, p2) {
			var line = "M" + p1.x + "," + p1.y + "L" + p2.x + "," + p2.y + "Z";
			this._paper.path(line).attr({"stroke-width" : 0.2});
		},
		
		clear : function() {
			this._paper.clear();
		},
		
		_drawEmpty : function() {
			var slf = this, ops = slf.options;
			slf._paper.singleBox({
				cx : ops.width / 2,
				cy : ops.height / 2,
				text : "等待数据填充...",
				fz : 20
			});
		},
		
		_countEm : function(str) {
			var halfs = 0, len = str.length, ch;
			for(var i = 0; i < len; i ++) {
				ch = str.charAt(i);
				if(isHalfEm(ch)) {
					halfs ++;
				}
			}
			return len - 0.5 * halfs;
		},
		
		_randomColor : function() {
			return "#" + _randomHex2() + _randomHex2() + _randomHex2();
		},
		
		destory : function() {
			var slf = this;
			slf._paper.remove();
			$.widgets.orgchart.prototype.destroy.call(slf);
		}
	});
	
})(jQuery, Raphael, Math);