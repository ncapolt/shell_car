# pylint: disable=E1126
# pylint: disable=E0401
# pylint: disable=C0413
# pylint: disable=C0411
# pylint: disable=C0103
# pylint: disable=C0301
# pylint: disable=W0612
from routines import CarCommand
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from shellcar import ShellCar
import asyncio
import threading
import queue
import subprocess
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config["CORS_HEADERS"] = "Content-Type"

shellcar = ShellCar()
event_queue = queue.Queue()


def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE")
    return response


def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@app.route("/connect", methods=["POST", "OPTIONS"])
async def connect():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    connection_status = await shellcar.connect_to_device()

    while not connection_status:
        print("Failed to connect. Retrying...")
        connection_status = await shellcar.connect_to_device()

    print(connection_status)
    return _corsify_actual_response(jsonify({"connected": connection_status}))


@app.route("/send_command", methods=["POST", "OPTIONS"])
async def send_command():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    data = request.json

    print(data)

    commands = [
        CarCommand(
            turbo=cmd["turbo"],
            forward=cmd["forward"],
            backward=cmd["backward"],
            left=cmd["left"],
            right=cmd["right"],
        ).get_bytes() for cmd in data["commands"]
    ]

    print(commands)

    await shellcar.execute_routine(commands)
    return _corsify_actual_response(jsonify({"status": "command sent"}))


@app.route("/battery_level", methods=["GET", "OPTIONS"])
async def battery_level():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    _battery_level = shellcar.battery_level
    return _corsify_actual_response(jsonify({"battery_level": _battery_level}))


@app.route("/start_listeners", methods=["POST", "OPTIONS"])
def start_listeners():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    event_queue.put(run_joystick_listener)
    return _corsify_actual_response(jsonify({"status": "listeners started"}))


def run_joystick_listener():
    # subprocess.Popen(["python3", "shellcar_ps4.py"])
    os.system("python3 shellcar_ps4.py")


def main_thread_function():
    while True:
        func = event_queue.get()
        func()
        event_queue.task_done()


def run_flask():
    app.run(port=5000)


if __name__ == "__main__":
    # Run server in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()

    os.system("python3 shellcar_ps4.py")

    # Run the main thread function
    # main_thread_function()
