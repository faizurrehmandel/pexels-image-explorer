```python
# main.py

import os
import requests
from flask import Flask, jsonify, request, send_from_directory

# --- Configuration ---

# Pexels API Base URL
PEXELS_API_URL = "https://api.pexels.com/v1/search"

# Load the Pexels API key from an environment variable for security.
# The application will not start without this key.
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")


# --- Pre-flight Checks ---

if not PEXELS_API_KEY:
    raise ValueError("A PEXELS_API_KEY environment variable is required to run this application.")


# --- Flask Application Setup ---

# Initialize the Flask app.
# - static_folder='static': Serves files from the 'static' directory.
# - static_url_path='': Makes static files available at the root URL (e.g., /index.html, /style.css).
app = Flask(__name__, static_folder='static', static_url_path='')


# --- API Endpoints ---

@app.route("/api/search")
def search_pexels_images():
    """
    API endpoint to search for images on Pexels.
    This acts as a secure server-side proxy to avoid exposing the API key in the frontend code.
    
    Query Parameters:
        - query (str): The search term for images. (Required)
        - per_page (int): The number of results to return per page. (Optional, default: 15)
    
    Example Usage:
        /api/search?query=nature&per_page=20
    
    Returns:
        - On success: A JSON object with image data from the Pexels API.
        - On failure: A JSON object with an error message and an appropriate HTTP status code.
    """
    # 1. Get and validate request parameters from the client.
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "The 'query' parameter is required."}), 400

    per_page = request.args.get('per_page', 15, type=int)

    # 2. Prepare the request to the external Pexels API.
    headers = {
        "Authorization": PEXELS_API_KEY
    }
    params = {
        "query": query,
        "per_page": per_page
    }

    try:
        # 3. Make the request and handle potential responses.
        # A timeout is set to prevent the request from hanging indefinitely.
        response = requests.get(PEXELS_API_URL, headers=headers, params=params, timeout=10)
        
        # Raise an HTTPError for bad responses (e.g., 401 Unauthorized, 429 Too Many Requests).
        response.raise_for_status()

        # On success (2xx), return the JSON data from Pexels directly to our client.
        return response.json()

    except requests.exceptions.HTTPError:
        # Handle HTTP errors (4xx/5xx) from the Pexels API.
        # We attempt to forward the JSON error response from Pexels if available.
        try:
            error_details = response.json()
        except ValueError:
            error_details = {"error": "Received a non-JSON error response from Pexels API.", "details": response.text}
        
        return jsonify(error_details), response.status_code
        
    except requests.exceptions.RequestException as req_err:
        # Handle network-related errors (e.g., DNS failure, connection timeout).
        # This indicates a problem reaching the Pexels API server.
        return jsonify({"error": f"Could not connect to Pexels API: {req_err}"}), 503  # 503 Service Unavailable


# --- Frontend Serving ---

@app.route('/')
def serve_index():
    """
    Serves the main index.html file, which is the entry point for the frontend application.
    All other static files (CSS, JS) are served automatically by Flask's static file handling
    due to the configuration in `app = Flask(...)`.
    """
    return send_from_directory(app.static_folder, 'index.html')


# --- Main Execution ---

if __name__ == '__main__':
    # This block runs the application using Flask's built-in development server.
    # It is intended for local development only. For production, a production-grade
    # WSGI server such as Gunicorn or uWSGI should be used.
    
    # Get port from environment variable or default to 5000.
    port = int(os.environ.get('PORT', 5000))
    
    # host='0.0.0.0' makes the server publicly available on the network.
    # debug=True enables features like auto-reloading and an interactive debugger.
    # WARNING: Do not run with debug=True in a production environment.
    app.run(host='0.0.0.0', port=port, debug=True)
```