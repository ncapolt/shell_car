
import { useState } from "react";

export function useCarType() {
  const [carType, setCarType] = useState("bmw");
  return { carType, setCarType };
}
