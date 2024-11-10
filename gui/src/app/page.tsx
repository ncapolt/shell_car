'use client';

import axios from 'axios';
import { useState, ChangeEvent, useEffect } from "react";
import ThreeJSViewer from './ThreeJSViewer';
import Image from 'next/image';
import bmwLogo from './_components/bmw.svg';
import ferrariLogo from './_components/ferrari.svg';

interface Command {
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
  const [carType, setCarType] = useState<string>('bmw');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  const connect = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/connect');
      setConnected(response.data.connected);
    } catch (error) {
      console.error("Error connecting:", error);
    }
  };

  const startListeners = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/start_listeners');
    } catch (error) {
      console.error("Error starting listeners:", error);
    }
  };
  
  const sendRoutine = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/send_command', { commands: routine });
    } catch (error) {
      console.error("Error sending routine:", error);
    }
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

  const getBatteryLevel = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/battery_level');
      setBatteryLevel(response.data.battery_level);
    } catch (error) {
      console.error("Error getting battery level:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connected) {
      getBatteryLevel();
      interval = setInterval(getBatteryLevel, 60000); // Ejecutar cada 60 segundos
    }
    return () => clearInterval(interval); // Limpiar el intervalo al desmontar o desconectar
  }, [connected]);

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center bg-cover bg-center" style={{ backgroundImage: `url(background_${carType}.png)` }}>
      <div className="w-screen h-screen container mx-auto p-4">
        <div className="w-screen flex flex-row justify-between items-center px-10">
          <div className="w-screen flex flex-col justify-between items-center">
            <h1 className="text-2xl font-bold mb-4 text-white">{carType === 'bmw' ? 'BMW M Hybrid V8' : 'FERRARI F1-75'}</h1>
            <h2 className="text-1xl font-bold mb-4 text-white">Shell Car Controller - {connected ? 'Connected' : 'Disconnected'}</h2>
            {connected && batteryLevel !== null && (
              <div className="text-white">
                Battery Level: {batteryLevel}%
              </div>
            )}
            
          </div>
        </div>
        {/* <ThreeJSViewer carType={carType} /> */}
      </div>
      
      <div className="absolute bottom-0 p-4 justify-between
        w-screen flex flex-row items-center space-x-4 mb-2">
        <button onClick={connect} className="hover:bg-blue-400 bg-blue-500 text-white px-4 py-2 rounded">Connect</button>
        <button onClick={startListeners} className="hover:bg-green-400 bg-green-500 text-white px-4 py-2 rounded">Start Listeners</button>
        <button onClick={() => setIsModalOpen(true)} className="hover:bg-yellow-400 bg-yellow-500 text-white px-4 py-2 rounded">Add Command</button>
        <button onClick={sendRoutine} className="hover:bg-red-400 bg-red-500 text-white px-4 py-2 rounded">Send Routine</button>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Command</h2>
            <div className="space-y-4">
              {routine.map((command, index) => (
                <div key={index} className="p-4 border rounded bg-white bg-opacity-75">
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <span>Forward:</span>
                      <input type="checkbox" checked={command.forward} onChange={(e: ChangeEvent<HTMLInputElement>) => updateCommand(index, 'forward', e.target.checked)} className="form-checkbox" />
                    </label>
                    <label className="flex items-center space-x-2">
                      <span>Backward:</span>
                      <input type="checkbox" checked={command.backward} onChange={(e: ChangeEvent<HTMLInputElement>) => updateCommand(index, 'backward', e.target.checked)} className="form-checkbox" />
                    </label>
                    <label className="flex items-center space-x-2">
                      <span>Left:</span>
                      <input type="checkbox" checked={command.left} onChange={(e: ChangeEvent<HTMLInputElement>) => updateCommand(index, 'left', e.target.checked)} className="form-checkbox" />
                    </label>
                    <label className="flex items-center space-x-2">
                      <span>Right:</span>
                      <input type="checkbox" checked={command.right} onChange={(e: ChangeEvent<HTMLInputElement>) => updateCommand(index, 'right', e.target.checked)} className="form-checkbox" />
                    </label>
                    <label className="flex items-center space-x-2">
                      <span>Turbo:</span>
                      <input type="checkbox" checked={command.turbo} onChange={(e: ChangeEvent<HTMLInputElement>) => updateCommand(index, 'turbo', e.target.checked)} className="form-checkbox" />
                    </label>
                    <label className="flex items-center space-x-2">
                      <span>Duration:</span>
                      <input type="number" value={command.duration} onChange={(e: ChangeEvent<HTMLInputElement>) => updateCommand(index, 'duration', Number(e.target.value))} className="form-input w-20" />
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    {index > 0 && (
                      <button onClick={() => moveCommand(index, 'up')} className="bg-gray-500 text-white px-2 py-1 rounded">Up</button>
                    )}
                    {index < routine.length - 1 && (
                      <button onClick={() => moveCommand(index, 'down')} className="bg-gray-500 text-white px-2 py-1 rounded">Down</button>
                    )}
                    <button onClick={() => removeCommand(index)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Close</button>
              <button onClick={addCommand} className="bg-blue-500 text-white px-4 py-2 rounded ml-2">Add Command</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
