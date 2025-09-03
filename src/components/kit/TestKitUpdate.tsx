import { useKit } from "@/context/kit-context";
import { useEffect, useState } from "react";

const TestKitUpdate = () => {
  const { kit } = useKit();
  const [kitState, setKitState] = useState<any[]>([]);

  useEffect(() => {
    console.log("Kit updated:", kit);
    setKitState([...kit]);
  }, [kit]);

  return (
    <div className="p-4 bg-yellow-100 rounded-lg mb-4">
      <h3 className="font-bold mb-2">Kit Update Test Component</h3>
      <p>Kit items count: {kit.length}</p>
      <ul>
        {kitState.map((item, index) => (
          <li key={index}>
            {item.name} - Category: {item.category} - Qty: {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestKitUpdate;