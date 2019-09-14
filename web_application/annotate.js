var MouseState = Object.freeze({"up":1, "down":2, "dragging":3});

class ImageViewer {
	
	constructor (canvas_id, primary, secondary, wheel, update, draw, keydown) {
		this.view_x = 0;
		this.view_y = 0;
		this.view_zoom = 0.1;
		this.canvas = document.getElementById(canvas_id);
		this.context = this.canvas.getContext("2d");
		this.image = undefined;
		this.otherImageViewer = undefined;
		this.setup_canvas();
		this.state = MouseState.up;
		this.mouse_over = false;
		this.mouse_x = 0;
		this.mouse_y = 0;
		this.debug = true;
		
		// Cursor Callbacks
		this.cursor_primary = primary;
		this.cursor_secondary = secondary;
		this.cursor_wheel = wheel;
		this.cursor_update = update;
		this.cursor_draw = draw;
		this.cursor_keydown = keydown;
	}
	
	setup_canvas () {
		this.canvas.style.width ='100%';
		this.canvas.style.height='100%';
		this.canvas.width  = this.canvas.offsetWidth;
		this.canvas.height = this.canvas.offsetHeight;
		var self = this;
		this.canvas.onmousedown = function(event){self.mouse_handler(event);};
		this.canvas.onmouseup = function(event){self.mouse_handler(event);};
		this.canvas.onwheel = function(event){self.wheel_handler(event);};
		this.canvas.onmousemove = function(event){self.mouse_move(event);};
		this.canvas.onmouseout = function(event){self.mouse_out_handler(event);};
		this.canvas.onkeydown = function (event) {self.keydown_handler(event);};
		this.canvas.oncontextmenu = function (event) {event.preventDefault();};
	}
	
	mouse_handler (event) {
		if (event.which == 1 && event.type == "mousedown") {
			if (this.state == MouseState.up) {
				this.state = MouseState.down;
			} 
		}
		
		if (event.which == 1 && event.type == "mouseup") {
			if (this.state == MouseState.down) {
				console.log("Do annotation");
				if (this.cursor_primary !== undefined) {
					this.cursor_primary(this.mouse_x, this.mouse_y);
				}
				this.state = MouseState.up;
			}
			else if (this.state == MouseState.dragging) {
				this.state = MouseState.up;
			} 
		}
		
		if (event.which == 3 && event.type == "mouseup") {
			console.log("Do annotation alternate");
			if (this.cursor_secondary !== undefined) {
				this.cursor_secondary(this.mouse_x, this.mouse_y);
			}
		}
		this.update_other_view();
		this.draw();
	}
	
	mouse_move (event) {
		// Update mouse position
		var rect = this.canvas.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;
		// Convert mouse coord to image coord			
		this.mouse_x  = Math.floor((x - this.canvas.width/2)/this.view_zoom-this.view_x);
		this.mouse_y = Math.floor((y - this.canvas.height/2)/this.view_zoom-this.view_y);
		this.mouse_over = true;
		if (this.cursor_update !== undefined) {
			this.cursor_update(this.mouse_x, this.mouse_y);
		}
		
		// Update mouse state
		if (this.state == MouseState.down) {
			this.state = MouseState.dragging;
		}
		if (this.state == MouseState.dragging) {
			this.view_x += event.movementX/this.view_zoom;
			this.view_y += event.movementY/this.view_zoom;
		}
		
		this.update_other_view();
		this.draw();
	}
	
	mouse_out_handler (event) {
		this.mouse_over = false;
		
		if (this.state == MouseState.dragging) {
			this.state = MouseState.up;
		}
		this.update_other_view();
		this.draw();
	}
	
	wheel_handler (event) {
		if (event.shiftKey) {
			if (this.cursor_wheel !== undefined) {
				this.cursor_wheel(event.deltaY);
			}
		} else {
			this.view_zoom *= 1 + event.deltaY  * 0.1;
		}
		this.update_other_view();
		this.draw();
	}
	
	keydown_handler (event) {
		this.cursor_keydown(event.key);
		this.update_other_view();
		this.draw();
	}
	
	set_pos_zoom(x, y, z) {
		this.view_x = x;
		this.view_y = y;
		this.view_zoom = z;
		this.draw();
	}
	
	update_other_view() {
		if (this.otherImageViewer !== undefined) {
			this.otherImageViewer.set_pos_zoom(this.view_x, 
				this.view_y, 
				this.view_zoom);
		}
	}
	
	set_image (image_url) {
		this.image = new Image();
		this.image.src = image_url;
		var self = this;
		this.image.onload = function() {
			self.view_x = -this.width/2;
			self.view_y = -this.height/2;
			self.view_zoom = self.canvas.width / this.width;
			self.draw();
		};
	}
	
	draw () {
		this.canvas.width  = this.canvas.offsetWidth;
		this.canvas.height = this.canvas.offsetHeight;
		
		// Draw background
		this.context.beginPath();
		this.context.rect(0,0, this.canvas.width, this.canvas.height);
		this.context.fillStyle = "black";
		this.context.fill();
		
		// Draw image
		if (this.image !== undefined) {
			this.context.save();
			this.context.translate(this.canvas.width/2, this.canvas.height/2);
			this.context.scale(this.view_zoom,this.view_zoom);
			this.context.translate(this.view_x, this.view_y);
			this.context.drawImage(this.image,0,0);
			this.context.restore();
		}
		
		// Draw cursor
		if (this.cursor_draw !== undefined) {
			this.context.save();
			this.context.translate(this.canvas.width/2, this.canvas.height/2);
			this.context.scale(this.view_zoom,this.view_zoom);
			this.context.translate(this.view_x, this.view_y);
			this.cursor_draw(this.context);
			this.context.restore();
		}
		
		// Draw debug info
		if (this.debug) {
			
			var debug_window_height = 100;
			var debug_window_width = this.canvas.width;
			this.context.fillStyle = "rgba(0,0,0,0.4)";
			this.context.beginPath();
			this.context.rect(0, 
				this.canvas.height-debug_window_height,
				debug_window_width,
				debug_window_height);
			this.context.fill();
			
			this.context.fillStyle = "white";
			this.context.font = "Bold 16px Sans-Serif";
			var top = this.canvas.height-debug_window_height;
			if (this.image !== undefined) {
				this.context.fillText(this.image.src, 10, top+20)
			}
			switch (this.state) {
				case MouseState.up:
				this.context.fillText("State: UP", 10, top+40)
				break;
				case MouseState.down:
				this.context.fillText("State: DOWN", 10, top+40)
				break;
				case MouseState.dragging:
				this.context.fillText("State: DRAGGING", 10, top+40)
				break;
			}
			this.context.fillText("Mouse: "+this.mouse_x + ", " + this.mouse_y +" : " +this.mouse_over, 10, top+60)
			//this.context.fillText("placeholder line", 10, top+80)
		}
	}
}


var CursorState = Object.freeze({
	"not_ready":0,
	"ready":1, 
	"selected":2,
	"placing":3, 
	"edit":4,
	"disparity":5});

class Cursor {
	constructor () {
		this.diameter = 30;
		this.x = 0;
		this.y = 0;
		this.state = CursorState.not_ready;
		this.selected = undefined;
		this.features = [];
		this.debug = true;
		this.update_debug();
		this.feature_counter = 0;
		this.mouse_over_left = false;
		this.mouse_over_right = false;
		this.average_disparity = 0;
		this.dataset = undefined;
	}
	
	load_dataset (dataset) {
		console.log("loading " + dataset.name)
		this.state_not_ready();
		document.getElementById("actions").innerHTML = "";
		this.features = [];
		this.dataset = dataset;
		this.load_actions(this.dataset.actions)
		this.update_debug;
	}
	
	load_actions (path) {
		console.log(path)
		var request = new XMLHttpRequest();
		request.open('GET', path, true);
		var self = this;
		request.onload = function() {
			if (this.status >= 200 && this.status < 400) {
				// Success!
				var data = JSON.parse(this.response);
				console.log("Loading actions");
				data.forEach(function (action) {
					console.log(action);
					switch (action.action) {
						
						case "place":
							self.action_place (Number(action.x), 
								Number(action.y), 
								Number(action.disparity), 
								Number(action.diameter), 
								Number(action.previous_id), 
								false);
							console.assert(self.features[self.features.length-1].id == Number(action.id), "new node id mismatch")
							break;
						
						case "move":
							self.action_move (self.get_feature_by_ID(Number(action.id)), 
								Number(action.x),
								Number(action.y),
								Number(action.diameter),
								false);
							break;
						
						case "disparity":
							self.action_disparity (self.get_feature_by_ID(Number(action.id)), 
								Number(action.disparity),
								false) 
							break;
						
						case "set_previous":
							self.action_set_previous (self.get_feature_by_ID(Number(action.id)),
								self.get_feature_by_ID(Number(action.previous_id)),
								false);
							break;
						
						case "unset_previous":
							self.action_unset_previous (self.get_feature_by_ID(Number(action.id)),
								false);
							break;
						
						case "delete":
							self.action_delete(self.get_feature_by_ID(Number(action.id)), false)
							break;
					}
				});
				self.state_ready();
			} else {
				// We reached our target server, but it returned an error
			}
		};
		request.onerror = function() {
			// There was a connection error of some sort
			var status = document.getElementById("status");
			status.innerHTML = "Bad!";
			status.className = "bad";
			console.log("error: unable to load actions");
		};
		
		request.send()
		
	}
	update_debug () {
		if (this.debug) {
			var debug_span = document.getElementById("cursor_state");
			debug_span.innerHTML = "Cursor state: ";
			switch (this.state) {
				case CursorState.not_ready:
				debug_span.innerHTML += "not ready";
				break;
				case CursorState.ready:
				debug_span.innerHTML += "ready";
				break;
				case CursorState.selected:
				debug_span.innerHTML += "selected";
				break;
				case CursorState.placing:
				debug_span.innerHTML += "placing";
				break;
				case CursorState.edit:
				debug_span.innerHTML += "edit";
				break;
				case CursorState.disparity:
				debug_span.innerHTML += "disparity";
				break;
				
			} 
			debug_span.innerHTML += "<br/>prvious_feature: ";
			debug_span.innerHTML += this.selected !== undefined;
			debug_span.innerHTML += "<br/>Features: ";
			debug_span.innerHTML += this.features.length;
			debug_span.innerHTML += "<br/>Average Disparity: ";
			debug_span.innerHTML += this.average_disparity;
		}
	}
	
	do_left_primary(x,y) {
		var over_feature = this.select(x,y);
		switch (this.state) {
			case CursorState.ready:
				if (over_feature !== undefined) {
					this.state_selected(over_feature);
				} else {
					this.state_placing();
				}
				break;
			
			case CursorState.selected:
				if (over_feature !== undefined) {
					this.action_set_previous(this.selected, over_feature);
					this.state_ready();
				} else {
					this.state_placing();
				}
				break;
			
			case CursorState.placing:
				var previous_id = -1;
				if (this.selected !== undefined) {
					previous_id = this.selected.id;
				}
				this.action_place(this.x, this.y, this.average_disparity, this.diameter, previous_id);
				break;
				
			case CursorState.edit:
				console.log("Save new position");
				this.action_move(this.selected, this.x, this.y, this.diameter)
				this.state_ready();
				break;
				
			case CursorState.disparity:
				console.log("Save new disparity");
				this.state_ready();
				break;
		}
		this.update_debug();
	}
	
	do_left_secondary(x,y) {
		switch (this.state) {
			case CursorState.ready:
			break;
			case CursorState.selected:
				this.state_ready()
				break;
			case CursorState.placing:
				this.state_ready();
				break;
			case CursorState.edit:
				console.log("Disregard new position");
				this.state_ready();
				break;
				
			case CursorState.disparity:
				console.log("Disregard new disparity");
				this.state_ready();
				break;
		}
		this.update_debug();
	}
	
	do_left_wheel(d) {
		this.diameter += d;
	}
	
	do_left_update(x,y) {
		this.x = x;
		this.y = y;
		this.mouse_over_left = true;
		this.mouse_over_right = false;
	}
	
	do_left_draw(context) {
		context.lineWidth = 1;
		context.strokeStyle = "black";
		if (this.state == CursorState.placing) {
			context.beginPath();
			context.arc(this.x,this.y,this.diameter,0,2*Math.PI);
			context.fillStyle = "rgba(200,255,200,0.3)";
			context.fill();
			context.stroke();
			
			if (this.selected !== undefined) {
				context.beginPath()
				context.moveTo(this.x,this.y);
				context.lineTo(this.selected.x, this.selected.y);
				context.lineWidth = 5;
				context.strokeStyle = "red";
				context.stroke();
			} 
		}
		
		if (this.state == CursorState.edit && this.mouse_over_left) {
			context.beginPath();
			context.arc(this.x,this.y,this.diameter,0,2*Math.PI);
			context.fillStyle = "rgba(200,255,200,0.3)";
			context.fill();
			context.stroke();
		}
		
		if (this.state == CursorState.disparity && this.mouse_over_left) {
			context.beginPath();
			context.arc(this.selected.x,this.y,this.selected.diameter,0,2*Math.PI);
			context.fillStyle = "rgba(200,255,200,0.3)";
			context.fill();
			context.stroke();
			
			context.lineWidth = 5;
			context.strokeStyle = "yellow";
			context.setLineDash([5,5]);
			context.beginPath();
			context.moveTo(this.selected.x, 0);
			context.lineTo(this.selected.x, 10000);
			console.log(context.canvas.height);
			context.stroke();
			context.setLineDash([]);
		}
		
		context.lineWidth = 1;
		context.strokeStyle = "black";
		this.features.forEach ((f) => f.draw(context,f == this.selected));
	}
	
	do_left_keydown(key) {
		if (this.state == CursorState.selected && key.toLowerCase() == "d") {
			this.state_disparity();
		}
		if (this.state == CursorState.selected && key.toLowerCase() == "e") {
			this.state_edit();
		}
		if(this.state == CursorState.selected && key.toLowerCase() == "delete") {
			this.action_delete(this.selected);
		}
		console.log(key);
		this.update_debug();
	}
	
	do_right_primary(x,y) {
		var over_feature = this.select_disparity(x,y);
		switch (this.state) {
			case CursorState.ready:
				if (over_feature !== undefined) {
					this.state_selected(over_feature);
				} else {
					this.state_placing();
				}
				break;
			
			case CursorState.selected:
				if (over_feature !== undefined) {
					this.action_set_previous(this.selected, over_feature);
					this.state_ready();
				} else {
					this.state_placing();
				}
				break;
			
			case CursorState.placing:
				this.action_place(this.x, this.y, 0, this.diameter);
				break;
				
			case CursorState.edit:
				console.log("Save new position");
				this.action_move(this.selected, this.x, this.y-this.selected.disparity, this.diameter)
				this.state_ready();
				break;
				
			case CursorState.disparity:
				console.log("Save new disparity");
				this.action_disparity(this.selected, this.y - this.selected.y)
				this.state_ready();
				break;
		}
		this.update_debug();
	}
	
	do_right_secondary(x,y) {
		this.do_left_secondary(x,y);
	}
	
	do_right_wheel(d) {
		this.diameter += d;
	}
	
	do_right_update(x,y) {
		this.x = x;
		this.y = y;
		this.mouse_over_left = false;
		this.mouse_over_right = true;
	}
	
	do_right_draw(context) {
		if (this.state == CursorState.placing) {
			context.beginPath();
			context.arc(this.x,this.y,this.diameter,0,2*Math.PI);
			context.fillStyle = "rgba(200,255,200,0.3)";
			context.fill();
			context.strokeStyle = "black";
			context.stroke();
			
			if (this.selected !== undefined) {
				context.beginPath()
				context.moveTo(this.x,this.y);
				context.lineTo(this.selected.x, this.selected.y);
				context.lineWidth = 5;
				context.strokeStyle = "red";
				context.stroke();
			}
		}
		
		if (this.state == CursorState.edit && this.mouse_over_right) {
			context.beginPath();
			context.arc(this.x,this.y,this.diameter,0,2*Math.PI);
			context.fillStyle = "rgba(200,255,200,0.3)";
			context.fill();
			context.stroke();
		}
		
		if (this.state == CursorState.disparity && this.mouse_over_right) {
			context.beginPath();
			context.arc(this.selected.x,this.y,this.selected.diameter,0,2*Math.PI);
			context.fillStyle = "rgba(200,255,200,0.3)";
			context.fill();
			context.stroke();
			
			context.lineWidth = 5;
			context.strokeStyle = "yellow";
			context.setLineDash([5,5]);
			context.beginPath();
			context.moveTo(this.selected.x, 0);
			context.lineTo(this.selected.x, 10000);
			console.log(context.canvas.height);
			context.stroke();
			context.setLineDash([]);
		}
		
		this.features.forEach ((f) => f.draw_disparity(context,f == this.selected));
	}
	
	do_right_keydown(key) {
		this.do_left_keydown(key);
	}
	
	state_not_ready () {
		this.selected = undefined;
		this.state = CursorState.not_ready;
	}
	
	state_ready () {
		this.selected = undefined;
		this.state = CursorState.ready;
	}
	
	state_selected (feature) {
		this.selected = feature;
		this.state = CursorState.selected;
	}
	
	state_placing () {
		this.calc_average_disparity();
		this.state = CursorState.placing;
	}
	
	state_edit () {
		this.state = CursorState.edit;
	}
	
	state_disparity () {
		this.state = CursorState.disparity;
	}
	
	action_place (x, y, disparity, diameter, previous_id, push) {
		if (push == undefined) {push=true;}
		
		// If previous_id is defined, find the node with that id
		var previous = undefined
		if (previous_id >= 0) {
			previous = this.get_feature_by_ID(previous_id)
			console.assert(previous !== undefined, "Failed to find previous node");
		}
		
		this.add_to_action_list("Feature("+this.feature_counter +","+
			x+","+
			y+","+
			disparity+","+
			diameter+","+
			previous_id+")");
		
			
		var f = new Feature(this.feature_counter, x, y, disparity, diameter, previous);
		if (push) {
			push_action(this.dataset.name,{"action": "place", "id": f.id, "x": x, "y":y, "disparity": disparity, "diameter": diameter, "previous_id": previous_id});
		}
		this.selected = f;
		this.features.push(f);
		this.feature_counter += 1;
		this.calc_average_disparity();
	}
	
	action_move (node, x, y, diameter,push) {
		if (push == undefined) {push=true;}
		this.add_to_action_list("Move("+node.id +","+
			x+","+
			y+","+
			diameter+")");
		node.x = x;
		node.y = y;
		node.diameter = diameter;
		if (push) {
			push_action(this.dataset.name,{"action": "move", "id": node.id, "x": x, "y":y, "diameter": diameter});
		}
	}
	
	action_disparity (node, disparity,push) {
		if (push == undefined) {push=true;}
		this.add_to_action_list("Disparity("+node.id +","+disparity+")");
		if (push) {
			push_action(this.dataset.name,{"action": "disparity", "id": node.id, "disparity": disparity});
		}
		node.disparity = disparity;
	}
	
	action_delete (node,push) {
		if (push == undefined) {push=true;}
		// Unset any features which refer to this node as there previous
		var self = this;
		this.features.forEach(function (feature){
			if (feature.previous == node) {
				self.action_unset_previous(feature);
			}
		});
		
		this.add_to_action_list("Delete("+node.id +")");
		if (push) {
			push_action(this.dataset.name,{"action": "delete", "id": node.id});
		}
		
		var index = this.features.indexOf(node);
		if (index > -1) {
			this.features.splice(index, 1);
		} else {
			console.log("unable to find node to delete");
		}
		if (node.previous !== undefined) {
			this.state_selected(node.previous);
		} else {
			this.state_ready();
		}
	}
	
	action_set_previous (child,previous,push) {
		if (push == undefined) {push=true;}
		this.add_to_action_list("set_previous("+child.id+","+previous.id+")");
		if (push) {
			push_action(this.dataset.name,{"action": "set_previous", "id": child.id, "previous_id": previous.id});
		}
		child.previous = previous;
	}
	
	action_unset_previous (child,push) {
		if (push == undefined) {push=true;}
		this.add_to_action_list("unset_previous("+child.id+")");
		if (push) {
			push_action(this.dataset.name,{"action": "unset_previous", "id": child.id});
		}
		child.previous = undefined;
	}
	
	add_to_action_list (text) {
		return;
		var action_list = document.getElementById("actions");
		var li = document.createElement('li');
		li.appendChild(document.createTextNode(text));
		action_list.appendChild(li);
	}
	
	select(x,y) {
		var selected = undefined;
		this.features.forEach ((f) => {
			var distance = Math.sqrt((x-f.x)**2 + (y-f.y)**2);
			if (distance < f.diameter) {
				selected = f;
			}
		});
		return selected;
	}
	
	select_disparity(x,y) {
		var selected = undefined;
		this.features.forEach ((f) => {
			var distance = Math.sqrt((x-f.x)**2 + (y-(f.y+f.disparity))**2);
			if (distance < f.diameter) {
				selected = f;
			}
		});
		return selected;
	}
	
	calc_average_disparity () {
		var average_disparity = 0;
		this.features.forEach ((f) => average_disparity += f.disparity);
		if (this.features.length > 0) { 
			average_disparity /= this.features.length;
		}
		this.average_disparity = Math.floor(average_disparity);
		this.update_debug();
	}
	
	get_feature_by_ID(id) {
		var feature = undefined;
		this.features.forEach(function(f){if (f.id==id) {feature=f}});
		console.assert(feature !== undefined, "Failed to find node", id);
		return feature;
	}
}

class Feature {
	constructor (id, x, y, disparity, diameter, previous) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.disparity = disparity;
		this.diameter = diameter;
		this.previous = previous;
	}
	
	draw(context, selected) {
		if (this.previous !== undefined) {
			context.lineWidth = 8;
			context.strokeStyle = "black";
			context.beginPath()
			canvas_arrow(context, this.x,this.y, this.previous.x, this.previous.y)
			context.stroke();
			context.lineWidth = 4;
			context.strokeStyle = "white";
			context.stroke();
		} 
		
		context.lineWidth = 1;
		context.strokeStyle = "black";
		if (selected) {
			context.lineWidth = 4;
			context.strokeStyle = "white";
		}
		context.beginPath();
		context.arc(this.x,this.y,this.diameter,0,2*Math.PI);
		context.fillStyle = "rgba(200,255,200,0.3)";
		context.fill();
		context.stroke();
	}
	
	draw_disparity(context, selected) {
		if (this.previous !== undefined) {
			context.lineWidth = 8;
			context.strokeStyle = "black";
			context.beginPath()
			canvas_arrow(context, this.x,this.y+this.disparity, this.previous.x, this.previous.y+this.previous.disparity)
			context.stroke();
			context.lineWidth = 4;
			context.strokeStyle = "white";
			context.stroke();;
		} 
		
		context.lineWidth = 1;
		context.strokeStyle = "black";
		if (selected) {
			context.lineWidth = 4;
			context.strokeStyle = "white";
		}
		context.beginPath();
		context.arc(this.x,this.y+this.disparity,this.diameter,0,2*Math.PI);
		context.fillStyle = "rgba(200,255,200,0.3)";
		context.fill();
		context.stroke();
	}
}
 
