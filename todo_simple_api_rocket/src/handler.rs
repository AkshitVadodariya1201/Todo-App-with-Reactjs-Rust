use crate::{
    model::{Todo, UpdateTodoSchema},
    response::{GenericResponse, SingleTodoResponse, TodoData, TodoListResponse},
};
use chrono::prelude::*;
use rocket::{delete, get, http::Status, patch, post, response::status::Custom, serde::json::Json};
use serde_json;
use serde_json::from_str;
use std::fs::{self, File};
use std::io::{Read, Write};
use uuid::Uuid;

#[get("/healthchecker")]
pub async fn health_checker_handler() -> Result<Json<GenericResponse>, Status> {
    const MESSAGE: &str = "Build Simple CRUD API with Rust and Rocket";

    let response_json = GenericResponse {
        status: "success".to_string(),
        message: MESSAGE.to_string(),
    };
    Ok(Json(response_json))
}

#[get("/todos?<page>&<limit>")]
pub async fn todos_list_handler(
    page: Option<usize>,
    limit: Option<usize>,
) -> Result<Json<TodoListResponse>, Status> {
    // Step 1: Read the JSON file
    let file_path = "todos.json";
    let mut file = match File::open(file_path) {
        Ok(file) => file,
        Err(_) => return Err(Status::InternalServerError),
    };
    let mut contents = String::new();
    if let Err(_) = file.read_to_string(&mut contents) {
        return Err(Status::InternalServerError);
    }

    // Step 2: Deserialize the string into a vector of todos
    let mut todos: Vec<Todo> = match from_str(&contents) {
        Ok(todos) => todos,
        Err(_) => return Err(Status::InternalServerError),
    };

    // Step 3: Paginate the todos
    let limit = limit.unwrap_or(10);
    let page = page.unwrap_or(1);
    let offset = (page - 1) * limit;
    todos = todos.into_iter().skip(offset).take(limit).collect();

    // Step 4: Create and return the response
    let json_response = TodoListResponse {
        status: "success".to_string(),
        results: todos.len(),
        todos,
    };
    Ok(Json(json_response))
}

#[post("/todos", data = "<body>")]
pub async fn create_todo_handler(
    mut body: Json<Todo>,
) -> Result<Json<SingleTodoResponse>, Custom<Json<GenericResponse>>> {
    // Step 1: Read the existing data
    let file_path = "todos.json";
    let mut file = match File::open(file_path) {
        Ok(file) => file,
        Err(_) => File::create(file_path).expect("Failed to create file."),
    };
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .expect("Failed to read the file.");
    let mut vec: Vec<Todo> = serde_json::from_str(&contents).unwrap_or_else(|_| Vec::new());

    // Step 2: Check for duplicates
    for todo in vec.iter() {
        if todo.title == body.title {
            let error_response = GenericResponse {
                status: "fail".to_string(),
                message: format!("Todo with title: '{}' already exists", todo.title),
            };
            return Err(Custom(Status::Conflict, Json(error_response)));
        }
    }

    let uuid_id = Uuid::new_v4();
    let datetime = Utc::now();

    body.id = Some(uuid_id.to_string());
    body.completed = Some(false);
    body.createdAt = Some(datetime);
    body.updatedAt = Some(datetime);

    let todo = body.to_owned();

    vec.push(body.into_inner());

    // Step 3: Write the updated vector back to the file
    let serialized = serde_json::to_string(&vec).expect("Failed to serialize data.");
    let mut file = File::create(file_path).expect("Failed to open file.");
    file.write_all(serialized.as_bytes())
        .expect("Failed to write to file.");

    let json_response = SingleTodoResponse {
        status: "success".to_string(),
        data: TodoData {
            todo: todo.into_inner(),
        },
    };

    Ok(Json(json_response))
}

#[get("/todos/<id>")]
pub async fn get_todo_handler(
    id: String,
) -> Result<Json<SingleTodoResponse>, Custom<Json<GenericResponse>>> {
    // Step 1: Read the JSON file
    let file_path = "../todos.json";
    let mut file = match File::open(file_path) {
        Ok(file) => file,
        Err(_) => {
            return Err(Custom(
                Status::InternalServerError,
                Json(GenericResponse {
                    status: "fail".to_string(),
                    message: "Failed to open todos file.".to_string(),
                }),
            ))
        }
    };
    let mut contents = String::new();
    if let Err(_) = file.read_to_string(&mut contents) {
        return Err(Custom(
            Status::InternalServerError,
            Json(GenericResponse {
                status: "fail".to_string(),
                message: "Failed to read todos file.".to_string(),
            }),
        ));
    }

    // Step 2: Deserialize the string into a vector of todos
    let todos: Vec<Todo> = match from_str(&contents) {
        Ok(todos) => todos,
        Err(_) => {
            return Err(Custom(
                Status::InternalServerError,
                Json(GenericResponse {
                    status: "fail".to_string(),
                    message: "Failed to parse todos file.".to_string(),
                }),
            ))
        }
    };

    // Step 3 & 4: Search for the todo by id in the vector and return it if found
    for todo in todos.iter() {
        if todo.id == Some(id.clone()) {
            let json_response = SingleTodoResponse {
                status: "success".to_string(),
                data: TodoData { todo: todo.clone() },
            };
            return Ok(Json(json_response));
        }
    }

    // Step 5: Return an error if the todo is not found
    Err(Custom(
        Status::NotFound,
        Json(GenericResponse {
            status: "fail".to_string(),
            message: format!("Todo with ID: {} not found", id),
        }),
    ))
}

#[patch("/todos/<id>", data = "<body>")]
pub async fn edit_todo_handler(
    id: String,
    body: Json<UpdateTodoSchema>,
) -> Result<Json<SingleTodoResponse>, Custom<Json<GenericResponse>>> {
    let file_path = "todos.json";
    let mut file = File::open(file_path).expect("file not found");
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .expect("something went wrong reading the file");

    let mut todos: Vec<Todo> = serde_json::from_str(&contents).expect("error while reading json");

    let mut updated_todo: Option<Todo> = None;
    for todo in todos.iter_mut() {
        if todo.id == Some(id.clone()) {
            todo.title = body.title.clone().unwrap_or(todo.title.clone());
            todo.content = body.content.clone().unwrap_or(todo.content.clone());
            todo.completed = body.completed.or(todo.completed);
            todo.updatedAt = Some(Utc::now());
            updated_todo = Some(todo.clone());
            break;
        }
    }

    if let Some(updated) = updated_todo {
        let json_todos = serde_json::to_string(&todos).expect("error while writing to json");
        fs::write(file_path, json_todos).expect("Unable to write to file");

        let json_response = SingleTodoResponse {
            status: "success".to_string(),
            data: TodoData { todo: updated },
        };
        Ok(Json(json_response))
    } else {
        Err(Custom(
            Status::NotFound,
            Json(GenericResponse {
                status: "fail".to_string(),
                message: "Todo not found".to_string(),
            }),
        ))
    }
}

#[delete("/todos/<id>")]
pub async fn delete_todo_handler(id: String) -> Result<Status, Custom<Json<GenericResponse>>> {
    // Step 1: Read the JSON file
    let file_path = "todos.json";
    let data = fs::read_to_string(file_path).expect("Unable to read file");

    // Step 2: Deserialize the JSON string into a vector of Todo items
    let mut todos: Vec<Todo> = serde_json::from_str(&data).expect("Error while deserializing");

    // Step 3: Remove the todo item with the matching ID
    let original_len = todos.len();
    todos.retain(|todo| todo.id != Some(id.clone()));

    // Check if any item was removed
    if todos.len() < original_len {
        // Step 4: Serialize the updated vector back into a JSON string
        let updated_json = serde_json::to_string(&todos).expect("Error while serializing");

        // Step 5: Write the JSON string back to the file
        fs::write(file_path, updated_json).expect("Unable to write to file");

        return Ok(Status::NoContent);
    } else {
        let error_response = GenericResponse {
            status: "fail".to_string(),
            message: format!("Todo with ID: {} not found", id),
        };
        return Err(Custom(Status::NotFound, Json(error_response)));
    }
}
