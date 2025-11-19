from app import create_app
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

application = create_app()