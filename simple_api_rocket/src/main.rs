use handler::{
    create_todo_handler, delete_todo_handler, edit_todo_handler, get_todo_handler,
    health_checker_handler, todos_list_handler,
};

use rocket::http::Method;
use rocket_cors::{AllowedOrigins, CorsOptions};

#[macro_use]
extern crate rocket;

mod handler;
mod model;
mod response;

#[launch]
fn rocket() -> _ {
    let cors = CorsOptions::default()
        .allowed_origins(AllowedOrigins::some_exact(&[
            "http://localhost:3000",
            "https://hoppscotch.io/"
        ]))
        .allowed_methods(
            vec![Method::Get, Method::Post, Method::Patch, Method::Delete]
                .into_iter()
                .map(From::from)
                .collect(),
        )
        .allow_credentials(true)
        .to_cors()
        .expect("error while building CORS");

    rocket::build()
        .mount(
            "/api",
            routes![
                health_checker_handler,
                todos_list_handler,
                create_todo_handler,
                get_todo_handler,
                edit_todo_handler,
                delete_todo_handler
            ],
        )
        .attach(cors)
}
