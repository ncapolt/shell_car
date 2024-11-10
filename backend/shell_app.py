# shell_app.py
import asyncio
import threading
import tkinter as tk
from routines import CarCommand
from shellcar import ShellCar
from controller import Controller
from gui import ShellCarGUI


async def main():
    shellcar = ShellCar()
    controller = Controller(shellcar)

    root = tk.Tk()
    gui = ShellCarGUI(root, shellcar, controller)

    connection_status = await shellcar.connect_to_device()
    gui.connection_label.config(text=f"Connected: {connection_status}")
    threading.Thread(target=controller.start_keyboard_listener, daemon=True).start()
    threading.Thread(target=controller.start_gamepad_listener, daemon=True).start()
    root.after(100, gui.update_status)
    root.mainloop()


if __name__ == "__main__":
    asyncio.run(main())
