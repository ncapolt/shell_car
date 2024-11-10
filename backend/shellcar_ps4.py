import asyncio
from bleak import BleakClient, BleakScanner
import pygame
import threading
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
connected = False
lamp_on = False
switched_to_bburago = False


async def connect_to_device():
    global connected
    devices = await BleakScanner.discover()
    for device in devices:
        if SERVICE_UUID_BRANDBASE in device.metadata["uuids"]:
            async with BleakClient(device.address) as client:
                connected = True
                print("Connected to device")
                while connected:
                    await send_command(client)
                    await asyncio.sleep(0.1)


async def send_command(client):
    if not switched_to_bburago:
        command = get_brandbase_command(turbo, forward, backward, left, right)
        await client.write_gatt_char(CHAR_UUID_BRANDBASE, command)
    else:
        command = get_bburago_command(turbo, forward, backward, left, right, False)
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
    global forward, backward, left, right, turbo, lamp_on
    pygame.init()
    pygame.joystick.init()
    print([pygame.joystick.Joystick(x) for x in range(pygame.joystick.get_count())])
    joystick = pygame.joystick.Joystick(0)
    joystick.init()

    while True:
        for event in pygame.event.get():
            if event.type == pygame.JOYBUTTONDOWN:
                if event.button == 0:  # X button
                    turbo = True
                if event.button == 3:  # Triangle button
                    lamp_on = True
            elif event.type == pygame.JOYBUTTONUP:
                if event.button == 0:  # X button
                    turbo = False
                if event.button == 3:
                    lamp_on = False
            elif (
                event.type == pygame.JOYHATMOTION or event.type == pygame.JOYAXISMOTION
            ):
                if event.type == pygame.JOYHATMOTION:
                    if event.value == (1, 0):  # D-pad right
                        right = True
                        left = False
                    elif event.value == (-1, 0):  # D-pad left
                        left = True
                        right = False
                    elif event.value == (0, 0):  # D-pad released
                        left = False
                        right = False
                if event.type == pygame.JOYAXISMOTION:
                    if event.axis == 0:  # Left joystick horizontal
                        if event.value < -0.5:
                            left = True
                            right = False
                        elif event.value > 0.5:
                            right = True
                            left = False
                        else:
                            left = False
                            right = False
                    if event.axis == 5:
                        if event.value > -0.5:
                            forward = True
                        else:
                            forward = False
                    if event.axis == 4:
                        if event.value > -0.5:
                            backward = True
                        else:
                            backward = False


# Start the gamepad event listener in a separate thread
gamepad_thread = threading.Thread(target=on_gamepad_event, daemon=True)
gamepad_thread.start()


async def main():
    await connect_to_device()


if __name__ == "__main__":
    asyncio.run(main())
