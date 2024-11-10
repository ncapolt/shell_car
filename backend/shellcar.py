# pylint: disable=E1126
# pylint: disable=E0401
# pylint: disable=C0413
# pylint: disable=C0411
# pylint: disable=C0103
# pylint: disable=C0301
# pylint: disable=W0612

# shellcar.py

import asyncio
from uuids import CHAR_UUID_BATTERY, CHAR_UUID_BRANDBASE, SERVICE_UUID_BRANDBASE
from bleak import BleakClient, BleakScanner


class ShellCar:
    def __init__(self):
        self.client = None
        self.connected = False
        self.battery_level = None

    async def loop(self):
        while True:
            await self.connect_to_device()

    async def connect_to_device(self):
        try:
            devices = await BleakScanner.discover()
            for device in devices:
                if SERVICE_UUID_BRANDBASE in device.metadata["uuids"]:
                    self.client = BleakClient(device.address)
                    await self.client.connect()
                    self.connected = True
                    print("Connected to device")
                    # await self.client.start_notify(
                    #     CHAR_UUID_BATTERY, self.battery_notification_handler
                    # )
                    return True
        except Exception as e:
            print(f"Failed to connect: {e}")
            self.connected = False
            return False

    async def send_command(self, command):
        try:
            devices = await BleakScanner.discover()
            for device in devices:
                if SERVICE_UUID_BRANDBASE in device.metadata["uuids"]:
                    self.client = BleakClient(device.address)
                    await self.client.connect()
                    if self.client is None or not self.connected:
                        raise AttributeError("Client is not connected")
                    await self.client.write_gatt_char(CHAR_UUID_BRANDBASE, command)
                    return True
        except Exception as e:
            print(f"Failed to send command: {e}")
            return False

    async def execute_routine(self, commands):
        print("Executing routine")
        print(commands)
        try:
            devices = await BleakScanner.discover()
            for device in devices:
                if SERVICE_UUID_BRANDBASE in device.metadata["uuids"]:
                    self.client = BleakClient(device.address)
                    await self.client.connect()
                    if self.client is None or not self.connected:
                        raise AttributeError("Client is not connected")

                    for command in commands:
                        await self.client.write_gatt_char(CHAR_UUID_BRANDBASE, command)
                        await asyncio.sleep(command.duration)

                    return True

        except Exception as e:
            print(f"Failed to execute routine: {e}")
            return False

    def battery_notification_handler(self, sender, data):
        # Desencriptar y procesar los datos de la notificación
        # print(sender)
        
        # sequential_number = data[0]
        # vbt_string = data[1:4].decode("utf-8")
        battery_level = data[4]
        print(
            # f"Battery level: {battery_level}% (Sequential number: {sequential_number}, VBT: {vbt_string})"
            f"Battery level: {battery_level}%"
        )
        self.battery_level = battery_level


# Ejemplo de uso
async def main():
    car = ShellCar()
    # await car.connect_to_device()
    await car.loop()


if __name__ == "__main__":
    asyncio.run(main())
