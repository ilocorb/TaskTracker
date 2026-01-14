from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
from sqlalchemy import update

from .database import db
from .models import Task

from .auth import login_required

bp = Blueprint('tasks', __name__, url_prefix='/api')


@bp.route('/tasks')
def tasks():
    """Get all tasks for the current user"""
    tasks = Task.query.filter_by(user_id=g.user.id).all()
    return jsonify({
        'tasks': [task.to_dict() for task in tasks]
    })


@bp.route('/tasks', methods = ['GET', 'POST'])
@login_required
def create_task():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            title = data.get('title')
            desc = data.get('description')
            is_done = data.get('is_done')
            status = data.get('status')
            priority = data.get('priority')
            due_date = data.get('due_date')
            tags = data.get('tags')
        else:
            title = request.form.get('title')
            desc = request.form.get('description')
            is_done = request.form.get('is_done')
            status = request.form.get('status')
            priority = request.form.get('priority')
            due_date = request.form.get('due_date')
            tags = request.form.get('tags')

        if title:
            task = Task(
                title = title,
                description = desc or None,
                is_done = is_done or False,
                status = status or 'todo',
                priority = priority or 'medium',
                due_date = due_date or None,
                tags = tags or None,
                user_id = session['user_id']
            )
            db.session.add(task)
            db.session.commit()
        else:
             flash('To create a Task a Title is required.', 'error')

        if request.is_json:
                return {'success': True, 'message': 'Task created succesfully!'}
        return redirect(url_for('index'))
    
    #if request.method == 'GET':


    return render_template('index.html')


@bp.route('/tasks/<int:task_id>', methods=['GET'])
@login_required
def get_task(task_id):
    """Get a specific task"""


@bp.route('/tasks/<int:id>', methods=['DELETE'])
@login_required
def delete_task(id):
    task = Task.query.get_or_404(id)

    if task.user_id != g.user.id:
        flash('Task ID does no not match Session User ID', 'error')
    else: 
        db.session.delete(task)
        db.session.commit()

    if request.is_json:
        return {'success': True, 'message': 'Deleted Task succesfully!'}
    return redirect(url_for('index'))


@bp.route('/tasks/<int:id>/toggle', methods = ['PUT'])
@login_required
def toggle_completed(id):
    task = Task.query.get_or_404(id)

    if task.id != g.user.id:
        flash('Task ID does no not match Session User ID', 'error')

    task.is_done = not task.is_done
    db.session.commit()
    
    if request.is_json:
        return {'success': True, 'message': 'Toggled completed Status'}
    return redirect(url_for('index'))


@bp.route('/tasks/<int:id>', methods = ['PUT'])
@login_required
def edit_task(id):
    task = Task.query.get_or_404(id)
    
    if task.user_id != g.user.id:
        return {'success': False, 'error': 'Unauthorized'}, 403

    if request.method == 'PUT':
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()

        # Only update fields that are provided
        if 'title' in data and data['title']:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'is_done' in data:
            task.is_done = data['is_done']
        if 'status' in data:
            task.status = data['status']
        if 'priority' in data:
            task.priority = data['priority']
        if 'due_date' in data:
            task.due_date = data['due_date']
        if 'tags' in data:
            task.tags = data['tags']

        db.session.commit()

    if request.is_json:
        return {'success': True, 'message': 'Edited Task succesfully!'}
    return redirect(url_for('index'))
     