from http.server import HTTPServer, BaseHTTPRequestHandler
from reputation import ReputationCalculator
import json

class Serv(BaseHTTPRequestHandler):
    reputation_calculator = ReputationCalculator()
    
    def reputation(self):
        return self.reputation_calculator.calculate()
    
    reputation.reset = reputation_calculator.reset

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
        
    def do_GET(self):
       if self.path == '/':
        try:
            rep = self.reputation()
            self.reputation.reset()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(rep).encode('utf-8'))
            print("Request handled successfully")
            return
        except Exception as e:
            self.send_response(500, str(e))
            self.end_headers()
            print("Error: ", str(e))

def run_server(server_class=HTTPServer, handler_class=Serv, port=8080):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Server running on http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down the server...")
        httpd.server_close()
        print("Server shut down successfully")

if __name__ == "__main__":
    run_server()