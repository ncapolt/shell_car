async def on_gamepad_event(self):
    pygame.init()
    pygame.joystick.init()

    if pygame.joystick.get_count() == 0:
        print("No joystick detected.")
        return

    joystick = pygame.joystick.Joystick(0)
    joystick.init()

    print(f"Using joystick: {joystick.get_name()}")
    print(f"Number of axes: {joystick.get_numaxes()}")

    while True:
        pygame.event.pump()
        command = CarCommand(
            forward=False,
            backward=False,
            left=False,
            right=False,
            turbo=False,
            duration=1,
        )

        # Handle axis inputs
        throttle_axis = joystick.get_axis(2)  # Example: Accelerator axis
        brake_axis = joystick.get_axis(3)     # Example: Brake axis
        steering_axis = joystick.get_axis(0)  # Example: Steering axis

        # Adjust the forward/backward logic based on the pedal inputs
        if throttle_axis > 0.1:  # Threshold to ignore minor noise
            command.forward = True
        if brake_axis > 0.1:  # Threshold to ignore minor noise
            command.backward = True

        # Adjust the left/right logic based on the steering wheel position
        if steering_axis < -0.5:
            command.left = True
        elif steering_axis > 0.5:
            command.right = True

        # Optionally handle turbo or other buttons
        for event in pygame.event.get():
            if event.type == pygame.JOYBUTTONDOWN:
                if event.button == 2:  # Example: Circle button
                    command.turbo = True
            elif event.type == pygame.JOYBUTTONUP:
                if event.button == 2:  # Example: Circle button
                    command.turbo = False

        await self.shellcar.send_command(command.get_bytes())
        self.shellcar.set_command(command.get_bytes())
        print(f"Command: {command}")
