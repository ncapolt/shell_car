'use client';
// import { ChangeEvent } from "react";
// import { Command } from "./page";

import type { ChangeEvent } from "react";
import type { Command } from "./page";

// Modal Component
type ModalProps = {
    routine: Command[];
    updateCommand: (index: number, key: keyof Command, value: boolean | number) => void;
    moveCommand: (index: number, direction: "up" | "down") => void;
    removeCommand: (index: number) => void;
    setIsModalOpen: (value: boolean) => void;
    addCommand: () => void;
};
export const Modal: React.FC<ModalProps> = ({ routine, updateCommand, moveCommand, removeCommand, setIsModalOpen, addCommand }) => {
    return <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
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
    </div>;
};
