import React, { useEffect, useState } from "react";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Space } from "antd";

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
    <div
      style={{
        marginLeft: `${item.parentMargin}px`,
        // border:'1px solid black'
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Space style={{ display: "flex" }} align="baseline">
          <Input
            style={{ width: 200 }}
            id={"InputField"}
            value={item.name}
            placeholder="Enter field"
            onChange={(event) => {
              const updatedItemList = [...itemList];
              const itemToUpdate = findItemRecursively(
                updatedItemList,
                item.key
              );
              if (itemToUpdate) {
                itemToUpdate.name = event.target.value;
                setItemList(updatedItemList);
              }
            }}
          />
          <Select
            style={{ width: 200 }}
            value={item.type}
            onChange={(value) => {
              const updatedItemList = [...itemList];
              const itemToUpdate = findItemRecursively(
                updatedItemList,
                item.key
              );
              if (itemToUpdate) {
                itemToUpdate.type = value;
                setItemList(updatedItemList);
              }
            }}
          >
            <option value="number">number</option>
            <option value="string">string</option>
            <option value="nested">nested</option>
          </Select>
          <Form.Item style={{ flex: 1 }}>
            <Button danger onClick={() => handleRemoveItem(item.key)} block>
              remove
            </Button>
          </Form.Item>
        </Space>
      </div>
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
      {item.type === "nested" && (
        <div>
          <Form.Item style={{ maxWidth: `${530+item.parentMargin}px`,paddingLeft:`${item.parentMargin+30}px` }}>
            <Button
              type="primary"
              onClick={() => handleAddItem(item.key, "number")}
              block
              icon={<PlusOutlined />}
            >
              Add Item
            </Button>
          </Form.Item>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [itemList, setItemList] = useState<Item[]>([]);
  const [counter, setCounter] = useState<number>(0);
  const [option, setOption] = useState("number");
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [jsonView, setJsonView] = useState<string>("");
  const [status,setStatus]=useState<boolean>(false)

  useEffect(() => {
    updateJsonView();
  }, [itemList]);
  const processItem = (item) => {
    if (item.type === "nested") {
      const result = {
        [item.name]: {}, 
      };
      for (const child of item.children) {
        Object.assign(result[item.name], processItem(child));
      }
      return result;
    } else {
      return {
        [item.name]: item.type,
      };
    }
  };
  
  const updateJsonView = () => {
    const result = {};
    for (const item of itemList) {
      Object.assign(result, processItem(item));
    }
    setJsonView(JSON.stringify(result, null, 2));
  };
  

  const handleAddItem = (parentKey: number | null, type: string): void => {
    if (isAddingItem) {
      return;
    }
    setIsAddingItem(true);

    let newItem: Item;
    if (parentKey === null) {
      newItem = {
        name: text,
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
          name: text,
          type,
          key: counter,
          parentKey,
          children: [],
          parentMargin: parentItem.parentMargin + 30,
        };
        parentItem.children.push(newItem);
      } else {
        setIsAddingItem(false);
        return;
      }
      updateJsonView();
    }

    setCounter(counter + 1);
    setIsAddingItem(false);
    setText("");
  };

  const handleRemoveItem = (key: number | null): void => {
    const updatedItemList = [...itemList];
    if (key !== null) {
      const index = updatedItemList.findIndex((item) => item.key === key);
      if (index !== -1) updatedItemList.splice(index, 1);
    }
    setItemList(updatedItemList);
  };
  useEffect(() => {
    console.log(itemList);
  }, [itemList]);
  useEffect(()=>{
    if(text!=="")
    setStatus(false)
  },[text])

  return (
    <>
      <Form name="dynamic_form_nest_item" style={{ maxWidth: "100vw" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
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

          <Space
            align="baseline"
            style={{
              display: "flex",
              flexDirection: "row",
              maxWidth: 500,
            }}
          >
            <Input
              type="text"
              required
              status={status?"error":""}
              value={text}
              style={{ width: 200 }}
              placeholder="Enter Field"
              onChange={(e) => {
                setText(e.target.value);
              }}
            />
            <Select
              name="select"
              value={option}
              onChange={(value) => setOption(value)}
              style={{ width: 200 }}
            >
              <Option value="number">number</Option>
              <Option value="string">string</Option>
              <Option value="nested">nested</Option>
            </Select>
            <Form.Item style={{ flex: 1 }}>
              <Button danger onClick={() => handleRemoveItem(0)} block>
                remove
              </Button>
            </Form.Item>
          </Space>
          <Space
            align="baseline"
            style={{
              display: "flex",
              flexDirection: "row",
              maxWidth: 500,
            }}
          >
            <Form.Item style={{ flex: 1, width: 500 }}>
              <Button
                type="primary"
                onClick={() => {
                  if(text===""){
                    setStatus(true)
                    alert("Text missing")
                    return;
                  }
                  setStatus(false)
                  handleAddItem(null, option)
                }}
                block
                style={{ width: "100%" }}
                icon={<PlusOutlined />}
              >
                Add Item
              </Button>
            </Form.Item>
          </Space>
        </div>
      </Form>
      <pre>{jsonView}</pre>
    </>
  );
};

export default App;
