import threading
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk


class ShellCarGUI:
    def __init__(self, root):
        self.root = root
        # self.root.wm_attributes("-type", "splash")
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

        self.status_frame = ttk.LabelFrame(root, text="Car Status")
        self.status_frame.grid(column=0, row=0, padx=10, pady=10)

        self.forward_label = ttk.Label(self.status_frame, text="Forward: OFF")
        self.forward_label.grid(column=0, row=0, padx=5, pady=5)

        self.backward_label = ttk.Label(self.status_frame, text="Backward: OFF")
        self.backward_label.grid(column=0, row=1, padx=5, pady=5)

        self.left_label = ttk.Label(self.status_frame, text="Left: OFF")
        self.left_label.grid(column=0, row=2, padx=5, pady=5)

        self.right_label = ttk.Label(self.status_frame, text="Right: OFF")
        self.right_label.grid(column=0, row=3, padx=5, pady=5)

        self.turbo_label = ttk.Label(self.status_frame, text="Turbo: OFF")
        self.turbo_label.grid(column=0, row=4, padx=5, pady=5)

        self.lamp_label = ttk.Label(self.status_frame, text="Lamp: OFF")
        self.lamp_label.grid(column=0, row=5, padx=5, pady=5)

        self.connection_label = ttk.Label(
            self.status_frame, text="Connection: DISCONNECTED"
        )
        self.connection_label.grid(column=0, row=6, padx=5, pady=5)

        self.event_type_label = ttk.Label(self.status_frame, text="Event Type: ")
        self.event_type_label.grid(column=0, row=7, padx=5, pady=5)

        self.connect_button = ttk.Button(
            self.status_frame,
            text="Connect to Controller",
            command=lambda: threading.Thread(
                target=self.start_gamepad_listener, daemon=True
            ).start(),
        )
        self.connect_button.grid(column=0, row=1, padx=10, pady=10)

        self.status_frame.grid_remove()

    def start_gamepad_listener(self):
        # This method should be defined in the main file and passed to the GUI class
        pass
