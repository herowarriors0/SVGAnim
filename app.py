from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import os
import tempfile
import subprocess
import json
from werkzeug.utils import secure_filename
import uuid
from pathlib import Path
import traceback
import shutil
import glob
import time
import threading
import re

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
SCRIPTS_FOLDER = 'manim_scripts'
ITEMS_FOLDER = 'items'
BLOCKS_FOLDER = 'blocks'
ALLOWED_EXTENSIONS = {'svg'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(SCRIPTS_FOLDER, exist_ok=True)
os.makedirs(ITEMS_FOLDER, exist_ok=True)
os.makedirs(BLOCKS_FOLDER, exist_ok=True)

def cleanup_old_files():
    """Clean up files older than 1 hour"""
    try:
        current_time = time.time()
        for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, SCRIPTS_FOLDER]:
            for root, dirs, files in os.walk(folder):
                for file in files:
                    file_path = os.path.join(root, file)
                    if os.path.getctime(file_path) < current_time - 3600:
                        try:
                            os.remove(file_path)
                        except:
                            pass
                for dir in dirs:
                    dir_path = os.path.join(root, dir)
                    try:
                        if not os.listdir(dir_path):
                            os.rmdir(dir_path)
                    except:
                        pass
    except:
        pass

def start_cleanup_timer():
    """Start periodic cleanup"""
    cleanup_old_files()
    timer = threading.Timer(1800, start_cleanup_timer)
    timer.daemon = True
    timer.start()

start_cleanup_timer()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_manim_script(svg_path, title, duration, wait_time, bg_color, output_path, is_minecraft_item=False):
    """Generate the Manim Python script"""
    scale_factor = "2" if is_minecraft_item else "1"
    
    script_content = f'''from manim import *

class logo_animation(Scene):
    def construct(self):
        # Set background color
        self.camera.background_color = "{bg_color}"
        
        # Create SVG object
        m = SVGMobject("{svg_path}")
        
        # Scale up Minecraft items for better visibility
        m.scale({scale_factor})
        
        # Play animation
        self.play(Write(m, run_time={duration}))
'''
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    return script_content

@app.route('/api/upload-minecraft-item', methods=['POST', 'OPTIONS'])
def upload_minecraft_item():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})
        
    try:
        data = request.get_json()
        filename = data.get('filename')
        item_type = data.get('type', 'item')
        
        if not filename:
            return jsonify({'error': 'No filename provided'}), 400
        
        if item_type == 'block':
            source_folder = BLOCKS_FOLDER
        else:
            source_folder = ITEMS_FOLDER
            
        source_path = os.path.join(source_folder, filename)
        if not os.path.exists(source_path):
            return jsonify({'error': f'Minecraft {item_type} not found'}), 404
        
        file_id = str(uuid.uuid4())
        safe_filename = secure_filename(filename)
        dest_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{safe_filename}")
        
        shutil.copy2(source_path, dest_path)
        
        print(f"Minecraft {item_type} copied: {dest_path}")
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'filename': safe_filename,
            'is_minecraft_item': True,
            'message': f'Minecraft {item_type} sikeresen kiválasztva!'
        })
        
    except Exception as e:
        print(f"Minecraft item upload error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Minecraft item upload error: {str(e)}'}), 500

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})
        
    try:
        print(f"Upload request received: {request}")
        print(f"Files: {request.files}")
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            file_id = str(uuid.uuid4())
            filename = secure_filename(file.filename)
            svg_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{filename}")
            file.save(svg_path)
            
            print(f"File saved: {svg_path}")
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'filename': filename,
                'is_minecraft_item': False,
                'message': 'SVG fájl sikeresen feltöltve!'
            })
        else:
            return jsonify({'error': 'Invalid file type. Only SVG files are allowed.'}), 400
            
    except Exception as e:
        print(f"Upload error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Upload error: {str(e)}'}), 500

@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate_animation():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})
        
    try:
        print("Generate request received")
        data = request.get_json()
        print(f"Request data: {data}")
        
        file_id = data.get('file_id')
        filename = data.get('filename')
        title = data.get('title', 'Animation')
        duration = float(data.get('duration', 2))
        wait_time = float(data.get('wait_time', 2))
        bg_color = data.get('bg_color', '#000000')
        is_minecraft_item = data.get('is_minecraft_item', False)
        
        if not file_id or not filename:
            return jsonify({'error': 'Missing file information'}), 400
        
        svg_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{filename}")
        if not os.path.exists(svg_path):
            return jsonify({'error': 'SVG file not found'}), 404
        
        svg_abs_path = os.path.abspath(svg_path).replace('\\', '/')
        
        script_path = os.path.join(SCRIPTS_FOLDER, f"{file_id}_animation.py")
        script_content = create_manim_script(
            svg_abs_path, title, duration, wait_time, bg_color, script_path, is_minecraft_item
        )
        
        print(f"Generated script: {script_path}")
        print(f"Script content: {script_content}")
        print(f"Is Minecraft item: {is_minecraft_item}")
        
        output_dir = os.path.abspath(OUTPUT_FOLDER)
        script_abs_path = os.path.abspath(script_path)
        
        cmd = [
            'manim', 
            '-qh',
            '--output_file', f"{file_id}_animation.mp4",
            '--media_dir', output_dir,
            script_abs_path,
            'logo_animation'
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        except subprocess.TimeoutExpired:
            return jsonify({
                'error': 'Manim rendering timed out (120 seconds)',
                'details': 'The video generation took too long. Try with shorter duration or simpler SVG.'
            }), 500
        
        print(f"Manim result code: {result.returncode}")
        print(f"Manim stdout: {result.stdout}")
        print(f"Manim stderr: {result.stderr}")
        
        if result.returncode != 0:
            return jsonify({
                'error': 'Manim rendering failed',
                'details': result.stderr,
                'stdout': result.stdout
            }), 500
        
        video_path = None
        for root, dirs, files in os.walk(output_dir):
            for file in files:
                if file.endswith('.mp4') and file_id in file:
                    video_path = os.path.join(root, file)
                    break
            if video_path:
                break
        
        print(f"Video path found: {video_path}")
        
        if not video_path or not os.path.exists(video_path):
            return jsonify({'error': 'Generated video not found'}), 500
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'video_path': video_path,
            'script_content': script_content,
            'message': 'Animáció sikeresen generálva!'
        })
        
    except Exception as e:
        print(f"Generation error: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Generation error: {str(e)}'}), 500

@app.route('/api/download/<file_id>')
def download_video(file_id):
    try:
        video_path = None
        for root, dirs, files in os.walk(OUTPUT_FOLDER):
            for file in files:
                if file.endswith('.mp4') and file_id in file:
                    video_path = os.path.join(root, file)
                    break
            if video_path:
                break
        
        if not video_path or not os.path.exists(video_path):
            return jsonify({'error': 'Video file not found'}), 404
        
        return send_file(
            video_path,
            as_attachment=True,
            download_name=f"{file_id}_animation.mp4",
            mimetype='video/mp4'
        )
        
    except Exception as e:
        return jsonify({'error': f'Download error: {str(e)}'}), 500

@app.route('/api/preview/<file_id>')
def preview_video(file_id):
    try:
        video_path = None
        for root, dirs, files in os.walk(OUTPUT_FOLDER):
            for file in files:
                if file.endswith('.mp4') and file_id in file:
                    video_path = os.path.join(root, file)
                    break
            if video_path:
                break
        
        if not video_path or not os.path.exists(video_path):
            return jsonify({'error': 'Video file not found'}), 404
        
        return send_file(video_path, mimetype='video/mp4', as_attachment=False)
        
    except Exception as e:
        return jsonify({'error': f'Preview error: {str(e)}'}), 500

import re

@app.route('/api/items')
def list_items():
    try:
        items = []
        if os.path.exists(ITEMS_FOLDER):
            for filename in os.listdir(ITEMS_FOLDER):
                if filename.lower().endswith('.svg'):
                    base_name = filename.replace('.svg', '').replace('_', ' ')
                    name = re.sub(r'(?<!^)([A-Z])', r' \1', base_name)
                    items.append({
                        'filename': filename,
                        'name': name,
                        'type': 'item'
                    })
        return jsonify(sorted(items, key=lambda x: x['name']))
    except Exception as e:
        return jsonify({'error': f'Items error: {str(e)}'}), 500

@app.route('/api/blocks')
def list_blocks():
    try:
        blocks = []
        if os.path.exists(BLOCKS_FOLDER):
            for filename in os.listdir(BLOCKS_FOLDER):
                if filename.lower().endswith('.svg'):
                    base_name = filename.replace('.svg', '').replace('_', ' ')
                    name = re.sub(r'(?<!^)([A-Z])', r' \1', base_name)
                    blocks.append({
                        'filename': filename,
                        'name': name,
                        'type': 'block'
                    })
        return jsonify(sorted(blocks, key=lambda x: x['name']))
    except Exception as e:
        return jsonify({'error': f'Blocks error: {str(e)}'}), 500

@app.route('/api/minecraft')
def list_minecraft():
    try:
        minecraft_items = []
        
        if os.path.exists(ITEMS_FOLDER):
            for filename in os.listdir(ITEMS_FOLDER):
                if filename.lower().endswith('.svg'):
                    base_name = filename.replace('.svg', '').replace('_', ' ')
                    name = re.sub(r'(?<!^)([A-Z])', r' \1', base_name)
                    minecraft_items.append({
                        'filename': filename,
                        'name': name,
                        'type': 'item'
                    })
        
        if os.path.exists(BLOCKS_FOLDER):
            for filename in os.listdir(BLOCKS_FOLDER):
                if filename.lower().endswith('.svg'):
                    base_name = filename.replace('.svg', '').replace('_', ' ')
                    name = re.sub(r'(?<!^)([A-Z])', r' \1', base_name)
                    minecraft_items.append({
                        'filename': filename,
                        'name': name,
                        'type': 'block'
                    })
        
        return jsonify(sorted(minecraft_items, key=lambda x: x['name']))
    except Exception as e:
        return jsonify({'error': f'Minecraft items error: {str(e)}'}), 500

from urllib.parse import unquote

@app.route('/api/items/<path:filename>')
def serve_item(filename):
    try:
        decoded_filename = unquote(filename)
        if not decoded_filename.lower().endswith('.svg'):
            return jsonify({'error': 'Invalid file type'}), 400
        safe_filename = os.path.basename(decoded_filename)
        item_path = os.path.join(ITEMS_FOLDER, safe_filename)
        if os.path.exists(item_path):
            response = send_file(item_path, mimetype='image/svg+xml')
            response.headers['Cache-Control'] = 'public, max-age=300'
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        else:
            return jsonify({'error': 'Item not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Item serve error: {str(e)}'}), 500

@app.route('/api/blocks/<path:filename>')
def serve_block(filename):
    try:
        decoded_filename = unquote(filename)
        if not decoded_filename.lower().endswith('.svg'):
            return jsonify({'error': 'Invalid file type'}), 400
        safe_filename = os.path.basename(decoded_filename)
        block_path = os.path.join(BLOCKS_FOLDER, safe_filename)
        if os.path.exists(block_path):
            with open(block_path, 'r', encoding='utf-8') as f:
                svg_content = f.read()
            
            if 'width=' not in svg_content or 'height=' not in svg_content:
                svg_content = svg_content.replace('<svg ', '<svg width="32" height="32" ')
            
            response = make_response(svg_content)
            response.headers['Content-Type'] = 'image/svg+xml'
            response.headers['Cache-Control'] = 'public, max-age=300'
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response
        else:
            return jsonify({'error': 'Block not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Block serve error: {str(e)}'}), 500

@app.route('/')
def serve_index():
    return send_file('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    safe_path = os.path.normpath(filename)
    if safe_path.startswith('..'):
        return jsonify({'error': 'Invalid path'}), 400

    if not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        return send_file(safe_path)
    except Exception as e:
        print(f"Error serving static file {safe_path}: {e}")
        return jsonify({'error': f'Static file serve error: {str(e)}'}), 500

@app.route('/api/status')
def status():
    try:
        return jsonify({
            'status': 'running',
            'message': 'SVG Animation Generator Backend is running!',
            'cors': 'enabled'
        })
    except Exception as e:
        print(f"Status error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("SVG Animation Generator")
    print("=" * 50)
    print("Starting server...")
    print("Website: http://localhost:5000")
    print("API: http://localhost:5000/api/status")
    print("=" * 50)
    
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
