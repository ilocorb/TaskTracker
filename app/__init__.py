from flask import Flask, app, render_template
from .database import db
import os

from . import auth
from . import tasks

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{os.path.join(app.instance_path, 'tasktracker.sqlite')}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )
    
    db.init_app(app)
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(tasks.bp)

    @app.route('/')
    @auth.login_required
    def index():
        return render_template('index.html')
    
    # Create Database Tables
    with app.app_context():
        db.create_all()

    return app