
import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface CarTypeContextProps {
  carType: string;
  setCarType: React.Dispatch<React.SetStateAction<string>>;
}

const CarTypeContext = createContext<CarTypeContextProps | undefined>(undefined);

export const CarTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [carType, setCarType] = useState("bmw");
  return (
    <CarTypeContext.Provider value={{ carType, setCarType }}>
      {children}
    </CarTypeContext.Provider>
  );
};

export const useCarType = () => {
  const context = useContext(CarTypeContext);
  if (!context) {
    throw new Error("useCarType must be used within a CarTypeProvider");
  }
  return context;
};
