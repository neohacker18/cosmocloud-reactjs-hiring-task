import React, { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Space, notification } from "antd";

type NotificationType = "success" | "info" | "warning" | "error";

interface Item {
  name: string;
  type: string;
  children: Item[];
  key: number;
  parentKey: number | null;
  parentMargin: number;
}
const jsonViewStyle = {
  backgroundColor: "#f4f4f4",
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontFamily: "monospace",
  fontSize: "14px",
  whiteSpace: "pre-wrap",
  maxWidth: "480px",
};
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

const findNameRecursively = (
  Array: Item[],
  text: string,
  parentKey: number | null
): boolean => {
  let flag: boolean = false;
  for (let i = 0; i < Array.length; i++) {
    const curr = Array[i];
    if (curr.name === text && curr.parentKey === parentKey) {
      return true;
    } else if (curr.children) {
      flag = findNameRecursively(curr.children, text, parentKey);
      if (flag) return true;
    }
  }
  return flag;
};
const findGlobalRecursively = (Array: Item[]): boolean => {
  let flag = false;
  for (let i = 0; i < Array.length; i++) {
    for (let j = 0; j < Array.length; j++) {
      if (i == j) continue;
      if (
        Array[i].name === Array[j].name &&
        Array[i].parentKey === Array[i].parentKey
      ) {
        return true;
      } else {
        flag = findGlobalRecursively(Array[j].children);
        if (flag) return true;
      }
    }
  }
  return flag;
};

const Field: React.FC<{
  item: Item;
  handleRemoveItem: (key: number | null) => void;
  handleAddItem: (index: number | null, type: string,fieldText:HTMLElement|null) => void;
  itemList: Item[];
  setItemList: React.Dispatch<React.SetStateAction<Item[]>>;
}> = ({ item, handleRemoveItem, handleAddItem, itemList, setItemList }) => {
  return (
    <div
      style={{
        marginLeft: `${item.parentMargin}px`,
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
            <Select.Option value="number">number</Select.Option>
            <Select.Option value="string">string</Select.Option>
            <Select.Option value="nested">nested</Select.Option>
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
          <Form.Item
            style={{
              maxWidth: `${540 + item.parentMargin}px`,
              paddingLeft: `${item.parentMargin + 40}px`,
            }}
          >
            <Button
              type="primary"
              onClick={() =>
                handleAddItem(
                  item.key,
                  "number",
                  document.getElementById("FieldText")
                )
              }
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
  const [api, contextHolder] = notification.useNotification();

  const openNotificationWithIcon = (
    type: NotificationType,
    message: string,
    description: string
  ) => {
    api[type]({
      message,
      description,
    });
  };

  const [itemList, setItemList] = useState<Item[]>([]);
  const [counter, setCounter] = useState<number>(0);
  const [option, setOption] = useState("number");
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [jsonView, setJsonView] = useState<string>("");
  const [status, setStatus] = useState<boolean>(false);

  useEffect(() => {
    updateJsonView();
  }, [itemList]);

  const processItem = (item:Item) => {
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

  const handleAddItem = (
    parentKey: number | null,
    type: string,
    fieldText: string
  ): void => {
    if (isAddingItem) {
      return;
    }
    if (findNameRecursively(itemList, text, parentKey)) {
      openNotificationWithIcon(
        "error",
        "Duplicate keys",
        "Element contains duplicate key name."
      );
      return;
    }
    if (findGlobalRecursively(itemList)) {
      openNotificationWithIcon(
        "error",
        "Duplicate keys",
        "Element contains duplicate key name. Please change the field title."
      );
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
      if (
        parentItem &&
        (fieldText != "" ||
          (fieldText == "" && parentItem.children.length === 0))
      ) {
        newItem = {
          name: fieldText ? fieldText : "",
          type,
          key: counter,
          parentKey,
          children: [],
          parentMargin: parentItem.parentMargin + 40,
        };

        if (findNameRecursively(parentItem.children, text, parentKey)) {
          openNotificationWithIcon(
            "error",
            "Duplicate keys",
            "Element contains duplicate key name."
          );
          return;
          setIsAddingItem(false);
          return;
        }
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
    if (findGlobalRecursively(itemList)) {
      openNotificationWithIcon(
        "error",
        "Duplicate keys",
        "Element contains duplicate key name. Please change the field title."
      );
      return;
    }
  };

  const handleRemoveItem = (key: number | null): void => {
    const updatedItemList = removeItemRecursively([...itemList], key);
    setItemList(updatedItemList);
  };
  const removeItemRecursively = (
    items: Item[],
    keyToRemove: number | null
  ): Item[] => {
    return items.filter((item) => {
      if (item.key === keyToRemove) {
        return false;
      }
      if (item.children.length > 0) {
        item.children = removeItemRecursively(item.children, keyToRemove);
      }
      return true;
    });
  };
  useEffect(() => {
    if (text !== "") setStatus(false);
  }, [text]);

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
              status={status ? "error" : ""}
              value={text}
              style={{ width: 200 }}
              placeholder="Enter Field"
              onChange={(e) => {
                setText(e.target.value);
              }}
            />
            <Select
              value={option}
              onChange={(value) => setOption(value)}
              style={{ width: 200 }}
            >
              <Select.Option value="number">number</Select.Option>
              <Select.Option value="string">string</Select.Option>
              <Select.Option value="nested">nested</Select.Option>
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
                  if (text === "") {
                    setStatus(true);
                    openNotificationWithIcon(
                      "error",
                      "Missing field",
                      "Field information is empty"
                    );
                    return;
                  }
                  setStatus(false);
                  handleAddItem(null, option, text);
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
      <pre style={jsonViewStyle}>{jsonView}</pre>
      {contextHolder}
    </>
  );
};

export default App;
