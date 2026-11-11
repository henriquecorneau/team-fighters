#!/usr/bin/env python3
"""Servidor local de desenvolvimento do TEAM FIGHTERS (sem cache). Uso: python3 serve.py [porta]"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):  # silencioso
        pass


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"TEAM FIGHTERS em http://localhost:{PORT}")
        httpd.serve_forever()
