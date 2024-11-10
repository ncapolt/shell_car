import asyncio
import threading
import tkinter as tk
from bleak import BleakClient, BleakScanner
import pygame
from commands import (
    IDLE_COMMAND,
    FORWARD_COMMAND,
    FORWARD_TURBO_COMMAND,
    BACKWARD_COMMAND,
    BACKWARD_TURBO_COMMAND,
    FORWARD_LEFT_COMMAND,
    LEFT_COMMAND,
    FORWARD_RIGHT_COMMAND,
    BACKWARD_LEFT_COMMAND,
    RIGHT_COMMAND,
    BACKWARD_RIGHT_COMMAND,
    FORWARD_TURBO_LEFT_COMMAND,
    FORWARD_TURBO_RIGHT_COMMAND,
    BACKWARD_TURBO_LEFT_COMMAND,
    BACKWARD_TURBO_RIGHT_COMMAND,
)
from gui import ShellCarGUI

# UUIDs
SERVICE_UUID_BRANDBASE = "0000fff0-0000-1000-8000-00805f9b34fb"
CHAR_UUID_BRANDBASE = "d44bc439-abfd-45a2-b575-925416129600"
SERVICE_UUID_BBURAGO = "0000fff0-0000-1000-8000-00805f9b34fb"
CHAR_UUID_BBURAGO = "0000fff1-0000-1000-8000-00805f9b34fb"

# Global variables
forward = False
backward = False
left = False
right = False
turbo = False
lamp = False
connected = False
switched_to_bburago = False

# GUI setup
root = tk.Tk()

gui = ShellCarGUI(root)

async def connect_to_device():
    global connected
    devices = await BleakScanner.discover()
    for device in devices:
        if SERVICE_UUID_BRANDBASE in device.metadata["uuids"]:
            async with BleakClient(device.address) as client:
                connected = True
                gui.connection_label.config(text="Connection: CONNECTED")
                print("Connected to device")
                while connected:
                    await send_command(client)
                    await asyncio.sleep(0.1)


async def send_command(client):
    if not switched_to_bburago:
        command = get_brandbase_command(turbo, forward, backward, left, right)
        await client.write_gatt_char(CHAR_UUID_BRANDBASE, command)
    else:
        command = get_bburago_command(turbo, forward, backward, left, right, lamp)
        await client.write_gatt_char(CHAR_UUID_BBURAGO, command)


def get_brandbase_command(turbo_on, forward_on, backward_on, left_on, right_on):
    if not left_on and not right_on and not forward_on and not backward_on:
        return IDLE_COMMAND
    if turbo_on:
        if forward_on and not left_on and not right_on:
            return FORWARD_TURBO_COMMAND
        elif backward_on and not left_on and not right_on:
            return BACKWARD_TURBO_COMMAND
        elif forward_on and left_on and not right_on:
            return FORWARD_TURBO_LEFT_COMMAND
        elif forward_on and not left_on and right_on:
            return FORWARD_TURBO_RIGHT_COMMAND
        elif backward_on and left_on and not right_on:
            return BACKWARD_TURBO_LEFT_COMMAND
        elif backward_on and not left_on and right_on:
            return BACKWARD_TURBO_RIGHT_COMMAND
    else:
        if left_on and not forward_on and not backward_on:
            return LEFT_COMMAND
        elif right_on and not forward_on and not backward_on:
            return RIGHT_COMMAND
        elif forward_on and not left_on and not right_on:
            return FORWARD_COMMAND
        elif backward_on and not left_on and not right_on:
            return BACKWARD_COMMAND
        elif forward_on and left_on and not right_on:
            return FORWARD_LEFT_COMMAND
        elif forward_on and not left_on and right_on:
            return FORWARD_RIGHT_COMMAND
        elif backward_on and left_on and not right_on:
            return BACKWARD_LEFT_COMMAND
        elif backward_on and not left_on and right_on:
            return BACKWARD_RIGHT_COMMAND
    return IDLE_COMMAND


def get_bburago_command(turbo_on, forward_on, backward_on, left_on, right_on, lamp_on):
    command = [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    if turbo_on:
        command[6] = 1
    if lamp_on:
        command[5] = 1
    if forward_on:
        command[1] = 1
    elif backward_on:
        command[2] = 1
    if right_on:
        command[4] = 1
    elif left_on:
        command[3] = 1
    return bytes(command)


def on_gamepad_event():
    global forward, backward, left, right, turbo, lamp
    pygame.init()
    pygame.joystick.init()
    joystick = pygame.joystick.Joystick(0)
    joystick.init()

    while True:
        for event in pygame.event.get():
            gui.event_type_label.config(text=f"Event Type: {event.type}")

            if event.type == pygame.JOYBUTTONDOWN:
                gui.event_type_label.config(
                    text=f"Event Type: {event.type} Button: {event.button}"
                )

                if event.button == 2:  # Square button
                    forward = True
                    gui.forward_label.config(text="Forward: ON")
                elif event.button == 3:  # Triangle button
                    backward = True
                    gui.backward_label.config(text="Backward: ON")
                elif event.button == 0:  # X button
                    turbo = True
                    gui.turbo_label.config(text="Turbo: ON")
                elif event.button == 13:
                    left = True
                    gui.left_label.config(text="Left: ON")
                elif event.button == 14:
                    right = True
                    gui.right_label.config(text="Right: ON")

            elif event.type == pygame.JOYBUTTONUP:
                if event.button == 2:  # Square button
                    forward = False
                    gui.forward_label.config(text="Forward: OFF")
                elif event.button == 3:  # Triangle button
                    backward = False
                    gui.backward_label.config(text="Backward: OFF")
                elif event.button == 0:  # X button
                    turbo = False
                    gui.turbo_label.config(text="Turbo: OFF")
                elif event.button == 13:
                    left = False
                    gui.left_label.config(text="Left: OFF")
                elif event.button == 14:
                    right = False
                    gui.right_label.config(text="Right: OFF")

            elif event.type == pygame.JOYAXISMOTION:
                gui.event_type_label.config(
                    text=f"Event Type: {event.type} Axis: {event.axis} Value: {event.value}"
                )

                if event.axis == 0:  # Left joystick horizontal
                    if event.value < -0.5:
                        left = True
                        right = False
                        gui.left_label.config(text="Left: ON")
                        gui.right_label.config(text="Right: OFF")
                    elif event.value > 0.5:
                        right = True
                        left = False
                        gui.right_label.config(text="Right: ON")
                        gui.left_label.config(text="Left: OFF")
                    else:
                        left = False
                        right = False
                        gui.left_label.config(text="Left: OFF")
                        gui.right_label.config(text="Right: OFF")
                if event.axis == 5:  # R2 button
                    if event.value > 0:
                        forward = True
                        gui.forward_label.config(text="Forward: ON")
                    else:
                        forward = False
                        gui.forward_label.config(text="Forward: OFF")


# Start the gamepad event listener in the main thread
def start_gamepad_listener():
    on_gamepad_event()


gui.start_gamepad_listener = start_gamepad_listener

async def main():
    await connect_to_device()


# Start the asyncio event loop in a separate thread
asyncio_thread = threading.Thread(target=lambda: asyncio.run(main()), daemon=True)
asyncio_thread.start()

# Start the Tkinter main loop
# root.wm_attributes("-fullscreen", "True")
root.mainloop()
