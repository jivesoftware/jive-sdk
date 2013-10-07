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
 * A simple REST service to store and retrieve tasks from a file database.
 *
 * This is not meant for production use and only mean as a service to server
 * the example app.
 */

var jive = require('jive-sdk' ),
    db = jive.service.persistence();

var taskHandler = function(req, res) {
    var project = req.param("project"),
        assignee = req.param("assignee"),
        criteria = undefined;

    if(project) {
        criteria = {"project": project};
    }

    if( assignee ) {
        if( !criteria ) {
            criteria = {};
        }
        criteria.assignee = assignee;

    }

    db.find("tasks",criteria).then(function( tasks ) {
        res.status(200);
        res.set({'Content-Type': 'application/json'});
        res.send( JSON.stringify({tasks: tasks }, null, 4 ));
    });
};

var taskCreator = function(req, res) {
    if( !req.body.name ) {
        res.status(400);
        res.send("Expected json body with name");
        return;
    }

    var id = req.body.id;
    if (!id) {
        id =(new Date()).getTime();
        req.body.id = id
    }

    db.save("tasks", id, req.body ).then(function( data ) {
        res.status(200);
        res.set( {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
        });
        res.send( data );
    });
};

var taskDetailHandler = function(req, res) {
    var id = parseInt(req.param("id"), 10);
    db.find( "tasks", {id: id} ).then( function ( tasks ) {
        res.set( {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
        });
        if( tasks.length > 0) {
            res.status( 200 );
            res.send( JSON.stringify( tasks[0], null, 4 ) );
        } else {
            res.status( 404 );
            res.send("");
        }
    } );
};

var taskEditHandler = function(req, res) {
    var id = parseInt(req.param("id"), 10 ),
        taskStatus = req.param("status"),
        name = req.param("name");
    db.find( "tasks", {id: id} ).then( function ( tasks ) {
        var task;
        res.set( {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache'
        });
        if( tasks.length > 0) {
            task = tasks[0];
            task.status = taskStatus;
            task.name = name;
            db.save("tasks", task.id, task ).then(function() {
                res.status( 200 );
                res.send( JSON.stringify( task, null, 4 ) );
            });

        } else {
            res.status( 404 );
            res.send("");
        }
    } );
};


exports.taskHandler = {
    'path' : 'tasks',
    'verb' : 'get',
    'route': taskHandler
};

exports.taskDetailHandler = {
    'path' : "tasks/:id",
    'verb' : 'get',
    'route': taskDetailHandler
};

exports.taskEditHandler = {
    'path' : "tasks/:id",
    'verb' : 'put',
    'route': taskEditHandler
};

exports.taskCreator = {
    'path' : 'tasks',
    'verb' : 'post',
    'route': taskCreator
};