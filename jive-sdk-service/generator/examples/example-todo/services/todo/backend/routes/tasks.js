/*
 * Copyright 2013 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * A simple REST service to store and retrieve todos from a file database.
 *
 * This is not meant for production use and only mean as a service to server
 * the example app.
 */

var jive = require('jive-sdk'),
    db = jive.service.persistence(),
    shared = require("../../../{{{TILE_PREFIX}}}todoConfig/shared.js");


var update = function( todo, description ) {
    jive.events.emit("todoUpdate", todo, description);
};

var todoHandler = function(req, res) {
    shared.getClientIDForRequest(req).then(function(clientid) {
        var project = req.param("project"),
            assignee = req.param("assignee"),
            criteria = {};

        if(clientid) {
            criteria.clientid = clientid;
        }
        if(project) {
            criteria.project =  project;
        }

        if( assignee ) {
            criteria.assignee = assignee;
        }

        db.find("todos",criteria).then(function( todos ) {
            res.status(200);
            res.set({'Content-Type': 'application/json'});
            res.send( JSON.stringify({todos: todos }, null, 4 ));
        });
    });
};

var todoCreator = function(req, res) {
    shared.getClientIDForRequest(req).then(function(clientid) {
        if( !req.body.name ) {
            res.status(400);
            res.send("Expected json body with name");
            return;
        }
        var todo = {};
        for(var key in req.body){
            todo[key] = req.body[key];
        }

        todo.clientid = clientid;

        var id = todo.id;
        if (!id) {
            id =(new Date()).getTime();
            todo.id = id
        }


        db.save("todos", id, todo ).then(function( data ) {
            res.status(200);
            res.set( {
                'Content-Type': 'application/json',
                'Pragma': 'no-cache'
            });
            update(data, "Created todo '" + todo.name + "'");
            res.send( data );
        });
    });
};

var todoDetailHandler = function(req, res) {
    var id = parseInt(req.param("id"), 10);
    db.find( "todos", {id: id} ).then( function ( todos ) {
        res.set( {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
        });
        if( todos.length > 0) {
            res.status( 200 );
            res.send( JSON.stringify( todos[0], null, 4 ) );
        } else {
            res.status( 404 );
            res.send("");
        }
    } );
};

var todoEditHandler = function(req, res) {
    var id = parseInt(req.param("id"), 10 ),
        todoStatus = req.param("status"),
        name = req.param("name"),
        assignee = req.param("assignee"),
        project = req.param("project");
    db.find( "todos", {id: id} ).then( function ( todos ) {
        var todo;
        res.set( {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
        });
        if( todos.length > 0) {
            todo = todos[0];
            todo.status = todoStatus;
            todo.name = name;
            todo.assignee = assignee;
            todo.project = project;
            db.save("todos", todo.id, todo ).then(function() {
                update(todo, "Edited todo '" + todo.name + "'  status ='" + todo.status + "'");
                res.status( 200 );
                res.send( JSON.stringify( todo, null, 4 ) );
            });

        } else {
            res.status( 404 );
            res.send("");
        }
    } );
};


exports.todoHandler = {
    'path' : 'todos',
    'verb' : 'get',
    'route': todoHandler
};

exports.todoDetailHandler = {
    'path' : "todos/:id",
    'verb' : 'get',
    'route': todoDetailHandler
};

exports.todoEditHandler = {
    'path' : "todos/:id",
    'verb' : 'put',
    'route': todoEditHandler
};

exports.todoCreator = {
    'path' : 'todos',
    'verb' : 'post',
    'route': todoCreator
};