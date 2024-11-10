'use client';

import { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import bmwLogo from './_components/bmw.svg';
import ferrariLogo from './_components/ferrari.svg';
import CryptoJS from 'crypto-js';
import {
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
    BACKWARD_TURBO_RIGHT_COMMAND
} from './commands';
import { Modal } from "./Modal";

type BluetoothRemoteGATTServer = any;
type BluetoothRemoteGATTCharacteristic = any;
type BluetoothDevice = any;

type NavigatorBluetooth = Navigator & {
    bluetooth: any;
};


// Type error: Property 'tohex' does not exist on type 'ArrayBuffer'.

type ArrayBufferExtension = ArrayBuffer & {
    tohex: () => string;
};
type Uint8ArrayExtension = Uint8Array & {
    tohex: () => string;
};
type StringExtension = string & {
    toUint8Array: () => Uint8Array;
};

// Helper functions to extend prototypes
(ArrayBuffer.prototype as ArrayBufferExtension).tohex = function () {
    return [...new Uint8Array(this)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
};

(Uint8Array.prototype as Uint8ArrayExtension).tohex = function () {
    return [...new Uint8Array(this)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
};

(String.prototype as StringExtension).toUint8Array = function () {
    if (!this) return new Uint8Array();
    return Uint8Array.from(this.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
};


export interface Command {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turbo: boolean;
    duration: number;
}

export default function Home() {
    const [connected, setConnected] = useState<boolean>(false);
    const [routine, setRoutine] = useState<Command[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

    const turboEl = useRef<HTMLInputElement>(null);
    const lightEl = useRef<HTMLInputElement>(null);
    const batteryEl = useRef<HTMLSpanElement>(null);

    const [bluetooth, setBluetooth] = useState<BluetoothRemoteGATTServer | null>(null);
    const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

    const CONTROL_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
    const BATTERY_SERVICE_UUID = 'd44bc439-abfd-45a2-b575-925416129601';
    const CONTROL_CHARACTERISTICS_UUID = 'd44bc439-abfd-45a2-b575-925416129600';
    const BATTERY_CHARACTERISTICS_UUID = 'd44bc439-abfd-45a2-b575-925416129601';

    const DECRYPT_KEY = "34522a5b7a6e492c08090a9d8d2a23f8";

    const [controllerConnected, setControllerConnected] = useState<boolean>(false);

    const [command, setCommand] = useState<Command>({
        forward: false,
        backward: false,
        left: false,
        right: false,
        turbo: false,
        duration: 1,
    });

    const [lastCommand, setLastCommand] = useState<Command | null>(null);

    const isIdle = (cmd: Command | null) => {
        if (!cmd) return false;
        return !cmd.forward && !cmd.backward && !cmd.left && !cmd.right && !cmd.turbo;
    }

    const [carType, setCarType] = useState<string>('bmw');

    useEffect(() => {
        const storedCarType = localStorage.getItem('carType');
        if (storedCarType) {
            setCarType(storedCarType);
        }
    }, []);

    // save carType to localStorage
    useEffect(() => {
        localStorage.setItem('carType', carType);
    }, [carType]);

    const connectButton = async () => {
        try {
            console.log('Requesting any Bluetooth Device...');
            const device = await (navigator as NavigatorBluetooth).bluetooth.requestDevice({
                filters: [{ namePrefix: "QCAR-" }],
                optionalServices: [
                    CONTROL_SERVICE_UUID,
                    BATTERY_SERVICE_UUID,
                    CONTROL_CHARACTERISTICS_UUID,
                    BATTERY_CHARACTERISTICS_UUID,
                ]
            });
            await connectDevice(device);
            console.log("Device connected");
            setConnected(true);

            setCommand({ forward: true, backward: false, left: false, right: false, turbo: false, duration: 1 });
        } catch (error) {
            console.error("Error connecting:", error);
        }
    };

    const connectDevice = async (device: BluetoothDevice) => {
        try {
            device.addEventListener('gattserverdisconnected', onDisconnected);
            setBluetooth(await device.gatt?.connect() || null);
        } catch (error) {
            console.error("Error during device connection:", error);
        }
    };

    const disconnectDevice = async () => {
        if (!bluetooth) return;
        await bluetooth.disconnect();
    }

    const onDisconnected = () => {
        console.log('> Bluetooth Device disconnected');
        setBluetooth(null);
        setConnected(false);
    };

    const decryptAES = (cipherText: ArrayBuffer) => {
        const encryptedHex = CryptoJS.enc.Hex.parse((cipherText as ArrayBufferExtension).tohex());
        const keyHex = CryptoJS.enc.Hex.parse(DECRYPT_KEY);

        const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedHex }, keyHex, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.NoPadding
        });

        return decrypted.toString().toUint8Array();
    };

    const encryptAES = (cipherText: ArrayBuffer) => {
        const valueHex = CryptoJS.enc.Hex.parse((cipherText as ArrayBufferExtension).tohex());
        const keyHex = CryptoJS.enc.Hex.parse(DECRYPT_KEY);
        const encrypted = CryptoJS.AES.encrypt(valueHex, keyHex, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.NoPadding
        });
        return encrypted.ciphertext.toString().toUint8Array();
    };

    const sendMessage = async (reset2IDLE = true) => {
        if (!bluetooth || isSendingMessage) return;
        if (!lastCommand){
            if (isIdle(command) && lastCommand && isIdle(lastCommand)) {
                return;
            }
        }
        setIsSendingMessage(true);
        try {
            const cmd = calculateMove();
            const encryptCmd = encryptAES(cmd);
            const service = await bluetooth.getPrimaryService(CONTROL_SERVICE_UUID);
            const characteristic = await service.getCharacteristic(CONTROL_CHARACTERISTICS_UUID);
            await characteristic.writeValue(encryptCmd);
        } catch (error) {
            console.error("Error sending message:", error);
            setCommand({ forward: false, backward: false, left: false, right: false, turbo: false, duration: 1 });
        } finally {
            setIsSendingMessage(false);
            setLastCommand(command);
            if (reset2IDLE)
                setCommand({ forward: false, backward: false, left: false, right: false, turbo: false, duration: 1 });
        }
    };

    useEffect(() => {
        if (isSendingMessage) return;
        if (isIdle(command) && isIdle(lastCommand)) return;
        sendMessage();
    }, [command]);

    /* useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
            });
        }
    }, []); */

    useEffect(() => {
        const preloadImages = () => {
            const images = [
                '/background_bmw.png',
                '/background_ferrari.png'
            ];
            images.forEach((image) => {
                const img = document.createElement('img');
                img.src = image;
                document.body.appendChild(img);
                document.body.removeChild(img);
            });
        };
        document.addEventListener('DOMContentLoaded', preloadImages);
    }, []);

    const calculateMove = () => {
        if (isIdle(command)) return IDLE_COMMAND;

        const { forward, backward, left, right, turbo } = command;
        const light = lightEl.current?.checked || false;

        const cmd = new Uint8Array(16);

        cmd[1] = 0x43;
        cmd[2] = 0x54;
        cmd[3] = 0x4c;
        cmd[8] = 1;
        cmd[9] = 0x50;

        if (forward) cmd[4] = 1;
        if (backward) cmd[5] = 1;
        if (left) cmd[6] = 1;
        if (right) cmd[7] = 1;

        if (light) cmd[8] = 0;
        if (turbo) cmd[9] = 0x64;

        return cmd;
    };

    const handleNotificationsBattery = (event: Event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
            const decrypt = decryptAES(value.buffer);
            if (batteryEl.current) {
                batteryEl.current.innerHTML = decrypt[4].toString();
            }
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [connected]);

    const handleKeyDown = (event: KeyboardEvent) => {
        const newcommand = {
            forward: event.key === "ArrowUp",
            backward: event.key === "ArrowDown",
            left: event.key === "ArrowLeft",
            right: event.key === "ArrowRight",
            turbo: event.key === "Shift",
            duration: 1,
        };
        setCommand(newcommand);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const newcommand = {
            forward: event.key === "ArrowUp",
            backward: event.key === "ArrowDown",
            left: event.key === "ArrowLeft",
            right: event.key === "ArrowRight",
            turbo: event.key === "Shift",
            duration: 1,
        };
        setCommand(newcommand);
    };

    const addCommand = () => {
        setRoutine([...routine, { forward: false, backward: false, left: false, right: false, turbo: false, duration: 1 }]);
    };

    const updateCommand = (index: number, key: keyof Command, value: boolean | number) => {
        setRoutine(prevRoutine => {
            const newRoutine = [...prevRoutine];
            if (newRoutine[index]) {
                if (key === 'duration' && typeof value === 'number')
                    newRoutine[index][key] = value;
                else if (key !== 'duration' && typeof value === 'boolean')
                    newRoutine[index][key] = value as boolean;
            }
            return newRoutine;
        });
    };

    const removeCommand = (index: number) => {
        setRoutine(prevRoutine => prevRoutine.filter((_, i) => i !== index));
    };

    const moveCommand = (index: number, direction: 'up' | 'down') => {
        setRoutine(prevRoutine => {
            const newRoutine = [...prevRoutine];
            const [movedCommand] = newRoutine.splice(index, 1);
            if (direction === 'up' && index > 0 && movedCommand) {
                newRoutine.splice(index - 1, 0, movedCommand);
            } else if (direction === 'down' && index < newRoutine.length && movedCommand) {
                newRoutine.splice(index + 1, 0, movedCommand);
            }
            return newRoutine;
        });
    };

    const sendRoutine = async () => {
        if (!bluetooth) return;
        try {
            for (const cmd of routine) {
                for (let i = 0; i < cmd.duration; i++) {
                    setCommand(cmd);
                    await sendMessage(false);
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
            setCommand({ forward: false, backward: false, left: false, right: false, turbo: false, duration: 1 });
        } catch (error) {
            console.error("Error sending routine:", error);
        }
    }

    useEffect(() => {
        const handleGamepadConnected = (event: GamepadEvent) => {
            setControllerConnected(true);
            console.log('Gamepad connected:', event.gamepad);
        };

        const handleGamepadDisconnected = (event: GamepadEvent) => {
            setControllerConnected(false);
            console.log('Gamepad disconnected:', event.gamepad);
        };

        window.addEventListener('gamepadconnected', handleGamepadConnected);
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

        return () => {
            window.removeEventListener('gamepadconnected', handleGamepadConnected);
            window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
        };
    }, []);

    useEffect(() => {
        const updateGamepadState = () => {
            const gamepads = navigator.getGamepads();
            if (isSendingMessage) return;
            if (gamepads[0]) {
                const gp = gamepads[0];
                
                if (!gp.buttons) return;
                if (!gp.buttons[12] || !gp.buttons[13] || !gp.buttons[14] || !gp.buttons[15] || !gp.buttons[0] || !gp.buttons[7] || !gp.buttons[6] || !gp.axes) return;
                if (!gp.axes) return;
                if (!gp.axes[0]) return;
                
                // console.log(gp.buttons[6].value, gp.buttons[7].value)

                const newcommand = {
                    forward: gp.buttons[12].pressed || gp.buttons[7].value > 0,
                    backward: gp.buttons[13].pressed || gp.buttons[6].value > 0,
                    left: gp.buttons[14].pressed || gp.axes[0] < -0.3,
                    right: gp.buttons[15].pressed || gp.axes[0] > 0.3,
                    turbo: gp.buttons[0].pressed,
                    duration: 1,
                };

                console.log("idle", isIdle(newcommand), newcommand);
                
                setCommand(newcommand);
                // if (isIdle(command) && !isIdle(newcommand)) {
                // }
            }
            requestAnimationFrame(updateGamepadState);
        };

        requestAnimationFrame(updateGamepadState);
    }, [isSendingMessage]);

    return (
        <div className="w-screen h-screen flex flex-col justify-center items-center bg-cover bg-center" style={{ backgroundImage: `url(background_${carType}.png)` }}>
            <div className="w-screen h-screen p-4 pt-36">
                <div className="w-screen flex flex-row justify-between items-center px-10">
                    <div className="w-screen flex flex-col justify-between items-center">
                        <h1 className="text-2xl font-bold mb-4 text-white">{carType === 'bmw' ? 'BMW M Hybrid V8' : 'FERRARI F1-75'}</h1>
                        <div className="flex flex-row gap-10">
                            <h2 className="text-1xl font-bold mb-4 text-white">Shell Car - {connected ? '✅ Connected' : '🔴 Disconnected'}</h2>
                            <h2 className="text-1xl font-bold mb-4 text-white">Gamepad Controller - {controllerConnected ? '✅ Connected' : '🔴 Disconnected'}</h2>
                        </div>
                        {connected && batteryLevel !== null && (
                            <div className="text-white">
                                Battery Level: <span ref={batteryEl}>{batteryLevel}%</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* <ThreeJSViewer carType={carType} /> */}
            </div>

            <div className="
                w-1/2
                absolute bottom-0 p-4 
                justify-between 
                flex flex-row items-center space-x-4 mb-16"
            >
                { !connected ? (
                    <button onClick={connectButton} className="hover:bg-blue-400 bg-blue-500 text-white px-4 py-2 rounded">Connect</button>
                ) : (
                    <button onClick={disconnectDevice} className="hover:bg-red-400 bg-red-500 text-white px-4 py-2 rounded">Disconnect</button>
                )}
                { connected && (
                    <div className="flex space-x-4">
                        <button onClick={() => setIsModalOpen(true)} className="hover:bg-yellow-400 bg-yellow-500 text-white px-4 py-2 rounded">Add Command</button>
                        <button onClick={sendRoutine} className="hover:bg-green-400 bg-green-500 text-white px-4 py-2 rounded">Send Routine</button>
                    </div>
                )}
                {/* BMW/Ferrari Toggle */}
                <div className="flex justify-center">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button onClick={() => setCarType('bmw')} className={`hover:bg-blue-500 px-4 py-2 rounded-l-md ${carType === 'bmw' ? 'bg-blue-700 text-white' : 'bg-blue-950 text-white'}`}>
                            {/* BMW */}
                            <Image src={bmwLogo} alt="BMW Logo" width={25} height={25} />
                        </button>
                        <button onClick={() => setCarType('ferrari')} className={`hover:bg-red-500 px-4 py-2 rounded-r-md ${carType === 'ferrari' ? 'bg-red-700 text-white' : 'bg-red-950 text-white'}`}>
                            {/* Ferrari */}
                            <Image src={ferrariLogo} alt="Ferrari Logo" width={25} height={25} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                // Modal(routine, updateCommand, moveCommand, removeCommand, setIsModalOpen, addCommand)
                <Modal routine={routine} updateCommand={updateCommand} moveCommand={moveCommand} removeCommand={removeCommand} setIsModalOpen={setIsModalOpen} addCommand={addCommand} />
            )}
        </div>
    );
}
