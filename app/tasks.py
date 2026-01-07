from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
from sqlalchemy import update

from .database import db
from .models import Task

from .auth import login_required


bp = Blueprint('tasks', __name__, url_prefix='/')


@bp.route('/')
def tasks():
	# render all tasks in db
	tasks = Task.query.order_by(Task.created_at)
	return render_template("index.html", tasks=tasks)


@bp.route('/index', methods = ['GET', 'POST'])
@login_required
def create_task():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            title = data.get('title')
            desc = data.get('description')
            is_done = data.get('is_done')
            priority = data.get('priority')
            due_date = data.get('due_date')
        else:
            title = request.form.get('title')
            desc = request.form.get('description')
            is_done = request.form.get('is_done')
            priority = request.form.get('priority')
            due_date = request.form.get('due_date')

        if title:
            task = Task(
                title = title,
                description = desc or None,
                is_done = is_done or None,
                priority = priority,
                due_date = due_date or None,
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


    #tasks = Task.query.filter_by(
    #    user_id = session['user_id']
    #).order_by(Task.created_at.desc()).all()

    return render_template('index.html')


@bp.route('api/index/<int:id>/delete', methods=['POST'])
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


@bp.route('api/index/<int:id>/toggle', methods = ['POST'])
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


@bp.route('api/index/<int:id>/edit', methods = ['POST'])
@login_required
def edit_task(id):

    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            title = data.get('title')
            desc = data.get('description')
            is_done = data.get('is_done')
            priority = data.get('priority')
            due_date = data.get('due_date')
        else:
            title = request.form.get('title')
            desc = request.form.get('description')
            is_done = request.form.get('is_done')
            priority = request.form.get('priority')
            due_date = request.form.get('due_date')

    if id != g.user.id:
        flash('Task ID does no not match Session User ID', 'error')

    stmt = (
        update(Task).where(Task.id == id).values(title = title, description = desc, is_done = is_done, priority = priority, due_date = due_date)
    )
    db.session.execute(stmt)
    db.session.commit()

    if request.is_json:
        return {'success': True, 'message': 'Edited Task succesfully!'}
    return redirect(url_for('index'))
