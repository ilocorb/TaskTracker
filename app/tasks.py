from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify

from .database import db
from .models import Task

bp = Blueprint('tasks', __name__, url_prefix='/tasks')

from auth import login_required

@bp.route('/', methods=('GET', 'POST'))
@login_required
def index():
    if request.method == 'POST':
        title = request.form.get('title')

        if title:
            task = Task(
                title=title,
                user_id=session['user_id']
            )
            db.session.add(task)
            db.session.commit()

        return redirect(url_for('tasks.index'))

    tasks = Task.query.filter_by(
        user_id=session['user_id']
    ).order_by(Task.created_at.desc()).all()

    return render_template('tasks/index.html', tasks=tasks)