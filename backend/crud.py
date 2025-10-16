from datetime import date
import datetime
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
import re
from collections import Counter
from models import  Scoring_Criteria, User
from fastapi import Depends, HTTPException
from sqlalchemy.orm.exc import NoResultFound
from models import Homework, Homework_Submission, Student_Homework

def validate(data):
    # Ensure either user_id or arskurs_id is provided, but not both
    if not data.get('user_id') and not data.get('arskurs_id'):
        raise HTTPException(status_code=422, detail="Either user_id or arskurs_id must be provided.")
    if data.get('user_id') and data.get('arskurs_id'):
        raise HTTPException(status_code=422, detail="Only one of user_id or arskurs_id can be provided.")
    return data
def get_all_users(database: Session):
    return database.query(User).all() 
def add_user(database: Session, user_params: User):
    user = User(**user_params.dict())  # Convert Pydantic model to SQLAlchemy model
    database.add(user)
    database.commit()
    database.refresh(user)
    return user
# New function to extract topic from description

#