import http.server
from http import HTTPStatus
from urllib.parse import urlparse, parse_qs
from os import listdir
from os.path import isdir, isfile
import json


class AnnotationHandler(http.server.SimpleHTTPRequestHandler):
	
	def do_GET(self):
		self.datadir = "./datasets/"
		url = urlparse(self.path)
		path = url[2][1:].split("/")
		path = [p for p in path if p != '']
		if len(path) > 0 and path[0] == "api":
			self.get_api(path)
		else:
			super(AnnotationHandler,self).do_GET()
	
	def get_api(self, path):
		if len(path) == 1:
			self.get_datasets()
		elif len(path) == 3:
			if path[1] in [d["name"] for d in self.datasets()]:
				if path[2] == "history":
					self.get_history(path[1])
				elif path[2] == "action":
					self.get_perform_action(path[1])
				else:
					self.error("invalid dataset request")
			else:
				self.error("invalid dataset name")
		else:
			self.error("invalid api request")
	
	def get_datasets(self):
		self.send_response(HTTPStatus.OK)
		self.send_header("Content-type", "application/json")
		self.end_headers()
		self.wfile.write(json.dumps({"datasets":self.datasets()}).encode("ascii"))
		
	def get_history(self,dataset):
		self.send_response(HTTPStatus.OK)
		self.send_header("Content-type", "application/json")
		self.end_headers()
		self.wfile.write("history".encode("ascii"))
		
	def get_perform_action(self,dataset):
		url = urlparse(self.path)
		qs = parse_qs(url[4])
		print(qs)
		self.save_action(dataset, qs)
		self.send_response(HTTPStatus.OK)
		self.send_header("Content-type", "application/json")
		self.end_headers()
		self.wfile.write("{\"state\": \"success\"}".encode("ascii"))
		
	def datasets(self):
		contents = listdir(self.datadir)
		datasets = [self.data_set_info(self.datadir+c) for c in contents if self.isdataset(self.datadir+c)]
		datasets.sort(key=lambda i:i['name'])
		return datasets
		
	def isdataset(self,path):
		if not(isdir(path)):
			return False
		else:
			files = listdir(path)
			if "left.png" in files and "right.png" in files:
				# create actions file
				if not isfile(path+"/actions.json"):
					with open(path+"/actions.json", "w") as action_file:
						print("Creating action file for dataset: "+path+"/actions.json")
				return True
			else:
				return False
				
	def data_set_info(self, path):
		return {
			"annotations": 0,
			"actions": path[1:]+"/actions.json",
			"name": path.split("/")[-1],
			"checkout": False,
			"left": path[1:]+"/left.png",
			"right": path[1:]+"/right.png"
		}
	
	def save_action(self, dataset, params):
		if isdir(self.datadir+dataset):
			actions = []
			print("isfile", self.datadir+dataset+"/actions.json", isfile(self.datadir+dataset+"/actions.json"))
			if isfile(self.datadir+dataset+"/actions.json"):
				with open(self.datadir+dataset+"/actions.json", "r") as action_file:
					actions = json.load(action_file)
			
			action = {}
			for p in params:
				action[p] = params[p][0]
			actions.append(action)
			
			with open(self.datadir+dataset+"/actions.json", "w") as action_file:
				json.dump(actions, action_file, indent=1)

		else:
			self.error("no matching dataset")
	
	def error(self, msg):
		self.send_response(HTTPStatus.BAD_REQUEST)
		self.end_headers()
		self.wfile.write(("Error: %s" %msg).encode("ascii"))


with http.server.HTTPServer(("", 8080), AnnotationHandler) as httpd:
	print("serving at port", 8080)
	httpd.serve_forever()
