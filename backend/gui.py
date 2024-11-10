# gui.py
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import threading
from routines import CarCommand
import asyncio


class ShellCarGUI:
    def __init__(self, root, shellcar, controller):
        self.root = root
        self.shellcar = shellcar
        self.controller = controller

        self.root.title("Shell Car")

        # Load the background image
        self.background_image = Image.open("background.png")
        self.background_photo = ImageTk.PhotoImage(self.background_image)

        # Create a canvas to hold the background image
        self.canvas = tk.Canvas(
            root,
            width=self.background_image.width,
            height=self.background_image.height,
            highlightthickness=0,
        )
        self.canvas.grid(column=0, row=0, columnspan=2, rowspan=8)

        # Add the background image to the canvas
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.background_photo)

        self.status_frame = ttk.LabelFrame(root, text="Car Status", padding=(10, 10))
        self.status_frame.grid(column=0, row=0, padx=10, pady=10, sticky="nsew")

        self.forward_label = ttk.Label(self.status_frame, text="Forward: OFF")
        self.forward_label.grid(column=0, row=0, padx=5, pady=2, sticky="w")

        self.backward_label = ttk.Label(self.status_frame, text="Backward: OFF")
        self.backward_label.grid(column=0, row=1, padx=5, pady=2, sticky="w")

        self.left_label = ttk.Label(self.status_frame, text="Left: OFF")
        self.left_label.grid(column=0, row=2, padx=5, pady=2, sticky="w")

        self.right_label = ttk.Label(self.status_frame, text="Right: OFF")
        self.right_label.grid(column=0, row=3, padx=5, pady=2, sticky="w")

        self.turbo_label = ttk.Label(self.status_frame, text="Turbo: OFF")
        self.turbo_label.grid(column=0, row=4, padx=5, pady=2, sticky="w")

        self.lamp_label = ttk.Label(self.status_frame, text="Lamp: OFF")
        self.lamp_label.grid(column=0, row=5, padx=5, pady=2, sticky="w")

        self.connection_label = ttk.Label(
            self.status_frame, text="Connection: DISCONNECTED"
        )
        self.connection_label.grid(column=0, row=6, padx=5, pady=2, sticky="w")

        self.event_type_label = ttk.Label(self.status_frame, text="Event Type: ")
        self.event_type_label.grid(column=0, row=7, padx=5, pady=2, sticky="w")

        self.connect_button = ttk.Button(
            self.status_frame,
            text="Connect to Controller",
            command=lambda: threading.Thread(
                target=self.controller.start_gamepad_listener, daemon=True
            ).start(),
        )
        self.connect_button.grid(column=0, row=8, padx=5, pady=5, sticky="ew")

        self.routine_button = ttk.Button(
            self.status_frame,
            text="Open Routine Designer",
            command=self.open_routine_designer,
        )
        self.routine_button.grid(column=0, row=9, padx=5, pady=5, sticky="ew")

        self.command_entries = []

    def open_routine_designer(self):
        self.routine_window = tk.Toplevel(self.root)
        self.routine_window.title("Routine Designer")

        self.routine_frame = ttk.LabelFrame(
            self.routine_window, text="Program Routine", padding=(10, 10)
        )
        self.routine_frame.grid(column=0, row=0, padx=10, pady=10, sticky="nsew")

        self.add_command_button = ttk.Button(
            self.routine_frame, text="Add Command", command=self.add_command_entry
        )
        self.add_command_button.grid(column=0, row=0, padx=5, pady=5, sticky="ew")

        self.send_routine_button = ttk.Button(
            self.routine_frame, text="Send Routine", command=self.send_routine
        )
        self.send_routine_button.grid(column=0, row=1, padx=5, pady=5, sticky="ew")

    def add_command_entry(self):
        frame = ttk.Frame(self.routine_frame, padding=(5, 5))
        frame.grid(
            column=0, row=len(self.command_entries) + 2, padx=5, pady=5, sticky="nsew"
        )

        forward_var = tk.BooleanVar()
        backward_var = tk.BooleanVar()
        left_var = tk.BooleanVar()
        right_var = tk.BooleanVar()
        turbo_var = tk.BooleanVar()
        duration_var = tk.StringVar()

        forward_check = ttk.Checkbutton(frame, text="Forward", variable=forward_var)
        backward_check = ttk.Checkbutton(frame, text="Backward", variable=backward_var)
        left_check = ttk.Checkbutton(frame, text="Left", variable=left_var)
        right_check = ttk.Checkbutton(frame, text="Right", variable=right_var)
        turbo_check = ttk.Checkbutton(frame, text="Turbo", variable=turbo_var)
        duration_entry = ttk.Entry(frame, textvariable=duration_var, width=5)

        forward_check.grid(column=0, row=0, padx=5, pady=2)
        backward_check.grid(column=1, row=0, padx=5, pady=2)
        left_check.grid(column=2, row=0, padx=5, pady=2)
        right_check.grid(column=3, row=0, padx=5, pady=2)
        turbo_check.grid(column=4, row=0, padx=5, pady=2)
        duration_entry.grid(column=5, row=0, padx=5, pady=2)

        def on_forward_change(*args):
            if forward_var.get():
                backward_var.set(False)

        def on_backward_change(*args):
            if backward_var.get():
                forward_var.set(False)

        def on_left_change(*args):
            if left_var.get():
                right_var.set(False)

        def on_right_change(*args):
            if right_var.get():
                left_var.set(False)

        forward_var.trace_add("write", on_forward_change)
        backward_var.trace_add("write", on_backward_change)
        left_var.trace_add("write", on_left_change)
        right_var.trace_add("write", on_right_change)

        self.command_entries.append(
            (forward_var, backward_var, left_var, right_var, turbo_var, duration_var)
        )

    def send_routine(self):
        routine = []
        for entry in self.command_entries:
            forward, backward, left, right, turbo, duration = entry
            if duration.get().isdigit():
                command = CarCommand(
                    forward=forward.get(),
                    backward=backward.get(),
                    left=left.get(),
                    right=right.get(),
                    turbo=turbo.get(),
                    duration=int(duration.get()),
                )
                routine.append(command)
        asyncio.run(self.shellcar.execute_routine(routine))

    def update_status(self):
        self.forward_label.config(
            text=f"Forward: {'ON' if self.shellcar.forward else 'OFF'}"
        )
        self.backward_label.config(
            text=f"Backward: {'ON' if self.shellcar.backward else 'OFF'}"
        )
        self.left_label.config(text=f"Left: {'ON' if self.shellcar.left else 'OFF'}")
        self.right_label.config(text=f"Right: {'ON' if self.shellcar.right else 'OFF'}")
        self.turbo_label.config(text=f"Turbo: {'ON' if self.shellcar.turbo else 'OFF'}")
        self.lamp_label.config(text=f"Lamp: {'ON' if self.shellcar.lamp else 'OFF'}")
        self.connection_label.config(
            text=f"Connection: {'CONNECTED' if self.shellcar.connected else 'DISCONNECTED'}"
        )
        self.root.after(100, self.update_status)
