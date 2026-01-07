import functools

from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
from werkzeug.security import check_password_hash, generate_password_hash

from .database import db
from .models import User

bp = Blueprint('auth', __name__, url_prefix='/auth')

def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('auth.login'))
        return view(**kwargs)
    return wrapped_view

def admin_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('auth.login'))
        if not g.user.is_admin:
            flash('Admin access required.', 'error')
            return redirect(url_for('index'))
        return view(**kwargs)
    return wrapped_view

@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('user_id')

    if user_id is None:
        g.user = None
    else:
        g.user = User.query.get(user_id)

@bp.route('/register', methods=('GET', 'POST'))
def register():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
        else:
            username = request.form['username']
            password = request.form['password']
        
        error = None

        if not username:
            error = 'Username is required.'
        elif not password:
            error = 'Password is required.'

        if error is None:
            if User.query.filter_by(username=username).first():
                error = f"User {username} is already registered."
            else:
                new_user = User(username=username, password=generate_password_hash(password))
                db.session.add(new_user)
                db.session.commit()
                flash('Registration successful! Please log in.', 'success')
                # throws a json.parse error otherwise
                return jsonify(
                    success=True,
                    message='Registration successful!'
                ), 201
                #return redirect(url_for('auth.login'))

        flash(error, 'error')

    return render_template('auth/register.html')

@bp.route('/login', methods=('GET', 'POST'))
def login():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
        else:
            username = request.form['username']
            password = request.form['password']
        
        error = None
        user = User.query.filter_by(username=username).first()

        if user is None:
            error = 'Incorrect username.'
        elif not check_password_hash(user.password, password):
            error = 'Incorrect password.'

        if error is None:
            session.clear()
            session['user_id'] = user.id
            # Throws a json.parse error otherwise
            return jsonify(
                success=True,
                message='Login successful!'
            ), 201
            #redirect(url_for('index'))
            

        flash(error, 'error')

    return render_template('auth/login.html')

@bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'success')
    return redirect(url_for('index'))

# Admin Routes
@bp.route('/admin/users')
@login_required
@admin_required
def admin_users():
    return render_template('admin/users.html')

# API Routes
@bp.route('/api/users')
@login_required
@admin_required
def api_users():
    users = User.query.all()
    users_data = [{
        'id': user.id,
        'username': user.username,
        'is_admin': user.is_admin
    } for user in users]
    return {'users': users_data, 'current_user_id': g.user.id}

@bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def api_delete_user(user_id):
    if user_id == g.user.id:
        return {'success': False, 'error': 'You cannot delete your own account.'}, 400
    
    user = User.query.get(user_id)
    if not user:
        return {'success': False, 'error': 'User not found.'}, 404
    
    username = user.username
    db.session.delete(user)
    db.session.commit()
    return {'success': True, 'message': f'User {username} has been deleted.'}

# Current User API
@bp.route('/api/me')
@login_required
def api_current_user():
    return {
        'id': g.user.id,
        'username': g.user.username,
        'is_admin': g.user.is_admin
    }