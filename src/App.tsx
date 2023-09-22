import React, { useState } from "react";

interface Item {
  name: string;
  type: string;
  children: Item[];
  key: number;
  parentKey: number | null;
  parentMargin: number;
}

const findItemRecursively = (Array: Item[], key: number): Item | null => {
  let item = null;
  for (let i = 0; i < Array.length; i++) {
    const curr = Array[i];
    if (curr.key === key) {
      return curr;
    } else if (curr.children) {
      item = findItemRecursively(curr.children, key);
      if (item) return item;
    }
  }
  return item;
};

const Field: React.FC<{
  item: Item;
  handleRemoveItem: (key: number | null) => void;
  handleAddItem: (index: number | null, type: string) => void;
  itemList: Item[];
  setItemList: React.Dispatch<React.SetStateAction<Item[]>>;
}> = ({ item, handleRemoveItem, handleAddItem, itemList, setItemList }) => {
  return (
    <div style={{ marginLeft: `${item.parentMargin}px` }}>
      <select
        name=""
        id=""
        value={item.type}
        onChange={(e) => {
          const updatedItemList = [...itemList];
          const itemToUpdate = findItemRecursively(updatedItemList, item.key);
          if (itemToUpdate) {
            itemToUpdate.type = e.target.value;
            setItemList(updatedItemList);
          }
        }}
      >
        <option value="number">number</option>
        <option value="string">string</option>
        <option value="nested">nested</option>
      </select>
      {item.type === "nested" && (
        <button onClick={() => handleAddItem(item.key, "number")}>
          add item
        </button>
      )}
      <button onClick={() => handleRemoveItem(item.key)}>remove</button>
      <div>
        {item.type === "nested" &&
          item.children.map((childItem) => (
            <Field
              key={childItem.key}
              item={childItem}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
              itemList={itemList}
              setItemList={setItemList}
            />
          ))}
      </div>
    </div>
  );
};
const App: React.FC = () => {
  const [itemList, setItemList] = useState<Item[]>([]);
  const [counter, setCounter] = useState<number>(0);
  const [option, setOption] = useState("number");
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);

  const handleAddItem = (parentKey: number | null, type: string): void => {
    if (isAddingItem) {
      return;
    }
    setIsAddingItem(true);

    let newItem: Item;
    if (parentKey === null) {
      newItem = {
        name: "",
        type,
        key: counter,
        parentKey: null,
        children: [],
        parentMargin: 0,
      };

      const updatedItemList = [...itemList, newItem];
      setItemList(updatedItemList);
    } else {
      const parentItem = findItemRecursively(itemList, parentKey);
      if (parentItem) {
        newItem = {
          name: "",
          type,
          key: counter,
          parentKey,
          children: [],
          parentMargin: parentItem.parentMargin + 10,
        };
        parentItem.children.push(newItem);
      } else {
        setIsAddingItem(false);
        return;
      }
    }

    setCounter(counter + 1);
    setIsAddingItem(false);
  };

  const handleRemoveItem = (key: number | null): void => {
    const updatedItemList = [...itemList];
    if (key !== null) {
      const index = updatedItemList.findIndex((item) => item.key === key);
      if (index !== -1) updatedItemList.splice(index, 1);
    }
    setItemList(updatedItemList);
  };

  return (
    <>
      {itemList &&
        itemList.map((element) => (
          <Field
            key={element.key}
            item={element}
            handleAddItem={handleAddItem}
            handleRemoveItem={handleRemoveItem}
            itemList={itemList}
            setItemList={setItemList}
          />
        ))}
      <>
        <input type="text" placeholder="Enter Field" />
        <select
          name=""
          id=""
          value={option}
          onChange={(e) => setOption(e.target.value)}
        >
          <option value="number">number</option>
          <option value="string">string</option>
          <option value="nested">nested</option>
        </select>
        <button
          onClick={() => handleAddItem(null, option)}
          disabled={isAddingItem}
        >
          add item
        </button>
      </>
    </>
  );
};

export default App;
