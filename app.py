"""
Todo App — Python/Flask Backend
================================
Install dependencies:
    pip install flask flask-cors

Run the server:
    python app.py

Server runs at: http://localhost:5000
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)  # Allow requests from the frontend

# ── Storage ────────────────────────────────────────────────────────────────────
# Tasks are stored in a local JSON file so they persist across restarts.
DATA_FILE = "tasks.json"


def load_tasks():
    """Load tasks from the JSON file."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_tasks(tasks):
    """Save tasks to the JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


# ── Serve Frontend ─────────────────────────────────────────────────────────────
@app.route("/")
def index():
    """Serve the index.html frontend."""
    return send_from_directory(".", "index.html")


# ── API Routes ─────────────────────────────────────────────────────────────────

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    """
    GET /api/tasks
    Returns all tasks, optionally filtered by status.
    Query params:
        filter = all | active | done  (default: all)
    """
    filter_by = request.args.get("filter", "all")
    tasks = load_tasks()

    if filter_by == "active":
        tasks = [t for t in tasks if not t["done"]]
    elif filter_by == "done":
        tasks = [t for t in tasks if t["done"]]

    remaining = sum(1 for t in load_tasks() if not t["done"])
    done_count = sum(1 for t in load_tasks() if t["done"])

    return jsonify({
        "tasks": tasks,
        "stats": {
            "remaining": remaining,
            "done": done_count,
            "total": len(load_tasks())
        }
    })


@app.route("/api/tasks", methods=["POST"])
def add_task():
    """
    POST /api/tasks
    Body: { "text": "Task description" }
    Creates a new task and returns it.
    """
    data = request.get_json()

    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Task text is required"}), 400

    text = data["text"].strip()

    if len(text) > 200:
        return jsonify({"error": "Task text must be under 200 characters"}), 400

    task = {
        "id": str(uuid.uuid4()),
        "text": text,
        "done": False,
        "created_at": datetime.now().isoformat()
    }

    tasks = load_tasks()
    tasks.insert(0, task)  # Newest first
    save_tasks(tasks)

    return jsonify(task), 201


@app.route("/api/tasks/<task_id>", methods=["PATCH"])
def update_task(task_id):
    """
    PATCH /api/tasks/<id>
    Body: { "done": true/false }
    Toggles the done state of a task.
    """
    data = request.get_json()
    tasks = load_tasks()

    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    if "done" in data:
        task["done"] = bool(data["done"])

    save_tasks(tasks)
    return jsonify(task)


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    """
    DELETE /api/tasks/<id>
    Deletes a single task by ID.
    """
    tasks = load_tasks()
    original_count = len(tasks)
    tasks = [t for t in tasks if t["id"] != task_id]

    if len(tasks) == original_count:
        return jsonify({"error": "Task not found"}), 404

    save_tasks(tasks)
    return jsonify({"message": "Task deleted", "id": task_id})


@app.route("/api/tasks/clear-done", methods=["DELETE"])
def clear_done():
    """
    DELETE /api/tasks/clear-done
    Removes all completed tasks.
    """
    tasks = load_tasks()
    removed = [t for t in tasks if t["done"]]
    tasks = [t for t in tasks if not t["done"]]
    save_tasks(tasks)

    return jsonify({
        "message": f"Removed {len(removed)} completed task(s)",
        "removed_count": len(removed)
    })


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("✦  Todo backend running at http://localhost:5000")
    print("   Press Ctrl+C to stop.\n")
    app.run(debug=True, port=5000)
