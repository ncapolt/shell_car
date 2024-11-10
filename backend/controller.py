# controller.py
import asyncio
import threading
import keyboard
import pygame
from routines import CarCommand


class Controller:
    def __init__(self, shellcar):
        self.shellcar = shellcar

    def on_key_event(self, event):
        print(event)
        command = CarCommand(
            forward=event.name == "w" and event.event_type == "down",
            backward=event.name == "s" and event.event_type == "down",
            left=event.name == "a" and event.event_type == "down",
            right=event.name == "d" and event.event_type == "down",
            turbo=event.name == "t" and event.event_type == "down",
            duration=1,  # Puedes ajustar la duración según sea necesario
        )
        # asyncio.run(self.shellcar.send_command(command.get_bytes()))
        self.shellcar.set_command(command.get_bytes())

    def start_keyboard_listener(self):
        keyboard.hook(self.on_key_event)

    async def on_gamepad_event(self):
        pygame.init()
        pygame.joystick.init()
        # Check if a joystick is connected
        if pygame.joystick.get_count() == 0:
            print("No joystick detected.")
            return

        joystick = pygame.joystick.Joystick(0)
        joystick.init()

        while True:
            for event in pygame.event.get():
                command = CarCommand(
                    forward=False,
                    backward=False,
                    left=False,
                    right=False,
                    turbo=False,
                    duration=1,  # Puedes ajustar la duración según sea necesario
                )
                if event.type == pygame.JOYBUTTONDOWN:
                    print(event)
                    if event.button == 0:  # X button
                        command.forward = True
                    elif event.button == 3:  # Triangle button
                        command.backward = True
                    elif event.button == 2:  # Square button
                        command.turbo = True
                elif event.type == pygame.JOYBUTTONUP:
                    if event.button == 0:  # X button
                        command.forward = False
                    elif event.button == 3:  # Triangle button
                        command.backward = False
                    elif event.button == 2:  # Square button
                        command.turbo = False
                elif event.type == pygame.JOYHATMOTION:
                    if event.value == (1, 0):  # D-pad right
                        command.right = True
                        command.left = False
                    elif event.value == (-1, 0):  # D-pad left
                        command.left = True
                        command.right = False
                    elif event.value == (0, 0):  # D-pad released
                        command.left = False
                        command.right = False
                elif event.type == pygame.JOYAXISMOTION:
                    if event.axis == 0:  # Left joystick horizontal
                        if event.value < -0.5:
                            command.left = True
                            command.right = False
                        elif event.value > 0.5:
                            command.right = True
                            command.left = False
                        else:
                            command.left = False
                            command.right = False

                await self.shellcar.send_command(command.get_bytes())
                print(command.get_bytes())
                self.shellcar.set_command(command.get_bytes())

    def start_gamepad_listener(self):
        asyncio.run(self.on_gamepad_event())
