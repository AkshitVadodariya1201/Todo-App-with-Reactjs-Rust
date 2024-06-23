import React, { useState } from "react";
import "./App.css";
import LightDark from "./components/LightDark";

function App() {
  const [list, setList] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempContent, setTempContent] = useState('');


  async function getTodos(page = 1, limit = 10) {
    try {
      const response = await fetch(`http://localhost:8000/api/todos?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setList(data.todos);
      console.log(data.todos);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function createTodo() {
    // Check if either newTitle or newContent is empty
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Title and content cannot be empty.");
      return; // Exit the function early if validation fails
    }

    let data = {
      title: newTitle,
      content: newContent,
      completed: false // Assuming new todos are not completed by default
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
      .then(data => {
        console.log(data);
        getTodos(); // Refresh the list after adding
      })
      .catch(error => console.error('Error:', error));
  }



  function handleToggle(todoId, completed) {
    fetch(`http://localhost:8000/api/todos/${todoId}`, {
      method: "PATCH", // Updated to PATCH method
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: completed,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Todo updated:", data);
        getTodos(); // Refresh the list to reflect the changes
      })
      .catch(error => console.error('Error:', error));
  }

  function handleDelete(todoId) {
    // Confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to delete?");
    if (!isConfirmed) {
      return; // Exit the function if the user clicks Cancel
    }

    fetch(`http://localhost:8000/api/todos/${todoId}`, {
      method: "DELETE",
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        getTodos(); // Refresh the list after deleting
      })
      .catch(error => console.error('Error:', error));
  }

  function handleUpdate(todoId, newTitle, newContent) {
    fetch(`http://localhost:8000/api/todos/${todoId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        getTodos(); // Refresh the list to reflect the changes
      })
      .catch(error => console.error('Error:', error));
  }

  function startEdit(todoId, title, content) {
    setEditingId(todoId);
    setTempTitle(title);
    setTempContent(content);
  }

  function cancelEdit() {
    setEditingId(null);
    setTempTitle('');
    setTempContent('');
  }

  function saveEdit(todoId) {
    handleUpdate(todoId, tempTitle, tempContent);
    cancelEdit();
  }

  return (
    <>
      <div className="App">
        <LightDark />
        <h1>Todo App</h1>
        <h2>My list of todo to see:</h2>
        <div className="button-container">
          <button onClick={() => getTodos()}>Get Todos</button>
          <input
            type="text"
            placeholder="New Todo Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="New Todo Content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button onClick={createTodo}>Create New Todo</button>
        </div>
        <ItemList
          artworks={list}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onUpdate={startEdit}
          editingId={editingId}
          tempTitle={tempTitle}
          setTempTitle={setTempTitle}
          tempContent={tempContent}
          setTempContent={setTempContent}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
        />
      </div>
    </>
  );
}

function ItemList({ artworks, onToggle, onDelete, onUpdate, editingId, tempTitle, setTempTitle, tempContent, setTempContent, cancelEdit, saveEdit }) {
  return (
    <ul className="list-items">
      {artworks.map(artwork => (
        <li key={artwork.id}>
          {editingId === artwork.id ? (
            <>
              <input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} />
              <input value={tempContent} onChange={(e) => setTempContent(e.target.value)} />
              <button onClick={() => saveEdit(artwork.id)}>Save</button>
              <button onClick={cancelEdit}>Cancel</button>
            </>
          ) : (
            <>
              <label>
                <input type="checkbox" checked={artwork.completed} onChange={e => onToggle(artwork.id, e.target.checked)} />
                {artwork.title}
              </label>
              <button onClick={() => onDelete(artwork.id)}>Delete</button>
              <button onClick={() => onUpdate(artwork.id, artwork.title, artwork.content)}>Update</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default App;