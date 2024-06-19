import React, { useState } from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import "./App.css";
import MyForm from "./form";
import Data from "./Data";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState([]);
  const [editData, setEditData] = useState(null);

  function getTodos(page = 1, limit = 10) {
    fetch(`http://localhost:8000/api/todos?page=${page}&limit=${limit}`)
      .then(response => response.json())
      .then(data => console.log(data.todos))
      .catch(error => console.error('Error:', error));
  }

  function createTodo(title, content) {
    let data = {
      title: title,
      content: content,
      completed: false
    };

    fetch("http://localhost:8000/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(response => {
        if (response.status === 409) {
          throw new Error('A todo with this title already exists.');
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  }

  function handleButtonClick() {
    setEditData(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
  }

  function handleFormSubmit(data) {
    if (editData) {
      setFormData((prevData) =>
        prevData.map((d) => (d === editData ? data : d))
      );
    } else {
      setFormData((prevData) => [...prevData, data]);
    }
    setShowForm(false);
  }

  function handleEditButtonClick(data) {
    setEditData(data);
    setShowForm(true);
  }

  return (
    <Router>
      <div className="App">
        <h1>My First React App</h1>
        <button onClick={handleButtonClick}>Click Me</button>
        <button onClick={getTodos}>Click getData</button>
        <button onClick={createTodo("rust!", "dev")}>Click PostData</button>
        <div className="content">
          {formData.length > 0 && (
            <table>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Email</th>
                <th>Edit</th>
              </tr>
              {formData.map((data, index) => (
                <tr key={index}>
                  <td>
                    <Link to={`/data/${index}`}>{data.name}</Link>
                  </td>
                  <td>{data.age}</td>
                  <td>{data.email}</td>
                  <td>
                    <button onClick={() => handleEditButtonClick(data)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </table>
          )}
        </div>
        {showForm && (
          <MyForm
            onCancel={handleCancel}
            onSubmit={handleFormSubmit}
            editData={editData}
          />
        )}
        <Routes>
          <Route
            path="/data/:id"
            render={(props) => <Data {...props} data={formData} />}
          />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
