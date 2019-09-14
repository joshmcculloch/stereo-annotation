function canvas_arrow(context, fromx, fromy, tox, toy) {
  var headlen = 40; // length of head in pixels
  var dx = tox - fromx;
  var dy = toy - fromy;
  var angle = Math.atan2(dy, dx);
  context.moveTo(fromx, fromy);
  context.lineTo(tox, toy);
  context.moveTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  context.moveTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}

function push_action(dataset, params) {
	var esc = encodeURIComponent;
	var query = Object.keys(params)
		.map(k => esc(k) + '=' + esc(params[k]))
		.join('&');
	console.log(query);
	
	var request = new XMLHttpRequest();
	request.open('GET', 'api/'+dataset+"/action?"+query, true);
	
	request.onload = function() {
		if (this.status >= 200 && this.status < 400) {
			// Success!
			//var data = JSON.parse(this.response);
		} else {
			// We reached our target server, but it returned an error
		}
	};
	request.onerror = function() {
		// There was a connection error of some sort
		var status = document.getElementById("status");
		status.innerHTML = "Bad!";
		status.className = "bad";
		console.log("error");
	};
	
	request.send()
}

function get_datasets(callback) {
	
	var request = new XMLHttpRequest();
	request.open('GET', 'api/', true);
	
	request.onload = function() {
		if (this.status >= 200 && this.status < 400) {
			// Success!
			var data = JSON.parse(this.response);
			callback(data.datasets);
		} else {
			// We reached our target server, but it returned an error
		}
	};
	request.onerror = function() {
		// There was a connection error of some sort
		var status = document.getElementById("status");
		status.innerHTML = "Bad!";
		status.className = "bad";
		console.log("error");
	};
	
	request.send()
}

function add_dataset_to_select(dataset, cursor, left, right) {
	var select = document.getElementById("dataset_selector");
	var span = document.createElement('span');
	span.className = "dataset";
	select.appendChild(span);
	
	var load = document.createElement('button');
	load.appendChild(document.createTextNode('Load'));
	if (dataset.checkout) {
		load.disabled = true;
	} else {
		load.onclick = function () {
			right.set_image(dataset.right);
			left.set_image(dataset.left);
			cursor.load_dataset(dataset);
		};
	}

	span.appendChild(load);
	span.appendChild(document.createTextNode(dataset.name));

}
