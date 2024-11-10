from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import threading
import asyncio
from shellcar import ShellCar
from shellcar_ps4 import joystick_state  # Import the shared joystick state
import shellcar_ps4

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config["CORS_HEADERS"] = "Content-Type"

shellcar = ShellCar()


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

    return _corsify_actual_response(jsonify({"connected": connection_status}))


@app.route("/joystick_state", methods=["GET"])
def get_joystick_state():
    return jsonify(joystick_state)  # Returns the current joystick state


@app.route("/send_command", methods=["POST", "OPTIONS"])
async def send_command():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()

    # Use the latest joystick state to send command
    command = {
        "turbo": joystick_state["turbo"],
        "forward": joystick_state["forward"],
        "backward": joystick_state["backward"],
        "left": joystick_state["left"],
        "right": joystick_state["right"],
    }

    await shellcar.execute_routine(
        [command]
    )  # Adjust as necessary for ShellCar command structure
    return _corsify_actual_response(jsonify({"status": "command sent"}))


def start_flask_server():
    """Starts the Flask server on a separate thread"""
    app.run(host="0.0.0.0", port=5001, debug=False)


def start_controller_listener():
    """Starts the controller listener to update joystick_state"""
    shellcar_ps4.start_gamepad_listener(joystick_state)


if __name__ == "__main__":
    # Start Flask server on a separate thread

    shellcar.connect_to_device()

    flask_thread = threading.Thread(target=start_flask_server)
    flask_thread.start()

    # Start the controller listener on the main thread
    start_controller_listener()
