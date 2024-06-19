import "./form.css";

function MyForm({ onCancel, onSubmit, editData }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const name = event.target.elements.name.value;
    const age = event.target.elements.age.value;
    const email = event.target.elements.email.value;

    onSubmit({ name, age, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Hello</h1>
      <label>
        Enter your name:
        <input name="name" defaultValue={editData ? editData.name : ""} />
      </label>
      <label>
        Enter your age:
        <input name="age" defaultValue={editData ? editData.age : ""} />
      </label>
      <label>
        Enter your email:
        <input name="email" defaultValue={editData ? editData.email : ""} />
      </label>
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default MyForm;
