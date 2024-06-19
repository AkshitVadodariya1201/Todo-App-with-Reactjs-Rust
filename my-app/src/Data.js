function Data({ match, data }) {
  const id = match.params.id;
  const selectedData = data[id];

  return (
    <div>
      <h1>Data</h1>
      <p>Name: {selectedData.name}</p>
      <p>Age: {selectedData.age}</p>
      <p>Email: {selectedData.email}</p>
    </div>
  );
}

export default Data;
