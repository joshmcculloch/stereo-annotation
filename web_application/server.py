import http.server
from http import HTTPStatus
from urllib.parse import urlparse, parse_qs
from os import listdir
from os.path import isdir, isfile
import json


class AnnotationHandler(http.server.SimpleHTTPRequestHandler):
	
	def do_GET(self):
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
			if path[1] in self.datasets():
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
		self.send_response(HTTPStatus.OK)
		self.send_header("Content-type", "application/json")
		self.end_headers()
		self.wfile.write("action".encode("ascii"))
		
	def datasets(self):
		datadir = "./datasets/"
		contents = listdir(datadir)
		datasets = [self.data_set_info(datadir+c) for c in contents if self.isdataset(datadir+c)]
		datasets.sort(key=lambda i:i['name'])
		return datasets
		
	def isdataset(self,path):
		if not(isdir(path)):
			return False
		else:
			files = listdir(path)
			if "left.png" in files and "right.png" in files:
				return True
			else:
				return False
				
	def data_set_info(self, path):
		return {
			"annotations": 0,
			"name": path.split("/")[-1],
			"checkout": False,
			"left": path[1:]+"/left.png",
			"right": path[1:]+"/right.png"
		}
				
	def error(self, msg):
		self.send_response(HTTPStatus.BAD_REQUEST)
		self.end_headers()
		self.wfile.write(("Error: %s" %msg).encode("ascii"))


with http.server.HTTPServer(("", 8080), AnnotationHandler) as httpd:
	print("serving at port", 8080)
	httpd.serve_forever()
